---
title       : 특정 문제에서 선명한 GoF 패턴 — Bridge · Flyweight · Interpreter
description : "Bridge·Flyweight·Interpreter를 한 곳에 모아, 언제 패턴 이름이 선명하게 드러나는지와 현대 코드에서 어떤 형태로 남아 있는지 짚는다."
date        : 2026-06-19 16:00:00 +0900
updated     : 2026-07-24 12:00:00 +0900
categories  : [design-pattern, "개요"]
tags        : [design-pattern, structural-pattern, behavioral-pattern]
pin         : false
hidden      : false
---

> **난이도** 참고용 · **선행** 없음

Bridge·Flyweight·Interpreter는 현대 코드에도 쓰이지만 그 **GoF 이름으로 직접 드러나는 빈도**는 프레임워크·도메인에 따라 크게 다르다. 한 곳에 모아 **언제 쓰나 · 핵심 구조 · 요즘은 어떤 형태로 보이나**를 짚는다. 객관적인 사용량 순위가 아니라 적용 범위가 전문적인 패턴 묶음이다.

---

## Bridge (구조)

**한 줄**: 추상(무엇)과 구현(어떻게)을 두 개의 독립된 계층으로 분리해, 둘이 따로따로 늘어나게 한다.

**언제 쓰나**: 변하는 축이 둘일 때. 예를 들어 도형(원·사각형)과 렌더링 방식(벡터·래스터)이 각각 늘어난다면, 상속으로 조합하면 `VectorCircle`, `RasterCircle`, `VectorSquare`… 로 클래스가 곱셈으로 폭발한다.

```cpp
// 구현 축: 어떻게 그리나
class Renderer {
public:
    virtual void drawCircle(double r) = 0;
};
class VectorRenderer : public Renderer { /* ... */ };
class RasterRenderer : public Renderer { /* ... */ };

// 추상 축: 무엇을 그리나 — Renderer를 "다리"로 들고 있다
class Shape {
protected:
    Renderer& renderer;       // 다리(bridge)
public:
    explicit Shape(Renderer& r) : renderer(r) {}
    virtual void draw() = 0;
};
class Circle : public Shape {
    double radius;
public:
    Circle(Renderer& r, double rad) : Shape(r), radius(rad) {}
    void draw() override { renderer.drawCircle(radius); }
};
```

도형 M개 × 렌더러 N개가 `M+N` 클래스로 끝난다 (`M×N`이 아니라).

**요즘 보이는 형태**: 두 축을 interface와 composition으로 분리하는 설계에 녹아 있어 Bridge라는 이름을 붙이지 않는 경우가 많다. [Strategy](/posts/design-pattern/2025-03-07-strategy/)·[Adapter](/posts/design-pattern/2025-04-12-adapter/)와 구조가 닮아 더 헷갈린다 — Bridge는 *설계 단계에서* 두 축을 독립적으로 확장하려는 것이고, Adapter는 *이미 있는* 계약을 맞추는 조치다.

---

## Flyweight (구조)

**한 줄**: 똑같은 데이터를 가진 객체가 수없이 많을 때, 공통 부분(intrinsic)을 공유해 메모리를 아낀다.

**언제 쓰나**: 같은 상태의 객체가 수만~수백만 개 생길 때. 텍스트 에디터의 글자 하나하나를 객체로 만들면 폰트·글리프 정보가 글자마다 중복된다. 이 공통 정보를 한 번만 만들어 공유하고, 위치처럼 객체마다 다른 부분(extrinsic)만 바깥에서 넘긴다.

```cpp
#include <memory>
#include <unordered_map>

struct Font { /* font metadata */ };

// 공유되는 내재 상태 — 글리프 모양은 'A'마다 같다
class Glyph {
    char symbol;
    Font font;        // 무겁다
public:
    explicit Glyph(char value) : symbol(value) {}
    void draw(int x, int y) { /* x, y는 외부에서 받는다 */ }
};

// 팩토리가 같은 글리프를 재사용
class GlyphFactory {
    std::unordered_map<char, std::shared_ptr<Glyph>> pool;
public:
    std::shared_ptr<Glyph> get(char c) {
        if (!pool.count(c)) pool[c] = std::make_shared<Glyph>(c);
        return pool[c];     // 'A' 100만 개가 같은 객체 하나를 공유
    }
};
```

**요즘 보이는 형태**: 문자열 interning, glyph cache, 게임 asset 공유, immutable metadata pool처럼 대량 중복을 줄이는 최적화에 남아 있다. 일반 앱에 미리 도입할 이유는 적지만 데이터 규모가 크면 여전히 유효하다. 공유 내재 상태를 가변으로 만들면 버그를 부르므로 불변으로 유지한다.

---

## Interpreter (행위)

**한 줄**: 간단한 언어(문법)를 정의하고, 그 문장을 해석하는 규칙을 클래스로 표현한다. 문법 규칙 하나가 클래스 하나가 된다.

**언제 쓰나**: 반복적으로 등장하는 작은 도메인 언어를 직접 해석할 때. 예를 들어 `3 + 4 * 2` 같은 수식이나 단순 규칙 표현식.

```cpp
class Expr {
public:
    virtual int interpret() = 0;
};
class Number : public Expr {
    int value;
public:
    explicit Number(int v) : value(v) {}
    int interpret() override { return value; }
};
class Add : public Expr {
    Expr& left; Expr& right;
public:
    Add(Expr& l, Expr& r) : left(l), right(r) {}
    int interpret() override { return left.interpret() + right.interpret(); }
};
// (3 + 4) → Add(Number(3), Number(4)).interpret() == 7
```

규칙이 트리로 조립되는 모습은 [Composite](/posts/design-pattern/2026-06-18-composite/)와 사실상 같다.

**적용 경계**: 문법이 조금만 복잡해져도 클래스가 폭발하므로 ANTLR·yacc 같은 parser generator나 기존 표현식 라이브러리가 낫다. 반면 작은 규칙식·검색 조건·정책 DSL처럼 grammar가 작고 안정적이면 직접 구성한 AST evaluator로 이 구조를 만날 수 있다.

---

## 정리

| 패턴 | 분류 | 한 줄 | 살아 있는 자리 |
|------|------|-------|----------------|
| **Bridge** | 구조 | 추상·구현 두 축을 분리 | 독립적으로 변하는 두 축 |
| **Flyweight** | 구조 | 공통 상태 공유로 메모리 절약 | 게임·폰트·대규모 시뮬레이션 |
| **Interpreter** | 행위 | 문법 규칙을 클래스로 | 아주 단순한 DSL 한정 |

세 패턴 모두 문제 조건이 맞을 때만 가치가 있다. 이름보다 **두 확장 축, 대량 중복 상태, 작은 grammar**라는 적용 신호를 기억하고 필요할 때 깊게 보면 된다. 전체 패턴은 [디자인 패턴 로드맵](/posts/design-pattern/2026-06-19-roadmap/)에서 분류별로 정리해 두었다.
