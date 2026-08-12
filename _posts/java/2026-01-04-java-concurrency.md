---
title       : Java 동시성 모델 정리
description : "Thread 직접 사용부터 Runnable·Callable·Future·ExecutorService·CompletableFuture까지 자바 동시성 모델의 진화 과정을 단계별로 정리한다."
date        : 2026-01-04 12:54:36 +0900
updated     : 2026-01-04 12:55:51 +0900
categories  : [java, "동시성"]
tags        : [concurrency, multithreading]
pin         : false
hidden      : false
---

## 1. 자바 동시성 모델의 진화

### Thread 직접 사용 (초기 모델)

```java
new Thread(() -> doWork()).start();
```

**문제점**

* 스레드 생성 비용 큼
* 관리 불가
* 예외 처리 어려움
* 서버 환경에서 확장 불가

Thread는 *실행 수단*이지, 작업 모델이 아님

---

### Runnable – 작업 개념 도입

```java
Runnable task = () -> doWork();
new Thread(task).start();
```

* 작업(Task)과 실행(Thread) 분리
* 결과 반환 불가

---

## 블로킹/논블로킹, 동기/비동기 정리

동시성 논의에서 자주 섞이는 두 축을 분리해서 보면 결정이 쉬워진다.

- **Blocking / Non-Blocking**: 호출이 끝날 때까지 호출자가 멈추는가?
- **Synchronous / Asynchronous**: 결과를 기다리는 정책이 호출자 쪽에 있나, 완료를 알림으로 넘기나?

| 호출 반환 | 완료 대기 방식 | 의미 |
|---|---|---|
| Blocking | Synchronous | `future.get()`에서 스레드가 멈춰 결과를 받는 형태 |
| Non-Blocking | Synchronous | 즉시 돌아오지만 폴링/상태조회로 완료를 확인 |
| Non-Blocking | Asynchronous | 콜백/이벤트/`CompletionStage` 체인을 통해 완료를 전파 |
| Blocking | Asynchronous | 구조상 가능하나 운영상 이득이 적은 편 |

Java의 `CompletableFuture`는 기본 API만 봐도 이 조합을 드러낸다. `supplyAsync`로 시작한 작업은 "비동기 실행"이고, `get/join`에서 동기 대기가 생기면 블로킹-동기 구간이 된다.

```java
CompletableFuture
  .supplyAsync(this::heavy)
  .thenApply(this::decode);
```

`thenApply`는 앞단 결과가 준비될 때까진 기다리지 않는 것이 아니라, **연쇄 구성**을 만든다. 실행은 실행자 풀의 스레드에 배치되고, 대기 지점에서만 블로킹이 생긴다.

---

## CPU-bound vs I/O-bound와 스레드 풀 튜닝

CPU-bound와 I/O-bound의 구분은 스레드 풀 전략에 직접 들어간다. 일반적인 가이드:

- **CPU-bound 작업**: 병렬 계산이 핵심이므로 풀 크기를 `코어 수` 또는 `코어 수+1` 근처로 둔다.
- **I/O-bound 작업**: 소켓·디스크 대기가 많으면 더 많은 스레드를 둬도 대기 시간을 숨길 수 있다.
- 다만 무한 확장은 컨텍스트 스위칭과 메모리 압박을 만들므로 큐/타임아웃 정책이 필수.

```java
ExecutorService cpuPool = Executors.newFixedThreadPool(Runtime.getRuntime().availableProcessors() + 1);
ExecutorService ioPool = Executors.newCachedThreadPool();   // 또는 bounded queue/timeout 조합
```

`newCachedThreadPool()`은 편하지만 폭주 상황에서 스레드 폭주를 부를 수 있어, 프로덕션에서는 큐 용량과 거부 정책을 직접 가진 커스텀 `ThreadPoolExecutor`가 안전하다.

---

### Callable + Future (Java 5)

```java
Callable<Integer> task = () -> 42;
Future<Integer> future = executor.submit(task);
```

* 결과 반환 가능
* 예외 처리 가능
* 하지만 `get()`은 블로킹

---

### ExecutorService – 실무 표준

```java
ExecutorService executor = Executors.newFixedThreadPool(10);
executor.submit(task);
```

* 스레드 풀 관리
* 리소스 제어
* 서버 애플리케이션 핵심 구성요소

---

### CompletableFuture (Java 8)

```java
CompletableFuture
    .supplyAsync(() -> fetch())
    .thenApply(data -> process(data))
    .thenAccept(result -> save(result));
```

* 비동기 파이프라인
* 콜백 지옥 해결
* 함수형 인터페이스 적극 활용

---

## 2. 핵심 구성 요소

### Task (작업)

| 인터페이스    | 설명              |
| -------- | --------------- |
| Runnable | 실행만 수행          |
| Callable | 실행 + 결과 반환 + 예외 |

→ **동시성을 위한 함수형 인터페이스**

---

### Executor / ExecutorService

* Thread 생성 및 관리 책임자
* 작업 스케줄링

```java
executor.submit(task);
```

---

### Future

* 비동기 작업의 결과 핸들
* 상태 확인 / 결과 대기

```java
future.get(); // blocking
```

---

### CompletableFuture

* Future 확장
* 논블로킹 체인 처리
* 동시성 + 함수형 프로그래밍 융합

---

## 3. 동시성 vs 병렬성

| 구분  | 의미        |
| --- | --------- |
| 동시성 | 여러 작업을 관리 |
| 병렬성 | 실제 동시에 실행 |

→ Java 동시성 모델은 **관리 중심**

---

## 4. Java Memory Model (JMM) 핵심

### 왜 필요한가?

* CPU 캐시
* 명령어 재정렬
* 가시성 문제

### 주요 키워드

| 키워드            | 의미         |
| -------------- | ---------- |
| synchronized   | 원자성 + 가시성  |
| volatile       | 가시성 보장     |
| happens-before | 메모리 가시성 규칙 |

---

## 5. 고수준 동시성 도구

| 도구                   | 용도         |
| -------------------- | ---------- |
| Lock / ReentrantLock | 고급 락 제어    |
| Atomic*              | 락 없는 원자 연산 |
| CountDownLatch       | 스레드 대기     |
| Semaphore            | 자원 제어      |
| BlockingQueue        | 생산자-소비자 패턴 |

---

## 6. CompletableFuture의 의미

### 기존 방식

```java
f1.get();
f2.get();
```

### 비동기 흐름 방식

```java
CompletableFuture
  .allOf(f1, f2)
  .thenRun(() -> done());
```

→ **결과 대기 → 흐름 연결**

---

## 7. 전체 구조 요약

```text
[Task]
 Runnable / Callable
        ↓
[Executor]
 Thread Pool
        ↓
[Future]
        ↓
[CompletableFuture]
 (Async Flow)
```

---

## 8. 핵심 문장 요약

1. Thread는 직접 관리하지 않는다
2. Task와 실행은 분리된다
3. Executor는 스레드를 관리한다
4. Future는 결과 핸들이다
5. CompletableFuture는 비동기 흐름이다

## Java 동시성 시리즈

| 글 | 다루는 것 |
| --- | --- |
| **Java 동시성 모델 (현재 글)** | Thread→Executor→Future→CompletableFuture 흐름과 책임 분리 |
| [volatile vs static](/posts/java/2026-04-01-java-volatile-vs-static/) | 메모리 가시성 키워드의 의미와 조합 선택 기준 |
| [Java Lock 비교 — synchronized · ReentrantLock · ReadWriteLock · StampedLock](/posts/java/2026-05-11-java-lock-comparison/) | 락 4종의 보장·재진입성·tryLock·낙관적 읽기 |
