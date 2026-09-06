---
title       : C++로 사고하기 ① 참조자와 동적 할당
description : "C에서 넘어온 사람을 위한 C++ 첫 단계. 참조자가 포인터와 무엇이 다른지, new/delete가 malloc/free와 무엇이 다른지를 예제로 짚고, 이후 자원 관리(RAII)로 이어지는 연결고리를 잡는다."
date        : 2026-07-03 10:10:00 +0900
updated     : 2026-09-06
categories  : [cpp]
tags        : [modern-cpp]
pin         : false
hidden      : false
---

> [모던 C++ 학습 로드맵](./2026-07-03-cpp-learning-roadmap.md)의 **초급** 단계에 해당하는 글입니다.

C를 배운 사람이 C++를 시작할 때, 문법의 8할은 이미 익숙합니다. 그래서 이 단계의 목표는 새 문법 암기가 아니라 **C에는 없던 C++의 사고방식**을 잡는 것입니다. 그 출발점이 참조자와 동적 할당입니다.

## 참조자 — 포인터가 아니다

참조자(reference)는 **이미 존재하는 객체에 붙는 별칭**입니다.

```cpp
int value = 10;
int& ref = value;  // ref는 value의 별칭

ref = 20;
std::cout << value;  // 20 — ref를 바꾸면 value가 바뀐다
```

C만 하던 사람은 이걸 "포인터의 다른 문법"으로 오해하기 쉽습니다. 하지만 참조자는 포인터와 세 가지가 다릅니다.

| | 포인터 | 참조자 |
|---|---|---|
| 초기화 없이 선언 | 가능 | **불가능** — 선언 시 반드시 대상을 지정 |
| 다른 대상으로 재지정 | 가능 | **불가능** — 한 번 묶이면 같은 대상을 참조 |
| 명시적인 null 상태 | 가능 | **없음** — null을 표현하는 별도 값이 없음 |

즉 참조자는 포인터처럼 주소 값을 저장해 이리저리 재지정하는 인터페이스가 아니라, **처음 묶인 대상을 그 이름으로 계속 다루는 별칭**입니다.

다만 이것이 참조자가 언제나 유효하다는 뜻은 아닙니다. 참조 대상의 수명이 먼저 끝나면 참조자도 dangling reference가 됩니다.

```cpp
int& bad() {
    int value = 10;
    return value;  // 함수가 끝나면 value의 수명도 끝남
}
```

따라서 참조자에서도 핵심 질문은 포인터와 마찬가지로 **"내가 참조하는 객체가 이 참조보다 오래 사는가?"**입니다. 이 수명 관점은 뒤의 RAII·소유권 표현으로 그대로 이어집니다.

### 참조자를 왜 쓰나 — 함수 인자

참조자가 가장 빛나는 곳은 함수 인자입니다. C에서는 함수가 인자를 바꾸게 하려면 포인터를 넘겨야 했습니다.

```cpp
// C 스타일 — 포인터
void increment(int* p) { (*p)++; }
increment(&value);

// C++ — 참조자
void increment(int& r) { r++; }
increment(value);  // & 없이, 역참조 없이
```

호출부가 `&value`가 아니라 그냥 `value`라 읽기 쉽고, 함수 안에서도 `*p`가 아니라 `r`로 자연스럽게 씁니다.

### const 참조자 — 복사 없이 읽기만

큰 객체를 함수에 넘길 때 값으로 넘기면 복사가 생길 수 있습니다. 그렇다고 일반 참조자로 넘기면 함수가 원본을 바꿀 수 있게 됩니다. **복사를 피하면서 이 경로에서는 수정하지 않게 하고 싶을 때** `const` 참조자를 자주 씁니다.

```cpp
void print(const std::string& text) {
    std::cout << text;
}
```

`const T&`는 C++ API에서 매우 흔한 형태입니다. 다만 작은 값 타입은 값으로 넘기는 편이 더 단순할 수 있으므로 "읽기 전용 인자는 무조건 const reference"라는 규칙으로 외우기보다 **복사 비용과 소유·수명 의미**를 함께 봅니다.

## 동적 할당 — new와 delete

동적 저장 기간(dynamic storage duration)의 객체를 직접 만들 때 C++에는 `new`/`delete`가 있습니다. C의 `malloc`/`free`와 비슷하게 메모리를 얻고 돌려주는 모습이지만, 객체 수명까지 함께 다룬다는 점이 중요합니다.

```cpp
int* p = new int(42);   // 저장 공간 확보 + int 객체 생성·초기화
delete p;               // 객체 수명 종료 + 저장 공간 해제

int* arr = new int[10];
delete[] arr;           // 배열 new에는 배열 delete가 대응
```

현대 C++의 기본 설계는 이런 직접 `new`/`delete`를 곳곳에 쓰는 것이 아닙니다. 여기서는 **왜 직접 수명 관리가 위험한지 이해하기 위해** 먼저 원시 형태를 봅니다.

### malloc과 무엇이 다른가

`new` expression은 저장 공간을 확보한 뒤 그곳에 객체를 생성하고 초기화합니다. `delete` expression은 객체의 소멸 과정을 수행한 뒤 저장 공간을 해제합니다.

반면 `malloc`은 기본적으로 **바이트 단위 저장 공간을 확보하는 C 메모리 API**입니다. 다음처럼 non-trivial C++ 객체를 위한 저장 공간만 얻었다고 해서 `Widget` 객체가 생성되는 것은 아닙니다.

```cpp
struct Widget {
    Widget()  { std::cout << "생성\n"; }
    ~Widget() { std::cout << "소멸\n"; }
};

Widget* w = new Widget();  // Widget 객체 생성, 생성자 호출
delete w;                  // 소멸자 호출 후 저장 공간 해제

void* raw = std::malloc(sizeof(Widget)); // 저장 공간만 확보
// raw을 Widget*로 cast하는 것만으로 Widget 생성자가 호출되지는 않음
std::free(raw);
```

C++에서는 **저장 공간(storage)과 그 공간 안에서 살아 있는 객체(object lifetime)를 구분**해야 합니다. 이 경계가 placement new, allocator, container 구현 같은 더 깊은 주제로 이어지지만, 처음에는 "메모리를 확보한 것과 C++ 객체를 생성한 것은 같은 일이 아니다"까지만 잡으면 됩니다.

## 이 둘이 이어지는 곳 — 다음 단계 예고

동적 할당을 직접 하다 보면 곧 문제에 부딪힙니다. **`delete`를 깜빡하면 누수, 수명 규칙을 어기면 dangling access나 double delete 같은 오류**가 생깁니다. 그리고 예외가 중간에 발생하면 수동 정리 코드까지 도달하지 못할 수도 있습니다.

```cpp
void risky() {
    Widget* w = new Widget();
    mayThrow();   // 여기서 예외가 나면
    delete w;     // 이 줄에 도달하지 못함 — 누수
}
```

C++의 핵심 해법은 **자원의 수명을 객체의 수명에 묶는 것**입니다. 객체가 유효한 동안 자원을 소유하고, 객체 수명이 끝날 때 정리되도록 만들면 정상 경로와 예외 경로를 따로 수동 관리할 필요가 크게 줄어듭니다. 이것이 **RAII**이고, 다음 단계인 클래스와 자원 관리의 핵심 주제입니다.

```text
직접 new/delete
→ 사람이 모든 종료 경로에서 수명을 맞춰야 함

RAII
→ 자원 수명을 객체 수명에 묶음
→ scope 종료·stack unwinding에서도 정리
```

지금 단계에서는 `new/delete` 자체를 숙련하는 것보다 **수명을 직접 맞추는 방식이 왜 취약하고, 왜 RAII가 필요한지** 이해하는 것이 더 중요합니다.

## 자주 막히는 지점

- **참조자를 포인터처럼 재지정하려는 시도** — `int& r = a; r = b;`는 `r`의 대상을 `b`로 바꾸는 것이 아니라 `a`에 `b`의 값을 대입합니다.
- **참조자는 항상 안전하다는 오해** — 대상 객체의 수명이 먼저 끝나면 dangling reference가 됩니다.
- **`delete`와 `delete[]` 혼동** — `new[]`로 만든 배열에는 대응되는 `delete[]`가 필요합니다. 짝을 어기면 미정의 동작입니다.
- **저장 공간과 객체를 같은 것으로 보기** — `malloc`으로 메모리를 확보하고 포인터를 cast한 것만으로 non-trivial C++ 객체가 생성되는 것은 아닙니다.

## 통과 기준

- 참조자가 포인터와 어떻게 다르고, 어떤 경우 dangling reference가 되는지 설명할 수 있다.
- 저장 공간 확보와 C++ 객체 수명 시작이 왜 다른 개념인지 설명할 수 있다.
- 직접 `new/delete`로 수명을 맞추는 방식이 왜 예외·여러 종료 경로에서 취약한지 설명할 수 있다.
- 다음 단계의 RAII가 어떤 문제를 해결하려는지 연결할 수 있다.

여기까지 잡혔으면 다음 글, **클래스와 자원 관리**로 넘어갑니다.

## Reference

- [씹어먹는 C++ 강좌 2~3강 (modoocode)](https://modoocode.com/category/C++) — 참조자와 동적 할당의 한글 상세 설명
- [cppreference — Reference declaration](https://en.cppreference.com/w/cpp/language/reference)
- [cppreference — new expression](https://en.cppreference.com/w/cpp/language/new)