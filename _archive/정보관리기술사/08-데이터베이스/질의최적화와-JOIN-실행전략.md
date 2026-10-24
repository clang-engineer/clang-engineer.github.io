# 질의 최적화와 JOIN 실행 전략

## 이 문서의 개념지도

```text
Logical JOIN (무엇을 결합할까?)
        ↓ 물리 실행 대안
├─ Nested Loop → Outer Row마다 Inner 반복 탐색
├─ Hash Join   → Build(Hash Table) + Probe
└─ Merge Join  → 정렬된 입력을 Key 순서로 결합
        ↓
Cardinality · Index · 정렬 상태 · Memory
        ↓ 후보별 Cost 비교
Execution Plan 선택 → Estimated / Actual 검증

분산 환경: Broadcast / Shuffle (데이터 이동)
           Semi-Join / Bloom Filter (데이터 축소)
```

| 전략 | 유리한 조건 | 핵심 비용·주의점 |
|---|---|---|
| Nested Loop | 작은 Outer + 빠른 Inner Index | 반복 Lookup, Outer 추정 오류 |
| Hash Join | Equality Join + Build에 충분한 Memory | Build / Probe, Spill 시 I/O |
| Merge Join | Join Key로 정렬된 입력 | Sort 비용, 중복 Key 그룹 처리 |

**복습 단서:** 세 전략은 발전 순서가 아닌 동일한 논리 JOIN의 대안이다. 알고리즘을 고를 때는 입력 Row 수와 접근·정렬·메모리 비용을 함께 비교한다. 자세한 동작 예제와 예외는 본문에서 확인한다.

## 1. 논리 JOIN과 물리 JOIN

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

## 2. JOIN 알고리즘의 동작

### Nested Loop — 반복 Lookup 비용을 본다

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
≈ Outer 입력 비용 + Outer Row 수 × Inner 접근 비용
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

### Hash Join — Build + Probe

Equality Join에서는 한쪽 입력으로 Hash Table을 만들고 다른 입력을 Probe할 수 있다. 아래 화살표는 **구성·조회·결과 생성**을 나타낸다. 두 입력은 독립적이며, Hash Table에서 Probe Input이 만들어지는 것이 아니다.

```text
Build Input                 Probe Input
     │                           │
     │ 구성                      │ Join Key로 조회
     ▼                           │
[Hash Table] ◀────────────────────┘
     │
     │ Key 일치 확인 · Row 결합
     ▼
 Matching Rows
```

작은 Inner Join 예제로 실제 데이터의 변화를 보면 다음과 같다.

```text
Build: customers(id, name)
  (1, A), (2, B)
       ↓ Hash Table 구성
  Key 1 → (1, A)
  Key 2 → (2, B)

Probe: orders(order_id, customer_id)
  (o1, 2) → Key 2 조회 → (o1, B) 출력
  (o2, 2) → Key 2 조회 → (o2, B) 출력
  (o3, 3) → 일치하는 Key 없음 → 출력 없음
```

이 예제에서는 고객 ID가 유일하다고 가정한다. Hash 값이 같다는 것만으로 결합하지 않고 실제 Join Key도 비교한다. 핵심은 **한쪽이 조회할 구조를 만들고, 다른 쪽의 각 Row가 그 구조를 조회한다**는 역할 분담이다.

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

Hash Table 전체가 Memory에 들어가지 않아도 Hash Join은 Partition 등을 활용해 실행할 수 있다. 다만 Spill이 발생하면 임시 저장장치 I/O가 추가될 수 있다. 따라서 Hash Join이 선택됐다는 사실만으로 빠르다고 판단하지 않고 실제 Spill 여부를 확인한다.

### Merge Join — 정렬된 입력을 이용한다

두 입력이 Join Key 순서로 정렬되어 있다면 Cursor를 함께 전진하며 매칭할 수 있다.

```text
A: 1 2 4 7 9
B: 1 3 4 4 8

현재 A / B    비교 후 움직임
    1 / 1    일치 → 해당 Key 그룹 결합 후 다음 Key로 이동
    2 / 3    A가 작음 → A만 전진
    4 / 3    B가 작음 → B만 전진
    4 / 4    일치 → A의 4와 B의 두 4를 모두 결합
    7 / 8    A가 작음 → A만 전진
    9 / 8    B가 작음 → B 전진, B 끝

결과: (1, 1), (4, 첫 번째 4), (4, 두 번째 4)
```

작은 값을 가진 쪽을 전진시키면 이미 지나간 값으로 되돌아갈 필요가 줄어든다. 다만 **중복 Key는 하나만 결합하고 넘기지 않는다.** 예를 들어 A에 4가 2건, B에 4가 3건이면 같은 Key 그룹에서 2×3=6개의 조합을 출력해야 한다. 구현은 그룹 시작 위치를 기억하거나 버퍼링해 모든 조합을 만든 다음 다음 Key로 이동할 수 있다.

정렬이 이미 되어 있다면 입력을 병합 탐색하는 비용은 선형적으로 볼 수 있지만, 결과 Row를 생성하는 비용은 별도다. 정렬이 없다면 Sort 비용이 선행된다.

```text
Sort A + Sort B
       ↓
Merge
```

### 유리한 경우

- Index Scan 등으로 이미 Join Key 순서가 보장된다.
- 큰 입력을 순차적으로 처리하는 것이 유리하다.
- 일부 Range 성격의 조건에서 정렬 관계를 활용할 수 있다.

## 3. 세 전략의 비교

| 전략 | 핵심 아이디어 | 유리한 조건 | 주 비용 |
|---|---|---|---|
| Nested Loop | Outer Row마다 Inner에서 매칭 탐색 | Outer가 작고 Inner Lookup이 빠름 | 반복 Lookup |
| Hash Join | 한쪽으로 Hash Table 생성 후 Probe | Equality Join, 충분한 Memory | Build·Memory·Spill |
| Merge Join | 정렬된 두 입력을 함께 순회 | 정렬 상태 활용 가능 | Sort + Merge |

세 전략은 상하 관계가 아니라 **같은 Logical JOIN을 실행하는 대안**이다.

## 4. Optimizer의 전략 선택

### 같은 SQL도 전략이 달라진다

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

### Optimizer가 보는 주요 정보

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

## 5. 실행계획에서 JOIN 분석

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

## 6. 분산 JOIN의 추가 비용

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

### 데이터 축소 최적화: Semi-Join / Bloom Filter

실제 Join 전에 불필요한 Row를 줄여 Data Movement를 줄일 수 있다. 이들은 Broadcast·Shuffle처럼 **데이터를 어디로 이동시킬지 결정하는 방식이 아니라, 이동하거나 처리할 데이터량을 줄이는 기법**이다.

중요한 점은 다음이다.

```text
Nested Loop / Hash / Merge
→ Local Join Algorithm 축

Broadcast / Shuffle
→ Distributed Data Movement 축
```

서로 다른 분류축이며 실제 분산 DB에서는 조합될 수 있다.

## 7. 질문으로 이해 복원하기

본문을 가리고 **알고리즘의 동작 → 비용 조건 → 선택 → 진단**을 설명한다.

1. 논리 JOIN 하나를 Nested Loop, Hash, Merge라는 서로 다른 물리 알고리즘으로 실행할 수 있는 이유는 무엇인가?
2. Nested Loop의 Outer Row 수가 증가하면 어떤 비용이 반복되는가? Inner Index가 있으면 무엇이 달라지는가?
3. Hash Join에서 Build와 Probe의 역할은 무엇이며, Build Side가 메모리를 넘으면 어떤 추가 비용이 생기는가?
4. Merge Join에서 A의 Key 4가 2건, B의 Key 4가 3건이면 왜 6개의 결과 조합이 필요한가?
5. 같은 SQL이라도 Cardinality, Index, 정렬 상태, Memory에 따라 JOIN 전략이 달라지는 이유는 무엇인가?
6. 실행계획에서 Nested Loop의 Loops, Hash의 Spill, Merge의 Sort를 각각 확인하는 이유는 무엇인가?
7. Broadcast·Shuffle과 Semi-Join·Bloom Filter는 분산 JOIN에서 서로 어떤 역할 차이가 있는가?

> **JOIN 최적화는 알고리즘의 이름을 외우는 일이 아니라, 입력 특성에 따라 어떤 비용이 발생하고 Optimizer가 왜 해당 실행전략을 선택했는지 이해하는 일이다.**

## 참고 자료

- [PostgreSQL — Using EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html): Nested Loop·Hash·Merge Join의 실행계획과 두 입력의 역할을 확인한다.
