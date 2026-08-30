# Socket과 서버 I/O 개념지도

이 문서는 네트워크의 `Port / TCP / UDP`와 운영체제의 I/O 처리 사이를 연결하는 **횡단·보강 개념지도**다.

목표는 API를 하나씩 암기하는 것이 아니라 **Application이 Socket을 통해 상대와 통신하는 전체 흐름과, Server가 많은 연결을 기다리고 처리하기 위해 I/O 방식이 어떻게 연결되는지** 이해하는 것이다.

## 1. 가장 먼저 잡을 큰 그림

```text
Application끼리 Network로 통신하고 싶다
        ↓
Application은 Network Hardware를 직접 다루지 않는다
        ↓
Socket API
= Application이 OS의 Network 기능을 사용하는 접점
        ↓
TCP / UDP
        ↓
Kernel Network Stack
        ↓
NIC / Network
        ↓
상대 Host의 Network Stack
        ↓
상대 Socket
        ↓
상대 Application
```

Socket은 TCP나 UDP 자체가 아니다.

```text
TCP / UDP
= Transport Protocol

Socket API
= Application이 OS의 통신 기능을 사용하는 Interface

Socket
= 통신 endpoint를 Application에서 다루기 위한 추상화
```

핵심 위치는 다음과 같다.

```text
Application
    ↓
Socket
──── Application / OS 경계 ────
    ↓
TCP / UDP
    ↓
IP
    ↓
Network
```

## 2. TCP와 UDP는 통신 방식이 다르다

Socket API는 TCP와 UDP 모두에 사용할 수 있지만 통신 흐름은 다르다.

```text
Socket
├─ TCP
│   ├─ 연결을 먼저 맺음
│   ├─ 연결된 상대와 Byte Stream 송수신
│   └─ 사용 후 연결 종료
│
└─ UDP
    ├─ TCP와 같은 연결 수립 과정 없음
    └─ Datagram 단위 송수신
```

이후 Server의 `listen / accept`, Blocking, 많은 연결 처리 문제는 **TCP Server를 중심으로** 본다.

## 3. Client와 Server는 어떻게 연결되는가

TCP 통신을 Client와 Server 양쪽에서 함께 보면 `accept()`가 왜 필요한지 위치가 보인다.

```text
[Client]                              [Server]

                                        socket()
                                           ↓
                                         bind()
                                           ↓
                                        listen()
                                           ↓
socket()                              accept() 대기
   ↓                                      │
connect() ─────── TCP 연결 수립 ─────────→│
   │                                      ↓
   │                              Connected Socket
   │                                      │
send/write ─────────────────────────→ recv/read
   │                                      │
recv/read  ←───────────────────────── send/write
   │                                      │
close()   ─────── 연결 종료 ─────────── close()
```

Server에는 역할이 다른 Socket이 존재한다.

```text
Listening Socket
= 새 Client 연결을 받는 역할

        ↓ accept()

Connected Socket
= 특정 Client와 실제 데이터를 주고받는 역할
```

그래서 `listen()`과 `accept()`는 같은 동작이 아니다.

```text
socket()
= Socket 생성

bind()
= Server가 사용할 Local IP / Port와 연결

listen()
= 새 연결을 받을 수 있는 상태로 전환

accept()
= 도착한 연결 하나를 받아 Connected Socket을 얻음
```

여기까지가 **연결을 만들고 통신할 Socket을 얻는 흐름**이다.

## 4. 그런데 아직 연결이나 데이터가 오지 않았다면?

여기서 Server I/O의 핵심 문제가 처음 등장한다.

```text
Server가 accept() 호출
        ↓
아직 새 Client가 없음
        ↓
accept()는 어떻게 해야 하지?
```

데이터 수신도 같다.

```text
Server가 read() 호출
        ↓
아직 읽을 데이터가 없음
        ↓
read()는 어떻게 해야 하지?
```

즉 `Blocking / Non-blocking`은 갑자기 등장하는 별도 기술이 아니라 **I/O 결과가 아직 준비되지 않았을 때 호출을 어떻게 처리할 것인가**의 차이다.

## 5. Blocking: 준비될 때까지 호출이 기다린다

```text
accept() / read() 호출
        ↓
결과가 아직 준비되지 않음
        ↓
호출이 바로 반환되지 않고 기다림
        ↓
연결 / 데이터 도착
        ↓
호출이 반환되고 다음 Code 실행
```

여기서 `기다린다`는 것이 CPU로 계속 확인한다는 뜻은 아니다.

```text
Thread가 Blocking I/O 호출
        ↓
지금 처리할 I/O 없음
        ↓
OS가 해당 Thread를 대기시킬 수 있음
        ↓
CPU는 다른 실행 가능한 작업 수행
        ↓
I/O 준비
        ↓
Thread가 다시 실행 가능
```

따라서 다음을 구분한다.

```text
Blocking
= 호출 결과를 기다리며 해당 실행 흐름이 진행되지 않음

Busy Waiting / Busy Polling
= CPU를 사용해 준비 여부를 계속 반복 확인
```

Blocking 자체가 Busy Waiting을 의미하지 않는다.

## 6. Client가 하나가 아니라 많아지면?

Client 하나만 처리한다면 한 Thread가 기다렸다가 처리하는 구조도 이해하기 쉽다. 실제 Server에는 여러 Client가 동시에 연결될 수 있다.

```text
Client A ─→ Connected Socket A
Client B ─→ Connected Socket B
Client C ─→ Connected Socket C
Client D ─→ Connected Socket D
                     ↓
                   Server
```

이제 Server는 **여러 Socket의 연결·데이터를 어떻게 동시에 기다리고 처리할 것인가**를 결정해야 한다.

가장 직관적인 방법 중 하나는 연결마다 실행 흐름을 두는 것이다.

```text
Socket A → Thread A → Blocking read()
Socket B → Thread B → Blocking read()
Socket C → Thread C → Blocking read()
Socket D → Thread D → Blocking read()
```

이 방식은 이해하기 쉽지만 연결 수가 매우 많아지면 Thread 수도 함께 늘어날 수 있다.

그러면 다른 질문이 생긴다.

> **적은 수의 Thread로 많은 Socket을 관리할 수는 없을까?**

## 7. Non-blocking: 준비되지 않았으면 바로 돌아온다

```text
read() 호출
   ↓
데이터 없음
   ↓
기다리지 않고 즉시 반환
   ↓
Thread는 다른 작업 수행 가능
```

Blocking과 비교하면 핵심은 단순하다.

```text
Blocking
= 준비되지 않았으면 기다림

Non-blocking
= 준비되지 않았으면 바로 반환
```

하지만 Non-blocking으로 바꾸는 것만으로 많은 Socket 문제가 해결되는 것은 아니다.

```text
Socket A 확인 → 없음
Socket B 확인 → 없음
Socket C 확인 → 없음
Socket D 확인 → 없음
다시 Socket A 확인 → ...
```

Application이 이 작업을 계속 반복하면 Busy Polling이 될 수 있다.

그래서 질문이 다시 바뀐다.

> **Application이 모든 Socket을 계속 확인하지 말고, 준비된 Socket이 무엇인지 OS가 알려줄 수는 없을까?**

## 8. 여러 Socket을 함께 기다린다: I/O Multiplexing

```text
Socket A ─┐
Socket B ─┤
Socket C ─┼─→ OS에 여러 I/O의 준비 상태를 함께 기다림
Socket D ─┘
              ↓
        준비된 Socket 확인
              ↓
          해당 I/O 처리
```

이것이 I/O Multiplexing을 이해하는 핵심이다.

```text
I/O Multiplexing
= 여러 I/O 대상 중 어떤 것이 준비됐는지 함께 기다리고 확인하는 방식
```

대표적인 API 계열은 다음과 같다.

```text
select
poll
epoll   ← Linux 대표 방식
```

API별 내부 자료구조와 성능 차이보다 먼저 다음 관계를 기억한다.

```text
연결마다 Thread에서 Blocking
        ↕ 다른 처리 선택
적은 Thread + 여러 Socket
        ↓
I/O Multiplexing
```

둘 중 하나가 모든 상황에서 절대적으로 우월하다는 의미는 아니다. 핵심은 **많은 연결을 처리하는 방식이 달라질 수 있다는 것**이다.

## 9. Event Loop는 준비된 Event를 반복 처리한다

I/O Multiplexing으로 준비된 Socket을 알 수 있다면 Application은 그 결과를 반복해서 처리하는 구조를 만들 수 있다.

```text
여러 I/O Event 대기
        ↓
준비된 Socket 확인
        ↓
해당 Event 처리
        ↓
다시 Event 대기
        ↑
        └──────── 반복
```

이 반복 구조가 Event Loop다.

```text
epoll
= Linux에서 여러 File Descriptor의 I/O 준비 상태를 기다리는 Mechanism/API

Event Loop
= Event를 기다리고 준비된 작업을 반복 처리하는 Application 실행 구조
```

따라서 `epoll = Event Loop`가 아니다. Event Loop가 OS의 I/O Multiplexing Mechanism을 이용할 수 있는 관계다.

## 10. 처음부터 다시 연결하면

```text
Application이 Network 통신을 하고 싶다
        ↓
Socket API
        ↓
TCP Server라면 연결을 받을 준비
socket → bind → listen
        ↓
Client connect()
        ↓
Server accept()
        ↓
Connected Socket으로 데이터 송수신
        ↓
그런데 연결이나 데이터가 아직 없다면?
        ↓
I/O를 어떻게 기다릴까?
├─ Blocking
│   └─ 준비될 때까지 호출이 기다림
│
└─ Non-blocking
    └─ 준비되지 않았으면 바로 반환
        ↓
Client / Socket이 많아짐
        ↓
계속 직접 확인하면 Busy Polling 가능
        ↓
여러 Socket을 함께 기다리고 싶다
        ↓
I/O Multiplexing
select / poll / epoll
        ↓
준비된 Event를 반복 처리
        ↓
Event Loop
```

이 흐름의 핵심은 `Blocking → Non-blocking → epoll`이 단순한 기술 발전 순서라는 뜻이 아니다. **Server가 I/O를 기다리고 많은 연결을 관리하는 문제를 이해하기 위한 관계**다.

## 11. HTTP / RPC Server는 어디에 놓일까?

Socket과 I/O 처리는 여러 Application Server의 아래쪽 기반이 된다.

```text
HTTP Server / RPC Server / gRPC Server
              ↓
      Application Protocol / 호출 모델
              ↓
        Server I/O 처리 구조
              ↓
           Socket API
              ↓
           TCP / UDP
              ↓
      Kernel Network Stack
```

HTTP와 RPC의 차이를 이 문서에서 깊게 다루지는 않는다. 여기서는 **위쪽 요청 규약과 프로그래밍 모델은 달라도 아래에서 Socket과 OS I/O Mechanism을 사용할 수 있다**는 위치만 잡는다.

RPC와 gRPC 자체의 의미와 Stub/Proxy, 원격 호출 모델은 세부학습의 `IPC-RPC-gRPC-원격호출`에서 본다.

## 12. 네트워크와 운영체제의 경계

```text
[네트워크에서 보는 것]
TCP / UDP
IP / Port
연결과 전송 특성
        ↓
      Socket
        ↓
[운영체제에서 보는 것]
File Descriptor
Thread 대기 / 깨움
Blocking / Non-blocking
I/O Multiplexing
Scheduler
```

Socket은 이 두 영역을 실제 Application 관점에서 연결해준다.

> **Network에서 Packet이 어디로 전달되는지만 보는 것과, Application이 그 통신을 어떻게 기다리고 처리하는지를 보는 것은 다른 층의 이야기다. Socket을 중심에 놓으면 두 관점이 연결된다.**

## 13. 복습할 때 이 질문만 다시 연결한다

```text
Application은 OS의 Network 기능을 어떻게 사용하는가?
→ Socket API

TCP Client와 Server는 어떻게 연결되는가?
→ connect ↔ listen / accept

Listening Socket과 Connected Socket은 왜 다른가?
→ 새 연결 수신 ↔ 특정 Client와 데이터 통신

accept/read할 것이 아직 없다면?
→ I/O 대기 문제가 생김

Blocking은 무엇을 기다리는가?
→ 결과가 준비될 때까지 호출이 반환되지 않음

Blocking이면 CPU가 계속 도는가?
→ 아니다. Thread는 OS에 의해 대기할 수 있음

Client가 많아지면?
→ 여러 Connected Socket을 함께 관리해야 함

Non-blocking이면 문제가 모두 해결되는가?
→ 아니다. 직접 반복 확인하면 Busy Polling 가능

많은 Socket 중 준비된 것만 알고 싶다면?
→ I/O Multiplexing

준비된 Event를 반복해서 처리하는 구조는?
→ Event Loop
```
