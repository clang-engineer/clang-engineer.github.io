---
title       : Return과 Exit의 차이
description :
date        : 2024-10-07 15:36:25 +0900
updated     : 2025-10-03 11:53:39 +0900
tags        : [baekjoon, remainder sum]
categories  : [study, cs]
pin         : false
hidden      : false
---

## Return
- return? 함수를 종료할 때 사용한다.

## Exit
- 프로세스를 종료할 때 사용한다.
- stdlib.h 헤더파일을 include하여 사용.
- exit(0)은 정상종료, exit(1)은 에러메시지 종료

## 차이
- exit()함수는 바로 프로세스 종료. return 은 뒤 문장을 실행하며 종료.
- return 은 일반 함수 속에서 return 문을 사용하면 그 함수만 종료되지만, main() 함수 속의 return 문은 프로그램 전체를 중지시킴.
