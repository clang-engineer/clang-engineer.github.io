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
[정확성 기준]
여러 Transaction을 병행 실행
        ↓
연산이 서로 섞임
        ↓
어떤 Serial 순서와도 동등하지 않은 결과 가능
        ↓
Serializability
= 안전한 병행 실행을 판단하는 강한 기준

[관찰되는 문제]
동시성 이상 현상
├─ Dirty Read
├─ Non-repeatable Read
├─ Phantom Read
└─ Lost Update 등

[보장 수준]
Isolation Level
= 병행 실행에서 어디까지 격리할 것인가

[구현 수단]
Concurrency Control
├─ Lock
│   ├─ S / X        : 어떤 Lock인가
│   ├─ Row / Range  : 어디를 보호하는가
│   └─ 2PL          : 언제 획득·해제하는가
│
└─ MVCC
    ├─ 여러 Version 유지
    └─ Snapshot / Visibility
        → 어떤 Version을 보여줄 것인가
```

> **Isolation Level = 무엇을 보장할지, Lock/MVCC = 그 보장을 어떻게 구현할지**

---
## 2. 동시 실행에서 왜 문제가 생기는가

Transaction의 실행 순서에 따라 결과가 달라지는 것 자체는 문제가 아니다. **정상적인 Serial 실행도 Transaction 순서가 다르면 서로 다른 결과를 만들 수 있다.**

문제는 병행 실행에서 여러 Transaction의 연산이 섞이면서 **어떤 Serial 순서로도 만들 수 없는 결과**가 생길 수 있다는 것이다.

예를 들어 초기값이 `A=100`, `B=100`이고 다음 두 Transaction이 있다고 하자.

```text
T1: A와 B를 각각 ×2
T2: A와 B에 각각 +10
```

Serial하게 실행하면 가능한 결과는 두 가지다.

```text
T1 → T2
A: 100 → 200 → 210
B: 100 → 200 → 210
결과 = (210, 210)

T2 → T1
A: 100 → 110 → 220
B: 100 → 110 → 220
결과 = (220, 220)
```

둘은 결과가 다르지만 모두 정상적인 Serial 실행이다.

병행 실행에서는 Data마다 선후관계가 뒤집힐 수 있다.

```text
A에서는 T1 → T2  → A = 210
B에서는 T2 → T1  → B = 220

병행 결과 = (210, 220)
```

이 결과는 `T1 → T2`로 전체를 실행해도, `T2 → T1`로 전체를 실행해도 만들 수 없다.

```text
정상적인 Serial 결과
├─ T1 → T2 → (210, 210)
└─ T2 → T1 → (220, 220)

병행 실행
└─ (210, 220)
   → 어떤 Serial 순서와도 동등하지 않음
```

그래서 동시성 제어의 핵심 질문은 다음과 같다.

> **동시에 실행하더라도 결과를 어떤 Serial 실행과 동등하게 만들 수 있는가?**

이 기준이 `Serializability`다.

```text
Serial
= 실제로 Transaction을 하나씩 실행

Serializable
= 실제로는 섞어 실행하지만
  결과는 어떤 Serial 순서와 동등
```

Serializable이 모든 실행에서 항상 같은 결과를 만들라는 뜻은 아니다. **가능한 Serial 순서 중 하나와 동등하면 된다.**

### Conflict는 순서를 분석하기 위한 관계다

그렇다면 병행 Schedule이 하나의 Serial 순서로 설명될 수 있는지 보려면 **어떤 연산의 순서가 중요한지** 알아야 한다. 여기서 Conflict가 나온다.

서로 다른 Transaction이 같은 Data Item에 접근하고 둘 중 하나 이상이 Write이면 Conflict다.

```text
R-R → Conflict 없음
R-W → Conflict 있음
W-R → Conflict 있음
W-W → Conflict 있음
```

`R-R`은 순서를 바꿔도 서로의 결과에 영향을 주지 않는다.

반면 `R-W`, `W-R`, `W-W`는 순서를 바꾸면 읽는 값이나 최종 값이 달라질 수 있으므로 순서를 함부로 바꿀 수 없다.

> **Conflict = 오류 그 자체가 아니라, Serializability를 판단할 때 선후관계를 보존해야 하는 연산 관계**

```text
병행 실행
  ↓
Conflict 연산의 선후관계 확인
  ↓
하나의 일관된 Serial 순서로 설명 가능한가?
  ↓
Conflict Serializability
```

Conflict Serializability의 세부 판정법은 별도 학습 주제로 둔다.

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

Lost Update는 Dirty / Non-repeatable / Phantom과 달리 **두 Transaction의 Write가 겹치면서 한쪽 변경이 사라지는 동시 Update 문제**다.

```text
Dirty / Non-repeatable / Phantom
→ 고전적인 Isolation Level 표에서 비교하는 대표적인 Read 이상 현상

Lost Update
→ Write 충돌로 한쪽 Update가 유실되는 문제
```

따라서 고전적인 Isolation Level 표에는 보통 Dirty / Non-repeatable / Phantom 세 현상만 놓고 비교한다. Lost Update의 방지 여부는 DBMS의 Lock·MVCC 및 Update 충돌 처리 방식에 따라 달라질 수 있으므로 `RR이면 무조건 방지`처럼 표에 단순히 한 열을 추가해 대응시키지 않는다.

---

## 4. Isolation Level 4단계

Isolation Level의 본질은 **병행 실행에서 다른 Transaction의 영향을 어디까지 허용할 것인가**를 정하는 것이다. Dirty / Non-repeatable / Phantom은 그 차이를 관찰하기 위한 고전적인 학습 기준이다.

```text
Isolation Level
= 허용할 병행 실행의 범위
        ↓
관찰되는 대표 현상으로 비교
Dirty / Non-repeatable / Phantom
```

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

## 5. Isolation Level과 구현 방식은 별개다

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

## 6. Lock의 기본: S / X와 보호 범위

### S Lock(Shared Lock)

S Lock은 Read를 위한 공유 Lock이다. **S Lock을 보유한 Transaction은 읽을 수 있고, 다른 Transaction도 S Lock이라면 동시에 읽을 수 있다.**

```text
T1: S Lock 보유 → Read O
T2: S Lock 요청 → 획득 O → Read O

S + S
→ 둘 다 읽기 가능
```

### X Lock(Exclusive Lock)

X Lock은 Write를 위한 독점 Lock이다. **X Lock을 획득한 Transaction 자신은 읽기와 쓰기가 가능하지만, 다른 Transaction과 Lock을 공유하지 않는다.**

```text
T1: X Lock 보유
→ T1: Read O / Write O

T2: S Lock 요청 → 대기
T2: X Lock 요청 → 대기
```

여기서 중요한 것은 **Lock을 이미 보유한 Transaction의 권한**과 **다른 Transaction이 새 Lock을 획득할 수 있는지**를 구분하는 것이다.

예를 들어 T1이 S Lock을 보유한 상태에서 T2가 X Lock을 요청하면:

```text
T1: S Lock 보유
        ↓
T2: X Lock 요청
        ↓
S ↔ X 호환되지 않음
        ↓
T2는 X Lock을 획득하지 못하고 대기
        ↓
T2는 아직 접근하지 못함
Read X / Write X
```

즉 **X Lock 자체가 읽기를 금지하는 것이 아니라, X Lock을 아직 획득하지 못했기 때문에 T2가 읽거나 쓸 수 없는 것**이다.

### Lock 호환성

같은 대상에 서로 다른 Transaction이 Lock을 잡을 때는 **S끼리만 동시에 보유할 수 있고, X가 하나라도 포함되면 함께 보유할 수 없다.**

```text
          요청 Lock
          S     X
보유 S    O     X
Lock X    X     X
```

따라서 결과만 압축하면:

```text
S + S → 공존 가능

S + X ┐
X + S ├→ 공존 불가 → 요청한 Transaction 대기
X + X ┘
```

### Lock은 종류·대상·시간을 나눠 본다

```text
Lock
├─ 종류  → S / X
├─ 대상  → Row / Range 등
└─ 시간  → 언제 획득·해제할 것인가
            → 2PL과 연결
```

이 세 축을 섞지 않으면 `S/X`, `Range Lock`, `2PL`의 역할을 구분하기 쉽다.

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

## 8. 2PL은 Lock 운용 Protocol이다

S/X는 Lock의 종류이고 2PL(Two-Phase Locking)은 **그 Lock을 언제 획득하고 해제할지 정하는 Protocol**이다.

```text
Lock 방식
├─ S / X          : 어떤 Lock인가
├─ Row / Range    : 어디에 Lock을 거는가
└─ 2PL            : 언제 Lock을 잡고 푸는가
```

### 왜 필요한가

각 순간 S/X Lock의 공유·독점 규칙을 지켜도 Transaction 전체에서 Lock을 마음대로 잡고 풀면 Conflict의 선후관계가 뒤집힐 수 있다.

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

## 9. MVCC는 읽을 Version을 선택해 동시성을 높인다

MVCC(Multi-Version Concurrency Control)는 **하나의 Data에 여러 Version을 유지하고, 각 Transaction이나 Statement가 볼 수 있는 Version을 선택하는 동시성 제어 방식**이다.

```text
같은 Data X

v1 = 100   ← 과거 Version
v2 = 200   ← 이후 Version
v3 = 300   ← 더 최신 Version
```

Transaction마다 Data 전체를 따로 복사하는 것이 아니다. 변경에 따라 여러 Version이 존재하고, 읽는 쪽은 자신의 Snapshot과 Visibility 규칙에 맞는 Version을 본다.

```text
                여러 Version
             v1   v2   v3
              │    │    │
       ┌──────┴────┴────┴──────┐
       │                       │
Snapshot A                 Snapshot B
       │                       │
       ▼                       ▼
   v1이 보임                 v2가 보임
```

핵심은 **다른 Transaction이 새 Version을 만들고 있어도 Reader가 자신에게 보이는 기존 Version을 읽을 수 있다는 것**이다. 그래서 전통적인 Lock-only 방식보다 Read와 Write가 서로 기다리는 상황을 줄일 수 있다. PostgreSQL은 MVCC에서 각 SQL Statement가 Snapshot을 보며, 일반적인 읽기 Lock과 쓰기 Lock의 충돌을 줄이는 것을 주요 장점으로 설명한다. MySQL InnoDB도 consistent nonlocking read에서 Snapshot을 사용한다.

### Snapshot과 Visibility

```text
Snapshot
= 이 읽기가 바라볼 논리적 시점

Visibility
= 여러 Version 중
  이 Snapshot에서 어떤 Version을 볼 수 있는지 판단하는 규칙
```

따라서 MVCC를 단순히 `과거 값을 저장한다`로만 이해하면 부족하다.

```text
여러 Version 유지
        +
Snapshot
        +
Visibility 판단
        ↓
Reader가 볼 Version 선택
```

Isolation Level에 따라 Snapshot을 잡고 갱신하는 방식은 DBMS마다 다를 수 있다. 예를 들어 InnoDB의 consistent read는 `READ COMMITTED`에서 읽기마다 새 Snapshot을 만들고, `REPEATABLE READ`에서는 같은 Transaction의 consistent read들이 첫 읽기에서 잡은 Snapshot을 공유한다.

### MVCC도 Write 충돌을 없애는 것은 아니다

```text
MVCC
├─ Read ↔ Write 충돌을 줄이는 데 강점
└─ Write ↔ Write 충돌
    → 여전히 조정 필요
```

MVCC를 `Lock을 전혀 사용하지 않는 방식`으로 이해하면 안 된다. 실제 DBMS는 MVCC와 Lock을 함께 사용할 수 있고, Update나 locking read 같은 작업에서는 별도의 Lock·충돌 처리가 필요할 수 있다.

```text
Isolation Level
= 어떤 관찰 결과와 병행 실행을 허용할 것인가

Lock
= 충돌하는 접근을 기다리게 하여 제어

MVCC
= 여러 Version 중 보이는 Version을 선택해
  불필요한 Read/Write 대기를 줄임
```

즉 `Lock vs MVCC`를 완전한 양자택일로 보지 않는다.

---

## 10. 전체 관계를 다시 연결한다

```text
병행 실행
  ↓
어떤 Serial 순서와도 동등하지 않은 결과 가능
  ↓
Serializability
  │
  └─ Conflict
      = 어떤 연산의 선후관계가 중요한가

실제로 관찰되는 이상 현상
Dirty / Non-repeatable / Phantom / Lost Update
  ↓
Isolation Level
= 어디까지 허용·차단할 것인가
  ↓
Concurrency Control
├─ Lock
│   ├─ S / X       → 어떤 Lock?
│   ├─ Row / Range → 어디를 보호?
│   └─ 2PL         → 언제 잡고 풀까?
│
└─ MVCC
    ├─ Version
    ├─ Snapshot
    └─ Visibility  → 어떤 Version을 보여줄까?
```

가장 중요한 경계는 다음 세 줄이다.

```text
Serializability = 병행 실행의 정확성 기준
Isolation Level = 사용자에게 제공할 격리 보장 수준
Lock / MVCC     = 그 보장을 구현하는 동시성 제어 수단
```

## 11. 기억·인출 흐름

```text
왜 동시성 제어가 필요한가?
→ 병행 결과가 어떤 Serial 순서와도 동등하지 않을 수 있어서

Conflict는 무엇인가?
→ 순서를 바꾸면 안 되는 연산 관계

Isolation Level은 무엇인가?
→ 병행 실행에서 어디까지 격리할지 정하는 보장 수준

Lock의 세 축은?
→ 어떤 Lock(S/X) / 어디에(Row/Range) / 언제(2PL)

MVCC의 핵심은?
→ Version + Snapshot + Visibility

Lock과 MVCC의 관계는?
→ 대체재로만 보지 않음. 실제 DBMS는 함께 사용할 수 있음
```
