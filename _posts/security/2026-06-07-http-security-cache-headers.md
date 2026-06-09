---
title       : HTTP 보안·캐시 헤더 — Cache-Control, CSP, Permissions-Policy, Referrer-Policy
description :
date        : 2026-06-07 12:00:00 +0900
categories  : [security]
tags        : [http, security, cache, csp]
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
