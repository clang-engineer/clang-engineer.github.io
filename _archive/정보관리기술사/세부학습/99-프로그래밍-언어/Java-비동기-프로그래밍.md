# Java 비동기 프로그래밍 — Executor · Future · CompletableFuture · Virtual Thread

> 상위 개념: [`비동기-실행-모델.md`](비동기-실행-모델.md)
>
> 학습 원칙: [`00-프로그래밍-언어-학습원칙.md`](00-프로그래밍-언어-학습원칙.md)
>
> 핵심 질문: **Java에서는 작업, 실행 Thread, 미래 결과, 후속 실행을 각각 무엇으로 표현하고 누가 실제 실행을 담당하는가?**

---

## 이 문서의 위치

이 문서는 [`비동기-실행-모델.md`](비동기-실행-모델.md)에서 정리한 **언어 공통의 비동기 실행 원리**를 Java/JVM/Spring 생태계에 대입하는 Zoom-in 문서다.

```text
거시
비동기-실행-모델.md
Callback / Event Loop / Promise·Future / Coroutine / async·await / Runtime
        ↓ Java에 대입
미시
Java-비동기-프로그래밍.md
Runnable / Callable / Executor / Future / CompletableFuture / Virtual Thread
        ↓ Framework 확장
Spring @Async / WebFlux
```

따라서 이 문서에서는 비동기의 일반 원리를 다시 처음부터 설명하기보다, **Java에서는 그 역할을 어떤 API와 Runtime 구조가 담당하는가**를 중심으로 본다.

---

## 1. 큰 그림 — 비동기와 Thread를 같은 것으로 보지 않는다

비동기(Asynchronous)는 작업 완료를 현재 호출 흐름에서 바로 기다리지 않고 완료 이후의 처리를 연결하는 제어 흐름의 성질이다. Thread는 작업을 실제로 실행하는 실행 자원 중 하나다.

```text
무엇을 실행할까?
→ Runnable / Callable

누가 실행할까?
→ Executor / Thread

아직 없는 결과는?
→ Future / CompletableFuture

완료 후 무엇을 할까?
→ CompletionStage / CompletableFuture Chain

기다림의 비용은?
→ Non-blocking I/O / Virtual Thread 등
```

이 질문들은 같은 분류축이 아니다.

---

## 2. C++ 기준점 — Task와 Thread를 분리한다

가장 직접적인 대응은 다음과 같다.

```text
C++ std::thread
↔ Java Thread

C++ Lambda / Function Object
↔ Java Runnable / Callable
```

```java
Thread thread = new Thread(() -> doWork());
thread.start();
```

하지만 실무 Java에서는 작업마다 Thread를 직접 만들기보다 Executor에 Task를 제출하는 구조를 많이 사용한다.

```text
직접 실행
Task ─────→ Thread

Executor 사용
Task → Executor → Worker Thread → 실행
```

C++에서 Thread Pool이나 Task Scheduler를 만들어 Queue와 Worker Thread를 관리하는 구조를 떠올리면 이해하기 쉽다.

---

## 3. Runnable / Callable — 작업을 표현한다

`Runnable`과 `Callable`은 Thread가 아니라 실행할 작업을 표현하는 Interface다.

```java
Runnable task = () -> doWork();
Callable<Integer> taskWithResult = () -> compute();
```

```text
Runnable
→ 반환값 없는 작업

Callable<V>
→ V를 만드는 작업
→ checked exception 가능
```

핵심은 **Task와 실행 Thread가 별개**라는 것이다.

---

## 4. Executor — 실행 정책을 분리한다

`Executor`는 Task를 받아 실제 실행을 위임한다.

```java
executor.execute(task);
```

`ExecutorService`는 Task 제출, Lifecycle 관리, Future 반환 등을 제공한다.

```java
ExecutorService executor = Executors.newFixedThreadPool(4);
Future<Integer> future = executor.submit(() -> compute());
```

```text
Caller
  │ submit
  ▼
Executor
  ├─ Task Queue
  └─ Worker Thread(s)
        │
        ▼
      Task 실행
```

사고의 중심이 `Thread를 만든다`에서 **`Task를 실행 정책에 제출한다`**로 바뀐다.

---

## 5. Future — 미래 결과를 나타내는 Handle

`Future<V>`는 아직 완료되지 않았을 수도 있는 작업의 결과를 나타낸다. C++의 `std::future<T>`를 기준점으로 삼을 수 있다.

```java
Future<Integer> future = executor.submit(() -> compute());
doSomethingElse();
int value = future.get();
```

중요한 경계는 `get()`이다. 결과가 준비되지 않았다면 호출 Thread는 Blocking된다.

```text
작업은 비동기로 실행
        +
future.get()에서 현재 Thread는 Blocking 가능
```

따라서 **비동기 ≠ Non-blocking**이다.

---

## 6. CompletableFuture — 완료 이후의 흐름을 연결한다

`CompletableFuture<T>`는 미래 결과를 표현하면서 후속 Stage를 연결할 수 있다.

```java
CompletableFuture
    .supplyAsync(() -> loadData())
    .thenApply(data -> transform(data))
    .thenAccept(result -> save(result));
```

```text
loadData
   ↓ 완료
transform
   ↓ 완료
save
```

C++의 `std::future`라는 기준점에 Continuation을 연결하는 기능이 더해졌다고 생각하면 이해하기 쉽다. 두 API의 의미론이 같다는 뜻은 아니다.

```text
Future
→ 미래 결과

CompletableFuture
→ 미래 결과 + 완료 이후 Stage 조합
```

### thenApply와 thenCompose

```text
다음 함수가 일반 값을 반환
→ thenApply

다음 함수도 CompletableFuture를 반환
→ thenCompose
```

```java
loadUser().thenApply(user -> user.getName());
loadUser().thenCompose(user -> loadOrder(user));
```

`thenCompose`는 중첩된 비동기 결과를 하나의 Stage 흐름으로 연결할 때 사용한다.

---

## 7. CompletableFuture는 Thread가 아니다

```text
CompletableFuture
= 결과와 완료 Stage 표현

Executor / Thread
= 실제 코드 실행
```

```java
CompletableFuture.supplyAsync(() -> loadData());
```

명시적 Executor가 없는 일반적인 async 실행은 `ForkJoinPool.commonPool()`을 기본 비동기 실행 Facility로 사용한다. 직접 Executor를 지정할 수도 있다.

```java
CompletableFuture.supplyAsync(
    () -> loadData(),
    executor
);
```

따라서 항상 두 질문을 분리한다.

```text
작업 관계는 어떻게 연결되는가?
→ CompletableFuture Chain

실제 작업은 어디서 실행되는가?
→ Executor / 실행 Context
```

`thenApply()`와 `thenApplyAsync()`도 단순히 `동기 vs 비동기`로 외우지 않는다. Non-async Stage는 완료를 발생시킨 Thread 등에서 실행될 수 있고, async 계열은 기본 비동기 Facility 또는 명시한 Executor를 사용한다.

---

## 8. CompletableFuture로 감싸도 Blocking I/O는 Blocking I/O다

```java
CompletableFuture.supplyAsync(() -> repository.findAll());
```

내부가 Blocking JDBC라면 Caller는 기다리지 않고 진행할 수 있지만 JDBC를 수행하는 Worker Thread는 DB 응답을 기다릴 수 있다.

```text
Caller Thread
  ├─ Task 제출
  └─ 계속 진행

Worker Thread
  └─ Blocking JDBC
       └─ 응답까지 대기
```

즉:

```text
비동기 호출
≠ Non-blocking I/O
```

`CompletableFuture`는 Blocking API를 자동으로 Non-blocking API로 바꾸는 장치가 아니다.

---

## 9. Virtual Thread — 다른 축의 해결책

Virtual Thread는 `CompletableFuture`와 다른 문제를 해결한다. JVM이 스케줄링하는 경량 Thread를 이용해 Thread-per-task 스타일을 많은 동시 작업에 적용하기 쉽게 한다.

```java
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    Future<String> future = executor.submit(() -> blockingCall());
    String result = future.get();
}
```

```text
CompletableFuture
→ 완료 흐름을 Stage로 조합
→ 비동기 Pipeline 표현

Virtual Thread
→ Thread-per-task의 비용을 낮춤
→ Blocking 스타일 코드를 유지하며 높은 동시성 처리
```

Virtual Thread를 사용한다고 I/O 자체가 Non-blocking I/O로 바뀌는 것은 아니다.

---

## 10. Spring @Async — Spring의 실행 위임

`@Async`는 Java 언어나 JVM 기능이 아니라 Spring Framework 기능이다.

```text
Caller
  │ Method 호출
  ▼
Spring Proxy / Interceptor
  │ 실행 위임
  ▼
TaskExecutor
  │
  ▼
Method 실행
```

따라서 확인할 것은 다음 두 가지다.

```text
호출을 누가 가로채는가?
→ Spring Proxy

실제 작업을 누가 실행하는가?
→ TaskExecutor
```

`@Async` 역시 내부 Blocking I/O를 Non-blocking I/O로 바꾸지 않는다. 기본 Proxy mode에서 같은 객체 내부 호출(Self-invocation)은 Proxy를 거치지 않으므로 기대한 비동기 Interception이 적용되지 않을 수 있다.

---

## 11. WebFlux — @Async와 같은 모델이 아니다

Spring WebFlux는 Reactive Programming과 Non-blocking I/O를 중심으로 설계된 Web Stack이다.

```text
@Async
Task → TaskExecutor → 다른 실행 Context

WebFlux / Reactive
Data / Event 준비
→ Non-blocking 처리 흐름
→ Publisher와 Runtime/Scheduler가 후속 처리 연결
```

`Mono`, `Flux`는 값의 흐름과 완료·실패를 표현한다. 그렇다고 `Reactive = Single Thread` 또는 `WebFlux = Thread가 없음`이라는 뜻은 아니다. 실제 Thread와 Scheduler는 구성에 따라 달라질 수 있다.

Reactive Streams와 Backpressure의 상세 내용은 별도 학습 대상으로 둔다.

---

## 12. 실무에서 비동기 코드를 읽는 네 질문

```text
1. 현재 코드를 실제로 실행하는 Thread는 누구인가?

2. 오래 걸리는 작업은 Blocking인가 Non-blocking인가?

3. 다른 실행 Context에 넘긴다면 Executor는 무엇인가?

4. 결과를 기다리는가, 완료 후의 흐름을 연결하는가?
```

예를 들어:

```java
CompletableFuture
    .supplyAsync(() -> jdbcCall(), executor)
    .thenApply(this::transform);
```

```text
supplyAsync
→ 작업을 executor에 위임

jdbcCall
→ Blocking JDBC라면 Worker Thread는 대기

CompletableFuture
→ 미래 결과와 완료 상태 표현

thenApply
→ 완료 결과를 다음 값으로 변환
```

이 네 질문으로 보면 `@Async`, `CompletableFuture`, WebFlux, Virtual Thread가 모두 "비동기 기술"이라는 이름 아래 섞이는 것을 피할 수 있다.

---

## 13. 한 장으로 복원하기

```text
                    Java Application
                          │
             ┌────────────┴────────────┐
             │                         │
          Task 표현                결과 / 흐름 표현
             │                         │
     Runnable / Callable        Future / CompletableFuture
             │                         │
             └────────────┬────────────┘
                          ▼
                       Executor
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
        Platform Thread         Virtual Thread

별도 I/O 처리 축
Blocking I/O ↔ Non-blocking I/O

Framework 확장
Spring @Async → TaskExecutor 기반 실행 위임
Spring WebFlux → Reactive + Non-blocking 처리 모델
```

기억할 핵심은 다음 한 문장이다.

> **Java 비동기를 볼 때는 Task, Executor, Thread, 결과 표현, I/O의 Blocking 여부를 각각 분리해서 본다.**

---

## 14. C++ 기준 최종 대응

| Java | C++ 기준점 | 경계 |
| --- | --- | --- |
| `Thread` | `std::thread` | 세부 Thread API와 Runtime 관리 방식은 다름 |
| `Runnable` / `Callable` | Lambda / Function Object | Java Interface 기반 Task 표현 |
| `ExecutorService` | Thread Pool / Task Scheduler | C++ 표준의 단일 직접 대응 API로 보지 않음 |
| `Future<T>` | `std::future<T>` | 완료·취소·예외 의미론과 API가 다름 |
| `CompletableFuture<T>` | Future + Continuation 직관 | 단순 `std::future`와 동일하지 않음 |
| Virtual Thread | 직접 대응보다 경량 실행 단위로 이해 | JVM Scheduling 모델 |
| Spring `@Async` | Task를 Executor에 위임하는 Wrapper 직관 | Spring Proxy / TaskExecutor 기능 |
| WebFlux | Event-driven / async I/O 구조 | Reactive Streams 의미론이 추가됨 |

C++ 대응은 개념을 처음 붙잡는 기준점이고, 최종 이해는 Java와 JVM/Spring의 실제 의미론에서 완성한다.
