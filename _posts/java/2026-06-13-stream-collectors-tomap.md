---
title       : "List를 Map으로 — Stream Collectors.toMap"
description : "객체 리스트를 키-값 Map으로 변환하는 toMap 패턴과 중복 키·순서 처리"
date        : 2026-06-13 10:00:00 +0900
updated     : 2026-06-13 10:00:00 +0900
categories  : [java, "언어·런타임"]
tags        : []
pin         : false
hidden      : false
---

객체 리스트에서 한 필드를 키, 다른 필드를 값으로 한 Map을 만드는 게 흔한 변환이다.

## 기본 — toMap(keyFn, valueFn)

```java
Map<String, String> titleToDesc = testRepository.findAll().stream()
    .filter(t -> StringUtils.isNotEmpty(t.getTitle())
              && StringUtils.isNotEmpty(t.getDescription()))
    .collect(Collectors.toMap(Test::getTitle, Test::getDescription));
```

## 중복 키가 있으면 던진다

`toMap`은 같은 키가 두 번 나오면 `IllegalStateException`을 던진다. 실제 데이터에 중복 가능성이 있다면 머지 함수를 명시한다.

```java
.collect(Collectors.toMap(
    Test::getTitle,
    Test::getDescription,
    (oldVal, newVal) -> newVal   // 나중 값 우선
));
```

## 입력 순서를 유지하고 싶을 때

기본 결과는 `HashMap`이라 순서가 보장되지 않는다. 입력 순서 유지가 필요하면 공급자를 `LinkedHashMap::new`로 지정.

```java
.collect(Collectors.toMap(
    Test::getTitle,
    Test::getDescription,
    (a, b) -> b,
    LinkedHashMap::new
));
```

## groupingBy와 헷갈리지 말 것

- `toMap`: 1 키 → 1 값 (중복 키는 머지 함수 필요)
- `groupingBy`: 1 키 → 값들의 컬렉션
