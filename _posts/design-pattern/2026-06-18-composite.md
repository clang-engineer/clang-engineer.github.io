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

> **난이도** 중급 · **선행** 없음

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
    void print(int depth = 0) const override {
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

    void print(int depth = 0) const override {
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

## Decorator Pattern과의 차이

둘 다 "같은 인터페이스를 가진 객체로 감싸기" 구조라 헷갈리기 쉽다. 의도가 다르다.

| | Composite | Decorator |
|---|---|---|
| 무엇을 표현 | 1:N 트리 구조 (자식 컬렉션) | 1:1 래핑 체인 (단일 자식) |
| 자식 수 | 여러 개 | 항상 하나 |
| 의도 | 부분-전체 관계 | 기능 누적 추가 |
| 사용 예 | 파일 시스템, DOM | I/O 스트림, 미들웨어 |

> Composite의 가지(Composite 노드)는 자식 여럿을 든다. Decorator의 래퍼는 항상 자식 하나를 감싼다.

## 함께 자주 쓰이는 패턴

- **Iterator**: Composite 트리를 BFS/DFS 등 다양한 순서로 순회.
- **Visitor**: 모든 노드에 같은 연산을 적용 (트리 깊이 측정, 직렬화 등). Composite 자체는 구조를 제공하고, Visitor가 연산을 분리.

## 안티패턴 / 주의

- **순환 참조**: 자식이 부모를 참조하거나, 트리에 사이클이 생기면 `size()`가 무한 재귀. 트리 불변식을 깨뜨리지 말 것.
- **부모 포인터를 둘지 신중히**: 트리 탐색이 양방향이면 편한데, 자식이 부모를 안다는 건 결합도 증가 + 순환 위험.
- **공통 인터페이스가 너무 추상적이면 다 못 담는다**: 모든 노드가 의미 있게 구현할 수 있는 메서드만 인터페이스에 둘 것. 의미 없는 메서드를 우격다짐 넣으면 LSP 위반.
- **깊이 큰 트리에서 재귀 스택**: 수만 노드 깊이의 트리는 재귀 호출로 풀면 스택 오버플로. 반복형(스택 활용) 순회로 전환.


## 스스로 점검

**1. `Directory::size()`가 안에 또 다른 `Directory`가 있어도 자동으로 처리되는 메커니즘은?**

<details markdown="1">
<summary>답</summary>

Composite도 `Node`를 구현한다. children은 `unique_ptr<Node>` 타입이므로 자식이 또 Directory여도 같은 `size()` 호출 → **재귀**. "Composite 안에 Composite"가 핵심.

</details>

**2. 자식 관리(`add`/`remove`)를 Component 인터페이스에 두는 것 vs Composite에만 두는 것의 트레이드오프는?**

<details markdown="1">
<summary>답</summary>

Component에 두면 클라이언트가 분기 없이 add 시도 가능(**투명성** ↑). 단 Leaf에는 의미 없는 메서드라 호출 시 예외 발생(**안전성** ↓). Composite에만 두면 안전하지만 다운캐스트 필요.

</details>

**3. 깊이 수만 개에 달하는 트리를 재귀로 처리하면?**

<details markdown="1">
<summary>답</summary>

**스택 오버플로** 위험. 반복형(명시적 스택을 손으로 관리하는) 순회로 전환. 또는 꼬리 재귀 최적화가 되는 언어/플래그 사용.

</details>

{% include design-pattern-series.html current="composite" %}
