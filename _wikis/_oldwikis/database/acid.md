---
layout  : wiki
title   : ACID (Atomicity, Consistency, Isolation, Durability)
summary : 
date    : 2023-12-13 08:20:06 +0900
updated : 2023-12-13 08:20:14 +0900
tags    : 
toc     : true
public  : true
parent  : [[database/index]]
latex   : false
---
* TOC
{:toc}

# Transaction
- 단일한 논리적 기능을 수행하기 위한 작업의 단위
- 논리적인 이유로 여러 SQL문들을 단일 논리적 기능으로 묶어서 처리하는 것
- transaction의 SQL문들 중 일부만 실행되는 경우는 없다. 모두 실행되거나 모두 실행되지 않는다.
- transaction 실행고 동시에 auto commit이 off된다. 그후 transaction이 완료 (commit 또는 rollback)되면 auto commit이 on된다.

## mysql에서 transaction을 사용하는 예시
```sql
START TRANSACTION;
UPDATE account SET balance = balance - 1000 WHERE name = 'A';
UPDATE account SET balance = balance + 1000 WHERE name = 'B';
COMMIT;

START TRANSACTION;
UPDATE account SET balance = balance - 1000 WHERE name = 'A';
UPDATE account SET balance = balance + 1000 WHERE name = 'B';
ROLLBACK;
```

## AUTO COMMIT
- 각각의 SQL문을 자동으로 트랜잭션으로 처리하는 것
- SQL문을 실행하면 자동으로 COMMIT이 되는 것
- 실행중에 오류가 발생하면 자동으로 ROLLBACK이 되는 것
- MySQL에서는 기본적으로 AUTO COMMIT이 설정되어 있다.
```sql
SELECT @@autocommit; // auto commit 상태 확인 (1: auto commit, 0: auto commit 해제)
SET autocommit = 0; // auto commit 해제
```

# ACID
- 트랜잭션의 성질을 보장하기 위한 성질

## Atomicity (원자성)
- ALL or NOTHING
- 트랜잭션의 모든 연산들이 정상적으로 수행되거나 아니면 전혀 수행되지 않아야 한다.

## Consistency (일관성)
- 트랜잭션이 성공적으로 수행된 후에도 데이터베이스가 일관된 상태를 유지해야 한다.
- 트랜잭션이 수행되기 전에 일관된 상태라면 트랜잭션 수행 후에도 일관된 상태여야 한다.
- constraints, triggers, cascades 등을 통해 DB에 정의된 규칙을 transaction이 위반했을 경우 rollback을 통해 일관성을 유지한다.
- transaction이 규칙을 위반했는지는 DBMS가 commit전에 확인하고 알려준다.

## Isolation (고립성)
- 트랜잭션 수행 중에 다른 트랜잭션의 연산이 끼어들 수 없다.
- 여러 트랜잭션이 동시에 수행될 때도 각 트랜잭션은 독립적으로 수행되는 것처럼 보여야 한다.
- DBMS는 여러 종류의 isolation level을 제공한다.
- 개발자는 isolation level을 선택할 수 있다.
- isolation level이 높을수록 동시성은 낮아지고, isolation level이 낮을수록 동시성은 높아진다.
- isolation level이 낮을수록 데이터의 일관성은 낮아지고, isolation level이 높을수록 데이터의 일관성은 높아진다.
- isolation level이 높을수록 deadlock이 발생할 확률이 높아진다.

### Isolation level
- READ UNCOMMITTED
    - 트랜잭션에서 commit이나 rollback 여부와 상관없이 다른 트랜잭션에서 변경한 데이터를 볼 수 있다.
    - dirty read가 발생할 수 있다.
- READ COMMITTED
    - 트랜잭션에서 commit이 된 데이터만 다른 트랜잭션에서 볼 수 있다.
    - non-repeatable read가 발생할 수 있다.
- REPEATABLE READ
    - 트랜잭션에서 select한 데이터는 트랜잭션이 종료될 때까지 다른 트랜잭션에서 변경할 수 없다.
    - phantom read가 발생할 수 있다.
- SERIALIZABLE
    - 트랜잭션에서 select한 데이터는 트랜잭션이 종료될 때까지 다른 트랜잭션에서 변경할 수 없다.
    - phantom read가 발생하지 않는다.
    - isolation level이 가장 높다.

## Durability (지속성)
- 트랜잭션이 성공적으로 수행되었으면 그 결과는 영구적으로 반영되어야 한다.
- 시스템에 장애가 발생하더라도 트랜잭션의 결과는 보존되어야 한다.
- DBMS는 트랜잭션의 commit이 완료되었다고 알려주기 전에 해당 트랜잭션의 모든 연산을 로그에 기록한다.
- 시스템에 장애가 발생하면 로그를 기반으로 트랜잭션의 연산을 재수행한다.
- 로그를 기반으로 트랜잭션의 연산을 재수행하는 것을 REDO라고 한다.


# 출처 & 참고
- [https://www.youtube.com/watch?v=Q_lqYnB2YKk](https://www.youtube.com/watch?v=Q_lqYnB2YKk)

