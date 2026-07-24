---
title       : RDB에서 조인(Join) 방식 총정리
description : "Nested Loop·Hash·Sort-Merge JOIN의 원리와 시간 복잡도, 메모리 사용 패턴, 옵티마이저가 테이블 크기·인덱스·정렬 상태를 보고 어떤 전략을 고르는지."
date        : 2026-01-04 19:42:22 +0900
updated     : 2026-07-24 12:00:00 +0900
categories  : [db, "RDB·트랜잭션"]
tags        : [join]
pin         : false
hidden      : false
---

조인 성능을 이해하려면 옵티마이저가 고를 수 있는 조인 방식부터 알아야 한다. 같은 `JOIN` 구문이라도 테이블 크기·인덱스·정렬 상태에 따라 전혀 다른 알고리즘으로 실행되고, 그 선택이 응답 시간을 좌우한다.

## 1. Nested Loop Join (중첩 반복 조인)

### 원리
- 테이블 A의 각 행을 순회하면서, 테이블 B에서 조건에 맞는 행을 찾아 결합
- 작은 테이블 A를 외부 루프, 큰 테이블 B를 내부 루프로 두는 것이 유리
- 조인 키에 인덱스가 있으면 내부 루프 검색 비용이 급감 → Index Nested Loop Join
- 인덱스가 왜/언제 타는지는 [RDB 인덱스 완전 정리](/posts/db/2026-07-03-rdb-index/) 글에서 다룬다

```sql
SELECT *
FROM A
JOIN B ON A.id = B.a_id;
```

- **시간 복잡도**: 일반 O(N × M), 인덱스 사용 시 O(N × log M)
- **메모리**: 작은 테이블만 메모리에 두고 큰 테이블은 순차 읽기 → 부담이 작음
- **특징**: 구현이 단순하고 인덱스가 있으면 빠르지만, 큰 테이블끼리 조인하면 비효율적

## 2. Hash Join

### 원리
- 작은 테이블로 해시 테이블을 만든 뒤, 큰 테이블을 순회하며 키를 매칭

```text
hash_table = {key: row for row in small_table}
for row in large_table:
    if row.key in hash_table:
        output(row, hash_table[row.key])
```

- **시간 복잡도**: 해시 생성 O(N) + 순회 O(M) = O(N + M) — Nested Loop보다 훨씬 빠름
- **메모리**: 작은 테이블 전체를 메모리에 올려야 함. 부족하면 데이터를 파티션으로 나눠 디스크를 쓰는 Grace/Partitioned Hash Join으로 전환
- **특징**: 큰 테이블 조인에 강하지만 메모리가 부족하면 디스크 I/O가 발생

## 3. Sort-Merge Join (정렬-병합 조인)

### 원리
- 두 테이블을 조인 키로 정렬한 뒤, 정렬된 상태에서 순차적으로 병합

```sql
SELECT *
FROM A JOIN B ON A.key = B.key
ORDER BY A.key, B.key;
```

- **시간 복잡도**: 정렬 O(N log N + M log M) + 병합 O(N + M)
- **메모리**: 버퍼 단위로 처리. 부족하면 외부 정렬(External Sort) 후 디스크 사용
- **특징**: 이미 정렬된(또는 인덱스로 정렬 순서가 보장된) 테이블이면 매우 빠르고, 병합 단계는 순차 I/O라 안정적

## 4. 분산/분할 조인

분산 환경에서는 네트워크 전송량이 병목이라 다음 전략으로 I/O를 줄인다.

- **Broadcast Join**: 작은 테이블을 모든 노드에 복제해 각 노드의 로컬 큰 테이블과 조인
- **Semi-Join / Bloom Filter Join**: 큰 테이블에서 매칭되지 않을 행을 미리 걸러 네트워크 전송량을 최소화

## 5. 시간/공간 복잡도 요약

| 조인 방식 | 시간 복잡도 | 메모리 | 특징 |
| --- | --- | --- | --- |
| Nested Loop | O(N×M) | 작은 테이블 | 인덱스 있으면 개선 |
| Hash Join | O(N+M) | 작은 테이블 | 큰 테이블 효율적, 메모리 초과 시 파티션 |
| Sort-Merge Join | O(N log N + M log M) | 버퍼 단위 | 이미 정렬된 경우 강력 |
| Broadcast Join | O(N + M/P) | 작은 테이블 | 분산 환경 최적화 |
| Semi/Bloom Filter Join | O(N + M) | 작은 테이블 + 필터 | 네트워크 최적화 |

## 6. 메모리 최적화 원리

1. 작은 테이블은 메모리에, 큰 테이블은 순차 스캔
2. 조인 키 기준 **파티셔닝**으로 메모리 부담 분산
3. 결과를 버퍼 단위로 순차 반환하는 **스트리밍 처리**
4. 메모리 초과 시 **임시 디스크** 파티션 활용

> 핵심: "한 번에 다 올리지 않고, 필요한 부분만 메모리에 올리고 나머지는 디스크/스트리밍으로 처리"

## 7. 옵티마이저는 조인 전략을 어떻게 고르나

현대 RDBMS는 쿼리 실행 전에 Cost-Based Optimizer(CBO)로 후보 조인 방식들의 예상 비용을 계산해 최소 비용 전략을 고른다. 조인 관점에서 그 선택을 가르는 요소만 추리면 다음과 같다.

- **테이블 크기**: 작은 테이블끼리면 Nested Loop, 큰 테이블이 끼면 Hash / Merge Join 쪽으로 기운다.
- **인덱스 존재**: 조인 키에 인덱스가 있으면 Index Nested Loop가 후보로 올라온다.
- **메모리 용량**: Hash Join은 작은 테이블 전체를 올려야 하므로 가용 메모리가 선택을 좌우한다.
- **정렬 여부**: 입력이 이미 조인 키로 정렬돼 있으면 Merge Join의 정렬 비용이 사라진다.
- **필터 조건**: WHERE/JOIN 조건으로 한쪽 스캔 범위가 크게 줄면 Nested Loop가 유리해진다.

옵티마이저가 이 비용을 어떻게 계산하는지 — 통계 수집, 카디널리티 추정, 비용 모델, 그리고 `EXPLAIN`으로 실행계획을 읽는 법 — 은 조인만의 주제가 아니라서 [쿼리 옵티마이저 작동 원리와 실행계획 읽기](/posts/db/2026-07-03-query-optimizer-explain/) 글에서 따로 다룬다.

### DB 엔진별 특징

| DB | 주요 조인 전략 | 특화 기능 |
| --- | --- | --- |
| Oracle | Nested Loop, Hash, Sort-Merge | Bitmap Join Index, Star Join, Bloom Filter Join, Adaptive Join |
| PostgreSQL | Nested Loop, Hash, Merge | Hash Aggregation + Join, 자동 선택 |
| SQL Server | Nested Loop, Hash, Merge | Adaptive Join(실행 중 최적화), 병렬 처리 연계 |

## 8. 실무 팁

- `EXPLAIN` / `EXPLAIN ANALYZE`로 **실제 선택된 조인 전략**을 확인한다
- 필터링 + 필요한 컬럼만 조회해 불필요한 데이터 로딩을 막는다
- 옵티마이저가 잘못 고르면 힌트로 강제: `/*+ USE_HASH */`(Oracle), `OPTION (HASH JOIN)`(SQL Server)
- 분산 환경에서는 Bloom Filter / Partitioned Join을 활용한다
- 데이터 서버가 분리돼 있으면 ETL/앱 레벨 조인이 현실적

> 정리: RDBMS는 **테이블 크기·인덱스·통계·메모리·정렬·필터·분산 환경**을 종합해 Nested Loop / Hash / Merge 중 비용 최소 전략을 자동으로 고른다. 성능 문제를 풀 땐 `EXPLAIN`으로 선택된 전략을 먼저 확인하는 것이 출발점이다.

## 관련 글

| 글 | 다루는 것 |
| --- | --- |
| **RDB에서 조인(Join) 방식 총정리 (현재 글)** | 조인 알고리즘과 옵티마이저의 전략 선택 |
| [RDB 인덱스 완전 정리](/posts/db/2026-07-03-rdb-index/) | Index Nested Loop의 전제 — 인덱스가 언제 타나 |
| [쿼리 옵티마이저 작동 원리와 실행계획 읽기](/posts/db/2026-07-03-query-optimizer-explain/) | 옵티마이저가 조인 전략을 고르는 일반 원리와 EXPLAIN |
| [Vertica에서 OR 조건 JOIN은 성능을 죽인다](/posts/db/2026-04-15-vertica-or-join-kills-performance/) | OR 조건이 Join Filter로 빠지는 문제와 의미를 보존한 매칭 쌍 분리 해법 |
| [RECORD_ID를 레벨 테이블에 사전 적재하여 조회 성능 개선](/posts/db/2026-06-09-preload-record-id-to-level-table/) | INSERT 시점에 컬럼을 옮겨 조회 JOIN 자체를 제거 |
