---
title       : C++ 컴파일 시 표준(extension) 관련 에러
description : 'auto, ranged-for 등 표준 기능이 "extension"으로 경고/에러 나면 -std= 옵션으로 명시'
date        : 2022-07-17 23:01:53 +0900
updated     : 2026-06-13 10:00:00 +0900
categories  : [cpp]
tags        : [c++, compile, gcc, clang, cmake]
pin         : false
hidden      : false
---

## 증상

```
warning: 'auto' type specifier is a C++11 extension
'auto' return without trailing return type; deduced return types are a C++14 extension
```

컴파일러가 기본 모드(`-std=gnu++98` 같은 옛 표준)로 동작 중이라, 새 표준 기능을 "extension"이라며 경고한다.

## 어떤 표준에서 뭐가 들어왔나

| 기능 | 표준 |
|---|---|
| `auto` 변수 타입 | C++11 |
| `auto` 반환 추론 (`auto f() { ... }`) | C++14 |
| ranged-for (`for (auto& x : v)`) | C++11 |
| `constexpr` | C++11, 확장 C++14/17/20 |
| 구조적 바인딩 (`auto [a, b] = ...`) | C++17 |
| Concepts | C++20 |
| Modules | C++20 |

쓰는 기능이 어느 표준에 속하는지 보고 그에 맞춰 옵션을 준다.

## 명령줄로 표준 지정

```sh
g++ -std=c++17 main.cpp -o main
clang++ -std=c++20 main.cpp -o main
```

`-std=gnu++17`은 표준 + GNU 확장. 더 관대하지만 다른 컴파일러에서 안 될 수 있으니 보통 `c++17`이 안전하다.

## Makefile

```make
CXXFLAGS = -std=c++17 -Wall -Wextra
```

## CMake

```cmake
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)       # gnu++17이 아니라 c++17
```

`CMAKE_CXX_STANDARD_REQUIRED ON`은 컴파일러가 그 표준을 지원하지 않으면 fallback 없이 에러로 실패하게 한다.

## VS Code (clangd / IntelliSense)

`.vscode/c_cpp_properties.json`:

```json
{
  "configurations": [
    {
      "name": "Mac",
      "cppStandard": "c++17",
      "intelliSenseMode": "macos-clang-arm64"
    }
  ]
}
```

clangd를 쓰면 `compile_commands.json`(CMake가 `-DCMAKE_EXPORT_COMPILE_COMMANDS=ON`으로 생성) 정보를 보고 자동으로 표준을 맞춘다 — 별도 설정 불필요.

## 일회용 alias

매번 옵션 주기 귀찮으면:

```sh
echo 'alias g++="g++ -std=c++17"' >> ~/.bashrc
source ~/.bashrc
```

다만 빌드 시스템(make/cmake)에 명시하는 게 협업에는 더 안전하다.
