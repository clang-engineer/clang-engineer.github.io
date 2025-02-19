---
layout  : wiki
title   : Transaction isolation level
summary : 
date    : 2023-12-13 08:40:52 +0900
updated : 2023-12-13 08:41:06 +0900
tags    : 
toc     : true
public  : true
parent  : [[database/index]]
latex   : false
---
* TOC
{:toc}

# Transaction isolation level
- 트랜잭션의 고립성을 어느 정도까지 보장할 것인지를 결정하는 것
- DBMS는 여러 종류의 isolation level을 제공한다.
- isolation level이 높을수록 고립성이 높아지지만 동시성이 떨어진다.
- isolation level이 낮을수록 동시성이 높아지지만 고립성이 떨어진다.
- isolation level이 높을수록 deadlock이 발생할 가능성이 높아진다.
- isolation level은 DBMS마다 다르다.

# Isolation level의 종류
- READ UNCOMMITTED
- READ COMMITTED
- REPEATABLE READ
- SERIALIZABLE

## READ UNCOMMITTED
- 트랜잭션에서 commit이나 rollback과 상관없이 다른 트랜잭션에서 변경한 데이터를 읽을 수 있다.
- 트랜잰셕이 작업이 완료되지 않았는데도 다른 트랜잭션에서 변경한 데이터를 읽을 수 있기 때문에 dirty read가 발생할 수 있다.
- 최소한의 격리 수준을 제공하며 일관성이 떨어지기 때문에 잘 사용되지 않는다.

## READ COMMITTED
- RDB에서 가장 많이 사용되는 isolation level
- 트랜잭션에서 commit이나 rollback이 완료된 데이터만 읽을 수 있다.
- 트랜잰셕이 작업이 완료되지 않았는데도 다른 트랜잭션에서 변경한 데이터를 읽을 수 없기 때문에 dirty read가 발생하지 않는다. (커밋되지 않은 데이터를 읽을 수 없다.)
- non-repeatable read가 발생할 수 있다. (한 트랜잭션에서 같은 쿼리를 두 번 실행했을 때 결과가 다른 경우, 다른 트랜잭션에서 commit을 했을 때 발생)

## REPEATABLE READ
- 트랜잭션이 시작될 때 읽은 데이터는 해당 트랜잭션이 종료될 때까지 변경되지 않음을 보장
- non-repeatable read가 발생하지 않는다.
- phantom read가 발생할 수 있다. (다른 트랜잭션의 삽입, 삭제로 인해 발생하는 읽기 중에 새로운 행이 나타나는 현상) 
    
## SERIALIZABLE
- 가장 높은 격리 수준으로 동시성 문제를 완전히 제거함. (동시성이 없다. 트랜잭션이 순차적으로 실행되는 것처럼 처리됨.)
- non-repeatable read가 발생하지 않는다.
- phantom read가 발생하지 않는다.

# isolation level 설정
- isolation level을 설정하는 방법은 DBMS마다 다르다.
- MySQL에서는 다음과 같이 설정한다.
```sql
SELECT @@tx_isolation; // isolation level 확인
SET SESSION TRANSACTION ISOLATION LEVEL READ UNCOMMITTED; // isolation level 설정
```

# isolation level 설정 확인
- isolation level을 설정하는 방법은 DBMS마다 다르다.
- MySQL에서는 다음과 같이 설정한다.
```sql
SELECT @@tx_isolation; // isolation level 확인
```