# Reactor · Java NIO · Netty

> `99-Socket-서버-IO.md`에서 학습한 **I/O Multiplexing과 Event Loop가 실제 Application Server 구조에서 어떻게 확장되는지** 이해하기 위한 `99-` 보충학습 문서다.
>
> 현재는 Reactor Pattern의 핵심 개념까지만 정리하고, Java NIO와 Netty는 학습하면서 단계적으로 보강한다.

## 1. 출발점: I/O Multiplexing과 Event Loop

OS는 `select / poll / epoll` 등의 I/O Multiplexing 메커니즘을 통해 여러 Socket의 readiness를 관리한다.

Application Thread는 Multiplexing API를 호출하여 준비된 Socket을 확인하고 실제 I/O를 수행한다.

```text
OS Kernel
    ↓
I/O Multiplexing
select / poll / epoll
    ↓
Ready Event
    ↓
Application Thread
    ↓
read / write
```

이 과정을 반복하는 Application 실행 구조를 Event Loop라고 볼 수 있다.

```text
Ready Event 대기
       ↓
준비된 Socket 확인
       ↓
해당 Socket 처리
       ↓
다시 Ready Event 대기
       ↺
```

즉:

```text
I/O Multiplexing
= 여러 I/O의 readiness를 함께 기다리는 OS 메커니즘/API

Event Loop
= 준비 대기 → 처리 → 다시 대기를 반복하는 Application 실행 구조
```

## 2. Reactor Pattern

Socket과 Event가 많아지면 Application은 **발생한 Event에 맞는 처리 코드**를 선택하여 실행해야 한다.

```text
I/O Multiplexing
       ↓
   Ready Event
       ↓
    Reactor
       ↓
    Dispatch
   /    |    \
Handler Handler Handler
```

Reactor Pattern의 핵심은 다음과 같이 이해한다.

> **I/O Event를 받아 그 Event를 처리할 적절한 Handler로 연결한다.**

예를 들어:

```text
Socket A : Read Ready
          ↓
       Reactor
          ↓
    Read Handler

Socket B : Write Ready
          ↓
       Reactor
          ↓
    Write Handler
```

### Reactor와 Thread를 구분한다

`Handler로 Dispatch한다`는 것이 반드시 `Worker Thread에게 작업을 넘긴다`는 뜻은 아니다.

```text
Reactor
   ↓
Handler 호출
   ↓
같은 Event Loop Thread가 실행할 수도 있음
```

따라서 현재 단계에서의 핵심 구분은:

```text
I/O Multiplexing
= 여러 I/O 중 무엇이 Ready인지 기다림

Event Loop
= Ready 대기와 처리를 반복

Reactor Pattern
= 발생한 Event를 적절한 Handler로 Dispatch

Worker Thread
= Handler의 실제 작업을 별도 Thread에서 수행하도록 구성할 때 사용할 수 있는 선택 사항
```

> **Reactor의 핵심은 Thread 분배가 아니라 Event Dispatch다.**

## 3. Java NIO로 연결

> TODO: Java NIO를 학습하면서 보강한다.

확인할 개념:

- `Channel`
- `SocketChannel`
- `Selector`
- `SelectionKey`
- Selector Loop
- Reactor Pattern과 Java NIO API의 대응 관계

예상 연결 구조:

```text
OS I/O Multiplexing
        ↓
Java NIO Selector
        ↓
Ready Channel / SelectionKey
        ↓
Application 처리
```

## 4. Netty로 연결

> TODO: Netty를 학습하면서 보강한다.

확인할 개념:

- `Channel`
- `EventLoop`
- `EventLoopGroup`
- `ChannelPipeline`
- `ChannelHandler`
- Java NIO Selector와 Netty EventLoop의 관계

예상 연결 구조:

```text
Java NIO
Selector / Channel
       ↓
Netty
EventLoop / Channel
       ↓
Pipeline
       ↓
Handler
```

## 5. 전체 학습 연결

```text
Thread / Socket 구분
        ↓
Blocking / Non-blocking
        ↓
I/O Multiplexing
        ↓
select / poll / epoll
        ↓
Event Loop
        ↓
Reactor Pattern
        ↓
Java NIO Selector
        ↓
Netty EventLoop
```

현재 단계에서 가장 중요한 연결은 다음과 같다.

> **OS가 여러 Socket의 readiness를 관리하고, Application은 Event Loop로 그 결과를 반복해서 받아 처리한다. Reactor Pattern은 이때 발생한 Event를 적절한 Handler로 Dispatch하는 구조를 제공하며, Java NIO와 Netty는 이후 이 구조가 실제 Java 서버 기술에서 어떻게 구현·추상화되는지를 이해하기 위한 다음 단계다.**
