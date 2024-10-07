---
layout  : wiki
title   : 문자열 구분자로 분리하기
summary : 
date    : 2024-10-07 15:36:25 +0900
updated : 2024-10-07 15:38:50 +0900
tags    : 
toc     : true
public  : true
parent  : [[cpp/index]]
latex   : false
---
* TOC
{:toc}

# 문자열 구분자로 분리하기
 
```cpp
int main() {
    std::istringstream iss(my_string);
    
    string s;
    
    while ( getline( iss, s, ' ' ) ) {
       std::cout << s << std::endl;
    }
    
    return 0;
}
```
