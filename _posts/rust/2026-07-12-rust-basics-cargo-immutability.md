---
title       : 기초 ① 문법·불변성·cargo — C++과 다른 기본 태도
description : "Rust의 기본 태도를 잡는 단계. let은 기본 불변이고 mut로만 가변, if·블록이 값을 반환하는 표현식 기반 문법, 같은 이름을 다시 선언하는 shadowing, 그리고 빌드·테스트·의존성을 하나로 묶은 cargo까지. C++의 기본 가변·문장 기반 습관과 무엇이 다른지 예제로 정리한다."
date        : 2026-07-12 11:05:00 +0900
updated     : 2026-07-12 11:05:00 +0900
categories  : [rust]
tags        : [roadmap, rust]
pin         : false
hidden      : false
---

> [Rust 학습 로드맵](/posts/rust/2026-07-12-rust-roadmap/)의 **① 기초** 단계입니다.

이 단계의 목표는 문법 암기가 아니라 **C++과 다른 Rust의 기본 태도**를 잡는 것입니다. 불변이 기본이라는 것, 거의 모든 것이 값을 반환하는 표현식이라는 것 — 이 두 감각이 이후 소유권(②)으로 자연스럽게 이어집니다.

## let은 기본 불변

C++에서 변수는 기본 가변이고 `const`로 잠급니다. Rust는 **정반대** — `let`으로 선언한 변수는 **기본 불변**이고, 바꾸려면 `mut`를 명시해야 합니다.

```rust
let x = 5;
x = 6;              // 컴파일 에러! x는 불변
//  → cannot assign twice to immutable variable `x`

let mut y = 5;
y = 6;              // OK — mut로 선언했으니 가변
```

"바꿀 수 있는 것"을 예외로 두는 이 태도가 Rust 전반에 깔립니다. 대부분의 값은 실제로 안 바뀌므로, 불변을 기본으로 두면 "여기서 이 값이 바뀌나?"를 걱정할 필요가 없어집니다. ②의 빌림 규칙(`&` vs `&mut`)도 이 연장선입니다.

## 표현식 기반 — if·블록이 값을 반환

Rust에서는 대부분이 **값을 반환하는 표현식**입니다. C++의 삼항 연산자 없이 `if`가 그 자리를 대신합니다.

```rust
let n = if cond { 10 } else { 20 };   // if가 값을 반환

let y = {
    let a = 2;
    a * a           // 세미콜론 없음 → 이 블록의 값 (4)
};

fn square(x: i32) -> i32 {
    x * x           // return 생략 — 마지막 표현식이 반환값
}
```

핵심은 **세미콜론의 유무**입니다. 세미콜론이 없으면 그 줄이 블록의 "값"이 되고, 붙이면 값을 버리는 문장이 됩니다. 함수 마지막 줄에 `return`을 안 쓰는 관용구가 여기서 나옵니다.

## shadowing — 같은 이름 다시 선언

`let`으로 **이미 있는 이름을 다시 선언**할 수 있습니다. 재대입(`=`)이 아니라 새 변수를 만드는 것이라, 타입까지 바꿀 수 있습니다.

```rust
let spaces = "   ";          // &str
let spaces = spaces.len();   // usize — 같은 이름, 다른 타입
```

C++에는 없는 개념입니다. "가변으로 만들지 않고도 값을 단계적으로 변형"할 때 씁니다 — 불변을 유지한 채로요. `mut`와 헷갈리기 쉬운데, `mut`는 같은 변수를 바꾸는 것이고 shadowing은 **새 변수로 덮는 것**입니다.

## cargo — 하나로 통합된 도구

Rust의 도구 경험은 언어의 강점입니다. C++이 CMake + 패키지 매니저 + 테스트 러너를 조합하던 걸 `cargo` 하나가 다 합니다(자세한 건 [⑩ 도구](/posts/rust/2026-07-12-rust-tooling/)에서).

```bash
cargo new myapp       # 프로젝트 생성 (Cargo.toml + src/main.rs)
cargo run             # 빌드 후 실행
cargo build           # 빌드만
cargo test            # 테스트
cargo add rand        # 의존성 추가
```

`Cargo.toml`에 의존성을 적고 `cargo build`하면 crates.io에서 받아 빌드까지 한 번에 됩니다.

## C++ 전환으로 정리

| C++ | Rust | 핵심 차이 |
|---|---|---|
| 기본 가변, `const`로 잠금 | 기본 불변, `mut`로 가변 | 태도가 정반대 |
| 삼항 `?:`, 문장 기반 | `if`가 값을 반환 (표현식) | 세미콜론 유무가 값을 가름 |
| (없음) | shadowing | 불변 유지하며 이름 재사용 |
| CMake + Conan/vcpkg | `cargo` | 빌드·의존성·테스트 통합 |

## 자주 막히는 지점

- **기본 불변을 잊음** — C++ 습관으로 값을 바꾸려다 `cannot assign twice` 에러. `mut`를 붙여야 합니다. 다만 컴파일러가 정확히 그 지점을 짚어 줍니다.
- **세미콜론 하나로 반환값이 사라짐** — 함수 마지막 줄에 세미콜론을 붙이면 값이 아니라 문장이 되어 "expected `i32`, found `()`" 에러. 반환하려면 세미콜론을 빼세요.
- **shadowing과 `mut` 혼동** — 값을 진짜 바꾸는 거면 `mut`, 새 값으로 덮으며 이름만 재사용하는 거면 shadowing.

## 통과 기준

- `cargo new`로 만든 프로젝트를 빌드·실행하고, 불변/가변(`mut`)의 차이를 설명할 수 있다.
- `if`·블록이 값을 반환하는 표현식임을 이해하고, 세미콜론 유무의 의미를 안다.

다음은 [② 소유권·빌림·수명](/posts/rust/2026-07-12-rust-ownership-borrow-lifetime/)입니다. **Rust의 전부**이자 borrow checker와 싸우는 구간으로, 학습 시간의 절반을 여기 씁니다.

## Reference

- [The Rust Book Ch.1–3](https://doc.rust-lang.org/book/ch01-00-getting-started.html) — 설치·cargo·기본 문법의 정본.
- [rustlings — variables / functions](https://github.com/rust-lang/rustlings) — 손으로 익히기.
- [Rust by Example — Variable Bindings](https://doc.rust-lang.org/rust-by-example/variable_bindings.html)
