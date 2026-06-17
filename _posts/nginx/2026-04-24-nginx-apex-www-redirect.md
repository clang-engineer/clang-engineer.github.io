---
title       : "nginx apex/www 도메인 분리로 인한 캐시 문제와 해결"
description : "apex와 www를 동일 server 블록에서 서비스하면 origin 분리로 90일 주기 HTTP 500이 터지는 이유와 리다이렉트 해법"
date        : 2026-04-24 10:00:00 +0900
updated     : 2026-04-24 10:00:00 +0900
categories  : [nginx, "HTTPS·SSL"]
tags        : [tls, cache, jhipster, letsencrypt, troubleshooting]
pin         : false
hidden      : false
---

`example.com`과 `www.example.com`을 동일하게 처리하면 90일 주기로 HTTP 500 에러가 발생할 수 있다.

## 증상

- `www.example.com` 정상 작동
- `example.com` HTTP 500 에러
- **90일 주기**로 반복 발생
- 브라우저 데이터 삭제하면 해결

## 근본 원인: 하나의 서비스, 두 개의 origin

### 잘못된 nginx 설정
```nginx
server {
    listen 443 ssl;
    server_name example.com www.example.com;  # 둘 다 같이 처리
    ...
}
```
nginx 입장에선 같은 서비스지만, **브라우저 입장에선 완전히 다른 사이트**다.

### 브라우저의 origin 정책
```
https://example.com      →  origin A
https://www.example.com  →  origin B
```

| 리소스 | origin A (example.com) | origin B (www.example.com) |
|--------|---------------------|-------------------------|
| localStorage | 별도 | 별도 |
| 캐시 | 별도 | 별도 |
| 쿠키 | `.example.com` 설정 아니면 별도 | 별도 |
| Service Worker | 별도 | 별도 |

**사용자가 둘 다 접속한 적 있으면, 각각 다른 버전의 JS/CSS가 캐시됨.**

### JHipster의 공격적인 캐시 설정
```yaml
# application-prod.yml
jhipster:
  http:
    cache:
      timeToLiveInDays: 1461  # 4년!
```
정적 파일에 4년짜리 `Cache-Control: max-age=126230400` 헤더가 붙음.

## 90일 주기의 비밀: Let's Encrypt + 캐시 불일치

```
평소: www.example.com 사용 (origin B)
    ↓
Let's Encrypt 인증서 갱신 (90일 주기)
    ↓
certbot이 nginx reload → 서버 재시작
    ↓
새 프론트엔드 배포될 수 있음 (JS 해시 변경)
    ↓
www.example.com 접속: 새 index.html → 새 JS 번들 다운로드 → 정상
    ↓
example.com 접속 (오랜만에):
  - 브라우저: "4년 캐시니까 서버에 안 물어봐도 되지"
  - 캐시된 구버전 index.html 사용
  - 구버전 HTML이 참조하는 JS 경로가 서버에 없음
  - 또는 구버전 JS가 새 API 호출 → 스키마 불일치
    ↓
HTTP 500 또는 앱 크래시
    ↓
브라우저 데이터 삭제 → 새로 다운로드 → 해결
```

## 진단 과정

### 1. SSL/DNS 문제 아님을 확인
```bash
# SSL 인증서: 둘 다 커버함
openssl s_client -connect example.com:443 -servername example.com 2>/dev/null \
  | openssl x509 -noout -text | grep -A1 "Subject Alternative Name"
# → DNS:example.com, DNS:www.example.com

# DNS: 같은 IP
dig example.com +short      # 203.0.113.10
dig www.example.com +short  # 203.0.113.10

# HTTP 응답: 서버 측에선 둘 다 200 OK
curl -sI https://example.com | head -1      # HTTP/1.1 200 OK
curl -sI https://www.example.com | head -1  # HTTP/1.1 200 OK
```

### 2. 쿠키/세션 문제 아님을 확인
- JWT 기반 인증 → 쿠키 없음
- JSESSIONID도 없음

### 3. 캐시 문제로 결론
- 서버 측 테스트는 항상 성공 (캐시 없이 요청)
- 브라우저에서만 실패 (캐시 사용)
- 브라우저 데이터 삭제하면 해결

## 해결: apex → www 리다이렉트

```nginx
# HTTP: 둘 다 www HTTPS로
server {
    listen 80;
    server_name example.com www.example.com;
    return 301 https://www.example.com$request_uri;
}

# HTTPS: apex → www 리다이렉트
server {
    listen 443 ssl;
    server_name example.com;
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    return 301 https://www.example.com$request_uri;
}

# HTTPS: www 실제 서비스
server {
    listen 443 ssl;
    server_name www.example.com;
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8080;
        # ...
    }
}
```

**각 server 블록에 SSL 설정 필요** — nginx는 블록 간 설정을 공유하지 않음.

## 적용 후

```bash
nginx -t && systemctl reload nginx
```

- 캐시 TTL(4년)은 그대로 둬도 됨
- 모든 사용자가 www로 통일 → origin 하나 → 캐시 불일치 원천 차단
- JHipster는 파일명에 해시 포함 (`main.abc123.css`) → 배포 시 새 파일 다운로드

## nginx HTTPS 시리즈

| 글 | 다루는 것 |
| --- | --- |
| [Let's Encrypt + Nginx 운영 가이드](/posts/nginx/2025-04-02-letsencrypt/) | 발급 방식 비교, fullchain, webroot 전환, HSTS 캐시 함정 |
| [nginx HTTPS 운영 — 재시작·포트·인증서 검증](/posts/nginx/2026-04-22-nginx-ssl-operations/) | reload vs restart, 포트 점유 해결, 인증서 체인 확인 |
| [특정 IP에서 HTTPS 강제 우회하기](/posts/nginx/2025-07-21-nginx-skip-https-for-ip/) | 사내 모니터링 IP 같은 예외 라우팅 패턴 |
| **Apex ↔ www 도메인 통일과 캐시 문제 (현재 글)** | 한쪽으로 통합해 origin 분리·캐시 불일치 차단 |
