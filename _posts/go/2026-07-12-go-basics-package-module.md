---
title       : 기초 ① 문법·패키지·모듈 — C++과 다른 뼈대 규칙
description : "C를 알면 Go 문법 절반은 익숙하다. 이 글은 암기가 아니라 C++과 다른 Go의 뼈대 규칙을 잡는다 — := 짧은 선언과 다중 반환값, for가 유일한 반복문, 명시적 변환만 허용, zero value와 nil, 그리고 헤더 없이 패키지 단위로 묶이고 대문자로 export를 결정하는 구조와 go mod까지. 안 쓴 변수·import가 컴파일 에러라는 Go의 태도도 함께."
date        : 2026-07-12 10:10:00 +0900
updated     : 2026-07-12 10:10:00 +0900
categories  : [go]
tags        : [roadmap, go]
pin         : false
hidden      : false
---

> [Go 학습 로드맵](/posts/go/2026-07-12-go-roadmap/)의 **① 기초** 단계입니다.

C를 알면 Go 문법의 절반은 첫날에 읽힙니다. 그래서 이 단계의 목표는 문법 암기가 아니라 **C++과 다른 Go의 뼈대 규칙 몇 개**를 몸에 붙이는 것입니다. 그 규칙들이 이후 모든 단계의 바닥에 깔립니다.

## 변수 — `:=`와 zero value

```go
var x int = 10      // 정식 선언
y := 20             // 짧은 선언 — 타입 추론. 함수 안에서만
var z int           // 초기값을 안 줘도 z == 0
```

`:=`는 선언과 초기화를 합친 축약입니다(함수 밖 패키지 레벨에선 못 씀). 그리고 **모든 타입에 zero value가 있습니다** — 숫자는 `0`, 문자열은 `""`, 불리언은 `false`, 포인터·슬라이스·맵·인터페이스는 `nil`. C++의 "초기화 안 하면 쓰레기값"이 없습니다. 선언만 하면 항상 정의된 기본값에서 출발합니다.

## 함수 — 다중 반환값

Go 함수는 값을 **여러 개 반환**합니다. 이게 이후 에러 처리(④)의 토대라 지금 눈에 익혀 둡니다.

```go
func divmod(a, b int) (int, int) {   // 몫과 나머지를 함께
    return a / b, a % b
}
q, r := divmod(17, 5)   // q=3, r=2
```

C++이라면 `std::pair`나 출력 인자(`int&`)로 풀던 걸 Go는 언어 차원에서 지원합니다. 관례적으로 **마지막 반환값을 `error`로** 두는 패턴이 여기서 나옵니다(④에서 본격).

## `for`가 유일한 반복문

Go에는 `while`이 없습니다. `for` 하나가 세 역할을 다 합니다.

```go
for i := 0; i < 10; i++ { }   // C 스타일
for cond { }                  // while 대용
for { }                       // 무한 루프 (break로 탈출)
for i, v := range slice { }   // range 순회
```

문법을 줄여 외울 게 적게 만든 Go 특유의 결정입니다.

## 명시적 변환만 — 암묵 형변환 없음

```go
var i int = 10
var f float64 = float64(i)   // 반드시 명시. float64 f = i; 는 에러
```

C++의 암묵적 정수↔실수 변환이 Go엔 없습니다. 타입이 다르면 **항상 손으로 변환**해야 합니다. 처음엔 번거롭지만, "어디서 정밀도가 깎였지" 같은 버그가 원천 차단됩니다.

## 패키지 — 헤더가 없다

C++의 `#include`·헤더/구현 분리가 Go엔 없습니다. 코드는 파일이 아니라 **패키지 단위**로 묶입니다.

- 한 디렉터리 = 한 패키지. 파일을 몇 개로 쪼개든 같은 패키지면 서로 자유롭게 참조합니다(전방 선언 불필요).
- **가시성은 대소문자로 결정**됩니다. 이름이 대문자로 시작하면 공개(export), 소문자면 패키지 내부용입니다. `public`/`private` 키워드가 없습니다.

```go
package geometry

func Area(r Rect) float64 { ... }   // 대문자 → 다른 패키지에서 호출 가능
func scale(...) { ... }             // 소문자 → 이 패키지 안에서만
```

**모듈**은 패키지들의 배포 단위입니다. `go mod init example.com/myapp`으로 시작하면 `go.mod`가 생기고, 의존성이 여기 기록됩니다. C++의 헤더 경로·링커 설정 씨름 없이 import 경로만으로 해결됩니다(도구는 ⑦에서).

## C++ 전환으로 정리

| C++ | Go | 핵심 차이 |
|---|---|---|
| 초기화 안 하면 쓰레기값 | zero value | 모든 타입에 정의된 기본값 |
| `std::pair`·출력 인자 | 다중 반환값 | 언어가 직접 지원 |
| `while`, `do-while`, `for` | `for` 하나 | 반복문 하나로 통합 |
| 암묵 형변환 | 명시적 변환만 | 타입 다르면 손으로 |
| 헤더/`#include`, `public`/`private` | 패키지 + 대소문자 export | 헤더 없음, 키워드 없음 |

## 자주 막히는 지점

- **안 쓴 변수·import가 컴파일 에러** — C++은 경고지만 Go는 **에러**입니다. "일단 선언해 두고 나중에 쓰기"가 안 됩니다. 코드가 항상 깔끔하게 유지되도록 강제하는 의도적 설계.
- **대소문자로 가시성 결정** — 다른 패키지에서 안 보인다면 십중팔구 이름을 소문자로 시작한 것.
- **`:=` vs `=`** — 새 변수는 `:=`, 기존 변수 재대입은 `=`. 이미 있는 변수에 `:=`를 쓰면 "no new variables" 에러(단, 여러 변수 중 하나라도 새것이면 허용).

## 통과 기준

- `go mod init`으로 만든 모듈에서, 다중 반환 함수를 정의해 **다른 패키지에서 호출**할 수 있다.
- zero value와 명시적 변환, 대소문자 export를 설명할 수 있다.

다음은 [② struct·method·interface](/posts/go/2026-07-12-go-struct-method-interface/)입니다. 클래스 없이 사고하는 Go 타입 시스템의 뼈대로, C++ 습관과 가장 크게 부딪히는 단계입니다.

## Reference

- [A Tour of Go — Basics](https://go.dev/tour/basics/1) — 브라우저에서 바로 실행하는 정본. 반나절.
- [Go by Example: Variables](https://gobyexample.com/variables) · [For](https://gobyexample.com/for)
- [Go 공식 — Managing dependencies](https://go.dev/doc/modules/managing-dependencies) — 모듈·`go mod`
