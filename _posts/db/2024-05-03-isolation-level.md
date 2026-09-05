---
title       : "트랜잭션 동시성 제어 — Schedule, Lock, Isolation Level의 관계"
description : "동시에 실행되는 트랜잭션에서 왜 이상 현상이 생기는지부터 Schedule·Serializability·Recoverability·2PL·SQL Isolation Level·MVCC의 위치와 경계를 거시에서 미시 순서로 정리한다."
date        : 2024-05-03 15:36:25 +0900
updated     : 2026-09-05 20:55:00 +0900
categories  : [db, "RDB·트랜잭션"]
tags        : [transaction, isolation, serializability, lock, mvcc, concept]
pin         : false
hidden      : false
---

트랜잭션 동시성 제어를 이해할 때 `Isolation Level`, `Lock`, `MVCC`, `2PL`을 같은 종류의 개념처럼 나열하면 관계가 잘 안 보인다.

먼저 층을 나눈다.

```text
목표
→ 여러 Transaction을 겹쳐 실행하면서 데이터 정합성 유지

정확성 기준
→ Schedule / Serializability / Recoverability

구현 Mechanism
→ Lock / 2PL / MVCC / SSI 등

Application에 노출되는 계약
→ READ COMMITTED / REPEATABLE READ / SERIALIZABLE 등
```

즉 **Isolation Level은 애플리케이션이 선택하는 관찰·정합성 계약이고, Lock이나 MVCC는 DBMS가 그 계약을 구현하는 수단**이다.

## 1. 왜 동시성 제어가 필요한가

두 트랜잭션이 같은 계좌 잔액을 동시에 읽는다고 하자.

```text
초기 잔액 = 100

T1: 100 읽음 ───────→ 50 기록
T2:      100 읽음 ───────→ 50 기록
```

둘 다 50을 차감했다고 생각하지만 마지막 값은 50만 남을 수 있다. 한쪽 update가 사라지는 **Lost Update**다.

가장 단순한 해결은 트랜잭션을 하나씩 실행하는 것이다.

```text
T1 전체 실행
   ↓
T2 전체 실행
```

하지만 이렇게 하면 동시성이 크게 떨어진다.

그래서 DBMS의 목표는:

> **실행은 최대한 겹치되, 허용할 수 없는 결과가 나오지 않게 제어하는 것**

이다.

## 2. Schedule — 실제 연산이 섞인 순서

Schedule은 여러 transaction의 read/write/commit 같은 연산이 실제로 섞여 실행되는 순서다.

### Serial Schedule

```text
T1: R A → W A → COMMIT
T2:                    R A → W A → COMMIT
```

트랜잭션끼리 겹치지 않는다.

### Non-serial Schedule

```text
T1: R A ───── W A ───── COMMIT
T2:      R B ───── W B ───── COMMIT
```

연산이 겹친다.

Non-serial 자체가 잘못된 것은 아니다. 중요한 것은 **겹쳐 실행한 결과가 어떤 안전성 조건을 만족하는가**다.

## 3. Serializability — 겹쳐 실행해도 직렬 실행과 같은가

Serializable한 schedule은 실제로 연산이 겹쳤더라도 **어떤 serial order로 하나씩 실행한 결과와 동등하게 설명할 수 있는 실행**이다.

```text
실제 Concurrent Schedule
        ↓
결과를 비교
        ↓
T1 → T2 또는 T2 → T1의
어떤 Serial 실행과 동등한가?
```

동등성 정의에는 여러 종류가 있지만 학습과 구현에서 대표적으로 **Conflict Serializability**를 본다.

두 transaction의 연산이:

```text
같은 Data Item 접근
        +
둘 중 적어도 하나가 Write
```

이면 순서가 결과에 영향을 줄 수 있는 conflict다.

Conflict 순서를 보존한 채 serial schedule로 바꿀 수 있으면 conflict-serializable하다.

## 4. Recoverability — Rollback해도 Commit 관계가 복구 가능한가

Serializability와 Recoverability도 같은 축이 아니다.

```text
Serializability
→ Concurrent 결과가 Serial 실행과 동등한가?

Recoverability
→ Abort가 발생했을 때 Commit된 결과를 안전하게 복구할 수 있는가?
```

대표 관계는 점점 강해진다.

### Recoverable Schedule

T2가 T1이 쓴 값을 읽었다면 T1이 commit하기 전에 T2가 먼저 commit하지 않는다.

```text
T1 Write
   ↓
T2 Read
   ↓
T1 Commit
   ↓
T2 Commit
```

T1이 abort할 경우 T2도 아직 commit 전이므로 복구할 여지가 있다.

### Cascadeless Schedule

다른 transaction의 **uncommitted write를 읽지 않는다.**

```text
T1 Write
   ↓
T1 Commit
   ↓
T2 Read
```

T1 abort 때문에 T2까지 연쇄 rollback하는 cascading abort를 피한다.

### Strict Schedule

더 강하게, 다른 transaction이 쓴 data item은 **그 transaction이 commit/abort할 때까지 다른 transaction이 읽거나 덮어쓰지 않는다.**

```text
T1: Write A
      │
      │ A에 대한 다른 Read/Write 제한
      ↓
Commit / Abort
      ↓
다른 Transaction 접근 가능
```

Strict가 "transaction 동안 모든 read/write를 서로 금지한다"는 뜻은 아니다. **아직 확정되지 않은 write가 있는 item에 대한 접근을 제한하는 것**이 핵심이다.

## 5. Lock — 충돌하는 접근을 제어하는 구현 수단

대표적인 lock은 Shared와 Exclusive다.

```text
S Lock(Shared)
→ Read 용도
→ 여러 Reader가 함께 획득 가능

X Lock(Exclusive)
→ Write 용도
→ 충돌하는 다른 S/X Lock과 공존하지 않음
```

기본 호환성:

| 요청 | S 보유 | X 보유 |
|---|---|---|
| S | 가능 | 대기 |
| X | 대기 | 대기 |

Lock 자체는 도구이고 **언제 획득하고 언제 해제하는지에 대한 protocol**이 필요하다.

## 6. 2PL — Lock 획득과 해제를 두 단계로 나눈다

2PL(Two-Phase Locking)의 기본 구조는:

```text
Growing Phase
→ Lock 획득 가능
→ Lock 해제 안 함

첫 Lock 해제
   ↓
Shrinking Phase
→ 새 Lock 획득 안 함
→ 기존 Lock 해제
```

2PL을 올바르게 적용하면 conflict serializability를 보장할 수 있지만 deadlock은 발생할 수 있다.

### Conservative 2PL

필요한 lock을 transaction 시작 전에 모두 확보한다.

```text
모든 Lock 확보 가능?
├─ Yes → Transaction 시작
└─ No  → 시작 전 대기
```

deadlock을 피할 수 있지만 필요한 lock을 미리 알아야 하고 동시성이 낮아질 수 있다.

### Strict 2PL

보통 **X lock을 commit/abort까지 유지**한다.

이를 통해 uncommitted write를 다른 transaction이 읽거나 덮어쓰는 일을 막아 strict schedule을 만들기 쉽다.

### Rigorous / Strong Strict 2PL

S와 X lock 모두 transaction 종료까지 유지하는 더 강한 변형을 가리킬 때 사용한다.

용어는 교재나 문헌마다 `Rigorous 2PL`, `Strong Strict 2PL` 등 표현 차이가 있으므로 **어떤 lock을 언제까지 보유하는지 정의를 보고 판단**하는 편이 안전하다.

## 7. Isolation Level — Application에 노출되는 동시성 계약

SQL의 Isolation Level은 application이 DBMS에:

```text
Concurrent Transaction이 있을 때
내 Transaction이 어떤 현상을 관찰할 수 있는가?
```

를 지정하는 인터페이스다.

전통적으로 다음 현상으로 설명한다.

### Dirty Read

다른 transaction이 아직 commit하지 않은 값을 읽는다.

```text
T1 Write A=10
        ↓ commit 전
T2 Read A=10
        ↓
T1 Rollback
```

T2가 실제로 존재하지 않게 된 값을 관찰했다.

### Non-repeatable Read

같은 row를 transaction 안에서 다시 읽었는데 값이 달라진다.

```text
T1 Read A=10
T2 Update A=20 → Commit
T1 Read A=20
```

### Phantom Read

같은 predicate query를 다시 실행했는데 다른 transaction의 insert/delete 때문에 결과 row 집합이 달라진다.

```text
T1: WHERE age >= 20 → 10 rows
T2: 조건에 맞는 Row Insert → Commit
T1: 같은 Query         → 11 rows
```

## 8. SQL Standard의 네 Isolation Level

전통적인 현상 기준 표를 단순화하면:

| Isolation Level | Dirty Read | Non-repeatable Read | Phantom Read |
|---|---|---|---|
| Read Uncommitted | 허용 가능 | 허용 가능 | 허용 가능 |
| Read Committed | 금지 | 허용 가능 | 허용 가능 |
| Repeatable Read | 금지 | 금지 | Standard상 허용 가능 |
| Serializable | 금지 | 금지 | 금지 |

하지만 이 표를 **모든 DBMS의 실제 구현 결과표**로 사용하면 안 된다.

SQL standard는 각 level에서 금지해야 하는 현상의 최소 조건을 정의하고, DBMS는 더 강한 보장을 제공할 수 있다.

예를 들어 PostgreSQL은:

```text
READ UNCOMMITTED
→ 실제로 READ COMMITTED처럼 동작

REPEATABLE READ
→ Standard상 허용 가능한 Phantom도 PostgreSQL에서는 발생하지 않음
→ 하지만 Serialization Anomaly는 가능

SERIALIZABLE
→ Serial execution과 동등하지 않은 패턴을 감지해 Transaction을 Abort할 수 있음
```

처럼 동작한다.

즉 **Isolation Level 이름만 보고 DBMS별 세부 현상을 단정하지 않고 실제 제품 문서를 확인**해야 한다.

## 9. Serializable의 진짜 기준은 "세 현상 없음"보다 강하다

Serializable을 단지:

```text
Dirty Read X
Non-repeatable Read X
Phantom X
```

로 외우면 충분하지 않다.

더 본질적인 정의는:

> **성공적으로 commit된 concurrent transaction들의 결과가 어떤 serial execution 순서와 동등해야 한다.**

이다.

예를 들어 **Write Skew**는 단순한 dirty/non-repeatable/phantom 세 항목만으로 설명하기 어려운 serialization anomaly다.

```text
의사 A: 현재 당직자가 2명임을 읽음
의사 B: 현재 당직자가 2명임을 읽음

A: 자신을 당직에서 제외
B: 자신을 당직에서 제외

각자 볼 때 한 명은 남는다고 판단
        ↓
둘 다 Commit
        ↓
당직자 0명
```

serial order로 하나씩 실행했다면 두 번째 transaction은 같은 판단을 할 수 없었을 것이다.

## 10. MVCC와 Snapshot Isolation은 Lock과 다른 구현 축이다

MVCC(Multi-Version Concurrency Control)는 하나의 data item에 여러 version을 유지해 reader와 writer의 blocking을 줄이는 구현 방식이다.

```text
Write
→ 새 Version 생성

Read
→ 자신의 Snapshot에서 보이는 Version 선택
```

이를 사용하면:

```text
Reader ↔ Writer
```

가 항상 직접 lock 충돌하지 않아도 된다.

Snapshot Isolation은 transaction이 일관된 snapshot을 기준으로 읽는 isolation model이며 일반적으로 Dirty Read와 Non-repeatable Read 등을 강하게 막지만 **Write Skew 같은 serialization anomaly는 가능할 수 있다.**

따라서:

```text
MVCC 사용
= 자동으로 Serializable
```

은 아니다.

## 11. Serializable도 구현은 하나가 아니다

Serializable을 구현하는 방법은 DBMS마다 다르다.

```text
Lock 기반
→ 2PL 계열로 Conflict를 Blocking

MVCC 기반
→ Snapshot + Conflict 감지 / Abort

그 밖의 동시성 제어 Algorithm
→ Timestamp / OCC 등
```

PostgreSQL은 현재 Serializable에서 **SSI(Serializable Snapshot Isolation)**를 사용한다.

```text
Snapshot 기반 Concurrent 실행
        ↓
rw-dependency 감시
        ↓
Serialization 위험 구조 탐지
        ↓
필요한 Transaction Abort
        ↓
Application에서 Retry
```

즉 Serializable이 반드시 "모든 reader를 lock으로 막아 한 줄씩 실행한다"는 뜻은 아니다. **관찰 결과가 serializable해야 한다는 계약과 그 구현 방법을 분리**해야 한다.

## 12. 어떤 Isolation Level을 선택할까

단순히:

```text
Isolation 높음 → 안전
Isolation 낮음 → 빠름
```

으로만 판단하기 어렵다.

실제 선택에서는:

```text
어떤 Business Invariant를 지켜야 하는가?
        ↓
어떤 Concurrent Anomaly가 위험한가?
        ↓
DBMS가 각 Level을 실제로 어떻게 구현하는가?
        ↓
Blocking / Abort / Retry 비용은 어떤가?
```

를 본다.

예를 들어 PostgreSQL Serializable은 lock wait만 늘리는 것이 아니라 **serialization failure가 발생하면 application이 transaction 전체를 retry할 준비**가 필요하다.

## 전체 관계 정리

```text
Concurrent Transaction
        ↓
      Schedule
        ↓
정확성 기준
├─ Serializability
└─ Recoverability
        ↓
구현 Mechanism
├─ Lock / 2PL
├─ MVCC / Snapshot
├─ SSI
└─ 기타 Concurrency Control
        ↓
Application 계약
└─ Isolation Level
```

핵심은 `Isolation Level`, `2PL`, `MVCC`를 서로 경쟁하는 같은 종류의 용어로 보지 않는 것이다.

- **Serializability / Recoverability** — 결과가 만족해야 하는 성질
- **Lock / 2PL / MVCC / SSI** — 그 성질을 구현하는 mechanism
- **Isolation Level** — application에 노출되는 동시성 계약

이 좌표가 잡히면 DBMS마다 Repeatable Read와 Serializable 동작이 왜 다른지도 자연스럽게 이해할 수 있다.

## 관련 글

| 글 | 무엇을 다루나 |
|---|---|
| [MVCC와 VACUUM](/posts/db/2026-07-03-mvcc-vacuum/) | Snapshot·Tuple Version·VACUUM으로 내려가는 실제 구현 |
| [쿼리 옵티마이저 작동 원리와 실행계획 읽기](/posts/db/2026-07-03-query-optimizer-explain/) | 같은 SQL이 물리 실행 계획으로 내려가는 과정 |

## 참고

- [PostgreSQL — Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
- [PostgreSQL — Serializable Snapshot Isolation](https://www.postgresql.org/about/featurematrix/detail/serializable-snapshot-isolation/)
