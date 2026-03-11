---
title       : Command Pattern
description : >-
date        : 2025-03-07 22:50:42 +0900
updated     : 2025-03-07 22:50:42 +0900
categories  : [study, design-pattern]
tags        : [design-pattern, behavior-pattern, command-pattern]
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

## 취소 기능
- Invoker에서 Command를 실행할 때 마지막으로 실행한 Command를 저장하고, 취소할 때는 저장된 Command의 undo() 메서드를 호출하여 취소할 수 있다.

```cpp
class Command {
public:
    virtual void undo() = 0; // 취소 메서드 추가
};

class ConcreteCommandA : public Command {
    void undo() override {
        cout << "Undoing ConcreteCommandA" << endl;
    }
};

class Invoker {
private:
    unique_ptr<Command[]> commands; // 명령어 배열
    unique_ptr<Command> lastCommand; // 마지막 명령어 저장
public:
    void executeCommand(int index) {
        if (commands[index]) {
            commands[index]->execute();
            lastCommand = move(commands[index]); // 마지막 명령어 저장
        } else {
            cout << "No command set" << endl;
        }
    }
    void undoCommand() {
        if (lastCommand) {
            lastCommand->undo(); // 마지막 명령어 취소
        } else {
            cout << "No command to undo" << endl;
        }
    }
};
```

## 매크로 커맨드
- 커맨드 객체로 구성된 매크로를 만들어서 여러 Command 객체를 하나의 Command로 묶어 실행할 수 있다.
```cpp
class MacroCommand : public Command {
private:
    vector<unique_ptr<Command>> commands; // Command 객체 배열
public:
    void addCommand(unique_ptr<Command> command) {
        commands.push_back(move(command));
    }

    void execute() override {
        for (auto& command : commands) {
            command->execute();
        }
    }
};
```

## 커맨드 패턴 활용하기
- 스케쥴러, 스레드풀, 작업큐 활용하기: 커맨드로 컴퓨테이션의 한 부분(리시버와 일련의 행동)을 패키지로 묶어서 일급 객체 형태로 전달하여 스레드풀이나 작업큐에 넣어줄 수 있다. 스레드는 큐에서 커맨드를 하나씩 꺼내서 실행한다.
- 복구 기능: 디스크에 실행 내역을 저장하고, 어플리케이션이 다운되면 커맨드 객체를 다시 읽어와서 실행할 수 있다.
