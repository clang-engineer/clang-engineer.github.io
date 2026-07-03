---
title       : ajax Map타입 데이터 전송 안될 때
description : "axios로 Set, Map 데이터를 보내면 JSON 직렬화 시 빈 객체({})가 되어 값이 사라지는 문제. Object.fromEntries나 Array.from으로 일반 객체·배열로 변환해 해결."
date        : 2021-12-02 09:00:45 +0900
updated     : 2026-07-03 09:01:11 +0900
categories  : [javascript, "언어·패키지"]
tags        : [axios, serialization, set, map, troubleshooting]
pin         : false
hidden      : false
---

## 문제
- axios request body에 `Set`, `Map` 타입 데이터를 담아 전송하면, 서버에는 값이 사라진 빈 객체로 도착하는 현상이 있었다.

## 원인
- axios는 request body를 `JSON.stringify`로 직렬화해서 전송한다.
- `JSON.stringify`는 객체의 **own enumerable 프로퍼티**만 직렬화하는데, `Set`·`Map`의 원소는 내부 슬롯에 저장될 뿐 own enumerable 프로퍼티가 아니다. 그래서 값이 통째로 무시되고 빈 객체(`{}`)가 된다.

```javascript
JSON.stringify(new Map([['a', 1]])); // "{}"
JSON.stringify(new Set([1, 2, 3]));  // "{}"
```

- 결국 axios는 이 빈 객체를 그대로 전송하므로, 서버 쪽에서는 값이 비어 보이게 된다.

## 해결
- 전송 전에 `Set`·`Map`을 직렬화 가능한 일반 객체나 배열로 변환하면 된다. 상황에 맞게 아래 방식 중 하나를 고른다.

- 방식 1. `Object.fromEntries`로 Map을 일반 객체로 변환 (권장)
```javascript
const map = new Map([['a', 1], ['b', 2], ['c', 3]]);
axios.post('url', { map: Object.fromEntries(map) }); // { map: { a: 1, b: 2, c: 3 } }
```

- 방식 2. `Array.from`(또는 spread)으로 배열로 변환
```javascript
const set = new Set([1, 2, 3]);
const map = new Map([['a', 1], ['b', 2], ['c', 3]]);
axios.post('url', {
  set: [...set],          // [1, 2, 3]
  map: Array.from(map),   // [['a', 1], ['b', 2], ['c', 3]]
});
```

- 방식 3. `JSON.stringify`의 replacer로 변환 로직을 한 곳에 모으기
```javascript
const replacer = (key, value) => {
  if (value instanceof Map) return Object.fromEntries(value);
  if (value instanceof Set) return [...value];
  return value;
};
axios.post('url', data, {
  transformRequest: [(data) => JSON.stringify(data, replacer)],
});
```

> `Object.fromEntries(set)`이나 `{ ...set }`, `{ ...map }`은 원하는 결과가 나오지 않는다. `Set`은 `[key, value]` 엔트리가 아니라 `Object.fromEntries`에서 에러가 나고, spread(`{ ... }`)는 own enumerable 프로퍼티만 복사하므로 `Set`·`Map`에 대해서는 똑같이 빈 객체(`{}`)가 된다.
{: .prompt-warning }