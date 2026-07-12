---
title       : 추상화 ⑥ trait·제네릭 — 인터페이스와 템플릿을 하나로
description : "C++의 인터페이스·템플릿·concept에 해당하는 Rust 추상화의 중심. 공유 동작을 정의하는 trait, 제약을 미리 선언해 에러가 친절한 제네릭 + trait bound, 런타임 다형성(dyn)과 컴파일 타임 단형화의 트레이드오프, 그리고 라이브러리 설계에서 만나는 orphan rule까지. C++ 템플릿의 '일단 쓰고 안 되면 에러' 습관을 교정한다."
date        : 2026-07-12 11:30:00 +0900
updated     : 2026-07-12 11:30:00 +0900
categories  : [rust]
tags        : [roadmap, rust]
pin         : false
hidden      : false
---

> [Rust 학습 로드맵](/posts/rust/2026-07-12-rust-roadmap/)의 **⑥ 추상화** 단계입니다. 앞 글: [⑤ error 처리 — Result·Option·?](/posts/rust/2026-07-12-rust-error-handling-result-option/)

C++의 인터페이스·템플릿·concept에 해당하는 축입니다. Rust는 이 셋을 **trait**과 **제네릭**으로 통합합니다. 제네릭 일반론은 [제네릭과 매개변수 다형성](/posts/concept/2026-07-12-generics-parametric-polymorphism/)에서 다루고, 여기서는 Rust에서 어떻게 생겼는지에 집중합니다.

## trait — 공유 동작의 정의

`trait`은 "이런 메서드를 가진다"는 계약입니다. C++20 concept + 인터페이스에 가깝습니다.

```rust
trait Area {
    fn area(&self) -> f64;              // 구현 필수
    fn describe(&self) -> String {      // 기본 구현 제공 가능
        format!("넓이는 {}", self.area())
    }
}

impl Area for Rect {                     // Rect에 trait 구현
    fn area(&self) -> f64 { self.width * self.height }
}
```

Go의 암묵 구현과 달리 Rust는 `impl Area for Rect`로 **명시적으로** 구현을 선언합니다. 대신 어떤 타입이 어떤 trait을 만족하는지가 코드에 분명히 드러납니다. `#[derive(Debug, Clone, PartialEq)]`로 표준 trait을 자동 구현하는 것도 여기서 만납니다.

## 제네릭 + trait bound — 제약을 미리 선언

제네릭 함수·타입은 `<T>`로 타입을 인자로 받되, **그 T가 무엇을 할 수 있는지를 trait bound로 미리 선언**합니다.

```rust
fn largest<T: PartialOrd>(list: &[T]) -> &T {   // T는 비교 가능해야 함
    let mut max = &list[0];
    for x in list {
        if x > max { max = x; }   // PartialOrd 덕에 > 가 가능
    }
    max
}
```

`T: PartialOrd`가 "T는 순서 비교가 되는 타입"이라는 제약입니다. 여기가 **C++ 템플릿과 결정적으로 다른 지점**입니다. C++ 템플릿은 일단 아무 타입이나 받아 쓰다가, 안에서 `>`가 안 되면 그제야 (종종 수백 줄짜리) 에러를 뱉습니다. Rust는 **제약을 미리 선언**하므로, bound를 어기면 호출 지점에서 짧고 명확한 에러가 납니다. bound가 길어지면 `where` 절로 분리합니다.

제네릭은 **단형화(monomorphization)**됩니다 — 컴파일러가 실제 쓰인 타입마다 특화된 코드를 찍어내, 런타임 비용이 0입니다(C++ 템플릿과 동일).

## dyn — 런타임 다형성

제네릭이 컴파일 타임 다형성이라면, `dyn Trait`은 **런타임 다형성**입니다. C++의 가상 함수(vtable)에 대응합니다.

```rust
let shapes: Vec<Box<dyn Area>> = vec![       // 서로 다른 구체 타입을 한 Vec에
    Box::new(Rect { width: 2.0, height: 3.0 }),
    Box::new(Circle { radius: 1.0 }),
];
for s in &shapes { println!("{}", s.area()); }   // vtable로 동적 디스패치
```

**갈림길:** 타입이 컴파일 타임에 정해지고 성능이 중요하면 제네릭(단형화), 서로 다른 타입을 한 컬렉션에 담거나 런타임에 결정되면 `dyn`(동적 디스패치). C++의 "템플릿 vs 가상 함수"와 똑같은 트레이드오프입니다.

## orphan rule — "왜 이 trait을 못 구현하지"

라이브러리를 설계하다 만나는 규칙입니다. **trait이나 타입 중 최소 하나는 내 크레이트 것이어야** 그 조합을 구현할 수 있습니다. 남의 타입(`Vec`)에 남의 trait(`Display`)을 구현하는 건 금지됩니다 — 두 크레이트가 같은 조합을 각자 구현하면 충돌하기 때문입니다. `"cannot implement foreign trait for foreign type"`을 만나면 이 규칙입니다(우회는 newtype 패턴으로 내 타입으로 감싸기).

## C++ 전환으로 정리

| C++ | Rust | 핵심 차이 |
|---|---|---|
| 순수 가상 인터페이스 | `trait` | C++20 concept에 더 가까움 |
| 템플릿 (`template<typename T>`) | 제네릭 + trait bound | 제약을 **미리** 선언 → 친절한 에러 |
| SFINAE / concept | trait bound / `where` | 제약 표현이 언어에 내장 |
| 가상 함수 (vtable) | `dyn Trait` | 런타임 다형성. 대응 관계 명확 |
| 템플릿 특화 (코드 생성) | 단형화 | 런타임 비용 0, 동일한 원리 |

## 자주 막히는 지점

- **C++ 템플릿 습관** — "일단 제네릭으로 쓰고 보자"가 안 됩니다. 필요한 동작을 **trait bound로 미리 선언**해야 합니다. 대신 에러가 명확해집니다.
- **제네릭 vs `dyn` 혼동** — 한 컬렉션에 여러 타입을 담아야 하면 `dyn`(+`Box`), 아니면 제네릭이 더 빠르고 안전.
- **orphan rule** — 외부 타입에 외부 trait 구현 불가. newtype으로 감싸세요.
- **trait bound를 너무 좁게** — 필요 이상으로 좁은 bound는 재사용성을 깎습니다. 실제 쓰는 메서드에 맞는 최소 bound로.

## 통과 기준

- trait을 정의하고 여러 타입에 구현해, 제네릭 함수(`T: MyTrait`)로 공통 처리할 수 있다.
- 제네릭(단형화)과 `dyn`(동적 디스패치)의 트레이드오프를 설명할 수 있다.
- C++ 템플릿과 달리 제약을 미리 선언하는 이점을 말할 수 있다.

다음은 [⑦ 반복자·클로저](/posts/rust/2026-07-12-rust-iterator-closure/)입니다. C++ 대응이 흐릿한, "Rust답게" 쓰는 법의 본체로 건너뛰면 안 되는 단계입니다.

## Reference

- [The Rust Book Ch.10](https://doc.rust-lang.org/book/ch10-00-generics.html) — 제네릭·trait·수명의 정본.
- [The Rust Book Ch.18 — Trait Objects](https://doc.rust-lang.org/book/ch18-02-trait-objects.html) — `dyn`의 정본.
- [제네릭과 매개변수 다형성](/posts/concept/2026-07-12-generics-parametric-polymorphism/) — 언어 무관 제네릭 개념.
