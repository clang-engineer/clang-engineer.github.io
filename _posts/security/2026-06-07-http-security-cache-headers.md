---
title       : HTTP 보안·캐시 헤더 — Cache-Control, CSP, Permissions-Policy, Referrer-Policy
description : "응답 캐싱을 제어하는 Cache-Control, XSS를 막는 CSP, 브라우저 기능 권한을 통제하는 Permissions-Policy, Referer 노출을 조절하는 Referrer-Policy의 주요 디렉티브와 값을 정리한다."
date        : 2026-06-07 12:00:00 +0900
categories  : [security, "TLS·HTTP"]
tags        : [http, cache]
pin         : false
hidden      : false
---

## Cache-Control

응답 캐싱 정책을 지정. 형식: `Cache-Control: <directive>`

| Directive | 의미 |
|---|---|
| `max-age=<s>` | 캐시 유효 시간 (초) |
| `no-cache` | 캐시는 저장하되 매번 재검증 |
| `no-store` | 캐시 자체를 저장하지 않음 |
| `public` | 어떤 캐시(브라우저·CDN)든 저장 가능 |
| `private` | 사용자(브라우저)만 저장 가능, CDN 금지 |

예) `Cache-Control: max-age=31536000` — 1년 캐시

### 실무 판단 — 무엇을 어떻게 캐싱하나

- **해시 붙은 정적 자산**(`app.a1b2c3.js`)은 `public, max-age=31536000, immutable`. 파일명이 내용에 종속되므로 영구 캐시해도 안전하고, 배포 때 파일명이 바뀌어 자동 무효화된다.
- **HTML 문서**는 `no-cache`(저장하되 매번 재검증)로 둔다. 그래야 새 배포의 자산 참조가 즉시 반영된다. `max-age`를 길게 주면 오래된 HTML이 옛 자산을 가리켜 깨진다.
- **인증된 사용자 응답**(마이페이지, API)은 `no-store` 또는 최소 `private`. `public`으로 두면 CDN·중간 프록시가 A의 응답을 B에게 줄 수 있다 — 실제 정보 유출 사고의 흔한 원인.

> [MDN Cache-Control](https://developer.mozilla.org/docs/Web/HTTP/Headers/Cache-Control)

## Content-Security-Policy (CSP)

XSS 방지용 리소스 출처 화이트리스트. 디렉티브 단위로 출처 제한.

```
Content-Security-Policy: default-src 'self'; img-src 'self' example.com
```

### 흔한 directive
- `default-src` — 모든 종류의 기본값
- `script-src`, `style-src`, `img-src`, `font-src`, `frame-src` — 종류별

### 출처 값

| Value | 의미 |
|---|---|
| `'self'` | same origin |
| `'none'` | 일체 금지 |
| `'unsafe-inline'` | inline `<script>`/`<style>` 허용 |
| `'unsafe-eval'` | `eval()` 허용 |
| `data:` | `data:` URI 허용 |
| `'nonce-<base64>'` | 특정 nonce를 가진 스크립트만 허용 |
| `'sha256-<base64>'` | 특정 해시를 가진 스크립트만 허용 |

### 실전 — inline 스크립트가 막힌다

CSP를 처음 켜면 가장 먼저 겪는 게 이거다. `script-src 'self'`만 주면 **HTML에 박힌 `<script>...</script>`와 `onclick="..."` 인라인 핸들러가 전부 차단**된다. 콘솔에 이렇게 뜬다:

```
Refused to execute inline script because it violates the following
Content-Security-Policy directive: "script-src 'self'".
Either the 'unsafe-inline' keyword, a hash ('sha256-...'), or a nonce is required.
```

해결은 세 갈래인데, 우선순위가 분명하다.

- **`'unsafe-inline'` 추가** — 가장 쉽지만 CSP의 존재 이유(XSS 차단)를 통째로 무력화한다. 임시방편 이상으로 쓰지 않는다.
- **nonce** — 응답마다 랜덤 nonce를 생성해 헤더(`script-src 'nonce-r4nd0m'`)와 `<script nonce="r4nd0m">` 양쪽에 넣는다. **nonce는 요청마다 새로 발급**해야 의미가 있다(고정하면 우회됨). 동적 렌더링(SSR)에 적합.
- **hash** — 스크립트 내용의 sha256을 `script-src 'sha256-...'`에 넣는다. 내용이 고정된 정적 스크립트에 적합. 스크립트가 바뀌면 해시도 갱신해야 한다.

근본 해법은 **inline을 없애고 외부 `.js`로 분리**하는 것이다. 그러면 `'self'`만으로 통과한다.

### 롤아웃은 report-only로

기존 사이트에 CSP를 바로 걸면 뭐가 깨질지 모른다. `Content-Security-Policy-Report-Only` 헤더로 먼저 배포하면 **차단하지 않고 위반만 리포트**한다. 콘솔·`report-to`로 위반을 수집해 정책을 다듬은 뒤, 안정되면 실제 `Content-Security-Policy`로 전환한다.

> [MDN CSP](https://developer.mozilla.org/docs/Web/HTTP/CSP)

## Permissions-Policy

브라우저 기능(카메라·위치·결제 등) 사용 권한을 제어.

```
Permissions-Policy: camera=(), geolocation=(self), payment=()
```

| Allowlist | 의미 |
|---|---|
| `*` | 모든 origin 허용 |
| `()` | 사용 금지 |
| `self` | same origin만 |
| `src` | iframe `src` origin만 |
| `"https://example.com"` | 특정 origin만 |

흔한 feature: `camera`, `microphone`, `geolocation`, `gyroscope`, `magnetometer`, `midi`, `payment`, `fullscreen`, `sync-xhr`.

> [MDN Permissions-Policy](https://developer.mozilla.org/docs/Web/HTTP/Headers/Permissions-Policy)

## Referrer-Policy

`Referer` 헤더(이전 페이지 URL) 노출 정책.

| Policy | 의미 |
|---|---|
| `no-referrer` | Referer 헤더 전송 안 함 |
| **`strict-origin-when-cross-origin`** | 같은 사이트엔 전체 URL, 다른 사이트엔 origin만, HTTPS→HTTP 다운그레이드 시 안 보냄 (브라우저 기본값) |
| `origin-when-cross-origin` | 위와 같지만 HTTPS→HTTP 에도 origin 전송 (보안↓) |
| `same-origin` | 같은 origin만 전체 URL, 다른 origin엔 전혀 안 보냄 |
| `unsafe-url` | 항상 전체 URL 전송 |

```
Referrer-Policy: strict-origin-when-cross-origin
```
