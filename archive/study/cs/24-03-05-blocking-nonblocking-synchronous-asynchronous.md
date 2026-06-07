---
title       : Concurrency Basics: Threads, Locks, Blocking
description : >-
  스레드/락/블로킹 모델을 한 흐름으로 정리합니다.
date        : 2024-03-05 15:02:03 +0900
updated     : 2025-02-12 00:00:00 +0900
categories  : [study, os]
tags        : [concurrency, thread, blocking, non-blocking, synchronous, asynchronous, mutex, semaphore]
pin         : false
hidden      : false
---

![Blocking vs Non-Blocking](https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdn%2FkB73F%2FbtsJ2WyZjAv%2F0Bnwvu1c0JFDcUR1cXiLWK%2Fimg.png)
> 출처: [Homoefficio](https://homoefficio.github.io/2017/02/19/Blocking-NonBlocking-Synchronous-Asynchronous/)

## 1) Blocking vs Non-Blocking
제어권을 호출자에게 넘기는지 여부로 구분한다.

### Blocking
- A가 B를 호출하면 제어권을 B에게 넘긴다
- B가 끝날 때까지 A는 대기한다 (I/O 완료까지 대기)

### Non-Blocking
- A가 B를 호출해도 제어권을 유지한다
- B의 완료를 기다리지 않고 A는 계속 진행한다

## 2) Synchronous vs Asynchronous
결과 완료를 신경 쓰는지 여부로 구분한다.

### Synchronous
- A가 B 호출 후 완료를 기다린다
- B의 결과가 필요할 때

### Asynchronous
- A가 B 호출 후 완료를 기다리지 않는다
- 완료 시 콜백/이벤트로 통지받는다

### 조합 요약
- Sync-Blocking: 호출자가 결과를 기다리고, 제어권도 넘김
- Sync-NonBlocking: 호출자가 결과를 기다리지만, 제어권은 유지 (폴링)
- Async-NonBlocking: 호출자는 결과를 기다리지 않고 제어권 유지 (콜백)
- Async-Blocking: 실익이 거의 없어서 잘 사용하지 않음

## 3) Thread 종류와 매핑

### 하드웨어 스레드
- 하이퍼스레딩처럼 코어가 대기 시간을 줄이기 위해 논리적 스레드를 제공

### OS(커널) 스레드
- 운영체제가 직접 관리하는 스레드
- 컨텍스트 스위칭 비용이 크지만, 시스템 콜/스케줄링을 담당

### 유저 스레드
- 언어 런타임/라이브러리에서 제공하는 스레드
- OS 스레드와 매핑 방식에 따라 특성이 달라진다

#### 매핑 모델
- One-to-One: 유저 스레드마다 OS 스레드 생성
- Many-to-One: 여러 유저 스레드가 하나의 OS 스레드에 매핑
- Many-to-Many: 여러 유저 스레드가 여러 OS 스레드에 매핑

## 4) Thread Pool

### 사용하는 이유
- 스레드 생성/파괴 비용 절감
- 무제한 스레드 생성으로 인한 과부하 방지

### 사용 팁
- CPU-bound: 코어 수와 비슷하거나 조금 더 큰 크기
- I/O-bound: 코어 수보다 크게 잡을 수 있음
- 큐가 무한이면 메모리 고갈 위험이 있으니 제한/전략 필요

## 5) Mutex vs Semaphore

### Mutex
- 한 번에 하나의 스레드만 임계 구역 접근
- 락 소유자가 해제해야 한다

### Semaphore
- 동시에 접근 가능한 스레드 수를 제한
- 소유권 개념이 없고, 작업 순서 제어에도 활용 가능

### Spinlock
- 락을 얻기 위해 바쁘게 대기
- 짧은 임계 구역에서는 유리할 수 있음

## 참고
- [Boost application performance with asynchronous I/O](https://www.ibm.com/developerworks/library/l-async/)
- [Homoefficio](https://homoefficio.github.io/2017/02/19/Blocking-NonBlocking-Synchronous-Asynchronous/)
