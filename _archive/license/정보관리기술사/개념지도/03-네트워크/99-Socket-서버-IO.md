# Socket과 서버 I/O 개념지도

이 문서는 네트워크의 `Port / TCP / UDP`와 운영체제의 I/O 처리 사이를 연결하는 **횡단·보강 개념지도**다.

시험 대분류를 새로 만드는 것이 목적이 아니라, **Application이 실제로 Network를 어떻게 사용하고 Server가 어떻게 요청을 기다리고 처리하는지** 큰 흐름을 잡기 위한 지도다.

## 1. 가장 먼저 잡을 큰 그림

```text
Application이 Network를 사용하고 싶다
        ↓
Socket API
        ↓
TCP / UDP
        ↓
Kernel Network Stack
        ↓
NIC / Network
```

Socket은 TCP나 UDP 자체가 아니다.

```text
TCP / UDP
= Transport Protocol

Socket API
= Application이 OS의 통신 기능을 사용하는 Interface

Socket
= 통신 endpoint를 다루기 위한 OS/Application 경계의 추상화
```

핵심은 `Application → Socket API → Kernel Network Stack → Network`라는 경계를 잡는 것이다.

---

## 2. Server는 어떻게 요청을 받을 준비를 하는가

TCP Server의 대표 흐름은 다음과 같다.

```text
socket()
  ↓
bind()
  ↓
listen()
  ↓
accept()
  ↓
read / write
```

각 단계의 위치만 먼저 잡는다.

```text
socket()
= 통신 endpoint 생성

bind()
= Local IP / Port와 연결

listen()
= 연결 요청을 받을 상태로 전환

accept()
= 도착한 연결을 받아 실제 통신용 Socket을 얻음
```

`listen()`과 `accept()`는 같은 역할이 아니다. `listen()`은 Server Socket을 연결 수신 상태로 만들고, `accept()`는 실제로 도착한 연결 하나를 받아 처리 가능한 연결 Socket을 얻는다.

---

## 3. 수신 대기한다고 CPU가 계속 도는 것은 아니다

Blocking 방식에서는 아직 처리할 연결이나 데이터가 없으면 Thread가 대기 상태로 들어갈 수 있다.

```text
Server Thread
    ↓
accept() / read()
    ↓
처리할 Event 없음
    ↓
BLOCKED
    ↓
CPU는 다른 작업 수행
    ↓
연결 / 데이터 도착
    ↓
Thread가 다시 실행 가능 상태로 전환
```

즉 수신 대기는 일반적으로 `왔나? 왔나?`를 계속 반복하는 Busy Waiting과 다르다.

실제 깨움 과정의 세부는 운영체제의 Interrupt, Wait Queue, Scheduler와 연결된다.

---

## 4. Blocking과 Non-blocking은 기다리는 방식의 차이다

```text
Blocking I/O
= 준비되지 않았으면 호출 Thread가 기다림

Non-blocking I/O
= 준비되지 않았으면 즉시 반환
```

Non-blocking이라고 자동으로 효율적인 것은 아니다.

```text
Socket A 확인
Socket B 확인
Socket C 확인
다시 A 확인 ...
```

처럼 계속 직접 확인하면 Busy Polling이 될 수 있다.

그래서 많은 Socket을 함께 다룰 때는 **어떤 Socket이 준비됐는지 OS가 알려주는 방식**이 필요하다.

---

## 5. 여러 Socket을 함께 기다린다: I/O Multiplexing

```text
Socket A ─┐
Socket B ─┤
Socket C ─┼─→ 여러 I/O를 함께 대기
Socket D ─┘
              ↓
        준비된 Socket 통지
              ↓
          해당 I/O 처리
```

대표적으로 다음 API 계열이 있다.

```text
I/O Multiplexing
├─ select
├─ poll
└─ epoll      ← Linux 대표 방식
```

여기서 중요한 것은 API별 세부 구현보다 다음 관계다.

> **하나의 Thread가 많은 Socket의 준비 상태를 효율적으로 기다릴 수 있게 한다.**

`select / poll / epoll`의 내부 자료구조와 성능 차이는 세부학습에서 본다.

---

## 6. Event Loop는 준비된 Event를 반복 처리한다

I/O Multiplexing과 함께 자주 등장하는 구조가 Event Loop다.

```text
I/O Event 대기
      ↓
준비된 Socket 확인
      ↓
해당 Event 처리
      ↓
다시 I/O Event 대기
      ↑
      └──── 반복
```

따라서 Event Loop와 epoll을 같은 개념으로 놓지 않는다.

```text
epoll
= Linux에서 여러 File Descriptor의 I/O 준비 상태를 기다리는 Mechanism/API

Event Loop
= Event를 기다리고 준비된 작업을 반복 처리하는 Application 실행 구조
```

Event Loop가 epoll을 사용할 수 있지만 둘은 동일하지 않다.

---

## 7. HTTP Server와 RPC Server도 결국 이 위에 올라간다

```text
HTTP Server / RPC Server / gRPC Server
              ↓
      Application Protocol / Model
              ↓
          Socket API
              ↓
           TCP / UDP
              ↓
      Kernel Network Stack
              ↓
          NIC / Network
```

웹 서버와 RPC 서버의 차이는 주로 위쪽에서 **어떤 요청 규약과 프로그래밍 모델을 사용하는가**에 있다.

아래쪽의 Server Socket, Kernel Network Stack, NIC를 통한 통신이라는 기반은 공유할 수 있다.

RPC와 gRPC 자체의 의미와 Stub/Proxy, 원격 호출 모델은 세부학습의 `IPC-RPC-gRPC-원격호출`에서 본다.

---

## 8. 네트워크와 운영체제의 경계

이 지도는 다음 두 영역을 연결한다.

```text
[네트워크]
TCP / UDP
Port
전송 특성
        ↓
     Socket API
        ↓
[운영체제]
File Descriptor / Socket 관리
Blocking / Non-blocking
I/O Multiplexing
Thread 대기 / 깨움
Scheduler
```

네트워크만 보면 Packet이 Process까지 도착하는 위치는 알 수 있지만, **Application이 그 통신 기능을 실제로 어떻게 사용하는가**는 Socket과 OS I/O 모델을 함께 봐야 이해된다.

---

## 9. 복습용 핵심 좌표

```text
Application
    ↓
Socket API
    ↓
TCP Server
socket → bind → listen → accept
    ↓
I/O 대기 방식
├─ Blocking
└─ Non-blocking
      ↓
많은 Socket을 함께 기다림
      ↓
I/O Multiplexing
├─ select
├─ poll
└─ epoll
      ↓
Event Loop
```

복습할 때는 세부 System Call 동작보다 다음 질문을 복원할 수 있으면 된다.

```text
Application은 Network를 어떻게 사용하는가?
→ Socket API

Server는 어떻게 연결을 받을 준비를 하는가?
→ bind / listen / accept

기다리는 동안 CPU를 계속 쓰는가?
→ Blocking 시 Thread는 대기 가능

Socket이 많아지면 어떻게 기다리는가?
→ I/O Multiplexing

준비된 Event를 계속 처리하는 구조는?
→ Event Loop
```
