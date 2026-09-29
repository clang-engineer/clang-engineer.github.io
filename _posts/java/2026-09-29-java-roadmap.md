---
title       : "Java 로드맵 — 언어에서 JVM과 동시성까지"
description : "Java를 문법 목록이 아니라 Language, JVM 실행 모델, Standard Library, Concurrency/JMM, 그리고 JPA 같은 생태계 Branch로 나눠 전체 지형과 학습 경계를 잡는다."
date        : 2026-09-29 12:00:00 +0900
updated     : 2026-09-29 12:00:00 +0900
categories  : [java, "개요·인덱스"]
tags        : [roadmap, java, jvm, concurrency]
pin         : false
hidden      : false
---

Java를 공부할 때 언어 문법, JVM, Collection, 동시성, Gradle, Spring/JPA를 한 줄의 학습 단계처럼 놓기 쉽다. 하지만 이들은 같은 종류의 지식이 아니다.

먼저 Java 생태계를 다음처럼 나눈다.

```text
Java
│
├─ Language
│  └─ Java 코드가 어떤 의미를 가지는가
│
├─ JVM / Runtime
│  └─ 컴파일된 Java 코드가 어떻게 로드되고 실행되는가
│
├─ Standard Library
│  └─ Collection·Stream·I/O 같은 공통 API를 어떻게 사용하는가
│
├─ Concurrency / JMM
│  └─ 여러 실행 흐름과 공유 메모리를 어떤 규칙으로 다루는가
│
└─ Ecosystem
   ├─ Build → Gradle
   └─ Persistence → JPA / Hibernate
```

이 로드맵의 목적은 기존 Java 글을 순서대로 나열하는 것이 아니라 **Java의 전체 좌표를 먼저 잡고, 필요한 부분으로 Zoom-in할 위치를 정하는 것**이다.

## 한눈에 보기

| 영역 | 핵심 질문 | 관계 |
|---|---|---|
| Language | Java 소스 코드는 어떤 타입·객체·함수 의미를 가지나 | 기반 |
| JVM / Runtime | `.java → .class → JVM → native execution`은 어떻게 이어지나 | 실행 기반 |
| Standard Library | 언어 위에서 자주 쓰는 자료구조·함수형 API는 무엇을 제공하나 | 사용 기반 |
| Concurrency / JMM | Thread 실행과 공유 상태의 가시성·동기화를 어떻게 다루나 | 필요할 때 Zoom-in |
| Gradle | Java 프로젝트를 어떻게 빌드·의존성 관리하나 | 별도 Tool 영역 |
| JPA / Hibernate | 객체와 관계형 DB의 상태를 어떻게 연결하나 | Framework Branch |

## 1. Language — Java 코드의 의미를 잡는다

JVM 내부 구조부터 외우기 전에 Java 소스 수준에서 타입·객체·호출이 어떤 의미를 가지는지 알아야 한다.

```text
Type / Object / Method
        ↓
Interface / Generic
        ↓
Lambda / Functional Interface
```

현재 블로그에는 이 축 전체를 덮는 기초 문서는 아직 없다. 비어 있는 영역을 기존 글로 억지로 채우지 않는다.

현재 Zoom-in 가능한 글:

| 글 | 역할 |
|---|---|
| [java.util.function 핵심](./2026-01-04-java-functional-interface.md) | Lambda의 target type과 Function·Predicate·Consumer·Supplier를 이해하는 Language/Standard Library 경계 |

향후 필요하면 Object Model, Generic, Exception, Annotation 같은 주제를 별도 Concept로 채운다.

## 2. JVM / Runtime — Java 프로그램은 어떻게 실행되는가

Java의 가장 중요한 실행 경계다.

```text
.java Source
    ↓ javac
.class Bytecode
    ↓
Class Loading
    ↓
JVM
    ↓
Interpreter / JIT
    ↓
Native Instruction
    ↓
OS / CPU
```

JVM으로 Zoom-in하면 다음 질문들이 만난다.

```text
JVM
├─ Class Loading
├─ Runtime Data Areas
├─ Execution Engine
│  ├─ Interpreter
│  └─ JIT
├─ GC
└─ Native Interface
```

일반 Runtime의 위치는 [Runtime은 무엇을 하는가](../program-execution/2026-09-25-runtime-execution-model.md)에서 전체 좌표를 잡고, JVM 내부는 [JVM 구조와 작동 원리](./2026-09-29-java-jvm-structure-execution.md)에서 Class Loading·Runtime Data Areas·Interpreter/JIT·GC의 실행 흐름으로 Zoom-in한다.

## 3. Standard Library — 언어 위의 공통 도구

Java 문법을 안다고 Collection·Stream API의 의미가 자동으로 따라오는 것은 아니다.

```text
Language
   ↓
Standard Library
├─ Collection
├─ Map
├─ Stream
├─ java.util.function
├─ I/O
└─ Time / Utility
```

현재 글:

| 글 | 역할 |
|---|---|
| [Java Map 변환과 병합](./2026-06-13-java-map-conversion-and-merge.md) | `toMap`·`putAll`·`merge`를 key 충돌 정책이라는 공통 질문으로 연결 |
| [java.util.function 핵심](./2026-01-04-java-functional-interface.md) | Stream·Lambda에서 사용하는 표준 Functional Interface |

Collection Framework 전체나 Stream 실행 모델은 아직 전용 글이 없다.

## 4. Concurrency / JMM — 실행과 공유 상태를 분리한다

동시성은 Java 기초 문법의 다음 장이 아니라 **여러 실행 흐름이 필요할 때 들어가는 별도 축**이다.

먼저 다음 네 문제를 구분한다.

```text
Task
→ 무엇을 실행할까

Executor
→ 어디서 실행할까

Result / Completion
→ 결과와 완료를 어떻게 다룰까

Shared State Coordination
→ 동시에 접근하는 상태를 어떻게 보호할까
```

| 글 | 역할 |
|---|---|
| [Java 동시성](./2026-01-04-java-concurrency.md) | Thread·Executor·Future·CompletableFuture·공유 상태의 전체 좌표 |
| [volatile vs static](./2026-04-01-java-concurrency-volatile-vs-static.md) | 소유 위치와 메모리 가시성을 분리하고 `volatile`의 경계를 이해 |
| [Java Lock 비교](./2026-05-11-java-concurrency-lock-comparison.md) | synchronized·ReentrantLock·ReadWriteLock·StampedLock의 선택 기준 |

이 축에서 JVM과 만나는 지점이 **Java Memory Model(JMM)**이다.

```text
Java Concurrency API
        ↓
Java Memory Model
        ↓
happens-before / visibility / ordering
        ↓
JVM / CPU Memory Model
```

현재 JMM 자체를 큰 그림에서 설명하는 전용 글은 비어 있다. `volatile` 글은 이 구조의 한 지점을 Zoom-in한 문서로 본다.

## Branch A — Persistence: JPA / Hibernate

JPA는 Java 언어 자체나 JVM의 다음 단계가 아니다. Java 애플리케이션에서 관계형 DB를 다룰 때 선택하는 Framework 축이다.

```text
Java Object
     ↕
JPA / Hibernate
     ↕
Relational Database
```

| 글 | 역할 |
|---|---|
| [JPA/ORM 핵심](./2026-07-03-java-jpa-persistence-context.md) | Persistence Context·Entity lifecycle·Lazy Loading·N+1의 실행 모델 |
| [JPA 함수와 Query 선택](./2026-09-23-java-jpa-function-query-options.md) | JPQL·DB function·QueryDSL·Criteria·Native Query의 선택 경계 |

JPA를 공부한다고 JVM 내부 구조를 먼저 모두 알아야 하는 것은 아니다. 반대로 JPA 지식을 Java 자체의 핵심 의미론으로 올려놓지도 않는다.

## 별도 영역 — Build: Gradle

Gradle은 Java에서 많이 사용하지만 **Java 언어의 하위 구성요소가 아니다.**

```text
Java Source
     │
     └──── Gradle
           ├─ Compile Task
           ├─ Dependency
           ├─ Test
           ├─ Toolchain
           └─ Packaging
```

따라서 Gradle 문서는 [Gradle 영역](../gradle/)에서 독립적으로 관리한다.

Java와 Gradle이 만나는 지점은 Toolchain·Bytecode target·Application JVM 같은 **경계**이고, 그 경계에서 필요할 때 서로 링크한다.

## 다른 Roadmap과의 경계

- 소스가 실행 파일·프로세스·Runtime을 거쳐 CPU까지 내려가는 일반 구조 → [Program Execution](../program-execution/2026-09-25-index.md)
- Java Build·Dependency·Toolchain → Gradle 영역
- OS Process·Virtual Memory·System Call → Program Execution / OS 영역
- DB 자체의 관계형 모델·SQL → DB 영역

Java Roadmap은 이 일반 개념을 다시 복제하지 않고 **Java 언어와 JVM에서 어떻게 구체화되는지**에 집중한다.

## 현재 비어 있는 핵심 영역

현재 문서셋에서 중요한 빈칸은 숨기지 않는다.

```text
Language
├─ Object Model
├─ Generic
├─ Exception
└─ Annotation

JVM
└─ 구조와 작동 원리 ← 작성됨
   ├─ Class Loading
   ├─ Runtime Data Areas
   ├─ Interpreter / JIT
   └─ GC 세부는 추가 Zoom-in 가능

Standard Library
├─ Collection Framework 전체
├─ Stream 실행 모델
└─ I/O

Concurrency
└─ Java Memory Model
```

기존 짧은 글을 억지로 늘려 빈칸을 채우지 않는다. 실제 학습하면서 해당 좌표가 필요해질 때 별도 Concept로 Zoom-in한다.

## 어디서 시작할까

```text
Java 언어 자체가 헷갈린다
→ Language

Java 프로그램이 실제로 어떻게 실행되는지 궁금하다
→ Program Execution에서 Runtime 좌표 확인
→ JVM / Runtime

Collection·Stream API를 정리하고 싶다
→ Standard Library

Thread·Future·Lock이 뒤섞인다
→ Concurrency 전체 지도
→ 필요한 지점으로 Zoom-in

DB와 객체 상태 관리가 궁금하다
→ JPA Branch

Build·Dependency·JDK Target이 궁금하다
→ Gradle 영역
```

세부 문서를 읽은 뒤에는 다시 이 Roadmap으로 돌아와 **지금 배운 내용이 Language, JVM, Library, Concurrency, Ecosystem 중 어디에 위치하는지** 재확인한다.

> **Java의 핵심은 문법 목록이 아니라 Language와 JVM이라는 두 기반을 구분하고, 그 위에 Standard Library와 필요한 실행 모델을 올리는 것이다. Concurrency는 JMM에서 JVM과 만나고, Gradle·JPA는 Java와 연결되지만 별도의 Tool·Framework 축이다.**
