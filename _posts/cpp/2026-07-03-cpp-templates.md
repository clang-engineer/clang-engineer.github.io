---
title       : 제네릭 ⑤ 템플릿
description : "STL이 모든 타입에서 동작하는 원리인 템플릿을 정리. 함수·클래스 템플릿과 타입 추론, 템플릿을 왜 헤더에 정의하는지, 가변 길이 템플릿과 C++20 concepts까지 실용 범위로 짚는다."
date        : 2026-07-03 10:50:00 +0900
updated     : 2026-07-03
categories  : [cpp]
tags        : [roadmap, modern-cpp]
pin         : false
hidden      : false
---

> [모던 C++ 학습 로드맵](/posts/cpp/2026-07-03-cpp-learning-roadmap/)의 **고급(제네릭)** 단계입니다. 앞 글: [④ STL 컨테이너와 알고리즘](/posts/cpp/2026-07-03-cpp-stl-containers-and-algorithms/)

`std::vector<int>`, `std::vector<std::string>` — 어떻게 하나의 `vector`가 모든 타입에서 동작할까요? 답이 **템플릿**입니다. 타입 자체를 인자로 받아, 컴파일러가 필요한 타입마다 코드를 찍어냅니다.

## 함수 템플릿 — 코드를 찍어내는 틀

```cpp
template <typename T>
T max(T a, T b) {
    return a > b ? a : b;
}

max(3, 7);        // T = int로 인스턴스화
max(1.5, 2.5);    // T = double로 또 하나 인스턴스화
```

`template <typename T>`는 "아래 코드에서 `T`는 나중에 정해질 타입"이라는 선언입니다. 컴파일러는 `max(3, 7)`을 보고 `T`를 `int`로 추론해 그 버전을 **자동 생성**합니다. 이걸 인스턴스화(instantiation)라 합니다.

## 클래스 템플릿

STL 컨테이너가 이 방식입니다. 타입을 인자로 받는 클래스를 직접 만들어 보면 감이 옵니다.

```cpp
template <typename T>
class Box {
    T value;
public:
    Box(T v) : value(v) {}
    T get() const { return value; }
};

Box<int> a(42);
Box<std::string> b("hi");
```

## 왜 템플릿은 헤더에 정의하나

이게 초심자가 가장 많이 걸리는 지점입니다. 일반 함수는 선언(헤더)과 정의(`.cpp`)를 나눌 수 있지만, **템플릿은 그러면 링크 에러가 납니다.**

이유는 인스턴스화 시점 때문입니다. 컴파일러가 `Box<int>`를 만들려면 **정의 전체**를 봐야 하는데, 정의가 다른 `.cpp`에 숨어 있으면 볼 수 없습니다. 그래서 **템플릿의 정의는 헤더에 둡니다.**

```cpp
// box.h — 선언과 정의를 함께
template <typename T>
class Box { /* 정의까지 여기 */ };
```

## 가변 길이 템플릿 — 인자 개수도 일반화 [나중]

인자 개수가 정해지지 않은 템플릿입니다. `printf`처럼 임의 개수를 받되 타입 안전하게 처리합니다.

```cpp
template <typename... Args>          // 타입 묶음(parameter pack)
void print(Args... args) {
    (std::cout << ... << args);      // C++17 fold expression
}
print(1, " and ", 2.5, "\n");
```

당장은 "이런 게 가능하다" 정도로 넘어가고, 실제로 가변 인자 API를 만들 때 돌아오면 됩니다.

## concepts — 템플릿에 제약 걸기 (C++20) [나중]

전통적으로 템플릿은 잘못된 타입을 넣으면 **읽기 힘든 에러 폭탄**을 냈습니다. C++20의 `concepts`는 "이 타입은 이런 조건을 만족해야 한다"를 명시해 에러를 사람이 읽을 수 있게 만듭니다.

```cpp
#include <concepts>
template <std::integral T>   // T는 정수 타입이어야 함
T half(T x) { return x / 2; }

half(10);    // OK
half(3.14);  // 컴파일 에러 — "double은 integral이 아님"이라고 분명히 알려줌
```

## 자주 막히는 지점

- **템플릿 정의를 `.cpp`에 분리** → "undefined reference" 링크 에러. 정의를 헤더로 옮기세요.
- **난해한 에러 메시지** — 조건 불만족 시 에러가 깊은 내부에서 터집니다. `concepts`(C++20)나 `static_assert`로 경계에서 막으면 훨씬 읽기 쉽습니다.
- **과도한 일반화** — 실제로 여러 타입에서 쓸 게 아니면 템플릿으로 만들지 마세요. 한 타입만 쓰는데 템플릿화하면 복잡도만 늘어납니다.

> **TMP(템플릿 메타 프로그래밍)는 [선택]입니다.** 컴파일 타임 계산으로 라이브러리를 만드는 고급 기법이지만, 라이브러리 저자가 아니면 "이런 게 있다"만 알아도 충분합니다.

## 통과 기준

- 함수·클래스 템플릿을 직접 정의하고, 인스턴스화가 무슨 뜻인지 설명할 수 있다.
- 템플릿을 왜 헤더에 두는지(인스턴스화 시점) 말할 수 있다.

다음은 **동시성 — 스레드와 비동기**입니다. 필요해질 때 펼치는 [나중] 묶음이라, 지금 급하지 않다면 건너뛰고 모던 문법으로 가도 됩니다.

## Reference

- [씹어먹는 C++ 강좌 9강 (modoocode)](https://modoocode.com/category/C++) — 템플릿·가변 인자·TMP의 한글 상세
- [cppreference — Templates](https://en.cppreference.com/w/cpp/language/templates)
- [cppreference — Constraints and concepts](https://en.cppreference.com/w/cpp/language/constraints)
