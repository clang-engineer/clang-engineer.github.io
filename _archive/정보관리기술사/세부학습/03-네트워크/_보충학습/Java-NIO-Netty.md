# Java NIO · Netty

> `Reactor-Pattern.md`에서 정리한 **I/O Multiplexing · Event Loop · Reactor Pattern이라는 일반 원리**가 Java 생태계에서 어떻게 구현·추상화되는지 이해하기 위한 보충학습 문서다.
>
> Java NIO와 Netty는 I/O Multiplexing에서 파생된 일반 이론이 아니라, **Java/WebFlux 기술 스택에서 해당 원리를 실제로 만나는 구현 경로**로 본다.

## 1. 먼저 성격을 구분한다

```text
epoll / select / poll
= OS I/O Multiplexing 메커니즘

Reactor Pattern
= Application Event Dispatch 설계 패턴

Java NIO
= Java I/O API / 추상화

Netty
= Event-driven Network Framework
```

따라서 다음처럼 단순한 파생 관계로 이해하지 않는다.

```text
Reactor → Java NIO → Netty    X
```

더 정확한 관계는 다음과 같다.

```text
[일반 I/O 원리]
Socket / FD
   ↓
I/O Multiplexing
   ↓
Event Loop / Reactor Pattern

             +

[Java 구현 경로]
Java NIO
   ↓
Netty
```

이 두 축이 실제 Java Network Application에서 함께 사용된다.

## 2. Java NIO는 OS I/O를 Java API로 추상화한다

Java NIO 전체가 I/O Multiplexing만을 의미하는 것은 아니지만, `Selector` 계열은 OS의 I/O Multiplexing과 직접 연결된다.

```text
OS 수준                       Java NIO
────────────────────────────────────────
Socket / FD             →    SocketChannel
I/O Multiplexing        →    Selector
Ready Event 정보        →    SelectionKey
반복 대기 / 처리         →    Selector Loop
```

### SocketChannel

`SocketChannel`은 Java NIO에서 Socket 통신을 다루는 Channel이다.

```text
SocketChannel A ─┐
SocketChannel B ─┼→ Selector
SocketChannel C ─┘
```

Channel을 Selector에 등록할 때 관심 Event도 함께 지정한다.

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
JDK의 OS별 구현
       ↓
OS I/O Multiplexing
       ↓
Kernel
       ↓ Ready
selector.select() 반환
```

Selector가 실제 데이터를 읽어주는 것은 아니다.

```text
Selector
= "이 Channel이 지금 READ 가능하다"

Application Thread
= 해당 Channel에서 실제 read()
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

> **Java NIO Selector는 새로운 I/O 원리를 만든 것이 아니라, OS별 I/O Multiplexing 기능을 Java Application에서 사용할 수 있도록 추상화한 API다.**

## 3. Netty는 NIO 기반 서버 구조를 Framework로 추상화한다

Java NIO를 직접 사용하면 Application이 다음을 직접 구성해야 한다.

```text
Selector 관리
+ Channel 등록
+ SelectionKey 관리
+ Selector Loop
+ Buffer 관리
+ READ / WRITE 처리
+ Thread 관리
+ 예외 처리
```

Netty는 이러한 Event-driven Network Application 구조를 Framework 수준에서 추상화한다.

```text
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

## 4. Netty EventLoop

Java NIO에서 직접 작성하던 반복적인 Selector 처리 흐름을 Netty에서는 `EventLoop`라는 구성요소를 통해 관리한다.

```text
Netty EventLoop Thread
      │
      ├─ I/O Event 대기
      ├─ Ready Event 확인
      ├─ 해당 Channel 처리
      └─ 다시 Event 대기
             ↺
```

하나의 EventLoop Thread가 여러 Channel을 담당할 수 있다.

```text
          EventLoop Thread
                 │
      ┌──────────┼──────────┐
      ↓          ↓          ↓
  Channel A  Channel B  Channel C
```

이는 `Reactor-Pattern.md`에서 확인한 **소수의 Thread가 I/O Multiplexing을 통해 여러 I/O 자원을 처리할 수 있다는 원리**가 Framework 수준으로 올라온 모습이다.

## 5. ChannelPipeline과 ChannelHandler

실제 Event 처리 로직은 `ChannelHandler`로 분리되고 `ChannelPipeline`을 통해 연결된다.

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

여기서도 Handler와 Thread를 같은 것으로 이해하지 않는다.

```text
Handler
= 처리 로직

EventLoop Thread
= 그 로직을 실제로 실행하는 실행 주체
```

필요하면 특정 작업을 별도 Executor / Worker Thread로 넘길 수 있다.

## 6. Netty까지 이해하면 확인할 핵심 질문

1. 하나의 `EventLoop`가 여러 `Channel`을 담당하는 것이 실제로 어떻게 가능한가?
2. `EventLoopGroup`은 여러 EventLoop를 어떻게 구성하고 Channel에 배정하는가?
3. Channel과 EventLoop의 관계는 왜 일정하게 유지되는가?
4. EventLoop Thread에서 오래 걸리는 Blocking 작업이 왜 문제가 되는가?
5. Blocking 작업을 별도 Scheduler / Executor로 이동하면 실행 흐름은 어떻게 달라지는가?

특히 마지막 두 질문은 Spring WebFlux의 실행 모델을 이해하는 데 직접 연결된다.

## 7. 다음 단계: Reactive Programming으로 넘어간다

Netty의 Network Event 처리와 Reactive Programming은 같은 개념이 아니다.

```text
[Network Event 처리 축]
Socket / FD
   ↓
I/O Multiplexing
   ↓
Java NIO
   ↓
Netty

[Reactive 데이터 흐름 축]
Reactive Streams
   ↓
Project Reactor
   ↓
Spring WebFlux
```

Spring WebFlux에서는 이 두 축이 실제 Application 실행 구조에서 만난다.

```text
HTTP Request
     ↓
Netty EventLoop
     ↓
Spring WebFlux
     ↓
Project Reactor
Mono / Flux
     ↓
Application Handler / Service
```

다음 학습 문서는 Reactive Streams · Project Reactor · Spring WebFlux를 별도 축으로 다룬다.
