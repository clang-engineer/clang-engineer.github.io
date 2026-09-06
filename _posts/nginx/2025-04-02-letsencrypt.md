---
title       : "Let's Encrypt + Nginx — 발급보다 갱신 가능한 인증서 수명주기 만들기"
description : "Certbot의 nginx·webroot·standalone·DNS 인증 방식을 비교하고 인증서 발급→Nginx 적용→자동 갱신→dry-run→TLS 검증까지 운영 수명주기로 정리한다."
date        : 2022-02-05 09:32:27 +0900
updated     : 2026-09-06 10:55:00 +0900
categories  : [nginx, "HTTPS·SSL"]
tags        : [letsencrypt, certbot, tls, nginx]
redirect_from:
  - /posts/security/2025-04-02-letsencrypt/
pin         : false
hidden      : false
---

Let's Encrypt 운영에서 중요한 것은 인증서를 한 번 발급받는 것이 아니라 **같은 방식으로 자동 갱신되고, Nginx가 새 인증서를 실제로 사용하며, 만료 전에 실패를 발견할 수 있는 수명주기**를 만드는 것이다.

```text
Domain / DNS 준비
      ↓
ACME Challenge 방식 선택
      ↓
Certificate 발급
      ↓
Nginx에 full chain + private key 적용
      ↓
자동 Renewal
      ↓
성공 후 Reload
      ↓
Dry-run / 실제 TLS 검증
```

이 흐름이 잡혀 있으면 `certbot --nginx`냐 `--webroot`냐는 목적에 따른 구현 선택이 된다.

## 1. 먼저 ACME Challenge 방식을 고른다

Certbot의 대표 인증 방식은 다음처럼 구분할 수 있다.

| 방식 | 검증 구조 | Web Server 중단 | Wildcard |
|---|---|---:|---:|
| `--nginx` | Certbot이 Nginx 설정을 이용해 HTTP Challenge 처리 | 보통 불필요 | 아니오 |
| `--webroot` | 기존 Web Server가 `.well-known/acme-challenge` 파일 제공 | 불필요 | 아니오 |
| `--standalone` | Certbot이 임시 HTTP Server를 띄움 | 80 Port 충돌 시 필요 | 아니오 |
| DNS Plugin / DNS-01 | DNS TXT Record로 Domain 소유권 검증 | 불필요 | 가능 |

Wildcard가 필요하면 DNS-01이 필요하다.

```text
*.example.com
→ DNS-01
```

일반 Domain에서 이미 Nginx를 계속 운영하고 있고 Challenge Location을 직접 통제하고 싶다면 Webroot가 이해하기 쉬운 방식이다.

## 2. Nginx Plugin과 Webroot의 차이

### Nginx Plugin

```bash
sudo certbot --nginx -d example.com -d www.example.com
```

Certbot이 Nginx 설정을 읽고 인증과 설치를 도울 수 있다. 자동 설치를 원하는 초기 구성에는 편리하다.

이때 `server_name`이 실제 Domain과 맞아야 Certbot이 적절한 Server Block을 찾기 쉽다.

```nginx
server {
    listen 80;
    server_name example.com www.example.com;
}
```

`server_name _;` 같은 Catch-all만 있는 구조라면 자동 매칭을 기대하기보다 Domain용 Server Block을 명시적으로 두는 편이 운영 구조도 명확하다.

### Webroot

Webroot는 Certbot이 Challenge File만 특정 Directory에 쓰고, 기존 Nginx가 이를 HTTP로 제공한다.

```bash
sudo mkdir -p /var/www/letsencrypt

sudo certbot certonly \
  --webroot \
  -w /var/www/letsencrypt \
  -d example.com \
  -d www.example.com
```

Nginx:

```nginx
server {
    listen 80;
    server_name example.com www.example.com;

    location /.well-known/acme-challenge/ {
        root /var/www/letsencrypt;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}
```

```text
Let's Encrypt
   ↓ HTTP-01 Request
Nginx :80
   ↓
/.well-known/acme-challenge/...
   ↓
Webroot File
```

Webroot의 장점은 **Certificate 인증 경로와 Application Proxy 경로를 분리해 눈으로 확인하기 쉽다는 것**이다. Nginx Plugin보다 무조건 안정적이라는 절대 규칙은 아니며, 현재 운영 방식에 맞는 Authenticator를 선택한다.

## 3. 발급된 파일의 역할을 구분한다

Certbot이 관리하는 `live/<certificate-name>/`에는 대표적으로 다음 Symlink가 있다.

```text
cert.pem
→ Server Certificate

chain.pem
→ Intermediate Certificate Chain

fullchain.pem
→ cert.pem + chain.pem

privkey.pem
→ Private Key
```

Nginx의 일반적인 TLS 설정은:

```nginx
ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
```

처럼 `fullchain.pem`과 `privkey.pem`을 사용한다.

Client가 Server Certificate에서 Trusted Root까지 Chain을 구성하려면 Server가 필요한 Intermediate Certificate를 함께 제공해야 하기 때문이다.

## 4. HTTPS Server Block을 적용하기 전에 Config Test

```nginx
server {
    listen 443 ssl;
    server_name example.com www.example.com;

    ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8080;
    }
}
```

적용 전:

```bash
sudo nginx -t
```

성공한 뒤 Reload한다.

```bash
sudo systemctl reload nginx
```

Certificate 파일이 존재하는 것과 Nginx가 그 Certificate를 실제로 Load한 것은 다른 단계다.

## 5. Renewal은 처음 발급 때 사용한 설정을 재사용한다

Certbot의 `renew`는 갱신 대상 Certificate가 만료에 가까워지면 기존 Renewal Configuration의 Plugin과 옵션을 이용해 갱신을 시도한다.

따라서 운영에서 중요한 것은:

```text
처음 발급 성공
        ↓
같은 Renewal Configuration으로
미래에도 자동 성공 가능한가?
```

다.

테스트:

```bash
sudo certbot renew --dry-run
```

`--dry-run`은 실제 Certificate를 바꾸지 않고 미래 갱신 경로를 시험하는 핵심 검증 절차다.

## 6. 새 인증서가 발급됐으면 Nginx가 다시 읽어야 한다

Renewal에 성공해 File Symlink가 새 Version을 가리켜도 이미 실행 중인 Nginx Process가 자동으로 새 Certificate를 사용하는 것은 별도 문제다.

성공한 Renewal 뒤에만 실행할 작업은 Deploy Hook으로 둘 수 있다. Certbot은 성공적으로 발급/갱신된 뒤 실행하는 `--deploy-hook`을 제공한다.

예:

```bash
sudo certbot renew \
  --deploy-hook "systemctl reload nginx"
```

운영에서는 명령줄에 매번 쓰기보다 Renewal Hook Directory나 관리되는 Certbot 설정으로 지속성을 확보한다.

```text
Certificate Renewal 성공
        ↓
Nginx Reload
        ↓
새 Worker가 새 Certificate Load
```

## 7. "브라우저만 이상하다"면 HSTS와 Certificate Error를 분리한다

HSTS는 Browser에게 **해당 Host를 앞으로 HTTP가 아니라 HTTPS로만 접근하라**고 기억시키는 정책이다.

```text
Strict-Transport-Security
→ HTTP 접속을 HTTPS로 강제
```

HSTS가 "예전에 봤던 잘못된 Certificate를 기억한다"는 뜻은 아니다.

브라우저마다 결과가 다를 때는 다음을 분리해 본다.

```text
1. 실제 접속 Hostname이 같은가?
2. Server가 현재 어떤 Certificate Chain을 제공하는가?
3. Certificate SAN에 Hostname이 포함되는가?
4. Expiry / Trust Chain이 정상인가?
5. Browser/OS Trust Store나 Proxy/TLS Inspection 차이가 있는가?
6. HSTS 때문에 HTTP→HTTPS 강제가 일어나는가?
```

Server가 실제로 제공하는 Certificate는 Browser UI만 보지 않고 CLI에서도 확인할 수 있다.

```bash
openssl s_client \
  -connect example.com:443 \
  -servername example.com \
  -showcerts
```

HSTS 상태 삭제는 **HSTS 동작 자체를 진단할 때** 사용할 수 있지만, 잘못된 Certificate Chain의 해결책으로 사용하지 않는다.

## 8. 운영 검증은 세 층으로 한다

### Certbot이 무엇을 관리하나

```bash
sudo certbot certificates
```

### 미래 Renewal이 성공하나

```bash
sudo certbot renew --dry-run
```

### 실제 외부 TLS Endpoint가 새 Certificate를 내놓나

```bash
openssl s_client \
  -connect example.com:443 \
  -servername example.com </dev/null 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates
```

```text
Certbot State
   ↓
Renewal Path
   ↓
Nginx Runtime
   ↓
External TLS Handshake
```

각 단계가 모두 정상이어야 운영이 끝난다.

## 9. 자동 실행 방식은 설치 방법에 따라 확인한다

Certbot 자동 갱신을 어떤 Scheduler가 실행하는지는 OS Package, Snap 등 설치 방식에 따라 달라질 수 있다. 특정 배포판이면 반드시 cron을 직접 만들거나 반드시 특정 timer가 존재한다고 일반화하지 않는다.

먼저 현재 환경을 확인한다.

```bash
systemctl list-timers | grep -i certbot
systemctl status certbot.timer
```

Cron이나 다른 Scheduler로 설치했다면 해당 구성을 확인한다.

핵심은 Scheduler 종류가 아니라:

```text
정기적으로 certbot renew가 실행되는가
        +
renew --dry-run이 성공하는가
        +
성공 후 Nginx Reload가 보장되는가
```

다.

## 정리

Let's Encrypt 운영의 핵심은 발급 명령 하나가 아니다.

```text
Challenge 방식 결정
        ↓
Certificate 발급
        ↓
Nginx fullchain 적용
        ↓
Renewal Configuration 보존
        ↓
renew --dry-run
        ↓
성공 시 Nginx Reload
        ↓
외부 TLS Endpoint 검증
```

**오늘 발급되는지보다 60일 뒤에도 사람 손 없이 갱신되는지**를 확인해야 Certificate 운영이 완성된다.

## 참고

- [Certbot command documentation](https://eff-certbot.readthedocs.io/en/stable/man/certbot.html)
- [Certbot renewal hooks](https://eff-certbot.readthedocs.io/en/stable/using.html#renewing-certificates)
