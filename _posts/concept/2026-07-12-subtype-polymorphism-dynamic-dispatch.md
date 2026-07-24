---
title       : 서브타입 다형성 — Go interface 값·Rust dyn Trait·C++ virtual
description : "여러 타입을 공통 타입으로 다루고 실제 동작을 런타임에 고르는 서브타입 다형성을 정리한다. C++ 가상 함수가 하는 일을 Go interface 값과 Rust dyn Trait trait object가 어떻게 제공하는지, 대표 구현 모델과 static vs dynamic dispatch, 명목적 vs 구조적 만족 규칙을 대응시킨다."
date        : 2026-07-12 14:50:00 +0900
updated     : 2026-07-24 12:00:00 +0900
categories  : [concept]
tags        : [polymorphism, dispatch]
pin         : false
hidden      : false
---

> **난이도** 중급 · **선행** [제네릭(파라미터 다형성)](/posts/concept/2026-07-12-generics-parametric-polymorphism/)을 먼저 읽으면 좋다 — 이 글은 그 나머지 절반이다.
>
> 🗺️ [프로그래밍 언어 개념 로드맵](/posts/concept/2026-07-13-concept-roadmap/)의 한 편

## 한 줄 요약

서브타입 다형성은 **여러 타입을 하나의 공통 타입(인터페이스)으로 다루고, 실제로 어느 동작을 부를지는 런타임에 실제 타입 걸로 고르는 것**입니다. **C++의 가상 함수(`virtual`)가 하는 바로 그 일**이고, Go의 `interface` 값과 Rust의 **`dyn Trait` trait object**가 이 동적 디스패치를 구현합니다. Rust의 `T: Trait` 제네릭은 같은 trait을 쓰지만 정적 디스패치라는 점을 구분해야 합니다.

## 어떤 문제를 푸는가 — C++ 가상 함수에서 출발

도형 여러 개를 하나의 목록에 담아 넓이를 구한다고 하자. C++이라면 이렇게 쓴다.

```cpp
struct Shape {
    virtual double area() const = 0;
    virtual ~Shape() = default;
};
struct Circle : Shape {
    explicit Circle(double radius) : r(radius) {}
    double area() const override { return 3.14 * r * r; }
    double r;
};
struct Rect : Shape {
    Rect(double width, double height) : w(width), h(height) {}
    double area() const override { return w * h; }
    double w, h;
};

void print(const Shape& s) { std::cout << s.area(); }  // 실제 타입이 뭐든 상관없다
```

`print`는 `Circle`인지 `Rect`인지 모른 채 `Shape`로만 다룬다. 그런데 `s.area()`는 **런타임에 실제 타입의 것**이 불린다. 이게 서브타입 다형성이고, C++에서는 `virtual`이 그 스위치다.

> **여기서 이미 알던 게 나온다.** "여러 타입을 부모 하나로 다루고, 실제 메서드는 런타임에 고른다" — 추상 클래스와 가상 함수. Go interface 값과 Rust `dyn Trait`도 이 목적을 제공하지만, 만족 규칙과 객체 표현은 서로 다릅니다.

### 제네릭과 무엇이 다른가

[제네릭](/posts/concept/2026-07-12-generics-parametric-polymorphism/)도 "여러 타입"을 다루지만 방향이 반대다.

| | 제네릭(파라미터 다형성) | 서브타입 다형성 |
|---|---|---|
| 한 문장 | 하나의 코드를 **여러 타입에 찍어냄** | 여러 타입을 **하나의 인터페이스로 다룸** |
| 결정 시점 | 대개 컴파일 타임 | 런타임 |
| C++ | 템플릿 | `virtual` |

제네릭이 다형성의 한쪽 절반이라면, 이 글이 나머지 절반이다.

## 어떻게 동작하나 — vtable과 뚱뚱한 포인터

C++의 흔한 구현은 **vtable(가상 함수 테이블)**과 객체 안의 숨겨진 `vptr`을 사용합니다. 다만 C++ 표준은 이 ABI 표현을 요구하지 않습니다. `s.area()`가 동적 디스패치된다는 의미론만 보장하고, 실제 배치는 컴파일러 ABI가 정합니다.

Go와 Rust도 보통 데이터와 메서드 metadata를 함께 들고 간접 호출하지만, 아래 표는 **대표 구현 모델**이지 언어 specification이 고정한 공통 ABI가 아닙니다.

| 언어 | 다형성 값의 실체 | vtable 위치 |
|---|---|---|
| **C++** | 객체 안에 `vptr` 한 개 | 객체가 vtable을 가리킴 |
| **Go** | `interface` 값 = **2워드** `(*itab, *data)` | `itab`이 타입정보 + 메서드 테이블 |
| **Rust** | `dyn Trait` = **뚱뚱한 포인터(fat pointer) 2워드** `(*data, *vtable)` | 포인터가 vtable을 따로 가리킴 |

공통 직관은 **데이터와 실제 메서드를 찾을 metadata가 필요하다**는 것입니다. 그러나 C++·Go·Rust는 object safety, coercion, nil 표현, 값 저장 방식과 ABI가 다릅니다. “보관 위치만 다르고 정확히 같다”로 축약하면 이 차이를 놓칩니다.

> **C++ 발판.** Rust trait object는 대표적으로 data pointer와 vtable metadata를 함께 운반합니다. Go interface도 type/method metadata와 값을 함께 표현합니다. C++ `vptr`과 목적은 비슷하지만 이 layout을 언어 간 동일 ABI로 보면 안 됩니다.

## static vs dynamic dispatch — 다형성 구현의 두 끝

"어느 함수를 부를지 **언제** 정하느냐"가 갈린다.

- **정적 디스패치(static)**: 컴파일 타임에 호출 대상을 확정합니다. [제네릭의 단형화](/posts/concept/2026-07-12-generics-parametric-polymorphism/)가 여기이며 최적화기가 인라인하기 쉬워집니다. 인라인이나 비용 0이 보장되는 것은 아닙니다.
- **동적 디스패치(dynamic)**: 보통 런타임 metadata를 거쳐 간접 호출합니다. 다만 컴파일러가 실제 타입을 증명하면 devirtualize한 뒤 인라인할 수도 있습니다.

C++에서 이 둘은 이미 익숙하다 — **`virtual`을 붙이면 동적, 안 붙이면 정적**. Rust는 이 선택을 문법으로 아예 갈라 놨다.

| 언어 | 정적 디스패치 | 동적 디스패치 |
|---|---|---|
| **C++** | 비-virtual 함수, 템플릿 | `virtual` 함수 (`Base*`/`Base&`) |
| **Rust** | 제네릭 `<T: Trait>` / `impl Trait` (단형화) | `dyn Trait` (`&dyn`/`Box<dyn>`) |
| **Go** | 구체 타입 직접 호출 | `interface` 값을 통한 호출 |

> **Rust의 갈림이 곧 C++의 `template` vs `virtual`이다.** C++에서 "성능이면 템플릿, 유연성이면 virtual"을 손끝으로 골랐던 그 선택을, Rust는 `impl Trait`(정적) vs `dyn Trait`(동적)로 **타입에 대놓고 적어** 강제한다. Go는 반대로 대부분 인터페이스=동적 하나로 밀고, 성능이 필요하면 구체 타입을 쓰라는 쪽이다.

## 누가 "이 타입은 인터페이스를 만족한다"고 선언하나

같은 서브타입 다형성인데 셋이 **가장 크게 갈리는 지점**이다. 어떤 타입이 인터페이스를 구현한다는 걸 **누가, 어떻게** 정하느냐.

- **C++ — 명목적(nominal), 상속으로 명시**: `struct Circle : Shape`처럼 **상속 트리에 명시적으로 넣어야** 한다. 이름(상속 관계)으로 엮인다.
- **Rust — 명목적, 하지만 상속 트리 없이**: `impl Shape for Circle`이라고 **명시적으로 적어야** 한다. 다만 C++처럼 부모-자식 계층을 만드는 게 아니라, 기존 타입에 트레이트를 **나중에 갖다 붙인다**(단, 고아 규칙 orphan rule의 제약을 받는다).
- **Go — 구조적(structural), 정적 검사**: 아무 선언도 안 한다. **메서드 시그니처만 맞으면** 그 타입은 자동으로 인터페이스를 만족한다. 동적 duck typing과 겉모습은 비슷하지만 만족 여부는 컴파일 타임에 검사된다.

```go
type Shape interface { Area() float64 }
type Circle struct{ r float64 }
func (c Circle) Area() float64 { return 3.14 * c.r * c.r }
// Circle은 "Shape를 구현한다"고 어디에도 안 썼지만, Area()가 있으니 이미 Shape다
```

> **C++/Rust 쓰던 사람이 Go에서 놀라는 지점.** "이 타입이 이 인터페이스 구현한다고 어디서 선언하지?" — 안 한다. Go는 **구현체가 인터페이스를 몰라도 되도록** 설계했다("accept interfaces, return structs"의 뿌리). 대신 "정말 만족하는지"를 컴파일러가 사용 지점에서 확인한다.

## 언어별 정리

| 언어 | 다형성 도구 | 동적 값의 표현 | 만족 선언 방식 |
|---|---|---|---|
| **C++** | `virtual` 함수 + 상속 | `Base*` / `Base&` (객체에 `vptr`) | 명목적 — 상속으로 명시 |
| **Go** | `interface` | 인터페이스 값 `(*itab, *data)` | 구조적 — 시그니처 맞으면 자동 |
| **Rust** | `trait` | `dyn Trait` 뚱뚱한 포인터 | 명목적 — `impl` 명시(계층 없이) |

- **C++**: 다형성의 원형. 상속·가상 함수. → [클래스와 리소스 관리](/posts/cpp/2026-07-03-cpp-class-and-resource-management/)
- **Go**: 작은 인터페이스 + 구조적 만족이 언어 관용구의 중심. → [Go 학습 로드맵 — ② 인터페이스](/posts/go/2026-07-12-go-roadmap/)
- **Rust**: 트레이트가 다형성·제네릭·연산자 오버로딩까지 관장. 정적(`impl`)/동적(`dyn`)을 명시적으로 가른다. → [Rust 학습 로드맵 — ⑥ 트레이트·dyn](/posts/rust/2026-07-12-rust-roadmap/)

> 정리: C++ 가상 함수는 동적 디스패치를 이해하는 좋은 발판입니다. 다만 각 언어가 보장하는 것은 공통 인터페이스를 통한 호출 의미론이며, layout·만족 규칙·object safety와 coercion은 별도로 배워야 합니다.

## 스스로 점검

**1. 제네릭(파라미터 다형성)과 서브타입 다형성은 방향이 어떻게 반대인가?**

<details markdown="1">
<summary>답</summary>

제네릭은 **하나의 코드를 여러 타입에 찍어낸다**(대개 컴파일 타임, 정적 디스패치). 서브타입 다형성은 **여러 타입을 하나의 인터페이스로 다룬다**(런타임, 동적 디스패치). C++로 보면 전자가 템플릿, 후자가 `virtual`이다.

</details>

**2. Rust `dyn Trait`와 Go 인터페이스 값이 일반 포인터보다 큰 이유는? C++과 비교해서.**

<details markdown="1">
<summary>답</summary>

대표 구현에서 Rust trait object는 data pointer와 vtable metadata를 함께 운반하고, Go interface도 타입·메서드 metadata와 값을 함께 표현합니다. C++은 흔히 객체의 `vptr`을 사용합니다. 이는 동작을 이해하는 구현 모델이며 세 언어의 specification이 같은 2-word ABI를 보장한다는 뜻은 아닙니다.

</details>

**3. "이 타입이 인터페이스를 만족한다"를 Go와 Rust/C++이 다르게 정하는 방식은?**

<details markdown="1">
<summary>답</summary>

C++(`: Base`)·Rust(`impl Trait for T`)는 **명목적**이라 명시적으로 선언해야 합니다. Go는 **구조적**이라 메서드 시그니처만 맞으면 선언 없이 만족하며 컴파일러가 이를 검사합니다. 그래서 구현체가 인터페이스의 존재를 몰라도 됩니다.

</details>
