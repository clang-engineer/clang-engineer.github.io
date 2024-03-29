---
layout  : wiki
title   : Computer Science
summary : 
date    : 2023-05-05 21:07:06 +0900
updated : 2023-05-05 21:07:18 +0900
tags    : 
toc     : true
public  : true
parent  : 
latex   : false
---
* TOC
{:toc}

# 동기/비동기, 블로킹/논블로킹, 싱글스레드/멀티스레드, 동시성/병렬성의 차이점은 무엇인가요?
```
- 동기/비동기: 동기는 호출된 함수의 작업이 종료된 후에야 호출한 함수에게 결과를 알려주는 것을 의미하고, 비동기는 호출된 함수의 작업이 종료되지 않더라도 호출한 함수에게 결과를 알려줄 수 있는 것을 의미한다.
- 블로킹/논블로킹: 블로킹은 호출된 함수가 자신의 작업을 모두 마칠 때까지 제어권을 갖고 있는 것을 의미하고, 논블로킹은 호출된 함수가 바로 리턴되어 호출한 함수에게 제어권을 넘겨주는 것을 의미한다.
- 싱글스레드/멀티스레드: 싱글스레드는 하나의 스레드가 작업을 처리하는 것을 의미하고, 멀티스레드는 여러 개의 스레드가 작업을 처리하는 것을 의미한다.
- 동시성/병렬성: 동시성은 멀티스레드 환경에서 하나의 코어에서 멀티스레드가 번갈아가며 실행되는 것을 의미하고, 병렬성은 멀티코어 환경에서 멀티스레드가 동시에 실행되는 것을 의미한다.

* asnychronus programming을 가능하게 하는 것은? 
- multi-threading, non-blocking I/O, event-driven programming

* multi-threading과 multi-processing의 차이점은?
- multi-threading은 하나의 프로세스 내에서 여러 개의 스레드가 작업을 처리하는 것을 의미하고, multi-processing은 여러 개의 프로세스가 작업을 처리하는 것을 의미한다.

* 백엔드 프로그래밍의 추세는?
- 스레드를 최대한 적게 사용하고, 논블로킹 I/O를 통해 전체 시스템의 성능을 극대화하는 방향으로 진행되고 있다.

* synchronous와 asynchronous의 차이점은?
- synchronous I/O: 요청자가 I/O 완료까지 챙겨야 할 때
- asynchronous I/O: 요청자가 I/O 완료를 신경쓰지 않아도 될 때 -> 알림 or 콜백
```

# 프로세스, 스레드, 멀티프로그래밍, 멀티태스킹, 멀티스레딩, 멀티프로세싱의  개념을 설명해주세요.
```
- 프로세스: 실행 중인 프로그램  
- 스레드: 프로세스 내에서 실행되는 흐름의 단위
- 멀티프로그래밍: 여러 개의 프로세스가 번갈아가며 실행되는 것. CPU의 사용률을 최대화 시키는데 목적.
- 멀티태스킹: 여러 개의 프로세스가 동시에 실행되는 것. 실행되는 시간을 매우 짧은 시간 단위로 쪼개어 번갈아가며 실행되는 것. 프로세스의 응답 시간을 최소화 시키는데 목적.
- 멀티스레딩: 하나의 프로세스가 여러 개의 스레드를 동시에 처리하는 것. 하나의 프로세스가 동시에 여러 작업을 실행하는 것을 목적.
- 멀티프로세싱: 여러 개의 프로세스가 동시에 처리되는 것. 두개 이상의 프로세서나 코어를 활용하는 시스템.

ex>
q1. 싱글코어 cpu에 싱글-스레드 프로세스 두개 ?
-> 멀티태스킹 o
-> 멀티스레딩 x
-> 멀티프로세싱 x

q2. 싱글코어 cpu에 듀얼-스레드 프로세스 한개 ?
-> 멀티태스킹 o
-> 멀티스레딩 o
-> 멀티프로세싱 x

q3. 듀얼코어 cpu에 싱글-스레드 프로세스 두개 ?
-> 멀티태스킹 x
-> 멀티스레딩 x
-> 멀티프로세싱 o

q4. 듀얼코어 cpu에 듀얼 스레드 프로세스 한개 ?
-> 멀티태스킹 x
-> 멀티스레딩 o
-> 멀티프로세싱 o

q5. 듀얼코어 cpu에 듀얼 스레드 프로세스 두개 ?
-> 멀티태스킹 o
-> 멀티스레딩 o
-> 멀티프로세싱 o
```

# 불변객체(Immutable object)란 무엇인가요?
```
불변객체(Immutable object)란, 객체가 생성된 이후에 그 상태를 변경할 수 없는 객체를 의미합니다. 즉, 객체 내부의 상태(속성 값)가 변하지 않습니다. 불변객체(Immutable object)의 장단점은 다음과 같습니다.

장점:
- Thread-safe: 불변객체는 여러 스레드에서 동시에 접근해도 안전합니다. 객체 내부의 값이 변하지 않기 때문에 동기화에 대한 부담이 줄어듭니다.
- 예측 가능한 동작: 불변객체는 생성된 이후에 값이 변하지 않기 때문에 예측 가능한 동작을 보장합니다. 따라서 디버깅과 테스트가 더 쉬워집니다.
- 보안성: 불변객체는 내부의 값을 외부에서 변경할 수 없기 때문에 보안성이 높아집니다.

단점:
- 생성자 오버로딩: 불변객체를 만들기 위해서는 생성자에서 모든 값을 받아들여야 합니다. 그래서 생성자의 오버로딩이 많아질 수 있습니다.
- 메모리 사용: 불변객체는 내부의 값이 변하지 않기 때문에 새로운 객체를 생성해야 할 때마다 메모리를 추가로 사용합니다. 따라서 객체가 많이 생성되는 경우 메모리 사용량이 늘어날 수 있습니다.
- 가독성: 불변객체는 값을 변경할 수 없기 때문에 새로운 객체를 생성해야 합니다. 때로는 가독성이 떨어질 수 있습니다.

불변객체는 객체 지향 프로그래밍에서 중요한 개념 중 하나입니다. 불변객체는 내부의 상태가 변하지 않기 때문에 예측 가능한 동작을 보장하며, 스레드 안전성과 보안성이 높아집니다. 따라서 불변객체는 함수형 프로그래밍에서 주로 사용되며, 자바에서는 String 클래스나 불변 Wrapper 클래스(Integer, Double 등)가 대표적인 불변객체입니다.
```
