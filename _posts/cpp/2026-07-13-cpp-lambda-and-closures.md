---
title       : 람다와 클로저 — 캡처·std::function·제네릭 람다
description : "람다가 컴파일러가 만드는 '클로저 객체'(operator()를 가진 익명 타입)라는 실체에서 출발해, 캡처 방식([=]/[&]/init-capture)과 [&] 댕글링 함정, 여러 호출 가능 객체를 한 타입에 담는 std::function의 비용, C++14 제네릭 람다까지 C++ 관점으로 정리한다."
date        : 2026-07-13 09:30:00 +0900
updated     : 2026-07-13 09:30:00 +0900
categories  : [cpp]
tags        : [roadmap, modern-cpp]
pin         : false
hidden      : false
---

> [모던 C++ 학습 로드맵](/posts/cpp/2026-07-03-cpp-learning-roadmap/)의 **③ 값과 소유권 — [나중] 함수를 객체로**의 상세입니다. STL 알고리즘에 술어를 넘길 때부터 계속 만나는 문법입니다.
>
> **언어 공통 개념**: "함수가 바깥 변수를 기억한다"는 클로저 자체는 언어 무관 개념 → [클로저란 무엇인가](/posts/concept/2026-07-12-closure/). 이 글은 그 **C++ 구현(람다)**에 집중합니다.

## 람다는 사실 "클로저 객체"다

람다는 마법이 아닙니다. 컴파일러가 **`operator()`를 가진 익명 클래스**를 만들고, 그 인스턴스(클로저 객체)를 건네주는 것입니다.

```cpp
int factor = 3;
auto times = [factor](int x) { return x * factor; };
times(5);   // 15
```

위 람다는 대략 이렇게 풀립니다 — `factor`는 **멤버 변수로 캡처**되고, 본문은 `operator()`가 됩니다.

```cpp
struct __lambda {
    int factor;                                  // 캡처 = 멤버
    int operator()(int x) const { return x * factor; }
};
```

> **아, 클로저가 "함수 + 캡처한 환경"이라던 게 C++에선 이거였구나.** 캡처한 변수가 **클로저 객체의 멤버**로 들어앉는 것. 그래서 각 람다는 **고유한 타입**을 가지고(같은 시그니처라도 서로 다른 타입), `auto`로 받거나 `std::function`으로 감싸야 합니다.

## 캡처 — 무엇을 어떻게 가져오나

```cpp
[=]         // 쓰는 외부 변수를 전부 값으로 복사
[&]         // 전부 참조로
[factor]    // factor만 값으로
[&sum]      // sum만 참조로
[=, &sum]   // 기본 값, sum만 참조
[this]      // 멤버 접근을 위해 this 포인터
[n = std::move(heavy)]   // init-capture (C++14): 이동해 들여오기
```

- `[=]`는 **복사**라 원본과 독립적이고 안전하지만, 큰 객체는 복사 비용이 있습니다.
- `[&]`는 **참조**라 값싸고 원본을 바꿀 수 있지만 — **댕글링 위험**이 있습니다(아래).
- **init-capture** `[n = std::move(x)]`는 `unique_ptr`처럼 복사 불가·이동만 되는 자원을 람다에 넣을 때 씁니다. → [이동 시맨틱](/posts/cpp/2026-07-03-cpp-move-and-smart-pointers/)

### [&] 댕글링 — C++ 고유의 함정

`[&]`로 캡처한 참조의 원본이 람다보다 **먼저 소멸**하면, 그 람다는 이미 사라진 변수를 가리킵니다(UB).

```cpp
auto make() {
    int local = 42;
    return [&] { return local; };   // ★ 위험: local은 make()가 끝나면 사라진다
}                                    // 반환된 람다가 죽은 변수를 참조
```

> GC가 있는 언어(JS·Go)는 캡처된 변수를 살려 두지만, **C++은 수명이 개발자 책임**이라 이 등치가 깨집니다. 람다를 **밖으로 내보낼 땐 `[=]`(복사)나 init-capture로** 소유를 가져오세요. 클로저 개념 글의 "무엇을 캡처하고 언제까지 사는지" 규칙이 C++에선 이 형태로 나타납니다.

`mutable`을 붙이면 값 캡처한 복사본을 람다 안에서 수정할 수 있습니다(`operator()`의 `const`가 벗겨짐).

## std::function — 여러 호출 가능 객체를 한 타입에

각 람다가 고유 타입이라, "람다를 담는 변수·매개변수"를 쓰려면 공통 타입이 필요합니다. `std::function`이 **타입 소거(type erasure)**로 그 역할을 합니다 — 시그니처만 맞으면 람다·함수 포인터·함수 객체를 다 담습니다.

```cpp
std::function<int(int)> f = times;        // 람다
f = some_free_function;                    // 함수 포인터도 OK
std::vector<std::function<void()>> tasks;  // 콜백 목록
```

> **비용을 알고 쓰세요.** `std::function`은 타입 소거를 위해 **힙 할당 + 간접 호출**이 따를 수 있어, 성능 경로에선 무겁습니다. **템플릿 매개변수로 받을 수 있으면**(`template<class F> void run(F f)`) `auto`/템플릿이 더 빠릅니다. `std::function`은 "타입이 다른 콜백들을 한 컨테이너에 담아야 할 때"처럼 꼭 필요한 곳에.

## 제네릭 람다 (C++14)

매개변수를 `auto`로 두면 **템플릿 `operator()`**가 되어 여러 타입에 동작합니다.

```cpp
auto add = [](auto a, auto b) { return a + b; };
add(1, 2);        // int
add(1.5, 2.5);    // double
```

STL 알고리즘의 술어를 타입에 얽매이지 않게 짤 때 편합니다. → [제네릭 — 파라미터 다형성](/posts/concept/2026-07-12-generics-parametric-polymorphism/)의 그 아이디어가 람다에도 붙은 것입니다.

## 자주 막히는 지점

- **`[&]`를 습관적으로** — 람다가 만든 스코프를 벗어나면 댕글링. 밖으로 나가는 람다는 `[=]`/init-capture.
- **람다 타입을 `std::function`으로만 생각** — 각 람다는 고유 타입. 성능 경로에선 `auto`/템플릿으로 받아 힙 할당·간접 호출을 피한다.
- **값 캡처인데 수정하려다 컴파일 에러** — `operator()`가 기본 `const`. `mutable`을 붙인다.
- **`this` 캡처 후 객체가 먼저 소멸** — 멤버를 참조하는 람다가 객체보다 오래 살면 댕글링. C++20 `[=, this]` 명시나 값 캡처로.

> **통과 기준:** ① 람다가 왜 고유 타입인지(클로저 객체) 설명하고, ② 밖으로 나가는 람다에서 `[&]`와 `[=]` 중 무엇을 왜 골라야 하는지 말할 수 있으면 통과.

## Reference

- [cppreference — Lambda expressions](https://en.cppreference.com/w/cpp/language/lambda) — 캡처·`mutable`·제네릭 람다의 1차 레퍼런스.
- [씹어먹는 C++ — 람다](https://modoocode.com/196) — 한글 상세.
- *Effective Modern C++* (Scott Meyers) 항목 31–34 — 캡처 모드·init-capture·`std::function` 사용 지침.
