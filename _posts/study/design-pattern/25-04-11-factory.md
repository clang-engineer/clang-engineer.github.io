---
title       : Factory Pattern
description : >-
date        : 2025-04-11 22:50:42 +0900
updated     : 2025-04-11 22:50:42 +0900
categories  : [study, design-pattern]
tags        : [design-pattern, behavior-pattern, factory-pattern]
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
- static 메서드를 사용하여 객체를 생성하는 경우가 많다.

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
class Creator {
public:
    virtual unique_ptr<Product> factoryMethod() = 0;
    void someOperation() {
        unique_ptr<Product> product = factoryMethod();
        product->use();
    }
};
class ConcreteCreatorA : public Creator {
public:
    unique_ptr<Product> factoryMethod() override {
        return make_unique<ConcreteProductA>();
    }
};
class ConcreteCreatorB : public Creator {
public:
    unique_ptr<Product> factoryMethod() override {
        return make_unique<ConcreteProductB>();
    }
};
int main() {
    unique_ptr<Creator> creatorA = make_unique<ConcreteCreatorA>();
    creatorA->someOperation();

    unique_ptr<Creator> creatorB = make_unique<ConcreteCreatorB>();
    creatorB->someOperation();

    return 0;
}
```

## Abstract Factory Pattern
- 추상 팩토리 패턴은 관련된 객체들을 생성하는 인터페이스를 제공하는 패턴이다.
- 클라이언트는 추상 팩토리를 통해 객체를 생성하므로, 객체 생성의 복잡성을 줄일 수 있다.
- 추상 팩토리는 관련된 객체들을 생성하는 인터페이스를 제공하므로, 클라이언트는 객체의 구체적인 클래스를 알 필요가 없다.


### 예제
```cpp
#include <iostream>
#include <memory>
#include <string>
using namespace std;
class ProductA {
public:
    virtual void use() = 0;
    virtual ~ProductA() = default;
};
class ProductB {
public:
    virtual void use() = 0;
    virtual ~ProductB() = default;
};
class ConcreteProductA1 : public ProductA {
public:
    void use() override {
        cout << "Using ConcreteProductA1" << endl;
    }
};
class ConcreteProductA2 : public ProductA {
public:
    void use() override {
        cout << "Using ConcreteProductA2" << endl;
    }
};
class ConcreteProductB1 : public ProductB {
public:
    void use() override {
        cout << "Using ConcreteProductB1" << endl;
    }
};
class ConcreteProductB2 : public ProductB {
public:
    void use() override {
        cout << "Using ConcreteProductB2" << endl;
    }
};
class AbstractFactory {
public:
    virtual unique_ptr<ProductA> createProductA() = 0;
    virtual unique_ptr<ProductB> createProductB() = 0;
    virtual ~AbstractFactory() = default;
};
class ConcreteFactory1 : public AbstractFactory {
public:
    unique_ptr<ProductA> createProductA() override {
        return make_unique<ConcreteProductA1>();
    }
    unique_ptr<ProductB> createProductB() override {
        return make_unique<ConcreteProductB1>();
    }
};
class ConcreteFactory2 : public AbstractFactory {
public:
    unique_ptr<ProductA> createProductA() override {
        return make_unique<ConcreteProductA2>();
    }
    unique_ptr<ProductB> createProductB() override {
        return make_unique<ConcreteProductB2>();
    }
};

int main() {
    unique_ptr<AbstractFactory> factory1 = make_unique<ConcreteFactory1>();
    unique_ptr<ProductA> productA1 = factory1->createProductA();
    unique_ptr<ProductB> productB1 = factory1->createProductB();
    productA1->use();
    productB1->use();

    unique_ptr<AbstractFactory> factory2 = make_unique<ConcreteFactory2>();
    unique_ptr<ProductA> productA2 = factory2->createProductA();
    unique_ptr<ProductB> productB2 = factory2->createProductB();
    productA2->use();
    productB2->use();

    return 0;
}
```


## 팩토리 매서드 패턴 vs 추상 팩토리 패턴

| Factory Method Pattern | Abstract Factory Pattern |
|-----------------------|--------------------------|
| 클래스를 사용해서 제품을 생성 | 객체을 사용해서 제품을 생성 |
| 상속으로 객체를 생성 | 구성으로 객체를 생성 |
| 하나의 제품군에 대한 객체를 생성하는 메서드를 정의 | 관련된 여러 제품군을 묶어서 객체를 생성하는 메서드를 정의 |
| 서브클래스에서 팩토리 메서드를 구현하여 객체를 생성 | 서브클래스에서 여러 팩토리 메서드를 구현하여 객체를 생성 |
| 객체 생성의 책임을 서브클래스에 위임 | 객체 생성의 책임을 추상 팩토리에 위임 |
| 클라이언트 코드와 팩토리 메서드가 분리되어 있음 | 클라이언트 코드와 팩토리 메서드가 결합되어 있음 |

> 팩토리 메스드 패턴은 일종의 템플릿 메소드 패턴
