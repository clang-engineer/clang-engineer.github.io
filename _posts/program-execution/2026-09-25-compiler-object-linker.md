---
title: 소스 코드는 어떻게 실행 파일이 되는가 - 컴파일러와 링커
date: 2026-09-25 09:20:00 +0900
categories: [Program Execution]
tags: [compiler, linker, object-file, symbol, static-linking, dynamic-linking]
---

앞선 글에서는 프로그램이 실행되는 전체 흐름을 살펴봤다.

이번에는 그중 앞부분인 **소스 코드가 실행 파일이 되기까지**를 조금 더 자세히 살펴본다.

핵심 질문은 하나다.

> **왜 소스 코드를 컴파일하는 것만으로 끝나지 않고, 오브젝트 파일과 링커라는 단계가 따로 필요한가?**

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
```

단순한 프로그램에서는 컴파일 명령 한 번으로 실행 파일이 만들어지기 때문에 compiler와 linker가 하나의 작업처럼 보이기 쉽다.

하지만 둘은 서로 다른 일을 한다.

## 1. 하나의 C 프로그램

다음과 같은 프로그램이 있다고 하자.

```c
#include <stdio.h>

int main(void) {
    printf("hello\n");
    return 0;
}
```

보통은 다음처럼 빌드한다.

```bash
gcc main.c -o main
```

겉으로 보면

```text
main.c
  ↓
gcc
  ↓
main
```

으로 끝나는 것처럼 보인다.

하지만 내부에서는 여러 단계가 진행된다.

```text
Source
  ↓
Preprocessor
  ↓
Compiler
  ↓
Assembler
  ↓
Object File
  ↓
Linker
  ↓
Executable
```

## 2. 전처리

C/C++에는 컴파일 전에 처리되는 전처리 단계가 있다.

대표적인 것이 `#include`, `#define`, 조건부 컴파일이다.

```c
#include <stdio.h>
#define SIZE 10
```

개념적으로는 소스 코드를 컴파일러가 처리하기 좋은 하나의 입력으로 만드는 과정이다.

GCC에서는 다음처럼 결과를 확인할 수 있다.

```bash
gcc -E main.c
```

따라서 `#include`는 런타임에 라이브러리를 불러오는 동작이 아니다.

**컴파일 전에 헤더의 선언을 소스에 포함시키는 전처리 지시자**다.

## 3. 컴파일

전처리가 끝난 코드는 compiler에 의해 더 낮은 수준의 표현으로 변환된다.

GCC를 사용하면 assembly 결과를 직접 볼 수도 있다.

```bash
gcc -S main.c
```

결과는 CPU 아키텍처에 따라 달라진다.

```text
C Source
   ↓
Compiler
   ↓
Assembly
```

여기서 중요한 점은 **컴파일러가 프로그램 전체를 반드시 알고 있을 필요는 없다는 것**이다.

예를 들어 다음처럼 파일을 나누어 보자.

```c
// add.c
int add(int a, int b) {
    return a + b;
}
```

```c
// main.c
#include <stdio.h>

int add(int a, int b);

int main(void) {
    printf("%d\n", add(10, 20));
    return 0;
}
```

`main.c`를 컴파일할 때 compiler는 `add()`의 구현을 보지 못해도 된다.

함수의 형태만 알고 있으면 해당 함수를 호출하는 코드를 생성할 수 있다.

## 4. 왜 오브젝트 파일이 필요한가

각 파일을 개별적으로 컴파일할 수 있다.

```bash
gcc -c main.c -o main.o
gcc -c add.c -o add.o
```

그러면 다음과 같이 된다.

```text
main.c ──compile──> main.o
add.c  ──compile──> add.o
```

하지만 `main.o`만으로는 아직 완성된 프로그램이 아니다.

`main.o`에는 개념적으로 다음과 같은 정보가 존재한다.

```text
main.o

main()          → 정의되어 있음
add()           → 외부에서 필요함
printf()        → 외부에서 필요함
```

반면 `add.o`에는:

```text
add.o

add()           → 정의되어 있음
```

이 들어 있다.

즉 오브젝트 파일(Object File)은 최종 실행 파일을 구성하기 위한 **연결 가능한 중간 바이너리**다. 컴파일은 끝났지만 프로그램 전체의 연결은 아직 끝나지 않은 상태라고 볼 수 있다.

## 5. Symbol은 왜 필요한가

여기서 symbol이라는 개념이 중요해진다.

함수나 전역 변수처럼 다른 object file에서 참조할 수 있는 이름들이 symbol로 관리된다.

개념적으로:

```text
main.o

Undefined Symbols
-----------------
add
printf

Defined Symbols
---------------
main
```

처럼 볼 수 있다.

Linux 환경에서는 `nm` 같은 도구로 object file의 symbol을 확인할 수 있다.

```bash
nm main.o
```

컴파일 단계에서는 `add()`가 어디에 구현되어 있는지 몰라도 된다.

**그 이름을 나중에 linker가 해결할 수 있도록 남겨두는 것**이다.

## 6. Linker는 무엇을 연결하는가

이제 linker가 등장한다.

```text
main.o ─┐
        ├── Linker ──> Executable
add.o  ─┘
```

link는 서로 떨어진 대상을 연결한다는 뜻이다. 링커(Linker)는 여러 오브젝트 파일과 라이브러리 사이에서 필요한 Symbol과 실제 정의를 찾아 연결한다.

```text
main.o
  │
  │ needs add
  ↓
Linker
  ↑
  │ provides add
  │
add.o
```

하지만 여전히 `printf()`가 남아 있다.

`printf()`는 우리가 작성하지 않았다.

C 표준 라이브러리가 제공한다.

```text
main.o ─────┐
add.o ──────┼── Linker ──> Executable
C Library ──┘
```

즉 우리가 평소 사용하는 라이브러리 역시 이 linking 과정과 관계가 있다.

## 7. 라이브러리 구현은 언제 연결할까 - Static Linking

필요한 라이브러리 코드를 실행 파일 안에 포함시키는 방식을 static linking이라고 한다.

개념적으로:

```text
Application Object
       +
Static Library
       ↓
     Linker
       ↓
Executable
[필요한 Library Code 포함]
```

장점은 실행할 때 외부 라이브러리에 대한 의존성이 줄어든다는 것이다.

반면 여러 실행 파일이 같은 라이브러리 코드를 각각 포함하면 파일 크기가 커질 수 있다.

Unix 계열에서는 static library가 흔히 `.a` 형식을 사용한다.

## 8. 실행 시점까지 연결을 미룰 수 있다 - Dynamic Linking

dynamic linking에서는 라이브러리 전체를 실행 파일에 복사하지 않는다.

```text
Executable
    │
    │ requires shared library
    ↓
Shared Library
```

Linux의 `.so`, Windows의 `.dll`, macOS의 `.dylib` 등이 대표적이다.

이 경우 일부 연결 작업은 프로그램 실행 시점까지 이어진다.

따라서 실행 파일을 만든다고 해서 모든 코드가 반드시 그 파일 안에 들어 있는 것은 아니다.

## 9. Header와 Library는 역할이 다르다

```c
#include <stdio.h>
```

를 했다고 `printf()` 구현이 소스에 복사되는 것은 아니다.

전통적인 C/C++의 `#include`는 Module Import가 아니라 **전처리기가 Header Text를 포함하는 방식**이다. Header는 Compiler가 함수와 Type을 올바르게 사용할 수 있도록 선언과 Interface 정보를 제공한다.

실제 구현 Code는 별도의 Object File이나 Library에 존재할 수 있다.

```text
Header
→ Compiler가 사용할 선언·Type 정보

Library
→ 실제 구현 Code 제공

Linker
→ 필요한 Symbol과 구현을 연결
```

따라서 `#include`와 Linking은 서로 다른 단계의 작업이다.

## 10. 왜 소스 파일을 나누어 컴파일하는가

큰 프로젝트를 생각하면 이유가 명확하다.

```text
Project
├── main.cpp
├── network.cpp
├── parser.cpp
├── database.cpp
└── util.cpp
```

모든 파일을 매번 처음부터 다시 컴파일할 필요는 없다.

```text
main.cpp     → main.o
network.cpp  → network.o
parser.cpp   → parser.o
database.cpp → database.o
util.cpp     → util.o

                 ↓
               Link
                 ↓
             Executable
```

변경된 소스만 다시 컴파일하고 마지막에 object file들을 다시 link할 수 있다.

파일과 Target이 많아지면 어떤 Source를 다시 Compile하고 어떤 Object File을 다시 Link해야 하는지 관리할 필요가 생긴다. Make·Ninja 같은 Build 도구와 CMake 같은 Build 구성 도구는 이 과정을 자동화한다.

## 11. 같은 Source인데 왜 플랫폼별 결과물이 달라질까

컴파일러는 target을 기준으로 코드를 생성한다.

```text
                 Same Source
                     │
        ┌────────────┼────────────┐
        ↓            ↓            ↓
   Linux x86-64  Windows x86-64  ARM64
        ↓            ↓            ↓
   Machine Code  Machine Code  Machine Code
```

CPU instruction set뿐 아니라 object format, ABI, library 등도 target 환경에 영향을 받는다.

따라서 같은 C/C++ 소스가 여러 운영체제에서 컴파일될 수 있다고 해서 **컴파일된 object file이나 executable까지 동일한 것은 아니다.**

## 12. 이 구조에서 WebAssembly를 보면

WebAssembly 역시 compiler target이 될 수 있다.

```text
C / C++ / Rust
       │
       ├── x86-64 target ──> Native Object / Executable
       │
       └── wasm32 target ──> Wasm Object / Module
```

즉 기존 컴파일 과정에서 완전히 새로운 원리가 등장한 것이 아니다.

**컴파일러와 linker가 최종적으로 만들어내는 target이 WebAssembly가 된 것**으로 볼 수 있다.

이 때문에 C/C++나 Rust의 기존 build model을 이해하면 WebAssembly가 훨씬 자연스럽게 보인다.

## 정리

전체 흐름을 다시 보면 다음과 같다.

```text
Source Code
    ↓
Preprocessor
    ↓
Compiler
    ↓
Assembler
    ↓
Object File
    ↓
Linker
    ↓
Executable
```

그리고 핵심 역할을 구분하면:

```text
Compiler
  = 하나의 소스 코드를 낮은 수준의 코드로 변환

Object File
  = 아직 연결이 끝나지 않은 중간 바이너리

Symbol
  = 코드와 데이터를 서로 연결하기 위한 이름

Linker
  = 여러 object와 library의 symbol을 해결하여 하나의 프로그램으로 연결
```

여기까지가 **프로그램을 만드는 과정**이다.

하지만 실행 파일이 만들어졌다고 프로그램이 실행된 것은 아니다.

다음 단계에서는 운영체제가 이 실행 파일을 어떻게 읽고 메모리에 올려 **process로 만드는지**, 즉 executable과 loader의 관계를 살펴본다.
