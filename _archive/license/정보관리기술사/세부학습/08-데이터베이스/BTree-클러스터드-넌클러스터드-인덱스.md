# B-Tree 계열과 Clustered / Non-clustered Index

이 문서는 B-Tree·B+Tree와 Clustered·Non-clustered Index가 왜 비슷해 보이면서도 다른 개념인지 이해하기 위한 문서다.

처음에는 `Leaf에 실제 Data가 있느냐`, `Pointer가 있느냐`로 설명하면 두 분류가 같은 것처럼 보이기 쉽다. 핵심은 **서로 다른 분류축**이라는 점이다.

설명은 이해하기 쉽도록 SQL Server의 B+Tree 계열 Clustered Index를 중심으로 한다. DBMS마다 구현과 용어가 다르므로 마지막에 PostgreSQL·MySQL InnoDB와의 차이를 구분한다.

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

SQL Server의 B+Tree 계열을 이해할 때는 다음 그림이 가장 직관적이다.

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

따라서 이해 단계에서는 다음처럼 기억할 수 있다.

> **B/B+ = Record Entry를 트리 어디에 두는가**
>
> **Clustered/Non-clustered = 실제 Row 저장구조와 인덱스가 어떤 관계인가**

---

## 2. 먼저 용어를 분리한다

이 주제는 `Pointer`, `Data`, `Record`를 뭉뚱그려 말하면 바로 헷갈린다.

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

검색 Key 하나에 대응해 인덱스에 저장되는 **검색 결과 단위의 항목**이라고 이해한다.

```text
[Search Key | ???]
```

이 문서에서 `인덱스 항목`이라고 풀어 쓸 때도 같은 의미다. 이후에는 **Record Entry**를 기본 용어로 사용한다.

`???`가 무엇인지는 인덱스가 실제 Row의 주 저장구조인지, 별도의 검색구조인지에 따라 달라질 수 있다.

```text
Clustered 쪽의 Record Entry
→ 실제 Row

Non-clustered 쪽의 Record Entry
→ Search Key + Row Locator
```

### Child Pointer

트리의 내부 노드에서 **다음 하위 Node/Page로 내려가기 위한 길 안내**다.

```text
Internal Node
[30 | 50]
 /    |    \
↓     ↓     ↓
Child Page
```

### Row Locator

원본 Row가 별도 저장구조에 있을 때 **그 Row를 찾아가기 위한 정보**다.

```text
[Search Key | Row Locator]
                ↓
             실제 Row
```

따라서 다음 둘은 다르다.

```text
Child Pointer
→ 트리 안에서 다음 Node/Page를 찾음

Row Locator
→ 최종적으로 원본 Row를 찾음
```

### Data Page

실제 Row들이 저장되는 DB의 Page다.

```text
Data Page
┌──────────────────┐
│ 10 | 영희 | ...  │
│ 20 | 준호 | ...  │
└──────────────────┘
```

---

## 3. B-Tree와 B+Tree는 무엇을 구분하는가

### B-Tree

개념적으로 내부 노드에서도 검색 결과에 대응하는 Record Entry를 가질 수 있다.

```text
          [30 | Record Entry]
           /              \
          ↓                ↓
[10 | Record Entry]  [50 | Record Entry]
```

따라서 30을 찾았다면 내부 노드에서 검색 결과를 얻을 수 있다.

### B+Tree

내부 노드는 탐색용 Key와 Child Pointer 중심이고, 검색 결과에 대응하는 Record Entry는 Leaf에 집중된다.

```text
              [30 | 50]
              /   |   \
             ↓    ↓    ↓

[10|Entry][20|Entry] → [30|Entry][40|Entry] → [50|Entry]
       Leaf                  Leaf               Leaf
```

Leaf끼리 Key 순서로 연결되므로 범위 탐색에 유리하다.

```text
20을 찾음
 ↓
20 → 30 → 40 → 50
```

따라서 B/B+의 핵심 질문은 다음이다.

> **Record Entry를 트리의 어디에 둘 것인가?**

`B+Tree = Leaf에 무조건 실제 Row가 있다`는 뜻은 아니다. Leaf의 Record Entry가 **실제 Row인지 Row Locator를 가진 항목인지**는 Clustered/Non-clustered 관계에 따라 달라질 수 있다.

---

## 4. Clustered Index의 핵심

SQL Server의 Clustered B+Tree에서는 **Leaf Level 자체가 실제 Data Page**다.

```text
              [30 | 50]          ← Internal
              /   |   \
             ↓    ↓    ↓

[10 Row][20 Row] → [30 Row][40 Row] → [50 Row][60 Row]
      Leaf               Leaf              Leaf
```

따라서 `ID=30`을 검색하면:

```text
Clustered B+Tree에서 30 탐색
 ↓
Leaf Page 도착
 ↓
30 | 철수 | 25 | 서울
 ↓
이미 실제 Row
```

별도의 `RID → Row` 접근이 필요하지 않다.

즉 SQL Server식 모델에서는:

> **Clustered = Key 순서로 조직된 인덱스 구조가 실제 Row의 주 저장구조다.**

---

## 5. '실제 데이터가 순서대로 저장된다'는 의미

Clustered를 설명할 때 `실제 데이터가 Key 순서로 저장된다`고 표현한다.

이 말은 디스크 Sector가 반드시 다음처럼 물리적으로 연속된다는 뜻이 아니다.

```text
[10][20][30][40][50]  ← 물리적으로 반드시 이렇게 붙어 있다는 뜻 X
```

실제 Page의 물리적 위치는 흩어질 수 있다.

```text
물리적 위치

Page 300        Page 17        Page 850
30,40           10,20          50,60
```

하지만 Clustered B+Tree에서는 실제 Row를 담은 Data Page가 Key 기준의 인덱스 구조로 논리적으로 조직된다.

```text
              [30 | 50]
              /   |   \
             ↓    ↓    ↓

Page 17   →  Page 300  →  Page 850
10,20         30,40        50,60
```

따라서:

> **'실제 데이터가 Key 순서로 논리적으로 저장된다' = Row Locator가 아니라 실제 Row를 담은 Data Page가 Clustered Key 기준의 인덱스 구조로 조직된다.**

---

## 6. Non-clustered Index의 핵심

Non-clustered Index는 실제 Row 저장구조와 **분리된 별도의 검색 구조**다.

따라서 Search Key를 찾은 뒤 원본 Row를 찾아갈 정보가 필요하다.

```text
Non-clustered Record Entry

[Search Key | Row Locator]
                ↓
            실제 Row
```

여기서 중요한 점은 Row Locator가 반드시 물리 주소 형태의 Pointer일 필요는 없다는 것이다.

```text
Row Locator
├─ 실제 Row 위치일 수도 있음
└─ 실제 Row를 다시 찾기 위한 다른 Key일 수도 있음
```

그래서 `Pointer`보다 `Row Locator`라는 표현이 안전하다.

---

## 7. Heap은 무엇인가

SQL Server 기준으로 **Clustered Index가 없는 테이블의 저장구조**를 Heap이라고 한다.

```text
Table
├─ Clustered Index 없음 → Heap
└─ Clustered Index 있음 → Clustered Table
```

Heap이라고 해서 인덱스가 하나도 없다는 뜻은 아니다.

```text
Heap Table
├─ name Non-clustered Index
├─ email Non-clustered Index
└─ created_at Non-clustered Index
```

즉:

```text
Heap = Index 없음                  X
Heap = Clustered Index가 없음      O
```

Heap에는 실제 Row가 있지만 특정 Search Key를 기준으로 테이블 자체가 조직되어 있지는 않다.

---

## 8. Row Locator: Heap이면 RID, Clustered Table이면 Clustered Key

SQL Server에서는 Non-clustered Index가 실제 Row를 찾아가는 방법이 테이블 저장형태에 따라 달라진다.

### Heap Table

```text
name Non-clustered Index

[영희 | RID]
[준호 | RID]
[철수 | RID]
         ↓
       Heap Row
```

RID는 개념적으로 Row의 위치를 나타낸다.

```text
RID
├─ File ID
├─ Page ID
└─ Slot ID
```

조회 흐름:

```text
name='철수'
 ↓
name Index
 ↓
[철수 | RID]
 ↓
File / Page / Slot
 ↓
Heap Row
```

### Clustered Table

Clustered Table의 Non-clustered Index는 Row Locator로 Clustered Key를 사용한다.

```text
ID Clustered Index가 있는 Table

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

따라서 다음처럼 기억한다.

```text
Row Locator
├─ Heap Table      → RID
└─ Clustered Table → Clustered Key
```

---

## 9. B/B+와 Clustered/Non-clustered를 2×2로 합치기

두 분류축을 합치면 개념적으로 다음 네 조합을 생각할 수 있다.

```text
                    Clustered                 Non-clustered

B-Tree         Record Entry가 실제 Row     Record Entry가 Locator를 가짐
               내부 노드에도 가능           내부 노드에도 가능

B+Tree         Leaf에 실제 Row             Leaf Entry가 Row Locator를 가짐
               내부는 탐색용               내부는 탐색용
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

B-Tree에서는 Record Entry가 내부 노드에도 존재할 수 있으므로, Non-clustered라면 **원본 Row를 나타내는 각 Record Entry가 Row Locator를 가져야 한다**고 이해할 수 있다.

### B+Tree + Clustered

```text
       [30]                    ← Internal: Key + Child Pointer
       /  \
      ↓    ↓

[10|실제 Row] → [30|실제 Row] ← Leaf Record Entry
```

### B+Tree + Non-clustered

```text
       [30]                    ← Internal: Key + Child Pointer
       /  \
      ↓    ↓

[10|Locator] → [30|Locator]   ← Leaf Record Entry
```

B+Tree에서는 Record Entry가 Leaf에 집중되므로, Non-clustered라면 **Row Locator도 Leaf의 Record Entry에 위치**한다고 이해하면 된다.

이 그림에서 가장 중요한 문장은 다음이다.

> **B/B+는 Record Entry의 트리 내 위치를 구분하고, Clustered/Non-clustered는 실제 Row 저장구조와 인덱스의 관계를 구분한다.**

---

## 10. Child Pointer와 Row Locator를 혼동하지 않는다

B+Tree + Non-clustered를 보면 Pointer가 두 종류처럼 보인다.

```text
              Internal
          [30 | 50]
          /    |    \
         ↓     ↓     ↓
      Child Pointer

              Leaf
       [30 | Row Locator]
              ↓
           실제 Row
```

둘의 역할은 다르다.

```text
Child Pointer
→ B+Tree 탐색 과정에서 다음 Node/Page로 내려감

Row Locator
→ 인덱스 탐색이 끝난 뒤 원본 Row를 찾아감
```

---

## 11. 일반적으로 별도 생성하는 인덱스

실무에서 다음처럼 조회 성능을 위해 추가하는 인덱스는 보통 보조(Secondary) 인덱스이며, SQL Server에서는 Non-clustered Index가 일반적이다.

```sql
CREATE INDEX idx_user_name
ON users(name);
```

```text
테이블의 주 저장구조
        ↑
        │ Row Locator
        │
name Index
email Index
created_at Index
```

따라서 개념 학습 단계에서는:

> **별도로 추가하는 검색용 인덱스 ≈ Non-clustered / Secondary Index**

라고 이해할 수 있다.

---

## 12. PK와 Clustered Index는 같은가

아니다.

```text
Primary Key
→ Row를 유일하게 식별하는 논리적 제약

Clustered Index
→ 데이터 저장구조를 특정 Key 기준으로 조직하는 인덱스 구조
```

SQL Server에서는 기존 Clustered Index가 없을 때 PK 생성 시 PK가 Clustered Index가 되는 경우가 흔해 둘이 같은 것처럼 보일 수 있다.

하지만 개념적으로는 다음과 같은 설계도 가능하다.

```text
PK              : student_id
Clustered Index : created_at
```

따라서:

```text
PK ≠ Clustered Key ≠ 임의의 Search Key
```

역할을 분리해서 기억한다.

---

## 13. Covering Index에서는 왜 Row까지 가지 않는가

Non-clustered Index에 Row Locator가 있다고 해서 모든 조회에서 반드시 Locator를 따라가는 것은 아니다.

```sql
SELECT name
FROM student
WHERE name = '철수';
```

필요한 값이 이미 `name` 인덱스 안에 있다면:

```text
name Index 탐색
 ↓
'철수' 발견
 ↓
필요한 결과를 이미 얻음
 ↓
끝
```

원본 Row까지 갈 필요가 없다.

중요한 것은:

> **Covering Index라고 Row Locator가 없어지는 것이 아니라, 해당 Query에서 Locator를 따라갈 필요가 없는 것이다.**

이 원리가 INCLUDE Column 등의 Index 설계로 연결된다.

---

## 14. DB