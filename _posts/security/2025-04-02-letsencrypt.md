---
title       : "Let's Encrypt + Nginx 운영 가이드: 발급, 갱신, 그리고 만난 함정 4가지"
description : "Let's Encrypt SSL 인증서를 nginx와 함께 운영하면서 마주친 server_name 매칭, fullchain, webroot 전환, HSTS 캐시 문제 정리"
date        : 2022-02-05 09:32:27 +0900
updated     : 2026-06-07 12:00:00 +0900
categories  : [security, "TLS·HTTP"]
tags        : [letsencrypt, ssl, certbot, nginx, certificate, rocky-linux]
pin         : false
hidden      : false
---

Let's Encrypt 무료 SSL 인증서는 발급 자체는 쉽지만, 운영 중 마주치는 함정들이 있다. 발급 방식 비교부터 함정 4가지까지 정리.

## 인증서 발급 방식 3가지

| 방식 | 특징 | 와일드카드 |
|---|---|---|
| **Standalone** | certbot이 임시 웹서버를 80/443에 띄움. 가장 간단하지만 기존 웹서버를 잠시 중단해야 함 | ❌ |
| **Webroot** | 사이트 디렉토리에 인증 파일을 두고 검증. 웹서버 중단 불필요 | ❌ |
| **DNS** | DNS TXT 레코드로 검증. 도메인 관리 권한 필요 | ✅ |

```bash
# Standalone
sudo certbot certonly --standalone -d example.com -d www.example.com

# Webroot
sudo certbot certonly --webroot --webroot-path=/var/www/letsencrypt -d example.com

# DNS (수동)
sudo certbot certonly --manual -d "*.example.com" -d example.com \
  --preferred-challenges dns-01
```

## Certbot 설치

### Rocky Linux / RHEL 계열

```bash
sudo dnf install -y epel-release
sudo dnf install -y certbot python3-certbot-nginx
```

### Debian / Ubuntu

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
```

## Nginx 자동 구성으로 발급

`certbot --nginx`는 nginx 설정을 자동으로 수정해 SSL 블록을 추가한다.

```bash
sudo certbot --nginx -d example.com -d www.example.com
```

발급 후 인증서 파일은 `/etc/letsencrypt/live/example.com/`:

```
cert.pem        ← 끝단 인증서 (단독)
fullchain.pem   ← 끝단 + 중간 인증서 (체인 완성)
privkey.pem     ← 개인키
chain.pem       ← 중간 인증서만
```

---

## 운영 중 만난 함정 4가지

### 1. `server_name _;` 일 때 certbot이 매칭 실패

기본 catch-all로 nginx를 운영하던 서버에서 `certbot --nginx`를 돌리면 "No matching server block" 같은 에러가 난다.

```nginx
# ❌ certbot이 자동으로 못 찾음
server {
    listen 80;
    server_name _;
    ...
}

# ✅ 도메인명을 명시
server {
    listen 80;
    server_name example.com www.example.com;
    ...
}
```

`certbot --nginx`는 `-d` 인자의 도메인과 server block의 `server_name`을 매칭해서 SSL 블록을 끼워 넣는다. catch-all로는 매칭 못 한다.

### 2. `cert.pem`이 아니라 `fullchain.pem`

발급 후 nginx 설정에 인증서를 적용할 때 무조건 **`fullchain.pem`**.

```nginx
# ❌ self-signed처럼 보임
ssl_certificate /etc/letsencrypt/live/example.com/cert.pem;

# ✅ 정상
ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
```

`cert.pem`은 끝단 인증서만 들어 있어서 브라우저가 중간 인증서(Let's Encrypt R3 등)까지 신뢰 체인을 연결하지 못한다. `fullchain.pem`은 끝단 + 중간을 한 파일에 묶어둔 거.

### 3. 자동 갱신은 nginx 플러그인보다 webroot가 안정적

`certbot --nginx`로 발급한 경우 갱신할 때도 nginx 플러그인이 동작한다. 갱신마다 nginx 설정을 읽고 다시 손대는데, **복잡한 설정에선 무한 대기나 reload 실패**가 발생한다.

```bash
sudo certbot renew --dry-run
# → 응답 없이 멈춤
```

해결: webroot로 전환.

```bash
sudo mkdir -p /var/www/letsencrypt
```

nginx 80 블록에 챌린지 경로 추가:

```nginx
server {
    listen 80;
    server_name example.com;

    location /.well-known/acme-challenge/ {
        root /var/www/letsencrypt;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}
```

renewal conf 수정 (`/etc/letsencrypt/renewal/example.com.conf`):

```ini
[renewalparams]
authenticator = webroot
key_type = ecdsa
renew_hook = systemctl reload nginx

[[webroot_map]]
example.com = /var/www/letsencrypt
```

```bash
sudo certbot renew --dry-run    # 성공해야 함
```

webroot 방식은 nginx 설정을 건드리지 않고 challenge 파일만 두니까 영향이 격리된다.

### 4. Chrome만 "not secure", Safari는 정상

인증서를 올바르게 적용한 뒤에도 Chrome에서만 "not secure"로 표시되는 경우가 있다. 발급 전에 한 번 잘못된 SSL로 접속한 적이 있으면 **HSTS 캐시**가 무효 인증서 정책을 기억해두기 때문이다.

해결 (Chrome):

```
chrome://net-internals/#hsts
  → Delete domain security policies → 도메인 입력 → Delete
```

Safari는 HSTS 캐시 정책이 달라서 동일한 상황에서도 정상으로 표시될 수 있다. **두 브라우저 동작이 다르면 캐시를 먼저 의심**한다.

---

## 자동 갱신 스케줄

Rocky 9는 certbot 설치 시 `certbot.timer`가 자동 등록되지 않으니 수동으로 설정한다.

### Crontab 방식 (간단)

```bash
crontab -e
# 매일 새벽 3시 갱신 시도, 갱신되면 nginx reload
0 3 * * * /usr/bin/certbot renew --quiet --post-hook "systemctl reload nginx"
```

### systemd timer 방식

```bash
cat <<'EOF' | sudo tee /etc/systemd/system/certbot-renew.service
[Unit]
Description=Certbot Renewal

[Service]
Type=oneshot
ExecStart=/usr/bin/certbot renew --quiet
EOF

cat <<'EOF' | sudo tee /etc/systemd/system/certbot-renew.timer
[Unit]
Description=Run certbot twice daily

[Timer]
OnCalendar=*-*-* 03,15:00:00
RandomizedDelaySec=1h
Persistent=true

[Install]
WantedBy=timers.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now certbot-renew.timer
```

## 핵심 정리

- 발급 방식 선택: 단순 = Standalone, 운영 중 = Webroot, 와일드카드 = DNS
- nginx 설정에 무조건 **`fullchain.pem`**, server_name 명시
- 자동 갱신은 webroot로 전환해서 nginx 플러그인 의존성 제거
- 브라우저 인증서 표시가 다르면 HSTS 캐시부터 의심
