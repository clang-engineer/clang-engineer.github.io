---
title       : ajax Map타입 데이터 전송 안될 때
description : >-
date        : 2021-12-02 09:00:45 +0900
updated     : 2021-12-10 09:01:11 +0900
categories  : [dev, javascript]
tags        : [axios]
pin         : false
hidden      : false
---

## 문제
- ajax request body에 typescript에서 제공하는 set, map type의 데이터를 전송하려할 null로 전송되는 현상이 있었다.

## 원인
- ajax 는 기본적으로 javascript 객체를 json 형식으로 직렬화하여 전송하는데, set과 map은 json으로 직렬화할 수 있는 일반적이 객체가 아니기 때문에 전송이 안되었다.

# 해결
1. set, map type의 데이터를 직렬화가 가능한 object로 변환하여 전송하면 된다.
2. set, map type의 데이터를 직렬화가 가능한 array로 변환하여 전송하면 된다.


## 방식 1-1. Object.fromEntries 사용하여 일반 객체로 변환
```javascript
const set = new Set([1, 2, 3]);
const map = new Map([['a', 1], ['b', 2], ['c', 3]]);
axios.post('url', { set: Object.fromEntries(set), map: Object.fromEntries(map) }); // { set: { 1: 1, 2: 2, 3: 3 }, map: { a: 1, b: 2, c: 3 } }
```

## 방식 1-2. ...spread 사용하여 일반 객체로 변환
```javascript
const set = new Set([1, 2, 3]);
const map = new Map([['a', 1], ['b', 2], ['c', 3]]);
axios.post('url', { set: { ...set }, map: { ...map } }); // { set: { 1: 1, 2: 2, 3: 3 }, map: { a: 1, b: 2, c: 3 } }
```

## 방식 2. Array.from 사용하여 배열로 변환
```javascript
const set = new Set([1, 2, 3]);
const map = new Map([['a', 1], ['b', 2], ['c', 3]]);
axios.post('url', { set: Array.from(set), map: Array.from(map) });
```