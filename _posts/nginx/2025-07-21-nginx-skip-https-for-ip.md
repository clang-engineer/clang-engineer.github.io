---
title       : "Nginx에서 특정 Client만 HTTPS Redirect 예외로 둘 때"
description : "HTTP→HTTPS 강제 Redirect가 기본인 Nginx에서 내부 Health Check 같은 특정 Source IP만 HTTP로 남겨야 할 때, 실제 Client IP 경계와 geo 기반 예외 Routing을 정리한다."
date        : 2025-07-21 22:50:42 +0900
updated     : 2026-09-06 11:10:00 +0900
categories  : [nginx, "요청·라우팅"]
tags        : [http, https, redirect, geo]
pin         : false
hidden      : false
---

일반 사용자 Traffic은 HTTPS로 강제하지만 내부 Health Check처럼 특정 Client만 HTTP Endpoint를 사용해야 하는 경우가 있다.

핵심은 "IP 하나를 if로 뺀다"가 아니라 먼저 **Nginx가 실제 Client IP를 보고 있는지, 그리고 HTTP 예외를 정말 만들어야 하는지**를 확인하는 것이다.

```text
HTTP Request
   ↓
실제 Source IP 식별
   ↓
예외 대상인가?
├─ yes → HTTP Endpoint 처리
└─ no  → HTTPS로 Redirect
```

## 먼저 예외가 필요한 이유를 확인한다

대표적인 경우:

- Load Balancer/Monitoring Probe가 HTTP `200`만 기대한다.
- 내부 관리망에서 별도의 HTTP Health Endpoint가 필요하다.
- Domain이 없는 단순 Probe라 HTTPS Hostname 검증을 구성하기 어렵다.

다만 "내부 IP니까 평문이어도 안전"이라고 자동으로 결론 내리지 않는다. Application Data를 그대로 HTTP로 노출하기보다 **Health Check 전용 Path만 예외로 두는 방식**도 먼저 검토한다.

## 가장 단순한 단일 IP 예외

```nginx
server {
    listen 80;
    server_name app.example.com;

    set $redirect_to_https 1;

    if ($remote_addr = 192.168.0.10) {
        set $redirect_to_https 0;
    }

    if ($redirect_to_https = 1) {
        return 301 https://$host$request_uri;
    }

    location /health {
        return 200 "ok\n";
    }
}
```

여기서 중요한 것은 두 `if`가 복잡한 Location 처리나 Proxy Routing을 수행하는 것이 아니라 변수 선택과 `return`에 한정된다는 점이다.

예외가 늘어나면 `if`를 계속 복제하지 않고 `geo`로 Source IP → 변수 Mapping을 분리하는 편이 낫다.

## 여러 IP/CIDR은 `geo`로 분리한다

`http` Context:

```nginx
geo $redirect_to_https {
    default        1;
    192.168.0.10   0;
    10.10.0.0/16   0;
}
```

Server:

```nginx
server {
    listen 80;
    server_name app.example.com;

    if ($redirect_to_https = 1) {
        return 301 https://$host$request_uri;
    }

    location = /health {
        return 200 "ok\n";
    }

    location / {
        return 403;
    }
}
```

구조가 명확해진다.

```text
Source IP Classification
→ geo

Redirect Decision
→ server

HTTP에서 실제 허용할 Resource
→ location
```

특정 내부 IP를 예외로 뒀더라도 HTTP 전체 Application을 열 필요가 없다면 `/health` 같은 필요한 Path만 허용한다.

## Reverse Proxy/LB 앞에서는 `$remote_addr`가 실제 사용자가 아닐 수 있다

Nginx 앞에 Load Balancer나 다른 Reverse Proxy가 있으면 TCP Peer는 사용자가 아니라 앞단 Proxy일 수 있다.

```text
Client
  ↓
Load Balancer
  ↓
Nginx

Nginx의 $remote_addr
→ 기본적으로 Load Balancer 주소
```

이 상태에서 `$remote_addr`를 Client Allowlist에 그대로 쓰면 의도와 다른 판단을 할 수 있다.

실제 Client IP를 복원해야 한다면 **신뢰할 Proxy 주소를 명시한 Real IP 설정**을 먼저 구성한다.

```nginx
set_real_ip_from 10.0.0.0/8;
real_ip_header X-Forwarded-For;
real_ip_recursive on;
```

여기서 `set_real_ip_from`을 너무 넓게 잡으면 외부 사용자가 위조한 Header를 신뢰할 수 있으므로 실제 신뢰 Proxy 대역만 넣는다.

즉 IP 예외 Routing의 전제는:

```text
현재 판단하는 IP가 누구의 IP인가?
```

가 먼저 해결돼 있다는 것이다.

## Hostname 없이 IP로 직접 접근하는 문제는 별도 축이다

HTTPS로 `https://203.0.113.10`처럼 IP에 직접 접근하면 Certificate SAN에 해당 IP가 없을 경우 Hostname Verification이 실패할 수 있다.

하지만 이 문제를 해결하기 위해 모든 IP 직접 접근을 HTTP로 허용할 필요는 없다.

대안은 상황에 따라:

```text
내부 DNS 이름 제공
Health Check에서 TLS 검증 가능한 Host 사용
Load Balancer 전용 Health Port/Path 구성
HTTP Health Path만 제한적으로 제공
```

등이 있다.

## 적용과 검증

```bash
sudo nginx -t
sudo systemctl reload nginx
```

예외 Client에서:

```bash
curl -i http://app.example.com/health
```

일반 Client에서:

```bash
curl -I http://app.example.com/foo
```

확인할 것은 단순 Status Code만이 아니다.

```text
예외 Client
→ 필요한 HTTP Path만 200인가?

일반 Client
→ HTTPS Location으로 Redirect되는가?

허용하지 않은 HTTP Path
→ 노출되지 않는가?
```

## 정리

특정 IP를 HTTPS Redirect에서 제외할 때의 순서는 다음이 안전하다.

```text
왜 HTTP 예외가 필요한가
        ↓
실제 Client IP를 보고 있는가
        ↓
geo로 허용 Source 분류
        ↓
필요한 HTTP Path만 허용
        ↓
나머지는 HTTPS Redirect 또는 차단
```

**IP 예외 자체보다 예외의 범위를 최소화하고, Nginx가 신뢰할 Source IP 경계를 정확히 잡는 것이 더 중요하다.**

## Nginx HTTPS 시리즈

| 글 | 다루는 것 |
|---|---|
| [Let's Encrypt + Nginx — 인증서 수명주기](/posts/nginx/2025-04-02-letsencrypt/) | Challenge 선택 → 발급 → Renewal → Reload → 외부 TLS 검증 |
| [Nginx TLS 운영](/posts/nginx/2026-04-22-nginx-ssl-operations/) | 인증서 배치, Private Key, Reload, Process 복구 |
| **특정 Client의 HTTP 예외 (현재 글)** | Source IP 경계와 제한된 예외 Routing |
| [apex/www Origin과 Cache](/posts/nginx/2026-04-24-nginx-apex-www-redirect/) | Host별 Browser State와 Canonical Redirect |
