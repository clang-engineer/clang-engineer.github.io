---
title       : C++ 문자열/타입 변환과 Google C++ Style 요약
description :
date        : 2026-06-07 12:00:00 +0900
categories  : [cpp]
tags        : []
pin         : false
hidden      : false
---

## 문자열 분리 (split by delimiter)

### `string::find` 기반

```cpp
#include <vector>
#include <string>
using namespace std;

vector<string> split(string input, string delimiter) {
    vector<string> vec;
    int pos = 0;
    string token;

    while ((pos = input.find(delimiter)) != string::npos) {
        token = input.substr(0, pos);
        vec.push_back(token);
        input.erase(0, pos + delimiter.length());
    }
    vec.push_back(input);
    return vec;
}
```

### `stringstream` 기반 (구분자가 char 한 글자)

```cpp
#include <vector>
#include <string>
#include <sstream>
using namespace std;

vector<string> split(const string& str, char delimiter) {
    vector<string> vec;
    string token;
    stringstream ss(str);
    while (getline(ss, token, delimiter)) {
        vec.push_back(token);
    }
    return vec;
}
```

## 타입 변환 (char ↔ int ↔ string)

### `char` → `int`

```cpp
char c = '1';
int i = (int)c;        // 형 변환
int i = c - '0';       // '0'을 빼서 숫자값
```

### `string` → `int`

```cpp
string s = "123";
int i = stoi(s);              // C++11
int i = atoi(s.c_str());      // C-style
```

### `int` → `char`

```cpp
int i = 1;
char c = (char)i;       // 형 변환 (ASCII 1)
char c = i + '0';       // 숫자 → 숫자 문자
```

### `int` → `string`

```cpp
int i = 123;
string s = to_string(i);

// stringstream
stringstream ss;
ss << i;
string s = ss.str();
```

### ASCII 기준값

| 숫자 | 문자 |
|---|---|
| 65 | `A` |
| 97 | `a` |
| 48 | `0` |

## Google C++ Style Guide 요약

### Naming
| 대상 | 컨벤션 |
|---|---|
| 클래스, 함수 | `CamelCase` |
| 변수, 클래스 필드 | `snake_case` |
| enum 값 | `KEBAB_CASE` (UPPER) |

### Namespace
- 모든 코드는 namespace 안에 둔다.
- 헤더에 `using namespace` 금지.

### 클래스 vs struct
- `struct` 는 **POD(Plain Old Data)** 데이터 컨테이너용. 로직 금지.
- 로직이 들어가면 무조건 `class`.

### 상속 vs 구성
- **구성(composition) 우선**, 상속은 명확한 is-a 관계에서만.

### 함수
- out parameter (포인터로 결과 받기) 지양.
- 결과를 설정하는 함수보다 **결과를 반환하는** 함수.

### 도구
- `clang-format`: GoogleStyle 프리셋
- `google test`: `<gtest/gtest.h>`

## 참고

- [Google C++ Style Guide](https://google.github.io/styleguide/cppguide.html)
- [모두의 코드](https://modoocode.com/335)
