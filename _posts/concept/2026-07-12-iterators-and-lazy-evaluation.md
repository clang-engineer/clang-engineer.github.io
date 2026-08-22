---
title       : 이터레이터와 지연 평가 — 순회와 실행 시점을 분리하기
description : "이터레이터가 순회 방식을 추상화하는 개념이고 지연 평가는 계산 시점을 늦추는 별도 개념임을 구분한다. C++ STL/ranges, Rust Iterator, Go range-over-func를 비교한다."
date        : 2026-07-12 15:20:00 +0900
updated     : 2026-08-22 17:00:00 +0900
categories  : [concept]
tags        : [iterator, lazy-evaluation]
pin         : false
hidden      : false
---

> **난이도** 중급 · **선행** [클로저](/posts/concept/2026-07-12-closure/)를 보면 `map`·`filter`에 함수를 넘기는 부분이 쉽게 읽힌다.
>
> 🗺️ [프로그래밍 언어 개념 로드맵](/posts/concept/2026-07-13-concept-roadmap/)의 한 편

## 한 줄 요약

이터레이터(iterator)는 **원소를 어떤 순서와 방식으로 하나씩 꺼낼지 추상화**한다. 지연 평가(lazy evaluation)는 **계산을 결과가 필요할 때까지 미룬다**. 둘은 자주 함께 쓰이지만 같은 개념은 아니다.

```text
이터레이터 → 어떻게 하나씩 순회할 것인가
지연 평가   → 그 계산을 언제 수행할 것인가
클로저      → 각 원소에 어떤 동작을 적용할 것인가
```

이 세 축을 분리하면 C++ STL, C++20 ranges, Rust Iterator, Go의 iterator 지원이 한 줄로 보인다.

## 1. 이터레이터가 푸는 문제

컨테이너마다 내부 구조는 다르다. 배열은 인덱스로 접근할 수 있지만 연결 리스트·트리·생성형 시퀀스는 같은 방식으로 접근하지 않는다.

이터레이터는 내부 구조를 감추고 **현재 위치에서 다음 원소로 진행하는 규약**을 제공한다. 덕분에 알고리즘을 컨테이너 구조와 분리할 수 있다.

```cpp
std::vector<int> v = {1, 2, 3, 4};
auto it = std::find_if(
    v.begin(), v.end(),
    [](int x) { return x % 2 == 0; }
);
```

여기서

- `begin()`/`end()`가 순회 범위를 표현하고
- `find_if`가 알고리즘이며
- 람다가 각 원소에 적용할 조건을 표현한다.

람다가 외부 환경을 사용하면 클로저가 된다.

## 2. 이터레이터와 지연 평가는 별개다

이터레이터를 쓴다고 계산이 자동으로 지연되는 것은 아니다.

고전 C++ STL의 `std::transform`은 이터레이터를 받지만 호출하면 즉시 순회한다.

```cpp
std::transform(input.begin(), input.end(), output.begin(), square);
```

반면 C++20 ranges의 view는 계산을 조합해 두고 실제 원소가 필요할 때 처리할 수 있다.

```cpp
auto result = values
    | std::views::filter([](int x) { return x % 2 == 0; })
    | std::views::transform([](int x) { return x * x; });
```

즉 다음 등식은 성립하지 않는다.

```text
iterator = lazy evaluation   // X
```

이터레이터는 순회 추상화이고, lazy view나 lazy iterator adapter가 그 위에 지연 계산을 얹는 구조다.

## 3. Rust Iterator — 두 개념을 자연스럽게 결합한다

Rust의 `Iterator` 어댑터는 기본적으로 지연된다.

```rust
let sum: i32 = values.iter()
    .filter(|&&x| x % 2 == 0)
    .map(|&x| x * x)
    .sum();
```

`filter`와 `map`은 즉시 전체 컬렉션을 만들어내지 않는다. 소비자(consumer)인 `sum`, `collect`, `for` 등이 원소를 요구할 때 계산이 진행된다.

이 때문에

```text
values
→ filter
→ map
→ sum
```

이 논리적으로 여러 단계여도 각 원소는 필요할 때 파이프라인을 통과할 수 있다. 중간 컬렉션 할당을 피할 수 있다는 것이 대표적인 장점이다.

다만 **지연 = 항상 빠름**은 아니다. 어댑터 조합, 최적화, 캐시 지역성, 반복 계산 여부에 따라 실제 비용은 달라진다. 지연 평가는 우선 실행 시점과 중간 결과 생성을 바꾸는 의미론으로 이해하는 편이 정확하다.

## 4. 클로저는 이터레이터의 필수 조건이 아니다

`filter`, `map` 같은 고차 어댑터가 함수를 받기 때문에 클로저와 자주 붙어 다닌다.

```rust
let threshold = 10;
values.iter().filter(|&&x| x > threshold);
```

여기서는 `threshold`를 캡처하므로 실제 클로저다.

하지만 이터레이터 자체는 클로저 없이도 존재한다. 단순 순회나 미리 정의된 함수 포인터를 사용하는 알고리즘도 이터레이터다.

따라서 관계는

```text
이터레이터
└─ 순회 규약

지연 평가
└─ 실행 시점

클로저
└─ 주변 환경을 포함한 함수
```

이고, Rust 같은 API가 이들을 편리하게 조합해 사용하는 것이다.

## 5. C++ — STL iterator와 ranges view

C++에서는 역사적으로 두 층이 비교적 잘 보인다.

### 고전 STL

```text
container
→ iterator pair(begin/end)
→ algorithm
→ 즉시 실행
```

`find_if`, `sort`, `transform` 같은 알고리즘이 이터레이터 범위를 받는다.

### C++20 ranges

```text
range
→ view adapter
→ view adapter
→ 필요할 때 순회
```

`views::filter`, `views::transform` 같은 view는 Rust iterator adapter와 비슷한 사용 경험을 제공한다.

하지만 `C++ iterator = Rust Iterator`라고 완전히 등치하면 안 된다. C++ iterator는 전통적으로 **위치/순회 개념**이 강하고, Rust의 `Iterator` trait은 `next()`를 중심으로 한 **원소 생산 인터페이스**이며 다양한 adapter method까지 함께 제공한다.

## 6. Go — range-over-func가 추가한 것

Go는 오랫동안 slice·map·channel 등을 `for range`로 직접 순회하는 방식을 선호했다. Go 1.23부터 함수 형태의 iterator를 `range`할 수 있는 언어 지원이 추가됐다.

중요한 것은 Go가 Rust식 `map().filter().collect()` 체인을 언어 중심 관용구로 바꾼 것은 아니라는 점이다. Go의 기본 스타일은 여전히 명시적인 `for` 루프에 가깝다.

따라서

```text
Go 1.23
→ 사용자 정의 순회를 for range에 연결하기 쉬워짐

≠

Rust식 lazy adapter chain이 표준 관용구가 됨
```

으로 이해하는 편이 좋다.

## 한눈에 비교

| | 순회 추상화 | 지연 조합 | 대표 형태 |
|---|---|---|---|
| **C++ STL** | iterator | 기본적으로 별개 | `begin/end` + algorithm |
| **C++20 ranges** | range/iterator | view로 지원 | `views::filter` |
| **Rust** | `Iterator` trait | adapter가 기본적으로 lazy | `.filter().map()` |
| **Go 1.23+** | range-over-func 지원 | 언어 중심 체인은 아님 | `for ... range seq` |

## 7. 이 글에서 기억할 경계

```text
iterator ≠ lazy evaluation
closure  ≠ iterator
range     ≠ iterator와 완전히 같은 추상화
```

대신 이 개념들은 다음처럼 조합된다.

```text
데이터/생성원
   ↓
순회 추상화(iterator/range)
   ↓
변환 규칙(map/filter + 함수/클로저)
   ↓
즉시 또는 지연 실행
   ↓
소비(sum/collect/for/...)
```

이 구조를 잡으면 언어별 문법 차이보다 공통 개념이 먼저 보인다.

## 스스로 점검

**1. 이터레이터와 지연 평가의 차이는?**

<details markdown="1">
<summary>답</summary>

이터레이터는 원소를 어떻게 하나씩 순회할지 추상화하고, 지연 평가는 계산을 언제 수행할지 결정한다. 이터레이터를 사용해도 즉시 계산할 수 있다.

</details>

**2. Rust의 `filter`/`map` 체인에 클로저가 자주 등장하는 이유는?**

<details markdown="1">
<summary>답</summary>

각 원소에 적용할 동작을 함수로 전달하기 때문이다. 그 함수가 주변 변수를 사용하면 클로저가 된다. 클로저 자체가 이터레이터의 필수 조건은 아니다.

</details>

**3. Go 1.23의 iterator 지원이 Rust Iterator와 같은 방향인가?**

<details markdown="1">
<summary>답</summary>

사용자 정의 순회를 공통 문법에 연결한다는 점은 비슷하지만, Go가 Rust식 lazy adapter chain을 중심 관용구로 채택한 것은 아니다. Go는 여전히 명시적인 `for range` 스타일을 우선한다.

</details>
