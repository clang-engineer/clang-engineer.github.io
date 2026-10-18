# ER · EER 모델과 Diagram 표기법

## 이 문서에서 되짚을 질문

- ER Model과 ER Diagram은 어떻게 다른가?
- Entity·Attribute·Relationship와 Cardinality·Participation은 무엇을 표현하는가?
- EER가 추가하는 Supertype·Subtype은 무엇인가?
- Chen·Crow's Foot·IDEF1X는 모델의 종류인가, 표기법인가?
- UML Class Diagram과 어디서 겹치고 어디서 다른가?

## 1. 전체 좌표 — 데이터의 의미를 모델로 표현한다

업무 데이터는 Table부터 만드는 것이 아니라, **어떤 대상과 관계를 관리해야 하는지** 먼저 정리한다.

```text
현실 업무 · 요구사항
       ↓
개념 데이터 모델링
       │
       ├─ ER Model ── Entity · Attribute · Relationship
       │               └─ Cardinality · Participation
       │
       └─ EER Model ── ER의 표현력 확장
                       ├─ Supertype / Subtype
                       ├─ Specialization / Generalization
                       └─ Category (Union Type)
       ↓
ER / EER Diagram으로 시각화
       ├─ Chen
       ├─ Crow's Foot
       └─ IDEF1X (주로 논리 데이터 모델링에 사용)
       ↓
논리 모델링 → Relation · Key · 제약조건
       ↓
물리 설계 → Index · 저장·접근 구조
```

**ER/EER는 모델의 개념적 표현 범위이고, Chen·Crow's Foot·IDEF1X는 모델을 그리는 표기 방식**이다. 같은 데이터 구조라도 사용하는 표기법에 따라 그림의 모양이 달라진다. ERD는 Entity-Relationship Diagram의 약어로 ER Diagram과 같은 말이다.

## 2. ER Model의 핵심 구성과 제약

```text
ER Model
├─ Entity       → 독립적으로 식별·관리할 대상 (회원, 주문)
├─ Attribute    → 대상이나 관계의 특성 (회원명, 주문일)
├─ Relationship → 대상 사이의 업무상 연결 (회원이 주문함)
└─ 관계 제약
   ├─ Cardinality  → 몇 개와 연결되는가? (1:1, 1:N, M:N)
   └─ Participation → 반드시 참여하는가? (전체 / 부분)
```

예를 들어 **회원 한 명은 여러 주문을 할 수 있고, 주문은 반드시 한 회원에 속한다**고 가정해 보자. 회원과 주문은 Entity, 회원명과 주문일은 Attribute, '주문한다'는 Relationship이다. 회원과 주문 사이의 1:N은 Cardinality이고, 모든 주문이 회원과 연결되어야 한다는 조건은 주문의 전체 참여(Total Participation)다. 회원은 주문하지 않을 수도 있으므로 부분 참여(Partial Participation)다.

```text
회원 ── 주문한다 ── 주문
 1                    N

회원: 주문 0..N개 가능
주문: 회원 정확히 1명 필요
```

**1:N만으로 최소 참여 수까지 알 수 있는 것은 아니다.** 최대 개수(Cardinality)와 필수 여부(Participation)를 함께 확인해야 업무 제약을 복원할 수 있다.

Attribute는 단순·복합, 단일값·다중값, 저장·유도 속성 등으로 구분할 수 있다. Key Attribute는 Entity를 식별하는 데 사용한다. 약한 개체(Weak Entity)는 다른 Entity와의 식별 관계에 의존한다.

## 3. EER — 상위·하위 타입을 표현한다

기본 ER이 Entity와 관계를 표현한다면, EER(Enhanced Entity-Relationship)는 **공통 속성을 가진 Entity를 상위·하위 타입으로 조직하는 표현** 등을 추가한다.

```text
                회원 (Supertype)
                 │ 공통 속성: 회원ID, 이름
           ┌─────┴─────┐
           │           │
        개인회원      법인회원
        (Subtype)     (Subtype)
           │           │
        생년월일      사업자번호

Specialization: 회원 → 개인회원·법인회원 (하위 유형 분리)
Generalization : 개인회원·법인회원 → 회원 (공통 상위 유형 추출)
Inheritance    : Subtype이 Supertype의 속성·관계를 상속
```

Subtype 제약은 별도의 두 축으로 본다.

- **Disjoint / Overlapping:** 하나의 상위 Entity가 여러 하위 타입에 동시에 속할 수 있는가?
- **Total / Partial Specialization:** 모든 상위 Entity가 적어도 하나의 하위 타입에 속해야 하는가?

Category(Union Type)는 서로 다른 상위 Entity 집합의 합집합을 기반으로 하는 하위 유형을 표현한다. 예를 들어 소유자가 개인 또는 법인일 수 있는 경우를 생각할 수 있다. 일반적인 상위·하위 관계와는 구분한다.

## 4. Diagram 표기법은 모델 자체가 아니다

| 표기법 | 대표적인 시각 요소 | 기억할 특징 |
|---|---|---|
| Chen | Entity 사각형 · Attribute 타원 · Relationship 마름모 | 개념 모델의 구성요소를 분리해 표현 |
| Crow's Foot | Entity 상자 · 관계선 끝 갈퀴·원·막대 | 관계의 최소·최대 참여 수를 읽기 편함 |
| IDEF1X | Entity 상자 · 식별/비식별 관계 표기 | Key와 식별 관계 중심의 데이터 모델링 |

```text
[Chen: 개념적 관계 표현]
[회원] ── ◇주문한다◇ ── [주문]
   └─ (회원명)              └─ (주문일)

[Crow's Foot: 관계선의 끝 기호]
|    → 정확히 하나
O<   → 0개 이상
|<   → 1개 이상
O|   → 0개 또는 1개
```

위 Crow's Foot 기호는 **한쪽 끝의 최소·최대 개수를 기억하기 위한 텍스트 약식 표현**이다. 실제 Diagram에서는 양쪽 Entity에 연결된 선 끝의 기호를 함께 읽는다. Chen·Crow's Foot·IDEF1X는 하나의 고정된 'ER 모델 종류'가 아니라 서로 다른 표기 관례다.

### 같은 업무를 세 표기법으로 표현하기

다음 업무 규칙을 공통 예제로 사용한다. **회원은 주문을 하지 않을 수도 있고 여러 주문을 할 수 있다. 주문은 반드시 한 회원에 속한다. 주문에는 하나 이상의 주문항목이 있으며, 각 주문항목은 한 상품을 참조한다.** 상품은 아직 주문된 적이 없을 수 있다.

```text
[업무 규칙의 큰 그림]

회원 (1) ── (0..N) 주문 (1) ── (1..N) 주문항목
                                 │
                                 │ 각 항목은 상품 1개 참조
                                 ▼
                                상품
```

#### 1) Chen — 개체·관계·속성을 실제 도형으로

아래는 **회원이 주문한다**는 업무 관계를 Chen 표기법의 도형으로 그린 ASCII/Unicode 구조도다. 타원은 속성, 사각형은 개체, 마름모는 관계를 뜻한다.

```text
        ╭────────╮                       ╭────────╮
      ╱            ╲                   ╱            ╲
     (    회원명    )                 (    주문일    )
      ╲            ╱                   ╲            ╱
        ╰────┬───╯                       ╰────┬───╯
             │                                │
       ┌─────┴──────┐                  ┌──────┴─────┐
       │    회원    │                  │    주문    │
       └─────┬──────┘                  └──────┬─────┘
             │ 1                             │ N
             │          ╱────────╲          │
             └─────────╱ 주문한다 ╲──────────┘
                       ╲          ╱
                        ╲────────╱

사각형 ┌─┐   Entity       : 회원, 주문
타원   (  )  Attribute    : 회원명, 주문일
마름모 ╱ ╲   Relationship : 주문한다
```

`1:N`은 **회원 하나가 여러 주문과 관계를 맺을 수 있음**을 나타낸다. 이 예제에서는 회원이 주문하지 않을 수도 있고(부분 참여), 주문은 반드시 한 회원에 속한다고(전체 참여) 가정한다. 실제 Chen Diagram에서는 주문 쪽의 전체 참여를 **이중 연결선**으로 표시할 수 있다.

추가로 속성의 표기까지 기억해 두자.

```text
Chen의 대표 Attribute 기호
├─ 일반 속성   → 단일 타원
├─ Key 속성    → 이름에 밑줄
├─ 다중값 속성 → 이중 타원
├─ 유도 속성   → 점선 타원
└─ 복합 속성   → 큰 속성 타원에서 하위 속성 타원 분기
```

텍스트 구조도는 모양을 최대한 재현한 것으로, 실제 도구에서 그린 곡선·이중선·점선과 완전히 같지는 않다. 중요한 건 **개체·관계·속성을 서로 다른 도형으로 표현한다는 원리**다.

#### 2) Crow's Foot — 개체 상자 안에 속성을 배치

```text
┌────────────────────┐            ┌──────────────────────┐
│ 회원               │            │ 주문                 │
├────────────────────┤            ├──────────────────────┤
│ PK 회원ID          │ 1      N   │ PK 주문ID            │
│ 회원명             │────────────│ FK 회원ID            │
└────────────────────┘            │ 주문일               │
                                  └──────────────────────┘

회원 1명 → 주문 0..N건
주문 1건 → 회원 정확히 1명
```

위 연결선은 가독성을 위한 약식 표현이다. 실제 Crow's Foot에서는 **주문 쪽 끝에 원 + 갈퀴(0..N)**, **회원 쪽 끝에 막대 두 개(정확히 1)**를 배치해 최소·최대 개수를 함께 나타낸다.

#### 3) IDEF1X — 식별 관계와 비식별 관계

```text
회원 (PK 회원ID)
   │
   └─ 주문 (PK 주문ID, FK 회원ID)
       → 주문ID가 독립 PK이면 회원–주문은 비식별 관계

주문 (PK 주문ID)
   │
   └─ 주문항목 (PK 주문ID + 항목번호, FK 주문ID)
       → 부모 주문ID가 자식 PK의 일부이면 식별 관계
```

IDEF1X는 단순히 FK가 있다는 사실보다 **부모 Key가 자식의 식별자에 포함되는가**를 구분해 읽는다. 비식별 관계는 일반적으로 점선, 식별 관계는 실선으로 표현한다. 실제 IDEF1X 표기에서는 종속 Entity의 모서리 모양 등 추가 표기 규칙도 사용한다.

### 개념 ERD에서 실제 Table로

```text
업무 의미              논리 모델                   물리 모델 예시
회원·주문 관계    →     회원·주문 Entity      →     member / orders Table
회원 식별자       →     회원ID (식별자)       →     member_id BIGINT PK
주문이 회원 참조  →     주문의 회원ID (FK)    →     orders.member_id FK
주문항목 식별     →     주문ID + 항목번호      →     order_item 복합 PK
```

**개념 모델의 Entity가 항상 Table 하나로, Relationship이 항상 FK 하나로 바뀌지는 않는다.** 특히 M:N 관계는 연결 Table로 변환하는 경우가 많고, 상위·하위 타입은 여러 물리 매핑 전략이 가능하다. 또한 개념 ERD에서도 속성을 표현할 수 있으며, 논리·물리 ERD에서도 표시 설정에 따라 속성을 숨길 수 있다. 따라서 **속성의 표시 여부만으로 개념·논리·물리 모델을 판정하지 않는다.**

## 5. UML Class Diagram과의 경계

```text
ER / EER                         UML Class Diagram
├─ Entity · Attribute            ├─ Class · Attribute
├─ Relationship                  ├─ Association
├─ Cardinality · Participation   ├─ Multiplicity
└─ Supertype / Subtype (EER)     ├─ Generalization
                                 └─ Operation (Method)
```

두 방식 모두 **대상·속성·관계·일반화**를 표현할 수 있다. 그러나 ER/EER는 데이터의 업무 의미와 제약을 중심으로, UML Class Diagram은 소프트웨어 객체의 구조와 책임·Operation까지 표현한다. **Entity와 Class를 무조건 같은 것으로 대응시키지 않는다.** 데이터 모델과 객체 모델은 목적이 다르므로 실제 설계에서 변환·조정이 필요할 수 있다.

UML의 전체 Diagram 분류와 관계선 표기는 [UML 다이어그램과 클래스 관계](../05-소프트웨어-공학/UML-다이어그램과-클래스-관계.md)에서 별도로 다룬다.

## 6. 이해 복원

1. ER Model과 ER Diagram, EER, 표기법은 각각 어떤 수준의 개념인가?
2. 1:N과 전체·부분 참여를 구분해야 하는 이유는?
3. Specialization과 Generalization은 어느 방향에서 같은 상위·하위 구조를 보는가?
4. Chen과 Crow's Foot의 그림은 달라도 같은 업무 관계를 표현할 수 있는 이유는?
5. ER Entity와 UML Class를 단순히 동일시하면 무엇이 빠지는가?

**ER/EER는 데이터 의미와 제약을 표현하는 모델이고, 표기법은 그것을 그리는 방식이다.** 막히는 부분만 다시 읽는다.
