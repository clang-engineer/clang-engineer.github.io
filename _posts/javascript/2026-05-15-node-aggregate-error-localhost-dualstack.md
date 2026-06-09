---
title       : "webpack-dev-server의 정체불명 AggregateError는 localhost dual-stack 때문이다"
description : "Node 17+의 localhost dual-stack 해석으로 webpack-dev-server가 포트 바인딩 실패를 AggregateError로 뭉뚱그리는 문제"
date        : 2026-05-15 12:00:00 +0900
updated     : 2026-05-15 12:00:00 +0900
categories  : [javascript]
tags        : [node, webpack-dev-server, browser-sync, windows, port]
pin         : false
hidden      : false
---

webpack은 멀쩡히 컴파일됐는데 마지막에 메시지 하나 없이 `AggregateError`만 뜨고 죽는다. 원인은 거의 항상 포트 바인딩 실패고, Node 17+ 의 `localhost` 동작이 에러를 한 줄로 뭉뚱그려서 디버깅이 어려워 보일 뿐이다.

## 증상

```text
webpack 5.74.0 compiled successfully in 11564 ms
No errors found.
AggregateError
```

`Project is running at:` 까지 출력되고 URL이 안 찍히면 listen 단계에서 죽은 것.

## 핵심

Node 17부터 `localhost` 가 `::1` (IPv6) 과 `127.0.0.1` (IPv4) 양쪽으로 해석된다. `.listen()` 이 둘 다 실패하면 Node가 두 에러를 `AggregateError` 하나로 감싸서 던진다. **메시지가 비어 보이는 이유는 `.errors` 배열 안에 들어 있어서지 에러가 없는 게 아니다.**

가장 흔한 트리거: 직전 dev-server 프로세스가 포트를 안 놓고 살아있음. PowerShell에서 `Ctrl+C` 하면 npm 래퍼만 죽고 자식 `node.exe` 가 남는 경우가 많다.

## 진단

```powershell
# 죽었어야 할 listener 찾기
netstat -ano | findstr LISTENING | findstr ":9060 :9000"
```

PID 보이면 그게 범인. 안 보이면 dual-stack 자체 문제다.

## 해결

```powershell
# 남은 node 프로세스 모두 종료
taskkill /F /IM node.exe
npm run start
```

깨끗한 상태에서도 재현되면 webpack-dev-server 의 `host` 를 IPv4로 못 박는다.

```js
// webpack/webpack.dev.js
devServer: {
  host: '127.0.0.1',   // ← dual-stack 회피
  port: 9060,
  // ...
}
```

## 메모

- **`devServer.host`는 필수다.** BrowserSync 쪽만 `127.0.0.1`로 박아두고 webpack-dev-server `devServer` 블록의 `host`를 빼두면 9060 포트 listen에서 그대로 `AggregateError`가 터진다. dual-stack 회피는 두 곳 모두에 적용해야 의미가 있다.
- `browser-sync` 2.27.x 처럼 오래된 버전은 깨끗한 환경에서도 dual-stack 에서 깨질 수 있다. 같은 처방(`host: '127.0.0.1'`)이 통한다.
- 어떤 에러가 합쳐졌는지 보고 싶으면 노드를 직접 띄워서 `.on('error', e => console.log(e.errors))` 로 까보면 된다. 보통은 `EADDRINUSE` 가 들어있다.
