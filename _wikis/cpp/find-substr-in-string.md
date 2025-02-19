---
layout  : wiki
title   : C++ - Find Substring in String
summary : 
date    : 2024-10-22 13:33:14 +0900
updated : 2024-10-22 13:33:14 +0900
tags    : 
toc     : true
public  : true
parent  : 
latex   : false
---
* TOC
{:toc}


# Find Substring in String
- `std::string::find()` 함수를 사용하여 문자열에서 특정 문자열을 찾을 수 있다.
- `std::string::find()` 함수는 찾은 문자열의 위치를 반환하며, 찾지 못한 경우 `std::string::npos`를 반환한다.
- `std::string::find()` 함수는 두 번째 인자로 찾기 시작할 위치를 지정할 수 있다.
- `std::string::find()` 함수를 사용하여 문자열에서 특정 문자열이 몇 번 등장하는지 세는 함수를 작성할 수 있다.

```cpp
int CountOccurrences(const std::string& str, const std::string& target) {
    int count = 0;
    size_t pos = str.find(target);

    while (pos != std::string::npos) {
        count++;
        pos = str.find(target, pos + 1); // find next occurrence
    }

    return count;
}

int main() {
    std::string str = "Hello, World! Hello, C++!";
    std::string target = "Hello";

    int count = CountOccurrences(str, target);
    std::cout << "Number of occurrences: " << count << std::endl;

    return 0;
}
```