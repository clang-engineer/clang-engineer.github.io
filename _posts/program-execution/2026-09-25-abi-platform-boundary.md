---
title: 서로 다른 바이너리는 어떻게 약속을 맞추는가 - ABI
date: 2026-09-25 12:50:00 +0900
categories: [Program Execution]
tags: [abi, api, calling-convention, binary-interface, linker]
---

> [Program Execution 전체 지도](./2026-09-25-index.md)

앞선 글에서는 Application이 System Call을 통해 Kernel Service를 요청하는 경계를 살펴봤다. 그런데 Compiler가 만든 Code, Library, 운영체제는 서로 따로 만들어질 수 있다.

> **서로 다른 Binary는 Argument 위치, Return Value, Data 배치 같은 약속을 어떻게 맞출까?**

이 Binary 수준의 약속이 ABI(Application Binary Interface)다.

## 1. API만 맞으면 되는 것 아닐까

Source Code에서 Library 함수를 사용할 때는 API(Application Programming Interface)를 본다.

```c
int add(int a, int b);
```

API 관점에서는 함수 이름, Parameter, Return Type처럼 Source 수준에서 어떻게 사용할지가 중요하다.

하지만 CPU가 실제로 함수를 호출할 때는 더 구체적인 약속이 필요하다.

```text
Argument는 어느 Register에 둘까?
Return Value는 어디에 둘까?
어떤 Register를 누가 보존할까?
Data Type은 Memory에 어떻게 배치할까?
Symbol은 Binary에서 어떻게 표현할까?
```

이런 규칙이 맞지 않으면 Source 수준의 함수 모양이 같아도 Binary끼리 정상적으로 협력할 수 없다.

## 2. API와 ABI의 경계

```text
API
= Source Code 수준의 사용 약속

ABI
= Compile된 Binary 사이의 상호작용 약속
```

API가 같아도 ABI가 다르면 기존 Binary를 그대로 연결하지 못하고 다시 Compile해야 할 수 있다.

## 3. Calling Convention은 함수 호출의 약속이다

Caller와 Callee가 같은 규칙을 알아야 함수 호출이 성립한다.

```text
Caller
  ↓ Argument 전달
Callee
  ↓ 실행
Return Value 반환
  ↓
Caller 계속 실행
```

Calling Convention은 Argument 전달 위치, Return Value 위치, Register 보존 책임, Stack 사용 방법 등을 정한다.

핵심은 특정 Register 이름을 외우는 것이 아니라 **Compiler가 서로 호환되는 Code를 만들려면 함수 호출 방식에 대한 공통 규약이 필요하다**는 점이다.

## 4. Data Layout도 약속이 필요하다

Binary끼리 구조체 같은 Data를 주고받으려면 Field Offset, Alignment, Padding, Type Size 같은 Memory 표현도 맞아야 한다.

```c
struct Item {
    char flag;
    int value;
};
```

한쪽은 `value`가 특정 Offset에 있다고 생각하고 다른 쪽은 다른 위치에 있다고 생각하면 같은 Memory를 서로 다르게 해석하게 된다.

## 5. ABI는 Linker와도 연결된다

앞서 Linker는 필요한 Symbol과 실제 정의를 연결한다고 했다. 하지만 이름만 같다고 충분한 것은 아니다.

```text
Symbol을 찾을 수 있는가?
        +
호출 규약이 맞는가?
        +
Data 표현이 맞는가?
        ↓
Binary가 함께 동작
```

따라서 ABI는 Compiler, Linker, Library가 만나는 경계다.

C++에서는 Name Mangling 같은 언어 기능도 Binary 호환성에 관계할 수 있다.

## 6. OS와 CPU가 바뀌면 ABI도 달라질 수 있다

CPU Architecture가 같다고 ABI까지 반드시 같은 것은 아니다.

```text
ISA
→ CPU가 어떤 Instruction과 Register를 제공하는가

ABI
→ 그 Hardware와 OS 환경 위에서 Binary들이
  어떤 규칙으로 협력할 것인가
```

그래서 같은 x86-64 CPU를 사용해도 Linux Binary와 Windows Binary가 그대로 호환되는 것은 아니다.

## 7. System Call에도 Binary 규약이 있다

System Call 경계에서도 Number, Argument 전달 위치, Kernel 진입 방식, Return Value 같은 약속이 필요하다.

```text
Application
   ↓ API
Library
   ↓ System Call ABI
Kernel
```

Library는 이런 저수준 세부를 감싸 Application에 더 사용하기 쉬운 API를 제공할 수 있다.

## 8. Java와 Wasm을 다시 보면

Java는 JVM Bytecode와 JVM을 사이에 둔다.

```text
Java Source
    ↓
JVM Bytecode
    ↓
Platform별 JVM
    ↓
OS / CPU ABI
```

Platform 차이가 사라진 것이 아니라 Application이 Native ABI에 직접 묶이는 지점을 JVM 뒤로 미룬 것이다.

WebAssembly도 실제 CPU ISA와 OS ABI에 바로 Compile하지 않고 Wasm이라는 중간 Target을 둔다.

```text
C++ / Rust
    ↓
   Wasm
    ↓
Wasm Runtime
    ↓
Host OS / CPU
```

두 구조는 중간 실행 계층을 둔다는 점에서 비교할 수 있지만 JVM과 Wasm Runtime의 목적과 제공 기능이 같다는 뜻은 아니다.

## 기억 흐름

```text
API
= Source 수준의 사용 약속

ABI
= Binary 수준의 상호작용 약속

Calling Convention
= 함수 호출 시 Argument·Return·Register·Stack 규칙

Data Layout
= Type과 Data를 Memory에 배치하는 규칙

ISA
= CPU가 이해하는 Instruction과 Register의 구조
```

> **API가 개발자와 Source Code 사이의 약속이라면, ABI는 Compiler가 만든 Binary와 Library·OS가 실제로 함께 동작하기 위한 약속이다.**
