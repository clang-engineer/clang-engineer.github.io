---
title       : Command Pattern
description : >-
date        : 2025-03-07 22:50:42 +0900
updated     : 2025-03-07 22:50:42 +0900
categories  : [study, design pattern]
tags        : [design pattern, behavior pattern, command pattern]
pin         : false
hidden      : false
---

## 개요
- 요청 내역을 객체로 객체로 캡슐화하여 서로 다른 요청 내역에 대해 매개변수화할 수 있게 하는 패턴.
- 요청을 큐에 저장하거나 로그를 남기거나 작업 취소 기능을 구현할 수 있다.

## 사용하는 경우
- 요청을 큐에 저장하거나 로그를 남기고 싶을 때
- 요청을 매개변수화하고 싶을 때
- 요청을 취소하고 싶을 때
- 요청을 실행하는 시점을 지연시키고 싶을 때
- 요청을 실행하는 시점을 변경하고 싶을 때


## 구성요소
- Command: 요청을 캡슐화하는 인터페이스
- ConcreteCommand: Command 인터페이스를 구현한 클래스
- Invoker: 요청을 호출하는 역할
- Receiver: 요청을 처리하는 역할
- Client: 요청을 생성하는 역할
> Command 객체는 Invoker에 의해 호출되고, Invoker는 Command 객체를 통해 Receiver에게 요청을 전달한다.

## 예제
```cpp
#include <iostream>
#include <memory>

using namespace std;

class Receiver {
public:
    virtual void action() = 0;
    virtual ~Receiver() = default;
};

class ReceiverA : public Receiver {
public:
    void action() override {
        cout << "ReceiverA action" << endl;
    }
};

class ReceiverB : public Receiver {
public:
    void action() override {
        cout << "ReceiverB action" << endl;
    }
};

class Command {
public:
    Command(Receiver& receiver) : receiver(receiver) {}
    virtual void execute() = 0;
    virtual ~Command() = default;
};

class ConcreteCommandA : public Command {
private:
    Receiver receiver;
public:
    void execute() override {
        cout << "Executing ConcreteCommandA" << endl;
        receiver.action();
    }
};

class ConcreteCommandB : public Command {
private:
    Receiver receiver;
public:
    void execute() override {
        cout << "Executing ConcreteCommandB" << endl;
        receiver.action();
    }
};

class Invoker {
private:
    unique_ptr<Command> command;
public:
    void setCommand(unique_ptr<Command> cmd) {
        command = move(cmd);
    }

    void executeCommand() {
        if (command) {
            command->execute();
        } else {
            cout << "No command set" << endl;
        }
    }
};

int main() {
    Invoker invoker;

    ReceiverA receiverA;
    unique_ptr<Command> commandA = make_unique<ConcreteCommandA>(receiverA);
    invoker.setCommand(move(commandA));
    invoker.executeCommand();

    ReceiverB receiverB;
    unique_ptr<Command> commandB = make_unique<ConcreteCommandB>(receiverB);
    invoker.setCommand(move(commandB));
    invoker.executeCommand();

    return 0;
}
```


