---
title       : 타입 ③ slice·map·string — 겉은 C++ 컨테이너, 속은 다르다
description : "Go의 핵심 자료구조. slice가 std::vector가 아니라 '배열의 뷰'라는 것(len/cap·append 공유 함정), map의 지정되지 않은 순회 순서와 comma-ok·nil map 함정, 그리고 string이 임의 바이트열이라 byte·rune·사용자 인식 문자를 구분해야 하는 이유까지 정리한다."
date        : 2026-07-12 10:30:00 +0900
updated     : 2026-07-24 12:00:00 +0900
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

## map — 순회 순서가 지정되지 않는다

`std::unordered_map`에 대응하지만, Go specification은 `map`의 **순회 순서를 지정하지 않습니다**. 같은 순서가 반복될 수도, 달라질 수도 있으므로 어떤 순서도 전제로 하면 안 됩니다.

```go
m := map[string]int{"a": 1, "b": 2}
m["c"] = 3
v, ok := m["z"]      // comma-ok — 없으면 v=0, ok=false
delete(m, "a")

for k, v := range m { ... }   // 순회 순서는 지정되지 않음
```

순서에 의존하는 코드를 못 짜게 막으려는 의도입니다(정렬이 필요하면 키를 뽑아 `sort`). 그리고 값 조회는 **comma-ok**로 "있는지"를 함께 받습니다 — `v := m["z"]`만 쓰면 없는 키도 zero value(`0`)를 돌려줘서 "0이 저장된 것"과 구분이 안 됩니다.

## string — 임의 바이트열, byte와 rune

Go 문자열은 **읽기 전용 바이트열**이며 유효한 UTF-8만 담는다고 보장하지 않습니다. 소스의 문자열 리터럴은 보통 UTF-8이지만 파일·네트워크에서 받은 임의 바이트도 `string`에 들어갈 수 있습니다. 텍스트를 다룰 때는 **`byte`(1바이트), `rune`(Unicode 코드포인트, `int32`), 사용자에게 보이는 grapheme cluster**를 구분해야 합니다.

```go
s := "한글"
fmt.Println(len(s))            // 6 — 바이트 수 (글자 수 아님!)
fmt.Println(len([]rune(s)))    // 2 — 코드포인트 수

for i, r := range s {          // range는 rune 단위로 순회
    fmt.Printf("%d: %c\n", i, r)   // i는 바이트 오프셋, r은 rune
}
```

`len(s)`는 **바이트 수**라 한글은 보통 코드포인트당 3바이트로 잡힙니다. 인덱싱 `s[0]`도 첫 rune이 아니라 첫 **바이트**를 줍니다. `range`는 UTF-8을 디코딩해 코드포인트를 순회하고, 잘못된 인코딩에는 `utf8.RuneError`를 냅니다. `[]rune` 길이도 코드포인트 수일 뿐, 결합 문자나 이모지 묶음을 포함한 **사용자 인식 문자 수**와는 다를 수 있습니다.

## C++ 전환으로 정리

| C++ | Go | 핵심 차이 |
|---|---|---|
| `std::vector<T>` | `[]T` slice | 값 컨테이너가 아니라 배열의 뷰. append·슬라이싱 공유 함정 |
| `std::array<T,N>` | `[N]T` 배열 | 고정 크기. 실무에선 slice를 주로 |
| `std::unordered_map` | `map` | 순회 순서 미지정, comma-ok 조회 |
| `std::string` (바이트 컨테이너) | `string` (임의 바이트열) | 텍스트 해석 시 UTF-8·rune·grapheme 구분 |

## 자주 막히는 지점

- **append 공유 함정** — 슬라이스를 함수에 넘겨 `append`하면, 용량 여부에 따라 원본이 바뀌기도/아니기도. 독립 복사가 필요하면 `copy()` 또는 `append([]T(nil), s...)`.
- **nil map에 쓰기 → 패닉** — `var m map[string]int` 상태(읽기는 되지만)에서 `m["a"]=1`은 런타임 패닉. **반드시 `make(map[...]...)` 또는 리터럴로 초기화**하고 써야 합니다. (nil slice는 append가 되지만 nil map은 쓰기가 안 됨.)
- **`len(string)`을 문자 수로 착각** — `len`은 바이트 수입니다. `utf8.RuneCountInString`과 `len([]rune(s))`는 코드포인트 수이며, 화면상의 글자 수가 필요하면 grapheme segmentation 라이브러리가 필요합니다.

## 통과 기준

- slice가 왜 "뷰"인지, `append`가 원본을 바꾸는 경우와 안 바꾸는 경우를 설명할 수 있다.
- map을 comma-ok로 안전하게 조회하고, nil map 함정을 피할 수 있다.
- byte, rune, grapheme cluster가 각각 무엇을 세는지 구분할 수 있다.

다음은 [④ error 처리 + defer·panic·recover](/posts/go/2026-07-12-go-error-handling-defer/)입니다. 예외가 없는 Go에서 에러를 값으로 다루는, C++/Java 출신에게 가장 큰 문화 충격의 단계입니다.

## Reference

- [Go 블로그 — Go Slices: usage and internals](https://go.dev/blog/slices-intro) — 뷰·append·cap의 내부 동작. 이 장의 핵심 읽을거리.
- [Go 블로그 — Strings, bytes, runes and characters](https://go.dev/blog/strings) — byte/rune의 정본 설명.
- [Go by Example: Slices](https://gobyexample.com/slices) · [Maps](https://gobyexample.com/maps)
