---
title       : "트랜잭션 동시성 제어 — 격리 수준과 락, 그리고 이상 현상"
description : "Schedule과 Serializability, Recoverability 단계, S/X Lock과 2PL 변형들, READ COMMITTED·REPEATABLE READ·SERIALIZABLE이 막아주는 이상 현상까지 한 흐름으로 연결."
date        : 2024-05-03 15:36:25 +0900
updated     : 2026-07-03 12:00:00 +0900
categories  : [db, "RDB·트랜잭션"]
tags        : [transaction, isolation, lock]
pin         : false
hidden      : false
---

## 동시성 제어 개요

두 사람이 같은 계좌에서 동시에 돈을 인출한다고 하자. 한쪽이 잔액 10만 원을 읽어 5만 원을 빼는 사이, 다른 쪽도 같은 10만 원을 읽어 5만 원을 뺀다. 둘 다 "잔액 5만 원"을 쓰고 끝나면, 실제로는 10만 원이 빠져나갔는데 장부에는 5만 원만 줄어든다. 한쪽의 변경이 흔적도 없이 사라진 것이다. 이처럼 트랜잭션이 동시에 실행되면 커밋되지 않은 값을 읽거나, 같은 행을 두 번 읽었더니 값이 달라지거나, 서로의 수정을 덮어쓰는 식으로 데이터가 조용히 깨진다. 동시성 제어는 이런 이상 현상을 막으면서도 트랜잭션을 최대한 겹쳐 실행해 성능을 확보하는 것이 목표다.

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

격리 수준은 제약이 강할수록 이상 현상은 줄지만 동시성이 낮아져 성능이 떨어진다. 그래서 일부 이상 현상을 허용하는 몇 가지 level을 두고, 요구사항에 따라 선택하게 한다.

### 이상 현상

1. **Dirty Read**: 커밋되지 않은 데이터를 읽음. 그 값을 쓴 트랜잭션이 rollback되면 존재하지 않는 데이터를 읽은 셈이 된다.
2. **Non-Repeatable Read**: 한 트랜잭션 안에서 같은 행을 두 번 읽었는데, 그 사이 다른 트랜잭션이 수정·커밋해 값이 달라진다.
3. **Phantom Read**: 같은 조건으로 두 번 조회했는데, 그 사이 다른 트랜잭션이 행을 추가·삭제해 결과 집합이 달라진다.

### 격리 수준별 허용 이상 현상

| Isolation Level | Dirty Read | Non-Repeatable Read | Phantom Read |
|---------------|-----------|---------------------|--------------|
| Read Uncommitted | O | O | O |
| Read Committed | X | O | O |
| Repeatable Read | X | X | O |
| Serializable | X | X | X |

- **Read Uncommitted**: 다른 트랜잭션이 커밋하지 않은 데이터까지 읽는다.
- **Read Committed**: 커밋된 데이터만 읽어 Dirty Read를 막는다.
- **Repeatable Read**: 한 트랜잭션 안에서 같은 행을 다시 읽어도 값이 변하지 않는다.
- **Serializable**: 세 이상 현상을 모두 막는다. 트랜잭션들이 직렬로 실행된 것과 동일한 결과를 보장한다.

> **구현**: Serializable은 Strict 2PL / SS2PL 또는 SSN(Serializable Snapshot Isolation)으로 구현한다. 2PL은 읽을 때 S Lock, 수정할 때 X Lock을 걸어 다른 트랜잭션의 접근을 차단함으로써 직렬 실행처럼 보이게 한다.
> MVCC 기반 DB는 Repeatable Read/Serializable의 정의가 DB마다 다를 수 있다.

## 추가 이상 현상

기본 3가지 외에도 다음이 있다.

- **Dirty Write**: 커밋되지 않은 값을 다른 트랜잭션이 덮어쓴다. rollback 시 정상 복구를 위해 모든 격리 수준에서 금지된다.
- **Lost Update**: 두 트랜잭션이 같은 데이터를 동시에 수정해 한쪽의 변경이 사라진다.
- **Read Skew / Write Skew**: 서로 다른 데이터 사이의 제약이 깨져 일관성이 무너진다.

## Snapshot Isolation

각 트랜잭션이 시작 시점의 스냅샷을 읽어, 읽기와 쓰기가 서로를 막지 않게 하는 격리 수준이다. 락으로 직렬화하는 대신 데이터의 여러 버전을 유지하는 MVCC로 구현하며, Write Skew 같은 일부 이상 현상은 여전히 막지 못한다.

스냅샷·xmin/xmax를 통한 실제 구현, 버전이 쌓이며 생기는 dead tuple, 이를 청소하는 VACUUM 등 동작의 대가는 [MVCC와 VACUUM](/posts/db/2026-07-03-mvcc-vacuum/) 글에서 다룬다.

## 관련 글

| 글 | 무엇을 다루나 |
|---|---|
| [MVCC와 VACUUM](/posts/db/2026-07-03-mvcc-vacuum/) | 이 격리 수준이 실제로 구현되는 방식(스냅샷·xmin/xmax)과 그 대가 |
| [쿼리 옵티마이저 작동 원리와 실행계획 읽기](/posts/db/2026-07-03-query-optimizer-explain/) | 격리 수준과 함께 보는 실행 관점 |
