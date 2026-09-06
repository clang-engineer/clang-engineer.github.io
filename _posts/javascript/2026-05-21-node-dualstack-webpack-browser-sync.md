---
title       : "webpack-dev-server AggregateError — localhost Dual-stack·Port Listen 경계 진단"
description : "webpack-dev-server나 browser-sync가 AggregateError로 끝날 때 남은 프로세스, 실제 Listen 주소, localhost의 IPv4·IPv6 해석, browser-sync의 listen 옵션을 순서대로 진단한다."
date        : 2026-05-21 10:00:00 +0900
updated     : 2026-09-06 11:20:00 +0900
categories  : [javascript, "Node·번들러"]
tags        : [node, webpack-dev-server, browser-sync, port, windows, dual-stack, troubleshooting]
pin         : false
hidden      : false
---

webpack-dev-server가 컴파일까지 성공한 뒤 `AggregateError` 한 줄만 남기고 종료되면 **Build보다 Listen 단계**를 먼저 본다.

```text
Webpack Compile
→ 성공

Dev Server Listen
→ 실패
   ├─ Port 이미 사용 중?
   ├─ Bind Address 문제?
   └─ localhost IPv4/IPv6 해석과 실제 Listener 불일치?
```

`AggregateError` 자체가 원인은 아니다. 여러 하위 Error를 하나로 묶은 Container이므로 실제 `.errors`를 확인해야 한다.

## 1. 가장 먼저 Port 점유를 확인한다

Windows:

```powershell
netstat -ano | findstr LISTENING | findstr ":9060 :9000"
```

PID가 남아 있다면 어떤 Process인지 확인한다.

```powershell
tasklist /FI "PID eq <pid>"
```

개발 서버를 종료했다고 생각했는데 자식 `node.exe`가 살아 있으면 다음 실행이 같은 Port를 Bind하지 못해 `EADDRINUSE`가 날 수 있다.

필요한 Process임을 확인한 뒤에만 종료한다.

```powershell
taskkill /PID <pid> /F
```

모든 Node Process를 무조건 종료하는 것보다 범위를 좁히는 편이 안전하다.

## 2. AggregateError 내부 원인을 출력한다

Error를 잡을 수 있는 위치가 있다면 내부 배열을 출력한다.

```javascript
if (error && Array.isArray(error.errors)) {
  error.errors.forEach((e, i) => {
    console.error(`errors[${i}]`, e);
  });
}
```

여기서:

```text
EADDRINUSE
→ 이미 누가 해당 Address/Port를 Listen

EADDRNOTAVAIL
→ 현재 Host에 없는 주소로 Bind 시도

EACCES
→ 권한/정책 문제
```

처럼 실제 Socket Error로 내려간다.

## 3. localhost는 하나의 고정 주소가 아니다

`localhost`는 환경에 따라 IPv4 Loopback `127.0.0.1`과 IPv6 Loopback `::1`을 후보로 가질 수 있다.

```bash
node -e "require('dns').lookup('localhost', { all: true }, console.log)"
```

따라서 Node Version 변경 뒤 문제가 드러났다고 해서:

```text
Node 17+ = 항상 IPv6 우선
```

이라고 일반화하지 않는다.

실제 문제는 다음 조합에서 생길 수 있다.

```text
Runtime/OS가 localhost를 해석한 주소
        ≠
다른 Process가 실제 Bind한 주소
```

Node의 `dns.lookup()` 결과 순서 정책이 과거와 달라진 Version 구간이 있어, Version 변경이 숨어 있던 Dual-stack 차이를 드러내는 계기가 될 수 있다.

## 4. webpack-dev-server는 실제 Bind Address를 명시할 수 있다

개발 환경에서 IPv4 Loopback만 쓰는 것이 의도라면:

```javascript
module.exports = {
  devServer: {
    host: '127.0.0.1',
    port: 9060,
  },
};
```

처럼 Bind 의도를 명시할 수 있다.

하지만 `host: '127.0.0.1'`이 모든 환경의 필수 설정은 아니다. LAN 접근이나 IPv6가 필요하면 다른 Bind Policy가 맞다.

핵심은 **기본값이 무엇인지 추측하지 말고 실제 필요한 Listener 범위를 명시하는 것**이다.

## 5. BrowserSync는 `host`와 `listen`의 역할을 구분한다

사용 중인 BrowserSync Version/Wrapper에 따라 광고용 Host와 실제 Listen/Port Scan 주소가 별도 옵션으로 취급될 수 있다.

당시 사용한 BrowserSync 계열에서는 실제 Bind·Port Scan 주소를 `listen`으로 고정해야 문제를 피할 수 있었다.

```javascript
new BrowserSyncPlugin({
  host: '127.0.0.1',
  listen: '127.0.0.1',
  port: 9000,
});
```

여기서 남길 일반 원칙은 특정 Version의 내부 구현을 외우는 것이 아니다.

```text
화면에 표시할 Host
        ≠
실제로 Socket을 Bind할 Address
```

일 수 있으므로 **현재 사용하는 BrowserSync Version의 옵션 의미를 확인한다.**

## 6. 어느 단계에서 죽었는지 로그 위치로 좁힌다

```text
Compile 완료 전
→ Bundler/Source 문제

webpack-dev-server URL 출력 전
→ webpack Dev Server Listen 의심

webpack-dev-server는 정상 기동
+ 이후 BrowserSync 시작 중 실패
→ BrowserSync Listen/Port Scan 의심
```

하나의 `AggregateError`를 보고 모든 Server 설정을 동시에 바꾸지 않고 **마지막으로 정상 통과한 단계**를 기준으로 범위를 줄인다.

## 진단 순서

```text
1. Compile은 성공했는가?
2. 원하는 Port에 기존 Listener가 있는가?
3. AggregateError.errors의 실제 Code는 무엇인가?
4. localhost가 현재 어떤 주소로 해석되는가?
5. Dev Server가 어느 Address에 Bind하려 하는가?
6. BrowserSync 같은 후속 Server도 별도 Listen 옵션이 있는가?
7. 명시적 Bind 후 실제 Listener를 다시 확인한다
```

Windows에서는:

```powershell
netstat -ano | findstr LISTENING
```

으로 최종 상태를 확인한다.

## 정리

이 문제를 `Node 17+ IPv6 문제` 하나로 압축하면 다른 원인을 놓친다.

```text
AggregateError
→ 내부 Socket Error 확인

EADDRINUSE
→ Port/Address를 누가 잡았나

localhost
→ IPv4/IPv6 후보 확인

webpack / BrowserSync
→ 각각 실제 Bind 위치 확인
```

**Dual-stack은 원인 후보 중 하나이고, 최종 판단은 실제 Address·Port·Listener 상태로 한다.**

> Proxy의 **Outbound Target** 쪽에서 `ECONNREFUSED`가 나는 경우는 [webpack Proxy ECONNREFUSED — localhost·IPv4·IPv6 경계 진단](./2025-01-16-node-proxy-err.md)에서 이어진다.
