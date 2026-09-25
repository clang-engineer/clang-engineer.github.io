---
title: 기계어는 CPU에서 어떻게 실행되는가 - ISA와 Instruction Cycle
date: 2026-09-25 13:30:00 +0900
categories: [Program Execution]
tags: [cpu, isa, instruction-cycle, register, pipeline, machine-code]
---

> [Program Execution 전체 지도](./2026-09-25-index.md)

지금까지 Source Code가 Compile되고, Link되고, Process가 되어 Memory에 배치되고, 필요할 때 Kernel Service를 요청하는 흐름을 따라왔다.

마지막에는 결국 CPU가 Machine Code를 실행한다.

> **Compiler가 만든 Machine Code는 CPU 안에서 실제로 어떻게 실행되는가?**

## 1. Source Code와 CPU 사이의 마지막 경계

C++ 같은 Native Compile을 기준으로 보면:

```text
C++ Source
   ↓ Compiler
Machine Code
   ↓
CPU
```

하지만 CPU는 C++의 `if`, `for`, Class 같은 개념을 직접 이해하지 않는다.

CPU가 이해하는 것은 자신의 ISA(Instruction Set Architecture, 명령어 집합 구조)에 정의된 Instruction이다.

```text
High-level Language
        ↓ Compiler
ISA에 맞는 Machine Instruction
        ↓
CPU 구현
```

## 2. ISA는 CPU와 Software 사이의 약속이다

ISA는 CPU가 Software에 보여주는 명령어 수준의 Interface다.

대표적으로 다음과 같은 것을 정의한다.

```text
어떤 Instruction이 있는가?
어떤 Register를 사용할 수 있는가?
Data를 어떤 방식으로 다루는가?
Memory Addressing은 어떻게 표현하는가?
Branch와 Function Call은 어떻게 표현하는가?
```

x86-64와 ARM64가 서로 다른 Binary를 사용하는 이유도 이 지점에서 보인다.

```text
같은 Source
   │
   ├─ x86-64 Target → x86-64 Instruction
   │
   └─ ARM64 Target  → ARM64 Instruction
```

Compiler의 Target을 바꾸면 같은 Source에서도 서로 다른 ISA용 Machine Code가 만들어질 수 있다.

## 3. ISA와 CPU 구현은 같은 것이 아니다

ISA가 같다고 CPU 내부 구조까지 같은 것은 아니다.

```text
ISA
= Software가 볼 수 있는 Instruction 규약

Microarchitecture
= 그 ISA를 실제 Hardware 내부에서 구현하는 방식
```

예를 들어 같은 x86-64 ISA를 실행하는 CPU라도 Pipeline, Cache, Execution Unit, Branch Predictor 같은 내부 구조는 서로 다를 수 있다.

Software는 ISA라는 공통 경계를 기준으로 실행되고, CPU 제조사는 그 규약을 지키면서 내부 구현을 다르게 설계할 수 있다.

## 4. CPU는 Instruction을 어떻게 실행할까

가장 단순한 모델은 Instruction Cycle이다.

```text
Fetch
  ↓
Decode
  ↓
Execute
  ↓
결과 반영
  ↓
다음 Instruction
```

### Fetch

Program Counter가 가리키는 위치에서 다음 Instruction을 가져온다.

### Decode

가져온 Bit Pattern이 어떤 Instruction이고 어떤 Operand를 사용하는지 해석한다.

### Execute

ALU 연산, Memory 접근, Branch 같은 실제 동작을 수행한다.

### 결과 반영

결과를 Register나 Memory에 반영하고 다음 Instruction으로 진행한다.

이 모델은 CPU 내부 구현을 모두 설명하는 것은 아니지만 **Machine Code가 실행된다는 말의 기준점**을 제공한다.

## 5. Register는 왜 필요한가

CPU가 계산할 때 매번 RAM을 직접 사용하면 Memory 접근 비용이 크다.

CPU 내부에는 매우 빠르게 접근할 수 있는 Register가 있다.

```text
Memory
  ↓ Load
Register
  ↓ 연산
Register
  ↓ Store
Memory
```

Compiler는 ISA와 ABI 규칙을 고려해 어떤 값을 Register에 둘지 결정한다.

여기서 앞서 살펴본 ABI와 ISA가 만난다.

```text
ISA
→ 어떤 Register와 Instruction이 존재하는가

ABI
→ 그 Register를 함수 호출에서 어떻게 사용할 것인가

Compiler
→ 두 규칙에 맞춰 Machine Code 생성
```

## 6. Virtual Memory와 CPU도 여기서 만난다

CPU가 Instruction을 실행하다 Memory에 접근하면 Program이 사용하는 주소는 일반적으로 Virtual Address다.

```text
CPU Instruction
   ↓ Memory 접근
Virtual Address
   ↓ MMU / TLB
Physical Address
   ↓
Cache / RAM
```

따라서 앞서 본 Virtual Memory는 운영체제만의 추상 개념으로 끝나지 않는다. 실제 Instruction 실행 중 CPU의 Memory 접근 경로에 들어간다.

## 7. 실제 CPU는 한 Instruction씩 단순하게 기다리지 않는다

기본 Instruction Cycle은 이해를 위한 출발점이다.

현대 CPU는 성능을 높이기 위해 여러 Instruction의 단계를 겹쳐 처리하는 Pipeline을 사용할 수 있다.

```text
Instruction A : Fetch → Decode → Execute
Instruction B :         Fetch → Decode → Execute
Instruction C :                 Fetch → Decode → Execute
```

여기에 Superscalar, Out-of-Order Execution, Branch Prediction 같은 기법이 더해질 수 있다.

하지만 이것들은 ISA와 다른 층의 개념이다.

```text
ISA
→ Software와 CPU 사이의 Instruction 규약

Microarchitecture
→ 그 Instruction을 빠르게 실행하기 위한 CPU 내부 구현
```

따라서 프로그램 실행의 큰 그림을 잡는 단계에서는 둘을 섞지 않는 것이 중요하다.

## 8. Runtime을 사용하는 언어도 결국 CPU로 내려온다

Java나 JavaScript처럼 Runtime이 중간에 있어도 실제 Hardware에서 실행되는 마지막 단계는 Native Instruction이다.

```text
Java Bytecode
   ↓ JVM / JIT
Native Machine Code
   ↓
CPU

JavaScript
   ↓ JS Engine / JIT
Native Machine Code
   ↓
CPU

WebAssembly
   ↓ Wasm Runtime
Native Machine Code
   ↓
CPU
```

중간 실행 계층이 있다는 것은 CPU가 Bytecode나 JavaScript Source를 직접 이해한다는 뜻이 아니다.

Runtime 자체도 Native Program이며, 필요한 Code를 해석하거나 Native Code로 변환하여 실제 CPU에서 실행한다.

## 9. 전체 시리즈를 한 번에 연결한다

```text
Source Code
    ↓
Compiler
    ↓
Object File
    ↓
Linker
    ↓
Executable
    ↓
Loader
    ↓
Process / Virtual Address Space
    ↓
Runtime / Library
    ↓
System Call ─────→ Kernel / Device
    │
    ↓
Machine Code
    ↓
ISA
    ↓
CPU Microarchitecture
    ↓
Register / Cache / Memory / Execution Unit
```

이 Diagram에서 모든 화살표가 같은 의미는 아니다. 위쪽은 주로 변환과 실행 준비의 흐름이고, System Call 쪽은 Kernel Service 요청, CPU 쪽은 Instruction 실행 계층을 나타낸다.

## 기억 흐름

```text
Machine Code
= 특정 ISA의 Instruction을 Binary로 표현한 것

ISA
= Software와 CPU 사이의 Instruction 규약

Microarchitecture
= ISA를 실제 CPU 내부에서 구현하는 방식

Instruction Cycle
= Fetch → Decode → Execute

Register
= CPU 내부에서 연산에 사용하는 빠른 저장 공간
```

> **Compiler가 만든 Machine Code는 특정 ISA의 Instruction이며, CPU는 그 ISA를 구현한 Microarchitecture를 통해 Instruction을 Fetch·Decode·Execute한다. 결국 우리가 작성한 Source Code의 실행은 이 지점에서 실제 Hardware 동작으로 이어진다.**
