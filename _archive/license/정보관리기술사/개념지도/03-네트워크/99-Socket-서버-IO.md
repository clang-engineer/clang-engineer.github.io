# Socket과 서버 I/O 개념지도

> 핵심은 **Application이 Network 자원을 직접 관리하지 않는다는 것**이다. OS가 TCP 연결·Socket·Buffer·실제 송수신을 관리하고, Application Thread는 Socket API로 자기 OS에 필요한 작업을 요청한다.

## 1. 먼저 주체를 분리한다

겉으로는 `Client → Server Application`이 직접 통신하는 것처럼 보이지만 실제 흐름은 다음과 같다.

```text
Client Application Thread
        ↓ Socket API 호출
Client OS
        ↕ Network
Server OS
        ↑ Socket API 호출
Server Application Thread
```

역할은 세 층으로 나눈다.

```text
Application / Runtime
= 구조와 정책 결정
= Thread 수 · Thread Pool · accept 처리 구조 등을 결정

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

호출 관계는 이렇게 읽는다.

```text
Application Thread ── accept(Listening Socket) ──→ OS Kernel
Application Thread ── read(Connected Socket) ────→ OS Kernel
Application Thread ── send(Connected Socket) ────→ OS Kernel
```

즉 **Socket이 `accept()`나 `read()`를 호출하는 것이 아니다. Application Thread가 Socket API를 호출하고 Socket은 그 호출의 대상 자원이다.**

## 3. TCP Client / Server 전체 흐름

Server는 보통 `listen()`으로 준비를 끝낸 뒤 **바로 `accept()`를 호출**해 실제 Client 연결을 기다린다.

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
   │                                           ↓
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
IP   = 어느 Host?
Port = 그 Host 안의 어느 통신 endpoint?
```

Server 준비 과정은 다음과 같다.

```text
Server Application Thread
  socket()
    ↓
  bind(:8080)
    ↓
  listen()
    ↓
Server OS에 Listening Socket :8080 준비
```

```text
bind(:8080)
= "이 Socket을 Local Port 8080에 연결해줘"

listen()
= "이 Socket을 새 TCP 연결을 받을 입구로 만들어줘"
```

`listen()`은 Client가 올 때까지 기다리는 호출이 아니다. **Listening 상태를 설정하고 반환한다.**

그리고 일반적인 Blocking Server는 이어서 바로:

```text
Server Application Thread
        ↓ accept(Listening Socket)
Server OS
```

를 호출한다. Listening Socket은 **입구**일 뿐이고, 실제 Client와 `read/write`하려면 **Connected Socket**이 필요하기 때문이다.

```text
Listening Socket
= 새 연결을 받는 입구
= Server 운영 동안 유지

Connected Socket
= 특정 Client와 실제 통신
= 연결마다 생기고 통신 종료 후 close
```

## 5. `accept()`에서 실제로 무슨 일이 일어나는가

`accept()`가 TCP 연결을 처음부터 만드는 것이 아니다.

```text
Client Application Thread
        ↓ connect()
Client OS
        ↕ Network
Server OS
        ↓
TCP 연결 처리
        ↓
완료된 연결 준비
```

Server Application Thread는 그 결과를 가져온다.

```text
Server Application Thread
        ↓ accept(Listening Socket)
Server OS
        ↓
완료된 연결 있음?
├─ 있음 → Connected Socket 즉시 반환
└─ 없음 → Blocking이면 호출한 Thread 대기
```

따라서:

```text
accept(Listening Socket)
호출 주체 : Server Application Thread
호출 대상 : Server OS
의미       : "완료된 연결 하나 줘"
결과       : Connected Socket
```

`accept()`는 Listening Socket을 Connected Socket으로 바꾸는 것이 아니다.

```text
Listening Socket
= 그대로 유지 → 다음 연결을 계속 받음

accept() 반환
        ↓
Connected Socket
= 특정 Client와 read / send
        ↓
통신 종료
        ↓
close
```

Blocking `accept()`가 기다린다고 Connected Socket이 계속 생기는 것도 아니다.

```text
Client 없음 + Blocking accept()

Listening Socket   : 존재
Connected Socket   : 0개
accept 대기 Thread : 대기 중
```

Client가 오면 OS가 TCP 연결을 처리하고, 기다리던 Thread를 다시 실행 가능하게 만든 뒤 `accept()`가 Connected Socket을 반환한다.

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

즉 **accept에서 몇 개 Thread를 기다리게 할지는 Application / Runtime의 정책**이다.

반면 Application이 아직 `accept()`하지 못한 연결은 OS가 관리한다.

```text
Client A ─ connect ─┐
Client B ─ connect ─┼→ Server OS
Client C ─ connect ─┘
                       ↓
                연결 대기 상태 관리
                       ↓
Server Application Thread
        ↓ accept(Listening Socket)
완료된 연결 하나를 가져감
```

이 대기 규모에는 `listen()`의 **backlog**와 OS의 구현·한도가 관계된다.

```text
accept 대기 Thread 수
= Application / Runtime 정책

아직 accept되지 않은 연결
= OS가 관리
= backlog / OS 한도와 관련
```

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

가장 단순한 Blocking Server에서는 `accept()`가 Connected Socket을 반환한 뒤 **Application 코드의 다음 흐름에서 최초 `read()`를 호출**한다.

```text
accept(Listening Socket)
        ↓
Connected Socket 획득
        ↓
최초 read(Connected Socket)
        ↓
데이터 있음?
├─ 있음 → 즉시 반환
└─ 없음 → Blocking이면 Thread 대기
```

즉 OS가 "이제 read해"라고 Application의 `read()`를 호출해주는 것이 아니다. **언제 `read()`할지는 Application / Runtime의 코드 흐름이 결정하고, Application Thread가 실제 호출한다.**

송신도 같은 경계다.

```text
Server Application Thread ── send(Connected Socket) ──→ Server OS
Server OS ── TCP/IP 처리 후 Network 전송
```

세 호출을 한 번에 묶으면:

```text
accept = 완료된 연결을 OS에서 가져옴
read   = 수신 데이터를 OS에서 가져옴
send   = 보낼 데이터를 자기 OS에 넘김
```

## 8. Blocking / Non-blocking은 `read()` 호출 후의 행동 차이다

Blocking과 Non-blocking은 **언제 데이터를 Network에서 받느냐**의 차이가 아니다. Application Thread가 `read()`를 호출했을 때 OS Buffer에 데이터가 없으면 어떻게 할지를 정한다.

```text
Application Thread
        ↓ read(Connected Socket)
OS
        ↓
수신 Buffer에 데이터 있음?
├─ 있음 → 즉시 Byte 반환
└─ 없음
    ├─ Blocking     → 호출한 Thread 대기
    └─ Non-blocking → 즉시 "지금 없음" 반환
```

따라서 `Blocking Socket`이라고 해서 항상 Thread가 `read()`에서 자고 있는 것은 아니다. `read()`를 호출하지 않았다면 Thread도 Blocking되지 않고, 그 사이 도착한 데이터는 OS의 수신 Buffer에 있을 수 있다.

가장 단순한 Server 흐름에서 `read()` 타이밍을 비교하면:

```text
Blocking
Connected Socket 획득
        ↓
read() 먼저 호출
        ↓
데이터 없으면 read() 안에서 Thread 대기

Non-blocking
Connected Socket 획득
        ↓
read() 먼저 호출
        ↓
데이터 없으면 즉시 반환
        ↓
필요하면 나중에 다시 read()
```

> **Blocking / Non-blocking은 둘 다 `read()`를 먼저 호출한다. 차이는 데이터가 없을 때 기다리느냐 즉시 돌아오느냐다.**

## 9. Socket이 많아지면 `read()`에서 기다리는 Thread가 문제가 된다

가장 단순한 Blocking 구조에서는 Connected Socket마다 Thread가 `read()`를 호출한 채 기다릴 수 있다.

```text
Thread A → read(Socket A) → A의 데이터 대기
Thread B → read(Socket B) → B의 데이터 대기
Thread C → read(Socket C) → C의 데이터 대기
```

하지만:

```text
Socket 수
= OS가 유지하는 통신 연결 규모

Thread 수
= Application / Runtime이 구성하는 실행 자원 규모
```

이므로 둘은 1:1일 필요가 없다.

여기서 질문이 나온다.

> **`read()` 하나를 먼저 호출해서 기다리지 말고, 여러 Socket 중 실제로 `read()`할 수 있는 Socket을 먼저 알 수는 없을까?**

## 10. I/O Multiplexing은 `read()` 전에 준비된 Socket을 찾는다

이 지점이 Blocking / Non-blocking과 I/O Multiplexing의 가장 중요한 차이다.

```text
Blocking
read(A) 먼저
→ 데이터 없으면 read() 안에서 대기

Non-blocking
read(A) 먼저
→ 데이터 없으면 즉시 반환
→ 나중에 다시 시도

I/O Multiplexing
read()는 아직 호출하지 않음
→ A / B / C 중 read 가능한 Socket을 먼저 기다림
→ OS: "B 준비됨"
→ 그때 read(B)
```

즉 I/O Multiplexing은 OS가 대신 `read()`하는 것이 아니다.

```text
Application Thread
        ↓
"A / B / C 중 read 가능한 Socket 알려줘"
        ↓
OS
        ↓
B의 수신 Buffer에 데이터 도착
        ↓
"B가 read-ready"
        ↓
Application Thread
        ↓ read(B)
OS
        ↓
실제 Byte 반환
```

OS가 알려주는 것은 **데이터 자체가 아니라 readiness**, 즉 "이 Socket은 지금 `read()`하면 기다리지 않을 상태"라는 정보다.

또한 I/O Multiplexing 호출 자체는 Blocking될 수 있다.

```text
Blocking read
= Thread 하나가 Socket A의 데이터를 기다림

I/O Multiplexing
= Thread 하나가 A / B / C 중 하나라도 준비되기를 기다림
```

따라서 I/O Multiplexing의 핵심은 **Blocking 자체를 없애는 것**이 아니라 **한 Thread의 기다림으로 여러 Socket의 준비 상태를 함께 기다릴 수 있다는 것**이다.

## 11. `select` / `poll` / `epoll`

셋 모두 I/O Multiplexing API 계열이며 공통 목적은 같다.

```text
여러 Socket
    ↓
"이 중 read 가능한 Socket 알려줘"
    ↓
select / poll / epoll
    ↓
준비된 Socket 확인
    ↓
Application Thread가 해당 Socket read()
```

### select / poll

둘은 개념적으로 매우 비슷하다.

```text
select(A, B, C)
또는 poll([A, B, C])
        ↓
준비된 Socket 없음
        ↓
호출한 Thread 대기 가능
        ↓
B 준비
        ↓
호출 반환
        ↓
read(B)
```

한 번 `select()` / `poll()`이 반환하면 그 호출은 끝난다. 계속 감시하려면 Application이 다시 호출한다.

```text
감시 목록 전달
    ↓
select / poll
    ↓
준비된 Socket 처리
    ↓
다시 감시 목록 전달
    ↓
select / poll
    ↓
...
```

차이는 주로 감시 대상을 표현하는 API 구조다.

```text
select
= fd_set 기반
= 전통적으로 FD_SETSIZE 제약과 연관

poll
= pollfd 목록/배열 기반
= select의 고정 비트셋 방식 제약을 피함
```

### epoll

`epoll`은 **왜 매번 전체 관심 Socket 목록을 다시 넘겨야 하는가?**라는 문제를 개선한 Linux 방식으로 이해한다.

```text
최초 / 변경 시
Application
    ↓
관심 Socket을 Kernel에 등록
A / B / C

반복 처리
Application Thread
    ↓ epoll_wait()
OS
    ↓
"B 준비됨"
    ↓
Application Thread
    ↓ read(B)
    ↓
epoll_wait() 다시 호출
```

즉:

```text
select / poll
= 감시할 목록을 매 호출마다 전달
= 호출이 반환되면 다시 호출

epoll
= 관심 Socket 목록을 Kernel에 등록·유지
= epoll_wait()를 반복하여 준비된 Event를 받음
```

## 12. Event Loop는 이 과정을 반복하는 Application 구조다

Event Loop는 Non-blocking `read()`를 무작정 반복 호출하는 Busy Polling과 다르다.

```text
Busy Polling
read(A) → 없음
read(B) → 없음
read(C) → 없음
다시 read(A) → ...
```

전형적인 Event Loop는 I/O Multiplexing 등을 이용해:

```text
준비된 I/O Event 기다림
        ↓
OS가 준비된 Socket 반환
        ↓
Application이 해당 Socket read / 처리
        ↓
다시 I/O Event 기다림
        ↺
```

을 반복한다.

```text
epoll
= I/O Multiplexing Mechanism/API

Event Loop
= 준비 대기 → 처리 → 다시 대기를 반복하는 Application 실행 구조
```

따라서 `epoll = Event Loop`는 아니다.

## 13. Socket 위에는 Application Protocol이 올라간다

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
Socket이 HTTP를 사용한다            X
HTTP가 TCP Socket을 사용할 수 있다  O
```

HTTP/3은 대표적으로 `HTTP