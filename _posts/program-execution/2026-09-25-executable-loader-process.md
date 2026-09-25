---
title: 실행 파일은 어떻게 프로세스가 되는가 - Loader와 Process
date: 2026-09-25 11:50:00 +0900
categories: [Program Execution]
tags: [executable, loader, process, virtual-memory, elf, pe, mach-o]
---

앞선 글에서는 소스 코드가 컴파일과 링크를 거쳐 실행 파일이 되는 과정을 살펴봤다.

그런데 실행 파일이 만들어졌다고 프로그램이 실행 중인 것은 아니다.

> **디스크에 있는 실행 파일을 실행하면, 운영체제는 무엇을 해서 그것을 프로세스로 만드는가?**

이번 글에서는 이 경계를 따라간다.

## 1. 실행 파일과 프로세스는 다르다

먼저 세 개념의 위치를 구분한다.

```text
소스 코드
   ↓ 컴파일 · 링크
실행 파일
   ↓ 실행 요청 · 로드
프로세스
```

실행 파일은 디스크에 저장된 **프로그램의 실행 가능한 표현**이다.

프로세스(Process)는 그 프로그램을 실제로 실행하기 위해 운영체제가 관리하는 **실행 인스턴스**다.

같은 실행 파일을 여러 번 실행하면 여러 프로세스가 만들어질 수 있다.

```text
app 실행 파일
   ├─ 실행 → Process A
   ├─ 실행 → Process B
   └─ 실행 → Process C
```

따라서 `program = process`라고 등치하면 안 된다.

## 2. 실행 파일은 단순한 기계어 덩어리가 아니다

운영체제가 실행 파일을 읽으려면 코드와 데이터가 어디에 있고 어떻게 메모리에 배치해야 하는지 알아야 한다.

그래서 플랫폼마다 실행 파일 형식이 있다.

```text
Linux    → ELF
Windows  → PE
macOS    → Mach-O
```

ELF(Executable and Linkable Format)는 이름 그대로 실행 파일과 링크 가능한 오브젝트를 표현하기 위한 형식이다.

실행 파일에는 개념적으로 다음과 같은 정보가 들어갈 수 있다.

```text
Executable
├─ 실행할 Code
├─ 초기화된 Data
├─ Memory 배치에 필요한 정보
├─ Entry Point
└─ Dynamic Linking에 필요한 정보
```

파일 형식의 세부 Header를 외우는 것이 핵심은 아니다.

중요한 점은 **운영체제가 실행 파일을 해석할 수 있도록 Code와 Data의 배치 정보를 구조화해 둔 파일**이라는 것이다.

## 3. 왜 Loader가 필요한가

CPU가 디스크의 실행 파일을 그대로 실행할 수는 없다.

CPU가 명령을 실행하려면 실행에 필요한 Code와 Data가 프로세스의 주소 공간에서 접근 가능한 상태가 되어야 한다.

그래서 Loader가 필요하다.

```text
실행 파일
   ↓ Loader가 형식을 해석
필요한 영역을 주소 공간에 배치·매핑
   ↓
실행에 필요한 초기 상태 준비
   ↓
Entry Point에서 실행 시작
```

`load`는 말 그대로 **실행할 프로그램을 실행 가능한 상태로 올린다**는 의미로 이해하면 된다.

여기서 Loader는 파일을 RAM에 통째로 복사하는 단순한 복사 프로그램으로 이해하면 안 된다. 현대 운영체제에서는 가상 메모리와 Memory Mapping을 이용하므로 실제 Physical Page는 필요할 때 준비될 수도 있다.

## 4. Process를 만들 때 무엇이 생기는가

운영체제 관점에서 Process는 Code만을 의미하지 않는다.

개념적으로 다음과 같은 실행 상태가 필요하다.

```text
Process
├─ Virtual Address Space
├─ 실행 Code / Data Mapping
├─ Stack
├─ Heap을 확장할 수 있는 영역
├─ 열린 File 등 OS Resource 상태
└─ 실행을 관리하기 위한 Kernel 정보
```

Thread까지 포함해 보면 실행 구조를 조금 더 정확히 볼 수 있다.

```text
Process
├─ 자원과 주소 공간을 소유
│
└─ Thread
    └─ CPU에서 실제 Instruction 흐름을 실행
```

Process와 Thread의 세부 차이는 운영체제 주제에서 더 깊게 다룰 수 있다. 여기서는 **실행 파일이 운영체제가 관리하는 실행 상태로 바뀐다는 것**이 핵심이다.

## 5. Virtual Memory가 여기서 등장한다

프로세스가 보는 주소는 일반적으로 실제 RAM의 물리 주소와 동일하지 않다.

```text
Process가 보는 Virtual Address
           ↓
       주소 변환
           ↓
Physical Memory
```

따라서 프로그램의 관점에서는 자신만의 연속된 주소 공간을 가진 것처럼 보일 수 있다.

```text
Virtual Address Space
├─ Code
├─ Data
├─ Heap
└─ Stack
```

가상 메모리가 필요한 이유를 단순히 **RAM이 부족할 때 Disk를 사용하는 기술**로만 이해하면 이 구조가 보이지 않는다.

프로그램 실행 관점에서는 다음 역할이 중요하다.

```text
프로세스마다 독립된 주소 공간 제공
        ↓
다른 Process와 Memory 격리
        ↓
Virtual Address를 Physical Memory와 분리
        ↓
OS가 Memory를 유연하게 배치·관리
```

## 6. 실행 파일 전체를 처음부터 RAM에 올려야 할까

꼭 그렇지는 않다.

실행 파일의 영역을 프로세스의 가상 주소 공간에 Mapping해 두고, 실제 Page가 필요해질 때 Physical Memory에 준비하는 방식이 가능하다.

개념적으로 보면:

```text
Executable on Disk
        ↓ Mapping
Virtual Address Space
        ↓ 실제 접근 발생
필요한 Page 준비
        ↓
Physical Memory
```

이 지점에서 Loader와 Virtual Memory가 만난다.

즉 **Load = 실행 파일 전체를 RAM으로 복사**라고 외우기보다, 실행 파일의 필요한 부분을 프로세스 주소 공간에서 사용할 수 있도록 준비한다고 이해하는 편이 정확하다.

## 7. Dynamic Library는 언제 연결되는가

앞선 글에서 Static Linking과 Dynamic Linking을 구분했다.

Static Linking은 필요한 Library Code를 Build 시점에 실행 파일 쪽에 포함하는 방식이다.

Dynamic Linking에서는 일부 구현이 실행 파일 밖의 Shared Library에 남아 있다.

```text
Executable
   │ needs
   ↓
Shared Library
```

따라서 실행 시점에는 필요한 Shared Library를 찾고 프로세스의 주소 공간에 연결하는 과정이 추가될 수 있다.

```text
Executable
    ↓
Loader / Dynamic Linker
    ↓
Executable 영역 Mapping
    +
Shared Library Mapping
    ↓
실행 가능 상태
```

Compile Time의 선언, Link Time의 Symbol Resolution, Load/Runtime 시점의 Dynamic Linking은 서로 같은 단계가 아니다.

## 8. Entry Point는 왜 필요한가

실행 준비가 끝나면 CPU가 어디에서부터 실행을 시작해야 하는지 알아야 한다.

실행 파일에는 시작 위치를 나타내는 Entry Point 정보가 있다.

다만 C 프로그램의 `main()`이 곧 운영체제가 처음 점프하는 기계어 주소라고 단순화하면 안 된다.

개념적으로는 다음과 같은 시작 코드가 먼저 동작할 수 있다.

```text
OS가 Entry Point로 실행 전달
        ↓
Runtime Startup Code
        ↓
실행 환경 초기화
        ↓
main() 호출
```

즉 `main()`은 애플리케이션 개발자가 보는 시작점이고, 실행 파일과 Runtime 수준에서는 그보다 앞선 초기화 단계가 존재할 수 있다.

## 9. 전체 흐름을 다시 연결한다

이제 앞선 글과 이번 글을 이어 보면 다음과 같다.

아래 화살표는 변환과 실행 준비 순서를 나타낸다.

```text
Source
  ↓ Compile
Object File
  ↓ Link
Executable
  ↓ Execute
Loader
  ↓
Virtual Address Space 구성
  ↓
Code / Data / Library Mapping
  ↓
Process 실행 상태 준비
  ↓
Entry Point
  ↓
Runtime Startup
  ↓
Application Code 실행
```

여기까지 오면 디스크에 있던 프로그램이 실제 실행 상태가 된다.

## 10. 다음 질문

프로세스가 실행되기 시작하면 곧 다음 의문이 생긴다.

> **프로세스의 Virtual Address는 실제 RAM과 어떻게 연결되는가?**

이 질문은 Page, Page Table, MMU, TLB, Demand Paging으로 이어진다.

그리고 프로그램이 파일이나 네트워크 같은 운영체제 자원을 사용하려고 하면 또 다른 경계가 나타난다.

```text
Application
   ↓
System Call
   ↓
Kernel
```

다음 단계에서는 먼저 **프로세스와 가상 메모리가 실제로 어떻게 연결되는지**를 살펴본다.

## 기억 흐름

```text
Executable
= 디스크에 있는 실행 가능한 Program 표현

Loader
= Executable을 Process 주소 공간에서 실행 가능한 상태로 준비

Process
= OS가 관리하는 실행 인스턴스

Virtual Memory
= Process가 보는 주소 공간을 Physical Memory와 분리

Entry Point
= 실행 준비 후 Control을 넘길 시작 위치
```

핵심은 다음 한 줄이다.

> **실행 파일을 실행한다는 것은 파일을 그대로 CPU에 던지는 것이 아니라, 운영체제가 실행 파일을 해석해 주소 공간과 실행 상태를 준비하고 그 위에서 Instruction 실행을 시작하게 만드는 과정이다.**
