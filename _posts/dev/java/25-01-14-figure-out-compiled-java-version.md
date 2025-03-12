---
title       : 컴파일된 코드로부터 java 버전 확인하기
description : 
date        : 2025-01-14 09:00:45 +0900
updated     : 2025-01-14 09:01:11 +0900
categories  : [dev, java]
tags        : [java, compile]
pin         : false
hidden      : false
---

정상적으로 컴파일 된 클래스 파일이 다른 환경에서 정상적으로 실행되자 않을 때가 종종 있다. <br>
(ex> Unsupported major.minor version 52.0 등의 에러) <br>
이럴 때, javap 명령어를 사용하여 클래스 파일의 컴파일 버전을 확인 할 수 있다.

## javap 명령어
- javap 명령어는 클래스 파일의 바이트 코드를 역어셈블링하여 보여주는 명령어.
- javap 명령어를 사용하여 클래스 파일의 컴파일 버전을 확인할 수 있다.

```bash
$ javap -verbose YourClassName.class | grep "major version"  # windows의 경우 grep 대신 findstr 사용

> major version: 52
```

## Major vs Java 버전 대응표

| Major 버전 | Java 버전 |
| ---        | ---       |
| 45         | Java 1.1  |
| 46         | Java 1.2  |
| 47         | Java 1.3  |
| 48         | Java 1.4  |
| 49         | Java 5    |
| 50         | Java 6    |
| 51         | Java 7    |
| 52         | Java 8    |
| 53         | Java 9    |
| 54         | Java 10   |
| 55         | Java 11   |
| 56         | Java 12   |
| 57         | Java 13   |
| 58         | Java 14   |
| 59         | Java 15   |
| 60         | Java 16   |
| 61         | Java 17   |