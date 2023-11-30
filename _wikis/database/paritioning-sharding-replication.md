---
layout  : wiki
title   : Partioning & Sharding & Replication
summary : 
date    : 2023-11-30 08:52:13 +0900
updated : 2023-11-30 08:52:55 +0900
tags    : 
toc     : true
public  : true
parent  : [[database/index]]
latex   : false
---
* TOC
{:toc}

# Partioning
- 데이터를 분할하여 저장하는 것

## Vertical Partitioning
- Coumn 기준으로 Table 분할
- 장점
  - 자주 사용하는 열만 가져오니까 쿼리 속도가 빨라짐. (I/O 감소)  
  - 열 단위로 데이터베이스 관리가 편함.
- 단점
  - 필요한 정보를 얻기 위해 여러 테이블을 참조해야 할 수 있음.

## Horizontal Partitioning
- Row 기준으로 Table 분할 (데이터 개수를 기준으로 나누어 파티셔닝한다.)
- hash based, range based 등의 방법으로 분할
- 가장 많이 사용될 패턴에 따라 파티션 key를 정하는 것이 중요
- 데이터가 균등하게 분배될 수 있도록 hash function을 사용하는 것이 중요
- hash-based 파티셔닝은 한번 파티션이 나눠져서 사용되면 파티션 변경이 어려움
- 장점
  - 데이터를 여러 파티션으로 나눠서 동시에 처리하니까 쿼리 속도가 빨라짐. (I/O 감소)
  - 테이블당 데이터의 개수가 작아지고 따라서 index의 개수도 작아기게 된다. (성능 향상)
  - 특정 파티션에 장애가 발생하더라도 다른 파티션에는 영향을 미치지 않는다.
  - 파티년 별로 권한을 부여할 수 있다.
- 단점
  - 퀴리 복잡도가 증가한다. (데이터 찾기 위해 여러 테이블을 참조해야 함)
  - 데이터 일관성을 유지하기 위한 관리가 어렵다.

# Sharding
- 수평파티셔닝의 한 종류
- 파티셔닝은 모든 데이터를 동일한 컴퓨터에 저장하지만, 샤딩은 데이터를 서로 다른 컴퓨터에 분산한다는 차이가 있음
- 부하 분산을 위해 사용
- 각 patition을 shard, partition key를 shard key라고도 함. 

# Replication
- 데이터를 여러 곳에 복제하는 것
- 데이터를 여러 곳에 복제하면 데이터의 안정성을 높일 수 있음
- 데이터를 복제하면 읽기 성능을 향상시킬 수 있음
- 데이터를 복제하면 데이터의 안정성을 높일 수 있음
- master-slave, primary-secondary, leader-follower 등으로 지칭함

## Master-Slave Replication
- Master DB에 쓰기 작업을 하고, Slave DB에 읽기 작업을 하는 방식
- Master DB에 쓰기 작업을 하면 Slave DB에도 동일한 데이터가 복제되어 저장됨
- Master DB에 장애가 발생하면 Slave DB를 Master DB로 승격시키는 방식으로 장애를 해결함
- 성능 향상을 위해 Master 를 여러 개 두는 방식도 있음
- 장점
  - 읽기 작업을 Master DB와 Slave DB로 나누어 처리하니까 쿼리 속도가 빨라짐. (I/O 감소)
  - Master DB에 장애가 발생하더라도 Slave DB가 있으니까 데이터를 복구할 수 있음.
- 단점
  - Master DB에 장애가 발생하면 Slave DB로 승격시키는 작업이 필요함.