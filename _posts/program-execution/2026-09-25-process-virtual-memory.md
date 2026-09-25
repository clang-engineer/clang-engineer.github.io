---
title: 프로세스의 주소는 어떻게 실제 메모리로 이어지는가 - Virtual Memory
date: 2026-09-25 12:10:00 +0900
categories: [Program Execution]
tags: [process, virtual-memory, paging, page-table, mmu, tlb, page-fault]
---

> [Program Execution 전체 지도](./2026-09-25-index.md)


앞선 글에서는 실행 파일이 Loader를 거쳐 Process가 되는 흐름을 살펴봤다.

Process가 만들어지면 다음 질문이 생긴다.

> **프로그램이 사용하는 주소는 실제 RAM의 어느 위치를 가리키는가?**

처음에는 Process가 RAM의 특정 영역을 직접 사용하는 것처럼 생각하기 쉽다. 현대 운영체제에서는 보통 그 사이에 **Virtual Memory(가상 메모리)**라는 주소 추상화가 있다.

## 1. Process가 보는 주소와 RAM 주소는 다를 수 있다

프로그램 안에서 Pointer가 어떤 주소를 가지고 있다고 하자.

그 주소를 곧바로 Physical Memory의 주소라고 생각하면 여러 Process가 동시에 실행될 때 문제가 생긴다.

```text
Process A
Process B
Process C
    ↓
하나의 Physical Memory를 함께 사용
```

각 Process가 물리 주소를 직접 기준으로 동작한다면 서로의 Memory 배치를 알아야 하고, 잘못된 접근이 다른 Process의 Memory를 침범하는 문제도 다루기 어려워진다.

그래서 Process가 보는 주소 공간과 실제 Physical Memory의 배치를 분리한다.

```text
Process가 보는 Virtual Address
            ↓ 주소 변환
Physical Address
            ↓
           RAM
```

가상 메모리의 핵심은 단순히 **RAM이 부족할 때 Disk를 대신 쓰는 것**이 아니다.

> **Process가 사용하는 주소 공간을 실제 Physical Memory 배치와 분리하는 것**이 먼저다.

## 2. 왜 Paging이 필요한가

Process를 Physical Memory의 연속된 한 덩어리에만 배치한다고 생각해 보자.

```text
Physical Memory
┌──────────────┐
│ OS           │
├──────────────┤
│ Process A    │
├──────────────┤
│ Process B    │
├──────────────┤
│ Free         │
└──────────────┘
```

Process가 생성되고 종료되며 크기도 달라지면 큰 연속 공간을 확보하기 어려워질 수 있다.

여기서 질문이 생긴다.

> **Process의 Memory를 꼭 물리적으로 연속해서 배치해야 할까?**

Paging은 Virtual Address Space를 고정 크기의 Page로, Physical Memory를 같은 크기의 Frame으로 나눈다.

```text
Virtual Pages          Physical Frames

Page 0 ──────────────→ Frame 4
Page 1 ──────────────→ Frame 1
Page 2 ──────────────→ Frame 7
```

Process 입장에서는 Page가 연속된 주소 공간에 있는 것처럼 보이지만 실제 RAM에서는 서로 떨어진 Frame에 배치될 수 있다.

## 3. Page와 Frame의 대응은 누가 기억할까

Page가 어느 Frame에 있는지 어딘가에는 기록해야 한다.

그 역할을 하는 핵심 구조가 Page Table이다.

```text
Virtual Page
    ↓ 조회
Page Table
    ↓
Physical Frame
```

각 Process는 자신의 Virtual Address Space를 가지므로 주소 변환 정보도 Process의 실행 문맥과 연결된다.

이제 CPU가 Memory를 읽는 흐름을 단순화하면 다음과 같다.

아래 화살표는 주소 변환과 Memory 접근 순서를 나타낸다.

```text
CPU가 Virtual Address 생성
          ↓
Virtual Page Number 확인
          ↓
Page Table에서 Frame Mapping 확인
          ↓
Physical Address 결정
          ↓
RAM 접근
```

하지만 Memory를 읽을 때마다 Page Table을 여러 번 조회한다면 주소 변환 자체가 큰 비용이 될 수 있다.

그래서 TLB가 등장한다.

## 4. MMU와 TLB는 무엇을 맡는가

MMU(Memory Management Unit)는 CPU가 만든 Virtual Address를 Physical Address로 변환하는 Hardware다.

```text
CPU
 ↓ Virtual Address
MMU
 ↓ 주소 변환
Physical Address
 ↓
Memory
```

Page Table은 주소 대응 정보를 제공하지만, 최근 사용한 변환 결과를 더 빠르게 찾기 위해 TLB(Translation Lookaside Buffer)를 사용한다.

TLB는 **주소 변환 결과를 위한 Cache**다.

```text
Virtual Address
      ↓
     TLB
   ├─ Hit  → 변환 결과 바로 사용
   └─ Miss → Page Table 확인
                ↓
             변환 결과
```

TLB가 Cache라고 해서 일반적인 CPU Data Cache와 같은 역할을 하는 것은 아니다.

```text
Data Cache
→ 실제 Data 접근을 빠르게 함

TLB
→ Virtual → Physical 주소 변환을 빠르게 함
```

## 5. 모든 Page가 항상 RAM에 있어야 할까

Paging으로 Virtual Page와 Physical Frame을 분리하고 나면 또 하나의 질문이 생긴다.

> **Process의 모든 Page를 실행 시작부터 RAM에 올려둘 필요가 있을까?**

항상 사용하지 않는 Code와 Data까지 RAM을 차지하게 할 필요는 없다.

필요한 Page를 실제 접근 시점에 준비하는 방식을 Demand Paging이라고 한다.

```text
Process가 Page 접근
       ↓
현재 RAM에 Page가 있는가?
├─ Yes → 그대로 접근
└─ No
    ↓
Page Fault
    ↓
OS가 필요한 Page 준비
    ↓
Page Table 갱신
    ↓
Instruction 실행 재개
```

Page Fault는 이름 때문에 항상 비정상 오류처럼 느껴질 수 있지만, Demand Paging에서는 **필요한 Page가 현재 Physical Memory에 없음을 알리는 정상적인 사건**일 수 있다.

다만 Storage I/O가 필요하면 CPU·RAM 접근보다 훨씬 큰 비용이 발생할 수 있다.

## 6. Physical Frame이 부족하면 어떻게 할까

빈 Frame이 있다면 필요한 Page를 그곳에 넣으면 된다.

문제는 빈 Frame이 없을 때다.

```text
Page Fault
   ↓
빈 Frame?
├─ 있음 → Page 적재
└─ 없음
    ↓
기존 Page 중 하나를 내보냄
    ↓
Page Replacement
```

여기서 Page Replacement Algorithm이 등장한다.

하지만 프로그램 실행 관점에서 먼저 기억할 것은 Algorithm 이름이 아니다.

```text
Physical Frame
= 한정된 자원

여러 Process / Page
= Frame을 경쟁

Frame 부족
= 어떤 Page를 유지할지 결정 필요
```

즉 Replacement는 **한정된 Physical Memory를 어떻게 운영할 것인가**라는 OS 자원 관리 문제다.

## 7. 주소 변환은 누가 하고, 정책은 누가 결정할까

Virtual Memory에서는 Hardware와 OS가 함께 동작한다.

```text
CPU / MMU / TLB
→ 주소 변환을 빠르게 수행하는 Hardware Mechanism

OS
→ Process별 주소 공간과 Page Table 관리
→ Frame 배분
→ Page Fault 처리
→ Replacement 정책 수행
```

이 경계를 구분하면 컴퓨터 구조와 운영체제에서 Virtual Memory를 모두 다루는 이유도 보인다.

```text
Computer Architecture 관점
→ 주소를 어떻게 빠르게 변환하는가?
→ MMU / TLB

Operating System 관점
→ 누구에게 어떤 Memory를 배분하고 보호할 것인가?
→ Address Space / Frame / Page Fault / Replacement
```

같은 Virtual Memory를 보지만 질문이 다르다.

## 8. Loader와 Virtual Memory를 다시 연결한다

앞선 글에서 Loader가 Executable을 Process의 주소 공간에서 실행 가능한 상태로 준비한다고 했다.

이제 그 의미를 조금 더 구체적으로 볼 수 있다.

```text
Executable
    ↓
Loader / OS
    ↓
Process의 Virtual Address Space에 Mapping
    ↓
실제 접근
    ↓
필요한 Page를 Physical Frame에 준비
    ↓
MMU가 Virtual Address를 Physical Address로 변환
    ↓
CPU가 Instruction / Data 접근
```

즉 **Load = 실행 파일 전체를 RAM에 통째로 복사**라고 이해하면 Virtual Memory가 들어갈 자리가 사라진다.

실제로는 File과 Virtual Address Space를 Mapping하고, 필요한 Physical Page가 실행 과정에서 준비될 수 있다.

## 9. 전체 흐름

지금까지의 세 글을 연결하면 다음과 같다.

```text
Source Code
   ↓ Compile
Object File
   ↓ Link
Executable
   ↓ Load / Mapping
Process Virtual Address Space
   ↓
Virtual Address
   ↓
TLB / Page Table / MMU
   ↓
Physical Address
   ↓
RAM
```

여기까지 오면 **프로그램의 Code와 Data가 CPU와 Memory에서 어떻게 접근되는가**의 큰 경로가 보인다.

하지만 아직 한 가지 중요한 경계가 남아 있다.

프로그램이 File, Network, Process 생성 같은 기능을 사용하려면 CPU와 Memory만으로는 부족하다.

```text
Application
    ↓
?
    ↓
Kernel
```

이 사이를 연결하는 것이 System Call이다.

## 기억 흐름

```text
Paging
= 연속 Physical Memory 배치 요구를 줄임

Virtual Memory
= Process Address Space와 Physical Memory 배치를 분리

Page Table
= Virtual Page ↔ Physical Frame Mapping 정보

MMU
= Virtual Address를 Physical Address로 변환하는 Hardware

TLB
= 최근 주소 변환 결과를 저장하는 Cache

Demand Paging
= 필요한 Page를 실제 접근할 때 준비

Page Fault
= 필요한 Page가 현재 RAM에 없을 때 발생하는 사건
```

핵심은 다음 한 줄이다.

> **프로세스는 Physical Memory를 직접 자신의 주소 공간으로 사용하는 것이 아니라 Virtual Address Space를 기준으로 실행하며, OS가 관리하는 Mapping 정보와 MMU/TLB의 Hardware 지원을 통해 실제 Physical Memory에 접근한다.**
