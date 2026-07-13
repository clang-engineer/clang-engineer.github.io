---
title       : 이터레이터와 지연 평가 — 순회를 추상화하기
description : "컬렉션의 내부 구조를 노출하지 않고 원소를 하나씩 훑는 공통 인터페이스가 이터레이터다. 거기에 map·filter를 지연(lazy)으로 엮으면 중간 컬렉션 없이 한 번에 훑는다. C++ STL 이터레이터·알고리즘에 넘기던 그 람다가 Rust Iterator 어댑터의 클로저이고, C++20 ranges의 지연 view가 Rust에선 언어 중심이 된 과정을 대응시킨다."
date        : 2026-07-12 15:20:00 +0900
updated     : 2026-07-13 15:20:00 +0900
categories  : [concept]
tags        : [iterator, lazy-evaluation]
pin         : false
hidden      : false
---

> **난이도** 중급 · **선행** [클로저](/posts/concept/2026-07-12-closure/)(어댑터에 넘기는 게 클로저다)를 봤으면 좋다.

## 한 줄 요약

이터레이터는 **컬렉션의 내부 구조(배열이냐 트리냐)를 노출하지 않고 원소를 하나씩 훑는 공통 인터페이스**다. 거기에 `map`·`filter`를 **지연(lazy)**으로 엮으면 중간 컬렉션을 만들지 않고 한 번의 순회로 처리한다. C++ STL 이터레이터·알고리즘이 그 원형이고, Rust의 `Iterator` 트레이트가 그걸 언어 중심으로 끌어올렸다.

## 어떤 문제를 푸는가

컨테이너마다 순회 방법이 다르면(`vector`는 인덱스, `map`은 트리 순회), "짝수만 골라 제곱해 더하기" 같은 로직을 컨테이너마다 다시 짜야 한다. **이터레이터는 "다음 원소 줘"라는 하나의 인터페이스로 순회를 통일**해, 알고리즘을 컨테이너와 분리한다.

## C++에서 출발 — begin/end와 알고리즘

C++ 개발자는 이미 이터레이터를 쓴다.

```cpp
std::vector<int> v = {1, 2, 3, 4};
auto it = std::find_if(v.begin(), v.end(),
                       [](int x) { return x % 2 == 0; });  // 첫 짝수를 찾음
```

`begin()`/`end()`가 이터레이터이고, `std::find_if`·`std::transform` 같은 알고리즘이 그걸 받아 동작한다. 그리고 **알고리즘에 넘기는 저 `[](int x){...}`가 바로 클로저**다.

> **여기가 착지점.** Rust의 `v.iter().filter(|x| x % 2 == 0)`에서 `filter`에 넘기는 클로저는 **C++ `find_if`에 넘기던 그 람다와 같은 것**이다. Rust는 이걸 `.` 체인으로 엮게 만들었을 뿐. → [STL 컨테이너와 알고리즘](/posts/cpp/2026-07-03-cpp-stl-containers-and-algorithms/)

## 지연 평가 — 중간 컬렉션을 안 만든다

"짝수만 골라 제곱"을 순진하게 짜면 **매 단계 새 컬렉션**이 생긴다. `filter`가 벡터 하나, `map`이 또 하나. 지연 평가는 이걸 없앤다 — 어댑터를 엮어두기만 하고 **실제 순회는 결과가 필요한 순간 딱 한 번** 흐른다.

```rust
let sum: i32 = v.iter()
    .filter(|&&x| x % 2 == 0)   // 아직 아무것도 안 함(lazy)
    .map(|&x| x * x)            // 여기도 안 함
    .sum();                     // ★ 이 순간 원소가 filter→map→sum을 한 번에 통과
```

Rust `Iterator`는 **기본이 지연**이다. `filter`·`map`은 "무엇을 할지"만 기억하고, `sum()`·`collect()` 같은 소비자가 붙어야 실제로 흐른다.

> **C++에선 이게 나뉜다 — 발판과 그 한계.** 고전 STL 알고리즘(`std::transform` 등)은 **즉시(eager)** 실행돼 결과 컨테이너를 바로 채운다. 지연 view는 **C++20 ranges**에서야 왔다: `v | std::views::filter(...) | std::views::transform(...)`가 Rust 체인과 판박이다. **단 등치가 깨지는 지점** — ranges는 C++20 최신 기능이라 [모던 C++ 로드맵도 '필수' 밖으로](/posts/cpp/2026-07-03-cpp-learning-roadmap/) 미뤄뒀다. 즉 "이터레이터"는 C++에 단단히 있지만, "지연 어댑터 체인"은 **Rust가 더 native**하고 C++에선 신기능이다.

## Go는 왜 오래 비어 있었나

Go는 이터레이터 추상화를 **일부러 오래 두지 않았다**. `for range`로 slice·map을 직접 돌 뿐, `filter`/`map` 체인이 없어 루프를 손으로 썼다(단순성 우선). **Go 1.23(2024)**에서야 `range`-over-func 이터레이터가 들어와 사용자 정의 순회가 가능해졌다.

## 언어별 정리

| | 이터레이터 | 지연 어댑터 체인 | 어댑터에 넘기는 것 |
|---|---|---|---|
| **C++** | STL `begin/end` + 알고리즘 | C++20 ranges `views`(신기능) | 람다 |
| **Go** | 1.23+ `range`-over-func | 없음(수동 루프) | — |
| **Rust** | `Iterator` 트레이트(중심) | 기본 지연(`map`/`filter`/`collect`) | 클로저 |

- **C++**: 이터레이터는 STL의 뼈대. 지연 view는 C++20 ranges. → [STL 컨테이너와 알고리즘](/posts/cpp/2026-07-03-cpp-stl-containers-and-algorithms/)
- **Go**: 오래 수동 루프. 1.23에서 이터레이터 도입. → [Go 학습 로드맵](/posts/go/2026-07-12-go-roadmap/)
- **Rust**: `Iterator` 어댑터 체인이 관용구의 중심. "반복자다움"이 곧 Rust다움. → [Rust 학습 로드맵 — 반복자](/posts/rust/2026-07-12-rust-roadmap/)

> 정리: **이터레이터(순회 통일)는 C++ STL에서 이미 익숙**하다. 갈리는 건 그 위의 **지연 어댑터 체인** — C++은 C++20 ranges로 뒤늦게, Go는 거의 안 두고, Rust는 언어 중심으로 삼았다. `find_if`에 넘기던 람다가 `.filter()`의 클로저라는 걸 알면 Rust 체인이 낯설지 않다.

## 스스로 점검

**1. 이터레이터가 푸는 근본 문제는?**

<details markdown="1">
<summary>답</summary>

컨테이너마다 다른 순회 방법을 **"다음 원소 줘"라는 하나의 인터페이스로 통일**해, 알고리즘을 컨테이너 구조와 분리한다. 그래서 `find_if` 하나가 `vector`든 `list`든 동작한다.

</details>

**2. 지연 평가가 없애는 낭비는?**

<details markdown="1">
<summary>답</summary>

`filter`→`map`을 즉시 실행하면 **매 단계 중간 컬렉션**이 생긴다. 지연은 어댑터를 엮어두기만 하고, 소비자(`sum`/`collect`)가 붙을 때 원소가 **한 번의 순회로 전체 체인을 통과**하게 해 중간 할당을 없앤다.

</details>

**3. Rust `.filter(|x| ...)`의 클로저를 C++ 개념으로 옮기면?**

<details markdown="1">
<summary>답</summary>

`std::find_if(v.begin(), v.end(), [](int x){...})`에서 **알고리즘에 넘기던 그 람다**와 같다. Rust는 그걸 `.` 체인으로 엮고 기본을 지연으로 만들었을 뿐, 술어를 클로저로 넘긴다는 뼈대는 같다.

</details>
