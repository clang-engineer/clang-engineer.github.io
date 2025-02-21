---
layout  : wiki
title   : 컴파일된 코드로부터 몇버전으로 컴파일 되었는지 확인하는 방법
summary : 
date    : 2025-01-14 14:34:59 +0900
updated : 2025-01-14 14:39:15 +0900
tags    : 
toc     : true
public  : true
parent  : [[java/index]]
latex   : false
---
* TOC
{:toc}

# 요약 
- 정상적으로 컴파일 된 클래스 파일이 다른 환경에서 정상적으로 실행되자 않을 때가 종종 있습니다. 
- Unsupported major.minor version 52.0 등의 에러가 발생할 때, 컴파일된 클래스 파일의 버전을 확인하는 방법을 소개합니다.
- javap 명령어를 사용하여 클래스 파일의 컴파일 버전을 확인할 수 있습니다.

# javap 명령어
- javap 명령어는 클래스 파일의 바이트 코드를 역어셈블링하여 보여주는 명령어입니다.
- javap 명령어를 사용하여 클래스 파일의 컴파일 버전을 확인할 수 있습니다.
- 아래 명령어를 실행하면 java가 컴파일된 major 버전을 확인할 수 있습니다.

## linux, mac
```bash
javap -verbose YourClassName.class | grep "major version"

# 예시
$ javap -verbose YourClassName.class | grep "major version"
  major version: 52
```

## windows
```cmd
javap -verbose YourClassName.class | findstr "major version"
```

# Major vs Java 버전 대응표

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

