---
title       : letsencrypt 를 이용한 SSL 인증서 발급 및 갱신
description : >-
date        : 2022-02-05 09:32:27 +0900
updated     : 2025-07-05 01:13:47 +0900
categories  : [security]
tags        : [letsencrypt, ssl, certbot, certificate]
pin         : false
hidden      : false
---

## 인증서 발급 방식
1. Standalone
- 인증서 발급을 위한 가상 웹 서버를 잠시 실행하고, 인증서 발급이 완료되면 종료하는 방법 
- 가장 간단한 방식으로 80, 443 포트이 개방되어있어야 함
- 자동 갱신 가능, 와일드 카드 도메인 사용 불가
```bash
sudo certbot certonly --standalone -d <도메인명> -d www.<도메인명>
```

2. Webroot
- 사이트 디렉터리 내에 인증서 유효성을 확인할 수 있는 파일을 업로드하여 인증서를 발급하는 방법
- 자동 갱신 가능, 와일드 카드 도메인 사용 불가
```bash
mkdir -p /var/www/letsencrypt/.well-known/acme-challenge # 폴더 생생
```
```bash
## nginx 설정
server {
    # 아래와 같은 설정 추가 ()
    location ^~ /.well-known/acme-challenge/ {
        default_type "text/plain";
        root /var/www/letsencrypt;
    }
}
```
```bash
sudo systemctl restart nginx # nginx 설정을 적용하기 위해 재시작
```
```bash
certbot certonly --webroot --webroot-path=/var/www/letsencrypt  -d <도메인> # 인증서 발급
```

3. DNS
- 도메인이 연결된 DNS의 TXT레코드를 이용해 인증받는 방식
- 와일드 카드 도메인 사용 가능
* 서버 관리자가 도메인 DNS를 관리/수정할 수 있어야 한다.
```bash
certbot certonly --manual -d *.[도메인] -d [도메인] --preferred-challenges dns-01 --server https://acme-v02.api # 인증서 발급
```
- 위 명령을 수행하면 DNS서버에 _acme-challenge.domain.com 이름의 TXT레코드를 추가하라고 나오게 되는데 사용중인 도메인 서버에 TXT레코드에 값을 추가해주면 된다.

--- 

## Certbot 설치
```bash
sudo apt update
sudo apt-get install letsencrypt -y
```

## 인증서 발급
```bash
sudo certbot certonly --standalone -d <도메인명> -d www.<도메인명>
```
> 인증서 발급이 완료되면 `/etc/letsencrypt/live/도메인명/` 경로 아래에 관련 파일들이이 생성된다.

## 인증서 갱신
```bash
sudo certbot renew
```
> 인증서 갱신은 cron job을 이용하여 자동으로 갱신할 수 있다. 아래와 같이 cron job을 설정하면 매일 오전 3시에 인증서 갱신을 시도한다.

```bash
0 3 * * * /usr/bin/certbot renew --quiet
```
> 웹서버를 사용하는 경우, 인증서 갱신 후 웹 서버를 재시작해야 한다. 아래와 같이 certbot renew 명령어에 post-hook을 추가하여 인증서 갱신 후 자동으로 웹 서버를 재시작할 수 있다.

```bash
sudo certbot renew --post-hook "systemctl restart nginx"
```


---





✅ 1. Certbot 설치 (Rocky Linux / RHEL 계열)
Rocky Linux는 RHEL 기반이라 EPEL 저장소를 활성화해야 합니다.

bash
Copy
Edit
sudo dnf install epel-release -y
sudo dnf install certbot -y
Nginx 또는 Apache 플러그인도 필요 시:
Nginx:
bash
Copy
Edit
sudo dnf install python3-certbot-nginx -y
Apache:
bash
Copy
Edit
sudo dnf install python3-certbot-apache -y
✅ 2. 인증서 재발급 (서버에 따라)
▶ Nginx 자동 구성:
bash
Copy
Edit
sudo certbot --nginx -d example.com -d www.example.com
▶ Apache 자동 구성:
bash
Copy
Edit
sudo certbot --apache -d example.com
▶ 웹서버 없이 standalone 모드:
bash
Copy
Edit
sudo systemctl stop nginx  # 또는 apache
sudo certbot certonly --standalone -d example.com --force-renewal
sudo systemctl start nginx
🔒 --force-renewal을 쓰면 이전 인증서 무시하고 새로 발급됩니다.

✅ 3. 인증서 파일 위치
발급 후 인증서 경로는 다음과 같습니다:

swift
Copy
Edit
/etc/letsencrypt/live/example.com/
  ├── fullchain.pem
  └── privkey.pem
✅ 4. Nginx 예시 설정
nginx
Copy
Edit
server {
    listen 443 ssl;
    server_name example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    location / {
        root /var/www/html;
        index index.html;
    }
}
✅ 5. 자동 갱신 설정 (Crontab 또는 Systemd Timer)
갱신 테스트:

bash
Copy
Edit
sudo certbot renew --dry-run
갱신을 자동으로 하려면:

bash
Copy
Edit
sudo systemctl enable certbot-renew.timer
sudo systemctl start certbot-renew.timer
🔍 DNS 확인 (필수)
도메인이 새로운 서버 IP를 바라보고 있는지 확인하세요:

bash
Copy
Edit
dig +short example.com
추가로 Nginx 설정, 방화벽, 포트 개방 등도 필요하면 말씀 주세요. Rocky 환경에 맞춰 안내해드릴게요.









Ask ChatGPT

