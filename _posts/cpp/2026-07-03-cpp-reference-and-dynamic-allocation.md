---
title       : C++로 사고하기 ① 참조자와 동적 할당
description : "C에서 넘어온 사람을 위한 C++ 첫 단계. 참조자가 포인터와 무엇이 다른지, new/delete가 malloc/free와 무엇이 다른지를 예제로 짚고, 이후 자원 관리(RAII)로 이어지는 연결고리를 잡는다."
date        : 2026-07-03 10:10:00 +0900
updated     : 2026-07-03
categories  : [cpp]
tags        : [roadmap, modern-cpp]
pin         : false
hidden      : false
---

> [모던 C++ 학습 로드맵](/posts/cpp/2026-07-03-cpp-learning-roadmap/)의 **초급** 단계에 해당하는 글입니다.

C를 배운 사람이 C++를 시작할 때, 문법의 8할은 이미 익숙합니다. 그래서 이 단계의 목표는 새 문법 암기가 아니라 **C에는 없던 C++의 사고방식**을 잡는 것입니다. 그 출발점이 참조자와 동적 할당입니다.

## 참조자 — 포인터가 아니다

참조자(reference)는 **이미 존재하는 변수의 또 다른 이름**입니다.

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
| 다른 대상으로 재지정 | 가능 | **불가능** — 한 번 묶이면 끝까지 그 변수 |
| 널(null) 가능 | 가능 | **불가능** — 항상 유효한 대상을 가리킴 |

즉 참조자는 "**널이 될 수 없고, 재지정도 안 되는, 항상 유효한 별칭**"입니다. 이 제약이 오히려 안전장치가 됩니다. 널 체크가 필요 없고, 중간에 다른 걸 가리킬 걱정이 없습니다.

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

큰 객체를 함수에 넘길 때 값으로 넘기면 통째로 복사됩니다. 그렇다고 참조자로 넘기면 함수가 원본을 바꿀 수 있게 되죠. **복사도 하기 싫고 수정도 막고 싶을 때** `const` 참조자를 씁니다.

```cpp
void print(const std::string& text) {  // 복사 안 함, 수정 못 함
    std::cout << text;
}
```

이 패턴 — "읽기 전용 인자는 `const T&`로 받는다" — 은 C++ 코드 전반에서 계속 등장하니 지금 눈에 익혀두면 좋습니다.

## 동적 할당 — new와 delete

실행 중에 크기가 정해지는 메모리는 힙(heap)에 할당합니다. C에서는 `malloc`/`free`였고, C++에서는 `new`/`delete`입니다. 문법만 바뀐 게 아닙니다.

```cpp
int* p = new int(42);   // 할당 + 42로 초기화
delete p;               // 해제

int* arr = new int[10]; // 배열 할당
delete[] arr;           // 배열은 delete[]로 해제 — 짝이 다르다
```

### malloc과 무엇이 다른가

핵심 차이는 **`new`는 생성자를 부르고, `delete`는 소멸자를 부른다**는 점입니다. `malloc`은 그냥 바이트 덩어리를 줄 뿐, 객체를 "만들지" 않습니다.

```cpp
struct Widget {
    Widget()  { std::cout << "생성\n"; }
    ~Widget() { std::cout << "소멸\n"; }
};

Widget* w = new Widget();  // "생성" 출력 — 생성자 호출
delete w;                  // "소멸" 출력 — 소멸자 호출

Widget* m = (Widget*)malloc(sizeof(Widget));  // 아무것도 출력 안 됨
free(m);                                       // 소멸자 호출 안 됨
```

객체를 다룰 땐 `malloc`/`free`가 아니라 `new`/`delete`를 써야 하는 이유가 이겁니다. 생성자·소멸자가 자원(파일, 메모리, 락 등)을 관리한다면, `malloc`으로 만든 객체는 그 관리를 통째로 건너뛰게 됩니다.

## 이 둘이 이어지는 곳 — 다음 단계 예고

동적 할당을 직접 하다 보면 곧 문제에 부딪힙니다. **`delete`를 깜빡하면 누수, 두 번 하면 크래시**입니다. 그리고 예외가 중간에 터지면 `delete`까지 도달하지 못하기도 합니다.

```cpp
void risky() {
    Widget* w = new Widget();
    mayThrow();   // 여기서 예외가 나면
    delete w;     // 이 줄에 영원히 도달하지 못한다 — 누수
}
```

C++의 해법은 "**자원의 수명을 객체의 수명에 묶는다**"입니다. 생성자에서 자원을 얻고 소멸자에서 놓으면, 스코프를 벗어날 때 소멸자가 자동으로 호출되므로 `delete`를 깜빡할 수 없습니다. 이것이 **RAII**이고, 다음 단계인 **객체지향(클래스와 자원 관리 3종)**의 핵심 주제입니다. 지금은 "직접 `delete`하는 건 위험하고, C++엔 더 나은 방법이 있다"는 감만 가지고 넘어가면 됩니다.

## 자주 막히는 지점

- **참조자를 포인터처럼 재지정하려는 시도** — `int& r = a; r = b;`는 "r을 b로 바꾸는" 게 아니라 "a에 b의 값을 대입"하는 것입니다.
- **`delete`와 `delete[]` 혼동** — `new[]`로 만든 건 반드시 `delete[]`로. 짝을 어기면 미정의 동작입니다.
- **`malloc`으로 만든 C++ 객체** — 생성자가 호출되지 않아 객체가 반쯤만 만들어진 상태가 됩니다.

## 통과 기준

- 참조자와 포인터의 차이를 세 가지로 말할 수 있다.
- `new`가 `malloc`과 무엇이 다른지(생성자 호출) 설명할 수 있다.
- "직접 `delete`가 왜 위험한지"를 예외 상황으로 설명할 수 있다.

여기까지 잡혔으면 다음 글, **객체지향 — 클래스와 자원 관리**로 넘어갑니다.

## Reference

- [씹어먹는 C++ 강좌 2~3강 (modoocode)](https://modoocode.com/category/C++) — 참조자와 동적 할당의 한글 상세 설명
- [cppreference — Reference declaration](https://en.cppreference.com/w/cpp/language/reference)
- [cppreference — new expression](https://en.cppreference.com/w/cpp/language/new)
