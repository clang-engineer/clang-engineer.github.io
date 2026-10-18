# UML 다이어그램과 클래스 관계

## 이 문서에서 되짚을 질문

- UML은 개발 방법론인가, 모델링 언어인가?
- 구조·행위 다이어그램은 각각 무엇을 표현하는가?
- Class Diagram의 상속·구현·연관·집약·합성·의존은 어떻게 구분하는가?
- ER Diagram과 UML Class Diagram은 무엇이 다른가?

## 1. 전체 좌표

UML(Unified Modeling Language)은 시스템의 구조와 행위를 여러 관점에서 표현하는 모델링 언어다. 개발 방법론 자체는 아니며, 모든 Diagram을 한 프로젝트에서 전부 작성할 필요도 없다.

```text
UML
├─ 구조 Diagram (7) → 무엇으로 구성되는가?
│  ├─ Class               → 타입·속성·Operation·관계
│  ├─ Object              → 특정 시점의 Instance
│  ├─ Package             → 요소의 묶음과 의존
│  ├─ Component           → 모듈·Interface
│  ├─ Composite Structure → 내부 구성·협력
│  ├─ Deployment          → Node·Artifact 배치
│  └─ Profile             → UML 확장·Stereotype
│
└─ 행위 Diagram (7) → 무엇을 어떻게 수행하는가?
   ├─ Use Case            → Actor와 시스템 기능
   ├─ Activity            → 작업 흐름·분기·병렬
   ├─ State Machine       → 상태·Event·Transition
   └─ Interaction (4)     → 요소 간 상호작용
      ├─ Sequence         → 시간 순서의 Message
      ├─ Communication    → 연결 중심의 Message
      ├─ Timing           → 시간에 따른 상태·값 변화
      └─ Interaction Overview → 상호작용 흐름의 조합
```

Interaction 4종은 행위 Diagram 7종에 포함된다. 따라서 총 14종이며 4종을 다시 더하지 않는다.

## 2. Class Diagram — 정적 구조

```text
┌───────────────────┐
│      Order        │  Class 이름
├───────────────────┤
│ - id: Long        │  Attribute
│ - status: Status  │
├───────────────────┤
│ + cancel(): void  │  Operation
└───────────────────┘

+ public   - private   # protected
```

Class Diagram은 클래스의 구조와 관계를 나타낸다. 메서드 호출의 실제 시간 순서는 Sequence Diagram에서 표현한다.

### 관계와 선의 의미

```text
Class 관계
├─ Generalization → 상속·is-a
│  └─ 실선 ─────▷ (빈 삼각형: 상위 Class)
├─ Realization    → Interface 등 명세 구현
│  └─ 점선 ┄┄┄┄▷ (빈 삼각형: 명세)
├─ Association    → 구조적 연결·참조
│  └─ 실선 ─────
├─ Aggregation    → 느슨한 전체–부분
│  └─ 실선 ─────◇ (빈 마름모: 전체)
├─ Composition    → 강한 전체–부분·수명 종속
│  └─ 실선 ─────◆ (채운 마름모: 전체)
└─ Dependency     → 사용·변경 영향
   └─ 점선 ┄┄┄┄> (열린 화살표: 의존 대상)
```

위 그림은 기호를 기억하기 위한 약식 ASCII 표현이다. 상속과 구현의 빈 삼각형은 **상위 타입·명세 방향**, 집약과 합성의 마름모는 **전체 방향**에 붙는다.

```text
Animal ◁──── Dog             : 상속
Payable ◁┄┄┄ Invoice         : 구현
Customer ─── Order           : 연관
Team ◇──── Member            : 집약
Order ◆──── OrderLine        : 합성
ReportService ┄┄> Printer    : 의존
```

Aggregation과 Composition은 전체–부분 관계지만 Composition은 부분이 동시에 둘 이상의 전체에 속하지 않는 강한 결합을 나타낸다. Aggregation은 의미가 느슨해 단순 Association으로 표현하기도 한다.

### Multiplicity

```text
Customer 1 ─────── 0..* Order
```

고객 하나에 주문 0개 이상이 연결될 수 있다는 의미다. Multiplicity는 연결 개수를, Navigability는 관계를 탐색할 수 있는 방향을 표현하므로 구분한다.

## 3. 행위 Diagram — 질문별로 구분

```text
무엇을 표현하는가?
├─ 사용자와 기능       → Use Case
├─ 작업·조건·병렬 흐름 → Activity
├─ 상태와 이벤트       → State Machine
└─ 객체 간 상호작용    → Interaction
   ├─ 시간 순서        → Sequence
   ├─ 연결 중심        → Communication
   ├─ 시간에 따른 변화 → Timing
   └─ 상호작용의 조합  → Interaction Overview
```

주문 취소를 예로 들면 Use Case는 고객의 취소 기능, Activity는 취소 가능 여부에 따른 분기, State Machine은 주문 상태 전이, Sequence는 주문·결제 서비스의 메시지 순서를 나타낸다. 같은 기능이라도 Diagram마다 질문이 다르다.

## 4. ER/EER와의 경계

```text
ER / EER                     UML Class Diagram
Entity · Attribute           Class · Attribute
Relationship                 Association
Cardinality · Participation  Multiplicity
Supertype / Subtype          Generalization
                             Operation (Method)
```

ER/EER는 업무 데이터의 의미와 제약을, UML Class Diagram은 객체의 타입·속성·Operation과 관계를 중심으로 표현한다. ER Diagram과 UML 전체를 같은 수준으로 비교하지 않는다.

→ [ER · EER 모델과 표기법](../08-데이터베이스/ER-EER-모델과-표기법.md) — 데이터 모델링의 관점에서 차이 확인

## 5. 이해 복원

1. UML 14종은 구조·행위 관점에서 어떻게 나뉘는가?
2. 실선 빈 삼각형과 점선 빈 삼각형의 차이는?
3. 빈 마름모와 채운 마름모는 어디에 붙는가?
4. Class·Sequence·Activity·State Machine은 각각 어떤 질문에 답하는가?
5. ER Entity와 UML Class는 왜 완전히 같지 않은가?
