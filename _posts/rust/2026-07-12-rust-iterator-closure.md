---
title       : 관용구 ⑦ 반복자·클로저 — Rust다움의 본체
description : "C++ 대응이 흐릿한, Rust에서 새로 배우는 축. 여길 건너뛰면 'C++을 Rust 문법으로 쓴' 코드가 된다. 환경 캡처 방식이 소유권과 맞물리는 클로저(Fn/FnMut/FnOnce), for문 대신 iter().map().filter().collect()로 짜는 lazy하고 zero-cost한 반복자 체인까지. 인덱스 루프 습관을 교정한다."
date        : 2026-07-12 11:35:00 +0900
updated     : 2026-07-12 11:35:00 +0900
categories  : [rust]
tags        : [roadmap, rust]
pin         : false
hidden      : false
---

> [Rust 학습 로드맵](/posts/rust/2026-07-12-rust-roadmap/)의 **⑦ 관용구(고유)** 단계입니다. 앞 글: [⑥ trait·제네릭](/posts/rust/2026-07-12-rust-trait-generics/)

**C++ 대응이 흐릿한, Rust에서 새로 배우는 축입니다.** 문법만 알고 여길 건너뛰면 "C++을 Rust 문법으로 옮긴" 코드가 나옵니다. Rust 코드가 실제로 어떻게 생겼는지가 여기서 갈립니다. 클로저의 일반 개념은 [클로저란 무엇인가](/posts/concept/2026-07-12-closure/)에서 다룹니다.

## 클로저 — 캡처가 소유권과 맞물린다

클로저는 익명 함수입니다. C++ 람다에 대응하지만, **환경을 어떻게 캡처하느냐가 ②의 소유권과 정확히 맞물립니다.**

```rust
let factor = 3;
let times = |x| x * factor;   // factor를 캡처. 타입은 대개 추론
println!("{}", times(5));     // 15
```

캡처 방식에 따라 클로저가 구현하는 trait이 셋으로 나뉩니다.

| trait | 캡처 방식 | C++ 람다 대응 |
|---|---|---|
| `Fn` | 불변 빌림 (`&`) | `[&]` 읽기만 |
| `FnMut` | 가변 빌림 (`&mut`) | `[&]` 수정 |
| `FnOnce` | 소유 이동 (한 번만 호출) | `[=]` / 이동 캡처 |

```rust
let mut count = 0;
let mut inc = || count += 1;   // count를 &mut로 캡처 → FnMut

let data = vec![1, 2, 3];
let consume = move || println!("{:?}", data);   // move로 소유권째 캡처 → FnOnce
```

`move` 키워드를 붙이면 캡처한 값의 **소유권을 클로저 안으로 가져갑니다** — goroutine이나 스레드에 넘길 때(⑨) 필수입니다. "이 클로저가 환경을 빌리나, 가져가나"가 곧 소유권 규칙이라, ②를 이해했으면 자연히 따라옵니다.

## 반복자 — for문을 대체하는 체인

Rust의 관용적 반복은 인덱스 `for`가 아니라 **반복자 체인**입니다.

```rust
let nums = vec![1, 2, 3, 4, 5, 6];

let sum_of_even_squares: i32 = nums.iter()
    .filter(|&&x| x % 2 == 0)   // 짝수만
    .map(|&x| x * x)            // 제곱
    .sum();                     // 합계 → 56

let doubled: Vec<i32> = nums.iter().map(|x| x * 2).collect();   // 새 Vec로 수집
```

C++의 `<algorithm>` + 범위 for를 하나의 흐르는 체인으로 쓰는 셈입니다. 두 가지 특성이 핵심입니다.

- **lazy** — `map`·`filter`는 즉시 계산하지 않습니다. `.sum()`·`.collect()` 같은 **소비자(consumer)**가 붙어야 비로소 한 번의 순회로 전부 처리됩니다. 중간 배열을 만들지 않습니다.
- **zero-cost** — 이 추상화는 손으로 쓴 인덱스 루프와 **동일한 기계어**로 컴파일됩니다. 읽기 좋으면서 느리지 않습니다. `Iterator` trait(⑥) 하나로 이 모든 게 굴러갑니다.

`collect()`는 "어디로 모을지"를 타입으로 정합니다 — `Vec`, `HashMap`, `String`, `Result` 등. 처음엔 타입 추론이 헷갈리는데, 반환 타입이나 터보피시(`collect::<Vec<_>>()`)로 알려 주면 됩니다.

## C++ 전환으로 정리

| C++ | Rust | 핵심 차이 |
|---|---|---|
| 람다 `[&]`/`[=]` | 클로저 `Fn`/`FnMut`/`FnOnce` | 캡처 방식이 소유권과 맞물림 |
| 이동 캡처 `[x = std::move(x)]` | `move` 클로저 | 소유권째 가져가기 |
| `<algorithm>` + 범위 for | `iter().map().filter()` 체인 | lazy·zero-cost, 흐르는 체인 |
| `std::transform`/`copy_if` | `map`/`filter` | 이름이 더 직관적, 연결됨 |
| `std::accumulate` | `fold` / `sum` | 동일 개념 |

## 자주 막히는 지점

- **인덱스 `for` 루프 습관** — C++ 감각으로 `for i in 0..v.len() { v[i] }`를 쓰게 됩니다. Rust에서는 반복자 체인이 대부분 더 짧고 안전하고(경계 검사 불필요) 빠릅니다.
- **`iter()` vs `into_iter()` vs `iter_mut()`** — `iter()`는 `&T`(빌림), `into_iter()`는 `T`(소유권 이동), `iter_mut()`는 `&mut T`. 뒤에서 원본을 또 쓸 거면 `iter()`.
- **`collect()` 타입 추론 실패** — "어디로 모을지" 못 정하면 에러. 반환 타입 명시나 터보피시로.
- **lazy를 잊고 소비자 누락** — `map`만 쓰고 `collect`/`sum`을 안 붙이면 아무 일도 안 일어납니다(경고가 뜸).

## 통과 기준

- 인덱스 `for` 루프로 짠 로직을 `map`/`filter`/`collect` 체인으로 바꿔 쓸 수 있다.
- 클로저의 `Fn`/`FnMut`/`FnOnce`가 캡처 방식(빌림·가변 빌림·이동)과 어떻게 대응하는지 설명할 수 있다.
- 반복자가 왜 lazy하고 zero-cost인지 말할 수 있다.

여기까지 오면 "Rust식 사고"가 붙기 시작한 것입니다. 다음은 [⑧ 스마트 포인터](/posts/rust/2026-07-12-rust-smart-pointers/)로, ②의 소유권 규칙이 빡빡할 때 푸는 도구입니다(C++ 스마트 포인터와 거의 1:1).

## Reference

- [The Rust Book Ch.13](https://doc.rust-lang.org/book/ch13-00-functional-features.html) — 클로저·반복자의 정본.
- [rustlings — iterators / closures](https://github.com/rust-lang/rustlings)
- [클로저란 무엇인가](/posts/concept/2026-07-12-closure/) — 언어 무관 클로저 개념.
