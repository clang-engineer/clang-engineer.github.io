# Java Network I/O에서 Spring WebFlux까지

> `Reactor-Pattern.md`에서 정리한 I/O Multiplexing의 일반 원리가 **Java 웹 개발 기술 스택에서 어떤 문제를 만나고, 어떤 추상화를 거쳐 Spring WebFlux까지 연결되는지** 이해하기 위한 보충학습 문서다.
>
> 각 기술의 사용법이나 API 암기가 목적이 아니다. **왜 등장했는가 → 무엇을 해결하는가 → 어떻게 해결하는가 → 핵심 특징과 장단점·Trade-off → 앞뒤 기술과 무엇이 다른가**를 중심으로, WebFlux 실무 코드의 실행 원리를 아래 계층부터 복원하는 것을 목표로 한다.

## 1. 먼저 전체 좌표를 잡는다

I/O Multiplexing에서 WebFlux까지를 하나의 단순한 파생 계층으로 보지 않는다. 두 개의 관심사가 Java Web Application에서 합류한다.

```text
[Network I/O 실행 축]
OS I/O Multiplexing
        ↓ Java에서 활용
Java NIO
        ↓ 서버 구조를 Framework화
Netty

             +

[Reactive 데이터 흐름 축]
Reactive Programming
        ↓ 표준 규약
Reactive Streams
        ↓ Java 구현 Library
Project Reactor

             ↓ 두 축이 합류

Spring WebFlux
        ↓
Web Application
```

따라서 `Netty → Reactive Streams → Project Reactor → WebFlux`를 모두 같은 종류의 추상화 단계로 외우지 않는다.

```text
Java NIO
= Java I/O API / 추상화

Netty
= Event-driven Network Framework

Reactive Streams
= 비동기 Stream 처리 규약

Project Reactor
= Reactive Streams 기반 Java Library

Spring WebFlux
= Reactive Web Framework
```

## 2. Java NIO — OS I/O를 Java에서 어떻게 다룰 것인가

### 왜 필요한가

OS마다 Network I/O를 제공하는 방식과 API가 다르다. Java Application이 `select / poll / epoll` 같은 OS별 저수준 I/O를 직접 다루는 대신 Java 수준의 공통 추상화가 필요하다.

### 어떻게 해결하는가

Java NIO는 Channel · Selector · SelectionKey 등의 API로 I/O 자원과 readiness를 다룬다.

```text
OS 수준                       Java NIO
────────────────────────────────────────
Socket / FD             →    SocketChannel
I/O Multiplexing        →    Selector
Ready Event 정보        →    SelectionKey
반복 대기 / 처리         →    Selector Loop
```

개념적인 실행 흐름은 다음과 같다.

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
       ↓ Ready Event
selector.select() 반환
       ↓
SelectionKey 확인
       ↓
Channel에서 실제 I/O
```

`Selector`가 데이터를 대신 읽어주는 것은 아니다.

```text
Selector
= 어떤 Channel이 I/O 가능한 상태인지 확인

Channel
= 실제 I/O를 수행하는 Java의 통신 자원 추상화
```

### 핵심 특징

- OS별 I/O 차이를 Java API 뒤로 숨긴다.
- `Selector`를 통해 여러 Channel의 readiness를 한 실행 흐름에서 다룰 수 있다.
- Blocking I/O뿐 아니라 Non-blocking I/O 기반 서버 구조를 구성할 수 있다.

### 장점

- Java 코드가 특정 OS의 Multiplexing API에 직접 종속되는 부담을 줄인다.
- 소수 Thread로 다수 Connection을 처리하는 구조를 Java에서 구현할 기반을 제공한다.

### 한계 · Trade-off

Java NIO는 **I/O API와 기반 추상화**를 제공하지만 서버 구조 전체를 대신 만들어주지는 않는다.

```text
Selector 관리
Channel 등록
SelectionKey 판별
Selector Loop
Buffer 관리
Thread 정책
Event Dispatch
예외 처리
...
```

Application이 이런 구조를 직접 구성하면 코드와 운영 복잡도가 커질 수 있다.

> **Java NIO는 새로운 I/O 원리를 만든 것이 아니라 OS I/O 기능을 Java에서 사용할 수 있도록 추상화한 API다.**

## 3. Netty — NIO 서버 구조를 왜 Framework화했는가

### 왜 필요한가

Java NIO만으로 Event-driven Network Server를 직접 만들 수 있지만, I/O API를 사용하는 것과 안정적인 서버 실행 구조를 만드는 것은 다른 문제다.

```text
Java NIO 제공
= Channel / Selector / Buffer 등의 기반 API

Application에 남는 문제
= Event Loop
+ Channel Lifecycle
+ Event Dispatch
+ Buffer 관리
+ Thread 정책
+ 예외 처리
+ 확장 가능한 Handler 구조
```

### 어떻게 해결하는가

Netty는 NIO 기반 Network Application의 반복적인 실행 구조를 Framework 수준으로 추상화한다.

```text
Java NIO
SocketChannel / Selector / SelectionKey
        ↓
Netty
Channel / EventLoop / Pipeline / Handler
```

WebFlux를 이해하기 위해 Netty의 API 사용법까지 내려갈 필요는 없다. 핵심 실행 원리는 다음 정도로 잡는다.

```text
          EventLoop Thread
                 │
      ┌──────────┼──────────┐
      ↓          ↓          ↓
  Channel A  Channel B  Channel C
```

하나의 EventLoop Thread가 I/O Multiplexing을 기반으로 여러 Channel의 Event를 처리할 수 있다.

```text
EventLoop Thread
      ↓
Ready Channel 확인
      ↓
해당 Event 처리
      ↓
다음 Ready Channel 처리
      ↓
다시 I/O Event 대기
```

### 핵심 특징

- Event-driven Network Framework다.
- 소수 EventLoop Thread가 다수 Channel을 담당할 수 있다.
- Channel은 통신 자원/연결의 추상화이고 EventLoop Thread는 실행 주체다.
- Event 처리 로직을 Handler 구조로 분리한다.

### Java NIO와 차이

```text
Java NIO
= I/O를 Java에서 다루기 위한 API / 추상화

Netty
= NIO를 기반으로 Network Server의 실행 구조까지 제공하는 Framework
```

### 장점

- 저수준 NIO 서버 구현의 반복적인 복잡성을 줄인다.
- 높은 동시 연결을 소수 Thread로 처리하는 Event-driven 구조를 구성하기 쉽다.
- I/O Event와 처리 로직을 구조적으로 분리할 수 있다.

### 한계 · Trade-off

EventLoop Thread 하나가 여러 Channel을 담당한다는 장점은 동시에 중요한 제약을 만든다.

```text
EventLoop Thread
      ↓
Channel A Handler
      ↓
오래 걸리는 Blocking 작업
      ↓
EventLoop Thread가 대기
      ↓
같은 EventLoop가 담당하는
Channel B / C 처리도 지연 가능
```

> **WebFlux 관점에서 Netty의 가장 중요한 특징은 “소수 EventLoop Thread가 여러 Connection을 담당하므로 EventLoop를 오래 Blocking하면 안 된다”는 점이다.**

Netty의 `ServerBootstrap`, 세부 Pipeline 설정, Boss/Worker 구성 API 같은 사용법은 이 문서의 기본 범위에서 제외한다.

## 4. 여기서 관심사가 바뀐다 — Network I/O만 잘 처리하면 끝인가

Java NIO와 Netty는 **Network I/O를 효율적으로 처리하는 문제**에 집중한다.

하지만 Application에는 또 다른 문제가 남는다.

```text
HTTP Request 도착
        ↓
DB 조회
        ↓
외부 API 호출
        ↓
결과 변환
        ↓
여러 비동기 결과 조합
        ↓
HTTP Response
```

각 작업이 비동기로 완료될 수 있다면 Callback과 상태 관리만으로 복잡한 데이터 흐름을 표현하기 어려워진다.

따라서 여기서부터는 Network I/O 추상화의 단순한 다음 단계가 아니라 **비동기 데이터 흐름을 어떻게 표현하고 제어할 것인가**라는 새로운 관심사로 넘어간다.

## 5. Reactive Programming — 비동기 데이터 흐름을 어떻게 표현할 것인가

### 왜 필요한가

비동기 작업이 많아질수록 “언제 값이 생기고, 그 값에 어떤 처리를 하고, 다음 비동기 작업과 어떻게 연결할 것인가”를 명령형 흐름만으로 관리하기 어려워진다.

### 어떻게 접근하는가

Reactive Programming에서는 데이터가 준비될 때 처리되는 흐름을 Stream 중심으로 선언적으로 표현한다.

```text
Data 발생
   ↓
변환
   ↓
필터링
   ↓
다른 비동기 작업과 조합
   ↓
소비
```

중요한 점은 **Reactive Programming 자체가 I/O Multiplexing이나 Non-blocking I/O와 같은 개념은 아니라는 것**이다.

```text
I/O Multiplexing
= 여러 I/O의 readiness를 효율적으로 기다리는 문제

Reactive Programming
= 비동기 데이터의 전달·변환·조합 흐름을 표현하는 문제
```

## 6. Reactive Streams — 비동기 Stream에 왜 규약이 필요한가

### 왜 필요한가

비동기 Stream에서는 생산자가 데이터를 만드는 속도와 소비자가 처리하는 속도가 다를 수 있다.

```text
Publisher 빠름
      ↓↓↓↓↓
Subscriber 느림
```

무제한으로 데이터를 밀어내면 Buffer 증가, Memory 압박, 처리 지연 같은 문제가 발생할 수 있다.

또한 서로 다른 Reactive Library가 함께 동작하려면 공통된 상호작용 규약이 필요하다.

### 어떻게 해결하는가

Reactive Streams는 다음 역할을 중심으로 비동기 Stream 처리 규약을 정의한다.

```text
Publisher
    ↓
Subscription
    ↓
Subscriber

Subscriber
    └─ 처리 가능한 양을 요청
          ↓
      Backpressure
```

### 핵심 특징

- Publisher / Subscriber / Subscription 역할을 정의한다.
- 비동기 Stream에서 수요를 전달할 수 있도록 한다.
- Backpressure를 통해 생산과 소비의 속도 차이를 제어할 기반을 제공한다.

### 중요한 경계

Reactive Streams는 Web Framework도 아니고 Network Framework도 아니다.

```text
Netty
= Network Event 처리

Reactive Streams
= 비동기 데이터 Stream 상호작용 규약
```

## 7. Project Reactor — Reactive Streams를 Java에서 어떻게 사용할 것인가

### 왜 필요한가

Reactive Streams는 기본적인 규약과 인터페이스를 정의하지만, 실제 Application에서 데이터 변환·조합·오류 처리·실행 위치 제어 등을 편리하게 작성하기 위한 더 높은 수준의 Library가 필요하다.

### 어떻게 해결하는가

Project Reactor는 Reactive Streams 기반의 Java Reactive Programming Library다.

```text
Project Reactor
├─ Mono  = 0..1개의 비동기 결과
└─ Flux  = 0..N개의 비동기 결과
```

그리고 여러 Operator를 통해 데이터 흐름을 조합하고, Scheduler를 통해 작업의 실행 위치를 제어할 수 있다.

### 핵심 특징

- `Mono` / `Flux`로 Reactive 데이터 흐름을 표현한다.
- Operator를 조합하여 비동기 처리 Pipeline을 구성한다.
- Scheduler를 통해 실행 Thread 전략을 조절할 수 있다.
- Reactive Streams의 Backpressure 모델을 기반으로 한다.

### Reactor Pattern과 구분한다

```text
Reactor Pattern
= I/O Event를 Handler로 Dispatch하는 설계 패턴

Project Reactor
= Reactive Streams 기반 Java Library
```

이름이 같지만 같은 계보의 개념이 아니다.

### 중요한 경계

`Mono` / `Flux`를 사용한다고 내부 작업이 자동으로 Non-blocking이 되는 것은 아니다.

```text
Mono / Flux 안에서
Blocking DB / File / Legacy API 호출
        ↓
실제 실행 Thread는 그대로 Blocking 가능
```

따라서 **Reactive 표현 방식과 실제 I/O의 Blocking / Non-blocking 여부를 구분**해야 한다.

## 8. Spring WebFlux — Reactive 모델을 Web Application에 어떻게 적용할 것인가

### 왜 필요한가

Reactive Streams와 Project Reactor를 사용해 비동기 데이터 흐름을 표현할 수 있어도 HTTP Request / Response, Routing, Controller, Client 통신 등 Web Application의 공통 기능을 직접 구성할 수는 없다.

### 어떻게 해결하는가

Spring WebFlux는 Reactive Programming Model을 Web Application 개발에 적용한 Spring Web Framework다.

```text
HTTP Request
     ↓
Network Runtime
(Netty 등)
     ↓
Spring WebFlux
     ↓
Controller / Handler
     ↓
Mono / Flux
     ↓
Application Service
     ↓
HTTP Response
```

### 핵심 특징

- Reactive / Non-blocking Web Application 구성을 지원한다.
- Project Reactor의 `Mono` / `Flux`를 주요 Reactive Type으로 사용한다.
- Network Runtime의 Event-driven I/O와 Application의 Reactive 데이터 흐름을 Web Framework 수준에서 연결한다.

### 장점

- I/O 대기가 많은 높은 동시성 환경에서 소수 Thread를 효율적으로 활용할 수 있다.
- 여러 비동기 작업을 Reactive Pipeline으로 조합하기 좋다.
- Backpressure와 Reactive 생태계의 조합 모델을 활용할 수 있다.

### Trade-off

- 명령형 코드보다 실행 흐름과 Thread 전환을 추적하기 어려울 수 있다.
- Blocking Library와 섞이면 EventLoop 기반 실행 모델의 장점을 훼손할 수 있다.
- CPU-bound 작업이 자동으로 빨라지는 모델은 아니다.
- Reactive Stack 전체에 대한 이해가 부족하면 Debugging과 운영 복잡도가 커질 수 있다.

## 9. WebFlux에서 Blocking 작업이 왜 문제가 되는가

이 질문은 지금까지의 두 축이 만나는 지점이다.

```text
[Network I/O 축]
Netty
소수 EventLoop Thread
        ↓
다수 Channel / Connection 처리

             +

[Reactive 축]
Project Reactor
Mono / Flux Pipeline
        ↓
Spring WebFlux Handler
```

WebFlux Handler의 작업이 EventLoop Thread에서 실행되는 상황에서 오래 걸리는 Blocking 호출을 수행하면:

```text
EventLoop Thread
      ↓
WebFlux Handler
      ↓
Blocking 작업
      ↓
Thread가 해당 작업에 묶임
      ↓
같은 EventLoop가 담당하는
다른 Connection 처리도 지연 가능
```

그래서 Blocking 작업이 불가피하다면 **EventLoop를 점유하지 않도록 별도의 적절한 Scheduler / Thread Pool로 격리하는 실행 전략**이 필요하다.

여기서 `boundedElastic` 같은 개념이 등장하지만, 구체적인 API 사용법보다 먼저 **왜 Thread를 분리해야 하는가**를 이해한다.

## 10. 단계별 핵심 질문으로 복원한다

```text
많은 I/O를 어떻게 효율적으로 기다리지?
→ OS I/O Multiplexing

Java에서는 OS I/O를 어떻게 다루지?
→ Java NIO

NIO 서버 구조를 매번 직접 만들어야 하나?
→ Netty

비동기 데이터 흐름을 어떻게 표현하지?
→ Reactive Programming

생산자와 소비자의 속도 차이는 어떻게 제어하지?
→ Reactive Streams

Reactive Streams를 Java Application에서 어떻게 편하게 사용하지?
→ Project Reactor

Reactive 모델로 Web Application을 어떻게 만들지?
→ Spring WebFlux
```

## 11. 한 번에 구분한다

```text
OS I/O Multiplexing
= 여러 I/O의 readiness를 효율적으로 기다리는 메커니즘

Java NIO
= OS I/O 기능을 Java에서 다루는 API / 추상화

Netty
= NIO 기반 Event-driven Network Framework

Reactive Programming
= 비동기 데이터 흐름을 Stream 중심으로 표현하는 Programming Model

Reactive Streams
= 비동기 Stream과 Backpressure를 위한 표준 규약

Project Reactor
= Reactive Streams 기반 Java Reactive Library

Spring WebFlux
= Reactive Programming Model을 Web에 적용한 Spring Framework
```

> **전체를 하나의 직렬 파생 관계로 외우지 않는다. Network I/O 축과 Reactive 데이터 흐름 축이 Spring WebFlux 실행 구조에서 합류한다고 이해한다.**
