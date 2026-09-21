# HTTP 응답 정책 헤더 — Cache, CSP, Permissions, Referrer

## 이 문서에서 되짚을 질문

- `Cache-Control`, CSP, Permissions-Policy, Referrer-Policy는 모두 보안 Header인가?
- 각각 Browser의 어떤 결정을 제어하는가?
- `no-cache`와 `no-store`는 어떻게 다른가?
- Cache의 Freshness와 Revalidation은 어떻게 다른가?
- CSP의 `default-src`, `frame-src`, `frame-ancestors`는 어떤 관계인가?
- CSP는 XSS를 완전히 막는가?
- Permissions-Policy Header와 `iframe allow`는 어떤 관계인가?
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

`Cache-Control`은 본래 Cache 동작을 제어하는 HTTP 정책이고, 나머지 Header와 목적 자체가 다르다. 다만 민감한 Response의 저장 여부처럼 보안과 직접 연결되는 지점이 있다.

### SOP/CORS와 CSP를 먼저 구분한다

둘 다 "다른 Origin의 무언가를 Page가 사용한다"는 점 때문에 비슷해 보인다. **자원과 데이터로 나누지 말고, Browser가 무엇을 하려는지**로 구분한다.

```text
CSP
→ Resource를 특정 용도로 로드·실행할 수 있는가?

SOP / CORS
→ JavaScript가 다른 Origin의 내용을 읽고 접근할 수 있는가?
```

같은 URL을 사용해도 Browser가 하려는 일이 다르면 적용되는 정책도 달라진다.

```html
<script src="https://other.example/a.js"></script>
```

```text
other.example/a.js를 Script로 로드·실행
→ CSP
```

반면 같은 URL을 `fetch()`하면:

```javascript
fetch("https://other.example/a.js")
```

```text
other.example/a.js의 Response 내용을
JavaScript가 읽으려 함
→ SOP / CORS
```

즉 핵심은 **특정 API나 URL을 어느 정책 하나에 대응시키는 것이 아니라, 각 정책이 어느 단계의 무엇을 제한하는지 보는 것**이다.

> **CSP = 로드·실행 권한, SOP/CORS = Cross-Origin 내용 접근 권한**

SOP는 Cross-Origin 상호작용의 기본 보안 경계이고, CORS는 서버가 허용한 Cross-Origin Response를 JavaScript에 공유할 수 있도록 하는 메커니즘이다.

### 같은 `fetch()`에도 CSP와 CORS가 함께 적용될 수 있다

`fetch()`를 무조건 CORS의 예로만 외우면 안 된다. CSP의 `connect-src`도 `fetch()`가 연결할 수 있는 목적지를 제한할 수 있다.

```javascript
fetch("https://api.example.com/data")
```

```text
1. CSP connect-src
   "api.example.com으로 연결해도 되는가?"
        ↓ 허용

2. Request / Response
        ↓

3. SOP / CORS
   "Cross-Origin Response를
    JavaScript가 읽어도 되는가?"
```

따라서 둘은 우선순위를 두고 하나만 적용하는 정책이 아니라 **서로 다른 단계에서 모두 통과해야 할 수 있는 정책**이다.

```text
CSP      → 가도 돼?        → 행동 / 연결·Resource 사용 제한
SOP/CORS → 받아온 거 읽어도 돼? → Cross-Origin 결과 접근 제한
```

CSP에서 막히면 요청 자체가 진행되지 않을 수 있고, CSP를 통과해 Response가 오더라도 CORS가 허용하지 않으면 JavaScript는 그 Response를 읽을 수 없다.

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

Cache를 이해할 때는 **저장 → Freshness → Revalidation**을 분리한다.

```text
Response 저장
   ↓
아직 Fresh한가?
   ├─ Yes → 저장된 Response 재사용
   └─ No / no-cache
          ↓
       Revalidation
          ↓
     변경 없음 → 304 Not Modified
     변경됨   → 새 Response
```

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
ETag: "v42"
```

`no-cache`는 "저장 금지"가 아니라 **재사용 전에 Revalidation하라**는 의미다.

Revalidation에는 대표적으로 다음 Validator가 사용된다.

```text
ETag
→ Resource Version을 식별
→ If-None-Match로 검증

Last-Modified
→ 마지막 변경 시각
→ If-Modified-Since로 검증
```

변경되지 않았다면 Server는 본문 전체를 다시 보내지 않고 `304 Not Modified`로 기존 Cache를 재사용하게 할 수 있다.

따라서 다음 둘은 완전히 다른 의미다.

```text
no-cache
→ 저장 O
→ 재사용 전 검증 O

no-store
→ 저장 자체를 피하도록 지시
```

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

### `default-src`는 여러 Fetch Directive의 Fallback이다

`default-src`는 모든 CSP Directive의 공통 부모가 아니다. 주로 Resource Fetch 계열 Directive가 생략됐을 때 Fallback으로 사용된다.

```http
Content-Security-Policy: default-src 'self'; img-src https://img.example.com
```

이 경우:

```text
script-src 없음
→ default-src 'self' 적용

font-src 없음
→ default-src 'self' 적용

img-src 있음
→ img-src 정책 적용
```

하지만 `frame-ancestors`처럼 `default-src`로 Fallback되지 않는 Directive도 있다.

즉 CSP도 **Directive마다 어떤 결정을 제어하는지**를 먼저 본다.

### `frame-src`와 `frame-ancestors`

이 둘은 이름이 비슷하지만 방향이 반대다.

```text
frame-src
→ 내가 어떤 Frame을 불러올 수 있는가?

frame-ancestors
→ 누가 나를 Frame 안에 넣을 수 있는가?
```

```http
Content-Security-Policy: frame-src https://video.example.com; frame-ancestors 'self'
```

`frame-ancestors`는 Clickjacking 방어에 사용할 수 있으며, 과거의 `X-Frame-Options`보다 허용 대상을 더 세밀하게 표현할 수 있다.

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

### Header와 `iframe allow`는 상하 제한 관계다

Top-level Response의 `Permissions-Policy`와 개별 `iframe`의 `allow`는 서로 대체 관계가 아니다.

```http
Permissions-Policy: geolocation=(self "https://map.example.com")
```

```html
<iframe
  src="https://map.example.com"
  allow="geolocation">
</iframe>
```

개념적으로는 다음과 같다.

```text
Response Header
→ Document와 하위 Frame이 가질 수 있는 상위 허용 범위

iframe allow
→ 특정 Frame에서 그 범위를 추가로 제한
```

Parent Policy에서 이미 Feature를 금지했다면 Child Frame이 `allow`로 다시 넓힐 수 없다.

즉 **상위 정책이 최대 범위를 정하고, 하위 Frame은 그 안에서 더 좁힐 수 있다.**

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

현재 일반적인 기본 정책은 `strict-origin-when-cross-origin`이다.

```text
https://app.example.com/account?id=123
        ↓ Same-Origin
https://app.example.com/api

Referer
→ Origin + Path + Query가 전달될 수 있음
```

반면 Cross-Origin으로 이동하면:

```text
https://app.example.com/account?id=123
        ↓ Cross-Origin
https://external.example/

Referer
→ https://app.example.com/
```

즉 `strict-origin-when-cross-origin`은 Cross-Origin에서 Path와 Query 노출을 줄인다.

URL의 Path나 Query에 민감정보를 넣지 않는 것이 우선이지만, Referrer-Policy는 의도하지 않은 Navigation 정보 노출을 줄이는 추가 경계가 된다.

### Same-Origin과 Same-Site를 섞지 않는다

Referrer-Policy의 `same-origin` 판단에서 중요한 기준은 **Same-Origin**이다.

```text
https://app.example.com/a
→ https://app.example.com/b
Same Origin

https://app.example.com
→ https://api.example.com
Origin은 다름
```

두 Subdomain이 Same-Site로 취급될 수 있는 경우라도 Origin은 다를 수 있다.

따라서 Cookie의 SameSite 개념과 Referrer-Policy의 Same-Origin 경계를 섞지 않는다.

## 6. 네 정책을 한 번에 비교한다

| Header | Browser가 결정하는 것 | 대표 위험 |
|---|---|---|
| `Cache-Control` | Response 저장·재사용 | 오래된 Content, Shared Cache 정보 혼선 |
| `Content-Security-Policy` | Resource Load·Script Execution | XSS 영향 확대, 불필요한 외부 Resource 허용 |
| `Permissions-Policy` | Browser Feature 사용 | Camera·Location 등 Capability 과다 노출 |
| `Referrer-Policy` | 다음 요청의 Referer 정보 | Path·Query 등 Navigation 정보 과다 노출 |

이 네 정책은 모두 Browser 동작에 영향을 줄 수 있지만 **제어 대상이 서로 다르다.**

## 7. 적용 순서

Header 값을 복사해서 한꺼번에 넣기보다 Application 구조에 맞춰 각각 설계한다.

```text
1. Content 종류 분류
   ├─ Immutable Asset
   ├─ HTML
   └─ Private / Sensitive Response
   → Cache-Control

2. 필요한 Resource Origin 정리
   → CSP

3. 실제 필요한 Browser Feature만 허용
   → Permissions-Policy

4. 외부 Navigation에서 노출할 Referrer 범위 결정
   → Referrer-Policy

5. DevTools와 Report로 검증
```

특히 CSP와 Permissions-Policy는 처음부터 무작정 강하게 설정하기보다 실제 Resource와 Embedded Content 의존성을 확인하면서 좁혀간다.

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

세부적으로 한 단계 더 들어가면:

```text
Cache
→ 저장 / Freshness / Revalidation

CSP
→ Resource Source / Execution / Embedding

Permissions
→ Document / Frame별 Capability

Referrer
→ Same-Origin / Cross-Origin별 URL 노출 범위
```

이 네 Header를 하나의 "보안 점수용 설정"으로 보지 않고, 각각 독립된 Browser Policy로 이해한다.

## 기억·인출 장치

```text
Cache       → 저장
CSP         → 실행
Permissions → 기능
Referrer    → 노출
```

그리고 한 단계 더 복원한다.

```text
Cache       → 저장했으면 언제 다시 검증하지?
CSP         → 무엇을 어디서 가져와 실행하지?
Permissions → 어느 Document / Frame이 기능을 쓰지?
Referrer    → 다음 Origin에 URL을 어디까지 보여주지?
```

정책 이름보다 **Browser의 어떤 결정에 영향을 주는가**를 먼저 떠올린다.
