---
layout  : wiki
title   : Thread 종류 정리
summary : 
date    : 2024-03-07 21:58:02 +0900
updated : 2024-10-12 21:12:23 +0900
tags    : 
toc     : true
public  : true
parent  : [[os/index]]
latex   : false
---
* TOC
{:toc}

# 서론
- 프로그램은 컴퓨터상에서 세개의 레벨로 구분되어 실행되고 각 레벨은 해당 level에서 스레드를 생성하고 관리한다.
 (유저 level에서 프로그램이 실행되고 OS level에서 커널을 통해 하드웨어 level에 접근한다.)
 1. 유저 level
 2. OS kernel level
 3. 하드웨어 level (CPU, 메모리, Device)

- Thread 종류에는 하드웨어 스레드, OS 스레드, 네이티브 스레드, 커널 스레드, 유저 스레드, 그린 스레드 등이 있다.


# 하드웨어 스레드
- 코어가 메모리에 어떤 작업을 하는 경우 대기하는 시간이 발생한다. 이때 코어가 대기하지 않고 다른 작업을 수행할 수 있도록 하는 것이 하드웨어 스레드이다.
- 인텔의 하이퍼스레딩 기술이 이에 해당한다. (물리적 코어가 1개인데 논리적 코어가 2개인 경우)
- 만약에 싱글 코어 CPU에서 하드웨어 스레드가 두개라면 OS는 이 CPU를 듀얼 코어로 인식하고 듀얼 코어에 맞춰서 OS 레벨의 스레드들을 스케쥴링 한다.

## Q. 인텔 듀얼 코어 CPU에 hyper-threading이 적용됐다면 하드웨어 스레드는 몇 개인가?
- A. 4개


# OS(운영체제) 스레드
- OS 커널 레벨에서 생성되고 관리되는 스레드이다.
- CPU에서 실제로 실행되는 단위, CPU 스케쥴링의 단위이다.
- OS스레드의 컨텍스트 스위칭 비용은 유저 스레드보다 크다. (유저 스레드는 유저 레벨에서 스레드를 관리하기 때문에 커널이 개입하지 않는다.)
- 시스템 콜을 통해 전환되는 사용자 모드와 커널 모드 모두 OS 스레드에서 실행된다.


## OS 스레드의 다른 이름
- 네이티브(native) 스레드 (*네이티브는 보통 운영체제를 의미한다.)
- 커널(kernel) 스레드
- 커널-레벨(kernel-level) 스레드
- OS-레벨(OS-level) 스레드

## Q. OS 스레드 여덟 개가 하이퍼 스레딩이 적용된 인텔 듀얼코어 위에서 동작한다면 OS스레드들을 어떻게 코어에 균등하게 할당할 수 있을까 ? 
- A. OS는 하드웨어 스레드를 4개로 인식하고 스케쥴링한다. 때문에 각 코어에 2개의 OS 스레드가 할당된다.

# 유저 스레드
- 스레드 개념을 프로그래밍 언어 레벨에서 추상화한 것.
- 유저 스레드가 CPU에서 실행되려면 OS 스레드와 반드시 연결돼야 한다.

## 유저 스레드와 OS 스레드를 연결하는 방법

1. One-to-One Model
- 스레드를 생성할 때마다 OS 스레드를 생성한다.
- 컨텍스트 스위칭 비용이 크다. (커널이 개입하기 때문)
- 스레드 관리를 OS에 위임한다. (스케쥴링 커널이 담당)
- 한 스레드가 블록되어도 다른 스레드가 실행될 수 있다.
- race condition이 발생할 수 있다.
- Java, C# 등에서 사용한다. 

2. Many-to-One Model
- 여러 개의 유저 스레드가 하나의 OS 스레드에 매핑된다.
- 컨텍스트 스위칭 비용이 적다. (유저 레벨에서 스레드를 관리하기 때문 >> 커널이 개입하지 않는다.)
- race condition 발생 가능성이 낮다. (유저 레벨에서 스레드를 관리하기 때문)
- os 스레드가 하나이기 때문에 멀티코어를 활용하지 못한다.
- 한 스레드가 블록되면 다른 스레드도 블록된다. (이를 해결하기 위해 Non-blocking I/O 개념이 나왔다.)

3. Many-to-Many Model
- 여러 개의 유저 스레드가 여러 개의 OS 스레드에 매핑된다.
- One-to-One Model과 Many-to-One Model의 장점을 결합한 모델이다.
- 멀티코어를 활용할 수 있고, 유저 레벨에서 스레드를 관리하기 때문에 컨텍스트 스위칭 비용이 적다. 하나의 유저 스레드가 블록되어도 다른 유저 스레드가 실행될 수 있다.
- Go에서 사용한다.


# 그린 스레드
- Java 초창기 버전은 Many-to-One Model을 사용했는데, 이때 유저 스레드를 그린 스레드라고 부른다.
- OS와 독립적으로 유저 레벨에서 스케쥴링되는 스레드이다.


# 출처 & 참고
- [쉬운코드](https://www.youtube.com/@ez./playlists)
