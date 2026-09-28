---
title       : "Java Map 변환과 병합 — toMap, putAll, merge"
description : "Collection을 Map으로 변환하거나 여러 Map을 합칠 때 중복 키를 어떻게 처리할지 toMap, putAll, merge를 한 흐름에서 정리한다."
date        : 2026-06-13 10:00:00 +0900
updated     : 2026-09-28
categories  : [java, "언어·런타임"]
tags        : [map, hashmap, stream, collectors, merge]
pin         : false
hidden      : false
redirect_from:
  - /posts/java/hashmap-merge-vs-putall/
  - /posts/java/stream-collectors-tomap/
---

Java에서 Map을 다룰 때 자주 만나는 두 문제는 서로 연결되어 있다.

```text
Collection에서 Map을 만든다
→ key가 겹치면 어떻게 할까?

여러 Map을 하나로 합친다
→ key가 겹치면 어떻게 할까?
```

둘 다 핵심은 **키 충돌 정책을 어떻게 정할 것인가**다.

## 1. Collection을 Map으로 변환한다 — Collectors.toMap

객체 목록에서 한 값을 key, 다른 값을 value로 만들 때 `Collectors.toMap()`을 사용할 수 있다.

```java
Map<String, String> titleToDesc = tests.stream()
    .collect(Collectors.toMap(
        Test::getTitle,
        Test::getDescription
    ));
```

### 중복 키가 있으면 충돌 정책이 필요하다

기본 `toMap(keyFn, valueFn)`은 같은 key가 두 번 나오면 `IllegalStateException`을 던진다.

중복 가능성이 있다면 merge function을 명시한다.

```java
.collect(Collectors.toMap(
    Test::getTitle,
    Test::getDescription,
    (oldValue, newValue) -> newValue
));
```

여기서는 같은 key가 나오면 나중 값을 선택한다.

### 입력 순서를 유지하고 싶다면

기본 구현의 순회 순서에 의존하지 않는다. 입력 순서를 유지해야 한다면 Map supplier를 명시한다.

```java
.collect(Collectors.toMap(
    Test::getTitle,
    Test::getDescription,
    (oldValue, newValue) -> newValue,
    LinkedHashMap::new
));
```

### groupingBy와의 경계

```text
toMap
→ 하나의 key에 최종 value 하나
→ 중복 key가 있다면 merge 정책 필요

groupingBy
→ 같은 key의 여러 값을 Collection으로 묶음
```

## 2. 이미 존재하는 Map을 합친다 — putAll과 merge

두 Map이 이미 있다면 먼저 **겹친 key를 단순히 덮어쓸 것인지, 기존 값과 결합할 것인지**를 결정한다.

### putAll — 나중 값을 덮어쓴다

```java
Map<String, Integer> map1 =
    new HashMap<>(Map.of("Apple", 1000, "Banana", 2000));

Map<String, Integer> map2 =
    new HashMap<>(Map.of("Apple", 4000, "Tomato", 5000));

map1.putAll(map2);
```

결과:

```text
Apple  → 4000
Banana → 2000
Tomato → 5000
```

단순히 두 번째 Map의 값으로 덮어쓰는 것이 목적이라면 `putAll()`이 가장 명확하다.

### merge — 기존 값과 새 값을 결합한다

```java
map2.forEach((key, value) ->
    map1.merge(key, value, Integer::sum)
);
```

결과:

```text
Apple  → 5000
Banana → 2000
Tomato → 5000
```

`Map.merge(key, value, remappingFunction)`은:

```text
key 없음
→ value 추가

key 있음
→ 기존 값과 새 값을 remappingFunction으로 결합

결합 결과 null
→ 해당 key 제거
```

처럼 동작한다.

## 3. 결국 같은 질문이다 — key 충돌을 어떻게 처리할까

```text
List / Stream
     ↓ toMap
    Map
     ↓
     │ 다른 Map과 합침
     ↓
putAll / merge
```

선택 기준은 간단하다.

| 상황 | 선택 |
|---|---|
| Collection을 key-value Map으로 변환 | `Collectors.toMap` |
| 중복 key에서 하나를 선택 | `toMap(..., mergeFunction)` |
| 같은 key의 값들을 묶음 | `groupingBy` |
| 기존 Map에 다른 Map을 단순 덮어쓰기 | `putAll` |
| 기존 값과 새 값을 계산해 결합 | `merge` |

> **Map 변환과 Map 병합은 API는 다르지만, 둘 다 key가 충돌할 때 어떤 의미를 부여할 것인가가 핵심이다.**
