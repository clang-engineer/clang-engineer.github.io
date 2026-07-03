---
title       : 빌드 ⑧ 컴파일·링킹과 CMake
description : "문법을 넘어 프로젝트를 빌드하는 관점. 소스가 실행 파일이 되는 컴파일·링킹 과정, undefined reference 링커 에러의 정체, 그리고 Make와 CMake로 여러 파일 프로젝트를 빌드하는 법까지 정리하며 로드맵을 마무리한다."
date        : 2026-07-03 11:20:00 +0900
updated     : 2026-07-03
categories  : [cpp]
tags        : [roadmap, modern-cpp]
pin         : false
hidden      : false
---

> [모던 C++ 학습 로드맵](/posts/cpp/2026-07-03-cpp-learning-roadmap/)의 **마지막(빌드)** 단계입니다. 앞 글: [⑦ auto·constexpr와 표준 라이브러리](/posts/cpp/2026-07-03-cpp-modern-syntax/)

파일 하나짜리 예제는 `g++ main.cpp`로 끝납니다. 하지만 실제 프로젝트는 파일이 수십 개고, 여기서 **컴파일·링킹**과 **빌드 시스템**을 이해해야 합니다. 링커 에러 앞에서 멈추지 않으려면 이 단계가 필요합니다.

## 소스가 실행 파일이 되기까지

`g++` 한 번처럼 보이지만, 내부는 네 단계입니다.

| 단계 | 하는 일 | 결과물 |
|---|---|---|
| 전처리 | `#include`·`#define` 치환 | 확장된 소스 |
| 컴파일 | 각 `.cpp`를 기계어로 번역 | 목적 파일 `.o` |
| 어셈블 | (컴파일에 포함) | |
| **링킹** | 여러 `.o`와 라이브러리를 하나로 연결 | 실행 파일 |

핵심은 **컴파일은 파일 단위로 따로**, 링킹은 그걸 **한데 모으는** 단계라는 것. 그래서 컴파일 에러와 링커 에러는 원인이 다릅니다.

## 선언 vs 정의 — 링커 에러의 뿌리

`.cpp` 하나를 컴파일할 때, 컴파일러는 다른 파일의 함수 **본체**를 모릅니다. 선언(시그니처)만 있으면 컴파일은 통과시키고, "실제 본체는 링커가 찾겠지" 하고 넘어갑니다. 링킹 때 그 본체를 못 찾으면 나는 게 그 유명한 에러입니다.

```
undefined reference to `foo()'
```

이건 **문법 오류가 아니라, 정의를 못 찾았다는 뜻**입니다. 원인은 보통 셋 중 하나:

- 정의한 `.cpp`를 빌드에 안 넣었다
- 라이브러리를 링크 안 했다
- 선언과 정의의 시그니처가 미묘하게 다르다

> 앞서 [⑤ 템플릿](/posts/cpp/2026-07-03-cpp-templates/)에서 "템플릿을 `.cpp`에 분리하면 링크 에러"라 한 것도 같은 뿌리입니다.

헤더는 **선언**을, `.cpp`는 **정의**를 담습니다. 그리고 한 정의는 프로그램 전체에서 한 번만 존재해야 합니다(ODR, One Definition Rule). 헤더에 함수 정의를 넣고 여러 곳에서 include하면 중복 정의로 터지는 이유입니다.

## Make — 무엇을 다시 빌드할지 관리

파일이 많아지면 매번 전체를 컴파일하기 아깝습니다. `make`는 "바뀐 파일과 그에 의존하는 것만" 다시 빌드합니다.

```makefile
app: main.o util.o
	g++ -o app main.o util.o

main.o: main.cpp util.h
	g++ -c main.cpp
```

동작 원리는 훌륭하지만, 의존 관계를 손으로 적어야 해서 프로젝트가 커지면 관리가 고됩니다. 그래서 오늘날엔 대부분 CMake를 씁니다.

## CMake — 오늘날의 표준

CMake는 Makefile을 **직접 쓰는 대신 생성해 주는** 상위 도구입니다. 플랫폼·컴파일러 차이를 흡수해서, 같은 `CMakeLists.txt`로 macOS·Linux·Windows에서 빌드됩니다. 현대 C++ 프로젝트의 사실상 표준입니다.

```cmake
# CMakeLists.txt
cmake_minimum_required(VERSION 3.16)
project(myapp)

set(CMAKE_CXX_STANDARD 17)

add_executable(app main.cpp util.cpp)   # 소스만 나열하면 의존 관계는 자동
```

빌드는 두 명령입니다.

```sh
cmake -B build              # build/ 에 빌드 파일 생성
cmake --build build         # 실제 컴파일
```

의존 관계를 손으로 관리하던 Make의 부담이 사라집니다. 외부 라이브러리 연결(`target_link_libraries`), 컴파일 옵션(`target_compile_options`)도 선언적으로 붙입니다.

## 에디터·도구와 연결

CMake는 `compile_commands.json`(각 파일을 어떤 옵션으로 컴파일하는지 기록)을 뽑을 수 있습니다.

```cmake
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
```

이 파일이 있으면 clangd 같은 언어 서버가 프로젝트를 정확히 이해해 자동완성·진단을 제공합니다. 여기에 [cpplint·clang-format](/posts/cpp/2024-10-22-cpplint-clangformat/)까지 붙이면 빌드-린트-포맷이 한 줄로 이어집니다.

## 자주 막히는 지점

- **`undefined reference`** — 문법이 아니라 링킹 문제. 해당 `.cpp`·라이브러리가 빌드에 포함됐는지 확인.
- **헤더에 함수 정의** — 여러 곳에서 include되면 중복 정의(ODR 위반). 헤더엔 선언만, 정의는 `.cpp`로. (인라인·템플릿은 예외)
- **include guard 누락** — 같은 헤더가 두 번 포함돼 재정의 에러. `#pragma once`를 헤더 맨 위에.

## 통과 기준 — 그리고 로드맵 완주

- 컴파일 에러와 링커 에러의 차이를 원인으로 설명할 수 있다.
- `undefined reference`를 보고 어디를 봐야 할지 안다.
- 여러 파일 프로젝트를 `CMakeLists.txt`로 빌드할 수 있다.

여기까지 왔다면 [로드맵](/posts/cpp/2026-07-03-cpp-learning-roadmap/)의 필수 경로를 완주한 것입니다. 참조자에서 시작해 자원 관리·이동 시맨틱을 지나 프로젝트 빌드까지 — 이제 [나중]·[선택]으로 미뤄둔 주제들을 실무에서 필요할 때 하나씩 채우면 됩니다.

## Reference

- [씹어먹는 C++ 강좌 19~20강 (modoocode)](https://modoocode.com/category/C++) — Make·CMake·컴파일 과정의 한글 상세
- [CMake 공식 튜토리얼](https://cmake.org/cmake/help/latest/guide/tutorial/index.html)
