---
title       : "C++ 컴파일·링킹과 CMake — Source에서 Executable까지"
description : "C++ source가 전처리·컴파일·어셈블·링크를 거쳐 실행 파일이 되는 모델을 먼저 잡고, declaration/definition·translation unit·ODR·undefined reference의 원인을 연결한 뒤, 여러 target을 CMake로 구성하는 최소 흐름까지 설명한다."
date        : 2026-07-03 11:20:00 +0900
updated     : 2026-09-06 13:55:00 +0900
categories  : [cpp]
tags        : [modern-cpp, build, cmake, linker]
pin         : false
hidden      : false
---

> [모던 C++ 학습 로드맵](./2026-07-03-cpp-learning-roadmap.md)에서 **처음부터 깔리는 Program Model이자, Project가 커질 때 다시 들어오는 Build Branch**다.

C++에서 `g++ main.cpp` 한 줄은 여러 단계를 감춘다. 이 글의 첫 목적은 CMake 문법을 외우는 것이 아니라 **오류가 어느 단계에서 생겼는지 구분할 수 있는 좌표**를 만드는 것이다.

```text
source
→ preprocess
→ compile
→ assemble
→ object files
→ link
→ executable / library
```

그 위에서 파일과 target이 많아졌을 때 Make·Ninja 같은 build executor와 CMake 같은 build configuration/generation 도구가 왜 필요한지 본다.

## 1. Translation Unit — Compiler가 실제로 보는 단위

C++ compiler가 `.cpp` 파일만 그대로 읽는 것은 아니다. 전처리 단계에서 `#include`, macro, conditional compilation 등이 처리된 결과가 **translation unit**의 기반이 된다.

```text
main.cpp
 + included headers
 + macro expansion
        ↓
preprocessed translation unit
```

그래서 header의 변경이 여러 `.cpp`의 재컴파일로 이어질 수 있다.

## 2. Source가 실행 파일이 되기까지

개념적으로 단계를 나누면 다음과 같다.

| 단계 | 핵심 작업 | 대표 중간 결과 |
|---|---|---|
| Preprocess | `#include`, macro, conditional directive 처리 | preprocessed source |
| Compile | C++ 의미 분석·최적화 후 assembly/중간 표현 생성 | assembly 등 |
| Assemble | assembly를 machine code·relocation 정보로 변환 | object file (`.o`/`.obj`) |
| Link | object/library의 symbol reference를 해소하고 최종 image 구성 | executable / shared/static library |

실제 compiler driver는 이 단계를 한 명령으로 묶고 내부 표현도 구현마다 다를 수 있다. 중요한 것은 **compile-time language error와 link-time symbol resolution error가 다른 계층**이라는 점이다.

```bash
g++ -c main.cpp -o main.o   # compile + assemble, link는 하지 않음
g++ main.o util.o -o app    # link
```

## 3. Declaration·Definition과 `undefined reference`

다른 translation unit에 있는 함수를 호출하려면 현재 파일에서는 최소한 declaration을 알아야 한다.

```cpp
// util.hpp
int add(int a, int b); // declaration
```

```cpp
// util.cpp
int add(int a, int b) { // definition
    return a + b;
}
```

```cpp
// main.cpp
#include "util.hpp"

int main() {
    return add(1, 2);
}
```

`main.cpp`는 `add`의 declaration을 보고 호출 코드를 만들 수 있다. 최종 link 단계에서는 그 symbol의 실제 definition이 필요하다.

```text
compile 성공
+ link 실패
→ declaration은 보였지만 최종 link graph에서 definition을 못 찾았을 가능성
```

대표 오류가 `undefined reference` 또는 플랫폼별 equivalent linker diagnostic이다.

흔한 원인은 다음과 같다.

- definition이 있는 source/object를 target에 넣지 않았다.
- 필요한 library를 link하지 않았다.
- declaration과 definition의 signature/namespace/linkage가 다르다.
- template/inline definition의 가시성 규칙을 잘못 이해했다.

## 4. Header에는 선언, `.cpp`에는 정의? — 기본 관례이지 절대 규칙은 아니다

초기 학습에서는 다음 분리가 이해하기 쉽다.

```text
header
→ 다른 translation unit이 알아야 하는 interface

.cpp
→ 외부에 노출할 필요가 없는 implementation definition
```

하지만 “header에는 definition을 넣으면 안 된다”는 규칙으로 외우면 틀린다.

- class definition은 보통 header에 있다.
- function template의 definition은 instantiation 지점에서 보여야 해 header에 두는 경우가 일반적이다.
- `inline`/class-body definition/`constexpr` 등은 ODR 규칙 안에서 여러 translation unit에 나타날 수 있다.
- internal linkage나 module을 사용하면 구조가 또 달라진다.

핵심은 **파일 확장자가 아니라 linkage와 ODR(One Definition Rule)**이다.

## 5. ODR — “같은 이름이 몇 번 보여도 되나?”의 규칙

ODR은 단순히 “definition은 무조건 프로그램 전체에 딱 하나”라고 외울 수 있는 규칙이 아니다. Entity 종류와 linkage, inline/template 여부에 따라 허용되는 형태가 다르다.

입문 단계에서는 다음 두 질문으로 시작하면 충분하다.

```text
이 definition은 여러 translation unit에 나타날 수 있는 종류인가?
→ inline / template 등의 ODR 조건 확인

최종 program에서 하나의 external definition이 필요한 entity인가?
→ 중복 또는 누락 여부 확인
```

ODR diagnostic은 compiler/linker가 항상 완벽하게 잡아준다고 가정하지 않는다.

## 6. Build System이 해결하는 문제

파일이 늘어나면 명령을 직접 반복하는 것이 문제가 된다.

```text
어떤 source가 어떤 target에 들어가나?
어떤 header 변경이 무엇을 다시 compile하게 하나?
어떤 library를 어떤 순서/옵션으로 link하나?
Debug/Release option은 어떻게 바꾸나?
Platform/compiler마다 명령을 어떻게 구성하나?
```

이 문제를 해결하는 층이 build system이다.

### Make

Make는 target·dependency·recipe를 선언하고 **무엇을 다시 실행해야 하는지** 판단하는 전통적인 도구다.

```makefile
app: main.o util.o
	$(CXX) -o app main.o util.o

main.o: main.cpp util.hpp
	$(CXX) -c main.cpp
```

Make 자체가 C++ 전용인 것은 아니다.

### Ninja

Ninja는 빠르고 단순한 build executor로 많이 사용되며, 사람이 대형 `build.ninja`를 직접 작성하기보다 CMake 같은 도구가 생성하는 backend로 자주 사용된다.

## 7. CMake — Project의 Target 관계를 기술한다

CMake를 “Makefile을 생성해주는 도구”로 한정하면 Windows/Xcode/Ninja 같은 backend를 설명할 수 없다.

더 정확한 모델은 다음이다.

```text
CMakeLists.txt
→ CMake configure/generate
→ 선택한 build backend
   ├─ Ninja
   ├─ Unix Makefiles
   ├─ Visual Studio
   └─ Xcode 등
→ compiler / linker 실행
```

즉 CMake는 **project/target 관계와 build requirement를 기술하고, 선택한 generator에 맞는 build graph를 만든다.**

## 8. 최소 CMake — Global flag보다 Target 중심으로

```cmake
cmake_minimum_required(VERSION 3.20)
project(myapp LANGUAGES CXX)

add_executable(app
  main.cpp
  util.cpp
)

target_compile_features(app PRIVATE cxx_std_20)
```

Build는 source tree 밖의 directory를 쓰는 방식이 일반적이다.

```bash
cmake -S . -B build
cmake --build build
```

`target_compile_features`처럼 **target에 requirement를 붙이는 방식**은 대형 project에서 global flag를 무작정 바꾸는 것보다 관계를 읽기 쉽다.

외부 library도 target 관계로 연결한다.

```cmake
target_link_libraries(app PRIVATE mylib)
```

## 9. Header dependency는 누가 추적하나

CMakeLists에 source를 적었다고 모든 dependency를 CMake가 source code 수준에서 직접 이해하는 것은 아니다.

일반적으로 compiler가 생성하는 dependency 정보와 build backend가 함께 header dependency를 추적한다. CMake는 그 build graph와 compiler invocation을 구성하는 상위 층이다.

이 계층을 구분하면 “CMake가 include를 자동으로 찾아준다” 같은 모호한 설명을 피할 수 있다.

## 10. `compile_commands.json` — Build 정보가 Editor로 연결되는 지점

CMake는 지원 generator에서 compilation database를 만들 수 있다.

```cmake
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
```

또는 configure 시 option으로 켤 수 있다.

```bash
cmake -S . -B build -DCMAKE_EXPORT_COMPILE_COMMANDS=ON
```

`compile_commands.json`에는 source file별 compiler command가 들어가고 clangd 같은 Language Server가 이를 읽어 include path·define·standard option을 정확히 재현할 수 있다.

```text
Build configuration
→ compile_commands.json
→ clangd
→ editor diagnostics/completion
```

[cpplint·clang-format](./2024-10-22-cpplint-clangformat.md)은 이와 다른 **Style/Static Tool 축**이다.

## 11. Diagnostic을 계층으로 읽기

```text
Preprocessor 문제
→ include file not found / macro 문제

Compile 문제
→ syntax / type / template diagnostic

Link 문제
→ undefined reference / duplicate symbol

Runtime 문제
→ 실행 후 crash / UB / logic error

Build configuration 문제
→ 잘못된 source·library·flag·generator 관계
```

오류 메시지를 볼 때 먼저 **어느 단계가 실패했는가**를 찾으면 탐색 범위가 크게 줄어든다.

## 통과 기준

다음을 설명할 수 있으면 이 문서의 목적은 달성한 것이다.

- translation unit과 source file의 관계
- compile/assemble/link의 차이
- declaration을 봤는데도 link에서 definition이 필요한 이유
- header definition이 항상 금지되는 것이 아닌 이유
- CMake와 Ninja/Make/compiler가 서로 다른 층인 이유
- `compile_commands.json`이 Editor Tooling과 연결되는 이유

Roadmap으로 돌아가면 이 모델 위에서 [참조·객체 수명](./2026-07-03-cpp-reference-and-dynamic-allocation.md)을 배우고, Project가 커졌을 때 다시 CMake 부분으로 돌아오면 된다.

## Reference

- [CMake Tutorial](https://cmake.org/cmake/help/latest/guide/tutorial/index.html)
- [CMake Buildsystem Manual](https://cmake.org/cmake/help/latest/manual/cmake-buildsystem.7.html)
- [cppreference — Definitions and ODR](https://en.cppreference.com/w/cpp/language/definition)
