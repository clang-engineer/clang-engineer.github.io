---
layout  : wiki
title   : Thread Pool
summary : 
date    : 2024-06-11 08:41:00 +0900
updated : 2024-06-11 08:41:52 +0900
tags    : 
toc     : true
public  : true
parent  : [[programming/index]]
latex   : false
---
* TOC
{:toc}

# Thread per request 모델의 문제점

> Q. 만약 thread per request 모델의  동작  방식이  서버에  들어오는 요청마다 스레드를 새로 만들어서 처리하고 처리가 끝난 스레드는 버리는 식으로 동작한다면 어떤 문제점이 있을까? 
- 스레드 생성에 소요되는 시간 때문에 요청 처리가 더 오래 걸림
- 처리 속도보다 더 빠르게 요청이 늘어나면 -> 스레드가 계속 생성 -> 컨텍스트 스위칭이 더 자주 발생 -> CPU 오버헤드 증가로 CPU time 낭비 -> 어느 순간 서버 전체가 응답 불가능 상태에 빠짐

# Thread Pool
- 미리 스레드를 여러 개 만들어 놓고 재사용 > 스레드 생성 시간 절약
- 제한된 개수의 스레드를 운용 > 스레드가 무제한으로 생성되는 것을 방지

# Thread pool을 사용할 수 있는 경우
- thread per request 모델
- task를 subtask로 나누어 동시에 처리하는 경우 
- 순서 상관없이 동시 실행이 가능한 task를 처리하는 경우

# Thread pool 사용팁

1. 스레드 풀에 몇개의 스레드를 만들어 두는 것이 적절한가?
- CPU 코어 개수와 Task의 성향에 따라 다름
> CPU bound task: CPU 코어 개수와 같거나 조금 더 많게
> I/O bound task: CPU 코어 개수의 몇 배까지도 가능 (I/O bound task는 CPU를 많이 사용하지 않기 때문)

2. 스레드 풀에서 실행될 task 개수에 제한이 없다면 스레드 풀의 큐가 사이즈 제한이 있는지 꼭 확인이 필요함.
- 사이즈 제한 없는 큐는 상황에 따라서 메모리를 고갈시키는 위험 요인이 될 수 있음
- 큐가 가득 차면 어떻게 처리할 것인지에 대한 전략이 필요함
- 큐가 가득 차면 task를 버리거나, task를 실행하는 스레드를 늘리거나, task를 실행하는 스레드를 줄이거나, task를 실행하는 스레드에게 task를 처리하는 시간을 줄이라고 요청하는 등의 전략이 필요함

# pool이 사용되는 다른 예시
- connection pool (DB, HTTP)
- process pool

# 출처 & 참고
- [쉬운코드](https://www.youtube.com/@ez./playlists)