---
title       : Java 동시성 모델 정리
description : 
date        : 2026-01-04 12:54:36 +0900
updated     : 2026-01-04 12:55:51 +0900
categories  : [dev, java]
tags        : [java, concurrency, multithreading, jmm, completablefuture]
pin         : false
hidden      : false
---

## 1. 자바 동시성 모델의 진화

### 1️⃣ Thread 직접 사용 (초기 모델)

```java
new Thread(() -> doWork()).start();
```

**문제점**

* 스레드 생성 비용 큼
* 관리 불가
* 예외 처리 어려움
* 서버 환경에서 확장 불가

👉 Thread는 *실행 수단*이지, 작업 모델이 아님

---

### 2️⃣ Runnable – 작업 개념 도입

```java
Runnable task = () -> doWork();
new Thread(task).start();
```

* 작업(Task)과 실행(Thread) 분리
* 결과 반환 불가

---

### 3️⃣ Callable + Future (Java 5)

```java
Callable<Integer> task = () -> 42;
Future<Integer> future = executor.submit(task);
```

* 결과 반환 가능
* 예외 처리 가능
* 하지만 `get()`은 블로킹

---

### 4️⃣ ExecutorService – 실무 표준

```java
ExecutorService executor = Executors.newFixedThreadPool(10);
executor.submit(task);
```

* 스레드 풀 관리
* 리소스 제어
* 서버 애플리케이션 핵심 구성요소

---

### 5️⃣ CompletableFuture (Java 8)

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

👉 **동시성을 위한 함수형 인터페이스**

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

👉 Java 동시성 모델은 **관리 중심**

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

👉 **결과 대기 → 흐름 연결**

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
3. Executor가 스레드를 관리한다
4. Future는 결과 핸들이다
5. CompletableFuture는 비동기 흐름이다

