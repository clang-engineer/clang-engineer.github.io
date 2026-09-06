# 질의 최적화와 JOIN 실행 전략

## 이 문서에서 되짚을 질문

- SQL의 논리 JOIN과 DBMS의 물리 JOIN 알고리즘은 어떻게 다른가?
- Nested Loop·Hash·Merge Join은 무엇을 기준으로 선택되는가?
- Index, Cardinality, Sort, Memory는 Join 비용에 어떤 영향을 주는가?
- 실행계획에서 Estimated Row와 Actual Row 차이가 왜 중요한가?
- 분산 DB에서는 왜 Data Movement가 별도 비용 축이 되는가?

## 1. 논리 연산과 물리 실행을 분리한다

SQL에서 JOIN은 두 Relation의 조건이 맞는 Row를 결합하는 **논리 연산**이다. DBMS는 이 논리 연산을 실제로 실행하기 위해 여러 물리 알고리즘 중 하나를 선택한다.

```text
SQL JOIN
   ↓
Logical Operation
   ↓
Physical Join Strategy
├─ Nested Loop
├─ Hash Join
└─ Merge Join
   ↓
Cost-Based Optimizer가 후보 비용 비교
```

따라서 JOIN 성능을 볼 때는 SQL 문법 이름보다 **어떤 실행전략이 선택됐고, 현재 입력 특성에 맞는지**를 본다.

## 2. 세 전략은 같은 문제의 대안이다

| 전략 | 핵심 아이디어 | 유리한 조건 | 주 비용 |
|---|---|---|---|
| Nested Loop | Outer Row마다 Inner에서 매칭 탐색 | Outer가 작고 Inner Lookup이 빠름 | 반복 Lookup |
| Hash Join | 한쪽으로 Hash Table 생성 후 Probe | Equality Join, 충분한 Memory | Build·Memory·Spill |
| Merge Join | 정렬된 두 입력을 함께 순회 | 정렬 상태 활용 가능 | Sort + Merge |

세 전략은 상하 관계가 아니라 **같은 Logical JOIN을 실행하는 대안**이다.

## 3. Nested Loop — 반복 Lookup 비용을 본다

```text
Outer Row 1 → Inner Lookup
Outer Row 2 → Inner Lookup
Outer Row 3 → Inner Lookup
...
```

단순 구현은 `O(N × M)`에 가깝지만 실제 DBMS에서는 Inner에 Index가 있으면 매번 Full Scan하지 않는다.

```text
작은 Outer
   ↓ Join Key
Inner Index Lookup
   ↓
Matching Row
```

따라서 핵심 비용은 다음처럼 생각할 수 있다.

```text
Nested Loop Cost
≈ Outer Row 수 × Inner Lookup Cost
```

### 유리한 경우

- Filter 후 Outer가 작다.
- Inner Join Key에 선택도 높은 Index가 있다.
- 결과 일부를 빠르게 반환하면 된다.

### 불리한 경우

Optimizer가 Outer를 작게 예상했지만 실제로는 매우 큰 경우 반복 Lookup이 폭증할 수 있다.

```text
예상 Outer 100 Row
      ↓
실제 Outer 1,000,000 Row
      ↓
Inner Index Lookup 1,000,000회
```

이 경우 문제의 본질은 `Nested Loop라는 알고리즘 자체`보다 **Cardinality 추정 오류**일 수 있다.

## 4. Hash Join — Build + Probe

Equality Join에서는 한쪽 입력으로 Hash Table을 만들고 다른 입력을 Probe할 수 있다.

```text
Build Input
   ↓
Hash Table
   ↓
Probe Input
   ↓
Hash Lookup
   ↓
Matching Row
```

평균적인 Hash Lookup을 상수 시간에 가깝다고 보면 Build와 Probe를 한 번씩 수행하므로 큰 입력을 반복 Lookup하는 것보다 유리할 수 있다.

### 유리한 경우

- Equality Join이다.
- 두 입력이 크다.
- 반복 Index Lookup보다 Scan 한 번씩이 낫다.
- Build Side가 Memory에 들어간다.

### Memory가 부족하면

```text
Hash Build
   ↓ Memory 부족
Partition / Spill
   ↓
Temporary Disk I/O
```

따라서 Hash Join이 선택됐다는 사실만으로 빠르다고 판단하지 않고 실제 Spill 여부를 확인한다.

## 5. Merge Join — 정렬된 입력을 이용한다

두 입력이 Join Key 순서로 정렬되어 있다면 Cursor를 함께 전진하며 매칭할 수 있다.

```text
A: 1 2 4 7 9
B: 1 3 4 4 8

두 Cursor를 비교하며 전진
```

정렬이 이미 되어 있다면 Merge 자체는 선형적으로 진행할 수 있다. 정렬이 없다면 Sort 비용이 선행된다.

```text
Sort A + Sort B
       ↓
Merge
```

### 유리한 경우

- Index Scan 등으로 이미 Join Key 순서가 보장된다.
- 큰 입력을 순차적으로 처리하는 것이 유리하다.
- 일부 Range 성격의 조건에서 정렬 관계를 활용할 수 있다.

## 6. 같은 SQL도 전략이 달라진다

```sql
SELECT *
FROM orders o
JOIN customers c
  ON c.id = o.customer_id;
```

SQL은 같아도 실행 조건이 다르면 전략이 바뀔 수 있다.

```text
최근 주문 10건 + customers.id Index
→ Nested Loop 후보

대량 Orders 전체 + Equality Join
→ Hash Join 후보

두 입력이 Join Key 순서로 이미 정렬
→ Merge Join 후보
```

따라서 `큰 Table이면 Hash Join`처럼 단순 암기하지 않는다.

## 7. Optimizer가 보는 주요 정보

Cost-Based Optimizer는 여러 후보 실행계획의 예상 비용을 비교한다.

```text
SQL
 ↓
통계 기반 Cardinality 추정
 ↓
Access Path 후보
 ↓
Join Order 후보
 ↓
Join Algorithm 후보
 ↓
Cost 비교
 ↓
Execution Plan 선택
```

### Cardinality

각 연산 뒤에 몇 Row가 남는지 추정한다. 이 값이 틀리면 이후 모든 비용 계산이 흔들린다.

### Index

Inner Lookup이 빠르면 Nested Loop 비용이 크게 낮아진다.

### 정렬 상태

이미 필요한 순서가 있으면 Merge Join의 Sort 비용을 줄일 수 있다.

### Memory

Hash Build가 Memory를 넘으면 Spill 비용이 증가한다.

### Filter Selectivity

WHERE 조건이 입력을 크게 줄이면 원래 Table 크기보다 Filter 후 Row 수가 더 중요하다.

## 8. 실행계획에서 무엇을 본다

성능 문제에서는 알고리즘 이름 하나만 보지 않는다.

```text
Join Strategy
   ↓
Estimated Rows vs Actual Rows
   ↓
각 입력의 Access Path
   ↓
Loop 횟수
   ↓
Sort / Hash Spill
   ↓
Filter로 제거된 Row
```

### Nested Loop 진단

```text
Outer 실제 Row가 예상보다 큰가?
Inner Lookup은 Index인가 Full Scan인가?
Loop 횟수가 얼마나 되는가?
```

### Hash Join 진단

```text
Build Side가 예상보다 큰가?
Memory를 넘어서 Spill했는가?
```

### Merge Join 진단

```text
Sort가 추가됐는가?
이미 정렬된 Access Path를 활용할 수 있었는가?
```

JOIN Tuning은 무조건 Hint로 알고리즘을 바꾸는 작업이 아니라 **Optimizer가 왜 그 비용을 낮다고 판단했는지 검증하는 작업**이다.

## 9. 분산 환경에서는 Data Movement가 추가된다

단일 Node Join은 CPU·Memory·I/O가 주요 비용이지만 분산 SQL·MPP에서는 Network가 새 비용 축이 된다.

```text
Node A Data      Node B Data
      \            /
       Join Key 기준 재배치
             ↓
        Network Shuffle
```

### Broadcast Join

작은 입력을 각 Worker에 복제해 큰 입력의 이동을 피한다.

### Repartition / Shuffle Join

두 입력을 Join Key 기준으로 재분배한다. 입력이 크면 Network 비용이 커질 수 있다.

### Semi-Join / Bloom Filter

실제 Join 전에 불필요한 Row를 줄여 Data Movement를 줄일 수 있다.

중요한 점은 다음이다.

```text
Nested Loop / Hash / Merge
→ Local Join Algorithm 축

Broadcast / Shuffle
→ Distributed Data Movement 축
```

서로 다른 분류축이며 실제 분산 DB에서는 조합될 수 있다.

## 10. 기억 흐름

```text
Logical JOIN
   ↓
Physical Strategy 선택
├─ Nested Loop : 반복 Lookup
├─ Hash        : Build + Probe
└─ Merge       : 정렬된 입력 동시 순회
   ↓
Optimizer가 Cost 비교
├─ Cardinality
├─ Index
├─ Sort
├─ Memory
└─ Filter Selectivity
   ↓
실행계획에서 예상과 실제 비교
```

> **JOIN 성능의 핵심은 알고리즘 이름을 외우는 것이 아니라 현재 입력에서 왜 그 전략이 싸다고 계산됐는지 확인하는 것이다.**
