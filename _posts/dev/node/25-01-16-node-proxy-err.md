---
title       : nvm으로 Node 버전 변경 후 webpack-dev-server 프록시 ECONNREFUSED 해결기
description : 
date        : 2026-01-16 10:32:57 +0900
updated     : 2026-01-16 10:33:15 +0900
categories  : []
tags        : []
pin         : false
hidden      : false
---


## 문제 상황

`nvm`으로 Node.js 버전을 변경한 뒤, 프런트 개발 서버를 띄우면 아래와 같은 에러가 반복해서 발생했다.

```text
[webpack-dev-server] [HPM] Error occurred while proxying request 
localhost:9000/api/ods to http://localhost:8080/ [ECONNREFUSED]
```

* 프런트엔드: `localhost:9000` → 정상 기동
* 백엔드(Spring): `localhost:8080` → 정상 기동
* 하지만 **프록시 요청이 백엔드까지 도달하지 않음**
* 백엔드 로그에도 요청 흔적이 없음

즉, 서버는 둘 다 떠 있는데 **프록시만 안 붙는 상태**였다.

---

## 처음 의심했던 것들 (하지만 아니었음)

* 백엔드가 안 떠있나? ❌
* 포트가 다른가? ❌
* Docker 컨테이너 문제? ❌
* CORS 문제? ❌ (아예 요청이 안 감)

여기서 중요한 힌트는:

> **브라우저 직접 접근은 되는데, webpack-dev-server 프록시만 실패한다**

였다.

---

## 원인: Node 버전 변경 + IPv6 (`localhost`)

결론부터 말하면 원인은 **IPv6**였다.

### 무슨 일이 벌어졌나?

* Node 17+ (특히 18, 20 이후) 부터는
  👉 **DNS 해석 시 IPv6(::1)를 우선 사용**
* `localhost` → `::1` (IPv6)
* 하지만 백엔드(Spring)는 보통:

  * `127.0.0.1` (IPv4)에만 바인딩
* 결과:

  ```text
  프록시(Node) → ::1:8080 ❌ (연결 거부)
  ```

그래서:

* 브라우저에서는 잘 되고
* webpack-dev-server 프록시만 `ECONNREFUSED` 발생

이 패턴, **nvm으로 Node 바꾼 직후 자주 터진다.**

---

## 해결 방법 (가장 확실한 방법)

### ✅ webpack 프록시 target을 `localhost` → `127.0.0.1` 로 변경

#### 변경 전

```js
proxy: {
  '/api': {
    target: 'http://localhost:8080',
    secure: false,
    changeOrigin: true,
  },
},
```

#### 변경 후

```js
proxy: {
  '/api': {
    target: 'http://127.0.0.1:8080',
    secure: false,
    changeOrigin: true,
  },
},
```

실제 프로젝트에서는 `webpack/webpack.dev.js` 에서 아래 두 군데를 수정했다.

```diff
- target: `http${options.tls ? 's' : ''}://localhost:8080`
+ target: `http${options.tls ? 's' : ''}://127.0.0.1:8080`

- target: `http${options.tls ? 's' : ''}://localhost:${options.watch ? '8080' : '9060'}`
+ target: `http${options.tls ? 's' : ''}://127.0.0.1:${options.watch ? '8080' : '9060'}`
```

변경 후 `npm start` → **프록시 정상 동작** 🎉
백엔드 로그에도 요청이 정상적으로 찍힘.

---

## 다른 해결 방법 (참고)

### 1️⃣ Node에 IPv4 우선 옵션 주기

```bash
set NODE_OPTIONS=--dns-result-order=ipv4first
```

하지만:

* 환경변수 관리가 번거롭고
* 팀원/CI 환경까지 고려하면

👉 **프록시 target 수정이 가장 깔끔**

---

## 정리

* nvm으로 Node 버전 변경 후
* webpack-dev-server 프록시에서 `ECONNREFUSED`
* 서버는 다 떠 있는데 요청이 안 간다면?

👉 **IPv6 (`localhost → ::1`) 문제를 의심하자**

### 핵심 요약

* ❌ `http://localhost:8080`
* ✅ `http://127.0.0.1:8080`

