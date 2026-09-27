---
title: WebAssembly는 왜 만들어졌을까
date: 2026-09-24 16:00:00 +0900
categories: [WebAssembly]
tags: [webassembly, wasm, runtime, compiler]
---

WebAssembly(Wasm)를 처음 접했을 때 가장 먼저 든 의문은 단순했다.

> JavaScript가 있는데 굳이 새로운 실행 방식을 만들 필요가 있었을까?

브라우저는 이미 JavaScript를 실행할 수 있다. JavaScript 역시 사용자의 CPU와 메모리를 사용한다. 그렇다면 WebAssembly가 해결하려던 문제는 무엇이었을까?

## HTML, CSS와 JavaScript는 무엇이 다른가

브라우저는 HTML과 CSS를 프로그램처럼 실행하지 않는다.

```text
HTML -> Parser -> DOM
CSS  -> Parser -> CSSOM

DOM + CSSOM
     |
     v
Render Tree -> Layout -> Paint
```

반면 JavaScript는 실제로 실행되는 코드다.

```text
JavaScript
    |
    v
JavaScript Engine
    |
    v
Machine Code
    |
    v
CPU
```

WebAssembly도 이쪽에 가깝다.

```text
WebAssembly
    |
    v
Wasm Engine
    |
    v
Machine Code
    |
    v
CPU
```

즉 Wasm은 HTML이나 CSS를 대신하는 기술이 아니다. JavaScript와 마찬가지로 브라우저에서 로직을 실행하기 위한 또 하나의 실행 형식이다.

그렇다면 다시 원래 질문으로 돌아온다.

**JavaScript로 하면 되지 않을까?**

## JavaScript로 다시 만들면 되지 않을까

원칙적으로 가능하다.

C나 C++로 만들어진 이미지 처리 라이브러리, 코덱, 압축 알고리즘이 있더라도 같은 기능을 JavaScript로 다시 구현할 수 있다.

문제는 이미 오랫동안 개발되고 검증된 코드가 존재한다는 것이다.

```text
기존 C/C++ 코드
├── codec
├── image processing
├── compression
├── database engine
└── numerical algorithms
```

이것들을 웹에서 사용하기 위해 JavaScript로 다시 구현한다면 같은 기능을 두 번 개발하고 유지해야 한다.

WebAssembly는 다른 선택지를 제공한다.

```text
C / C++ / Rust / ...
          |
          v
       Compiler
          |
          v
        .wasm
          |
          v
       Browser
```

즉 JavaScript로 할 수 없어서 Wasm이 필요한 것이 아니다. **다른 언어와 기존 네이티브 코드 생태계를 웹의 실행 대상으로 가져올 수 있는 공통 컴파일 타깃**이 필요했던 것이다.

## 기존 C/C++ 코드는 Wasm을 생각하고 작성하지 않았는데?

여기서 또 하나의 의문이 생긴다.

오래된 C/C++ 라이브러리는 WebAssembly가 존재하기 전부터 만들어졌다. 그렇다면 어떻게 그런 코드를 Wasm으로 가져올 수 있을까?

생각해 보면 C 코드도 원래 모든 운영체제마다 완전히 다르게 작성하는 것은 아니다.

```c
printf("hello\n");
malloc(1024);
fopen("data.txt", "r");
```

이런 코드는 Windows와 Linux에서 거의 동일하다.

운영체제의 차이는 표준 라이브러리와 빌드 환경이 상당 부분 흡수한다.

```text
             같은 C 코드
                 |
        +--------+--------+
        |                 |
        v                 v
   Windows target     Linux target
        |                 |
        v                 v
   Windows CRT        Linux libc
        |                 |
        v                 v
     Windows             Linux
```

Wasm도 새로운 타깃을 하나 추가한 것으로 볼 수 있다.

```text
                  C/C++ source
                       |
          +------------+------------+
          |            |            |
          v            v            v
       Windows       Linux        wasm32
          |            |            |
          v            v            v
         .exe         ELF          .wasm
```

Emscripten 같은 툴체인은 C/C++ 코드가 기대하는 여러 표준 기능을 WebAssembly와 브라우저 환경에 연결해 준다.

물론 모든 코드가 그대로 동작하는 것은 아니다. Win32 API, 특정 Linux syscall, 장치 접근처럼 특정 플랫폼에 강하게 의존하는 코드는 수정이나 대체 구현이 필요하다.

따라서 Wasm 포팅이 쉽다는 것은 **프로그램 전체가 자동으로 웹 애플리케이션이 된다는 의미가 아니라, 플랫폼 의존성이 잘 분리된 핵심 모듈을 재사용하기 좋다는 의미**에 가깝다.

## 컴파일 타깃과 플랫폼

C/C++에서는 같은 소스라도 무엇을 대상으로 빌드하느냐에 따라 결과물이 달라진다.

예를 들어 다음과 같은 target을 생각할 수 있다.

```text
x86_64-unknown-linux-gnu
x86_64-pc-windows-msvc
aarch64-apple-darwin
wasm32-unknown-unknown
```

일반적인 네이티브 컴파일에서는 최종 결과물이 특정 CPU와 운영체제에 맞춰진다.

```text
C source
   |
   +--> Linux x86-64 binary
   |
   +--> Windows x86-64 binary
   |
   +--> macOS ARM64 binary
```

WebAssembly를 타깃으로 하면 실제 CPU 명령어 대신 Wasm 명령어를 생성한다.

```text
C / C++ / Rust
       |
       v
      Wasm
       |
       v
Wasm Runtime
       |
       v
x86 / ARM / ...
```

이 때문에 같은 `.wasm` 바이너리를 서로 다른 CPU에서 실행할 수 있다.

## Java의 플랫폼 독립성과 비슷하지 않은가

이 구조는 JVM을 떠올리게 한다.

```text
Java
 |
 v
JVM Bytecode
 |
 v
JVM
 |
 v
OS / Hardware
```

WebAssembly 역시 중간 실행 형식을 둔다.

```text
C++ / Rust / ...
       |
       v
      Wasm
       |
       v
Wasm Runtime
       |
       v
OS / Hardware
```

C/C++ 네이티브 프로그램은 같은 소스를 플랫폼별로 다시 빌드하는 경우가 일반적이지만, Java는 JVM bytecode라는 중간 형식을 통해 컴파일된 결과물 자체를 플랫폼에서 분리한다.

Wasm도 이 점에서는 Java bytecode와 비슷한 면이 있다.

하지만 JVM은 Java 생태계를 위한 완성도 높은 실행 환경이다. 클래스 로딩, GC, 스레드, 방대한 표준 라이브러리 등 많은 기능을 제공한다.

반면 Wasm Core는 훨씬 낮은 수준의 실행 모델에 가깝다.

```text
Wasm Core
├── 숫자 연산
├── 함수
├── 제어 흐름
├── Linear Memory
├── Import / Export
└── 타입
```

파일 시스템이나 네트워크 같은 운영체제 기능 자체를 Wasm Core가 제공하는 것은 아니다.

## Wasm은 운영체제인가?

처음 구조를 보면 운영체제와 애플리케이션 사이에 새로운 OS 계층이 생긴 것처럼 보일 수 있다.

하지만 Wasm 자체는 운영체제라기보다 **가상의 명령어 집합과 실행 포맷**에 더 가깝다.

```text
Native

Application
    |
    v
OS / Kernel
    |
    v
Hardware


WebAssembly

Application
    |
    v
Wasm
    |
    v
Wasm Runtime
    |
    v
OS / Kernel
    |
    v
Hardware
```

Wasm 코드가 커널을 사용하지 않는 것도 아니다. 실제 CPU, 메모리, 파일, 네트워크를 사용하려면 결국 호스트 운영체제와 커널이 필요하다.

차이는 **Wasm 코드가 특정 운영체제의 시스템 인터페이스에 직접 묶이지 않도록 중간 계층을 둔다는 것**이다.

## WASI

브라우저 밖에서 Wasm을 실행하려고 하면 파일이나 네트워크 같은 시스템 기능이 필요해진다.

이 지점에서 WASI(WebAssembly System Interface)가 등장한다.

```text
Wasm Application
       |
       v
      WASI
       |
       v
Wasm Runtime
       |
       v
OS / Kernel
       |
       v
Hardware
```

WASI는 Wasm 프로그램과 운영체제 기능 사이에 표준화된 인터페이스를 제공하려는 시도다.

따라서 개념적으로 다음처럼 구분할 수 있다.

```text
Wasm         = 가상 CPU / 실행 포맷에 가까운 계층
WASI         = 시스템 인터페이스 추상화
Wasm Runtime = Wasm을 실제 OS와 CPU에서 실행하는 구현체
```

## 결국 WebAssembly가 해결하려던 것은

WebAssembly를 단순히 "JavaScript보다 빠른 기술"로 이해하면 왜 필요한지 애매해진다.

JavaScript도 이미 충분히 빠르고, 일반적인 웹 애플리케이션은 JavaScript나 TypeScript만으로 잘 만들 수 있다.

Wasm의 의미는 다른 곳에 있다.

```text
기존

Web Platform
     |
 JavaScript


Wasm 이후

C/C++ -----+
Rust ------+--> WebAssembly --> Web Platform
기타 언어 --+
```

즉 웹을 JavaScript라는 하나의 언어에만 연결된 실행 환경이 아니라 **여러 언어가 공통으로 타깃할 수 있는 실행 플랫폼으로 확장했다**는 데 의미가 있다.

특히 이미 존재하는 C/C++ 등의 핵심 라이브러리를 JavaScript로 다시 구현하지 않고 웹에서 활용할 수 있게 된 것은 중요한 결과다.

물론 일반적인 웹 개발에서 Wasm을 굳이 사용할 필요는 없다.

```text
UI / DOM / API / 일반 비즈니스 로직
              |
              v
          JavaScript / TypeScript

코덱 / 압축 / 이미지 처리 / 계산 엔진
기존 C/C++/Rust 라이브러리
              |
              v
             Wasm
```

WebAssembly는 JavaScript를 대체하기 위해 만들어진 것이 아니다.

**JavaScript밖에 실행할 수 없었던 웹에 범용적인 컴파일 타깃을 하나 추가한 것.**

이 관점에서 보면 WebAssembly가 왜 만들어졌는지, 그리고 어떤 상황에서 사용할 가치가 있는지가 훨씬 명확해진다.
