---
title       : "Rust Tooling — Cargo·crate·module·rustfmt·Clippy"
description : "Rust 개발 도구를 Cargo의 package/build/test/dependency 역할, crate·module·visibility 구조, rustdoc/doctest, rustfmt, Clippy로 나눠 설명한다. Cargo가 모든 외부 도구를 대체한다고 단순화하지 않고 전 과정에서 언제 어떤 도구를 쓰는지 정리한다."
date        : 2026-07-12 11:50:00 +0900
updated     : 2026-09-06 14:15:00 +0900
categories  : [rust]
tags        : [rust, cargo, tooling, modules]
pin         : false
hidden      : false
---

> [Rust 학습 로드맵](./2026-07-12-rust-roadmap.md)의 마지막 단계가 아니라 **1단계부터 계속 사용하는 Cross-cutting Tool/Reference**다.

Rust 생태계의 강점 중 하나는 package·build·test·dependency workflow가 Cargo를 중심으로 강하게 표준화되어 있다는 점이다. 하지만 다음을 하나의 프로그램이라고 뭉개지는 않는다.

```text
Cargo
→ package / dependency / build / test / run / publish orchestration

rustc
→ Rust compiler

rustdoc
→ API documentation + documentation test 지원

rustfmt
→ source formatter

Clippy
→ lint collection
```

`cargo fmt`, `cargo clippy`처럼 Cargo subcommand 형태로 호출할 수 있어 경험은 통합되어 보이지만, 실제 역할과 component는 구분한다.

## 1. Cargo — Package와 Build Workflow의 중심

```bash
cargo new myapp
cargo check
cargo build
cargo run
cargo test
cargo build --release
```

역할을 나누면 다음과 같다.

```text
빠른 type/check
→ cargo check

binary/library build
→ cargo build

build 후 실행
→ cargo run

test target + doctest 실행
→ cargo test

optimized profile
→ cargo build --release
```

`cargo check`는 최종 code generation을 생략해 빠르게 compiler diagnostic을 확인하는 일상 Loop에 특히 유용하다.

Cargo는 일반적인 Rust package에서 별도 CMake project 없이 충분한 경우가 많지만, native C/C++ library·code generation·특수 packaging이 섞이면 `build.rs`, `cc` crate, CMake/Meson 또는 외부 build orchestration과 조합될 수도 있다.

## 2. Package·crate·target — 이름을 먼저 구분한다

Cargo를 이해할 때 가장 먼저 헷갈리는 단어가 package와 crate다.

```text
Cargo package
→ 하나의 Cargo.toml이 설명하는 배포/빌드 단위

crate
→ rustc가 한 번에 compile하는 Rust compilation unit

package 안의 target
├─ library target
├─ binary target(s)
├─ example
├─ integration test
└─ benchmark 등
```

Package 하나가 여러 binary crate를 가질 수 있다. `crate = package`로 항상 일치한다고 생각하지 않는다.

## 3. Dependency — `Cargo.toml`과 `Cargo.lock`

의존성 추가:

```bash
cargo add serde
cargo add tokio --features full
```

`Cargo.toml`은 package metadata와 dependency requirement를 기술하고, dependency resolution 결과는 `Cargo.lock`에 기록된다.

```text
Cargo.toml
→ 내가 허용하는 dependency requirement / feature / package 설정

Cargo.lock
→ 해당 resolution에서 선택된 package version/source/checksum 정보
```

Application·binary project에서는 `Cargo.lock`을 repository에 포함해 동일 resolution을 재현하는 것이 일반적이다. Library의 lockfile 관리 여부는 배포/CI 정책과 Cargo 권장사항을 함께 본다.

Dependency graph가 왜 선택됐는지 볼 때는:

```bash
cargo tree
```

를 사용한다.

## 4. Module System — Build Tool과 Language Namespace를 섞지 않는다

`mod`, `use`, `pub`은 Cargo command가 아니라 **Rust language의 module/visibility system**이다.

```rust
mod network {
    pub fn connect() {}
    fn helper() {}
}

use network::connect;
```

역할은 다음과 같다.

```text
mod
→ module tree에 module을 선언/정의

use
→ path를 현재 scope에 가져와 이름 사용을 단순화

pub / pub(crate) / pub(super) ...
→ visibility boundary 표현
```

Rust item은 기본적으로 private이고 visibility를 명시적으로 넓힌다.

파일 배치와 module tree는 자주 함께 쓰이지만 완전히 같은 개념은 아니다. Module은 inline으로 정의할 수도 있고 file-backed module로 나눌 수도 있다.

```text
namespace / visibility 관계
→ language module system

어떤 crate/target을 build할지
→ Cargo
```

## 5. `rustdoc`와 Documentation Test

Rust의 `///`와 `//!` documentation comment는 `rustdoc`이 API 문서로 렌더한다.

```bash
cargo doc
cargo doc --open
```

`cargo doc`의 목적은 문서 생성이다. **문서 code block이 test되는 것은 test workflow의 책임**이다.

```bash
cargo test
# 일반적으로 unit/integration test와 함께 doctest도 실행

cargo test --doc
# documentation test에 집중
```

따라서 다음처럼 분리한다.

```text
문서를 만든다
→ cargo doc / rustdoc

문서 예제가 실제로 compile/run되는지 검증한다
→ cargo test --doc
```

## 6. `rustfmt` — Canonical Formatting

Rust toolchain 설치 방식에 따라 rustfmt component가 필요하다.

```bash
rustup component add rustfmt
cargo fmt
```

`cargo fmt`는 Cargo command 자체가 formatting rule을 구현하는 것이 아니라 **rustfmt를 Cargo project 단위로 호출하는 통합 진입점**으로 이해하면 된다.

CI에서 변경 여부만 확인할 때는 예를 들어:

```bash
cargo fmt --all -- --check
```

를 사용할 수 있다.

Formatting이 강하게 표준화되어 있어 팀별 논쟁을 크게 줄이지만, naming·API design·module boundary까지 formatter가 결정하는 것은 아니다.

## 7. Clippy — Rust-specific Lint Collection

Clippy component:

```bash
rustup component add clippy
cargo clippy --all-targets --all-features
```

Clippy는 compiler error와 다른 층이다.

```text
rustc diagnostic
→ language/type/borrow 규칙을 만족하는가

Clippy lint
→ compile은 되지만 의심스럽거나 덜 관용적인 pattern인가
```

모든 Clippy suggestion을 기계적으로 적용하기보다 lint category와 project context를 확인한다. CI에서는 warning policy를 명시할 수 있다.

```bash
cargo clippy -- -D warnings
```

## 8. Debug와 Release Profile

기본 `cargo build` / `cargo run`은 dev profile을 사용한다.

```bash
cargo build --release
cargo run --release
```

성능 비교는 optimization·debug assertion·codegen 설정이 다른 dev build와 release build를 섞지 않는다.

`Cargo.toml`의 profile 설정으로 세부 옵션을 조정할 수 있다.

```toml
[profile.release]
lto = true
```

필요한 경우에만 project 특성에 맞춰 조정한다.

## 9. Workspace — 여러 Package를 한 Repository에서

Project가 커지면 package 하나가 아니라 workspace를 사용한다.

```toml
[workspace]
members = [
  "crates/core",
  "crates/cli",
]
resolver = "3"
```

```text
repository
→ workspace
   ├─ package A
   └─ package B
```

Workspace는 module보다 상위의 **package/build organization** 문제다. 한 crate 안의 `mod` tree와 같은 계층으로 보지 않는다.

## 10. 일상 Loop

```text
코드 수정
→ cargo fmt
→ cargo check
→ cargo test
→ cargo clippy

Dependency 변경
→ cargo add / update
→ cargo tree로 graph 확인

API 문서 확인
→ cargo doc --open

Release artifact 검증
→ cargo build --release
```

필요한 command를 순서대로 한 번 배우는 것이 아니라 개발 Loop에 배치한다.

## C++ 경험과의 비교축

| 문제 | C++에서 흔한 구성 | Rust 기본 생태계 |
|---|---|---|
| Package/build orchestration | CMake + generator + dependency Tool 조합 | Cargo 중심 |
| Compiler | GCC/Clang/MSVC | rustc |
| Format | clang-format | rustfmt |
| Rust-specific lint에 해당하는 층 | clang-tidy 등 | Clippy |
| API docs | Doxygen 등 | rustdoc / cargo doc |
| Namespace/visibility | header/module/namespace/access specifier | Rust module + visibility |

이 표는 우열표가 아니다. **표준 Toolchain이 기본 Workflow를 얼마나 한 생태계로 묶어 제공하는지**를 보는 비교다.

## 흔한 함정

- **Package와 crate를 같은 말로 사용** — package 하나에 여러 target/crate가 있을 수 있다.
- **module과 file path를 완전히 동일시** — file-backed module은 흔한 구현이지만 module은 language namespace 개념이다.
- **`cargo doc`이 doctest를 실행한다고 생각** — 문서 생성과 문서 예제 검증은 `cargo doc` / `cargo test`로 구분한다.
- **dev build로 성능 측정** — optimization 조건을 확인한다.
- **Clippy suggestion을 무조건 정답으로 취급** — lint 목적과 codebase contract를 보고 선택한다.

## 통과 기준

다음을 구분하면 충분하다.

- Cargo와 rustc의 역할
- package / crate / target / workspace의 관계
- module system과 Cargo project structure의 차이
- `cargo doc`과 doctest의 차이
- rustfmt와 Clippy의 역할
- dev/release profile 차이

Roadmap에서는 이 글을 “⑩ 마지막”에 두지 않고 **처음부터 필요할 때 찾아보는 Tool/Reference**로 사용한다.

## Reference

- [The Cargo Book](https://doc.rust-lang.org/cargo/)
- [The Rust Reference — Modules](https://doc.rust-lang.org/reference/items/modules.html)
- [rustdoc book](https://doc.rust-lang.org/rustdoc/)
- [rustfmt](https://github.com/rust-lang/rustfmt)
- [Clippy](https://doc.rust-lang.org/clippy/)
