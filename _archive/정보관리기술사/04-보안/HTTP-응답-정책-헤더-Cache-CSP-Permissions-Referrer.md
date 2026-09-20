# HTTP 응답 정책 헤더 — Cache, CSP, Permissions, Referrer

## 이 문서에서 되짚을 질문

- `Cache-Control`, CSP, Permissions-Policy, Referrer-Policy는 모두 보안 Header인가?
- 각각 Browser의 어떤 결정을 제어하는가?
- `no-cache`와 `no-store`는 어떻게 다른가?
- CSP는 XSS를 완전히 막는가?
- Referrer-Policy에서 Same-Origin과 Same-Site를 왜 구분해야 하는가?

## 1. 먼저 네 정책의 역할을 분리한다

이 Header들은 모두 HTTP Response에 실릴 수 있지만 같은 문제를 해결하지 않는다.

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

즉 "보안 Header 묶음"으로 외우기보다 **Browser의 서로 다른 정책 경계 네 개**로 본다.

## 2. Cache-Control — 저장과 재사용 정책

대표 Directive는 다음과 같다.

| Directive | 의미 |
|---|---|
| `max-age=<s>` | Fresh로 간주할 시간 |
| `no-cache` | 저장은 가능하지만 재사용 전에 재검증 |
| `no-store` | 저장하지 않도록 지시 |
| `public` | Shared Cache에도 저장 가능함을 명시 |
| `private` | Private Cache용 |
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

Content Hash가 파일명에 들어간 자산은 URL 자체가 Version이 되므로 긴 Freshness를 주기 좋다.

### HTML

HTML은 새 배포 때 새로운 Asset URL을 가리켜야 하므로 장기 Fresh Cache가 배포 반영을 늦출 수 있다.

```http
Cache-Control: no-cache
```

`no-cache`는 "저장 금지"가 아니라 **재사용 전에 Revalidation하라**는 의미다.

### 개인화 응답

```text
민감해서 저장 자체를 피하고 싶다
→ no-store 검토

Browser Cache는 허용하지만 Shared Cache는 막고 싶다
→ private
```

인증 응답이라고 무조건 `no-store`를 적용하기보다 데이터 민감도와 서비스 요구를 함께 본다.

## 3. CSP — Resource Loading과 Script Execution 정책

CSP(Content-Security-Policy)는 Browser가 어떤 출처와 형태의 Content를 로드·실행할지 제한하는 방어층이다.

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

CSP는 XSS 위험을 줄이는 중요한 Defense-in-Depth 수단이지만 **출력 Encoding, 안전한 DOM API, Sanitization을 대신하는 단일 방어책은 아니다.**

### Inline Script와 Nonce / Hash

Response마다 예측하기 어려운 Nonce를 만들고 Header와 허용할 Script에 같은 값을 넣을 수 있다.

```http
Content-Security-Policy: script-src 'self' 'nonce-randomValue'
```

```html
<script nonce="randomValue">
  bootstrap();
</script>
```

정적 Inline Script라면 Content Hash를 허용 정책에 넣을 수도 있다.

### `'unsafe-inline'`

`'unsafe-inline'`은 Inline Script 허용 범위를 크게 넓혀 XSS 방어 효과를 약화시킨다. 다만 이것 하나가 CSP 전체 정책을 완전히 무효화한다고 단정해서도 안 된다. 다른 Directive는 각각 별도 의미를 가진다.

### Report-Only

기존 서비스에서는 바로 차단하기보다 다음 Header로 먼저 위반을 관찰할 수 있다.

```http
Content-Security-Policy-Report-Only: ...
```

관찰 결과를 보고 실제 Enforcement Policy로 이동한다.

## 4. Permissions-Policy — Browser Feature 사용 범위

Permissions-Policy는 Camera, Microphone, Geolocation 같은 Browser Feature를 현재 Document와 Embedded Content가 사용할 수 있는 범위를 제한한다.

```http
Permissions-Policy: camera=(), microphone=(), geolocation=(self)
```

```text
camera=()
→ Camera 사용 금지

geolocation=(self)
→ Same Origin 범위 허용
```

핵심 질문은 다음이다.

> 이 Origin / Frame이 해당 Browser Capability를 사용할 필요가 있는가?

필요하지 않은 Feature는 최소 권한 원칙으로 제한한다.

## 5. Referrer-Policy — URL 정보 노출 범위

Browser는 다음 요청의 `Referer` Header에 현재 Page 정보를 넣을 수 있다. Referrer-Policy는 그 노출 범위를 조절한다.

| Policy | 개념 |
|---|---|
| `no-referrer` | Referer를 보내지 않음 |
| `same-origin` | Same-Origin 요청에만 전송 |
| `origin` | Origin 정보만 전송 |
| `strict-origin` | 보안 수준이 낮아지는 전환에는 보내지 않고 그 외에는 Origin만 |
| `strict-origin-when-cross-origin` | Same-Origin에는 전체 URL, Cross-Origin에는 Origin만, HTTPS→HTTP에는 미전송 |
| `unsafe-url` | 가능한 경우 전체 URL 전송 |

중요한 기준은 Same-Site가 아니라 **Same-Origin**이다.

```text
https://app.example.com/a
→ https://app.example.com/b
Same Origin

https://app.example.com
→ https://api.example.com
Origin은 다름
```

## 6. 네 정책을 한 번에 비교한다

| Header | Browser가 결정하는 것 | 대표 위험 |
|---|---|---|
| `Cache-Control` | Response 저장·재사용 | 오래된 Content, Shared Cache 정보 혼선 |
| `Content-Security-Policy` | Resource Load·Script Execution | XSS 영향 확대, 불필요한 외부 Resource 허용 |
| `Permissions-Policy` | Browser Feature 사용 | Camera·Location 등 Capability 과다 노출 |
| `Referrer-Policy` | 다음 요청의 Referer 정보 | Path·Query 등 Navigation 정보 과다 노출 |

## 7. 적용 순서

Header 값을 복사해서 한꺼번에 넣기보다 Application 구조에 맞춰 각각 설계한다.

```text
1. Content 종류 분류
   ├─ Immutable Asset
   ├─ HTML
   └─ Private / Sensitive Response

2. 필요한 Resource Origin 정리
   → CSP

3. 실제 필요한 Browser Feature만 허용
   → Permissions-Policy

4. 외부 Navigation에서 노출할 Referrer 범위 결정
   → Referrer-Policy

5. DevTools와 Report로 검증
```

## 8. 기술사 관점 핵심 경계

```text
Cache
→ 무엇을 저장·재사용할까

CSP
→ 무엇을 로드·실행할까

Permissions
→ 어떤 Browser Capability를 사용할까

Referrer
→ 다음 요청에 현재 URL을 얼마나 공개할까
```

이 네 Header를 하나의 "보안 점수용 설정"으로 보지 않고, 각각 독립된 Browser Policy로 이해한다.

## 기억·인출 장치

```text
Cache      → 저장
CSP        → 실행
Permissions→ 기능
Referrer   → 노출
```

정책 이름보다 **Browser의 어떤 결정에 영향을 주는가**를 먼저 떠올린다.
