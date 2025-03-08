---
title       : Syncronous, Asynchronous Programming
description : >-
  Syncronous, Asynchronous 프로그래밍에 대해 알아보자.
date        : 2024-03-05 15:02:03 +0900
updated     : 2024-03-05 15:02:43 +0900
categories  : [study, programming]
tags        : [syncronous, asynchronous]
pin         : false
hidden      : false
---

## Synchronous
- Synchronous 프로그래밍은 순차적으로 실행되는 프로그래밍 방식이다. 즉, 한 작업이 끝나야 다음 작업을 수행할 수 있다. 

## Asynchronous
- Asynchronous 프로그래밍은 병렬적으로 실행되는 프로그래밍 방식이다. 즉, 한 작업이 끝나지 않아도 다음 작업을 수행할 수 있다. 

### Asnychronus Programming Model
- Asynchronous 프로그래밍을 가능하게 하는 것은 multi-threading, non-blocking I/O, event-driven programming 등의 방식이 있다.
- 근래의 백엔드 프로그래밍의 추세는 스레드를 적게 쓰면서 non-block i/o를 통해 전체 처리량을 높이는 방향으로 발전하고 있다.

## I/O 관점에서의 비교
- synchronous I/O = blocking I/O, 요청자가 i/o 완료까지 챙겨야 함
- asynchronous I/O = non-blocking I/O, 완료를 noti 받거나 callback을 통하여 처리

> 참고 & 출처
- [쉬운코드](https://www.youtube.com/@ez.)
- [Boost application performance with asynchronous I/O](https://www.ibm.com/developerworks/library/l-async/)