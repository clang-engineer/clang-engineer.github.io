---
title       : 핵심 ② 소유권·빌림·수명 — borrow checker와 싸우는 구간
description : "Rust의 전부. C++의 이동 시맨틱·RAII·스마트 포인터가 '조심해서 지켜야 했던 규칙'이었다면 Rust는 안 지키면 컴파일이 안 된다. 소유권(move가 기본), 빌림(&·&mut과 한 번에 하나 규칙), 수명(댕글링을 컴파일 타임에 거절)을 C++ 대응으로 잡고, borrow checker 에러를 '적이 아니라 선생'으로 읽는 법."
date        : 2026-07-12 11:10:00 +0900
updated     : 2026-07-24 12:00:00 +0900
categories  : [rust]
tags        : [roadmap, rust]
pin         : false
hidden      : false
---

> [Rust 학습 로드맵](/posts/rust/2026-07-12-rust-roadmap/)의 **② 핵심(뼈대, 최우선)** 단계입니다. 앞 글: [① 문법·불변성·cargo](/posts/rust/2026-07-12-rust-basics-cargo-immutability/)

**Rust의 전부입니다.** 학습 시간의 절반을 여기 쓸 각오로 들어갑니다. 여기서 막히면 이후 모든 게 막히고, 여기를 넘으면 나머지는 빠릅니다. 다행히 C++ 배경이 가장 크게 빛나는 구간이기도 합니다 — 소유권·빌림은 결국 C++의 이동 시맨틱·RAII·`unique_ptr`/`shared_ptr`·댕글링 포인터 문제를 **컴파일러가 강제하는 버전**이거든요. 소유권이 하나의 메모리 관리 모델로서 GC·수동 관리와 어디에 서 있는지는 [메모리 관리 모델](/posts/concept/2026-07-12-memory-management-models/)을 함께 보세요.

## 소유권 — move가 기본 동작

Rust의 규칙은 세 문장입니다.

1. 모든 값에는 **소유자(owner)가 하나** 있다.
2. 소유자가 스코프를 벗어나면 값은 자동 해제된다(RAII와 동일).
3. 소유권은 **이동(move)**한다 — 대입·전달하면 원본은 무효화된다.

3번이 C++과 갈리는 핵심입니다. C++에서 `std::move`는 **수동·선택**이지만, Rust에서는 **이동이 기본**입니다.

```rust
let s1 = String::from("hello");
let s2 = s1;              // 이동 — s1의 소유권이 s2로 넘어감
println!("{}", s1);      // 컴파일 에러! s1은 이미 무효
//  → borrow of moved value: `s1`
```

C++이라면 `s2 = s1`은 복사(깊은 복사)입니다. Rust는 기본이 이동이라 `s1`이 무효화됩니다. 힙 데이터를 조용히 복제하는 비용을 원천 차단하려는 설계입니다. 정말 복제가 필요하면 명시적으로 `s1.clone()`을 부릅니다.

> `i32`처럼 `Copy` 트레이트를 구현한 타입은 대입해도 복사되므로 `let a = 5; let b = a;` 뒤에 `a`를 쓸 수 있습니다. 기준은 힙/스택 위치가 아니라 **타입이 `Copy`를 구현했는가**입니다. 힙을 쓰지 않아도 destructor가 필요하거나 의미상 복제가 부적절하면 non-`Copy`일 수 있습니다.
{: .prompt-tip }

## 빌림 — &와 &mut, 그리고 "한 번에 하나"

소유권을 넘기지 않고 잠깐 쓰고 싶을 때 **빌립니다(borrow)**. `&`는 불변 참조, `&mut`은 가변 참조입니다. C++의 `const T&` / `T&`에 대응하지만, Rust는 규칙을 **컴파일러가 강제**합니다.

```rust
fn len(s: &String) -> usize { s.len() }   // 빌리기만 — 소유권 안 가져감

let s = String::from("hi");
let n = len(&s);         // &s로 빌려줌
println!("{} {}", s, n); // s는 여전히 유효 — 소유권을 안 뺏겼으니까
```

핵심 규칙 하나만 기억하면 됩니다.

> **불변 참조(`&`)는 여러 개 동시에 가능하지만, 가변 참조(`&mut`)는 동시에 딱 하나. 그리고 가변 참조가 살아 있는 동안 불변 참조도 못 만든다.**

```rust
let mut s = String::from("hi");
let r1 = &s;        // 불변 빌림 OK
let r2 = &s;        // 불변 빌림 여러 개 OK
let w = &mut s;     // 컴파일 에러! 불변 참조들이 살아있는데 가변으로 빌림
//  → cannot borrow `s` as mutable because it is also borrowed as immutable
```

이 규칙은 **safe Rust에서 데이터 레이스가 생길 수 있는 별칭 조합을 컴파일 타임에 차단**합니다. 여러 스레드가 공유 가변 상태를 써야 한다면 `Mutex`·`RwLock`·atomic 같은 런타임 동기화는 여전히 필요합니다. `unsafe` 코드는 `Send`/`Sync`와 별칭 계약을 직접 지켜야 하며, 이를 어겨 데이터 레이스를 만들면 undefined behavior입니다.

## 수명(lifetime) — 댕글링을 컴파일 타임에 거절

참조는 원본보다 오래 살 수 없습니다. C++의 댕글링 포인터(해제된 메모리를 가리키는 참조, 런타임 UB)를 Rust는 **컴파일 단계에서 거절**합니다.

```rust
fn dangle() -> &String {     // 컴파일 에러
    let s = String::from("hi");
    &s      // s는 함수 끝에서 해제되는데 그 참조를 반환?
}           // → missing lifetime specifier / returns a reference to local
```

대부분의 수명은 컴파일러가 **자동 추론**하므로 `'a` 문법을 직접 쓸 일은 초반엔 드뭅니다. 다만 참조를 여럿 받아 참조를 반환하는 함수처럼 컴파일러가 관계를 확신 못 할 때, `fn longest<'a>(x: &'a str, y: &'a str) -> &'a str`처럼 **"반환값은 이 입력들만큼 산다"고 이름표를 달아** 알려줍니다. `'a`는 수명을 *만드는* 게 아니라 *관계를 서술*하는 주석이라는 점을 기억하세요.

## borrow checker는 적이 아니라 선생이다

"borrow checker와 싸운다"는 바로 이 구간입니다. 가장 흔한 두 에러:

- **use after move** — 값을 옮긴 뒤 원본을 또 씀. → 정말 두 곳에서 써야 하면 `.clone()`, 아니면 빌림(`&`)으로 바꾸기.
- **mutable borrow 충돌** — 불변 참조가 살아 있는데 가변으로 빌림. → 참조의 스코프를 줄이거나(먼저 다 쓰고 나서 가변 빌림), 구조를 다시 보기.

여기서 태도가 학습 속도를 가릅니다. **Rust 컴파일러 에러는 원인과 해결책을 함께 알려줍니다.** `moved here` / `borrow later used here`로 문제가 생긴 두 지점을 짚어 주고, 종종 `help:` 줄에 고치는 법까지 제시합니다. 에러를 밀어내려 하지 말고 **읽으면서 배우는 게** 이 구간을 가장 빨리 넘는 길입니다. rustlings의 `move_semantics`·`borrowing` 연습을 반복하면 손에 붙습니다.

## C++ 대응으로 정리

| C++ | Rust | 핵심 차이 |
|---|---|---|
| `std::move` (수동·선택) | 이동(**기본 동작**) | 대입/전달이 곧 이동. 원본 무효화 |
| RAII 소멸자 | 소유권 drop | 같은 개념을 컴파일러가 강제 |
| `const T&` | `&T` (불변 빌림) | 기본이 불변. 규칙을 컴파일러가 검사 |
| `T&` (가변) | `&mut T` | "가변 참조는 동시에 하나" 강제 |
| 댕글링 포인터 (런타임 UB) | 수명(lifetime) | 컴파일 타임에 거절 |
| 복사 생성자 | `.clone()` (명시) | 복제는 반드시 눈에 보이게 |

## 자주 막히는 지점

- **이동을 복사로 착각** — C++ 습관으로 `let b = a;` 뒤에 `a`를 씀. non-`Copy` 타입이면 `a`는 무효. `Copy` 구현 타입만 예외이며 힙/스택 여부가 기준은 아닙니다.
- **`.clone()` 남발** — 에러를 없애려 아무 데나 `clone()`을 박으면 컴파일은 되지만 Rust를 안 쓰는 것과 같습니다. **먼저 빌림(`&`)으로 풀 수 있는지** 보세요. 대부분 됩니다.
- **참조를 저장해 두려는 설계** — struct 필드에 참조를 담으면 수명 주석이 번져 복잡해집니다. 초반엔 **소유하는 값(`String`, `Vec`)을 담는 게** 훨씬 편합니다.

## 통과 기준

- use-after-move와 mutable borrow 충돌 에러를 **스스로 진단하고 고칠 수 있다.**
- `&`(빌림)와 이동, `.clone()`(복제)을 언제 쓰는지 구분할 수 있다.
- 여기까지 왔으면 Rust에서 **가장 큰 산을 넘은 것**입니다.

다음은 [③ struct·enum·match](/posts/rust/2026-07-12-rust-struct-enum-match/)입니다. Rust의 타입 시스템, 특히 데이터를 품는 enum과 완전성을 강제하는 패턴 매칭으로 들어갑니다 — `Option`/`Result`가 여기서 나옵니다.

## Reference

- [The Rust Book Ch.4 — Understanding Ownership](https://doc.rust-lang.org/book/ch04-00-understanding-ownership.html) — 이 단계의 본체.
- [rustlings — move_semantics / borrowing](https://github.com/rust-lang/rustlings) — 손으로 borrow checker 넘기기. 병행 필수.
- [Rust by Example — Ownership and moves](https://doc.rust-lang.org/rust-by-example/scope/move.html)
- [메모리 관리 모델](/posts/concept/2026-07-12-memory-management-models/) — 소유권이 GC·수동 관리와 어디에 서 있는지
