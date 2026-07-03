---
title       : "쿼리 옵티마이저 작동 원리와 실행계획(EXPLAIN) 읽기"
description : "비용 기반 옵티마이저가 통계로 카디널리티를 추정해 실행 계획을 고르는 원리와, EXPLAIN/EXPLAIN ANALYZE로 추정과 실제의 괴리를 읽어 튜닝하는 법."
date        : 2026-07-03 16:10:00 +0900
updated     : 2026-07-03 16:10:00 +0900
categories  : [db, "RDB·트랜잭션"]
tags        : [optimizer, explain, statistics, performance]
pin         : false
hidden      : false
---

같은 SQL 한 줄이라도 실행하는 방법은 수십 가지다. 어느 테이블을 먼저 읽을지, 인덱스를 탈지 전체를 훑을지, 조인은 어떤 알고리즘으로 붙일지 — 이 조합을 정하는 것이 옵티마이저다. 옵티마이저가 어떤 근거로 계획을 세우는지 이해하지 못하면, 느린 쿼리 앞에서 `EXPLAIN`을 봐도 무엇이 잘못됐는지 읽어낼 수 없다. 이 글은 옵티마이저가 통계로 계획을 세우는 원리와, 그 결과를 `EXPLAIN`으로 읽어 튜닝하는 실전을 한 편에 담는다. 기준은 PostgreSQL 16/17이다.

## 1. 비용 기반 옵티마이저(CBO)란

하나의 SQL을 실행하는 물리적 방법은 여러 개다. 예를 들어 두 테이블을 조인하는 쿼리는 이런 선택지를 갖는다.

- 접근 방법: `Seq Scan`(전체 순차 읽기) vs `Index Scan` vs `Bitmap Scan`
- 조인 알고리즘: `Nested Loop` vs `Hash Join` vs `Merge Join`
- 조인 순서: A를 먼저 읽고 B를 붙일지, 그 반대일지

이 모든 조합 하나하나가 **실행 계획(plan)** 이다. 비용 기반 옵티마이저(Cost-Based Optimizer, CBO)는 후보 계획마다 "예상 비용"을 숫자로 매기고, **비용이 가장 낮은 계획을 골라 실행**한다. 비용은 실제 밀리초가 아니라 옵티마이저 내부의 추상 단위이며, 절대값보다 **계획 간 상대 비교**에 의미가 있다.

> CBO의 핵심은 "얼마나 정확히 비용을 추정하느냐"다. 그리고 비용 추정의 정확도는 전적으로 **통계의 신선도**에 달려 있다.

## 2. 작동 원리 파이프라인

옵티마이저가 SQL을 받아 계획을 확정하기까지의 흐름이다.

```text
SQL 텍스트
  │
  ▼
① 파싱(Parse)      구문 분석 → 파스 트리
  │
  ▼
② 재작성(Rewrite)  뷰 전개, 서브쿼리 평탄화 등
  │
  ▼
③ 후보 계획 생성   접근 방법·조인 방식·조인 순서의 조합 열거
  │
  ▼
④ 카디널리티 추정  통계로 각 노드가 뱉을 예상 행 수 계산  ← 여기가 핵심
  │
  ▼
⑤ 비용 계산        CPU 비용 + I/O 비용 = 계획별 총비용
  │
  ▼
⑥ 최소 비용 선택   가장 싼 계획 채택 → 실행
```

핵심은 ④와 ⑤다. 각 노드가 처리할 행 수(**카디널리티**)를 통계로 추정하고, 그 행 수에 페이지 읽기 비용·튜플 처리 비용을 곱해 총비용을 낸다. PostgreSQL의 비용 모델은 대략 이렇게 구성된다.

| 파라미터 | 의미 | 기본값 |
| --- | --- | --- |
| `seq_page_cost` | 순차 페이지 1개 읽기 비용 | 1.0 |
| `random_page_cost` | 랜덤 페이지 1개 읽기 비용 | 4.0 |
| `cpu_tuple_cost` | 튜플 1개 처리 비용 | 0.01 |
| `cpu_index_tuple_cost` | 인덱스 튜플 1개 처리 비용 | 0.005 |

`random_page_cost`가 `seq_page_cost`의 4배라는 점이 인덱스 스캔 선택에 크게 작용한다. 인덱스 스캔은 랜덤 I/O를 유발하므로, 읽어야 할 행이 테이블의 상당 비율을 넘으면 옵티마이저는 차라리 순차 스캔이 싸다고 판단한다. SSD 환경이라 랜덤 I/O가 저렴하다면 `random_page_cost`를 1.1 정도로 낮추는 것이 흔한 튜닝이다.

## 3. 통계(statistics)의 역할

옵티마이저가 카디널리티를 추정하는 근거가 통계다. PostgreSQL은 `pg_statistic`(사람이 읽는 뷰는 `pg_stats`)에 컬럼별로 다음을 저장한다.

- **행 수(reltuples)**: 테이블 전체 행 수 추정치 (`pg_class`)
- **null 비율(null_frac)**: 해당 컬럼의 NULL 비율
- **distinct 값 수(n_distinct)**: 서로 다른 값의 개수 → 등가 조건의 선택도 계산에 사용
- **최빈값 목록(MCV)**: 자주 나오는 값과 그 빈도 → 편향된 분포 보정
- **히스토그램(histogram_bounds)**: 값의 분포 경계 → 범위 조건(`>`, `<`, `BETWEEN`) 선택도 계산

예를 들어 `WHERE status = 'active'`의 예상 행 수는 대략 `전체 행 수 × 선택도`로 구한다. 선택도는 `status='active'`가 MCV에 있으면 그 빈도를, 없으면 `1/n_distinct`를 쓴다. 범위 조건이면 히스토그램에서 해당 구간이 차지하는 비율을 읽는다.

### 통계는 어떻게 갱신되나

통계는 실시간이 아니라 **샘플링으로 주기적 수집**된다.

- `ANALYZE` — 테이블을 샘플링해 통계를 갱신. `VACUUM ANALYZE`로 함께 돌리는 경우가 많다.
- **autovacuum의 auto-analyze** — 테이블 변경 행 수가 임계치를 넘으면 백그라운드로 자동 실행. 임계치는 대략 `autovacuum_analyze_threshold + autovacuum_analyze_scale_factor × 행수`(scale_factor 기본 0.1, 즉 10% 변경 시).

```sql
-- 특정 테이블 통계 즉시 갱신
ANALYZE orders;

-- 통계가 언제 수집됐는지 확인
SELECT relname, last_analyze, last_autoanalyze
FROM pg_stat_user_tables
WHERE relname = 'orders';
```

> 통계가 낡으면 옵티마이저는 과거의 테이블을 보고 계획을 세운다. 대량 적재·삭제 직후, 또는 방금 만든 테이블에서 계획이 이상하다면 가장 먼저 `ANALYZE`를 의심한다.

## 4. 카디널리티 오추정이 대형 사고인 이유

오추정 자체보다, 오추정이 **조인 알고리즘 선택을 뒤집을 때**가 진짜 사고다.

옵티마이저가 "이 조건에 맞는 행은 5개뿐"이라고 추정하면 `Nested Loop`을 고른다. 바깥 테이블 5행 각각에 대해 안쪽 인덱스를 5번만 조회하면 되니 가장 싸다. 그런데 통계가 낡아 실제로는 조건에 맞는 행이 **500만 개**였다면? `Nested Loop`은 안쪽 인덱스 조회를 500만 번 반복한다. 원래 `Hash Join`이었으면 한 번의 스캔으로 끝날 일을, 인덱스 랜덤 접근 500만 번으로 처리하며 쿼리가 수십 분씩 걸린다.

카디널리티 추정 오차는 조인을 거치며 **곱으로 증폭**된다. 3단 조인에서 각 단계가 10배씩 빗나가면 최종 추정은 1000배 어긋난다. 그래서 옵티마이저 튜닝의 8할은 "카디널리티 추정을 실제에 맞추는 일"이다.

## 5. EXPLAIN 읽는 법

### EXPLAIN vs EXPLAIN ANALYZE

| | `EXPLAIN` | `EXPLAIN ANALYZE` |
| --- | --- | --- |
| 쿼리 실행 | 안 함(계획만 수립) | **실제로 실행함** |
| 보여주는 값 | 옵티마이저의 **추정**(cost, rows, width) | 추정 + **실제**(actual time, rows, loops) |
| 용도 | 계획 확인, 빠른 점검 | 추정 vs 실제 괴리 진단 |
| 주의 | 부작용 없음 | `INSERT`/`UPDATE`/`DELETE`도 실제 실행됨 → 트랜잭션으로 감싸 롤백 |

`EXPLAIN`만으로는 추정이 맞았는지 알 수 없다. 튜닝의 핵심 정보인 "추정과 실제의 차이"는 오직 `EXPLAIN ANALYZE`에서 나온다.

```sql
-- 쓰기 쿼리를 EXPLAIN ANALYZE로 안전하게 재보기
BEGIN;
EXPLAIN ANALYZE DELETE FROM orders WHERE created_at < '2020-01-01';
ROLLBACK;
```

### 노드 트리와 읽는 방향

`EXPLAIN` 출력은 트리다. 들여쓰기된 `->` 자식이 먼저 실행되고 그 결과가 부모로 올라간다. 즉 **가장 안쪽(가장 깊이 들여쓰기된) 노드부터, 안에서 바깥으로** 읽는다.

```text
Hash Join                    ← ③ 마지막: 두 결과를 조인
  ->  Seq Scan on orders     ← ① 먼저 실행
  ->  Hash                   ← ② 그다음: customers를 해시로 적재
        ->  Seq Scan on customers
```

### cost / rows / width 읽기

```text
Seq Scan on orders  (cost=0.00..470.00 rows=10000 width=244)
```

- `cost=0.00..470.00` — **시작 비용..총비용**. 시작 비용은 첫 행이 나오기까지의 비용(정렬 등이 없으면 0), 총비용은 마지막 행까지의 비용.
- `rows=10000` — 이 노드가 뱉을 것으로 **추정한** 행 수.
- `width=244` — 행당 평균 바이트 수(메모리·정렬 비용 산정용).

### actual time / rows / loops 읽기 (ANALYZE)

```text
Index Scan using orders_customer_id_idx on orders
  (cost=0.29..8.31 rows=1 width=244) (actual time=0.015..0.018 rows=1 loops=1)
```

- `actual time=0.015..0.018` — 첫 행..마지막 행까지 걸린 **실제 밀리초**.
- `rows=1` — **실제로** 나온 행 수.
- `loops=1` — 이 노드가 **실행된 횟수**.

> **함정**: `loops`가 1이 아니면, 표시된 `actual time`과 `rows`는 **1회 실행 기준의 평균값**이다. 노드의 총 소요·총 행은 `actual time × loops`, `rows × loops`로 계산해야 한다. Nested Loop 안쪽 노드가 `loops=5000000`이면 개별 시간이 작아 보여도 그게 병목이다.

### 스캔 노드 3종

```text
-- Seq Scan: 테이블 전체를 순차로 읽고 필터. 조건에 맞는 비율이 높을 때 유리
Seq Scan on orders  (cost=0.00..470.00 rows=7000 width=244)
  Filter: (amount > 100)
  Rows Removed by Filter: 3000

-- Index Scan: 인덱스로 소수의 행을 랜덤 접근. 선택도가 높을(뽑는 행이 적을) 때 유리
Index Scan using orders_pkey on orders  (cost=0.29..8.30 rows=1 width=244)
  Index Cond: (id = 42)

-- Bitmap Scan: 인덱스로 매칭 행 위치를 비트맵에 모은 뒤 힙을 한 번에 정렬 접근.
--   Index Scan(너무 많은 랜덤 I/O)과 Seq Scan(너무 많은 낭비) 사이의 중간 규모에 유리
Bitmap Heap Scan on orders  (cost=5.06..224.98 rows=100 width=244)
  Recheck Cond: (customer_id < 100)
  ->  Bitmap Index Scan on orders_customer_id_idx  (cost=0.00..5.04 rows=100 width=0)
        Index Cond: (customer_id < 100)
```

`Rows Removed by Filter`가 크면 인덱스로 걸러낼 여지가 있다는 신호다. 읽은 것 대부분을 필터로 버리고 있다는 뜻이기 때문이다.

### 조인 노드

```text
Nested Loop  (cost=0.29..118.50 rows=10 width=488)
  ->  Bitmap Heap Scan on customers c  (cost=4.36..39.38 rows=10 width=244)
  ->  Index Scan using orders_customer_id_idx on orders o
        (cost=0.29..7.90 rows=1 width=244)
        Index Cond: (customer_id = c.id)
```

`Nested Loop`은 바깥 노드의 각 행마다 안쪽 노드를 반복 실행한다(안쪽 `loops`가 바깥 `rows`와 같아진다). `Hash Join`은 안쪽 입력으로 `Hash`를 만들고 바깥을 순회하며 매칭한다. `Merge Join`은 양쪽을 정렬해 병합한다. 어떤 조인이 왜 선택되는지는 [조인 방식 총정리](/posts/db/2026-01-04-rdb-join-strategy/)에서 다뤘다.

## 6. 추정과 실제의 괴리로 통계 문제 잡기

`EXPLAIN ANALYZE`를 볼 때 가장 먼저 확인할 것은 **각 노드의 추정 `rows` vs 실제 `rows`**다.

```text
Nested Loop  (cost=0.29..25.10 rows=2 width=488)
             (actual time=0.05..48200.13 rows=5000000 loops=1)
  ->  Seq Scan on orders o  (cost=0.00..18.00 rows=2 width=244)
                            (actual time=0.02..1200.44 rows=5000000 loops=1)
        Filter: (status = 'active')
  ->  Index Scan using customers_pkey on customers c
        (cost=0.29..3.54 rows=1 width=244)
        (actual time=0.008..0.008 rows=1 loops=5000000)
```

여기서 `Seq Scan`은 `rows=2`로 추정했지만 실제는 `rows=5000000`이다. **250만 배** 빗나갔다. 이 오추정 때문에 옵티마이저는 "고작 2행"이라며 `Nested Loop`을 골랐고, 안쪽 인덱스 조회가 `loops=5000000`으로 폭발해 48초가 걸렸다.

이런 괴리를 발견하면 진단 순서는 이렇다.

1. **통계 신선도 확인** — `pg_stat_user_tables`의 `last_analyze`가 오래됐거나, 대량 적재 직후인가?
2. **`ANALYZE` 재실행** — 대부분의 오추정은 통계 갱신으로 해결된다.
3. 그래도 빗나가면 → **분포가 편향**됐거나(히스토그램 해상도 부족), **컬럼 간 상관관계**를 옵티마이저가 못 보는 경우다.

> 추정과 실제가 자릿수 단위로 벌어지는 노드가 병목의 근원이다. 실행 시간이 큰 노드가 아니라, **오추정이 큰 노드**를 먼저 봐라.

## 7. 옵티마이저가 틀렸을 때 대응

순서대로, 가벼운 것부터 쓴다.

**1) ANALYZE 재실행** — 가장 먼저, 가장 자주 통하는 처방.

```sql
ANALYZE orders;
```

**2) 통계 타깃(해상도) 조정** — 특정 컬럼의 분포가 편향돼 히스토그램·MCV가 부족하면, 그 컬럼만 샘플 해상도를 높인다. 기본값 100, 최대 10000.

```sql
ALTER TABLE orders ALTER COLUMN status SET STATISTICS 1000;
ANALYZE orders;
```

**3) 확장 통계(extended statistics)** — 옵티마이저는 컬럼들이 서로 독립이라 가정한다. `city`와 `zipcode`처럼 강하게 연관된 컬럼을 `AND`로 걸면 선택도를 곱해버려 심하게 과소추정한다. 이럴 때 컬럼 간 상관관계를 알려준다.

```sql
CREATE STATISTICS orders_city_zip (dependencies)
  ON city, zipcode FROM orders;
ANALYZE orders;
```

**4) (최후) 힌트** — 위로 안 되면 계획을 강제한다. 다만 힌트는 데이터가 변하면 오히려 독이 되고 유지보수 부담이 크므로 마지막 카드다.

엔진별로 힌트 방식이 다르다.

| 엔진 | 힌트 방식 |
| --- | --- |
| Oracle | SQL 주석형 옵티마이저 힌트 네이티브 지원 (`/*+ USE_NL(...) */`) |
| MySQL | 옵티마이저 힌트 + 인덱스 힌트(`FORCE INDEX`) 지원 |
| PostgreSQL | **네이티브 힌트 없음.** `pg_hint_plan` 확장으로 대체하거나, `enable_nestloop=off` 같은 세션 파라미터로 특정 방식을 억제 |

PostgreSQL이 힌트를 안 넣는 것은 설계 철학이다. "힌트로 계획을 박제하기보다 통계와 비용 모델을 고쳐 옵티마이저가 스스로 옳게 고르게 하라"는 입장이다. 그래서 PostgreSQL에서는 3번까지가 사실상의 정공법이다.

## 관련 글

| 글 | 무엇을 담았나 |
| --- | --- |
| [RDB에서 조인(Join) 방식 총정리](/posts/db/2026-01-04-rdb-join-strategy/) | 옵티마이저가 고르는 조인 알고리즘 각각의 원리 |
| [RDB 인덱스 완전 정리](/posts/db/2026-07-03-rdb-index/) | 옵티마이저가 인덱스를 언제 타고 안 타는지 |
| [실행계획(EXPLAIN) 노드·필드 사전](/posts/db/2026-07-03-postgresql-explain-node-reference/) | EXPLAIN에 뜨는 모든 노드·계측 라인을 사전처럼 찾아보는 레퍼런스 |
