---
title       : Template Method Pattern
description : "상위 abstract class가 알고리즘 골격을, 하위 클래스가 프리미티브 메서드를 채우는 패턴. JdbcTemplate처럼 Strategy와 조합되기도 한다."
date        : 2025-03-07 22:50:42 +0900
updated     : 2025-03-07 22:50:42 +0900
categories  : [design-pattern, "행동"]
tags        : [behavioral-pattern]
pin         : false
hidden      : false
---

## 개요
- 알고리즘의 구조(골격)를 메소드에 정의하고, 하위 클래스에서 알고리즘 구조의 변경없이 알고리즘을 재정의할 수 있게 하는 패턴.
- 상위 클래스에서 알고리즘의 구조를 정의하는 메소드를 템플릿 메소드라고 한다.
- 하위 클래스에서 템플릿 메소드를 구현하는 메소드를 프리미티브 메소드라고 한다.
- 상위 클래스에서 템플릿 메소드를 호출하면, 하위 클래스에서 구현한 프리미티브 메소드가 호출된다.

> 상위 클래스가  흐름 제어를 담당하고, 하위 클래스가 구체적인 작업을 담당하는 디자인 패턴

## 사용하는 경우
- 여러 클래스가 비슷한 알고리즘을 가지고 있고, 알고리즘의 구조를 변경하지 않고 알고리즘을 재정의하고 싶은 경우
- 알고리즘의 구조를 변경하지 않고 알고리즘을 재정의하고 싶은 경우

## 구성요소
- AbstractClass: 알고리즘의 구조를 정의하는 클래스
- ConcreteClass: 알고리즘을 구현하는 클래스

## 예제
```cpp
#include <iostream>

class AbstractClass {
public:
    void templateMethod() {
        primitiveOperation1();
        primitiveOperation2();
    }

    virtual void primitiveOperation1() = 0;
    virtual void primitiveOperation2() = 0;
};

class ConcreteClassA : public AbstractClass {
public:
    void primitiveOperation1() override {
        std::cout << "ConcreteClassA::primitiveOperation1" << std::endl;
    }

    void primitiveOperation2() override {
        std::cout << "ConcreteClassA::primitiveOperation2" << std::endl;
    }
};

class ConcreteClassB : public AbstractClass {
public:
    void primitiveOperation1() override {
        std::cout << "ConcreteClassB::primitiveOperation1" << std::endl;
    }

    void primitiveOperation2() override {
        std::cout << "ConcreteClassB::primitiveOperation2" << std::endl;
    }
};

int main() {
    AbstractClass* abstractClass = new ConcreteClassA();
    abstractClass->templateMethod();

    abstractClass = new ConcreteClassB();
    abstractClass->templateMethod();

    return 0;
}
```

## 템플릿 메서드와 전략 패턴의 조합
- 템플릿 메서드 패턴과 전략 패턴을 조합하여 사용할 수 있다.
- 대표적인 예로 스프링 프레임워크의 Template으로 끝나는 클래스들이 있다. (JdbcTemplate, RestTemplate, TransactionTemplate 등)

- Java TransactionTemplate 예제

```java
public class TransactionTemplate {
    public <T> T execute(TransactionCallback<T> action) throws TransactionException {
        // 일부 코드 생략
        TransactionStatus status = this.transactionManager.getTransaction(this);
        T result;
        try {
            result = action.doInTransaction(status);
        } catch (RuntimeException ex) {
            rollbackOnException(status, ex);
            throw ex;
        }
        // 기타 코드 생략
        this.transactionManager.commit(status);
        return result;
    }
}

void example() {
    TransactionTemplate transactionTemplate = new TransactionTemplate();
    transactionTemplate.execute(new TransactionCallback<String>() {
        public String doInTransactionWithoutResult(TransactionStatus status) {
            // 트랜잭션 벙위 내에서 실행할 코드
        }
    });
}
```

## GoF 디자인 패턴 시리즈

| 패턴 | 분류 | 핵심 |
| --- | --- | --- |
| [Factory](/posts/design-pattern/2025-04-11-factory/) | 생성 | 생성 책임을 팩토리로 위임해 결합도를 낮춤 |
| [Adapter](/posts/design-pattern/2025-04-12-adapter/) | 구조 | Adaptee를 Target 인터페이스로 변환 |
| [Decorator](/posts/design-pattern/2025-03-07-decorator/) | 구조 | Component를 감싸 동적으로 기능 추가 |
| [Proxy](/posts/design-pattern/2025-03-07-proxy/) | 구조 | 실제 객체 접근을 대리자가 제어 |
| [Command](/posts/design-pattern/2025-04-12-command/) | 행동 | 요청을 객체로 캡슐화, Invoker↔Receiver 분리 |
| [Observer](/posts/design-pattern/2025-04-11-observer/) | 행동 | Subject→Observer 일대다 통지 |
| [State](/posts/design-pattern/2025-03-07-state/) | 행동 | 상태별 분기를 ConcreteState 객체로 캡슐화 |
| [Strategy](/posts/design-pattern/2025-03-07-strategy/) | 행동 | 알고리즘을 Strategy 인터페이스 뒤로 캡슐화 |
| **Template Method (현재 글)** | 행동 | 골격은 상위, 프리미티브는 하위 클래스 |
| [Head First DP 책 노트](/posts/design-pattern/2025-07-11-head-first/) | 인덱스 | 책 목차 + 챕터별 핵심 |
