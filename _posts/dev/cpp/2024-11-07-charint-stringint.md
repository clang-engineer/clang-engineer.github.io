---
title       : c++ 에서 char, string, int 변환
description :
date        : 2024-11-07 11:44:14 +0900
updated     : 2025-02-21 22:50:42 +0900
categories  : [dev, c++]
tags        : [c++, char, string, int, transform]
pin         : false
hidden      : false
---


# char to int
```cpp
// 방법1. 형 변환을 사용한다.
char c = '1';
int i = (int)c; // static_cast<int>(c);

// 방법2-1. '0'을 빼주면 된다. ('1'의 아스키코드 값은 49, '0'의 아스키코드 값은 48)
char c = '1';
int i = c - '0';

// 방법2-2. 
char c = '1';
int i = c - 48;
```

# string to int

```cpp
// 방법1. stoi() 함수를 사용한다.
string s = "123";
int i = stoi(s);

// 방법2. atoi() 함수를 사용한다.
string s = "123";
int i = atoi(s.c_str()); // c_str() 함수는 string을 char*로 변환한다.
```

# int to char
```cpp
// 방법1. 형 변환을 사용한다.
int i = 1;
char c = (char)i; // static_cast<char>(i);

// 방법2. '0'을 더해주면 된다. (1의 아스키코드 값은 49, 0의 아스키코드 값은 48)
int i = 1;
char c = i + '0';
```

# int to string
```cpp
// 방법1. to_string() 함수를 사용한다.
int i = 123;
string s = to_string(i);

// 방법2. stringstream을 사용한다.
int i = 123;
stringstream ss;
ss << i;
string s = ss.str();
```
