---
title       : letsencrypt 를 이용한 SSL 인증서 발급 및 갱신
description : >-
date        : 2022-02-05 09:32:27 +0900
updated     : 2025-03-06 09:33:16 +0900
categories  : [dev, tip]
tags        : [letsencrypt, ssl, certbot]
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