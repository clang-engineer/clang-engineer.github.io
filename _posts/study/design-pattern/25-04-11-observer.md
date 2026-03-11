---
title       : Observer Pattern
description : >-
    옵저버 패턴에 대해 정리합니다.
date        : 2025-03-07 22:50:42 +0900
updated     : 2025-03-07 22:50:42 +0900
categories  : [study, design-pattern]
tags        : [design-pattern, behavior-pattern, observer-pattern]
pin         : false
hidden      : false
---

## 개요
- 객체의 상태 변화에 따라 다른 객체에 통지하는 패턴.
- 주제와 구독자(옵저버) 간의 일대다 관계를 정의한다.
- 주제는 상태 변화가 발생했을 때 구독자에게 알림을 보낸다.
- 구독자는 주제의 상태 변화를 감지하고, 필요한 작업을 수행한다.
- 주제와 구독자는 느슨하게 결합되어 있어, 서로 독립적으로 변경할 수 있다.
- 주제는 구독자에 대한 정보를 유지하고, 구독자는 주제에 대한 정보를 알지 못한다.
- 주제는 구독자에게 알림을 보내는 방법을 정의하고, 구독자는 주제의 상태 변화를 감지하는 방법을 정의한다.

## 사용하는 경우
- 객체의 상태 변화에 따라 다른 객체에 통지해야 하는 경우
- 객체 간의 느슨한 결합을 유지하고 싶은 경우
- 객체의 상태 변화에 따라 다른 객체의 동작을 변경해야 하는 경우

## 구성요소
- Subject: 주제를 나타내는 인터페이스
- ConcreteSubject: 주제를 실제로 구현한 클래스
- Observer: 옵저버를 나타내는 인터페이스
- ConcreteObserver: 옵저버를 실제로 구현한 클래스

![Observer Pattern](https://upload.wikimedia.org/wikipedia/commons/a/a8/Observer_w_update.svg)


## 예제
```cpp
#include <functional>
#include <iostream>
#include <list>

class Subject; //Forward declaration for usage in Observer

class Observer
{
public:
    explicit Observer(Subject& subj);
    virtual ~Observer();
  
    Observer(const Observer&) = delete; // rule of three
    Observer& operator=(const Observer&) = delete;

    virtual void update( Subject& s) const = 0;
private:
    // Reference to a Subject object to detach in the destructor
    Subject& subject;
};

// Subject is the base class for event generation
class Subject
{
public:
    using RefObserver = std::reference_wrapper<const Observer>;
  
    // Notify all the attached observers
    void notify()
    {
        for (const auto& x: observers) 
        {
            x.get().update(*this);
        }
    }
  
    // Add an observer
    void attach(const Observer& observer) 
    {
        observers.push_front(observer);
    }
  
    // Remove an observer
    void detach(Observer& observer)
    {
        observers.remove_if( [&observer ](const RefObserver& obj)
        { 
            return &obj.get()==&observer; 
        });
    }
  
private:
    std::list<RefObserver> observers;
};

Observer::Observer(Subject& subj) : subject(subj)
{
    subject.attach(*this);
}

Observer::~Observer()
{
    subject.detach(*this);
}


// Example of usage
class ConcreteObserver: public Observer
{
public:
    ConcreteObserver(Subject& subj) : Observer(subj) {}
  
    // Get notification
    void update(Subject&) const override
    {
        std::cout << "Got a notification" << std::endl;
    }
};

int main() 
{
    Subject cs;
    ConcreteObserver co1(cs);
    ConcreteObserver co2(cs);
    cs.notify();
}
```

## 기타
- 람다를 사용하면 별도 클래스를 만들지 않고도 옵저버를 구현할 수 있다.
- 푸쉬 방식을 사용하여 주제의 정브를 옵저버에게 전달하는 방식 보다는 풀링 방식으로 옵저버가 주제의 상태를 확인하는 방식이 더 유연하다.
