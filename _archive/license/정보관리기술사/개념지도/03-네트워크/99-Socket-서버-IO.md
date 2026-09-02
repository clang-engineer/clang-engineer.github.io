# Socket과 서버 I/O 개념지도

이 문서는 네트워크의 `Port / TCP / UDP`와 운영체제의 I/O 처리 사이를 연결하는 **횡단·보강 개념지도**다.

목표는 API 이름을 나열하는 것이 아니라 **누가 → 누구에게 → 무엇을 요청하고 → OS가 무엇을 관리하며 → 결과가 없을 때 어떻게 기다리는지**를 따라가며 Socket 통신 전체 흐름을 이해하는 것이다.

## 1. 먼저 실행 주체와 관리 주체를 분리한다

겉으로는 `Client Application → Server Application`이 직접 통신하는 것처럼 보이지만 실제 Network I/O는 양쪽 OS의 Network Stack을 거친다.

```text
[Client PC]                                  [Server PC]

Client Application Thread                    Server Application Thread
        │                                             ↑
        │ Socket API 호출                             │ Socket API 호출
        ↓                                             │
Client OS Kernel                              Server OS Kernel
├─ Socket / Buffer                           ├─ TCP 연결 상태
├─ TCP/IP Stack                              ├─ Socket / Buffer
└─ 실제 Network I/O                          └─ TCP/IP Stack
        │                                             ↑
        └────────────── Network ──────────────────────┘
```

역할은 다음처럼 나눈다.

```text
Application Thread
= Application Code의 실행 주체
= socket / bind / listen / accept / read / write 등을 호출

OS Kernel
= 호출을 받아 실제 Network 자원을 관리하는 주체
├─ TCP 연결 상태
├─ Listening / Connected Socket
├─ 송·수신 Buffer
├─ Packet 송수신
└─ Blocking I/O를 호출한 Thread의 대기·깨움
```

> **Socket API의 호출 주체는 Application Thread이고, Socket·TCP·Buffer의 실제 관리 주체는 자기 PC의 OS Kernel이다.**

Socket과 Thread도 분리한다.

```text
Socket
= 통신 자원
= 어떤 Network endpoint / 연결을 다루는가

Thread
= 실행 자원
= 누가 Application Code를 실행하는가
```

따라서 `Socket 수 = Thread 수`가 아니다.

## 2. TCP Server의 전체 호출 순서를 먼저 본다

세부 의미보다 먼저 **어느 쪽의 Application Thread가 어느 시점에 자기 OS를 호출하는지** 본다.

```text
[Server Application Thread]              [Client Application Thread]

socket()
   ↓
bind(:8080)
   ↓
listen()
   ↓                                      socket()
   │                                         ↓
   │                                      connect()
   │                                         ↓
   │                              [양쪽 OS가 TCP 연결 수립]
   │                                         ↓
accept()
   ↓
Connected Socket 획득
   │
   │                                      send/write()
   │                                         ↓
   │                              [양쪽 OS가 실제 Network 전송]
   │                                         ↓
read()
   ↓
Application에서 요청 처리
   ↓
write/send()
   ↓
[Server OS가 Network 전송]
   │
   │                                      read()
   ↓                                         ↓
close()                                  close()
```

위 그림의 함수끼리 Network를 통해 직접 호출하는 것이 아니다.

```text
Application Thread
        ↓ Socket API
자기 PC의 OS Kernel
        ↕ Network
상대 PC의 OS Kernel
        ↑ Socket API
상대 Application Thread
```

즉 `Client connect() → Server accept()`는 **논리적으로 대응하는 사건**이지 Client의 `connect()` 함수가 Server의 `accept()` 함수를 직접 호출하는 관계가 아니다.

## 3. 각 호출을 같은 문법으로 읽는다

앞으로 Socket API는 항상 다음 순서로 본다.

```text
호출 주체
  ↓
호출 대상
  ↓
대상 자원 / 요청
  ↓
OS의 처리
  ↓
Application에 돌아오는 결과
  ↓
결과가 아직 없으면 어떻게 되는가?
```

### `socket()`

```text
호출 주체 : Application Thread
호출 대상 : 자기 OS Kernel
요청       : 통신에 사용할 Socket 생성
결과       : Application이 사용할 Socket Handle / File Descriptor
```

### `bind()`

```text
호출 주체 : Server Application Thread
호출 대상 : Server OS Kernel
대상 자원 : 생성한 Socket + Local IP / Port
요청       : "이 Socket을 이 Local Address에 연결해줘"
결과       : Socket이 Local Address와 연결됨
```

### `listen()`

```text
호출 주체 : Server Application Thread
호출 대상 : Server OS Kernel
대상 자원 : bind된 TCP Socket
요청       : "이 Socket을 새 연결을 받을 Listening Socket으로 만들어줘"
결과       : Listening 상태 설정 후 호출 반환
```

`listen()` 자체가 Client가 올 때까지 Application Thread를 붙잡고 기다리는 호출은 아니다.

### `connect()`

```text
호출 주체 : Client Application Thread
호출 대상 : Client OS Kernel
대상 자원 : Client Socket + Server IP / Port
요청       : "이 Server endpoint와 TCP 연결을 맺어줘"
OS 처리    : Client OS ↔ Network ↔ Server OS가 TCP 연결 수립
결과       : Client Socket이 연결된 상태가 됨
```

### `accept()`

```text
호출 주체 : Server Application Thread
호출 대상 : Server OS Kernel
대상 자원 : Listening Socket / 완료된 연결
요청       : "완료된 연결 하나를 Application에 줘"
결과       : 특정 Client와 통신할 Connected Socket
결과 없음  : Blocking이면 호출한 Application Thread가 대기
```

### `read()`

```text
호출 주체 : Application Thread
호출 대상 : 자기 OS Kernel
대상 자원 : Connected Socket의 수신 Buffer
요청       : "이 Socket에 받아둔 Byte를 줘"
결과       : 읽을 Byte
결과 없음  : Blocking이면 호출한 Application Thread가 대기
```

### `write()` / `send()`

```text
호출 주체 : Application Thread
호출 대상 : 자기 OS Kernel
대상 자원 : Connected Socket의 송신 Buffer / TCP 전송
요청       : "이 Socket으로 이 Byte를 보내줘"
OS 처리    : 송신 Buffer → TCP/IP Stack → Network
```

`send()`가 반환됐다는 사실만으로 상대 Application이 이미 `read()`했다는 뜻은 아니다.

## 4. Port와 Listening Socket은 왜 필요한가

Network를 통해 Server OS까지 Packet이 도착해도 OS는 **어느 통신 endpoint로 전달해야 하는지** 구분해야 한다.

```text
IP
= 어느 Host로 갈 것인가

Port
= 그 Host 안의 어느 통신 endpoint로 갈 것인가
```

예를 들어 한 Host에서 여러 Server가 동시에 동작할 수 있다.

```text
Server OS
├─ :22   → SSH Server의 Listening Socket
├─ :80   → Web Server의 Listening Socket
├─ :5432 → DB Server의 Listening Socket
└─ :8080 → Application의 Listening Socket
```

Port의 출발 목적은 Firewall이 아니라 **들어온 통신을 적절한 endpoint로 구분해 전달하는 것**이다. Firewall은 IP·Port·Protocol 등의 정보를 이용해 그 통신을 허용하거나 차단하는 별도 통제다.

```text
socket()
  ↓
bind(:8080)
  ↓
listen()
  ↓
Server OS에
"TCP :8080의 새 연결을 받을 Listening Socket"
이라는 입구가 준비됨
```

## 5. Listening Socket과 Connected Socket은 역할이 다르다

실제 TCP 연결 상태를 관리하고 연결 수립을 처리하는 주체는 양쪽 OS의 TCP Stack이다.

```text
Client Application Thread
        ↓ connect()
Client OS TCP Stack
        ↓
      Network
        ↓
Server OS TCP Stack
        ↓
TCP 연결 처리·상태 관리
        ↓
완료된 연결 준비
        ↑
Server Application Thread
        ↓ accept()
Connected Socket을 넘겨받음
```

Server에는 역할이 다른 두 Socket이 있다.

```text
Listening Socket
= 새 Client 연결을 받는 입구
= 계속 존재

        ↓ accept()

Connected Socket
= 특정 Client와 실제 데이터를 주고받는 통신 endpoint
= Client 연결마다 별도로 존재
```

```text
                Listening Socket :8080
                        │
             ┌──────────┼──────────┐
          accept()    accept()    accept()
             ↓           ↓           ↓
         Socket A     Socket B     Socket C
             ↕           ↕           ↕
         Client A     Client B     Client C
```

핵심은 `accept()`가 TCP 연결을 처음부터 직접 만드는 호출이 아니라 **OS가 처리해 준비한 완료된 연결을 Application이 Connected Socket으로 넘겨받는 호출**이라는 것이다.

## 6. 데이터도 OS가 먼저 받고 Application이 가져간다

Client가 보낸 데이터가 Server Application으로 바로 들어오는 것이 아니다.

```text
Client Application Thread
        ↓ send/write()
Client OS
        ↓
      Network
        ↓
Server OS
├─ TCP 처리
└─ Connected Socket의 수신 Buffer에 Byte 저장
        ↑
Server Application Thread
        ↓ read()
Byte를 Application으로 가져감
```

송신도 대칭적이다.

```text
Server Application Thread
        ↓ write/send()
Server OS
├─ Socket 송신 Buffer
├─ TCP 처리
└─ 실제 Network 전송
        ↓
      Network
        ↓
Client OS
        ↑
Client Application Thread
        ↓ read()
```

따라서 Application끼리 직접 Network 자원을 주고받는 것처럼 보여도 실제 구조는 다음과 같다.

```text
Application
    ↕ Socket API
OS Kernel
    ↕ Network
OS Kernel
    ↕ Socket API
Application
```

## 7. 결과가 아직 없으면 Blocking / Non-blocking으로 갈린다

이제 `accept()`와 `read()`를 같은 구조로 볼 수 있다.

```text
Application Thread
        ↓ Socket I/O 호출
OS Kernel
        ↓
지금 반환할 결과가 있는가?
├─ 있음 → 결과 반환
└─ 없음
    ├─ Blocking     → 호출이 반환되지 않고 Thread 대기
    └─ Non-blocking → "지금 없음"을 즉시 반환
```

기다리는 대상만 다르다.

```text
accept()
= 완료된 연결

read()
= Connected Socket 수신 Buffer의 Byte
```

### Blocking `accept()`

```text
Server Application Thread
        ↓ accept()
Server OS
        ↓
완료된 연결 없음
        ↓
호출한 Application Thread 대기
        ↓
Client 연결 완료
        ↓
OS가 Thread를 다시 실행 가능 상태로 만듦
        ↓
Connected Socket 반환
```

### Blocking `read()`

```text
Application Thread
        ↓ read()
OS
        ↓
수신 Buffer에 Byte 없음
        ↓
호출한 Application Thread 대기
        ↓
Network 데이터 도착
        ↓
OS가 수신 Buffer에 Byte 준비
        ↓
Thread를 다시 실행 가능 상태로 만듦
        ↓
read()가 Byte 반환
```

`OS가 Thread를 깨운다`는 것은 바로 CPU에서 실행한다는 뜻이 아니라 **실행 가능한 상태로 만들고 Scheduler의 실행 대상이 되게 한다**는 의미다.

```text
Blocking
= 결과가 준비될 때까지 호출이 반환되지 않음

Busy Waiting / Busy Polling
= Application Thread가 CPU를 사용해 준비 여부를 반복 확인
```

Blocking 자체가 Busy Waiting을 의미하지 않는다.

## 8. Socket이 많아지면 Thread를 어떻게 둘 것인가가 문제가 된다

가장 직관적인 구조 중 하나는 연결마다 Application Thread가 Blocking `read()`를 수행하는 것이다.

```text
Connected Socket A → Thread A → Blocking read()
Connected Socket B → Thread B → Blocking read()
Connected Socket C → Thread C → Blocking read()
Connected Socket D → Thread D → Blocking read()
```

이 Thread 수는 OS가 Socket 수에 맞춰 자동으로 정하는 것이 아니다. **Application / Runtime의 Server 구조와 Thread Pool 정책이 결정한다.**

```text
Application / Runtime
├─ Thread를 몇 개 둘지
├─ Thread Pool을 어떻게 운영할지
└─ 어떤 Thread가 어떤 Socket 작업을 처리할지 결정

OS
├─ 만들어진 Thread의 실행·대기 상태 관리
└─ CPU Scheduling
```

따라서:

```text
Socket 수
= OS가 유지하는 통신 연결의 규모

Thread 수
= Application이 작업 처리를 위해 사용하는 실행 자원의 규모
```

둘은 1:1일 필요가 없다.

```text
Connected Socket = 10,000개
        ↓
반드시 Thread도 10,000개여야 하나?
        ↓
아니다
```

여기서 다음 질문이 나온다.

> **적은 수의 Application Thread로 많은 Socket을 어떻게 관리할까?**

## 9. Non-blocking만으로는 충분하지 않다

Non-blocking I/O는 결과가 준비되지 않았으면 즉시 반환한다.

```text
Application Thread
        ↓ read() / accept()
OS Kernel
        ↓
결과 없음
        ↓
즉시 반환
        ↓
Application Thread는 다른 작업 수행 가능
```

하지만 Application이 직접 모든 Socket을 반복 확인하면:

```text
Socket A 확인 → 없음
Socket B 확인 → 없음
Socket C 확인 → 없음
Socket D 확인 → 없음
다시 Socket A 확인 → ...
```

Busy Polling이 될 수 있다.

그래서 질문이 바뀐다.

> **Application이 모든 Socket을 계속 확인하지 말고, 준비된 Socket만 OS가 알려줄 수는 없을까?**

## 10. I/O Multiplexing: 여러 Socket 중 준비된 것을 찾는다

OS는 이미 각 Socket의 연결 상태와 수신 Buffer를 관리한다.

```text
Socket A ─┐
Socket B ─┤
Socket C ─┼─→ Application Thread가 OS에 함께 등록·대기
Socket D ─┘
              ↓
         OS가 준비 상태 관리
              ↓
        "B, D가 I/O 가능"
              ↓
        Application이 B, D 처리
```

```text
I/O Multiplexing
= 여러 I/O 대상 중 어떤 것이 준비됐는지 함께 기다리고 확인하는 방식
```

대표적인 API 계열은:

```text
select
poll
epoll   ← Linux 대표 방식
```

핵심 변화는 다음과 같다.

```text
[연결당 Blocking Thread]
많은 Socket
   ↓
각 Socket을 기다리는 많은 Thread

            ↕

[I/O Multiplexing]
많은 Socket
   ↓
OS가 준비 상태 관리
   ↓
준비된 Socket만 Application에 알려줌
   ↓
적은 Thread로 처리 가능
```

Thread가 없어지는 것이 아니라 **Socket을 기다리기 위해 Socket마다 Thread를 붙여둘 필요가 줄어드는 것**이 핵심이다.

## 11. Event Loop는 준비된 Event를 반복 처리한다

I/O Multiplexing으로 준비된 Socket을 알 수 있다면 Application은 그 결과를 반복해서 처리할 수 있다.

```text
Application Thread
        ↓
여러 I/O Event 대기
        ↓
OS가 준비된 Socket 반환
        ↓
해당 Event 처리
        ↓
다시 I/O Event 대기
        ↑
        └──────── 반복
```

```text
epoll
= Linux에서 여러 File Descriptor의 I/O 준비 상태를 기다리는 Mechanism/API

Event Loop
= Event를 기다리고 준비된 작업을 반복 처리하는 Application 실행 구조
```

따라서 `epoll = Event Loop`가 아니다. Event Loop가 OS의 I/O Multiplexing Mechanism을 이용할 수 있는 관계다.

## 12. TCP와 UDP는 Socket을 사용하지만 통신 흐름이 다르다

지금까지의 `listen / accept / Connected Socket` 흐름은 TCP Server 중심이다.

```text
Socket
├─ TCP
│   ├─ 연결을 먼저 맺음
│   ├─ 연결된 상대와 Byte Stream 송