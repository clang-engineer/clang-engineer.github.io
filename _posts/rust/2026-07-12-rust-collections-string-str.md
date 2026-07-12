---
title       : 타입 ④ 컬렉션·String vs &str — 소유권이 다시 붙는 곳
description : "Vec·HashMap은 C++ 컨테이너 대응이라 쉽지만, String과 &str의 구분이 Rust 입문자를 가장 헷갈리게 한다. String(소유·힙)과 &str(빌린 문자열 슬라이스)의 차이는 ②의 소유권과 직결되고, '받을 땐 &str로 빌리고 줄 때만 String으로 소유'가 소유권 기반 API 설계의 첫 감각이다. 함수 인자를 뭘로 받을지까지 정리한다."
date        : 2026-07-12 11:20:00 +0900
updated     : 2026-07-12 11:20:00 +0900
categories  : [rust]
tags        : [roadmap, rust]
pin         : false
hidden      : false
---

> [Rust 학습 로드맵](/posts/rust/2026-07-12-rust-roadmap/)의 **④ 타입** 단계입니다. 앞 글: [③ struct·enum·match](/posts/rust/2026-07-12-rust-struct-enum-match/)

Vec·HashMap은 C++ 컨테이너와 거의 1:1이라 금방 익숙해집니다. 이 장의 진짜 주제는 **`String`과 `&str`의 구분** — Rust 입문자를 가장 헷갈리게 하는 지점이자, ②의 소유권이 문자열을 통해 다시 몸에 붙는 곳입니다.

## Vec·HashMap — C++ 컨테이너 대응

```rust
let mut v: Vec<i32> = Vec::new();
v.push(3);
v.push(7);
for x in &v { println!("{}", x); }   // &v로 빌려서 순회 (소유권 안 뺏김)

use std::collections::HashMap;
let mut scores = HashMap::new();
scores.insert("alice", 10);
if let Some(s) = scores.get("alice") { ... }   // get은 Option을 반환
```

`Vec`은 `std::vector`, `HashMap`은 `std::unordered_map`에 대응합니다. 다른 점은 조회가 **`Option`을 반환**한다는 것(③) — 없는 키를 조용히 만들지 않고, "있을 수도 없을 수도"를 타입으로 강제합니다. 그리고 `for x in &v`처럼 **빌려서** 순회하지 않으면 컬렉션의 소유권이 넘어가 이후 못 씁니다(②).

## String vs &str — 소유 vs 빌림

문자열이 두 종류입니다. 이 구분이 ②의 소유권을 그대로 문자열에 옮긴 것입니다.

| 타입 | 정체 | C++ 대응 |
|---|---|---|
| `String` | **소유**하는, 힙에 있는 가변 문자열 | `std::string` |
| `&str` | **빌린** 문자열 슬라이스(읽기 전용 뷰) | `std::string_view` |

```rust
let owned: String = String::from("hello");   // 소유 — 힙에 데이터를 가짐
let slice: &str = &owned;                     // 빌림 — owned를 들여다보는 뷰
let literal: &str = "world";                  // 문자열 리터럴도 &str
```

`String`은 데이터를 **소유**해서 늘리고 줄일 수 있고, `&str`은 그 데이터(또는 리터럴)를 **빌려 보는 창**입니다. `&str`은 소유하지 않으므로 원본보다 오래 살 수 없습니다(②의 수명). Go의 `string`/`[]byte`나 C++의 `string`/`string_view` 관계와 같은 구도입니다.

## 소유권 기반 API 설계의 첫 감각

여기서 Rust다운 설계 감각이 처음 생깁니다 — **함수 인자로 `String`을 받을지 `&str`을 받을지.**

```rust
fn greet(name: &str) {          // ✅ &str로 빌린다 — 소유권을 안 뺏음
    println!("Hi, {}", name);
}

let s = String::from("Alice");
greet(&s);        // String → &str 자동 변환 (deref coercion)
greet("Bob");     // 리터럴도 그대로
// s를 이후에도 쓸 수 있다 — 빌려주기만 했으니까
```

**대부분 `&str`로 받는 게 맞습니다.** 소유권을 뺏지 않으니 호출부가 자기 문자열을 계속 쓸 수 있고, `String`과 리터럴을 둘 다 받습니다. 소유가 정말 필요할 때(값을 저장·보관해야 할 때)만 `String`으로 받습니다. 이 **"받을 때는 빌리고, 줄 때만 소유"**가 소유권 기반 API 설계의 핵심 감각이고, 이후 모든 Rust 코드에 적용됩니다.

## C++ 전환으로 정리

| C++ | Rust | 핵심 차이 |
|---|---|---|
| `std::vector` | `Vec` | 순회 시 `&`로 빌려야 소유권 유지 |
| `std::unordered_map` | `HashMap` | 조회가 `Option` 반환 (없는 키 안전) |
| `std::string` | `String` | 소유·힙·가변 |
| `std::string_view` | `&str` | 빌린 뷰. 수명이 원본에 묶임 |
| `const string&` 인자 | `&str` 인자 | 빌려 받는 게 기본 |

## 자주 막히는 지점

- **인자를 `String`으로 받음** — 습관적으로 `fn f(s: String)`으로 받으면 호출부의 소유권을 뺏어 이후 못 쓰게 만듭니다. **기본은 `&str`**.
- **`&str`을 저장하려다 수명 지옥** — struct 필드에 `&str`을 담으면 수명 주석이 번집니다(②). 보관해야 하면 소유하는 `String`으로.
- **`.to_string()` / `String::from` 남발** — `&str`이면 충분한 곳에 자꾸 `String`을 만들면 불필요한 힙 할당. 빌려서 될지 먼저 보세요.
- **Vec을 순회하다 소유권 이동** — `for x in v`(빌림 없이)는 `v`를 소비합니다. 이후에도 쓰려면 `for x in &v`.

## 통과 기준

- `String`과 `&str`의 차이를 소유/빌림으로 설명할 수 있다.
- 함수 인자로 대부분 `&str`을 받는 이유를 말할 수 있다.
- Vec·HashMap을 소유권을 잃지 않게(`&`로 빌려) 다룰 수 있다.

다음은 [⑤ error 처리 — Result·Option·?](/posts/rust/2026-07-12-rust-error-handling-result-option/)입니다. ③의 enum으로 만들어진 `Option`/`Result`를 실제로 다루는, 예외 없는 Rust의 에러 흐름입니다.

## Reference

- [The Rust Book Ch.8](https://doc.rust-lang.org/book/ch08-00-common-collections.html) — 컬렉션·String의 정본.
- [The Rust Book Ch.4.3 — The Slice Type](https://doc.rust-lang.org/book/ch04-03-slices.html) — `&str`이 왜 슬라이스인지.
- [rustlings — vecs / hashmaps / strings](https://github.com/rust-lang/rustlings)
