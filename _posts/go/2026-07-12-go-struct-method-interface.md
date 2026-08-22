---
title       : 타입 ② struct·method·interface — 클래스 없이 사고하기
description : "Go의 struct·method·interface를 클래스 상속의 대체물로 단순화하지 않고, 암묵적 interface 만족·embedding·method set을 각각 다른 규칙으로 정리한다."
date        : 2026-07-12 10:20:00 +0900
updated     : 2026-08-22 18:00:00 +0900
categories  : [go]
tags        : [roadmap, go]
pin         : false
hidden      : false
---

> [Go 학습 로드맵](/posts/go/2026-07-12-go-roadmap/)의 **② 타입(뼈대)** 단계다. 앞 글: [① 문법·패키지·모듈](/posts/go/2026-07-12-go-basics-package-module/)

Go에는 클래스 상속 계층이 없다. 대신 `struct`, method, interface, embedding을 조합해 타입을 설계한다. C++의 클래스와 비교하면 출발점은 잡기 쉽지만, **상속을 다른 문법으로 옮긴 것**이라고 이해하면 금방 어긋난다.

## struct와 method

데이터는 보통 `struct`로 표현하고, 해당 타입에 동작을 연결하려면 receiver가 있는 method를 정의한다.

```go
type Rect struct {
    Width, Height float64
}

func (r Rect) Area() float64 {
    return r.Width * r.Height
}
```

`(r Rect)`가 receiver다. C++의 암묵적 `this`를 떠올리면 호출 형태는 익숙하지만, Go method는 클래스 본문 안에 선언하는 구조가 아니다.

단, receiver의 base type은 **같은 패키지에서 정의한 non-pointer type**이어야 한다. 아무 외부 타입에나 임의로 method를 추가할 수 있는 것은 아니다.

## interface — 구현 선언 없이 만족한다

```go
type Shape interface {
    Area() float64
}

type Rect struct {
    Width, Height float64
}

func (r Rect) Area() float64 {
    return r.Width * r.Height
}
```

`Rect`의 method set이 `Shape`가 요구하는 메서드를 포함하면 `Rect`는 별도의 `implements Shape` 선언 없이 interface를 만족한다.

이를 **구조적 interface 만족**이라고 이해하면 된다. 런타임 duck typing과 결과가 비슷해 보일 수 있지만, Go compiler는 interface assignment와 호출이 유효한지 정적으로 검사한다.

```text
덕 타이핑
→ 보통 런타임에 "이 메서드가 있나"를 확인하는 동적 모델을 떠올림

Go interface 만족
→ method set을 컴파일 타임에 검사
```

따라서 `Go interface = duck typing`이라고 그대로 등치하지 않는다.

Go의 중요한 장점은 구현 타입이 interface를 미리 알 필요가 없다는 것이다. 사용하는 패키지가 자신에게 필요한 작은 interface를 정의할 수 있다.

## embedding — 조합과 승격

```go
type Animal struct {
    Name string
}

func (a Animal) Speak() string {
    return a.Name + " makes a sound"
}

type Dog struct {
    Animal
    Breed string
}
```

embedded field의 field와 method는 selector에서 승격(promote)되어 `d.Name`, `d.Speak()`처럼 사용할 수 있다.

하지만 `Dog`가 `Animal`의 subtype이 되는 것은 아니다.

```text
C++ inheritance
→ 명목적 타입 관계 + 멤버 상속 + virtual dispatch 등이 함께 엮일 수 있음

Go embedding
→ 필드 포함 + selector promotion
```

다형성이 필요하면 별도의 interface 계약을 사용한다. 따라서 **embedding은 상속의 완전한 대체 문법이 아니라 조합을 편하게 만드는 기능**이다.

## method set — 값과 포인터 타입의 계약

receiver를 값 또는 포인터로 정의할 수 있다.

```go
func (r Rect) Area() float64 { ... }
func (r *Rect) Scale(f float64) { ... }
```

method set의 핵심 규칙은 다음과 같다.

| 메서드 receiver | `Rect`의 method set | `*Rect`의 method set |
|---|---|---|
| `(r Rect)` | 포함 | 포함 |
| `(r *Rect)` | 미포함 | 포함 |

그래서 다음 interface는 `*Rect`만 만족한다.

```go
type Scaler interface {
    Scale(float64)
}

var s Scaler
s = &Rect{Width: 3, Height: 4} // OK
// s = Rect{Width: 3, Height: 4} // compile error
```

여기서 주의할 점은 **일반 method 호출 시 compiler가 addressable value에 대해 자동으로 `&`/`*`를 보정해 주는 경우**와 **interface method set 만족 규칙**을 섞지 않는 것이다.

```go
r := Rect{3, 4}
r.Scale(2) // r이 addressable하므로 호출 자체는 허용될 수 있음
```

그러나 `Rect` 값이 `Scaler` interface를 만족하는 것은 아니다.

## 값 receiver와 포인터 receiver를 고르는 기준

"수정하면 pointer, 읽기만 하면 value"는 출발점일 뿐 절대 규칙은 아니다.

포인터 receiver를 고려할 대표 이유:

- receiver 상태를 수정해야 함
- struct가 커서 복사를 피하고 싶음
- 타입의 method set과 의미를 pointer 기준으로 일관되게 유지하고 싶음

값 receiver가 자연스러운 경우:

- 작은 immutable-like value type
- 복사 자체가 의미적으로 자연스러움

한 타입에서 두 receiver 형태를 섞지 말라는 식의 절대 규칙보다 **타입의 의미와 method set 일관성**을 우선한다.

## `any`와 interface value

`any`는 `interface{}`의 alias다. 모든 타입이 empty interface를 만족하므로 어떤 값도 담을 수 있다.

```go
var x any = "hello"

s, ok := x.(string)
if ok {
    fmt.Println(s)
}
```

C++ `std::any`를 떠올리면 "구체 타입을 지운 값 컨테이너"라는 직관은 잡기 쉽다. 하지만 Go interface value와 C++ `std::any`, `void*`는 타입 표현과 메서드 디스패치 의미가 다르므로 같은 타입으로 등치하지 않는다.

가능하면 `any`보다 필요한 메서드만 가진 작은 interface를 선호한다. 다만 JSON처럼 입력 타입이 본질적으로 동적인 경계에서는 `any`가 자연스러울 수 있다.

## C++을 발판으로 비교

| C++에서 떠올릴 것 | Go | 경계 |
|---|---|---|
| member function | receiver method | 호출 직관은 비슷하지만 클래스 본문 구조가 아님 |
| abstract base class | interface | 공통 계약이라는 목적은 비슷하지만 Go는 암묵적·구조적 만족 |
| composition | embedding | 포함 관계는 비슷하지만 selector promotion이 추가됨 |
| `std::any` | `any` | 구체 타입을 추상적으로 담는 용도는 비슷하지만 interface dispatch 의미는 다름 |

## 통과 기준

- interface 만족 여부가 선언이 아니라 method set으로 결정된다는 것을 설명할 수 있다.
- `Rect`와 `*Rect`의 method set 차이를 설명할 수 있다.
- embedding을 inheritance와 같은 타입 관계라고 오해하지 않는다.

다음은 [③ slice·map·string](/posts/go/2026-07-12-go-slice-map-string/)이다.

## Reference

- [A Tour of Go — Methods and interfaces](https://go.dev/tour/methods/1)
- [Effective Go — Interfaces and methods](https://go.dev/doc/effective_go#interfaces_and_types)
- [Go Specification — Method sets](https://go.dev/ref/spec#Method_sets)
- [Go FAQ — pointer vs value receiver](https://go.dev/doc/faq#methods_on_values_or_pointers)
