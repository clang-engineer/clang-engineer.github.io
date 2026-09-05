---
title       : "PostgreSQL 모니터링 — 증상에서 pg_stat으로 원인 좁히기"
description : "PostgreSQL 장애를 현재 세션·누적 쿼리 부하·테이블 상태·운영 상태로 나눈 뒤 pg_stat_activity, pg_stat_statements, pg_stat_user_tables, pg_stat_replication과 로그를 이용해 원인을 좁히는 흐름을 정리한다."
date        : 2026-07-03 17:10:00 +0900
updated     : 2026-09-05 21:20:00 +0900
categories  : [db, "PostgreSQL·운영"]
tags        : [postgresql, monitoring, pg-stat, performance]
pin         : false
hidden      : false
---

"DB가 느리다"는 증상만으로는 볼 곳이 너무 많다. PostgreSQL 모니터링의 핵심은 `pg_stat_*` View를 많이 외우는 것이 아니라, **문제를 몇 개의 관측 축으로 나눈 뒤 해당 통계로 내려가는 것**이다.

```text
DB가 느리다 / 멈춘다 / 밀린다
        ↓
지금 이 순간의 문제인가?
├─ Session / Connection
├─ Lock / Wait
└─ Long Transaction
        ↓
시간이 누적되어 나타난 부하인가?
├─ Query
├─ Table / Index
└─ Cache / I/O
        ↓
운영 상태가 뒤처진 것인가?
├─ VACUUM
└─ Replication
```

이 글은 이 진단 순서에 맞춰 PostgreSQL의 관측 지점을 연결한다. 세부 설정값을 외우기보다 **증상 → 관측 대상 → 다음 판단**을 찾는 것이 목적이다.

## 먼저 문제 공간을 나눈다

| 질문 | 먼저 볼 곳 | 확인하려는 것 |
|---|---|---|
| 지금 누가 DB를 붙잡고 있나 | `pg_stat_activity` | Active Query, Connection, Long Transaction |
| 누가 누구를 막고 있나 | `pg_blocking_pids()`, `pg_locks` | Lock Wait |
| 평소 어떤 Query가 부하를 만드나 | `pg_stat_statements` | 호출 횟수·누적 시간·평균 시간 |
| Table과 Index 상태는 어떤가 | `pg_stat_user_tables`, `pg_stat_user_indexes` | Seq Scan, Dead Tuple, Index 사용량 |
| Memory와 Disk 사이에서 얼마나 읽나 | `pg_stat_database`, `pg_statio_*` | Buffer Hit / Read |
| Standby가 따라오고 있나 | `pg_stat_replication` | WAL 전송·재생 지연 |
| 특정 실행이 왜 느렸나 | Slow Query Log, `auto_explain` | 실제 Query와 Execution Plan |

중요한 것은 **현재 상태와 누적 통계를 섞지 않는 것**이다.

```text
pg_stat_activity
→ 지금 무슨 일이 일어나는가

pg_stat_statements
→ 지금까지 어떤 Query가 부하를 만들었는가
```

둘은 서로 대체하지 않는다.

## 1. 현재 문제 — Session과 실행 중 Query

`pg_stat_activity`는 현재 PostgreSQL Backend Session을 한 행씩 보여준다. 장애 순간에 가장 먼저 보기 좋은 관측점이다.

```sql
SELECT pid, usename, state, wait_event_type, wait_event,
       now() - query_start AS duration, query
FROM pg_stat_activity
WHERE state <> 'idle'
ORDER BY duration DESC;
```

여기서는 Query Text보다 먼저 다음을 본다.

- `state`: 실제 실행 중인지, `idle in transaction`인지
- `wait_event_type` / `wait_event`: 무엇인가를 기다리는지
- `query_start` / `xact_start`: Query와 Transaction이 얼마나 오래 열려 있는지

오래된 `idle in transaction`은 단순히 놀고 있는 Connection이 아니다. Transaction과 Lock을 오래 유지하고 VACUUM이 정리할 수 있는 범위에도 영향을 줄 수 있다.

Connection 자체가 문제인지 보려면 상태별로 묶는다.

```sql
SELECT state, count(*)
FROM pg_stat_activity
GROUP BY state
ORDER BY count(*) DESC;
```

`max_connections`에 가까워지는 상황이라면 Query Tuning보다 먼저 Connection Pool과 누수 여부를 본다.

## 2. 현재 문제 — Lock과 Wait

Query가 오래 걸린다고 해서 항상 Query 자체가 느린 것은 아니다. 다른 Session을 기다리는 중일 수 있다.

```sql
SELECT blocked.pid AS blocked_pid,
       blocked.query AS blocked_query,
       blocking.pid AS blocking_pid,
       blocking.query AS blocking_query
FROM pg_stat_activity blocked
JOIN pg_stat_activity blocking
  ON blocking.pid = ANY(pg_blocking_pids(blocked.pid))
WHERE cardinality(pg_blocking_pids(blocked.pid)) > 0;
```

```text
오래 실행 중
├─ Wait 없음
│   → Query 자체의 Execution Plan·I/O 확인
└─ Lock Wait
    → Blocking Session과 Transaction 확인
```

`pg_locks`는 Lock 자체의 상세 상태가 필요할 때 한 단계 더 내려가서 본다. 처음부터 Lock 목록 전체를 읽기보다 Blocking 관계를 먼저 잡는 편이 이해하기 쉽다.

## 3. 누적 부하 — 어떤 Query가 전체 시간을 쓰나

현재 순간만 보면 간헐적으로 반복되는 무거운 Query를 놓칠 수 있다. 이때 `pg_stat_statements`가 같은 형태의 Query를 묶어 누적 통계를 제공한다.

사용하려면 Extension을 활성화한다.

```conf
shared_preload_libraries = 'pg_stat_statements'
compute_query_id = on
```

```sql
CREATE EXTENSION pg_stat_statements;
```

```sql
SELECT queryid,
       calls,
       round(total_exec_time::numeric, 1) AS total_ms,
       round(mean_exec_time::numeric, 2) AS mean_ms,
       rows,
       query
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;
```

`mean_exec_time`과 `total_exec_time`은 다른 질문에 답한다.

```text
mean_exec_time 높음
→ 한 번 실행할 때 무겁다
→ Execution Plan 우선

total_exec_time 높음
→ 전체 기간에 많은 시간을 소비했다
→ 실행 시간 × 호출 빈도 관점
```

느린 Query 한 번과 자주 호출되는 Query를 같은 방식으로 튜닝하지 않는다.

## 4. 누적 부하 — Table과 Index 접근 패턴

### Table

```sql
SELECT relname, seq_scan, idx_scan,
       n_live_tup, n_dead_tup,
       last_autovacuum, last_autoanalyze
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;
```

- 큰 Table에서 `seq_scan`이 계속 증가한다 → Index 부재나 Query 조건을 확인
- `n_dead_tup`이 많이 쌓인다 → VACUUM이 따라오는지 확인
- `last_autovacuum`이 오래됐다 → autovacuum 동작 조건과 부하를 확인

단순히 `seq_scan`이 많다는 이유만으로 Index를 추가하지 않는다. 작은 Table이나 대부분의 Row를 읽는 Query에서는 Sequential Scan이 적절할 수 있다.

### Index

```sql
SELECT s.relname AS table_name,
       s.indexrelname AS index_name,
       s.idx_scan,
       pg_size_pretty(pg_relation_size(s.indexrelid)) AS size
FROM pg_stat_user_indexes s
JOIN pg_index i ON i.indexrelid = s.indexrelid
WHERE s.idx_scan = 0
  AND NOT i.indisunique
ORDER BY pg_relation_size(s.indexrelid) DESC;
```

`idx_scan = 0`은 **삭제 명령이 아니라 조사 시작점**이다. 통계가 언제부터 누적됐는지, 특정 Batch에서만 쓰는 Index인지, Constraint 유지에 필요한지 확인한 뒤 판단한다.

## 5. 누적 부하 — Buffer와 I/O

```sql
SELECT datname,
       round(100.0 * blks_hit
             / nullif(blks_hit + blks_read, 0), 2) AS cache_hit_ratio
FROM pg_stat_database
WHERE datname = current_database();
```

Hit Ratio 하나에 고정 임계값을 두고 정상/비정상을 판정하지 않는다. Workload 특성, Table 크기, Sequential Scan, OS Page Cache까지 함께 봐야 한다.

이 수치는 다음 질문으로 연결하는 신호에 가깝다.

```text
Read 증가
  ↓
어떤 Query가 읽는가?
  ↓
어떤 Table을 읽는가?
  ↓
Sequential Scan인가?
  ↓
Execution Plan과 Working Set 확인
```

## 6. 운영 상태 — VACUUM이 따라오는가

MVCC를 사용하는 PostgreSQL에서는 UPDATE/DELETE 뒤의 오래된 Tuple을 정리하는 VACUUM이 운영 상태의 일부다.

```text
Dead Tuple 증가
        +
Autovacuum이 오래 실행되지 않음
        ↓
VACUUM이 Workload를 따라오지 못하는지 확인
```

여기서 바로 수동 `VACUUM`이나 Parameter 변경으로 뛰어들기보다 Transaction이 지나치게 오래 열려 있지 않은지, Autovacuum Worker가 실제로 동작하는지, Table별 설정이 어떻게 되어 있는지 확인한다.

MVCC와 VACUUM의 내부 원리는 [MVCC와 VACUUM](/posts/db/2026-07-03-mvcc-vacuum/)에서 별도로 다룬다.

## 7. 운영 상태 — Replication이 따라오는가

```sql
SELECT application_name, state,
       write_lag, flush_lag, replay_lag,
       pg_wal_lsn_diff(sent_lsn, replay_lsn) AS replay_bytes
FROM pg_stat_replication;
```

하나의 `lag` 숫자보다 **WAL이 어느 단계에서 밀리는지**를 본다.

```text
Primary WAL
   ↓ sent
Standby write
   ↓ flush
Disk 반영
   ↓ replay
DB 상태 반영
```

`sent_lsn`과 `replay_lsn` 차이가 계속 커지면 Standby가 생성되는 WAL을 따라오지 못하고 있다는 뜻이다. 동기/비동기 복제 여부에 따라 영향은 다르므로 Replication 구성과 함께 판단한다.

## 8. 특정 실행을 잡아야 할 때 — Log와 auto_explain

`pg_stat_statements`는 누적 통계에는 강하지만 특정 실행의 Parameter와 그 순간의 Execution Plan을 그대로 보존하는 도구는 아니다.

```conf
log_min_duration_statement = 1000
```

특정 실행의 Plan까지 자동으로 남기려면 `auto_explain`을 검토한다.

```conf
shared_preload_libraries = 'pg_stat_statements,auto_explain'
auto_explain.log_min_duration = 1000
auto_explain.log_analyze = on
```

`auto_explain.log_analyze`는 실제 실행 계측을 추가하므로 운영에서는 Overhead를 고려해 사용한다.

## 장애 상황에서의 최소 진단 순서

```text
1. pg_stat_activity
   └─ 지금 오래 도는 Query / Transaction / Wait가 있는가?

2. pg_blocking_pids()
   └─ 다른 Session에 막혀 있는가?

3. pg_stat_statements
   └─ 누적 부하 상위 Query는 무엇인가?

4. pg_stat_user_tables / indexes
   └─ 특정 Table·Index에 이상 신호가 있는가?

5. pg_stat_database / pg_statio_*
   └─ Read 패턴이 변했는가?

6. VACUUM / Replication
   └─ 운영 유지 작업이 Workload를 따라오는가?

7. Log / auto_explain
   └─ 특정 실행을 더 깊게 분석해야 하는가?
```

이 순서가 항상 정답은 아니다. 중요한 것은 **관측 도구 이름이 아니라 어느 질문에 답하기 위해 그 도구를 보는지**다.

## 정리

PostgreSQL 모니터링을 View 목록으로 외우면 장애 때 다시 길을 잃는다. 대신 세 층으로 나눈다.

```text
현재 상태
→ Session / Wait / Transaction

누적 부하
→ Query / Table / Index / I/O

운영 상태
→ VACUUM / Replication
```

그다음 각 질문에 맞춰 `pg_stat_activity`, `pg_stat_statements`, `pg_stat_user_tables`, `pg_stat_replication`으로 Zoom-in 한다. **모니터링은 통계를 보는 작업이 아니라 문제 공간을 좁히는 작업**이다.
