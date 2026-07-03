---
title       : "테이블 파티셔닝 — 대용량 테이블을 나누는 기준과 파티션 프루닝"
description : "Range·List·Hash 파티셔닝의 선택 기준, 파티션 프루닝이 스캔량을 줄이는 원리, PostgreSQL 선언적 파티셔닝 예시와 파티션 키 선정·오래된 파티션 DROP 실무."
date        : 2026-07-03 16:30:00 +0900
updated     : 2026-07-03 16:30:00 +0900
categories  : [db, "최적화·설계"]
tags        : [partitioning, performance, postgresql]
pin         : false
hidden      : false
---

한 테이블에 로그·주문·이벤트가 쌓여 수억 건이 되면, 인덱스 하나가 수십 GB로 부풀고 VACUUM 한 번에 수 시간이 걸린다. "3개월 지난 데이터 지워줘" 한마디가 밤새 도는 `DELETE`가 된다. 테이블 파티셔닝은 이 거대한 하나를 논리적으로 여러 조각으로 나눠, 쿼리가 필요한 조각만 건드리게 만드는 설계다. 핵심 이득은 **파티션 프루닝**, 즉 WHERE 조건에 걸리지 않는 조각을 아예 스캔에서 빼버리는 것이다.

## 1. 왜 파티셔닝인가

단일 대용량 테이블이 겪는 문제는 데이터 양 자체가 아니라 **양에 비례해 커지는 부수 비용**이다.

- **인덱스 비대**: 수억 행 위의 B-tree는 깊고 무거워진다. 인덱스가 메모리에 다 안 들어가면 조회마다 디스크를 때린다.
- **VACUUM 비용**: PostgreSQL은 dead tuple을 회수하려 테이블 전체를 훑는다. 테이블이 크면 autovacuum이 한 바퀴 도는 데 오래 걸리고, 그동안 팽창(bloat)이 누적된다.
- **오래된 데이터 삭제 비용**: `DELETE FROM logs WHERE created_at < '2026-01-01'`은 수천만 행에 dead tuple을 만들고, 그 자리를 다시 VACUUM이 청소해야 한다. 삭제가 삭제로 끝나지 않는다.

파티셔닝은 테이블을 파티션 키 기준으로 조각내서, 조회는 필요한 조각만, VACUUM은 조각별로, 오래된 데이터 삭제는 조각을 통째로 `DROP`하는 방식으로 이 비용들을 분산·상수화한다.

## 2. 파티셔닝 vs 샤딩

둘 다 "테이블을 나눈다"지만 나누는 층위가 다르다.

| 구분 | 파티셔닝 | 샤딩 |
| --- | --- | --- |
| 분할 위치 | 한 DB 인스턴스 **안** | 여러 노드로 **분산** |
| 목적 | 쿼리 스캔량·유지보수 비용 감소 | 단일 노드 용량·처리량 한계 돌파 |
| 애플리케이션 인지 | 투명 (하나의 테이블처럼 조회) | 라우팅 계층 필요할 때 많음 |
| 트랜잭션 | 일반 로컬 트랜잭션 | 분산 트랜잭션·합의 문제 발생 |

파티셔닝은 **한 인스턴스 안의 논리 분할**이라 조인·트랜잭션이 평소와 같다. 노드를 넘어 데이터를 흩뿌리는 샤딩은 별개의 난이도이고, [분산 DB 확장 글](/posts/db/2026-07-03-distributed-db-scaling/)에서 다룬다. 순서상 파티셔닝으로 감당되면 파티셔닝을 먼저 쓰고, 단일 노드 용량 자체가 한계일 때 샤딩을 검토한다.

## 3. 파티셔닝 종류 — Range / List / Hash

PostgreSQL 선언적 파티셔닝은 세 가지 방식을 제공한다. 무엇을 쓸지는 **데이터 분포**와 **쿼리 패턴**으로 결정한다.

| 방식 | 나누는 기준 | 대표 용도 |
| --- | --- | --- |
| Range | 값의 범위 | 날짜·시퀀스 (로그, 주문, 시계열) |
| List | 값의 명시적 목록 | 카테고리·리전 (국가, 상태 코드) |
| Hash | 해시 나머지로 균등 분산 | 자연스러운 범위·목록이 없고 균등 분산만 필요할 때 |

- **Range**: `created_at` 같은 시간축이나 연속 ID로 나눈다. 오래된 파티션을 통째로 떼어내는 데이터 수명 관리와 궁합이 가장 좋다. 실무에서 제일 많이 쓴다.
- **List**: `country_code`, `status`처럼 값이 유한하고 의미가 뚜렷할 때. 특정 리전만 별도 스토리지에 두는 식의 운영이 가능하다.
- **Hash**: 나눌 자연스러운 축이 없는데 쓰기 부하만 고르게 퍼뜨리고 싶을 때. 다만 범위 삭제(`DROP`으로 오래된 데이터 제거) 같은 이점은 얻기 어렵다.

## 4. 파티션 프루닝 — 이게 핵심 이득

파티셔닝이 성능을 주는 이유는 나눔 자체가 아니라 **안 볼 파티션을 안 보는 것**이다. 이를 파티션 프루닝(partition pruning)이라 한다.

`logdate`로 월별 Range 파티셔닝된 테이블에서 이렇게 조회한다.

```sql
SELECT count(*) FROM measurement WHERE logdate >= DATE '2008-01-01';
```

플래너는 각 파티션의 경계(bound)를 알고 있으므로, `2008-01-01` 이전 데이터만 담긴 파티션은 **실행 계획에서 통째로 제외**한다. 100개 파티션 중 3개만 남으면 스캔 대상이 처음부터 3%로 줄어든다. 인덱스로 걸러내는 게 아니라 **읽을 파티션 목록 자체가 짧아지는 것**이라 이득이 훨씬 크다.

PostgreSQL에는 두 시점의 프루닝이 있다.

- **Plan-time pruning**: WHERE 조건이 상수라 계획 수립 시점에 걸러낸다. `EXPLAIN`에 `Subplans Removed`로 나타난다.
- **Execution-time pruning**: 값이 실행 시점에야 정해지는 경우(파라미터 바인딩, 서브쿼리, 중첩 루프 조인)에 초기화·실행 중 걸러낸다. `EXPLAIN ANALYZE`의 `loops`/`(never executed)`로 확인한다.

프루닝은 기본 활성(`enable_partition_pruning = on`)이다. 계획을 확인하려면 `EXPLAIN`으로 남은 파티션 수를 본다.

```sql
SET enable_partition_pruning = on;  -- 기본값
EXPLAIN SELECT count(*) FROM measurement WHERE logdate >= DATE '2008-01-01';
```

> 파티션 프루닝은 파티션 키가 WHERE에 들어와야 작동한다. 키가 조건에 없으면 모든 파티션을 훑는(full partition scan) 최악의 상황이 되고, 이때는 파티션 안 나눈 것만 못하다.

참고로 `constraint_exclusion`은 상속 기반 파티셔닝 시절의 CHECK 제약 기반 제외 메커니즘으로, 계획 시점에만 동작하고 CHECK 평가 비용이 든다. 선언적 파티셔닝에서는 더 빠른 파티션 프루닝이 이를 대체하므로, 신규 설계에서 굳이 손댈 필요는 없다.

## 5. PostgreSQL 선언적 파티셔닝 예시

PostgreSQL 10부터 선언적 파티셔닝(declarative partitioning)이 도입됐고, 16/17 기준으로 문법과 프루닝이 안정적이다. 월별 Range 파티셔닝을 예로 든다.

### 부모 테이블과 파티션 생성

```sql
-- 1. 파티션 부모 테이블 (파티션 키 지정)
CREATE TABLE measurement (
    city_id   int  not null,
    logdate   date not null,
    peaktemp  int,
    unitsales int
) PARTITION BY RANGE (logdate);

-- 2. 월별 파티션 (상한은 배타적 — 인접 파티션이 경계값을 공유)
CREATE TABLE measurement_y2026m06 PARTITION OF measurement
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

CREATE TABLE measurement_y2026m07 PARTITION OF measurement
    FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
```

Range 상한값은 **배타적**이다. `2026-07-01`은 6월 파티션이 아니라 7월 파티션에 들어간다. 인접 파티션이 같은 경계값을 공유해도 겹치지 않는 이유다.

List·Hash는 `FOR VALUES` 절만 다르다.

```sql
-- List
CREATE TABLE sales_kr PARTITION OF sales
    FOR VALUES IN ('KR', 'JP');

-- Hash (MODULUS는 전체 파티션 수, REMAINDER는 이 파티션이 맡는 나머지)
CREATE TABLE events_p0 PARTITION OF events
    FOR VALUES WITH (MODULUS 4, REMAINDER 0);
```

### 인덱스

부모 테이블에 인덱스를 만들면 **모든 파티션에 자동 생성**되고, 이후 새로 붙는 파티션에도 따라온다.

```sql
CREATE INDEX ON measurement (logdate);
```

기존 대형 파티션에 락 없이 인덱스를 붙이려면, 파티션별로 `CONCURRENTLY` 생성 후 부모 인덱스에 `ATTACH`한다.

```sql
CREATE INDEX measurement_usls_idx ON ONLY measurement (unitsales);  -- 부모에만, 무효 상태

CREATE INDEX CONCURRENTLY measurement_usls_202606_idx
    ON measurement_y2026m06 (unitsales);

ALTER INDEX measurement_usls_idx
    ATTACH PARTITION measurement_usls_202606_idx;
```

모든 파티션 인덱스가 붙으면 부모 인덱스가 유효해진다.

### 파티션 붙이고 떼기

미리 채운 테이블을 `ATTACH PARTITION`으로 편입하거나, 오래된 파티션을 `DETACH`로 분리한다.

```sql
-- 다음 달 파티션 편입
ALTER TABLE measurement ATTACH PARTITION measurement_y2026m08
    FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');

-- 오래된 파티션 분리 (CONCURRENTLY는 약한 락으로 조회 차단 최소화)
ALTER TABLE measurement DETACH PARTITION measurement_y2026m06 CONCURRENTLY;
```

## 6. 실무 주의점

**파티션 키는 대부분의 쿼리 WHERE에 들어가는 컬럼으로.** 프루닝은 키가 조건에 있어야 작동한다. 조회의 90%가 `created_at` 범위로 들어온다면 `created_at`이 정답이다. 반대로 키가 안 걸리는 쿼리가 많으면 모든 파티션을 훑어 오히려 느려진다.

**오래된 파티션 DROP으로 대용량 삭제를 순식간에.** Range 파티셔닝의 최대 실무 가치다.

```sql
-- 수천만 행 DELETE 대신, 파티션을 통째로 제거 (메타데이터 조작에 가까움)
DROP TABLE measurement_y2026m01;
```

`DELETE`는 dead tuple을 만들고 VACUUM 부담을 남기지만, 파티션 `DROP`은 테이블 파일을 버리는 것이라 즉시 끝나고 bloat도 없다. 보관 정책이 "N개월 롤링"이면 파티셔닝만으로 데이터 수명 관리가 거의 공짜가 된다.

**인덱스·제약은 파티션 단위로 관리된다.** 유니크 제약은 파티션 키를 포함해야 부모 레벨에서 강제되고, 새 파티션은 미리(pre-create) 만들어 두거나 자동 생성 스케줄러(예: `pg_partman`)로 관리한다. 파티션이 없는 구간에 데이터가 들어오면 삽입이 실패한다.

## 7. 파티셔닝이 능사가 아닌 경우

파티셔닝은 공짜가 아니다. 다음이면 도입을 미룬다.

- **규모가 애매할 때**: 수백만 행 수준은 잘 만든 인덱스로 충분하다. 통상 단일 테이블·인덱스가 메모리에 안 들어갈 만큼(수천만~수억 행, 수십 GB) 커질 때 실익이 생긴다.
- **파티션 과다의 오버헤드**: 파티션이 수백~수천 개가 되면 계획 수립 시간이 늘고, 프루닝이 안 되는 쿼리는 모든 파티션을 열어 더 느려진다. 파티션 수는 쿼리 패턴이 감당할 범위로 유지한다.
- **키가 쿼리에 안 걸릴 때**: WHERE에 파티션 키가 거의 안 들어오는 워크로드면 프루닝 이득이 없어 순수 오버헤드만 남는다.

> 파티셔닝의 성능 이득은 "프루닝으로 스캔량을 줄이는 것"과 "파티션 DROP으로 삭제를 상수화하는 것"에서 나온다. 이 둘이 안 걸리는 상황이면, 나누는 대신 인덱스·VACUUM 튜닝을 먼저 본다.

## 관련 글

| 글 | 관계 |
| --- | --- |
| [RECORD_ID를 레벨 테이블에 사전 적재하여 조회 성능 개선](/posts/db/2026-06-09-preload-record-id-to-level-table/) | 조인 자체를 없애는 또 다른 대용량 설계 |
| [분산 DB 확장 — 샤딩·분산 트랜잭션·합의](/posts/db/2026-07-03-distributed-db-scaling/) | 한 인스턴스를 넘어 여러 노드로 나눌 때 |
