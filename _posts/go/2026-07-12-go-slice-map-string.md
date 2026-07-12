---
title       : 타입 ③ slice·map·string — 겉은 C++ 컨테이너, 속은 다르다
description : "Go의 핵심 자료구조. slice가 std::vector가 아니라 '배열의 뷰'라는 것(len/cap·append 공유 함정), map의 순회 무작위와 comma-ok·nil map 함정, 그리고 문자열이 UTF-8 바이트열이라 byte와 rune을 구분해야 하는 이유까지. C++ 컨테이너 감각으로 오면 걸리는 지점을 예제로 정리한다."
date        : 2026-07-12 10:30:00 +0900
updated     : 2026-07-12 10:30:00 +0900
categories  : [go]
tags        : [roadmap, go]
pin         : false
hidden      : false
---

> [Go 학습 로드맵](/posts/go/2026-07-12-go-roadmap/)의 **③ 타입** 단계입니다. 앞 글: [② struct·method·interface](/posts/go/2026-07-12-go-struct-method-interface/)

Go의 세 핵심 자료구조입니다. C++ 컨테이너와 **겉은 비슷한데 속이 달라서**, `std::vector`·`unordered_map`·`std::string` 감각으로 그냥 오면 미묘하게 걸립니다. 그 차이가 이 단계의 전부입니다.

## slice — vector가 아니라 "배열의 뷰"

Go에는 고정 크기 **배열**(`[3]int`)과 가변 **슬라이스**(`[]int`)가 따로 있습니다. 실무에서 쓰는 건 거의 슬라이스인데, 핵심은 슬라이스가 값을 담은 컨테이너가 아니라 **어딘가에 있는 배열을 들여다보는 창(뷰)**이라는 점입니다.

슬라이스는 세 가지로 이뤄집니다 — **포인터**(밑바탕 배열의 시작), **len**(길이), **cap**(용량).

```go
s := []int{2, 3, 5, 7}
fmt.Println(len(s), cap(s))   // 4 4

s = append(s, 11)             // 용량 초과 → 새 배열 할당, 복사
sub := s[1:3]                 // {3, 5} — 새 배열이 아니라 같은 배열의 뷰
sub[0] = 99                   // s[1]도 99로 바뀐다! 뷰를 공유하니까
```

`s[1:3]`은 복사가 아닙니다. 같은 밑바탕 배열을 가리키는 또 다른 창일 뿐이라, `sub`를 고치면 원본 `s`도 바뀝니다. 이 **얕은 공유**가 C++ `vector`와 가장 다른 지점입니다.

`append`는 한 겹 더 미묘합니다. 용량(`cap`)에 여유가 있으면 **제자리에 덧붙여** 원본과 배열을 계속 공유하지만, 용량을 넘기면 **새 배열을 할당**해 복사하므로 그 순간부터 공유가 끊깁니다. "append 했더니 어떨 땐 원본이 바뀌고 어떨 땐 안 바뀐다"의 정체가 이겁니다.

## map — 순회 순서가 무작위다

`std::unordered_map`에 대응하지만, Go의 `map`은 **순회 순서를 일부러 무작위화**합니다.

```go
m := map[string]int{"a": 1, "b": 2}
m["c"] = 3
v, ok := m["z"]      // comma-ok — 없으면 v=0, ok=false
delete(m, "a")

for k, v := range m { ... }   // 순회 순서는 매번 다르다 (의도된 설계)
```

순서에 의존하는 코드를 못 짜게 막으려는 의도입니다(정렬이 필요하면 키를 뽑아 `sort`). 그리고 값 조회는 **comma-ok**로 "있는지"를 함께 받습니다 — `v := m["z"]`만 쓰면 없는 키도 zero value(`0`)를 돌려줘서 "0이 저장된 것"과 구분이 안 됩니다.

## string — UTF-8 바이트열, byte와 rune

Go 문자열은 **읽기 전용 UTF-8 바이트열**입니다. 한글·이모지처럼 멀티바이트 문자를 다루면 **`byte`(1바이트)와 `rune`(코드포인트, `int32`)의 구분**이 중요해집니다.

```go
s := "한글"
fmt.Println(len(s))            // 6 — 바이트 수 (글자 수 아님!)
fmt.Println(len([]rune(s)))    // 2 — 글자(코드포인트) 수

for i, r := range s {          // range는 rune 단위로 순회
    fmt.Printf("%d: %c\n", i, r)   // i는 바이트 오프셋, r은 rune
}
```

`len(s)`는 **바이트 수**라 한글은 글자당 3바이트로 잡힙니다. 인덱싱 `s[0]`도 첫 rune이 아니라 첫 **바이트**를 줍니다. 글자 단위로 다루려면 `[]rune(s)`로 변환하거나 `range`로 순회하세요 — `range`는 알아서 rune 경계로 끊어 줍니다.

## C++ 전환으로 정리

| C++ | Go | 핵심 차이 |
|---|---|---|
| `std::vector<T>` | `[]T` slice | 값 컨테이너가 아니라 배열의 뷰. append·슬라이싱 공유 함정 |
| `std::array<T,N>` | `[N]T` 배열 | 고정 크기. 실무에선 slice를 주로 |
| `std::unordered_map` | `map` | 순회 순서 무작위, comma-ok 조회 |
| `std::string` (문자 배열) | `string` (UTF-8 바이트열) | `len`은 바이트 수. byte vs rune 구분 |

## 자주 막히는 지점

- **append 공유 함정** — 슬라이스를 함수에 넘겨 `append`하면, 용량 여부에 따라 원본이 바뀌기도/아니기도. 독립 복사가 필요하면 `copy()` 또는 `append([]T(nil), s...)`.
- **nil map에 쓰기 → 패닉** — `var m map[string]int` 상태(읽기는 되지만)에서 `m["a"]=1`은 런타임 패닉. **반드시 `make(map[...]...)` 또는 리터럴로 초기화**하고 써야 합니다. (nil slice는 append가 되지만 nil map은 쓰기가 안 됨.)
- **`len(string)`을 글자 수로 착각** — 한글에서 어긋납니다. 글자 수는 `utf8.RuneCountInString` 또는 `len([]rune(s))`.

## 통과 기준

- slice가 왜 "뷰"인지, `append`가 원본을 바꾸는 경우와 안 바꾸는 경우를 설명할 수 있다.
- map을 comma-ok로 안전하게 조회하고, nil map 함정을 피할 수 있다.
- 한글 문자열의 글자 수를 정확히 셀 수 있다(byte vs rune).

다음은 [④ error 처리 + defer·panic·recover](/posts/go/2026-07-12-go-error-handling-defer/)입니다. 예외가 없는 Go에서 에러를 값으로 다루는, C++/Java 출신에게 가장 큰 문화 충격의 단계입니다.

## Reference

- [Go 블로그 — Go Slices: usage and internals](https://go.dev/blog/slices-intro) — 뷰·append·cap의 내부 동작. 이 장의 핵심 읽을거리.
- [Go 블로그 — Strings, bytes, runes and characters](https://go.dev/blog/strings) — byte/rune의 정본 설명.
- [Go by Example: Slices](https://gobyexample.com/slices) · [Maps](https://gobyexample.com/maps)
