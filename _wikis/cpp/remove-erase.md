---
layout  : wiki
title   : remove, erase
summary : 
date    : 2024-10-18 09:33:11 +0900
updated : 2024-10-18 09:33:36 +0900
tags    : 
toc     : true
public  : true
parent  : [[cpp/index]]
latex   : false
---
* TOC
{:toc}

# remove, erase
- c++ 에서 원소를 제거할 때 두 함수를 함께 사용하는 경우가 많다.
- `remove`와 `erase`는 둘 다 원소를 제거하는 함수이지만, 사용하는 방식이 다르다. 

## 예시
```cpp
#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> vec = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    // remove all 3s from vector
    vec.erase(std::remove(vec.begin(), vec.end(), 3), vec.end());

    for (auto i : vec) {
        std::cout << i << " ";
    }
    std::cout << std::endl;

    return 0;
}
```

# remove
- 알고리즘 함수로, STL(Standard Template Library)에서 제공하는 함수이다.
- 범용 알고리즘으로 컨테이너 종류에 상관없이 사용할 수 있다. vector, list, deque, set, map 등등
- `remove`는 해당 값을 제거하는 것이 아니라, 제거할 값을 뒤로 보내고, 그 뒤에 있는 값을 앞으로 당기는 방식이다. 
- `remove`의 반환값은 제거된 마지막 원소의 다음 위치를 반환한다.

```cpp
// remove all 3s from vector
std::remove(start_iterator, end_iterator, value);
```

# erase
- `erase`는 컨테이너의 멤버 함수로 컨테이너의 내부 동작 방식에 따라 달라진다.
- `erase`는 특정 위치의 원소 또는 특정 범위의 원소를 제거한다.

```cpp
// erase element at position 3
vec.erase(vec.begin() + 3);

// erase elements from position 3 to 5
vec.erase(vec.begin() + 3, vec.begin() + 5);
```

# 요약
- `remove`는 해당 값을 제거하는 것이 아니라, 제거할 값을 뒤로 보내고, 그 뒤에 있는 값을 앞으로 당기는 방식이다.
- `erase`는 특정 위치의 원소 또는 특정 범위의 원소를 제거한다.
- `remove`는 범용 알고리즘으로 컨테이너 종류에 상관없이 사용할 수 있다. vector, list, deque, set, map 등등
- `erase`는 컨테이너의 멤버 함수로 컨테이너의 내부 동작 방식에 따라 달라진다.
- `remove` 함수를 사용할 때는 단독으로 사용하지 않고, `erase`와 함께 사용하는 경우가 많다.