# FD (File Descriptor)

> Socket I/O를 이해하면서 등장하는 Linux/Unix의 FD(File Descriptor)를 별도로 정리한다.
>
> 이 문서는 **왜 FD 같은 추상화가 필요한가 → FD는 무엇인가 → 어떻게 Kernel 자원을 간접 참조하는가 → Pointer·inode와 무엇이 다른가 → File·Socket·Pipe·표준입출력·Redirection이 어떻게 하나로 연결되는가**의 흐름으로 이해한다.

## 1. 왜 FD가 필요한가

Process가 Kernel 내부의 File, Socket, Pipe, Device 같은 자원을 사용하려면 Application과 Kernel 사이에 **안전하고 공통된 참조 방식**이 필요하다.

FD 같은 간접 참조가 없다면 Application이 각 Kernel 자원의 내부 구조나 위치를 직접 알아야 하는 형태가 될 수 있다.

```text
Application

File 사용   → File System 내부 객체
Socket 사용 → Socket Kernel 객체
Pipe 사용   → Pipe Kernel 객체
Device 사용 → Device 내부 객체
```

Unix/Linux는 이 사이에 **작은 정수형 Handle인 FD**를 둔다.

```text
                    Application Process

                           FD
                            │
                            ↓
                     System Call
                  read / write / close
                            │
────────────────────────────┼──────────────── Kernel 경계
                            ↓
                         FD Table
                 ┌──────────┼──────────┐
                 ↓          ↓          ↓
               File       Socket      Pipe
```

이 구조가 주는 핵심 효과는 두 가지다.

### 1.1 Kernel 내부 자원을 직접 노출하지 않는다

Application은 Kernel 객체의 실제 Memory Address나 내부 구현을 알 필요가 없다.

```text
Process
   │
   │ FD 5
   ↓
──────────── Kernel Boundary
   │
   ↓
FD Table
   │
   ↓
실제 Kernel I/O Resource
```

Process는 FD만 가지고 System Call을 호출하고, 실제 자원의 관리와 검증은 Kernel이 담당한다.

### 1.2 서로 다른 I/O 자원을 공통 Interface로 다룰 수 있다

```text
File   ─┐
Socket ─┤
Pipe   ─┼→ FD → read / write / close
Device ─┘
```

대상 자원은 서로 다르지만 Process 입장에서는 **FD라는 공통 Handle**을 통해 비슷한 방식으로 접근할 수 있다.

> **FD는 Process가 다양한 Kernel I/O 자원을 직접 알지 않고도 안전하고 통일된 방식으로 참조하기 위한 핵심 추상화다.**

---

## 2. FD란 무엇인가

FD는 **Process가 현재 열린 Kernel I/O 자원을 참조하기 위한 정수형 식별자**다.

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

### 2.1 열린 자원이라는 의미

여기서 `열린(open) 자원`은 단순히 자원의 위치를 안다는 뜻이 아니다. **Process가 OS에 자원의 사용을 요청하여 해당 Process가 사용할 수 있는 참조 관계가 만들어진 상태**라고 이해한다.

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

---

## 3. FD는 어떻게 자원을 가리키는가

FD 값 자체에 Kernel 자원의 주소가 들어 있는 것은 아니다.

```text
fd = 5
   ↓
Process의 FD Table 5번 Entry
   ↓
Kernel의 열린 상태 / 자원
```

예를 들어:

```text
read(5, ...)
= "현재 Process의 FD Table 5번이 가리키는 열린 I/O 자원에서 읽어라"
```

즉 FD는 **자원을 직접 담는 값이 아니라 FD Table을 통한 간접 참조용 Handle**이다.

### 3.1 FD는 Pointer와 비슷하지만 Pointer는 아니다

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

5번 Disk 위치              X
Memory Address 0x5         X
Process FD Table의 5번 Entry O
```

따라서 FD는 Pointer보다는 **Process-local Handle**이라고 표현하는 것이 더 정확하다.

```text
Pointer
= 주소를 통한 간접 참조

FD
= 번호/Handle을 통한 간접 참조
```

### 3.2 FD와 Disk Address는 직접 관계가 없다

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

---

## 4. FD는 일시적인 식별자다

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

```text
FD 5 = 특정 자원의 영구 ID  X
FD 5 = 현재 Process에서 현재 열린 자원을 가리키는 일시적 Handle  O
```

비유하면:

```text
inode
= File System 안에서 공책 자체를 식별하는 관리번호

FD
= Process가 그 공책을 빌려 사용할 때 받은 일시적인 대여번호
```

이 비유에서 `close(fd)`는 **그 대여번호를 통한 사용 관계를 끝내는 것**에 가깝다.

---

## 5. FD와 inode는 다르다

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

> **FD는 Process 관점의 열린 자원 식별자이고, inode는 File System 관점의 File 객체 식별자다.**

---

## 6. 왜 File Descriptor인데 Socket도 다루는가

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

그래서 Unix/Linux의 File, Socket, Pipe, Device, 표준 입출력이 FD라는 공통적인 I/O Handle 관점에서 연결된다.

---

## 7. FD로 연결되는 Linux I/O

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

### 7.1 Redirection은 FD가 가리키는 대상을 바꾼다

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

### 7.2 Pipe도 FD를 서로 연결한다

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

---

## 8. Socket I/O와 FD

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

여기서 다시 세 개를 구분한다.

```text
Socket
= 통신 자원

FD
= Process가 Socket을 참조하는 Handle

Thread
= 그 FD를 이용해 I/O API를 호출하는 실행 주체
```

---

## 9. I/O Multiplexing과 FD

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

### 9.1 Linux I/O는 FD 중심으로 기억해도 되는가

Linux/Unix의 주요 I/O 자원인 **File · Socket · Pipe · Device 등은 FD를 공통 Handle로 사용**한다. 따라서 Blocking / Non-blocking I/O와 `select / poll / epoll`을 이해할 때는 **FD를 중심으로 보면 전체 흐름을 연결하기 쉽다.**

다만 다음처럼 과잉 일반화하지 않는다.

```text
Linux/Unix의 주요 I/O 자원은 FD 중심이다          O
모든 OS 자원은 반드시 FD를 사용한다              X
모든 운영체제의 I/O가 FD 기반이다                X
```

즉 FD는 **Unix/Linux I/O의 핵심 공통 Handle**이지만, 모든 Kernel 자원이나 모든 운영체제에 그대로 적용되는 보편적인 식별자라는 뜻은 아니다.

따라서 Socket I/O 학습 흐름을 FD까지 내려가면 다음처럼 연결된다.

```text
Kernel I/O Resource
        ↓
Process가 FD로 참조
        ↓
Thread가 FD를 사용해 I/O API 호출
        ↓
여러 FD의 readiness를 함께 기다릴 필요
        ↓
select / poll / epoll
```

---

## 10. 한 번에 다시 떠올리기

```text
왜 FD가 필요한가?
= Process가 Kernel 내부 객체를 직접 알지 않고
  여러 I/O 자원을 공통 Interface로 다루기 위해

FD
= Process가 현재 열린 Kernel I/O 자원을 참조하는
  Process-local 정수형 Handle

FD 값
= Memory Address 아님
= Disk Address 아님
= FD Table Entry 번호

FD의 생명주기
open / socket
      ↓
FD 획득
      ↓
read / write / accept ...
      ↓
close

inode
= File System의 File 객체 식별자

Socket
= Kernel의 Network 통신 자원

Thread
= FD를 이용해 I/O API를 실행하는 주체

Linux I/O
File / Socket / Pipe / Device / stdin / stdout / stderr
        ↓
       FD
        ↓
공통 I/O Interface

I/O Multiplexing
= 여러 FD의 readiness를 함께 기다리는 구조/API
```

> **FD는 단순한 번호가 아니라, Unix/Linux가 Process와 Kernel I/O 자원 사이를 분리하면서도 File · Socket · Pipe · 표준입출력 등을 하나의 I/O 모델로 조합할 수 있게 만든 핵심 Handle 추상화다.**
