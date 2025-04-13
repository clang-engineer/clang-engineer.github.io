---
title       : Adapter Pattern
description : >-
date        : 2025-04-12 22:50:42 +0900
updated     : 2025-04-12 22:50:42 +0900
categories  : [study, design pattern]
tags        : [design pattern, adapter]
pin         : false
hidden      : false
---

## 개요
- 기존 클래스의 인터페이스를 변경하지 않고도 다른 인터페이스를 제공하는 패턴.

## 구성요소
- Target: 클라이언트가 사용하고자 하는 인터페이스
- Adapter: Target 인터페이스를 구현하고, Adaptee의 인스턴스를 포함하여 Adaptee의 기능을 Target 인터페이스로 변환하는 클래스
- Adaptee: 기존 클래스의 인터페이스
- Client: Target 인터페이스를 사용하는 클라이언트

## 예제
```cpp
#include <iostream>
#include <memory> // 스마트 포인터 사용
#include <string>
#include <vector>
#include <algorithm>

using namespace std;
// Target 인터페이스
class Target {
public:
    virtual void request() = 0;
    virtual ~Target() = default; // 가상 소멸자 추가 (메모리 릭 방지)
};

// Adaptee 클래스
class Adaptee {
public:
    void specificRequest() {
        cout << "Adaptee::specificRequest" << endl;
    }
};

// Adapter 클래스
class Adapter : public Target {
private:
    unique_ptr<Adaptee> adaptee; // 스마트 포인터 사용
public:

    Adapter(unique_ptr<Adaptee> adaptee) : adaptee(move(adaptee)) {}

    void request() override {
        cout << "Adapter::request" << endl;
        adaptee->specificRequest();
    }
};

// Client 클래스
class Client {
public:
    void useAdapter(unique_ptr<Target> target) {
        target->request();
    }
};

int main() {
    unique_ptr<Adaptee> adaptee = make_unique<Adaptee>();
    unique_ptr<Target> adapter = make_unique<Adapter>(move(adaptee));
    
    Client client;
    client.useAdapter(move(adapter));

    return 0;
}
```
