---
title       : "apex와 www를 함께 서비스할 때 — Origin 분리와 오래된 Frontend Cache 진단"
description : "example.com과 www.example.com을 같은 서비스로 열었을 때 브라우저 관점에서는 별도 Origin이라는 점을 기준으로, 특정 Host에서만 오래된 HTML·Asset 문제가 나는 상황을 진단하고 canonical redirect로 통일하는 방법을 정리한다."
date        : 2026-04-24 10:00:00 +0900
updated     : 2026-09-06 11:00:00 +0900
categories  : [nginx, "HTTPS·SSL"]
tags        : [tls, cache, nginx, redirect, troubleshooting]
pin         : false
hidden      : false
---

`example.com`과 `www.example.com`이 같은 Backend를 바라본다고 해서 Browser에서도 하나의 상태 공간이 되는 것은 아니다.

```text
https://example.com
→ Origin A

https://www.example.com
→ Origin B
```

따라서 한쪽 Host만 오래된 Frontend 상태를 갖고 있거나 특정 Host에서만 문제가 재현된다면 **Server Process보다 먼저 Host별 Browser State와 Cache Policy를 분리해서 볼 필요가 있다.**

이 글은 실제로 `www`는 정상인데 apex에서만 Browser 문제가 반복된 상황을 기준으로 진단 흐름을 정리한다.

## 먼저 사실과 가설을 분리한다

관찰된 증상이 예를 들어 다음과 같다고 하자.

```text
www.example.com
→ 정상

example.com
→ Browser에서만 실패

curl
→ 두 Host 모두 Server Response 정상

Browser Data 삭제
→ 다시 정상
```

여기서 바로:

```text
90일마다 발생
→ Let's Encrypt가 90일짜리 Certificate
→ Certificate Renewal이 원인
```

이라고 결론 내리면 안 된다.

Certificate 갱신은 TLS Certificate를 바꾸는 작업이고, **그 자체가 Frontend HTML/JS Version을 변경하거나 Browser HTTP Cache를 무효화하는 원인은 아니다.**

주기가 우연히 Deployment, Maintenance, Restart 같은 다른 운영 이벤트와 겹쳤을 수 있으므로 시간 상관관계와 인과관계를 분리한다.

## 1. 같은 서비스여도 Host가 다르면 Origin이 다르다

Origin은:

```text
scheme + host + port
```

로 구분된다.

따라서:

```text
https://example.com
≠
https://www.example.com
```

이다.

대표적으로 다음 상태가 독립될 수 있다.

```text
Local Storage
Session Storage
Service Worker Scope
Cookie Scope(설정에 따라)
HTTP Cache Entry(URL 기준)
```

HTTP Cache도 Resource URL이 다르면 별도 Entry다.

```text
https://example.com/main.js
https://www.example.com/main.js
```

은 서로 다른 URL이다.

따라서 평소 `www`만 사용하고 apex는 가끔 접근한다면 apex 쪽 Browser State가 훨씬 오래 남아 있을 수 있다.

## 2. 먼저 Server 문제와 Browser 문제를 분리한다

### TLS Certificate 확인

두 Host가 Certificate SAN에 포함되는지 본다.

```bash
openssl s_client \
  -connect example.com:443 \
  -servername example.com </dev/null 2>/dev/null \
  | openssl x509 -noout -subject -issuer -ext subjectAltName
```

`www`도 별도로 확인한다.

### DNS 확인

```bash
dig example.com +short
dig www.example.com +short
```

같은 IP여야 한다는 규칙은 아니지만, 현재 의도한 Routing과 일치하는지 본다.

### HTTP Response 확인

```bash
curl -sI https://example.com
curl -sI https://www.example.com
```

Browser에서는 실패하지만 fresh `curl` 요청은 정상이라면 다음 질문이 생긴다.

```text
Server가 현재 잘못된 응답을 만드는가?
        ↓ 아니면
Browser가 과거 상태를 재사용하는가?
```

## 3. Cache는 HTML과 Hash Asset을 같은 정책으로 두지 않는다

Frontend Build에서 흔한 구조는:

```text
index.html
   ↓
main.a1b2c3.js
styles.d4e5f6.css
```

Hash가 붙은 Asset은 Content가 바뀌면 URL도 바뀌므로 긴 Cache를 주기 좋다.

```http
Cache-Control: public, max-age=31536000, immutable
```

반대로 `index.html`은 **새 Asset URL을 가리키는 진입점**이므로 긴 Fresh Cache를 주면 문제가 생길 수 있다.

```text
오래된 index.html
      ↓
과거 main.oldhash.js 참조
      ↓
Server에서 과거 Asset 제거됨
      ↓
404 / Application Load 실패
```

따라서 진단할 때는 "Cache TTL이 길다" 한 줄보다 **어떤 Resource에 긴 Cache가 붙었는지**를 본다.

```bash
curl -I https://example.com/
curl -I https://example.com/main.a1b2c3.js
```

HTML과 Hash Asset의 `Cache-Control`을 따로 확인한다.

## 4. Browser Data 삭제로 해결된다면 어떤 상태가 사라졌는지 좁힌다

"Browser Data 삭제 → 해결"은 Browser-side State 문제라는 강한 단서지만 정확한 원인을 하나로 확정해주진 않는다.

삭제되는 것은 환경에 따라:

```text
HTTP Cache
Cookie
Local Storage
Service Worker / Cache Storage
기타 Site Data
```

등 여러 종류일 수 있다.

따라서 DevTools에서 다음을 따로 확인한다.

```text
Network
→ Disable cache 상태와 비교

Application
→ Local/Session Storage
→ Service Workers
→ Cache Storage
→ Cookies
```

특히 Service Worker가 있는 Application은 일반 HTTP Cache 외에 별도 Cache Storage를 사용할 수 있다.

## 5. apex와 www를 둘 다 서비스해야 하는 이유가 없다면 Canonical Host로 통일한다

같은 Application을 두 Host에서 똑같이 서비스할 필요가 없다면 한쪽을 Canonical Host로 정하는 것이 단순하다.

예를 들어 `www.example.com`으로 통일한다.

### HTTP

```nginx
server {
    listen 80;
    server_name example.com www.example.com;

    return 301 https://www.example.com$request_uri;
}
```

### HTTPS apex → www

```nginx
server {
    listen 443 ssl;
    server_name example.com;

    ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    return 301 https://www.example.com$request_uri;
}
```

### HTTPS www — 실제 Application

```nginx
server {
    listen 443 ssl;
    server_name www.example.com;

    ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8080;
    }
}
```

적용 전후:

```bash
sudo nginx -t
sudo systemctl reload nginx

curl -I https://example.com/foo
```

Redirect의 `Location`이 의도한 Canonical Host를 가리키는지 확인한다.

## 6. Redirect는 Cache Policy 자체를 고치는 대체재는 아니다

Canonical Redirect는:

```text
사용자가 앞으로 어느 Host를 쓰는지
```

를 하나로 통일한다.

하지만 `index.html`에 잘못된 장기 Cache Policy가 있다면 그 문제는 별도로 수정해야 한다.

```text
Canonical Host
→ Origin/URL 다양성 축소

적절한 Cache-Control
→ Version별 Resource 수명 관리
```

두 문제를 분리한다.

## 7. TLS Renewal과 Application Deployment도 분리한다

운영 자동화가 다음처럼 묶여 있을 수는 있다.

```text
Certificate Renewal
        ↓ 어떤 Script/Job
Nginx Reload
        +
Application Deploy
```

하지만 이것은 **해당 운영 Pipeline의 구현**이지 Let's Encrypt 자체의 동작이 아니다.

주기적 장애가 Certificate 갱신 시점과 겹친다면:

```text
Certbot Log
Deploy Log
Nginx Reload 시간
Frontend Build Artifact 변경 시간
Browser Cache Header
```

를 같은 Timeline에 놓고 실제 인과를 확인한다.

## 진단 순서

```text
1. apex와 www의 DNS/TLS가 정상인가?
2. fresh HTTP Client에서 두 Host 응답이 다른가?
3. Browser에서 Disable Cache하면 정상인가?
4. HTML과 Hash Asset의 Cache-Control은 각각 무엇인가?
5. Service Worker / Cache Storage가 있는가?
6. Canonical Host 없이 두 Origin을 계속 서비스할 이유가 있는가?
7. 반복 주기가 특정 Deploy/Renewal Job과 실제로 연결되는가?
```

이 순서로 보면 "90일마다 뭔가 이상하다"는 관찰을 특정 원인으로 성급하게 고정하지 않을 수 있다.

## 정리

apex와 `www` 문제의 핵심은 Nginx에서 같은 `server`에 적었느냐가 아니라 **Browser에서는 Host가 다르면 별도의 Origin과 URL 공간이라는 것**이다.

```text
두 Host 운영
→ Browser State도 두 벌

오래된 HTML Cache
→ 과거 Asset 참조 위험

Canonical Redirect
→ 사용자 진입 Host 통일

Cache-Control
→ Resource 수명 별도 해결
```

**증상 주기와 Certificate 유효기간이 같아 보여도 먼저 상관관계와 인과관계를 분리하고, 실제 Cache Entry·Deployment Timeline으로 확인하는 것**이 중요하다.

## nginx HTTPS 시리즈

| 글 | 다루는 것 |
|---|---|
| [Let's Encrypt + Nginx — 인증서 수명주기](./2025-04-02-letsencrypt.md) | Challenge 선택 → 발급 → Renewal → Reload → 외부 TLS 검증 |
| [nginx SSL 인증서 운영](./2026-04-22-nginx-ssl-operations.md) | 인증서 배치, reload/restart, process 복구 |
| [특정 IP에서 HTTPS 강제 우회하기](./2025-07-21-nginx-skip-https-for-ip.md) | 내부 Probe 같은 예외 Routing |
| **apex/www Origin과 Cache (현재 글)** | Host별 Browser State와 Canonical Redirect |
