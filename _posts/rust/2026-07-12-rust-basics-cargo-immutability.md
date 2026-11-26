---
title       : "Rust 기본 문법 — 불변성과 표현식, C++과 다른 기본값"
description : "Rust의 불변 기본값과 표현식 중심 문법을 C++의 가변 변수·문장 중심 흐름과 비교한다. 반복 문법 강의 대신, Rust 코드를 읽을 때 초반에 낯설어지는 규칙만 요약한다."
date        : 2026-07-12 11:05:00 +0900
updated     : 2026-11-27 16:00:00 +0900
categories  : [rust]
tags        : [rust]
pin         : false
hidden      : false
---

> 기본 문법과 Cargo 입문은 [The Rust Programming Language](https://doc.rust-lang.org/book/)와 [Rustlings](https://rustlings.rust-lang.org/)에서 연습하고, 이 글에서는 C++ 배경에서 특히 낯선 두 가지 문법 규칙만 다룬다. 전체 안내는 [Rust 학습 지도](./2026-07-12-00-rust-roadmap.md)를 참고한다.

## 변수는 기본 불변

Rust의 `let`은 기본적으로 불변이다. 값을 바꾸려면 선언에 `mut`를 붙인다.

```rust
let count = 3;
// count = 4; // 컴파일 오류

let mut total = 3;
total = 4; // 허용
```

C++에서는 일반 지역 변수를 기본적으로 다시 대입할 수 있다. Rust는 바뀌지 않는 값을 기본으로 두고, 변경이 필요한 곳에만 `mut`를 표시한다. 그래서 코드를 읽을 때 값이 바뀔 수 있는 지점이 더 잘 드러난다.

다만 불변 binding이 항상 깊은 불변성을 뜻하는 것은 아니다. 값 안에 interior mutability가 있으면 그 타입의 규칙에 따라 내부 상태가 바뀔 수 있다. 여기서 말하는 기본 불변은 binding을 다시 대입할 수 있는지에 관한 규칙이다.

## 블록과 if는 값을 만드는 표현식

Rust의 블록은 마지막 표현식을 값으로 돌려줄 수 있다. 마지막 줄에 세미콜론을 붙이면 그 값을 버리고 단위 값 `()`을 만든다.

```rust
let doubled = {
    let value = 21;
    value * 2
};

let label = if doubled > 0 { "positive" } else { "zero" };
```

이 때문에 많은 함수에서 `return`을 쓰지 않고 마지막 표현식을 반환한다.

```rust
fn square(x: i32) -> i32 {
    x * x
}
```

C++의 문장과 표현식 구분을 그대로 기대하면 세미콜론 하나가 반환값을 없애는 이유가 낯설 수 있다. 컴파일 오류에서 `expected T, found ()`를 만나면 마지막 표현식에 세미콜론을 붙였는지 확인한다.

## 이름을 다시 선언하는 shadowing

같은 이름으로 새 binding을 만들 수 있다. 이는 기존 변수를 바꾸는 `mut` 대입과 다르다.

```rust
let input = "42";
let input: u32 = input.parse().expect("숫자여야 함");
```

새 binding은 타입을 바꿀 수 있고, 이전 binding은 새 선언 이후 가려진다. 기존 값 자체를 변경하는 것은 아니다.

## C++과 비교해 기억할 점

| C++에서 익숙한 점 | Rust |
|---|---|
| 지역 변수는 기본적으로 재대입 가능 | `let`은 불변, 변경할 때 `mut` |
| 세미콜론으로 문장을 끝냄 | 블록의 마지막 표현식은 값이 될 수 있음 |
| 같은 스코프에서 같은 이름 재선언은 제한적 | `let`으로 shadowing 가능 |

## 다음에 볼 자료

- 기본 문법부터 소유권·타입·에러 처리까지: [The Rust Programming Language](https://doc.rust-lang.org/book/)
- 명령행에서 문제를 풀며 문법 익히기: [Rustlings](https://rustlings.rust-lang.org/)
- 프로젝트·Cargo·module 도구: [Rust Tooling 참고 글](./2026-07-12-rust-tooling.md)
