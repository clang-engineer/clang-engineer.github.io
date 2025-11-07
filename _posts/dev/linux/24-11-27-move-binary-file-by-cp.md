---
title       : 바이너리 파일을 텍스트로 변환하여 복사 붙여넣기
description : >-
    작업 환경에서 컴파일된 파일을 직접 옮기는 것이 어려울 경우 텍스트로 변환하여 복사하는 방법에 대해 알아봅니다.
    (바이너리 파일을 텍스트로 변환하여 복사 붙여넣기)
date        : 2025-02-21 22:50:30 +0900
updated     : 2025-02-21 22:50:42 +0900
categories  : [dev, linux]
tags        : [binary, text, base64, xxd, file-transfer]
pin         : false
hidden      : false
---


- 작업 환경에서 파일을 직접 적으로 옮기는 것이 불가능하고, 클립보드를 통해 텍스트로만 복사 붙여넣기가 가능한 경우가 있었고,
 이때 컴파일된 파일을 텍스트로 복사 붙여넣기하니 파일이 깨지는 문제가 발생했습니다.
- 이때, 파일을 특정 방식(16진수, Base64)으로 변환하여 텍스트로 복사 붙여넣기하고, 목적지 시스템에서 다시 바이너리로 변환하여 사용할 수 있습니다.

## 16진수(hex) 사용
1. 파일을 16진수로 변환
```sh
xxd -p MyClass.class > MyClass.class.hex # Linux/Mac
certutil -encodehex MyClass.class MyClass.class.hex 0 # Windows
```
2. hex 내용 복사 & 붙여넣기
3. 목적지 시스템에서 바이너리로 복원
```sh
xxd -r -p MyClass.class.hex > MyClass.class # Linux/Mac
certutil -decodehex MyClass.class.hex MyClass.class 0 # Windows
```

## Base64 인코딩 사용
1. 파일을 Base64로 인코딩
```sh
base64 -w 0 MyClass.class > MyClass.class.base64 # Linux/Mac
certutil -encodebase64 MyClass.class MyClass.class.base64 # Windows
```

2. base64 내용 복사 & 붙여넣기
3. 목적지 시스템에서 디코딩
```sh
base64 -d MyClass.class.base64 > MyClass.class # Linux/Mac
certutil -decodebase64 MyClass.class.base64 MyClass.class # Windows
```
