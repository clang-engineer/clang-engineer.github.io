---
layout  : wiki
title   : DBCP (Database Connection Pool)
summary : 
date    : 2023-11-30 10:06:30 +0900
updated : 2023-11-30 10:06:44 +0900
tags    : 
toc     : true
public  : true
parent  : [[database/index]]
latex   : false
---
* TOC
{:toc}

# DBCP (Database Connection Pool)
- Database Connection Pool
- Database Connection을 미리 생성해두고, 필요할 때마다 Connection을 가져다 쓰고 반환하는 방식
- Connection을 생성하는 비용이 크기 때문에, 미리 생성해두고 재사용하는 것이 효율적
- Connection Pool을 사용하면, Connection을 생성하는 비용을 줄일 수 있고, Connection을 재사용할 수 있음


# DBCP 설정 방법
## DBCP 설정 (HikariCP)
- minimumIdle : pool에서 유지할 최소 idle connection 수
- maximumPoolSize : pool에서 가질 수 있는 최대 connection 수 (idle + active(in-use))
  - ex) idle connection수가 minimumIdle 보다 작고, 전체 connection 수가 maximumPoolSize 보다 작으면, connection을 생성해서 pool에 넣음 (maximumPoolSize가 우선 순위가 높음)
- maxLifetime : pool에서 connection의 최대 생존 시간
  - maxLifetime을 넘기면 idle일 경우 pool에서 제거하고, active일 경우 pool로 반환된 후 제거
  - DB의 wait_timeout 보다 작아야 함

## Database 설정 (MySQL)
- max_connections : 최대 동시 접속자 수
- wait_timeout : connection이 inactive 할 때 다시 요청이 오기까지 얼마의 시간을 기다린 뒤에 close할 것인지를 결정


# 적절한 connection 수 찾는 방법 
1. 모니터링 환경 구축 (서버 리소스, 서버 스레드 수, DBCP 등)
2. 백엔드 시스템 부하 테스트 (JMeter, Gatling, nGrinder 등)
3. request per second (RPS), average response time (ART) 등을 측정하여 적절한 connection 수를 찾음 
  
## 상세
1. 백엔드 서버, DB서버의 CPU, Memory, Disk I/O, Network I/O 등의 리소스가 부족한 경우
- 리소스 추가 ex. 서버 추가, DB서버 추가, cache layer 추가, sharding 등)
2. thread per request 모델이라면 active thread 수가 적절한지 확인
- 전체 스레드 중 active 스레드의 비율이 높다면, 스레드의 총 개수를 늘려야 함
3. DBCP의 active connection 수가 적절한지 확인
- DBCP의 active connection 수가 적절하지 않다면, 사용할 백엔드 서버 수를 고려하여 DBCP의 maximumPoolSize를 늘려야 함 


# 참고 & 출처
- [쉬운코드](https://www.youtube.com/@ez.)