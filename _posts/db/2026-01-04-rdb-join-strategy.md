---
title       : "RDB JOIN 실행 전략 — Nested Loop·Hash·Merge를 언제 고르는가"
description : "SQL JOIN이라는 논리 연산을 DB가 어떤 물리 알고리즘으로 실행하는지, Nested Loop·Hash·Merge Join의 입력 조건과 비용 특성, 그리고 Optimizer가 통계·인덱스·정렬·메모리를 보고 전략을 선택하는 흐름을 정리한다."
date        : 2026-01-04 19:42:22 +0900
updated     : 2026-09-05 21:30:00 +0900
categories  : [db, "RDB·트랜잭션"]
tags        : [join]
pin         : false
hidden      : false
---

SQL에서 `JOIN`은 "두 Relation의 조건이 맞는 Row를 결합한다"는 **논리 연산**이다. 하지만 DB Engine은 이 논리 연산을 그대로 실행하지 않는다. 실제로는 두 입력에서 일치하는 Row를 **어떤 방식으로 찾을지** 결정해야 한다.

```text
SQL JOIN
  ↓
"두 입력에서 일치하는 Row를 어떻게 찾을까?"
  ↓
Physical Join Algorithm
├─ Nested Loop
├─ Hash Join
└─ Merge Join
  ↓
Cost-Based Optimizer가 입력 특성에 따라 선택
```

따라서 JOIN 성능을 볼 때 핵심은 "어떤 JOIN 문법을 썼는가"가 아니라 **Optimizer가 어떤 물리 전략을 골랐고, 그 선택이 현재 입력 특성에 맞는가**다.

## 먼저 세 알고리즘의 차이를 한 축에 놓는다

| 전략 | 핵심 아이디어 | 유리한 조건 | 주요 비용 |
|---|---|---|---|
| Nested Loop | 한쪽 Row마다 다른 쪽에서 매칭 Row 탐색 | 바깥쪽 입력이 작고 안쪽 탐색이 빠름 | 반복 탐색 비용 |
| Hash Join | 한쪽으로 Hash Table을 만들고 다른 쪽을 Probe | Equality Join, 충분한 Memory | Hash Build·Memory·Spill |
| Merge Join | 두 입력을 Join Key 순서로 맞춰 동시에 순회 | 입력이 정렬되어 있거나 정렬 비용이 감당됨 | Sort 비용 |

세 전략은 서로의 "상위/하위"가 아니다. **같은 논리 JOIN을 실행하는 대안**이다.

## 1. Nested Loop — 바깥쪽마다 안쪽을 찾는다

가장 직관적인 방식이다.

```text
Outer Row 1
  → Inner에서 매칭 찾기
Outer Row 2
  → Inner에서 매칭 찾기
Outer Row 3
  → Inner에서 매칭 찾기
...
```

단순 형태는 다음과 같다.

```text
for outer_row in outer:
    for inner_row in inner:
        if join_condition:
            emit(outer_row, inner_row)
```

두 입력을 매번 전부 비교한다면 비용은 대략 `O(N × M)`이다. 하지만 실제 RDBMS에서 Nested Loop가 강력한 이유는 **Inner 쪽을 매번 Full Scan하지 않을 수 있기 때문**이다.

### Index Nested Loop

Outer에서 한 Row를 읽고, Join Key로 Inner Index를 탐색한다.

```text
작은 Outer
   ↓ 한 Row
Join Key
   ↓
Inner Index Lookup
   ↓
매칭 Row
```

그래서 다음 조건에서 특히 강하다.

- Outer 입력이 작다.
- WHERE 조건으로 Outer가 크게 줄어든다.
- Inner의 Join Key에 Selective한 Index가 있다.
- 결과를 일부만 빨리 가져오면 된다.

반대로 Outer가 커지고 Inner 탐색도 비싸면 같은 탐색을 반복하는 비용이 폭증한다.

> Nested Loop의 핵심은 "작은 Table에 쓰는 방식"이 아니라 **Outer Row 수 × Inner Lookup 비용**이다.

인덱스가 언제 유효한지는 [RDB 인덱스 완전 정리](/posts/db/2026-07-03-rdb-index/)에서 별도로 다룬다.

## 2. Hash Join — 한쪽을 Hash Table로 만든다

Equality Join에서는 반복 탐색 대신 한 입력을 Hash Table로 만들어 둘 수 있다.

```text
Build Input
   ↓
Hash Table 생성
   ↓
Probe Input 순회
   ↓
Join Key로 Hash Lookup
   ↓
매칭 Row 출력
```

개념적으로는 다음과 같다.

```text
hash_table = build(smaller_input)

for row in probe_input:
    match = hash_table[row.key]
    if match:
        emit(row, match)
```

평균적인 Hash Lookup이 상수 시간에 가깝다면 Build + Probe는 대략 `O(N + M)`으로 볼 수 있다.

### 언제 강한가

- Equality Join이다.
- 양쪽 입력이 어느 정도 크다.
- 유효한 Index Lookup으로 반복 탐색하는 것보다 한 번 Scan하는 편이 낫다.
- Build Side가 Memory에 들어갈 수 있다.

### Memory가 부족하면

Hash Table이 Memory를 넘으면 DB는 Partition을 나누고 Temporary Disk를 사용할 수 있다.

```text
Memory 충분
→ In-Memory Hash Join

Memory 부족
→ Partition
→ Disk Spill
→ 추가 I/O
```

그래서 Hash Join이 선택됐다는 사실만으로 빠르다고 판단하면 안 된다. `EXPLAIN ANALYZE`에서 실제 Row 수와 Spill 여부를 같이 본다.

## 3. Merge Join — 두 정렬된 입력을 함께 전진한다

두 입력이 Join Key 순서로 정렬되어 있다면 앞에서부터 동시에 읽으며 매칭할 수 있다.

```text
A: 1 2 4 7 9
B: 1 3 4 4 8
   ↑ ↑

두 Cursor를 Join Key 비교 결과에 따라 전진
```

핵심은 "정렬된 상태"다.

```text
입력 A 정렬
      +
입력 B 정렬
      ↓
Merge
```

정렬이 이미 보장되어 있다면 Merge 자체는 선형적으로 진행할 수 있다. 하지만 정렬이 없다면 먼저 Sort 비용이 든다.

```text
Sort 비용
O(N log N + M log M)
        +
Merge 비용
O(N + M)
```

따라서 다음 경우에 후보가 되기 쉽다.

- 입력이 Join Key 순서로 이미 정렬돼 있다.
- Index Scan이 필요한 순서를 제공할 수 있다.
- 큰 입력을 순차적으로 처리하는 편이 유리하다.
- Equality뿐 아니라 일부 Range 성격의 조건에서도 정렬 관계를 활용할 수 있다.

## 같은 데이터라도 전략이 달라지는 이유

예를 들어 다음 JOIN이 있다고 하자.

```sql
SELECT *
FROM orders o
JOIN customers c ON c.id = o.customer_id;
```

SQL은 같아도 입력 조건에 따라 실행 전략은 달라질 수 있다.

### Case A — 최근 주문 10건만

```text
orders 10 Row
+ customers.id Index
→ Nested Loop + Index Lookup이 자연스러움
```

### Case B — 전체 주문 수천만 건 집계

```text
orders 대량
+ customers 전체와 Equality Join
→ 반복 Index Lookup보다 Hash Join 후보가 강해짐
```

### Case C — 두 입력이 Join Key 순으로 이미 정렬

```text
추가 Sort 비용이 거의 없음
→ Merge Join 후보가 올라옴
```

즉 "큰 Table이면 Hash Join"처럼 외우기보다 **입력 크기·접근 방식·정렬 상태·메모리**를 같이 본다.

## Optimizer가 무엇을 보고 고르나

Cost-Based Optimizer(CBO)는 후보 실행계획의 예상 비용을 비교한다.

```text
SQL
 ↓
통계 기반 Row 수 추정
 ↓
Access Path 후보
 ↓
Join Order 후보
 ↓
Join Algorithm 후보
 ↓
예상 Cost 비교
 ↓
Execution Plan 선택
```

Join 전략에 직접 영향을 주는 대표 요소는 다음과 같다.

### Cardinality

각 입력에서 실제로 몇 Row가 나올지 추정한다. Outer가 10 Row인지 100만 Row인지에 따라 Nested Loop 비용이 완전히 달라진다.

### Index

Inner Join Key를 빠르게 Lookup할 수 있으면 Nested Loop의 비용이 크게 내려간다.

### 정렬 상태

이미 원하는 순서가 있다면 Merge Join의 Sort 비용이 사라질 수 있다.

### Memory

Hash Build가 Memory를 넘을 가능성이 높으면 Hash Join 비용이 올라간다.

### Filter Selectivity

WHERE 조건이 한쪽 입력을 크게 줄이면 전체 Table 크기와 관계없이 Nested Loop가 유리해질 수 있다.

Optimizer의 Cardinality 추정과 Cost 계산, `EXPLAIN`을 읽는 법은 [쿼리 옵티마이저 작동 원리와 실행계획 읽기](/posts/db/2026-07-03-query-optimizer-explain/)에서 이어서 다룬다.

## 실행계획에서 무엇을 확인하나

성능 문제가 생기면 알고리즘 이름만 보지 않는다.

```text
실제 Join Strategy
        ↓
Estimated Rows vs Actual Rows
        ↓
각 입력의 Access Path
        ↓
Loop 횟수
        ↓
Sort / Hash Spill
        ↓
Filter로 버려진 Row
```

예를 들어 Nested Loop가 느리다면 "Nested Loop라서"가 아니라:

```text
Outer Row를 100개 예상
        ↓
실제 100만 개
        ↓
Inner Index Lookup 100만 번
        ↓
폭발
```

처럼 **Cardinality 추정 오류가 원인**일 수 있다.

Hash Join도 마찬가지다.

```text
작은 Build Side 예상
        ↓
실제 훨씬 큼
        ↓
Memory 초과
        ↓
Disk Spill
```

따라서 Join Tuning은 알고리즘을 강제로 바꾸기 전에 **왜 Optimizer가 그 선택을 했는지**를 이해하는 작업이다.

## 분산 환경에서는 Network가 새 비용 축이 된다

단일 DB 안의 Join에서는 CPU·Memory·I/O가 주요 비용이지만, 분산 SQL·MPP 환경에서는 **Data Movement**가 추가된다.

```text
Node A Data
Node B Data
   ↓
같은 Join Key끼리 같은 Node로 이동해야 함
   ↓
Network Shuffle
```

그래서 다음 전략이 등장한다.

### Broadcast Join

작은 입력을 모든 Worker에 복제해 큰 입력의 이동을 피한다.

```text
Small Table
 ├→ Node 1
 ├→ Node 2
 └→ Node 3
```

### Repartition / Shuffle Join

두 입력을 Join Key 기준으로 재분배한다. 입력이 크면 Network 비용이 매우 커질 수 있다.

### Bloom Filter / Semi-Join Reduction

실제 Join 전에 매칭 가능성이 없는 Row를 걸러 Data Movement를 줄인다.

이 축은 Nested Loop/Hash/Merge와 별개다. **로컬 Join 알고리즘과 분산 Data Movement 전략은 서로 다른 분류축**이고 실제 시스템에서 조합된다.

## 실무 판단 흐름

```text
JOIN이 느리다
   ↓
EXPLAIN ANALYZE
   ↓
어떤 Join Strategy인가?
   ↓
Estimated vs Actual Row가 맞나?
   ↓
각 입력은 어떻게 읽나?
   ↓
Nested Loop라면 Loop × Lookup 비용
Hash라면 Build Size / Spill
Merge라면 Sort 비용
   ↓
Index·통계·Filter·Query 구조를 조정
```

Hint로 특정 알고리즘을 강제할 수 있는 DB도 있지만, 강제는 마지막 수단에 가깝다. Data Distribution이 변하면 과거에 유리했던 강제 Plan이 오히려 장애 원인이 될 수 있다.

## 정리

RDB의 JOIN은 하나의 기능이지만 실행 방법은 여러 개다.

```text
Logical JOIN
   ↓
Physical Strategy
├─ Nested Loop: 반복 Lookup
├─ Hash: Build + Probe
└─ Merge: 정렬된 입력 동시 순회
```

선택 기준을 한 문장으로 줄이면 다음과 같다.

- **Nested Loop**: Outer가 작고 Inner Lookup이 싸다.
- **Hash Join**: Equality Join에서 큰 입력을 한 번씩 훑는 편이 낫다.
- **Merge Join**: 정렬된 입력을 활용할 수 있다.

그리고 최종 선택은 Optimizer가 **Cardinality·Index·정렬·Memory·Filter**를 Cost로 계산해 결정한다. JOIN 성능을 이해하는 출발점은 알고리즘 이름을 외우는 것이 아니라, **현재 입력에서 왜 그 전략의 비용이 낮다고 판단됐는지 보는 것**이다.

## 관련 글

| 글 | 다루는 것 |
|---|---|
| [RDB 인덱스 완전 정리](/posts/db/2026-07-03-rdb-index/) | Index Nested Loop의 전제와 Access Path |
| [쿼리 옵티마이저 작동 원리와 실행계획 읽기](/posts/db/2026-07-03-query-optimizer-explain/) | Cardinality·Cost·EXPLAIN |
| [Vertica에서 OR 조건 JOIN은 성능을 죽인다](/posts/db/2026-04-15-vertica-or-join-kills-performance/) | Join 조건이 물리 실행에 미치는 실제 사례 |
| [RECORD_ID를 레벨 테이블에 사전 적재하여 조회 성능 개선](/posts/db/2026-06-09-preload-record-id-to-level-table/) | 조회 시 JOIN 자체를 제거한 설계 사례 |
