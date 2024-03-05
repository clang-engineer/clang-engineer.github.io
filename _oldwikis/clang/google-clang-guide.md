---
layout  : wiki
title   : Google cpp style guide
summary : 
date    : 2023-04-20 15:24:30 +0900
updated : 2023-04-20 15:30:23 +0900
tags    : 
toc     : true
public  : true
parent  : [[clang/index]]
latex   : false
---
* TOC
{:toc}


# Code Style

## clang-format
- 전체적인 코드 스타일은 clang-format >> GoogleStyle 옵션을 사용한다.

## Naming

### 1. CamelCase
- 클래스와 함수는 CamelCase를 사용한다.
- 대소문자로 띄어쓰기를 구분한다.

### 2. snake_case
- 변수나 클래스의 필드 이름들은 모두 snake_case를 사용한다.
- 모두 소문자를 사용하고 띄어쓰기를 _로 구분한다.
 
### 3. 예외
- enum 필드의 경우 KEBAB_CASE를 사용한다.
- 모두 대문자를 사용하고 띄어쓰기를 _로 구분한다.


# Namespace
- 모든 코드는 namespace를 사용한다.
- 헤더 파일에  using namespace를 사용하지 않는다.


# Test
- 모든 코드는 테스트 코드를 작성한다.
- 테스트 코드는 google test를 사용한다.

# 클래스 관련

## struct
- struct는 간단한 데이터 컨테이너로 사용한다. (POD: Plain Old Data)
- struct로 표현되는 데이터에는 어떠한 로직도 구현하지 않고, 필요한 경우 무조건 class를 사용한다.

## 상속(Inheritance) vs 구성(Composition)
- 되도록 상속보다는 구성을 사용한다.
- 명확한 is-a 관계가 있는 경우에만 상속을 사용한다.


# 함수 관련
- out parameter는 되도록 사용하지 않는다.
- 결과를 설정하는 함수 보다는 결과를 반환하는 함수를 사용한다.


>> reference
- [모두의 코드](https://modoocode.com/335)
- [Google C++ Style Guide](https://google.github.io/styleguide/cppguide.html)