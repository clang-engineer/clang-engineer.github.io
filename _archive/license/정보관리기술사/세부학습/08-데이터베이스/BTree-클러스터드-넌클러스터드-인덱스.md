# B-Tree 계열과 Clustered / Non-clustered Index

이 문서는 B-Tree·B+Tree와 Clustered·Non-clustered Index가 왜 비슷해 보이면서도 다른 개념인지 이해하기 위한 문서다.

처음에는 `Leaf에 Data가 있느냐`, `Pointer가 있느냐`로 설명하면 두 분류가 같은 것처럼 보이기 쉽다. 핵심은 **서로 다른 분류축**이라는 점과, 실제 DBMS 구현에서는 이 두 축이 결합된다는 점이다.

설명은 구조를 이해하기 쉽도록 SQL Server의 B+Tree 계열 Clustered Index를 중심으로 하고, 마지막에 PostgreSQL 등 DBMS 차이를 구분한다.

---

## 1. 가장 먼저 잡을 핵심

```text
B-Tree / B+Tree
→ 트리 자료구조의 구성 방식
→ 레코드 엔트리를 트리의 어디에 두는가

Clustered / Non-clustered
→ 인덱스와 실제 Row 저장구조의 관계
→ 인덱스 구조 자체가 실제 Row의 주 저장구조인가
```

SQL Server의 B+Tree 계열 인덱스를 이해할 때는 다음 그림이 가장 직관적이다.

```text
[Clustered]

Root / Internal
      ↓
Leaf = 실제 Data Page(Row)


[Non-clustered]

Root / Internal
      ↓
Leaf = Search Key + Row Locator
                         ↓
                    실제 Row
```

즉 이해 단계에서는 다음처럼 기억할 수 있다.

> Clustered: 키 순서로 조직된 인덱스 구조에 실제 Row가 저장된다.
>
> Non-clustered: 키 순서로 조직된 별도 인덱스 구조에 Row Locator가 저장된다.

단, 기술사 답안에서는 특정 DBMS 구현에 종속되지 않도록 **Clustered Index는 인덱스 키 기준으로 데이터 저장구조 자체가 조직되는 인덱스**라고 표현하는 것이 안전하다.

---

## 2. B-Tree와 B+Tree는 무엇을 구분하는가

B-Tree와 B+Tree는 `Clustered냐 아니냐`를 구분하는 개념이 아니다.

### B-Tree

개념적으로 내부 노드에서도 레코드 엔트리를 가질 수 있다.

```text
          [30 | Record/Locator]
            /              \
           ↓                ↓
[10 | Record/Locator]  [50 | Record/Locator]
```

30을 찾았다면 내부 노드에서 검색이 끝날 수 있다.

### B+Tree

내부 노드는 탐색을 위한 Key와 하위 Page Pointer 중심으로 사용하고, 레코드 엔트리는 Leaf에 집중한다.

```text
              [30 | 50]
              /   |   \
             ↓    ↓    ↓

[10|Entry][20|Entry] → [30|Entry][40|Entry] → [50|Entry]
       Leaf                  Leaf                 Leaf
```

Leaf가 연결되어 있으므로 범위 탐색에도 유리하다.

```text
20 검색
 ↓
20 → 30 → 40 → 50
```

따라서 B/B+의 질문은 다음이다.

> **트리 안에서 레코드 엔트리를 어디에 배치할 것인가?**

---

## 3. Clustered Index가 어려웠던 이유

처음에는 Clustered를 `실제 데이터가 디스크에 Key 순서대로 붙어 있는 것`으로 생각하기 쉽다.

하지만 물리 디스크의 연속된 Sector에 반드시 다음처럼 저장된다는 뜻은 아니다.

```text
[10][20][30][40]   ← 반드시 이렇게 물리적으로 연속이라는 의미 X
```

실제 Page의 물리적 위치는 흩어질 수 있다.

```text
물리적 위치

Page 300        Page 17        Page 850
30,40           10,20          50,60
```

중요한 것은 DB가 관리하는 인덱스 구조에서 Key 순서로 **논리적으로 조직**되어 있다는 것이다.

```text
              [30 | 50]
              /   |   \
             ↓    ↓    ↓

Page 17   →  Page 300  →  Page 850
10,20         30,40        50,60
```

SQL Server의 Clustered B+Tree에서는 이 Leaf Page가 실제 Data Page다.

따라서 앞에서 말한

> `실제 데이터가 Key 순서로 논리적으로 저장된다`

는 표현은 결국

> **Row Locator가 아니라 실제 Row가 들어 있는 Data Page가 Clustered Key를 기준으로 B+Tree 안에서 조직되어 있다**

는 뜻이다.

---

## 4. Heap은 무엇인가

SQL Server 기준으로 **Clustered Index가 없는 테이블의 저장구조**를 Heap이라고 한다.

```text
Table
├─ Clustered Index 없음 → Heap
└─ Clustered Index 있음 → Clustered Table
```

Heap이라고 해서 인덱스가 전혀 없다는 뜻은 아니다.

```text
Heap Table
├─ name Non-clustered Index
├─ email Non-clustered Index
└─ created_at Non-clustered Index
```

Heap에는 실제 Row가 저장되지만 특정 Search Key를 기준으로 테이블 자체가 조직되어 있지는 않다.

```text
Heap Data Page

Page A            Page B
30 철수            10 영희
50 민수            20 준호
```

따라서 다음을 구분한다.

```text
Heap
= 데이터 저장구조 O
= Clustered Key에 의한 조직 X

Clustered Table
= 데이터 저장구조 O
= 특정 Clustered Key에 의한 조직 O
```

---

## 5. Non-clustered Index에는 왜 Row Locator가 필요한가

Non-clustered Index는 실제 Row 저장구조와 **분리된 별도의 검색 구조**다.

따라서 Search Key를 찾은 뒤 실제 Row가 어디 있는지 알아야 한다.

```text
Non-clustered Index

[Search Key | Row Locator]
                ↓
            실제 Row
```

이 때문에 B-Tree냐 B+Tree냐와 무관하게, 원본 Row와 분리된 일반적인 보조 인덱스의 레코드 엔트리에는 결국 원본 Row를 식별하거나 찾아갈 정보가 필요하다.

B+Tree라면 보통 Leaf 엔트리에서 이를 볼 수 있다.

```text
              [30]
             /    \
            ↓      ↓

[10|Locator][20|Locator] → [30|Locator][40|Locator]
          Leaf                    Leaf
```

즉 `Pointer`라는 표현보다 **Row Locator**라고 부르는 것이 정확하다. Locator가 반드시 물리 주소일 필요는 없기 때문이다.

---

## 6. Row Locator는 무엇을 저장하는가

SQL Server에서는 테이블의 주 저장구조에 따라 Non-clustered Index의 Row Locator가 달라진다.

### Heap Table

```text
name Non-clustered Index

[영희 | RID]
[준호 | RID]
[철수 | RID]
         ↓
       Heap Row
```

RID는 실제 Row의 위치를 나타내며 개념적으로 다음 정보를 가진다.

```text
RID
├─ File ID
├─ Page ID
└─ Slot ID
```

따라서 조회 흐름은 다음과 같다.

```text
name='철수'
 ↓
name Index 탐색
 ↓
[철수 | RID]
 ↓
File / Page / Slot
 ↓
Heap Row
```

### Clustered Table

Clustered Table에서는 Non-clustered Index의 Row Locator로 **Clustered Key**를 사용한다.

예를 들어 ID가 Clustered Key라면:

```text
name Non-clustered Index

민수 | ID=40
영희 | ID=10
철수 | ID=30
        ↓
   Clustered Key
```

조회 흐름:

```text
name='철수'
 ↓
name Non-clustered Index
 ↓
ID=30 획득
 ↓
ID Clustered Index에서 30 탐색
 ↓
Leaf Data Page
 ↓
실제 Row
```

따라서 Row Locator를 다음처럼 기억할 수 있다.

```text
Row Locator
├─ Heap Table      → RID (Row 위치)
└─ Clustered Table → Clustered Key
```

---

## 7. Clustered Table에서는 Clustered Key를 찾은 뒤 RID가 필요한가

필요하지 않다.

SQL Server의 Clustered B+Tree에서는 Leaf 자체가 실제 Data Page이기 때문이다.

```text
            Clustered B+Tree

                [30 | 50]
                /   |   \
               ↓    ↓    ↓

[10 Row][20 Row] → [30 Row][40 Row] → [50 Row]
       Leaf              Leaf
```

따라서 ID=30을 찾으면:

```text
Clustered B+Tree에서 30 탐색
 ↓
Leaf 도착
 ↓
30 | 철수 | 나이 | 주소 ...
 ↓
이미 실제 Row
```

즉 다음과 같은 추가 과정이 없다.

```text
Clustered Key → RID → Row   X
```

이것이 `Clustered Table에서는 테이블의 저장구조 자체가 인덱스 구조와 결합되어 있다`는 말의 구체적인 의미다.

---

## 8. Clustered와 Non-clustered를 Row와 Locator로 이해하기

SQL Server의 B+Tree 계열 인덱스를 이해하는 단계에서는 다음 판별법이 매우 유용하다.

```text
Clustered

[인덱스 구조]
      ↓
Leaf = 실제 Row


Non-clustered

[별도 인덱스 구조]
      ↓
Leaf = Search Key + Row Locator
                         ↓
                    실제 Row
```

따라서 직관적으로는:

```text
실제 Row가 인덱스의 주 저장구조에 있음
→ Clustered

인덱스에는 Locator가 있고 실제 Row는 별도
→ Non-clustered
```

다만 `Clustered = Leaf에 Row`는 SQL Server의 B+Tree 구현을 이해하기 좋은 표현이다. DBMS 일반 정의로는 다음 표현을 사용한다.

> **Clustered Index는 인덱스 키를 기준으로 데이터 저장구조 자체가 조직되는 인덱스다.**

---

## 9. B/B+와 Clustered/Non-clustered는 서로 다른 축이다

처음 가장 헷갈렸던 부분이다.

```text
축 1: Tree 구조
├─ B-Tree
└─ B+Tree

축 2: Row 저장구조와의 관계
├─ Clustered
└─ Non-clustered
```

개념적으로 조합해서 생각할 수 있다.

```text
B-Tree + Clustered
B-Tree + Non-clustered
B+Tree + Clustered
B+Tree + Non-clustered
```

예를 들어 개념적인 B-Tree + Non-clustered라면 레코드 엔트리가 내부 노드에도 있을 수 있고, 그 엔트리는 원본 Row를 찾기 위한 Locator를 가진다.

```text
       [30 | Locator]
          /       \
         ↓         ↓
[10 | Locator] [50 | Locator]
```

B+Tree + Non-clustered라면 Locator를 가진 레코드 엔트리가 Leaf에 집중된다.

```text
          [30]
         /    \
        ↓      ↓

[10|Locator] → [30|Locator]
    Leaf           Leaf
```

즉:

```text
B / B+
→ 레코드 엔트리를 트리 어디에 배치하는가

Clustered / Non-clustered
→ 그 엔트리가 실제 Row 저장구조인가,
  아니면 별도의 Row를 찾아가기 위한 구조인가
```

---

## 10. 일반적으로 추가 생성하는 인덱스

실무에서 다음처럼 조회 성능을 위해 별도로 만드는 인덱스는 보통 보조(Secondary) 인덱스이며, SQL Server에서는 Non-clustered Index가 일반적이다.

```sql
CREATE INDEX idx_user_name
ON users(name);
```

```text
테이블의 주 저장구조
        ↑
        │ Row Locator로 찾아감
        │
name Index
email Index
created_at Index
```

따라서 개념 학습 단계에서는 다음처럼 기억할 수 있다.

> **별도로 생성하는 검색용 인덱스 ≈ Non-clustered / Secondary Index**

단, DBMS마다 공식 용어와 저장구조가 다르므로 완전히 같은 용어로 일반화하지 않는다.

---

## 11. PK와 Clustered Index는 같은 개념인가

아니다.

```text
Primary Key
→ Row를 유일하게 식별하는 논리적 제약

Clustered Index
→ 실제 데이터의 저장/탐색 구조
```

SQL Server에서는 기존 Clustered Index가 없을 때 PK 생성 시 기본적으로 PK에 Clustered Index가 만들어지는 경우가 흔해 둘이 같은 것처럼 보인다.

하지만 개념적으로는 다음 설계도 가능하다.

```text
PK              : student_id
Clustered Index : created_at
```

따라서:

```text
PK ≠ Clustered Index
```

으로 분리해서 기억한다.

---

## 12. DBMS별로 같은가

아니다. 지금까지의 `Leaf = 실제 Row`, `Heap이면 RID`, `Clustered Table이면 Clustered Key` 설명은 특히 SQL Server 구조를 이해하기 위한 것이다.

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

Primary Key를 중심으로 실제 테이블 데이터가 Clustered 구조로 조직되는 대표적인 Storage Engine이다.

```text
Primary Key B+Tree
        ↓
Leaf = Row
```

Secondary Index는 Primary Key 값을 통해 실제 Row를 찾아가는 구조로 이해할 수 있다.

### PostgreSQL

기본적으로 Heap-organized Table과 별도 Index를 사용한다.

```text
B-Tree Index
     ↓
    TID
     ↓
Heap Tuple
```

따라서 SQL Server의 분류를 빌려 직관적으로 이해하면 PostgreSQL의 일반 인덱스는 Non-clustered 성격에 가깝다.

다만 PostgreSQL 자체가 SQL Server처럼 모든 인덱스를 공식적으로 Clustered / Non-clustered로 분류하는 것은 아니다.

PostgreSQL의 `CLUSTER` 명령도 SQL Server의 지속적으로 유지되는 Clustered Index와는 다른 개념이므로 구분한다.

---

## 13. Covering Index에서는 왜 Row까지 가지 않아도 되는가

Non-clustered Index가 Row Locator를 가지고 있어도 항상 실제 Row까지 따라가는 것은 아니다.

예를 들어 `name` 인덱스에서 다음 Query를 실행한다고 하자.

```sql
SELECT name
FROM student
WHERE name = '철수';
```

필요한 값이 이미 인덱스에 있다.

```text
name Index

민수 | Locator
영희 | Locator
철수 | Locator
 ↑
필요한 결과를 이미 얻음
```

따라서 Locator를 따라 실제 Row까지 갈 필요가 없다.

```text
Index 탐색
 ↓
필요한 Column 모두 획득
 ↓
끝
```

이러한 원리가 Covering Index와 `INCLUDE` Column 설계로 연결된다.

---

## 14. 처음 헷갈렸던 질문들

### 노드에 Record가 있으면 Clustered인가

아니다.

B/B+는 레코드 엔트리의 **트리 내 위치**를 다루고, Clustered 여부는 인덱스와 **실제 Row 저장구조의 관계**를 다룬다.

### Clustered는 물리 디스크 순서를 의미하는가

