---
title       : "Java 동시성 — 작업·실행·결과·공유 상태의 네 축"
description : "Java 동시성을 Task, Executor, Result/Completion, Shared State Coordination의 네 축으로 나누고 Thread·Runnable·Callable·Future·CompletableFuture·Lock이 각각 어느 문제를 해결하는지 정리한다."
date        : 2026-01-04 12:54:36 +0900
updated     : 2026-09-06 09:55:00 +0900
categories  : [java, "동시성"]
tags        : [concurrency, multithreading]
pin         : false
hidden      : false
---

Java 동시성 API를 `Thread → Runnable → Future → CompletableFuture`의 버전 역사로만 외우면 서로 다른 책임이 한 줄에 섞인다. 먼저 **동시에 여러 작업을 다룰 때 무엇을 분리해야 하는지**를 잡는 편이 낫다.

```text
동시에 여러 작업을 처리한다
        ↓
무엇을 실행할까?
→ Task: Runnable / Callable

어디서 실행할까?
→ Executor / Thread Pool

결과와 완료를 어떻게 다룰까?
→ Future / CompletableFuture

공유 상태를 어떻게 안전하게 다룰까?
→ synchronized / volatile / Lock / Atomic
```

`Thread`는 이 전체 모델의 목적이 아니라 **실제 실행을 담당하는 자원**이다. 고수준 API는 작업과 Thread의 생명주기를 분리하고, 결과와 공유 상태의 문제를 별도 계층으로 다룬다.

## 1. Task — 무엇을 실행할 것인가

### Runnable

결과값 없이 실행할 작업을 표현한다.

```java
Runnable task = () -> doWork();
```

### Callable

결과를 반환하고 checked exception을 던질 수 있는 작업이다.

```java
Callable<Integer> task = () -> 42;
```

둘의 핵심은 **작업 정의를 Thread 자체와 분리한다는 것**이다.

```text
Task
≠
Thread
```

같은 Task도 직접 Thread에서 실행할 수 있고 Executor에 제출할 수도 있다.

## 2. Executor — 어디서 실행할 것인가

직접 Thread를 생성하면 작업마다 Thread 생성·종료 비용과 수명 관리를 호출 코드가 떠안는다.

```java
new Thread(task).start();
```

`ExecutorService`는 이 책임을 실행 계층으로 분리한다.

```java
ExecutorService executor = Executors.newFixedThreadPool(10);
executor.submit(task);
```

```text
Application
   ↓ submit(Task)
Executor
   ↓ Scheduling
Thread Pool
   ↓
실제 실행
```

따라서 Pool Size는 단순한 성능 숫자가 아니라 **동시에 실행할 작업 수를 제한하는 자원 정책**이다.

### CPU-bound와 I/O-bound

CPU-bound 작업은 실제 계산 자원이 병목이므로 코어 수 주변에서 병렬도를 시작해 측정한다. I/O-bound 작업은 대기 시간이 많아 더 높은 동시성이 유리할 수 있지만, 무제한 Thread 생성은 메모리·Context Switching·외부 시스템 부하를 키운다.

```text
CPU-bound
→ CPU 병렬 처리량이 한계

I/O-bound
→ 대기 시간 동안 다른 작업 실행 가능
→ 그래도 동시성 상한은 필요
```

따라서 운영에서는 단순 공식보다 Queue 길이, 처리량, Latency, 외부 자원 제한을 함께 본다.

## 3. Future — 실행과 결과 사이의 Handle

`ExecutorService.submit()`으로 결과가 있는 작업을 제출하면 `Future`를 받을 수 있다.

```java
Future<Integer> future = executor.submit(() -> 42);
```

`Future`는 작업 그 자체가 아니라 **아직 끝나지 않았을 수도 있는 결과를 가리키는 Handle**이다.

```java
Integer value = future.get();
```

`get()`은 결과가 준비될 때까지 현재 Thread를 기다리게 할 수 있다. 즉 "작업을 다른 Thread에서 실행했다"와 "호출자가 결과를 기다리지 않는다"는 같은 말이 아니다.

## 4. CompletableFuture — 기다림을 흐름 연결로 바꾼다

`Future`는 결과를 얻기 위해 `get()` 같은 대기 지점으로 돌아가기 쉽다. `CompletableFuture`는 완료 후 수행할 다음 단계를 연결할 수 있다.

```java
CompletableFuture
    .supplyAsync(this::fetch)
    .thenApply(this::process)
    .thenAccept(this::save);
```

```text
fetch 완료
   ↓
process
   ↓
save
```

핵심은 "무조건 Non-Blocking"이라는 이름표가 아니라 **완료를 기다리는 코드를 호출 흐름에 직접 박아 넣는 대신 Completion 관계를 구성할 수 있다는 것**이다.

반대로 마지막에:

```java
future.join();
```

을 호출하면 그 지점에서는 완료를 기다린다.

## 5. Blocking / Non-Blocking과 Sync / Async는 다른 축이다

동시성 설명에서 자주 섞이는 개념이다.

```text
Blocking / Non-Blocking
→ 호출한 Thread가 진행을 멈추는가?

Synchronous / Asynchronous
→ 완료 결과를 어떤 제어 흐름으로 전달받는가?
```

예를 들어:

```java
CompletableFuture<String> future =
    CompletableFuture.supplyAsync(this::fetch);

String value = future.join();
```

작업은 비동기적으로 시작했지만 `join()`에서는 현재 Thread가 완료를 기다릴 수 있다.

따라서 API 이름보다 **어디에서 실제 대기가 발생하는지**를 보는 것이 중요하다.

## 6. 공유 상태 — 실행 방식과 별개의 문제

Executor나 CompletableFuture를 쓴다고 공유 데이터가 자동으로 안전해지는 것은 아니다.

```text
여러 Thread
   ↓
같은 Mutable State 접근
   ↓
Visibility / Atomicity / Ordering 문제
```

여기서 Java Memory Model과 동기화 도구가 등장한다.

| 도구 | 주 역할 |
|---|---|
| `synchronized` | Mutual Exclusion + Memory Visibility |
| `volatile` | Visibility와 Ordering 경계 |
| `Atomic*` | 특정 단일 연산의 Atomic Update |
| `ReentrantLock` | 명시적 Lock, `tryLock`, interruptible lock 등 |
| `ReadWriteLock` | Read/Write Lock 분리 |

`volatile`은 단순히 "Thread-safe 변수"가 아니며 복합 연산 전체의 원자성을 보장하지 않는다. 자세한 경계는 [volatile vs static](./2026-04-01-java-volatile-vs-static.md)에서 다룬다.

Lock 선택은 [Java Lock 비교](./2026-05-11-java-lock-comparison.md)에서 이어진다.

## 7. 작업 간 Coordination 도구

공유 값을 보호하는 것과 여러 작업의 진행 순서를 조율하는 것도 구분한다.

| 도구 | 질문 |
|---|---|
| `CountDownLatch` | N개의 작업이 끝날 때까지 기다릴까? |
| `Semaphore` | 동시에 자원을 몇 개까지 사용할까? |
| `BlockingQueue` | Producer와 Consumer 사이에 작업을 어떻게 전달할까? |
| `CompletableFuture.allOf()` | 여러 비동기 Completion을 어떻게 합칠까? |

예:

```java
CompletableFuture.allOf(f1, f2, f3)
    .thenRun(this::done);
```

이는 Lock과 다른 문제를 해결한다. Lock은 공유 상태 접근을 조율하고, `allOf()`는 **작업 완료 관계**를 조합한다.

## 8. 전체 구조

```text
[Task]
Runnable / Callable
      ↓ submit
[Execution]
Executor / Thread Pool
      ↓
[Result / Completion]
Future / CompletableFuture
      ↓
다음 작업 연결

별도 축:
[Shared State]
synchronized / volatile / Lock / Atomic

[Coordination]
Latch / Semaphore / Queue / Completion composition
```

이 구조로 보면 Java 동시성 API는 하나의 진화 단계가 아니라 **서로 다른 책임을 분리해 온 도구 집합**이다.

## 선택 순서

실무에서는 API 이름보다 질문부터 잡는다.

```text
1. 작업 자체는 무엇인가?
2. 동시에 몇 개를 실행해야 하는가?
3. 결과가 필요한가?
4. 완료 후 다음 작업을 연결해야 하는가?
5. 공유 Mutable State가 있는가?
6. 작업 사이의 순서·자원 수를 조율해야 하는가?
```

그다음 `Runnable`, `Executor`, `Future`, `CompletableFuture`, Lock 계열을 선택한다.

## 정리

Java 동시성의 중심을 `Thread`에 놓으면 API가 계속 늘어나는 것처럼 보인다. 책임을 나누면 훨씬 단순하다.

```text
Task
→ 무엇을 할까

Executor
→ 어디서·얼마나 실행할까

Future / CompletableFuture
→ 결과와 완료를 어떻게 다룰까

Synchronization
→ 공유 상태를 어떻게 안전하게 다룰까

Coordination
→ 여러 작업의 관계를 어떻게 조율할까
```

**Thread는 실행 자원이고, Java 동시성 API의 핵심은 작업·실행·완료·공유 상태의 책임을 분리하는 것**이다.
