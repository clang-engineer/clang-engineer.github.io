---
title       : "Nginx 설정: 특정 IP에 대해 HTTPS 리다이렉트 제외"
description : "특정 클라이언트 IP에서 오는 요청은 HTTP 그대로 처리하고 나머지는 HTTPS로 리다이렉트하는 nginx 설정"
date        : 2025-07-21 22:50:42 +0900
updated     : 2026-07-03
categories  : [nginx, "요청·라우팅"]
tags        : [http, https]
pin         : false
hidden      : false
---

보통 HTTP(80)로 들어온 요청은 무조건 HTTPS(443)로 301 리다이렉트하는 게 기본이다. 그런데 특정 클라이언트 IP만 리다이렉트에서 빼고 HTTP 그대로 응답해야 하는 경우가 있다.

## 왜 특정 IP만 HTTPS 리다이렉트에서 빼는가

- **헬스체크 / 내부 프로브**: 로드밸런서나 모니터링 에이전트가 `http://서버IP/health` 로 상태를 찔러본다. 이때 301이 돌아오면 헬스체크가 "정상 200"이 아니라 리다이렉트로 판정되어 실패로 처리되는 경우가 있다.
- **도메인이 아닌 IP 직접 접근**: 내부망에서 도메인 없이 IP로 붙는 경우, HTTPS로 넘겨봐야 인증서의 CN/SAN은 `yourdomain.com` 이라 IP와 이름이 안 맞아 인증서 검증 에러(cert name mismatch)만 난다. 차라리 HTTP로 응답하는 편이 낫다.
- **사내 모니터링 / 특정 클라이언트**: 신뢰된 내부 IP 대역에서 오는 트래픽만 평문으로 처리하고, 외부 사용자는 전부 HTTPS로 강제하고 싶을 때.

즉 "외부는 전부 HTTPS 강제, 신뢰된 특정 IP만 예외" 라우팅 패턴이다.

## 설정 예시

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # 기본값: 리다이렉트한다
    set $redirect_to_https 1;

    # 예외 IP(예: 192.168.0.1)면 리다이렉트 끄기
    if ($remote_addr = 192.168.0.1) {
        set $redirect_to_https 0;
    }

    # 플래그가 켜져 있으면 HTTPS로 301
    if ($redirect_to_https = 1) {
        return 301 https://$host$request_uri;
    }

    # 여기까지 왔다는 건 예외 IP → HTTP 그대로 서비스
    location / {
        return 200 "You are using HTTP from an allowed IP.\n";
    }
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate     /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    location / {
        return 200 "You are using HTTPS.\n";
    }
}
```

디렉티브별로 하는 일:

- `set $redirect_to_https 1;` — 변수를 하나 두고 기본값을 "리다이렉트함(1)"으로 잡는다.
- `if ($remote_addr = 192.168.0.1)` — 요청의 소스 IP가 예외 IP면 플래그를 0으로 덮어쓴다.
- `if ($redirect_to_https = 1) { return 301 ... }` — 플래그가 1일 때만 HTTPS로 301 영구 리다이렉트. 0이면 이 블록을 건너뛴다.
- `$host$request_uri` — 원래 요청한 호스트와 경로·쿼리를 그대로 유지한 채 스킴만 https로 바꿔 넘긴다.
- 443 서버 블록 — 정상 HTTPS 요청을 받아 인증서로 처리하는 별도 가상 서버.

## `if`를 써도 되는가 — "if is evil" 짚고 넘어가기

nginx에는 [If Is Evil](https://nginx.org/en/docs/http/ngx_http_rewrite_module.html#if) 이라는 유명한 경고가 있다. 다만 이 경고는 **`location` 블록 안에서의 `if`** 를 겨냥한 것이다. location 컨텍스트에서 `if` 안에 `proxy_pass`, `try_files` 같은 걸 넣으면 예측 못 한 동작이 나기 때문에 위험하다. location 안에서 100% 안전하게 보장되는 건 `return ...` 과 `rewrite ... last` 정도뿐이다.

이 글의 설정은 **`server` 컨텍스트에서 `set` 과 `return`만** 쓴다. 이건 위 경고가 문제 삼는 케이스가 아니고, 실무에서 널리 쓰이는 안전한 패턴이다. 그러니 이 정도는 그대로 써도 된다.

### 예외 IP가 늘어나면: `geo` 로 정리

예외 IP가 하나면 `if` 로 충분하지만, IP나 대역이 여러 개로 늘면 `geo` 모듈로 매핑을 빼는 편이 훨씬 깔끔하다. `geo`는 IP → 변수 매핑에 특화돼 있고 CIDR 대역도 그대로 받는다.

```nginx
# http 블록 레벨에 선언
geo $redirect_to_https {
    default        1;      # 기본은 리다이렉트
    192.168.0.1    0;      # 예외 IP
    10.0.0.0/8     0;      # 예외 대역
}

server {
    listen 80;
    server_name yourdomain.com;

    # 플래그가 1일 때만 HTTPS로
    if ($redirect_to_https = 1) {
        return 301 https://$host$request_uri;
    }

    location / {
        return 200 "You are using HTTP from an allowed IP.\n";
    }
}
```

IP 판별 로직이 `geo` 블록 한곳에 모여 server 블록에는 `if` 하나만 남는다. 예외 목록 관리도 이쪽이 편하다.

## nginx HTTPS 시리즈

| 글 | 다루는 것 |
| --- | --- |
| [Let's Encrypt + Nginx 운영 가이드](/posts/nginx/2025-04-02-letsencrypt/) | 발급 방식 비교, fullchain, webroot 전환, HSTS 캐시 함정 |
| [nginx HTTPS 운영 — 재시작·포트·인증서 검증](/posts/nginx/2026-04-22-nginx-ssl-operations/) | reload vs restart, 포트 점유 해결, 인증서 체인 확인 |
| **특정 IP에서 HTTPS 강제 우회하기 (현재 글)** | 사내 모니터링 IP 같은 예외 라우팅 패턴 |
| [Apex ↔ www 도메인 통일과 캐시 문제](/posts/nginx/2026-04-24-nginx-apex-www-redirect/) | 한쪽으로 통합해 origin 분리·캐시 불일치 차단 |