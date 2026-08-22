---
title       : Null 안전성 — 값의 부재를 타입은 어떻게 표현하나
description : "값의 부재(absence)를 null/nil, nullable type, Option 계열로 표현하는 방식을 비교한다. 부재 표현과 메모리 안전, 에러 처리, 런타임 표현을 서로 다른 축으로 구분한다."
date        : 2026-07-13 10:00:00 +0900
updated     : 2026-08-22 17:00:00 +0900
categories  : [concept]
tags        : [null-safety, optional]
pin         : false
hidden      : false
---

> **난이도** 입문 · **선행** [에러 핸들링 모델](/posts/concept/2026-07-12-error-handling-models/)을 보면 `Option`과 `Result`의 차이를 연결하기 쉽다.
>
> 🗺️ [프로그래밍 언어 개념 로드맵](/posts/concept/2026-07-13-concept-roadmap/)의 한 편

## 한 줄 요약

Null 안전성은 **값이 없을 수 있다는 사실을 타입과 제어 흐름에 어떻게 표현하고, 없는 값을 잘못 사용하는 것을 어떻게 막는가**의 문제다.

```text
부재 표현
→ null/nil, nullable type, Option 등

정적 보장
→ 부재 가능성이 타입에 드러나는가

사용 규칙
→ 값을 꺼내기 전에 확인·패턴 매칭·narrowing이 필요한가
```

`null`, `Option`, nullable type은 비슷한 문제를 풀지만 메모리 표현과 타입 시스템 의미론까지 같은 것은 아니다.

## 1. 문제는 null이라는 값 하나보다 "숨겨진 부재 가능성"이다

Tony Hoare가 null reference를 자신의 "billion-dollar mistake"라고 표현한 일화가 널리 알려져 있다. 핵심 문제는 값의 부재 가능성이 타입에서 충분히 드러나지 않을 때 호출자가 그 가능성을 놓치기 쉽다는 점이다.

```java
String name = user.getName();
int len = name.length();
```

`getName()`이 `null`을 반환할 수 있는데 타입과 API 계약만 보고 그 사실을 놓치면 런타임 `NullPointerException`이 발생할 수 있다.

다만 이를 **모든 null = 메모리 안전성 실패**로 일반화하지 않는다. Java/Kotlin의 null dereference는 예외로 끝나지만 C++의 잘못된 포인터 역참조는 undefined behavior가 될 수 있다. 같은 "없는 값을 잘못 사용했다"여도 실패 모델은 언어마다 다르다.

## 2. C++ — 포인터, 참조, optional이 서로 다른 계약을 가진다

```cpp
int* p = nullptr;
std::optional<int> value;
```

C++ `T*`는 null pointer value를 가질 수 있다. 반면 `T&`는 정상적인 언어 값으로 null 상태를 표현하는 타입이 아니다. 하지만 참조라고 해서 객체 수명까지 자동으로 안전해지는 것은 아니다.

`std::optional<T>`는 **T가 있거나 없는 상태를 값 타입으로 표현**한다.

```cpp
std::optional<int> find();

if (auto v = find()) {
    use(*v);
}
```

따라서 C++ 안에서도

```text
T*
→ 주소/참조 의미 + null 가능

T&
→ null 상태를 표현하지 않는 참조

optional<T>
→ 값의 존재/부재를 명시적으로 표현
```

처럼 역할이 다르다.

## 3. 구분되지 않은 null/nil — 부재 가능성이 타입 이름에서 잘 드러나지 않는다

Java reference나 Go의 일부 타입, C++ pointer처럼 타입 자체의 일반적인 사용에서 null/nil 상태가 함께 허용되는 경우가 있다.

### Java

`String`이라는 타입 표기만으로 전통적인 Java에서는 null 가능 여부를 구분하지 않는다. annotation과 외부 정적 분석 도구가 이를 보완할 수 있지만 언어의 기본 reference type 자체는 null을 허용한다.

### Go

Go에서는 pointer, map, slice, channel, function, interface 등이 nil 상태를 가질 수 있지만 **nil일 때 허용되는 연산이 타입마다 다르다**.

- nil pointer dereference → panic
- nil map → 읽기·`len`·`range` 가능, 쓰기는 panic
- nil slice → `len`·`range`·`append` 가능
- nil channel → 송수신이 영원히 block될 수 있음
- interface → typed nil 함정이 있음

따라서 `nil = 사용하면 바로 panic`이라고 한 줄로 일반화하면 안 된다.

### Go interface의 typed nil

```go
func makeError() error {
    var p *MyError = nil
    return p
}

err := makeError()
fmt.Println(err == nil) // false
```

인터페이스 값에는 동적 타입 정보와 동적 값이 함께 들어간다. 내부 포인터 값이 nil이어도 동적 타입이 설정돼 있으면 interface value 자체는 nil interface가 아니다.

이를 특정 2-word ABI 배치로 외우기보다 **interface가 동적 타입과 값을 함께 표현한다**는 의미론으로 이해하는 편이 안전하다.

## 4. Option 계열 — 부재를 값 타입의 variant로 표현한다

Rust의 `Option<T>`는 `Some(T)` 또는 `None`이다.

```rust
fn find(id: u32) -> Option<User> {
    // ...
}

match find(1) {
    Some(user) => use_user(user),
    None => handle_absence(),
}
```

`Option<User>`는 `User`와 다른 타입이므로 값을 사용하려면 `match`, `if let`, combinator, `?` 등으로 부재 가능성을 처리해야 한다.

Rust reference `&T` 자체에는 null이 없고, nullable reference가 필요하면 `Option<&T>`처럼 명시한다.

### C++ optional과 Rust Option은 어디까지 비슷한가

둘 다 **값의 존재/부재를 명시적인 합 형태로 표현한다**는 좋은 대응 관계가 있다.

하지만

```text
std::optional<T> = Rust Option<T>
```

이라고 언어 전체의 null 모델까지 같다고 보면 안 된다.

- C++에는 여전히 null pointer가 존재한다.
- Rust safe reference에는 null이 없다.
- 두 타입의 API·레이아웃·niche optimization 보장은 서로 다르다.
- C++ optional의 잘못된 접근과 Rust Option의 unwrap 실패도 세부 동작이 다르다.

즉 **추상 모델은 비슷하지만 언어의 전체 안전성 모델은 다르다.**

## 5. Nullable type — null을 타입에 표시한다

Kotlin의 `String?`, TypeScript의 `string | null`처럼 null 자체를 유지하면서 **null 가능성을 타입에 표시**하는 방법도 있다.

```kotlin
val a: String = "hi"
val b: String? = null

if (b != null) {
    println(b.length)
}
```

Kotlin compiler는 흐름 분석을 통해 null check 뒤의 값을 non-null로 좁힐 수 있다. `?.`, `?:`, `!!` 같은 연산도 nullable value를 다루기 위한 문법이다.

TypeScript의 `strictNullChecks`, C# nullable reference types도 비슷한 목표를 가지지만 보장 강도와 런타임 표현은 각각 다르다. 이들을 하나의 동일한 구현 모델로 묶기보다 **null 가능성을 타입 시스템에 드러낸다**는 공통 목표만 대응시키는 편이 좋다.

## 6. Option과 nullable은 목표가 비슷하지만 표현 방식이 다르다

```text
Option<T>
→ Some(T) / None 같은 variant로 부재 표현

T?
→ T의 nullable 형태로 부재 가능성을 타입에 표시
```

둘 모두 호출자에게 부재 가능성을 드러내고 확인 없이 값을 사용하는 것을 제한하려는 목적이 있다.

하지만 `Option = nullable의 다른 문법`이라고만 보면 pattern matching, generic composition, 런타임 표현, 플랫폼 interop 같은 차이를 놓칠 수 있다.

## 7. Null 안전성과 에러 처리는 연결되지만 같은 문제는 아니다

```text
Option<User>
→ 사용자가 없을 수 있음

Result<User, Error>
→ 사용자를 얻는 과정이 실패할 수 있음
```

"검색 결과 없음"은 정상적인 부재일 수 있다. 반면 DB 연결 실패는 원인을 전달해야 하는 오류다.

따라서 `None = Error`라고 일반화하지 않는다. API에 따라 부재 자체가 오류인 경우도 있지만 그것은 **도메인 의미**가 결정한다.

이 경계는 [에러 핸들링 모델](/posts/concept/2026-07-12-error-handling-models/)과 연결된다.

## 8. 런타임 표현과 언어 의미론을 구분한다

Rust compiler는 일부 `Option<T>`에서 niche optimization을 사용해 별도 tag 공간을 줄일 수 있다. 대표적으로 특정 reference/pointer 계열에서는 사용되지 않는 bit pattern을 `None` 표현에 활용할 수 있다.

하지만

```text
Option<T>는 항상 T와 같은 크기다
```

라고 일반화하면 안 된다. 구체적인 layout 보장은 타입과 언어/ABI 규칙에 따라 다르다.

Null 안전성을 이해할 때 우선순위는 다음이다.

1. 부재가 타입에 드러나는가
2. 부재 상태에서 어떤 연산이 허용되는가
3. 값을 사용하기 전에 어떤 검사가 필요한가
4. 런타임 layout 최적화는 그다음 구현 세부다

## 한눈에 정리

| 모델 | 핵심 아이디어 | 예 |
|---|---|---|
| 암묵적 null/nil 가능 | 같은 타입 사용 안에 부재 상태가 함께 존재 | Java reference, C++ pointer, Go nil 가능 타입 |
| Option 계열 | 존재/부재를 별도 variant로 표현 | Rust `Option<T>`, C++ `optional<T>` |
| Nullable type | null 가능성을 타입 표기에 드러냄 | Kotlin `T?`, TypeScript `T | null` |

이 표는 **부재 표현 방식**의 비교다. 메모리 안전성, 런타임 실패 방식, ABI까지 같은 분류라는 뜻은 아니다.

## 스스로 점검

**1. Null 안전성의 핵심 문제는 무엇인가?**

<details markdown="1">
<summary>답</summary>

값이 없을 수 있다는 사실을 타입과 제어 흐름에서 얼마나 명확히 표현하고, 없는 값을 잘못 사용하는 것을 얼마나 일찍 막는가다.

</details>

**2. C++ optional과 Rust Option은 같은가?**

<details markdown="1">
<summary>답</summary>

값의 존재/부재를 명시적으로 표현한다는 추상 모델은 비슷하다. 하지만 C++과 Rust의 reference/null 모델, API, layout과 안전성 보장은 다르므로 언어 전체에서 같은 물건이라고 등치하면 안 된다.

</details>

**3. Option과 Result의 차이는?**

<details markdown="1">
<summary>답</summary>

Option은 값의 존재/부재를 표현하고 Result는 성공/실패와 실패 정보를 표현한다. 부재가 오류인지 여부는 API와 도메인 의미가 결정한다.

</details>
