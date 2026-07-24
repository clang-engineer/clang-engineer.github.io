---
title       : Rust 학습 로드맵 — C++ 하던 사람이 무엇을 먼저
description : "C++ 배경에서 Rust로 넘어올 때의 학습 순서를 기초·소유권·타입·트레이트·반복자·에러·동시성·도구로 묶고, 각 주제를 필수·나중·선택으로 표시한 로드맵. C++ 개념(RAII·이동·스마트 포인터)과의 대응뿐 아니라 반복자·클로저·매크로·소유권 기반 설계 같은 Rust 고유 축을 줄기로 넣었다. 정본 교재(The Rust Book·rustlings) 링크와 자주 막히는 지점을 함께 정리한, 배우면서 채우는 진행형 인덱스."
date        : 2026-07-12 11:00:00 +0900
updated     : 2026-07-24 12:00:00 +0900
categories  : [rust]
tags        : [roadmap, rust]
pin         : false
hidden      : false
---

## 이 로드맵을 만든 이유

Rust를 처음 시작하면서, "무슨 문법이 있나"를 목차 순서로 훑는 대신 **C++을 아는 사람이 무엇을 먼저 배우고 무엇을 나중으로 미뤄도 되는지**를 지도로 만들었습니다.

Rust는 **C++ 배경이 가장 크게 빛나는** 언어입니다. 소유권·빌림(borrow)은 결국 C++의 RAII·이동 시맨틱·`unique_ptr`/`shared_ptr`·댕글링 포인터 문제를 **컴파일러가 강제하는 버전**이거든요. C++에서 "조심해서 지켜야 했던 규칙"을 Rust는 안 지키면 컴파일이 안 됩니다. 대신 초반에 **borrow checker와 싸우는** 구간이 가파릅니다 — 이 로드맵은 그 벽을 가장 효율적인 순서로 넘는 걸 목표로 합니다.

> **검토 기준:** Rust 1.97, Edition 2024. safe Rust의 보장과 `unsafe` 작성자의 proof obligation을 구분해 설명합니다.

다만 **C++ 대응만으로 Rust를 다 배우는 건 아닙니다.** 반복자·클로저, 매크로, 소유권 기반 API 설계처럼 C++ 대응이 없거나 Rust에서만 배우는 축이 따로 있고, 그게 오히려 Rust를 Rust답게 쓰는 핵심입니다. 그래서 그것들을 각주가 아니라 **줄기 안**에 넣었습니다(아래 "고유 영역" 참고).

각 주제에는 세 가지 우선순위를 붙였습니다.

- **[필수]** — 이걸 건너뛰면 다음이 막힙니다. 순서대로 잡고 갑니다.
- **[나중]** — 중요하지만 급하지 않습니다. 필요해질 때 돌아와도 됩니다.
- **[선택]** — 특정 상황(라이브러리 저자, 고성능)에서만 필요합니다. 개념만 알고 넘어가도 됩니다.

그리고 각 단계에는 **C++ 하던 사람을 위한 상세 글**을 붙였습니다. 정본 교재 챕터를 요약하되, 그 위에 세 가지를 얹은 학습용 다이제스트입니다 — **대응**("이건 C++의 뭐냐"), **차이**(겉은 같은데 속이 다른 지점), **습관 교정**(C++ 사고가 오히려 방해되는 지점). 그 글만 읽어도 학습이 되도록 쓰되, 더 깊이는 각 글 끝의 정본 교재로 연결합니다.

- 학습 상태: **⬜ 미학습** · **🚧 진행 중** · **✅ 상세 글 완료**

> 📖 **정본 교재** — 각 상세 글이 더 깊이 볼 때 아래로 연결합니다.
> - [The Rust Book](https://doc.rust-lang.org/book/) — 공식·무료. 거의 모든 러스타시안이 여기서 시작. **여기가 본체.**
> - [rustlings](https://github.com/rust-lang/rustlings) — borrow checker와 강제로 싸우게 하는 연습문제. 책과 병행 필수.
> - [Rust by Example](https://doc.rust-lang.org/rust-by-example/) — 주제별 실행 가능한 예제.
{: .prompt-tip }

## C++ 대응으로는 안 잡히는 Rust 고유 영역

대응표(부록)는 "이게 C++의 뭐냐"를 빠르게 잡아 주지만, Rust에는 **대응이 없거나 Rust에서만 배우는** 축이 따로 있습니다. C++ 지식이 오히려 방해가 될 수도 있는 지점이라 줄기 안에 못박아 뒀습니다.

- **반복자·클로저(iterator·`Fn`/`FnMut`/`FnOnce`)** (⑦): `for`문 대신 `iter().map().filter().collect()`로 짜는 함수형 체인이 **idiomatic Rust의 본체**. 게다가 zero-cost라 손으로 쓴 루프만큼 빠릅니다.
- **소유권 기반 API 설계** (②·④ 이후 전반): "이 함수는 값을 가져갈까(move) 빌릴까(&)"를 타입으로 설계하는 사고. C++엔 없는 축.
- **enum + `match` 의 표현력** (③): 상태를 타입으로 강제. `Option`/`Result`가 여기서 나옴.
- **내부 가변성(`Cell`/`RefCell`)** (⑧): 빌림 검사를 런타임으로 미루는 Rust 특유 개념. C++에 직접 대응 없음.
- **매크로(`macro_rules!`·`derive`·proc-macro)** (부록): `#[derive(...)]`·`println!`의 정체. 코드가 코드를 생성.
- **`unsafe`·FFI** (부록): 제한된 unsafe 연산을 허용하고 그 안전 계약을 작성자가 증명하는 경계. C에 연결하거나 저수준을 만질 때.

## 한눈에 보기

| 단계 | 주제 | 우선순위 | 상태 |
|---|---|---|---|
| 기초 | [① 문법·불변성·cargo](/posts/rust/2026-07-12-rust-basics-cargo-immutability/) | 필수 | ✅ |
| 핵심 | [② 소유권·빌림·수명](/posts/rust/2026-07-12-rust-ownership-borrow-lifetime/) | 필수 · **뼈대** | ✅ |
| 타입 | [③ struct·enum·match](/posts/rust/2026-07-12-rust-struct-enum-match/) | 필수 | ✅ |
| 타입 | [④ 컬렉션·String vs &str](/posts/rust/2026-07-12-rust-collections-string-str/) | 필수 | ✅ |
| 흐름 | [⑤ error 처리 — Result·Option·?](/posts/rust/2026-07-12-rust-error-handling-result-option/) | 필수 | ✅ |
| 추상화 | [⑥ trait·제네릭 (+심화·dyn·orphan)](/posts/rust/2026-07-12-rust-trait-generics/) | 필수 | ✅ |
| 관용구 | [⑦ 반복자·클로저 (Rust다움의 본체)](/posts/rust/2026-07-12-rust-iterator-closure/) | 필수 · **고유** | ✅ |
| 소유권 심화 | [⑧ 스마트 포인터 — Box·Rc·RefCell](/posts/rust/2026-07-12-rust-smart-pointers/) | 나중 | ✅ |
| 동시성 | [⑨ thread·Send/Sync·async](/posts/rust/2026-07-12-rust-concurrency/) | 나중 | ✅ |
| 마지막 | [⑩ 도구 — cargo·crates·모듈](/posts/rust/2026-07-12-rust-tooling/) | 필수 | ✅ |
| 부록 | 매크로 — macro_rules!·derive | 나중 | ⬜ |
| 부록 | unsafe·FFI | 선택 | ⬜ |
| 부록 | C++ → Rust 개념 대응표 | 참고 | ✅ |

**②(소유권)가 전부의 뼈대**입니다. 여기서 막히면 이후 모든 게 막히고, 여기를 넘으면 나머지는 빠릅니다. 아래는 각 단계를 왜 그 순서로 두는지 풀어 쓴 것입니다.

## ① 기초 — 문법·불변성·cargo

> 📖 상세 글: [① 문법·불변성·cargo](/posts/rust/2026-07-12-rust-basics-cargo-immutability/)

이 단계 목표는 암기가 아니라 **C++과 다른 Rust의 기본 태도**입니다.

- **[필수] 기본 문법** — `let`(기본 불변!), `mut`로만 가변, 함수, 표현식 기반(if·블록이 값을 반환).
- **[필수] cargo** — 프로젝트 생성·빌드·실행·테스트·의존성이 `cargo` 하나로. C++의 CMake+패키지 매니저를 합친 것.
- **[필수] 기본 타입** — 정수/실수, 튜플, 배열. 그리고 **shadowing**(같은 이름 재선언) 개념.

**자주 막히는 지점:** 변수가 **기본 불변**이라는 것. C++ 습관으로 값을 바꾸려다 컴파일 에러를 만납니다. `mut`를 명시해야 가변.

> **통과 기준:** `cargo new`로 만든 프로젝트를 빌드·실행하고, 불변/가변 변수의 차이를 설명할 수 있으면 다음으로.

## ② 핵심 — 소유권·빌림·수명 (뼈대, 최우선)

> 📖 상세 글: [② 소유권·빌림·수명](/posts/rust/2026-07-12-rust-ownership-borrow-lifetime/)

**Rust의 전부.** 여기에 학습 시간의 절반을 쓸 각오로 들어갑니다. C++의 이동 시맨틱·RAII를 안다면 직관이 크게 도와줍니다.

- **[필수] 소유권(ownership)** — 값에는 소유자가 하나. 소유자가 스코프를 벗어나면 자동 해제(RAII와 동일). 대입/전달이 **이동(move)**이라 원본은 무효화됩니다 — C++의 `std::move`가 기본 동작인 셈. → 언어 공통 개념: [메모리 관리 모델](/posts/concept/2026-07-12-memory-management-models/)(누가 해제하나)·[값 vs 참조 의미론](/posts/concept/2026-07-12-value-vs-reference-semantics/)(대입=이동이라는 기본값)
- **[필수] 빌림(borrow)** — `&`(shared reference)·`&mut`(exclusive reference). safe Rust에서 aliasing과 변경의 잘못된 조합을 컴파일 타임에 막습니다. 공유 가변 상태에는 `Mutex`·atomic 같은 동기화가 여전히 필요합니다.
- **[필수] 수명(lifetime)** — 참조가 원본보다 오래 살 수 없음. 댕글링 포인터를 컴파일러가 거절. 처음엔 `'a` 문법이 낯설지만 대부분 자동 추론됩니다.

**자주 막히는 지점:** "borrow checker와 싸운다"는 바로 이 구간. 값을 옮긴 뒤 또 쓰려 하거나(use after move), 불변 참조가 살아있는데 가변으로 빌리려는 것. **에러 메시지를 적으로 보지 말고 선생으로 보세요** — Rust 컴파일러 에러는 해결책까지 알려줍니다.

> **통과 기준:** use-after-move와 mutable borrow 충돌 에러를 스스로 진단하고 고칠 수 있으면, 가장 큰 산을 넘은 것입니다.

## ③ 타입 — struct·enum·match

> 📖 상세 글: [③ struct·enum·match](/posts/rust/2026-07-12-rust-struct-enum-match/)

Rust의 타입 시스템은 C++보다 강력하고, 특히 enum이 다릅니다.

- **[필수] struct와 method(`impl`)** — 데이터는 `struct`, 동작은 `impl` 블록. 클래스는 없습니다.
- **[필수] enum (대수적 타입)** — C++ enum과 차원이 다릅니다. 각 variant가 데이터를 가질 수 있어(`Option`, `Result`가 이걸로 만들어짐) 상태를 타입으로 표현.
- **[필수] 패턴 매칭(`match`)** — enum을 완전하게 분해. 모든 경우를 안 다루면 컴파일 에러(exhaustiveness). `if let`·`while let`·가드(`if`)·바인딩까지 패턴은 Rust 전반에 깔립니다.

**자주 막히는 지점:** enum을 C++처럼 "이름 붙은 정수"로만 생각하는 것. Rust enum은 **데이터를 품은 합 타입(sum type)**이라는 게 핵심입니다.

## ④ 타입 — 컬렉션·String vs &str

> 📖 상세 글: [④ 컬렉션·String vs &str](/posts/rust/2026-07-12-rust-collections-string-str/)

- **[필수] Vec·HashMap** — `std::vector`·`unordered_map` 대응.
- **[필수] String vs &str** — Rust 입문자를 가장 헷갈리게 하는 지점. `String`(소유, 힙)과 `&str`(빌린 문자열 슬라이스)의 구분은 **②의 소유권과 직결**됩니다. 여기서 소유권이 다시 몸에 붙습니다.

**자주 막히는 지점:** 함수 인자로 `String`을 받을지 `&str`을 받을지. 대부분 `&str`을 받는 게 맞습니다(소유권을 뺏지 않으니까). 이 "받을 때 빌리고, 줄 때만 소유"가 **소유권 기반 API 설계**의 첫 감각입니다.

## ⑤ 흐름 — error 처리 (Result·Option·?)

> 📖 상세 글: [⑤ error 처리 — Result·Option·?](/posts/rust/2026-07-12-rust-error-handling-result-option/)

C++/Java에서 온 사람에게 문화 충격. **Rust에도 예외가 없습니다.** 대신 ③의 enum으로 에러를 표현합니다. 파일 하나만 열어도 바로 `Result`를 만나므로, 추상화(trait)보다 먼저 잡습니다(정본 Book도 이 순서). 예외·에러 값·Result 세 모델의 비교는 → [에러 핸들링 모델](/posts/concept/2026-07-12-error-handling-models/).

- **[필수] Option** — 값이 있을 수도/없을 수도(`Some`/`None`). null이 없는 Rust의 null 대체.
- **[필수] Result** — 성공/실패(`Ok`/`Err`)를 값으로. `match`나 `?`로 처리.
- **[필수] `?` 연산자** — 에러를 상위로 전파하는 축약. Go의 `if err != nil`을 한 글자로.
- **[나중] 에러 생태계 관용구** — `thiserror`(라이브러리용 에러 타입 정의)·`anyhow`(앱용 간편 에러). 실전 Rust 코드는 거의 이 둘을 씁니다. de-facto 표준 crate.
- **[나중] panic!** — 복구 불가 상황용. C++ 예외처럼 흐름 제어에 쓰면 안 됩니다.

**자주 막히는 지점:** `Option`/`Result`를 벗기려고 `.unwrap()`을 남발하는 것(패닉 위험). `match`·`?`·`if let`으로 제대로 다루는 습관.

> **통과 기준:** `?`로 에러를 전파하는 함수를 만들고, 호출부에서 `match`로 `Ok`/`Err`를 갈라 처리할 수 있으면 통과.

## ⑥ 추상화 — trait·제네릭

> 📖 상세 글: [⑥ trait·제네릭](/posts/rust/2026-07-12-rust-trait-generics/)

C++의 인터페이스·템플릿·concept에 해당하는 축. Rust 추상화의 중심이라 심화까지 여기서 짚습니다.

- **[필수] trait** — 공유 동작의 정의. C++20 concept + 인터페이스에 가깝습니다. `impl Trait for Type`으로 구현.
- **[필수] 제네릭 + trait bound** — `fn foo<T: Display>`. C++ 템플릿과 달리 제약을 **미리** 선언해서 에러가 훨씬 친절합니다.
- **[나중] 트레이트 객체(`dyn`) vs 정적 디스패치** — 런타임 다형성(`dyn Trait`, vtable)과 컴파일 타임 단형화(제네릭)의 트레이드오프. C++의 가상 함수 vs 템플릿과 같은 갈림. → [서브타입 다형성·동적 디스패치](/posts/concept/2026-07-12-subtype-polymorphism-dynamic-dispatch/)·[제네릭](/posts/concept/2026-07-12-generics-parametric-polymorphism/)
- **[선택] 심화 — associated type·blanket impl·orphan rule** — 라이브러리를 설계할 때 만나는 규칙들. "왜 이 trait을 이 타입에 구현 못 하지"(orphan rule)의 답이 여기.

**자주 막히는 지점:** C++ 템플릿의 "일단 쓰고 안 되면 에러" 습관. Rust는 trait bound를 **미리** 선언해야 하고, 그 덕에 에러가 명확합니다.

## ⑦ 관용구 — 반복자·클로저 (Rust다움의 본체)

> 📖 상세 글: [⑦ 반복자·클로저](/posts/rust/2026-07-12-rust-iterator-closure/)

**C++ 대응이 흐릿한, Rust에서 새로 배우는 축.** 문법만 알고 여길 건너뛰면 "C++을 Rust 문법으로 쓴" 코드가 나옵니다. Rust 코드가 실제로 어떻게 생겼는지가 여기서 갈립니다.

- **[필수] 클로저(`Fn`/`FnMut`/`FnOnce`)** — `move`는 캡처 소유 방식을 정하고, call trait은 본문이 캡처 값을 읽는지·바꾸는지·밖으로 이동시키는지로 결정됩니다. → 언어 공통 개념: [클로저란 무엇인가](/posts/concept/2026-07-12-closure/)
- **[필수] 반복자(iterator)** — `for`문 대신 `iter().map().filter().fold().collect()` 체인. **lazy**하고 **zero-cost**(손 루프만큼 빠름). `Iterator` trait 하나로 굴러갑니다. → [이터레이터와 지연 평가](/posts/concept/2026-07-12-iterators-and-lazy-evaluation/)
- **[나중] 커스텀 iterator** — 내 타입에 `Iterator`를 구현해 `for`로 돌게 만들기.

**자주 막히는 지점:** C++ 습관으로 인덱스 `for` 루프를 쓰는 것. Rust에서는 대부분 iterator 체인이 더 짧고 안전하고 빠릅니다. `collect()`의 타입 추론(어디로 모을지)도 처음엔 헷갈립니다.

> **통과 기준:** 인덱스 `for` 루프로 짠 로직을 `map`/`filter`/`collect` 체인으로 바꿔 쓸 수 있으면, Rust식 사고가 붙기 시작한 것입니다.

## ⑧ 소유권 심화 — 스마트 포인터

> 📖 상세 글: [⑧ 스마트 포인터 — Box·Rc·RefCell](/posts/rust/2026-07-12-rust-smart-pointers/)

②의 소유권 규칙이 너무 빡빡할 때 푸는 도구. **C++ 스마트 포인터와 거의 1:1 대응**이라 C++ 배경이 크게 유리한 구간입니다.

- **[나중] Box** — 힙 할당. `unique_ptr` 대응(유일 소유).
- **[나중] Rc / Arc** — 참조 카운트 공유 소유. `Arc`가 thread-safe하게 만드는 것은 참조 카운트이며, 내부 값의 공유 변경에는 `Mutex`·`RwLock`·atomic이 필요합니다.
- **[나중] RefCell·Cell — 내부 가변성(interior mutability)** — 빌림 검사를 런타임으로 미룸. C++엔 직접 대응이 없는 **Rust 특유 개념**으로, `Rc<RefCell<T>>` 조합은 공유+가변이 필요한 자료구조(그래프·트리)의 관용구.
- **[선택] Weak** — 순환 참조 끊기. `weak_ptr` 대응.

## ⑨ 동시성 — thread·Send/Sync·async

> 📖 상세 글: [⑨ thread·Send/Sync·async](/posts/rust/2026-07-12-rust-concurrency/)

Rust의 슬로건 "fearless concurrency". safe Rust는 소유권·`Send`/`Sync`와 동기화 타입으로 데이터 레이스 경로를 차단합니다. `unsafe`에서는 작성자가 같은 계약을 직접 지켜야 합니다. → [동시성 조율 모델](/posts/concept/2026-07-12-concurrency-coordination-models/).

- **[나중] thread + 채널** — `std::thread`, `mpsc` 채널. C++보다 안전.
- **[나중] Send / Sync** — 타입이 스레드 간 이동/공유 가능한지 표시하는 마커 트레이트. Rust 동시성 안전성의 근간.
- **[선택] async/await** ([Book Ch.17](https://doc.rust-lang.org/book/ch17-00-async-await.html)) — 비동기. `tokio` 런타임 생태계. Book에서도 동시성(Ch.16) 다음의 별도 챕터이니, 동기 동시성을 뗀 뒤에.

## ⑩ 마지막 — 도구

> 📖 상세 글: [⑩ 도구 — cargo·crates·모듈](/posts/rust/2026-07-12-rust-tooling/)

Rust는 도구 경험이 언어의 강점입니다.

- **[필수] cargo** — 빌드·테스트·의존성·문서화가 하나로. C++ 생태계의 파편화된 도구들을 통합.
- **[필수] 모듈 시스템(`mod`·`use`)** — 헤더 없이 코드 조직화. 가시성(`pub`).
- **[필수] crates.io** — 패키지 저장소. `cargo add`로 의존성 추가.
- **[나중] clippy / rustfmt** — 린터·포매터. `cargo clippy`의 조언은 학습에도 좋습니다.

여기까지가 Rust를 배우는 학습 줄기입니다.

---

## 부록 — 매크로 (macro_rules!·derive)

> 📖 [The Rust Book Ch.20.5](https://doc.rust-lang.org/book/ch20-05-macros.html)

**[필수] 경로 밖이지만 Rust 고유 축.** `#[derive(Debug, Clone)]`·`println!`·`vec!`의 정체가 매크로입니다. 쓰는 건 처음부터 하지만, **직접 만드는 것**은 미뤄도 됩니다.

- **[나중] 선언적 매크로(`macro_rules!`)** — 패턴으로 코드를 생성. 반복 보일러플레이트 제거.
- **[선택] 절차적 매크로(proc-macro)·derive 매크로 작성** — 라이브러리 저자용. `serde`가 이걸로 동작.

## 부록 — unsafe·FFI

> 📖 [The Rust Book Ch.20.1](https://doc.rust-lang.org/book/ch20-01-unsafe-rust.html)

**[선택]** `unsafe`는 Rust의 검사를 전부 끄지 않습니다. borrow checker와 타입 검사는 계속 동작하고, 아래 제한된 연산을 허용하는 대신 작성자가 그 연산의 안전 계약을 증명해야 합니다.

- **[선택] unsafe** — raw pointer 역참조와 unsafe function 호출 같은 제한 연산을 허용합니다. 허용 범주는 edition과 언어 발전에 따라 추가될 수 있으므로 [Rust Reference의 unsafety 목록](https://doc.rust-lang.org/reference/unsafety.html)을 기준으로 확인하고, 각 연산의 proof obligation을 사람이 책임집니다.
- **[선택] FFI·unsafe attribute** — Edition 2024에서는 `unsafe extern "C"` block과 `#[unsafe(no_mangle)]`처럼 선언 자체의 안전 계약도 명시합니다.

## 부록 — C++ → Rust 개념 대응표 (참고)

C++을 알고 오는 사람의 지도. Rust가 특히 잘 대응되는 언어라 이 표가 강력합니다. **단, 위 "고유 영역"(반복자·클로저·매크로 등)은 이 표에 안 잡힙니다** — 대응표는 절반의 지도입니다.

| C++ | Rust | 핵심 차이 |
|---|---|---|
| `std::move` (수동, 선택) | 이동(move, **기본 동작**) | 대입/전달이 기본 이동. 원본은 무효화 |
| RAII 소멸자 | 소유권 drop | 동일 개념을 컴파일러가 강제 |
| 댕글링 포인터 (런타임 UB) | 수명(lifetime) | 컴파일 타임에 거절 |
| `const T&` | `&T` (불변 빌림) | 기본이 불변. 규칙을 컴파일러가 검사 |
| `T&` (가변) | `&mut T` | "가변 참조는 동시에 하나" 강제 |
| `unique_ptr` | `Box` | 유일 소유 |
| `shared_ptr` | `Rc` / `Arc` | 참조 카운트. Arc는 스레드 안전 |
| `weak_ptr` | `Weak` | 순환 참조 끊기 |
| `mutable` (const 안 가변) | `RefCell` / `Cell` | 내부 가변성. 런타임 빌림 검사 |
| `class` | `struct` + `impl` | 데이터와 동작 분리 |
| 순수 가상 인터페이스 | `trait` | C++20 concept에 더 가까움 |
| enum (정수) | `enum` (합 타입) | variant가 데이터를 가짐 |
| `std::optional` | `Option` | null 자체가 없음 |
| 예외 (`try/catch`) | `Result` + `?` | 예외 없음. 에러는 값 |
| 템플릿 | 제네릭 + trait bound | 제약을 미리 선언 → 친절한 에러 |
| 가상 함수 vs 템플릿 | `dyn Trait` vs 제네릭 | 런타임 vs 컴파일 타임 디스패치 |
| 람다 | 클로저(`Fn`/`FnMut`/`FnOnce`) | 캡처 방식이 소유권과 맞물림 |
| `<algorithm>` + 범위 for | iterator 체인(`map`·`filter`) | lazy·zero-cost. Rust의 기본 스타일 |
| 전처리기 매크로(`#define`) | `macro_rules!`·derive | 텍스트 치환이 아니라 위생적(hygienic) |
| `std::thread` | `thread` + Send/Sync | safe Rust 경계 검사 + 필요한 런타임 동기화 |
| CMake + Conan/vcpkg | `cargo` | 빌드·의존성·테스트 통합 |
| `extern "C"` | `unsafe` + FFI(`unsafe extern "C"`) | 제한된 unsafe 연산의 계약을 작성자가 증명 |

## 이 로드맵을 쓰는 법

- **②(소유권)에 시간을 몰아주세요.** 여기가 전부입니다. rustlings의 move/borrow 연습을 반복.
- **⑦(반복자·클로저)을 건너뛰지 마세요.** 대응표에 안 잡히는, "Rust답게" 쓰는 법의 핵심입니다.
- **컴파일러 에러는 선생입니다.** Rust 에러 메시지는 원인과 해결책을 알려줍니다 — 읽으면서 배우세요.
- 진도는 "봤다"가 아니라 각 단계의 통과 기준을 직접 구현할 수 있는지로 판단합니다.
- 한 단계를 정리하면 상태를 ⬜→✅로 바꾸고, borrow checker와 싸우며 얻은 깨달음을 상세 글로 남깁니다.
- C++ 습관(수동 메모리 관리, 예외, 인덱스 루프)이 튀어나오면 대응표·고유 영역으로 돌아와 Rust식 사고로 교정합니다.

## Reference

- [The Rust Book](https://doc.rust-lang.org/book/) — 공식·무료. 본체.
- [rustlings](https://github.com/rust-lang/rustlings) — 손으로 borrow checker 넘기.
- [Rust by Example](https://doc.rust-lang.org/rust-by-example/) — 실행 가능한 예제.
- [The Cargo Book](https://doc.rust-lang.org/cargo/) — 도구·의존성 1차 레퍼런스.
- [Rust by Practice](https://practice.rs/) — rustlings 이후의 심화 연습.
