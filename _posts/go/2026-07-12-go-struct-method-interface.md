---
title       : 타입 ② struct·method·interface — 클래스 없이 사고하기
description : "Go에는 클래스가 없다. 데이터(struct)와 동작(method)을 분리하고, 상속 대신 컴포지션(embedding)으로 조합하며, implements 선언 없이 인터페이스를 암묵적으로 만족시키는 Go의 타입 사고. 그리고 인터페이스 구현이 '왜 안 되지'의 90%인 method set — 포인터 vs 값 리시버 규칙까지 C++ 대응으로 정리한다."
date        : 2026-07-12 10:20:00 +0900
updated     : 2026-07-12 10:20:00 +0900
categories  : [go]
tags        : [roadmap, go]
pin         : false
hidden      : false
---

> [Go 학습 로드맵](/posts/go/2026-07-12-go-roadmap/)의 **② 타입(뼈대)** 단계입니다. 앞 글: [① 문법·패키지·모듈](/posts/go/2026-07-12-go-basics-package-module/)

C++을 알고 Go로 오면 문법 절반은 며칠이면 읽습니다. 진짜 벽은 여기입니다. **Go에는 클래스가 없습니다.** 상속도, `implements` 선언도, `virtual`도 없습니다. 이 단계가 C++ 습관과 가장 크게 충돌하는 지점이자 Go 설계의 핵심이라, 로드맵에서 뼈대로 둡니다.

## 데이터와 동작이 분리된다

C++은 데이터(멤버 변수)와 동작(멤버 함수)을 `class` 하나에 묶습니다. Go는 둘을 나눕니다. 데이터는 `struct`, 동작은 그 밖에서 **리시버(receiver)**로 붙는 method입니다.

```go
type Rect struct {   // 데이터
    Width, Height float64
}

func (r Rect) Area() float64 {   // 동작 — r이 "리시버"
    return r.Width * r.Height
}
```

`func (r Rect) Area()`의 `(r Rect)`가 리시버입니다. C++의 암묵적 `this` 대신, **어떤 타입에 붙는 method인지를 함수 시그니처에 명시**합니다. 그래서 method는 클래스 중괄호 안에 갇히지 않고, 같은 패키지 어디에든 둘 수 있습니다.

## interface — implements가 없다

C++에서 인터페이스는 순수 가상 함수를 가진 기반 클래스를 상속(`: public Drawable`)해 만듭니다. Go는 정반대입니다. **선언이 없습니다.** 메서드 시그니처만 맞으면 자동으로 그 인터페이스입니다.

```go
type Shape interface {
    Area() float64
}

// Rect는 Area()를 가졌다 → 아무 선언 없이 자동으로 Shape이다
func printArea(s Shape) {
    fmt.Println(s.Area())
}

printArea(Rect{3, 4})   // 그냥 넘어간다
```

`Rect` 어디에도 "나는 Shape이다"라고 쓰지 않았습니다. 이걸 **구조적 타이핑(structural typing)** 또는 덕 타이핑이라 부릅니다 — "오리처럼 걷고 오리처럼 운다면 오리다". C++의 명목적(nominal) 상속과 완전히 다른 사고방식입니다.

이 방향의 실익은, **인터페이스를 구현체가 아니라 사용하는 쪽이 정의**할 수 있다는 데 있습니다. 남이 만든 타입을 가져와도, 내가 필요한 메서드만 추린 인터페이스를 내 패키지에 선언하면 그 타입이 자동으로 만족합니다. 그래서 Go 인터페이스는 작게 쪼개집니다(표준 라이브러리의 `io.Reader`·`io.Writer`가 메서드 하나짜리인 이유).

## 상속 대신 embedding

Go에는 상속이 없습니다. 코드를 재사용·조합할 때는 struct 안에 struct를 **심습니다(embed)**.

```go
type Animal struct {
    Name string
}
func (a Animal) Speak() string { return a.Name + " makes a sound" }

type Dog struct {
    Animal   // ★ 필드 이름 없이 타입만 — embedding
    Breed string
}

d := Dog{Animal{"Rex"}, "Corgi"}
fmt.Println(d.Speak())   // "Rex makes a sound" — Animal의 method가 승격된다
fmt.Println(d.Name)      // "Rex" — 필드도 승격
```

`Dog`는 `Animal`을 **상속한 게 아닙니다.** `Animal`을 필드로 품었을 뿐인데, embed된 타입의 필드·method가 바깥으로 **승격(promotion)**되어 `d.Speak()`처럼 바로 부를 수 있습니다. "is-a"(Dog는 Animal이다)가 아니라 "has-a + 위임"입니다.

차이가 드러나는 지점은 **다형성**입니다. C++이라면 `Animal*`에 `Dog`를 담아 가상 함수로 분기하지만, Go에서는 그럴 일 자체가 인터페이스로 넘어갑니다. **조합은 embedding, 다형성은 interface** — 상속이 하던 두 일을 Go는 둘로 쪼갭니다.

## method set — 인터페이스 구현이 "왜 안 되지"의 90%

여기가 C++에 대응이 없는 Go 특유의 미묘함이고, 인터페이스 구현이 안 될 때 십중팔구 걸리는 지점입니다.

method는 리시버를 **값**으로 받을 수도, **포인터**로 받을 수도 있습니다.

```go
func (r Rect) Area() float64        { ... }   // 값 리시버 — 원본 복사본을 받음
func (r *Rect) Scale(f float64)     { r.Width *= f; r.Height *= f }   // 포인터 리시버 — 원본 수정
```

원본을 **수정해야 하면 포인터 리시버**입니다(값 리시버는 복사본을 고치므로 원본이 안 바뀜). 여기까진 C++의 `T` vs `T&` 감각과 비슷합니다. 진짜 함정은 이겁니다 — **어느 쪽 리시버냐가 인터페이스 만족 여부를 가릅니다.**

| 리시버 정의 | 값 `Rect`이 인터페이스를 만족? | 포인터 `*Rect`이 만족? |
|---|---|---|
| 값 리시버 `(r Rect)` | O | O |
| 포인터 리시버 `(r *Rect)` | **X** | O |

즉 **포인터 리시버로 정의한 메서드는 포인터 타입만 인터페이스를 만족**시킵니다. 값은 못 합니다.

```go
type Scaler interface { Scale(float64) }

var s Scaler
s = &Rect{3, 4}   // OK — *Rect은 Scale을 가짐
s = Rect{3, 4}    // 컴파일 에러! Rect(값)은 Scaler를 만족 못 함
//  → cannot use Rect{…} (value) as Scaler: method Scale has pointer receiver
```

이유는 값에서 포인터 메서드를 부르려면 그 값의 주소가 필요한데, 인터페이스에 담긴 값은 주소를 보장할 수 없기 때문입니다. **"분명히 메서드를 다 구현했는데 인터페이스가 안 잡힌다"** 싶으면 거의 항상 여기 — 값을 넘겼는지 포인터(`&`)를 넘겼는지 확인하세요.

## 빈 인터페이스와 타입 단언

메서드가 하나도 없는 인터페이스 `interface{}`(Go 1.18부터 별칭 `any`)는 **모든 타입**을 담습니다. C++의 `void*`나 `std::any`에 대응하지만, 담긴 타입 정보를 런타임이 들고 있어 더 안전합니다. 값을 다시 꺼낼 땐 **타입 단언(type assertion)**으로 되돌립니다.

```go
var x any = "hello"
s := x.(string)        // 타입 단언 — x가 string이라 단언. 틀리면 패닉
s, ok := x.(string)    // 안전한 형태 — 실패해도 패닉 대신 ok=false
```

여러 타입을 분기할 땐 **타입 스위치**:

```go
func describe(x any) string {
    switch v := x.(type) {
    case int:    return fmt.Sprintf("정수 %d", v)
    case string: return fmt.Sprintf("문자열 %q", v)
    default:     return "모르는 타입"
    }
}
```

**습관 교정:** C++의 `void*`·템플릿 감각으로 `any`에 다 받아 타입 스위치로 분기하고 싶어지지만, Go에서는 **필요한 메서드만 담은 구체 인터페이스로 제약**하는 게 낫습니다. `any` 남발은 컴파일러의 타입 검사를 스스로 끄는 셈입니다. `any`는 정말 타입을 알 수 없는 경계(JSON 디코딩 등)에서만.

## 자주 막히는 지점

- **상속으로 풀려는 습관** — "이건 저것의 특수한 경우니까 상속"이 튀어나옵니다. Go에서는 **인터페이스 + 컴포지션**이 정답입니다. "is-a"가 아니라 "can-do"로 생각하기.
- **method set 혼동** — 위 표. 포인터 리시버 메서드를 값에 대고 인터페이스로 넘기면 컴파일 에러. `&`를 빼먹었는지 보세요.
- **리시버 통일** — 한 타입에 값 리시버와 포인터 리시버를 섞으면 method set이 헷갈립니다. **하나라도 포인터 리시버가 필요하면 전부 포인터 리시버로** 통일하는 게 관례입니다.
- **인터페이스를 미리 크게 설계** — C++ 추상 기반 클래스 습관. Go는 필요한 메서드만 담은 **작은 인터페이스**를 쓰는 쪽이 정착시킬 지점(⑥의 "accept interfaces, return structs"로 이어짐).

## 통과 기준

- 인터페이스를 하나 정의하고, 그걸 만족하는 struct를 **두 개** 만들어 같은 함수에 넘길 수 있다.
- 값 리시버와 포인터 리시버를 언제 쓰는지, 그리고 그 선택이 인터페이스 만족에 어떻게 영향을 주는지 설명할 수 있다.
- 상속으로 풀고 싶은 문제를 embedding + interface로 바꿔 설계할 수 있다.

다음은 [③ slice·map·string](/posts/go/2026-07-12-go-slice-map-string/)입니다. Go의 핵심 자료구조로, 겉은 C++ 컨테이너와 비슷하지만 내부(특히 slice의 뷰 동작)가 다릅니다.

## Reference

- [A Tour of Go — Methods and interfaces](https://go.dev/tour/methods/1) — 이 단계의 정본. 브라우저에서 바로 실행.
- [Go by Example: Interfaces](https://gobyexample.com/interfaces) · [Struct Embedding](https://gobyexample.com/struct-embedding)
- [Effective Go — Interfaces and methods](https://go.dev/doc/effective_go#interfaces_and_types) — 인터페이스를 작게 쓰는 관례
- [Go FAQ — pointer vs value receiver](https://go.dev/doc/faq#methods_on_values_or_pointers) — method set 규칙의 공식 설명
