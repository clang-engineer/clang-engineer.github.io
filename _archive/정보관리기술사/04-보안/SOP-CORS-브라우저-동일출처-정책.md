# SOP와 CORS — 브라우저 동일출처 정책과 Cross-Origin 허용

## 이 문서에서 되짚을 질문

- Origin은 무엇으로 구분하는가?
- SOP는 요청 자체를 막는가, 응답 읽기를 막는가?
- CORS는 Server-to-Server 연결을 열어주는 기능인가?
- Simple Request와 Preflight는 무엇으로 나뉘는가?
- Credential, Cookie 정책과 CORS는 어떤 관계인가?

## 1. 전체 흐름부터 본다

브라우저의 Cross-Origin 통신은 다음 구조로 이해하면 된다.

```text
웹 페이지 JavaScript
      ↓ Cross-Origin 요청
Browser
      ↓ 요청은 전송될 수도 있음
Server
      ↓ 응답 + CORS Header
Browser
      ↓ SOP/CORS 정책 검사
JavaScript가 응답을 읽을 수 있는가?
```

핵심은 CORS가 네트워크 연결을 여는 기능이 아니라 **브라우저가 Cross-Origin 응답을 JavaScript에 노출할지 판단할 수 있도록 서버가 허용 의사를 표현하는 HTTP 메커니즘**이라는 점이다.

## 2. Origin — scheme + host + port

Origin은 다음 세 요소의 조합이다.

```text
scheme + host + port
```

| URL A | URL B | Same Origin? |
|---|---|---|
| `http://example.com` | `http://example.com` | yes |
| `http://example.com` | `http://example.com:8080` | no |
| `http://example.com` | `https://example.com` | no |
| `http://example.com` | `http://sub.example.com` | no |

하나라도 다르면 Cross-Origin이다.

## 3. SOP — 브라우저의 기본 보안 경계

SOP(Same-Origin Policy)는 한 Origin에서 실행된 문서나 Script가 다른 Origin의 리소스와 상호작용할 수 있는 범위를 제한하는 브라우저 보안 정책이다.

중요한 점은 다음과 같다.

> Cross-Origin 요청 자체가 항상 전송 금지되는 것은 아니다.

`<img>`, `<form>` 같은 동작은 다른 Origin으로 요청을 보낼 수 있다. 그러나 JavaScript가 다른 Origin의 응답 내용을 자유롭게 읽는 것은 SOP의 제한을 받는다.

따라서 SOP는 다음처럼 이해한다.

```text
요청 전송 여부
≠
JavaScript가 응답을 읽을 수 있는지 여부
```

SOP가 CSRF와 XSS를 모두 해결하는 것도 아니다.

- CSRF: Cross-Origin 요청이 실제로 전송될 수 있다는 성질을 악용할 수 있으므로 SameSite Cookie, CSRF Token 등 별도 방어가 필요하다.
- XSS: 공격 Script가 신뢰된 Origin 안에서 실행되는 문제이므로 CSP, 출력 Encoding 등 별도 방어가 필요하다.

## 4. CORS — 서버가 허용 Origin을 표현한다

CORS(Cross-Origin Resource Sharing)는 서버가 HTTP 응답 Header를 통해 어떤 Origin의 브라우저 JavaScript에 응답 접근을 허용할지 표현하는 규칙이다.

```http
Access-Control-Allow-Origin: https://app.example.com
```

대표 Header는 다음과 같다.

| Header | 역할 |
|---|---|
| `Access-Control-Allow-Origin` | 응답 접근을 허용할 Origin |
| `Access-Control-Allow-Methods` | Preflight에서 허용할 Method |
| `Access-Control-Allow-Headers` | Preflight에서 허용할 Request Header |
| `Access-Control-Allow-Credentials` | Credential 포함 요청 허용 여부 |
| `Access-Control-Expose-Headers` | JavaScript에 추가 노출할 Response Header |
| `Access-Control-Max-Age` | Preflight 결과 Cache 시간 |

`Access-Control-Allow-Origin`에는 일반적으로 하나의 Origin 또는 `*`를 사용한다. 여러 Origin을 허용하려면 요청의 `Origin`을 Allowlist와 비교한 뒤 허용된 Origin을 응답에 반영한다.

## 5. Simple Request와 Preflight

Cross-Origin 요청이라고 항상 `OPTIONS`가 먼저 나가는 것은 아니다.

CORS safelist 조건을 만족하면 브라우저는 실제 요청을 바로 보낼 수 있다. 흔히 Simple Request라고 부른다.

대표 조건은 다음과 같다.

- Method가 `GET`, `HEAD`, `POST` 중 하나
- Script가 설정한 Request Header가 CORS-safelisted 범위 안
- `Content-Type`이 safelist 범위 안

반대로 다음은 Preflight를 유발하는 대표 사례다.

```text
PUT / PATCH / DELETE
Authorization 같은 non-safelisted Header
application/json Content-Type
```

흐름은 다음과 같다.

```text
Browser
  ↓ OPTIONS
Preflight Request
  ↓
Server가 Origin / Method / Header 허용 여부 응답
  ↓ 허용
Browser
  ↓
실제 Request
```

Preflight 여부는 요청이 "위험한가"라는 주관적 판단이 아니라 **요청 형식과 safelist 조건**으로 결정된다.

## 6. Preflight가 없어도 CORS 검사는 끝나지 않는다

Simple Request는 Preflight가 없다는 뜻이지 CORS 검사를 받지 않는다는 뜻이 아니다.

```text
Simple Request
→ 실제 Request 바로 전송
→ Response CORS Header 검사
→ 허용되지 않으면 JavaScript가 Response를 읽지 못함
```

따라서 Network 탭에서는 `200 OK`가 보여도 JavaScript에서는 CORS Error가 날 수 있다.

## 7. Credential과 Cookie 정책은 별도 축이다

Credential을 포함한 Cross-Origin 요청에서는 Client와 Server 설정이 함께 맞아야 한다.

Client:

```javascript
fetch('https://api.example.com/orders', {
  credentials: 'include'
});
```

Server:

```http
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Credentials: true
```

Credential 요청에서는 `Access-Control-Allow-Origin: *`를 사용할 수 없다.

또한 Cookie 전송 여부는 CORS만으로 결정되지 않는다.

```text
Cookie가 전송되는가?
→ Domain / Path / Secure / SameSite 정책

JavaScript가 Cross-Origin 응답을 읽을 수 있는가?
→ SOP + CORS
```

이 두 축을 섞지 않는다.

## 8. CORS는 브라우저 보안 모델이다

`curl`, Postman, Backend Server-to-Server 호출은 브라우저의 SOP 집행 대상이 아니다.

따라서 다음 상황은 정상적으로 가능하다.

```text
Postman에서는 성공
Browser에서는 CORS Error
```

이 경우 API 연결 자체보다 브라우저에 반환되는 CORS 정책을 확인한다.

## 9. 장애 진단 순서

### `No Access-Control-Allow-Origin header`

응답에 허용 Origin Header가 없거나 Error Response 경로에서 CORS 처리가 빠졌는지 확인한다.

### Preflight가 401/403

Security Filter가 `OPTIONS`를 실제 API Request처럼 막는지 확인한다.

```text
OPTIONS
  ↓
CORS 처리
  ↓
실제 Request의 인증·인가
```

### Origin 불일치

scheme, host, port를 모두 비교한다.

```text
http://localhost:3000
≠
http://localhost:8080
```

### Response Header가 JavaScript에서 보이지 않음

기본 노출 범위 밖 Header라면 `Access-Control-Expose-Headers`가 필요한지 확인한다.

## 10. 기술사 관점 핵심 경계

```text
SOP
→ Browser의 기본 Cross-Origin 보안 경계

CORS
→ Server가 그 경계 안에서 특정 Origin 접근을 허용한다고 표현하는 HTTP 규칙

Cookie Policy
→ Credential 자체가 전송되는 조건
```

진단할 때는 다음 순서로 복원한다.

```text
1. 두 URL의 Origin이 다른가?
2. Preflight가 필요한 형식인가?
3. OPTIONS가 성공하는가?
4. 실제 Response에 올바른 Allow-Origin이 있는가?
5. Credential / Cookie 정책이 맞는가?
6. 필요한 Response Header가 노출되는가?
```

## 기억·인출 장치

> **SOP는 기본 경계, CORS는 예외 허용 표현이다.**

CORS 문제를 볼 때는 "서버가 요청을 받았는가"와 "브라우저가 응답을 Script에 공개하는가"를 분리해서 본다.
