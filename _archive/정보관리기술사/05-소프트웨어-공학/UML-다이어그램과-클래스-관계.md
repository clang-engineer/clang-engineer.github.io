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

### C++로 관계를 복원하기

UML 관계는 **코드 문법 자체가 아니라 설계에서 표현하려는 의미**다. 아래 C++ 예제는 각 관계를 떠올리기 위한 대표 구현이며, 한 문법이 UML 관계 하나에 반드시 대응하는 것은 아니다.

#### 1) 일반화(Generalization) — 상속, is-a

```text
Dog ─────▷ Animal
     실선 + 빈 삼각형 (Animal 방향)
```

```cpp
class Animal {
public:
    virtual ~Animal() = default;
    virtual void eat() {}
};

class Dog : public Animal {
public:
    void bark() {}
};
```

`Dog`는 `Animal`의 하위 타입이다. **Generalization은 상위·하위 타입 관계**이고, Specialization은 상위 타입을 하위 유형으로 구분하는 관점이다. 화살표는 언제나 상위 타입을 가리킨다.

#### 2) 실체화(Realization) — 명세 구현

```text
Dog ┄┄┄┄┄▷ Runnable
     점선 + 빈 삼각형 (명세 방향)
```

```cpp
struct Runnable {
    virtual ~Runnable() = default;
    virtual void run() = 0;
};

class Dog : public Runnable {
public:
    void run() override {}
};
```

C++에는 Java의 `interface` 키워드가 없으므로 순수 가상 함수를 가진 추상 클래스를 인터페이스처럼 사용할 수 있다. **C++의 `public` 상속 문법은 같아도 UML에서는 구현하려는 명세·계약의 역할을 강조할 때 Realization으로 모델링**할 수 있다. 점선 자체가 '명세'라는 뜻은 아니며 빈 삼각형과 조합해서 읽는다.

#### 3) 연관(Association) — 객체 사이의 구조적 연결

```text
Order ───── Customer
      실선
```

```cpp
class Customer {};

class Order {
    Customer* customer_; // 비소유 참조; 실제 수명은 외부에서 관리
public:
    explicit Order(Customer& customer) : customer_(&customer) {}
};
```

`Order`가 `Customer`와 연결된 구조를 나타낸다. 실선의 열린 화살표가 있으면 해당 방향의 **Navigability**를 나타낼 수 있다. 포인터 멤버 하나만으로 모든 연관의 의미가 자동 결정되지는 않는다.

#### 4) 의존(Dependency) — 다른 타입을 사용함

```text
ReportService ┄┄┄┄> Printer
              점선 + 열린 화살표
```

```cpp
class Printer {
public:
    void print() const {}
};

class ReportService {
public:
    void report(const Printer& printer) const {
        printer.print();
    }
};
```

`ReportService`는 동작을 수행할 때 `Printer`를 사용한다. **Dependency는 대상 요소의 변경이 사용 측에 영향을 줄 수 있는 관계**로, 함수 매개변수는 이를 떠올리기 좋은 예제다. 단순히 매개변수면 언제나 Dependency라고 판정하는 규칙은 아니다.

#### 5) 집약(Aggregation) — 느슨한 전체·부분

```text
Team ◇──── Member
     빈 마름모는 Team(전체) 쪽
```

```cpp
#include <functional>
#include <vector>

class Member {};

class Team {
    std::vector<std::reference_wrapper<Member>> members_;
public:
    void add(Member& member) {
        members_.push_back(member);
    }
};
```

`Member`는 `Team` 밖에서 생성·관리되며 Team이 사라져도 별도로 존재할 수 있다. 이는 **비소유 전체·부분 관계**를 연상하는 예시다. 실제 설계에서는 Aggregation 대신 일반 Association으로 표현할 수도 있다.

#### 6) 합성(Composition) — 강한 전체·부분

```text
Car ◆──── Engine
    채운 마름모는 Car(전체) 쪽
```

```cpp
class Engine {};

class Car {
    Engine engine_; // Car 객체의 수명에 종속된 값 멤버
};
```

`Engine`은 `Car`의 값 멤버이므로 Car가 생성·파괴될 때 함께 생성·파괴된다. **Composition은 부분의 배타적 소속과 전체·부분의 강한 수명 관계**를 표현한다. `std::unique_ptr`로 독점 소유하는 경우에도 설계 의미에 따라 Composition으로 모델링할 수 있다.

```text
[기호를 보고 C++ 관계를 인출]
빈 △ + 실선 → 상속 관계           → public 상속
빈 △ + 점선 → 명세 구현           → 순수 가상 Interface 구현
실선        → 구조적 연관         → 객체 참조·포인터 멤버
점선 + >    → 사용·변경 의존      → 매개변수로 타입 사용
빈 ◇        → 느슨한 전체·부분    → 외부 객체 비소유 참조
채운 ◆      → 강한 전체·부분      → 값 멤버·독점 소유
```

**주의:** 포인터·참조·값 멤버·`unique_ptr`의 사용만으로 Aggregation/Composition을 확정할 수 없다. 실제 소유권, 수명, 전체·부분이라는 업무 의미까지 함께 판단한다.

### Java와 C++의 표현 차이

앞의 C++ 예제를 기본으로 두고, **Java에서 같은 UML 관계가 어떤 문법으로 드러나는지**만 비교한다. 특히 C++에서는 상속과 인터페이스 역할을 모두 `public` 상속으로 표현할 수 있지만, Java는 `extends`와 `implements`를 구분한다.

```text
UML 관계               C++                         Java
Generalization         public 상속                 extends
Realization            추상 클래스 구현            implements interface
Association            멤버 포인터·참조            객체 참조 필드
Dependency             함수 매개변수 사용          메서드 매개변수 사용
Aggregation            외부 객체 비소유 참조       외부 객체 참조·컬렉션
Composition            값 멤버·독점 소유           강한 소유·수명 정책
```

#### 상속과 구현 — Java에서 더 직접적으로 구분

```java
class Animal {
    void eat() {}
}

interface Runnable {
    void run();
}

class Dog extends Animal implements Runnable {
    @Override
    public void run() {}
}
```

```text
Dog ─────▷ Animal       Generalization (extends)
Dog ┄┄┄┄▷ Runnable      Realization (implements)
```

`extends`는 클래스의 상위·하위 타입 관계를, `implements`는 Interface 계약의 구현을 나타내는 대표 문법이다. **Java의 `interface extends interface`는 인터페이스 사이의 일반화**이므로, `extends`라는 단어만으로 UML 관계를 기계적으로 확정하지 않는다.

#### 연관과 의존 — 필드와 매개변수

```java
class Customer {}

class Order {
    private final Customer customer;

    Order(Customer customer) {
        this.customer = customer;
    }
}

class Printer {
    void print() {}
}

class ReportService {
    void report(Printer printer) {
        printer.print();
    }
}
```

`Order`는 `Customer`를 필드로 보유해 지속적인 연결을 나타내고, `ReportService`는 메서드 실행에서 `Printer`를 사용한다. 각각 Association과 Dependency를 떠올리기 좋은 예제지만 **필드냐 매개변수냐만으로 UML 관계가 결정되지는 않는다.**

#### 집약과 합성 — Java에서는 소유 의미를 확인

```java
import java.util.ArrayList;
import java.util.List;

class Member {}

class Team {
    private final List<Member> members = new ArrayList<>();

    void add(Member member) {
        members.add(member); // 외부에서 생성한 Member를 참조
    }
}

class Engine {}

class Car {
    private final Engine engine = new Engine(); // Car 내부에서 생성·관리
}
```

`Team`의 `Member`는 외부에서도 독립적으로 존재할 수 있으므로 집약을 연상하는 예제다. `Car`의 `Engine`은 Car의 내부 구성요소로 관리하도록 설계했으므로 합성을 연상할 수 있다. **Java의 Garbage Collection은 객체 메모리 회수 방식이지 UML Composition의 의미 자체가 아니다.** `Car`가 더 이상 사용되지 않아도 `Engine`이 즉시 메모리에서 삭제된다는 뜻은 아니며, 다른 곳에서 참조하고 있는지도 별도로 고려해야 한다.

결국 C++의 `unique_ptr`나 Java의 `final` 필드만으로 집약·합성을 확정할 수 없다. **전체·부분 관계의 배타성, 소유 책임, 논리적 수명**을 함께 모델링해야 한다.

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
5. C++에서 public 상속을 사용해도 Generalization과 Realization을 구분해서 모델링하는 이유는?
6. 같은 포인터·참조 형태라도 Association과 Aggregation을 구분하려면 무엇을 봐야 하는가?
7. ER Entity와 UML Class는 왜 완전히 같지 않은가?
