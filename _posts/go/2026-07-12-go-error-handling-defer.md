---
title       : 흐름 ④ error 처리 + defer·panic·recover — 예외가 없다
description : "C++/Java 출신에게 가장 큰 문화 충격. Go에는 예외가 없다. 함수가 (결과, error)를 반환하고 if err != nil로 매번 확인하는 값 기반 흐름, fmt.Errorf %w 래핑과 errors.Is/As 판별, RAII를 대체하는 defer, 그리고 진짜 복구 불가 상황용 panic/recover까지. 이 명시성을 Go가 일부러 택한 이유와 함께."
date        : 2026-07-12 10:40:00 +0900
updated     : 2026-07-12 10:40:00 +0900
categories  : [go]
tags        : [roadmap, go]
pin         : false
hidden      : false
---

> [Go 학습 로드맵](/posts/go/2026-07-12-go-roadmap/)의 **④ 흐름** 단계입니다. 앞 글: [③ slice·map·string](/posts/go/2026-07-12-go-slice-map-string/)

C++/Java에서 온 사람에게 가장 큰 문화 충격입니다. **Go에는 예외(exception)가 없습니다.** `try`/`catch`/`throw`가 없고, 에러는 던지는 게 아니라 **값으로 흐릅니다**. 예외·에러 값·`Result` 세 모델을 비교한 [에러 핸들링 모델](/posts/concept/2026-07-12-error-handling-models/)을 함께 보면 왜 이런 선택이 있는지 잡힙니다.

## error는 값이다

Go 함수는 실패할 수 있으면 마지막 반환값으로 `error`를 돌려줍니다(①의 다중 반환값이 여기서 쓰입니다). 호출부는 **매번** `if err != nil`로 확인합니다.

```go
f, err := os.Open("config.yaml")
if err != nil {
    return err          // 처리하거나 위로 올리거나
}
defer f.Close()
// ... f 사용
```

`error`는 특별한 문법이 아니라 **그냥 인터페이스**입니다 — `Error() string` 메서드 하나만 가지면 에러입니다(②의 암묵적 인터페이스가 여기서). 그래서 커스텀 에러 타입도 struct에 `Error()`를 붙이면 끝입니다.

```go
type NotFoundError struct{ Key string }
func (e *NotFoundError) Error() string { return "찾을 수 없음: " + e.Key }
```

## error wrapping — `%w`와 errors.Is/As

에러를 위로 올릴 때 문맥을 덧붙이되, 원래 에러를 잃지 않도록 **감쌉니다(wrap)**. `fmt.Errorf`에 `%w`를 쓰면 원본이 체인으로 보존됩니다.

```go
if err != nil {
    return fmt.Errorf("설정 로드 실패: %w", err)   // %w로 원본을 감쌈
}
```

상위에서는 감싼 껍질을 뚫고 특정 에러인지 판별합니다.

```go
if errors.Is(err, os.ErrNotExist) { ... }   // 체인에 이 값이 있나 (== 비교)
var nf *NotFoundError
if errors.As(err, &nf) { ... }              // 체인에 이 타입이 있나 (꺼내오기)
```

`errors.Is`는 **특정 에러 값**인지, `errors.As`는 **특정 에러 타입**인지를 감싼 체인 전체에서 찾습니다. C++ 예외의 `catch (const SpecificError&)`가 하던 분기를 값으로 하는 셈입니다.

## defer — RAII를 명시적으로

C++의 RAII 소멸자가 자동으로 하던 정리(파일 닫기·언락)를 Go는 **`defer`로 명시**합니다. `defer`한 호출은 함수가 끝날 때(정상이든 에러든) 실행됩니다.

```go
mu.Lock()
defer mu.Unlock()        // 함수 끝에서 반드시 언락 — 어느 경로로 빠져나가든

f, _ := os.Open(path)
defer f.Close()          // 열자마자 닫기를 예약 → 닫기 누락 방지
```

핵심 감각은 **"자원을 얻은 바로 다음 줄에 `defer`로 해제를 예약"**하는 것입니다. 이러면 중간에 `return`이 몇 개든 정리가 보장됩니다. 여러 개면 **LIFO**(마지막 defer가 먼저) 순으로 실행됩니다 — RAII의 역순 소멸과 같습니다.

## panic / recover — 진짜 복구 불가일 때만

`panic`은 프로그램을 멈추는 비상 신호이고, `recover`는 `defer` 안에서 그걸 가로채 되살립니다. **C++ 예외처럼 일상 흐름 제어에 쓰면 안 됩니다.**

```go
func safeRun() (err error) {
    defer func() {
        if r := recover(); r != nil {      // recover는 defer 안에서만 유효
            err = fmt.Errorf("패닉 복구: %v", r)
        }
    }()
    mightPanic()
    return nil
}
```

정상적으로 실패할 수 있는 상황(파일 없음, 입력 오류)은 **전부 `error` 값**으로 다룹니다. `panic`은 "여기 도달하면 프로그램 논리가 깨진 것"인 진짜 예외 상황(배열 범위 초과, nil 역참조)에만.

## C++ 전환으로 정리

| C++ | Go | 핵심 차이 |
|---|---|---|
| 예외 (`try`/`catch`/`throw`) | `error` 값 반환 | 예외 없음. 에러는 값으로 흐름 |
| `catch (const SpecificError&)` | `errors.Is` / `errors.As` | 값·타입을 체인에서 찾기 |
| RAII 소멸자 (자동) | `defer` (명시) | 얻은 다음 줄에 해제 예약 |
| 예외로 흐름 제어 | `panic`은 비상용만 | 일상 실패는 전부 error |

## 자주 막히는 지점

- **`if err != nil`이 지겨워 무시** — `_`로 에러를 버리거나 확인을 건너뛰는 것. Go는 이 명시성을 **일부러** 택했습니다. 습관을 바꾸는 게 이 단계의 핵심.
- **루프 안의 `defer`** — `defer`는 **함수** 종료 시 실행이라, 루프에서 파일을 열며 `defer Close()`하면 함수가 끝날 때까지 안 닫혀 핸들이 쌓입니다. 루프 바디를 별도 함수로 빼거나 명시적으로 닫으세요.
- **`recover`를 defer 밖에서** — `recover()`는 반드시 `defer`된 함수 안에서 불러야 효과가 있습니다. 그냥 부르면 `nil`.
- **`%w` 대신 `%v`** — `%v`로 감싸면 문자열은 남지만 체인이 끊겨 `errors.Is`가 못 찾습니다. 원본 판별이 필요하면 `%w`.

## 통과 기준

- 에러를 `%w`로 감싸 상위로 올리고, 상위에서 `errors.Is`/`errors.As`로 특정 에러를 구분해 처리할 수 있다.
- `defer`로 자원 정리를 예약하고, 왜 RAII의 명시적 버전인지 설명할 수 있다.
- `error`와 `panic`을 언제 각각 쓰는지 구분할 수 있다.

다음은 [⑤ goroutine·channel·context](/posts/go/2026-07-12-go-concurrency-goroutine-channel/)입니다. Go를 Go답게 만드는 킬러 피처, 경량 동시성으로 들어갑니다.

## Reference

- [Go 블로그 — Error handling and Go](https://go.dev/blog/error-handling-and-go) · [Working with Errors in Go 1.13](https://go.dev/blog/go1.13-errors) — `%w`·`Is`/`As`의 정본.
- [A Tour of Go — Errors](https://go.dev/tour/methods/19)
- [에러 핸들링 모델](/posts/concept/2026-07-12-error-handling-models/) — 예외·에러 값·Result 세 모델 비교.
