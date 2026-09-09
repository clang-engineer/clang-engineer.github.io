# Compile · Interpret · JIT — 코드는 언제 어떤 형태로 실행되는가

> 학습 원칙: [`00-프로그래밍-언어-학습원칙.md`](00-프로그래밍-언어-학습원칙.md)
>
> 핵심 질문: **Source Code를 CPU가 실행할 수 있는 형태로 언제 바꾸고, 그 비용을 실행 전과 실행 중 어디에 둘 것인가?**

---

## 1. 먼저 언어와 실행 방식을 나눈다

`C++은 컴파일 언어`, `Python은 인터프리터 언어`처럼 언어 이름과 실행 방식을 그대로 묶으면 실제 구조를 놓치기 쉽다.

프로그래밍 언어는 문법과 의미론을 정의하고, 실제 구현체가 그 언어의 프로그램을 어떤 방식으로 실행할지 정한다.

```text
Programming Language
→ 문법 + 타입 규칙 + 의미론

Implementation / Runtime
→ 그 언어의 Program을 실제로 실행하는 방법
```

따라서 같은 언어라도 구현체에 따라 AOT Compile, Bytecode VM, Interpreter, JIT 등을 조합할 수 있다.

---

## 2. C++ 기준점 — 실행 전에 Native Code를 만든다

전형적인 C++ Toolchain은 다음처럼 이해할 수 있다.

```text
Source Code
   ↓
Preprocess
   ↓
Compile
   ↓
Object File
   ↓
Link
   ↓
Native Executable
   ↓
OS Loader
   ↓
CPU 실행
```

핵심은 **실행 전에 분석과 Code Generation을 많이 끝내고, CPU가 직접 실행할 Machine Code를 미리 준비한다는 것**이다.

장점:

- 실행 중 변환 비용이 적다.
- 실행 전에 강한 최적화를 할 수 있다.
- Runtime 구조를 단순하게 가져갈 수 있다.

Trade-off:

- Build 시간이 길어질 수 있다.
- Target Architecture마다 Binary가 필요할 수 있다.
- 실제 실행 중에만 알 수 있는 정보를 미리 활용하기 어렵다.

---

## 3. Interpreter — 프로그램 표현을 읽으면서 실행한다

Interpreter는 Program 표현을 읽고 그 의미에 맞는 동작을 수행한다.

가장 단순하게 보면:

```text
Source / Intermediate Representation
      ↓
현재 Instruction 확인
      ↓
무슨 동작인지 해석
      ↓
해당 동작 실행
      ↓
다음 Instruction
```

개념적인 Interpreter Loop는 다음과 비슷하다.

```cpp
while (running) {
    Instruction inst = fetch();

    switch (inst.opcode) {
        case ADD:
            execute_add();
            break;
        case CALL:
            execute_call();
            break;
    }
}
```

실제 Interpreter가 Source Text를 매번 한 줄씩 읽는 것은 아니다. AST나 Bytecode 같은 중간 표현을 실행할 수도 있다.

따라서 `Interpret = Source Text를 한 줄씩 읽는다`고 외우지 않는다.

---

## 4. Bytecode와 VM — Source와 Native Code 사이에 중간 명령어를 둔다

Java, Python 등 여러 Runtime은 Source를 바로 Native Code로 만들지 않고 중간 표현을 사용한다.

```text
Source
  ↓
Compiler
  ↓
Bytecode / Intermediate Representation
  ↓
Virtual Machine
  ↓
Interpret 또는 JIT
  ↓
실행
```

Bytecode는 실제 CPU가 실행하는 Machine Code가 아니라 **VM이 이해하는 Instruction Set**으로 보면 된다.

```text
Native Machine Code
→ 실제 CPU가 직접 실행

Bytecode
→ 가상의 CPU 역할을 하는 VM이 실행
```

이 중간 계층을 두면 Platform 독립성, Runtime 검사, 동적 최적화 같은 설계를 하기 쉬워질 수 있다.

---

## 5. JIT — 실행하면서 필요한 Code를 Native Code로 만든다

JIT(Just-In-Time Compilation)는 Program 실행 중에 Code를 Compile한다.

대표적인 흐름:

```text
Program 시작
   ↓
Interpreter / Baseline Code로 실행
   ↓
Runtime Profile 수집
   ↓
자주 실행되는 Hot Path 발견
   ↓
JIT Compiler가 최적화된 Native Code 생성
   ↓
이후 해당 Native Code 실행
```

JIT의 강점은 **실제 실행 중에 얻은 정보를 최적화에 쓸 수 있다는 것**이다.

예:

```text
이 함수가 매우 자주 호출된다
이 호출 지점에는 거의 항상 같은 Type이 들어온다
이 Branch는 대부분 한쪽으로 간다
```

이런 정보는 실행 전에 Compile하는 Compiler가 알기 어렵다.

---

## 6. AOT와 JIT는 둘 중 하나만 고르는 관계가 아니다

AOT(Ahead-Of-Time Compilation)는 실행 전에 Compile하고, JIT는 실행 중 Compile한다.

```text
AOT
→ 실행 전에 Compile 비용 지불
→ Program 시작 시 Code가 이미 준비됨

JIT
→ 실행 중 Compile 비용 발생
→ 실제 Runtime 정보를 바탕으로 최적화 가능
```

실제 Runtime은 둘을 함께 쓸 수 있다.

```text
AOT로 기본 Code 생성
        +
Runtime에서 Hot Path JIT
```

또는 여러 단계로 나눌 수도 있다.

```text
Interpreter
  ↓
빠른 Baseline JIT
  ↓
Profile 수집
  ↓
Optimizing JIT
```

따라서 `컴파일인가 인터프리트인가`보다 **언제, 어떤 단계에서, 어떤 Code를 만드는가**를 묻는 편이 정확하다.

---

## 7. Java — Bytecode + VM + JIT

Java의 전형적인 흐름은 다음과 같다.

```text
.java Source
   ↓ javac
.class Bytecode
   ↓
JVM
   ├─ Bytecode 실행
   └─ Hot Code JIT Compile
          ↓
       Native Code
```

```text
javac
→ Source를 Bytecode로 변환

JVM
→ Bytecode를 실행하는 Runtime

JIT
→ 실행 중 일부 Code를 Native Code로 Compile
```

따라서 Java를 단순히 `Compiler Language`나 `Interpreter Language` 하나로만 분류하면 전체 구조가 보이지 않는다.

---

## 8. JavaScript — 언어보다 Engine의 실행 흐름을 본다

JavaScript도 `Interpreter Language`라는 한 단어로 설명하기 어렵다.

현대 JavaScript Engine은 Parsing, 중간 표현, Interpreter/Baseline 실행, JIT Optimization 등을 조합할 수 있다.

```text
JavaScript Source
      ↓
Parse
      ↓
AST / Internal Representation
      ↓
Interpreter 또는 Baseline 실행
      ↓
Runtime Profile
      ↓
Optimizing JIT
      ↓
Native Code
```

Engine마다 내부 단계와 이름은 다를 수 있다. 특정 Engine의 구현을 JavaScript 언어 자체의 규칙으로 일반화하지 않는다.

---

## 9. Python — 언어와 구현체를 구분하기 좋은 사례

CPython은 일반적으로 Python Source를 Bytecode로 바꾸고 Python Virtual Machine이 이를 실행한다.

```text
.py Source
   ↓
Bytecode
   ↓
CPython VM
   ↓
Instruction Dispatch
```

하지만 `Python 언어 = 반드시 이 방식`은 아니다.

다른 Python 구현체는 JIT 같은 다른 전략을 쓸 수 있다.

```text
Python
→ Language Specification / Semantics

CPython
→ 대표적인 Implementation
```

---

## 10. Compiler와 Interpreter의 이름보다 중요한 질문

새 Runtime을 볼 때는 다음을 순서대로 확인한다.

```text
1. Source를 어떤 중간 표현으로 바꾸는가?
2. 실행 전에 Native Code를 만드는가?
3. VM이나 Interpreter가 있는가?
4. 실행 중 Native Code를 추가로 만드는가?
5. Runtime Profile을 최적화에 사용하는가?
6. 만든 Code를 언제 버리거나 다시 최적화하는가?
```

이 질문을 쓰면 서로 다른 Runtime도 같은 기준으로 비교할 수 있다.

---

## 11. 실행 방식과 타입 시스템은 다른 축이다

정적 타입과 AOT Compile, 동적 타입과 Interpreter가 자주 함께 보이지만 같은 개념은 아니다.

```text
Static / Dynamic Typing
→ 타입을 언제 어떤 규칙으로 검사하는가?

AOT / JIT / Interpret
→ Code를 언제 어떤 실행 형태로 바꾸는가?
```

예를 들어 다음 조합이 모두 가능하다.

```text
정적 타입 + JIT
동적 타입 + JIT
정적 타입 + AOT
동적 타입 + Interpreter
```

따라서 `동적 타입이라서 Interpreter가 필요하다`처럼 인과관계를 만들지 않는다.

---

## 12. 성능은 실행 방식 하나로 결정되지 않는다

다음 요소가 함께 영향을 준다.

```text
Startup Time
Peak Throughput
Memory 사용량
Code Size
Optimization 수준
Runtime Profile 품질
GC 비용
Cache Locality
Dynamic Dispatch
Warm-up 시간
```

JIT는 Warm-up 이후 높은 성능을 낼 수 있지만 Startup과 Compile 비용이 생길 수 있다.

AOT는 시작부터 Native Code를 쓸 수 있지만 실제 Runtime 정보를 미리 알기 어렵다.

어느 방식이 항상 더 빠르다고 단정하지 않는다.

---

## 13. 개념 경계 정리

| 개념 | 핵심 질문 | C++ 기준점 |
|---|---|---|
| Compiler | Code를 다른 실행 표현으로 언제 바꾸는가? | C++ Compiler |
| Interpreter | Program 표현을 읽으며 동작을 실행하는가? | `switch(opcode)` Loop |
| Bytecode | VM이 실행할 중간 Instruction인가? | Native ISA와 대비 |
| VM | 중간 Instruction을 실행하는 Runtime인가? | 가상의 실행 Machine |
| AOT | 실행 전에 Native Code를 만드는가? | 일반적인 C++ Build |
| JIT | 실행 중 Native Code를 만드는가? | Runtime Code Generation |
| Runtime Profile | 실제 실행 정보를 최적화에 쓰는가? | 사전 Compile과 대비 |

---

## 14. 기억·인출

```text
AOT
= 실행 전에 만든다

Interpreter
= Program 표현을 읽으며 실행한다

Bytecode
= VM용 중간 명령어

JIT
= 실행하면서 필요한 Native Code를 만든다

핵심 비교축
= "언제 어떤 실행 Code를 만드는가?"
```

핵심 문장:

> **Compile, Interpret, JIT는 언어 자체의 고정 속성이 아니다. 구현체가 Program을 어떤 단계와 시점에 실행 가능한 형태로 바꾸는지 설명하는 실행 전략이다.**
