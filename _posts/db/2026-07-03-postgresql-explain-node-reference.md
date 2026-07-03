---
title       : "PostgreSQL 실행계획(EXPLAIN) 노드·필드 사전 — 무엇이 보이면 무슨 뜻인가"
description : "EXPLAIN 출력에 나오는 스캔·조인·집계·정렬 노드와 Buffers·Heap Fetches·Sort Method 같은 계측 라인을 사전처럼 찾아보고, 위험 신호를 한눈에 읽는 레퍼런스."
date        : 2026-07-03 18:30:00 +0900
updated     : 2026-07-03 18:30:00 +0900
categories  : [db, "RDB·트랜잭션"]
tags        : [explain, execution-plan, postgresql, performance]
pin         : false
hidden      : false
---

이 글은 원리 설명이 아니라 **노드·필드를 찾아보는 사전**이다. `EXPLAIN` 출력에 처음 보는 연산자가 우수수 나올 때, "이게 무슨 연산이고, 보이면 무슨 뜻이며, 위험 신호는 무엇인가"를 표에서 빠르게 찾는 용도다. 왜 이 계획이 나오고 어떻게 튜닝하는지 원리·처방은 [쿼리 옵티마이저 작동 원리와 실행계획 읽기](/posts/db/2026-07-03-query-optimizer-explain/)로, 조인 알고리즘의 내부 동작은 [RDB에서 조인 방식 총정리](/posts/db/2026-01-04-rdb-join-strategy/)로 위임한다. 기준은 PostgreSQL 16/17이다.

> 트리 읽는 방향(안쪽·아래부터), `cost`/`rows`/`width`, `actual time`/`rows`/`loops`의 의미와 `loops` 함정은 옵티마이저 글에서 이미 다뤘다. 여기서는 **개별 노드와 라인의 뜻**만 나열한다.

## 1. 스캔 노드 (테이블·인덱스에서 행을 꺼내는 연산)

| 노드 | 무슨 연산인가 | 보이면 체크할 것 |
| --- | --- | --- |
| `Seq Scan` | 테이블 전체를 물리 순서로 순차 읽기 | 큰 테이블에 붙었는데 `Rows Removed by Filter`가 크면 인덱스 여지 |
| `Index Scan` | 인덱스로 위치를 찾고 매 행마다 힙(테이블)을 방문 | `Index Cond`가 실제 검색 조건인지 확인 |
| `Index Only Scan` | 필요한 컬럼이 **인덱스에 모두 있어** 힙 방문을 생략 | `Heap Fetches`(아래 4절) — 0에 가까워야 이득 |
| `Bitmap Index Scan` | 조건에 맞는 힙 페이지 위치를 비트맵으로 모음 | 단독으로 안 보이고 아래 `Bitmap Heap Scan`과 짝 |
| `Bitmap Heap Scan` | 비트맵이 가리키는 페이지들을 페이지 순서로 방문 | `Recheck Cond`, `Rows Removed by Filter`(아래 4절) |
| `Tid Scan` | `ctid`(물리 튜플 위치)로 직접 접근 | `WHERE ctid = ...` 같은 특수 쿼리에서만 등장 |
| `Function Scan` | 집합 반환 함수(`generate_series`, `unnest` 등)의 결과를 행으로 | 추정 `rows`가 기본값(대개 1000)이면 카디널리티 오판 주의 |
| `Values Scan` | `VALUES (...), (...)` 리터럴 행 목록을 스캔 | 다중 행 `INSERT`/조인용 인라인 테이블 |
| `CTE Scan` | `WITH`로 **구체화(materialized)된** CTE 결과를 읽음 | CTE가 여러 번 참조되면 매번 스캔 — 인라인 여부 확인 |
| `Subquery Scan` | `FROM (SELECT ...)` 서브쿼리 결과를 감싸 읽음 | 평탄화되지 못한 서브쿼리 표식일 수 있음 |
| `WorkTable Scan` | **재귀 CTE**(`WITH RECURSIVE`)의 반복 작업 테이블을 읽음 | `Recursive Union` 하위에서 등장 |
| `Foreign Scan` | 외부 데이터 래퍼(FDW), 외부/원격 테이블 스캔 | 원격에서 필터가 푸시다운됐는지(`Remote SQL`) 확인 |

> `Seq`/`Index`/`Bitmap`의 선택 기준(선택도·클러스터링)은 옵티마이저 글에, 인덱스 구조는 [RDB 인덱스 완전 정리](/posts/db/2026-07-03-rdb-index/)에 있다. 이 사전에서 새로 기억할 것은 **`Index Only Scan`은 `Heap Fetches`가 커지면 일반 `Index Scan`과 다를 바 없어진다**는 점이다.

## 2. 조인·결합 노드

세 조인 알고리즘은 한 줄 요약만 둔다. 내부 원리는 [조인 방식 총정리](/posts/db/2026-01-04-rdb-join-strategy/)로.

| 노드 | 무슨 연산인가 | 보이면 체크할 것 |
| --- | --- | --- |
| `Nested Loop` | 바깥 각 행마다 안쪽을 반복 조회 | 안쪽 `loops`가 크면 소량·인덱스 조인이라야 유리 |
| `Hash Join` + `Hash` | 한쪽으로 해시 테이블을 만들고 다른 쪽을 탐침 | `Hash` 노드의 `Batches`가 2 이상이면 디스크로 분할됨 |
| `Merge Join` | 양쪽을 정렬 순서로 나란히 병합 | 하위에 `Sort`가 붙는지(정렬 비용 포함) |
| `Materialize` | 하위 결과를 메모리(넘치면 임시파일)에 캐시해 재스캔 대비 | Nested Loop 안쪽 반복 스캔을 줄이려는 완충재 |
| `Memoize` (PG14+) | 파라미터화된 Nested Loop 안쪽 결과를 **파라미터 값별로 캐시** | `Hits`/`Misses`/`Evictions` — Hit율 낮으면 이득 없음 |
| `Gather` | 병렬 워커들의 결과를 리더가 순서 무관하게 취합 | `Workers Planned`/`Launched`(아래 4절) |
| `Gather Merge` | 각 워커가 정렬해 보낸 결과를 **정렬 순서 유지**하며 병합 | 병렬 + `ORDER BY`/`Merge` 조합에서 등장 |
| `Append` | 여러 하위 계획 결과를 이어 붙임(`UNION ALL`·파티션) | 파티션 프루닝이 됐다면 하위 개수가 줄어야 함 |
| `Merge Append` | 정렬된 하위 계획들을 정렬 순서 유지하며 이어 붙임 | 파티션 + `ORDER BY`에서 등장 |

> `Memoize`는 반복 파라미터의 재조회를 캐시로 건너뛴다. `Cache Key`(캐시 기준 컬럼)와 함께 `Hits`/`Misses`가 표시되며, Miss가 대부분이면 오히려 오버헤드다.

## 3. 집계·정렬·그 외 노드

| 노드 | 무슨 연산인가 | 보이면 체크할 것 |
| --- | --- | --- |
| `Aggregate` | 그룹 없는 전체 집계(`count(*)` 등) | 단일 행 결과 |
| `HashAggregate` | **비정렬** 입력을 해시 테이블로 그룹화 | `Disk Usage`가 보이면 해시가 넘쳐 임시파일 사용 |
| `GroupAggregate` | **정렬된** 입력을 순서대로 그룹화(직전 그룹만 메모리) | 하위 `Sort` 비용 포함 여부 |
| `MixedAggregate` | `GROUPING SETS`/`ROLLUP`/`CUBE`를 해시+정렬 혼합으로 집계 | 그루핑셋 쿼리의 표식 |
| `WindowAgg` | 윈도우 함수(`OVER (...)`) 계산 | 파티션·정렬 요구로 하위 `Sort`가 붙곤 함 |
| `Unique` | **정렬된** 입력에서 인접 중복 제거(`DISTINCT`, `UNION`) | 하위 `Sort` 필요 |
| `SetOp` | `INTERSECT`/`EXCEPT` 집합 연산 수행 | `Recursive Union` 아닌 집합 연산 표식 |
| `Sort` | 전체 정렬 | `Sort Method`(아래 4절) — Disk면 `work_mem` 부족 |
| `Incremental Sort` (PG13+) | 이미 정렬된 접두 키를 이용해 **나머지 키만** 그룹별로 정렬 | `Presorted Key`/`Sort Key` 확인, 메모리 절약 이점 |
| `Limit` | 상위 N행만 통과시키고 중단 | 하위가 조기 종료되는지(`actual rows`) |
| `Result` | 스캔 없는 상수/식 평가, `One-Time Filter` | `One-Time Filter: false`면 하위가 아예 실행 안 됨 |
| `ProjectSet` | `SELECT` 목록의 집합 반환 함수(`generate_series` 등) 전개 | 행 폭증 여부 |
| `ModifyTable` | `INSERT`/`UPDATE`/`DELETE`/`MERGE` 실제 변경 수행 | 트리거·`RETURNING`·파티션 라우팅 동반 |
| `LockRows` | `SELECT ... FOR UPDATE/SHARE` 행 잠금 | 잠금 경합 유발 지점 |

> `Incremental Sort`는 입력이 `ORDER BY`의 앞부분 키로 이미 정렬돼 있을 때, 그 접두를 기준으로 묶어 **작은 블록만 정렬**한다. 블록이 `work_mem`에 들어갈 확률이 높아 디스크 정렬을 피하기 쉽다.

## 4. 계측·부가 라인 읽기

노드 아래 붙는 부가 라인들이다. `EXPLAIN (ANALYZE, BUFFERS)`로 켜야 보이는 것이 많다.

| 라인 | 무슨 뜻인가 | 위험 신호 |
| --- | --- | --- |
| `Filter` / `Rows Removed by Filter` | 스캔 후 조건으로 걸러낸 행. 제거된 실제 개수 | 제거 수가 통과 수보다 훨씬 크면 인덱스로 미리 걸러낼 여지 |
| `Index Cond` | 인덱스 자체로 평가된 검색 조건 | 여기 없고 `Filter`에만 있으면 인덱스가 조건을 못 태움 |
| `Recheck Cond` | Bitmap Heap Scan이 힙에서 조건을 재확인 | `Lossy`(페이지 단위) 비트맵이면 재검사 비용↑ |
| `Join Filter` / `Rows Removed by Join Filter` | 조인 조건으로 걸러낸 행. 제거된 실제 개수 | 제거 수가 크면 조인 조건이 인덱스/해시 키를 못 탐 |
| `Heap Fetches` | Index Only Scan이 가시성맵 미확정으로 힙을 방문한 횟수 | 값이 크면 이득 소멸 → VACUUM으로 가시성맵 갱신 |
| `Buffers: shared hit=… read=…` | 공유 버퍼 캐시 적중(hit)·디스크 읽기(read) 블록 수 | `read`가 크면 캐시 미스·I/O 병목 |
| `Buffers: shared dirtied=… written=…` | 이 쿼리가 더럽힌(dirtied)·써낸(written) 블록 수 | 읽기 쿼리인데 dirtied/written 크면 힌트비트·HOT 정리 부하 |
| `Buffers: temp read=… written=…` | 정렬·해시 임시파일의 읽기/쓰기 블록 | 나타나면 `work_mem` 부족으로 디스크 스필 |
| `Sort Method: quicksort` | 메모리 내 전체 퀵정렬 | (정상) |
| `Sort Method: top-N heapsort` | `LIMIT` N만 남기는 부분 정렬(힙) | (정상, 오히려 효율적) |
| `Sort Method: external merge Disk: …kB` | 메모리에 못 담아 디스크 병합 정렬 | `work_mem` 부족 신호 |
| `Workers Planned` / `Workers Launched` | 계획된 병렬 워커 수 / 실제 기동된 수 | Launched < Planned면 워커 슬롯 부족 |
| `Planning Time` / `Execution Time` | 계획 수립 시간 / 실행 시간(ms) | Planning이 Execution만큼 크면 계획 비용 과다 |
| `JIT` | 표현식 JIT 컴파일 시간·횟수 | 짧은 쿼리에 JIT 시간이 크면 역효과 |

> `Buffers`의 단위는 페이지(기본 8KB) 블록 수다. **`hit`은 캐시로 디스크를 피한 것, `read`는 디스크에서 실제로 읽은 것.** `temp read/written`이 보이면 정렬·해시·`Materialize`가 메모리를 넘겨 임시파일을 썼다는 뜻이고, 이는 곧 `work_mem` 상향 후보 지점이다. (temp 블록은 `hit`/`dirtied`를 집계하지 않고 `read`/`written`만 나온다.)

## 5. 자주 보는 위험 신호 체크리스트

| 증상 | 의미 | 어디를 볼까 |
| --- | --- | --- |
| `Sort Method: external merge Disk` / `temp written` 큼 | `work_mem` 부족으로 디스크 정렬·스필 | [옵티마이저 글](/posts/db/2026-07-03-query-optimizer-explain/)의 튜닝 절, `work_mem` 조정 |
| `HashAggregate`에 `Disk Usage` | 해시 테이블이 넘쳐 임시파일 사용 | `work_mem`, 그룹 카디널리티 재검토 |
| `Heap Fetches` 큼 | 가시성맵 미갱신 → Index Only Scan 이점 상실 | [MVCC와 VACUUM](/posts/db/2026-07-03-mvcc-vacuum.md), 오토배큠 튜닝 |
| `Rows Removed by Filter` 큼 | 스캔 후 대량 폐기 → 인덱스로 선별 가능 | [RDB 인덱스 완전 정리](/posts/db/2026-07-03-rdb-index/) |
| `Rows Removed by Join Filter` 큼 | 조인 조건이 키를 못 타 대량 대조·폐기 | [조인 방식 총정리](/posts/db/2026-01-04-rdb-join-strategy/) |
| `Recheck Cond` + `lossy` 비트맵 | 메모리 부족으로 페이지 단위 비트맵 | `work_mem`, Bitmap Scan 적정성 |
| `Workers Launched` < `Workers Planned` | 병렬 워커 슬롯 부족 | `max_parallel_workers(_per_gather)` 확인 |
| 추정 `rows` ≠ `actual rows` 큰 괴리 | 통계 낡음·상관관계 미반영 | [옵티마이저 글](/posts/db/2026-07-03-query-optimizer-explain/)의 통계 처방(`ANALYZE`·확장통계) |

> 대부분의 위험 신호는 이 사전에서 **식별**하고, **처방**은 짝이 되는 옵티마이저 글에서 찾는다.

## 관련 글

| 글 | 무엇을 다루나 |
| --- | --- |
| [쿼리 옵티마이저 작동 원리와 실행계획 읽기](/posts/db/2026-07-03-query-optimizer-explain/) | 이 사전의 짝 — 왜 이 계획이 나오고 어떻게 튜닝하나 |
| [RDB에서 조인(Join) 방식 총정리](/posts/db/2026-01-04-rdb-join-strategy/) | Nested Loop/Hash/Merge 조인 노드의 알고리즘 원리 |
| [RDB 인덱스 완전 정리](/posts/db/2026-07-03-rdb-index/) | Index Scan/Index Only Scan이 타는 인덱스 구조 |
