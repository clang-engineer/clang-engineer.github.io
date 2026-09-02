# Socket과 서버 I/O 개념지도

> 핵심은 **Application이 Network 자원을 직접 관리하지 않는다는 것**이다. OS가 TCP 연결·Socket·Buffer·실제 송수신을 관리하고, Application Thread는 Socket API로 자기 OS에 필요한 작업을 요청한다.

## 1. 가장 먼저 바꿔야 할 그림

겉으로는 이렇게 보인다.

```text
Client
  ↓
Server Application
```

하지만 실제 Network I/O를 이해할 때는 이렇게 봐야 한다.

```text
Client Application
        ↓
     Client OS
        ↓
      Network
        ↓
     Server OS
        ↓
Server Application
```

```text
Application / Runtime
= Server 구조와 정책을 결정
= Thread 수 · Thread Pool · accept 처리 구조 등을 결정

Application Thread
= Application Code의 실행 주체
= Socket API를 호출

OS Kernel
= Network 자원의 실제 관리 주체
├─ TCP 연결 상태
├─ Listening / Connected Socket
├─ 연결 대기열
├─ 송·수신 Buffer
├─ 실제 Packet 송수신
└─ Blocking I/O를 호출한 Thread의 대기·깨움
```

즉:

```text
Application Thread
        ↓ Socket API
      자기 OS
        ↕ Network
      상대 OS
        ↑ Socket API
상대 Application Thread
```

> `connect()`, `accept()`, `read()`, `write()`가 Network 반대편 함수를 직접 호출하는 것이 아니다. **각 Application Thread가 자기 PC의 OS를 호출한다.**

## 2. Socket API와 Socket, Thread를 분리한다

```text
Socket API
= Application이 OS의 Socket 자원을 다루기 위한 호출 집합
= socket / bind / listen / connect / accept / read / write / send / recv 등

Socket
= 통신 자원
= Socket API가 다루는 Network endpoint / 연결

Thread
= 실행 자원
= Socket API를 호출하며 Application Code를 실행하는 주체
```

따라서 관계는 다음과 같다.

```text
Application Thread
        ↓
Socket API 호출
├─ accept(Listening Socket)
├─ read(Connected Socket)
└─ write/send(Connected Socket)
        ↓
      OS Kernel
```

즉 **Socket이 `accept()`나 `read()`를 호출하는 것이 아니다. Application Thread가 Socket API를 호출하고, 해당 API의 대상 자원으로 Socket을 지정한다.**

또 하나 구분한다.

```text
Application / Runtime
= "Thread를 몇 개 둘 것인가" 같은 정책 결정

Application Thread
= 결정된 구조 안에서 실제 accept/read/write 등을 호출

OS
= 만들어진 Thread의 실제 실행·대기·Scheduling 관리
```

따라서 `Socket 수 = Thread 수`도 아니다.

## 3. TCP Client / Server의 전체 순서

먼저 함수의 세부보다 **누가 언제 자기 OS를 호출하는지** 본다.

```text
[Server Application Thread]              [Client Application Thread]

socket()
   ↓
bind(:8080)
   ↓
listen()
   ↓                                       socket()
                                           ↓
                                        connect()
                                           ↓
                  Client OS ↔ Network ↔ Server OS
                         TCP 연결 수립
                                           ↓
accept(Listening Socket)
   ↓
Connected Socket
   │
   │                                       send()
   │                                          ↓
                  Client OS → Network → Server OS
                                           ↓
read(Connected Socket)
   ↓
요청 처리
   ↓
send(Connected Socket)
   ↓
                  Server OS → Network → Client OS
                                           ↓
                                         read()
```

이 흐름에서 Application 함수는 모두 **자기 OS에 대한 Socket API 호출**이다.

## 4. Port → Listening Socket → Connected Socket

Server OS까지 통신이 도착하면 어느 통신 endpoint로 전달할지 구분해야 한다.

```text
IP
= 어느 Host?

Port
= 그 Host 안의 어느 통신 endpoint?
```

Port의 출발 목적은 Firewall이 아니다. **OS가 들어온 통신을 어느 endpoint로 전달할지 구분하는 것**이 먼저이고, Firewall은 IP·Port·Protocol 등을 이용해 허용/차단하는 별도 통제다.

Server Application Thread가:

```text
socket()
  ↓
bind(:8080)
  ↓
listen()
```

을 호출하면:

```text
bind(:8080)
= "이 Socket을 Local Port 8080에 연결해줘"

listen()
= "이 Socket을 새 TCP 연결을 받을 입구로 만들어줘"
        ↓
Server OS에 Listening Socket :8080 준비
```

`listen()`은 Client가 올 때까지 Application Thread가 함수 안에서 기다린다는 뜻이 아니다. **OS에 새 연결을 받을 상태를 설정하고 반환한다.**

여기서 중요한 질문이 남는다.

> **OS가 연결을 받을 준비를 했는데, Server Application은 실제 Client와 통신할 Connected Socket을 어떻게 얻는가?**

그래서 Server Application Thread가 `accept(Listening Socket)`을 호출한다.

```text
Server Application Thread
        ↓ listen()
Server OS
        ↓
Listening Socket 준비
        ↓
listen() 반환
        ↓
Server Application Thread
        ↓
"실제 Client와 통신할 연결 하나가 필요하다"
        ↓
accept(Listening Socket)
        ↓
Server OS
```

Listening Socket과 Connected Socket의 역할은 다르다.

```text
Listening Socket
= OS가 새 TCP 연결을 받는 입구
= Server가 운영되는 동안 계속 유지할 수 있음

Connected Socket
= 특정 Client와 실제 데이터를 주고받는 통신 endpoint
= 연결마다 생기고 통신이 끝나면 close
```

`accept()`의 호출 관계까지 포함하면 다음과 같다.

```text
Server Application Thread
        ↓ accept(Listening Socket)
Server OS
        ↓
Listening Socket에 대응하는 완료된 연결 하나 선택
        ↓
Connected Socket 반환
```

Client가 여러 개라면 이 과정이 반복된다.

```text
Listening Socket :8080 ─────────────────────── 서버 운영 동안 유지

Connected Socket A       ├──── 통신 ────┤ close
Connected Socket B             ├──── 통신 ──────┤ close
Connected Socket C                    ├── 통신 ──┤ close
```

## 5. `accept()`는 언제, 왜 호출하는가

`listen()`은 OS에게 **앞으로 이 Listening Socket으로 새 연결을 받아둘 수 있게 준비하라**는 호출이다. 하지만 Server Application이 실제 Client와 `read/write`하려면 그 Client에 대응하는 Connected Socket이 필요하다.

그래서 일반적인 Blocking Server는 `listen()`으로 준비를 끝낸 뒤 `accept(Listening Socket)`을 호출해 **Application이 사용할 연결 하나를 요청한다.**

```text
listen()
   ↓
OS가 Listening Socket 준비
   ↓
listen() 반환
   ↓
Server Application Thread
   ↓
accept(Listening Socket)
= "이 입구로 들어온 완료된 연결 하나 줘"
```

`accept()`를 호출하는 시점에 완료된 연결이 이미 있을 필요는 없다.

```text
Server Application Thread
        ↓ accept(Listening Socket)
Server OS
        ↓
완료된 연결 있음?
├─ 있음
│   ↓
│ Connected Socket 즉시 반환
│
└─ 없음
    ↓
  Blocking 방식이면
  호출한 Application Thread 대기
    ↓
  Client connect()
    ↓
  양쪽 OS가 TCP 연결 처리
    ↓
  완료된 연결 준비
    ↓
  OS가 기다리던 Thread를 다시 실행 가능하게 함
    ↓
  accept()가 Connected Socket 반환
```

여기서 **Blocking `accept()` 하나가 기다린다고 Connected Socket이 계속 생기는 것은 아니다.** Client가 없다면 Listening Socket은 그대로 있고, `accept()`를 호출한 Application Thread 하나가 대기할 뿐이다.

```text
Client 없음 + Blocking accept() 대기 중

Listening Socket        : 존재
Connected Socket        : 0개
accept() 대기 Thread    : Application / Runtime이 구성한 만큼
```

`accept()`에서 몇 개의 Application Thread를 대기시킬지는 OS가 자동으로 연결 수에 맞춰 정하는 것이 아니라 **Application / Server Runtime의 구조와 정책이 결정한다.** OS는 그렇게 만들어진 Thread의 실제 대기·깨움·Scheduling을 담당한다.

```text
Application / Runtime
├─ accept 담당 Thread를 몇 개 둘지
├─ Worker Thread를 몇 개 둘지
└─ Thread Pool을 어떻게 구성할지 결정

OS
├─ Thread 실행 / 대기 / 깨움
├─ Listening Socket
├─ 아직 Application이 가져가지 않은 연결의 대기 상태
└─ Connected Socket 관리
```

즉:

```text
listen()
= OS에 "새 연결을 받을 준비를 해둬"

accept(Listening Socket)
= Application Thread가 OS에
  "그렇게 준비된 연결 중 하나를 나한테 줘"
```

`accept()`가 TCP 연결을 처음부터 직접 만드는 것이 아니다. **양쪽 OS가 TCP 연결을 처리하고, Server Application은 `accept()`로 완료된 연결을 넘겨받는다.**

## 6. Application이 아직 `accept()`하지 못한 연결은?

Application Thread가 다른 Client를 처리 중이거나 아직 다음 `accept()`를 호출하지 못해도 Server OS는 Network 연결을 처리할 수 있다.

단순화하면:

```text
Client A ─ connect ─┐
Client B ─ connect ─┼→ Server OS
Client C ─ connect ─┘
                       ↓
               연결들을 OS가 관리
                       ↓
Server Application Thread
        ↓ accept(Listening Socket)
        ↓
완료된 연결 하나를 가져감
```

Application이 아직 가져가지 않은 연결을 OS가 기다리게 하는 규모에는 `listen()`의 **backlog**와 OS의 구현·한도가 관계된다.

```text
backlog
= Application이 미처 accept하지 못한 연결을
  OS가 대기시키는 규모와 관련된 설정
```

세부적으로 OS는 연결 수립 단계별 Queue를 별도로 관리할 수 있으므로 `backlog = 정확히 완료 연결 N개짜리 배열`로 이해하지는 않는다.

구분하면:

```text
accept() 대기 Thread 수
= Application / Runtime 정책

아직 accept되지 않은 연결 대기 상태
= OS가 관리
= backlog / OS 한도와 관련

Connected Socket
= accept() 성공 후 특정 Client와 통신
= 통신 종료 시 close
```

## 7. `read()`도 같은 구조다

Client가 보낸 데이터도 Server Application으로 바로 들어오는 것이 아니다.

```text
Client Application
        ↓ send()
Client OS
        ↓
      Network
        ↓
Server OS
        ↓
Connected Socket의 수신 Buffer에 Byte 저장
        ↑
Server Application Thread
        ↓ read(Connected Socket)
Byte를 가져감
```

즉:

```text
read(Connected Socket)
호출 주체 : Application Thread
호출 대상 : 자기 OS
의미       : "이 Socket에 받아둔 Byte 줘"
결과       : Byte
```

송신도 대칭적이다.

```text
write/send(Connected Socket)
호출 주체 : Application Thread
호출 대상 : 자기 OS
의미       : "이 Socket으로 이 Byte를 보내줘"
        ↓
OS의 송신 Buffer → TCP/IP Stack → Network
```

`send()`가 반환됐다고 상대 Application이 이미 `read()`했다는 뜻은 아니다.

세 호출을 한 번에 묶으면:

```text
accept(Listening Socket)
= OS가 관리하는 완료된 연결을 가져옴

read(Connected Socket)
= OS가 관리하는 수신 데이터를 가져옴

send(Connected Socket)
= 보낼 데이터를 자기 OS에 넘김
```

## 8. 그래서 Blocking / Non-blocking이 나온다

`accept()`와 `read()`의 공통 문제는 **OS에 지금 반환할 결과가 없을 수도 있다는 것**이다.

```text
Application Thread
        ↓
Socket API 호출
├─ accept(Listening Socket)
└─ read(Connected Socket)
        ↓
       OS
        ↓
결과가 준비됐나?
├─ Yes → 바로 반환
│
└─ No
    ├─ Blocking
    │    ↓
    │  호출한 Thread 대기
    │    ↓
    │  결과 준비
    │    ↓
    │  OS가 Thread를 다시 실행 가능하게 함
    │    ↓
    │  함수 반환
    │
    └─ Non-blocking
         ↓
       "지금 없음"을 즉시 반환
```

기다리는 대상만 다르다.

```text
Blocking accept()
= 완료된 연결을 기다림

Blocking read()
= 수신 Buffer의 데이터를 기다림
```

여기서 `OS가 Thread를 깨운다`는 것은 바로 CPU에서 실행한다는 뜻이 아니라 **다시 실행 가능한 상태로 만들고 Scheduler의 실행 대상이 되게 한다**는 의미다.

또한 Blocking은 Busy Waiting과 다르다.

```text
Blocking
= 결과가 준비될 때까지 호출이 반환되지 않음

Busy Polling
= Application이 CPU를 사용해 준비 여부를 계속 반복 확인
```

## 9. Socket이 많아지면 Thread가 문제가 된다

가장 단순한 Server 구조에서는 연결마다 Thread가 Blocking `read()`를 수행할 수 있다.

```text
Socket A → Thread A → read() 대기
Socket B → Thread B → read() 대기
Socket C → Thread C → read() 대기
```

하지만 이 Thread 수는 OS가 Socket마다 자동으로 만들어 정하는 것이 아니다.

```text
Application / Runtime
= Thread 수와 Thread Pool 정책 결정

OS
= 만들어진 Thread의 실행·대기·Scheduling 관리
```

따라서:

```text
Socket 수
= OS가 유지하는 통신 연결 규모

Thread 수
= Application의 실행 자원 규모
```

```text
Connected Socket 10,000개
        ↓
Thread도 반드시 10,000개여야 하나?
        ↓
No
```

그러면 다음 문제가 생긴다.

> **적은 수의 Thread로 많은 Socket을 어떻게 기다리고 처리할까?**

## 10. Non-blocking → I/O Multiplexing

Non-blocking에서는 결과가 없으면 바로 돌아오므로 Thread가 다른 일을 할 수 있다.

하지만:

```text
Socket A 확인 → 없음
Socket B 확인 → 없음
Socket C 확인 → 없음
다시 Socket A 확인 → ...
```

처럼 Application이 직접 계속 확인하면 Busy Polling이 될 수 있다.

그런데 **어느 Socket에 연결이나 데이터가 준비됐는지는 OS가 이미 알고 있다.**

그래서:

```text
많은 Socket
    ↓
"OS야, 지금 처리 가능한 Socket만 알려줘"
    ↓
I/O Multiplexing
select / poll / epoll
    ↓
"B, D 준비됨"
    ↓
Application이 B, D만 처리
```

핵심은 Thread가 없어지는 것이 아니다.

> **Socket을 기다리기 위해 Socket마다 Thread를 붙여둘 필요가 줄어드는 것**이다.

## 11. Event Loop

I/O Multiplexing의 결과를 반복 처리하면 Event Loop 구조로 이어진다.

```text
준비된 I/O Event 기다림
        ↓
OS가 준비된 Socket 반환
        ↓
Application이 처리
        ↓
다시 Event 기다림
        ↑
        └──────── 반복
```

```text
epoll
= 여러 File Descriptor의 I/O 준비 상태를 기다리는 Linux Mechanism/API

Event Loop
= Event를 기다리고 준비된 작업을 반복 처리하는 Application 실행 구조
```

따라서 `epoll = Event Loop`는 아니다.

## 12. Socket 위에는 무엇이 올라가는가

Socket은 Byte를 전달할 뿐 그 Byte의 Application 의미까지 알지는 못한다.

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