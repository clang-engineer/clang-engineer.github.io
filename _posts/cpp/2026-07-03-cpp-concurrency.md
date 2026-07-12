---
title       : 동시성 ⑥ 스레드와 비동기
description : "여러 작업을 동시에 돌릴 때의 C++ 표준 도구. std::thread와 join, 데이터 레이스를 막는 mutex, 결과를 기다리는 future/async를 예제로 짚고, 데드락·미조인 같은 대표적 함정을 정리한다."
date        : 2026-07-03 11:00:00 +0900
updated     : 2026-07-03
categories  : [cpp]
tags        : [roadmap, modern-cpp]
pin         : false
hidden      : false
---

> [모던 C++ 학습 로드맵](/posts/cpp/2026-07-03-cpp-learning-roadmap/)의 **고급(동시성)** 단계입니다. 앞 글: [⑤ 템플릿](/posts/cpp/2026-07-03-cpp-templates/)

동시성은 **[나중] 묶음**입니다. 멀티스레드 프로그램을 짤 일이 생기기 전엔 통째로 미뤄도 됩니다. 다만 필요해지는 순간 함정이 많은 영역이라, 최소한의 지도를 잡아둡니다.

## 스레드 만들기 — std::thread

```cpp
#include <thread>

void work(int id) { std::cout << "worker " << id << "\n"; }

std::thread t(work, 1);   // 새 스레드에서 work(1) 실행
t.join();                 // ★ t가 끝날 때까지 대기
```

`join()`은 그 스레드가 끝나기를 기다립니다. **`join()`(또는 `detach()`) 없이 `thread` 객체가 소멸하면 프로그램이 즉시 종료(terminate)** 됩니다. 스레드를 만들었으면 반드시 둘 중 하나로 마무리해야 합니다.

## 데이터 레이스 — mutex로 보호

두 스레드가 같은 데이터를 동시에 쓰면 결과가 깨집니다(데이터 레이스). 공유 데이터는 **뮤텍스(mutex)** 로 한 번에 하나만 접근하게 막습니다.

```cpp
#include <mutex>

int counter = 0;
std::mutex m;

void increment() {
    std::lock_guard<std::mutex> lock(m);   // 잠금 — 스코프 벗어나면 자동 해제(RAII)
    counter++;                             // 이 구간은 한 번에 한 스레드만
}
```

`lock_guard`가 RAII입니다 — 직접 `lock()`/`unlock()`을 부르지 않고, 객체 수명으로 잠금을 관리해 "언락 깜빡"을 원천 차단합니다. 앞 단계에서 배운 RAII가 여기서도 그대로 쓰입니다.

## 결과를 기다리기 — async와 future

스레드를 직접 다루는 대신, "이 작업을 비동기로 돌리고 나중에 결과를 받겠다"를 표현하는 게 `std::async`와 `std::future`입니다. 더 높은 수준이라 대부분 이걸로 충분합니다.

```cpp
#include <future>

int heavy() { /* 오래 걸리는 계산 */ return 42; }

std::future<int> f = std::async(std::launch::async, heavy);
// ... 그동안 다른 일 ...
int result = f.get();   // 결과가 준비될 때까지 대기 후 받음
```

`thread` + 수동 결과 전달보다 안전하고 읽기 쉽습니다. 동시성이 처음이면 `async`부터 시작하세요.

## 더 깊은 곳 [선택]

- **조건 변수(`condition_variable`)** — "어떤 조건이 될 때까지 스레드를 재운다". 생산자-소비자 패턴에 쓰입니다.
- **`atomic`과 메모리 순서** — 뮤텍스 없이 원자적 연산. 성능이 극한으로 필요할 때의 저수준 도구입니다. 어렵고, 대부분은 뮤텍스로 충분합니다.
- **스레드풀** — 스레드를 매번 만들지 않고 재사용하는 실전 구조. 위 도구들을 조합해 직접 만들어 보면 좋은 종합 훈련입니다.
- **코루틴(C++20, `co_await`)** — 스레드를 늘리지 않고 수만 개의 비동기 작업을 한 스레드로 돌리는 경량 동시성. 로드맵 [필수] 밖이지만, 스레드와 무엇이 다른지·C++20 기계(`promise_type`·`coroutine_handle`)·이벤트 루프는 언어 공통 개념으로 → [코루틴이란 무엇인가](/posts/concept/2026-07-12-coroutine/).

## 자주 막히는 지점

- **미조인(join 누락)** — `thread`를 join/detach 없이 버리면 즉시 terminate.
- **락 없이 공유 데이터 접근** — 눈에 안 보이는 데이터 레이스. 크래시가 늦게, 재현 안 되게 터집니다.
- **데드락** — 두 스레드가 서로가 쥔 락을 기다리면 영원히 멈춥니다. 여러 락은 **항상 같은 순서로** 잠그세요.
- **`future.get()`을 두 번 호출** — `get()`은 한 번만. 두 번째는 예외입니다.

## 통과 기준

- `thread`를 만들고 `join`으로 안전하게 마무리할 수 있다.
- 데이터 레이스가 무엇이고 `lock_guard`로 어떻게 막는지 설명할 수 있다.
- 단순 비동기 결과는 `async`/`future`로 처리할 수 있다.

다음은 **모던 문법과 표준 라이브러리**입니다. `auto`·`constexpr`처럼 코드를 짧고 안전하게 만드는 문법들을 정리합니다.

## Reference

- [씹어먹는 C++ 강좌 15강 (modoocode)](https://modoocode.com/category/C++) — 스레드·뮤텍스·async·atomic의 한글 상세
- [cppreference — Thread support library](https://en.cppreference.com/w/cpp/thread)
