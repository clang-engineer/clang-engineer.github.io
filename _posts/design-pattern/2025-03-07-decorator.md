---
title       : Decorator Pattern
description : "상속으로 기능을 조합하면 클래스 수가 폭발한다. Component를 감싸는 Decorator를 위임으로 쌓아 동적으로 기능을 추가하는 구조."
date        : 2025-03-07 22:50:42 +0900
updated     : 2025-03-07 22:50:42 +0900
categories  : [design-pattern, "구조"]
tags        : [structural-pattern]
pin         : false
hidden      : false
---

## 한 줄 요약
객체를 같은 인터페이스를 가진 래퍼로 감싸 기능을 더한다. 상속 대신 위임을 쌓는 방식이라, 런타임에 기능 조합을 자유롭게 만들 수 있다.

## 어떤 문제를 푸는가

카페 음료 가격표를 만든다고 해보자. 에스프레소·하우스블렌드 같은 베이스에 우유·모카·휘핑을 자유롭게 얹는다. 이걸 상속으로 풀면 이렇게 된다.

```cpp
class Beverage { /* ... */ };
class Espresso : public Beverage { /* ... */ };
class EspressoWithMilk : public Espresso { /* ... */ };
class EspressoWithMilkAndMocha : public EspressoWithMilk { /* ... */ };
class EspressoWithMilkAndMochaAndWhip : public EspressoWithMilkAndMocha { /* ... */ };
class HouseBlendWithMilk : public HouseBlend { /* ... */ };
// 베이스 × 토핑 조합만큼 클래스가 폭발한다
```

문제:
- 토핑 N개면 조합이 2ⁿ. 새 토핑 하나 추가할 때마다 기존 클래스 절반을 다시 만든다.
- 손님이 에스프레소에 휘핑을 두 번 올려달라고 하면? 그 조합용 클래스를 또 만들어야 한다.
- 컴파일 타임에 모든 조합이 고정된다. 런타임 조합 불가.

## 패턴 적용 후

베이스 음료와 토핑을 같은 `Beverage` 인터페이스로 통일하고, 토핑이 베이스를 감싸는 형태로 위임한다.

```cpp
#include <iostream>
#include <memory>
#include <string>

class Beverage {
public:
    virtual std::string description() const = 0;
    virtual int cost() const = 0;
    virtual ~Beverage() = default;
};

class Espresso : public Beverage {
public:
    std::string description() const override { return "에스프레소"; }
    int cost() const override { return 3000; }
};

class HouseBlend : public Beverage {
public:
    std::string description() const override { return "하우스블렌드"; }
    int cost() const override { return 2500; }
};

class CondimentDecorator : public Beverage {
protected:
    std::unique_ptr<Beverage> beverage;
public:
    CondimentDecorator(std::unique_ptr<Beverage> b) : beverage(std::move(b)) {}
};

class Milk : public CondimentDecorator {
public:
    using CondimentDecorator::CondimentDecorator;
    std::string description() const override { return beverage->description() + " + 우유"; }
    int cost() const override { return beverage->cost() + 500; }
};

class Mocha : public CondimentDecorator {
public:
    using CondimentDecorator::CondimentDecorator;
    std::string description() const override { return beverage->description() + " + 모카"; }
    int cost() const override { return beverage->cost() + 700; }
};

class Whip : public CondimentDecorator {
public:
    using CondimentDecorator::CondimentDecorator;
    std::string description() const override { return beverage->description() + " + 휘핑"; }
    int cost() const override { return beverage->cost() + 300; }
};

int main() {
    // 에스프레소 + 모카 + 휘핑 + 휘핑 (휘핑 추가샷)
    auto drink = std::make_unique<Whip>(
        std::make_unique<Whip>(
            std::make_unique<Mocha>(
                std::make_unique<Espresso>()
            )
        )
    );
    std::cout << drink->description() << ": " << drink->cost() << "원" << std::endl;
    // 출력: 에스프레소 + 모카 + 휘핑 + 휘핑: 4300원
}
```

달라진 점:
- 새 토핑 추가 = `CondimentDecorator` 하위 클래스 하나만 추가. 기존 코드 무손상.
- 토핑을 몇 번이고 중첩할 수 있다 (휘핑 두 번 같은 케이스).
- 런타임에 조합이 결정된다.

## 구조

```
Beverage (interface)
    ▲
    ├──── Espresso, HouseBlend  (ConcreteComponent: 베이스)
    │
    └──── CondimentDecorator   ──has──▶ Beverage
              ▲
              ├── Milk, Mocha, Whip   (ConcreteDecorator: 래퍼)
```

- **Component**: 공통 인터페이스 (`Beverage`)
- **ConcreteComponent**: 기능을 갖는 실체 (`Espresso`)
- **Decorator**: Component를 보유하면서 같은 인터페이스를 구현 (`CondimentDecorator`)
- **ConcreteDecorator**: 호출 전·후에 기능을 덧붙임 (`Milk`)

핵심은 Decorator도 Beverage라는 점이다. 그래서 Decorator를 다시 다른 Decorator로 감쌀 수 있다.

> 출처: [Decorator Pattern - Wikipedia](https://en.wikipedia.org/wiki/Decorator_pattern)

## 실전 사례

- **Java `java.io`**: `new BufferedReader(new InputStreamReader(new FileInputStream(...)))` — `Reader` 인터페이스 위에 버퍼링·인코딩 변환 데코레이터를 쌓는 정통 데코레이터.
- **C++ 스트림 조작자(manipulator)**: `std::cout << std::hex << std::setw(8) << value;` — 출력 동작을 데코레이트.
- **HTTP 미들웨어**: 인증·로깅·압축을 핸들러에 차례로 덧붙이는 구조도 같은 형태.

## Proxy Pattern과의 차이

구조가 똑같다. 둘 다 같은 인터페이스를 가진 객체로 감싼다. 차이는 **의도**:

| | Decorator | Proxy |
|---|---|---|
| 무엇을 하나 | 기능을 추가 | 접근을 제어 |
| 누가 결정 | 클라이언트가 어떤 데코를 쌓을지 정함 | 프록시 자체가 접근 규칙을 가짐 |
| 중첩 의도 | 여러 겹 쌓는 게 정상 | 보통 한 겹 |

> 클래스 이름이 의도를 드러내야 한다. `LoggingBeverage`는 데코레이터, `AuthorizedFileAccess`는 프록시.

자세한 비교는 [Proxy 패턴](/posts/design-pattern/2025-03-07-proxy/) 글 참고.

## 안티패턴 / 주의

- **순서 의존성이 강하면 위험**. `Encrypt(Compress(x))`와 `Compress(Encrypt(x))`는 결과가 다르다. 데코레이터를 쌓는 순서가 의미를 갖는 패턴이면 사용자 실수가 잦다.
- **디버깅 비용**. 호출 스택이 데코레이터마다 한 칸씩 깊어진다. 5겹 쌓으면 스택 트레이스가 길어진다.
- **타입이 같아 보이지만 동작이 다름**. `Beverage*`를 받는 함수는 그게 단순 에스프레소인지 휘핑 두 번 얹은 에스프레소인지 구분 못 한다. 의도된 추상화지만 디버깅 때 헷갈린다.
- **데코레이터가 한 종류뿐이면 굳이 도입하지 마라**. 그냥 멤버 변수가 낫다.

## GoF 디자인 패턴 시리즈

| 패턴 | 분류 | 핵심 |
| --- | --- | --- |
| [Factory](/posts/design-pattern/2025-04-11-factory/) | 생성 | 생성 책임을 팩토리로 위임해 결합도를 낮춤 |
| [Singleton](/posts/design-pattern/2026-06-18-singleton/) | 생성 | 단일 인스턴스 보장 + 전역 접근점 |
| [Builder](/posts/design-pattern/2026-06-18-builder/) | 생성 | 복잡한 객체를 단계별로 조립 |
| [Adapter](/posts/design-pattern/2025-04-12-adapter/) | 구조 | Adaptee를 Target 인터페이스로 변환 |
| [Composite](/posts/design-pattern/2026-06-18-composite/) | 구조 | Leaf와 Composite를 같은 인터페이스로 트리 처리 |
| **Decorator (현재 글)** | 구조 | Component를 감싸 동적으로 기능 추가 |
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
