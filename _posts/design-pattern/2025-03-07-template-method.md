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

> **난이도** 중급 · **선행** [Strategy](/posts/design-pattern/2025-03-07-strategy/)

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


## 스스로 점검

**1. 음료 만들 때 "우유 추가"를 선택적으로 건너뛰려면 어떤 메서드를 오버라이드해야 하나?**

<details markdown="1">
<summary>답</summary>

`wantsCondiments()` 훅 메서드. 기본은 true를 반환하지만 하위 클래스에서 false를 반환하면 `make()`의 첨가 단계가 스킵된다. 흐름의 가지를 조절하는 방식.

</details>

**2. `make()` 템플릿 메서드를 virtual로 만들면 안 되는 이유는?**

<details markdown="1">
<summary>답</summary>

흐름 자체를 하위가 갈아엎으면 패턴의 의미가 사라진다. "우리가 부를 테니 호출하지 마세요"(Hollywood Principle) — 골격은 잠그고 단계만 열어둔다.

</details>

**3. Spring의 `TransactionTemplate`은 정통 Template Method와 어떻게 다른가?**

<details markdown="1">
<summary>답</summary>

정통은 가변 부분을 **하위 클래스 상속**으로 채운다. Spring Template은 **콜백(=Strategy)**으로 주입한다. 흐름을 가두고 일부만 외부에 맡긴다는 발상은 동일.

</details>

{% include design-pattern-series.html current="template-method" %}
