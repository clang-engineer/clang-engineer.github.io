---
title       : "nginx는 언더스코어가 들어간 요청 헤더를 기본적으로 버린다"
description : "rex_db_key 같은 언더스코어 헤더가 nginx 기본 설정에서 업스트림에 전달되지 않는 원인과 해법"
date        : 2026-05-14 10:00:00 +0900
updated     : 2026-05-14 10:00:00 +0900
categories  : [dev, nginx]
tags        : [nginx, http, headers]
pin         : false
hidden      : false
---

`rex_db_key` 같은 언더스코어 헤더는 nginx 기본 설정에서 업스트림에 전달되지 않는다. 헤더 값을 바꿔도 응답이 똑같이 와서 캐시 문제로 착각하기 쉽다.

## 핵심

nginx는 헤더명에 `_` 가 있으면 그 헤더를 통째로 무시한다. 클라이언트가 보내도 백엔드는 못 받는다.

```http
GET /api/info/demography
rex_db_key: SCHMC_PRD     ← nginx가 버림
rex_hsp_key: 053          ← nginx가 버림
```

백엔드는 헤더 없는 요청만 받으니 기본값으로만 응답 → "값 바꿔도 같은 응답" → 캐시처럼 보임. **사실은 캐시가 아니라 헤더가 도달하지 못하는 것.**

## 왜 이런 기본값?

CGI 시절 헤더 → 환경변수 변환 규칙 때문. 하이픈과 언더스코어가 둘 다 `_` 로 변환되어 충돌한다.

- `X-Forwarded-For` → `HTTP_X_FORWARDED_FOR`
- `X_Forwarded_For` → `HTTP_X_FORWARDED_FOR` ← 위장 가능

악의적 클라이언트의 헤더 스푸핑을 막기 위해 nginx가 보안상 기본 차단.

## 해결

`http` 또는 `server` 블록에 한 줄.

```nginx
server {
    listen 443 ssl http2;
    server_name rex;
    include /etc/nginx/conf.d/common-ssl.inc;

    underscores_in_headers on;   # ← 추가

    location / {
        proxy_pass http://rex;
        ...
    }
}
```

```bash
nginx -t
nginx -s reload
```

## 진단 팁

캐시 의심될 때 가장 먼저 확인할 것: 헤더가 실제로 백엔드까지 도달하는지.

```nginx
# nginx 단에서 헤더 값 응답에 echo
add_header X-Debug-DB-Key  "$http_rex_db_key"  always;
add_header X-Debug-HSP-Key "$http_rex_hsp_key" always;
```

- 응답 헤더에 값이 비어 있으면 → nginx가 헤더를 버린 것
- 값이 정상이면 → nginx는 무죄, 캐시(nginx `proxy_cache` 또는 백엔드 `@Cacheable`) 의심

## 권장

가능하면 커스텀 헤더는 하이픈으로 (`X-Rex-Db-Key`). 표준이고 함정이 없다. 이미 언더스코어로 박힌 시스템이면 `underscores_in_headers on;` 가 현실적.
