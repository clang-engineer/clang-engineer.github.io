---
title       : Transaction Concurrency Control
description : >-
  직렬가능성, 회복가능성, 격리 수준, 2PL을 한 흐름으로 정리.
date        : 2024-05-03 15:36:25 +0900
updated     : 2025-05-21 22:50:42 +0900
categories  : [study, database]
tags        : [database, transaction, concurrency-control, serializability, recoverability, isolation-level, lock, 2pl]
pin         : false
hidden      : false
---

## 동시성 제어 개요
- 여러 트랜잭션이 동시에 실행될 때 성능을 확보하면서도 일관성을 유지하는 것이 목표
- 핵심 키워드: Schedule, Serializability, Recoverability, Isolation Level, Lock/2PL

## Schedule과 Serializability

### Schedule
- 여러 트랜잭션의 연산이 섞여 실행되는 순서
- 단일 트랜잭션 내부의 연산 순서는 유지되지만, 트랜잭션 간 순서는 섞일 수 있다

### Serial Schedule vs Non-serial Schedule
- Serial: 트랜잭션이 겹치지 않고 순차 실행 (안전하지만 느림)
- Non-serial: 연산이 섞여 실행 (빠르지만 제어 필요)

### Conflict Serializability
- 서로 다른 트랜잭션이 같은 데이터에 접근하고, 최소 한쪽이 쓰기일 때 conflict
- 모든 conflict의 순서가 어떤 serial schedule과 동일하면 conflict-serializable

## Recoverability

### Unrecoverable Schedule
- 다른 트랜잭션이 읽은 값을 쓴 트랜잭션이 rollback되면 복구 불가능
- DBMS는 허용하지 않는다

### Recoverable Schedule
- 읽은 값을 쓴 트랜잭션이 commit/rollback되기 전까지 commit하지 않으면 recoverable

### Cascadeless Schedule
- 커밋 전 데이터 읽기를 금지해 cascade rollback 방지

### Strict Schedule
- 커밋 전 읽기/쓰기 모두 금지
- 복구가 가장 단순하다

## Lock과 2PL

### Lock 종류
- Read-Lock (Shared, S): 읽기 허용, 쓰기 차단
- Write-Lock (Exclusive, X): 읽기/쓰기 모두 차단

### Lock 호환성
- S-S: 가능
- S-X, X-S, X-X: 불가

### 2PL (Two-Phase Locking)
- Expansion Phase: Lock 획득만 수행
- Contraction Phase: Lock 해제만 수행
- Serializability 보장, Deadlock 가능

#### Conservative 2PL
- 모든 lock을 확보한 뒤 트랜잭션 시작
- Deadlock 없음, 실무 사용은 드묾

#### Strict 2PL (S2PL)
- write-lock을 commit/rollback 전까지 유지
- Recoverability 보장

#### Strong Strict 2PL (SS2PL)
- read/write-lock 모두 commit/rollback 전까지 유지
- 구현이 단순

## Isolation Level

### 이상 현상
1. Dirty Read: 커밋되지 않은 데이터 읽기
2. Non-Repeatable Read: 같은 행을 두 번 읽었는데 값이 변함
3. Phantom Read: 같은 조건으로 조회했는데 행 집합이 변함

### 격리 수준 표

| Isolation Level | Dirty Read | Non-Repeatable Read | Phantom Read |
|---------------|-----------|---------------------|--------------|
| Read Uncommitted | O | O | O |
| Read Committed | X | O | O |
| Repeatable Read | X | X | O |
| Serializable | X | X | X |

### 구현 메모
- Serializable: Strict 2PL 또는 SS2PL, SSN 등으로 구현
- MVCC 기반 DB는 Repeatable Read/Serializable의 정의가 DB마다 다를 수 있음

## 추가 이상 현상 (요약)
- Dirty Write: 커밋되지 않은 값을 다른 트랜잭션이 덮어씀
- Lost Update: 두 트랜잭션의 업데이트 중 하나가 사라짐
- Read/Write Skew: 서로 다른 데이터의 불일치가 발생

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
