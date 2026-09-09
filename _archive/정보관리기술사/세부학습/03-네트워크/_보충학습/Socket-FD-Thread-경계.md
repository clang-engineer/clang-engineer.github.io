# Socket · FD · Thread 경계

> `Socket-서버-IO.md`를 이해하면서 반복해서 헷갈렸던 **Socket · FD · Thread의 역할 경계**를 짧게 다시 잡는다.

## 1. 가장 먼저 역할을 분리한다

```text
Socket
= Kernel에 존재하는 Network 통신 자원
= 연결 상태 · 송수신 Buffer · Protocol 상태 등을 Kernel이 관리

FD (File Descriptor)
= Process가 Kernel의 Socket을 참조하기 위한 Process-local Handle
= 실제 Socket 자체나 Memory/Disk Address가 아님

Thread
= FD를 이용해 accept / read / write / send 등의 System Call을 실행하는 주체
```

> **Thread는 실행하고, FD는 참조하고, Socket은 Kernel이 관리한다.**

## 2. Socket 자체가 Application으로 반환되는 것은 아니다

Unix/Linux System Call 수준에서 `socket()`이나 `accept()`가 Application에 Kernel Socket 객체 자체를 넘겨주는 것으로 이해하지 않는다.

```text
Application Process
        │
        │ FD
        ↓
     FD Table
        │
        ↓
Kernel의 Socket 자원
```

Application이 직접 받는 것은 **Socket을 가리키는 FD**다.

```text
socket()
   ↓
Kernel에 Socket 자원 생성
   ↓
그 Socket을 참조하는 FD 반환
```

따라서 `Socket 반환`이라는 표현은 개념적으로 축약한 말일 수 있지만, 이 학습 흐름에서는 오해를 만들 수 있으므로 다음처럼 기억한다.

```text
Socket 자체 반환                     X
Socket을 가리키는 FD 반환            O
```

## 3. Server의 `accept()`도 FD를 반환한다

Server의 Listening Socket 역시 Kernel 자원이고 Process는 Listening FD로 참조한다.

```text
Server Process

FD 3
 ↓
Listening Socket (Kernel)
```

Client와 TCP 연결이 완료되면 Kernel은 해당 연결의 Connected Socket 상태를 관리한다.

```text
Kernel

Listening Socket
      │
      └─ Connected Socket A
```

Application Thread가 다음을 호출한다.

```text
accept(FD 3)
```

그러면 결과는 다음과 같이 이해한다.

```text
FD 3 → Listening Socket
FD 4 → Connected Socket A
```

즉 **`accept()`는 Connected Socket 자체를 반환하는 것이 아니라, 그 Connected Socket을 참조하는 새 FD를 반환한다.** Listening Socket은 그대로 유지된다.

## 4. Client와 Server 모두 FD를 가진다

### Client

```text
socket()
   ↓
FD 반환
   ↓
connect(fd, ...)
   ↓
같은 FD로 Connected Socket 참조
   ↓
read(fd) / write(fd)
```

### Server

```text
socket()
   ↓
Listening FD 반환
   ↓
bind → listen
   ↓
accept(Listening FD)
   ↓
Connected Socket을 가리키는 새 FD 반환
   ↓
read(Connected FD) / write(Connected FD)
```

TCP 연결 하나를 양쪽에서 보면 다음과 같다.

```text
Client Process                         Server Process

FD 7                                      FD 12
 ↓                                          ↓
Client Connected Socket ←──── TCP ────→ Server Connected Socket
 ↓                                          ↓
Client Kernel                           Server Kernel
```

양쪽 FD 번호가 같을 필요는 없다. FD는 각 Process의 FD Table 안에서만 의미가 있다.

## 5. Thread가 Socket을 통제하는 것이 아니다

헷갈리기 쉬운 잘못된 그림:

```text
accept()
   ↓
Socket 객체 반환
   ↓
Thread가 Socket을 받음
   ↓
Thread가 Socket을 관리 / 통제
```

더 정확한 그림:

```text
Application Thread
        │
        │ read(fd) / write(fd) / accept(fd)
        ↓
       FD
        ↓
──────────────── Kernel Boundary
        ↓
Kernel Socket
```

Thread는 **FD를 이용해 Kernel에 작업을 요청하는 실행 주체**다. Socket의 연결 상태, Buffer, Protocol 상태 등은 Kernel이 관리한다.

## 6. `read()` / `write()`도 같은 관점이다

```text
read(fd)
= "이 FD가 가리키는 Kernel I/O 자원에서 데이터를 읽어줘"

write(fd)
= "이 FD가 가리키는 Kernel I/O 자원으로 데이터를 보내줘"
```

Socket 통신에서는 다음처럼 연결된다.

```text
Thread
  ↓ read(Connected FD)
Kernel
  ↓
Connected Socket Receive Buffer
```

따라서 `read(Socket)`보다는 Linux/Unix 구현 관점에서 **`read(Socket을 가리키는 FD)`**로 이해하면 계층이 명확하다.

## 7. I/O Multiplexing도 FD 관점으로 내려간다

개념적으로는 "여러 Socket 중 무엇이 Ready인가"라고 설명할 수 있지만 Linux 구현 관점에서는 FD가 직접 등장한다.

```text
FD 3 → Listening Socket
FD 4 → Connected Socket A
FD 5 → Connected Socket B
          │
          ↓
 select / poll / epoll
          │
          ↓
     Ready FD / Event
```

그리고 Ready 결과를 받은 Thread가 해당 FD를 이용해 실제 I/O를 수행한다.

```text
Ready FD 확인
    ↓
Listening FD  → accept(fd)
Connected FD  → read(fd) / write(fd)
```

OS가 대신 Application Logic을 실행하거나 `read()`를 대신 호출하는 것은 아니다.

## 8. 한 번에 다시 떠올리기

```text
Socket
= Kernel에 머무는 통신 자원

FD
= Process가 Socket을 참조하는 Handle

Thread
= FD를 이용해 System Call을 실행하는 주체

socket()
= Socket 생성 + 그 Socket의 FD 반환

accept(Listening FD)
= 완료된 연결의 Connected Socket을 참조하는 새 FD 반환

read(Connected FD)
= FD가 가리키는 Socket의 수신 데이터를 읽음

I/O Multiplexing
= 여러 FD의 readiness를 함께 기다림
```

> **Socket은 Kernel에 있고, Process는 FD로 참조하며, Thread는 그 FD를 이용해 Kernel에 I/O 작업을 요청한다. `accept()`도 Socket 객체를 넘기는 것이 아니라 Connected Socket을 참조하는 새 FD를 반환한다.**
