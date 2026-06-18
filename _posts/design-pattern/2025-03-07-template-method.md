---
title       : Template Method Pattern
description : "상위 abstract class가 알고리즘 골격을, 하위 클래스가 프리미티브 메서드를 채우는 패턴. JdbcTemplate처럼 Strategy와 조합되기도 한다."
date        : 2025-03-07 22:50:42 +0900
updated     : 2025-03-07 22:50:42 +0900
categories  : [design-pattern, "행위"]
tags        : [behavioral-pattern]
pin         : false
hidden      : false
---

## 한 줄 요약
알고리즘의 큰 흐름은 상위 클래스에서 고정해두고, 단계별 세부 구현만 하위 클래스가 채우게 한다. "전체 절차는 같은데 한두 단계만 달라요"가 보이면 Template Method.

## 어떤 문제를 푸는가

커피와 차를 만드는 코드를 따로 짜본다.

```cpp
class Coffee {
public:
    void make() {
        boilWater();
        std::cout << "필터로 커피 우리기" << std::endl;
        pourInCup();
        std::cout << "설탕과 우유 추가" << std::endl;
    }
};

class Tea {
public:
    void make() {
        boilWater();
        std::cout << "티백 우리기" << std::endl;
        pourInCup();
        std::cout << "레몬 추가" << std::endl;
    }
};
```

문제:
- `boilWater()`, `pourInCup()`이 양쪽에 중복.
- 흐름(끓이기 → 우리기 → 따르기 → 첨가)이 두 클래스에 흩어져 있다. "음료 만드는 절차"가 한 곳에 정의되지 않는다.
- 새 음료(코코아) 추가 시 같은 흐름을 또 베껴 적는다.
- 절차에서 한 단계를 빠뜨려도 컴파일러가 알려주지 않는다.

## 패턴 적용 후

추상 클래스에서 흐름을 한 번만 정의하고, 단계별 차이를 하위 클래스가 구현하게 한다.

```cpp
#include <iostream>
#include <memory>

class CaffeineBeverage {
public:
    // 흐름은 여기서 고정. 하위 클래스가 마음대로 못 바꾼다.
    void make() {
        boilWater();
        brew();
        pourInCup();
        if (wantsCondiments()) {
            addCondiments();
        }
    }

    virtual ~CaffeineBeverage() = default;

protected:
    // 공통 구현
    void boilWater() { std::cout << "물 끓이기" << std::endl; }
    void pourInCup() { std::cout << "컵에 따르기" << std::endl; }

    // 하위 클래스가 반드시 구현 — primitive method
    virtual void brew() = 0;
    virtual void addCondiments() = 0;

    // 하위 클래스가 선택적으로 오버라이드 — hook method
    virtual bool wantsCondiments() { return true; }
};

class Coffee : public CaffeineBeverage {
protected:
    void brew() override          { std::cout << "필터로 커피 우리기" << std::endl; }
    void addCondiments() override { std::cout << "설탕과 우유 추가" << std::endl; }
};

class Tea : public CaffeineBeverage {
protected:
    void brew() override          { std::cout << "티백 우리기" << std::endl; }
    void addCondiments() override { std::cout << "레몬 추가" << std::endl; }
};

int main() {
    std::unique_ptr<CaffeineBeverage> drink = std::make_unique<Coffee>();
    drink->make();

    drink = std::make_unique<Tea>();
    drink->make();
}
```

달라진 점:
- `make()` 흐름은 한 곳에만 존재. 절차를 빠뜨릴 수 없다.
- 새 음료 추가 = `brew()`, `addCondiments()` 두 개만 구현.
- `wantsCondiments()` 같은 훅 메서드로 선택적 단계도 표현 가능.

## 구조

```
AbstractClass
    templateMethod()  ← 흐름 고정 (final/non-virtual 권장)
    ├── step1()       ← 공통 구현
    ├── step2() = 0   ← primitive (하위 필수 구현)
    └── step3()       ← hook (하위 선택적 오버라이드)
        ▲
        │
   ConcreteClassA, ConcreteClassB
```

- **AbstractClass**: 템플릿 메서드와 단계들 (`CaffeineBeverage`)
- **ConcreteClass**: 단계의 세부 구현 (`Coffee`, `Tea`)

용어:
- **템플릿 메서드**: 흐름을 정의하는 메서드 (`make`). 보통 오버라이드 불가로 두는 게 안전.
- **프리미티브 메서드**: 하위 클래스가 반드시 구현해야 하는 추상 메서드 (`brew`).
- **훅 메서드**: 기본 구현이 있어 선택적으로 오버라이드 (`wantsCondiments`). 흐름의 가지를 조절.

## 실전 사례 — Strategy와의 조합

Spring의 `*Template`류 클래스는 Template Method를 콜백(=Strategy)으로 합쳐 변형한 형태다.

```java
public class TransactionTemplate {
    public <T> T execute(TransactionCallback<T> action) {
        // 흐름 = 트랜잭션 시작 → 콜백 → 커밋/롤백
        TransactionStatus status = transactionManager.getTransaction(this);
        try {
            T result = action.doInTransaction(status); // 가변 부분을 콜백으로 주입
            transactionManager.commit(status);
            return result;
        } catch (RuntimeException ex) {
            transactionManager.rollback(status);
            throw ex;
        }
    }
}

// 호출
new TransactionTemplate().execute(status -> {
    // 트랜잭션 안에서 실행할 코드
    return repository.save(entity);
});
```

- 정통 Template Method: 가변 부분 = 하위 클래스 (상속)
- Spring Template: 가변 부분 = 콜백 (위임)
- 둘 다 흐름을 가두고 일부만 외부에 맡긴다는 발상은 같다.

기타 사례:
- **JUnit**: `@BeforeEach` → `@Test` → `@AfterEach` 흐름이 프레임워크가 고정한 템플릿.
- **Servlet**: `service()`가 `doGet()` / `doPost()` 를 호출하는 구조.
- **알고리즘 골격**: 정렬에서 비교만 바꾸기, 게임 루프에서 업데이트만 바꾸기.

## Strategy Pattern과의 차이

| | Template Method | Strategy |
|---|---|---|
| 결합 방식 | 상속 (컴파일 타임) | 위임 (런타임 교체 가능) |
| 무엇이 가변인가 | 흐름의 일부 단계 | 알고리즘 전체 |
| 흐름의 주인 | 상위 클래스 | 클라이언트 |
| 단점 | 다중 상속·테스트 어려움 | 객체 수 증가 |

## 안티패턴 / 주의

- **템플릿 메서드를 virtual로 두지 마라**. 하위가 흐름 자체를 갈아엎으면 패턴의 의미가 사라진다. `final`(또는 그에 준하는 보호)로 흐름을 잠그는 게 정석.
- **프리미티브 메서드를 너무 잘게 쪼개면 하위 클래스가 무엇을 구현해야 할지 모른다**. 의미 단위로 묶기.
- **상속 계층이 깊어지면 흐름 파악이 어려워진다**. Template Method는 2계층(추상 → 구체) 정도가 건강하다. 손자 클래스까지 가면 위임(Strategy) 쪽이 낫다.
- **Hollywood Principle**: "우리가 부를 테니 호출하지 마세요". 상위가 하위를 호출하지, 하위가 상위 흐름을 끌고 가면 안 된다.

## GoF 디자인 패턴 시리즈

| 패턴 | 분류 | 핵심 |
| --- | --- | --- |
| [Factory](/posts/design-pattern/2025-04-11-factory/) | 생성 | 생성 책임을 팩토리로 위임해 결합도를 낮춤 |
| [Singleton](/posts/design-pattern/2026-06-18-singleton/) | 생성 | 단일 인스턴스 보장 + 전역 접근점 |
| [Builder](/posts/design-pattern/2026-06-18-builder/) | 생성 | 복잡한 객체를 단계별로 조립 |
| [Adapter](/posts/design-pattern/2025-04-12-adapter/) | 구조 | Adaptee를 Target 인터페이스로 변환 |
| [Composite](/posts/design-pattern/2026-06-18-composite/) | 구조 | Leaf와 Composite를 같은 인터페이스로 트리 처리 |
| [Decorator](/posts/design-pattern/2025-03-07-decorator/) | 구조 | Component를 감싸 동적으로 기능 추가 |
| [Facade](/posts/design-pattern/2026-06-18-facade/) | 구조 | 복잡한 서브시스템을 단순한 진입점으로 |
| [Proxy](/posts/design-pattern/2025-03-07-proxy/) | 구조 | 실제 객체 접근을 대리자가 제어 |
| [Chain of Responsibility](/posts/design-pattern/2026-06-18-chain-of-responsibility/) | 행위 | 핸들러 사슬로 요청을 차례로 시도 |
| [Command](/posts/design-pattern/2025-04-12-command/) | 행위 | 요청을 객체로 캡슐화, Invoker↔Receiver 분리 |
| [Iterator](/posts/design-pattern/2026-06-18-iterator/) | 행위 | 컬렉션 내부 구조 노출 없이 순회 |
| [Observer](/posts/design-pattern/2025-04-11-observer/) | 행위 | Subject→Observer 일대다 통지 |
| [State](/posts/design-pattern/2025-03-07-state/) | 행위 | 상태별 분기를 ConcreteState 객체로 캡슐화 |
| [Strategy](/posts/design-pattern/2025-03-07-strategy/) | 행위 | 알고리즘을 Strategy 인터페이스 뒤로 캡슐화 |
| **Template Method (현재 글)** | 행위 | 골격은 상위, 프리미티브는 하위 클래스 |
| [Head First DP 책 노트](/posts/design-pattern/2025-07-11-head-first/) | 인덱스 | 책 목차 + 챕터별 핵심 |
