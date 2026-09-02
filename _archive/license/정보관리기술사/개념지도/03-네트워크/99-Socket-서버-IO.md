# Socket과 서버 I/O 개념지도

> 핵심은 **Application이 Network 자원을 직접 관리하지 않는다는 것**이다. OS가 TCP 연결·Socket·Buffer·실제 송수신을 관리하고, Application Thread는 Socket API로 자기 OS에 필요한 작업을 요청한다.

## 1. 먼저 주체를 분리한다

겉으로는 `Client → Server Application`이 직접 통신하는 것처럼 보이지만 실제 흐름은 다음과 같다.

```text
Client Application
        ↓ Socket API
     Client OS
        ↓
      Network
        ↓
     Server OS
        ↑ Socket API
Server Application
```

세 주체의 역할을 섞지 않는다.

```text
Application / Runtime
= 구조와 정책을 결정
= Thread 수 · Thread Pool · accept 처리 구조 등을 결정

Application Thread
= Application Code의 실행 주체
= Socket API를 실제 호출

OS Kernel
= 실제 자원을 관리
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

관계는 다음처럼 읽는다.

```text
Application Thread
        ↓ Socket API 호출
        ↓
OS Kernel

accept(Listening Socket)
read(Connected Socket)
write/send(Connected Socket)
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
                                           socket()
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

위 함수들이 Network 반대편 함수를 직접 호출하는 것이 아니다. **각 Application Thread가 자기 OS에 Socket API를 호출하고, 실제 Network 통신은 양쪽 OS가 처리한다.**

## 4. `listen()`은 입구를 만들고 `accept()`는 연결을 가져온다

Server OS까지 통신이 도착하면 어느 endpoint로 전달할지 구분해야 한다.

```text
IP   = 어느 Host?
Port = 그 Host 안의 어느 통신 endpoint?
```

Port의 출발 목적은 Firewall이 아니다. OS가 들어온 통신을 어느 endpoint로 전달할지 구분하는 것이 먼저이고, Firewall은 이를 이용해 허용·차단하는 별도 통제다.

Server 준비 과정은:

```text
Server Application Thread
        ↓
socket()
        ↓
bind(:8080)
        ↓
listen()
        ↓
Server OS
        ↓
Listening Socket :8080 준비
```

```text
bind(:8080)
= "이 Socket을 Local Port 8080에 연결해줘"

listen()
= "이 Socket을 새 TCP 연결을 받을 입구로 만들어줘"
```

`listen()`은 Client가 올 때까지 기다리는 호출이 아니다. **OS에 Listening Socket을 준비시키고 반환한다.**

하지만 Listening Socket은 입구일 뿐 실제 Client와 `read/write`할 Socket은 아니다. 그래서 Server Application Thread는 보통 `listen()` 다음에 바로 `accept(Listening Socket)`을 호출한다.

```text
listen()
   ↓
Listening Socket 준비
   ↓
listen() 반환
   ↓
Server Application Thread
   ↓
accept(Listening Socket)
= "이 입구로 들어온 완료된 연결 하나 줘"
```

두 Socket의 역할은 명확히 다르다.

```text
Listening Socket
= 새 연결을 받는 입구
= Server 운영 동안 유지

Connected Socket
= 특정 Client와 실제 통신
= 연결마다 생성되고 통신 종료 후 close
```

## 5. `accept()`에서 실제로 무슨 일이 일어나는가

`accept()`가 TCP 연결을 처음부터 만드는 것이 아니다.

```text
Client Application Thread
        ↓ connect()
Client OS
        ↓
      Network
        ↓
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

Blocking `accept()`가 기다린다고 Connected Socket이 계속 생기는 것도 아니다.

```text
Client 없음 + Blocking accept()

Listening Socket     : 1개
Connected Socket     : 0개
accept 대기 Thread   : 대기 중
```

Client가 오면:

```text
Client connect()
        ↓
OS가 TCP 연결 처리
        ↓
완료된 연결 준비
        ↓
OS가 accept에서 기다리던 Thread를 다시 실행 가능하게 함
        ↓
accept() 반환
        ↓
Connected Socket 획득
```

### accept 대기 Thread 수는 누가 정하는가

여기서도 정책과 실제 관리를 분리한다.

```text
Application / Runtime
= accept 담당 Thread를 몇 개 둘지 결정
= Worker Thread / Thread Pool 구조 결정

Application Thread
= 실제 accept() 호출

OS
= 만들어진 Thread의 실행 · 대기 · 깨움 · Scheduling
```

즉 **accept에서 몇 개 Thread를 기다리게 할지는 Application / Runtime의 정책이고, OS는 그 Thread의 실제 상태를 관리한다.**

## 6. Application이 아직 `accept()`하지 못한 연결은 OS가 관리한다

Application이 다음 `accept()`를 바로 호출하지 못해도 OS는 Network 연결을 계속 처리할 수 있다.

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

Connected Socket
= accept 성공 후 Client별 통신
= 통신 종료 후 close
```

`backlog`의 커널 내부 구현은 더 복잡할 수 있으므로 여기서는 **Application이 아직 가져가지 못한 연결을 OS가 대기시키는 규모와 관련된 설정** 정도로 잡는다.

## 7. `read()`와 `send()`도 같은 경계에서 이해한다

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
Connected Socket 수신 Buffer에 Byte 저장
        ↑
Server Application Thread
        ↓ read(Connected Socket)
Byte를 가져감
```

```text
read(Connected Socket)
= Application Thread → 자기 OS
= "이 Socket에 받아둔 Byte 줘"

send(Connected Socket)
= Application Thread → 자기 OS
= "이 Socket으로 이 Byte를 보내줘"
```

세 호출을 한 번에 묶으면:

```text
accept = 완료된 연결을 OS에서 가져옴
read   = 수신 데이터를 OS에서 가져옴
send   = 보낼 데이터를 자기 OS에 넘김
```

`send()`가 반환됐다고 상대 Application이 이미 `read()`했다는 뜻은 아니다.

## 8. 결과가 없으면 Blocking / Non-blocking으로 갈린다

`accept()`와 `read()`는 대상은 다르지만 같은 문제를 가진다.

```text
Application Thread
        ↓
accept(Listening Socket)
또는 read(Connected Socket)
        ↓
OS
        ↓
결과가 준비됐나?
├─ Yes → 반환
└─ No
    ├─ Blocking     → 호출한 Thread 대기
    └─ Non-blocking → 즉시 "없음" 반환
```

```text
Blocking accept()
= 완료된 연결을 기다림

Blocking read()
= 수신 Buffer의 데이터를 기다림
```

Blocking에서 결과가 준비되면 OS가 기다리던 Thread를 **다시 실행 가능한 상태**로 만든다. 바로 CPU에서 실행된다는 뜻은 아니며 실제 실행 시점은 Scheduler가 정한다.

또한 Blocking은 Busy Polling과 다르다.

```text
Blocking
= 결과가 준비될 때까지 호출이 반환되지 않음

Busy Polling
= Application이 CPU를 사용해 준비 여부를 반복 확인
```

## 9. Socket이 많아지면 Thread를 어떻게 둘 것인가

가장 단순한 구조에서는 연결마다 Thread가 Blocking `read()`를 수행할 수 있다.

```text
Socket A → Thread A → read() 대기
Socket B → Thread B → read() 대기
Socket C → Thread C → read() 대기
```

하지만:

```text
Socket 수
= OS가 유지하는 통신 연결 규모

Thread 수
= Application / Runtime이 구성하는 실행 자원 규모
```

이므로 둘은 1:1일 필요가 없다.

```text
Connected Socket 10,000개
        ↓
Thread도 반드시 10,000개?
        ↓
No
```

여기서 질문이 나온다.

> **적은 수의 Thread로 많은 Socket을 어떻게 기다리고 처리할까?**

## 10. Non-blocking → I/O Multiplexing → Event Loop

Non-blocking에서는 결과가 없으면 즉시 돌아오지만 Application이 모든 Socket을 직접 반복 확인하면 Busy Polling이 될 수 있다.

```text
Socket A 확인 → 없음
Socket B 확인 → 없음
Socket C 확인 → 없음
다시 Socket A 확인 → ...
```

그런데 어느 Socket에 연결이나 데이터가 준비됐는지는 OS가 이미 알고 있다.

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

핵심은 Thread가 없어지는 것이 아니라 **Socket을 기다리기 위해 Socket마다 Thread를 붙여둘 필요가 줄어드는 것**이다.

이 결과를 반복 처리하는 Application 구조가 Event Loop다.

```text
I/O Event 대기
      ↓
준비된 Socket 확인
      ↓
처리
      ↓
다시 대기
      ↺
```

```text
epoll
= Linux의 I/O Multiplexing Mechanism/API

Event Loop
= Event를 기다리고 처리하는 Application 실행 구조
```

따라서 `epoll = Event Loop`는 아니다.

## 11. Socket 위에는 Application Protocol이 올라간다

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

`WebSocket`도 OS Socket과 같은 개념이 아니다.

```text
Socket
= Application ↔ OS의 Network 통신 접점/자원

WebSocket
= 지속적인 양방향 Message 통신을 위한 Application Protocol
```

HTTP/3은 대표적으로 `HTTP/3 → QUIC → UDP → Socket` 구조를 사용하므로 `HTTP = 항상 TCP`도 아니다.

## 12. 한 번에 다시 떠올리기

```text
Application / Runtime
= 구조 · Thread 정책 결정
        ↓
Application Thread
= Socket API 호출
        ↓
OS
= TCP 연결 · Socket · Buffer · Network I/O 관리
        ↓

socket → bind → listen
                 ↓
          Listening Socket
                 ↓
Application Thread가 accept(Listening Socket)
                 ↓
OS가 완료된 연결을 Connected Socket으로 반환
                 ↓
       read / send로 통신
                 ↓
       통신 종료 후 close
                 ↓

accept = 완료된 연결을 OS에서 가져옴
read   = 수신 데이터를 OS에서 가져옴
send   = 보낼 데이터를 자기 OS에 넘김
                 ↓

결과가 없으면?
├─ Blocking     → 호출한 Thread 대기
└─ Non-blocking → 즉시 반환
                 ↓

Socket이 많으면?
Thread-per-connection은 Thread가 많이 필요할 수 있음
                 ↓
I/O Multiplexing
select / poll / epoll
                 ↓
준비된 Socket만 처리
                 ↓
Event Loop
```

> **정책은 Application / Runtime, 호출은 Application Thread, 실제 자원 관리는 OS. Socket은 통신 자원이고 Thread는 실행 자원이다. 이 경계를 잡으면 `listen → accept → read/send → Blocking/Non-blocking → I/O Multiplexing`이 하나의 흐름으로 연결된다.**
