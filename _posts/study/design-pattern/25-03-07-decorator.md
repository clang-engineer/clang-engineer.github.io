---
title       : Decorator Pattern
description : >-
    데코레이터 패턴에 대해 정리합니다.
date        : 2025-03-07 22:50:42 +0900
updated     : 2025-03-07 22:50:42 +0900
categories  : [study, design pattern]
tags        : [design pattern, behavior pattern, decorator pattern]
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