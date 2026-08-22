---
title       : 프로그래밍 언어 개념 로드맵 — C++로 알던 걸 Go·Rust로 잇기
description : "클로저·코루틴·제네릭·소유권처럼 여러 언어에서 반복되는 개념을 네 축으로 묶는다. C++을 발판으로 쓰되 비슷한 점과 의미론이 갈라지는 지점을 함께 본다."
date        : 2026-07-13 12:00:00 +0900
updated     : 2026-08-22 17:00:00 +0900
categories  : [concept]
tags        : [roadmap]
pin         : false
hidden      : false
---

## 이 로드맵을 만든 이유

클로저, 코루틴, 제네릭, 소유권 같은 개념을 흔히 특정 언어의 기능으로 처음 배운다. 그러다 다른 언어에서 비슷한 개념을 만나면 이름과 문법이 달라 다시 처음부터 배우기 쉽다.

이 시리즈는 먼저 **언어를 가로지르는 질문**을 세우고, 각 언어가 그 질문에 어떤 의미론과 구현으로 답하는지 비교한다.

C++은 좋은 발판이다. 포인터·RAII·가상 함수·템플릿처럼 메모리, 수명, 디스패치와 타입의 작동 방식을 비교적 직접 드러내기 때문이다. 다만 C++ 개념을 다른 언어에 그대로 등치하지 않는다.

> **비슷한 개념은 이해의 발판으로 사용하되, 의미론·수명·타입 시스템·런타임 모델까지 같다고 일반화하지 않는다.**

예를 들어 Rust의 move는 C++ `std::move`와 연결해서 이해할 수 있지만 같은 연산은 아니고, Go interface는 C++ virtual과 비슷한 목적을 제공하지만 만족 규칙은 다르다. 각 글은 이런 **발판과 깨지는 지점**을 함께 설명한다.

이 지도는 개별 문법 설명이 아니라 전체 지형과 선행 관계를 보여주는 것이 목적이다.

## 한눈에 보기

네 축으로 묶었다. 축은 분류 기준이고, 모든 항목이 반드시 하나의 선형 선행 관계를 갖는 것은 아니다.

| 축 | 글 | 난이도 | 선행 |
|---|---|---|---|
| **① 안전과 실패** | [에러 핸들링 모델 — 예외 vs 에러 값 vs Result](/posts/concept/2026-07-12-error-handling-models/) | 입문 | — |
| | [Null 안전성 — nullptr·nil·Option](/posts/concept/2026-07-13-null-safety/) | 입문 | 에러 핸들링을 보면 비교가 쉬움 |
| **② 메모리·값·불변** | [메모리 관리 모델 — 수동 vs GC vs 소유권](/posts/concept/2026-07-12-memory-management-models/) | 중급 | 스택/힙 |
| | [값 vs 참조 의미론 — 복사냐 공유냐 이동이냐](/posts/concept/2026-07-12-value-vs-reference-semantics/) | 중급 | 메모리 관리를 보면 쉬움 |
| | [불변성 — const·mut·val](/posts/concept/2026-07-13-immutability/) | 중급 | 값·참조를 보면 쉬움 |
| **③ 함수·실행·상태** | [클로저 — 함수가 바깥 환경을 기억하는 법](/posts/concept/2026-07-12-closure/) | 입문 | — |
| | [코루틴 — 스레드와 무엇이 다른가](/posts/concept/2026-07-12-coroutine/) | 중급 | 스레드를 알면 쉬움 |
| | [동시성 조율 모델 — 공유 상태 vs 메시지 전달](/posts/concept/2026-07-12-concurrency-coordination-models/) | 중급 | 스레드/코루틴을 알면 쉬움 |
| | [이터레이터와 지연 평가 — 순회와 실행 시점](/posts/concept/2026-07-12-iterators-and-lazy-evaluation/) | 중급 | 클로저를 보면 쉬움 |
| **④ 타입 추상화와 디스패치** | [제네릭 — 파라미터 다형성과 구현 전략](/posts/concept/2026-07-12-generics-parametric-polymorphism/) | 중급 | — |
| | [서브타입 다형성과 동적 디스패치](/posts/concept/2026-07-12-subtype-polymorphism-dynamic-dispatch/) | 중급 | 제네릭과 비교하면 쉬움 |

## ① 안전과 실패 — 실패와 부재를 어떻게 표현하나

이 축은 프로그램이 정상 값 이외의 상태를 어떻게 표현하고 호출자에게 강제하는지 본다.

- **에러 핸들링** — 예외, 에러 값, `Result`는 실패를 어떻게 전달하고 처리하게 하는가.
- **Null 안전성** — 값의 부재를 포인터/nil로 표현할지, nullable type이나 `Option` 같은 타입으로 드러낼지 본다.

`Result`와 `Option`은 타입 구조 관점에서 연결해서 볼 수 있지만, 실패와 부재라는 의미까지 같은 것은 아니다.

## ② 메모리·값·불변 — 값의 일생과 접근 규칙

세 글은 서로 연결되지만 각각 다른 질문에 답한다.

```text
메모리 관리
→ 자원의 수명을 누가 어떤 규칙으로 관리하는가

값/참조/이동
→ 대입·전달할 때 값과 소유 관계가 어떻게 변하는가

불변성
→ 어떤 접근 경로에서 값을 바꿀 수 있는가
```

- **메모리 관리** — C/C++의 명시적 관리와 RAII, GC, Rust 소유권을 비교한다. Rust는 컴파일러가 수명 규칙을 검사하고 Drop 경로를 생성한다.
- **값 vs 참조** — Go의 값 복사, C++의 복사/참조/이동, Rust의 소유권 이동을 비교한다. Rust move를 C++ `std::move`와 그대로 동일시하지 않는다.
- **불변성** — 바인딩 불변, 접근 경로의 불변, 내부 가변성을 구분한다. C++ `const`와 Rust `&T`/`&mut T`는 좋은 비교 대상이지만 aliasing 계약은 다르다.

## ③ 함수·실행·상태 — 무엇을 보존하고 언제 실행하나

처음에는 비슷해 보이는 개념들이 많지만 실제로는 서로 다른 질문이다.

```text
클로저
→ 함수가 정의된 외부 환경을 어떻게 기억하는가

코루틴
→ 실행을 어떻게 중단하고 상태를 보존한 뒤 재개하는가

동시성 조율
→ 여러 실행 흐름이 상태를 어떻게 안전하게 공유하는가

이터레이터
→ 원소를 어떻게 하나씩 순회하는가

지연 평가
→ 계산을 언제 수행하는가
```

- **클로저** — 언어마다 캡처 의미론이 다르다. C++ 값/참조 캡처를 JavaScript·Go·Python에 그대로 대입하지 않는다.
- **코루틴** — suspend/resume과 실행 상태 보존이 핵심이다. goroutine, async/await, event loop를 모두 같은 개념으로 묶지 않는다.
- **동시성 조율** — Mutex, channel, actor는 상태 공유와 통신을 조율하는 방식이다. 코루틴 자체와는 다른 축이다.
- **이터레이터와 지연 평가** — iterator는 순회 추상화, lazy evaluation은 실행 시점이다. Rust API처럼 둘이 자주 결합돼도 같은 개념은 아니다.

## ④ 타입 추상화와 디스패치 — 여러 타입을 다루는 서로 다른 질문

이 축은 단순한 `컴파일 타임 vs 런타임` 이분법보다 세 질문으로 보는 편이 정확하다.

```text
타입을 매개변수화하는가?
→ generics / parametric polymorphism

어떤 타입이 어떤 추상 계약을 만족하는가?
→ inheritance / interface satisfaction / trait implementation

호출 대상을 언제 고르는가?
→ static dispatch / dynamic dispatch
```

- **제네릭** — 타입을 매개변수화하는 의미론과 단형화·타입 소거 같은 구현 전략을 구분한다.
- **서브타입/인터페이스** — 공통 추상 타입으로 값을 다루는 관계와 동적 디스패치를 구분한다.
- Rust의 `T: Trait`과 `dyn Trait`은 같은 trait 계약을 각각 정적 제약과 동적 trait object로 사용하는 차이를 잘 보여준다.

## 권장 진입 순서

전체를 정주행한다면 아래 순서가 무난하다. 다만 이 순서는 **학습 편의를 위한 권장 순서**이지 모든 항목의 엄격한 선행 관계를 뜻하지 않는다.

1. [클로저](/posts/concept/2026-07-12-closure/)
2. [에러 핸들링 모델](/posts/concept/2026-07-12-error-handling-models/)
3. [Null 안전성](/posts/concept/2026-07-13-null-safety/)
4. [메모리 관리 모델](/posts/concept/2026-07-12-memory-management-models/)
5. [값 vs 참조 의미론](/posts/concept/2026-07-12-value-vs-reference-semantics/)
6. [불변성](/posts/concept/2026-07-13-immutability/)
7. [코루틴](/posts/concept/2026-07-12-coroutine/)
8. [동시성 조율 모델](/posts/concept/2026-07-12-concurrency-coordination-models/)
9. [이터레이터와 지연 평가](/posts/concept/2026-07-12-iterators-and-lazy-evaluation/)
10. [제네릭](/posts/concept/2026-07-12-generics-parametric-polymorphism/)
11. [서브타입 다형성과 동적 디스패치](/posts/concept/2026-07-12-subtype-polymorphism-dynamic-dispatch/)

특정 주제만 필요하면 위 표에서 바로 들어가도 된다. 각 글은 가능한 한 독립적으로 읽히게 유지한다.

## 언어별 로드맵과의 관계

이 시리즈는 언어를 **가로지르는 개념 층**이다. 특정 언어의 문법·표준 라이브러리·빌드·관용구를 순서대로 익히려면 언어별 로드맵으로 간다.

- [모던 C++ 학습 로드맵](/posts/cpp/2026-07-03-cpp-learning-roadmap/)
- [Go 학습 로드맵](/posts/go/2026-07-12-go-roadmap/)
- [Rust 학습 로드맵](/posts/rust/2026-07-12-rust-roadmap/)

개념 로드맵은 언어별 로드맵의 상위/하위가 아니라 **교차하는 좌표**에 가깝다.

## 이 로드맵이 다루지 않는 것

언어별 문법·표준 라이브러리·빌드 시스템 자체는 각 언어 로드맵의 몫이다. 이 지도는 여러 언어에서 반복해서 만나는 개념과 그 경계를 비교하는 데 집중한다.
