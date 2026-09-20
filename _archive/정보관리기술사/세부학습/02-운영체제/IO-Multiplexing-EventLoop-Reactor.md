# I/O Multiplexing · Event Loop · Reactor

> `../03-네트워크/_보충학습/Socket-서버-IO.md`에서 확인한 **Socket / FD(File Descriptor, Process가 열린 Kernel I/O 자원을 참조하는 정수형 Handle) · Blocking / Non-blocking · I/O Multiplexing의 출발점**에서 이어서, Readiness · Event Loop · Reactor Pattern을 **언어에 종속되지 않는 일반 원리**로 이해하기 위한 보충학습 문서다.
>
> 이 문서에서는 Multiplexing 이후 Application 실행 구조를 깊게 보고, Java NIO(New I/O, Java의 Channel·Selector 중심 I/O API) · Netty · WebFlux처럼 특정 생태계의 구현 경로는 `../03-네트워크/_보충학습/Java-Network-IO-WebFlux.md`에서 이어서 다룬다.

## 1. 큰 그림 — 현대 비동기 I/O의 공통 기반

Node.js, Netty, WebFlux, Python asyncio처럼 서로 다른 생태계의 비동기 기술은 겉으로 보면 API와 문법이 다르지만, 네트워크 I/O 관점에서는 공통된 기반 위에 쌓여 있다.

```text
OS 공통 I/O 기반
select / poll / epoll / kqueue / IOCP ...
        ↓
Runtime 실행 구조
Event Loop / Scheduler
        ↓
언어·Framework 비동기 추상화
Callback / Promise / Future / Coroutine / Mono / Flux
        ↓
Application
Node.js / Netty / WebFlux / asyncio ...
```

각 계층의 책임은 다음과 같다.

```text
OS
= Socket / FD 같은 I/O 자원 상태 관리
= readiness / completion 통지 메커니즘 제공

Runtime
= OS의 I/O Event를 반복적으로 받아 처리
= Event Loop / Scheduler로 후속 실행 연결

언어 / Framework
= Application이 비동기 흐름을 표현할 수 있도록
  Promise / Future / Coroutine / Reactive API 등 제공
```

따라서 현대의 이벤트 기반 비동기 I/O 기술은 서로 완전히 독립된 기술이라기보다, **OS가 제공하는 I/O Event Notification 기반 위에서 Runtime과 Framework가 각자의 추상화를 발전시킨 계열**로 볼 수 있다.

다만 모든 비동기 기술이 반드시 이 계보 하나로만 설명되는 것은 아니다. 예를 들어 Virtual Thread처럼 Blocking 코드를 경량 실행 단위로 확장하는 모델은 핵심 설명축이 다르다.

> **이 문서에서 다루는 핵심 계보는 ‘OS I/O Event Mechanism → Event Loop → Application 비동기 추상화’다.**

---

## 2. 출발점: I/O Multiplexing

### Multiplexing은 무슨 뜻인가

`Multiplexing`은 여러 흐름을 **하나의 공통 지점에서 함께 다루는 것**을 뜻한다.

I/O에 적용하면:

```text
개별 대기
FD 1 → 별도 대기
FD 2 → 별도 대기
FD 3 → 별도 대기
```

대신:

```text
I/O Multiplexing
FD 1 ─┐
FD 2 ─┼→ 하나의 감시 지점
FD 3 ─┘
```

처럼 여러 I/O 자원의 상태를 한 번에 기다리고 확인한다.

Thread 관점에서는:

```text
Thread-per-Connection
Socket A → Thread A
Socket B → Thread B
Socket C → Thread C
```

대신:

```text
I/O Multiplexing
Socket A ─┐
Socket B ─┼→ Event Loop Thread
Socket C ─┘
             ↓
      select / poll / epoll
```

처럼 **한 Thread가 여러 Socket / FD의 readiness를 함께 감시**할 수 있다.

> **I/O Multiplexing = 여러 I/O 흐름을 하나의 감시 지점으로 다중화해서 기다리는 방식**

이 직관을 먼저 잡고 `select / poll / epoll`을 보면 이해가 쉽다.

OS의 Network I/O가 항상 I/O Multiplexing 방식으로 동작하는 것은 아니다.

```text
Application / Runtime
= I/O 처리 구조와 Thread 정책 결정
        ↓
Application Thread
= 해당 API / System Call 호출
        ↓
OS Kernel
= Socket / Thread / readiness 등 실제 자원과 상태 관리
```

같은 OS에서도 Application마다 서로 다른 I/O 방식을 사용할 수 있다.

```text
App A ── blocking read() ───────→ Socket별 I/O 대기
App B ── non-blocking read() ───→ 데이터 없으면 즉시 반환
App C ── select / poll / epoll ─→ 여러 FD의 readiness를 함께 대기
```

> **Application / Runtime이 I/O 전략을 선택하고, Application Thread가 그에 맞는 API를 호출하며, OS가 해당 메커니즘으로 요청을 처리한다.**

## 3. Event 발생 흐름과 System Call 호출 흐름은 다르다

Network Event 자체는 Kernel 쪽에서 발생·관리된다.

```text
Network Data / Connection
        ↓
OS Kernel
        ↓
Socket / FD Ready
```

하지만 System Call의 호출 주체는 Application Thread다.

```text
Application Event Loop Thread
        │
        │ select() / poll() / epoll_wait()
        ▼
OS Kernel
        │
        │ Ready FD / Event 반환
        ▼
Application Event Loop Thread
        │
        ▼
accept / read / write 등 실제 I/O 수행
```

```text
Event 발생 관점
= Network → Kernel → FD Ready

System Call 호출 관점
= Application Thread → Multiplexing System Call → Kernel
                                      ↓
                         Ready 결과 반환 → 같은 Thread
```

> **Kernel은 Event / readiness가 발생하고 관리되는 곳이고, Application Thread는 Multiplexing API를 호출해 그 결과를 받는 주체다.**

여기서 Kernel이 존재도 모르는 Application을 임의로 찾아가 통지하는 것은 아니다. Application이 먼저 감시할 FD를 등록하고 select / poll / epoll_wait 같은 대기 지점을 만든다.

```text
Application
  ↓ 감시 대상 등록
FD 5 / FD 8 / FD 12
  ↓
Kernel
  ↓ readiness 발생
대기 중인 Multiplexing System Call 반환
  ↓
Event Loop Thread 실행 재개
```

따라서 이 구조는 **감시 대상 등록 → Kernel 상태 관리 → 대기 지점 반환 → Application 후속 처리**로 이해한다.

## 4. Readiness는 I/O 완료가 아니다

`readiness`는 I/O가 Application까지 완료됐다는 뜻이 아니라 **해당 FD에 대해 지금 I/O를 진행할 조건이 준비된 상태**다.

```text
READ Ready
= 지금 read()를 진행할 수 있는 조건이 준비됨

WRITE Ready
= 지금 write()를 진행할 수 있는 조건이 준비됨

ACCEPT Ready
= 지금 accept()할 완료된 연결이 존재함
```

예를 들어:

```text
Network Data 도착
        ↓
Kernel Socket Receive Buffer
        ↓
읽을 데이터 존재
        ↓
FD READ Ready
        ↓
Multiplexing 호출 결과로 Ready Event 확인
        ↓
Application Thread가 read(fd) 호출
```

```text
Readiness ≠ I/O 처리 완료
Readiness = I/O를 진행할 조건이 준비됨
```

## 5. Ready Event는 대기하던 Thread의 호출 결과다

Ready Event를 Kernel이 임의의 Application Thread에 밀어주는 것으로 이해하지 않는다. `select()` / `poll()` / `epoll_wait()`를 호출하여 대기하던 Thread의 **System Call이 Ready 결과를 가지고 반환**된다.

```text
Event Loop Thread A
        │ epoll_wait()
        ▼
OS Kernel
        │ Ready FD 없음
        ▼
Thread A 대기
        │ FD Ready 발생
        ▼
Thread A 실행 가능 상태
        ↓
OS Scheduler
        ↓
Thread A 실행 재개
        ↓
epoll_wait() 반환
```

Kernel이 Thread를 깨운다고 해서 즉시 CPU에서 실행되는 것은 아니다. 대기할 이유가 사라진 Thread를 실행 가능한 상태로 만들고 실제 실행 시점은 Scheduler가 결정한다.

## OS Event에서 Application Event로 올라가는 경계

OS가 직접 아는 것은 Socket/FD의 readiness, Timer, Signal, I/O Request 같은 **Kernel 수준의 자원과 Event**다. 반면 Future, Task, Callback, Coroutine은 Runtime/Application 수준의 추상화다.

```text
Kernel-level Event
Socket / FD Ready
Timer 만료
I/O Completion
        ↓
Runtime / Event Loop
        ↓
Application-level Event
Task Ready
Future Complete
Callback 실행 가능
Coroutine Resume
```

같은 사건이 계층을 올라가며 표현이 바뀐다.

```text
Socket에 Data 도착
→ FD READ Ready
→ epoll_wait() 반환
→ Event Loop가 해당 Event 처리
→ Future 상태 갱신 / Callback 준비 / Coroutine Resume
→ Application Logic 실행
```

> **I/O Multiplexing은 OS 수준에서 어떤 I/O가 Ready인지 기다리는 Mechanism이고, Event Loop는 그 결과를 Runtime/Application의 후속 작업으로 연결하는 실행 구조다.**

## 6. I/O Multiplexing과 Blocking / Non-blocking은 다른 질문이다

I/O 학습에서 `Blocking / Non-blocking / Multiplexing`이 함께 등장해서 같은 분류처럼 보이기 쉽지만, 실제 동작을 뜯어보면 **질문이 서로 다르다.**

```text
Blocking / Non-blocking
= 개별 I/O 호출이 기다리는가?

I/O Multiplexing
= 여러 FD 중 어떤 것이 Ready인지 어떻게 함께 감시하는가?
```

### 6.1 I/O Multiplexing의 역할

```text
fd 4
fd 5
fd 6
   ↓
select / poll / epoll
   ↓
Ready FD 반환
```

즉 Multiplexing은 **실제 I/O를 대신하는 것이 아니라, 어떤 FD에 I/O를 수행할 수 있는지 찾는 단계**다.

### 6.2 Ready 이후에는 실제 I/O 호출이 있다

```text
epoll_wait()
↓
fd 5 READ Ready
↓
read(fd 5)
```

여기서 `read(fd 5)`는 실제 Socket / File I/O이고, 해당 FD의 설정에 따라 Blocking 또는 Non-blocking으로 동작할 수 있다.

```text
Blocking FD
read()
→ 지금 처리할 수 없으면 Thread가 기다림

Non-blocking FD
read()
→ 지금 처리할 수 없으면 EAGAIN / EWOULDBLOCK
→ 즉시 반환
```

따라서:

```text
Multiplexing
= Ready 대상을 선택 / 감시

Blocking / Non-blocking
= 선택된 대상에 실제 I/O를 수행할 때의 동작 방식
```

### 6.3 왜 현대 Event Loop 서버는 Multiplexing + Non-blocking을 함께 쓰는가

Ready 통지를 받은 직후 첫 I/O는 Blocking FD에서도 바로 끝날 수 있다. 하지만 한 번 읽고 난 뒤 추가 `read()`를 하거나, `write()` 도중 송신 Buffer가 가득 차는 등 **처리 도중 다시 기다려야 하는 상황**이 생길 수 있다.

```text
epoll_wait()
↓
fd 5 Ready
↓
read(fd 5)      ← 데이터 읽음
↓
read(fd 5)      ← 더 이상 데이터 없음
```

Blocking이면:

```text
두 번째 read()
→ 새 데이터가 올 때까지 Event Loop Thread 대기
→ 다른 Ready FD 처리 지연
```

Non-blocking이면:

```text
두 번째 read()
→ EAGAIN
→ 즉시 Event Loop로 복귀
→ 다른 Ready FD 처리
```

즉 Event Loop / Reactor 구조에서 Non-blocking을 함께 쓰는 이유는:

> **Ready 이후 실제 I/O 처리 중 특정 FD 때문에 Event Loop Thread가 잠드는 상황을 막기 위해서다.**

### 6.4 Pure Non-blocking만 쓰면 왜 비효율적인가

Non-blocking I/O를 Multiplexing 없이 단독으로 사용하면 Application이 여러 FD를 계속 확인해야 할 수 있다.

```text
fd 4 read → EAGAIN
fd 5 read → EAGAIN
fd 6 read → EAGAIN
다시 fd 4 ...
```

이런 구조는 Busy Polling처럼 CPU를 낭비하기 쉽다.

그래서 현대 서버에서는 보통:

```text
I/O Multiplexing
= 여러 FD를 효율적으로 기다림
        +
Non-blocking I/O
= 실제 처리 중 특정 FD에서 잠들지 않음
        +
Event Loop
= 위 과정을 반복
```

으로 조합한다.

핵심:

> **Multiplexing은 ‘누구를 처리할 것인가’, Blocking / Non-blocking은 ‘그 대상을 실제로 처리할 때 기다릴 것인가’의 문제다.**

---

## 8. Event Loop

이 과정을 반복하는 Application 실행 구조가 Event Loop다.

```text
Event Loop Thread
       ↓
Ready Event 대기
       ↓
준비된 FD 확인
       ↓
해당 I/O 처리
       ↓
다시 Ready Event 대기
       ↺
```

```text
I/O Multiplexing
= 여러 I/O의 readiness를 함께 기다리는 메커니즘/API

Event Loop
= 준비 대기 → 처리 → 다시 대기를 반복하는 Application 실행 구조
```

따라서 `epoll = Event Loop`는 아니다.

## 8. Ready 감지와 실제 처리는 별개다

Application Thread가 Ready FD 하나를 처리하는 동안에도 Kernel은 다른 FD의 Ready 상태를 감지·관리할 수 있다.

```text
OS Kernel                    Application Thread

A Ready ──────────────────→ A 처리 시작
B Ready ✓                         │
C Ready ✓                         │ A 처리 중
                                  │
                             A 처리 완료
                                  ↓
                             B / C 처리
```

즉 **A 처리 중이라고 B/C가 Ready되지 않는 것이 아니라, B/C의 Application 처리가 늦어지는 것**이다.

## 9. Reactor Pattern은 왜 필요한가

I/O Multiplexing만으로도 서버는 구현할 수 있다.

```text
events = epoll_wait(...)
        ↓
if ACCEPT → 연결 처리
if READ   → 읽기 처리
if WRITE  → 쓰기 처리
```

문제는 서버가 커질수록 Event 판별과 실제 처리 로직이 한 흐름에 섞이기 쉽다는 것이다.

I/O Multiplexing은 **여러 FD 중 무엇이 Ready인가**를 해결하지만, 그 Event를 Application에서 어떤 처리 로직에 연결할지는 별도의 문제다.

```text
Application Event Loop Thread
       │ Multiplexing API 호출
       ▼
OS Kernel
       │ Ready Event 반환
       ▼
Application의 Reactor
       ↓
    Dispatch
   /    |    \
Accept  Read  Write
Handler Handler Handler
```

> **Reactor Pattern은 Multiplexing으로 얻은 I/O Event를 적절한 Handler로 Dispatch하여 Event 처리 구조를 분리·구조화하는 Application 설계 패턴이다.**

### Multiplexing과 Reactor의 관점 차이

```text
I/O Multiplexing
= "여러 FD 중 누가 Ready인가?"

Reactor
= "이 Ready Event는 어떤 처리 로직이 담당하는가?"
```

따라서 Reactor는 I/O Multiplexing의 필수 다음 단계가 아니다. **Multiplexing/Event-driven I/O를 Application에서 구조화하는 대표적인 설계 패턴 중 하나**다.

## 10. Reactor와 Thread를 구분한다

Handler로 Dispatch한다는 것이 반드시 Worker Thread에게 작업을 넘긴다는 뜻은 아니다.

```text
Event Loop Thread
      ↓ Ready Event
Reactor / EventLoop 로직
      ↓ Event 판별
Handler Dispatch
      ├─ 같은 Event Loop Thread가 직접 Handler 실행
      └─ 필요하면 Worker Thread / Executor에 위임
```

```text
Handler
= 어떤 처리 로직을 실행할 것인가

Thread
= 그 처리 로직을 실제로 누가 실행할 것인가
```

> **Reactor의 핵심은 Thread 분배가 아니라 Event Dispatch다. Worker Thread 사용 여부는 별도의 실행 전략이다.**

## 11. I/O Multiplexing은 여러 상위 영역에서 활용된다

I/O Multiplexing은 OS가 제공하는 공통 기반 기술이고, 상위에서는 목적에 따라 서로 다른 형태로 활용·추상화된다.

```text
                       OS I/O Multiplexing
                    select / poll / epoll 등
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
     Network Server        Runtime / Language   Framework
     Socket 여러 개        Event Loop 기반      상위 비동기 추상화
     readiness 감시              │                   │
          │                      │                   │
          ▼                      ├─ Java             ├─ Netty
   accept / read / write         │  └─ NIO Selector  ├─ WebFlux / Reactor
                                 ├─ Node.js          └─ 기타 비동기 Framework
                                 │  └─ libuv
                                 └─ Python
                                    ├─ selectors
                                    └─ asyncio
```

이 그림은 세 영역이 완전히 배타적이라는 뜻이 아니다.

예를 들어 Netty는 Network Framework이면서 Event Loop Runtime 역할도 하고, Node.js는 Runtime이면서 Network Server 기능도 제공한다. 따라서 이 분류는 제품 분류표가 아니라 **I/O Multiplexing이 상위에서 어떤 역할로 확장되는지 보는 개념 지도**다.

### Network Server 관점

Network Server에서는 I/O Multiplexing을 가장 직접적으로 사용한다.

```text
Socket A ─┐
Socket B ─┼→ select / poll / epoll
Socket C ─┘
              ↓
          Ready Socket
              ↓
       accept / read / write
```

핵심은 **여러 Socket / FD의 readiness를 하나의 Thread가 함께 기다릴 수 있다**는 점이다.

### Runtime / Language 관점

Runtime은 OS의 readiness 결과를 Application 실행 흐름으로 연결한다.

```text
OS Ready Event
        ↓
Event Loop / Scheduler
        ↓
Callback / Task / Coroutine Resume
```

대표 예:

```text
Java
→ Java NIO Selector
→ Netty EventLoop 등

Node.js
→ libuv
→ Main Event Loop

Python
→ selectors
→ asyncio Event Loop
```

### Framework 관점

Framework는 Runtime의 Event-driven 실행 구조를 더 높은 수준의 API로 감싼다.

```text
Netty
→ Channel / Handler / EventLoop

WebFlux / Reactor
→ Mono / Flux 기반 Reactive 흐름
```

즉 같은 OS I/O Multiplexing 기반이 위로 올라가면서:

```text
Network
= 어떤 Socket이 Ready인가?

Runtime
= Ready Event 이후 무엇을 실행할 것인가?

Framework
= 개발자가 비동기 흐름을 어떤 API로 표현할 것인가?
```

라는 서로 다른 관점으로 나타난다.

> **I/O Multiplexing은 OS의 공통 기반이고, Network Server는 이를 직접 활용하며, Runtime은 Event Loop 실행 구조로 연결하고, Framework는 더 높은 수준의 비동기 API로 추상화한다.**

## 12. Event Loop Thread 구성 — Node.js와 Netty/WebFlux 비교

Event Loop라고 해서 반드시 Thread가 하나라는 뜻은 아니다. **Event Loop는 반복 실행 구조이고, 그 구조를 몇 개의 Thread에서 돌릴지는 Runtime / Framework의 설계 선택**이다.

### Node.js

Node.js는 기본적으로 **JavaScript를 실행하는 Main Event Loop Thread를 하나** 둔다.

```text
Node.js Process

Main Event Loop Thread
        ↓
Callback / Timer / Request Logic
        ↓
Non-blocking I/O
        ↓
OS / libuv
```

핵심 의도는 JavaScript 실행 흐름을 하나로 유지해 공유 상태 동기화 복잡도를 줄이는 것이다.

```text
Event Loop 1개
→ JS 실행 흐름 단순
→ Lock / Race Condition 부담 감소
→ I/O 동시성은 OS / libuv에 위임
```

다만 Node.js Process 전체가 Thread 하나만 가진다는 뜻은 아니다. libuv Worker Thread Pool이나 Runtime 내부 Thread가 별도로 존재할 수 있다.

CPU-bound 작업이 Main Event Loop를 오래 점유하면:

```text
무거운 JavaScript 계산
        ↓
Main Event Loop 점유
        ↓
다른 Callback / Request 처리 지연
```

이 발생할 수 있다.

### Netty / WebFlux

Netty 기반 WebFlux에서는 보통 **여러 Event Loop Thread**가 존재하고, 각 Thread가 여러 Connection을 맡아 처리한다.

```text
EventLoop Thread 1
├─ Connection A
├─ Connection B
└─ Connection C

EventLoop Thread 2
├─ Connection D
├─ Connection E
└─ Connection F
```

즉:

```text
소수의 Event Loop Thread
        ↓
많은 Connection을 Multiplexing
        ↓
여러 CPU Core도 활용 가능
```

대신 Event Loop Thread 안에서 Blocking 작업을 오래 수행하면 해당 Thread가 맡은 Connection들의 처리가 함께 지연될 수 있다.

### 왜 무조건 여러 Event Loop가 좋은 것은 아닌가

```text
Event Loop 1개
장점
- 실행 모델 단순
- 공유 상태 동기화 비용 감소
- Context Switch 감소

단점
- 하나의 CPU-bound 작업이 전체 Loop를 막을 수 있음
- 한 실행 Thread 기준으로는 Multi-core 병렬성 제한
```

```text
Event Loop 여러 개
장점
- 여러 CPU Core 활용 가능
- 하나의 Thread가 바빠도 다른 Loop는 진행 가능

단점
- 공유 상태가 생기면 동기화 고려 필요
- Thread Scheduling / Context Switch 비용 증가
- 실행 모델 복잡도 증가
```

따라서 핵심 비교축은 다음과 같다.

> **Event Loop Thread 1개는 단순성과 동기화 비용 감소를, 여러 개는 Multi-core 활용과 병렬성을 우선하는 선택이다.**

Node.js와 Netty/WebFlux의 차이는 Event Loop라는 원리가 다른 것이 아니라, **같은 Event-driven I/O 구조를 몇 개의 실행 Thread로 운영하느냐가 다르다**는 점에 있다.

---

## 13. 학습 연결

```text
Socket-서버-IO.md
= Socket / FD / accept / read / Blocking / Non-blocking
        ↓
현재 문서
= I/O Multiplexing / Readiness / Event Loop / Reactor
        ↓
Java-Network-IO-WebFlux.md
= Java NIO / Netty + Reactive Programming / WebFlux
```

> **Socket 자체의 I/O 동작, Multiplexing 이후의 Application 실행 구조, 특정 언어·Framework의 활용 경로를 한 문서에 억지로 섞지 않고 학습 단위별로 나눈다.**
