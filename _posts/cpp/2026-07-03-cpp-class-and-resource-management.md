---
title       : 객체지향 ② 클래스와 자원 관리
description : "C++ 객체지향의 핵심을 자원 관리 관점으로 정리. 생성자·소멸자로 자원 수명을 묶는 RAII, 얕은 복사 문제에서 나오는 Rule of Three, 그리고 상속·다형성에서 가상 소멸자가 필요한 이유까지 예제로 짚는다."
date        : 2026-07-03 10:20:00 +0900
updated     : 2026-07-24
categories  : [cpp]
tags        : [roadmap, modern-cpp]
pin         : false
hidden      : false
---

> [모던 C++ 학습 로드맵](/posts/cpp/2026-07-03-cpp-learning-roadmap/)의 **중급(객체지향)** 단계입니다. 앞 글: [① 참조자와 동적 할당](/posts/cpp/2026-07-03-cpp-reference-and-dynamic-allocation/)

앞 글에서 "직접 `delete`하는 건 위험하다"로 끝냈습니다. 그 해법이 클래스입니다. C++의 객체지향은 단순히 "데이터와 함수를 묶는" 것을 넘어, **자원의 수명을 객체의 수명에 묶는** 도구입니다. 이 관점으로 클래스를 보면 이후 모든 게 연결됩니다.

## RAII — 자원을 객체에 묶는다

생성자에서 자원을 얻고, 소멸자에서 놓습니다. 그러면 객체가 스코프를 벗어날 때 소멸자가 **자동으로** 호출되므로, 해제를 깜빡할 수 없습니다.

```cpp
class File {
    std::FILE* handle;
public:
    File(const char* path) { handle = std::fopen(path, "r"); }  // 획득
    ~File() { if (handle) std::fclose(handle); }                // 반납
};

void read() {
    File f("data.txt");
    mayThrow();   // 예외가 나도...
}                 // ...스코프를 벗어나며 ~File()이 자동 호출 → 파일 닫힘
```

앞 글의 누수 예제(`delete`에 도달 못 하는 문제)가 여기서 사라집니다. 이 패턴을 **RAII**(Resource Acquisition Is Initialization)라 부르고, C++ 자원 관리의 뼈대입니다.

## 얕은 복사 문제 — Rule of Three

자원을 가진 객체를 복사하면 문제가 생깁니다. 포인터 멤버를 그대로 복사하면 **두 객체가 같은 자원을 가리키게** 되고, 둘 다 소멸하면서 같은 자원을 두 번 해제합니다.

```cpp
class Buffer {
    int* data;
public:
    Buffer(int size) { data = new int[size]; }
    ~Buffer() { delete[] data; }
};

Buffer a(10);
Buffer b = a;   // 기본 복사: b.data와 a.data가 같은 주소 → 이중 해제 크래시
```

컴파일러가 자동 생성하는 복사는 멤버를 그대로 베끼는 **얕은 복사**라서 이 문제가 납니다. 자원을 직접 관리하는 클래스라면 셋을 함께 정의해야 합니다. 이것이 **Rule of Three**입니다.

```cpp
class Buffer {
    int* data;
    int size;
public:
    Buffer(int n) : data(new int[n]), size(n) {}
    ~Buffer() { delete[] data; }                          // ① 소멸자

    Buffer(const Buffer& other)                           // ② 복사 생성자
        : data(new int[other.size]), size(other.size) {
        std::copy(other.data, other.data + size, data);   // 자원을 새로 복제(깊은 복사)
    }

    Buffer& operator=(const Buffer& other) {              // ③ 복사 대입 연산자
        if (this == &other) return *this;                 // 자기 대입 방어

        int* new_data = new int[other.size];              // 먼저 복제: 실패하면 기존 객체 유지
        std::copy(other.data, other.data + other.size, new_data);

        delete[] data;
        data = new_data;
        size = other.size;
        return *this;
    }
};
```

핵심 규칙: **셋 중 하나라도 직접 정의해야 한다면, 보통 셋 다 필요하다.** 소멸자만 정의하고 복사를 방치하면 얕은 복사로 터집니다.

## const와 static

- **`const` 멤버 함수** — 객체 상태를 바꾸지 않겠다는 약속. `const` 객체에는 `const` 함수만 호출할 수 있습니다.
- **`static` 멤버** — 인스턴스가 아니라 **클래스 전체가 공유**하는 변수/함수.

```cpp
class Counter {
    static int total;      // 모든 인스턴스가 공유
    int value = 0;
public:
    int get() const { return value; }   // 읽기만 → const
    void inc() { value++; total++; }
};
```

## 상속과 다형성 — 가상 소멸자를 잊지 말 것

상속으로 코드를 확장하고, 가상 함수로 "기반 클래스 포인터로 파생 클래스의 동작을 부르는" 다형성을 얻습니다.

> **언어 공통 개념**: 이 `virtual`이 하는 일(여러 타입을 하나로 다루고 실제 동작은 런타임에 고르기)은 언어 무관 개념 **서브타입 다형성**입니다. Go `interface`·Rust `trait`가 vtable로 같은 일을 어떻게 하는지, "누가 인터페이스 만족을 선언하나"가 갈리는 지점은 → [서브타입 다형성 — 인터페이스·트레이트·가상 함수](/posts/concept/2026-07-12-subtype-polymorphism-dynamic-dispatch/).

```cpp
class Animal {
public:
    virtual void speak() const { std::cout << "..."; }
    virtual ~Animal() = default;    // ★ 가상 소멸자
};

class Dog : public Animal {
public:
    void speak() const override { std::cout << "멍멍"; }
};

Animal* a = new Dog();
a->speak();   // "멍멍" — 실제 타입(Dog)의 함수가 호출됨
delete a;     // 가상 소멸자 덕분에 ~Dog()가 올바르게 호출됨
```

**가상 소멸자를 빠뜨린 채** 기반 클래스 포인터로 파생 객체를 `delete`하면 동작이 정의되지 않습니다(undefined behavior). 파생 자원이 새는 정도로 끝난다고 보장할 수 없습니다. "기반 클래스로 다형적으로 삭제할 거면 소멸자를 `virtual`로" — 이게 규칙입니다.

## 자주 막히는 지점

- **소멸자만 정의하고 복사를 방치** — 얕은 복사로 이중 해제. Rule of Three를 지키거나, 아예 복사를 막으세요(`= delete`).
- **가상 소멸자 누락** — 기반 클래스 포인터로 파생 객체를 삭제하면 undefined behavior.
- **객체 슬라이싱** — 파생 객체를 기반 타입 *값*에 대입하면 파생 부분이 잘려 나갑니다. 다형성은 포인터·참조로만.

## 통과 기준

- 복사 생성자·복사 대입·소멸자를 갖춘 커스텀 `String` 클래스를 직접 구현할 수 있다.
- 얕은 복사가 왜 크래시를 내는지, Rule of Three가 왜 셋 묶음인지 설명할 수 있다.
- 가상 소멸자가 없을 때 무슨 일이 생기는지 말할 수 있다.

다음은 고급의 시작이자 모던 C++의 뼈대, **값과 소유권 — 이동 시맨틱과 스마트 포인터**입니다. 방금 만든 Rule of Three가 왜 현대에선 부족한지부터 시작합니다.

## Reference

- [씹어먹는 C++ 강좌 4~6강 (modoocode)](https://modoocode.com/category/C++) — 클래스·연산자 오버로딩·상속의 한글 상세
- [cppreference — The rule of three/five/zero](https://en.cppreference.com/w/cpp/language/rule_of_three)
- [cppreference — RAII](https://en.cppreference.com/w/cpp/language/raii)
