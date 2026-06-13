---
title       : "Node 17+ localhost dual-stack — webpack-dev-server AggregateError와 browser-sync listen 함정"
description : "AggregateError의 정체는 IPv6+IPv4 양쪽 listen 실패. webpack은 host, browser-sync는 listen 옵션을 박아야 한다."
date        : 2026-05-21 10:00:00 +0900
updated     : 2026-05-21 10:00:00 +0900
categories  : [javascript, "Node·번들러"]
tags        : [node, webpack-dev-server, browser-sync, port, windows, dual-stack]
pin         : false
hidden      : false
---

Node 17부터 `localhost`가 `::1`(IPv6)과 `127.0.0.1`(IPv4) 양쪽으로 해석된다. dev-server류가 listen 단계에서 양쪽 다 실패하면 Node가 두 에러를 `AggregateError` 하나로 감싸서 던지는데, 기본 `toString()`이 한 줄("AggregateError")만 뱉어서 원인이 안 보인다. webpack-dev-server는 `host`, browser-sync는 `listen` 옵션이 진짜 dual-stack 회피 지점이다.

## 증상

```text
webpack 5.74.0 compiled successfully in 11564 ms
No errors found.
AggregateError
```

`Project is running at:` 까지 출력되고 URL이 안 찍히면 listen 단계에서 죽은 것.

## 핵심 — 메시지가 비어 보이는 이유

`.listen()`이 IPv6/IPv4 양쪽 다 실패하면 Node가 두 에러를 `AggregateError`에 담는다. **메시지가 비어 보이는 이유는 `.errors` 배열 안에 들어 있어서지 에러가 없는 게 아니다.** `webpack-cli`는 `cli.logger.error(error)`로 toString만 호출해서 원인이 안 보인다.

가장 흔한 트리거: 직전 dev-server 프로세스가 포트를 안 놓고 살아있음. PowerShell에서 `Ctrl+C`하면 npm 래퍼만 죽고 자식 `node.exe`가 남는 경우가 많다.

## 진단

```powershell
# 죽었어야 할 listener 찾기
netstat -ano | findstr LISTENING | findstr ":9060 :9000"
```

PID 보이면 그게 범인. 안 보이면 dual-stack 자체 문제다.

원인을 더 확실히 보고 싶으면 catch 블록에 임시로 추가:

```js
if (error && Array.isArray(error.errors)) {
  error.errors.forEach((e, i) => cli.logger.error(`errors[${i}]:`, e));
}
```

보통 `EADDRINUSE`가 들어있다.

## 해결 1 — 남은 프로세스 정리

```powershell
# 남은 node 프로세스 모두 종료
taskkill /F /IM node.exe
npm run start
```

## 해결 2 — webpack-dev-server: `host`를 IPv4로 못 박기

깨끗한 상태에서도 재현되면 `host`를 명시한다.

```js
// webpack/webpack.dev.js
devServer: {
  host: '127.0.0.1',   // ← dual-stack 회피
  port: 9060,
  // ...
}
```

**`devServer.host`는 필수다.** BrowserSync 쪽만 `127.0.0.1`로 박아두고 webpack-dev-server `devServer` 블록의 `host`를 빼두면 9060 포트 listen에서 그대로 `AggregateError`가 터진다.

## 해결 3 — browser-sync: `host`가 아니라 `listen` 옵션

`browser-sync`(2.27.x)는 portScanner 호스트를 `host`가 아니라 별도 `listen` 옵션에서 읽기 때문에, `host`만 박으면 여전히 깨진다.

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

```js
new BrowserSyncPlugin({
  host: '127.0.0.1',
  listen: '127.0.0.1',  // ← 이게 진짜 dual-stack 회피
  port: 9000,
  // ...
});
```

또는 `BrowserSyncPlugin` 두 번째 인자에 `callback: (err, bs) => { ... }`을 넘기면 `browser-sync.init`의 진짜 에러를 받을 수 있다.

## 메모

- `host`/`listen` 모두 박는 게 안전하다. 둘은 의미가 다르다 — `host`는 BrowserSync가 광고할 외부 주소, `listen`은 실제 바인딩/포트 스캔에 쓰는 주소.
- dual-stack 회피는 webpack-dev-server와 browser-sync **두 곳 모두에** 적용해야 의미가 있다. 한쪽만 박으면 다른 쪽이 터진다.
- `webpack-dev-server`가 `Project is running at: ... 9060`까지 찍고 죽으면 listen 자체는 성공한 것. 그 뒤 done hook에서 시작하는 BrowserSync가 범인이다.
