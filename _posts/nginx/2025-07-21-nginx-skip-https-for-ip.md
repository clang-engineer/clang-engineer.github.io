---
title       : "Nginx 설정: 특정 IP에 대해 HTTPS 리다이렉트 제외"
description : "특정 클라이언트 IP에서 오는 요청은 HTTP 그대로 처리하고 나머지는 HTTPS로 리다이렉트하는 nginx 설정"
date        : 2025-07-21 22:50:42 +0900
updated     : 2025-07-21 22:50:42 +0900
categories  : [nginx, "요청·라우팅"]
tags        : [nginx, http, https, ip]
pin         : false
hidden      : false
---

특정 클라이언트 IP에서 오는 요청은 HTTP 그대로 처리하고, 나머지 요청은 HTTPS로 리다이렉트하는 nginx 설정 예시.

```sh
server {
    listen 80;
    server_name yourdomain.com;

    # 특정 IP는 HTTP 그대로
    set $redirect_to_https 1;

    # 특정 IP 목록 (예: 192.168.0.1)
    if ($remote_addr = 192.168.0.1) {
        set $redirect_to_https 0;
    }

    # 조건에 따라 HTTPS로 리다이렉션
    if ($redirect_to_https = 1) {
        return 301 https://$host$request_uri;
    }

    # 이 아래는 허용된 IP의 HTTP 처리
    location / {
        # 여기에 HTTP로 서비스할 내용
        return 200 "You are using HTTP from an allowed IP.\n";
    }
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate     /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    location / {
        # HTTPS 처리
        return 200 "You are using HTTPS.\n";
    }
}

```