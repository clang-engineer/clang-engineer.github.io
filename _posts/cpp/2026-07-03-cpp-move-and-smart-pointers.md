---
title       : 값과 소유권 ③ 이동 시맨틱과 스마트 포인터
description : "모던 C++의 뼈대. 복사가 낭비인 상황에서 나온 우측값 레퍼런스와 이동 시맨틱, std::move의 진짜 의미, 그리고 소유권을 코드로 표현하는 스마트 포인터(unique_ptr/shared_ptr/weak_ptr)까지 예제로 정리한다."
date        : 2026-07-03 10:30:00 +0900
updated     : 2026-07-24
categories  : [cpp]
tags        : [roadmap, modern-cpp]
pin         : false
hidden      : false
---

> [모던 C++ 학습 로드맵](/posts/cpp/2026-07-03-cpp-learning-roadmap/)의 **고급(값과 소유권)** 단계입니다. 앞 글: [② 클래스와 자원 관리](/posts/cpp/2026-07-03-cpp-class-and-resource-management/)

앞 글의 Rule of Three는 복사를 **깊은 복사**로 만들어 안전하게 했습니다. 그런데 곧 없어질 임시 객체까지 통째로 복제하는 건 낭비입니다. 여기서 모던 C++(C++11)의 핵심, **이동 시맨틱**이 나옵니다. 이 장이 고급 단계에서 가장 중요합니다.

> **언어 공통 개념**: 스마트 포인터로 "소유권을 타입에 새기는" 이 접근은 메모리를 언제 잡고 푸느냐를 누가 정하느냐의 한 답입니다. 수동(C++)·GC(Go/Java)·소유권(Rust) 세 모델의 비교는 → [메모리 관리 모델](/posts/concept/2026-07-12-memory-management-models/). 이 글은 그중 **C++의 수동+RAII 구현**입니다.

## 복사는 왜 낭비인가

```cpp
Buffer make() { return Buffer(1000); }  // 함수가 임시 객체를 반환
Buffer b = make();                       // 임시 객체를 b로 "복사"?
```

`make()`가 만든 임시 객체는 이 줄이 끝나면 사라집니다. 그걸 깊은 복사로 1000개를 새로 할당해 베낀 뒤 원본을 버리는 건 낭비죠. **어차피 버려질 객체라면, 내부 포인터를 그냥 훔쳐오면** 됩니다. 이게 이동입니다.

## 우측값 레퍼런스와 이동 생성자

"곧 사라질 값의 자원을 재사용할 수 있다"는 의도를 받는 참조가 **우측값 레퍼런스** `T&&`입니다. 좌측값(lvalue)은 이름과 식별 가능한 위치를 가진 표현식이고, 우측값(rvalue)은 임시값처럼 자원을 재사용할 수 있는 값 범주입니다. 단순히 대입문의 왼쪽·오른쪽 위치로 정의하면 `const` lvalue처럼 예외가 생기므로, **identity가 있는가와 move 대상이 될 수 있는가**로 구분해야 합니다.

```cpp
class Buffer {
    int* data;
    int size;
public:
    // 이동 생성자 — 복제하지 않고 포인터만 가져온다
    Buffer(Buffer&& other) noexcept
        : data(other.data), size(other.size) {
        other.data = nullptr;   // ★ 원본을 비워, 소멸 시 이중 해제 방지
        other.size = 0;
    }

    Buffer& operator=(Buffer&& other) noexcept {   // 이동 대입
        if (this == &other) return *this;
        delete[] data;
        data = other.data; size = other.size;
        other.data = nullptr; other.size = 0;
        return *this;
    }
    // ... 앞 글의 복사 생성자/대입/소멸자도 함께
};
```

복사 셋(Rule of Three)에 이동 둘이 더해져 **Rule of Five**가 됩니다. 핵심은 이동 생성자가 **원본을 비워두는 것** — 그래야 원본이 소멸할 때 이미 넘긴 자원을 또 해제하지 않습니다.

## std::move는 "옮기지" 않는다

가장 흔한 오해입니다. `std::move`는 아무것도 이동시키지 않습니다. **"이 객체는 이제 훔쳐가도 된다"고 표시(캐스트)만** 합니다. 실제 이동은 그 표시를 받은 이동 생성자/대입이 합니다.

> **언어 공통 개념**: "복사냐 이동이냐 참조냐"를 손으로 고르는 이 선택은 언어마다 기본값이 갈린다 — Go는 복사 기본, Rust는 **이동을 기본값**으로. Rust가 moved-from 값 재사용을 컴파일 에러로 막는(아래 "다시 쓰면 안 된다"를 타입으로 강제) 지점까지 → [값 vs 참조 의미론](/posts/concept/2026-07-12-value-vs-reference-semantics/).

```cpp
Buffer a(1000);
Buffer b = std::move(a);   // a를 우측값으로 캐스트 → 이동 생성자 호출
// 이 Buffer 구현은 a를 data=nullptr, size=0으로 만든다고 명시했다
```

일반 규칙은 더 정확히 말해야 합니다. 표준 라이브러리의 moved-from 객체는 특별한 보장이 없는 한 **유효하지만 상태는 미지정(valid but unspecified)**입니다. 소멸하거나 새 값을 대입할 수 있고, 현재 상태를 전제로 하지 않는 연산도 호출할 수 있습니다. `unique_ptr`처럼 이동 후 null을 명시적으로 보장하는 타입도 있고, 위 `Buffer`처럼 직접 postcondition을 정할 수도 있습니다. 따라서 “무조건 비었다”거나 “재대입 외에는 사용 금지”가 아니라, **해당 타입이 문서화한 이동 후 보장만 의존한다**가 규칙입니다.

## 스마트 포인터 — 소유권을 타입으로 표현

이동 시맨틱을 이해하면 스마트 포인터가 자연스럽게 들어옵니다. 스마트 포인터는 RAII로 `new`/`delete`를 감싸, **누가 이 자원을 소유하는가**를 타입으로 드러냅니다. 이제 `delete`를 직접 쓸 일이 사라집니다.

| 타입 | 소유 방식 | 언제 |
|---|---|---|
| `unique_ptr` | **유일 소유** — 복사 불가, 이동만 | 소유자가 하나일 때 (대부분의 경우) |
| `shared_ptr` | **공유 소유** — 참조 카운트 | 여러 곳이 같은 자원을 나눠 가질 때 |
| `weak_ptr` | 소유하지 않는 관찰자 | `shared_ptr` 순환 참조를 끊을 때 |

```cpp
auto p = std::make_unique<Widget>();   // 유일 소유
auto q = std::move(p);                 // 소유권 이전 — p는 이제 비어 있음
// unique_ptr는 복사가 안 되므로 이동으로만 넘긴다

auto s1 = std::make_shared<Widget>();  // 참조 카운트 1
auto s2 = s1;                          // 복사 OK, 카운트 2
// s1, s2가 모두 사라지면 카운트 0 → 자동 delete
```

`unique_ptr`가 "복사 불가, 이동만"인 게 바로 앞에서 배운 이동 시맨틱의 실전 사례입니다.

## 자주 막히는 지점

- **`std::move` 후 원본 상태를 추측** — 일반적으로 valid but unspecified입니다. 소멸·재대입은 가능하고, 그 밖에는 타입이 문서화한 postcondition만 믿으세요.
- **`shared_ptr` 순환 참조** — 서로를 `shared_ptr`로 가리키면 카운트가 0이 안 되어 누수. 한쪽을 `weak_ptr`로.
- **`new`로 만들어 `shared_ptr`에 넣기** — `make_shared`를 쓰세요. 할당이 한 번으로 줄고 예외 안전합니다.
- **이동 생성자에 `noexcept` 누락** — `vector` 등이 재할당 시 이동 대신 복사로 폴백해 성능이 죽습니다.

## 통과 기준

- 복사와 이동의 차이를, "임시 객체를 왜 복제하지 않는가"로 설명할 수 있다.
- `std::move`가 실제로 하는 일(캐스트)을 정확히 말할 수 있다.
- `unique_ptr`와 `shared_ptr`를 언제 쓰는지, `weak_ptr`가 왜 필요한지 구분할 수 있다.

다음은 **STL — 컨테이너와 알고리즘**입니다. 이제 자원 관리를 표준 라이브러리가 대신 해주는 세계로 들어갑니다.

## Reference

- [씹어먹는 C++ 강좌 12~13강 (modoocode)](https://modoocode.com/category/C++) — 우측값 레퍼런스·이동·스마트 포인터의 한글 상세
- [cppreference — std::move](https://en.cppreference.com/w/cpp/utility/move)
- [cppreference — Smart pointers](https://en.cppreference.com/w/cpp/memory)
- *Effective Modern C++* Item 23~25 (이동 시맨틱), 18~21 (스마트 포인터)
