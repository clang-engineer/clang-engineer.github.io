---
layout  : wiki
title   : CPU Bound vs I/O Bound
summary : 
date    : 2024-03-19 22:48:58 +0900
updated : 2024-03-19 22:48:58 +0900
tags    : 
toc     : true
public  : true
parent  : [[os/index]]
latex   : false
---
* TOC
{:toc}

# 용어
- CPU (Central Processing Unit): 프로세스의 명령어를 해석하고 실행하는 장치
- I/O (Input/Output): 파일을 읽고 쓰거나 네트워크의 어딘가와 데이터를 주고 받는 것. 입출력 장치와 데이터를 주고 받는 것.
- Burst: 어떤 현상이 짧은 시간 안에 집중적으로 일어나는 집
- CPU Burst: 프로세스가 CPU에서 한번에 연속적으로 실행되는 시간
- I/O Burst: 프로세스가 I/O 작업을 요청하고 결과를 기다리는 시결

# CPU Bound Process
- CPU Burst가 많은 프로세스
- ex> 동영상 편집 프로그램, 머신러닝 프로그램

# I/O Bound Process
- I/O Burst가 많은 프로세스
- ex> (일반적인) 백엑드 서버, 데이터베이스 서버

# Question
## Q1. 듀얼 코어 CPU에서 동작할 CPU Bound 프로그램을 구현한다면 몇 개의 스레드를 사용하는 것이 좋을까?
- A. 2개의 스레드를 사용하는 것이 좋다. CPU Bound 프로그램은 CPU Burst가 많은 프로그램이므로 CPU를 최대한 활용하기 위해 스레드를 최대한 활용하는 것이 좋다.
- Goetz (2002, 2006) 에 따르면, CPU Bound 프로그램에서 적절한 스레드 수는 CPU 코어 수 + 1.

## Q2. I/O Bound 프로그램을 구현한다면 몇 개의 스레드를 사용하는 것이 좋을까?
- A. 상황에 따라 다르다. I/O Bound 프로그램은 I/O Burst가 많은 프로그램이므로 I/O 작업을 최대한 활용하기 위해 스레드를 최대한 활용하는 것이 좋다. 하지만, 너무 많은 스레드를 사용하면 스레드 간의 경쟁이 발생하여 오히려 성능이 떨어질 수 있다. 따라서, 적절한 스레드 수를 찾는 것이 중요하다.