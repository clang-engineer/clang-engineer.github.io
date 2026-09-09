# FD (File Descriptor)

> Socket I/O를 이해하면서 등장하는 Linux/Unix의 FD(File Descriptor)를 별도로 정리한다.

## 1. FD란 무엇인가

FD는 **Process가 열린 Kernel I/O 자원을 참조하기 위한 정수형 식별자**다.

```text
Application Process

fd 0 → stdin
fd 1 → stdout
fd 2 → stderr
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

### 열린 자원이라는 의미

여기서 `열린(open) 자원`은 단순히 자원의 위치를 안다는 뜻이 아니다. **Process가 OS에 자원의 사용을 요청하여, 해당 Process가 사용할 수 있는 참조 관계가 만들어진 상태**라고 이해한다.

일반 File의 경우:

```text
a.txt가 File System에 존재
        ↓
open("a.txt")
        ↓
OS가 열린 상태를 구성
        ↓
FD 3 반환
        ↓
read(3) / write(3) / close(3)
```

Socket도 비슷하다.

```text
socket()
   ↓
Kernel에 Socket 자원 생성
   ↓
Process가 사용할 FD 반환
   ↓
FD를 통해 Socket 사용
```

따라서 `open → FD → I/O → close`는 **Process가 Kernel I/O 자원을 사용하기 위한 참조의 생명주기**로 볼 수 있다.

## 2. FD는 Pointer와 비슷하지만 Pointer는 아니다

FD와 Pointer는 둘 다 **간접 참조(indirection)** 역할을 한다는 점에서 비슷하다.

```text
Pointer
  ↓
Memory Address
  ↓
Memory Object

FD
  ↓
정수 번호
  ↓
Process의 FD Table
  ↓
Kernel I/O Resource
```

하지만 FD 값 자체가 Memory Address나 Disk Address인 것은 아니다.

```text
fd = 5

5번 Disk 위치       X
Memory Address 0x5  X
Process FD Table의 5번 Entry  O
```

따라서 FD는 Pointer보다는 **Process-local Handle**이라고 표현하는 것이 더 정확하다.

```text
Pointer
= 주소를 통한 간접 참조

FD
= 번호/Handle을 통한 간접 참조
```

예를 들어:

```text
read(5, ...)
= "현재 Process의 FD Table 5번이 가리키는 열린 I/O 자원에서 읽어라"
```

### FD와 Disk Address는 직접 관계가 없다

일반 File을 읽는 경우에도 FD에서 실제 Storage까지는 여러 계층을 거친다.

```text
FD
 ↓
FD Table
 ↓
Open File Description
 ↓
File / inode
 ↓
File System
 ↓
Data Block
 ↓
Storage
```

따라서 FD 번호 자체로 Disk의 물리적 위치를 알 수 있는 것은 아니다. Socket이나 Pipe도 FD를 가질 수 있다는 점을 생각하면 더 명확하다.

## 3. FD는 일시적인 식별자다

FD는 File이나 Socket 자체의 영구 식별자가 아니라 **현재 Process에서 열린 동안 의미가 있는 식별자**다.

```text
open("a.txt")
   ↓
FD 3
   ↓
close(3)
   ↓
FD 3 사용 종료
   ↓
open("b.txt")
   ↓
FD 3이 다시 사용될 수도 있음
```

Process가 종료되면 해당 Process가 가지고 있던 FD들도 OS에 의해 정리된다.

따라서:

```text
FD 5 = 특정 자원의 영구 ID  X
FD 5 = 현재 Process에서 현재 열린 자원을 가리키는 일시적 Handle  O
```

비유하면 **inode가 File System 안에서 공책 자체를 식별하는 관리번호라면, FD는 Process가 그 공책을 빌려 사용할 때 받은 일시적인 대여번호**에 가깝다.

## 4. FD와 inode는 다르다

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

## 5. 왜 File Descriptor인데 Socket도 다루는가

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

표준 입출력도 같은 FD 체계에 포함된다.

```text
fd 0 = stdin
fd 1 = stdout
fd 2 = stderr
```

그래서 Unix/Linux의 File, Socket, Pipe, Device, 표준 입출력 등이 FD라는 공통적인 I/O Handle 관점에서 연결된다.

## 6. FD로 연결되는 Linux I/O

평소에는 File, Socket, Pipe, 표준 입출력, Shell Redirection이 서로 다른 기능처럼 보이지만 FD 관점에서는 하나의 I/O 모델로 연결된다.

```text
                    Process

File ─────────────→ FD 3 ─┐
Socket ───────────→ FD 4 ─┤
Pipe ─────────────→ FD 5 ─┼→ read / write / close
stdin ────────────→ FD 0 ─┤
stdout ───────────→ FD 1 ─┤
stderr ───────────→ FD 2 ─┘
```

### 6.1 Redirection은 FD가 가리키는 대상을 바꾼다

Shell에서 다음 명령은 단순히 "출력을 File에 저장한다"고 볼 수도 있지만 FD 관점에서는 stdout의 연결 대상을 바꾸는 것으로 이해할 수 있다.

```text
echo hello > out.txt
```

```text
원래

FD 1 (stdout)
      ↓
  Terminal

> out.txt
      ↓

FD 1 (stdout)
      ↓
   out.txt
```

따라서 다음과 같은 Shell 문법도 FD 번호를 알면 의미가 보인다.

```text
1>file
= stdout(FD 1)을 File로 Redirection

2>file
= stderr(FD 2)를 File로 Redirection

2>&1
= stderr(FD 2)를 현재 stdout(FD 1)이 향하는 대상으로 Redirection
```

예를 들어:

```text
command > out.txt 2>&1
```

은 stdout을 `out.txt`로 보내고, stderr도 stdout이 향하는 곳으로 보내는 구조다.

### 6.2 Pipe도 FD를 서로 연결한다

```text
cat a.txt | grep hello
```

를 FD 관점으로 보면 개념적으로 다음과 같다.

```text
cat Process                         grep Process

stdout                               stdin
 FD 1                                 FD 0
   │                                   ↑
   └──────────→ Pipe ──────────────────┘
```

즉 앞 Process의 표준 출력과 뒤 Process의 표준 입력 사이에 Pipe라는 Kernel I/O 자원을 연결한다.

```text
cat의 FD 1
    ↓
  Pipe
    ↓
grep의 FD 0
```

이 관점에서 Unix/Linux의 여러 기능이 하나로 연결된다.

```text
File
Socket
Pipe
stdin / stdout / stderr
Redirection
        ↓
       FD
        ↓
Kernel I/O Resource
```

> **FD를 이해하면 File · Socket · Pipe · 표준 입출력 · Redirection이 서로 별개의 기능이 아니라, Process가 Kernel I/O 자원을 FD로 참조하고 연결하는 하나의 모델 위에 있다는 것을 볼 수 있다.**

## 7. Socket I/O와 FD

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

## 8. I/O Multiplexing과 FD

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

## 9. 한 번에 구분하기

```text
Socket
= OS Kernel의 Network 통신 자원

FD
= Process가 현재 열린 Kernel I/O 자원을 참조하는 일시적인 Handle
= Memory Address / Disk Address가 아님

inode
= File System이 File 객체를 식별하는 번호

Thread
= Application Code와 I/O API를 실행하는 실행 주체
```

> **Socket ≠ FD ≠ Thread이며, FD와 inode도 서로 다른 계층의 식별자다. FD는 Pointer처럼 간접 참조 역할을 하지만 주소가 아니라 Process의 FD Table Entry를 지정하는 정수형 Handle이다.**
