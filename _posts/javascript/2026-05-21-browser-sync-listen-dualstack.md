---
title       : "browser-sync 2.27.x dual-stack 회피는 host가 아니라 listen 옵션이다"
description : "Node 17+ dual-stack 환경에서 EADDRINUSE가 계속 나면 browser-sync는 host가 아니라 listen 옵션을 본다."
date        : 2026-05-21 10:00:00 +0900
updated     : 2026-05-21 10:00:00 +0900
categories  : [javascript, "도구·dev-server"]
tags        : [browser-sync, webpack-dev-server, node, port, windows]
pin         : false
hidden      : false
---

`host: '127.0.0.1'`만 박아도 `AggregateError`가 계속 난다. `browser-sync`(2.27.x)는 portScanner 호스트를 `host`가 아니라 별도 `listen` 옵션에서 읽기 때문이다.

## 핵심

`browser-sync/dist/utils.js`의 `getPorts`:

```js
function getPorts(options, cb) {
  var port = options.get("port");
  var host = options.get("listen", "localhost"); // ← host가 아니라 listen
  ...
  portScanner.findAPortNotInUse(port, max, { host: host, ... }, cb);
}
```

`listen`이 비면 `localhost` 기본값 → Node 17+ dual-stack에서 portScanner가 잘못 판단 → 실제 listen 단계에서 엉뚱한 포트(이미 다른 프로세스가 잡은) 시도 → `EADDRINUSE`.

## 해결

```js
new BrowserSyncPlugin({
  host: '127.0.0.1',
  listen: '127.0.0.1',  // ← 이게 진짜 dual-stack 회피
  port: 9000,
  // ...
});
```

## 진단 팁

`webpack-cli`는 `cli.logger.error(error)`로 에러를 toString해서 출력한다. `AggregateError`의 기본 `toString()`은 `"AggregateError"` 한 줄만 반환해서 원인이 안 보인다. 실제로 까려면 catch 블록에 다음을 임시로 추가:

```js
if (error && Array.isArray(error.errors)) {
  error.errors.forEach((e, i) => cli.logger.error(`errors[${i}]:`, e));
}
```

또는 `BrowserSyncPlugin` 두 번째 인자에 `callback: (err, bs) => { ... }`을 넘기면 `browser-sync.init`의 진짜 에러를 받을 수 있다. 그게 `EADDRINUSE`인지 확인되면 위 처방으로 직행.

## 메모

- `webpack-dev-server`가 `Project is running at: ... 9060` 까지 찍고 죽으면 listen 자체는 성공한 것. 그 뒤 done hook에서 시작하는 BrowserSync가 범인이다.
- `host`/`listen` 모두 박는 게 안전하다. 둘은 의미가 다르다 — `host`는 BrowserSync가 광고할 외부 주소, `listen`은 실제 바인딩/포트 스캔에 쓰는 주소.
