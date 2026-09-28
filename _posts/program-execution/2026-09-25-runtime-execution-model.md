---
title: Runtime은 무엇을 하는가 - 언어별 실행 모델
date: 2026-09-25 13:10:00 +0900
categories: [Program Execution]
tags: [runtime, jvm, go-runtime, javascript-engine, wasm-runtime, jit]
---

> [Program Execution 전체 지도](./2026-09-25-index.md)

지금까지는 네이티브 프로그램을 기준으로 컴파일, 링크, Load, 프로세스, 가상 메모리, System Call을 따라왔다. 그런데 Java, Go, JavaScript, WebAssembly를 보면 실행 구조가 서로 다르다.

> **Runtime이 있다는 말은 정확히 무엇이며, 언어마다 Runtime은 어디에서 어떤 일을 맡는가?**

Runtime을 제품 이름처럼 외우기보다 실행 책임이 어디에 놓이는지 비교해 본다.

## 1. Runtime은 있다/없다보다 역할을 본다

`C++에는 Runtime이 없고 Java에는 Runtime이 있다`처럼 둘로 나누면 실제 구조를 놓치기 쉽다.

먼저 **Runtime과 실행 환경(Execution Environment)을 같은 말로 보지 않는다.** 모든 프로그램은 CPU와 메모리를 포함해 자신이 실행될 수 있는 환경이 필요하지만, 모든 프로그램에 JVM 같은 별도의 런타임 소프트웨어가 필요한 것은 아니다.

여기서 Runtime은 프로그램이 실행되는 동안 **언어와 프로그램의 실행 자체를 지원하는 Software 계층이나 코드**를 뜻한다. 시작·종료 처리처럼 얇은 Runtime Support일 수도 있고, JVM처럼 Bytecode 실행·JIT·GC까지 맡는 큰 실행 계층일 수도 있다.

차이는 Runtime이 단순히 있다/없다가 아니라 **어디에 있고 무엇을 얼마나 맡느냐**다.

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

별도의 VM이 애플리케이션 명령어을 실행하는 구조는 기본적으로 필요하지 않는다.

그렇다고 실행 지원이 전혀 없는 것은 아니다. Program Startup, 표준 라이브러리, 예외 처리 등 Runtime 지원이 존재할 수 있다.

즉 C++은 **Native 실행 + 비교적 얇은 Runtime/라이브러리 지원**을 기준점으로 볼 수 있다.

여기서 `Native 실행 = Runtime이 전혀 없음`으로 이해하면 안 된다.

```text
Native Executable
      ↓
OS Loader
      ↓
Process
      ↓
Native Machine Code
      ↓
CPU
      ↕
OS / System Call
```

Native 실행의 핵심은 **애플리케이션의 Machine 코드를 CPU가 직접 실행한다**는 것이다. Java Bytecode를 JVM이 실행하거나 Wasm Module을 Wasm Runtime이 실행하는 것처럼, 애플리케이션 명령어을 대신 실행하는 별도의 VM이나 Interpreter가 필수로 끼어 있지 않는다.

하지만 프로그램 실행을 돕는 Runtime 지원까지 사라지는 것은 아니다. C/C++ 환경에서는 구현과 빌드 방식에 따라 CRT(C Runtime, 프로그램 시작·종료 등을 지원하는 코드)와 표준 라이브러리 등이 실행을 지원할 수 있다.

이 지원 코드와 라이브러리가 **반드시 모두 실행 파일 안에 들어 있어야 하는 것도 아니다.** 빌드·링크 방식에 따라 필요한 코드를 정적으로 포함하거나, 실행 시 외부 공유 라이브러리에 동적으로 의존할 수 있다. 이 차이는 [컴파일러와 링커](./2026-09-25-compiler-object-linker.md)의 Static/Dynamic Linking과 연결된다.

```text
Application Machine Code ─────────────→ CPU
        │
        ├─ Runtime / Library 지원
        │      ├─ CRT
        │      └─ libc 등
        │
        └─ OS 기능 필요
               ↓
          System Call
               ↓
             Kernel
```

따라서 `Runtime`이라는 말을 사용할 때는 무엇을 뜻하는지 구분해야 한다.

```text
실행 환경(Runtime Environment)
→ 프로그램이 실행되는 전체 환경

Runtime Support / Library
→ 시작·종료, 표준 Library 등 실행 지원

Language Execution Runtime
→ JVM, Wasm Runtime처럼
  중간 표현을 실제 실행으로 이어 주는 실행 계층
```

모든 프로그램에는 어떤 형태로든 **실행 환경**이 필요하지만, 모든 프로그램에 JVM 같은 **Language Execution Runtime**이 필요한 것은 아니다.

> **Native의 핵심은 Runtime이 없다는 것이 아니라, 애플리케이션 Machine 코드를 CPU가 직접 실행한다는 것이다.**

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

Bytecode는 실제 CPU ISA가 아니라 JVM이 이해하는 Instruction Set이다. CPU의 ISA와 Instruction Set의 관계는 [기계어는 CPU에서 어떻게 실행되는가 - ISA와 Instruction Cycle](./2026-09-25-cpu-isa-execution.md)에서 별도로 다룬다.

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

Platform 차이가 사라진 것이 아니라 **애플리케이션 Bytecode와 실제 Platform 사이에 JVM이 들어가 차이를 흡수하는 구조**다.

## 4. Go - Runtime을 Native 바이너리 안에 함께 둔다

Go는 일반적으로 Native 실행 파일을 만든다. 하지만 GC, Goroutine Scheduling, Stack 관리 같은 기능을 Go Runtime이 담당한다.

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

Java처럼 별도의 VM이 애플리케이션 Bytecode를 실행하는 구조와는 다르다.

**Native 바이너리로 실행하지만 Runtime 기능이 바이너리와 밀접하게 함께 간다**는 것이 좋은 비교점이다.

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

## 6. WebAssembly - 여러 언어의 공통 실행 타깃

WebAssembly는 특정 소스 Language 하나를 위한 Runtime이 아니다.

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

Wasm Runtime은 Wasm Module을 검증하고 Host 환경에서 실행 가능한 코드로 변환·실행한다.

Wasm Core 자체는 File System이나 Network 같은 완성된 OS 환경을 제공하지 않는다. 필요한 기능은 Browser Host API나 WASI 같은 System 인터페이스와 연결된다.

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

JIT(Just-In-Time Compilation)는 실행 중 필요한 코드를 네이티브 코드로 컴파일하는 전략이고, AOT(Ahead-Of-Time Compilation)는 실행 전에 코드를 미리 컴파일하는 전략이다.

하나의 Runtime이 Interpreter, Baseline JIT, Optimizing JIT, AOT를 조합할 수도 있다.

## 8. Runtime과 커널은 같은 계층이 아니다

Runtime이 Thread Scheduling이나 메모리 관리를 한다고 해서 커널을 대체하는 것은 아니다.

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

Runtime Scheduler는 Runtime 수준의 실행 단위를 어떤 OS Thread에서 실행할지 관리한다. 커널 Scheduler는 OS가 관리하는 실행 단위를 실제 CPU에 언제 배치할지 결정한다.

Runtime이 File, Socket, Thread 같은 OS 자원가 필요하면 결국 OS API와 System Call 경계를 사용한다.

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

반대로 Runtime 자체의 Startup, 메모리, 복잡도 같은 비용이 생길 수 있다.

Native 중심 실행에서는 실행 구조가 더 직접적일 수 있지만 메모리나 Resource Lifetime 같은 책임이 컴파일러, 라이브러리, 개발자 쪽에 더 많이 남을 수 있다.

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
