---
title       : Composite Pattern
description : "단일 객체(Leaf)와 묶음 객체(Composite)를 같은 인터페이스로 다뤄 트리 구조를 균일하게 처리하는 패턴. 파일 시스템·DOM의 본체."
date        : 2026-06-18 22:50:42 +0900
updated     : 2026-06-18 22:50:42 +0900
categories  : [design-pattern, "구조"]
tags        : [structural-pattern]
pin         : false
hidden      : false
---

## 한 줄 요약
잎(Leaf)과 가지(Composite)를 같은 인터페이스로 다뤄, 트리를 순회하는 코드가 "이게 잎인지 가지인지" 묻지 않게 만든다. 파일 시스템, DOM, UI 트리가 정확히 이 형태.

## 어떤 문제를 푸는가

파일과 디렉토리의 크기를 계산하고 싶다. 두 타입이 분리되어 있으면 클라이언트가 분기해야 한다.

```cpp
class File { public: int size() const; };
class Directory {
    std::vector<File> files;
    std::vector<Directory> subdirs;
public:
    int totalSize() const {
        int s = 0;
        for (auto& f : files) s += f.size();
        for (auto& d : subdirs) s += d.totalSize();
        return s;
    }
};

// 클라이언트
int reportSize(const std::variant<File, Directory>& node) {
    if (std::holds_alternative<File>(node))      return std::get<File>(node).size();
    else                                          return std::get<Directory>(node).totalSize();
}
```

문제:
- 클라이언트가 매번 "이게 파일인가 디렉토리인가"를 분기한다.
- 트리에 새 타입(Symlink) 추가 시 분기가 또 늘어난다.
- 파일과 디렉토리가 따로 인터페이스를 갖는다 — 다형성으로 처리 불가.

## 패턴 적용 후

`Node` 같은 공통 인터페이스를 두고, 파일(Leaf)과 디렉토리(Composite)가 모두 구현한다. 디렉토리는 자식 노드를 들고 같은 호출을 위임한다.

```cpp
#include <iostream>
#include <memory>
#include <string>
#include <vector>

class Node {
public:
    virtual int size() const = 0;
    virtual void print(int depth = 0) const = 0;
    virtual ~Node() = default;
};

class File : public Node {
    std::string name;
    int fileSize;
public:
    File(std::string name, int s) : name(std::move(name)), fileSize(s) {}
    int size() const override { return fileSize; }
    void print(int depth) const override {
        std::cout << std::string(depth * 2, ' ') << name << " (" << fileSize << "B)\n";
    }
};

class Directory : public Node {
    std::string name;
    std::vector<std::unique_ptr<Node>> children;
public:
    Directory(std::string name) : name(std::move(name)) {}

    void add(std::unique_ptr<Node> child) { children.push_back(std::move(child)); }

    int size() const override {
        int total = 0;
        for (auto& c : children) total += c->size(); // Leaf인지 모름. 알 필요도 없음.
        return total;
    }

    void print(int depth) const override {
        std::cout << std::string(depth * 2, ' ') << name << "/ (" << size() << "B)\n";
        for (auto& c : children) c->print(depth + 1);
    }
};

int main() {
    auto root = std::make_unique<Directory>("project");
    root->add(std::make_unique<File>("README.md", 200));

    auto src = std::make_unique<Directory>("src");
    src->add(std::make_unique<File>("main.cpp", 1500));
    src->add(std::make_unique<File>("util.cpp", 800));
    root->add(std::move(src));

    root->print();
    std::cout << "총 크기: " << root->size() << "B\n";
}
```

출력:
```
project/ (2500B)
  README.md (200B)
  src/ (2300B)
    main.cpp (1500B)
    util.cpp (800B)
총 크기: 2500B
```

달라진 점:
- 클라이언트(`main`, `print`)는 노드가 파일인지 디렉토리인지 묻지 않는다.
- 재귀가 자연스럽다. Directory의 `size()`가 자식 `size()`를 부르고, 자식이 또 디렉토리면 같은 호출이 더 깊이 들어간다.
- 새 노드 타입(Symlink) 추가 = 새 `Node` 구현 클래스. 클라이언트 무손상.

## 구조

```
Node (interface)
   ▲
   ├──── Leaf (자식 없음)
   │
   └──── Composite ──has──▶ Node*  (재귀 구조)
```

- **Component (Node)**: 공통 인터페이스
- **Leaf (File)**: 자식 없음, 실제 일을 하는 말단
- **Composite (Directory)**: 자식 컬렉션 + 자식에게 위임

핵심: Composite 자신도 Component를 구현한다 → Composite 안에 또 Composite를 넣을 수 있다.

## 자식 관리 메서드를 어디 둘까

GoF의 오래된 논쟁:

| 방식 | 장점 | 단점 |
|---|---|---|
| **A. Component에 `add`/`remove` 선언** | 클라이언트가 분기 없이 모든 노드에 추가 시도 가능 (투명성) | Leaf에 의미 없는 메서드 — 호출 시 예외 또는 무동작 (안전성↓) |
| **B. Composite에만 선언** | 타입이 의미를 강제 (Leaf에 add 불가) | 클라이언트가 Composite로 다운캐스트 필요 |

> **위 예제는 B 방식**. 현대 코드에서는 안전성을 더 중시하는 경향. GoF 책은 A를 약간 더 추천했다.

## 실전 사례

- **파일 시스템**: 위 예제가 그대로. `du`, `find` 같은 명령이 Composite 순회.
- **DOM 트리**: `Element`와 텍스트 노드를 같은 `Node` 인터페이스로 다룸. `querySelectorAll`, `innerHTML`이 재귀.
- **UI 컴포넌트 트리**: React 컴포넌트, Android `View`/`ViewGroup`, Flutter `Widget`.
- **수식 / AST**: 숫자 리터럴(Leaf) + 이항 연산(Composite). `evaluate()`가 재귀로 트리를 평가.
- **조직도**: 직원(Leaf) + 매니저(Composite). 매니저의 "총 인건비"가 부하의 합.

## 함께 자주 쓰이는 패턴

- **Iterator**: Composite 트리를 BFS/DFS 등 다양한 순서로 순회.
- **Visitor**: 모든 노드에 같은 연산을 적용 (트리 깊이 측정, 직렬화 등). Composite 자체는 구조를 제공하고, Visitor가 연산을 분리.
- **Decorator**: 구조가 비슷하지만 의도 다름. Decorator는 한 객체에 기능을 누적 추가, Composite는 트리 구조 표현.

## 안티패턴 / 주의

- **순환 참조**: 자식이 부모를 참조하거나, 트리에 사이클이 생기면 `size()`가 무한 재귀. 트리 불변식을 깨뜨리지 말 것.
- **부모 포인터를 둘지 신중히**: 트리 탐색이 양방향이면 편한데, 자식이 부모를 안다는 건 결합도 증가 + 순환 위험.
- **공통 인터페이스가 너무 추상적이면 다 못 담는다**: 모든 노드가 의미 있게 구현할 수 있는 메서드만 인터페이스에 둘 것. 의미 없는 메서드를 우격다짐 넣으면 LSP 위반.
- **깊이 큰 트리에서 재귀 스택**: 수만 노드 깊이의 트리는 재귀 호출로 풀면 스택 오버플로. 반복형(스택 활용) 순회로 전환.

## GoF 디자인 패턴 시리즈

| 패턴 | 분류 | 핵심 |
| --- | --- | --- |
| [Factory](/posts/design-pattern/2025-04-11-factory/) | 생성 | 생성 책임을 팩토리로 위임해 결합도를 낮춤 |
| [Singleton](/posts/design-pattern/2026-06-18-singleton/) | 생성 | 단일 인스턴스 보장 + 전역 접근점 |
| [Builder](/posts/design-pattern/2026-06-18-builder/) | 생성 | 복잡한 객체를 단계별로 조립 |
| [Adapter](/posts/design-pattern/2025-04-12-adapter/) | 구조 | Adaptee를 Target 인터페이스로 변환 |
| **Composite (현재 글)** | 구조 | Leaf와 Composite를 같은 인터페이스로 트리 처리 |
| [Decorator](/posts/design-pattern/2025-03-07-decorator/) | 구조 | Component를 감싸 동적으로 기능 추가 |
| [Facade](/posts/design-pattern/2026-06-18-facade/) | 구조 | 복잡한 서브시스템을 단순한 진입점으로 |
| [Proxy](/posts/design-pattern/2025-03-07-proxy/) | 구조 | 실제 객체 접근을 대리자가 제어 |
| [Chain of Responsibility](/posts/design-pattern/2026-06-18-chain-of-responsibility/) | 행위 | 핸들러 사슬로 요청을 차례로 시도 |
| [Command](/posts/design-pattern/2025-04-12-command/) | 행위 | 요청을 객체로 캡슐화, Invoker↔Receiver 분리 |
| [Iterator](/posts/design-pattern/2026-06-18-iterator/) | 행위 | 컬렉션 내부 구조 노출 없이 순회 |
| [Observer](/posts/design-pattern/2025-04-11-observer/) | 행위 | Subject→Observer 일대다 통지 |
| [State](/posts/design-pattern/2025-03-07-state/) | 행위 | 상태별 분기를 ConcreteState 객체로 캡슐화 |
| [Strategy](/posts/design-pattern/2025-03-07-strategy/) | 행위 | 알고리즘을 Strategy 인터페이스 뒤로 캡슐화 |
| [Template Method](/posts/design-pattern/2025-03-07-template-method/) | 행위 | 골격은 상위, 프리미티브는 하위 클래스 |
| [Head First DP 책 노트](/posts/design-pattern/2025-07-11-head-first/) | 인덱스 | 책 목차 + 챕터별 핵심 |
