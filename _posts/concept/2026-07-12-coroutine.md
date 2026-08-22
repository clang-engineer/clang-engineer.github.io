---
title       : 코루틴이란 무엇인가 — 스레드와 무엇이 다른가
description : "코루틴의 핵심인 suspend/resume과 상태 보존을 언어에 종속되지 않게 정리하고, 스레드·async/await·goroutine과의 경계를 설명한다. stackful/stackless 구현과 실행 정책을 분리해 본다."
date        : 2026-07-12 14:00:00 +0900
updated     : 2026-08-22 17:00:00 +0900
categories  : [concept]
tags        : [coroutine, concurrency, async]
pin         : false
hidden      : false
---

> **난이도** 중급 · **선행** 없음. 스레드를 들어봤으면 충분하다.
>
> 🗺️ [프로그래밍 언어 개념 로드맵](/posts/concept/2026-07-13-concept-roadmap/)의 한 편

## 한 줄 요약

코루틴(coroutine)은 **실행 도중 중단(suspend)하고, 나중에 그 지점의 상태를 보존한 채 재개(resume)할 수 있는 실행 단위**다. 핵심은 특정 문법이나 스레드 수가 아니라 **중단과 재개 사이에 실행 상태가 유지된다는 것**이다.

`async`/`await`, generator, Kotlin coroutine 등은 이 개념을 활용하지만 서로 같은 실행 모델은 아니다. Go의 goroutine도 가벼운 동시 실행 단위라는 점에서 자주 함께 비교되지만, 언어 수준에서 명시적으로 suspend/resume하는 일반적인 stackless coroutine과 그대로 동일시하면 안 된다.

## 1. 일반 함수와 무엇이 다른가

일반 함수는 호출되면 실행을 이어가다가 반환한다. 반환이 끝나면 그 호출의 실행 위치를 다시 이어서 사용할 수 없다.

```text
일반 함수: 호출 → 실행 ─────────────▶ return
코루틴:    시작 → 실행 → suspend ⇢ resume → 실행 → ... → 완료
```

코루틴은 중단 시점의 **실행 위치와 필요한 지역 상태**를 보존한다. 다시 재개하면 처음부터 호출하는 것이 아니라 중단했던 지점에서 이어간다.

Python generator가 가장 단순한 예다.

```python
def numbers():
    n = 0
    while True:
        yield n
        n += 1

gen = numbers()
next(gen)  # 0
next(gen)  # 1
next(gen)  # 2
```

`yield`할 때 `n`과 다음 실행 위치가 보존된다.

## 2. 코루틴과 스레드는 비교 축이 다르다

스레드는 주로 **누가 CPU 실행을 스케줄링하는가**와 관련된 실행 단위이고, 코루틴은 **실행 상태를 중단·재개할 수 있는가**에 초점이 있다. 둘은 대체 관계라기보다 서로 다른 층이다.

| | 스레드 | 코루틴 |
|---|---|---|
| 핵심 | OS 또는 런타임이 스케줄링하는 실행 흐름 | 중단·재개 가능한 실행 상태 |
| 상태 | 보통 독립 스택과 레지스터 상태 | 프레임 또는 전용 스택 등 구현에 따라 다름 |
| 전환 | OS 선점 또는 런타임 스케줄링 | 명시적 중단 지점 또는 런타임 정책 |
| 관계 | 코루틴을 실행하는 바탕이 될 수 있음 | 하나 이상의 스레드 위에서 실행될 수 있음 |

실전에서는 **소수의 OS 스레드 위에 많은 경량 실행 단위를 올리는 구조**가 흔하다. Kotlin coroutine, Rust async executor, Go runtime은 세부 구현은 다르지만 모두 이 관점에서 이해할 수 있다.

### Go goroutine은 왜 따로 봐야 하나

Go의 goroutine은 Go 런타임이 스케줄링하는 **stackful 경량 실행 단위**다. 함수 안에 `await` 같은 명시적 중단 문법이 없어도 런타임이 스케줄링하고 선점할 수 있다.

따라서 `goroutine = coroutine`으로 외우기보다, coroutine은 중단·재개 가능한 실행 상태라는 일반 개념이고 goroutine은 Go 런타임이 제공하는 경량 동시 실행 단위라고 구분하는 편이 정확하다. 둘은 역사와 구현 계보가 맞닿아 있지만 스케줄링 의미론까지 같은 것은 아니다.

## 3. Blocking/Non-Blocking과 Sync/Async는 별도 축이다

코루틴을 이해할 때 가장 자주 섞이는 개념이다.

- **Blocking / Non-Blocking**: 호출했을 때 현재 실행 흐름을 붙잡아 두는가.
- **Synchronous / Asynchronous**: 결과가 현재 호출 흐름에서 직접 이어지는가, 나중의 완료 통지·재개 경로로 이어지는가.

`await`을 쓴다고 자동으로 새 스레드가 생기는 것은 아니다. 비동기 I/O에서는 현재 코루틴을 중단하고 실행기를 다른 작업에 넘겼다가 I/O가 준비되면 다시 재개할 수 있다.

반대로 코루틴 안에서 blocking API를 호출하면 **그 코루틴을 실행하던 스레드 자체가 막힐 수 있다**. 코루틴과 non-blocking I/O는 잘 어울리지만 같은 개념은 아니다.

## 4. 코루틴의 핵심은 상태 보존이다

중단된 코루틴이 다시 이어지려면 최소한 다음 정보가 남아 있어야 한다.

- 다음에 실행할 위치
- 중단 이후에도 필요한 지역 변수
- 호출·예외 처리 등에 필요한 실행 상태

stackless coroutine은 이런 정보를 보통 **코루틴 프레임**으로 표현한다. 프레임은 흔히 힙에 놓이지만 반드시 그런 것은 아니다. 컴파일러 최적화와 수명 분석에 따라 호출자 저장공간이나 다른 위치에 둘 수도 있다.

stackful coroutine은 독립적인 스택을 보존한다. 따라서 `stackful vs stackless`는 **코루틴인가 아닌가**의 구분이 아니라 **중단 상태를 어떻게 저장하느냐**의 구현 차이다.

```text
코루틴의 본질
= suspend/resume + 상태 보존

구현 선택
├─ stackless → 필요한 상태를 프레임으로 변환
└─ stackful  → 실행 스택 자체를 보존
```

## 5. async/await은 코루틴을 쓰는 대표 문법이다

`async`/`await`은 많은 언어에서 stackless coroutine을 다루기 쉽게 만든 문법이다.

```text
async 함수 시작
   ↓
I/O 요청
   ↓
await
   ↓
코루틴 중단 + 제어권 반환
   ↓
다른 작업 실행
   ↓
I/O 완료
   ↓
코루틴 재개
```

여기서 중요한 것은 **기다리는 작업이 있다고 해서 실행 스레드가 반드시 기다리는 것은 아니라는 것**이다. 이벤트 루프나 executor가 준비된 다른 작업을 실행할 수 있다.

다만 언어마다 실행기가 다르다. JavaScript의 이벤트 루프, Python `asyncio`, Rust executor, Kotlin dispatcher를 모두 같은 내부 구현으로 생각하면 안 된다.

## 6. 코루틴이라고 락이 사라지지는 않는다

단일 스레드 이벤트 루프에서도 `await`을 낀 read-modify-write는 원자적이지 않다.

```python
x = shared.count
await something()
shared.count = x + 1
```

`await` 사이에 다른 코루틴이 `shared.count`를 바꾸면 갱신을 잃을 수 있다. 그래서 `asyncio.Lock` 같은 동기화 도구가 존재한다.

또한 코루틴이 여러 스레드에서 실행될 수 있는 런타임이라면 일반적인 스레드 안전 문제도 함께 고려해야 한다.

> 코루틴은 **실행을 어떻게 멈추고 이어가느냐**의 문제다. 여러 실행 흐름이 데이터를 어떻게 공유하고 보호하는지는 [동시성 조율 모델 — 공유 상태 vs 메시지 전달](/posts/concept/2026-07-12-concurrency-coordination-models/)의 문제다.

## 7. C++에서 보면 경계가 더 잘 보인다

C++의 `std::async`와 C++20 coroutine은 같은 것이 아니다.

- `std::async` — 작업을 비동기적으로 실행하고 `future`로 결과를 받는 실행 API
- C++20 coroutine — 함수가 중단·재개될 수 있도록 만드는 언어 기능

C++20 coroutine은 `co_await`, `co_yield`, `co_return`을 사용하고, 컴파일러는 필요한 상태를 coroutine frame으로 변환한다. 프레임의 수명과 실행 정책은 promise type·반환 타입·executor 같은 주변 설계가 결정한다.

즉 coroutine 자체가 **스레드나 이벤트 루프를 자동으로 제공하는 것은 아니다**.

## 한눈에 정리

| 개념 | 답하는 질문 |
|---|---|
| 스레드 | 어떤 실행 흐름이 CPU에서 돌아가는가 |
| 코루틴 | 실행을 중단했다가 상태를 유지한 채 다시 이어갈 수 있는가 |
| async/await | 비동기 작업과 코루틴의 중단·재개를 어떻게 표현하는가 |
| 이벤트 루프 / executor | 준비된 작업을 언제 다시 실행할 것인가 |
| 채널 / Mutex | 여러 실행 흐름이 데이터를 어떻게 조율할 것인가 |

핵심은 이 개념들을 한 줄의 상하 관계로 만들지 않는 것이다.

```text
실행 상태       코루틴
스케줄링        스레드 / 이벤트 루프 / executor
I/O 대기 방식   blocking / non-blocking
완료 흐름       synchronous / asynchronous
상태 조율       mutex / channel / actor
```

각각 다른 질문에 답한다.

## 스스로 점검

**1. 코루틴의 핵심 조건은 무엇인가?**

<details markdown="1">
<summary>답</summary>

실행 중간에 중단하고, 필요한 실행 상태를 보존한 뒤, 나중에 그 지점에서 재개할 수 있는 것이다.

</details>

**2. `await`을 쓰면 새 스레드가 생기는가?**

<details markdown="1">
<summary>답</summary>

아니다. `await`은 보통 현재 코루틴을 중단하고 제어권을 실행기에게 돌려준다. 실제 작업이 어느 스레드에서 수행되는지는 런타임·executor·대상 API에 따라 다르다.

</details>

**3. Go goroutine과 coroutine은 같은가?**

<details markdown="1">
<summary>답</summary>

가벼운 중단·재개 가능한 실행이라는 공통점은 있지만 그대로 같은 의미론은 아니다. goroutine은 Go 런타임이 스케줄링하는 stackful 경량 실행 단위이고, 일반적인 async coroutine은 명시적 중단 지점을 가진 stackless 상태 머신으로 구현되는 경우가 많다.

</details>
