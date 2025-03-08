---
title       : 전략 패턴 (Strategy Pattern)
description : >-
  전략 패턴에 대해 정리합니다.
date        : 2025-03-07 22:50:42 +0900
updated     : 2025-03-07 22:50:42 +0900
categories  : [study, design pattern]
tags        : [design pattern, strategy pattern]
pin         : false
hidden      : false
---

## 개요
- 객체가 할 수 있는 행위를 캡슐화하여 교체 가능하게 만드는 패턴. 
- DI(Dependency Injection, 의존성 주입)는 전략 패턴의 대표적인 예이다.

## 사용하는 경우
- 여러 알고리즘이 존재하고, 이 알고리즘을 동적으로 변경해야 하는 경우
- 알고리즘을 사용하는 클라이언트와 알고리즘을 구현하는 클래스를 분리하고 싶은 경우
- 분기문을 사용하여 알고리즘을 선택하는 것이 아닌, 동적으로 알고리즘을 선택하고 싶은 경우

## 구성요소
- Strategy: 전략을 나타내는 인터페이스
- ConcreteStrategy: 전략을 실제로 구현한 클래스
- Context: 전략을 사용하는 역할

## 예제
```cpp
#include <iostream>

class Strategy {
public:
    virtual void execute() = 0;
};

class ConcreteStrategyA : public Strategy {
public:
    void execute() override {
        std::cout << "ConcreteStrategyA" << std::endl;
    }
};

class ConcreteStrategyB : public Strategy {
public:
    void execute() override {
        std::cout << "ConcreteStrategyB" << std::endl;
    }
};

class Context {
private:
    Strategy* strategy;

public:

    Context(Strategy* strategy) : strategy(strategy) {}

    void setStrategy(Strategy* strategy) {
        this->strategy = strategy;
    }

    void execute() {
        strategy->execute();
    }
};

int main() {
    ConcreteStrategyA strategyA;
    ConcreteStrategyB strategyB;

    Context context(&strategyA);
    context.execute();

    context.setStrategy(&strategyB);
    context.execute();

    return 0;
}
```