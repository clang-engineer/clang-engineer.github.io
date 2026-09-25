---
title: Runtime은 무엇을 하는가 - 언어별 실행 모델
date: 2026-09-25 13:10:00 +0900
categories: [Program Execution]
tags: [runtime, jvm, go-runtime, javascript-engine, wasm-runtime, jit]
---

> [Program Execution 전체 지도](./2026-09-25-index.md)

지금까지는 Native Program을 기준으로 Compile, Link, Load, Process, Virtual Memory, System Call을 따라왔다. 그런데 Java, Go, JavaScript, WebAssembly를 보면 실행 구조가 서로 다르다.

> **Runtime이 있다는 말은 정확히 무엇이며, 언어마다 Runtime은 어디에서 어떤 일을 맡는가?**

Runtime을 제품 이름처럼 외우기보다 실행 책임이 어디에 놓이는지 비교해 본다.

## 1. Runtime은 있다/없다보다 역할을 본다

`C++에는 Runtime이 없고 Java에는 Runtime이 있다`처럼 둘로 나누면 실제 구조를 놓치기 쉽다.

Program이 실행되려면 시작과 종료, Library 지원, Memory 관리 등 어떤 형태로든 실행 지원이 필요할 수 있다. 차이는 **그 기능이 어디에 있고 얼마나 많은 책임을 맡느냐**다.

다음 네 질문을 기준으로 보면 언어별 구조를 비교하기 쉽다.

```text
1. 언제 바꾸는가?
   → 실행 전 / 실행 중

2. 무엇으로 바꾸는가?
   → Native Code / Bytecode / 중간 표현

3. 누가 실행하는가?
   → CPU / VM / Interpreter

4. Runtime은 어디에 있고 무엇을 맡는가?
   → 별도 환경 / Binary 내부 / 비교적 얇은 지원
```

## 2. C++ - Native 실행을 기준점으로 본다

```text
C++ Source
   ↓ Compile
Object File
   ↓ Link
Native Executable
   ↓ Loader
Process
   ↓
CPU
```

별도의 VM이 Application Instruction을 실행하는 구조는 기본적으로 필요하지 않는다.

그렇다고 실행 지원이 전혀 없는 것은 아니다. Program Startup, 표준 Library, 예외 처리 등 Runtime 지원이 존재할 수 있다.

즉 C++은 **Native 실행 + 비교적 얇은 Runtime/Library 지원**을 기준점으로 볼 수 있다.

## 3. Java - JVM이 중간 실행 계층을 맡는다

```text
.java Source
   ↓ javac
.class Bytecode
   ↓
JVM
   ├─ Bytecode 실행
   ├─ JIT Compile
   ├─ GC
   └─ Runtime Service
        ↓
Native Code
        ↓
CPU
```

Bytecode는 실제 CPU ISA가 아니라 JVM이 이해하는 Instruction Set이다.

Platform마다 JVM 구현이 있으면 같은 Bytecode를 실행할 수 있다.

```text
            같은 .class
               │
      ┌────────┼────────┐
      ↓        ↓        ↓
 Linux JVM  Windows JVM macOS JVM
      ↓        ↓        ↓
   각 OS / CPU 환경
```

Platform 차이가 사라진 것이 아니라 **Application Bytecode와 실제 Platform 사이에 JVM이 들어가 차이를 흡수하는 구조**다.

## 4. Go - Runtime을 Native Binary 안에 함께 둔다

Go는 일반적으로 Native Executable을 만든다. 하지만 GC, Goroutine Scheduling, Stack 관리 같은 기능을 Go Runtime이 담당한다.

```text
Go Source
   ↓ Compile
Native Executable
├─ Application Code
└─ Go Runtime
    ├─ GC
    ├─ Goroutine Scheduler
    └─ 실행 지원
         ↓
        OS
         ↓
        CPU
```

Java처럼 별도의 VM이 Application Bytecode를 실행하는 구조와는 다르다.

**Native Binary로 실행하지만 Runtime 기능이 Binary와 밀접하게 함께 간다**는 것이 좋은 비교점이다.

## 5. JavaScript - 언어, Engine, 실행 환경을 구분한다

JavaScript를 단순히 Interpreter Language라고 부르면 현대 구현을 설명하기 부족하다.

JavaScript Engine은 Parsing, 중간 표현, Interpreter/Baseline 실행, JIT Optimization 등을 조합할 수 있다.

```text
JavaScript Source
      ↓ Parse
Internal Representation
      ↓
Interpreter / Baseline 실행
      ↓ Runtime Profile
Optimizing JIT
      ↓
Native Code
```

또 Engine과 Browser/Node.js 같은 실행 환경도 구분해야 한다.

```text
JavaScript
= Language

V8 등
= JavaScript Engine

Browser / Node.js
= Engine + I/O · Timer · Event Loop 등 실행 환경
```

특정 Engine의 내부 구현을 JavaScript 언어 자체의 규칙으로 일반화하지 않는다.

## 6. WebAssembly - 여러 언어의 공통 실행 Target

WebAssembly는 특정 Source Language 하나를 위한 Runtime이 아니다.

```text
C++ ──┐
Rust ─┼─→ Wasm
기타 ─┘
          ↓
     Wasm Runtime
          ↓
      Native Code
          ↓
         CPU
```

Wasm Runtime은 Wasm Module을 검증하고 Host 환경에서 실행 가능한 Code로 변환·실행한다.

Wasm Core 자체는 File System이나 Network 같은 완성된 OS 환경을 제공하지 않는다. 필요한 기능은 Browser Host API나 WASI 같은 System Interface와 연결된다.

JVM과 Wasm은 **중간 실행 표현과 Runtime을 둔다**는 점은 비슷하지만 목적과 Runtime이 제공하는 범위는 다르다.

## 7. AOT, Interpreter, JIT는 언어의 고정 속성이 아니다

```text
C++ = Compile
JavaScript = Interpret
Java = JIT
```

처럼 외우면 실제 구현을 설명하기 어렵다.

더 정확한 질문은 다음이다.

```text
언제 Code를 바꾸는가?
무엇으로 바꾸는가?
중간 표현이 있는가?
실행 중 다시 Compile하는가?
Runtime Profile을 사용하는가?
```

JIT(Just-In-Time Compilation)는 실행 중 필요한 Code를 Native Code로 Compile하는 전략이고, AOT(Ahead-Of-Time Compilation)는 실행 전에 Code를 미리 Compile하는 전략이다.

하나의 Runtime이 Interpreter, Baseline JIT, Optimizing JIT, AOT를 조합할 수도 있다.

## 8. Runtime과 Kernel은 같은 계층이 아니다

Runtime이 Thread Scheduling이나 Memory 관리를 한다고 해서 Kernel을 대체하는 것은 아니다.

Go를 단순화하면:

```text
Goroutine
   ↓
Go Runtime Scheduler
   ↓
OS Thread
   ↓
Kernel Scheduler
   ↓
CPU
```

Runtime Scheduler는 Runtime 수준의 실행 단위를 어떤 OS Thread에서 실행할지 관리한다. Kernel Scheduler는 OS가 관리하는 실행 단위를 실제 CPU에 언제 배치할지 결정한다.

Runtime이 File, Socket, Thread 같은 OS Resource가 필요하면 결국 OS API와 System Call 경계를 사용한다.

## 9. Runtime을 두면 무엇이 달라지는가

Runtime에 기능을 두면 언어 구현이 공통으로 제공할 수 있는 것이 많아진다.

```text
Runtime
├─ GC
├─ JIT
├─ Thread / Task Scheduling
├─ Exception 처리
├─ Dynamic Type 지원
├─ Module / Class Loading
└─ Runtime Profile 기반 최적화
```

반대로 Runtime 자체의 Startup, Memory, 복잡도 같은 비용이 생길 수 있다.

Native 중심 실행에서는 실행 구조가 더 직접적일 수 있지만 Memory나 Resource Lifetime 같은 책임이 Compiler, Library, 개발자 쪽에 더 많이 남을 수 있다.

어느 방식이 절대적으로 더 좋다는 뜻은 아니다. 언어가 제공하려는 의미론과 실행 목표에 따라 선택이 달라진다.

## 10. 한 장에 비교한다

```text
C++
Source → AOT → Native Code → CPU

Java
Source → Bytecode → JVM → Interpret / JIT → Native Code → CPU

Go
Source → AOT → Native Binary + Go Runtime → CPU

JavaScript
Source → JS Engine → Interpret / JIT 등 → Native Code → CPU

WebAssembly
Source Language → Wasm → Wasm Runtime → Native Code → CPU
```

Runtime은 특정 언어에만 존재하는 특별한 물건이라기보다 **언어와 Program이 요구하는 실행 기능을 어느 계층에서 맡길 것인가**라는 설계 문제로 보는 편이 정확하다.

## 기억 흐름

```text
Runtime을 볼 때 네 질문

언제 바꾸나?
무엇으로 바꾸나?
누가 실행하나?
Runtime은 어디에 있고 무엇을 맡나?
```

> **Runtime은 있다/없다로 나누기보다 Program 실행에 필요한 기능을 어느 계층이 맡고, 실제 Native 실행까지 어떤 경로를 거치는지로 이해한다.**
