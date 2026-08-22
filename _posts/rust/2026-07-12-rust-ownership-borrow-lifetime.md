---
title       : 핵심 ② 소유권·빌림·수명 — borrow checker와 싸우는 구간
description : "Rust의 소유권·빌림·수명을 C++의 RAII·이동·참조를 발판으로 설명하되, 같은 의미론으로 등치하지 않는다. move, &/&mut, lifetime이 어떤 안전 계약을 강제하는지 정리한다."
date        : 2026-07-12 11:10:00 +0900
updated     : 2026-08-22 18:00:00 +0900
categories  : [rust]
tags        : [roadmap, rust]
pin         : false
hidden      : false
---

> [Rust 학습 로드맵](/posts/rust/2026-07-12-rust-roadmap/)의 **② 핵심(뼈대, 최우선)** 단계다. 앞 글: [① 문법·불변성·cargo](/posts/rust/2026-07-12-rust-basics-cargo-immutability/)

Rust에서 가장 먼저 오래 붙잡아야 할 구간이다. C++의 RAII·이동 시맨틱·스마트 포인터·댕글링 참조 문제를 알고 있으면 좋은 발판이 된다. 다만 Rust 소유권은 이 도구들을 단순히 "컴파일러가 강제한 버전"으로 합친 것이 아니라, **값의 소유·빌림·수명 관계를 언어의 타입 규칙으로 만든 별도의 모델**이다.

소유권이 GC·명시적 관리와 어떤 차이가 있는지는 [메모리 관리 모델](/posts/concept/2026-07-12-memory-management-models/)을 함께 본다.

## 소유권 — non-Copy 값은 대입·전달에서 이동할 수 있다

Rust에서 먼저 잡을 규칙은 세 가지다.

1. 값에는 그 값을 소유하는 바인딩이 있다.
2. 소유 값의 수명이 끝나면 해당 타입의 `Drop` 규칙에 따라 정리가 수행된다.
3. `Copy`가 아닌 값을 대입하거나 값으로 전달하면 소유권이 이동할 수 있고, 이전 바인딩은 더 사용할 수 없다.

```rust
let s1 = String::from("hello");
let s2 = s1;              // 소유권 이동
// println!("{}", s1);    // 컴파일 에러: moved value
```

이 동작을 C++ 이동 시맨틱과 연결해서 이해할 수는 있지만 **Rust move와 C++ `std::move`는 같은 연산이 아니다.**

```text
C++ std::move
→ 객체를 rvalue로 취급하게 하는 캐스팅
→ 실제 자원 이전은 선택된 이동 생성자/이동 대입 연산이 수행

Rust move
→ 언어 의미론상의 소유권 이전
→ 이전 바인딩의 사용 가능 여부를 컴파일러가 추적
```

C++에서 `s2 = s1` 같은 코드는 보통 복사 의미론이고, Rust의 `String`은 `Copy`가 아니므로 같은 형태의 대입이 이동이 된다. 실제 복제가 필요하면 `.clone()`을 명시한다.

> `i32`처럼 `Copy`를 구현한 타입은 대입 후에도 원본 바인딩을 사용할 수 있다. 힙/스택 위치가 기준이 아니라 **타입이 `Copy` 계약을 만족하는가**가 기준이다.

## RAII와 Rust Drop — 좋은 발판이지만 같은 제도는 아니다

C++ RAII와 Rust의 소유 값 정리는 모두 **객체 수명과 자원 정리를 연결한다**는 점에서 좋은 대응 관계가 있다.

```text
C++ RAII
→ 생성자/소멸자와 객체 수명으로 자원 관리
→ 어떤 타입과 소유 모델을 사용할지는 개발자가 설계

Rust ownership + Drop
→ 값의 소유권 이동과 빌림 규칙을 언어가 추적
→ 소유 값의 수명이 끝날 때 Drop 경로가 실행
```

따라서 `Rust 소유권 = RAII`라고 외우기보다 **RAII가 자원 수명 연결을 이해하는 발판이고, Rust는 그 위에 소유권·빌림의 정적 규칙을 더한다**고 보는 편이 정확하다.

## 빌림 — `&`와 `&mut`, 그리고 aliasing 계약

소유권을 넘기지 않고 잠깐 접근하려면 빌림(borrow)을 사용한다.

```rust
fn len(s: &String) -> usize {
    s.len()
}

let s = String::from("hi");
let n = len(&s);
println!("{} {}", s, n);
```

`&T`와 `&mut T`는 C++의 `const T&`와 `T&`를 떠올리면 출발점은 잡기 쉽다. 하지만 Rust reference는 **변경 가능성뿐 아니라 aliasing 규칙까지 계약에 포함한다.**

- `&T` — 여러 shared reference가 동시에 존재할 수 있다.
- `&mut T` — 해당 접근 기간 동안 배타적인 mutable access를 요구한다.

```rust
let mut s = String::from("hi");
let r1 = &s;
let r2 = &s;
// let w = &mut s;   // r1/r2가 이후에도 사용된다면 충돌
```

safe Rust에서 이 규칙은 데이터 레이스가 가능한 잘못된 별칭 조합을 컴파일 타임에 막는 중요한 기반이다. 다만 공유 가변 상태를 여러 스레드에서 다루려면 `Mutex`, `RwLock`, atomic 같은 런타임 동기화 도구가 여전히 필요하다.

또한 `&T`가 물리적으로 절대 불변이라는 뜻도 아니다. `UnsafeCell`을 기반으로 한 내부 가변성 타입은 shared reference 뒤에서도 정해진 규칙에 따라 상태를 바꿀 수 있다.

## 수명(lifetime) — 참조 관계를 정적으로 검사한다

Rust reference는 참조 대상보다 오래 유효할 수 없다.

```rust
fn dangle() -> &String {
    let s = String::from("hi");
    &s
}
```

이 코드는 지역 변수 `s`가 함수 종료와 함께 사라지므로 반환 참조가 유효할 수 없어 컴파일되지 않는다.

C++에서도 올바른 프로그램은 같은 수명 규칙을 지켜야 하지만, 잘못된 참조·포인터 수명은 컴파일러가 항상 막아주지 못한다. Rust는 safe reference의 수명 관계를 타입 검사에 포함해 많은 dangling access를 실행 전에 거절한다.

대부분의 lifetime은 컴파일러가 추론한다. `'a` 같은 lifetime parameter는 수명을 새로 만드는 것이 아니라 **여러 참조의 유효 기간 관계를 서술**한다.

```rust
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}
```

여기서 `'a`는 반환 참조가 입력 참조와 어떤 관계를 가져야 하는지 표현한다.

## borrow checker 오류를 읽는 방법

처음 가장 자주 만나는 오류는 두 가지다.

- **use after move** — 소유권이 이동한 이전 바인딩을 다시 사용한다.
- **borrow conflict** — 같은 값에 대해 현재 존재하는 빌림과 충돌하는 새 빌림을 만들려 한다.

해결을 무조건 `.clone()`으로 만들기보다 먼저 다음을 확인한다.

```text
이 함수가 값을 소유해야 하는가?
→ 아니면 &T / &mut T로 빌릴 수 있는가

두 접근이 정말 동시에 살아 있어야 하는가?
→ 아니면 빌림 범위를 줄일 수 있는가

공유 소유가 실제로 필요한가?
→ 필요할 때 Rc/Arc 같은 모델을 선택
```

컴파일러 오류의 `moved here`, `borrow later used here`, `help:`를 따라가면 소유권 관계를 시각적으로 확인하는 데 도움이 된다.

## C++을 발판으로 비교

| C++에서 떠올릴 개념 | Rust | 어디까지 비슷한가 / 어디서 갈리는가 |
|---|---|---|
| 이동 시맨틱 | move | 자원 이전이라는 직관은 비슷하지만 `std::move` 자체와 동일하지 않음 |
| RAII | ownership + `Drop` | 수명과 정리를 묶는 발상은 비슷하지만 Rust는 소유·빌림 규칙까지 정적으로 추적 |
| `const T&` | `&T` | 읽기 중심 접근이라는 직관은 비슷하지만 Rust는 aliasing 계약이 더 강함 |
| `T&` | `&mut T` | 변경 가능한 참조라는 점은 비슷하지만 `&mut`은 배타적 접근 계약을 가짐 |
| 댕글링 참조/포인터 | lifetime 검사 | 같은 수명 문제를 Rust safe reference는 더 강하게 정적 검사 |
| 명시적 복사 | `.clone()` | 복제가 비용을 가진다는 사실을 코드에 드러냄 |

## 자주 막히는 지점

- **이동을 복사로 착각** — non-`Copy` 값을 대입한 뒤 이전 바인딩을 다시 사용한다.
- **`.clone()` 남발** — 컴파일 오류를 없애려고 복제부터 하기보다 빌림으로 풀 수 있는지 본다.
- **참조를 오래 저장하려는 설계** — 초반에는 참조 필드보다 소유 값(`String`, `Vec`)을 보관하는 쪽이 단순한 경우가 많다.
- **`&mut`을 단순한 C++ non-const reference로만 이해** — Rust에서는 배타적 aliasing 계약까지 포함한다.

## 통과 기준

- use-after-move와 borrow conflict를 스스로 설명할 수 있다.
- 값 소유, shared borrow, mutable borrow, clone 중 무엇을 선택할지 이유를 말할 수 있다.
- lifetime annotation이 실제 수명을 늘리는 문법이 아니라 관계를 표현하는 것임을 이해한다.

다음은 [③ struct·enum·match](/posts/rust/2026-07-12-rust-struct-enum-match/)다.

## Reference

- [The Rust Book Ch.4 — Understanding Ownership](https://doc.rust-lang.org/book/ch04-00-understanding-ownership.html)
- [rustlings](https://github.com/rust-lang/rustlings)
- [Rust by Example — Ownership and moves](https://doc.rust-lang.org/rust-by-example/scope/move.html)
- [메모리 관리 모델](/posts/concept/2026-07-12-memory-management-models/)
