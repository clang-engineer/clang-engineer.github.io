---
layout  : wiki
title   : char, string, int 변환 
summary : 
date    : 2024-11-07 11:44:14 +0900
updated : 2024-11-07 11:44:31 +0900
tags    : 
toc     : true
public  : true
parent  : [[cpp/index]]
latex   : false
---
* TOC
{:toc}


# char to int
## 방법 1
```cpp
char c = '1';
int i = c - '0';
```

## 방법 2
```cpp
char c = '1';
int i = (int)c; // static_cast<int>(c);
```

## 방법 3
```cpp
char c = '1';
int i = c - 48;
```

---
# string to int
## 방법 1
```cpp
string s = "123";
int i = stoi(s);
```
## 방법 2
```cpp
string s = "123";
int i = atoi(s.c_str());
```

---
# int to char
## 방법 1
```cpp
int i = 1;
char c = i + '0';
```
## 방법 2
```cpp
int i = 1;
char c = (char)i; // static_cast<char>(i);
```

---
# int to string
## 방법 1
```cpp
int i = 123;
string s = to_string(i);
```
## 방법 2
```cpp
int i = 123;
stringstream ss;
ss << i;
string s = ss.str();
```