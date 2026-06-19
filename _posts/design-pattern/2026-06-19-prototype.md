---
title       : Prototype Pattern
description : "이미 만들어진 객체를 복제해 새 객체를 얻는 패턴. 생성 비용이 크거나 구체 타입을 모른 채 같은 종류를 찍어내야 할 때, new 대신 clone()을 부른다."
date        : 2026-06-19 13:00:00 +0900
updated     : 2026-06-19 13:00:00 +0900
categories  : [design-pattern, "생성"]
tags        : [creational-pattern]
pin         : false
hidden      : false
---

> **난이도** 입문 · **선행** [Factory](/posts/design-pattern/2025-04-11-factory/)

## 한 줄 요약
새 객체를 `new`로 처음부터 만드는 대신, **이미 설정된 견본(prototype)을 복제**해서 얻는다. 생성이 비싸거나, 만드는 쪽이 구체 타입을 모르고 "이것과 똑같은 걸 하나 더" 가 필요할 때 쓴다.

## 어떤 문제를 푸는가

게임에서 몬스터를 스폰한다고 하자. 몬스터 하나를 만들려면 스탯·스킬·AI 설정을 DB나 파일에서 읽어와 조립해야 한다 (비싼 작업).

```cpp
class Monster {
    Stats stats;        // DB에서 로드
    SkillSet skills;     // 파일에서 파싱
    AiConfig ai;         // 계산으로 조립
public:
    Monster(MonsterType type) {
        stats  = loadStatsFromDB(type);    // 느림
        skills = parseSkillFile(type);     // 느림
        ai     = buildAi(type);            // 느림
    }
};

// 같은 고블린 100마리를 소환
for (int i = 0; i < 100; i++) {
    Monster goblin(MonsterType::Goblin);   // 매번 DB·파일을 다시 읽는다
}
```

이 코드의 통증:
- 똑같은 고블린 100마리를 위해 무거운 로딩을 100번 반복한다.
- 소환하는 쪽이 `MonsterType::Goblin`이라는 구체 타입을 알아야 한다. 종류가 늘면 분기도 는다.

## 패턴 적용 후

견본 고블린을 한 번만 제대로 만들고, 나머지는 그것을 복제한다.

```cpp
class Monster {
public:
    virtual std::unique_ptr<Monster> clone() const = 0;
    virtual ~Monster() = default;
};

class Goblin : public Monster {
    Stats stats;
    SkillSet skills;
public:
    Goblin() {
        stats  = loadStatsFromDB(MonsterType::Goblin);  // 견본 만들 때 딱 한 번
        skills = parseSkillFile(MonsterType::Goblin);
    }
    // 복제는 메모리 복사뿐 — DB·파일을 다시 읽지 않는다
    std::unique_ptr<Monster> clone() const override {
        return std::make_unique<Goblin>(*this);   // 복사 생성자 사용
    }
};

int main() {
    auto prototype = std::make_unique<Goblin>();   // 무거운 로딩 1회

    std::vector<std::unique_ptr<Monster>> horde;
    for (int i = 0; i < 100; i++) {
        horde.push_back(prototype->clone());        // 메모리 복사만, 빠름
    }
}
```

달라진 점:
- 무거운 초기화는 견본 한 번. 나머지 99마리는 메모리 복사뿐.
- 소환하는 쪽은 `clone()`만 부른다. 그게 고블린인지 드래곤인지 몰라도 된다.

## 구조

- **Prototype**: `clone()`을 선언하는 인터페이스
- **ConcretePrototype**: `clone()`을 구현 (보통 복사 생성자 위임)
- **Client**: 프로토타입을 들고 `clone()`을 호출

```
Client ──▶ Prototype (interface: clone())
                 ▲
        ┌────────┴────────┐
     Goblin            Dragon
   clone()=copy      clone()=copy
```

## 얕은 복사 vs 깊은 복사 — 이 패턴의 핵심 함정

`clone()`이 포인터/참조 멤버를 그대로 복사하면, 원본과 복제본이 같은 객체를 가리킨다 (얕은 복사). 한쪽을 수정하면 다른 쪽이 깨진다.

```cpp
class Goblin : public Monster {
    std::shared_ptr<Inventory> inventory;   // 포인터 멤버
public:
    std::unique_ptr<Monster> clone() const override {
        auto copy = std::make_unique<Goblin>(*this);
        copy->inventory = std::make_shared<Inventory>(*inventory);  // 깊은 복사
        return copy;
    }
};
```

> 복제가 의미를 가지려면 "어디까지가 이 객체의 것인가"를 정해야 한다. 공유해도 되는 자원(읽기 전용 설정)은 얕게, 각자 가져야 하는 상태(인벤토리)는 깊게.

## 실전 사례

- **JavaScript의 프로토타입 상속**: 언어 자체가 이 패턴 위에 서 있다. `Object.create(proto)`는 견본을 복제하는 호출이다.
- **`clone()` / 복사 생성자**: C++ 복사 생성자, Java `Cloneable`(다만 설계 결함으로 악명 높아 복사 생성자·정적 팩토리가 권장된다).
- **에디터의 "복제(Duplicate)"**: 도형·레이어를 선택해 Ctrl+D로 똑같은 걸 하나 더 만드는 동작.

## Factory Pattern과의 차이

둘 다 "객체를 어떻게 만드냐"를 다루지만 출발점이 다르다.

| | Factory | Prototype |
|---|---|---|
| 무엇으로 만드나 | 타입 정보로 새로 생성 | 기존 인스턴스를 복제 |
| 아는 것 | 어떤 구체 클래스를 만들지 | 견본 하나, 구체 타입은 몰라도 됨 |
| 잘 맞는 때 | 종류가 고정·소수 | 생성이 비싸거나 런타임에 설정된 객체를 찍어낼 때 |

## 안티패턴 / 주의

- **복제가 싸고 생성도 싸면 굳이 쓰지 말 것**. 그냥 `new`가 읽기 쉽다.
- 깊은/얕은 복사 경계를 정하지 않은 `clone()`은 버그의 온상이다. 공유 자원과 고유 상태를 의식적으로 구분하라.
- Java의 `Cloneable`/`Object.clone()`은 final 필드와 충돌하고 생성자를 우회하는 등 함정이 많다. 복사 생성자나 정적 팩토리로 직접 구현하는 편이 안전하다.

## 스스로 점검

**1. 고블린 100마리를 만들 때 Prototype이 빠른 이유는?**

<details markdown="1">
<summary>답</summary>

무거운 초기화(DB·파일 로딩)는 견본을 만들 때 한 번만 일어나고, 나머지는 메모리 복사로 끝나기 때문. 생성 비용이 큰 객체일수록 이득이 크다.

</details>

**2. `clone()`이 포인터 멤버를 그대로 복사하면 무슨 일이 생기나?**

<details markdown="1">
<summary>답</summary>

원본과 복제본이 같은 객체를 가리키는 얕은 복사가 된다. 한쪽에서 그 객체를 수정하면 다른 쪽도 영향을 받아 의도치 않은 공유 버그가 난다. 각자 가져야 할 상태는 깊은 복사로 분리해야 한다.

</details>

**3. 생성도 싸고 복제도 싼 단순 값 객체에 Prototype을 도입하는 게 좋을까?**

<details markdown="1">
<summary>답</summary>

아니다. 그냥 `new` / 생성자가 더 읽기 쉽다. Prototype은 생성이 비싸거나 구체 타입을 숨겨야 할 때 값을 한다 (YAGNI).

</details>
