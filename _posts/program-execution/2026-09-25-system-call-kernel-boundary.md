---
title: 프로그램은 어떻게 커널의 기능을 사용하는가 - System Call
date: 2026-09-25 12:30:00 +0900
categories: [Program Execution]
tags: [system-call, kernel, user-mode, kernel-mode, libc, syscall]
---

> [Program Execution 전체 지도](./2026-09-25-index.md)


앞선 글까지는 프로그램의 Code와 Data가 어떻게 CPU와 Memory에서 실행 가능한 상태가 되는지 살펴봤다.

하지만 실제 프로그램은 계산만 하지 않는다.

```text
파일을 읽는다
네트워크로 데이터를 보낸다
새 Process를 만든다
시간을 확인한다
Device를 사용한다
```

이런 자원은 운영체제가 관리한다.

그래서 다음 질문이 생긴다.

> **User Space에서 실행되는 프로그램은 Kernel이 관리하는 기능을 어떻게 요청하는가?**

그 경계가 System Call이다.

## 1. Application이 Hardware를 마음대로 제어하면 안 되는 이유

여러 프로그램이 동시에 실행되는 시스템에서 각 프로그램이 Memory, Disk, Network Device를 직접 제어한다고 생각해 보자.

```text
Application A ─┐
Application B ─┼─→ Hardware 직접 제어
Application C ─┘
```

한 프로그램의 잘못된 동작이 다른 프로그램의 Memory를 덮거나 Device 상태를 망가뜨릴 수 있다.

그래서 CPU와 운영체제는 실행 권한을 구분한다.

```text
User Mode
→ 일반 Application 실행
→ 제한된 권한

Kernel Mode
→ OS Kernel 실행
→ 보호된 System Resource 관리
```

여기서 User는 사람을 뜻하는 것이 아니라 **제한된 권한으로 Application이 실행되는 영역**을 의미한다.

## 2. 그러면 Application은 OS 기능을 어떻게 사용할까

Application이 파일을 읽고 싶다고 하자.

직접 Disk Controller를 조작하는 대신 Kernel에 요청한다.

```text
Application
    ↓ 요청
System Call
    ↓
Kernel
    ↓
File System / Driver
    ↓
Storage
```

System Call은 User Space Program이 Kernel Service를 요청하기 위한 공식 경계다.

따라서 다음 둘을 구분해야 한다.

```text
일반 함수 호출
→ 같은 Program 안의 다른 Code로 Control 이동

System Call
→ Kernel이 제공하는 Service를 요청하며
  User Mode와 Kernel Mode 경계를 통과
```

## 3. printf()는 System Call일까

C 코드에서:

```c
printf("hello\n");
```

를 호출했다고 하자.

`printf()` 자체는 일반적으로 C 표준 Library 함수다. 곧바로 System Call과 같은 개념은 아니다.

단순화하면:

```text
Application
    ↓ 함수 호출
printf()
    ↓ Formatting / Buffering
C Library
    ↓ 필요한 시점
write 계열 OS 요청
    ↓ System Call 경계
Kernel
    ↓
File / Terminal
```

Library가 Buffering을 할 수 있으므로 `printf()` 한 번과 System Call 한 번이 반드시 1:1로 대응하는 것도 아니다.

이 구분이 중요한 이유는 **Library API와 Kernel ABI를 같은 것으로 생각하지 않기 위해서**다.

## 4. System Call이 일어나면 무엇이 달라질까

CPU가 User Mode Code를 실행하다가 System Call Instruction을 만나면 Kernel의 정해진 진입 경로로 Control이 넘어간다.

개념적으로는:

```text
User Mode
Application Code
      ↓
System Call Instruction
      ↓
------------------------
      권한 경계
------------------------
      ↓
Kernel Mode
System Call Handler
      ↓
Kernel Service 수행
      ↓
결과 반환
      ↓
------------------------
User Mode
Application 실행 계속
```

위 화살표는 **Control이 이동하는 순서**를 나타낸다.

구체적인 Instruction과 Register 사용법은 CPU Architecture와 OS ABI에 따라 달라질 수 있다.

## 5. 왜 Library를 사이에 둘까

Application이 매번 CPU별 System Call Convention과 OS 세부사항을 직접 다루는 것은 불편하다.

그래서 일반적으로 Library와 OS API가 더 사용하기 쉬운 Interface를 제공한다.

```text
Application Code
       ↓
Library / OS API
       ↓
System Call Interface
       ↓
Kernel
```

예를 들어 C의 표준 Library는 `fopen()`, `printf()` 같은 비교적 높은 수준의 API를 제공한다.

Application 개발자는 다음과 같은 저수준 세부를 매번 직접 처리하지 않아도 된다.

```text
어떤 Register에 Argument를 넣을까?
어떤 System Call Number를 사용할까?
어떤 Instruction으로 Kernel에 진입할까?
```

이 세부는 Platform과 Runtime/Library가 담당할 수 있다.

## 6. System Call과 Context Switch는 같은가

둘은 관련될 수 있지만 같은 개념은 아니다.

System Call은 **Kernel Service를 요청하기 위해 권한 경계를 넘는 것**이다.

Context Switch는 **CPU에서 실행하는 Task의 Context를 다른 Task로 교체하는 것**이다.

```text
System Call
= User Mode → Kernel Mode 진입

Context Switch
= Task A → Task B 실행 주체 전환
```

System Call을 수행한 뒤 같은 Thread로 바로 돌아올 수도 있다.

반대로 System Call이 Blocking되어 현재 Thread가 기다려야 한다면 Scheduler가 다른 Thread를 실행하면서 Context Switch가 발생할 수 있다.

따라서:

```text
System Call 발생
   ↓
반드시 Context Switch? → 아님

Blocking 등으로 Scheduling 필요
   ↓
Context Switch가 이어질 수 있음
```

## 7. Runtime과 Kernel의 책임도 구분한다

Java Virtual Thread나 Go Goroutine처럼 Runtime이 많은 실행 흐름을 관리하는 경우를 생각해 보자.

Runtime이 Scheduling을 한다고 해서 Kernel의 역할을 대신하는 것은 아니다.

```text
Runtime Scheduler
→ Runtime-level 실행 단위를
  어떤 OS Thread에서 실행할지 관리

Kernel Scheduler
→ OS가 Scheduling하는 Thread를
  어느 CPU에서 언제 실행할지 결정
```

그리고 Runtime이 새로운 OS Thread나 File 같은 Kernel Resource가 필요하면 결국 OS API/System Call을 통해 요청한다.

```text
Application / Runtime
        ↓ 요청
OS API / System Call
        ↓
Kernel
        ↓
Resource 생성·관리
```

이 경계를 이해하면 Runtime, OS, Kernel의 역할을 한 계층으로 섞지 않게 된다.

## 8. 지금까지의 흐름에 System Call을 넣어 보자

```text
Source Code
   ↓ Compile / Link
Executable
   ↓ Loader
Process
   ↓
CPU가 User Mode Code 실행
   ↓
Library / Runtime
   ↓ OS 기능 필요
System Call
   ↓
Kernel Mode
   ↓
File System / Network / Memory / Process / Device 관리
   ↓
Driver / Hardware
```

프로그램의 일반 계산은 User Mode에서 계속 실행할 수 있다.

Kernel의 보호된 Resource가 필요할 때만 정해진 Interface를 통해 Kernel에 요청한다.

## 9. 다음 질문 - 서로 다른 Binary는 어떻게 약속을 맞출까

여기까지 오면 또 하나의 질문이 생긴다.

Compiler가 만든 Code, Library, 운영체제는 서로 별개의 구성요소다.

그런데 어떻게 다음 사항을 서로 맞출 수 있을까?

```text
함수 Argument는 어디에 둘까?
Return Value는 어디에 둘까?
Register는 누가 보존할까?
Data Type은 Memory에 어떻게 배치할까?
Symbol 이름은 어떻게 표현할까?
Executable / Object 형식은 무엇을 사용할까?
```

이런 **Binary 수준의 약속**이 ABI(Application Binary Interface)다.

다음 글에서는 API와 ABI의 차이부터 시작해, Compiler·Linker·Library·OS가 어떻게 Binary 경계를 맞추는지 살펴본다.

## 기억 흐름

```text
User Mode
= 일반 Application이 제한된 권한으로 실행

Kernel Mode
= Kernel이 보호된 System Resource를 관리

System Call
= User Space에서 Kernel Service를 요청하는 경계

Library API
= Application이 사용하기 쉬운 Interface 제공

Context Switch
= 실행 주체 자체를 다른 Task로 전환
```

핵심은 다음 한 줄이다.

> **Application은 Hardware와 Kernel 내부 기능을 마음대로 직접 다루는 대신 User Mode에서 실행하고, 보호된 OS Resource가 필요할 때 System Call이라는 정해진 경계를 통해 Kernel에 서비스를 요청한다.**
