---
title       : 불변성 — const·mut·val, 누가 무엇을 못 바꾸게 하나
description : "값을 바꿀 수 있는가를 누가·어떻게 통제하는가. C++ const correctness를 발판으로 기본 가변/불변, 바인딩 불변, 접근 경로의 불변, 내부 가변성을 구분하고 Rust·Kotlin·JavaScript·함수형 자료구조를 비교한다."
date        : 2026-07-13 11:00:00 +0900
updated     : 2026-08-22 17:00:00 +0900
categories  : [concept]
tags        : [immutability, const, mutability]
pin         : false
hidden      : false
---

> **난이도** 중급 · **선행** [값 vs 참조 의미론](/posts/concept/2026-07-12-value-vs-reference-semantics/)을 보면 바인딩과 값의 차이를 이해하기 쉽다.
>
> 🗺️ [프로그래밍 언어 개념 로드맵](/posts/concept/2026-07-13-concept-roadmap/)의 한 편

## 한 줄 요약

"불변"은 하나의 개념처럼 보이지만 실제로는 여러 층이 있다.

```text
이름을 다른 값에 다시 묶을 수 있는가?        → 바인딩 불변
이 접근 경로로 값을 수정할 수 있는가?        → 접근 불변
객체 내부 상태가 실제로 절대 바뀌지 않는가? → 깊은/구조적 불변
```

언어마다 이 세 층 중 무엇을 기본값으로 두고 어디까지 강제하는지가 다르다.

## 왜 불변성이 필요한가

```cpp
void process(Config& cfg) {
    cfg.retries = 0;
}
```

호출자는 `process`가 설정을 바꿀 것이라고 예상하지 않았을 수 있다. 큰 코드베이스에서는 **누가 값을 바꿀 수 있는지**가 드러나지 않을수록 추적 비용이 커진다.

불변성은 변경 가능한 경로를 줄여 다음을 쉽게 만든다.

- 함수의 부작용 추론
- 여러 코드 경로에서 값 공유
- 동시 읽기
- 캐시와 메모이제이션
- 상태 변화의 원인 추적

다만 "변수가 불변"과 "객체 전체가 영원히 불변"은 같은 말이 아니다.

## 먼저 세 층을 구분한다

### 1. 바인딩 불변

변수 이름을 다른 값에 다시 연결하지 못한다.

```javascript
const user = { name: "Kim" };
// user = {};       // 재대입 불가
user.name = "Lee"; // 객체 내용은 변경 가능
```

### 2. 접근 경로의 불변

특정 참조를 통해서는 값을 바꿀 수 없다.

```cpp
void print(const std::string& s) {
    // s.clear(); // 이 경로에서는 수정 불가
}
```

원래 객체가 다른 경로에서는 가변일 수 있다.

### 3. 깊은/구조적 불변

객체와 그 내부 상태가 수정되지 않는다. 함수형 영속 자료구조처럼 변경 대신 새 값을 만드는 방식이 여기에 가깝다.

이 세 층을 섞지 않는 것이 핵심이다.

## C++ — `const`는 접근 경로를 제한한다

```cpp
const int x = 5;
// x = 6; // 불가

void print(const std::string& s);
```

C++ `const`는 컴파일러가 강제하는 타입 규칙이다. `const T&`를 통해서는 `T`의 비-const 연산을 호출할 수 없다.

포인터에서는 두 위치를 구분해야 한다.

```cpp
const int* p;   // p가 가리키는 int를 이 경로로 수정할 수 없음
int* const p2;  // p2 자체를 다른 주소로 바꿀 수 없음
```

이 차이는 뒤에서 나오는 **값 접근 불변 vs 바인딩 불변**을 이해하는 좋은 발판이다.

하지만 `const`가 객체의 물리적 상태가 영원히 절대 바뀌지 않는다는 뜻은 아니다.

- `mutable` 멤버는 `const` 멤버 함수에서도 바뀔 수 있다.
- 원래 non-const 객체를 다른 non-const 경로에서 수정할 수 있다.
- `const_cast`는 제한적으로 cv-qualification을 제거할 수 있지만, 원래부터 `const`인 객체를 수정하면 undefined behavior다.

즉 C++ `const`는 **특정 타입·접근 경로에서 무엇을 허용하는가**에 대한 규칙이다.

## Rust — 불변 바인딩이 기본이고 빌림에 aliasing 규칙이 붙는다

Rust는 기본 바인딩이 불변이다.

```rust
let x = 5;
// x = 6; // 불가

let mut y = 5;
y = 6;
```

하지만 Rust의 중요한 차이는 `mut` 자체보다 **빌림 규칙**에 있다.

```rust
fn read(s: &String) {}
fn change(s: &mut String) {}
```

대략적인 규칙은 다음과 같다.

```text
&T
→ 여러 shared reference 허용
→ 일반적인 직접 변경은 불가

&mut T
→ 변경 가능
→ 같은 동안 경쟁하는 다른 빌림을 허용하지 않음
```

따라서 `&mut T`는 단순히 "C++의 `T&`에 mut 표시를 붙인 것"이 아니다. **변경 가능성과 배타적 aliasing 계약**이 함께 있다.

또 `&T`가 물리적으로 절대 불변이라는 뜻도 아니다. `UnsafeCell`을 기반으로 한 `Cell`, `RefCell`, `Mutex` 같은 타입은 shared reference 뒤에서도 각 타입의 규칙에 따라 내부 상태를 바꿀 수 있다.

이것을 **내부 가변성(interior mutability)**이라고 한다.

## Kotlin `val`·Java `final`·JavaScript `const` — 주로 바인딩을 잠근다

```kotlin
val list = mutableListOf(1, 2)
// list = mutableListOf() // 재대입 불가
list.add(3)               // 내용 변경 가능
```

```javascript
const obj = { count: 1 };
// obj = {};        // 재대입 불가
obj.count = 2;      // 내용 변경 가능
```

이 경우 불변인 것은 **변수의 바인딩**이다. 가리키는 객체의 내용까지 자동으로 불변이 되는 것은 아니다.

C++의 `int* const p`를 떠올리면 이해에는 도움이 된다.

```text
int* const p
→ 포인터 변수 p는 다른 주소로 바꿀 수 없음
→ 가리키는 int는 바꿀 수 있음

Kotlin val / JS const
→ 변수 이름을 다른 객체로 재대입할 수 없음
→ 객체의 가변성은 객체 타입·API가 따로 결정
```

둘은 **비슷한 구분을 보여주는 비유**이지 정확히 같은 타입 의미론은 아니다. Kotlin·JavaScript 변수는 C++ 포인터 그 자체가 아니며, 각 언어의 객체·참조 모델도 다르다.

## 함수형 영속 자료구조 — 변경 대신 새 값을 만든다

함수형 스타일에서는 기존 값을 직접 고치지 않고 새 버전을 만든다.

```text
기존 값 A
  ↓ 수정 요청
새 값 B 생성
  ↓
바뀌지 않은 내부 구조는 A와 공유
```

이를 **구조 공유(structural sharing)**라고 한다.

```javascript
const a = List([1, 2, 3]);
const b = a.push(4);
// a는 그대로, b가 새 버전
```

이 방식은 상태 추론과 버전 관리에 유리하지만 갱신 시 새 노드를 만드는 비용이 있다.

## 한눈에 비교

| 모델 | 기본 성격 | 무엇을 막나 | 내부 변경 가능성 |
|---|---|---|---|
| C++ `const` | 가변 기본, `const` 옵트인 | 해당 접근 경로의 변경 | `mutable`·다른 non-const 경로 등 가능 |
| Rust `let` | 바인딩 불변 기본 | 재대입 | `mut`으로 옵트인 |
| Rust `&T` | shared borrow | 일반 직접 변경 + aliasing 제약 | `UnsafeCell` 기반 내부 가변성 가능 |
| Rust `&mut T` | 배타적 borrow | 경쟁 aliasing | 해당 빌림을 통한 변경 가능 |
| Kotlin `val` / JS `const` | 바인딩 불변 | 재대입 | 객체 타입이 가변이면 내용 변경 가능 |
| 영속 자료구조 | 값 불변 중심 | 기존 값 변경 | 새 버전 생성 |

## 데이터 레이스와의 관계

"불변이면 데이터 레이스가 없다"는 말은 방향은 맞지만 너무 단순하다.

Rust에서 중요한 것은 단순 불변 기본값보다 다음 규칙이다.

```text
여러 shared borrow (&T)
또는
하나의 exclusive mutable borrow (&mut T)
```

즉 **공유와 변경을 동시에 허용하지 않는 aliasing 규칙**이 핵심이다. 이것이 `Send`/`Sync` 같은 동시성 타입 규칙과 결합돼 안전한 공유를 만든다.

→ [동시성 조율 모델](/posts/concept/2026-07-12-concurrency-coordination-models/)

## C++을 발판으로 볼 때의 대응 관계

```text
C++ const T&
≈ Rust &T를 이해하는 출발점
≠ 내부 가변성·aliasing 규칙까지 동일하지 않음

C++ T&
≈ Rust &mut T의 "수정 가능 참조"라는 출발점
≠ Rust의 배타적 aliasing 보장까지 포함하지 않음

C++ int* const p
≈ Kotlin val / JS const의 바인딩 불변을 떠올리는 비유
≠ 변수·참조 모델 자체가 같은 것은 아님
```

## 기억 흐름

```text
"불변"이라고 했을 때 먼저 묻는다
        ↓
무엇이 안 바뀌는가?
        ↓
이름의 재대입?
특정 접근 경로의 수정?
객체 내부 상태 전체?
        ↓
언어마다 강제 범위가 다르다
```

## 스스로 점검

**1. `const`, `val`, `&T`는 모두 같은 종류의 불변인가?**

<details markdown="1">
<summary>답</summary>

아니다. Kotlin `val`·JavaScript `const`는 주로 바인딩 재대입을 막고, C++ `const T&`는 해당 접근 경로에서의 수정을 제한하며, Rust `&T`는 shared borrow와 aliasing 규칙까지 포함한다.

</details>

**2. Rust `&T` 뒤의 값은 절대 바뀔 수 없는가?**

<details markdown="1">
<summary>답</summary>

아니다. 일반적인 직접 변경은 불가능하지만 `UnsafeCell`을 기반으로 한 내부 가변성 타입은 각 타입의 안전 규칙에 따라 상태를 변경할 수 있다.

</details>

**3. Kotlin `val`을 C++ `int* const`와 같다고 해도 되는가?**

<details markdown="1">
<summary>답</summary>

정확히 같지는 않다. 둘 다 "바인딩은 고정되지만 가리키는 대상은 가변일 수 있다"는 구분을 이해하는 비유로는 유용하지만, 두 언어의 변수·참조 모델은 다르다.

</details>
