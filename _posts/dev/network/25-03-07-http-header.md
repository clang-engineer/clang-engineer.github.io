---
title       : HTTP Header 정리
description : >-
    HTTP Header 속성을 기록합니다.
date        : 2025-03-07 08:41:19 +0900
updated     : 2025-02-21 22:50:42 +0900
categories  : [dev, network]
tags        : [http, header]
pin         : false
hidden      : false
---

## Cache-Control
- 캐시 컨트롤 헤더를 설정하면 브라우저가 캐시를 저장하고, 서버에 요청하지 않아도 되기 때문에 서버 부하를 줄일 수 있음.

```sh
Cache-Control: <directive> # Cache-Control: max-age=31536000
```

| Directive | Description |
|---|---|
| max-age | 캐시를 저장할 시간을 초 단위로 설정 |
| no-cache | 캐시를 저장하지 않음 |
| no-store | 캐시를 저장하지 않음, 캐시를 사용하지 않음 |
| public | 캐시를 저장할 수 있음 |
| private | 사용자 캐시만 저장할 수 있음 |


> [MDN Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)


## CSP(Content-Security-Policy)
- 웹사이트에서 XSS를 방지하기 위해 사용되는 보안 정책을 설정하는 헤더. 
- CSP를 사용하면 웹 사이트에서 로드되는 리소스의 출처를 제한할 수 있음.
- default-src, script-src, style-src, img-src 등의 디렉티브를 사용하여 리소스의 출처를 설정할 수 있음.

```sh
Content-Security-Policy: <directive>   # default-src 'self'; img-src 'self' example.com
Content-Security-Policy: "default-src 'self'; frame-src 'self' data:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://storage.googleapis.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:"
```

| Value | Description |
|---|---|
| 'self' | same origin만 허용 |
| 'none' | 사용 불가능 |
| 'unsafe-inline' | inline 스크립트를 허용 |
| 'unsafe-eval' | eval() 함수를 허용 |
| 'data:' | data URI를 허용 |
| 'nonce-<base64-value>' | 특정 nonce 값을 가진 스크립트를 허용 |
| 'sha256-<base64-value>' | 특정 해시 값을 가진 스크립트를 허용 |


> [MDN CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)


## Permissions-Policy
- Permissions-Policy를 사용하면 웹 사이트에서 사용할 수 있는 브라우저 기능을 제어할 수 있음.
- camera, fullscreen, geolocation, gyroscope, magnetometer, microphone, midi, payment, sync-xhr 등의 디렉티브를 사용하여 브라우저 기능을 제어할 수 있음.

```sh
Permissions-Policy: <directive>=<allowlist> # camera=(), fullscreen=(self), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), sync-xhr=() 
```

| allowlist | Description |
|---|---|
| * | 모든 사이트에서 사용 가능 |
| () | 사용 불가능 |
| self | same origin만 허용 |
| src | src 속성을 가진 리소스만 허용 |
| "https://example.com" | 특정 사이트에서만 사용 가능 |
 
> [MDN Permissions-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy)


## Referrer-Policy
- Referer: 웹에서 A 사이트에서 B 사이트로 이동할 때, 기본적으로 브라우저는 HTTP Referer(오타 아님) 헤더를 통해 사용자가 어떤 URL에서 왔는지 전송함. 이 정보 노출로 인한 보안 문제를 방지하기 위해 Referrer-Policy를 사용함.

| Policy | Description |
|---|---|
| no-referrer | 모든 요청에서 Referer 헤더를 제거 |
| strict-origin-when-cross-origin | 같은 사이트 이동 시 전체 URL, 다른 사이트 이동 시 origin만 전송, https->http로 이동 시 Referer 헤더 제거  (보안성과 개인정보 보호를 위한 기본값) |
| origin-when-cross-origin | 같은 사이트 이동 시 전체 URL, 다른 사이트 이동 시 origin만 전송, https->http로 이동 시 Referer 헤더 전송 (보안성은 떨어지지만, 개인정보 보호는 유지) |

```sh
Referrer-Policy: <policy> # strict-origin-when-cross-origin, no-referrer, no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, unsafe-url
```