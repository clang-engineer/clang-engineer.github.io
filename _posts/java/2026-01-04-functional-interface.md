---
title       : Java `java.util.function` 핵심 정리
description : "람다의 타겟 타입인 java.util.function 패키지를 Runnable·Comparator 배경부터 Function·Predicate·Consumer·Supplier 4대장까지 정리한다."
date        : 2026-01-04 12:20:48 +0900
updated     : 2026-01-04 12:28:39 +0900
categories  : [java, "언어·런타임"]
tags        : [lambda, functional-interface, stream]
pin         : false
hidden      : false
---

## Java `java.util.function` 핵심 정리

> **람다를 다형성 있게 쓰기 위한 표준 함수형 인터페이스 모음집**
> Java 8부터 도입되어 Stream, Optional, Map 등 현대적인 Java API의 기반이 된다.

---

## 왜 `java.util.function`이 필요한가?

Java에서 **람다는 단독으로 존재할 수 없다**.
반드시 **함수형 인터페이스(추상 메서드 1개)** 를 타겟 타입으로 가져야 한다.

```java
x -> x * 2   // 타입 없음 (단독 사용 불가)
```

```java
Function<Integer, Integer> f = x -> x * 2; // 정상
```

→ `java.util.function`은 **람다의 표준 타겟 타입**을 제공하기 위해 만들어졌다.

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

> **람다는 새로운 개념이 아니라, 기존 인터페이스 구현 문법을 간결하게 만든 것**

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

* API 간 람다 호환 불가
* 타입 불일치 빈번
* 다형성 활용 불가

→ **결과적으로 람다는 문법 설탕에 그치고 생태계는 붕괴**

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
- `Stream`·`Optional` 등 표준 API에 넘길 값이면 반드시 표준 타입이어야 한다.

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

