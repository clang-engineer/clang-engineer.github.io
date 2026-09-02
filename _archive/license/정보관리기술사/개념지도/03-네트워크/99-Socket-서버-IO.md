# Socket과 서버 I/O 개념지도

이 문서는 네트워크의 `Port / TCP / UDP`와 운영체제의 I/O 처리 사이를 연결하는 **횡단·보강 개념지도**다.

목표는 API를 하나씩 암기하는 것이 아니라 **Application이 Socket을 통해 상대와 통신하는 전체 흐름과, Server가 많은 연결을 기다리고 처리하기 위해 I/O 방식이 어떻게 연결되는지** 이해하는 것이다.

## 1. 가장 먼저 잡을 큰 그림

겉으로는 `Client Application → Server Application`이 직접 통신하는 것처럼 보이지만, 실제 Network I/O는 양쪽 OS의 Network Stack을 거친다.

```text
[Client PC]                              [Server PC]

Client Application                      Server Application
       │                                       ↑
       │ send/write                            │ accept/read
       ↓                                       │
Client OS                               Server OS
├─ Socket / Buffer                      ├─ TCP 연결 관리
├─ TCP/IP Stack                         ├─ Socket / Buffer
└─ 실제 Network I/O                     └─ TCP/IP Stack
       │                                       ↑
       └──────────── Network ──────────────────┘
```

따라서 Application은 Network Hardware나 TCP 연결 상태를 직접 관리하지 않는다.

```text
Application
    ↓ Socket API
OS Kernel
├─ TCP 연결 상태 관리
├─ Listening / Connected Socket 관리
├─ 송·수신 Buffer 관리
├─ Packet 송수신
└─ I/O를 기다리는 Thread의 대기·깨움
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
= OS가 관리하는 통신 endpoint를 Application에서 다루기 위한 추상화
```

핵심은 **Application끼리 직접 Network 자원을 주고받는 것이 아니라, 각 Application이 자기 OS에 Socket API로 요청하고 실제 연결·송수신은 OS가 관리한다**는 것이다.

## 2. Socket과 Thread를 먼저 분리한다

Socket과 Thread가 함께 등장하면서 역할을 섞기 쉽다.

```text
Socket
= 통신 자원
= 어떤 Network 연결·endpoint를 다루는가

Thread
= 실행 자원
= 어떤 실행 흐름이 Application Code를 수행하는가
```

둘은 같은 개념도 아니고 개수가 같아야 하는 것도 아니다.

```text
                 [Server Application]

                    Thread Pool
                 ┌─────┼─────┐
              Thread Thread Thread
                 │     │     │
                 │ accept / read / write
                 ↓     ↓     ↓

──────────── Application / OS 경계 ────────────

                     [Server OS]

             Listening Socket :8080
                     │
             Connected Sockets
             ├─ Socket A
             ├─ Socket B
             ├─ Socket C
             └─ ...
                     ↓
                 TCP/IP Stack
                     ↓
                    NIC
```

역할을 나누면 다음과 같다.

```text
Application / Runtime
├─ Thread를 몇 개 둘지 결정
├─ Thread Pool을 어떻게 운영할지 결정
└─ 어떤 Thread가 어떤 I/O를 요청할지 결정

OS
├─ TCP 연결과 Socket Buffer 관리
├─ 실제 Network 송수신
├─ Thread 실행·대기 상태 관리
└─ CPU Scheduling
```

Application이 `maxThreads` 같은 정책으로 Thread 수를 정할 수 있지만, 실제 Thread의 실행·대기·깨움과 CPU Scheduling은 OS가 담당한다.

> **Socket 수 = 통신 연결의 규모, Thread 수 = Application의 실행 자원 규모다. 둘은 1:1일 필요가 없다.**

## 3. Socket I/O는 누가 호출하고 누가 처리하는가

`accept()`, `read()`, `write()/send()`가 Network 반대편의 Application을 직접 호출하는 것이 아니다. **호출 주체는 현재 PC에서 실행 중인 Application Thread이고, 요청을 받아 Socket·TCP 상태를 처리하는 주체는 자기 PC의 OS Kernel이다.**

```text
[Application]
Application Thread
      │
      │ Socket API / System Call 호출
      ↓
──────── Application / OS 경계 ────────
      ↓
[OS Kernel]
Socket · TCP 상태 · Buffer 처리
      ↓
결과를 호출한 Application Thread에 반환
```

대표 호출을 같은 형식으로 보면 다음과 같다.

| 호출 | 호출 주체 | OS에서 확인·처리하는 대상 | Application이 받는 결과 |
|---|---|---|---|
| `accept(Listening Socket)` | Server Application Thread | 완료된 TCP 연결 | Connected Socket |
| `read(Connected Socket)` | Application Thread | 해당 Socket의 수신 Buffer | 읽을 Byte |
| `write/send(Connected Socket)` | Application Thread | 해당 Socket의 송신 Buffer·TCP 전송 처리 | 전송을 위해 받아들인 결과 |

특히 Server에서 헷갈리기 쉬운 두 호출은 다음처럼 읽는다.

```text
Server Application Thread
        ↓
accept(Listening Socket)
        ↓
Server OS Kernel
"완료된 연결 하나 있나?"
        ↓
있으면 Connected Socket 반환

Server Application Thread
        ↓
read(Connected Socket)
        ↓
Server OS Kernel
"이 Socket의 수신 Buffer에 Byte가 있나?"
        ↓
있으면 Byte 반환
```

따라서 이후 Blocking을 볼 때도 **Socket이 스스로 기다리는 것이 아니라, Application Thread가 Socket I/O를 호출했고 OS가 당장 반환할 결과가 없을 때 그 호출과 Thread가 기다리게 된다**고 이해한다.

## 4. TCP와 UDP는 통신 방식이 다르다

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

## 5. Port와 Listening Socket은 왜 필요한가

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

Port의 출발 목적은 방화벽이 아니라 **들어온 통신을 적절한 endpoint로 구분해 전달하는 것**이다. Firewall은 IP·Port·Protocol 등의 정보를 이용해 그 통신을 허용하거나 차단하는 별도 통제다.

Server Application Thread가 다음 Socket API를 호출한다.

```text
socket()
  ↓
bind(:8080)
  ↓
listen()
```

의미는 다음과 같다.

```text
bind(:8080)
= Application Thread가 OS에
  "이 Socket을 Local Port 8080에 연결해줘" 요청

listen()
= Application Thread가 OS에
  "이 Socket을 새 TCP 연결을 받을 Listening Socket으로 전환해줘" 요청
```

`listen()`은 Application Thread가 Client가 올 때까지 그 함수 안에서 기다린다는 뜻이 아니다. **OS에 새 연결을 받을 입구를 설정하고 반환한다.**

## 6. Client와 Server는 어떻게 연결되는가

TCP 통신을 Client와 Server 양쪽에서 함께 보면 `accept()`가 왜 필요한지 위치가 보인다.

```text
[Client Application Thread]              [Server Application Thread]

                                               socket()
                                                  ↓
                                                bind()
                                                  ↓
                                               listen()
                                                  ↓
        socket()                              accept()
           ↓                                     │
        connect() ─── TCP 연결 수립 요청 ───────→│
           │                                     ↓
           │                             Connected Socket
           │                                     │
      send/write ─────────────────────────→ recv/read
           │                                     │
      recv/read  ←───────────────────────── send/write
           │                                     │
         close() ───── 연결 종료 ───────────── close()
```

위 그림의 `connect / accept / read / write`는 각 Application Thread가 **자기 PC의 OS에 호출하는 API**다. 화살표는 Client와 Server 사이의 논리적 대응 관계를 보여줄 뿐, 함수가 Network 반대편 함수를 직접 호출한다는 뜻은 아니다.

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
완료된 연결이 준비됨
        ↑
Server Application Thread
        ↓ accept()
Connected Socket을 넘겨받음
```

Server에는 역할이 다른 Socket이 존재한다.

```text
Listening Socket
= 새 Client 연결을 받는 입구
= 계속 존재

        ↓ Server Application Thread가 accept() 호출

Connected Socket
= 특정 Client와 실제 데이터를 주고받는 통신 endpoint
= Client 연결마다 별도로 존재
```

따라서:

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

`accept()`는 Client에게 직접 Network 요청을 보내는 함수가 아니다.

```text
호출 주체 : Server Application Thread
처리 주체 : Server OS Kernel
대상 자원 : Listening Socket / 완료된 연결
결과      : Connected Socket
```

## 7. 데이터 송수신도 Application과 자기 OS 사이에서 시작한다

연결 후 Client가 보낸 데이터도 Server Application으로 바로 들어오는 것이 아니다.

```text
Client Application Thread
      ↓ send/write
Client OS
      ↓
Network
      ↓
Server OS
├─ TCP 처리
└─ 해당 Connected Socket의 수신 Buffer에 Byte 저장
      ↑
Server Application Thread
      ↓ read
Byte를 가져감
```

`read()`는 다음처럼 이해한다.

```text
호출 주체 : Server Application Thread
처리 주체 : Server OS Kernel
대상 자원 : Connected Socket의 수신 Buffer
결과      : 읽을 Byte
```

송신도 대칭적이다.

```text
Server Application Thread
      ↓ send/write
Server OS
├─ Socket 송신 Buffer
├─ TCP 처리
└─ 실제 Network 전송
      ↓
Network
      ↓
Client OS
      ↑
Client Application Thread가 read()
```

`write/send()`는 다음처럼 이해한다.

```text
호출 주체 : Application Thread
처리 주체 : 자기 PC의 OS Kernel
대상 자원 : Connected Socket의 송신 Buffer / TCP 전송
```

`send()`가 반환됐다는 사실만으로 상대 Application이 이미 `read()`했다는 뜻은 아니다. Application은 자기 OS에 Byte를 넘기고, 이후 실제 전송과 상대 OS의 수신 처리는 Network Stack이 담당한다.

## 8. 아직 연결이나 데이터가 준비되지 않았다면?

`accept()`와 `read()`는 모두 **Application Thread가 자기 OS에 결과를 요청하는 호출**이다.

```text
[accept]
호출: Server Application Thread
        ↓
accept(Listening Socket)
        ↓
처리: Server OS Kernel
        ↓
완료된 연결 있음?
├─ 있음 → Connected Socket 반환
└─ 없음 → I/O 방식에 따라 기다리거나 즉시 반환

[read]
호출: Application Thread
        ↓
read(Connected Socket)
        ↓
처리: 자기 OS Kernel
        ↓
수신 Buffer에 데이터 있음?
├─ 있음 → Byte 반환
└─ 없음 → I/O 방식에 따라 기다리거나 즉시 반환
```

둘의 구조는 같고 **기다리는 대상만 다르다.**

```text
accept()
= 완료된 연결을 기다릴 수 있음

read()
= 수신 데이터를 기다릴 수 있음
```

## 9. Blocking: OS가 결과를 준비할 때까지 호출이 반환되지 않는다

Blocking 방식에서 결과가 아직 없으면 Application Thread는 다음 Code로 진행하지 못한다.

```text
Application Thread
        ↓ accept() / read() 호출
OS Kernel
        ↓
반환할 결과 없음
        ↓
OS가 호출한 Application Thread를 대기 상태로 둘 수 있음
        ↓
CPU는 다른 실행 가능한 Thread 수행
        ↓
연결 / 데이터 준비
        ↓
OS가 기다리던 Application Thread를 다시 실행 가능 상태로 만듦
        ↓
System Call 반환
        ↓
Application Thread가 다음 Code 실행
```

즉:

```text
Blocking accept()
= Server Application Thread가 accept() 호출
  → OS에 완료된 연결이 없으면
  → 연결이 준비될 때까지 accept()가 반환되지 않음

Blocking read()
= Application Thread가 read() 호출
  → OS 수신 Buffer에 데이터가 없으면
  → 데이터가 준비될 때까지 read()가 반환되지 않음
```

여기서 `OS가 Thread를 깨운다`는 것은 바로 CPU에서 실행된다는 뜻이라기보다 **다시 실행 가능한 상태로 만들고 Scheduler의 실행 대상이 되게 한다**는 의미다.

Blocking 자체가 Busy Waiting을 의미하지 않는다.

```text
Blocking
= 결과가 준비될 때까지 호출이 반환되지 않음

Busy Waiting / Busy Polling
= Application Thread가 CPU를 사용해 준비 여부를 계속 반복 확인
```

## 10. Client가 많아지면 Socket과 Thread의 관계가 문제가 된다

가장 직관적인 구조 중 하나는 연결마다 Application Thread가 Blocking `read()`를 수행하는 것이다.

```text
Connected Socket A → Application Thread A → Blocking read()
Connected Socket B → Application Thread B → Blocking read()
Connected Socket C → Application Thread C → Blocking read()
Connected Socket D → Application Thread D → Blocking read()
```

이것은 **Application이 선택한 Server 구조**이지 OS가 Socket마다 자동으로 Thread를 만드는 것이 아니다.

연결 수가 매우 많아지면 질문이 생긴다.

```text
Connected Socket = 10,000개
        ↓
반드시 Application Thread도 10,000개여야 하나?
```

아니다. Socket 수와 Thread 수는 별개의 자원이다.

> **적은 수의 Application Thread로 많은 Socket을 관리할 수는 없을까?**

## 11. Non-blocking: 준비되지 않았으면 바로 돌아온다

```text
Application Thread
        ↓ read() / accept() 호출
OS Kernel
        ↓
지금 결과 없음
        ↓
기다리지 않고 즉시 반환
        ↓
Application Thread는 다른 작업 수행 가능
```

하지만 Non-blocking으로 바꾸는 것만으로 많은 Socket 문제가 해결되는 것은 아니다.

```text
Application Thread가
Socket A 확인 → 없음
Socket B 확인 → 없음
Socket C 확인 → 없음
Socket D 확인 → 없음
다시 Socket A 확인 → ...
```

계속 직접 확인하면 Busy Polling이 될 수 있다.

그래서 질문이 다시 바뀐다.

> **Application Thread가 모든 Socket을 계속 확인하지 말고, 준비된 Socket이 무엇인지 OS가 알려줄 수는 없을까?**

## 12. 여러 Socket을 함께 기다린다: I/O Multiplexing

OS는 이미 각 Socket의 연결 상태와 수신 Buffer를 관리한다. Application은 이 정보를 이용해 **여러 Socket 중 지금 I/O 가능한 Socket을 함께 기다릴 수 있다.**

```text
Socket A ─┐
Socket B ─┤
Socket C ─┼─→ Application Thread가 OS에 준비 상태를