---
title       : 예외 처리 — try·catch·throw와 예외 안전 3등급
description : "RAII의 동기로만 스치던 예외를 정면으로 다룬다. throw/try/catch 기본, 예외가 스택을 거슬러 오를 때 소멸자가 자원을 정리하는 스택 언와인딩, 예외 안전 3등급(basic·strong·nothrow), 그리고 noexcept가 왜 이동 생성자와 vector 성능에까지 얽히는지 정리한다."
date        : 2026-07-13 09:00:00 +0900
updated     : 2026-07-13 09:00:00 +0900
categories  : [cpp]
tags        : [roadmap, modern-cpp]
pin         : false
hidden      : false
---

> [모던 C++ 학습 로드맵](/posts/cpp/2026-07-03-cpp-learning-roadmap/)의 **[나중] 심화**입니다 — ② 클래스와 자원 관리(RAII)의 짝. RAII를 익혔다면 절반은 온 것이고, 이 글은 직접 예외를 **던지고 잡는** 나머지 절반입니다.

② RAII에서 예외는 "소멸자가 정리해 주니 안심하라"는 **동기**로만 나왔습니다. 이 글은 그 예외 자체를 정면으로 봅니다.

## throw / try / catch — 기본 흐름

에러를 **던지면(throw)** 호출 스택을 거슬러 올라가 가장 가까운, 타입이 맞는 `catch`가 잡습니다.

```cpp
double divide(int a, int b) {
    if (b == 0) throw std::invalid_argument("divide by zero");
    return static_cast<double>(a) / b;
}

try {
    auto r = divide(10, 0);
} catch (const std::invalid_argument& e) {   // 타입으로 매칭
    std::cerr << e.what() << '\n';            // "divide by zero"
} catch (const std::exception& e) {           // 더 넓은 기반 타입 (뒤에 둔다)
    std::cerr << "other: " << e.what() << '\n';
}
```

- **던지는 것**은 아무 타입이나 가능하지만, 관례는 `std::exception`을 상속한 타입(`runtime_error`·`invalid_argument` 등)입니다. `.what()`으로 메시지를 얻습니다.
- **catch 순서**는 좁은 타입 → 넓은 타입. 기반 클래스(`std::exception`)를 먼저 두면 파생 타입이 영영 안 잡힙니다.
- **참조로 잡습니다**(`const&`) — 값으로 잡으면 슬라이싱(파생 정보 손실)이 납니다.

## 스택 언와인딩 — 예외와 RAII가 만나는 지점

`throw`가 일어나면, `catch`를 찾아 스택을 거슬러 올라가며 **그 사이의 지역 객체 소멸자를 전부 호출**합니다. 이걸 **스택 언와인딩(stack unwinding)**이라 합니다. RAII가 예외 앞에서 안전한 이유가 바로 이것입니다.

```cpp
void work() {
    std::lock_guard<std::mutex> lock(m);   // 자원 획득
    auto buf = std::make_unique<Buffer>(); // 힙 할당
    risky();                               // ★ 여기서 throw되면?
}   // lock과 buf의 소멸자가 언와인딩 중 자동 호출 → 락 해제, 메모리 해제
```

> **여기가 ②·③이 전제하던 그림입니다.** `risky()`가 예외를 던져도 `lock_guard`가 뮤텍스를 풀고 `unique_ptr`가 메모리를 놓습니다. **직접 `try/catch`로 정리 코드를 짤 필요가 없다** — 자원을 객체에 묶어(RAII) 두면 언와인딩이 알아서 정리합니다. 그래서 모던 C++의 답은 "`finally`가 없는 대신 RAII로 정리한다"입니다.

주의 하나 — **소멸자에서는 예외를 던지지 마세요.** 언와인딩 도중 소멸자가 또 예외를 던지면 `std::terminate`로 프로그램이 즉사합니다. 그래서 소멸자는 사실상 `noexcept`입니다(아래).

## 예외 안전 3등급 — "던져도 괜찮은 정도"

함수가 예외를 만났을 때 **상태를 얼마나 지켜 주느냐**를 등급으로 말합니다. 위로 갈수록 강한 보장입니다.

| 등급 | 보장 | 예 |
|---|---|---|
| **nothrow(무예외)** | 절대 던지지 않는다 | 소멸자, `swap`, `noexcept` 이동 |
| **strong(강한)** | 성공하거나, **아무 일도 없던 것처럼 원상복구**(commit-or-rollback) | `vector::push_back` |
| **basic(기본)** | 던져도 **누수 없고 객체는 유효한(단, 미지정) 상태** | 대부분의 연산 |
| (보장 없음) | 누수·손상 가능 | 피해야 함 |

- **basic**이 최소 목표입니다 — 던지더라도 자원이 새지 않고 파괴되지 않은 상태. RAII를 쓰면 대개 공짜로 얻습니다.
- **strong**은 "실패하면 손대기 전으로 되돌린다". 흔한 구현이 **copy-and-swap** — 사본에 작업하고 마지막에 `swap`(nothrow)으로 갈아끼우면, 중간에 던져도 원본은 그대로입니다.

> **언어 공통 개념**: "실패했을 때 어떻게 전달하고 상태를 지키나"는 언어마다 갈린다 — 예외(C++)·에러 값(Go)·`Result`(Rust). 세 모델 비교는 → [에러 핸들링 모델](/posts/concept/2026-07-12-error-handling-models/).

## noexcept — 안 던진다는 약속

`noexcept`는 "이 함수는 예외를 던지지 않는다"는 컴파일러·독자와의 계약입니다. 어긴 채 던지면 `std::terminate`입니다.

```cpp
Buffer(Buffer&& other) noexcept;   // 이동 생성자는 noexcept로
```

단순한 표식 같지만 **성능에 직결**됩니다. `std::vector`가 재할당(용량 증가)할 때, 기존 원소를 새 메모리로 옮깁니다. 이때:

- 이동 생성자가 **`noexcept`이면 → 이동**으로 옮깁니다(빠름).
- `noexcept`가 아니면 → 혹시 이동 중 예외가 나면 strong 보장이 깨지므로, 안전하게 **복사**로 옮깁니다(느림).

> **아, `std::move`를 배울 때 "이동 생성자는 noexcept로"라던 게 이거였구나.** 이동을 `noexcept`로 표시하지 않으면 `vector`가 이동을 포기하고 복사로 후퇴해, 애써 만든 이동 시맨틱이 무력화됩니다. → [이동 시맨틱과 스마트 포인터](/posts/cpp/2026-07-03-cpp-move-and-smart-pointers/)

## 언제 예외를 쓰나 — 예외 vs 에러 코드

예외가 늘 정답은 아닙니다. C++ 진영이 갈리는 지점입니다.

- **예외가 맞는 곳**: "정상 흐름에선 거의 안 나는" 예외적 실패. 생성자 실패처럼 **반환값으로 알릴 수 없는** 경우(생성자는 값을 못 돌려줌).
- **예외를 피하는 곳**: 게임·임베디드·고빈도 경로. 스택 언와인딩 비용과 예측 불가능성 때문에 예외를 끄고(`-fno-exceptions`) 에러 코드나 `std::expected`(C++23)를 씁니다.
- **던지지 말아야 할 것**: "일어나면 안 되는" 프로그래밍 버그(배열 범위 초과 등)는 예외가 아니라 `assert`로 즉시 중단이 맞습니다. → [에러 핸들링 모델](/posts/concept/2026-07-12-error-handling-models/)의 "복구 가능 에러 vs 버그".

## 자주 막히는 지점

- **catch를 값으로** — `catch (std::exception e)`는 슬라이싱으로 파생 정보를 잃습니다. 항상 `const&`.
- **catch 순서 뒤집힘** — 기반(`std::exception`)을 먼저 두면 파생 catch가 죽은 코드가 됩니다. 좁은 것부터.
- **소멸자에서 throw** — 언와인딩 중이면 `std::terminate`. 소멸자는 던지지 않게(`noexcept`) 짭니다.
- **이동 생성자에 noexcept 누락** — `vector`가 이동 대신 복사로 후퇴해 조용히 느려집니다.

> **통과 기준:** ① 예외 안전 basic과 strong의 차이를 한 문장으로 말하고, ② 이동 생성자에 `noexcept`를 왜 붙이는지 설명할 수 있으면 통과.

## Reference

- [cppreference — Exceptions](https://en.cppreference.com/w/cpp/language/exceptions) — `try`/`catch`/`throw`·`noexcept`의 1차 레퍼런스.
- [씹어먹는 C++ — 예외 처리](https://modoocode.com/229) — 한글 상세 설명.
- *Exceptional C++* (Herb Sutter) — 예외 안전 3등급·copy-and-swap의 고전.
