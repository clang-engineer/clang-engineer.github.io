---
layout  : wiki
title   : size_t의 의미
summary : 
date    : 2022-07-13 13:17:55 +0900
updated : 2022-07-13 13:18:28 +0900
tags    : 
toc     : true
public  : true
parent  : [[clang/index]]
latex   : false
---
* TOC
{:toc}

# size_t의 의미 

- size_t 는 unsigned int 이며, 문자열이나 메모리의 사이즈를 나타낼 때 사용합니다.
```cpp
// unsigned int를  size_t로 정의
typedef unsigned int size_t;
```
- size_t는 32비트 시스템에서는 부호 없는 4바이트 정수이며, 64비트 시스템에서는 부호 없는 8바이트 정수입니다.
(<-> unsigned int는 32비트 시스템에서 4바이트 정수이며, 64비트 시스템에서 4바이트 정수입니다.)
- 메모리나 문자열등의 크기를 구할 때 unsigned int를 사용하면 32비트 시스템에서는 문제가 없지만, 64비트 시스템에서는 문제가 발생할 수 있습니다. 
따라서, size_t를 사용하여 크기를 구하는 것이 좋습니다.

- size_t가 아닌 그냥 unsigned int형에 캐스팅 없이, 문자열 길이를 대입하면 경고가 발생합니다.
```cpp
#include <iostream>
#include <string>

int main()
{
    std::string str = "Hello, World!";
    unsigned int len = str.length(); // warning: conversion to 'unsigned int' from 'std::__cxx11::basic
    std::cout << len << std::endl;
    return 0;
}


> Reference
- http://mwultong.blogspot.com/2007/06/c-sizet-unsigned-int.html
