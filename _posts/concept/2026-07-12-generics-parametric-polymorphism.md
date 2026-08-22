---
title       : 제네릭 — 파라미터 다형성과 구현 전략
description : "제네릭의 의미인 파라미터 다형성과 이를 구현하는 단형화·타입 소거·코드 공유 전략을 분리한다. C++ templates, Rust generics, Go generics, Java generics의 차이와 제약을 비교한다."
date        : 2026-07-12 14:40:00 +0900
updated     : 2026-08-22 17:00:00 +0900
categories  : [concept]
tags        : [generics, polymorphism]
pin         : false
hidden      : false
---

> **난이도** 중급 · **선행** 없음
>
> 🗺️ [프로그래밍 언어 개념 로드맵](/posts/concept/2026-07-13-concept-roadmap/)의 한 편

## 한 줄 요약

제네릭(generics)은 **타입을 매개변수로 두고 같은 추상 로직을 여러 타입에 적용하는 기능**이다. 이때 중요한 것은 두 층을 분리하는 것이다.

```text
의미론
→ 타입을 매개변수화해 코드를 일반화한다

구현 전략
→ 단형화, 타입 소거, 코드 공유 등으로 실제 실행 코드를 만든다
```

제네릭의 개념 자체가 곧 단형화를 뜻하는 것은 아니다.

## 1. 파라미터 다형성이 푸는 문제

타입만 다르고 로직이 같은 코드를 반복하지 않도록 한다.

```cpp
int max_int(int a, int b);
double max_double(double a, double b);
```

이를 타입 매개변수 `T`로 일반화할 수 있다.

```cpp
template<typename T>
T max(T a, T b) {
    return a > b ? a : b;
}
```

이런 형태를 **파라미터 다형성(parametric polymorphism)**이라고 부른다. 함수뿐 아니라 `List<T>`, `Option<T>`, `vector<T>` 같은 타입도 같은 원리다.

> C++ template은 제네릭 프로그래밍의 대표 도구지만 template 기능 전체가 순수한 parametric polymorphism과 동일한 것은 아니다. 특수화·메타프로그래밍처럼 더 넓은 기능도 포함한다.

## 2. 제네릭과 동적 디스패치는 다른 질문이다

제네릭과 인터페이스/가상 함수는 모두 "여러 타입을 다룬다"는 점 때문에 자주 한 축으로 비교된다. 하지만 답하는 질문이 다르다.

```text
제네릭
→ 이 알고리즘을 어떤 타입들에 적용할 수 있는가?

동적 디스패치
→ 이 공통 인터페이스 값의 실제 동작을 런타임에 어느 구현으로 보낼 것인가?
```

따라서

```text
제네릭 = 컴파일 타임
서브타입 다형성 = 런타임
```

으로 외우는 것도 너무 강한 단순화다. 제네릭은 언어에 따라 타입 소거·코드 공유 등 다양한 방식으로 구현될 수 있고, 인터페이스 제약은 제네릭의 정적 계약으로도 사용될 수 있다.

## 3. 구현 전략 ① 단형화

단형화(monomorphization)는 사용된 구체 타입에 맞는 코드를 생성하는 전략이다.

```text
max<int>
max<double>
```

처럼 구체 타입별 실행 코드가 만들어질 수 있다.

대표적으로 C++ template과 Rust generic이 이 전략을 적극 사용한다.

장점은 구체 타입이 컴파일 시점에 드러나 최적화·인라이닝 기회가 크다는 것이다. 대가는 타입 조합이 많아질수록 코드 크기와 컴파일 비용이 증가할 수 있다는 점이다.

> **단형화 = 런타임 비용 0**이라고 단정하지 않는다. 제네릭 추상화 자체의 동적 디스패치 비용을 피하기 쉽다는 뜻이지, 생성된 코드의 연산·할당·캐시 비용까지 사라진다는 뜻은 아니다.

## 4. 구현 전략 ② 타입 소거와 공유 코드

Java generics는 대표적으로 타입 소거(type erasure)를 사용한다. 컴파일 과정에서 generic type parameter의 많은 정보가 지워지고 공유된 바이트코드가 실행된다.

여기서 주의할 점은

```text
타입 소거 = 항상 boxing
```

도 아니라는 것이다.

Java에서 `List<Integer>`처럼 primitive를 generic type argument로 직접 사용할 수 없기 때문에 wrapper 객체가 필요한 경우 boxing 비용이 나타나지만, 타입 소거라는 개념 자체가 모든 값을 무조건 힙 박싱한다는 뜻은 아니다.

즉 두 개념을 분리해야 한다.

```text
Type Erasure
→ generic type 정보를 실행 표현에서 지우거나 축소하는 전략

Boxing
→ 값을 객체/간접 표현으로 감싸는 표현 전략
```

둘은 함께 나타날 수 있지만 같은 개념은 아니다.

## 5. Go generics — 단순한 중간점으로만 보면 안 된다

Go 1.18부터 type parameter를 지원한다. 구현은 compiler/runtime 버전에 따라 최적화 세부가 달라질 수 있으며, 구체 타입별 코드 생성과 shape 기반 코드 공유를 조합한다.

따라서 Go를

```text
단형화와 타입 소거의 정확한 중간
```

이라고 하나의 고정 모델로 기억하기보다, **언어 의미론은 type parameter + constraint이고 구현은 코드 공유와 특수화를 조합할 수 있다**고 이해하는 편이 안전하다.

제네릭을 사용하는 개발자에게 더 중요한 것은 구현 내부보다 다음 계약이다.

- 어떤 타입을 받을 수 있는가
- 어떤 연산을 사용할 수 있는가
- 타입 추론이 어디까지 되는가
- interface constraint가 무엇을 의미하는가

## 6. 제약(constraint)은 제네릭 본문의 계약이다

`max`는 모든 타입에 의미가 있지 않다. 비교 가능한 타입이어야 한다.

```text
제네릭 매개변수 T
+
T가 제공해야 할 능력
=
제약(constraint / bound)
```

언어별 표현은 다르다.

| 언어 | 대표 제약 방식 |
|---|---|
| C++ | concepts / requires |
| Rust | trait bounds |
| Go | interface constraints |
| Java | bounded type parameter (`T extends ...`) |

제약의 핵심 역할은 **제네릭 본문이 무엇을 전제로 사용할 수 있는지 타입 시스템에 명시하는 것**이다.

예를 들어 Rust에서

```rust
fn max<T: PartialOrd>(a: T, b: T) -> T
```

라고 쓰면 본문은 `T`가 `PartialOrd`가 제공하는 비교 계약을 만족한다고 전제할 수 있다.

## 7. C++·Rust·Go를 비교할 때의 경계

### C++

C++ template은 매우 강력하며 단형화가 대표적인 구현 전략이다. concepts 이전에도 template substitution으로 제약을 표현할 수 있었고, C++20 concepts가 이를 명시적인 계약으로 크게 개선했다.

### Rust

Rust generic은 trait bound와 긴밀하게 결합한다. `<T: Trait>`은 보통 정적 디스패치와 단형화로 이어지고, 런타임 동적 디스패치가 필요하면 `dyn Trait`이라는 별도 표현을 사용한다.

### Go

Go의 type parameter constraint도 interface 문법을 사용하지만, **일반 interface value와 generic constraint는 역할이 다르다**. 같은 `interface` 문법이 나온다고 동적 디스패치와 동일시하면 안 된다.

```text
Go interface value
→ 런타임에 값을 공통 인터페이스로 다룸

Go type constraint
→ 컴파일 시 type parameter가 허용하는 타입/연산을 제한
```

## 한눈에 정리

| 개념 | 답하는 질문 |
|---|---|
| 파라미터 다형성 | 타입을 바꿔도 같은 추상 로직을 사용할 수 있는가 |
| constraint / bound | 타입 매개변수가 어떤 능력을 가져야 하는가 |
| 단형화 | 구체 타입별 실행 코드를 생성할 것인가 |
| 타입 소거 | generic type 정보를 실행 표현에서 얼마나 지울 것인가 |
| boxing | 값을 간접 객체 표현으로 감쌀 것인가 |
| 동적 디스패치 | 런타임에 어느 구현을 호출할 것인가 |

이들을 하나의 `컴파일 타임 vs 런타임` 표로만 압축하지 않는 것이 중요하다.

## 스스로 점검

**1. 제네릭과 단형화는 같은 개념인가?**

<details markdown="1">
<summary>답</summary>

아니다. 제네릭은 타입을 매개변수화하는 언어 의미론이고, 단형화는 그 제네릭을 구현하는 전략 중 하나다.

</details>

**2. 타입 소거와 boxing은 같은가?**

<details markdown="1">
<summary>답</summary>

아니다. 타입 소거는 generic type 정보를 실행 표현에서 지우거나 축소하는 전략이고, boxing은 값을 객체나 간접 표현으로 감싸는 방식이다. 함께 나타날 수 있지만 별개다.

</details>

**3. Rust `<T: Trait>`와 `dyn Trait`의 핵심 차이는?**

<details markdown="1">
<summary>답</summary>

`<T: Trait>`은 type parameter에 대한 정적 계약이고 보통 단형화·정적 디스패치로 이어진다. `dyn Trait`은 trait object를 통해 런타임 동적 디스패치를 사용한다.

</details>
