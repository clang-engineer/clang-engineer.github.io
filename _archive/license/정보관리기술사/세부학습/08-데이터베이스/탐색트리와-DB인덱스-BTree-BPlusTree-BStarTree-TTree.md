# 탐색트리와 DB Index — B-Tree, B+Tree, B*Tree, T-Tree

이 문서는 DB Index에서 사용하는 Tree 구조가 어디서 나왔고, 왜 B-Tree 계열이 Disk 기반 DB에 적합하며 T-Tree가 Main Memory DB 관점에서 등장했는지 이해하기 위한 문서다.

핵심은 자료구조를 따로 외우는 것이 아니라 `탐색 구조 → 균형 → DB Page → Fan-out → I/O → B+Tree / B*Tree → Main Memory의 T-Tree` 흐름으로 연결하는 것이다.

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
BST의 균형화
→ AVL / Red-Black

M-way Search Tree의 균형화
→ B-Tree
```

T-Tree는 B-Tree의 후속 버전이 아니라 Main Memory DB를 고려한 별도 방향이다.

---

## 2. Node, Key, Child, Fan-out

Node는 Tree의 점 하나다. B-Tree 계열에서는 Node 하나에 여러 Key를 저장할 수 있다.

```text
            [20 | 40 | 60]       ← Node 하나
           /     |     |    \
          ↓      ↓     ↓     ↓
      [5|10] [25|30] [45|50] [70|80]
        ↑       ↑       ↑       ↑
      Node    Node    Node    Node
```

`20`, `40`, `60` 각각이 Node가 아니라 `[20 | 40 | 60]` 전체가 Node 하나다.

Fan-out은 한 Node에서 뻗어나가는 Child 수다.

```text
Key 1개 → 구간 2개 → Child 2개 → Fan-out 2
Key 2개 → 구간 3개 → Child 3개 → Fan-out 3
Key 3개 → 구간 4개 → Child 4개 → Fan-out 4
```

Internal Node에서 Key가 `k`개라면 최대 Child는 `k+1`개다. Leaf는 Child가 없으므로 이 관계는 Internal Node 기준이다.

---

## 3. Binary Search에서 M-way Search로

```text
Binary Tree
→ 자식을 최대 2개 가질 수 있다는 구조

Binary Search Tree
→ Binary Tree
  + Key 대소관계에 따른 탐색 규칙
```

이를 M방향으로 확장하면:

```text
M-way Tree
→ 자식을 최대 M개 가질 수 있음

M-way Search Tree
→ M-way Tree
  + 여러 Key의 대소관계에 따른 탐색 규칙
```

```text
       [20 | 40 | 60]
       /    |    |    \
      ↓     ↓    ↓     ↓
    <20   20~40 40~60  >60
```

하지만 M-way Search Tree만으로는 균형을 보장하지 않는다. 특정 부분이 계속 깊어질 수 있다.

---

## 4. B-Tree — 균형 잡힌 M-way Search Tree

B-Tree는 M-way Search Tree에 균형과 Node 점유 규칙을 추가한다.

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

m차 B-Tree의 일반적인 규칙은 다음과 같다.

```text
최대 Child = m
최대 Key   = m - 1

Root를 제외한 일반 Node
최소 Child = ceil(m / 2)
최소 Key   = ceil(m / 2) - 1
```

4차 B-Tree라면 최대 Child 4개, 최대 Key 3개다. B-Tree는 Node를 항상 100% 채우는 것이 아니라 **너무 비지 않도록 최소 점유율을 유지한다.**

---

## 5. 삽입과 삭제 — 점유 규칙을 유지하는 방법

### 삽입: Overflow → Split

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

부모도 Overflow이면 Split이 위로 전파되고, Root가 Split될 때만 Tree 전체 높이가 한 단계 증가한다.

> **삽입 = 아래에 넣고 → 넘치면 쪼개고 → 경계 Key를 위로 올린다.**

### 삭제: Underflow → Redistribution / Merge

삭제 후 최소 점유 조건을 만족하지 못하면 먼저 여유 있는 형제에게서 재분배한다.

```text
변경 전
           [30 | 60]
          /    |     \
        [ ]  [40|50] [70|80]

재분배 후
           [40 | 60]
          /    |     \
       [30]   [50]  [70|80]
```

형제도 최소 상태라 빌릴 수 없으면 부모의 경계 Key와 함께 Merge한다.

```text
많으면 → Split
부족하면 → Redistribution 또는 Merge
```

이 규칙 때문에 모든 Leaf의 Level과 Node 점유 조건이 유지된다.

---

## 6. B-Tree와 DB Page의 연결

B-Tree의 Node와 DB Page는 원래 다른 개념이다.

```text
Node
→ Tree의 논리적인 점 하나
→ B-Tree에서는 여러 Key와 Pointer를 포함 가능

DB Page
→ DBMS의 저장 / I/O 단위
```

DB에서는 Tree Node 하나를 Page 단위에 맞춰 저장하는 방식이 일반적으로 유리하다.

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

### Key 크기와 실질적인 Fan-out

이론의 m차 B-Tree에서 m은 논리적 차수다. Key 하나의 Byte 크기가 m의 정의를 바꾸는 것은 아니다.

하지만 실제 DB에서는 Page 공간이 유한하다.

```text
Page 크기 = 고정
      ↓
Key + Pointer Entry 크기 ↓
      ↓
Page(Node)에 더 많은 Entry 저장
      ↓
Child Pointer 수 ↑
      ↓
실질적인 Fan-out ↑
```

따라서 `Key가 작다`는 것은 Key 개수가 적다는 뜻이 아니라 **Key 하나가 차지하는 Byte가 작다**는 뜻이다.

### Fan-out과 I/O

```text
Fan-out ↑
→ Tree가 넓고 낮아짐
→ 검색 시 거치는 Node 수 ↓

Node ≈ Page
→ 접근 Page 수 ↓
→ Disk I/O ↓
```

Node 최소 점유율을 유지하는 것도 Page를 지나치게 비워두지 않고 Fan-out 활용도를 유지하는 효과가 있다.

> **B-Tree 규칙은 낮은 Tree 높이와 높은 Page 활용도로 이어지고, DB에서는 이것이 Page I/O 감소로 연결된다.**

---

## 7. Split / Merge와 실제 Page 공간

DB에서 Node가 Page에 대응하면 이론의 Overflow / Underflow는 실제 Page 공간 관리와 연결된다.

```text
Leaf Page
┌────────────────────────┐
│ Entry │ Entry │ Entry │ ← 가득 참
└────────────────────────┘

새 Entry 삽입
       ↓
수용 공간 부족
       ↓
Page Split
       ↓
┌───────────┐   ┌───────────┐
│ Entry ... │   │ Entry ... │
└───────────┘   └───────────┘
   Page A          Page B
```

Split은 Page 할당, Entry 이동, 부모의 경계 Key 갱신 같은 비용을 동반할 수 있다.

---

## 8. B+Tree — Internal은 길 안내, Record Entry는 Leaf

B-Tree에서는 Internal Node에도 Record Entry가 존재할 수 있다. B+Tree는 역할을 분리한다.

```text
Internal Node
→ Search Key + Child Pointer 중심
→ 길 안내

Leaf Node
→ Record Entry 집중
→ 검색 결과 측 정보
```

### Record Entry

Record Entry는 Search Key에 대응해 Index에 저장되는 최종 정보다.

```text
Clustered B+Tree
→ Leaf Record Entry = 실제 Row

Non-clustered B+Tree
→ Leaf Record Entry = Row Locator 등
```

따라서 Record Entry를 항상 실제 Row와 동일시하지 않는다.

### Internal Node와 Fan-out

```text
Internal Page(Node)
┌──────────────────────────────┐
│ Key│Ptr│Key│Ptr│Key│Ptr ... │
└──────────────────────────────┘
```

B+Tree에서는 Internal에서 Record Entry를 제거하므로 **Node 자체가 작아지는 것이 아니라 Entry 하나가 작아진다.**

```text
Internal Entry 크기 ↓
→ 같은 Page에 Key / Pointer를 더 많이 저장
→ Fan-out ↑
→ Tree 높이를 낮게 유지하기 유리
```

### Clustered B+Tree의 Leaf

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

Internal과 Leaf는 Entry 구조가 다르므로 같은 Page 크기라도 Page당 수용 가능한 Entry 수와 Split 시점이 다를 수 있다.

---

## 9. B+Tree의 Leaf 연결과 범위 검색

B+Tree는 Leaf Node들을 Key 순서로 연결한다.

```text
Leaf A           Leaf B           Leaf C
[10,20,30]  ↔  [40,50,60]  ↔  [70,80,90]
```

범위 `30~80`을 찾는다면 먼저 `30`이 있는 Leaf까지 Tree를 탐색한 뒤 Leaf 연결을 따라간다.

```text
Tree 탐색
→ 30이 있는 Leaf
→ 30
→ 40,50,60
→ 70,80
```

따라서 B+Tree의 핵심 효과는 두 가지다.

```text
① Internal에서 Record Entry 제거
   → Entry 작음
   → Fan-out 증가

② Record Entry를 Leaf에 집중 + Leaf 연결
   → 순차 / 범위 검색 유리
```

---

## 10. B-Tree와 B+Tree의 Split 차이

B-Tree에서 Split된 중간 Key는 부모로 이동할 수 있다.

```text
B-Tree
[10 | 20 | 30]
      ↓ Split
     [20]
     /  \
  [10] [30]

20은 부모로 이동
```

B+Tree의 Leaf에서는 모든 Record Entry가 Leaf에 남아야 하므로 경계 Key를 부모에 **복사**한다.

```text
B+Tree Leaf
[10 | 20 | 30 | 40]
        ↓ Split

       [30]            ← 탐색용 Key 복사
       /  \
[10 | 20] ↔ [30 | 40] ← Record Entry는 Leaf에 유지
```

```text
B-Tree Split
→ 중간 Key가 부모로 이동 가능

B+Tree Leaf Split
→ 경계 Key를 부모에 복사
→ Leaf의 Record Entry는 유지
```

그래서 B+Tree에서는 같은 Key가 Internal의 탐색 Key와 Leaf의 Record Entry에 함께 나타날 수 있다.

---

## 11. B*Tree — 더 높은 Node 점유율

B/B+Tree에서는 Node가 가득 차면 Split할 수 있다. B*Tree는 바로 Split하기 전에 **인접 형제 Node와 먼저 재분배**한다.

```text
Node A           Node B
가득 참          여유 있음
   ↓
형제와 Redistribution
   ↓
새 Node 생성을 피할 수 있음
```

형제까지 가득 찼다면 인접한 두 Node의 Entry를 새 Node 하나를 추가한 총 세 Node로 재분배한다.

```text
기존 2 Node
[A B C] [D E F]
     + 새 Entry
        ↓
3 Node로 재분배
[A B] [C D] [E F ...]
```

`2 → 3`은 Node 하나를 세 조각으로 나눈다는 뜻이 아니라 **인접한 두 Node의 내용을 세 Node에 다시 나눠 담는다는 뜻**이다.

개념적으로:

```text
B-Tree
→ 최소 점유율 약 1/2

B*Tree
→ 최소 점유율 약 2/3
```

즉 2/3은 Split 횟수가 아니라 **Node가 최소한 어느 정도 채워져 있도록 유지하는가에 대한 점유율**이다.

```text
B*Tree
→ 형제 재분배 우선
→ Page 공간 활용도 ↑
→ 불필요한 Split 감소
```

---

## 12. T-Tree — Main Memory DB 관점

Disk 기반 DB에서는 Page I/O가 비싸기 때문에 B-Tree 계열의 높은 Fan-out과 낮은 높이가 큰 장점이다.

Main Memory DB에서는 Disk Page I/O라는 전제가 약해진다. T-Tree는 이런 환경을 고려한 전통적인 Index 구조다.

```text
B-Tree 계열
→ M-way
→ 높은 Fan-out
→ Page I/O 감소에 유리

T-Tree
→ Binary 구조
→ Node 내부에 여러 Record Entry 저장
→ 메모리 내 탐색을 고려
```

### 여러 Entry를 가지지만 Binary인 이유

```text
             [30 40 50 60]
              /         \
             ↓           ↓
           Left         Right
```

Node 내부에 여러 값이 있어도 이 값들을 B-Tree처럼 여러 Child 방향을 만드는 경계로 쓰지 않는다. Node 전체가 하나의 정렬된 범위를 이룬다.

```text
Node = [30 40 50 60]

찾는 값 < 30
→ Left Child

찾는 값 > 60
→ Right Child

30 ≤ 찾는 값 ≤ 60
→ 현재 Node 내부 검색
```

따라서 M-way 여부는 Node 안의 Key 개수가 아니라 **Child 분기 수**로 구분해야 한다.

### 모든 Node가 Record Entry를 저장할 수 있다

```text
              [40 50 60]
               /      \
              ↓        ↓
        [10 20 30]   [70 80 90]
```

B+Tree처럼 `Internal = 길 안내, Leaf = Record Entry`로 역할을 나누지 않고 각 Node가 여러 Record Entry를 저장할 수 있다. 따라서 중간 Node에서 원하는 값을 찾고 검색을 끝낼 수도 있다.

T-Tree는 Binary 균형 탐색 구조의 단순한 분기와 Node 내부 다중 Entry 저장을 결합한 절충으로 이해하면 된다.

다만 현대 Main Memory DB가 반드시 T-Tree를 사용한다는 뜻은 아니다. Cache locality와 다양한 Index 구조까지 고려하면 구현 선택은 달라질 수 있다.

---

## 13. 최종 비교

| 구조 | 분기 | Record Entry 위치 | 핵심 목적 / 특징 |
|---|---:|---|---|
| BST | 최대 2 | 각 Node | Key 대소관계 기반 이진 탐색