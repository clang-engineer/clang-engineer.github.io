# B-Tree 계열과 Clustered / Non-clustered Index

## 이 문서의 개념지도

```text
Index를 이해하는 두 독립적인 축
├─ Tree 구조: B-Tree / B+Tree
│   └─ 탐색 Key와 Entry를 Node·Leaf에 어떻게 배치하는가?
└─ Row 저장 관계: Clustered / Non-clustered
    ├─ Clustered     → Leaf가 실제 Row의 주 저장구조
    └─ Non-clustered → Leaf의 Locator로 Row를 찾음
         ├─ Heap → RID
         └─ Clustered Table → Clustered Key (SQL Server 기준)

두 축의 조합 → 탐색 경로 · Lookup 비용 · Covering 여부
※ PK 여부, Tree 종류, Clustered 여부는 동일한 분류축이 아니다.
```

이 지도는 Tree 구조와 Row 저장 관계라는 서로 다른 축을 먼저 구분하기 위한 것이다. 구체적인 조회 경로와 예외는 아래에서 설명한다.

이 문서는 B-Tree·B+Tree와 Clustered·Non-clustered Index가 왜 비슷해 보이면서도 서로 다른 개념인지 이해하기 위한 문서다. **Tree의 균형·Split/Merge 자체**보다 **Index Entry와 실제 Row의 저장 관계, Row Locator, Covering 여부**를 중심으로 이해를 완결한다.

설명은 학습 흐름을 살리기 위해 SQL Server의 B+Tree 계열 구조를 중심으로 한다. DBMS마다 구현과 용어가 다르므로 마지막에 차이를 구분한다.

---

## 1. 가장 먼저 잡을 핵심

```text
B-Tree / B+Tree
→ 트리 자료구조의 구성 방식
→ Record Entry를 트리 어디에 두는가

Clustered / Non-clustered
→ 인덱스와 실제 Row 저장구조의 관계
→ 인덱스 구조 자체가 실제 Row의 주 저장구조인가
```

SQL Server의 B+Tree 계열을 기준으로 보면 다음 그림이 가장 직관적이다.

```text
[B+Tree + Clustered]

Internal : Search Key + Child Pointer
                    ↓
Leaf     : 실제 Row가 들어 있는 Data Page


[B+Tree + Non-clustered]

Internal : Search Key + Child Pointer
                    ↓
Leaf     : Search Key + Row Locator
                         ↓
                    실제 Row
```

> **B/B+는 Record Entry의 위치를 구분하고, Clustered/Non-clustered는 실제 Row 저장구조와 인덱스의 관계를 구분한다.**

---

## 2. 먼저 용어를 분리한다

### Search Key

인덱스를 탐색하는 기준값이다.

```text
CREATE INDEX ... ON student(name)
                         ↑
                       name
```

`name='철수'`를 검색한다면 `철수`가 탐색할 Key 값이다.

### Row

테이블의 실제 한 행이다.

```text
30 | 철수 | 25 | 서울
```

### Record Entry(레코드 엔트리)

Search Key에 대응해 인덱스에 저장되는 레코드 단위 정보다.

```text
[Search Key | ???]
```

`???`는 구조에 따라 실제 Row일 수도 있고 Row Locator일 수도 있다.

### Child Pointer

트리 내부에서 다음 하위 Node/Page로 내려가기 위한 Pointer다.

```text
Internal Node
[30 | 50]
 /    |    \
↓     ↓     ↓
Child Page
```

### Row Locator

인덱스와 원본 Row 저장구조가 분리되어 있을 때 실제 Row를 찾아가기 위한 정보다.

```text
[Search Key | Row Locator]
                ↓
             실제 Row
```

따라서 둘은 역할이 다르다.

```text
Child Pointer
→ 트리 안에서 다음 Node/Page를 찾음

Row Locator
→ 원본 Row를 찾음
```

### Data Page

실제 Row들이 저장되는 DB Page다.

```text
Data Page
┌──────────────────┐
│ 10 | 영희 | ...  │
│ 20 | 준호 | ...  │
└──────────────────┘
```

---

## 3. B-Tree와 B+Tree

여기서는 **Record Entry가 어디에 있는지**만 비교한다. 균형 유지, Split, Fan-out, DB Page의 자세한 원리는 [탐색트리와 DB 인덱스](탐색트리와-DB인덱스-BTree-BPlusTree-BStarTree-TTree.md)를 참고한다.

### B-Tree

개념적인 B-Tree에서는 내부 노드에도 Record Entry가 존재할 수 있다.

```text
          [30 | Record Entry]
           /              \
          ↓                ↓
[10 | Record Entry]  [50 | Record Entry]
```

따라서 30을 찾았다면 내부 노드에서 검색 결과를 얻을 수 있다.

### B+Tree

B+Tree에서는 Internal Node는 탐색용 Key와 Child Pointer 중심이고, Record Entry는 Leaf에 집중된다.

```text
              [30 | 50]
              /   |   \
             ↓    ↓    ↓

[10|Entry][20|Entry] → [30|Entry][40|Entry] → [50|Entry]
       Leaf                  Leaf               Leaf
```

Leaf끼리 Key 순서로 연결되므로 범위 탐색에도 유리하다.

```text
20을 찾음
 ↓
20 → 30 → 40 → 50
```

중요한 점은 다음이다.

> **B+Tree라고 해서 Leaf에 반드시 실제 Row가 저장되는 것은 아니다.**

B+Tree가 Clustered인지 Non-clustered인지에 따라 Leaf Record Entry의 내용이 달라질 수 있다.

---

## 4. Clustered Index

SQL Server의 Clustered B+Tree에서는 Leaf Level 자체가 실제 Data Page다.

```text
              [30 | 50]          ← Internal
              /   |   \
             ↓    ↓    ↓

[10 Row][20 Row] → [30 Row][40 Row] → [50 Row][60 Row]
      Leaf               Leaf              Leaf
```

따라서 `ID=30`을 찾으면:

```text
Clustered B+Tree 탐색
 ↓
Leaf Page 도착
 ↓
30 | 철수 | 25 | 서울
 ↓
이미 실제 Row
```

별도의 `RID → Row` 접근이 필요하지 않다.

> **Clustered = Key를 기준으로 조직된 인덱스 구조가 실제 Row의 주 저장구조다.**

---

## 5. "실제 데이터가 순서대로 저장된다"의 의미

Clustered Index를 설명할 때 실제 데이터가 Key 순서로 저장된다고 표현한다.

이 말은 디스크에서 물리적으로 반드시 다음처럼 연속 배치된다는 의미가 아니다.

```text
[10][20][30][40][50]  ← 물리적으로 반드시 연속 X
```

실제 Page 위치는 흩어질 수 있다.

```text
물리적 위치

Page 300        Page 17        Page 850
30,40           10,20          50,60
```

하지만 인덱스 구조에서는 실제 Row를 담은 Data Page가 Clustered Key 순서로 논리적으로 조직된다.

```text
              [30 | 50]
              /   |   \
             ↓    ↓    ↓

Page 17   →  Page 300  →  Page 850
10,20         30,40        50,60
```

즉:

> **Clustered의 순서란 물리 Disk 연속성이 아니라, 실제 Row를 담은 Page가 Key 기준의 인덱스 구조로 논리적으로 조직된다는 의미다.**

---

## 6. Non-clustered Index와 Row Locator

Non-clustered Index는 실제 Row 저장구조와 분리된 별도의 검색 구조다.

따라서 Search Key를 찾은 뒤 원본 Row를 찾아갈 정보가 필요하다.

```text
Non-clustered Record Entry

[Search Key | Row Locator]
                ↓
             실제 Row
```

Row Locator는 반드시 물리 주소일 필요는 없다.

```text
Row Locator
├─ 실제 Row 위치
└─ 실제 Row를 다시 찾기 위한 다른 Key
```

그래서 단순히 `Pointer`라고 부르기보다 `Row Locator`라고 구분하는 편이 정확하다.

---

## 7. Heap

SQL Server 기준으로 Clustered Index가 없는 테이블 저장구조를 Heap이라고 한다.

```text
Table
├─ Clustered Index 없음 → Heap
└─ Clustered Index 있음 → Clustered Table
```

Heap이라고 해서 인덱스가 없는 것은 아니다.

```text
Heap Table
├─ name Non-clustered Index
├─ email Non-clustered Index
└─ created_at Non-clustered Index
```

```text
Heap = Index가 없음             X
Heap = Clustered Index가 없음   O
```

Heap의 실제 Row는 특정 Search Key를 기준으로 테이블 전체가 조직되어 있지 않다. 실제 Row 자체는 Heap Table의 Data Page에 저장된다.

```text
Heap Table

Data Page 10
├─ Row A
├─ Row C
└─ Row F

Data Page 27
├─ Row B
├─ Row D
└─ Row E
```

즉 `Heap`은 Row Locator의 종류를 뜻하는 말이 아니라 **원본 Table의 저장구조**를 뜻한다.

---

## 8. Heap의 Row Locator는 RID

Heap에 Non-clustered Index가 있다면 Leaf Record Entry는 원본 Row 위치를 나타내는 RID를 가진다.

```text
name Non-clustered Index

[영희 | RID]
[준호 | RID]
[철수 | RID]
         ↓
       Heap Row
```

SQL Server의 RID는 개념적으로 다음 위치 정보를 나타낸다.

```text
RID
├─ File ID
├─ Page ID
└─ Slot ID
```

따라서:

```text
name='철수'
 ↓
name Index 탐색
 ↓
[철수 | RID]
 ↓
File / Page / Slot
 ↓
Heap의 Data Page
 ↓
실제 Row
```

여기서 역할을 분리해서 기억해야 한다.

```text
실제 Row
→ Heap Table의 Data Page에 저장

RID
→ 그 실제 Row가 어디 있는지 나타내는 위치 정보

Row Locator
→ Non-clustered Index의 Leaf Entry에 저장
→ 원본 Table이 Heap이면 그 값으로 RID 사용
```

즉 **RID는 Heap에 별도로 저장된 목록이 아니라, Heap의 Row를 참조하는 Non-clustered Index의 Row Locator로 사용되는 위치 정보**다.

---

## 9. Clustered Table의 Row Locator는 Clustered Key

Clustered Table에 별도의 Non-clustered Index를 만들면 Row Locator로 Clustered Key를 사용한다. 단, SQL Server에서 Clustered Index는 반드시 Unique일 필요가 없다. 고유하지 않은 Clustered Key에는 행을 구별하는 내부 `uniqueifier`가 추가될 수 있으며, 이 식별 정보도 Locator에 영향을 준다.

예를 들어 `ID`가 Clustered Key이고 `name`에 Non-clustered Index를 만들었다면:

```text
name Non-clustered Index

민수 | ID=40
영희 | ID=10
철수 | ID=30
        ↓
   Clustered Key
```

조회 흐름은 다음과 같다.

```text
name='철수'
 ↓
name Non-clustered Index 탐색
 ↓
ID=30 획득
 ↓
ID Clustered Index에서 30 탐색
 ↓
Leaf Data Page
 ↓
실제 Row
```

즉 SQL Server에서는:

```text
Row Locator
├─ Heap Table      → RID
└─ Clustered Table → Clustered Key
```

**Non-clustered Index의 Row Locator는 고정된 형태가 아니라, 원본 Row가 어떤 저장구조에 있느냐에 따라 달라진다.**

```text
원본 Table이 Heap 구조
→ 실제 Row는 Heap의 Data Page에 저장
→ 원본 Row를 찾아갈 Clustered Index가 없음
→ Non-clustered Index가 Row Locator로 RID를 저장

원본 Table이 Clustered 구조
→ 실제 Row는 Clustered B+Tree의 Leaf Data Page에 저장
→ Clustered Key로 원본 Row를 다시 찾을 수 있음
→ Non-clustered Index가 Row Locator로 Clustered Key를 저장
```

Clustered Key를 찾은 뒤 별도의 RID를 다시 얻는 것이 아니다. Clustered B+Tree의 Leaf 자체가 실제 Data Page이기 때문이다.

### RID와 Clustered Key가 Locator일 때의 차이

여러 Non-clustered Index가 같은 원본 Row를 참조한다고 생각하면 차이가 더 잘 보인다.

Heap에서는 각 Non-clustered Index가 Row의 위치를 나타내는 RID를 Locator로 가진다.

```text
Non-clustered Index A ─┐
Non-clustered Index B ─┼→ RID(Page / Slot) → 실제 Row
Non-clustered Index C ─┘
```

RID는 위치 정보이므로 Row의 저장 위치가 바뀌는 상황에서는 이 Locator를 어떻게 유지할지가 문제가 된다. 다만 SQL Server Heap은 Row가 커져 기존 위치에 들어가지 못할 때 **Forwarding Record**를 남겨 기존 RID를 통한 접근을 유지할 수 있다. 따라서 Row가 이동할 때마다 모든 Non-clustered Index의 RID를 반드시 갱신한다는 뜻은 아니다. Forwarding 경유 접근은 추가 비용이 될 수 있다.

반면 Clustered Table의 Non-clustered Index는 물리적 Page 위치가 아니라 Clustered Key를 Locator로 가진다.

```text
Non-clustered Index A ─┐
Non-clustered Index B ─┼→ Clustered Key = 100
Non-clustered Index C ─┘
                         ↓
                  Clustered B+Tree
                         ↓
                      실제 Row
```

실제 Row가 Page Split 등으로 다른 Page에 배치되더라도 Clustered Key가 그대로라면 Non-clustered Index의 Locator 값 자체는 바뀌지 않는다.

```text
Heap의 RID
→ 위치 기반
→ Row 위치 변화의 영향을 받을 수 있음

Clustered Key
→ 논리 Key 기반
→ 단순한 물리적 Row 이동에는 Locator 값이 유지됨
```

하지만 Clustered Key 자체를 변경하면 이야기가 달라진다. Non-clustered Index들이 그 Key를 Row Locator로 사용하므로 관련 Index도 함께 유지해야 한다.

따라서 Clustered Key는 일반적으로 **크기가 작고, 고유하며, 자주 변경되지 않는 값**이 유리하다. Clustered Key가 넓으면 이를 Locator로 저장하는 Non-clustered Index들의 크기도 커질 수 있고, Key 변경이 잦으면 Index 유지 비용도 증가한다.

> **Heap은 RID라는 위치로 찾아가고, Clustered Table은 Clustered Key라는 논리적 길을 따라 다시 찾아간다.**

---

## 10. B/B+와 Clustered/Non-clustered를 2×2로 합치기

두 분류축을 합치면 개념적으로 다음 네 조합을 생각할 수 있다.

```text
                    Clustered                 Non-clustered

B-Tree         Record Entry가 실제 Row     Record Entry가 Locator를 가짐
               내부 노드에도 가능           내부 노드에도 가능

B+Tree         Leaf에 실제 Row             Leaf Record Entry가 Locator를 가짐
               Internal은 탐색용            Internal은 탐색용
```

### 개념적인 B-Tree + Clustered

```text
       [30 | 실제 Row]
          /        \
         ↓          ↓
[10 | 실제 Row] [50 | 실제 Row]
```

### 개념적인 B-Tree + Non-clustered

```text
       [30 | Locator]
          /       \
         ↓         ↓
[10 | Locator] [50 | Locator]
```

B-Tree에서는 Record Entry가 내부 노드에도 존재할 수 있으므로, Non-clustered라면 원본 Row를 나타내는 각 Record Entry가 Row Locator를 가진다고 이해할 수 있다.

### B+Tree + Clustered

```text
       [30]                    ← Key + Child Pointer
       /  \
      ↓    ↓

[10|실제 Row] → [30|실제 Row] ← Leaf Record Entry
```

### B+Tree + Non-clustered

```text
       [30]                    ← Key + Child Pointer
       /  \
      ↓    ↓

[10|Locator] → [30|Locator]   ← Leaf Record Entry
```

이 2×2는 **두 분류축을 분리해서 이해하기 위한 개념 모델**이다. 실제 DBMS가 네 조합을 모두 동일한 형태로 제공한다는 뜻은 아니다.

---

## 11. PK와 Clustered Index

Primary Key와 Clustered Index는 같은 개념이 아니다.

```text
Primary Key
→ Row를 유일하게 식별하는 논리적 제약

Clustered Index
→ 데이터 저장구조를 특정 Key 기준으로 조직하는 인덱스 구조
```

SQL Server에서는 기존 Clustered Index가 없을 때 PK가 Clustered Index가 되는 경우가 흔해 둘이 같은 것처럼 느껴질 수 있다.

하지만 다음처럼 분리할 수 있다.

```text
Primary Key     : student_id
Clustered Index : created_at
```

따라서 PK와 Clustered Index는 역할을 분리해서 기억한다.

---

## 12. 일반적으로 별도로 만드는 인덱스

실무에서 조회 성능을 위해 다음처럼 추가하는 인덱스는 보통 보조(Secondary) 인덱스다. SQL Server에서는 일반적으로 Non-clustered Index다.

```sql
CREATE INDEX idx_user_name
ON users(name);
```

```text
별도 검색 Index
      ↓
Search Key + Row Locator
      ↓
테이블의 주 저장구조
```

따라서 학습 단계에서는 다음처럼 이해할 수 있다.

> **별도로 추가하는 검색용 인덱스 ≈ Secondary / Non-clustered Index**

단, DBMS마다 공식 용어와 저장구조가 다르므로 완전히 같은 말로 일반화하지 않는다.

---

## 13. Covering Index는 왜 필요한가

Non-clustered Index로 찾았다고 해서 항상 조회가 끝나는 것은 아니다.

Clustered Table에서 `name`이 Non-clustered Index이고 `ID`가 Clustered Key라고 하자. `name='철수'`로 검색한 뒤 원본 Row의 다른 Column이 필요하면 다음처럼 한 번 더 찾아가야 한다.

```text
name Non-clustered Index 탐색
        ↓
[철수 | ID=30]
        ↓
Clustered Key 획득
        ↓
ID Clustered Index 다시 탐색
        ↓
Leaf Data Page
        ↓
실제 Row
```

즉 Non-clustered Index 탐색 뒤 **원본 Row를 얻기 위한 추가 Lookup**이 발생할 수 있다.

여기서 자연스럽게 다음 질문이 나온다.

> **Query에 필요한 Column을 Non-clustered Index에서 전부 얻을 수 있다면 굳이 원본 Row까지 다시 찾아갈 필요가 있을까?**

그럴 필요가 없다. 특정 Query에 필요한 Column이 Index 안에 모두 들어 있어 원본 Row 접근 없이 Query를 처리할 수 있는 경우 그 인덱스가 **해당 Query를 Covering한다**고 한다. Covering은 별도의 Tree 종류가 아니라 **Query에 따라 달라지는 성질**이다.

예를 들어:

```sql
SELECT name, age
FROM student
WHERE name = '철수';
```

`name` Index에서 `age`까지 얻을 수 있다면:

```text
name Non-clustered Index 탐색
        ↓
[철수 | age=30 | ID=30]
        ↓
Query에 필요한 name, age 모두 획득
        ↓
Clustered Index Lookup 불필요
        ↓
끝
```

즉 흐름은 다음과 같다.

```text
Non-clustered Index
        ↓
Row Locator 획득
        ↓
원본 Row Lookup 필요
        ↓
Lookup도 비용
        ↓
필요한 Column을 Index에서 모두 얻자
        ↓
Covering Index
        ↓
원본 Row Lookup 생략
```

예를 들어 `(name, age)` 인덱스가 있다고 하자. 아래 첫 번째 Query는 필요한 컬럼을 인덱스에서 얻을 수 있지만, 두 번째 Query는 `address`가 인덱스에 없으면 원본 Row 조회가 필요하다.

```sql
SELECT name, age FROM student WHERE name = '철수';
SELECT name, age, address FROM student WHERE name = '철수';
```

중요한 점은 **Covering이라고 Row Locator가 없어지는 것이 아니라, 해당 Query에서 Row Locator를 따라갈 필요가 없어지는 것**이다. SQL Server에서 필요한 컬럼을 인덱스에 포함하는 방법은 Key 컬럼뿐 아니라 `INCLUDE` 컬럼도 있다.

### Covering Index의 Trade-off

Index에 더 많은 Column을 포함하면 Lookup을 줄여 조회 성능을 높일 수 있지만 공짜는 아니다.

```text
필요한 Column을 Index에 더 저장
        ↓
원본 Row Lookup 감소
        ↓
조회 I/O 감소 가능

하지만
        ↓
Index 크기 증가
        ↓
INSERT / UPDATE / DELETE 시
Index 유지 비용 증가
```

따라서 Covering Index는 **자주 실행되는 Query의 Lookup 비용을 줄이는 대신 저장공간과 DML 유지 비용을 지불하는 최적화**로 이해한다.

---

## 14. DBMS별 차이

지금까지의 `Leaf = 실제 Row`, `Heap이면 RID`, `Clustered Table이면 Clustered Key` 설명은 특히 SQL Server 구조를 이해하기 위한 것이다.

### SQL Server

```text
Table
├─ Heap
│   └─ Non-clustered Index → RID → Row
│
└─ Clustered Table
    └─ Non-clustered Index → Clustered Key → Clustered Index → Row
```

### MySQL InnoDB

InnoDB는 Primary Key를 중심으로 실제 Row를 Clustered 구조에 조직한다.

```text
Primary Key B+Tree
        ↓
Leaf = 실제 Row
```

Secondary Index는 Primary Key를 Row Locator처럼 사용한다.

```text
Secondary Key
      ↓
Primary Key
      ↓
Primary Key B+Tree
      ↓
실제 Row
```

### PostgreSQL

PostgreSQL은 기본적으로 Heap-organized Table과 별도 Index 구조를 사용한다.

```text
B-Tree Index
     ↓
    TID
     ↓
Heap Tuple
```

따라서 SQL Server식 표현을 빌리면 일반 Index가 Non-clustered 성격에 가깝다고 이해할 수 있다.

다만 PostgreSQL 자체가 SQL Server처럼 모든 Index를 공식적으로 Clustered / Non-clustered로 분류하는 것은 아니다. PostgreSQL의 `CLUSTER` 명령도 SQL Server의 Clustered Index와 같은 지속적 저장구조를 의미하지 않는다.

---

## 15. 처음 헷갈렸던 질문으로 다시 확인

### 노드에 실제 Row가 있으면 Clustered인가

그렇게만 판단하면 안 된다. B/B+는 Record Entry를 어느 Level에 두는지에 관한 축이고, Clustered 여부는 인덱스가 실제 Row의 주 저장구조인지에 관한 축이다.

### B+Tree이면 Leaf에 실제 데이터가 있는가

항상 그렇지 않다.

```text
B+Tree + Clustered
→ Leaf = 실제 Row

B+Tree + Non-clustered
→ Leaf = Search Key + Row Locator
```

### Non-clustered이면 Locator가 필요한가

원본 Row와 인덱스가 분리되어 있으므로 원본 Row를 식별하거나 찾아갈 정보가 필요하다.

```text
Heap              → RID
Clustered Table   → Clustered Key   (SQL Server 기준)
```

### B-Tree + Non-clustered이면 내부 노드에도 Locator가 있을 수 있는가

개념 모델에서는 그렇다. B-Tree는 내부 노드에도 Record Entry가 있을 수 있으므로, 원본 Row를 나타내는 Record Entry에는 Row Locator가 필요하다.

### Clustered는 물리 Disk 위치를 말하는가

아니다. 실제 Row를 담은 Page가 Clustered Key 기준의 인덱스 구조로 **논리적으로 조직되는 것**이 핵심이다.

---

## 16. 질문으로 이해 복원하기

본문을 가리고 다음 질문에 **분류축 → 저장 관계 → 조회 경로 → 비용** 순서로 답해 본다.

1. B-Tree / B+Tree와 Clustered / Non-clustered는 왜 서로 다른 분류축인가?
2. Clustered Index의 Row가 Key 순서로 조직된다는 말은 왜 물리적 디스크 연속 배치와 다른가?
3. SQL Server Heap에 Non-clustered Index가 있을 때 RID는 어디에 저장되고, 어떤 정보를 나타내는가?
4. SQL Server의 Non-clustered Index는 Clustered Table에서 무엇을 Locator로 사용하는가? Clustered Key가 고유하지 않으면 어떤 보완이 필요한가?
5. Row의 물리적 위치가 변할 때 RID와 Clustered Key 기반 Locator는 어떤 차이를 보이는가? Heap의 Forwarding Record는 무엇을 보완하는가?
6. Child Pointer와 Row Locator는 각각 어디로 안내하는가?
7. 같은 인덱스가 어떤 Query에는 Covering이고 다른 Query에는 아닐 수 있는 이유는 무엇인가? 추가 Lookup을 줄이는 대가는 무엇인가?
8. SQL Server, InnoDB, PostgreSQL의 원본 Row 저장 방식과 보조 인덱스의 참조 방식은 어떻게 다른가?

> **B/B+는 결과 Entry의 트리 내 위치, Clustered/Non-clustered는 인덱스와 실제 Row 저장구조의 관계다. Non-clustered 조회에서 원본 Row가 더 필요하면 Locator를 따라 추가 Lookup이 생길 수 있고, Query에 필요한 정보가 인덱스에 모두 있으면 이를 생략할 수 있다.**
