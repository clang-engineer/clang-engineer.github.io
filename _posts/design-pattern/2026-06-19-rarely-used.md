---
title       : 자주 안 쓰는 GoF 패턴 — Bridge · Flyweight · Interpreter
description : "GoF 23개 중 실무 빈도가 낮은 세 패턴을 한 곳에 모아 짧게 훑는다. 언제 쓰나, 핵심 구조, 그리고 왜 요즘 잘 안 쓰는지까지."
date        : 2026-06-19 16:00:00 +0900
updated     : 2026-06-19 16:00:00 +0900
categories  : [design-pattern, "개요"]
tags        : [design-pattern, structural-pattern, behavioral-pattern]
pin         : false
hidden      : false
---

> **난이도** 참고용 · **선행** 없음

GoF 23개 패턴 중에는 개념은 분명한데 실무에서 마주칠 일이 드문 것들이 있다. 각각 한 페이지를 채울 만큼 할 얘기가 많지 않아 한 곳에 모았다. 이름만 보고 "이게 뭐지?" 하지 않도록, **언제 쓰나 · 핵심 구조 · 왜 잘 안 쓰나**만 짚는다.

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

**왜 잘 안 쓰나**: "변하는 축이 둘"인 상황 자체가 흔치 않고, 막상 만나도 구성(composition)으로 자연스럽게 풀려 패턴 이름을 의식하지 않는다. [Strategy](/posts/design-pattern/2025-03-07-strategy/)·[Adapter](/posts/design-pattern/2025-04-12-adapter/)와 구조가 닮아 더 헷갈린다 — Bridge는 *설계 단계에서* 두 축을 미리 분리하는 것이고, Adapter는 *이미 있는* 것을 끼우는 사후 조치다.

---

## Flyweight (구조)

**한 줄**: 똑같은 데이터를 가진 객체가 수없이 많을 때, 공통 부분(intrinsic)을 공유해 메모리를 아낀다.

**언제 쓰나**: 같은 상태의 객체가 수만~수백만 개 생길 때. 텍스트 에디터의 글자 하나하나를 객체로 만들면 폰트·글리프 정보가 글자마다 중복된다. 이 공통 정보를 한 번만 만들어 공유하고, 위치처럼 객체마다 다른 부분(extrinsic)만 바깥에서 넘긴다.

```cpp
// 공유되는 내재 상태 — 글리프 모양은 'A'마다 같다
class Glyph {
    char symbol;
    Font font;        // 무겁다
public:
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

**왜 잘 안 쓰나**: 메모리가 귀하던 시절의 최적화 기법이라, 일반 앱에서는 이 정도 절약이 필요한 경우가 드물다. 여전히 살아 있는 곳은 게임(나무·파티클 수만 개), 폰트 렌더링, 대규모 시뮬레이션 정도. 잘못 쓰면 공유 객체가 가변 상태를 갖게 돼 버그를 부른다 — 내재 상태는 반드시 불변이어야 한다.

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

**왜 잘 안 쓰나**: GoF 23개 중 실무 빈도가 가장 낮다. 문법이 조금만 복잡해져도 클래스가 폭발하고, 진짜 파서가 필요하면 ANTLR·yacc 같은 파서 제너레이터나 기존 표현식 라이브러리를 쓰는 게 정석이다. 손으로 Interpreter를 짜는 경우는 정말 단순한 DSL 한정.

---

## 정리

| 패턴 | 분류 | 한 줄 | 살아 있는 자리 |
|------|------|-------|----------------|
| **Bridge** | 구조 | 추상·구현 두 축을 분리 | 변하는 축이 둘일 때 (드묾) |
| **Flyweight** | 구조 | 공통 상태 공유로 메모리 절약 | 게임·폰트·대규모 시뮬레이션 |
| **Interpreter** | 행위 | 문법 규칙을 클래스로 | 아주 단순한 DSL 한정 |

셋 다 "이런 게 있다"를 아는 것으로 충분하다. 실무에서 필요해지는 순간이 오면 그때 깊게 파도 늦지 않다. 자주 쓰이는 패턴들은 [디자인 패턴 로드맵](/posts/design-pattern/2026-06-19-roadmap/)에서 분류별로 정리해 두었다.
