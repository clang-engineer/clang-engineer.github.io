---
title       : "PostgreSQL 실행계획(EXPLAIN) 노드·필드 사전 — 무엇이 보이면 무슨 뜻인가"
description : "EXPLAIN 출력의 스캔·조인·집계·정렬 노드와 Buffers·Heap Fetches·Sort Method 같은 계측 라인을 빠르게 찾아보는 PostgreSQL 실전 레퍼런스."
date        : 2026-07-03 18:30:00 +0900
updated     : 2026-09-06 20:05:00 +0900
categories  : [db, "RDB·트랜잭션"]
tags        : [explain, execution-plan, postgresql, performance]
pin         : false
hidden      : false
---

이 글은 원리 설명이 아니라 **PostgreSQL `EXPLAIN` 노드·필드를 빠르게 찾는 실전 사전**이다. 왜 특정 Plan이 선택되는지에 대한 일반 원리는 정보관리기술사 Knowledge의 `쿼리-옵티마이저-통계-카디널리티-실행계획.md`, JOIN 내부 원리는 `질의최적화와-JOIN-실행전략.md`, Index 구조는 `BTree-클러스터드-넌클러스터드-인덱스.md`에서 관리한다.

여기서는 PostgreSQL Plan을 실제로 볼 때 **무슨 노드인지, 무엇을 같이 확인해야 하는지**에 집중한다.

## 1. 스캔 노드

| 노드 | 의미 | 확인할 것 |
| --- | --- | --- |
| `Seq Scan` | Table 전체를 순차 Scan | 큰 Table에서 `Rows Removed by Filter`가 큰가 |
| `Index Scan` | Index로 위치를 찾고 Heap Row 접근 | `Index Cond`가 실제 검색 조건인가 |
| `Index Only Scan` | 필요한 값을 Index에서 해결 | `Heap Fetches`가 충분히 작은가 |
| `Bitmap Index Scan` | 조건에 맞는 Heap Page 위치 수집 | `Bitmap Heap Scan`과 함께 봄 |
| `Bitmap Heap Scan` | Bitmap이 가리키는 Page 접근 | `Recheck Cond`, Lossy 여부 |
| `CTE Scan` | Materialized CTE 결과 Scan | CTE 재사용·Materialization 비용 |
| `Foreign Scan` | FDW 등 외부 Data 접근 | Filter/Join Pushdown 여부 |

`Index Only Scan`이라는 이름만 보고 Heap Access가 없다고 단정하지 않는다. Visibility Map 상태에 따라 `Heap Fetches`가 발생할 수 있다.

## 2. 조인·결합 노드

| 노드 | 의미 | 확인할 것 |
| --- | --- | --- |
| `Nested Loop` | Outer Row마다 Inner 반복 Lookup | Inner `loops`, Index Lookup 비용 |
| `Hash Join` | Build Side를 Hash로 만들고 Probe | Hash Size, `Batches`, Disk Spill |
| `Merge Join` | 정렬된 입력을 함께 순회 | 하위 `Sort` 비용 |
| `Materialize` | 하위 결과를 저장해 반복 Scan 완화 | Memory/Temp 사용 |
| `Memoize` | Parameter 값별 Inner 결과 Cache | `Hits`, `Misses`, `Evictions` |
| `Gather` | 병렬 Worker 결과 취합 | Planned vs Launched Worker |
| `Gather Merge` | 정렬 순서를 유지하며 병렬 결과 취합 | 정렬 비용 포함 여부 |
| `Append` | 여러 하위 Plan 결과 연결 | Partition Pruning 여부 |

`Nested Loop`, `Hash`, `Merge`는 같은 Logical JOIN을 실행하는 서로 다른 물리 전략이다. 알고리즘 이름보다 **현재 Row 수·Index·Sort·Memory 조건에 맞는 선택인지**를 본다.

## 3. 집계·정렬 노드

| 노드 | 의미 | 확인할 것 |
| --- | --- | --- |
| `Aggregate` | 전체 집계 | 입력 Row 수 |
| `HashAggregate` | Hash 기반 Grouping | `Disk Usage`, Memory |
| `GroupAggregate` | 정렬된 입력 Grouping | 하위 Sort 필요 여부 |
| `WindowAgg` | Window Function 처리 | Partition/Order Sort 비용 |
| `Sort` | 전체 정렬 | `Sort Method`, Disk 사용 |
| `Incremental Sort` | 이미 정렬된 Prefix를 활용 | `Presorted Key` |
| `Limit` | 상위 N Row만 통과 | 하위 Plan이 조기 종료되는가 |
| `ModifyTable` | INSERT/UPDATE/DELETE/MERGE | Trigger·Partition Routing |
| `LockRows` | `FOR UPDATE/SHARE` Row Lock | Lock 경합 |

## 4. 자주 보는 계측 필드

`EXPLAIN (ANALYZE, BUFFERS)`에서 특히 많이 보는 필드다.

| 필드 | 의미 | 위험 신호 |
| --- | --- | --- |
| `actual time` | 실제 실행시간 | 특정 Node가 시간 대부분 차지 |
| `rows` | 1 Loop당 실제 Row 수 | 예상 Row와 큰 차이 |
| `loops` | Node 실행 횟수 | Nested Loop Inner에서 매우 큼 |
| `Rows Removed by Filter` | Scan 후 Filter에서 폐기 | 통과 Row보다 압도적으로 큼 |
| `Rows Removed by Join Filter` | Join 후 폐기 | Join Key/조건 재검토 |
| `Heap Fetches` | Index Only Scan 중 Heap 방문 | 크면 Index Only 이점 감소 |
| `Buffers: shared hit` | Shared Buffer 적중 | 정상적인 Cache Hit |
| `Buffers: shared read` | Storage에서 읽은 Block | 크면 I/O 비용 확인 |
| `Buffers: temp read/written` | Temp File I/O | Sort/Hash Spill 가능성 |
| `Sort Method: external merge` | Disk 기반 Sort | `work_mem` 부족 후보 |
| `Workers Planned/Launched` | 계획/실제 병렬 Worker | Launched가 더 적음 |
| `Planning Time` | Plan 생성 시간 | 짧은 Query 대비 과도한가 |
| `Execution Time` | 전체 실행시간 | 기준 지표 |

표시되는 `actual time`과 `rows`는 `loops`가 여러 번이면 **Loop당 평균값**이라는 점을 주의한다.

```text
actual rows=1 loops=1,000,000
```

이면 실제로는 1 Row Lookup이 백만 번 일어난 것이다.

## 5. 위험 신호를 문제 유형으로 연결한다

```text
Estimated Rows ≠ Actual Rows
→ 통계·Cardinality 추정 문제

Nested Loop Inner loops 폭증
→ Outer Row 추정 / Inner Access Path 확인

Hash Batches 증가 / temp written
→ Memory 부족·Spill 확인

external merge Disk
→ Sort가 Memory를 넘음

Rows Removed by Filter 폭증
→ Access Path가 너무 많은 Row를 먼저 읽음

Heap Fetches 폭증
→ Index Only Scan이 Heap을 자주 방문

Append 하위 Plan이 너무 많음
→ Partition Pruning 확인
```

## 6. 읽는 순서

Plan을 볼 때는 Node 이름을 전부 외우는 것보다 다음 순서를 반복하는 게 실용적이다.

```text
1. 실제 실행시간이 큰 Node 찾기
2. Estimated Rows와 Actual Rows 비교
3. loops 확인
4. Scan / Join Access Path 확인
5. Sort·Hash Spill 확인
6. Buffers로 I/O 확인
7. 원인에 맞게 Index·통계·Query·Memory 설정 조정
8. 다시 EXPLAIN ANALYZE로 측정
```

## 정리

이 문서는 PostgreSQL 실행계획의 **제품별 실전 Reference**다.

일반 원리는 기술사 Knowledge에서 관리하고, 여기서는 실제 Plan을 만났을 때 빠르게 다음을 찾는다.

```text
무슨 Node인가?
→ 얼마나 실행됐나?
→ 예상과 실제 Row가 맞나?
→ Memory / Disk Spill이 있나?
→ Filter 후 버린 Row가 많은가?
→ I/O가 병목인가?
```

이렇게 보면 EXPLAIN을 Node 이름 암기가 아니라 **실제 병목을 좁혀가는 진단 도구**로 사용할 수 있다.
