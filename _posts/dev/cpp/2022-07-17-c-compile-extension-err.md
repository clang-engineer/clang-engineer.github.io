---
title       : c++ 컴파일시 extension 에러나는 경우
description :
date        : 2022-07-17 23:01:53 +0900
updated     : 2025-02-21 22:50:42 +0900
categories  : [dev, c++]
tags        : [c++, compile, extension error]
pin         : false
hidden      : false
---

# 컴파일 에러
컴파일시 확장팩들을 잘 인식 못 하는 경우가 있었습니다. 이 경우 아래와 같은 에러들이 발생합니다.
```shell
warning: 'auto' type specifier is a C++12 extension
'auto' return without trailing return type; deduced return types are a C++14 extension
```

# 해결 방법
1. g++ 명령시 c++ 버전을 옵션으로 전달
```sh
g++ -std=c++11 <filename> 
```

2. .bash_profie에 alias를 추가해서 g++ 사용시마다 옵션을 사용하도록
```sh
echo 'alias g++="g++ -std=c++14"' >> ~/.bash_profile
source ~/.bash_profile
```
