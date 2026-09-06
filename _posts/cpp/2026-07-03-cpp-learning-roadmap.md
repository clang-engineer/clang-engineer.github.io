---
title       : "모던 C++ 학습 로드맵 — 객체 수명에서 모던 C++까지"
description : "C++ 학습을 컴파일·링크 모델, 참조·객체 수명, RAII, 이동·스마트 포인터, STL·람다, 템플릿, 모던 언어 기능으로 연결하고 동시성·CMake·스타일은 필요에 따라 분기한 학습 지도."
date        : 2026-07-03 10:00:00 +0900
updated     : 2026-09-06 13:05:00 +0900
categories  : [cpp]
tags        : [roadmap, modern-cpp]
pin         : false
hidden      : false
---

C++는 문법 목록보다 **객체의 수명과 번역 단위가 어떻게 프로그램으로 연결되는지**를 먼저 잡아야 이후 기능이 제자리를 찾는다.

이 Roadmap은 다음 두 축을 구분한다.

```text
[언어 의미론]
참조·객체 수명
   ↓
class·RAII
   ↓
move·ownership 표현
   ↓
STL·lambda
   ↓
template·modern language

[프로그램 구성]
source / header
   ↓
compile / link
   ↓
여러 target을 project로 build
→ CMake
```

컴파일·링킹은 마지막에 배우는 부록이 아니라 **처음부터 C++ 프로그램 구조를 이해하는 바닥**이다. 다만 CMake의 세부 사용은 여러 파일·target을 실제로 다룰 때 Zoom-in한다.

## 한눈에 보기

| 구역 | 핵심 질문 | 우선순위 |
|---|---|---|
| 0. 프로그램 모델 | source·header·object·link는 어떻게 연결되나 | 필수 기반 |
| 1. 참조·객체 | 값·참조·동적 객체의 수명은 어떻게 다르나 | 필수 |
| 2. class·RAII | 객체 수명에 자원 정리를 어떻게 묶나 | 필수 |
| 3. move·소유 표현 | 복사 대신 자원 이전을 어떻게 표현하나 | 필수 · 핵심 |
| 4. STL·lambda | 표준 컨테이너·알고리즘을 함수 객체와 어떻게 조합하나 | 필수 |
| 5. template | 타입을 매개변수화해 어떻게 재사용하나 | 필수 |
| 6. modern language | `auto`·`constexpr` 등 이후 표준 기능을 어떻게 읽나 | 필수 |
| Branch A | 예외와 예외 안전은 RAII와 어떻게 연결되나 | 필요할 때 |
| Branch B | 멀티스레드 상태를 어떻게 조율하나 | 필요할 때 |
| Branch C | 실제 Project Build를 어떻게 자동화하나 | 필요할 때 |
| Appendix | Style·Debug Tool | 다른 축 |

## 0. 프로그램 모델 — 컴파일과 링크를 먼저 좌표로 잡는다

| 글 | 역할 |
|---|---|
| [컴파일·링킹과 CMake](./2026-07-03-cpp-build-compile-link-cmake.md) | 처음에는 compile/link·translation unit·symbol만 보고, 여러 target이 생기면 CMake Section으로 다시 돌아오는 Zoom-in |

```text
.cpp
→ compile
→ object file
→ link
→ executable / library
```

이 모델이 있어야 “컴파일 오류”와 “링커 오류”, header 선언과 구현 분리, ODR 문제를 서로 다른 계층으로 볼 수 있다.

## 1. 참조와 객체 수명

| 글 | 역할 |
|---|---|
| [참조자와 동적 할당](./2026-07-03-cpp-reference-and-dynamic-allocation.md) | reference·pointer·dynamic lifetime의 C++ 고유 규칙을 잡는 입문 Concept |

여기서 목표는 `new`를 많이 쓰는 법이 아니라 **객체가 어디까지 살아 있고 누가 그 수명을 책임지는지** 질문하는 습관을 만드는 것이다.

## 2. class와 RAII — 수명에 정리를 묶는다

| 글 | 역할 |
|---|---|
| [클래스와 자원 관리](./2026-07-03-cpp-class-and-resource-management.md) | constructor/destructor·copy·RAII를 객체 수명과 연결 |

```text
resource 획득
→ object lifetime에 묶음
→ scope 종료 / stack unwinding
→ destructor에서 정리
```

이 단계가 잡혀야 move와 smart pointer를 단순 문법이 아니라 **소유 관계를 표현하는 도구**로 이해할 수 있다.

## Branch A — 예외와 RAII의 경계

| 글 | 역할 |
|---|---|
| [예외 처리 — try/catch와 예외 안전](./2026-07-13-cpp-exception-handling.md) | stack unwinding·RAII·basic/strong/nothrow guarantee를 연결 |

예외는 class 뒤의 필수 번호가 아니라, **실패 경로에서도 수명 규칙이 유지되는지** 볼 때 들어오는 Branch다.

## 3. move와 smart pointer — 소유 관계를 코드에 드러낸다

| 글 | 역할 |
|---|---|
| [이동 시맨틱과 스마트 포인터](./2026-07-03-cpp-move-and-smart-pointers.md) | value category·`std::move`·move ctor와 `unique_ptr`/`shared_ptr`/`weak_ptr`의 역할 구분 |

핵심 경계는 다음이다.

```text
std::move
→ 이동 자체가 아니라 rvalue 취급을 허용하는 cast

실제 move
→ 선택된 move constructor / assignment가 수행

smart pointer
→ pointer 문법이 아니라 ownership policy를 타입으로 표현
```

## 4. STL과 lambda — 데이터 구조와 동작을 조합한다

| 글 | 역할 |
|---|---|
| [STL 컨테이너와 알고리즘](./2026-07-03-cpp-stl-containers-and-algorithms.md) | container·iterator·algorithm의 역할 관계 |
| [람다와 클로저](./2026-07-13-cpp-lambda-and-closures.md) | capture·closure object·`std::function`·generic lambda를 C++ 의미론으로 설명 |

Lambda는 별개의 고급 장식이 아니라 algorithm·callback을 실제로 사용할 때 자연스럽게 만난다.

```text
container
→ iterator/range로 요소 범위 표현
→ algorithm에 전달
→ 동작은 lambda/function object로 주입
```

## 5. template — 타입을 매개변수화한다

| 글 | 역할 |
|---|---|
| [C++ 템플릿](./2026-07-03-cpp-templates.md) | function/class template에서 specialization·constraint 계열로 Zoom-in |

Template은 일반적인 “다형성”을 다시 설명하는 문서가 아니라 **C++이 compile time에 타입을 매개변수화하는 구체 의미론**에 집중한다.

## 6. modern language와 표준 라이브러리

| 글 | 역할 |
|---|---|
| [모던 문법 — auto·constexpr와 표준 라이브러리](./2026-07-03-cpp-modern-syntax.md) | `auto`·`decltype`·`constexpr`·uniform initialization 등 현대 C++ 코드를 읽는 공통 문법 |

표준 버전별 기능을 연대기처럼 외우기보다 **현재 코드에서 타입 추론·compile-time 계산·초기화가 어떤 의미를 가지는지** 중심으로 본다.

## Branch B — 동시성

| 글 | 역할 |
|---|---|
| [C++ 동시성 — thread와 async](./2026-07-03-cpp-concurrency.md) | `thread`·mutex·condition variable·future·atomic을 실행/공유상태/조율 축으로 구분 |

동시성은 모든 C++ 코드의 다음 단계가 아니다. 실제로 여러 실행 흐름을 다룰 때 들어간다. 일반 동시성 원리는 Knowledge 영역을 참조하고 이 글은 C++ 표준 라이브러리 의미론에 집중한다.

## Branch C — Project Build

0단계에서 compile/link 모델을 잡았다면, 여러 파일·library·target을 실제 Project로 구성할 때 같은 문서의 CMake 부분으로 다시 들어간다.

- [컴파일·링킹과 CMake](./2026-07-03-cpp-build-compile-link-cmake.md)

```text
언어 의미론 학습
≠
Build Tool 숙련
```

둘은 만나지만 같은 학습 사다리는 아니다.

## Appendix — Style과 Debug

| 글/자료 | 역할 |
|---|---|
| [cpplint·clang-format](./2024-10-22-cpplint-clangformat.md) | 팀 Style을 Tool로 강제하는 별도 운영 축 |
| [gdb cheatsheet](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/gdb.md) | Debug 명령 빠른 Reference |

## 일반 Concept과의 경계

메모리 관리·값/참조 의미론·다형성·동시성 같은 **언어 공통 Concept의 정본은 정보관리기술사 Knowledge**에 둔다. Blog C++ 문서는 그 Concept이 C++에서 어떤 문법·규칙·표준 타입으로 나타나는지에 집중한다.

## 어디서 시작할까

```text
C++ 프로그램이 어떻게 만들어지는지 모르겠다
→ compile/link 모델

객체 수명·reference가 헷갈린다
→ 참조와 동적 객체
→ class·RAII

modern C++의 핵심을 잡고 싶다
→ move·smart pointer
→ STL + lambda
→ template
→ modern language

멀티스레드가 필요하다
→ concurrency Branch

Project가 커져 Build 구성이 필요하다
→ CMake Branch
```

> **C++의 핵심 줄기는 객체 수명 → RAII → move/ownership 표현 → STL·lambda → template·modern language다. compile/link는 처음부터 깔리는 프로그램 모델이고, CMake·동시성·Style은 필요할 때 들어가는 별도 Branch다.**
