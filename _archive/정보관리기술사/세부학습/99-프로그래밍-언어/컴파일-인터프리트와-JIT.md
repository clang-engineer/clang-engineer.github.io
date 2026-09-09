# Compile · Interpret · JIT — 코드는 언제 어떤 형태로 실행되는가

> 학습 원칙: [`00-프로그래밍-언어-학습원칙.md`](00-프로그래밍-언어-학습원칙.md)
>
> 핵심 질문: **소스 코드를 CPU가 실행할 수 있는 형태로 언제 변환하고, 그 비용을 Compile Time과 Runtime 중 어디에 둘 것인가?**

---

## 1. 먼저 언어와 실행 방식을 분리한다

`C++은 컴파일 언어`, `Python은 인터프리터 언어`처럼 언어 이름과 실행 방식을 완전히 등치하면 실제 Runtime 구조를 놓치기 쉽다.

프로그래밍 언어는 문법과 의미론을 정의하고, 실제 구현체는 소스 코드를 여러 방식으로 실행할 수 있다.

```text
Programming Language
= 문법 + 타입 규칙 + 의미론

Implementation / Runtime
= 그 언어의 프로그램을 실제로 실행하는 방법
```

따라서 같은 언어도 구현체에 따라 AOT Compile, Bytecode VM, Interpreter, JIT 등을 조합할 수 있다.

---

## 2. C++ 기준점 — 실행 전에 Native Code를 만든다

전형적인 C++ Toolchain은 다음 흐름으로 이해할 수 있다.

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

핵심은 **실행 전에 많은 분석과 Code Generation을 수행하여 CPU가 직접 실행할 Machine Code를 준비한다**는 것이다.

장점:

- 실행 시 변환 비용이 상대적으로 적음
- 정적 최적화를 공격적으로 수행할 수 있음
- Runtime이 단순해질 수 있음

Trade-off:

- Build 시간이 길어질 수 있음
- Target Architecture별 Binary가 필요할 수 있음
- Runtime 정보에 기반한 최적화 기회는 제한될 수 있음

---

## 3. Interpreter — 실행하면서 의미를 해석한다

Interpreter는 프로그램 표현을 읽고 그 의미에 따라 동작을 수행한다.

가장 단순화하면:

```text
Source / Intermediate Representation
      ↓
현재 Instruction 확인
      ↓
의미 해석
      ↓
해당 동작 수행
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

실제 Interpreter는 Source Text를 매번 직접 읽기보다 AST, Bytecode 같은 중간 표현을 사용할 수 있다.

따라서:

> **Interpret = Source Text를 한 줄씩 읽는다**

라고 외우지 않는다.

---

## 4. Bytecode와 VM — Source와 Native Code 사이에 중간 표현을 둔다

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

Bytecode는 특정 CPU의 Machine Code와는 다른 **VM이 이해하는 Instruction Set**으로 볼 수 있다.

C++ 기준으로 비유하면:

```text
Native Machine Code
→ 실제 CPU가 직접 실행

Bytecode
→ 가상의 CPU(VM)가 실행할 Instruction
```

이 중간 계층을 두면 Platform 독립성, Runtime 검사, 동적 최적화 같은 설계가 쉬워질 수 있다.

---

## 5. JIT — 실행 중 자주 쓰는 코드를 Native Code로 바꾼다

JIT(Just-In-Time Compilation)는 Runtime 중에 Code를 Compile한다.

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

JIT의 핵심 가치는 **실제 실행 중에 얻은 정보로 최적화할 수 있다는 점**이다.

예:

```text
이 함수가 매우 자주 호출된다
이 호출 지점에는 거의 항상 같은 Type이 들어온다
이 Branch는 대부분 한쪽으로 간다
```

이런 Runtime Profile을 이용하면 AOT Compiler가 사전에 알기 어려운 최적화를 수행할 수 있다.

---

## 6. AOT와 JIT는 서로 반대되는 절대 분류가 아니다

AOT(Ahead-Of-Time Compilation)는 실행 전에 Compile하는 방식이고, JIT는 실행 중 Compile하는 방식이다.

```text
AOT
→ 실행 전 비용 증가
→ 실행 시작 시 이미 Code 준비

JIT
→ 실행 중 Compile 비용 발생
→ Runtime Profile 기반 최적화 가능
```

실제 Runtime은 둘을 조합할 수 있다.

```text
AOT로 기본 Code 생성
        +
Runtime에서 Hot Path JIT
```

또는 여러 단계의 Compiler를 둘 수도 있다.

```text
Interpreter
  ↓
빠른 Baseline JIT
  ↓
Profile 수집
  ↓
Optimizing JIT
```

따라서 시스템을 볼 때 `컴파일인가 인터프리트인가`라는 이분법보다 **언제 어떤 단계에서 어떤 Code를 생성하는가**를 묻는 편이 정확하다.

---

## 7. Java — Bytecode + VM + JIT의 대표 사례

Java의 전형적인 흐름은 다음처럼 이해할 수 있다.

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

여기서:

```text
javac
→ Source를 Bytecode로 변환하는 Compiler

JVM
→ Bytecode를 실행하는 Runtime

JIT
→ Runtime에서 일부 Code를 Native Code로 Compile
```

따라서 Java를 단순히 `Compiler Language` 또는 `Interpreter Language` 하나로만 분류하면 전체 구조가 잘 보이지 않는다.

---

## 8. JavaScript — 언어보다 Engine의 실행 Pipeline을 본다

JavaScript도 `Interpreter Language`라는 한 단어로 설명하기 어렵다.

현대 JavaScript Engine은 일반적으로 Parsing, Intermediate Representation, Interpreter/Baseline 실행, JIT Optimization 등을 조합할 수 있다.

개념적인 흐름:

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

Engine별 내부 구조와 단계 이름은 다를 수 있으므로 특정 구현 이름을 언어 자체의 의미론으로 일반화하지 않는다.

---

## 9. Python — 구현체와 언어를 구분하는 좋은 사례

CPython은 일반적으로 Python Source를 Bytecode로 변환하고 Python Virtual Machine이 이를 실행한다.

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

다른 Python 구현체는 JIT 등 다른 실행 전략을 사용할 수 있다.

즉:

```text
Python
= Language Specification / Semantics

CPython
= 대표 Implementation
```

을 구분한다.

---

## 10. Compiler와 Interpreter의 경계보다 중요한 질문

새 Runtime을 볼 때 다음 질문을 순서대로 확인한다.

```text
1. Source를 어떤 Intermediate Representation으로 바꾸는가?
2. 실행 전에 Native Code를 만드는가?
3. VM이나 Interpreter가 존재하는가?
4. Runtime 중 Native Code를 추가로 생성하는가?
5. Runtime Profile을 Optimization에 사용하는가?
6. 생성된 Code를 언제 폐기하거나 다시 최적화하는가?
```

이 질문으로 보면 언어마다 다른 실행 Pipeline도 같은 구조 위에서 비교할 수 있다.

---

## 11. 실행 방식과 타입 시스템은 별도 축이다

정적 타입과 AOT Compile, 동적 타입과 Interpreter가 자주 함께 보이지만 같은 개념은 아니다.

```text
Static / Dynamic Typing
→ 타입을 언제 어떤 규칙으로 검사하는가?

AOT / JIT / Interpret
→ Code를 언제 어떤 실행 형태로 변환하는가?
```

예를 들어:

```text
정적 타입 + JIT
동적 타입 + JIT
정적 타입 + AOT
동적 타입 + Interpreter
```

모두 가능한 조합이다.

따라서 `동적 타입이라 Interpreter가 필요하다`처럼 인과관계를 만들지 않는다.

---

## 12. 성능 Trade-off를 한 층으로 보지 않는다

실행 성능은 Compile/Interpret 방식 하나로 결정되지 않는다.

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

JIT는 충분히 Warm-up된 뒤 높은 성능을 낼 수 있지만 Startup과 Compile 비용이 발생할 수 있다.

AOT는 시작부터 Native Code를 사용할 수 있지만 실제 Runtime 정보 없이 미리 최적화해야 한다.

어느 방식이 항상 빠르다고 단정하지 않는다.

---

## 13. 개념 경계 정리

| 개념 | 핵심 질문 | C++ 기준점 |
|---|---|---|
| Compiler | Code를 다른 실행 표현으로 언제 변환하는가? | C++ Compiler |
| Interpreter | Program 표현을 읽어 의미를 실행하는가? | `switch(opcode)` Interpreter Loop |
| Bytecode | VM용 중간 Instruction인가? | Native ISA와 대비 |
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
= 표현을 읽으며 실행한다

Bytecode
= VM용 중간 명령어

JIT
= 실행하면서 필요한 Code를 만든다

핵심 비교축
= "언제 Native Code를 만드는가?"
```

핵심 문장:

> **Compile, Interpret, JIT는 언어 자체의 고정 속성이라기보다 구현체가 프로그램을 어떤 단계와 시점에 실행 가능한 형태로 바꾸는지 설명하는 실행 전략이다.**
