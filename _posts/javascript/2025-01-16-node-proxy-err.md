---
title       : "Node 버전 변경 뒤 webpack Proxy ECONNREFUSED — localhost·IPv4·IPv6 경계 진단"
description : "webpack-dev-server Proxy만 ECONNREFUSED일 때 Backend 상태, localhost의 주소 해석 순서, ::1/127.0.0.1 Bind 불일치를 분리해 진단하고 명시적 Target이나 DNS 정책으로 해결하는 흐름을 정리한다."
date        : 2026-01-16 10:32:57 +0900
updated     : 2026-09-06 11:15:00 +0900
categories  : [javascript, "Node·번들러"]
tags        : [nodejs, webpack-dev-server, ipv6, dns, troubleshooting]
pin         : false
hidden      : false
---

Node 버전을 바꾼 뒤 Browser에서 Backend를 직접 열면 정상인데 webpack-dev-server Proxy만 `ECONNREFUSED`가 나는 경우가 있다.

이 증상을 바로 "Node의 IPv6 버그"로 고정하기보다 연결 경로를 분리해서 본다.

```text
Browser → Backend
        정상

Node Dev Server
   ↓ Proxy Target: localhost:8080
DNS / localhost 해석
   ↓
127.0.0.1 또는 ::1
   ↓
Backend가 실제 Listen 중인 주소와 일치?
```

핵심은 **`localhost`가 하나의 고정 IP가 아니라 IPv4/IPv6 Loopback 주소로 해석될 수 있다는 점**이다.

## 증상

예:

```text
[webpack-dev-server] [HPM] Error occurred while proxying request
localhost:9000/api to http://localhost:8080/ [ECONNREFUSED]
```

상태:

```text
Frontend localhost:9000
→ 정상

Backend localhost:8080
→ Browser 직접 접근 정상

Frontend Proxy → Backend
→ ECONNREFUSED
```

여기서 중요한 단서는 Backend Application 자체가 완전히 죽은 것은 아니라는 점이다.

## 1. 먼저 CORS와 TCP 연결 실패를 구분한다

`ECONNREFUSED`는 HTTP Response를 받은 뒤 Browser가 CORS 정책으로 막은 상황이 아니다.

```text
TCP Connection 자체 실패
→ ECONNREFUSED

HTTP Response 도착
→ 그 다음에야 HTTP/CORS 문제를 논의
```

따라서 Backend Log에 요청 자체가 없다면 Proxy가 어느 주소로 연결을 시도했는지부터 본다.

## 2. Backend가 어느 주소에 Listen 중인지 확인한다

macOS/Linux:

```bash
lsof -nP -iTCP:8080 -sTCP:LISTEN
```

또는:

```bash
ss -lntp | grep ':8080'
```

예를 들어:

```text
127.0.0.1:8080
```

만 보인다면 IPv4 Loopback만 Listen 중이다.

반대로 `::1:8080`, `:::8080`, `0.0.0.0:8080` 등은 각각 다른 Bind 의미를 가진다.

## 3. 현재 환경에서 localhost가 어떻게 해석되는지 본다

OS 설정과 Runtime에 따라 `localhost`에서 IPv4와 IPv6 주소가 모두 후보가 될 수 있다.

```bash
node -e "require('dns').lookup('localhost', { all: true }, console.log)"
```

예:

```text
[
  { address: '::1', family: 6 },
  { address: '127.0.0.1', family: 4 }
]
```

Node.js는 과거 버전과 달리 `dns.lookup()` 결과를 임의로 IPv4-first 정렬하지 않고 OS Resolver의 순서를 보존하는 방향으로 동작이 변경된 시기가 있다. 따라서 Version 변경 뒤 **OS가 `::1`을 먼저 돌려주는 환경의 차이가 드러날 수 있다.**

중요한 표현은:

```text
Node 17+는 항상 IPv6 우선
```

이 아니라:

```text
localhost가 IPv4/IPv6 둘 다 가질 수 있고
Node/OS의 결과 순서와 Backend Bind가 어긋날 수 있다
```

이다.

## 4. IPv4/IPv6를 직접 호출해 가설을 검증한다

```bash
curl -v http://127.0.0.1:8080/
curl -g -v 'http://[::1]:8080/'
```

결과가:

```text
127.0.0.1 → 성공
::1       → Connection refused
```

라면 Proxy가 `::1`로 연결을 시도했을 때 실패하는 이유가 명확해진다.

## 5. 해결 방법 1 — Target 주소를 명시한다

개발 환경에서 Backend가 IPv4 Loopback에만 Bind하는 것이 의도라면 Proxy Target도 같은 주소를 명시할 수 있다.

```javascript
proxy: {
  '/api': {
    target: 'http://127.0.0.1:8080',
    changeOrigin: true,
  },
}
```

```text
Proxy Target
→ 127.0.0.1

Backend Bind
→ 127.0.0.1
```

로 양쪽의 의미가 일치한다.

단, 팀 전체에서 IPv4만 사용해야 한다는 보편 규칙은 아니다. 개발 서버를 Dual-stack으로 Bind하도록 구성하는 것이 더 적절한 환경도 있다.

## 6. 해결 방법 2 — Node의 DNS 결과 정책을 명시한다

특정 Application 전체에서 IPv4를 먼저 시도하려는 의도라면 Node의 DNS Result Order를 설정할 수 있다.

명령행 예:

```bash
node --dns-result-order=ipv4first app.js
```

환경 변수로 Node Option을 전달하는 방법도 있다.

```bash
NODE_OPTIONS=--dns-result-order=ipv4first npm start
```

이 방법은 Process 전반의 Name Resolution 정책에 영향을 주므로 **특정 Proxy 하나만 IPv4여야 하는 문제라면 Target을 명시하는 방식이 영향 범위가 더 작다.**

## 7. 해결 방법 3 — Backend를 의도한 주소에 Bind한다

IPv4/IPv6 양쪽에서 접근해야 하는 개발 환경이라면 Backend Listen 정책 자체를 확인한다.

```text
Frontend를 IPv6에서도 사용
+ Backend도 IPv6 접근 필요
→ Backend Bind 정책 수정 검토
```

이 경우 `127.0.0.1`로 Proxy를 고정하는 것은 증상만 우회할 수 있다.

## 진단 순서

```text
1. ECONNREFUSED인가 HTTP/CORS Error인가?
2. Backend Process가 실제로 Listen 중인가?
3. 어느 Address(127.0.0.1 / ::1 / wildcard)에 Bind했나?
4. Node가 localhost를 어떤 순서로 해석하나?
5. IPv4와 IPv6를 직접 호출하면 각각 어떤가?
6. Target 고정 / DNS 정책 / Backend Bind 중 어느 층을 고칠까?
```

이 순서면 `nvm`이나 Node Version 자체를 원인으로 단정하지 않고 실제 Socket 연결 실패를 확인할 수 있다.

## 정리

```text
localhost
→ 이름

127.0.0.1
→ IPv4 Loopback

::1
→ IPv6 Loopback
```

이 셋을 같은 것으로 취급하면 Node Version이나 OS가 바뀔 때 숨어 있던 Bind 불일치가 드러날 수 있다.

**Browser는 되는데 Node Proxy만 `ECONNREFUSED`라면 "localhost가 실제로 어느 주소가 되었고 Backend는 어디에 Listen하는가"를 먼저 확인한다.**

> 같은 Dual-stack 문제를 Dev Server의 **Listen 쪽**에서 만난 사례는 [Node localhost dual-stack — browser-sync listen 함정](/posts/javascript/2026-05-21-node-dualstack-webpack-browser-sync/)에서 이어진다.
