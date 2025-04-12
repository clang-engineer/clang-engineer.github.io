---
title       : Factory Pattern
description : >-
date        : 2025-04-11 22:50:42 +0900
updated     : 2025-04-11 22:50:42 +0900
categories  : [study, design pattern]
tags        : [design pattern, behavior pattern, factory pattern]
pin         : false
hidden      : false
---

## 개요
- simple factory pattern, factory method pattern, abstract factory pattern으로 나뉜다.
- 객체 생성의 책임을 클라이언트에서 팩토리 클래스로 이동시켜 객체 생성의 복잡성을 줄이는 패턴이다.

## Simple Factory Pattern
- 클라이언트가 객체를 생성하는 방법을 알 필요가 없도록 팩토리 클래스를 사용하여 객체를 생성하는 패턴이다.
- 클라이언트는 팩토리 클래스를 통해 객체를 생성하고, 팩토리 클래스는 클라이언트가 요청한 객체를 생성하여 반환한다.
- 클라이언트는 팩토리 클래스를 통해 객체를 생성하므로, 객체 생성의 복잡성을 줄일 수 있다.

### 예제
```cpp
#include <iostream>
#include <memory>
#include <string>

using namespace std;

class Product {
public:
    virtual void use() = 0;
    virtual ~Product() = default;
};

class ConcreteProductA : public Product {
public:
    void use() override {
        cout << "Using ConcreteProductA" << endl;
    }
};
class ConcreteProductB : public Product {
public:
    void use() override {
        cout << "Using ConcreteProductB" << endl;
    }
};
class SimpleFactory {
public:
    static unique_ptr<Product> createProduct(const string& type) {
        if (type == "A") {
            return make_unique<ConcreteProductA>();
        } else if (type == "B") {
            return make_unique<ConcreteProductB>();
        }
        return nullptr;
    }
};
int main() {
    unique_ptr<Product> productA = SimpleFactory::createProduct("A");
    if (productA) {
        productA->use();
    }

    unique_ptr<Product> productB = SimpleFactory::createProduct("B");
    if (productB) {
        productB->use();
    }

    return 0;
}
```

## Factory Method Pattern
- 팩토리 메서드 패턴은 객체 생성의 책임을 서브클래스에 위임하는 패턴이다.
- 팩토리 메서드를 정의하고, 서브클래스에서 이 메서드를 구현하여 객체를 생성한다.
- 클라이언트는 팩토리 메서드를 통해 객체를 생성하므로, 객체 생성의 복잡성을 줄일 수 있다.
- 팩토리 메서드는 서브클래스에서 구현되므로, 클라이언트는 팩토리 메서드의 구현을 알 필요가 없다.


## Abstract Factory Pattern
- 추상 팩토리 패턴은 관련된 객체들을 생성하는 인터페이스를 제공하는 패턴이다.
- 클라이언트는 추상 팩토리를 통해 객체를 생성하므로, 객체 생성의 복잡성을 줄일 수 있다.
- 추상 팩토리는 관련된 객체들을 생성하는 인터페이스를 제공하므로, 클라이언트는 객체의 구체적인 클래스를 알 필요가 없다.

