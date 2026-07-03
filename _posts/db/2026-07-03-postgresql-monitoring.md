---
title       : "PostgreSQL 모니터링 — pg_stat 뷰와 슬로우 쿼리 추적"
description : "pg_stat_activity·pg_stat_user_tables·pg_stat_statements로 느린 쿼리·안 쓰는 인덱스·dead tuple·복제 지연을 찾아내고, log_min_duration_statement로 슬로우 쿼리를 잡는 법."
date        : 2026-07-03 17:10:00 +0900
updated     : 2026-07-03 17:10:00 +0900
categories  : [db, "PostgreSQL·운영"]
tags        : [postgresql, monitoring, pg-stat, performance]
pin         : false
hidden      : false
---

DB가 느려졌다는 알림이 왔다. 어디를 봐야 하나. PostgreSQL은 내부 통계를 `pg_stat_*` 계열 뷰로 전부 노출한다. 지금 무슨 쿼리가 돌고 있는지, 어떤 테이블이 seq scan에 시달리는지, 어떤 인덱스가 한 번도 안 쓰였는지 전부 SQL 한 줄로 조회된다. 별도 APM 없이도 여기서 대부분의 문제를 잡을 수 있다. 이 글은 무엇을 보고 어떻게 원인을 좁히는지 정리한다. (기준: PostgreSQL 16/17)

## 1. 무엇을 모니터링하나

운영 중 봐야 할 지표는 크게 여섯 가지다.

| 지표 | 왜 보나 | 어디서 |
| --- | --- | --- |
| 느린 쿼리 | 응답 지연·CPU 소모의 주범 | `pg_stat_statements`, 로그 |
| 커넥션 수 | 소진되면 신규 연결 거부 | `pg_stat_activity` |
| 캐시 적중률 | 낮으면 디스크 I/O 폭증 | `pg_statio_*`, `pg_stat_database` |
| dead tuple / bloat | 쌓이면 테이블 팽창·성능 저하 | `pg_stat_user_tables` |
| 복제 지연 | 스탠바이가 뒤처지면 데이터 유실 위험 | `pg_stat_replication` |
| 락 대기 | 쿼리가 서로 물려 멈춤 | `pg_locks`, `pg_stat_activity` |

## 2. pg_stat_activity — 지금 이 순간

현재 서버에 붙은 모든 백엔드 프로세스를 한 행씩 보여준다. "지금 뭐가 돌고 있나"의 시작점이다.

```sql
SELECT pid, usename, state, wait_event_type, wait_event,
       now() - query_start AS duration, query
FROM pg_stat_activity
WHERE state <> 'idle'
ORDER BY duration DESC;
```

핵심 컬럼:

| 컬럼 | 의미 |
| --- | --- |
| `state` | `active`, `idle`, `idle in transaction` 등 |
| `wait_event_type` / `wait_event` | 무엇을 기다리는가 (`Lock`, `IO`, `Client` …) |
| `query_start` / `xact_start` | 쿼리·트랜잭션 시작 시각 (경과 시간 계산용) |
| `query` | 가장 최근 실행 쿼리 텍스트 |
| `backend_type` | `client backend`, `autovacuum worker` 등 |

`idle in transaction` 상태가 오래 유지되는 연결은 위험 신호다. 트랜잭션을 열어둔 채 놀고 있어 락과 dead tuple 정리를 동시에 막는다. 오래 걸리는 세션은 `pg_terminate_backend(pid)`로 끊을 수 있다.

## 3. pg_stat_user_tables — 테이블 건강검진

테이블별 접근 패턴과 vacuum 상태를 누적한다.

```sql
SELECT relname, seq_scan, idx_scan,
       n_live_tup, n_dead_tup,
       last_autovacuum, last_autoanalyze
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;
```

- `seq_scan` vs `idx_scan` — seq scan 비율이 높은데 테이블이 크면 인덱스가 없거나 안 먹는다는 뜻이다.
- `n_dead_tup` — dead tuple 누적량. `n_live_tup` 대비 비율이 높으면 bloat와 autovacuum 지연을 의심한다.
- `last_autovacuum` / `last_autoanalyze` — autovacuum이 마지막으로 돈 시각. dead tuple은 쌓이는데 이 값이 오래됐으면 autovacuum이 못 따라잡고 있는 것이다.

> dead tuple이 많고 `last_autovacuum`이 한참 전이면, autovacuum 튜닝(`autovacuum_vacuum_scale_factor` 등)이나 수동 `VACUUM`이 필요하다. MVCC와 vacuum의 원리는 관련 글 참고.

## 4. pg_stat_user_indexes — 안 쓰는 인덱스 찾기

인덱스별 사용 횟수를 센다. `idx_scan`이 오랫동안 0이면 그 인덱스는 쓰이지 않는다.

```sql
SELECT s.relname AS table, s.indexrelname AS index,
       s.idx_scan,
       pg_size_pretty(pg_relation_size(s.indexrelid)) AS size
FROM pg_stat_user_indexes s
JOIN pg_index i ON i.indexrelid = s.indexrelid
WHERE s.idx_scan = 0
  AND NOT i.indisunique          -- UNIQUE/PK 제약은 제외
ORDER BY pg_relation_size(s.indexrelid) DESC;
```

안 쓰는 인덱스는 순수 비용이다. 디스크를 먹고, INSERT/UPDATE마다 갱신 부담을 준다. 다만 `idx_scan`은 통계 리셋 이후 누적값이므로, "충분히 오래 관측한 뒤" 판단해야 한다. 리셋 시각은 `pg_stat_reset()` 호출 이력이나 별도 스냅샷으로 관리한다. UNIQUE·기본키 인덱스는 스캔이 0이어도 제약 유지에 필요하니 지우면 안 된다.

## 5. pg_statio_* — 캐시 적중률

`pg_statio_user_tables`는 힙 블록을 셰어드 버퍼에서 읽었는지(`heap_blks_hit`) 디스크에서 읽었는지(`heap_blks_read`) 구분한다. 전체 적중률은 `pg_stat_database`로 본다.

```sql
SELECT datname,
       round(100.0 * blks_hit / nullif(blks_hit + blks_read, 0), 2) AS cache_hit_ratio
FROM pg_stat_database
WHERE datname = current_database();
```

OLTP 워크로드라면 99% 이상이 정상이다. 이 값이 뚝 떨어지면 워킹셋이 `shared_buffers`를 넘었거나, 큰 seq scan이 버퍼를 밀어내고 있다는 신호다.

## 6. pg_stat_replication — 복제 지연

프라이머리에서 각 스탠바이의 상태와 지연을 본다.

```sql
SELECT application_name, state,
       write_lag, flush_lag, replay_lag,
       pg_wal_lsn_diff(sent_lsn, replay_lsn) AS replay_bytes
FROM pg_stat_replication;
```

- `write_lag` / `flush_lag` / `replay_lag` — WAL을 로컬에 flush한 뒤 스탠바이가 각각 write/flush/apply할 때까지 걸린 시간(`interval`).
- `sent_lsn` vs `replay_lsn` — 보낸 WAL 위치와 스탠바이가 실제 반영한 위치의 차이. 바이트 격차가 계속 벌어지면 스탠바이가 못 따라오는 것이다.

`replay_lag`이 커지면 동기 복제라면 커밋이 느려지고, 비동기라면 페일오버 시 데이터 유실 폭이 커진다.

## 7. pg_locks — 락 대기

락을 서로 기다리며 멈춘 상황은 `pg_locks`와 `pg_stat_activity`를 조인해 찾는다. `granted = false`인 행이 대기 중인 락이다.

```sql
SELECT blocked.pid   AS blocked_pid,
       blocked.query AS blocked_query,
       blocking.pid  AS blocking_pid,
       blocking.query AS blocking_query
FROM pg_stat_activity blocked
JOIN pg_stat_activity blocking
  ON blocking.pid = ANY(pg_blocking_pids(blocked.pid))
WHERE cardinality(pg_blocking_pids(blocked.pid)) > 0;
```

`pg_blocking_pids(pid)`는 해당 세션을 막고 있는 세션 PID 배열을 돌려준다. 누가 누구를 막는지 한눈에 나온다.

## 8. pg_stat_statements — 진짜 무거운 쿼리 랭킹

`pg_stat_activity`는 "지금 이 순간"만 본다. 누적 통계로 무거운 쿼리를 랭킹하려면 `pg_stat_statements` 확장이 필요하다. 쿼리를 정규화(리터럴을 파라미터로 치환)해 같은 형태끼리 묶고, 호출 횟수·총 시간·평균 시간을 누적한다.

설치는 `shared_preload_libraries`에 추가하고 재시작한 뒤 확장을 만든다.

```conf
# postgresql.conf
shared_preload_libraries = 'pg_stat_statements'
compute_query_id = on
```

```sql
CREATE EXTENSION pg_stat_statements;
```

총 실행 시간이 큰 순서로 뽑으면 튜닝 우선순위가 나온다.

```sql
SELECT queryid,
       calls,
       round(total_exec_time::numeric, 1) AS total_ms,
       round(mean_exec_time::numeric, 2)  AS mean_ms,
       rows,
       round(100.0 * shared_blks_hit
             / nullif(shared_blks_hit + shared_blks_read, 0), 1) AS hit_pct,
       query
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;
```

| 컬럼 | 의미 |
| --- | --- |
| `calls` | 호출 횟수 |
| `total_exec_time` | 누적 실행 시간(ms) — 총 부하 |
| `mean_exec_time` | 평균 실행 시간(ms) — 건당 무게 |
| `rows` | 누적 반환/처리 행 수 |
| `shared_blks_hit` / `shared_blks_read` | 버퍼 적중 / 디스크 읽기 블록 수 |

> `mean_exec_time`이 높은 쿼리는 "한 방이 무거운" 쿼리, `calls × mean`이 커서 `total_exec_time` 상위인 쿼리는 "자주 불려 누적 부하가 큰" 쿼리다. 둘은 튜닝 접근이 다르다. 전자는 실행계획을, 후자는 캐싱·호출 빈도를 본다.

컬럼명은 버전에 민감하다. `total_time`은 PostgreSQL 13부터 `total_exec_time`으로 바뀌었다(플래닝 시간이 `total_plan_time`으로 분리됨). 16/17에서는 위 이름을 쓴다. 통계를 리셋하려면 `pg_stat_statements_reset()`을 호출한다.

## 9. 슬로우 쿼리 로깅

랭킹만으로 부족하면 개별 실행을 로그로 남긴다. `log_min_duration_statement`는 지정 시간(ms)을 초과한 쿼리를 실제 파라미터 값과 함께 로그에 기록한다.

```conf
# postgresql.conf
log_min_duration_statement = 1000   # 1초 이상 걸린 쿼리 기록, -1이면 비활성
```

전역 대신 특정 DB·유저에만 걸 수도 있다.

```sql
ALTER DATABASE app SET log_min_duration_statement = 500;
```

### auto_explain

느린 쿼리의 실행계획까지 자동으로 로그에 남기려면 `auto_explain` 모듈을 쓴다. 임계 시간을 넘는 쿼리의 `EXPLAIN` 결과를 로그에 찍어, 재현 없이도 왜 느렸는지 본다.

```conf
shared_preload_libraries = 'pg_stat_statements,auto_explain'
auto_explain.log_min_duration = 1000   # ms
auto_explain.log_analyze = on          # 실제 실행 시간까지 (오버헤드 주의)
```

`log_analyze`는 실측을 위해 계측 오버헤드가 생기므로 운영에서는 신중히 켠다.

## 10. 실무 시나리오 — 어느 뷰를 보나

| 증상 | 보는 곳 | 판단 |
| --- | --- | --- |
| 안 쓰는 인덱스 정리 | `pg_stat_user_indexes` | `idx_scan = 0`을 충분히 관측 후 UNIQUE/PK 제외하고 DROP |
| seq scan 폭증 테이블 | `pg_stat_user_tables` | `seq_scan`↑ + 큰 테이블 → 인덱스 추가·통계 갱신 검토 |
| 커넥션 소진 | `pg_stat_activity` | `state`별 집계, `idle in transaction` 누수 세션 색출 |
| 응답 전반 저하 | `pg_stat_statements` | `total_exec_time` 상위 쿼리부터 튜닝 |
| 특정 쿼리만 가끔 느림 | 로그 + `auto_explain` | 실제 실행계획 확인 |
| 쿼리가 멈춤 | `pg_locks` + `pg_blocking_pids` | 블로킹 세션 추적·종료 |

커넥션 상태별 집계는 이 한 줄이면 된다.

```sql
SELECT state, count(*) FROM pg_stat_activity GROUP BY state;
```

## 11. 외부 스택 — Prometheus + Grafana

뷰를 매번 손으로 조회하는 대신 시계열로 쌓아 대시보드·알림을 걸려면 **postgres_exporter**를 붙인다. exporter가 위 `pg_stat_*` 뷰를 주기적으로 조회해 Prometheus 메트릭으로 노출하고, Prometheus가 수집, Grafana가 시각화한다. 커넥션 수·캐시 적중률·복제 지연·dead tuple을 그래프로 보고, 임계치 초과 시 Alertmanager로 알림을 받는 구성이 사실상 표준이다. 커스텀 지표는 exporter 설정에 SQL을 등록해 추가한다.

> 결국 데이터 출처는 이 글의 `pg_stat_*` 뷰다. 외부 스택은 그것을 시계열로 쌓고 알림을 거는 껍데기일 뿐, 무엇을 봐야 하는지 아는 것이 먼저다.

## 관련 글

| 글 | 관계 |
| --- | --- |
| [MVCC와 VACUUM](/posts/db/2026-07-03-mvcc-vacuum/) | pg_stat로 보는 dead tuple·autovacuum |
| [쿼리 옵티마이저 작동 원리와 실행계획 읽기](/posts/db/2026-07-03-query-optimizer-explain/) | 슬로우 쿼리를 EXPLAIN으로 파고들기 |
