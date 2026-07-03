---
title       : STL ④ 컨테이너와 알고리즘
description : "직접 자료구조를 만들지 않고 표준 라이브러리를 쓰는 단계. vector·map 등 주요 컨테이너의 선택 기준, 반복자 개념, sort·find 같은 알고리즘과 람다 조합, 복사 없는 string_view까지 실용 위주로 정리한다."
date        : 2026-07-03 10:40:00 +0900
updated     : 2026-07-03
categories  : [cpp]
tags        : [roadmap, modern-cpp]
pin         : false
hidden      : false
---

> [모던 C++ 학습 로드맵](/posts/cpp/2026-07-03-cpp-learning-roadmap/)의 **고급(STL)** 단계입니다. 앞 글: [③ 이동 시맨틱과 스마트 포인터](/posts/cpp/2026-07-03-cpp-move-and-smart-pointers/)

앞 단계까지 자원 관리를 직접 익혔습니다. STL은 그 위에서, **검증된 자료구조와 알고리즘을 가져다 쓰게** 해줍니다. 실무 C++의 상당 부분이 "적절한 컨테이너 고르고 + 알고리즘 붙이기"입니다.

## 컨테이너 — 무엇을 언제 쓰나

전부 외울 필요 없습니다. **먼저 이 셋만** 손에 익히고, 나머지는 필요할 때 찾으면 됩니다.

| 컨테이너 | 내부 | 언제 |
|---|---|---|
| `vector` | 연속 배열 | **기본값.** 순차 저장·인덱스 접근. 웬만하면 이걸로 시작 |
| `map` | 균형 트리 | 키로 조회, **정렬 순회** 필요할 때 (`O(log n)`) |
| `unordered_map` | 해시 테이블 | 키로 조회, 순서 무관, **더 빠른 평균 조회** (`O(1)`) |

```cpp
std::vector<int> v = {3, 1, 2};
v.push_back(4);

std::unordered_map<std::string, int> ages;
ages["kim"] = 30;
if (ages.count("kim")) { /* 있으면 */ }
```

`list`(중간 삽입이 잦을 때), `deque`(양끝 삽입), `set`(중복 없는 정렬 집합)은 이 셋으로 부족할 때 꺼내면 됩니다. **판단 기준은 "접근 패턴"** — 인덱스로? 키로? 정렬이 필요한가? 여기서 컨테이너가 정해집니다.

## 반복자 — 컨테이너와 알고리즘을 잇는 다리

알고리즘은 특정 컨테이너에 묶이지 않습니다. 대신 **반복자(iterator)** 라는 공통 인터페이스로 범위를 받습니다. `begin()`은 첫 원소, `end()`는 마지막 다음을 가리킵니다.

```cpp
for (auto it = v.begin(); it != v.end(); ++it)
    std::cout << *it;

for (int x : v)          // range-based for — 위와 같지만 훨씬 읽기 쉬움
    std::cout << x;
```

## 알고리즘 — 반복문을 표준 함수로

직접 `for`를 도는 대신 의도가 드러나는 표준 함수를 씁니다. 대부분 `<algorithm>`에 있고, 람다와 함께 쓰면 강력합니다.

```cpp
std::sort(v.begin(), v.end());                          // 정렬
std::sort(v.begin(), v.end(), [](int a, int b){          // 커스텀 기준
    return a > b;                                        // 내림차순
});

auto it = std::find(v.begin(), v.end(), 42);            // 탐색
bool has = std::any_of(v.begin(), v.end(),               // 조건 존재?
                       [](int x){ return x > 100; });
int sum = std::accumulate(v.begin(), v.end(), 0);        // 합 (<numeric>)
```

"반복문을 직접 짜기 전에 표준 알고리즘부터 찾아본다"가 모던 C++의 습관입니다. 의도가 이름에 드러나고, 버그가 적습니다.

## string_view — 복사 없이 문자열 읽기

문자열을 읽기만 할 함수에 `std::string`을 값으로 받으면 매번 복사가 일어납니다. `std::string_view`는 **원본을 복사하지 않고 참조만** 하는 가벼운 읽기 전용 뷰입니다.

```cpp
size_t length(std::string_view s) { return s.size(); }  // 복사 없음
length("hello");                 // 리터럴도 OK
length(some_string);             // std::string도 OK
```

앞서 배운 "읽기 전용 인자는 `const std::string&`"의 더 가벼운 버전입니다. 단, 뷰는 원본이 살아 있는 동안만 유효합니다.

## 자주 막히는 지점

- **반복자 무효화** — `vector`에 `push_back` 하는 중에 예전 반복자를 쓰면 재할당으로 무효가 됩니다. 순회 중 수정 주의.
- **`map::operator[]`의 부작용** — 없는 키를 `[]`로 조회하면 **기본값을 삽입**해 버립니다. 단순 조회는 `find`/`count`로.
- **`vector[i]` vs `at(i)`** — `[]`는 범위 검사를 안 합니다. 경계가 의심스러우면 `at`.
- **댕글링 `string_view`** — 임시 문자열을 가리키는 뷰를 오래 들고 있으면 원본이 사라져 미정의 동작.

## 통과 기준

- 접근 패턴을 보고 `vector`/`map`/`unordered_map` 중 적절한 걸 고를 수 있다.
- 반복문 대신 `sort`·`find`·`accumulate` 등을 람다와 조합해 쓸 수 있다.
- `string_view`가 왜 복사를 피하는지, 그 위험(수명)이 무엇인지 안다.

다음은 **제네릭 — 템플릿**입니다. STL이 어떻게 "모든 타입에 대해" 동작하는지, 그 뒤편의 도구를 봅니다.

## Reference

- [씹어먹는 C++ 강좌 10강 (modoocode)](https://modoocode.com/category/C++) — STL 컨테이너·알고리즘의 한글 상세
- [cppreference — Containers library](https://en.cppreference.com/w/cpp/container)
- [cppreference — Algorithms library](https://en.cppreference.com/w/cpp/algorithm)
