---
layout  : wiki
title   : Class Text Copy
summary : 
date    : 2024-11-27 16:18:02 +0900
updated : 2024-11-27 16:18:02 +0900
tags    : 
toc     : true
public  : true
parent  : [[java/index]]
latex   : false
---
* TOC
{:toc}


# Class Text Copy
- 작업 환경에서 파일을 직접 적으로 옮기는 것이 어려울 경우 텍스트로 변환하여 복사하는 방법

# 16진수(hex) 사용
## 1. 파일을 16진수로 변환
1. Linux/Mac
```sh
xxd -p MyClass.class > MyClass.class.hex
```

2. Windows
```cmd
certutil -encodehex MyClass.class MyClass.class.hex 0
```

## 2. hex 내용 복사 & 붙여넣기
## 3. 목적지 시스템에서 바이너리로 복원

1. Linux/Mac
```sh
xxd -r -p MyClass.class.hex > MyClass.class
```

2. Windows
```cmd
certutil -decodehex MyClass.class.hex MyClass.class 0
```



# Base64 인코딩 사용

## 1. 파일을 Base64로 인코딩

1. Linux/Mac
```sh
base64 -w 0 MyClass.class > MyClass.class.base64
```

2. Windows
```cmd
certutil -encodebase64 MyClass.class MyClass.class.base64
```

## 2. base64 내용 복사 & 붙여넣기
## 3. 목적지 시스템에서 디코딩

1. Linux/Mac
```sh
base64 -d MyClass.class.base64 > MyClass.class
```

2. Windows
```cmd
certutil -decodebase64 MyClass.class.base64 MyClass.class
```