---
title       : "흐름 ④ error·defer·panic/recover — 실패와 정리의 역할 분리"
description : "Go의 일반 실패는 error 값으로 흐르고, defer는 함수 종료 시 실행할 정리를 예약하며, panic/recover는 정상 error 흐름과 다른 stack-unwinding 경계를 만든다. RAII·예외와의 유사점은 발판으로만 쓰고 의미론을 구분한다."
date        : 2026-07-12 10:40:00 +0900
updated     : 2026-09-06 13:45:00 +0900
categories  : [go]
tags        : [go, error-handling, defer, panic]
pin         : false
hidden      : false
---

> [Go 학습 로드맵](./2026-07-12-go-roadmap.md)의 **④ 실패·정리 흐름** Zoom-in이다. 앞 글: [③ slice·map·string](./2026-07-12-go-slice-map-string.md)

Go에서 `error`, `defer`, `panic`, `recover`는 한 묶음처럼 자주 소개되지만 **해결하는 문제가 다르다.**

```text
예상 가능한 실패를 호출자에게 전달
→ error value

함수를 빠져나갈 때 실행할 정리 예약
→ defer

정상 반환 경로를 계속할 수 없는 stack unwinding 시작
→ panic

특정 경계에서 진행 중인 panic을 받아 정상 반환으로 전환
→ recover
```

C++/Java의 exception이나 RAII를 떠올리면 출발은 쉽지만 그대로 대응시키지는 않는다.

## 1. error — 실패도 반환값이다

Go의 `error`는 특별한 제어문이 아니라 interface다.

```go
type error interface {
    Error() string
}
```

일반적으로 실패할 수 있는 함수는 결과와 `error`를 함께 반환한다.

```go
f, err := os.Open("config.yaml")
if err != nil {
    return err
}
defer f.Close()
```

핵심은 “모든 줄 뒤에 `if err != nil`을 쓴다”가 아니라 **호출 계약에 실패 가능성이 값으로 드러난다**는 점이다.

```text
callee
→ result + error
→ caller가 처리 / 변환 / context 추가 / 상위 전달 중 선택
```

### Custom error

`Error() string`을 구현한 타입은 `error`로 사용할 수 있다.

```go
type NotFoundError struct {
    Key string
}

func (e *NotFoundError) Error() string {
    return "not found: " + e.Key
}
```

구체 타입이 필요할 때도 문자열을 parse하지 않고 타입/값 계약으로 판별하는 편이 좋다.

## 2. wrapping — context를 더하되 원인을 보존한다

하위 실패에 상위 작업의 의미를 덧붙일 때 `%w`로 wrap할 수 있다.

```go
if err != nil {
    return fmt.Errorf("load config: %w", err)
}
```

호출자는 wrapper chain 전체에서 값이나 타입을 찾는다.

```go
if errors.Is(err, os.ErrNotExist) {
    // 특정 error 값/동등성 계약
}

var nf *NotFoundError
if errors.As(err, &nf) {
    // 특정 error 타입 추출
}
```

```text
errors.Is
→ target error와 일치하는지 chain을 따라 확인

errors.As
→ 원하는 error 타입으로 assign 가능한 값을 chain에서 찾음
```

`errors.Is`를 단순히 “내부에서 ==만 한다”고 외우지는 않는다. error 타입이 `Is` method를 제공해 자체 동등성 규칙을 정의할 수도 있다.

## 3. defer — object lifetime이 아니라 함수 반환 경계에 묶인다

`defer`는 호출을 **현재 함수가 반환할 때 실행하도록 예약**한다.

```go
f, err := os.Open(path)
if err != nil {
    return err
}
defer f.Close()
```

여러 `defer`는 LIFO 순서로 실행된다.

```go
defer fmt.Println("first")
defer fmt.Println("second")
// return 시 second → first
```

C++ RAII와는 다음 정도만 대응시킨다.

| 관점 | C++ RAII | Go `defer` |
|---|---|---|
| 정리 누락 방지 | object destructor | 함수 반환 시 예약 호출 |
| 정리 시점의 기준 | object lifetime / scope | 현재 함수의 return/unwind |
| 자원과 정리의 결합 | type이 소유하면 자동화 가능 | 호출부가 명시적으로 예약 |
| 순서 | local object destruction order | deferred call LIFO |

둘은 **정리 코드를 실패 경로에서도 실행시킨다는 목적은 비슷하지만 같은 메커니즘은 아니다.**

### `defer`의 인자는 언제 평가되나

`defer` statement를 실행할 때 함수 값과 인자가 평가되고, 실제 호출만 나중에 이루어진다.

```go
x := 1
defer fmt.Println(x) // 여기서 x의 값 1이 인자로 평가됨
x = 2
```

이 구분은 closure를 defer할 때와 결과가 달라질 수 있어 중요하다.

## 4. panic — 일반 error 반환과 다른 unwind 경로

`panic(v)`가 실행되면 현재 함수의 정상 실행은 중단되고, 그 goroutine의 call stack을 따라 deferred function을 실행하며 unwinding한다.

```text
panic 발생
→ 현재 함수의 defer 실행
→ caller로 unwind
→ caller의 defer 실행
→ ...
```

어디에서도 panic이 회복되지 않고 goroutine의 최상단까지 도달하면 program은 panic 정보를 출력하고 종료한다.

따라서 `panic`을 단순히 “즉시 프로그램 종료”라고 보지 않는다. **defer 실행과 unwind 과정이 먼저 있다.**

일반적으로 file-not-found, validation failure, network failure처럼 호출자가 대응할 수 있는 상황은 `error`로 표현한다. `panic`은 API 계약상 정상적인 실패 결과로 계속 진행하기 어렵거나 내부 불변식이 깨진 상황 등에 제한적으로 쓴다.

Runtime 자체도 index out of range, nil pointer dereference 같은 오류에서 panic을 발생시킬 수 있다.

## 5. recover — panic을 처리하는 명시적 경계

`recover`는 **현재 goroutine에서 진행 중인 panic을 deferred function 경계에서 받아** unwinding을 멈출 수 있다.

```go
func run() (err error) {
    defer func() {
        if r := recover(); r != nil {
            err = fmt.Errorf("worker panic: %v", r)
        }
    }()

    doWork()
    return nil
}
```

이 패턴의 핵심은 panic을 일상 error flow로 바꾸라는 뜻이 아니다. 예를 들어 server framework가 한 request handler의 panic 때문에 전체 process가 죽지 않도록 **격리 경계**를 만들 때처럼 제한된 위치에서 사용한다.

또한 `recover`는 다른 goroutine에서 발생한 panic을 잡는 전역 handler가 아니다. panic과 recovery는 해당 goroutine의 stack unwinding 관계 안에서 이해한다.

## 6. 네 도구를 한 그림에 놓기

```text
일반 함수 호출
   ↓
작업 수행
   ├─ 예상 가능한 실패
   │    → error 반환
   │
   ├─ 성공/실패와 상관없이 함수 종료 때 정리
   │    → defer
   │
   └─ 정상 반환 계약을 계속하기 어려운 panic
        → defer들을 실행하며 stack unwind
        → recovery boundary가 있으면 recover
        → 없으면 top까지 전파되어 program 종료
```

## C++/Java 경험과의 경계

| 익숙한 개념 | Go에서 떠올릴 것 | 같은 점 / 다른 점 |
|---|---|---|
| Exception result propagation | `error` return | 실패 전달 목적은 비슷하지만 `error`는 명시적 반환값 |
| RAII cleanup | `defer` | cleanup 목적은 비슷하지만 object lifetime과 함수 return이라는 기준이 다름 |
| Throw/unwind | `panic` | stack unwind가 있지만 일반 recoverable error API로 쓰는 관례가 아님 |
| top-level exception boundary | deferred `recover` boundary | 격리 경계라는 역할은 유사하지만 goroutine과 Go panic 규칙을 따름 |

일반 실패 모델의 비교 자체는 [에러 핸들링 모델](https://github.com/clang-engineer/clang-engineer.github.io/blob/main/_archive/정보관리기술사/세부학습/05-소프트웨어-공학/99-프로그래밍-언어-의미론.md)에 두고, 이 글은 Go의 구체 의미론에 집중한다.

## 흔한 함정

- **error 무시** — `_`로 버리기 전에 호출자가 정말 대응할 필요가 없는지 확인한다.
- **`%v`로 감싸고 원인 추적 기대** — wrapper chain이 필요하면 `%w`를 사용한다.
- **loop에서 resource를 계속 열고 함수 끝까지 `defer`** — 정리 시점이 함수 반환이라 resource가 오래 쌓일 수 있다. 반복 한 단위를 함수로 분리하거나 적절한 시점에 명시적으로 정리한다.
- **panic을 validation branch처럼 사용** — 예상 가능한 실패라면 `error`가 호출 계약을 더 명확하게 만든다.
- **recover를 전역 catch로 생각** — 다른 goroutine의 panic까지 잡아주는 기능이 아니다.

## 통과 기준

다음을 구분할 수 있으면 된다.

```text
이 실패는 호출자가 처리할 수 있는가?
→ error

이 resource는 현재 함수가 끝날 때 정리해야 하는가?
→ defer 고려

정상 반환 경로를 계속할 수 없는가?
→ panic이 적절한 계약인지 검토

panic이 process 경계까지 나가면 안 되는 위치인가?
→ 좁은 recovery boundary 검토
```

다음 Zoom-in은 [goroutine·channel·context](./2026-07-12-go-concurrency-goroutine-channel.md)다. 실행 단위·통신·공유 상태·취소 전파를 서로 다른 책임으로 나눈다.

## Reference

- [Go Blog — Error handling and Go](https://go.dev/blog/error-handling-and-go)
- [Go Blog — Working with Errors in Go 1.13](https://go.dev/blog/go1.13-errors)
- [The Go Programming Language Specification — Handling panics](https://go.dev/ref/spec#Handling_panics)
- [A Tour of Go — Errors](https://go.dev/tour/methods/19)
