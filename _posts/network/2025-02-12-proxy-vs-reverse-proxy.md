---
title       : "Proxy (Forward vs Reverse)"
description : "프록시 서버의 두 가지 방식 — Forward Proxy와 Reverse Proxy가 무엇을 가리는지"
date        : 2025-02-12 11:05:23 +0900
updated     : 2026-06-13 10:00:00 +0900
categories  : [network, "웹·HTTP"]
tags        : [network, proxy, nginx, load-balancer]
pin         : false
hidden      : false
---

프록시는 클라이언트와 서버 사이에서 대리로 통신을 수행하는 중계기. 어느 쪽을 가리느냐에 따라 Forward와 Reverse로 나뉜다.

## 한 줄 요약

| 구분 | 누구를 가리나 | 누가 위치를 아나 |
|---|---|---|
| Forward Proxy | **클라이언트**가 보이지 않는다 | 클라이언트는 실제 서버 도메인을 안다 |
| Reverse Proxy | **서버**가 보이지 않는다 | 클라이언트는 프록시 도메인만 안다 |

## Forward Proxy

```
[클라이언트들] ──→ [Forward Proxy] ──→ [인터넷의 여러 서버]
```

클라이언트가 인터넷에 직접 나가지 않고 사내 프록시를 통해 나간다.

**전형적 사용처**

- 회사 방화벽: 사외 접근 통제·로깅
- 캐시 프록시(squid 등): 동일 요청 재사용
- 우회: 차단된 사이트 접근

서버 입장에서는 모든 트래픽이 프록시 IP에서 오는 것처럼 보인다. 클라이언트의 실제 IP는 가려진다.

## Reverse Proxy

```
[인터넷의 클라이언트들] ──→ [Reverse Proxy (nginx)] ──→ [내부 서버 A, B, C]
```

클라이언트는 프록시 도메인만 알고 그쪽으로 요청을 보낸다. 프록시가 내부 서버 중 적절한 곳에 라우팅한다.

**전형적 사용처**

- 로드 밸런싱: 동일 서비스의 여러 인스턴스에 분산
- 화면 라우팅: `/api`는 백엔드, `/`는 SPA로
- SSL 종단: HTTPS 처리 한 군데에 집중
- 캐시·압축: 정적 자원 캐시
- 보안: 백엔드 IP·포트를 외부에 노출하지 않음

## 가장 간단한 nginx 리버스 프록시

```nginx
server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

`X-Forwarded-*` 헤더는 백엔드가 원래 요청한 클라이언트 IP/스킴을 알게 해주는 컨벤션. Spring Boot 같은 프레임워크는 이걸 보고 `request.getRemoteAddr()`를 보정하므로 빼먹지 말 것.

## 한쪽으로만 쓰지 않는다

같은 nginx 인스턴스가 외부에는 reverse proxy이면서 사내망 쪽으로는 forward proxy 역할을 하기도 한다. "프록시 = 중계"라는 본질은 같고 방향만 다르다.
