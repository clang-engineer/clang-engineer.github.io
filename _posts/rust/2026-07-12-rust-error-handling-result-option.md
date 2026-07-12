---
title       : 흐름 ⑤ error 처리 — Result·Option·?
description : "Rust에도 예외가 없다. 대신 ③의 enum으로 에러를 표현한다. null을 없앤 Option(Some/None), 성공·실패를 값으로 나르는 Result(Ok/Err), 에러를 상위로 전파하는 ? 연산자, 그리고 실전 표준인 thiserror·anyhow까지. unwrap 남발 대신 제대로 다루는 습관을 잡는다."
date        : 2026-07-12 11:25:00 +0900
updated     : 2026-07-12 11:25:00 +0900
categories  : [rust]
tags        : [roadmap, rust]
pin         : false
hidden      : false
---

> [Rust 학습 로드맵](/posts/rust/2026-07-12-rust-roadmap/)의 **⑤ 흐름** 단계입니다. 앞 글: [④ 컬렉션·String vs &str](/posts/rust/2026-07-12-rust-collections-string-str/)

C++/Java에서 온 사람에게 문화 충격입니다. **Rust에도 예외가 없습니다.** 대신 ③에서 배운 enum으로 에러를 표현합니다. 파일 하나만 열어도 바로 `Result`를 만나므로, 추상화(trait)보다 먼저 잡습니다(정본 Book도 이 순서). 세 에러 모델의 비교는 [에러 핸들링 모델](/posts/concept/2026-07-12-error-handling-models/)에 있습니다.

## Option — null이 없다

Rust에는 null이 없습니다. "값이 있을 수도, 없을 수도"는 enum `Option<T>`로 표현합니다.

```rust
enum Option<T> { Some(T), None }   // 표준 정의 (③의 데이터 품는 enum)

fn find(v: &[i32], target: i32) -> Option<usize> {
    for (i, &x) in v.iter().enumerate() {
        if x == target { return Some(i); }
    }
    None
}
```

C++의 널 포인터·`std::optional`이 하던 일을, Rust는 **타입 시스템으로 강제**합니다. `Option<T>`는 그냥 `T`가 아니라서, 값을 쓰려면 반드시 "있는 경우"를 다뤄야 합니다 — null 역참조가 원천 차단됩니다.

## Result — 성공/실패를 값으로

실패할 수 있는 연산은 `Result<T, E>`를 반환합니다. 성공은 `Ok(값)`, 실패는 `Err(에러)`입니다.

```rust
enum Result<T, E> { Ok(T), Err(E) }

fn read_config(path: &str) -> Result<String, std::io::Error> {
    let content = std::fs::read_to_string(path)?;   // 실패하면 여기서 Err 반환
    Ok(content)
}
```

호출부는 `match`로 성공/실패를 가릅니다.

```rust
match read_config("app.toml") {
    Ok(c)  => println!("{}", c),
    Err(e) => eprintln!("실패: {}", e),
}
```

## `?` 연산자 — 전파를 한 글자로

에러를 위로 올리는 게 반복되니, Rust는 `?` 한 글자로 축약합니다. **"성공이면 값을 꺼내고, 실패면 즉시 `Err`를 반환"**입니다.

```rust
fn read_config(path: &str) -> Result<String, io::Error> {
    let content = fs::read_to_string(path)?;   // Err면 함수가 즉시 Err 반환
    let trimmed = content.trim().to_string();
    Ok(trimmed)
}
```

Go의 `if err != nil { return err }`(④의 Go 에러 처리)를 한 글자로 압축한 셈입니다. `?`는 `Option`에도 동작합니다(`None`이면 `None` 반환). 단, `?`를 쓰려면 함수 반환 타입이 `Result`(또는 `Option`)여야 합니다.

## 실전 에러 생태계 — thiserror·anyhow

표준 `Result`만으로도 되지만, 실전 Rust 코드는 거의 두 crate를 씁니다. de-facto 표준입니다.

- **`thiserror`** — **라이브러리**용. `#[derive(Error)]`로 커스텀 에러 enum을 간결하게 정의.
- **`anyhow`** — **애플리케이션**용. `anyhow::Result<T>`로 온갖 에러를 하나로 묶어 편하게 전파(`?`가 알아서 변환).

```rust
// 앱 코드 — anyhow로 서로 다른 에러를 ? 하나로
use anyhow::Result;
fn run() -> Result<()> {
    let cfg = read_config("app.toml")?;   // io::Error
    let port: u16 = cfg.trim().parse()?;  // ParseIntError — 타입이 달라도 OK
    Ok(())
}
```

"라이브러리는 `thiserror`, 앱은 `anyhow`"가 통용되는 관례입니다.

## panic! — 복구 불가일 때만

`panic!`은 프로그램을 즉시 중단시킵니다. C++ 예외처럼 흐름 제어에 쓰면 안 됩니다 — 정상적으로 실패할 수 있는 건 전부 `Result`로, `panic!`은 "여기 오면 논리가 깨진 것"인 진짜 예외 상황에만.

## C++ 전환으로 정리

| C++ | Rust | 핵심 차이 |
|---|---|---|
| 널 포인터 / `std::optional` | `Option<T>` | null 자체가 없음. 타입으로 강제 |
| 예외 (`try`/`catch`) | `Result<T, E>` | 예외 없음. 에러는 값 |
| 에러 코드 수동 전파 | `?` 연산자 | 전파를 한 글자로 |
| 커스텀 예외 계층 | `thiserror` / `anyhow` | 정의·전파를 crate가 도움 |

## 자주 막히는 지점

- **`.unwrap()` 남발** — `Option`/`Result`를 벗기려 `.unwrap()`을 아무 데나 쓰면, `None`/`Err`에서 **패닉**합니다. 학습·프로토타입엔 편하지만 실전 코드엔 `match`·`?`·`if let`으로. 정말 절대 실패 안 하는 곳만 `.expect("이유")`로.
- **`?`를 `main`에서** — 반환 타입이 `Result`여야 `?`가 됩니다. `fn main() -> anyhow::Result<()>`로 바꾸면 `main`에서도 `?` 사용 가능.
- **에러 타입 변환** — 서로 다른 에러 타입을 `?`로 전파하려면 변환이 필요합니다. `anyhow`가 이 문제를 없애 줘서 앱 코드가 편해집니다.

## 통과 기준

- `?`로 에러를 전파하는 함수를 만들고, 호출부에서 `match`로 `Ok`/`Err`를 갈라 처리할 수 있다.
- `Option`/`Result`를 `.unwrap()` 없이 제대로 다룰 수 있다.
- 언제 `thiserror`, 언제 `anyhow`를 쓰는지 구분할 수 있다.

다음은 [⑥ trait·제네릭](/posts/rust/2026-07-12-rust-trait-generics/)입니다. C++의 인터페이스·템플릿·concept에 해당하는 Rust 추상화의 중심입니다.

## Reference

- [The Rust Book Ch.9](https://doc.rust-lang.org/book/ch09-00-error-handling.html) — 에러 처리의 정본.
- [thiserror](https://docs.rs/thiserror) · [anyhow](https://docs.rs/anyhow) — 실전 표준 crate.
- [에러 핸들링 모델](/posts/concept/2026-07-12-error-handling-models/) — 예외·에러 값·Result 세 모델 비교.
