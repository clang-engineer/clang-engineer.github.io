---
title       : "HTTP 응답 정책 헤더 — Cache·Script·Browser Feature·Referrer를 분리해서 보기"
description : "Cache-Control, Content-Security-Policy, Permissions-Policy, Referrer-Policy를 하나의 보안 헤더 목록으로 외우지 않고 각각 캐시 저장, 리소스 실행, 브라우저 기능, Referer 노출이라는 독립 정책 축으로 정리한다."
date        : 2026-06-07 12:00:00 +0900
updated     : 2026-09-06 10:50:00 +0900
categories  : [security, "TLS·HTTP"]
tags        : [http, cache, csp, permissions-policy, referrer-policy]
pin         : false
hidden      : false
---

`Cache-Control`, CSP, Permissions-Policy, Referrer-Policy는 모두 HTTP Response Header지만 같은 문제를 해결하지 않는다.

먼저 브라우저의 어느 결정을 제어하는지 나누면 된다.

```text
Response를 저장·재사용해도 되나?
→ Cache-Control

어떤 Script·Style·Image 등을 로드·실행해도 되나?
→ Content-Security-Policy

Camera·Geolocation 같은 Browser Feature를 누가 써도 되나?
→ Permissions-Policy

다음 요청에 현재 URL 정보를 얼마나 Referer로 보낼까?
→ Referrer-Policy
```

즉 이 글은 "보안 헤더 모음"보다 **브라우저의 서로 다른 정책 경계 네 개**를 정리하는 글이다.

## 1. Cache-Control — 응답의 저장과 재사용 정책

대표 Directive:

| Directive | 의미 |
|---|---|
| `max-age=<s>` | Fresh로 간주할 시간 |
| `no-cache` | 저장은 가능하지만 재사용 전에 재검증 필요 |
| `no-store` | 저장하지 않도록 지시 |
| `public` | Shared Cache에도 저장 가능함을 명시 |
| `private` | Shared Cache가 아니라 Private Cache용 |
| `immutable` | Fresh 기간 동안 Resource가 변하지 않는다는 신호 |

### 해시가 붙은 정적 자산

```http
Cache-Control: public, max-age=31536000, immutable
```

```text
app.a1b2c3.js
        ↓ 내용 변경
app.d4e5f6.js
```

처럼 Content Hash가 파일명에 들어간 자산은 URL 자체가 Version이 되므로 긴 Freshness를 주기 좋다.

### HTML

HTML은 새 배포 때 새로운 Asset URL을 가리켜야 하므로 장기 Fresh Cache가 오히려 배포 반영을 늦출 수 있다.

예:

```http
Cache-Control: no-cache
```

`no-cache`는 "절대 저장하지 마라"가 아니라 **재사용 전에 Origin Server와 Revalidation하라**는 의미다.

### 개인화 응답

인증 사용자별 응답은 Shared Cache에 섞이지 않게 정책을 명확히 한다.

```text
민감해서 저장 자체를 피하고 싶다
→ no-store 검토

Browser Cache는 허용하지만 Shared Cache는 막는다
→ private
```

단순히 "인증이 있으면 무조건 no-store"가 아니라 데이터 민감도와 Application 요구에 맞춰 정한다.

## 2. CSP — Resource Loading과 Script Execution의 허용 범위

Content-Security-Policy는 Browser에게 **어떤 출처·형태의 Content를 허용할지** 지시하는 방어층이다.

예:

```http
Content-Security-Policy: default-src 'self'; img-src 'self' https://img.example.com; script-src 'self'
```

대표 Directive:

```text
default-src
script-src
style-src
img-src
font-src
connect-src
frame-src
object-src
base-uri
frame-ancestors
```

CSP는 XSS 위험을 크게 줄일 수 있는 중요한 Defense-in-Depth 수단이지만 **출력 Encoding, 안전한 DOM API, Sanitization을 대신하는 단일 만능 방어는 아니다.**

### Inline Script와 Nonce/Hash

`script-src 'self'`만 있다면 일반적인 Inline Script는 허용되지 않는다.

동적으로 Render되는 Page에서는 Response마다 예측하기 어려운 Nonce를 만들어 Header와 허용할 Script에 함께 넣을 수 있다.

```http
Content-Security-Policy: script-src 'self' 'nonce-randomValue'
```

```html
<script nonce="randomValue">
  bootstrap();
</script>
```

Nonce의 목적은 공격자가 임의로 삽입한 `<script>`가 **허용된 Nonce를 알지 못하도록 하는 것**이므로 요청/응답마다 새롭고 예측하기 어렵게 생성한다.

정적 Inline Script라면 Content Hash를 정책에 넣는 방식도 있다.

```text
sha256(script contents)
        ↓
script-src 'sha256-...'
```

### `'unsafe-inline'`의 경계

`'unsafe-inline'`은 Inline Script 허용 범위를 크게 넓혀 XSS 방어 효과를 약화시키므로 가능한 한 피하는 편이 좋다.

다만 이것 하나가 "CSP 전체를 완전히 무효화한다"고 단정하는 것도 정확하지 않다. 다른 Source Directive와 `frame-ancestors`, `object-src` 등 정책은 여전히 각각 의미를 가질 수 있다.

핵심은:

```text
CSP 있음 / 없음
```

이 아니라 **현재 Policy가 실제 공격 경로를 얼마나 제한하는가**다.

### 먼저 Report-Only로 관찰

기존 서비스에 CSP를 바로 강제하면 필요한 Resource까지 막을 수 있다.

```http
Content-Security-Policy-Report-Only: ...
```

으로 위반을 관찰한 뒤 실제 Enforcement Policy로 옮기는 전략을 사용할 수 있다.

Report 수집 방식은 Browser 지원과 CSP Reporting 설정(`report-to`, `report-uri`의 호환성 등)을 현재 환경에 맞춰 확인한다.

## 3. Permissions-Policy — Browser Feature 사용 범위

Permissions-Policy는 Camera, Microphone, Geolocation 같은 기능을 현재 Document와 Embedded Content가 사용할 수 있는 범위를 제한한다.

```http
Permissions-Policy: camera=(), microphone=(), geolocation=(self)
```

개념은:

```text
Browser Feature
      ↓
이 Origin / Frame이 사용할 수 있는가?
      ↓
Permissions-Policy
```

이다.

예:

```text
camera=()
→ Camera 사용 금지

geolocation=(self)
→ Same Origin 범위 허용
```

Feature별 지원 여부와 허용 문법은 Browser가 발전하면서 달라질 수 있으므로 실제 배포 시 MDN/Browser 지원표를 함께 확인한다.

## 4. Referrer-Policy — 다음 요청에 URL 정보를 얼마나 보낼까

Browser는 다른 Resource나 Page로 요청할 때 `Referer` Header에 현재 Page 정보를 넣을 수 있다. Referrer-Policy는 그 노출 범위를 조절한다.

대표 값:

| Policy | 개념 |
|---|---|
| `no-referrer` | Referer를 보내지 않음 |
| `same-origin` | Same-Origin 요청에만 Referer 전송 |
| `origin` | Origin 정보만 전송 |
| `strict-origin` | 보안 수준이 낮아지는 전환에는 보내지 않고 그 외에는 Origin만 |
| `strict-origin-when-cross-origin` | Same-Origin에는 전체 URL, Cross-Origin에는 Origin만, HTTPS→HTTP에는 전송하지 않음 |
| `unsafe-url` | 가능한 경우 전체 URL을 전송해 Privacy 노출이 큼 |

현재 주요 Browser의 기본 정책은 일반적으로 `strict-origin-when-cross-origin` 계열이지만, 서비스가 요구하는 Privacy Boundary를 명시적으로 선언하는 것이 의도를 더 분명하게 만든다.

중요한 표현은 **Same-Site가 아니라 Same-Origin**이다.

```text
https://app.example.com/a
→ https://app.example.com/b
Same Origin

https://app.example.com
→ https://api.example.com
Site 관점에서 가깝더라도 Origin은 다름
```

## 네 정책을 한 번에 비교

| Header | Browser가 결정하는 것 | 대표 실패/위험 |
|---|---|---|
| `Cache-Control` | Response 저장·재사용 | 오래된 Content, Shared Cache 정보 혼선 |
| `Content-Security-Policy` | Resource Load·Script Execution | XSS Impact 확대, 불필요한 외부 Resource 허용 |
| `Permissions-Policy` | Browser Feature 사용 | 불필요한 Camera/Location 등 Capability 노출 |
| `Referrer-Policy` | 다음 요청의 Referer 정보 | Path/Query 등 Navigation 정보 과다 노출 |

## 적용 순서

Header를 한꺼번에 복사하기보다 Application의 자산·인증·Embedding 구조를 보고 각각 설계한다.

```text
1. Content 종류를 분류
   ├─ Immutable Asset
   ├─ HTML
   └─ Private/Sensitive Response

2. 필요한 Resource Origin 정리
   → CSP

3. 실제 필요한 Browser Feature만 허용
   → Permissions-Policy

4. 외부 Navigation에서 노출해도 되는 Referrer 범위 결정
   → Referrer-Policy

5. Browser DevTools와 Report로 검증
```

## 정리

네 Header를 "보안 점수 올리는 Header Set"으로 넣기보다 **각각 독립된 Browser 정책**으로 본다.

```text
Cache
→ 무엇을 저장·재사용할까

CSP
→ 무엇을 로드·실행할까

Permissions
→ 어떤 Browser Capability를 쓸까

Referrer
→ 다음 요청에 현재 URL을 얼마나 공개할까
```

정책의 이름보다 **어떤 Browser 결정에 영향을 주는 Header인지**를 먼저 잡으면, 값 하나를 복사하는 대신 서비스 구조에 맞는 설정을 설계할 수 있다.

## 참고

- [MDN — Cache-Control](https://developer.mozilla.org/docs/Web/HTTP/Headers/Cache-Control)
- [MDN — Content-Security-Policy](https://developer.mozilla.org/docs/Web/HTTP/Headers/Content-Security-Policy)
- [MDN — Permissions-Policy](https://developer.mozilla.org/docs/Web/HTTP/Headers/Permissions-Policy)
- [MDN — Referrer-Policy](https://developer.mozilla.org/docs/Web/HTTP/Headers/Referrer-Policy)
