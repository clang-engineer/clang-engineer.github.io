# Socket과 서버 I/O

> 이 문서는 정보관리기술사 직접 출제 Topic 자체를 정리한 문서라기보다, 네트워크 개념지도를 이해하는 과정에서 생긴 **Socket · Thread · OS · Blocking · I/O Multiplexing의 이해 빈틈을 메우기 위한 `99-` 보충학습 문서**다.
>
> 핵심은 **Application이 Network 자원을 직접 관리하지 않는다는 것**이다. OS가 TCP 연결·Socket·Buffer·실제 송수신을 관리하고, Application Thread는 Socket API로 자기 OS에 필요한 작업을 요청한다.

## 1. 먼저 주체를 분리한다

```text
Application / Runtime
= 구조와 정책 결정
= Thread 수 · Thread Pool · I/O 처리 구조 등을 결정

Application Thread
= Application Code의 실행 주체
= Socket API를 실제 호출

OS Kernel
= 실제 자원 관리
= Thread 실행·대기·Scheduling
= TCP 연결 · Socket · Buffer · Network I/O 관리
```

> **정책은 Application / Runtime, 호출은 Application Thread, 실제 자원 관리는 OS가 담당한다.**

## 2. Socket API · Socket · Thread는 서로 다르다

```text
Socket API
= Application이 OS의 Socket 자원을 다루기 위한 호출 집합
= socket / bind / listen / connect / accept / read / write / send / recv 등

Socket
= 통신 자원
= Network endpoint / 연결

Thread
= 실행 자원
= Application Code와 Socket API를 실행하는 주체
```

```text
Application Thread ── accept(Listening Socket) ──→ OS Kernel
Application Thread ── read(Connected Socket) ────→ OS Kernel
Application Thread ── send(Connected Socket) ────→ OS Kernel
```

즉 **Socket이 `accept()`나 `read()`를 호출하는 것이 아니다. Application Thread가 Socket API를 호출하고 Socket은 그 호출의 대상 자원이다.**

## 3. TCP Client / Server 전체 흐름

```text
[Server Application Thread]              [Client Application Thread]

socket()
   ↓
bind(:8080)
   ↓
listen()
   ↓
accept(Listening Socket)                    socket()
   │                                           ↓
   │                                        connect()
   │                                           ↓
   │              Client OS ↔ Network ↔ Server OS
   │                     TCP 연결 수립
   │
   └──────── Connected Socket 반환
                  ↓
           최초 read(Connected Socket)
                  │
                  │                       send()
                  │                          ↓
                  └──── 데이터 수신 / 처리
                  ↓
           send(Connected Socket) ───────→ read()
                  ↓
           통신 종료 시 close
```

위 함수들이 Network 반대편 함수를 직접 호출하는 것이 아니다. **각 Application Thread가 자기 OS에 Socket API를 호출하고, 실제 Network 통신은 양쪽 OS가 처리한다.**

## 4. `listen()`은 입구를 만들고 `accept()`는 연결을 가져온다

```text
bind(:8080)
= "이 Socket을 Local Port 8080에 연결해줘"

listen()
= "이 Socket을 새 TCP 연결을 받을 입구로 만들어줘"
```

`listen()`은 Client가 올 때까지 기다리는 호출이 아니다. **Listening 상태를 설정하고 반환한다.**

```text
Listening Socket
= 새 연결을 받는 입구
= Server 운영 동안 유지

Connected Socket
= 특정 Client와 실제 통신
= 연결마다 생기고 통신 종료 후 close
```

## 5. `accept()`에서 실제로 무슨 일이 일어나는가

`accept()`가 TCP 연결을 처음부터 만드는 것이 아니다. Client의 `connect()` 요청에 따라 양쪽 OS가 TCP 연결을 처리하고, Server Application Thread는 `accept()`로 완료된 연결을 가져온다.

```text
Server Application Thread
        ↓ accept(Listening Socket)
Server OS
        ↓
완료된 연결 있음?
├─ 있음 → Connected Socket 즉시 반환
└─ 없음 → Blocking이면 호출한 Thread 대기
```

`accept()`는 Listening Socket을 Connected Socket으로 바꾸는 것이 아니다. Listening Socket은 그대로 유지되고 `accept()`가 특정 Client용 Connected Socket을 반환한다.

## 6. accept 대기 Thread 수와 연결 대기열은 다른 문제다

```text
Application / Runtime
= accept 담당 Thread 수 결정
= Worker Thread / Thread Pool 구조 결정

Application Thread
= 실제 accept() 호출

OS
= Thread의 실행 · 대기 · 깨움 · Scheduling
= Listening Socket · 연결 대기 상태 · Connected Socket 관리
```

즉 **accept에서 몇 개 Thread를 기다리게 할지는 Application / Runtime의 정책**이다. 반면 Application이 아직 `accept()`하지 못한 연결은 OS가 관리하며 이 대기 규모에는 `listen()`의 **backlog**와 OS의 구현·한도가 관계된다.

## 7. Connected Socket을 얻으면 Application이 `read()`한다

Client가 보낸 데이터는 Application으로 바로 들어오는 것이 아니라 먼저 OS가 받는다.

```text
Client Application Thread
        ↓ send()
Client OS
        ↕ Network
Server OS
        ↓
Connected Socket 수신 Buffer에 Byte 저장
```

실제 Byte를 Application으로 가져오는 `read()`의 호출 주체는 항상 Application Thread다.

```text
Server Application Thread ── read(Connected Socket) ──→ Server OS
Server OS ── Byte 반환 ──→ Server Application Thread
```

```text
accept = 완료된 연결을 OS에서 가져옴
read   = 수신 데이터를 OS에서 가져옴
send   = 보낼 데이터를 자기 OS에 넘김
```

## 8. `accept()`와 `read()`에는 같은 I/O 원칙이 적용된다

`accept()`와 `read()`는 대상과 반환 결과가 다르지만 기본 구조는 같다.

```text
accept()

Application Thread
    ↓ accept(Listening Socket)
OS
    ↓
완료된 연결 있음?
├─ 있음 → Connected Socket 반환
└─ 없음
   ├─ Blocking     → 호출한 Thread 대기
   └─ Non-blocking → 즉시 "지금 없음" 반환
```

```text
read()

Application Thread
    ↓ read(Connected Socket)
OS
    ↓
수신 데이터 있음?
├─ 있음 → Byte 반환
└─ 없음
   ├─ Blocking     → 호출한 Thread 대기
   └─ Non-blocking → 즉시 "지금 없음" 반환
```

| 구분 | `accept()` | `read()` |
|---|---|---|
| 호출 주체 | Application Thread | Application Thread |
| 대상 자원 | Listening Socket | Connected Socket |
| 기다리는 것 | 완료된 연결 | 수신 데이터 |
| 준비 시 결과 | Connected Socket | Byte/Data |
| Blocking | 준비될 때까지 Thread 대기 | 데이터가 올 때까지 Thread 대기 |
| Non-blocking | 준비된 연결이 없으면 즉시 반환 | 데이터가 없으면 즉시 반환 |

> **둘 다 Application Thread가 Socket API를 호출하고 OS가 자원의 준비 상태를 확인한다. 차이는 `accept()`는 연결을, `read()`는 데이터를 기다린다는 것이다.**

이 원칙은 I/O Multiplexing에도 이어진다. Listening Socket 역시 감시 대상이 될 수 있다.

```text
Listening Socket ─┐
Connected A ──────┼→ select / poll / epoll
Connected B ──────┘
                        ↓
               Listening Socket Ready
                        ↓
                     accept()
```

즉 Multiplexing은 Connected Socket의 `read-ready`뿐 아니라 **Listening Socket에서 `accept()`할 연결이 준비된 상태**도 함께 다룰 수 있다.

## 9. Blocking / Non-blocking은 호출 후의 행동 차이다

Blocking과 Non-blocking은 Network 데이터나 연결이 언제 도착하느냐의 차이가 아니다. Application Thread가 I/O API를 호출했을 때 필요한 대상이 준비되지 않았다면 어떻게 할지를 정한다.

```text
I/O API 호출
    ↓
필요한 대상 Ready?
├─ Ready     → 즉시 결과 반환
└─ Not Ready
    ├─ Blocking     → 호출한 Thread 대기
    └─ Non-blocking → 즉시 반환
```

> **Blocking / Non-blocking의 핵심은 호출 시점에 필요한 결과가 없을 때 기다리느냐 즉시 돌아오느냐다.**

## 10. Socket이 많아지면 개별 I/O에서 기다리는 Thread가 문제가 된다

가장 단순한 Blocking 구조에서는 Connected Socket마다 Thread가 `read()`를 호출한 채 기다릴 수 있다.

```text
Thread A → read(Socket A) → A의 데이터 대기
Thread B → read(Socket B) → B의 데이터 대기
Thread C → read(Socket C) → C의 데이터 대기
```

하지만 Socket 수와 Thread 수는 1:1일 필요가 없다.

## 11. I/O Multiplexing은 여러 Socket의 대기를 하나로 모은다

### 11.1 왜 필요한가

Non-blocking I/O를 쉬지 않고 반복하면 Busy Polling이 될 수 있다. 어느 Socket이 준비됐는지는 OS가 알고 있으므로, Application이 Socket마다 호출해서 확인하지 말고 OS에게 준비된 Socket만 물어볼 수 있다.

```text
Socket A ─┐
Socket B ─┼→ 하나의 I/O 대기 지점 ← Application Thread
Socket C ─┘
```

즉 `Multiplexing`의 핵심은 **여러 Socket의 준비 상태를 하나의 대기 지점에서 함께 기다리는 것**이다.

### 11.2 OS가 대신 `read()`나 `accept()`하는 것은 아니다

```text
OS
= "이 Socket에서 지금 I/O가 가능하다"라고 알려줌

Application Thread
= Ready 종류에 맞게 실제 accept() / read() 등을 호출
```

OS가 Multiplexing 호출을 통해 알려주는 핵심은 데이터 자체가 아니라 **readiness**다.

### 11.3 Multiplexing도 Blocking될 수 있다

```text
Blocking read
= Thread 하나가 Socket A 하나의 데이터를 기다림

I/O Multiplexing
= Thread 하나가 A / B / C 중 하나라도 준비되기를 기다림
```

> **N개의 Socket마다 따로 기다리는 구조를, 하나의 I/O 대기 지점에서 N개의 Socket을 함께 기다리는 구조로 바꾸는 것**이다.

### 11.4 Non-blocking과 Busy Polling은 같은 말이 아니다

```text
Non-blocking
= 필요한 결과가 없으면 I/O 호출이 즉시 반환

Busy Polling
= 준비되지 않은 상태에서도 Application Thread가
  non-blocking I/O를 쉬지 않고 반복 호출하여
  CPU를 사용하며 준비 여부를 계속 확인
```

따라서 **`Non-blocking ≠ Busy Polling`**이다.

## 12. `select` / `poll` / `epoll`

셋 모두 **"여러 Socket 중 준비된 Socket을 알려줘"**를 구현하는 대표적인 I/O Multiplexing 방식/API 계열이다.

Application Thread가 각각의 System Call/API를 호출하고, 실제 FD의 상태 검사·등록·이벤트 관리는 Kernel이 수행한다.

```text
Application                         OS Kernel
    │                                  │
    │ select() / poll()                │
    ├─────────────────────────────────→│ 여러 FD 상태 확인
    │←─────────────────────────────────┤ Ready 결과 반환
    │                                  │
    │ epoll_create / epoll_ctl         │
    ├─────────────────────────────────→│ 관심 FD 등록·관리
    │ epoll_wait()                     │
    ├─────────────────────────────────→│ Ready Event 대기
    │←─────────────────────────────────┤ Ready Event 반환
```

```text
select
= fd_set 기반
= 전통적으로 FD_SETSIZE 제약과 연관

poll
= pollfd 목록/배열 기반
= select의 고정 비트셋 방식 제약을 피함

epoll
= 관심 Socket 목록을 Kernel에 등록·유지
= epoll_wait()를 반복하여 준비된 Event를 받음
```

## 13. Event Loop는 이 과정을 반복하는 Application 구조다

```text
준비된 I/O Event 기다림
        ↓
OS가 준비된 Socket / Event 반환
        ↓
Application이 해당 I/O 처리
        ↓
다시 I/O Event 기다림
        ↺
```

```text
I/O Multiplexing
= 여러 I/O의 readiness를 함께 기다리고 통지받는 Mechanism/API

Event Loop
= 준비 대기 → 처리 → 다시 대기를 반복하는 Application 실행 구조
```

따라서 `epoll = Event Loop`는 아니다. **I/O Multiplexing은 메커니즘이고, Event Loop는 그 결과를 반복해서 소비하는 Application 구조다.**

### 13.1 Ready 감지와 실제 처리는 별개다

Application Thread가 Ready Socket의 작업을 직접 처리하는 동안에도 Kernel은 다른 Socket의 Ready 상태를 감지·관리할 수 있다.

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

### 13.2 직접 처리와 Worker 위임

Ready Event를 받은 Thread가 직접 처리할 수도 있다.

```text
Event Loop Thread
       ↓
Ready Event
       ↓
Handler / I/O 처리
       ↓
다시 Event 대기
```

또는 오래 걸리는 작업을 Worker Thread에 위임하도록 구성할 수도 있다.

```text
Event Loop Thread
       ↓
Ready Event
       ↓
작업 Dispatch
       ↓
Worker Thread
```

> **Worker Thread는 I/O Multiplexing의 필수 구성요소가 아니다.**

## 14. Socket 위에는 Application Protocol이 올라간다

Socket은 Byte를 전달할 뿐 그 의미까지 해석하지 않는다.

```text
HTTP/1.1 · HTTP/2
WebSocket
RPC용 Protocol
직접 만든 Protocol
        ↓
       TCP
        ↓
    Socket API
        ↓
     OS Kernel
```

```text
Socket이 HTTP를 사용한다           