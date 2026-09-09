# Reactor Pattern과 I/O Event 처리

> Socket / FD · I/O Multiplexing · Event Loop · Reactor Pattern을 **언어에 종속되지 않는 일반 원리**로 이해하기 위한 보충학습 문서다.
>
> Java NIO · Netty처럼 특정 생태계의 구현 경로와 섞지 않고, 여러 언어와 Runtime에서 공통으로 재사용되는 실행 원리를 복원하는 것을 목표로 한다.

## 1. 출발점: I/O Multiplexing

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

## 2. Event 발생 흐름과 System Call 호출 흐름은 다르다

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

## 3. Readiness는 I/O 완료가 아니다

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

## 4. Ready Event는 대기하던 Thread의 호출 결과다

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

## 5. Event Loop

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

## 6. Reactor Pattern은 왜 필요한가

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

## 7. Reactor와 Thread를 구분한다

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

## 8. I/O Multiplexing은 여러 생태계에서 각자의 방식으로 활용된다

I/O Multiplexing은 Java에 종속된 개념이 아니다. OS가 제공하는 일반적인 I/O 메커니즘을 각 언어와 Runtime이 자신의 API와 실행 모델에 맞게 활용·추상화한다.

```text
                       OS I/O Multiplexing
                    select / poll / epoll 등
                              │
             ┌────────────────┼────────────────┐
             │                │                │
             ▼                ▼                ▼
          Java 계열        Node.js 계열      Python 계열
          Java NIO           libuv            selectors
          Selector         Event Loop            등
             │
             ▼
           Netty
```

이 그림은 `I/O Multiplexing → Java NIO → Netty`가 모든 환경에서 공통으로 진행되는 발전 단계라는 뜻이 아니다. **Java NIO는 여러 활용 경로 중 Java 생태계의 한 갈래**다.

각 단계에서 질문도 달라진다.

```text
OS I/O Multiplexing
왜?  = 많은 I/O의 readiness를 효율적으로 기다리기 위해
어떻게? = select / poll / epoll 등으로 여러 FD를 함께 감시

언어 / Runtime 추상화
왜?  = OS별 System Call과 FD를 Application 코드가 직접 다루는 부담을 줄이기 위해
어떻게? = 각 생태계의 I/O API · Event Loop · Channel 등의 추상화로 노출

Framework
왜?  = 저수준 I/O API만으로 서버 구조 전체를 직접 구성하는 부담을 줄이기 위해
어떻게? = Event Loop · Handler · Buffer · Thread 정책 등을 더 높은 수준에서 구조화
```

따라서 다음처럼 기억한다.

```text
I/O Multiplexing
= 공통 기반 메커니즘
        │
        ├─ Java 생태계의 활용 경로
        ├─ Node.js 생태계의 활용 경로
        ├─ Python 생태계의 활용 경로
        └─ 그 밖의 여러 Runtime / Framework
```

이 문서에서는 공통 원리까지만 다룬다. Java 생태계의 가지를 확대하면 다음과 같다.

```text
OS I/O Multiplexing
        ↓ Java에서 활용
Java NIO
Channel / Selector / SelectionKey
        ↓ 서버 구조를 Framework화
Netty
EventLoop / Channel / Pipeline
```

Java 생태계의 상세한 `왜 → 어떻게`는 `Java-NIO-Netty.md`에서 이어서 다룬다.
