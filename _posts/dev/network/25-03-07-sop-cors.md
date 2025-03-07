---
title       : SOP(Same-Origin Policy) vs CORS(Cross-Origin Resource Sharing)
description : >-
    SOP(Same-Origin Policy)와 CORS(Cross-Origin Resource Sharing)에 대해 기록합니다.
date        : 2025-03-07 08:41:19 +0900
updated     : 2025-02-21 22:50:42 +0900
categories  : [dev, network]
tags        : [http, cors, sop]
pin         : false
hidden      : false
---

## Same Origin vs Cross Origin
- Origin은 프로토콜, 도메인, 포트로 구성되어 있다.
- Same-Origin은 이 세 가지가 모두 동일한 경우를 말하며, Cross-Origin은 이 세 가지 중 하나라도 다른 경우를 말한다.

| 출처1 | 출처2 | Same-Origin? |
|---|---|---|
| http://example.com | http://example.com | true |
| http://example.com | http://example.com:8080 | false |
| http://example.com | https://example.com | false |
| http://example.com | http://sub.example.com | false |

## SOP(Same-Origin Policy)
- SOP는 웹 브라우저가 다른 Origin의 리소스에 접근하는 것을 제한하는 기본 보안 메커니즘이다.
- SOP는 Cross-Origin 요청을 제한하여 CSRF, XSS 등의 공격을 방지한다.

## CORS(Cross-Origin Resource Sharing)
- CORS는 위 SOP정책의 예외로 Cross-Origin 요청을 허용하는 메커니즘이다.
- 서버에서 허용하는 Origin을 설정을 헤더를 통해 응답하고, 브라우저에서 응답 헤더의 Origin을 체크하여 Cross-Origin 요청을 허용한다.

```sh
Access-Control-Allow-Origin: <origin> # Access-Control-Allow-Origin: http://example.com, https://example.com
```

| 헤더 | 설명 |
|---|---|
| Access-Control-Allow-Origin | 허용하는 Origin을 설정 |
| Access-Control-Allow-Methods | 허용하는 메서드를 설정 |
| Access-Control-Allow-Headers | 허용하는 헤더를 설정 |
| Access-Control-Max-Age | Preflight Request의 캐싱 시간을 설정 |

> origin 정보가 없는 경우 나머지 헤더는 무시된다.

## Preflight Request
- 브라우저가 실제 요청을 보내기 전에 OPTIONS 메서드로 사전 요청을 보내는 것을 말한다.
- 서버에서는 OPTIONS 메서드로 온 요청에 대한 응답으로 허용하는 Origin, 메서드, 헤더를 설정한다.

> [MDN SOP](https://developer.mozilla.org/ko/docs/Web/Security/Same-origin_policy) <br>
> [MDN CORS](https://developer.mozilla.org/ko/docs/Web/HTTP/CORS)