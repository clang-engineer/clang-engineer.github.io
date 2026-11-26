---
title       : "Rust 학습 지도 — C++에서 넘어올 때 달라지는 점"
description : "Rust 문법은 공식 The Rust Programming Language와 연습 자료에서 익히고, 이 글은 C++ 배경의 개발자가 Rust에서 다시 이해해야 할 소유권·타입·오류·추상화·동시성 차이를 안내한다."
date        : 2026-07-12 11:00:00 +0900
updated     : 2026-11-27 16:00:00 +0900
categories  : [rust]
tags        : [roadmap, rust]
pin         : false
hidden      : false
permalink   : /posts/rust/2026-07-12-rust-roadmap/
---

Rust 문법과 기본 기능은 공식 **[The Rust Programming Language](https://doc.rust-lang.org/book/)**에서 익힐 수 있다. 예제를 직접 실행하며 배우고 싶다면 [Rust By Example](https://doc.rust-lang.org/rust-by-example/)이나 [Rustlings](https://rustlings.rust-lang.org/)을 함께 사용하면 된다.

한국어로 읽을 수 있는 [Rust Book 번역](https://doc.rust-kr.org/)도 있다. 이 번역은 커뮤니티 번역이며, 현재 안내문 기준으로 Rust 1.67.1과 2021 Edition을 전제로 한다. 최신 stable 영문판과 내용·버전 차이가 있을 수 있으니 새 기능이나 세부 동작은 영문판에서 확인한다.

이 블로그는 입문 교재를 다시 쓰기보다 **C++에서 익숙한 개념이 Rust에서 어떤 규칙으로 달라지는지**에 집중한다. C++ 대응은 이해를 돕는 출발점이며, 두 언어의 의미가 같다는 뜻은 아니다.

## C++에서 Rust로 옮길 때 볼 차이

| 주제 | C++에서 떠올릴 것 | Rust에서 다시 볼 점 | 관련 글 |
|---|---|---|---|
| 기본 문법 | 기본 가변 변수, 문장 중심 제어 흐름 | 불변 기본값, 표현식과 블록의 반환값 | [불변성과 표현식](./2026-07-12-rust-basics-cargo-immutability.md) |
| 메모리와 수명 | RAII, move, 참조, 스마트 포인터 | ownership·borrow·lifetime을 타입 규칙으로 검사 | [소유권·빌림·수명](./2026-07-12-rust-ownership-borrow-lifetime.md) |
| 데이터 모델 | class 계층, 정수형 enum | struct·impl, 데이터를 담는 enum, exhaustive match | [struct·enum·match](./2026-07-12-rust-struct-enum-match.md) |
| 문자열과 컬렉션 | std::string, string_view, vector | String과 &str, owned와 borrowed 값 | [컬렉션·String·&str](./2026-07-12-rust-collections-string-str.md) |
| 실패 처리 | exception | Option·Result·?와 명시적인 실패 흐름 | [Result·Option·?](./2026-07-12-rust-error-handling-result-option.md) |
| 추상화 | interface, template, concept | trait bound, 제네릭, dyn Trait의 dispatch 차이 | [trait·제네릭](./2026-07-12-rust-trait-generics.md) |
| 데이터 처리 | 반복문, 알고리즘, 람다 | iterator·closure의 조합과 캡처 소유권 | [반복자·클로저](./2026-07-12-rust-iterator-closure.md) |
| 공유와 동시성 | unique_ptr·shared_ptr, thread·mutex | Box·Rc·Arc·RefCell, Send·Sync, async 경계 | [스마트 포인터](./2026-07-12-rust-smart-pointers.md) · [동시성](./2026-07-12-rust-concurrency.md) |

## 필요한 주제부터 읽기

- Rust가 처음이면 Book이나 Rustlings에서 기본 코드를 먼저 접한다.
- 소유권 오류가 낯설면 ownership 글을 먼저 읽고, String·컬렉션·closure·스마트 포인터 글에서 그 규칙이 어떻게 반복되는지 확인한다.
- C++의 class·enum·template·exception 감각이 Rust에서 바뀌는 지점은 표에서 해당 주제를 고른다.
- 프로젝트 생성, build, test, dependency, module 명령은 [Cargo와 Rust 도구 참고 글](./2026-07-12-rust-tooling.md)에서 찾아본다.

모든 글을 순서대로 읽을 필요는 없다. Book은 Rust 전반을 처음부터 배우는 기본 교재이고, 이 글들은 **C++ 배경에서 생기는 오해와 Rust다운 설계 선택을 설명하는 보충 자료**다.
