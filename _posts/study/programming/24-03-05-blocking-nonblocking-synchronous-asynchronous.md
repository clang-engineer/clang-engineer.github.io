---
title       : Blocking, Non-Blocking, Syncronous, Asynchronous Programming
description : >-
  Blocking, Non-Blocking, Syncronous, Asynchronous Programming 에 대해 정리
date        : 2024-03-05 15:02:03 +0900
updated     : 2024-03-05 15:02:43 +0900
categories  : [study, programming]
tags        : [blocking, non-blocking, syncronous, asynchronous]
pin         : false
hidden      : false
---

![Blocking vs Non-Blocking](https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdn%2FkB73F%2FbtsJ2WyZjAv%2F0Bnwvu1c0JFDcUR1cXiLWK%2Fimg.png)
> 출처: [Homoefficio](https://homoefficio.github.io/2017/02/19/Blocking-NonBlocking-Synchronous-Asynchronous/)

## Blocking vs Non-Blocking
제어권을 요청자에게 넘겨주는지 여부에 따라 Blocking과 Non-Blocking으로 나뉜다.
> 제어권은 자신(함수)의 코드를 실행할 권리와 유사한 개념으로, 제어권을 가진 함수는 자신의 코드를 끝까지 실행한 후, 자신을 호출한 함수에게 돌려준다.

### Blocking
- A함수가 B함수를 호출하면 제어권을 B함수에게 넘겨준다.<br>
(요청자가 I/O 작업이 완료될 때까지 기다리는 프로그래밍 방식이다. 즉, 요청자가 I/O 작업이 완료될 때까지 다른 작업을 수행할 수 없다.)

### Non-Blocking
- A함수가 B함수를 호출해도 제어권을 그대로 자신이 가지고 있다.<br>
(요청자가 I/O 작업이 완료될 때까지 기다리지 않고 다른 작업을 수행할 수 있는 프로그래밍 방식이다. 즉, 요청자가 I/O 작업이 완료될 때까지 다른 작업을 수행할 수 있다.)

---

## Synchronous vs Asynchronous
호출되는 함수의 작업 완료 여부를 신경쓰는지 여부에 따라 Synchronous와 Asynchronous로 나뉜다.

### Synchronous
- 함수 A가 함수 B를 호출한 뒤, 함수 B의 작업 완료 여부를 신경쓰는 방식. <br>
(함수 B의 리턴값이 필요할 때)

### Asynchronous
- 함수 A가 함수 B를 호출한 뒤, 함수 B의 작업 완료 여부를 신경쓰지 않는 방식. <br>
(함수 B의 리턴값이 필요하지 않을 때)<br>
- 콜백 함수를 함께 전달하여, 함수 B의 작업이 완료되면 콜백 함수를 호출하도록 한다.

### Asnychronus Programming Model
- Asynchronous 프로그래밍을 가능하게 하는 것은 multi-threading, non-blocking I/O, event-driven programming 등의 방식이 있다.
- 근래의 백엔드 프로그래밍의 추세는 스레드를 적게 쓰면서 non-block i/o를 통해 전체 처리량을 높이는 방향으로 발전하고 있다.


--- 

## 프로그래밍 모델

### Sync-Blocking
함수 A는 함수 B의 리턴값을 필요로 한다(동기). A함수는 호출 후 제어권을 함수 B에게 넘겨주고, 함수 B가 실행을 완료하여 리턴값과 제어권을 돌려줄때까지 기다린다(블로킹).

### Sync-NonBlocking
A 함수는 B 함수를 호출한다. 이 때 A 함수는 B 함수에게 제어권을 주지 않고, 자신의 코드를 계속 실행한다(논블로킹).

그런데 A 함수는 B 함수의 리턴값이 필요하기 때문에, 중간중간 B 함수에게 함수 실행을 완료했는지 물어본다(동기).

### Async-NonBlocking
A 함수는 B 함수 호출 후 제어권을 B 함수에 주지 않고, 자신이 계속 가지고 있는다(논블로킹). (멈추지 않고 자신의 코드를 계속 실행)

B 함수를 호출할 때 콜백함수를 함께 준다. B 함수는 자신의 작업이 끝나면 A 함수가 준 콜백 함수를 실행한다(비동기).

### Async-Blocking
A 함수는 B 함수의 리턴값에 신경쓰지 않고, 콜백함수를 보낸다(비동기).
이 때 A 함수는 B 함수에게 제어권을 넘긴다(블로킹).

* A 함수는 B 함수의 리턴값을 필요로 하지 않지만, B 함수가 실행을 완료할 때까지 기다려야 한다.
* Async-blocking의 경우 Sync-blocking과 성능차이가 없기 때문에 사용하지 않는다.


> 참고 & 출처
- [Boost application performance with asynchronous I/O](https://www.ibm.com/developerworks/library/l-async/)
- [homefficio](https://homoefficio.github.io/2017/02/19/Blocking-NonBlocking-Synchronous-Asynchronous/)