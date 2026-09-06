---
title       : "Rust 학습 로드맵 — 소유권에서 Rust다운 API까지"
description : "C++ 경험을 발판으로 쓰되 Rust를 같은 의미론으로 등치하지 않고, 소유권·빌림·수명, enum·match, Result·Option, trait·generics, iterator·closure를 핵심 줄기로 잡고 smart pointer·concurrency·tooling·unsafe를 Branch로 분리한 학습 지도."
date        : 2026-07-12 11:00:00 +0900
updated     : 2026-09-06 13:25:00 +0900
categories  : [rust]
tags        : [roadmap, rust]
pin         : false
hidden      : false
---

C++ 경험은 Rust를 배우는 좋은 발판이지만 **Rust ownership을 C++ RAII·move·smart pointer의 “컴파일러 강제판”으로 등치하면 오히려 중요한 차이를 놓친다.**

둘은 객체 수명과 자원 관리라는 문제를 공유하지만 Rust는 소유·빌림·수명 관계를 언어의 정적 규칙으로 다룬다.

```text
C++ 경험
→ lifetime·RAII·move 문제를 떠올리는 발판

Rust 학습
→ ownership / borrow / lifetime이라는 별도 언어 모델
→ 그 모델 위에서 API를 설계
```

> **검토 기준:** Rust 1.98.x, Edition 2024. 2026년 9월 현재 stable 1.98 계열을 기준으로 하되, 이 Roadmap은 특정 point release보다 stable Rust의 의미론을 중심으로 본다.

## 한눈에 보기

| 구역 | 핵심 질문 | 우선순위 |
|---|---|---|
| 1. 기초 | expression·immutability·Cargo의 기본 계약은 무엇인가 | 필수 |
| 2. ownership | 값은 누가 소유하고 언제 move/borrow되는가 | 필수 · 뼈대 |
| 3. data model | struct·enum·match로 상태를 어떻게 표현하나 | 필수 |
| 4. collections/string | owned data와 borrowed view를 어떻게 구분하나 | 필수 |
| 5. failure | `Result`·`Option`·`?`로 실패/부재를 어떻게 타입에 넣나 | 필수 |
| 6. abstraction | trait·generic·dyn은 어떤 dispatch/constraint 모델인가 | 필수 |
| 7. iterator·closure | ownership과 함수형 조합이 어떻게 만나는가 | 필수 · Rust 고유 |
| Branch A | `Box`·`Rc`·`RefCell`이 ownership model을 어떻게 확장하나 | 나중 |
| Branch B | `Send`/`Sync`·thread·async에서 소유권이 어떻게 작동하나 | 나중 |
| Cross-cutting | Cargo·crate·module Tooling은 언제 쓰나 | 처음부터 계속 |
| Appendix | macro·unsafe·FFI | 필요할 때 |

## 1. 기초 — expression·immutability·Cargo

| 글 | 역할 |
|---|---|
| [문법·불변성·Cargo](./2026-07-12-rust-basics-cargo-immutability.md) | expression-oriented syntax, `let`/`mut`, shadowing, project 기본 흐름 |

Cargo는 마지막 Tool 단계가 아니라 여기서부터 계속 사용한다.

```text
cargo new
→ code
→ cargo check / test / run
→ dependency·crate 관리
```

## 2. ownership·borrow·lifetime — 전체 학습의 뼈대

| 글 | 역할 |
|---|---|
| [소유권·빌림·수명](./2026-07-12-rust-ownership-borrow-lifetime.md) | move, `&T`/`&mut T`, lifetime을 C++과의 경계까지 포함해 설명하는 핵심 Concept |

이 Zoom-in 문서의 모델을 Roadmap의 기준으로 삼는다.

```text
non-Copy value assignment / pass-by-value
→ ownership move가 일어날 수 있음
→ 이전 binding의 사용 가능성을 compiler가 추적

&T
→ shared borrow

&mut T
→ exclusive mutable borrow

lifetime
→ reference가 유효해야 하는 관계를 정적으로 검사
```

C++ `std::move`는 rvalue로 취급하게 하는 cast이고 Rust move는 언어 의미론상의 ownership 이전이므로 같은 연산이 아니다. RAII와 `Drop`도 수명-정리 연결이라는 직관은 공유하지만 Rust의 borrow 규칙까지 포함하는 같은 제도는 아니다.

## 3. struct·enum·match — 상태를 타입으로 표현한다

| 글 | 역할 |
|---|---|
| [struct·enum·match](./2026-07-12-rust-struct-enum-match.md) | product/sum type과 exhaustive pattern matching을 Rust 코드에서 사용하는 법 |

Rust `enum`을 C/C++의 정수형 enum과 같은 좌표에서 보면 안 된다.

```text
variant마다 다른 data 보유
→ enum
→ match로 exhaustive하게 분해
→ Option / Result 같은 핵심 API의 기반
```

## 4. collection·String·&str — owned와 borrowed view

| 글 | 역할 |
|---|---|
| [컬렉션·String vs &str](./2026-07-12-rust-collections-string-str.md) | `Vec`, `HashMap`, `String`, `str`을 ownership/borrow 관점으로 연결 |

이 단계는 container 이름을 외우는 것보다 **API가 값을 소유할지 빌릴지**를 읽는 연습이다.

## 5. Result·Option·? — 실패와 부재를 타입으로

| 글 | 역할 |
|---|---|
| [error 처리 — Result·Option·?](./2026-07-12-rust-error-handling-result-option.md) | recoverable error, absence, propagation을 enum 기반 흐름으로 설명 |

```text
값이 있거나 없을 수 있음
→ Option<T>

성공하거나 실패할 수 있음
→ Result<T, E>

상위로 같은 실패 의미를 전달
→ ? operator
```

panic은 `Result`의 더 고급 버전이 아니라 다른 실패 경계다.

## 6. trait·generics — abstraction과 dispatch

| 글 | 역할 |
|---|---|
| [trait·제네릭](./2026-07-12-rust-trait-generics.md) | trait bound·generic·associated type·`dyn Trait`·orphan rule의 관계 |

여기서는 “C++ interface/template의 Rust판”이라고 끝내지 않고 다음 축을 구분한다.

```text
compile-time generic constraint
→ T: Trait
→ monomorphization 중심

runtime polymorphism
→ dyn Trait
→ trait object / dynamic dispatch
```

## 7. iterator·closure — ownership과 함수 조합

| 글 | 역할 |
|---|---|
| [반복자·클로저](./2026-07-12-rust-iterator-closure.md) | `iter`/`iter_mut`/`into_iter`, adapter chain, closure capture와 `Fn` 계열을 함께 설명 |

이 단계가 중요한 이유는 문법이 특별해서가 아니라 **iteration 방식 자체가 ownership 선택과 연결되기 때문**이다.

```text
& collection을 순회
→ iter()

&mut collection을 순회
→ iter_mut()

값을 소비하며 순회
→ into_iter()
```

## Branch A — smart pointer와 interior mutability

| 글 | 역할 |
|---|---|
| [Box·Rc·RefCell](./2026-07-12-rust-smart-pointers.md) | heap indirection·shared ownership·runtime borrow checking을 각각 분리 |

`Box`, `Rc`, `RefCell`은 “더 좋은 pointer”의 단계가 아니라 **ownership topology를 바꾸는 서로 다른 도구**다.

## Branch B — concurrency

| 글 | 역할 |
|---|---|
| [thread·Send/Sync·async](./2026-07-12-rust-concurrency.md) | thread ownership, `Arc<Mutex<_>>`, `Send`/`Sync`, async task의 역할 경계 |

일반 동시성 원리는 Knowledge에 두고 이 문서는 **Rust type system이 thread boundary에서 어떤 계약을 강제하는지**에 집중한다.

## Cross-cutting — Cargo·crate·module Tooling

| 글 | 역할 |
|---|---|
| [Cargo·crates·모듈](./2026-07-12-rust-tooling.md) | build/test/dependency/module/package 명령을 목적별로 찾는 Tool/Reference |

이 문서는 “⑩ 마지막 단계”가 아니다. 1단계부터 계속 사용하고, package/workspace 구조가 복잡해질 때 다시 Zoom-in한다.

## Appendix — macro·unsafe·FFI

이 주제들은 Rust를 처음 읽고 쓰는 줄기의 필수 후속 단계가 아니다.

```text
반복되는 syntax/code generation이 필요하다
→ macro_rules! / derive / proc macro

safe abstraction 아래에서 raw pointer·FFI·unchecked operation이 필요하다
→ unsafe

다른 ABI / C library와 경계를 만든다
→ FFI
```

`unsafe`는 “안전 검사를 끄는 모드”라고 단순화하지 않는다. 제한된 unsafe operation의 soundness 조건을 작성자가 책임지는 경계다.

## 일반 Concept과의 경계

메모리 관리·값/참조 의미론·다형성·동시성 같은 공통 Concept은 정보관리기술사 Knowledge가 정본이다. Rust Blog 문서는 **ownership·borrow checker·trait·iterator처럼 Rust에서 그 개념이 구체적으로 어떻게 나타나는지**를 다룬다.

## 어디서 시작할까

```text
Rust가 처음이다
→ 기초
→ ownership
→ enum/match
→ collection/string
→ Result/Option
→ trait/generic
→ iterator/closure

shared ownership / interior mutability가 필요하다
→ smart pointer Branch

thread / async를 다룬다
→ concurrency Branch

Cargo 명령이나 crate/module 구조가 헷갈린다
→ Tooling 문서를 그 시점에 참조
```

> **Rust의 줄기는 ownership을 중심으로 data model·failure·abstraction·iteration이 연결되는 구조다. C++ 경험은 문제를 알아보는 발판이지만 Rust의 move·borrow·lifetime을 같은 의미론으로 치환하지 않는다. Cargo는 마지막 단계가 아니라 전 과정에 걸친 Tooling이다.**
