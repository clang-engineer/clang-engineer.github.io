---
title       : Null 안전성 — '10억 달러 실수'를 언어는 어떻게 막나
description : "null 참조가 왜 '10억 달러 실수'인지에서 출발해, 없음(absence)을 다루는 세 모델 — 구분 없는 널(C++ 포인터·Java·Go), Option 타입(Rust·Swift), nullable 타입(Kotlin·TS·C#)을 '타입에 드러나는가'와 '언제 막히는가' 두 축으로 비교한다. C++ std::optional이 Rust Option과 같은 물건이면서 무엇이 다른지, Go의 'nil인데 nil이 아닌' 함정까지 대응시킨다."
date        : 2026-07-13 10:00:00 +0900
updated     : 2026-07-13 10:00:00 +0900
categories  : [concept]
tags        : [null-safety, optional]
pin         : false
hidden      : false
---

> **난이도** 입문 · **선행** [에러 핸들링 모델](/posts/concept/2026-07-12-error-handling-models/)을 봤으면 `Option` 연결이 쉽다

## 한 줄 요약

"값이 없음"을 가리키는 참조(null)를 그대로 쓰면 프로그램이 죽는다. 언어가 갈리는 지점은 둘 — **없음을 타입에서 구분하느냐**, 그리고 **없음에 손대는 걸 컴파일 타임에 막느냐 런타임까지 미루느냐**. 세 모델이다 — **구분 없는 널(C++ 포인터·Java·Go)**, **없음을 별도 타입에 담는 `Option`(Rust·Swift)**, **null을 두되 타입에 표시하는 nullable(Kotlin·TypeScript)**.

## 10억 달러 실수 — 문제의 정체

**Tony Hoare**가 1965년 ALGOL W에 null 참조를 집어넣었고, 2009년에 그걸 **"10억 달러 실수(billion-dollar mistake)"**라 불렀다. "구현이 쉬워서 넣었을 뿐인데, 그 뒤 수십 년간 무수한 버그·취약점·크래시를 낳았다"고.

문제는 단순하다. **모든 참조가 null일 수 있다면, 모든 역참조가 지뢰다.**

```java
String name = user.getName();   // getName이 null을 주면?
int len = name.length();        // 💥 런타임에 NullPointerException
```

핵심은 **타입이 거짓말을 한다**는 것이다. 시그니처엔 `String`이라 적혀 있지만 실제 값은 "String **이거나, 없음**"이다. 타입은 "있다"고 보장하는 척하는데 런타임엔 없을 수 있다. 이 거짓말을 어떻게 다루느냐가 모델을 가른다. 두 축으로.

1. **없음이 타입에 드러나는가** — `String`이 null 가능성을 숨기는가, 아니면 "없을 수 있음"이 타입 자체에 보이는가.
2. **없음 접근이 언제 막히는가** — 컴파일 타임에 걸러지나, 런타임까지 가서 터지나.

## C++에서 출발 — 문제와 해법 조각을 다 쥐고 있다

C++ 개발자는 이 이야기의 양쪽을 다 안다. **문제**도, **해법의 조각**도 손에 있다.

```cpp
int* p = nullptr;
*p;                       // 💥 UB — 보통 segfault

int& r = *p;              // 참조는 null이면 안 된다(바인딩 자체가 UB)
                          // → 관례상 "T&는 값이 있다"는 약한 보장

std::optional<int> o;     // C++17 — "int이거나, 없음"을 타입에 담는다
if (o) use(*o);           // 있을 때만 꺼낸다
```

- **raw 포인터 `T*`** — null일 수 있다. 문제의 원흉 그대로다.
- **참조 `T&`** — null 바인딩이 UB라, "값이 있다"는 걸 문법으로 **약하게** 강제한다(부분적 non-null 도구).
- **`std::optional<T>`** (C++17) — "값이거나 없음"을 **타입에 담는** 물건. 뒤에 나올 Rust `Option`과 **같은 발상**이다.

즉 C++엔 문제(raw 포인터)와 해법의 씨앗(`optional`·참조)이 **공존**한다. 다만 어느 것도 **강제되지 않는다** — `optional`을 쓸지는 선택이고, 그 옆에서 raw null 포인터는 여전히 열려 있다. 이 "조각은 있지만 강제는 없다"가 다음 두 모델과 갈리는 출발점이다.

## 모델 ① 구분 없는 널 — 타입이 null을 숨긴다 (C++ 포인터, Java, Go)

가장 흔한 길. **모든 포인터·참조 타입이 null을 암묵적으로 포함**한다. `String`은 사실 "String 또는 null"이고, 그 사실이 타입에 안 보인다. 없음에 손대면 **런타임에** 터진다.

```go
var p *User        // nil
name := p.Name     // 💥 nil pointer dereference — 런타임 panic
```

- **C++ raw 포인터**: `*nullptr` → UB(대개 segfault).
- **Java**: `null` 역참조 → `NullPointerException`.
- **Go**: `nil` 포인터·맵·인터페이스. 컴파일은 멀쩡히 되고 런타임에 panic.

컴파일러가 못 막으니 방어는 순전히 개발자 몫이다 — `if (p != null)`을 **기억해서** 둘러야 한다. 잊으면? 런타임까지 아무도 안 알려준다.

> **Go의 함정 — nil인데 nil이 아니다.** Go 인터페이스 값은 `(타입, 값)` 쌍이다. `nil` 포인터를 인터페이스에 넣으면 **값은 nil이지만 타입 칸이 채워져** 인터페이스 자체는 nil이 아니게 된다.
>
> ```go
> func do() error {
>     var p *MyError = nil
>     return p            // nil 포인터를 error 인터페이스로 반환
> }
> if do() != nil {        // ✅ true! — 타입 칸이 있어 인터페이스는 non-nil
>     // 여기 들어온다. "에러 없음"인데 에러 있음으로 읽힌다
> }
> ```
>
> "구분 없는 널"이 인터페이스와 만나 만드는 대표적 함정이다. 서브타입 다형성 글의 **[인터페이스 값 = `(*itab, *data)` 2워드](/posts/concept/2026-07-12-subtype-polymorphism-dynamic-dispatch/)**를 알면 왜 이런지 바로 보인다 — `data`가 nil이어도 `itab`이 채워지면 인터페이스는 nil이 아니다.

## 모델 ② Option 타입 — 없음을 별도 타입에 담는다 (Rust, Swift)

발상을 뒤집는다. **null을 아예 없애고**, "없을 수 있음"을 **별도 타입**으로 표현한다. Rust의 `Option<T>`는 `Some(T)` 아니면 `None`인 [합타입](/posts/concept/2026-07-12-error-handling-models/)이다.

```rust
fn find(id: u32) -> Option<User> { ... }   // "User이거나 None"이 타입에 보인다

let u = find(1);
// u.name;                 // ★ 컴파일 에러 — Option<User>엔 .name이 없다
match u {
    Some(user) => use(user),
    None => { /* 없을 때를 강제로 다뤄야 한다 */ }
}
```

`Option<User>`에서 `User`를 꺼내려면 **반드시 언랩을 거쳐야** 하고, 언랩은 None인 경우를 다루도록 강제한다. 그리고 일반 참조 `&T`에는 **null이 존재하지 않는다** — "값이 있다"가 타입의 보장이다. 없음을 표현하고 싶으면 `Option<&T>`라고 **명시**해야 한다.

- **Rust**: `Option<T>`, `match`/`if let`, `?`로 전파, `.unwrap()`은 None이면 panic — **위험을 명시적으로 옵트인**하는 장치.
- **Swift**: 옵셔널 `T?`, `if let`/`guard let`으로 안전 언랩, `?.` 옵셔널 체이닝, `!` 강제 언랩.

> **여기가 착지점.** `std::optional<T>`를 아는 C++ 개발자에게 Rust `Option<T>`는 **새 개념이 아니다 — 같은 물건**이다. 차이는 딱 하나, **강제성**이다. C++은 `optional`을 "골라서" 쓰고 그 옆에 raw null 포인터가 열려 있지만, Rust는 **null을 언어에서 없애** 없음을 표현할 유일한 길을 `Option`으로 만들었다. → 이건 [메모리 관리 모델](/posts/concept/2026-07-12-memory-management-models/)의 "`unique_ptr`은 관례, Rust 소유권은 강제"와 **똑같은 구도**다. C++이 도구를 주고 선택에 맡긴 걸, Rust는 타입 시스템으로 강제한다.

> **저수준 한 조각 — 널 포인터 최적화(null pointer optimization).** "없음을 별도 타입에 담으면 태그 비트만큼 메모리가 더 들지 않나?" — 대개 안 든다. `Option<&T>`나 `Option<Box<T>>`는 **참조·박스가 절대 null이 될 수 없다는 걸 컴파일러가 알기에**, 그 안 쓰는 null 비트 패턴(all-zero)을 `None`으로 재활용한다. 그래서 `Option<&T>`는 그냥 포인터와 **같은 크기**다. null을 없앤 대가로 오히려 null 비트가 `None` 표현에 공짜로 쓰인다.

## 모델 ③ nullable 타입 — null을 두되 타입에 표시한다 (Kotlin, TypeScript, C#)

세 번째 길은 절충이다. **null을 유지하되**, 타입을 **non-null**과 **nullable**로 쪼개고 컴파일러가 null 흐름을 추적한다. 기존 언어에 null 안전을 **후차적으로 얹은** 접근이라 Java·JS 계열에서 나왔다.

```kotlin
var a: String  = "hi"    // non-null — null 대입 자체가 컴파일 에러
var b: String? = null    // nullable — ? 붙여야 null 가능

// a.length              // OK
// b.length              // ★ 컴파일 에러 — b는 null일 수 있다
b?.length                // 안전 호출 — null이면 통째로 null
val len = b?.length ?: 0 // 엘비스(?:)로 기본값
b!!.length               // 강제 — null이면 여기서 예외(위험 옵트인)
```

컴파일러가 **흐름 분석(flow analysis)**을 한다. `if (b != null) { b.length }`처럼 null 체크를 하면 그 블록 안에서 `b`는 **자동으로 non-null로 스마트 캐스트**돼 그냥 쓸 수 있다.

- **Kotlin**: `T` vs `T?`, `?.`, `?:`(엘비스), `!!`(강제).
- **TypeScript**: `strictNullChecks` 켜면 `string | null`을 좁히기(narrowing)로 걸러야 접근 가능.
- **C#**: 8.0의 nullable reference types — `?` 어노테이션 + 경고.

Option 모델과 목표는 같다(컴파일 타임 차단). 차이는 **null을 없애느냐(② Option) vs 남기고 타입에 표시하느냐(③ nullable)**다. ③은 기존 코드베이스에 점진 도입하기 쉬운 대신, `!!`·`!`로 도망칠 구멍이 남는다.

## 한눈에 비교

| | 구분 없는 널 (C++ 포인터·Java·Go) | Option 타입 (Rust·Swift) | Nullable 타입 (Kotlin·TS·C#) |
|---|---|---|---|
| null이 타입에 | **숨음**(모든 참조에 암묵 포함) | **없앰**(`Option<T>`로 표현) | **표시됨**(`T` vs `T?`) |
| 없음 접근 차단 | ❌ 런타임(NPE·segfault·panic) | ✅ 컴파일(언랩 강제) | ✅ 컴파일(흐름 분석) |
| 도망칠 구멍 | (항상 열림) | `.unwrap()` / `!` | `!!` / `!` |
| 대표 실패 | NPE·nil panic | unwrap 남용 시 panic | `!!` 남용 시 예외 |

> 흐름: ①은 **편의**를 위해 null을 어디에나 두고 런타임에 맡긴다. ②는 **null을 없애** 없음을 타입으로 끌어올린다. ③은 **null을 남기되 보이게** 만들어 기존 언어에 안전을 소급 적용한다. ②·③은 방식은 달라도 "없음을 컴파일 타임에 다루게 강제한다"는 목표가 같다.

## 언어별 정리

| 언어 | 모델 | 핵심 도구 |
|---|---|---|
| **C++** | 구분 없는 널 + 조각 해법 | raw `T*`(null 가능), `T&`(약한 non-null), `std::optional<T>`(C++17) |
| **Java** | 구분 없는 널 | `null`, `Optional<T>`(강제 아님) |
| **Go** | 구분 없는 널 | `nil`(+ typed-nil 인터페이스 함정) |
| **Rust** | Option | `Option<T>`, `?`, `match`, null 없음 |
| **Swift** | Option | `T?`, `if let`/`guard`, `?.` |
| **Kotlin** | Nullable | `T?`, `?.`, `?:`, `!!` |

- **C++**: `optional`로 "없음"을 명시하고, 함수 인자엔 null 불가를 `T&`로 표현하는 습관이 방어의 핵심이다. 다만 강제는 없다. → 값을 다루는 관점은 [값 vs 참조 의미론](/posts/concept/2026-07-12-value-vs-reference-semantics/)과 이어진다.
- **Go**: `nil`은 언어의 일부다. 없앨 수 없으니 인터페이스 반환·nil 맵/슬라이스의 동작을 정확히 알고 방어해야 한다.
- **Rust**: null이 없다. "없을 수 있음"은 전부 `Option`이고, 에러는 [`Result`](/posts/concept/2026-07-12-error-handling-models/)다 — 둘 다 합타입이라는 뿌리가 같다.

> C·C++·Java에서 온 사람이 Rust·Kotlin에서 받는 인상은 "null 체크를 강제당한다"는 불편함이다. 하지만 그건 **런타임에 터질 버그를 컴파일 타임으로 당겨온** 것이지 불편이 아니다. Hoare의 10억 달러를 언어가 대신 갚아주는 셈이다.

## 스스로 점검

**1. null이 "10억 달러 실수"라 불리는 근본 이유는?**

<details markdown="1">
<summary>답</summary>

**타입이 거짓말을 하기 때문.** `String`처럼 "값이 있다"고 적힌 타입이 실제론 null일 수 있어, **모든 역참조가 잠재적 크래시**가 된다. 그런데 그 위험이 타입에 안 보여서 컴파일러가 못 막고, 방어가 개발자의 기억에 의존한다. 그 결과가 수십 년치 NPE·segfault·보안 취약점이다.

</details>

**2. C++ `std::optional<T>`와 Rust `Option<T>`의 결정적 차이는?**

<details markdown="1">
<summary>답</summary>

**발상은 같고 강제성이 다르다.** 둘 다 "값이거나 없음"을 타입에 담는다. 하지만 C++은 `optional`을 **선택**해서 쓰고 그 옆에 raw null 포인터가 여전히 열려 있다. Rust는 **null을 언어에서 없애** 없음을 표현할 유일한 길을 `Option`으로 만들고, 언랩 없이는 안의 값에 손댈 수 없게 **강제**한다. `unique_ptr`(관례) vs 소유권(강제)과 같은 구도다.

</details>

**3. Go에서 "에러가 없는데 `err != nil`이 참"이 되는 상황은?**

<details markdown="1">
<summary>답</summary>

**nil 포인터를 인터페이스로 반환**했을 때. Go 인터페이스 값은 `(타입, 값)` 쌍이라, nil 포인터를 넣으면 값은 nil이어도 **타입 칸이 채워져** 인터페이스 자체는 non-nil이 된다. 그래서 `return p`(p는 nil `*MyError`) 뒤 `if err != nil`이 참이 된다. 구체 nil 포인터 대신 **명시적으로 `return nil`**을 반환해야 피한다.

</details>
