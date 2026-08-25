# 탐색트리와 DB Index — B-Tree, B+Tree, B*Tree, T-Tree

이 문서는 DB Index의 Tree 구조를 `탐색트리의 계보 → B-Tree의 균형 → DB Page와 I/O → B+Tree / B*Tree → Main Memory DB의 T-Tree` 흐름으로 이해하기 위한 문서다.

---

## 1. 전체 계보

```text
Tree
├─ Binary Tree
│   └─ Binary Search Tree(BST)
│       ├─ AVL Tree
│       └─ Red-Black Tree
│
└─ M-way Tree
    └─ M-way Search Tree
        └─ B-Tree
            ├─ B+Tree
            └─ B*Tree

Main Memory DB 관점의 별도 구조
└─ T-Tree
```

```text
BST의 균형화 → AVL / Red-Black
M-way Search Tree의 균형화 → B-Tree
```

T-Tree는 B-Tree의 후속 버전이 아니라 Main Memory DB를 고려한 별도 방향이다.

---

## 2. Node와 Fan-out

Node는 Tree의 점 하나다. B-Tree 계열에서는 Node 하나에 여러 Key를 저장할 수 있다.

```text
            [20 | 40 | 60]       ← Node 하나
           /     |     |    \
          ↓      ↓     ↓     ↓
      [5|10] [25|30] [45|50] [70|80]
```

`20`, `40`, `60` 각각이 Node가 아니라 `[20 | 40 | 60]` 전체가 Node 하나다.

Fan-out은 한 Node에서 뻗어나가는 Child 수다.

```text
Key 1개 → Child 2개 → Fan-out 2
Key 2개 → Child 3개 → Fan-out 3
Key 3개 → Child 4개 → Fan-out 4
```

Internal Node에서 Key가 `k`개라면 최대 Child는 `k+1`개다. Leaf는 Child가 없으므로 이 관계는 Internal Node 기준이다.

---

## 3. M-way Search Tree와 B-Tree

```text
Binary Tree
→ 자식 최대 2개

Binary Search Tree
→ Binary Tree + 대소관계 탐색 규칙

M-way Tree
→ 자식 최대 M개

M-way Search Tree
→ M-way Tree + 여러 Key를 이용한 탐색 규칙
```

```text
       [20 | 40 | 60]
       /    |    |    \
      ↓     ↓    ↓     ↓
    <20   20~40 40~60  >60
```

M-way Search Tree만으로는 균형을 보장하지 않는다. B-Tree는 여기에 균형과 Node 점유 규칙을 추가한다.

```text
M-way Search Tree
        +
모든 Leaf의 Level 동일
        +
Node 최소/최대 점유 규칙
        +
Overflow → Split
Underflow → Redistribution / Merge
        ↓
      B-Tree
```

m차 B-Tree는 최대 Child `m`, 최대 Key `m-1`을 가진다. Root를 제외한 일반 Node는 보통 최소 `ceil(m/2)`개의 Child를 유지한다.

B-Tree는 Node를 항상 100% 채우는 것이 아니라 **너무 비지 않도록 최소 점유율을 유지한다.**

---

## 4. B-Tree의 삽입과 삭제

### 삽입

4차 B-Tree라면 한 Node의 최대 Key는 3개다.

```text
[10 | 20 | 30]
       + 40
        ↓
[10 | 20 | 30 | 40]  ← Overflow
        ↓
       Split
        ↓
       [20]
       /  \
    [10] [30 | 40]
```

부모도 Overflow이면 Split이 위로 전파된다. Root가 Split될 때 새로운 Root가 생기면서 Tree 전체 높이가 한 단계 증가한다.

> **삽입 = 넣고 → 넘치면 Split → 경계 Key를 위로 올린다.**

### 삭제

삭제 후 최소 점유 조건보다 비면 Underflow다. 먼저 여유 있는 형제와 재분배하고, 불가능하면 Merge한다.

```text
삭제
 ↓
Underflow
 ↓
형제에 여유 있음? ─ Yes → Redistribution
 ↓ No
Merge
```

> **많으면 Split, 부족하면 빌리거나(Redistribution) 합친다(Merge).**

---

## 5. B-Tree와 DB Page

B-Tree의 Node와 DB Page는 원래 다른 개념이다.

```text
Node
→ Tree의 논리적인 점
→ 여러 Key와 Pointer를 포함 가능

DB Page
→ DBMS의 저장 / I/O 단위
```

DB에서는 Node 하나를 Page 단위에 맞춰 저장하는 방식이 일반적으로 유리하다.

```text
논리적 Node
[20 | 40 | 60]
      ↓ 저장

DB Page
┌─────────────────────────┐
│ 20 | 40 | 60 | Ptr ... │
└─────────────────────────┘
```

즉 `Node 하나 ≈ Page 하나`로 이해할 수 있다. Level 전체가 Page 하나라는 뜻은 아니다.

### Key 크기와 Fan-out

이론의 m차 B-Tree에서 Key의 Byte 크기가 m을 결정하는 것은 아니다. 하지만 실제 DB에서는 Page 공간이 유한하다.

```text
Page 크기 고정
→ Key + Pointer Entry 크기 ↓
→ Page(Node)에 더 많은 Entry 저장
→ Child Pointer 수 ↑
→ 실질적 Fan-out ↑
```

여기서 `Key가 작다`는 Key 개수가 적다는 뜻이 아니라 **Key 하나의 Byte 크기가 작다**는 뜻이다.

### Fan-out과 I/O

```text
Fan-out ↑
→ Tree가 넓고 낮아짐
→ 검색 시 거치는 Node 수 ↓

Node ≈ Page
→ 접근 Page 수 ↓
→ Disk I/O ↓
```

Node 최소 점유율 유지도 Page를 지나치게 비워두지 않아 Fan-out 활용도를 유지한다.

> **B-Tree의 균형과 점유 규칙 → 낮은 Tree 높이와 높은 Page 활용도 → DB에서는 I/O 감소**

---

## 6. Split / Merge와 Page 공간

DB에서 Node가 Page에 대응하면 Overflow / Underflow는 실제 Page 공간 관리와 연결된다.

```text
Leaf Page
┌────────────────────────┐
│ Entry │ Entry │ Entry │ ← 가득 참
└────────────────────────┘

새 Entry 삽입
→ 수용 공간 부족
→ Page Split
→ 새 Page 할당 + Entry 이동 + 부모 경계 Key 갱신
```

따라서 Split / Merge는 논리적인 Tree 변형이면서 실제 저장공간 관리 비용이기도 하다.

---

## 7. B+Tree — Internal과 Leaf의 역할 분리

B-Tree에서는 Internal Node에도 Record Entry가 존재할 수 있다. B+Tree는 역할을 분리한다.

```text
Internal Node
→ Search Key + Child Pointer
→ 길 안내

Leaf Node
→ Record Entry
→ 검색 결과 측 정보
```

Record Entry는 Search Key에 대응해 Index에 저장되는 최종 정보다.

```text
Clustered B+Tree
→ Leaf Record Entry = 실제 Row

Non-clustered B+Tree
→ Leaf Record Entry = Row Locator 등
```

### Internal Node

```text
Internal Page(Node)
┌──────────────────────────────┐
│ Key│Ptr│Key│Ptr│Key│Ptr ... │
└──────────────────────────────┘
```

B+Tree에서는 Internal Node 자체가 작아지는 것이 아니라 **Node 안의 Entry 하나가 작아진다.**

```text
Internal Entry 크기 ↓
→ 같은 Page에 Key / Pointer 더 많이 저장
→ Fan-out ↑
→ Tree 높이를 낮게 유지하기 유리
```

### Clustered Leaf Node

```text
Leaf Node ≈ Data Page
┌──────────────────────────────┐
│ Row 10                       │
│ Row 20                       │
│ Row 30                       │
│ Row 40                       │
└──────────────────────────────┘
```

```text
Leaf Node 하나 ≠ Row 하나
Leaf Node 하나 = 여러 Row를 담는 Node(Page)
```

Internal과 Leaf는 Entry 구조가 다르므로 같은 Page 크기라도 수용 가능한 Entry 수와 Split 시점이 다를 수 있다.

---

## 8. B+Tree의 Leaf 연결과 Split

Leaf들은 Key 순서로 연결된다.

```text
Leaf A           Leaf B           Leaf C
[10,20,30]  ↔  [40,50,60]  ↔  [70,80,90]
```

범위 검색은 시작 Leaf를 찾은 뒤 연결된 Leaf를 순차적으로 읽을 수 있다.

```text
B+Tree의 핵심
① Internal에서 Record Entry 제거 → Fan-out 증가
② Record Entry를 Leaf에 집중 + Leaf 연결 → 범위 검색 유리
```

B-Tree Split에서는 중간 Key가 부모로 이동할 수 있다.

```text
[10 | 20 | 30]
      ↓
     [20]
     /  \
  [10] [30]
```

B+Tree의 Leaf Split에서는 Record Entry가 Leaf에 남아야 하므로 경계 Key를 부모에 복사한다.

```text
[10 | 20 | 30 | 40]
        ↓
       [30]            ← 탐색용 Key 복사
       /  \
[10 | 20] ↔ [30 | 40] ← Record Entry 유지
```

따라서 같은 Key가 Internal의 탐색 Key와 Leaf의 Record Entry에 함께 나타날 수 있다.

---

## 9. B*Tree — Page를 더 빽빽하게 사용

B*Tree는 Node가 가득 찼다고 바로 Split하기보다 인접 형제 Node에 여유가 있는지 먼저 확인하고 재분배한다.

```text
Node A 가득 참 + Node B 여유
→ Redistribution
→ 새 Node 생성을 피할 수 있음
```

형제까지 가득 찼다면 인접한 두 Node의 Entry를 새 Node 하나를 추가한 총 세 Node로 재분배한다.

```text
2개의 Full Node + 새 Entry
          ↓
3개의 Node로 재분배
```

`2 → 3`은 Node 하나를 세 조각으로 나눈다는 뜻이 아니라 **인접한 두 Node의 내용을 세 Node에 다시 나눠 담는다는 뜻**이다.

```text
B-Tree  → 최소 점유율 약 1/2
B*Tree  → 최소 점유율 약 2/3
```

2/3은 Split 횟수가 아니라 Node의 최소 공간 활용률이다.

```text
B*Tree
→ 형제 재분배 우선
→ Page 공간 활용도 ↑
→ 불필요한 Split 감소
```

---

## 10. T-Tree — Main Memory DB 관점

Disk 기반 DB에서는 Page I/O가 비싸므로 높은 Fan-out과 낮은 Tree 높이가 중요하다. Main Memory DB에서는 Disk Page I/O라는 전제가 약해진다.

T-Tree는 Binary 균형 탐색 구조를 유지하면서 Node 하나에 여러 Record Entry를 저장한다.

```text
              [40 50 60]
               /      \
              ↓        ↓
        [10 20 30]   [70 80 90]
```

각 `[40 50 60]` 상자 전체가 Node 하나이며 Child는 Left / Right 최대 2개다.

### Key가 여러 개인데 왜 Binary인가

T-Tree의 Node 내부 Key들은 여러 Child 방향을 만드는 경계가 아니라 **Node 하나의 정렬된 범위**를 이룬다.

```text
Node = [30 40 50 60]

찾는 값 < 30 → Left
찾는 값 > 60 → Right
30 ≤ 찾는 값 ≤ 60 → 현재 Node 내부 검색
```

따라서 M-way 여부는 Node 안의 Key 개수가 아니라 **Child 분기 수**로 구분한다.

### 모든 Node가 Record Entry를 저장할 수 있다

B+Tree는 Internal을 길 안내에 사용하고 Record Entry를 Leaf에 집중한다. T-Tree는 Internal / Leaf 역할을 그렇게 분리하지 않고 각 Node가 여러 Record Entry를 저장할 수 있다.

```text
B+Tree
Internal → 탐색 Key
Leaf     → Record Entry

T-Tree
각 Node → 여러 Record Entry
Child    → Left / Right
```

따라서 검색 도중 중간 Node에서 원하는 값을 찾고 끝날 수도 있다.

T-Tree는 Main Memory DB를 위한 전통적 Index 구조의 하나이며, 현대 Main Memory DB가 반드시 T-Tree를 사용한다는 뜻은 아니다.

---

## 11. 최종 비교

```text
BST
→ Binary 탐색
→ 균형 보장 없음

AVL / Red-Black
→ Binary 탐색 + 균형 유지

B-Tree
→ M-way 탐색 + 균형 + Node 점유율
→ 높은 Fan-out으로 DB Page I/O 감소에 유리

B+Tree
→ Internal = 탐색 전용
→ Leaf = Record Entry + Leaf 연결
→ Fan-out과 범위 검색 강화

B*Tree
→ 형제 재분배 우선
→ 최소 점유율 약 2/3
→ 공간 활용도 강화

T-Tree
→ Binary 구조
→ 각 Node에 여러 Record Entry
→ Main Memory DB 관점
```

---

## 12. 기억 흐름

```text
Binary Tree
→ 탐색 규칙 추가
→ BST
→ Binary 균형화
→ AVL / Red-Black

M-way Tree
→ 탐색 규칙 추가
→ M-way Search Tree
→ 균형 + 점유 규칙
→ B-Tree

B-Tree
→ Node ≈ Page
→ Fan-out ↑
→ 높이 ↓
→ Page I/O ↓

B+Tree
→ Internal에서 Record Entry 제거
→ Internal Fan-out ↑
→ Record Entry를 Leaf에 집중
→ Leaf 연결
→ 범위 검색 강화

B*Tree
→ 바로 Split하지 않고 형제 재분배
→ Page 점유율 강화

Main Memory DB
→ Disk I/O 중요도 감소
→ Binary 균형 구조 + Node 내부 다중 Entry
→ T-Tree
```

> **B-Tree 계열은 넓고 낮은 Tree로 Page I/O를 줄이는 방향으로 발전했고, B+Tree는 Internal과 Leaf의 역할을 분리해 Fan-out과 범위 검색을 강화하며, B*Tree는 Node 점유율을 높인다. T-Tree는 Disk Page I/O가 핵심이 아닌 Main Memory 환경을 고려한 별도 방향이다.**
