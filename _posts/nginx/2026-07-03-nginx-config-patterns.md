---
title       : "nginx 실무 설정 패턴 — 리버스 프록시부터 SSL 종단까지"
description : "요청을 어느 백엔드로 넘길지의 문제로 본 nginx 설정 5가지 패턴. 각 지시어가 왜 그렇게 동작하는지를 중심으로 정리한다."
date        : 2026-07-03 10:00:00 +0900
categories  : [nginx, "요청·라우팅"]
tags        : [reverse-proxy, upstream, server-name, location, client-max-body-size]
pin         : false
hidden      : false
---

nginx의 리버스 프록시는 결국 "요청을 어떤 기준으로 어느 백엔드에 넘길 것인가"의 문제다. 분기 기준이 도메인이면 `server_name`, 경로면 `location`, 접속자면 `allow/deny`로 나뉘고, 그 위에 TLS 종단과 본문 크기 제한 같은 게이트가 얹힌다. 각 패턴이 왜 그렇게 동작하는지를 기준으로 묶었다.

## 리버스 프록시의 기본 원리 (upstream / proxy_pass)

nginx가 클라이언트 요청을 받아 내부 백엔드로 대신 넘기고, 응답을 받아 클라이언트에 돌려주는 구조다. `proxy_pass`가 그 전달 지점이고, `upstream` 블록은 백엔드를 이름으로 묶어 재사용·부하분산할 수 있게 한다.

```nginx
upstream registryex {
        server 127.0.0.1:8700;
        keepalive 32;
}

server {
        listen 443 ssl http2;
        server_name app.example.com;

        include /etc/nginx/conf.d/common-ssl.inc;

        location / {
                proxy_pass http://registryex;
                proxy_set_header Host              $host;
                proxy_set_header X-Real-IP         $remote_addr;
                proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;

                proxy_http_version 1.1;
                proxy_set_header Connection "";
        }
}
```

여기서 놓치기 쉬운 지점: `upstream`에 `keepalive 32`를 걸어도 `proxy_http_version 1.1`과 `Connection ""` 두 줄이 없으면 keepalive가 실제로 동작하지 않는다. nginx는 기본적으로 HTTP/1.0으로 upstream에 연결하고 클라이언트의 `Connection` 헤더를 그대로 전달하기 때문이다. 두 줄을 넣어야 매 요청마다 커넥션을 새로 맺지 않고 재사용한다.

프록시가 전달하는 헤더도 원리로 이해해야 한다. TCP 출발지 IP는 프록시 자신이 될 수밖에 없으므로, 백엔드(WAS)가 `request.getRemoteAddr()`로 보면 항상 nginx IP가 찍힌다. 실제 클라이언트 IP는 `X-Forwarded-For`/`X-Real-IP` 헤더로 넘기고, **백엔드가 그 헤더를 읽도록** 켜야 복원된다. Spring Boot(내장 톰캣)는 코드 수정 없이 properties만으로 된다.

```properties
server.forward-headers-strategy=native
```

`native`면 톰캣의 RemoteIpValve가, `framework`면 Spring이 헤더를 처리한다. 순수 톰캣이면 `server.xml`에 직접 Valve를 넣는다.

```xml
<Valve className="org.apache.catalina.valves.RemoteIpValve"
       remoteIpHeader="X-Forwarded-For"
       protocolHeader="X-Forwarded-Proto"
       internalProxies="10\.0\.0\.\d+|127\.0\.0\.1" />
```

핵심은 nginx 설정이 아니라 WAS가 헤더를 신뢰·파싱하도록 켜는 것이다.

## 한 서버에 여러 프로세스 + 개별 DNS로 분기 (server_name 가상호스트)

한 서버에서 여러 백엔드 프로세스를 각기 다른 포트로 띄우고, 도메인별로 해당 프로세스에 라우팅하는 표준 패턴이다. 동작 원리가 명확하다: nginx가 80/443에서 요청을 받고 HTTP `Host` 헤더를 보고 어느 `server` 블록으로 보낼지 결정한다. DNS에 등록된 도메인들이 **모두 같은 IP(이 서버)를 가리켜도**, `Host` 헤더가 다르므로 분기된다. 분기는 전적으로 nginx의 `server_name` 매칭이 담당하고, DNS는 A 레코드를 같은 IP로 등록만 하면 된다.

```nginx
server {
    listen 80;
    server_name app-a.example.com;
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name app-b.example.com;
    location / {
        proxy_pass http://127.0.0.1:3002;
        # ... 동일한 proxy_set_header
    }
}
```

기본 서버(default_server) 처리도 같이 봐야 한다. 등록되지 않은 Host로 오거나 IP로 직접 접근하면 nginx는 첫 번째 `server` 블록 또는 `default_server` 지정 블록을 쓴다. 의도치 않은 노출을 막으려면 연결을 그냥 끊는(444) catch-all 블록을 둔다.

```nginx
server {
    listen 80 default_server;
    server_name _;
    return 444;
}
```

프로세스 관리는 nginx 영역 밖이다. nginx는 포트로 프록시만 하므로 백엔드가 죽으면 502가 난다. 각 프로세스는 systemd·pm2·supervisor 같은 매니저로 고정 포트에서 계속 리스닝하게 유지해야 한다. HTTPS는 SNI 덕분에 같은 IP·포트에서도 도메인별 인증서 분기가 되고, 부하분산이 필요하면 같은 앱의 여러 프로세스를 `upstream`으로 묶어 라운드로빈한다(도메인 분기와는 별개 개념).

## 특정 경로만 허용하고 나머지 차단 (location 매칭 + allow/deny)

`location` 매칭 방식의 차이를 알아야 정확히 잠근다. `location = /emr`는 exact match라 `/emr` 하나만, `location /emr`는 prefix match라 `/emr`, `/emrxyz`, `/emr/abc`까지 매칭된다. 특정 경로만 열고 나머지를 막으려면 열 경로를 명시하고 `location /`에서 전부 403을 준다.

```nginx
# /emr 한 경로만 정확히 허용
location = /emr {
    proxy_pass http://127.0.0.1:9000;
}

location / {
    return 403;
}
```

`/emr` 및 그 하위 전체를 열려면 exact와 하위 prefix를 함께 둔다.

```nginx
location = /emr {
    proxy_pass http://127.0.0.1:9000;
}

location /emr/ {
    proxy_pass http://127.0.0.1:9000;
}

location / {
    return 403;
}
```

경로가 아니라 **접속자 IP**로 거르려면 `allow`/`deny`를 쓴다. 규칙은 위에서부터 순서대로 평가되므로 `allow`를 먼저, `deny all`을 마지막에 둬야 한다. CIDR 표기로 대역 단위 허용도 된다.

```nginx
location /test {
    allow 192.168.0.10;
    allow 203.0.113.5;
    allow 10.0.0.0/24;
    deny all;
    proxy_pass http://127.0.0.1:9000;
}
```

## 413 Request Entity Too Large (client_max_body_size)

`413 Request Entity Too Large`는 nginx의 `client_max_body_size` 제한에 걸린 것이다. 기본값이 1MB라 요청 본문이 그보다 크면 nginx가 백엔드에 닿기도 전에 거절한다. 값을 올리면 된다.

```nginx
client_max_body_size 100M;
```

이 지시어는 `http`(전역) / `server` / `location` 어디든 둘 수 있고 하위로 상속된다. 전역에 두면 모든 하위에 적용되지만, 특정 location에 더 작은 값이 명시돼 있으면 그쪽이 우선이다.

```nginx
http {
    client_max_body_size 100M;
    ...
}
```

적용:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

대용량 업로드에서 413만 뜨면 이 한 줄로 끝이지만, 증상에 따라 함께 봐야 할 게 갈린다. 업로드 중 504/연결 끊김이 같이 나면 타임아웃도 올린다.

```nginx
proxy_read_timeout 300s;
proxy_send_timeout 300s;
client_body_timeout 300s;
```

그리고 백엔드(Spring Boot)에도 자체 업로드 제한이 있어 양쪽을 맞춰야 끝까지 통과한다.

```properties
spring.servlet.multipart.max-file-size=100MB
spring.servlet.multipart.max-request-size=100MB
```

## SSL/TLS 종단 프록시 (listen 443 ssl, 인증서)

nginx가 443에서 TLS를 종단하고 내부 백엔드로 프록시하는 구성이다. `listen 443 ssl`에 `ssl_certificate`(공개 인증서)와 `ssl_certificate_key`(개인키)를 지정한다. 외부에서 포트 없이 `https://도메인`으로 접속받으려면 표준 포트 443으로 listen해야 하고(비표준 포트로 listen하면 브라우저가 `:포트`를 붙여야 도달), 인증서의 CN 또는 SAN에 그 도메인이 포함돼야 유효하다.

```nginx
server {
  listen 443 ssl http2;
  server_tokens off;
  server_name app.example.com;

  ssl_certificate     /etc/nginx/ssl/example.com.crt;
  ssl_certificate_key /etc/nginx/ssl/example.com.key;

  location / {
    proxy_pass https://10.0.0.10:8080;

    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;

    # 백엔드가 self-signed면 추가
    proxy_ssl_verify off;
    proxy_ssl_server_name on;
  }
}
```

주의점 두 가지가 원리에서 나온다. 첫째, `proxy_pass`를 `server_name`과 같은 도메인(`app.example.com`)으로 두면 DNS가 그 도메인을 다시 이 nginx의 443으로 해석해 자기 자신으로 프록시하는 루프가 생긴다. 내부 서버가 목적이면 백엔드 IP로 직접 보내야 한다. 둘째, 백엔드도 https인데 self-signed 인증서면 검증에 걸리므로 `proxy_ssl_verify off`(또는 백엔드를 http로)가 필요하다. `Upgrade`/`Connection 'upgrade'` 헤더는 WebSocket 업그레이드를 프록시로 통과시키기 위한 것이다.

## 더 깊이

인증서 상속·패스프레이즈·reload vs restart·프로세스 복구 같은 SSL 인증서 운영 자체는 [nginx SSL 인증서 운영 가이드](/posts/nginx/2026-04-22-nginx-ssl-operations/)에서 다룬다.
