---
title       : "HashMap 합치기 — putAll vs merge"
description : "키 충돌 시 덮어쓸지 결합할지 — putAll과 Java 8 merge의 차이"
date        : 2026-06-13 10:00:00 +0900
updated     : 2026-06-13 10:00:00 +0900
categories  : [java, "언어·런타임"]
tags        : [hashmap, merge, stream]
pin         : false
hidden      : false
---

두 Map을 한 Map으로 합칠 때, 키가 겹치면 어떻게 처리할지가 핵심이다.

## putAll — 단순 덮어쓰기

```java
Map<String, Integer> map1 = new HashMap<>(Map.of("Apple", 1000, "Banana", 2000));
Map<String, Integer> map2 = new HashMap<>(Map.of("Apple", 4000, "Tomato", 5000));

map1.putAll(map2);
// {Apple=4000, Banana=2000, Tomato=5000} — 기존 값 덮어씀
```

겹친 키의 기존 값은 사라진다.

## merge — 충돌 시 결합 함수 지정 (Java 8+)

```java
map2.forEach((key, value) -> map1.merge(key, value, (v1, v2) -> v1 + v2));
// {Apple=5000, Banana=2000, Tomato=5000} — 충돌 시 합산
```

`merge(key, value, remappingFunction)`:

- 키가 없으면 그대로 put
- 있으면 `remappingFunction(기존, 신규)` 결과로 대체
- 결과가 `null`이면 키 제거

결합 함수만 바꾸면 합·max·문자열 join 등 자유롭게 처리할 수 있다.

## 어느 쪽을 쓸지

- 단순 덮어쓰기면 `putAll`이 명확하다.
- 키 충돌 시 의미 있는 결합(합산, 리스트 누적 등)이 필요하면 `merge`.
- 새 결과 Map을 만들고 싶다면 `Stream.concat(...).collect(toMap(k, v, merger))`가 자연스럽다.
