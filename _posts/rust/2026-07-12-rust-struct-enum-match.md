---
title       : 타입 ③ struct·enum·match — 데이터를 품는 enum
description : "Rust 타입 시스템은 C++보다 강력하고 특히 enum이 다르다. 데이터는 struct, 동작은 impl 블록. 각 variant가 데이터를 품는 대수적 타입 enum(Option·Result가 여기서 나온다), 그리고 모든 경우를 강제로 다루게 하는 완전성 검사 패턴 매칭 match·if let까지. enum을 '이름 붙은 정수'로만 보던 C++ 습관을 교정한다."
date        : 2026-07-12 11:15:00 +0900
updated     : 2026-07-12 11:15:00 +0900
categories  : [rust]
tags        : [roadmap, rust]
pin         : false
hidden      : false
---

> [Rust 학습 로드맵](/posts/rust/2026-07-12-rust-roadmap/)의 **③ 타입** 단계입니다. 앞 글: [② 소유권·빌림·수명](/posts/rust/2026-07-12-rust-ownership-borrow-lifetime/)

Rust의 타입 시스템은 C++보다 강력하고, 특히 **enum이 차원이 다릅니다**. 이 장에서 배우는 enum + 패턴 매칭이 다음 단계인 에러 처리(⑤)의 `Option`/`Result`를 떠받칩니다.

## struct와 impl — 데이터와 동작 분리

Go와 마찬가지로 Rust에도 클래스가 없습니다. 데이터는 `struct`, 동작은 `impl` 블록에 모읍니다.

```rust
struct Rect { width: f64, height: f64 }

impl Rect {
    fn new(w: f64, h: f64) -> Self { Rect { width: w, height: h } }  // 연관 함수
    fn area(&self) -> f64 { self.width * self.height }               // 메서드 (&self)
}

let r = Rect::new(3.0, 4.0);   // 연관 함수는 :: 로
println!("{}", r.area());      // 메서드는 . 으로
```

`&self`는 ②의 빌림입니다 — 메서드가 인스턴스를 불변으로 빌리는 것(`&self`), 가변으로(`&mut self`), 소유권을 가져가는 것(`self`)이 시그니처에 드러납니다. 리시버 종류가 곧 "이 메서드가 인스턴스에 뭘 하는가"를 말해 줍니다.

## enum — 데이터를 품는 합 타입

C++ enum은 "이름 붙은 정수"입니다. Rust enum은 **각 variant가 서로 다른 데이터를 품을 수 있는** 대수적 타입(sum type)입니다. 이게 결정적 차이입니다.

```rust
enum Shape {
    Circle(f64),              // 반지름 하나
    Rect { w: f64, h: f64 },  // 이름 있는 필드
    Point,                    // 데이터 없음
}

let s = Shape::Rect { w: 3.0, h: 4.0 };
```

"원이거나, 사각형이거나, 점"이라는 **상태를 타입 하나로** 표현합니다. C++이라면 태그 붙은 `union`이나 상속 계층으로 풀던 걸, Rust는 enum 하나로 안전하게 합니다. 표준 라이브러리의 `Option<T>`(값이 있거나 없거나)와 `Result<T, E>`(성공이거나 실패거나)가 바로 이 enum으로 만들어졌습니다.

## match — 완전성을 강제하는 패턴 매칭

enum을 다룰 땐 `match`로 **모든 variant를 분해**합니다. 핵심은 **완전성 검사(exhaustiveness)** — 한 경우라도 안 다루면 컴파일 에러입니다.

```rust
fn area(s: &Shape) -> f64 {
    match s {
        Shape::Circle(r) => 3.14 * r * r,       // 품은 데이터를 바로 꺼냄
        Shape::Rect { w, h } => w * h,
        Shape::Point => 0.0,
        // 하나라도 빠지면: error[E0004]: non-exhaustive patterns
    }
}
```

C++ `switch`는 `case`를 빠뜨려도 조용히 통과하지만, Rust `match`는 **빠진 경우를 컴파일러가 거절**합니다. enum에 variant를 새로 추가하면, 그걸 처리하지 않은 모든 `match`가 에러로 뜨면서 "여기도 고쳐라"라고 알려줍니다. 리팩터링 안전성이 여기서 나옵니다.

경우가 하나만 궁금하면 `match` 대신 `if let`:

```rust
if let Shape::Circle(r) = s {   // Circle일 때만
    println!("반지름 {}", r);
}
```

패턴은 가드(`if`), 바인딩, `while let`, 함수 인자 분해까지 Rust 전반에 깔립니다.

## C++ 전환으로 정리

| C++ | Rust | 핵심 차이 |
|---|---|---|
| `class` + 멤버 함수 | `struct` + `impl` | 데이터와 동작 분리 |
| `T` / `T&` / `const T&` 인자 | `self` / `&mut self` / `&self` | 리시버가 소유·빌림을 표현 |
| enum (정수) | `enum` (합 타입) | variant가 데이터를 품음 |
| 태그 union / 상속으로 상태 표현 | enum + match | 상태를 타입 하나로, 안전하게 |
| `switch` (누락 허용) | `match` (완전성 강제) | 빠진 경우를 컴파일러가 거절 |

## 자주 막히는 지점

- **enum을 "이름 붙은 정수"로만 봄** — Rust enum의 핵심은 **데이터를 품는 것**. `Option`/`Result`가 왜 enum인지 이해하면 감이 옵니다.
- **`match`에 `_` 남발** — 귀찮다고 `_ => {}`로 나머지를 뭉개면, 나중에 variant를 추가해도 컴파일러가 경고를 안 해 줍니다. 완전성 검사의 이점을 스스로 버리는 셈. 정말 관심 없는 경우만 `_`로.
- **`if let`이 맞는데 `match`를 씀** — 한 경우만 볼 거면 `if let`이 짧고 관용적.

## 통과 기준

- 데이터를 품는 enum을 정의하고, `match`로 모든 variant를 분해해 처리할 수 있다.
- `match`의 완전성 검사가 왜 리팩터링을 안전하게 하는지 설명할 수 있다.
- `if let`과 `match`를 상황에 맞게 고를 수 있다.

다음은 [④ 컬렉션·String vs &str](/posts/rust/2026-07-12-rust-collections-string-str/)입니다. Vec·HashMap과, Rust 입문자를 가장 헷갈리게 하는 `String`/`&str` 구분으로 ②의 소유권이 다시 몸에 붙는 단계입니다.

## Reference

- [The Rust Book Ch.5–6](https://doc.rust-lang.org/book/ch05-00-structs.html) — struct·enum·match의 정본.
- [rustlings — structs / enums](https://github.com/rust-lang/rustlings)
- [Rust by Example — Enums](https://doc.rust-lang.org/rust-by-example/custom_types/enum.html)
