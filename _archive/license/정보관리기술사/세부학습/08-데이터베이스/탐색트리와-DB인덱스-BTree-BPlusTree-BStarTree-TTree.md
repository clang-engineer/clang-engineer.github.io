# 탐색트리와 DB Index — B-Tree, B+Tree, B*Tree, T-Tree

이 문서는 DB Index에서 사용하는 Tree 구조가 어디서 나왔고, 왜 B-Tree 계열이 Disk 기반 DB에 적합하며 T-Tree가 Main Memory DB 관점에서 등장했는지 이해하기 위한 문서다.

단순히 B-Tree의 규칙을 외우기보다 `Binary → M-way → B-Tree → B+Tree / B*Tree → T-Tree`의 관계와, Tree의 논리적 구조가 DB Page와 I/O에 어떻게 연결되는지를 중심으로 본다.

---

## 1. 가장 먼저 잡을 큰 그림

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

두 균형화 흐름을 먼저 구분한다.

```text
Binary Search Tree
→ 자식 최대 2개
→ 균형을 강화
→ AVL / Red-Black

M-way Search Tree
→ 자식 최대 M개
→ 균형과 Node 점유 규칙을 강화
→ B-Tree
```

T-Tree는 B-Tree의 후속 버전이 아니다. Main Memory DB를 고려해 Binary Search Tree 계열의 구조와 Node 내부 다중 Entry 저장을 결합한 별도 방향으로 이해한다.

---

## 2. Node, Key, Child, Fan-out부터 분리한다

### Node

Node는 Tree의 점 하나다.

Binary Tree에서는 보통 다음처럼 Node 하나가 하나의 Key를 가진 모습이 익숙하다.

```text
          [30]       ← Node 하나
         /    \
      [20]    [50]   ← 각각 Node 하나
```

하지만 B-Tree 계열에서는 **Node 하나에 여러 Key를 저장할 수 있다.**

```text
            [20 | 40 | 60]       ← 이것 전체가 Node 하나
           /     |     |    \
          ↓      ↓     ↓     ↓
      [5|10] [25|30] [45|50] [70|80]
        ↑       ↑       ↑       ↑
      Node    Node    Node    Node
```

즉 `20`, `40`, `60` 각각이 Node인 것이 아니다.

```text
[20 | 40 | 60]
 ↑     ↑    ↑
 Key   Key  Key

└──────────────┘
    Node 하나
```

### Fan-out

Fan-out은 **한 Node에서 뻗어나가는 Child 수**다.

```text
Key 1개
        [50]
        /  \
       ↓    ↓
→ Child 2개
→ Fan-out 2

Key 2개
       [30 | 70]
       /    |    \
      ↓     ↓     ↓
→ Child 3개
→ Fan-out 3
```

Internal Node에서 Key가 `k`개라면 일반적으로 구간은 `k+1`개로 나뉘므로 Child도 최대 `k+1`개가 된다.

```text
Key 수 = k
Child 수 = k + 1
Fan-out = Child 수
```

Leaf는 Child가 없으므로 이 관계는 Internal Node를 이해하기 위한 것이다.

---

## 3. Binary Tree에서 M-way Search Tree까지

### Binary Tree와 Binary Search Tree

```text
Binary Tree
→ 자식을 최대 2개 가질 수 있다는 구조적 정의

Binary Search Tree
→ Binary Tree
  + Key 대소관계에 따른 탐색 규칙
```

### M-way Tree와 M-way Search Tree

같은 관계를 M방향으로 확장할 수 있다.

```text
M-way Tree
→ 자식을 최대 M개 가질 수 있음

M-way Search Tree
→ M-way Tree
  + 여러 Key의 대소관계에 따른 탐색 규칙
```

예를 들어:

```text
       [20 | 40 | 60]
       /    |    |    \
      ↓     ↓    ↓     ↓
    <20   20~40 40~60  >60
```

여러 Key가 탐색 공간을 여러 구간으로 나누고, 각 구간이 Child 방향이 된다.

하지만 M-way Search Tree라는 사실만으로 Tree가 균형을 유지하는 것은 아니다. 삽입 상태에 따라 특정 부분이 깊어질 수 있다.

```text
M-way Search Tree
→ 여러 방향 탐색은 가능
→ 균형은 별도 보장하지 않음
```

이 문제에서 B-Tree가 나온다.

---

## 4. B-Tree — M-way Search Tree에 균형 규칙을 추가

B-Tree의 핵심은 검색 규칙 자체보다 **Tree가 한쪽으로 마음대로 자라지 못하도록 구조를 계속 조정하는 것**이다.

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

### m차 B-Tree

이론적으로 m차 B-Tree라면:

```text
최대 Child = m
최대 Key   = m - 1

Root를 제외한 일반 Node
최소 Child = ceil(m / 2)
최소 Key   = ceil(m / 2) - 1
```

예를 들어 4차 B-Tree라면:

```text
Child : 최소 2 ~ 최대 4
Key   : 최소 1 ~ 최대 3
```

B-Tree는 항상 Node를 100% 채우는 구조가 아니다. **너무 비지 않도록 최소 점유율을 강제하고, 허용 범위 안에서 유지한다.**

```text
Node
├─ 너무 가득 참   → Split
├─ 허용 범위      → 유지
└─ 너무 비어 있음 → Redistribution / Merge
```

---

## 5. B-Tree 삽입 — 많으면 쪼갠다

4차 B-Tree에서 한 Node의 최대 Key가 3개라고 하자.

```text
[10 | 20 | 30]
```

여기에 `40`을 넣으면 최대치를 넘는다.

```text
[10 | 20 | 30 | 40]
          ↑
       Overflow
```

B-Tree는 중간 Key를 부모로 올리고 Node를 나눈다.

```text
        [20]
       /    \
    [10]   [30 | 40]
```

핵심은 특정 가지를 아래로 계속 늘리는 대신 **옆으로 분할하고 경계 Key를 위로 올린다는 것**이다.

부모도 가득 차 있으면 부모 역시 Split하고, 필요하면 Root까지 전파된다.

```text
Leaf 삽입
   ↓
Overflow
   ↓
Split
   ↓
중간 Key를 부모로
   ↓
부모도 Overflow?
   ↓
위로 반복
```

Root가 Split될 때 새로운 Root가 생기면서 Tree 전체 높이가 한 단계 증가한다.

> **B-Tree 삽입 = 아래에 넣고 → 넘치면 쪼개고 → 가운데를 위로 올린다.**

---

## 6. B-Tree 삭제 — 부족하면 빌리거나 합친다

삭제 후 Node가 최소 점유 조건보다 비면 Underflow가 발생한다.

```text
삭제
 ↓
Underflow
```

먼저 인접한 형제 Node에 여유가 있으면 부모의 경계 Key를 사이에 두고 재분배(Redistribution)한다.

```text
변경 전

           [30 | 60]
          /    |     \
        [ ]  [40|50] [70|80]

재분배

           [40 | 60]
          /    |     \
       [30]   [50]  [70|80]
```

형제도 최소 상태라 빌릴 수 없으면 부모의 경계 Key와 함께 Merge한다.

```text
[ ] + 부모의 30 + [40]
        ↓
     [30 | 40]
```

Merge로 부모까지 Underflow가 발생하면 같은 처리가 위로 전파될 수 있다.

```text
삽입                     삭제

Overflow                  Underflow
   ↓                         ↓
Split                   Redistribution
   ↓                      또는 Merge
부모로 Key ↑                 ↓
   ↓                     부모 Key ↓
위로 전파 가능             위로 전파 가능
```

> **많으면 Split, 부족하면 빌리거나(Redistribution) 합친다(Merge).**

---

## 7. B-Tree와 DB Page가 연결되는 지점

여기까지는 B-Tree라는 논리적 자료구조의 이야기다. DB에 구현하면 **DB Page라는 실제 저장·I/O 단위**가 등장한다.

B-Tree 이론에서 Node와 Page는 같은 개념이 아니지만, DB에서는 일반적으로 Tree Node 하나를 Page 단위에 맞춰 저장하는 방식이 유리하다.

```text
논리적 B-Tree

          [20 | 40 | 60]    ← Node 하나

              ↓ 저장

DB Page
┌─────────────────────────┐
│ 20 | 40 | 60 | Ptr ... │
└─────────────────────────┘
```

즉 다음처럼 기억한다.

```text
Node
→ Tree의 논리적인 점 하나
→ B-Tree에서는 여러 Key와 Pointer를 포함 가능

DB Page
→ DBMS의 저장 / I/O 단위

DB 구현
→ Node 하나 ≈ Page 하나가 되도록 구성하는 것이 일반적
```

여기서 `Node 하나 ≈ Page 하나`는 Level 전체가 Page 하나라는 뜻이 아니다. 한 Level에는 여러 Node가 존재할 수 있고, 검색할 때는 필요한 Child Node(Page) 하나를 선택해 내려간다.

---

## 8. Key 크기, Page, Fan-out, I/O의 연결

B-Tree 이론에서는 m차를 먼저 정한다.

```text
m차 B-Tree
→ 최대 Fan-out = m
→ 최대 Key = m - 1
```

이때 Key 하나의 Byte 크기는 논리적인 m의 정의와 직접 관계없다.

하지만 실제 DB에서는 Page 공간이 유한하므로 Key와 Pointer가 차지하는 크기가 실질적인 Fan-out에 영향을 준다.

```text
DB Page 크기 = 고정
        ↓
Key + Pointer Entry가 작음
        ↓
Page(Node) 하나에 더 많은 Entry 저장
        ↓
더 많은 Child Pointer
        ↓
실질적인 Fan-out 증가
```

따라서 `Key가 작다`는 표현은 **Key 개수가 적다는 뜻이 아니라 Key 하나가 차지하는 Byte가 작다는 뜻**이다.

```text
Key 하나의 Byte 크기 ↓
→ Page당 Key 개수 ↑
→ Child Pointer 수 ↑
→ Fan-out ↑
```

Fan-out이 커지면 Tree가 넓고 낮아진다.

```text
Fan-out ↑
→ Tree 높이 ↓
→ 검색 시 거치는 Node 수 ↓

Node ≈ Page
→ 접근 Page 수 ↓
→ Disk I/O ↓
```

B-Tree의 최소 점유율 규칙도 같은 방향으로 작용한다.

```text
Node 최소 점유율 유지
→ Page를 지나치게 비워두지 않음
→ Node당 Key / Child 수 확보
→ Fan-out 활용도 유지
→ Tree를 낮게 유지
```

따라서 DB 관점에서 B-Tree의 효과는 다음 두 가지로 기억할 수 있다.

> **Tree 높이가 낮아 계층을 내려가며 접근하는 Page 수가 적고, Node 점유율을 유지해 Page 하나당 탐색 정보를 효율적으로 사용한다.**

---

## 9. DB에서 Split / Merge는 Page 공간 관리와 연결된다

이론에서는 다음처럼 표현한다.

```text
Node Overflow  → Split
Node Underflow → Redistribution / Merge
```

DB에서는 Node가 Page에 대응하므로 이 규칙이 실제 Page 공간 문제로 구체화된다.

```text
Leaf Page
┌────────────────────────┐
│ Row │ Row │ Row │ Row │ ← 거의 가득 참
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

Split은 단순한 논리적 Tree 변형만이 아니라 Page 할당, Entry 이동, 부모 Node의 경계 Key 갱신 등의 실제 비용으로 이어질 수 있다.

따라서 Page 공간을 얼마나 채우고 언제 Split / Merge할 것인지는 DB Index의 공간 활용과 변경 비용에 직접 연결된다.

---

## 10. B+Tree — Internal은 길 안내, Record Entry는 Leaf

B-Tree에서는 Internal Node에도 Record Entry가 존재할 수 있다.

B+Tree는 역할을 분리한다.

```text
B+Tree

Internal Node
→ Search Key + Child Pointer 중심
→ 길 안내

Leaf Node
→ Record Entry 집중
→ 검색 결과 측 정보
```

### Record Entry란 무엇인가

Record Entry는 Search Key에 대응해 Index에 저장되는 최종 정보다.

```text
[Search Key | Record Entry]
```

DB Index 구조에 따라 내용은 달라질 수 있다.

```text
Clustered B+Tree
→ Leaf Record Entry = 실제 Row

Non-clustered B+Tree
→ Leaf Record Entry = Row Locator 등 원본 Row를 찾기 위한 정보
```

따라서 Record Entry를 무조건 실제 Row와 동일시하지 않는다.

### Internal Node의 Fan-out 증가

B+Tree의 Internal Node에서는 Record Entry를 Leaf로 보내고 탐색용 Key와 Child Pointer 중심으로 구성한다.

```text
Internal Node ≈ Index Page

┌──────────────────────────────┐
│ Key│Ptr│Key│Ptr│Key│Ptr ... │
└──────────────────────────────┘
```

중요한 것은 **Internal Node(Page) 자체가 작아지는 것이 아니라, Node 안의 Entry 하나가 작아진다는 것**이다.

```text
Internal Entry 크기 ↓
→ 같은 Page(Node)에 더 많은 Key / Pointer 저장
→ Fan-out ↑
→ Tree 높이를 낮게 유지하기 유리
```

### Clustered B+Tree의 Leaf

Clustered B+Tree의 Leaf Node는 실제 Row들을 저장하는 Data Page 역할을 한다.

```text
Leaf Node ≈ Data Page

┌──────────────────────────────┐
│ Row 10                       │
│ Row 20                       │
│ Row 30                       │
│ Row 40                       │
└──────────────────────────────┘
```

즉:

```text
Leaf Node 하나 ≠ Row 하나
Leaf Node 하나 = 여러 Row를 담는 Node(Page)
```

Leaf도 Page 크기의 제약을 받는다. Row가 크면 한 Leaf Page에 들어가는 Row 수가 줄고, Row가 작으면 더 많은 Row를 저장할 수 있다.

Internal Node와 Leaf Node의 Entry 구조가 다르므로 같은 Page 크기를 사용하더라도 **Page당 수용 가능한 Entry 수와 Split이 발생하는 시점은 서로 다를 수 있다.**

---

## 11. B+Tree의 Leaf 연결과 범위 검색

B+Tree는 Leaf Node들을 Key 순서로 연결한다.

```text
Leaf A           Leaf B           Leaf C
[10,20,30]  ↔  [40,50,60]  ↔  [70,80,90]
```

`30~80` 범위를 조회한다면 먼저 Tree를 타고 `30`이 있는 Leaf를 찾