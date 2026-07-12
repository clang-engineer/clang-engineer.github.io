---
title       : 마지막 ⑩ 도구 — cargo·crates·모듈
description : "Rust는 도구 경험이 언어의 강점이다. 빌드·테스트·의존성·문서화를 하나로 묶은 cargo, 헤더 없이 코드를 조직하는 mod·use 모듈 시스템과 pub 가시성, crates.io와 cargo add, 그리고 학습에도 좋은 clippy·rustfmt까지. C++의 파편화된 도구 생태계와 비교하며 로드맵을 마무리한다."
date        : 2026-07-12 11:50:00 +0900
updated     : 2026-07-12 11:50:00 +0900
categories  : [rust]
tags        : [roadmap, rust]
pin         : false
hidden      : false
---

> [Rust 학습 로드맵](/posts/rust/2026-07-12-rust-roadmap/)의 **⑩ 마지막(도구)** 단계입니다. 앞 글: [⑨ thread·Send/Sync·async](/posts/rust/2026-07-12-rust-concurrency/)

Rust는 **도구 경험 자체가 언어의 강점**입니다. C++ 생태계의 파편화된 도구들(CMake·Conan·clang-format·clang-tidy)을 `cargo` 하나로 통합합니다. ①에서 맛본 cargo를 여기서 정리합니다.

## cargo — 하나로 통합

```bash
cargo new myapp        # 프로젝트 생성
cargo build            # 빌드 (기본 debug)
cargo build --release  # 최적화 빌드
cargo run              # 빌드 + 실행
cargo test             # 테스트 (#[test] 함수를 찾아서)
cargo doc --open       # 문서 생성 + 브라우저로 열기
```

빌드·테스트·문서화가 전부 한 명령 체계 안에 있습니다. 테스트는 `#[test]` 속성을 붙인 함수를 cargo가 찾아 돌리고, 문서는 `///` 주석에서 `cargo doc`이 HTML을 생성합니다 — 심지어 문서 안의 코드 예제까지 테스트합니다(doctest).

## 모듈 시스템 — mod·use·pub

C++의 헤더 없이 코드를 조직합니다. `mod`로 모듈을 나누고, `use`로 경로를 가져오고, `pub`으로 공개 범위를 정합니다.

```rust
mod network {
    pub fn connect() { }          // pub → 밖에서 접근 가능
    fn helper() { }               // 기본 비공개
}

use network::connect;             // 경로를 가져오기
connect();
```

Rust는 **기본이 비공개**입니다(①의 불변 기본과 같은 태도) — `pub`을 붙인 것만 밖으로 노출됩니다. Go가 대소문자로 정하던 가시성을 Rust는 `pub` 키워드로 명시합니다. 파일·디렉터리 구조가 모듈 트리에 대응해서, 헤더 경로 씨름 없이 구조가 코드에 드러납니다.

## crates.io — 패키지 생태계

의존성은 crates.io(공식 레지스트리)에서 받습니다.

```bash
cargo add serde        # Cargo.toml에 추가 + 버전 해결
cargo add tokio --features full
```

`Cargo.toml`에 의존성을, `Cargo.lock`이 정확한 버전을 잠급니다(재현 가능한 빌드). `serde`(직렬화)·`tokio`(async)·`clap`(CLI 파싱)처럼 사실상 표준인 crate들이 생태계를 떠받칩니다.

## clippy·rustfmt — 린터·포매터

```bash
cargo fmt              # rustfmt — 표준 포맷 (스타일 논쟁 없음)
cargo clippy           # 린터 — 관용적이지 않은 코드를 짚어줌
```

`rustfmt`는 Go의 gofmt처럼 **포맷을 표준화**해 스타일 논쟁을 없앱니다. `clippy`는 단순 린트를 넘어 **"이건 이렇게 쓰는 게 Rust답다"**를 알려줘서, 학습 도구로도 훌륭합니다 — 초심자일수록 `cargo clippy`의 조언을 읽는 게 실력이 됩니다.

## C++ 전환으로 정리

| C++ | Rust | 핵심 차이 |
|---|---|---|
| CMake + Conan/vcpkg | `cargo` | 빌드·의존성·테스트·문서 통합 |
| 헤더/`#include` | `mod` / `use` | 헤더 없이 모듈 트리로 조직 |
| `public`/`private` | `pub` (기본 비공개) | 노출할 것만 명시 |
| Doxygen (별도) | `cargo doc` + doctest | 문서·예제 테스트 내장 |
| clang-format / clang-tidy | `rustfmt` / `clippy` | 포맷 강제 + 관용구 조언 |

## 자주 막히는 지점

- **모듈 경로 혼동** — `mod`로 선언과 파일 배치가 어긋나면 "file not found for module". 파일 구조가 모듈 트리와 맞아야 합니다.
- **`pub` 누락** — 밖에서 안 보이면 십중팔구 `pub`을 안 붙인 것(기본 비공개).
- **debug 빌드로 성능 측정** — `cargo run`은 기본 debug라 최적화가 꺼져 있습니다. 성능은 반드시 `--release`로.
- **clippy를 무시** — 조언을 흘려보내지 말고 읽으세요. Rust다운 코드로 가는 지름길입니다.

## 통과 기준

- `cargo`로 빌드·테스트·문서화를 하고, `cargo add`로 의존성을 추가할 수 있다.
- `mod`·`use`·`pub`으로 코드를 여러 모듈로 조직할 수 있다.
- `cargo fmt`·`cargo clippy`를 습관화하고, clippy 조언을 학습에 활용할 수 있다.

---

여기까지가 **Rust를 배우는 학습 줄기 ①~⑩**입니다. 로드맵을 한 바퀴 돌았습니다. 이제 [부록의 매크로·unsafe·FFI](/posts/rust/2026-07-12-rust-roadmap/)나 실전 프로젝트로 넘어가면 됩니다. borrow checker와 싸우다 막히면 ②로, C++ 습관(수동 메모리 관리·예외·인덱스 루프)이 튀어나오면 로드맵의 대응표·고유 영역으로 돌아와 교정하세요.

## Reference

- [The Cargo Book](https://doc.rust-lang.org/cargo/) — 도구·의존성의 정본.
- [The Rust Book Ch.7](https://doc.rust-lang.org/book/ch07-00-managing-growing-projects-with-packages-crates-and-modules.html) — 모듈 시스템.
- [crates.io](https://crates.io/) — 패키지 레지스트리.
