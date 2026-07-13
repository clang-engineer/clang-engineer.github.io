---
title       : 서브타입 다형성 — 인터페이스·트레이트·가상 함수는 하나다
description : "여러 타입을 하나의 공통 타입으로 다루고 실제 동작은 런타임에 고르는 서브타입 다형성을 언어 공통 개념으로 정리한다. C++ 가상 함수가 하는 그 일을 Go 인터페이스·Rust 트레이트가 어떻게 구현하는지, 그 밑의 vtable과 뚱뚱한 포인터, static vs dynamic dispatch, '누가 인터페이스 만족을 선언하나'(명목적 vs 구조적)를 대응시킨다."
date        : 2026-07-12 14:50:00 +0900
updated     : 2026-07-13 14:50:00 +0900
categories  : [concept]
tags        : [polymorphism, dispatch]
pin         : false
hidden      : false
---

> **난이도** 중급 · **선행** [제네릭(파라미터 다형성)](/posts/concept/2026-07-12-generics-parametric-polymorphism/)을 먼저 읽으면 좋다 — 이 글은 그 나머지 절반이다.

## 한 줄 요약

서브타입 다형성은 **여러 타입을 하나의 공통 타입(인터페이스)으로 다루고, 실제로 어느 동작을 부를지는 런타임에 실제 타입 걸로 고르는 것**이다. **C++의 가상 함수(`virtual`)가 하는 바로 그 일**이고, Go의 `interface`·Rust의 `trait`가 같은 개념을 각자 구현한 것이다.

## 어떤 문제를 푸는가 — C++ 가상 함수에서 출발

도형 여러 개를 하나의 목록에 담아 넓이를 구한다고 하자. C++이라면 이렇게 쓴다.

```cpp
struct Shape { virtual double area() const = 0; };   // 순수 가상 = 인터페이스
struct Circle : Shape { double area() const override { return 3.14 * r * r; } };
struct Rect   : Shape { double area() const override { return w * h; } };

void print(const Shape& s) { std::cout << s.area(); }  // 실제 타입이 뭐든 상관없다
```

`print`는 `Circle`인지 `Rect`인지 모른 채 `Shape`로만 다룬다. 그런데 `s.area()`는 **런타임에 실제 타입의 것**이 불린다. 이게 서브타입 다형성이고, C++에서는 `virtual`이 그 스위치다.

> **여기서 이미 알던 게 나온다.** "여러 타입을 부모 하나로 다루고, 실제 메서드는 런타임에 고른다" — 추상 클래스와 가상 함수. **이 개념이 곧 C++의 `virtual`이다.** Go·Rust는 이걸 이름만 바꿔 구현했다.

### 제네릭과 무엇이 다른가

[제네릭](/posts/concept/2026-07-12-generics-parametric-polymorphism/)도 "여러 타입"을 다루지만 방향이 반대다.

| | 제네릭(파라미터 다형성) | 서브타입 다형성 |
|---|---|---|
| 한 문장 | 하나의 코드를 **여러 타입에 찍어냄** | 여러 타입을 **하나의 인터페이스로 다룸** |
| 결정 시점 | 대개 컴파일 타임 | 런타임 |
| C++ | 템플릿 | `virtual` |

제네릭이 다형성의 한쪽 절반이라면, 이 글이 나머지 절반이다.

## 어떻게 동작하나 — vtable과 뚱뚱한 포인터

C++을 아는 사람은 이미 답을 안다. **vtable(가상 함수 테이블)**이다. 가상 함수를 가진 객체는 숨겨진 포인터(`vptr`) 하나를 들고, 그게 그 타입의 함수 포인터 배열(vtable)을 가리킨다. `s.area()`는 "vtable에서 `area` 슬롯을 찾아 그 주소로 점프"로 번역된다.

Go와 Rust도 **정확히 같은 장치**를 쓴다. 이름과 배치만 다르다.

| 언어 | 다형성 값의 실체 | vtable 위치 |
|---|---|---|
| **C++** | 객체 안에 `vptr` 한 개 | 객체가 vtable을 가리킴 |
| **Go** | `interface` 값 = **2워드** `(*itab, *data)` | `itab`이 타입정보 + 메서드 테이블 |
| **Rust** | `dyn Trait` = **뚱뚱한 포인터(fat pointer) 2워드** `(*data, *vtable)` | 포인터가 vtable을 따로 가리킴 |

차이는 **vtable을 어디에 두느냐**뿐이다. C++은 객체 안에 심고, Go·Rust는 인터페이스 값 자체가 `(데이터, 타입/함수표)` 쌍을 들고 다닌다(그래서 포인터가 2배 크기라 "뚱뚱하다"). 하지만 결국 셋 다 **"함수표를 든 포인터로 간접 호출"**이다.

> **아, 그래서 뚱뚱한 거구나.** Rust의 `Box<dyn Trait>`나 Go의 인터페이스 값이 왜 포인터보다 큰지 헷갈렸다면 — **C++ 객체가 `vptr`을 품는 대신, 이 언어들은 그 vptr을 포인터 옆에 붙여 들고 다니는 것**이다. 같은 vtable, 다른 보관 위치.

## static vs dynamic dispatch — 다형성 구현의 두 끝

"어느 함수를 부를지 **언제** 정하느냐"가 갈린다.

- **정적 디스패치(static)**: 컴파일 타임에 확정. 일반 함수 호출, 그리고 [제네릭의 단형화](/posts/concept/2026-07-12-generics-parametric-polymorphism/)가 여기다. 인라인이 되어 **비용 0**.
- **동적 디스패치(dynamic)**: 런타임에 vtable을 거쳐 결정. 간접 점프 한 번 + 인라인 불가라는 **작은 비용**을 내고 런타임 유연성을 산다.

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
- **Go — 구조적(structural), 자동**: 아무 선언도 안 한다. **메서드 시그니처만 맞으면** 그 타입은 자동으로 인터페이스를 만족한다(덕 타이핑). `implements` 키워드가 없다.

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

> 정리: **C++ 가상 함수를 알면 세 언어의 이 기능은 전부 아는 것이다.** vtable로 런타임에 실제 타입 걸 부른다는 뼈대가 같고, 딱 두 곳 — ①vtable을 객체에 심느냐 포인터에 붙이느냐, ②만족을 명시하느냐 자동이냐 — 에서만 갈린다.

## 스스로 점검

**1. 제네릭(파라미터 다형성)과 서브타입 다형성은 방향이 어떻게 반대인가?**

<details markdown="1">
<summary>답</summary>

제네릭은 **하나의 코드를 여러 타입에 찍어낸다**(대개 컴파일 타임, 정적 디스패치). 서브타입 다형성은 **여러 타입을 하나의 인터페이스로 다룬다**(런타임, 동적 디스패치). C++로 보면 전자가 템플릿, 후자가 `virtual`이다.

</details>

**2. Rust `dyn Trait`와 Go 인터페이스 값이 일반 포인터보다 큰 이유는? C++과 비교해서.**

<details markdown="1">
<summary>답</summary>

C++은 객체 안에 `vptr`을 심어 vtable을 가리킨다. Go·Rust는 그 vtable 포인터를 **데이터 포인터 옆에 함께 들고 다닌다**(`(*data, *vtable)` 2워드) — 그래서 "뚱뚱한 포인터"다. vtable로 간접 호출한다는 원리는 셋 다 같고, 보관 위치만 다르다.

</details>

**3. "이 타입이 인터페이스를 만족한다"를 Go와 Rust/C++이 다르게 정하는 방식은?**

<details markdown="1">
<summary>답</summary>

C++(`: Base`)·Rust(`impl Trait for T`)는 **명목적** — 명시적으로 선언해야 한다. Go는 **구조적** — 메서드 시그니처만 맞으면 선언 없이 자동으로 만족한다(덕 타이핑). 그래서 Go는 구현체가 인터페이스의 존재를 몰라도 된다.

</details>
