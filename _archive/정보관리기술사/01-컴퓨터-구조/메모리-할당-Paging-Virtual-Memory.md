# 메모리 할당·Paging·Virtual Memory

이 문서는 고정 분할, 가변 분할, Paging, Segmentation, Virtual Memory가 어떤 흐름으로 연결되는지 이해하기 위한 문서다. 특히 `Page`가 Virtual Memory에서 처음 등장한 개념인지, Paging과 Virtual Memory가 같은 개념인지 헷갈리는 지점을 정리한다.

## 1. 가장 먼저 잡을 전체 흐름

운영체제의 전통적인 메모리 관리 학습 흐름은 다음처럼 잡을 수 있다.

```text
메모리 관리
   ↓
Process를 Physical Memory에 어떻게 배치할까?
   ↓
연속 메모리 할당
├─ 고정 분할
└─ 가변 분할
   ↓
문제
- Process마다 연속된 Physical Memory 공간이 필요
- 내부/외부 단편화 발생 가능
   ↓
"꼭 연속된 공간에 넣어야 할까?"
   ↓
불연속 메모리 할당
├─ Paging
└─ Segmentation
   ↓
흩어진 Physical Memory 공간에도 배치 가능
   ↓
한 단계 더
"Process의 모든 내용을 지금 당장 RAM에 둘 필요가 있을까?"
   ↓
Virtual Memory
└─ Demand Paging
   ├─ 필요한 Page만 RAM에 적재
   ├─ Page Fault
   └─ Page Replacement
```

> **연속 공간 요구 제거 → 불연속 배치 → 필요한 부분만 RAM에 적재**라는 문제 해결 흐름으로 기억한다.

---

## 2. 연속 메모리 할당

초기의 직관적인 방법은 Process가 사용할 공간을 Physical Memory의 연속된 영역에 배치하는 것이다.

```text
Physical Memory

┌──────────────┐
│ OS           │
├──────────────┤
│ Process A    │
│              │
├──────────────┤
│ Process B    │
│              │
└──────────────┘
```

### 고정 분할

Memory를 미리 정해진 크기의 Partition으로 나누고 Process를 배치한다.

```text
Memory
├─ Partition 1
├─ Partition 2
├─ Partition 3
└─ Partition 4
```

Process보다 Partition이 크면 내부에 사용하지 않는 공간이 남을 수 있다. 즉 **내부 단편화(Internal Fragmentation)**가 발생할 수 있다.

### 가변 분할

Process가 필요한 크기에 맞춰 Partition 크기를 정한다.

고정 분할의 낭비를 줄일 수 있지만 Process의 생성과 종료가 반복되면 사용 가능한 공간이 여기저기 흩어지는 **외부 단편화(External Fragmentation)**가 발생할 수 있다.

```text
사용 중
빈 공간 10MB
사용 중
빈 공간 20MB
사용 중

총 빈 공간 = 30MB
하지만 30MB의 연속 공간은 없음
```

예를 들어 25MB Process가 들어오면 총 빈 공간은 30MB이지만 가장 큰 연속 공간은 20MB이므로 배치할 수 없다.

```text
빈 공간 총량 = 30MB
        ↓
25MB Process를 넣을 용량 자체는 있음
        ↓
하지만 25MB 연속 공간이 없음
        ↓
할당 불가
```

여기서 다음 질문이 나온다.

> **Process를 꼭 Physical Memory의 연속된 공간에 넣어야 할까?**

이 질문이 불연속 메모리 할당으로 넘어가는 핵심이다. 단순히 빈 공간의 총량을 늘리는 것이 아니라 **Process마다 큰 연속 공간을 찾아야 한다는 제약을 제거**하려는 것이다.

---

## 3. Paging — 연속 배치 요구를 없앤다

Paging은 주소 공간을 **고정 크기 단위**로 나누어 불연속적으로 배치할 수 있게 하는 메모리 관리 기법이다.

```text
Process의 논리 주소 공간
├─ Page 0
├─ Page 1
└─ Page 2

Physical Memory
├─ Frame 0
├─ Frame 1
├─ Frame 2
├─ Frame 3
├─ Frame 4
└─ Frame 5
```

Process의 각 Page는 서로 떨어진 Frame에 들어갈 수 있다.

```text
Page 0 ─────→ Frame 4
Page 1 ─────→ Frame 1
Page 2 ─────→ Frame 5
```

즉 Process 전체가 하나의 연속된 Physical Memory 영역을 차지할 필요가 없다.

### 연속 공간 요구를 없애면 무엇이 좋은가

핵심은 **Physical Memory의 빈 공간이 서로 붙어 있지 않아도 사용할 수 있다는 것**이다.

연속 할당에서는 다음처럼 빈 공간이 흩어져 있으면 총량이 충분해도 큰 Process를 배치하지 못할 수 있다.

```text
[사용][빈 공간][사용][빈 공간][사용]
```

Paging에서는 Process를 Page로 나누므로 각 Page를 서로 다른 빈 Frame에 배치할 수 있다.

```text
Process
├─ Page 0 ─→ Frame 7
├─ Page 1 ─→ Frame 2
└─ Page 2 ─→ Frame 9
```

따라서 흐름은 다음과 같다.

```text
연속된 큰 공간을 찾아야 함
        ↓
외부 단편화로 총 빈 공간을 활용하지 못할 수 있음
        ↓
Page / Frame 단위의 불연속 배치
        ↓
흩어진 빈 Frame 사용 가능
        ↓
연속 공간 요구 제거
```

### 불연속 할당이면 단편화가 없어지는가

아니다. **불연속 할당이라고 단편화 자체가 모두 사라지는 것은 아니다.** 어떤 방식으로 나누느냐에 따라 단편화의 종류가 달라진다.

```text
연속 할당
├─ 고정 분할 → 내부 단편화 발생 가능
└─ 가변 분할 → 외부 단편화 발생 가능

불연속 할당
├─ Paging
│   ├─ 외부 단편화 제거
│   └─ 내부 단편화 발생 가능
│
└─ Segmentation
    └─ 외부 단편화 발생 가능
```

Paging은 Page와 Frame의 크기를 동일한 고정 크기로 맞춘다. 따라서 빈 Frame이 어디에 있든 Page 하나를 넣을 수 있어 **큰 연속 공간을 찾지 못해서 생기는 외부 단편화 문제를 제거**한다.

하지만 Process 크기가 Page 크기의 정확한 배수가 아닐 수 있다.

예를 들어 Page 크기가 4KB인데 마지막에 2KB만 필요하다면:

```text
마지막 Frame 4KB
┌────────────┐
│ 사용 2KB   │
│ 빈 2KB     │ ← 내부 단편화
└────────────┘
```

즉 Paging의 의미를 `단편화를 없앤다`라고 기억하면 부정확하다.

> **Paging은 연속 공간 요구를 제거하여 외부 단편화를 없애지만, 마지막 Page 등에서는 내부 단편화가 발생할 수 있다.**

### Page와 Frame

교과서적으로 구분하면:

```text
논리/가상 주소 공간의 고정 크기 단위
→ Page

Physical Memory의 같은 크기 단위
→ Frame(Page Frame)
```

Page Table은 Page가 어느 Frame에 배치되어 있는지 대응 관계를 관리한다.

```text
Page Number
    ↓
Page Table
    ↓
Frame Number
```

여기서 중요한 변화가 하나 더 생긴다.

```text
Process가 보는 Page
        ↓
Page Table을 통해 매핑
        ↓
실제 Physical Frame
```

즉 Process가 사용하는 논리적 주소와 실제 Physical Memory 위치를 직접 같게 볼 필요가 없어진다. 이 **논리 주소 공간과 물리적 배치의 분리**가 뒤에서 Virtual Memory를 이해하는 중요한 기반이 된다.

> **Paging의 핵심 = Process를 Page로, Physical Memory를 Frame으로 나누어 불연속 배치를 가능하게 한다.**

---

## 4. Segmentation은 무엇이 다른가

Paging이 고정 크기로 나눈다면 Segmentation은 Program의 논리적 의미를 기준으로 가변 크기 Segment를 만든다.

```text
Process
├─ Code Segment
├─ Data Segment
├─ Heap Segment
└─ Stack Segment
```

따라서 분류축은 다음처럼 잡는다.

```text
Paging
→ 고정 크기
→ 물리적으로 연속 배치할 필요를 제거
→ 외부 단편화 제거, 내부 단편화 가능

Segmentation
→ 논리적 의미 단위
→ Segment마다 크기가 다를 수 있음
→ 외부 단편화 가능
```

Paging과 Segmentation의 세부 주소 변환이나 혼합 방식은 별도 심화 주제로 둘 수 있다.

---

## 5. Paging과 Virtual Memory는 같은 개념인가

아니다.

Paging 자체는 **Memory를 Page/Frame 단위로 나누어 불연속 배치하는 메모리 관리 기법**으로 설명할 수 있다.

여기서 한 단계 더 질문한다.

```text
Paging까지 적용했지만
Process의 모든 Page를 RAM에 올려놓고 있음
        ↓
"실제로 지금 사용하는 Page만 RAM에 있으면 되지 않을까?"
        ↓
필요한 Page만 적재
```

이 아이디어가 Demand Paging 기반 Virtual Memory로 이어진다.

> **Page라는 개념이 Virtual Memory에서 처음 생긴 것이 아니라, Paging이라는 기법을 Virtual Memory 구현에도 활용한다.**

---

## 6. Virtual Memory — 모든 Page를 RAM에 둘 필요가 없다

Virtual Memory의 핵심은 Process가 Physical Memory의 실제 배치와 분리된 **자신의 논리적 주소 공간**을 사용하게 하는 것이다.

앞에서 Paging을 통해 이미 다음 구조를 만들었다.

```text
Process가 보는 논리 Page
        ↓
Page Table
        ↓
실제 Physical Frame
```

즉 Process가 보는 주소와 실제 RAM의 위치가 분리되어 있다. 그러면 여기서 한 단계 더 확장할 수 있다.

```text
논리 주소와 Physical Memory 위치가 분리됨
        ↓
"모든 논리 Page가 항상 Physical Frame에 있어야 할까?"
        ↓
필요한 Page만 RAM에 두기
        ↓
Demand Paging 기반 Virtual Memory
```

Demand Paging을 사용하면 Process의 모든 Page를 처음부터 RAM에 올려놓지 않고 필요한 Page만 적재할 수 있다.

```text
Process

Page 0 ─────→ RAM
Page 1 ─────→ RAM
Page 2 ─────→ Backing Store
Page 3 ─────→ Backing Store
Page 4 ─────→ RAM
```

CPU가 RAM에 없는 Page 2에 접근하면:

```text
Page 2 접근
   ↓
현재 RAM에 없음
   ↓
Page Fault
   ↓
OS가 필요한 Page를 가져옴
   ↓
Physical Frame에 적재
   ↓
Page Table 갱신
   ↓
실행 계속
```

RAM에 빈 Frame이 부족하면 어떤 Page를 내보낼지 결정하는 Page Replacement가 필요해진다.

### `Virtual Memory = Disk를 RAM처럼 쓰는 것`인가

학습 초기에 이렇게 기억하면 동작의 한 측면을 이해하는 데는 도움이 된다.

```text
RAM보다 큰 주소 공간 사용 가능
        ↓
당장 필요하지 않은 내용을
Backing Store에 둘 수 있음
```

하지만 이것만으로 정의하면 부족하다.

```text
Virtual Memory의 본질
→ Process의 논리적 주소 공간을 Physical Memory와 분리

Demand Paging의 효과
→ 필요한 Page만 RAM에 유지
→ 나머지는 필요할 때 가져올 수 있음
```

따라서 `Disk를 Memory처럼 사용`은 Virtual Memory의 효과를 설명하는 표현이고, 더 근본적인 개념은 **가상 주소 공간과 Physical Memory의 분리**다.

---

## 7. Paging과 Virtual Memory 관계를 한 번에 복원하기

```text
[문제 1]
Process를 연속된 RAM 공간에 넣어야 함
        ↓
빈 공간 총량이 충분해도
큰 연속 공간이 없으면 할당하지 못할 수 있음
        ↓
Paging
        ↓
Page ↔ Frame
        ↓
RAM에 흩어서 배치 가능
        ↓
논리 Page와 Physical Frame을 매핑

[문제 2]
그래도 Process의 모든 Page를 RAM에 올려야 하나?
        ↓
Demand Paging 기반 Virtual Memory
        ↓
필요한 Page만 RAM에 적재
        ↓
없으면 Page Fault
```

기억 문장:

> **Paging은 'Physical Memory의 어디에 배치할까'의 문제를 풀고, Demand Paging은 '지금 RAM에 꼭 있어야 하나'까지 확장한다.**

---

## 8. DB Page와는 어떤 관계인가

DBMS에서도 `Page`라는 용어를 사용하지만 OS Paging의 Page와 같은 객체는 아니다.

```text
OS
주소 공간 / Memory
→ Page / Frame 단위로 관리

DBMS
Database File
→ DB Page 단위로 저장·I/O 관리
```

DB Page는 여러 Row나 Index Entry를 담고 DBMS가 저장장치와 Buffer Pool 사이에서 데이터를 관리하는 기본 Block 단위로 사용된다.

```text
Database File

DB Page 1
├─ Row A
├─ Row B
└─ Row C

DB Page 2
├─ Row D
└─ Row E
```

따라서 둘의 공통점은 **큰 공간을 일정 크기의 관리 단위로 나눈다는 아이디어**이고, 관리 주체와 목적은 다르다.

```text
OS Page
→ OS Memory 관리

DB Page
→ DBMS 저장·I/O 관리
```

B-Tree에서 DB Page가 나오는 이유도 B-Tree의 논리적인 Node를 실제 DBMS 저장구조에 구현할 때 Page 단위 저장과 연결되기 때문이다.

> **OS Page와 DB Page는 직접 같은 개념이 아니라, 서로 다른 계층에서 Page라는 관리 단위를 사용하는 것이다.**

---

## 9. 기억 흐름

```text
고정 분할
→ 미리 나눈 연속 공간
→ 내부 단편화 가능

가변 분할
→ Process 크기에 맞춘 연속 공간
→ 외부 단편화 가능
        ↓
빈 공간 총량이 충분해도
큰 연속 공간이 없으면 할당하지 못할 수 있음
        ↓
"꼭 연속해서 넣어야 하나?"
        ↓
Paging
→ 고정 크기 Page / Frame
→ 불연속 배치
→ 흩어진 빈 Frame 활용
→ 외부 단편화 제거
→ 내부 단편화는 가능
        ↓
논리 Page ↔ Physical Frame 매핑
        ↓
논리 주소 공간과 Physical Memory 위치 분리

Segmentation
→ 논리적 의미의 가변 크기 Segment
→ 외부 단편화 가능

Paging에서 한 단계 더
"모든 Page가 RAM에 있어야 하나?"
        ↓
Virtual Memory / Demand Paging
→ 필요한 Page만 RAM
→ 없으면 Page Fault

그리고 별개의 계층
DB Page
→ DBMS의 저장·I/O 관리 단위
```
