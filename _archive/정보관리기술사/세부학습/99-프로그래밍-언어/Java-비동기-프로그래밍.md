# Java 비동기 프로그래밍 — Executor · Future · CompletableFuture · Virtual Thread

> 상위 개념: [`비동기-실행-모델.md`](비동기-실행-모델.md)
>
> 학습 원칙: [`00-프로그래밍-언어-학습원칙.md`](00-프로그래밍-언어-학습원칙.md)
>
> 핵심 질문: **Java에서는 작업, 실행 Thread, 미래 결과, 후속 실행을 각각 무엇으로 표현하고 누가 실제 실행을 담당하는가?**

---

## 1. 먼저 위치를 잡는다

Java 비동기를 이해할 때 가장 먼저 피해야 할 오해는 `비동기 = 새 Thread`로 보는 것이다.

비동기(Asynchronous)는 **작업의 완료를 현재 호출 흐름에서 바로 기다리지 않고, 완료 이후의 처리를 다른 방식으로 연결하는 제어 흐름의 성질**이다. Thread는 그 작업을 실제로 실행할 수 있는 실행 자원 중 하나다.

Java에서는 이 둘 사이에 여러 추상화가 놓인다.

```text
Application Code
      │
      │ 작업을 표현
      ▼
Runnable / Callable
      │
      │ 실행을 위임
      ▼
Executor / ExecutorService
      │
      │ 실제 실행 자원 사용
      ▼
Platform Thread / Virtual Thread

작업의 결과를 다루는 축
      │
      ├─ Future
      └─ CompletableFuture
           └─ 완료 후 후속 Stage 연결
```

따라서 Java 비동기를 볼 때는 다음 질문을 분리한다.

```text
무엇을 실행할 것인가?
→ Task

누가 실행할 것인가?
→ Executor / Thread

아직 없는 결과를 어떻게 표현할 것인가?
→ Future / CompletableFuture

완료 후 무엇을 할 것인가?
→ CompletionStage / CompletableFuture Chain

기다림의 비용을 어떻게 줄일 것인가?
→ Non-blocking I/O 또는 Virtual Thread 등
```

이 질문들은 같은 분류축이 아니다.

---

## 2. C++ 기준점 — 작업과 Thread를 분리해서 본다

C++에서 가장 직접적인 실행 단위는 `std::thread`다.

```cpp
std::thread t([] {
    do_work();
});

t.join();
```

Java에서도 가장 직접적인 형태는 비슷하다.

```java
Thread thread = new Thread(() -> doWork());
thread.start();
thread.join();
```

이 수준에서는 대략 다음처럼 대응시켜 볼 수 있다.

```text
C++ std::thread
↔ Java Thread

C++ Callable Object / Lambda
↔ Java Runnable / Callable
```

하지만 실무 Java에서는 작업마다 직접 Thread를 생성하기보다 **작업(Task)과 실행 자원(Thread)을 분리**하는 Executor 계층을 많이 사용한다.

```text
직접 Thread 생성
Task ──────────────→ Thread

Executor 사용
Task → Executor → 적절한 Thread에서 실행
```

C++에서 Thread Pool이나 Task Scheduler를 별도로 만들어 작업 Queue와 Worker Thread를 관리하는 구조를 떠올리면 이해하기 쉽다.

---

## 3. Runnable과 Callable — 실행할 작업을 표현한다

`Runnable`과 `Callable`은 Thread 자체가 아니다. **실행할 작업을 객체로 표현하는 Interface**다.

```java
Runnable task = () -> doWork();
```

`Runnable`은 결과값을 직접 반환하지 않는다.

```java
Callable<Integer> task = () -> compute();
```

`Callable<V>`는 결과값을 반환하고 checked exception을 던질 수 있다.

```text
Runnable
→ 실행할 코드
→ 반환값 없음

Callable<V>
→ 실행할 코드
→ V 결과 생성
```

C++의 Lambda나 Function Object를 떠올리면 된다. 중요한 점은 **작업을 표현하는 객체와 그 작업을 실행하는 Thread가 별개**라는 것이다.

---

## 4. Executor — 작업과 실행 자원을 분리한다

`Executor`의 핵심 역할은 단순하다.

> **작업을 받되, 그 작업을 어떤 Thread에서 언제 실행할지는 실행 정책에 맡긴다.**

```java
executor.execute(task);
```

호출자는 보통 다음을 직접 결정하지 않는다.

```text
새 Thread를 만들 것인가?
기존 Worker Thread를 재사용할 것인가?
Queue에 넣을 것인가?
몇 개의 Thread를 유지할 것인가?
```

이를 Executor 구현과 설정이 담당한다.

```text
Caller Thread
     │
     │ submit / execute
     ▼
   Executor
     │
     ├─ Task Queue
     │
     └─ Worker Thread(s)
           │
           ▼
         Task 실행
```

`ExecutorService`는 여기에 Lifecycle 관리와 Task 제출, Future 반환 등의 기능을 더한다.

```java
ExecutorService executor = Executors.newFixedThreadPool(4);
Future<Integer> future = executor.submit(() -> compute());
```

여기서 중요한 변화는 다음과 같다.

```text
Thread 중심 사고
"Thread 하나를 만들어 이 함수를 실행한다"

        ↓

Task 중심 사고
"이 작업을 Executor에 제출한다"
```

---

## 5. Future — 실행 중인 작업과 미래 결과를 분리한다

`Future<V>`는 **아직 완료되지 않았을 수도 있는 작업의 결과를 나타내는 Handle**이다.

```java
Future<Integer> future = executor.submit(() -> compute());

// 다른 작업 수행

doSomethingElse();

int value = future.get();
```

C++의 `std::future<T>`와 비슷한 기준점으로 이해할 수 있다.

```text
Task 제출
   ↓
Future 즉시 획득
   ↓
현재 Thread는 다른 일 가능
   ↓
결과가 필요해짐
   ↓
future.get()
```

하지만 여기서 매우 중요한 경계가 있다.

```java
future.get();
```

결과가 아직 준비되지 않았다면 **호출한 Thread는 Blocking된다.**

따라서 다음 두 문장은 동시에 참일 수 있다.

```text
작업은 비동기로 실행했다.

하지만

결과를 얻는 현재 Thread는 get()에서 Blocking됐다.
```

이것이 `비동기`와 `Non-blocking`을 같은 뜻으로 보면 안 되는 대표적인 이유다.

---

## 6. CompletableFuture — 결과뿐 아니라 완료 이후의 흐름을 연결한다

`Future`만으로는 "작업이 끝나면 다음 작업을 실행한다"는 흐름을 자연스럽게 조합하기 어렵다.

`CompletableFuture<T>`는 미래 결과를 표현하면서 **완료 이후의 후속 Stage를 연결할 수 있게 한다.**

```java
CompletableFuture
    .supplyAsync(() -> loadData())
    .thenApply(data -> transform(data))
    .thenAccept(result -> save(result));
```

실행 흐름은 다음과 같이 읽는다.

```text
loadData
   ↓ 완료
transform
   ↓ 완료
save
```

C++ 기준으로는 `std::future`의 "미래 결과"라는 직관에 **Continuation을 연결하는 기능이 더해졌다**고 보면 이해하기 쉽다.

```text
Future
→ 결과를 나중에 받는다

CompletableFuture
→ 결과를 나중에 받는다
+
→ 완료되었을 때 이어갈 작업을 등록한다
```

따라서 `CompletableFuture`의 핵심은 단순히 "다른 Thread에서 실행한다"가 아니다.

> **비동기 작업의 결과와 후속 실행 관계를 하나의 Pipeline으로 표현한다.**

---

## 7. thenApply와 thenCompose — 값 변환과 비동기 연결을 구분한다

실무에서 자주 헷갈리는 경계다.

### thenApply — 결과값을 다른 값으로 바꾼다

```java
CompletableFuture<User> userFuture = loadUser();

CompletableFuture<String> nameFuture =
    userFuture.thenApply(user -> user.getName());
```

```text
User
 ↓ 일반 함수
String
```

즉 일반적인 `map`에 가까운 역할이다.

### thenCompose — 다음 비동기 작업을 연결한다

```java
CompletableFuture<User> userFuture = loadUser();

CompletableFuture<Order> orderFuture =
    userFuture.thenCompose(user -> loadOrder(user));
```

`loadOrder()` 자체가 `CompletableFuture<Order>`를 반환한다.

`thenApply`를 사용하면 개념적으로 다음처럼 중첩될 수 있다.

```text
CompletableFuture<CompletableFuture<Order>>
```

`thenCompose`는 이 비동기 Stage를 하나의 흐름으로 평탄화한다.

```text
CompletableFuture<User>
        ↓
   loadOrder(user)
        ↓
CompletableFuture<Order>
```

기억할 질문은 간단하다.

```text
다음 함수가 그냥 값을 반환하는가?
→ thenApply

다음 함수도 CompletableFuture를 반환하는가?
→ thenCompose
```

---

## 8. CompletableFuture에서 실제 Thread는 누가 실행하는가

`CompletableFuture` 자체를 Thread라고 생각하면 안 된다.

```text
CompletableFuture
= 결과와 완료 Stage를 표현하는 객체

Thread / Executor
= 실제 코드를 실행하는 자원과 실행 정책
```

예를 들어:

```java
CompletableFuture.supplyAsync(() -> loadData());
```

명시적인 Executor를 넘기지 않은 일반적인 async 실행은 기본 Executor를 사용한다.

반면 다음처럼 직접 Executor를 지정할 수 있다.

```java
ExecutorService executor = Executors.newFixedThreadPool(8);

CompletableFuture.supplyAsync(
    () -> loadData(),
    executor
);
```

따라서 비동기 코드를 읽을 때는 항상 두 가지를 따로 확인한다.

```text
1. 작업 관계는 어떻게 연결되어 있는가?
→ CompletableFuture Chain

2. 각 작업은 어디에서 실행되는가?
→ Executor / 호출 Thread
```

### Async가 붙지 않은 후속 Stage

```java
future.thenApply(this::transform);
```

### Async가 붙은 후속 Stage

```java
future.thenApplyAsync(this::transform);
```

두 메서드의 핵심 차이를 단순히 `동기 vs 비동기`라고 외우지 않는다.

중요한 질문은 **후속 Stage의 실행을 어떤 실행 Context에 맡기는가**다. Async 계열은 비동기 실행 Facility를 사용하고, Executor를 명시하면 해당 Executor에서 실행하도록 지정할 수 있다.

---

## 9. Blocking I/O를 CompletableFuture로 감싸면 Non-blocking I/O가 되는가

아니다.

예를 들어 내부에서 Blocking JDBC 호출을 수행한다고 하자.

```java
CompletableFuture.supplyAsync(() -> repository.findAll());
```

호출한 Thread는 작업 완료를 기다리지 않고 빠져나올 수 있다. 하지만 실제 JDBC 호출을 수행하는 Worker Thread는 DB 응답을 기다리며 Blocking될 수 있다.

```text
Caller Thread
     │
     ├─ Task 제출
     │
     └─ 계속 진행

Worker Thread
     │
     └─ Blocking JDBC 호출
            │
            └─ DB 응답까지 대기
```

따라서:

```text
비동기 호출
≠ Non-blocking I/O
```

`CompletableFuture`는 **비동기 제어 흐름과 작업 조합**을 제공하는 것이지, 내부의 Blocking I/O를 자동으로 Non-blocking I/O로 바꾸는 장치가 아니다.

---

## 10. Virtual Thread — 비동기 Callback을 없애는 기술인가

Virtual Thread는 `CompletableFuture`와 다른 축의 기술이다.

전통적인 Platform Thread는 OS Thread와 밀접하게 연결되므로 대량의 Blocking 작업을 각각 Thread 하나에 대응시키면 Thread 자원 비용이 커질 수 있다.

Virtual Thread는 JVM이 관리하는 경량 Thread를 제공해 **Thread-per-task 스타일을 훨씬 많은 동시 작업에 사용할 수 있게 하는 실행 모델**이다.

```java
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    Future<String> future = executor.submit(() -> blockingCall());
    String result = future.get();
}
```

코드 모양은 여전히 동기식이다.

```text
요청
 ↓
Blocking 호출
 ↓
결과
 ↓
다음 코드
```

하지만 기다리는 동안 Virtual Thread의 실행을 JVM이 효율적으로 다룰 수 있다.

따라서 다음처럼 구분한다.

```text
CompletableFuture
→ 완료 후의 흐름을 Stage로 조합
→ 비동기 Pipeline 표현

Virtual Thread
→ Thread 자체의 비용을 낮춤
→ Blocking 스타일 코드를 유지하면서 높은 동시성을 다루기 위한 실행 방식
```

둘은 경쟁 관계로만 볼 필요가 없으며 문제에 따라 함께 사용할 수도 있다. 다만 Virtual Thread를 사용한다고 모든 작업이 Non-blocking I/O로 바뀌는 것은 아니다.

---

## 11. Spring @Async — Java 언어 기능이 아니라 Spring의 실행 위임 기능

`@Async`는 Java 언어 문법이나 JVM 기능이 아니라 Spring Framework 기능이다.

```java
@Async
public CompletableFuture<Result> execute() {
    return CompletableFuture.completedFuture(doWork());
}
```

개념적으로는 다음처럼 이해한다.

```text
Caller
  │
  │ Method 호출
  ▼
Spring Proxy / Interceptor
  │
  │ Task로 실행 위임
  ▼
TaskExecutor
  │
  ▼
별도 실행 Context에서 Method 실행
```

따라서 `@Async`를 이해하려면 두 질문을 확인한다.

```text
호출을 누가 가로채는가?
→ Spring의 Proxy 기반 실행 구조

실제 작업을 누가 실행하는가?
→ 설정된 TaskExecutor
```

`@Async` 역시 내부 Blocking I/O를 자동으로 Non-blocking I/O로 바꾸지는 않는다.

또한 Proxy를 거치지 않는 내부 호출(Self-invocation)처럼 Spring Proxy 경계를 벗어나면 기대한 방식으로 비동기 실행이 적용되지 않을 수 있다. 이는 Java 비동기 자체의 문제가 아니라 Spring AOP/Proxy 실행 경계의 문제다.

---

## 12. WebFlux — @Async와 같은 방식의 비동기인가

같은 것으로 보면 안 된다.

Spring WebFlux는 Reactive Programming과 Non-blocking I/O를 중심으로 설계된 Web Stack이다. 일반적인 `@Async + Thread Pool` 모델과 실행 철학이 다르다.

```text
@Async
Caller
  ↓
TaskExecutor에 작업 위임
  ↓
다른 Thread에서 작업 실행

WebFlux / Reactive
Event / Data 준비
  ↓
Non-blocking 방식으로 처리 흐름 연결
  ↓
준비된 작업을 Runtime이 실행
```

WebFlux에서는 `Mono`, `Flux` 같은 Publisher를 통해 값의 흐름과 완료·실패를 표현한다.

여기서 중요한 것은 `Reactive = 무조건 Single Thread` 또는 `WebFlux = Thread가 없음`으로 이해하지 않는 것이다. 실제 실행 Thread와 Scheduler는 구성과 연산에 따라 달라질 수 있다.

이 문서에서는 Java 비동기 기술의 위치만 확인하고, Reactive Streams와 Backpressure의 상세 의미론은 별도 학습 대상으로 남긴다.

---

## 13. 실무에서 가장 먼저 확인할 네 가지

Java 비동기 코드를 만났을 때 API 이름부터 외우지 말고 다음 순서로 추적한다.

```text
1. 현재 코드를 실제로 실행하는 Thread는 누구인가?

2. 오래 걸리는 작업은 Blocking인가 Non-blocking인가?

3. 작업을 다른 실행 Context에 넘긴다면 Executor는 무엇인가?

4. 결과를 기다리는가, 완료 후의 흐름을 연결하는가?
```

예를 들어:

```java
CompletableFuture
    .supplyAsync(() -> jdbcCall(), executor)
    .thenApply(this::