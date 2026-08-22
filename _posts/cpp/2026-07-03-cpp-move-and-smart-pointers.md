---
title       : 값과 소유권 ③ 이동 시맨틱과 스마트 포인터
description : "모던 C++의 이동 시맨틱과 std::move의 정확한 의미, unique_ptr/shared_ptr/weak_ptr가 소유 관계를 어떻게 표현하는지 정리한다. Rust move와의 비교는 발판으로만 사용한다."
date        : 2026-07-03 10:30:00 +0900
updated     : 2026-08-22
categories  : [cpp]
tags        : [roadmap, modern-cpp]
pin         : false
hidden      : false
---

> [모던 C++ 학습 로드맵](/posts/cpp/2026-07-03-cpp-learning-roadmap/)의 **고급(값과 소유권)** 단계다. 앞 글: [② 클래스와 자원 관리](/posts/cpp/2026-07-03-cpp-class-and-resource-management/)

앞 글의 Rule of Three는 복사를 안전하게 만드는 법을 다뤘다. 이번에는 **복사할 필요가 없는 객체의 자원을 재사용하는 이동 시맨틱**과 그 위에서 소유 관계를 표현하는 스마트 포인터를 본다.

## 복사는 왜 낭비가 될 수 있나

```cpp
Buffer make();
Buffer b = make();
```

구현과 최적화에 따라 copy elision이 적용될 수 있으므로 이 코드가 실제로 반드시 복사된다고 가정하면 안 된다. 다만 **이미 존재하는 큰 객체의 자원을 새 객체로 넘겨야 하는 상황**에서는 깊은 복사 대신 이동이 유리할 수 있다.

이동 시맨틱은 "곧 더 이상 기존 값을 유지할 필요가 없는 객체의 자원"을 재사용할 수 있게 한다.

## rvalue reference와 이동 생성자

```cpp
class Buffer {
    int* data{};
    std::size_t size{};

public:
    Buffer(Buffer&& other) noexcept
        : data(other.data), size(other.size) {
        other.data = nullptr;
        other.size = 0;
    }

    Buffer& operator=(Buffer&& other) noexcept {
        if (this == &other) return *this;

        delete[] data;
        data = other.data;
        size = other.size;
        other.data = nullptr;
        other.size = 0;
        return *this;
    }
};
```

이 예제에서는 이동 후 원본을 빈 상태로 만든다. **모든 moved-from 객체가 반드시 빈 상태가 되는 것은 아니다.** 이동 후 상태는 타입의 계약을 따라야 한다.

## `std::move`는 실제로 옮기지 않는다

`std::move`는 이름 때문에 오해하기 쉽지만 실제 자원 이전을 수행하지 않는다.

```cpp
Buffer a;
Buffer b = std::move(a);
```

여기서 `std::move(a)`는 대략 **`a`를 xvalue/rvalue reference로 취급할 수 있게 하는 캐스팅**이다. 실제 자원 이전은 이후 선택된 이동 생성자나 이동 대입 연산자가 수행한다.

```text
std::move
→ "이 값을 이동 후보로 취급해도 된다"는 표현 변환

move constructor / move assignment
→ 실제 타입별 이동 동작 수행
```

따라서 `std::move = move 수행`으로 외우지 않는다.

## moved-from 객체는 어떻게 다뤄야 하나

표준 라이브러리 타입의 moved-from 객체는 특별한 보장이 없는 한 **valid but unspecified state**에 있다.

일반적으로 가능한 것은 다음과 같다.

- 소멸
- 새 값 대입
- 타입 문서가 이동 후에도 보장한다고 명시한 연산

`std::unique_ptr`처럼 이동 후 원본이 null이라고 명시적으로 보장하는 타입도 있다. 사용자 정의 타입은 자신의 move postcondition을 문서화할 수 있다.

따라서

```text
moved-from = 무효 객체
```

또는

```text
moved-from = 항상 빈 객체
```

라고 일반화하지 않는다.

## 스마트 포인터 — 소유 관계를 타입으로 드러낸다

스마트 포인터는 포인터 수명과 자원 정리를 RAII에 연결한다.

| 타입 | 소유 관계 | 대표 용도 |
|---|---|---|
| `unique_ptr<T>` | 단일 소유 | 기본 소유 포인터 |
| `shared_ptr<T>` | 공유 소유 | 여러 소유자가 같은 객체 수명을 함께 유지 |
| `weak_ptr<T>` | 비소유 관찰 | `shared_ptr` 순환 참조 완화 |

### unique_ptr

```cpp
auto p = std::make_unique<Widget>();
auto q = std::move(p);
```

`unique_ptr`은 복사할 수 없고 이동할 수 있다. 이 때문에 "이 객체를 누가 소유하는가"가 코드에서 비교적 명확하게 드러난다.

### shared_ptr

```cpp
auto p = std::make_shared<Widget>();
auto q = p;
```

`shared_ptr` 복사는 참조 카운트를 증가시켜 공유 소유를 만든다. 마지막 소유자가 사라질 때 관리 대상이 정리된다.

다만 `shared_ptr`을 일반 raw pointer의 자동 대체재처럼 사용하면 소유 관계가 오히려 흐려질 수 있다. **공유 소유가 정말 필요한 경우에만** 선택하는 편이 좋다.

### weak_ptr

`weak_ptr`은 소유권을 늘리지 않고 `shared_ptr`이 관리하는 객체를 관찰한다. 대표적으로 순환 소유 구조를 끊는 데 사용한다.

## `new`/`delete`를 직접 쓰지 않는다는 말의 경계

일반 애플리케이션 코드에서는 `make_unique`, `make_shared`, 표준 컨테이너와 RAII 타입을 사용해 직접 `new`/`delete`를 쓸 필요를 크게 줄일 수 있다.

하지만

```text
현대 C++에서는 new/delete를 절대 쓰지 않는다
```

는 규칙은 아니다. allocator, custom memory resource, 저수준 라이브러리, placement new 같은 영역에서는 직접적인 메모리 관리가 여전히 필요할 수 있다.

중요한 실무 원칙은 **소유권과 정리 책임을 가능한 한 RAII 타입에 캡슐화한다**는 것이다.

## Rust와 비교할 때의 경계

Rust의 move를 C++ 이동 시맨틱과 비교하면 직관을 잡는 데 도움이 된다. 하지만 같은 연산은 아니다.

```text
C++ std::move
→ rvalue 취급을 위한 캐스팅

Rust move
→ 언어 의미론상의 소유권 이전
```

C++에서는 moved-from 객체가 여전히 유효한 객체일 수 있고 타입 계약에 따라 사용할 수 있다. Rust에서 non-`Copy` 값이 이동하면 이전 바인딩 사용은 컴파일러가 금지한다.

자세한 비교는 [값 vs 참조 의미론](/posts/concept/2026-07-12-value-vs-reference-semantics/)에서 본다.

## 자주 막히는 지점

- `std::move`가 실제 이동을 수행한다고 생각한다.
- 모든 moved-from 객체가 null/empty라고 가정한다.
- 공유 소유가 필요하지 않은데 `shared_ptr`부터 사용한다.
- move constructor가 예외를 던질 수 있어 표준 컨테이너가 복사를 선택하는 경우를 놓친다.

## 통과 기준

- `std::move`와 move constructor의 역할을 구분할 수 있다.
- moved-from 객체에 대해 타입 문서의 postcondition만 신뢰해야 함을 안다.
- `unique_ptr`, `shared_ptr`, `weak_ptr`의 소유 관계 차이를 설명할 수 있다.

다음은 [STL — 컨테이너와 알고리즘](/posts/cpp/2026-07-03-cpp-stl-containers-and-algorithms/)이다.

## Reference

- [cppreference — std::move](https://en.cppreference.com/w/cpp/utility/move)
- [cppreference — Smart pointers](https://en.cppreference.com/w/cpp/memory)
- *Effective Modern C++* Item 18~25
