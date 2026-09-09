# FD (File Descriptor)

> Socket I/O를 이해하면서 등장하는 Linux/Unix의 FD(File Descriptor)를 별도로 정리한다.

## 1. FD란 무엇인가

FD는 **Process가 열린 Kernel I/O 자원을 참조하기 위한 정수형 식별자**다.

```text
Application Process

fd 3 → 일반 File
fd 4 → Listening Socket
fd 5 → Connected Socket
fd 6 → Pipe
```

Socket과 FD는 같은 것이 아니다.

```text
Socket
= Kernel이 관리하는 실제 Network 통신 자원

FD
= Process가 그 Kernel 자원을 가리키는 번호

Thread
= FD를 이용해 read / write / accept 등의 I/O API를 실행하는 주체
```

개념적으로는 다음처럼 볼 수 있다.

```text
Application Process
       │
       │ fd = 5
       ↓
    FD Table
       │
       ↓
Kernel의 열린 자원
       │
       ↓
     Socket
```

FD는 Process별 식별자이므로 같은 숫자가 시스템 전체에서 같은 자원을 뜻하지 않는다.

```text
Process A : fd 5 → Socket A
Process B : fd 5 → File X
```

## 2. FD와 inode는 다르다

일반 File을 기준으로 보면 다음처럼 구분할 수 있다.

```text
Process
  │
  │ fd
  ↓
FD Table
  ↓
Open File Description
  ↓
inode
  ↓
File Data
```

```text
FD
= Process가 현재 열린 자원을 참조하는 번호

inode number
= File System이 File 객체를 식별하는 번호
```

따라서 같은 File을 여러 번 열면 서로 다른 FD가 같은 File/inode에 연결될 수도 있다.

반대로 TCP Socket은 FD로 접근할 수 있지만, 일반 File처럼 반드시 File System의 inode를 찾아가는 구조라고 이해하면 안 된다.

## 3. 왜 File Descriptor인데 Socket도 다루는가

Unix의 `everything is a file`은 **모든 자원이 디스크의 일반 File이라는 뜻이 아니다.** 여러 I/O 자원을 FD와 공통 I/O Interface를 통해 비슷하게 다룰 수 있다는 관점에 가깝다.

```text
일반 File ─┐
Socket ────┤
Pipe ──────┼→ FD → read / write / close
Device ────┘
```

예를 들어 일반 File과 Socket은 대상 자원은 다르지만 Process에서는 모두 FD를 받아 I/O API에 전달할 수 있다.

```text
open("a.txt") → fd 3
socket(...)   → fd 4

read(fd 3, ...)
read(fd 4, ...)

close(fd 3)
close(fd 4)
```

## 4. Socket I/O와 FD

Socket I/O를 FD 관점까지 내려가면 다음처럼 읽을 수 있다.

```text
Application Thread
       ↓
Socket API 호출
       ↓
Socket을 가리키는 FD
       ↓
OS Kernel의 Socket 자원
```

따라서 Linux 구현 관점에서는:

```text
Application Thread ── accept(Listening Socket의 FD) ──→ OS Kernel
Application Thread ── read(Connected Socket의 FD) ────→ OS Kernel
Application Thread ── write(Connected Socket의 FD) ───→ OS Kernel
```

으로 이해할 수 있다.

## 5. I/O Multiplexing과 FD

앞에서 `select / poll / epoll`을 **여러 Socket의 readiness를 감시한다**고 표현했지만 Linux 구현 관점으로 내려가면 FD가 직접 등장한다.

```text
fd 4 → Listening Socket
fd 5 → Connected Socket A
fd 6 → Connected Socket B
          │
          ↓
 select / poll / epoll
          │
          ↓
    Ready FD / Event
```

즉:

```text
개념 관점
= 여러 Socket 중 무엇이 Ready인가?

Linux 구현 관점
= 여러 FD 중 어떤 I/O 대상이 Ready인가?
```

`select`의 `fd_set`, `poll`의 `pollfd`, `epoll_ctl()`에 등록하는 FD가 여기서 연결된다.

## 6. 한 번에 구분하기

```text
Socket
= OS Kernel의 Network 통신 자원

FD
= Process가 열린 Kernel I/O 자원을 참조하는 식별자

inode
= File System이 File 객체를 식별하는 번호

Thread
= Application Code와 I/O API를 실행하는 실행 주체
```

> **Socket ≠ FD ≠ Thread이며, FD와 inode도 서로 다른 계층의 식별자다. Socket은 Kernel 자원이고, Process는 FD를 통해 그 자원에 접근하며, Thread가 그 FD를 이용해 I/O API를 호출한다.**
