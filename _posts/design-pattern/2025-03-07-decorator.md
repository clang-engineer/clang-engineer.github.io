---
title       : Decorator Pattern
description : "상속으로 기능을 조합하면 클래스 수가 폭발한다. Component를 감싸는 Decorator를 위임으로 쌓아 동적으로 기능을 추가하는 구조."
date        : 2025-03-07 22:50:42 +0900
updated     : 2025-03-07 22:50:42 +0900
categories  : [design-pattern, "구조"]
tags        : [structural-pattern]
pin         : false
hidden      : false
---

## 개요
- 상속이 아닌 위임을 통해 객체에 새로운 기능을 추가하는 패턴.
> 상속을 이용한 기능 확장은 다양한 조합이 필요한 경우 클래스 수가 불필요하게 증가할 수 있다. 이러한 문제를 해결하기 위해 데코레이터 패턴을 사용한다.

## 사용하는 경우
- 객체에 동적으로 새로운 기능을 추가하고 싶은 경우
- 상속을 통해 기능을 확장하는 것이 적절하지 않은 경우
- 객체의 기능을 동적으로 확장하고 제거하고 싶은 경우

## 구성요소
- Component: 기능을 추가할 대상이 되는 인터페이스
- ConcreteComponent: 기능을 추가할 대상이 되는 클래스
- Decorator: Component를 상속받아 기능을 추가할 수 있는 클래스
- ConcreteDecorator: Decorator를 상속받아 기능을 추가하는 클래스

![Decorator Pattern](https://upload.wikimedia.org/wikipedia/commons/e/e9/Decorator_UML_class_diagram.svg)

> 출처: [Decorator Pattern - Wikipedia](https://en.wikipedia.org/wiki/Decorator_pattern)

## 예제
```cpp
#include <iostream>
#include <memory> // 스마트 포인터 사용

using namespace std;

class Component {
public:
    virtual void operation() = 0;
    virtual ~Component() = default; // 가상 소멸자 추가 (메모리 릭 방지)
};

class ConcreteComponent : public Component {
public:
    void operation() override {
        cout << "ConcreteComponent::operation" << endl;
    }
};

class Decorator : public Component {
protected:
    unique_ptr<Component> component; // 스마트 포인터 사용

public:
    Decorator(unique_ptr<Component> comp) : component(move(comp)) {}

    void operation() override {
        component->operation();
    }
};

class ConcreteDecoratorA : public Decorator {
public:
    ConcreteDecoratorA(unique_ptr<Component> comp) : Decorator(move(comp)) {}

    void operation() override {
        cout << "ConcreteDecoratorA::operation" << endl;
        Decorator::operation();
    }
};

class ConcreteDecoratorB : public Decorator {
public:
    ConcreteDecoratorB(unique_ptr<Component> comp) : Decorator(move(comp)) {}

    void operation() override {
        cout << "ConcreteDecoratorB::operation" << endl;
        Decorator::operation();
    }
};

int main() {
    unique_ptr<Component> delegate = make_unique<ConcreteComponent>();
    
    unique_ptr<Component> decorator = make_unique<ConcreteDecoratorA>(
        make_unique<ConcreteDecoratorB>(move(delegate))
    );

    decorator->operation();

    // 출력:
    // ConcreteDecoratorB::operation
    // ConcreteDecoratorA::operation
    // ConcreteComponent::operation
    return 0;
}
```

## 데코레이터 패턴의 장단점
- 장: 상속을 통해 기능을 확장하는 것보다 유연하게 기능을 추가할 수 있다.
- 단: 사용자 입장에서 데코레이터 객체와 실제 객체의 구분이 되지 않기 때문에 코드만으로 기능이 어떻게 동작하는지 파악하기 어렵다.

## GoF 디자인 패턴 시리즈

| 패턴 | 분류 | 핵심 |
| --- | --- | --- |
| [Factory](/posts/design-pattern/2025-04-11-factory/) | 생성 | 생성 책임을 팩토리로 위임해 결합도를 낮춤 |
| [Adapter](/posts/design-pattern/2025-04-12-adapter/) | 구조 | Adaptee를 Target 인터페이스로 변환 |
| **Decorator (현재 글)** | 구조 | Component를 감싸 동적으로 기능 추가 |
| [Proxy](/posts/design-pattern/2025-03-07-proxy/) | 구조 | 실제 객체 접근을 대리자가 제어 |
| [Command](/posts/design-pattern/2025-04-12-command/) | 행동 | 요청을 객체로 캡슐화, Invoker↔Receiver 분리 |
| [Observer](/posts/design-pattern/2025-04-11-observer/) | 행동 | Subject→Observer 일대다 통지 |
| [State](/posts/design-pattern/2025-03-07-state/) | 행동 | 상태별 분기를 ConcreteState 객체로 캡슐화 |
| [Strategy](/posts/design-pattern/2025-03-07-strategy/) | 행동 | 알고리즘을 Strategy 인터페이스 뒤로 캡슐화 |
| [Template Method](/posts/design-pattern/2025-03-07-template-method/) | 행동 | 골격은 상위, 프리미티브는 하위 클래스 |
| [Head First DP 책 노트](/posts/design-pattern/2025-07-11-head-first/) | 인덱스 | 책 목차 + 챕터별 핵심 |
