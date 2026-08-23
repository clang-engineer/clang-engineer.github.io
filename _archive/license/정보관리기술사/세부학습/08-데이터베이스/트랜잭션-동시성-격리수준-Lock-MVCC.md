# 트랜잭션 동시성 제어 — Isolation Level, Lock, MVCC

이 문서는 여러 Transaction이 동시에 실행될 때 어떤 문제가 생기고, Isolation Level이 무엇을 보장하며, Lock과 MVCC가 그 보장을 어떻게 구현하는지 이해하기 위한 문서다.

핵심은 **문제·보장 수준·구현 수단을 같은 층위로 섞지 않는 것**이다.

```text
동시 Transaction
      ↓
동시성 이상 현상
      ↓
Isolation Level
= 어디까지 격리할 것인가
      ↓
Concurrency Control
= 그 보장을 어떻게 구현할 것인가
      ↓
Lock / MVCC
```

---

## 1. 가장 먼저 잡을 전체 구조

```text
[문제]
여러 Transaction을 동시에 실행
        ↓
같은 Data를 함께 접근
        ↓
Conflict 가능
        ↓
잘못 제어하면 이상 현상 발생
- Dirty Read
- Non-repeatable Read
- Phantom Read
- Lost Update 등

[보장 수준]
Isolation Level
RU → RC → RR → Serializable

[구현 수단]
Concurrency Control
├─ Lock
│   ├─ S / X Lock       : Lock 종류
│   ├─ Compatibility    : 같이 보유 가능한가
│   ├─ Row / Range      : 어디까지 잠글 것인가
│   └─ 2PL              : 언제 획득·해제할 것인가
│
└─ MVCC
    ├─ 여러 Version 유지
    └─ Snapshot / Visibility
        → 어떤 Version을 보여줄 것인가
```

> **Isolation Level = 무엇을 보장할지, Lock/MVCC = 그 보장을 어떻게 구현할지**

---

## 2. 동시 실행에서 왜 문제가 생기는가

두 Transaction이 같은 Data에 접근할 때 순서에 따라 결과가 달라질 수 있다.

### Conflict

Conflict는 **병행 실행에서 순서가 중요한 연산 관계**다.

서로 다른 Transaction이 같은 Data Item에 접근하고, 둘 중 하나 이상이 Write이면 Conflict다.

```text
R-R → Conflict 없음
R-W → Conflict 있음
W-R → Conflict 있음
W-W → Conflict 있음
```

`R-R`만 Conflict가 아닌 이유는 순서를 바꿔도 결과에 영향이 없기 때문이다.

```text
T1: R(X)
T2: R(X)

순서를 바꿔도 결과 동일
```

반면 `R-W`는 순서가 달라지면 읽는 값이 달라질 수 있다.

```text
X = 100

T1: R(X)       → 100
T2: W(X=200)
```

순서를 바꾸면:

```text
T2: W(X=200)
T1: R(X)       → 200
```

> **Conflict = 오류 그 자체가 아니라, 순서를 함부로 바꾸면 안 되는 관계**

---

## 3. 대표적인 동시성 이상 현상

### Dirty Read

Commit되지 않은 값을 다른 Transaction이 읽는다.

```text
X = 100

T1: X = 200
    아직 COMMIT 전

T2: X 읽음 → 200

T1: ROLLBACK
```

T2는 결국 존재하지 않게 된 값을 읽었다.

> **Dirty = 확정되지 않은 값을 봄**

### Non-repeatable Read

같은 Transaction에서 같은 Row를 다시 읽었는데 값이 달라진다.

```text
T1: X 읽음 → 100

                T2: X = 200
                T2: COMMIT

T1: X 다시 읽음 → 200
```

> **Non-repeatable = 같은 Row가 바뀜**

### Phantom Read

같은 조건으로 다시 조회했는데 Row 집합이 달라진다.

```text
T1: WHERE age BETWEEN 20 AND 30
→ 철수(22), 영희(27)

                T2: 민수(25) INSERT
                T2: COMMIT

T1: 같은 조건 재조회
→ 철수(22), 영희(27), 민수(25)
```

> **Phantom = 없던 Row가 유령처럼 나타남**

### Lost Update

두 Transaction이 같은 값을 기반으로 수정하면서 한쪽 Update가 사라진다.

```text
X = 100

T1: X 읽음 → 100
T2: X 읽음 → 100

T1: +10 → 110
T2: +20 → 120

최종값 120
→ T1의 +10 유실
```

고전적인 Isolation Level 표는 주로 Dirty / Non-repeatable / Phantom 세 현상을 비교한다. Lost Update는 별도의 동시 Update 문제로 함께 기억한다.

---

## 4. Isolation Level 4단계

SQL 표준의 고전적인 학습표는 다음과 같다.

| Isolation Level | Dirty Read | Non-repeatable Read | Phantom Read |
|---|:---:|:---:|:---:|
| Read Uncommitted | O | O | O |
| Read Committed | X | O | O |
| Repeatable Read | X | X | O |
| Serializable | X | X | X |

### 기억·인출 장치

```text
RU
→ 아무것도 막지 않는 시작점

RC
→ Committed
→ 확정된 것만 읽음
→ Dirty 제거

RR
→ Repeatable
→ 다시 읽어도 같게
→ Non-repeatable까지 제거

Serializable
→ Serial 실행처럼
→ Phantom까지 제거
```

즉:

```text
D → N → P를 하나씩 제거

RU   : D O / N O / P O
RC   : D X / N O / P O
RR   : D X / N X / P O
SER  : D X / N X / P X
```

> **격리 수준 4개 = 아무것도 막지 않는 시작점 1개 + D/N/P를 하나씩 제거하는 3단계**

---

## 5. Serializable과 Serializability

### Serial

Transaction을 실제로 하나씩 순차 실행한다.

```text
T1 전부 실행
      ↓
T2 전부 실행
```

안전하지만 동시성이 낮다.

### Serializable

실제로는 Transaction을 섞어 실행하더라도 **결과가 어떤 Serial 실행과 동등**하도록 보장한다.

```text
실제 실행
T1 ─┐
    ├─ 섞여 실행
T2 ─┘

결과
= T1 → T2로 순차 실행한 결과와 동등
```

```text
Serial
= 실제로 하나씩 실행

Serializable
= 동시에 실행해도
  결과는 하나씩 실행한 것과 동등
```

Serializable Isolation Level의 이름이 여기서 나온다.

> **Serializability = 안전한 병행 실행을 판단하는 강한 정확성 기준**

Conflict는 이런 Schedule의 순서를 분석하기 위한 기초 개념이다.

```text
Conflict
= 순서가 중요한 연산 관계

Conflict의 순서가 서로 모순되면
→ 하나의 Serial 순서로 설명하기 어려움
```

Conflict Serializability의 세부 판정법은 별도 학습 주제로 둔다.

---

## 6. Isolation Level과 구현 방식은 별개다

Isolation Level은 **보장 수준**이고 Lock/MVCC는 **구현 수단**이다.

```text
Isolation Level
"어디까지 격리할 것인가?"
        ↓
Concurrency Control
"그걸 어떻게 보장할 것인가?"
        ↓
Lock / MVCC / 기타 기법
```

따라서 다음처럼 1:1로 대응시키면 안 된다.

```text
RC = Lock        X
RR = MVCC        X
```

실제 DBMS는 Lock과 MVCC를 함께 사용할 수 있다.

---

## 7. Lock 방식으로 Isolation Level을 구현한다면

Lock 방식에서는 **어디에 Lock을 걸고, 얼마나 오래 유지하느냐**를 조정해 필요한 Isolation Level을 구현할 수 있다.

### Read Committed

```text
T1: X 읽음 → S Lock
T1: 읽기 완료 → S Lock 해제

                T2: X 수정 가능

T1: 다시 읽음 → 값이 바뀔 수 있음
```

Dirty Read는 막지만 Non-repeatable Read는 가능하다.

### Repeatable Read

```text
T1: X 읽음 → S Lock
               │
               │ Transaction 동안 유지
               │
                T2: X 수정 위해 X Lock 요청
                    → 대기

T1: 다시 X 읽음 → 같은 값
T1: COMMIT → Lock 해제
```

기존 Row의 값이 바뀌는 것을 막는다.

### Serializable

기존 Row Lock만으로는 Phantom을 막을 수 없다.

```text
T1 조회 결과
철수(22) 🔒
영희(27) 🔒

T2: 민수(25) INSERT
→ 민수는 기존에 없던 Row
→ 기존 Row의 S Lock과 직접 충돌하지 않음
```

따라서 조회 범위까지 보호해야 한다.

```text
age

20 ═════════════════ 30
      Range 보호

T2: age=25 INSERT
→ 보호된 범위에 들어오므로 대기
```

### 기억·인출 장치

```text
RC  → 읽는 동안 보호
RR  → 읽은 Row를 오래 보호
SER → Row를 넘어 범위까지 보호
```

단, 이것은 **Lock 기반 구현을 이해하기 위한 전형적인 모델**이다. Isolation Level의 정의 자체가 Lock의 강도라는 뜻은 아니다.

---

## 8. S Lock과 X Lock

### S Lock(Shared Lock)

Read를 위한 공유 Lock이다.

```text
T1: X에 S Lock
→ T1은 X 읽기 가능

T2: X에 S Lock
→ 같이 읽기 가능
```

### X Lock(Exclusive Lock)

Write를 위한 독점 Lock이다.

```text
T1: X에 X Lock
→ T1은 읽기/쓰기 가능

T2: 같은 X에 S 또는 X Lock 요청
→ 대기
```

중요한 점은 `X Lock = 읽기/쓰기 불가`가 아니라, **X Lock을 가진 Transaction은 읽기/쓰기가 가능하고 다른 Transaction이 같은 대상에 S/X Lock을 함께 가질 수 없다는 것**이다.

### Lock Compatibility

```text
같은 Data에 대해

S + S → 같이 보유 가능
S + X → 불가
X + S → 불가
X + X → 불가
```

이 표는 단순히 DBMS가 **현재 Lock 요청을 허용할지 기다리게 할지** 판단하는 Compatibility 규칙이다.

```text
S = Shared
→ 읽기끼리 공유

X = Exclusive
→ 하나라도 X가 있으면 독점
```

Conflict와 원리가 비슷하지만 같은 개념은 아니다.

```text
Conflict
→ 연산의 순서가 중요한가?

Lock Compatibility
→ 두 Lock을 동시에 허용해도 되는가?
```

---

## 9. 2PL은 Lock 운용 Protocol이다

S/X는 Lock의 종류이고 2PL(Two-Phase Locking)은 **그 Lock을 언제 획득하고 해제할지 정하는 Protocol**이다.

```text
Lock 방식
├─ S / X          : 어떤 Lock인가
├─ Row / Range    : 어디에 Lock을 거는가
└─ 2PL            : 언제 Lock을 잡고 푸는가
```

### 왜 필요한가

각 순간 Lock Compatibility를 지켜도 Transaction 전체에서 Lock을 마음대로 잡고 풀면 Conflict의 선후관계가 뒤집힐 수 있다.

```text
A에서는
T1 → T2

B에서는
T2 → T1
```

이렇게 되면 전체 Schedule을 `T1 → T2` 또는 `T2 → T1` 같은 하나의 Serial 순서로 설명하기 어려워진다.

2PL은 Lock 획득과 해제 시기를 두 단계로 분리한다.

```text
Growing Phase
→ Lock 획득 O
→ Lock 해제 X

       ↓ 최초 Lock 해제

Shrinking Phase
→ Lock 획득 X
→ Lock 해제 O
```

기억법:

> **잡을 때는 잡기만, 풀기 시작했으면 다시 잡지 않는다.**

```text
S(A) 획득
X(B) 획득
S(C) 획득
────────────
S(A) 해제
X(B) 해제
S(C) 해제
```

반대로:

```text
S(A) 획득
S(A) 해제
X(B) 획득  ← 2PL 위반
```

2PL은 Conflict 자체를 없애는 것이 아니라 **Conflict의 순서가 모순되지 않도록 Lock 운용을 제한하여 Conflict Serializable한 Schedule을 보장하는 Protocol**이다.

### 2PL과 Phantom

기본 2PL을 쓴다고 Row Lock이 자동으로 Range Lock으로 바뀌는 것은 아니다.

```text
2PL
→ Lock의 시간 규칙

Row / Range Lock
→ Lock의 대상 범위
```

따라서 Row Lock만 사용하는 2PL에서는 새 Row가 들어오는 Phantom을 별도로 막지 못할 수 있다. Phantom까지 Lock으로 막으려면 Range/Predicate 수준의 보호가 필요하다.

---

## 10. MVCC

MVCC(Multi-Version Concurrency Control)는 **하나의 Data에 여러 Version을 유지하고 각 Transaction에 보여줄 Version을 선택**하는 방식이다.

```text
X Version

v1 = 100
v2 = 200
v3 = 300
```

Transaction마다 Data 전체를 별도로 복사하는 것이 아니다.

```text
        공유된 여러 Version
        v1   v2   v3
         ↑    ↑    ↑
         │    │    │
A Snapshot ───┘    │
B Snapshot ─────────┘
```

즉 각 Transaction에 **논리적인 자기만의 View**를 제공한다고 이해하면 된다.

### Lock과의 핵심 차이

같은 값을 반복해서 읽어야 한다고 하자.

Lock 방식:

```text
T1: X=100 읽음
→ 다른 Transaction이 X를 수정하지 못하게 보호

T1: 다시 읽음 → 100
```

MVCC 방식:

```text
T1이 보는 Version = 100

T2: X=200 Version 생성
T2: COMMIT

T1: 다시 읽음
→ 자기 Snapshot에서 보이는 100 Version 선택
```

> **Lock = 바꾸지 못하게 해서 같은 값을 보장**
>
> **MVCC = 바뀌어도 나에게 맞는 Version을 보여줘서 같은 값을 보장**

실제 DBMS는 MVCC를 사용하더라도 Writer 간 충돌 등에서는 Lock을 함께 사용할 수 있다. Lock과 MVCC는 완전한 택1 관계가 아니다.

---

## 11. Isolation Level과 MVCC Snapshot

MVCC의 기본 재료는 Version과 Snapshot/Visibility다.

```text
MVCC
├─ 여러 Version 유지
└─ Snapshot/Visibility
   → 어느 Version을 볼 수 있는가
```

Isolation Level에 따라 Snapshot을 생성·유지하는 방식이 달라질 수 있다.

### Read Committed의 개념 모델

```text
T1 첫 SELECT
→ Snapshot ①
→ X=100

                T2: X=200
                T2: COMMIT

T1 두 번째 SELECT
→ Snapshot ②
→ X=200
```

Statement마다 새로운 관점을 볼 수 있으므로 Non-repeatable Read가 가능하다.

### Repeatable Read의 개념 모델

```text
T1 첫 SELECT
→ Snapshot ①
→ X=100

                T2: X=200
                T2: COMMIT

T1 두 번째 SELECT
→ 같은 Snapshot ①
→ X=100
```

기억법:

```text
RC
→ SELECT할 때 세상을 다시 볼 수 있음

RR
→ Transaction 동안 같은 세상을 봄
```

구체적인 Snapshot/Visibility 규칙과 Isolation Level의 실제 동작은 DBMS마다 차이가 있을 수 있다.

---

## 12. 지금까지 가장 헷갈렸던 경계

### Conflict와 이상 현상은 같은가

아니다.

```text
Conflict
→ 순서가 중요한 연산 관계

Dirty / Non-repeatable / Phantom
→ 잘못된 병행 실행에서 관찰되는 이상 현상
```

### Isolation Level과 Lock/MVCC는 같은 분류인가

아니다.

```text
Isolation Level
→ 보장 수준

Lock / MVCC
→ 구현 수단
```

### S/X와 2PL은 같은 층위인가

Lock 내부의 서로 다른 축이다.

```text
S / X
→ Lock 종류

2PL
→ Lock 획득·해제 Protocol
```

### 2PL을 쓰면 Phantom도 자동으로 막히는가

아니다.

```text
2PL
→ 언제 Lock을 잡고 푸는가

Phantom 방지
→ 새 Row가 들어올 범위까지 보호해야 함
```

### MVCC를 쓰면 D/N/P가 자동으로 모두 사라지는가

아니다. MVCC는 Version과 Snapshot으로 격리를 구현하는 Mechanism이고, 어느 수준까지 보장할지는 Isolation Level과 DBMS 구현에 따라 달라진다.

---

## 13. 기억 흐름

시험이나 복습 시 다음 순서로 복원한다.

```text
1. 여러 Transaction을 동시에 실행
        ↓
2. Conflict 가능
   같은 Data + 하나 이상 Write
        ↓
3. 이상 현상
   Dirty / Non-repeatable / Phantom
        ↓
4. Isolation Level
   RU → RC → RR → Serializable
        ↓
5. 어떻게 구현?
   Lock / MVCC
```

Lock 가지:

```text
Lock
├─ S / X
│   → 읽기 공유 / 쓰기 독점
│
├─ Compatibility
│   → S-S만 동시 보유
│
├─ Row / Range
│   → 어디까지 보호할 것인가
│
└─ 2PL
    → 언제 잡고 풀 것인가
    → 잡기 → 풀기
```

MVCC 가지:

```text
MVCC
→ 여러 Version 유지
→ Snapshot/Visibility로 보이는 Version 선택

RC → 새 관점을 볼 수 있음
RR → 같은 관점을 유지
```

Isolation Level 기억법:

```text
Committed → Repeatable → Serializable
확정된 것만 → 다시 읽어도 같게 → 직렬 실행처럼

Dirty → Non-repeatable → Phantom
D → N → P를 하나씩 제거
```

---

## 14. TODO — 현재 흐름에서 벗어나는 후속 학습

- [ ] Conflict Serializability 판정
  - Conflict의 순서가 어떤 Serial Schedule과 동등한지 판단하는 방법
  - Schedule / Serializability 학습과 연결

- [ ] 2PL 변형
  - Conservative / Strict / Rigorous 2PL
  - Deadlock, Recoverability와 연결

- [ ] PostgreSQL MVCC와 VACUUM
  - MVCC에서 오래된 Tuple Version이 남는 이유와 정리 방식
  - PostgreSQL 구현 학습과 연결

- [ ] DBMS별 Isolation Level / MVCC 차이
  - PostgreSQL, MySQL InnoDB, SQL Server가 같은 이름의 Isolation Level을 어떻게 구현하는지 비교
