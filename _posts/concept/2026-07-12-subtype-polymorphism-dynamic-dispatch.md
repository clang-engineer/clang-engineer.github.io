---
title       : 서브타입 다형성과 동적 디스패치 — 같은 개념인가
description : "서브타이핑, 인터페이스 만족, 다형성, 동적 디스패치를 분리하고 C++ virtual, Go interface, Rust dyn Trait가 각각 어떤 역할을 담당하는지 비교한다."
date        : 2026-07-12 14:50:00 +0900
updated     : 2026-08-22 17:00:00 +0900
categories  : [concept]
tags        : [polymorphism, dispatch]
pin         : false
hidden      : false
---

> **난이도** 중급 · **선행** [제네릭 — 파라미터 다형성과 구현 전략](/posts/concept/2026-07-12-generics-parametric-polymorphism/)을 먼저 읽으면 비교하기 쉽다.
>
> 🗺️ [프로그래밍 언어 개념 로드맵](/posts/concept/2026-07-13-concept-roadmap/)의 한 편

## 한 줄 요약

여러 구체 타입을 공통 추상 타입을 통해 다루는 것을 흔히 **서브타입 다형성(subtype polymorphism)**이라고 설명한다. 이때 실제 메서드 구현을 런타임에 고르는 대표 기법이 **동적 디스패치(dynamic dispatch)**다.

하지만 둘은 같은 단어가 아니다.

```text
서브타이핑 / 인터페이스 만족
→ 어떤 값을 어떤 추상 타입으로 취급할 수 있는가

동적 디스패치
→ 호출 시점에 실제 어느 구현을 실행할 것인가
```

C++ `virtual`, Go interface value, Rust `dyn Trait`은 이 두 층이 만나는 대표적인 사례다.

## 1. C++ virtual에서 출발

```cpp
struct Shape {
    virtual double area() const = 0;
    virtual ~Shape() = default;
};

struct Circle : Shape {
    double area() const override { return 10.0; }
};

void print(const Shape& shape) {
    std::cout << shape.area();
}
```

여기에는 두 가지 일이 동시에 있다.

1. `Circle`은 `Shape`의 파생 타입이므로 `Shape&`로 취급할 수 있다.
2. `area()`가 `virtual`이므로 실제 호출 구현은 런타임의 동적 타입에 따라 결정된다.

C++에서는 상속과 virtual dispatch가 자주 함께 쓰여 둘을 하나의 개념처럼 느끼기 쉽다.

## 2. 서브타이핑과 동적 디스패치를 분리해야 하는 이유

서브타입 관계가 있다고 모든 호출이 동적 디스패치되는 것은 아니다. 반대로 언어에 따라 전통적인 클래스 상속 없이도 공통 인터페이스 값과 동적 디스패치를 제공할 수 있다.

따라서 `subtyping = dynamic dispatch`라고 외우면 Go와 Rust를 설명할 때 경계가 흐려진다.

더 일반적으로는 다음 질문을 따로 본다.

```text
1. 만족 관계
   이 타입이 어떤 인터페이스/트레이트/기반 타입의 계약을 만족하는가?

2. 값 표현
   여러 구체 타입을 하나의 추상 값으로 어떻게 담는가?

3. 호출 방식
   정적으로 호출 대상을 정하는가, 런타임에 고르는가?
```

## 3. C++ — 명목적 상속 + virtual dispatch

C++ 클래스 기반 다형성은 보통 명시적인 상속 관계를 사용한다. `Base*`/`Base&`를 통해 virtual 함수를 호출하면 동적 디스패치가 일어난다.

대표 ABI는 객체가 `vptr`을 가지고 `vtable`을 참조하는 방식이지만, C++ 표준이 이 메모리 배치를 요구하는 것은 아니다. 언어가 보장하는 것은 virtual call의 의미론이다.

## 4. Go — 구조적 interface 만족 + interface value

Go에서는 타입이 interface를 구현한다고 별도로 선언하지 않는다.

```go
type Shape interface {
    Area() float64
}

type Circle struct{}
func (Circle) Area() float64 { return 10 }
```

`Circle`의 method set이 `Shape`가 요구하는 메서드를 만족하면 컴파일러가 관계를 인정한다. 이를 흔히 **구조적 만족(structural satisfaction)**이라고 설명한다.

`Shape` interface value에 `Circle` 값을 담고 `Area()`를 호출하면 런타임에 담긴 구체 타입의 구현으로 디스패치된다.

```text
Circle이 Shape를 만족하는가?
→ 정적 타입 검사

Shape 값 안에 어떤 구체 값이 들어 있는가?
→ 런타임 값 표현

Area()의 어느 구현을 부르는가?
→ interface dispatch
```

Go interface를 단순히 "상속 없는 virtual"이라고 부르면 구조적 만족이라는 중요한 차이를 놓친다.

## 5. Rust — trait 구현과 trait object를 구분한다

Rust에서 `impl Shape for Circle`은 `Circle`이 `Shape` trait의 계약을 구현한다는 뜻이다. 그러나 이것만으로 모든 호출이 동적 디스패치가 되는 것은 아니다.

### 정적 사용

```rust
fn print<T: Shape>(shape: &T) { /* ... */ }
```

`T: Shape`는 generic constraint이고 보통 단형화되어 정적으로 호출된다.

### 동적 사용

```rust
fn print(shape: &dyn Shape) { /* ... */ }
```

`dyn Shape`는 trait object이며 런타임 동적 디스패치를 사용한다.

즉 `Trait 구현 ≠ Trait object`다. 같은 trait 계약을 정적 다형성과 동적 다형성 양쪽에서 사용할 수 있다.

## 6. 정적 디스패치와 동적 디스패치

호출 대상을 언제 결정하는가의 문제다.

| 방식 | 의미 |
|---|---|
| 정적 디스패치 | 컴파일 시점에 구체 호출 대상을 알 수 있음 |
| 동적 디스패치 | 런타임 값의 실제 타입/메타데이터를 보고 호출 구현을 선택 |

동적 디스패치는 보통 간접 호출을 사용하지만 **항상 느리다**고 단정할 수는 없다. 컴파일러가 실제 타입을 증명하면 devirtualization과 inline 최적화를 적용할 수도 있다.

반대로 정적 디스패치라고 모든 비용이 0인 것도 아니다. 여기서 비교하는 것은 **호출 대상을 결정하는 방식**이다.

## 7. 구현 표현은 의미론과 구분한다

대표 구현을 보면 공통 직관을 얻을 수 있다.

- C++ — 흔히 객체의 `vptr` → `vtable`
- Go — interface value가 구체 값과 타입/메서드 정보를 함께 표현
- Rust — `&dyn Trait` 같은 trait object pointer가 data와 metadata를 함께 운반

하지만 이를 세 언어가 같은 고정 ABI를 가진다고 외우면 안 된다. 메모리 배치와 최적화는 언어 specification과 구현 ABI에 따라 다르다.

개념 설명에서는 먼저 **구체 값 + 호출에 필요한 타입/메서드 정보**라는 역할을 이해하고, 실제 layout은 구현 세부로 내려가는 편이 안전하다.

## 8. 제네릭과의 관계

제네릭 글과 이 글을 `컴파일 타임 vs 런타임` 두 칸으로만 나누면 너무 단순해진다.

더 정확한 좌표는 다음과 같다.

```text
타입을 매개변수화하는가?
→ generics / parametric polymorphism

공통 추상 타입으로 값을 취급하는가?
→ subtyping / interface satisfaction / trait relation

호출 대상을 언제 고르는가?
→ static dispatch / dynamic dispatch
```

Rust가 이 분리를 잘 보여준다.

```text
T: Trait
→ 제네릭 제약 + 보통 정적 디스패치

&dyn Trait
→ trait object + 동적 디스패치
```

## 한눈에 비교

| 언어 | 계약/관계 | 동적 값 | 동적 호출 |
|---|---|---|---|
| C++ | 명목적 상속 | `Base*` / `Base&` | `virtual` |
| Go | 구조적 interface 만족 | interface value | interface method call |
| Rust | 명시적 `impl Trait for T` | `dyn Trait` trait object | trait object dispatch |

이 표의 열을 하나로 합치지 않는 것이 핵심이다.

## 스스로 점검

**1. 서브타이핑과 동적 디스패치는 같은가?**

<details markdown="1">
<summary>답</summary>

아니다. 서브타이핑/인터페이스 만족은 어떤 값을 어떤 추상 타입으로 취급할 수 있는지에 관한 관계이고, 동적 디스패치는 런타임에 어느 구현을 호출할지 결정하는 방식이다.

</details>

**2. Rust에서 `T: Trait`와 `dyn Trait`은 왜 다른가?**

<details markdown="1">
<summary>답</summary>

`T: Trait`은 type parameter의 정적 계약이고 보통 단형화된다. `dyn Trait`은 여러 구체 타입을 하나의 trait object로 다루며 런타임 동적 디스패치를 사용한다.

</details>

**3. Go interface가 C++ virtual과 다른 중요한 점은?**

<details markdown="1">
<summary>답</summary>

Go의 interface 만족은 별도 상속 선언 없이 method set이 맞는지를 컴파일러가 구조적으로 검사한다. interface value를 통한 메서드 호출은 동적 디스패치가 될 수 있지만, 그 만족 관계 자체는 런타임 duck typing이 아니다.

</details>
