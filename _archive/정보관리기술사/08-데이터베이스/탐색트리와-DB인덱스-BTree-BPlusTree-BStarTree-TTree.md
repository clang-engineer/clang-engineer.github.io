# 탐색트리와 DB Index — B-Tree, B+Tree, B*Tree, T-Tree

## 이 문서의 개념지도

```text
탐색트리에서 구분할 질문
├─ 어디로 내려갈 것인가?
│   └─ 탐색 규칙: Key 정렬 + 자식 서브트리별 값의 범위
├─ 탐색 경로를 어떻게 짧게 유지할 것인가?
│   ├─ Binary Search Tree → AVL / Red-Black의 균형 유지
│   └─ M-way Search Tree → B-Tree의 균형 + 최소 점유 규칙
└─ 어떤 저장 환경과 목적에 맞출 것인가?
    ├─ DB Page 중심 → 높은 Fan-out · 낮은 높이
    │   ├─ B+Tree → Internal 탐색 / Leaf 결과 · 범위 검색
    │   └─ B*Tree → 형제 재분배 · Node 점유율 강화
    └─ Main Memory 중심 → T-Tree
        └─ 이진 균형 구조 + Node당 여러 Entry

※ B+Tree와 B*Tree는 서로 다른 개선 축이며 필수 발전 순서가 아니다.
※ Tree 구조와 Clustered / Non-clustered라는 Row 저장 관계도 별개다.
```

이 문서는 **탐색 규칙 → 균형과 점유 규칙 → DB Page와 I/O → B+Tree / B*Tree의 차이 → T-Tree의 설계 관점**을 연결해 이해하기 위한 세부학습 문서다. 상단 지도는 질문별 위치를, 아래 계보는 구조 사이의 관계를 보여준다.

| 구조 | 복습할 핵심 차이 |
|---|---|
| M-way Search Tree | Key 정렬·자식 서브트리의 값 범위로 탐색 방향 결정 |
| B-Tree | 모든 Leaf 같은 Level + 최소 점유 규칙 → 높이 통제 |
| B+Tree | Internal 탐색 / Leaf 결과 Entry + Leaf 연결 → 범위 검색 |
| B*Tree | 형제 재분배 우선·2→3 분할 → 점유율 강화 |
| T-Tree | 이진 분기 + Node당 여러 Entry → 메모리 환경 고려 |

**비용 연결:** 작은 Key → Fan-out 확대 가능 → 경로 Page 감소. 다만 **Page 접근 수와 물리적 디스크 읽기 횟수는 다르다**(Buffer Pool 캐시).

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

이 그림은 주요 구조의 관계를 구분한 개념도이지, 상호 배타적인 분류표나 역사적 개발 순서가 아니다. Binary Tree도 최대 자식 수를 2로 제한한 다진 트리로 볼 수 있다.

```text
BST의 균형화 → AVL / Red-Black
M-way Search Tree의 균형화 + 점유 규칙 → B-Tree
```

T-Tree는 B-Tree의 후속 버전이 아니라 Main Memory DB를 고려한 별도 방향이다. AVL의 이진 균형 구조와 B-Tree의 Node당 다중 Entry 아이디어를 함께 활용한다. 구체적인 구조는 10절에서 설명한다. [6]

---

## 2. Node와 Fan-out

Node(노드)는 Tree의 점 하나이고, Key(키)는 탐색의 기준값이다. B-Tree 계열에서는 Node 하나에 여러 Key를 저장할 수 있다.

```text
            [20 | 40 | 60]       ← Node 하나
           /     |     |    \
          ↓      ↓     ↓     ↓
      [5|10] [25|30] [45|50] [70|80]
```

`20`, `40`, `60` 각각이 Node가 아니라 `[20 | 40 | 60]` 전체가 Node 하나다.

Child는 자식 Node다. Child가 있는 Node를 Internal Node, Child가 없는 Node를 Leaf Node라고 한다. Fan-out은 한 Node에서 뻗어나가는 Child 수이며, 문맥에 따라 수용 가능한 최대 자식 수를 가리키기도 한다.

```text
Key 1개 → 값의 구간 2개 → 자식 자리 최대 2개
Key 2개 → 값의 구간 3개 → 자식 자리 최대 3개
Key 3개 → 값의 구간 4개 → 자식 자리 최대 4개
```

정렬된 Key `k`개는 `k+1`개의 값 구간을 만든다. 일반 M-way Search Tree에서는 일부 자식 자리가 비어 있을 수 있지만, **기본 B-Tree의 Internal Node는 Key가 `k`개이면 실제 Child가 `k+1`개다.** Leaf에는 Child가 없다.

---

## 3. M-way Search Tree와 B-Tree

### 자식 수 제한과 탐색 규칙은 다르다

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

M-way Tree라는 말만으로는 **값을 어디에 배치해야 하는지**가 정해지지 않는다. 탐색 규칙을 추가한다는 것은 **값의 크기에 따라 저장 위치를 정해, 검색할 때 어느 Child로 내려갈지 알 수 있게 한다**는 뜻이다.

### 탐색 규칙 = Key 정렬 + 서브트리별 범위 분리

중복 Key가 없는 경우를 가정한다. M-way Search Tree에서는 Node 안에 최대 `M-1`개의 Key를 오름차순으로 두고, 그 Key가 나누는 구간에 맞춰 자식 서브트리의 값을 배치한다.

현재 Node가 `[20 | 40 | 60]`이면 다음과 같다.

| 자식 위치 | 해당 서브트리의 모든 Key가 만족할 범위 |
|---|---|
| 첫 번째 | `Key < 20` |
| 두 번째 | `20 < Key < 40` |
| 세 번째 | `40 < Key < 60` |
| 네 번째 | `60 < Key` |

이 조건은 **바로 아래 Child 하나뿐 아니라 그 아래 전체 서브트리**에 적용된다. 각 Child에서도 같은 규칙을 반복해서 지킨다. 중복 Key를 허용하는 구현에서는 같은 값의 배치·식별 규칙을 별도로 정한다.

2절의 Tree에서 `25`를 찾는 과정을 따라가면 규칙의 의미가 드러난다.

```text
25 검색
  ↓
현재 Node [20 | 40 | 60]과 비교
  ↓ 20 < 25 < 40
두 번째 Child [25 | 30]로 이동
  ↓
25 발견
```

다른 세 서브트리는 볼 필요가 없다. 현재 Node에서 같은 Key를 찾으면 검색을 끝낼 수 있고, 없으면 해당 구간의 Child로 내려간다. 그 Child도 없으면 검색 실패다. B+Tree처럼 Internal을 길 안내에만 쓰는 구조의 차이는 7·8절에서 구분한다.

삽입할 때도 이 규칙을 지켜야 한다. `25`를 네 번째 서브트리에 넣으면 검색은 두 번째로 내려가므로 값을 찾지 못한다. **탐색 규칙은 검색 절차만이 아니라 저장 상태가 지켜야 하는 배치 규칙**이다.

### B-Tree는 균형과 점유 규칙을 추가한다

탐색 규칙은 **어느 방향을 찾을지**를 정하지만, 경로가 길어지는 것까지 막지는 않는다. M-way Search Tree만으로는 균형을 보장하지 않는다. B-Tree는 여기에 균형과 Node 점유 규칙을 추가한다. [1]

```text
M-way Search Tree
        +
모든 Leaf의 Level 동일
        +
Node 최소/최대 점유 규칙
        ↓
      B-Tree
        │ 삽입·삭제 후 조건 복구
        ├─ Overflow → Split
        └─ Underflow → Redistribution / Merge
```

이 문서에서 **차수 `m`은 최대 Child 수**다. 최대 Key 수는 `m-1`이며, `ceil(m/2)`는 `m/2`를 올림한 값이다. 문헌마다 차수를 정의하는 방식이 다를 수 있으므로 이 기준으로 읽는다.

| Node 구분 | Child 수 | Key 수 |
|---|---|---|
| Root를 제외한 Internal Node | `ceil(m/2)` ~ `m` | `ceil(m/2)-1` ~ `m-1` |
| Root를 제외한 Leaf Node | `0` | `ceil(m/2)-1` ~ `m-1` |
| Internal Node인 Root | `2` ~ `m` | `1` ~ `m-1` |
| Tree의 유일한 Node인 Root | `0` | `0` ~ `m-1` |

마지막 행의 Key `0`개는 빈 Tree를 Root 하나로 표현하는 경우다. **최소 Child 수 조건은 Internal Node의 조건이지 Leaf의 조건이 아니다.** [1]

B-Tree는 Node를 항상 100% 채우는 것이 아니라 **너무 비지 않도록 최소 점유율을 유지한다.** 예를 들어 4차 B-Tree의 비루트 Node는 Key를 1~3개 가지며, Internal Node라면 Child를 2~4개 가진다.

---

## 4. B-Tree의 삽입과 삭제

### 삽입

탐색 규칙을 따라 삽입할 Leaf를 찾고, Node 내부의 정렬 순서를 유지해 Key를 넣는다. 4차 B-Tree라면 한 Node의 최대 Key는 3개다. 다음은 삽입 후 초과를 처리하는 예다.

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

> **삽입 = 위치를 찾고 → 정렬해 넣고 → 넘치면 Split → 중간 Key를 위로 올린다.**

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

기본 B-Tree의 재분배에서는 부모의 구분 Key도 함께 조정한다. Merge할 때는 형제 Node와 그 사이의 부모 Key를 합친다. 부모에서도 Underflow가 생기면 복구가 위로 이어질 수 있고, Root에 Key가 없어지고 Child 하나만 남으면 그 Child를 새 Root로 삼아 높이가 줄어든다.

> **많으면 Split, 부족하면 빌리거나(Redistribution) 합친다(Merge). 탐색 규칙과 균형·점유 조건은 변경 후에도 유지한다.**

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
│ 20 | 40 | 60 | Ptr ...   │
└─────────────────────────┘
```

즉 `Node 하나 ≈ Page 하나`로 이해할 수 있다. Level 전체가 Page 하나라는 뜻은 아니다. Entry는 Node 안에 저장하는 항목이며, Key와 참조 정보 등으로 구성된다.

### Key 크기와 Fan-out

이론의 m차 B-Tree에서 Key의 Byte 크기가 m을 결정하는 것은 아니다. 하지만 실제 DB에서는 Page 공간이 유한하다.

```text
Page 크기 고정
→ Key + Pointer Entry 크기 ↓
→ Page(Node)에 더 많은 Entry 저장 가능
→ Child Pointer 수 ↑
→ 수용 가능한 Fan-out ↑
```

여기서 `Key가 작다`는 Key 개수가 적다는 뜻이 아니라 **Key 하나의 Byte 크기가 작다**는 뜻이다. 실제 Fan-out은 Page의 점유 상태에도 영향을 받는다.

### Fan-out과 페이지 접근

```text
같은 데이터 규모에서 Fan-out ↑
→ Tree를 넓고 낮게 유지하기 유리
→ 검색 경로의 Node 수 감소 가능

Node ≈ Page
→ 검색에 필요한 Page 접근 수 감소
→ 저장장치에서 읽어야 할 Page를 줄이는 데 유리
```

Node 최소 점유율 유지도 Page를 지나치게 비워두지 않아 Fan-out 활용도를 유지한다.

### DB Page와 OS Page는 다른 계층의 관리 단위다

DBMS는 OS 위에서 동작하는 소프트웨어이며, 테이블·인덱스의 저장공간을 **DB Page**라는 단위로 조직한다. 반면 OS의 **Page**는 프로세스의 가상주소 공간을 관리하고 Physical Frame에 매핑하기 위한 단위다. 이름이 같아도 동일한 객체나 1:1 대응 관계는 아니다.

```text
DBMS: Database File의 DB Page (저장·인덱스 단위)
          │ 필요하면 저장장치에서 읽기 I/O
          ▼
DBMS: Buffer Pool의 DB Page (메모리에 캐시된 내용)
          │ 버퍼 풀도 프로세스의 메모리 영역
          ▼
OS: Virtual Page → Physical Frame (주소 변환·메모리 관리)
```

예를 들어 DB Page가 16KB, OS Page가 4KB라면 DB Page의 내용이 메모리에서 여러 OS Page에 걸쳐 있을 수 있다. **DB Page를 읽는 I/O와 OS의 Page Fault는 서로 다른 사건**이며, DB Page가 Buffer Pool에 없다고 해서 반드시 OS Page Fault가 발생한다는 뜻은 아니다.

운영체제의 Page / Frame과 가상메모리 개념은 [메모리 할당·Paging·Virtual Memory](../01-컴퓨터-구조/메모리-할당-Paging-Virtual-Memory.md)에서 이어서 확인한다.

### Page 접근 수와 물리적 읽기 I/O는 같지 않다

DBMS는 자주 사용하는 Page를 메모리에 보관한다. 예를 들어 InnoDB의 Buffer Pool은 테이블·인덱스 Page를 캐시한다. 필요한 Page가 이미 있으면 저장장치에서 다시 읽지 않고 메모리에서 접근한다. [2]

```text
검색 경로: Root → Internal → Leaf

Root Page      → Buffer Pool에 있음
Internal Page  → Buffer Pool에 있음
Leaf Page      → Buffer Pool에 없음, 읽기 필요

접근하는 인덱스 Page는 3개
새로 읽어야 하는 인덱스 Page는 1개
```

이 예는 인덱스 탐색 경로만 본 것이다. Row Locator를 따라 원본 Row에 접근하는 비용 등은 별도다.

> **균형과 높은 Fan-out은 탐색 경로를 짧게 만든다. 실제 물리적 읽기 I/O는 그 경로의 Page가 메모리에 있는지에 따라서도 달라진다.**

---

## 6. Split / Merge와 Page 공간

DB에서 Node가 Page에 대응하면 Overflow / Underflow는 실제 Page 공간 관리와 연결된다.

```text
Leaf Page
┌────────────────────────┐
│ Entry │ Entry │ Entry  │ ← 가득 참
└────────────────────────┘

새 Entry 삽입
→ 수용 공간 부족
→ Page Split
→ 새 Page 할당 + Entry 이동 + 부모 경계 Key 갱신
```

따라서 Split / Merge는 논리적인 Tree 변형이면서 실제 저장공간 관리 비용이기도 하다. 검색 경로를 짧게 유지하는 대신, 삽입·삭제에서는 구조 유지 비용을 지불한다.

다만 **교과서의 최소 점유 규칙과 실제 DBMS의 Page 관리 정책을 그대로 동일시하지 않는다.** 가변 길이 Entry, 동시 접근, 공간 회수 정책 등에 따라 처리 방식이 달라질 수 있다.

예를 들어 PostgreSQL 18의 B-tree 구현은 부분적으로 빈 Page들을 병합하지 않고, 항목이 완전히 없어진 Page의 삭제를 검토한다. 구현 문서는 항목을 옆 Page로 옮기면 반대 방향으로 진행 중인 스캔이 이를 놓칠 수 있다는 이유를 설명한다. 여기서는 제품별 절차보다 **이론의 점유 조건과 구현의 공간 관리 정책이 다를 수 있다는 경계**를 기억한다. [3]

---

## 7. B+Tree — Internal과 Leaf의 역할 분리

B-Tree에서는 Internal Node에도 검색 결과를 얻기 위한 Record Entry가 존재할 수 있다. B+Tree는 역할을 분리한다.

```text
Internal Node
→ Search Key + Child Pointer
→ 길 안내

Leaf Node
→ Record Entry
→ 검색 결과를 얻기 위한 정보
```

Record Entry는 Search Key에 대응해 인덱스에 저장하는 정보다. **B+Tree에서는 Internal의 Key와 일치해도 거기서 결과 탐색을 끝내지 않고 Leaf까지 내려간다.** [1]

```text
Clustered B+Tree
→ Leaf Record Entry = 실제 Row를 저장하는 정보

Non-clustered B+Tree
→ Leaf Record Entry = Search Key + Row Locator 등
```

Row Locator는 원본 Row를 찾아가기 위한 정보다. 다음 Tree Page로 내려가는 **Child Pointer와 역할이 다르며, 반드시 물리 주소일 필요도 없다.**

예를 들어 기본키가 정의된 InnoDB 테이블의 보조 인덱스는 보조 인덱스 Key와 기본키 값을 저장한다. 원본 Row가 더 필요하면 얻은 기본키로 클러스터 인덱스를 탐색한다. [4]

```text
보조 인덱스의 Leaf
[name='철수' | 기본키 ID=30]
                  ↓ 원본 Row가 필요할 때
ID=30으로 클러스터 인덱스 탐색
                  ↓
              실제 Row
```

따라서 **B+Tree라는 구조만으로 Leaf에 실제 Row가 있는지, Row Locator가 있는지가 결정되지는 않는다.** 저장 관계와 추가 조회 비용은 [B-Tree 계열과 Clustered / Non-clustered Index](BTree-클러스터드-넌클러스터드-인덱스.md)에서 이어서 본다.

### Internal Node

```text
Internal Page(Node)의 개념적 구조
┌─────────────────────────────────┐
│ Ptr │ Key │ Ptr │ Key │ Ptr ...  │
└─────────────────────────────────┘
```

동일한 Page 크기에서 비교하면, B+Tree는 **Node 자체를 작게 만드는 것이 아니라 Internal에서 결과용 Record 정보를 빼서 탐색 Entry를 작게 유지하는 구조**다.

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

### Leaf 연결과 범위 검색

Leaf들은 Key 순서로 연결된다. 아래 `↔`는 앞뒤 Leaf로 이동하는 연결을 뜻하며, 디스크에서 Page가 물리적으로 연속한다는 뜻은 아니다.

```text
Leaf A           Leaf B           Leaf C
[10,20,30]  ↔  [40,50,60]  ↔  [70,80,90]
```

범위 검색은 시작 Leaf를 찾은 뒤 연결된 Leaf를 순차적으로 읽을 수 있다. 예를 들어 `25 ≤ Key ≤ 65`라면 Leaf A에서 `30`부터 읽고, Leaf B의 `40, 50, 60`으로 이어간다. `70`부터는 범위를 벗어난다.

```text
B+Tree의 핵심
① Internal에서 결과용 Record 정보 제거 → Fan-out 확보에 유리
② Record Entry를 Leaf에 집중 + Leaf 연결 → 범위 검색 유리
```

### B-Tree는 이동, B+Tree의 Leaf는 복사

B-Tree Split에서는 중간 Key와 그에 대응하는 Record 정보가 부모로 이동한다. 4절의 예에서 `20`은 분할된 Child에 남지 않는다.

```text
[10 | 20 | 30 | 40]
          ↓
         [20]
         /  \
      [10] [30 | 40]
```

B+Tree의 **Leaf Split**에서는 Record Entry가 Leaf에 남아야 하므로 경계 Key를 부모에 복사한다. 아래는 오른쪽 Leaf의 첫 Key를 경계로 사용하는 예다.

```text
[10 | 20 | 30 | 40]
        ↓
       [30]            ← 탐색용 Key 복사
       /  \
[10 | 20] ↔ [30 | 40] ← Record Entry 유지
```

따라서 같은 Key가 Internal의 탐색 Key와 Leaf의 Record Entry에 함께 나타날 수 있다. 이 예에서 `30`을 검색하면 Root와 일치해도 오른쪽 Leaf로 내려간다.

**이 복사 설명은 Leaf Split 기준이다.** B+Tree의 Internal Split에서는 구분 Key를 위로 이동시키는 방식이 사용될 수 있다. 모든 Level의 Split을 같은 복사 동작으로 외우지 않는다. [1]

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

`2 → 3`은 Node 하나를 세 조각으로 나눈다는 뜻이 아니라 **인접한 두 Node의 내용을 세 Node에 다시 나눠 담는다는 뜻**이다. [5]

```text
B-Tree  → 최소 점유율 약 1/2
B*Tree  → 최소 점유율 약 2/3
```

2/3은 Split 횟수가 아니라 Node의 점유 수준이다. 위 비율은 Root 등의 예외와 정수 단위의 반올림을 생략한 개략적인 비교다. 특히 B-Tree의 정확한 Key·Child 하한은 3절의 식을 따른다. 실제 DB Page의 바이트 사용률이 항상 정확히 이 비율 이상이라는 뜻은 아니다.

```text
B*Tree
→ 형제 재분배 우선
→ Page 공간 활용도 ↑
→ 불필요한 Split 감소
```

대신 형제 Node와 부모의 경계 Key까지 함께 조정하므로 갱신 과정이 복잡해질 수 있다. **B+Tree는 결과 Entry의 위치와 범위 검색, B*Tree는 재분배와 점유율**에 초점이 있다는 차이를 기억한다.

---

## 10. T-Tree — Main Memory DB 관점

Disk 기반 DB에서는 Page I/O가 비싸므로 높은 Fan-out과 낮은 Tree 높이가 중요하다. Main Memory DB에서는 인덱스와 데이터를 메모리에서 접근하므로, 설계의 초점이 CPU 처리와 메모리 사용 효율 쪽으로 옮겨간다. 영속성을 위한 저장장치 사용까지 사라진다는 뜻은 아니다.

T-Tree는 Binary 균형 탐색 구조를 유지하면서 Node 하나에 여러 Record Entry를 저장한다. 균형이 깨지면 AVL과 유사한 회전으로 복구한다. [6]

```text
              [40 50 60]
               /      \
              ↓        ↓
        [10 20 30]   [70 80 90]
```

각 `[40 50 60]` 상자 전체가 Node 하나이며 Child는 Left / Right 최대 2개다.

원 논문의 메모리 인덱스 설계에서는 실제 레코드를 가리키는 포인터를 저장하고, 필요한 Key 값을 해당 레코드에서 읽는다. **그림의 숫자는 탐색 규칙을 보여주는 Key 값이며, Node 안에 실제 Row 전체를 담는다는 뜻이 아니다.** [6]

### Key가 여러 개인데 왜 Binary인가

T-Tree의 Node 내부 Key들은 여러 Child 방향을 만드는 경계가 아니라 **Node 하나의 정렬된 범위**를 이룬다.

```text
Node = [30 40 50 60]

찾는 값 < 30 → Left
찾는 값 > 60 → Right
30 ≤ 찾는 값 ≤ 60 → 현재 Node 내부 검색
```

범위 안에 있다는 것이 값의 존재를 보장하지는 않는다. 예를 들어 `35`는 현재 Node 안에서 찾되, 없으면 검색 실패다.

따라서 이진·다진 분기 구조는 Node 안의 Key 개수가 아니라 **Child 분기 수**로 구분한다. M-way Search Tree는 여러 Key 사이의 구간마다 Child로 내려가지만, T-Tree는 Node의 최솟값보다 작은 쪽과 최댓값보다 큰 쪽으로만 내려간다.

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

T-Tree는 Main Memory DB를 위한 전통적 Index 구조의 하나이며, 메모리 기반 DB가 반드시 T-Tree를 사용해야 한다는 뜻은 아니다. 여기서는 **디스크 접근 비용을 줄이는 설계와 메모리에서의 탐색·저장 효율을 고려한 설계의 차이**를 이해한다.

---

## 11. 같은 비교축으로 다시 보기

| 구조 | 자식 분기 | 결과 Entry 위치 | 균형·유지 방식 | 핵심 목적 |
|---|---|---|---|---|
| BST | 최대 2개 | 각 Node | 기본 구조는 균형 보장 없음 | 값의 대소관계로 탐색 |
| AVL / Red-Black | 최대 2개 | 각 Node | 회전, 높이·색 규칙 | 탐색 경로가 한쪽으로 길어지는 현상 방지 |
| B-Tree | 최대 m개 | Internal / Leaf | 동일 Leaf Level, 점유 규칙, Split / Merge | 높은 Fan-out으로 Page 접근 경로 단축 |
| B+Tree | 다진 분기 | Leaf에 집중 | B-Tree 계열의 균형 유지 | Internal 탐색 전용화, Leaf 연결로 범위 검색 |
| B*Tree | 다진 분기 | 기본 B-Tree형에서는 Internal / Leaf | 형제 재분배 우선, 2→3 분할 | 점유율과 공간 활용도 강화 |
| T-Tree | 최대 2개 | 각 Node에 여러 Entry | AVL과 유사한 회전 | 메모리 기반 탐색·저장 효율 고려 |

이 표의 결과 Entry는 실제 Row 자체와 같은 말이 아니다. 구조와 저장 방식에 따라 Row를 참조하는 정보일 수 있다. B*Tree의 핵심 구분점도 결과 Entry의 위치가 아니라 **공간을 재분배하는 정책**이다.

---

## 12. 질문으로 이해 복원하기

본문을 가리고 다음 질문에 답해 본다. 이름을 나열하기보다 **규칙 → 구조 → 탐색·갱신 결과**를 연결해서 설명한다.

1. M-way Tree에 어떤 규칙을 추가해야 M-way Search Tree가 되는가? `[20 | 40 | 60]`에서 `25`를 찾는 경로와, 다른 세 서브트리를 보지 않아도 되는 이유는 무엇인가?
2. 탐색 규칙만으로 균형이 보장되지 않는 이유는 무엇인가? 4차 B-Tree에서 비루트 Internal Node와 Leaf의 Key·Child 조건은 각각 무엇인가?
3. Key 하나의 바이트 크기가 작아지면 Fan-out과 높이에 어떤 영향을 주는가? Page 세 개에 접근해도 새로 읽을 Page는 하나일 수 있는 이유는 무엇인가?
4. B-Tree의 Split과 B+Tree의 Leaf Split에서 부모로 올라가는 Key는 어떻게 다른가? B+Tree는 Internal의 Key와 일치해도 왜 Leaf까지 내려가는가?
5. B+Tree의 Leaf에 실제 Row 대신 Row Locator가 있을 수 있는 이유는 무엇인가? Child Pointer와 Row Locator는 각각 어디로 안내하는가?
6. B*Tree의 `2 → 3`은 무엇을 나누는 것이며, 왜 약 2/3 점유와 연결되는가? 공간 활용도를 높이는 대신 어떤 갱신 부담이 생기는가?
7. T-Tree는 Node에 Key가 여러 개 있어도 왜 이진 구조인가? `[30 40 50 60]`에서 `20`, `35`, `70`을 찾으면 각각 어디를 확인하는가?

> **탐색 규칙은 찾을 방향을 정하고, 균형과 점유 규칙은 탐색 경로를 통제한다. DB에서는 이를 Page 접근 비용과 연결한다. B+Tree는 Internal과 Leaf의 역할을 나누고, B*Tree는 공간 재분배를 강화하며, T-Tree는 메모리 환경에서 이진 균형 구조와 Node당 다중 Entry를 결합한다.**

## 이어서 볼 학습

- [B-Tree 계열과 Clustered / Non-clustered Index](BTree-클러스터드-넌클러스터드-인덱스.md): Tree 구조를 이해한 뒤, Leaf의 정보가 실제 Row 조회와 어떻게 이어지는지와 추가 Lookup·Covering의 차이를 확인한다.
- [데이터베이스 전체 개념지도](00-전체.md): 물리 접근 구조가 Optimizer의 Access Path 선택에 어떻게 쓰이는지 큰 그림으로 돌아가 확인한다.

## 참고 자료

본문의 숫자는 해당 설명을 확인할 자료를 가리킨다. DBMS 예시는 아래 명시한 버전·자료 범위의 사례이며, 모든 제품에 동일한 정책을 일반화하지 않는다.

1. [OpenDSA — B-Trees](https://opendsa-server.cs.vt.edu/ODSA/Books/CS3/html/BTree.html): B-Tree의 차수·균형 조건과 B+Tree의 탐색·분할 구조.
2. [MySQL 8.4 — Buffer Pool](https://dev.mysql.com/doc/refman/8.4/en/innodb-buffer-pool.html): 테이블·인덱스 Page의 메모리 캐시와 읽기.
3. [PostgreSQL 18 — B-tree 구현 README](https://github.com/postgres/postgres/blob/REL_18_STABLE/src/backend/access/nbtree/README): `Deleting entire pages during VACUUM`의 Page 삭제 정책과 동시 스캔 제약.
4. [MySQL 8.4 — Clustered and Secondary Indexes](https://dev.mysql.com/doc/refman/8.4/en/innodb-index-types.html): 클러스터 인덱스의 Row 저장과 보조 인덱스의 기본키 참조.
5. [NIST — B*-tree](https://xlinux.nist.gov/dads/HTML/bstartree.html): 형제 재분배와 두 Node를 세 Node로 나누는 원리.
6. [Lehman·Carey, A Study of Index Structures for Main Memory Database Management Systems, VLDB 1986](https://www.vldb.org/conf/1986/P294.PDF): §2, §3.2–3.2.2의 메모리 인덱스, T-Tree 구조·탐색·회전.
