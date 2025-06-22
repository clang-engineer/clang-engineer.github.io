---
title       : Transaction Isolation Level
description : >-
  트랜잭션 격리 수준에 대해 알아보자.
date        : 2024-05-03 15:36:25 +0900
updated     : 2025-05-21 22:50:42 +0900
categories  : [study, database]
tags        : [database, transaction, isolation-level]
pin         : false
hidden      : false
---

## transaction들이 동시에  실행될 때  발생할 수 있는 문제점

1. Dirty Read
- 문제: 트랜잭션 A가 아직 커밋되지 않은 데이터를 읽고, 그 후 트랜잭션 B가 롤백되면, 트랜잭션 A는 존재하지 않는 데이터를 읽은 것이 됨.
  > 한 transaction이 다른 transaction이 commit하지 않은 데이터를 읽는 현상.
- 해결: Read Committed 이상의 격리 수준 사용

2. Non-Repeatable Read
- 문제: 한 트랜잭션이 같은 데이터를 두 번 조회했을 때, 그 사이에 다른 트랜잭션이 해당 데이터를 수정하고 커밋하면, 첫 번째 조회 결과와 두 번째 조회 결과가 달라짐.
  > 한 transaction 안에서 같은 데이터를 두번 읽었을 때 값이 다른 현상. (다른 트랜잭션에 의해 값이 바뀌는 현상이므로 Isolation 관점에서 문제가 된다.)
- 해결: Repeatable Read 이상의 격리 수준 사용

3. Phantom Read
- 문제: 한 트랜잭션이 같은 쿼리를 두 번 실행했을 때, 그 사이에 다른 트랜잭션이 데이터를 추가하거나 삭제하면, 첫 번째 쿼리 결과와 두 번째 쿼리 결과가 달라짐.
  > 한 transaction 안에서 같은 쿼리를 두번 실행했을 때 어떤 row가 추가되거나 삭제되는 현상.)
- 다른 transaction이 데이터를 추가하거나 삭제하면, 쿼리 결과가 달라질 수 있다.


## 격리 수준 (Isolation Level)
- 제약사항이 강할수록 문제점은 적지만, 동시성이 낮아짐으로 성능이 저하될 수 있다.
- 시스템의 요구사항에 따라 일부 이상 현상을 허용하는 및가지 level 을 만들어서 사용자가 필요에 따라 선택할 수 있도록 한다.

| Isolation Level | Dirty Read | Non-Repeatable Read | Phantom Read |
| --------------- | ---------- | -------------------- | ------------ |
| Read Uncommitted | O          | O                    | O            |
| Read Committed   | X          | O                    | O            |
| Repeatable Read  | X          | X                    | O            |
| Serializable     | X          | X                    | X            |

1. Read Uncommitted
- 다른 transaction이 commit하지 않은 데이터를 읽을 수 있다.
- Dirty Read, Non-Repeatable Read, Phantom Read가 발생할 수 있다.

2. Read Committed
- 다른 transaction이 commit한 데이터만 읽을 수 있다.
- Dirty Read는 발생하지 않지만, Non-Repeatable Read, Phantom Read가 발생할 수 있다.

3. Repeatable Read
- 한 transaction 안에서 같은 데이터를 두번 읽었을 때 값이 다르지 않다.
- Dirty Read, Non-Repeatable Read는 발생하지 않지만, Phantom Read가 발생할 수 있다.

4. Serializable
- 한 transaction 안에서 같은 쿼리를 두번 실행했을 때 결과가 같다.
- Dirty Read, Non-Repeatable Read, Phantom Read가 발생하지 않는다.
- 위 3가지 현상을 완벽하게 제어할 뿐만 아니라, 모든 이상 현상을 제어할 수 있다.

> 구현: 2-Phase Locking (Strict 2PL, S2PL), SSN(Serializable Snapshot Isolation) 사용 <br>
> 2-Phase Locking (Strict 2PL, S2PL) : 읽을 때 Shared Lock (S Lock), 수정할 때 Exclusive Lock (X Lock)을 설정하여 다른 트랜잭션이 접근할 수 없도록 차단. 모든 트랜잭션이 직렬적으로(순차적으로) 실행되는 것처럼 보이도록 보장.

## 추가적인 이상 현상
- 위 3가지 이상 현상 외에도 다음과 같은 이상 현상이 발생할 수 있다.

1. Dirty Write
- commit하지 않은 데이터를 다른 transaction이 덮어쓰는 현상.
- rollback시 정상적인 recovery는 매우 중요하기 때문에 모든 isolation level에서 발생하지 않도록 해야 한다.

2. Lost Update
- 두 transaction이 같은 데이터를 동시에 수정할 때, 한 transaction의 변경사항이 무시되는 현상.

3. Read Skew

4. Write Skew

---

## Snapshot Isolation
- MVCC(Multi-Version Concurrency Control)를 사용하여 Serializable level에서 발생하는 성능 저하를 줄이기 위해, Repeatable Read와 Serializable 사이에 위치한 level을 만들어 사용한다.
- Serializable level에서 발생하는 성능 저하를 줄이기 위해, Read Committed와 Repeatable Read 사이에 위치한 level을 만들어 사용한다.