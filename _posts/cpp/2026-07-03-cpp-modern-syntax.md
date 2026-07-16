---
title       : 모던 문법 ⑦ auto·constexpr와 표준 라이브러리
description : "코드를 짧고 안전하게 만드는 모던 C++ 문법 정리. auto와 유니폼 초기화, 컴파일 타임 상수 constexpr, 그리고 optional·variant·chrono·filesystem처럼 사전처럼 찾아 쓰는 표준 라이브러리를 짚는다."
date        : 2026-07-03 11:10:00 +0900
updated     : 2026-07-03
categories  : [cpp]
tags        : [roadmap, modern-cpp]
pin         : false
hidden      : false
---

> [모던 C++ 학습 로드맵](/posts/cpp/2026-07-03-cpp-learning-roadmap/)의 **고급(모던 문법)** 단계입니다. 앞 글: [⑥ 스레드와 비동기](/posts/cpp/2026-07-03-cpp-concurrency/)

C++11 이후 추가된 문법들은 대부분 **코드를 짧고 안전하게** 만드는 방향입니다. 개별 기능이라 순서대로 볼 필요는 없고, 자주 쓰는 것부터 손에 익히면 됩니다.

## auto — 타입을 추론시키기

컴파일러가 알 수 있는 타입은 굳이 손으로 안 적어도 됩니다.

```cpp
auto i = 42;                              // int
auto it = v.begin();                      // std::vector<int>::iterator — 손으로 쓰면 길다
for (const auto& x : container) { ... }   // 반복에서 특히 유용
```

길고 복잡한 타입(반복자, 람다)을 짧게 만들고, 타입이 바뀌어도 선언을 안 고쳐도 됩니다. 다만 `auto`는 **참조와 const를 벗겨내므로**, 참조가 필요하면 `auto&`, 안 바꿀 거면 `const auto&`로 의도를 드러내세요.

## 유니폼 초기화 — 중괄호 {}

타입마다 제각각이던 초기화 문법을 `{}`로 통일합니다.

```cpp
int x{5};
std::vector<int> v{1, 2, 3};
std::string s{"hi"};
Point p{1, 2};
```

덤으로 **좁아지는 변환(narrowing)을 막아줍니다.** `int x{3.14};`는 컴파일 에러 — 데이터 손실을 컴파일 타임에 잡습니다.

## constexpr — 컴파일 타임 상수

`const`는 "바뀌지 않는 값"이고, `constexpr`는 한 발 더 나가 **컴파일 타임에 계산되는 값**입니다. 런타임 비용이 0이 됩니다.

```cpp
constexpr int square(int x) { return x * x; }
constexpr int n = square(8);   // 컴파일 시점에 64로 확정
int arr[n];                    // 상수라 배열 크기로도 쓸 수 있음
```

`decltype`(표현식의 타입을 그대로 가져오기)도 이 묶음이지만, 주로 템플릿·라이브러리 코드에서 쓰이니 지금은 이름만 알아두면 됩니다.

## 표준 라이브러리 — 사전처럼 찾아 쓰기

아래는 외우는 게 아니라 **"이런 게 표준에 있다"만 기억**하고 필요할 때 찾아 쓰는 것들입니다. 직접 만들면 버그가 나는 것들을 표준이 검증된 형태로 제공합니다.

| 도구 | 용도 |
|---|---|
| `std::optional<T>` | "값이 있을 수도, 없을 수도" — 널 포인터 대신 안전하게 |
| `std::variant<A, B>` | 여러 타입 중 하나를 담는 타입 안전 union |
| `std::chrono` | 시간·기간·시계 (`std::this_thread::sleep_for` 등) |
| `std::filesystem` | 경로·파일 존재 확인·디렉터리 순회 |
| `std::regex` | 정규표현식 |

```cpp
std::optional<int> find_id(std::string_view name) {
    if (name == "kim") return 3;
    return std::nullopt;          // "없음"을 명시적으로
}

if (auto id = find_id("lee")) {   // 값이 있으면
    std::cout << *id;
}
```

`optional`은 "찾았을 수도 못 찾았을 수도 있는" 결과를 널 포인터나 매직 넘버(-1) 없이 표현합니다. 모던 C++이 널 관련 버그를 줄이는 대표 도구입니다.

## 타입 변환 — 문자열·숫자·문자

자주 다시 찾게 되는 변환들. 문자열↔숫자는 C++11의 `stoi`/`to_string`이 기본이고, 문자↔숫자는 `'0'`을 더하고 빼는 관용구를 씁니다.

```cpp
// string ↔ int
int i = std::stoi("123");             // 문자열 → 정수 (C++11)
std::string s = std::to_string(42);   // 정수 → 문자열

// char ↔ int (숫자 문자)
int n = '7' - '0';                    // 문자 '7' → 정수 7
char c = 3 + '0';                     // 정수 3 → 문자 '3'
```

`stoi`는 변환 실패 시 예외(`std::invalid_argument`)를 던지므로 신뢰할 수 없는 입력엔 예외 처리를 함께 씁니다. C 스타일 `atoi`는 실패를 조용히 `0`으로 뭉개므로 지양합니다.

| ASCII | 문자 |
|---|---|
| 48 | `0` |
| 65 | `A` |
| 97 | `a` |

## 자주 막히는 지점

- **`auto`가 const/참조를 벗김** — `auto x = obj.ref();`는 복사를 만듭니다. 참조가 필요하면 `auto&`.
- **`{}` vs `()` 초기화 차이** — `std::vector<int> v(3);`는 원소 3개, `v{3}`은 값이 3인 원소 1개. `{}`는 initializer_list를 우선합니다.
- **most vexing parse** — `Widget w();`는 객체가 아니라 **함수 선언**으로 해석됩니다. `Widget w{};`로 쓰면 이 함정을 피합니다.

## 통과 기준

- `auto`를 쓰되 언제 `auto&`/`const auto&`가 필요한지 안다.
- `const`와 `constexpr`의 차이를 말할 수 있다.
- `optional`이 널 포인터·매직 넘버보다 나은 이유를 설명할 수 있다.

다음은 마지막, **빌드 — 컴파일·링킹과 CMake**입니다. 문법을 넘어 프로젝트를 실제로 빌드하는 관점으로 로드맵을 마무리합니다.

## Reference

- [씹어먹는 C++ 강좌 16~17강 (modoocode)](https://modoocode.com/category/C++) — 유니폼 초기화·constexpr·표준 라이브러리의 한글 상세
- [cppreference — std::optional](https://en.cppreference.com/w/cpp/utility/optional)
- *Effective Modern C++* Item 5~6 (auto), 7~8 (초기화)
