---
title       : "JVM 구조와 작동 원리 — Bytecode가 CPU에서 실행되기까지"
description : "Java Roadmap의 JVM 영역을 Zoom-in해 Class Loading, Linking/Initialization, Runtime Data Areas, Frame, Interpreter/JIT, GC와 Native 경계를 하나의 실행 흐름으로 연결한다."
date        : 2026-09-29 12:50:00 +0900
updated     : 2026-09-29 12:50:00 +0900
categories  : [java, "언어·런타임"]
tags        : [java, jvm, bytecode, classloader, jit, gc]
pin         : false
hidden      : false
---

Java 전체 지형에서 JVM은 **Java 소스 코드와 실제 OS/CPU 실행 사이의 Runtime 계층**에 있다.

```text
Java Language
     ↓
.java Source
     ↓ javac
.class Bytecode
     ↓
┌──────── JVM ────────┐
│ Loading             │
│ Linking             │
│ Initialization      │
│ Runtime Data Areas  │
│ Execution           │
│ GC / Native Bridge  │
└─────────────────────┘
     ↓
Native Execution
     ↓
OS / CPU
```

이 글은 JVM 구성요소를 외우는 것이 아니라 **`.class`가 들어온 뒤 무엇이 어떤 순서로 필요해지는가**를 따라간다.

## 1. JVM은 무엇을 실행하는가

`javac`이 만드는 `.class`는 특정 CPU의 x86-64나 ARM64 기계어가 아니라 **JVM Instruction Set을 사용하는 Bytecode와 실행 메타데이터**를 담는 class file format이다.

```text
.java
 ↓ javac
.class
 ├─ Bytecode
 ├─ Constant Pool
 ├─ Field / Method 정보
 └─ 기타 Metadata
```

따라서 CPU가 `.class`를 직접 실행하는 것이 아니다.

```text
.class
  ↓
JVM이 읽고 실행
  ↓
필요하면 Native Code로 변환
  ↓
CPU
```

이 지점이 네이티브 실행 모델과 Java 실행 모델이 갈라지는 핵심이다.

## 2. 실행하려면 먼저 Class를 JVM 안으로 가져와야 한다

JVM은 필요한 Class와 Interface를 동적으로 **Loading → Linking → Initialization**한다.

```text
.class Binary
     ↓
Loading
     ↓
Linking
├─ Verification
├─ Preparation
└─ Resolution
     ↓
Initialization
     ↓
실행 가능한 JVM Runtime State
```

### Loading

Class Loader가 Class의 Binary Representation을 찾아 JVM 내부의 Class/Interface 표현을 만든다.

여기서 중요한 점은 Class의 정체성이 이름만으로 결정되지 않는다는 것이다.

```text
Class Identity
=
Fully Qualified Class Name
+
Defining Class Loader
```

따라서 이름이 같은 Class라도 서로 다른 Class Loader가 정의하면 JVM에서는 다른 Type이 될 수 있다.

### Linking

Loading된 Class를 실제 실행 상태에 연결한다.

```text
Verification
→ class file과 Bytecode가 JVM 제약을 만족하는지 검사

Preparation
→ static field 등을 위한 실행 준비

Resolution
→ Constant Pool의 Symbolic Reference를 실제 Class·Field·Method와 연결
```

Resolution은 구현과 실행 상황에 따라 필요한 시점까지 늦춰질 수 있다.

### Initialization

Class 초기화 메서드 `<clinit>`를 실행해 static field initializer와 static block 같은 Class 초기화 로직을 수행한다.

즉 다음 셋은 같은 작업이 아니다.

```text
Loading
→ Class를 JVM 안에 가져온다

Linking
→ 실행할 수 있도록 검증·준비·참조 연결

Initialization
→ Class의 static 초기화 코드를 실행
```

## 3. 가져온 Class와 실행 상태는 어디에 존재하는가

이제 JVM 내부의 **Runtime Data Areas**로 Zoom-in한다.

```text
JVM Runtime Data Areas

JVM 전체에서 공유
├─ Heap
└─ Method Area
   └─ Run-Time Constant Pool

Thread마다 존재
├─ pc Register
├─ JVM Stack
│  └─ Frame
└─ Native Method Stack
```

이 구분에서 먼저 기억할 것은 **공유 영역과 Thread별 영역**이다.

### Heap

Object와 Array가 할당되는 공유 Runtime 영역이다.

```text
new Member()
     ↓
Heap
     ↓
Object
```

Heap은 모든 JVM Thread가 공유하며 Garbage Collection의 주요 대상이다.

### Method Area

Class별 구조, Method/Field 정보, Method Code 등 JVM이 Class를 실행하는 데 필요한 데이터를 보관하는 논리적 Runtime 영역이다.

HotSpot의 구체 구현인 Metaspace와 **JVMS의 Method Area라는 추상적 개념을 그대로 같은 말로 보지 않는다.**

### JVM Stack과 Frame

Method가 호출될 때 Thread의 JVM Stack에는 **Frame**이 만들어진다.

```text
Thread
  ↓
JVM Stack
├─ Frame: methodA
├─ Frame: methodB
└─ Frame: methodC ← 현재 실행
```

Frame의 핵심은:

```text
Frame
├─ Local Variables
├─ Operand Stack
└─ 현재 Method 실행에 필요한 상태
```

Bytecode는 Register 중심 CPU Instruction과 달리 Operand Stack을 적극적으로 사용하는 Stack Machine 모델을 가진다.

예를 들어 개념적으로:

```text
값 push
값 push
iadd
 ↓
두 값을 Operand Stack에서 꺼내 더함
 ↓
결과를 다시 Stack에 push
```

처럼 실행된다.

## 4. Bytecode는 누가 실제로 실행하는가

여기서 **Execution Engine**이라는 구현 관점으로 넘어간다.

```text
Bytecode
   ↓
JVM Implementation
   ├─ Interpreter
   └─ JIT Compiler
          ↓
       Native Code
          ↓
         CPU
```

중요한 경계가 있다.

**JVMS는 JVM이 지켜야 하는 추상 실행 모델을 정의하지만, Interpreter/JIT의 구체 전략은 JVM 구현체가 선택한다.**

HotSpot 같은 JVM 구현체는 Bytecode를 실행하면서 반복적으로 실행되는 Code를 Native Code로 Compile해 이후 실행 비용을 줄일 수 있다.

따라서 Java를 단순히:

```text
Java = Interpreter Language
```

라고 보는 것은 부정확하다.

더 정확한 그림은:

```text
Bytecode
   ↓
Interpreter로 실행 가능
   ↓
Runtime Profile 수집
   ↓
Hot Code
   ↓ JIT
Native Code
   ↓
CPU 직접 실행
```

이다.

## 5. GC는 JVM 실행 모델의 어디에 있는가

Java Code는 일반적으로 Object의 물리 메모리 해제를 직접 호출하지 않는다.

```text
Object 생성
   ↓
Heap
   ↓
Reachability 변화
   ↓
더 이상 도달할 수 없는 Object
   ↓
GC가 회수 가능한 대상으로 판단
```

하지만 **GC Algorithm 자체는 JVM Specification이 하나로 고정하지 않는다.**

즉:

```text
JVM Specification
→ Heap과 자동 Storage Management의 계약

JVM Implementation
→ 실제 GC Algorithm과 Heap Layout 선택
```

으로 구분한다.

G1, ZGC 같은 구체 Collector는 이 문서의 다음 세부가 아니라 **GC 자체가 필요할 때 별도로 Zoom-in할 영역**이다.

## 6. Native Code와 OS 경계는 사라지지 않는다

JVM 안에서 실행한다고 OS와 CPU가 없어지는 것은 아니다.

```text
Java Application
      ↓
JVM
├─ Bytecode Execution
├─ JIT
├─ GC
└─ Runtime Services
      ↓
Native Code / Native Library
      ↓
OS System Call
      ↓
Kernel
      ↓
CPU / Hardware
```

Native Method가 필요하면 JVM은 Native Implementation과 연결할 수 있다. JVM 자체도 결국 현재 OS와 CPU 위에서 실행되는 Native Program이다.

따라서 Java의 Platform Independence는:

```text
같은 .class를
각 Platform용 JVM이 받아
그 Platform에서 실행한다
```

는 의미이지 CPU와 OS가 사라진다는 뜻이 아니다.

## 7. 처음부터 끝까지 다시 연결한다

이제 세부를 다시 전체 실행 흐름에 놓는다.

```text
.java Source
     ↓ javac
.class
     ↓
Class Loading
     ↓
Linking
├─ Verification
├─ Preparation
└─ Resolution
     ↓
Initialization
     ↓
Runtime Data Areas에 실행 상태 형성
     ↓
Method 호출
     ↓
Thread의 JVM Stack에 Frame 생성
     ↓
Bytecode 실행
     ↓
Interpreter / JIT
     ↓
Native Code
     ↓
OS / CPU
```

그리고 실행 중에는 옆에서:

```text
Heap
 ↕
Object Allocation
 ↕
Garbage Collection
```

이 함께 움직인다.

## 8. 다시 Java 전체 지형으로 Zoom-out

이 문서에서 본 것은 Java 전체가 아니라 **JVM / Runtime 영역 하나**다.

```text
Java
│
├─ Language
│
├─ JVM / Runtime        ← 지금 Zoom-in한 위치
│  ├─ Class Loading
│  ├─ Runtime Data Areas
│  ├─ Frame / Bytecode
│  ├─ Interpreter / JIT
│  └─ GC
│
├─ Standard Library
│
├─ Concurrency / JMM
│
└─ Ecosystem
   ├─ Gradle
   └─ JPA / Hibernate
```

다음에 더 내려갈 수 있는 지점은 서로 다르다.

```text
Class Loading이 궁금하다
→ Class Loader / Delegation

메모리가 궁금하다
→ Heap / Stack / Metaspace / GC

성능이 궁금하다
→ Interpreter / JIT / Code Cache

동시성이 궁금하다
→ Java Memory Model / happens-before

Native 경계가 궁금하다
→ JNI / Native Library
```

세부를 공부한 뒤에는 다시 [Java Roadmap](./2026-09-29-java-roadmap.md)으로 돌아가 현재 지식의 위치를 재확인한다.

> **JVM은 Bytecode를 단순히 한 줄씩 해석하는 프로그램이 아니다. Class를 동적으로 Loading·Linking·Initialization하고, Thread별 실행 상태와 공유 Runtime 영역을 관리하며, 구현체에 따라 Interpreter·JIT·GC 같은 실행 서비스를 제공하는 Java의 Runtime 계층이다.**
