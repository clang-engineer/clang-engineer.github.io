# 분산 데이터베이스, CAP·PACELC와 NoSQL

## 이 문서에서 되짚을 질문

- CAP에서 왜 P는 자유롭게 포기하는 선택지가 아닌가?
- 파티션이 발생했을 때 CP와 AP는 무엇을 다르게 선택하는가?
- PACELC는 CAP이 다루지 않는 어떤 상황을 보완하는가?
- NoSQL은 하나의 기술인가, 여러 데이터 모델의 묶음인가?
- Document·Key-Value·Wide-Column·Graph는 어떤 문제에 각각 강한가?
- RDB와 NoSQL을 무엇을 기준으로 선택해야 하는가?

## 1. 먼저 위치를 잡는다

단일 DB의 용량·처리량·가용성 한계를 넘으면 데이터를 여러 Node에 복제하거나 분할하는 분산 구조를 검토한다.

```text
단일 DB 한계
   ↓
분산
├─ Replication
├─ Sharding
└─ 분산 DB
      ↓
네트워크 단절 가능
      ↓
CAP Trade-off
```

분산 구조의 핵심 비용은 **Node가 서로 항상 같은 상태라고 가정할 수 없다는 것**이다. CAP은 이 장애 상황의 일관성·가용성 선택을 설명하고, PACELC는 정상 상황의 지연시간·일관성 선택까지 확장해서 본다.

## 2. CAP — 파티션이 나면 C와 A를 동시에 지킬 수 없다

CAP의 세 속성은 다음과 같다.

- Consistency: 어느 Node에서 읽더라도 최신 Write와 일관된 결과를 얻는다.
- Availability: 모든 요청이 실패하지 않고 응답을 받는다.
- Partition Tolerance: Node 사이 Network Partition이 생겨도 시스템이 동작을 계속한다.

핵심 상황은 다음이다.

```text
Node Group A        X        Node Group B
   Write x=2      Partition      Read x
```

B는 A의 최신 Write를 확인할 수 없다. 이때 선택은 둘뿐이다.

```text
옛 값이라도 응답
→ Availability 유지
→ Consistency 포기

최신 여부를 확인할 수 없어 거부·대기
→ Consistency 유지
→ Availability 포기
```

따라서 CAP을 단순히 `C/A/P 중 둘을 고른다`고 외우면 정확하지 않다. 실제 분산 환경에서는 Network Partition이 설계자의 의도와 무관하게 발생할 수 있으므로, **Partition이 발생한 상황에서 C와 A 중 무엇을 우선할지**가 핵심이다.

## 3. CP와 AP

### CP

Partition 중 최신 상태를 보장할 수 없는 Node가 요청을 거부하거나 대기한다.

```text
정확한 최신값을 보장 못함
→ 응답하지 않음
→ C 우선, A 희생
```

금융 원장·합의 상태처럼 오래된 값을 반환하는 것이 잘못된 동작이 되는 경우에 적합하다.

### AP

Partition 중에도 각 Node가 가진 상태로 응답한다.

```text
최신값인지 확신 못함
→ 현재 가진 값으로 응답
→ A 우선, C 완화
```

Partition이 복구된 뒤 복제본이 수렴하도록 설계할 수 있다. 이때 흔히 Eventual Consistency가 등장한다.

## 4. CAP에서 헷갈리는 경계

```text
CAP의 C
→ 분산 Node 사이 최신값 관점의 일관성

ACID의 C
→ 업무 무결성 제약을 만족하는 상태
```

같은 `Consistency`라는 단어지만 분류축이 다르다.

또 CAP의 Partition은 **Network Partition**이다.

```text
CAP Partition
→ Node 사이 통신 단절

Table Partition / Sharding
→ 데이터를 나누어 배치하는 설계
```

이 둘을 섞지 않는다.

## 5. PACELC — 정상 상황에서도 선택은 남는다

CAP은 Partition이 발생한 장애 상황을 설명하는 데 강하지만, Partition이 없는 평상시의 선택은 직접 설명하지 않는다.

PACELC는 다음 질문을 추가한다.

```text
If Partition
→ Availability vs Consistency

Else
→ Latency vs Consistency
```

즉 복제본 여러 개의 확인을 기다리면 더 강한 일관성을 얻을 수 있지만 응답 지연이 커질 수 있고, 빠른 응답을 우선하면 일부 시점의 일관성을 완화할 수 있다.

> 기억: **P가 나면 A/C, 평상시에는 L/C까지 본다.**

## 6. NoSQL은 하나의 데이터베이스 종류가 아니다

NoSQL은 관계형 모델 이외의 여러 데이터 모델을 느슨하게 묶는 범주다. `SQL을 사용하지 않는다`가 핵심이 아니라, 데이터 모델·접근 경로·확장성 요구에 따라 관계형 모델의 일부 제약을 다른 방식으로 선택하는 것이다.

대표적인 네 유형은 다음과 같다.

| 유형 | 핵심 모델 | 강한 문제 | 약한 문제 |
|---|---|---|---|
| Document | 중첩 Document | 유연한 Aggregate·반정형 데이터 | 자유로운 관계 Join |
| Key-Value | Key → Value | 단순 Key 조회·Cache·Session | Value 내부 임의 검색 |
| Wide-Column | Partition Key 중심의 희소 Row | 대량 Write·시계열·Scale-out | 임의 조건·Join |
| Graph | Node + Edge | 다단계 관계 탐색 | 대량 Scan·집계 |

제품 하나가 여러 성격을 함께 가질 수 있으므로 이 분류를 절대적인 제품 분류표로 보지 않는다.

## 7. Document

Document Store는 JSON과 비슷한 중첩 구조를 하나의 Aggregate로 저장하기 좋다.

```text
User
├─ 기본정보
├─ Address[]
└─ Tag[]
```

RDB에서 여러 Table과 Join으로 나눌 데이터를 한 Document로 읽고 쓰는 접근이 자연스러운 경우에 유리하다.

다만 `Schema-less`를 `Schema가 없다`고 이해하면 안 된다. 저장소가 고정 Table Schema를 강제하지 않을 뿐, Application은 여전히 데이터 구조와 검증 규칙을 가져야 한다.

## 8. Key-Value

```text
Key
  ↓
Value
```

조회 경로가 명확하고 단순하므로 Session, Cache, Counter처럼 특정 Key로 빠르게 읽고 쓰는 Workload에 강하다. 반면 Value 내부의 임의 조건으로 탐색해야 하면 별도의 Index나 다른 모델이 필요해질 수 있다.

## 9. Wide-Column

Wide-Column은 보통 Partition Key로 데이터 배치 위치를 정하고, Partition 내부 정렬·조회 경로를 미리 설계한다.

```text
Query Pattern 먼저 결정
        ↓
Partition Key / Clustering Key 설계
        ↓
Table 구조 결정
```

RDB처럼 나중에 임의 Query를 자유롭게 조합하기보다, **미리 예상한 접근 경로에 맞춰 저장 구조를 설계**하는 성격이 강하다.

## 10. Graph

Graph DB는 관계 자체를 1급 데이터로 다룬다.

```text
(Node)-[Relation]->(Node)
```

친구의 친구, 사기 거래 경로, 지식 그래프처럼 여러 단계의 연결 관계를 반복 탐색하는 문제에 적합하다.

## 11. BASE와 Eventual Consistency

분산 NoSQL 설명에서 BASE가 자주 등장한다.

```text
Basically Available
Soft State
Eventual Consistency
```

Eventual Consistency는 새 Write가 더 이상 없다면 시간이 지나 복제본이 같은 상태로 수렴한다는 모델이다. **항상 오래된 값을 반환한다는 뜻도 아니고, 모든 NoSQL이 Eventual Consistency만 제공한다는 뜻도 아니다.**

현대 DB 제품은 Quorum, Read/Write Concern, Transaction 등 다양한 조절점을 제공하므로 `RDB = ACID`, `NoSQL = BASE`를 절대적인 양자택일로 외우지 않는다.

## 12. RDB와 NoSQL 선택 기준

기본값은 기술 유행이 아니라 데이터 모델과 요구사항이다.

| 질문 | RDB 쪽 | NoSQL 쪽 |
|---|---|---|
| 관계와 Join이 핵심인가? | 유리 | 모델에 따라 제한적 |
| 여러 Row를 묶는 강한 Transaction이 중요한가? | 유리 | 제품별 확인 |
| Schema가 안정적인가? | 유리 | 유연한 모델이 필요하면 후보 |
| 접근 경로가 고정적인가? | 필수 아님 | Key/Wide-Column에 유리 |
| 다단계 관계 탐색이 핵심인가? | Join/재귀 Query | Graph가 후보 |
| 단일 Node 한계를 넘는 Scale-out이 핵심인가? | 분산 설계 필요 | 일부 제품이 기본 구조로 제공 |

규모가 작고 관계형 요구가 명확하다면 PostgreSQL 같은 RDB 하나로 해결하는 편이 운영 복잡성이 낮을 수 있다. NoSQL은 `더 최신 기술`이 아니라 **특정 데이터 모델과 확장 요구에 맞는 대안**이다.

## 13. 한 번에 다시 떠올리기

```text
분산
 ↓
Network Partition 가능
 ↓
CAP
├─ CP : 최신값 우선, 응답 일부 포기
└─ AP : 응답 우선, 즉시 일관성 완화

정상 상황까지 확대
→ PACELC : Latency ↔ Consistency

저장 모델 선택
├─ Document
├─ Key-Value
├─ Wide-Column
└─ Graph
```

> **CAP은 분산 장애 상황의 선택을, PACELC는 정상 상황의 비용까지 설명한다. NoSQL은 하나의 기술이 아니라 서로 다른 데이터 모델과 Trade-off의 묶음이다.**
