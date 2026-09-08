# Reactor · Java NIO · Netty

> `99-Socket-서버-IO.md`에서 학습한 **I/O Multiplexing과 Event Loop가 실제 Application Server 구조에서 어떻게 확장되는지** 이해하기 위한 `99-` 보충학습 문서다.

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

이 과정을 반복하는 Application 실행 구조가 Event Loop다.

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

```text
I/O Multiplexing
= 여러 I/O의 readiness를 함께 기다리는 OS 메커니즘/API

Event Loop
= 준비 대기 → 처리 → 다시 대기를 반복하는 Application 실행 구조
```

## 2. Reactor Pattern은 왜 필요한가

I/O Multiplexing만으로도 서버를 구현할 수 있다.

```text
events = epoll_wait(...)
        ↓
Ready Event 확인
        ↓
if ACCEPT → 연결 처리
if READ   → 읽기 처리
if WRITE  → 쓰기 처리
```

즉 Reactor가 없다고 Event를 구분하지 못하는 것은 아니다. Application이 직접 조건문 등으로 Event를 판별하고 처리하면 된다.

문제는 서버가 커질수록 **Event 판별과 실제 처리 로직이 하나의 흐름에 섞이기 쉽다**는 것이다.

```text
epoll_wait()
    ↓
ACCEPT → 연결 생성 / 등록 / ...
READ   → read / protocol 처리 / ...
WRITE  → buffer 확인 / 전송 / ...
CLOSE  → 자원 정리 / ...
```

I/O Multiplexing은 **여러 Socket 중 무엇이 Ready인가**라는 문제를 해결하지만, 그 결과로 발생한 여러 Event를 Application에서 어떻게 구조화하여 처리할지는 별도의 문제다.

여기서 Event를 기다리고 판별하는 공통 흐름과 Event별 처리 로직을 분리하는 Reactor Pattern이 등장한다.

```text
I/O Multiplexing
       ↓
   Ready Event
       ↓
    Reactor
       ↓
    Dispatch
   /    |    \
Accept  Read  Write
Handler Handler Handler
```

> **Reactor Pattern은 Multiplexing으로 얻은 I/O Event를 적절한 Handler로 Dispatch하여 Event 처리 구조를 분리·구조화하는 패턴이다.**

### Multiplexing과 Reactor의 관점 차이

```text
I/O Multiplexing의 질문
= "여러 Socket 중 누가 Ready인가?"

Reactor의 질문
= "이 Ready Event는 어떤 처리 로직이 담당하는가?"
```

따라서 둘은 같은 개념이 아니다.

```text
여러 Socket
    ↓
I/O Multiplexing
    ↓
Ready Event 발견
    ↓
Reactor
    ↓
적절한 Handler로 Dispatch
    ↓
처리 로직 실행
```

### Reactor와 Thread를 구분한다

Handler로 Dispatch한다는 것이 반드시 Worker Thread에게 작업을 넘긴다는 뜻은 아니다.

```text
Reactor
   ↓
Read Handler 선택
   ↓
같은 Event Loop Thread가 Handler 실행
```

또는 처리 시간이 긴 작업을 별도 Worker Thread에 위임하도록 설계할 수도 있다.

```text
Reactor / Handler
       ↓
무거운 작업
       ↓
Worker Thread
```

따라서:

```text
Handler
= 어떤 처리 로직을 실행할 것인가

Thread
= 그 처리 로직을 실제로 누가 실행할 것인가
```

> **Reactor의 핵심은 Thread 분배가 아니라 Event Dispatch다. Worker Thread 사용 여부는 별도의 실행 전략이다.**

## 3. Java NIO는 같은 I/O 개념을 Java API로 추상화한다

Java NIO 전체가 I/O Multiplexing만을 의미하는 것은 아니지만, `Selector` 계열은 지금까지 학습한 I/O Multiplexing과 직접 연결된다.

```text
OS 수준                       Java NIO
────────────────────────────────────────
Socket                 →    SocketChannel
I/O Multiplexing       →    Selector
Ready Event 정보       →    SelectionKey
반복 대기 / 처리        →    Selector Loop
```

### Channel / SocketChannel

`SocketChannel`은 Java NIO에서 Socket 통신을 다루는 Channel이다.

```text
SocketChannel A ─┐
SocketChannel B ─┼→ Selector
SocketChannel C ─┘
```

Channel을 Selector에 등록할 때 관심 있는 Event도 함께 지정한다.

```text
Channel A → READ 관심
Channel B → READ 관심
Channel C → WRITE 관심
```

### Selector

Application Thread는 `selector.select()`를 통해 등록된 여러 Channel 중 Ready된 Channel이 생기기를 기다릴 수 있다.

```text
Application Thread
       ↓
selector.select()
       ↓
여러 Channel의 Ready 대기
       ↓
B : READ Ready
       ↓
select() 반환
```

Selector가 실제 데이터를 읽어주는 것은 아니다.

```text
Selector
= "B가 지금 READ 가능하다"

Application Thread
= B Channel에서 실제 read()
```

### SelectionKey

`SelectionKey`는 어떤 Channel에서 어떤 관심 Event가 Ready되었는지 확인하는 데 사용된다.

```text
SelectionKey
   ├─ 어떤 Channel인가?
   └─ 어떤 Event가 Ready인가?
```

개념적인 Selector Loop는 다음과 같다.

```text
while (server running) {

    selector.select()
          ↓
    Ready SelectionKey 확인
          ↓
    ACCEPT / READ / WRITE 판별
          ↓
    해당 Channel 처리
}
```

즉 Java NIO `Selector`는 새로운 I/O 원리를 만든 것이 아니라, OS별 I/O Multiplexing 기능을 Java Application에서 사용할 수 있도록 추상화한 API로 이해한다.

```text
Java Application
       ↓
Java NIO Selector
       ↓
JDK의 OS별 구현
       ↓
OS I/O Multiplexing
       ↓
Kernel
```

## 4. Netty는 NIO 서버 구조를 더 높은 수준으로 추상화한다

Java NIO를 직접 사용하면 Application이 Selector 관리, Channel 등록, SelectionKey 처리, Event Loop, Buffer, Thread 정책, 예외 처리 등을 직접 구성해야 한다.

```text
Java NIO 직접 사용

Selector 관리
+ Channel 등록
+ SelectionKey 관리
+ Selector Loop
+ Buffer 관리
+ READ / WRITE 처리
+ Thread 관리
+ 예외 처리
```

Netty는 이러한 NIO 기반 Network Application 개발 구조를 Framework 수준에서 추상화한다.

```text
OS
│
├─ Socket
├─ epoll 등
└─ Ready Event
        ↓
Java NIO
├─ SocketChannel
├─ Selector
└─ SelectionKey
        ↓
Netty
├─ Channel
├─ EventLoop
├─ ChannelPipeline
└─ ChannelHandler
```

### EventLoop

Java NIO에서 직접 작성하던 반복적인 Selector 처리 흐름을 Netty에서는 `EventLoop`라는 구성요소를 통해 관리한다.

```text
Netty EventLoop
      │
      ├─ I/O Event 대기
      ├─ Ready Event 확인
      ├─ 해당 Channel 처리
      └─ 다시 Event 대기
             ↺
```

### ChannelHandler

실제 Event 처리 로직은 `ChannelHandler`로 분리할 수 있다.

```text
EventLoop
    ↓
I/O Event
    ↓
Channel
    ↓
ChannelPipeline
    ↓
ChannelHandler
```

하나의 EventLoop Thread가 여러 Channel을 담당할 수 있다.

```text
          EventLoop Thread
                 │
      ┌──────────┼──────────┐
      ↓          ↓          ↓
  Channel A  Channel B  Channel C
      │          │          │
  Handler    Handler    Handler
```

이는 처음 학습한 **소수의 Thread가 I/O Multiplexing을 통해 여러 Socket/Channel을 처리할 수 있다**는 원리가 Framework 수준까지 올라온 모습으로 볼 수 있다.

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
Java NIO
Channel / Selector / SelectionKey
        ↓
Netty
EventLoop / Channel / Handler
```

현재까지의 핵심을 한 번에 정리하면:

```text
Thread
= 실행 주체

Socket / Channel
= 통신 자원

I/O Multiplexing
= 여러 I/O 중 무엇이 Ready인지 효율적으로 기다림

Event Loop
= Ready 대기와 처리를 반복하는 실행 구조

Reactor
= Ready Event를 적절한 Handler로 Dispatch하는 Application 설계 패턴

Java NIO Selector
= OS I/O Multiplexing을 Java에서 사용할 수 있도록 추상화한 API

Netty
= NIO 기반 Event-driven Network Application 구조를 Framework 수준에서 추상화
```

## 6. 다음 학습 지점

다음에는 **Netty의 Threading Model**을 중심으로 아래 질문을 확인한다.

1. 하나의 `EventLoop`가 여러 `Channel`을 담당하는 것이 실제로 어떻게 가능한가?
2. `EventLoopGroup`은 여러 EventLoop를 어떻게 구성하고 Channel에 배정하는가?
3. Channel과 EventLoop의 관계는 왜 일정하게 유지되는가?
4. EventLoop Thread에서 Handler를 실행할 때 오래 걸리는 Blocking 작업이 왜 문제가 되는가?
5. 이런 작업을 Worker Thread / 별도 Executor로 넘기면 실행 흐름이 어떻게 달라지는가?

이후 필요하면 `ChannelPipeline / ChannelHandler`의 Event 전달 구조와 Spring WebFlux 등 상위 Reactive Server 구조까지 연결한다.
