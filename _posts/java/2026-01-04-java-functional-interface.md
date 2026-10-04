---
title       : Java `java.util.function` 핵심 정리
description : "람다의 타겟 타입인 java.util.function 패키지를 Runnable·Comparator 배경부터 Function·Predicate·Consumer·Supplier 4대장까지 정리한다."
date        : 2026-01-04 12:20:48 +0900
updated     : 2026-01-04 12:28:39 +0900
categories  : [java, "언어·런타임"]
tags        : [lambda, functional-interface, stream]
pin         : false
hidden      : false
redirect_from:
  - /posts/java/functional-interface/
---

## Java `java.util.function` 핵심 정리

> **람다를 다형성 있게 쓰기 위한 표준 함수형 인터페이스 모음집**
> Java 8부터 도입되어 Stream, Optional, Map 등 현대적인 Java API의 기반이 된다.

---

## 왜 `java.util.function`이 필요한가?

### 1. Java에는 독립적인 함수가 없다

Java는 기본적으로 **클래스와 객체, 그리고 그 안에 속한 메서드(method)** 를 중심으로 설계된 언어다.

예를 들어 다음처럼 클래스 밖에 독립적인 함수를 선언할 수 없다.

```java
int add(int a, int b) {
    return a + b;
}
```

반드시 클래스 안의 메서드여야 한다.

```java
class Calculator {
    int add(int a, int b) {
        return a + b;
    }
}
```

즉 전통적인 Java에서 **동작은 독립적인 값이라기보다 객체가 가진 메서드**였다.

---

### 2. Java 8 이전에는 "동작"을 객체로 감싸서 전달했다

그렇다면 다른 코드에 "나중에 실행할 동작"을 넘기고 싶을 때는 어떻게 했을까?

Java 8 이전에는 그 동작을 가진 객체를 만들어 전달했다.

```java
Runnable r = new Runnable() {
    @Override
    public void run() {
        System.out.println("run");
    }
};
```

실제로 전달되는 것은 `run()` 메서드 자체가 아니라 **`Runnable`을 구현한 객체**다.

```text
동작을 전달하고 싶다
        ↓
그 동작을 메서드로 가진 객체를 만든다
        ↓
그 객체를 전달한다
```

`Runnable`, `Comparator`, `Callable` 같은 인터페이스가 Java 8 이전부터 널리 사용된 이유도 여기에 있다.

---

### 3. Java 8에서 람다 표현식이 추가됐다

Java 8에서는 위와 같은 익명 클래스 코드를 더 간단하게 표현할 수 있도록 람다가 도입됐다.

```java
Runnable r = () -> System.out.println("run");
```

하지만 여기서 중요한 점이 있다.

Java는 람다를 도입하면서 별도의 **함수 타입 문법**을 새로 만들지 않았다.

개념적으로 다음과 같은 함수 모양이 있다고 해보자.

```text
(int) -> int
(String) -> boolean
() -> String
```

일부 언어에서는 이런 "입력 타입 → 반환 타입" 자체를 함수 타입으로 표현할 수 있지만, Java에서는 다음과 같은 타입 선언 문법이 없다.

```java
(int -> int) f = x -> x + 1;   // Java 문법 아님
```

Java에서 변수의 타입은 여전히 클래스나 인터페이스 타입이어야 한다.

---

### 4. 그래서 기존 인터페이스를 람다의 타입으로 사용한다

Java는 새로운 함수 타입 체계를 만드는 대신, **추상 메서드가 하나인 인터페이스를 람다의 타겟 타입(target type)으로 사용**하기로 했다.

```java
Function<Integer, Integer> f = x -> x + 1;
```

`Function<T, R>`의 핵심 메서드는 다음과 같다.

```java
R apply(T t);
```

따라서

```java
Function<Integer, Integer> f = x -> x + 1;
```

에서 컴파일러는 왼쪽의 `Function<Integer, Integer>`를 보고 람다를 다음 메서드의 구현으로 해석한다.

```java
Integer apply(Integer x) {
    return x + 1;
}
```

즉 `x -> x + 1`이 처음부터 `Function<Integer, Integer>`라는 독립적인 함수 타입을 가지고 있는 것이 아니다.

**주변 문맥의 타겟 타입이 람다의 의미를 결정한다.**

이 때문에 다음 코드는 사용할 수 없다.

```java
var f = x -> x + 1; // 컴파일 오류
```

람다만 보고는 그것이 `Function`인지, 아니면 같은 형태의 다른 함수형 인터페이스인지 결정할 수 없기 때문이다.

---

### 5. 왜 추상 메서드가 하나여야 하는가?

다음 인터페이스를 생각해보자.

```java
interface Something {
    void foo();
    void bar();
}
```

여기에 다음 람다를 대입한다면,

```java
Something s = () -> System.out.println("hello");
```

이 람다가 `foo()`를 구현하는 것인지 `bar()`를 구현하는 것인지 결정할 수 없다.

반대로 추상 메서드가 하나뿐이면 대응 관계가 명확하다.

```java
interface Task {
    void run();
}

Task task = () -> System.out.println("hello");
```

이러한 인터페이스를 **SAM(Single Abstract Method) 인터페이스**, Java에서는 일반적으로 **함수형 인터페이스(Functional Interface)** 라고 부른다.

---

### 6. 그래서 `java.util.function`이 추가됐다

`Runnable`, `Comparator`, `Callable`처럼 기존에도 함수형 인터페이스는 있었지만, 범용적인 함수 형태를 표현하기에는 부족했다.

예를 들어 다음과 같은 형태가 반복해서 필요하다.

```text
T -> R
T -> boolean
T -> void
() -> T
```

Java 8은 이들을 표준 인터페이스로 제공했다.

| 함수의 형태 | 표준 인터페이스 | 핵심 메서드 |
| --- | --- | --- |
| `T -> R` | `Function<T, R>` | `R apply(T t)` |
| `T -> boolean` | `Predicate<T>` | `boolean test(T t)` |
| `T -> void` | `Consumer<T>` | `void accept(T t)` |
| `() -> T` | `Supplier<T>` | `T get()` |

따라서 `java.util.function`은 단순히 "람다를 담는 상자"라기보다,

> **Java의 기존 객체/인터페이스 타입 시스템 안에서 람다를 일관되게 사용할 수 있도록 자주 쓰는 함수의 모양을 표준화한 인터페이스 모음이다.**

---

### 핵심 정리

```text
Java는 원래 독립 함수보다 객체 + 메서드 중심
        ↓
Java 8에서 람다 표현식 도입
        ↓
하지만 별도의 함수 타입 문법은 만들지 않음
        ↓
추상 메서드 하나짜리 인터페이스를 람다의 타입으로 사용
        ↓
Function / Predicate / Consumer / Supplier 등을 표준화
```

> **Java의 람다는 독립적인 함수 타입을 새로 만든 것이 아니라,
> 함수형 인터페이스의 단일 추상 메서드 구현을 간결하게 표현하는 방식이다.**

---

## Java 8 이전에도 존재했던 Functional Interface

람다가 Java 8에서 추가되었지만, **함수형 인터페이스 자체는 그 이전부터 존재**했다.
대표적인 예가 바로 `Runnable`, `Comparator` 등이다.

### Runnable

```java
Runnable r = () -> System.out.println("run");
```

```java
public interface Runnable {
    void run();
}
```

* 추상 메서드가 **1개** → 함수형 인터페이스
* Java 1.0부터 존재
* Java 8에서 람다의 대표적인 타겟 타입이 됨

---

### Comparator<T>

```java
Comparator<Integer> comp = (a, b) -> a - b;
```

```java
public interface Comparator<T> {
    int compare(T o1, T o2);
}
```

* 두 값을 비교하는 함수형 인터페이스
* 정렬, 우선순위 로직에 핵심적으로 사용

```java
list.sort((a, b) -> b - a);
```

---

### 핵심 포인트

> **Java 람다는 기존의 SAM 인터페이스에 동작을 제공하는 코드를 간결하게 표현한다.**

* Java 8 이전: 익명 클래스
* Java 8 이후: 람다 표현식

```java
// Java 7
new Runnable() {
    @Override
    public void run() {
        System.out.println("run");
    }
};
```

```java
// Java 8+
() -> System.out.println("run");
```

---

## 만약 표준 Functional Interface가 없었다면?

`java.util.function`이 없다면, API마다 제각각의 인터페이스를 정의해야 했을 것이다.

```java
interface MyMapper<T, R> { R map(T t); }
interface MyFilter<T> { boolean check(T t); }
interface MyCreator<T> { T create(); }
```

* 같은 함수 모양을 표현하는 인터페이스 이름이 API마다 달라짐
* 이미 만들어진 인터페이스 객체는 서로 다른 SAM 타입 사이에서 직접 호환되지 않음
* 공통 조합 API를 제공하기 어려움

→ **표준 함수형 인터페이스가 있으면 API들이 같은 함수의 모양과 조합 규칙을 공유할 수 있다.**

---

## 가장 중요한 4대장 (이것만 알아도 80%)

### Function<T, R> — 변환

```java
R apply(T t)
```

입력값을 받아 다른 타입으로 **변환**한다.

```java
Function<String, Integer> length = String::length;
```

**사용처**

* `Stream.map()`
* `Optional.map()`
* `Map.computeIfAbsent()`

---

### Predicate<T> — 조건

```java
boolean test(T t)
```

참/거짓을 판단하는 **조건 함수**

```java
Predicate<Integer> isPositive = n -> n > 0;
```

조합 가능

```java
p.and(p2).or(p3).negate();
```

**사용처**

* `Stream.filter()`

---

### Consumer<T> — 소비

```java
void accept(T t)
```

값을 받아서 **사용만** 하고 반환값 없음

```java
Consumer<String> printer = System.out::println;
```

**사용처**

* `Stream.forEach()`
* `Map.forEach()`

---

### Supplier<T> — 공급

```java
T get()
```

입력 없이 값을 **생성해서 제공**

```java
Supplier<UUID> uuidSupplier = UUID::randomUUID;
```

**지연 실행(lazy)** 이 핵심

```java
optional.orElseGet(() -> createExpensiveObject());
```

---

## 입력이 2개인 Bi 계열

| 인터페이스               | 메서드          | 용도     |
| ------------------- | ------------ | ------ |
| BiFunction<T, U, R> | apply(T, U)  | 두 값 계산 |
| BiPredicate<T, U>   | test(T, U)   | 두 값 비교 |
| BiConsumer<T, U>    | accept(T, U) | Map 처리 |

```java
BiFunction<Integer, Integer, Integer> sum = Integer::sum;
```

```java
map.forEach((k, v) -> System.out.println(k + ":" + v));
```

---

## Unary / Binary Operator

> **자기 자신 타입을 다루는 특수한 Function**

| 인터페이스             | 의미         |
| ----------------- | ---------- |
| UnaryOperator<T>  | T → T      |
| BinaryOperator<T> | (T, T) → T |

```java
UnaryOperator<Integer> square = n -> n * n;
BinaryOperator<Integer> max = Integer::max;
```

---

## 기본 타입 특화 (성능 중요)

> 오토박싱 제거 목적

자주 쓰는 것만 정리

| 인터페이스            | 설명      |
| ---------------- | ------- |
| IntPredicate     | int 조건  |
| IntConsumer      | int 소비  |
| IntSupplier      | int 공급  |
| ToIntFunction<T> | T → int |

```java
IntPredicate isEven = n -> n % 2 == 0;
```

---

## 주요 API와 매핑 관계

| Java API            | 요구 인터페이스   |
| ------------------- | ---------- |
| Stream.map          | Function   |
| Stream.filter       | Predicate  |
| Stream.forEach      | Consumer   |
| Optional.map        | Function   |
| Optional.orElseGet  | Supplier   |
| Map.forEach         | BiConsumer |
| Map.computeIfAbsent | Function   |

---

## 언제 직접 함수형 인터페이스를 만들까?

기본 원칙은 **웬만하면 `java.util.function` 표준을 쓴다**이다. 커스텀 인터페이스는 API 간 람다 호환을 깨고(내 `MyMapper`는 남의 `Function`을 못 받는다) 조합 메서드(`andThen`, `compose`, `and/or/negate`)도 직접 구현해야 한다. 그럼에도 직접 정의가 이득인 경우는 정해져 있다.

**직접 정의가 맞는 경우**

```java
@FunctionalInterface
interface PasswordPolicy {
    boolean validate(String password);
}
```

- **도메인 이름이 계약을 설명할 때** — `Predicate<String>`은 "문자열로 참/거짓"까지만 말하지만, `PasswordPolicy`는 의도를 드러낸다. 파라미터·필드 타입으로 쓰일 때 가독성 차이가 크다.
- **인자가 3개 이상일 때** — 표준은 `BiFunction`(2개)까지만 있다. 셋 이상이면 커스텀이 불가피하다(또는 파라미터 객체로 묶는다).
- **checked exception을 던져야 할 때** — 표준 함수형 인터페이스는 checked exception을 못 던진다. `throws IOException`이 필요하면 직접 선언하거나 래핑해야 한다.
- **기본형 시그니처가 표준에 없을 때** — 예: `(long, int) -> boolean` 같은 조합은 표준에 없다.

**표준을 쓰는 게 맞는 경우**

```java
Function<User, String>   // 그냥 "User를 String으로 변환"이면 충분
Predicate<Order>         // 조합(and/or)이 필요하면 특히 표준
```

- 시그니처가 표준으로 표현되고, 도메인 이름이 굳이 필요 없다면 커스텀은 순수 비용이다.
- `Stream`·`Optional` 등의 메서드는 파라미터 타입으로 `Function`, `Predicate` 같은 표준 인터페이스를 요구한다. 람다 표현식을 직접 넘기면 그 호출 문맥의 파라미터 타입이 람다의 타겟 타입이 된다.

> 판단은 "도메인 의미가 있는가 + 표준으로 시그니처가 표현되는가" 두 축이다. 이름값이 크고 표준으로 안 되면 커스텀, 아니면 표준.

---

## 한 줄 요약 (암기용)

```text
변환 → Function
조건 → Predicate
소비 → Consumer
공급 → Supplier
```

---

## 결론

> **`java.util.function`은 람다를 다형성 있게 쓰기 위한 표준 인터페이스 세트이며,
> 위 4대장만 이해해도 Java 함수형 프로그래밍의 대부분을 커버할 수 있다.**

