---
title       : 동시성 ⑨ thread·Send/Sync·async — fearless concurrency
description : "Rust의 슬로건 'fearless concurrency'. 소유권 시스템이 데이터 레이스를 컴파일 타임에 막는다. std::thread와 mpsc 채널, 타입이 스레드 간 이동·공유 가능한지 표시하는 마커 트레이트 Send/Sync, 그리고 tokio 생태계의 async/await까지. C++보다 안전한 이유를 소유권으로 설명한다."
date        : 2026-07-12 11:45:00 +0900
updated     : 2026-07-12 11:45:00 +0900
categories  : [rust]
tags        : [roadmap, rust]
pin         : false
hidden      : false
---

> [Rust 학습 로드맵](/posts/rust/2026-07-12-rust-roadmap/)의 **⑨ 동시성** 단계입니다. 앞 글: [⑧ 스마트 포인터](/posts/rust/2026-07-12-rust-smart-pointers/)

Rust의 슬로건이 **"fearless concurrency"**입니다. ②의 소유권 시스템이 데이터 레이스를 **컴파일 타임에** 막아 주기 때문입니다 — C++에서 뮤텍스로 조심조심 지키던 걸 컴파일러가 대신 증명합니다.

## thread + 채널

```rust
use std::thread;

let handle = thread::spawn(|| {        // 새 스레드
    println!("작업 중");
});
handle.join().unwrap();                // 끝날 때까지 대기
```

스레드 간 통신은 `mpsc`(multi-producer, single-consumer) 채널로 합니다 — Go의 채널(⑤ Go 동시성)과 같은 발상입니다.

```rust
use std::sync::mpsc;
let (tx, rx) = mpsc::channel();
thread::spawn(move || {                // move로 tx의 소유권을 스레드로
    tx.send(42).unwrap();
});
println!("{}", rx.recv().unwrap());    // 42
```

여기서 `move` 클로저(⑦)가 필수입니다 — 스레드가 `tx`를 **소유해야** 원래 스코프가 끝나도 안전하기 때문입니다. 소유권 규칙이 스레드 안전과 자연스럽게 맞물리는 지점입니다.

## Send / Sync — 안전성의 근간

Rust 동시성 안전이 어떻게 컴파일 타임에 보장되는지의 핵심입니다. 두 **마커 트레이트**가 타입에 자동으로 붙습니다.

- **`Send`** — 이 타입을 **다른 스레드로 이동**해도 안전한가.
- **`Sync`** — 이 타입을 **여러 스레드가 참조로 공유**해도 안전한가(`&T`가 `Send`인가).

```rust
// Arc<Mutex<T>> — 스레드 간 공유+가변의 정석
use std::sync::{Arc, Mutex};
let counter = Arc::new(Mutex::new(0));
let c = Arc::clone(&counter);
thread::spawn(move || {
    *c.lock().unwrap() += 1;           // 락을 잡아야만 내부 접근
});
```

⑧의 `Rc`가 스레드 안전이 아니어서(`Send`가 아님) 컴파일 에러가 나고, 스레드 간에는 **`Arc`**를 쓴다고 했던 게 이 트레이트 때문입니다. 컴파일러가 "이 타입은 `Send`가 아니라 스레드로 못 보낸다"고 **미리** 거절하므로, 데이터 레이스가 애초에 컴파일되지 않습니다.

## async / await — tokio 생태계

`async`/`await`는 스레드보다 가벼운 **비동기** 동시성입니다(수만 개의 동시 작업). Book에서도 동기 동시성(Ch.16) 다음의 별도 챕터(Ch.17)이니, **동기 동시성을 뗀 뒤에** 봅니다.

```rust
async fn fetch(url: &str) -> Result<String, Error> { ... }

#[tokio::main]
async fn main() {
    let body = fetch("https://example.com").await;   // .await로 완료 대기
}
```

Rust의 `async`는 런타임이 언어에 내장돼 있지 않아 **`tokio`**(사실상 표준 async 런타임)를 붙여 씁니다. 웹 서버·네트워크 서비스는 거의 tokio 위에서 돕니다. 다만 async는 소유권·수명이 더 까다로워지니, 처음엔 동기 스레드로 감을 잡고 필요할 때 들어가세요.

## C++ 전환으로 정리

| C++ | Rust | 핵심 차이 |
|---|---|---|
| `std::thread` | `thread::spawn` | 소유권으로 캡처 안전 강제 |
| 공유 변수 + 뮤텍스 | `mpsc` 채널 / `Arc<Mutex<T>>` | 통신 선호 + 락을 타입으로 강제 |
| (규율로 지키는 스레드 안전) | `Send` / `Sync` | 컴파일 타임 마커로 보장 |
| `std::async` / 코루틴 | `async`/`await` + tokio | 런타임은 crate로 선택 |
| ThreadSanitizer (런타임) | 컴파일 타임 거절 | 데이터 레이스가 안 컴파일됨 |

## 자주 막히는 지점

- **`move` 누락** — 스레드 클로저가 바깥 값을 캡처하면 수명 문제로 컴파일 에러. `thread::spawn(move || ...)`로 소유권을 넘기세요.
- **`Rc`를 스레드에** — `Rc`는 `Send`가 아니라 컴파일 에러. 스레드 간 공유는 `Arc`, 공유+가변은 `Arc<Mutex<T>>`.
- **`Mutex` 언락을 잊음** — Rust의 `Mutex`는 락 가드가 스코프를 벗어나면 **자동 언락**(RAII)이라 C++처럼 언락을 빼먹을 일은 없지만, 가드를 오래 들고 있으면 다른 스레드가 굶습니다.
- **처음부터 async** — 개념 부담이 큽니다. 동기 스레드로 먼저.

## 통과 기준

- 스레드를 띄우고 `mpsc` 채널 또는 `Arc<Mutex<T>>`로 안전하게 데이터를 주고받을 수 있다.
- `Send`/`Sync`가 무엇을 보장하는지, 왜 `Rc` 대신 `Arc`를 쓰는지 설명할 수 있다.
- 데이터 레이스가 왜 컴파일 타임에 막히는지 소유권으로 설명할 수 있다.

다음은 [⑩ 도구 — cargo·crates·모듈](/posts/rust/2026-07-12-rust-tooling/)로, Rust를 배우는 학습 줄기의 마지막입니다.

## Reference

- [The Rust Book Ch.16](https://doc.rust-lang.org/book/ch16-00-concurrency.html) — 동시성의 정본.
- [The Rust Book Ch.17 — Async/await](https://doc.rust-lang.org/book/ch17-00-async-await.html)
- [tokio 튜토리얼](https://tokio.rs/tokio/tutorial) — async 런타임의 사실상 표준.
