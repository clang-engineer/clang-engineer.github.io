---
title       : "nginx SSL 인증서 운영 가이드"
description : "와일드카드 인증서 상속, 패스프레이즈, reload, 프로세스 복구 — 4가지 의사결정"
date        : 2026-04-22 10:00:00 +0900
updated     : 2026-04-22 10:00:00 +0900
categories  : [nginx, "HTTPS·SSL"]
tags        : [ssl, tls]
pin         : false
hidden      : false
---

nginx SSL 인증서 운영에서 자주 마주치는 4가지 의사결정과 트러블슈팅 흐름을 정리한다.

1. 와일드카드 인증서를 여러 `server`가 공유할 때 어디에 두는가
2. 운영 환경에서 키 패스프레이즈를 어떻게 다루는가
3. 설정 변경 시 reload vs restart
4. 프로세스가 꼬였을 때 복구 순서

## 1. 인증서는 `http` 블록에서 상속시킨다

같은 와일드카드 인증서를 여러 `server`가 공유하면 `server`마다 두 줄씩 반복할 필요가 없다. `http` 블록에 한 번 올리면 모든 하위 `server`가 상속받는다.

```nginx
# /etc/nginx/nginx.conf
http {
    ssl_certificate     /etc/nginx/ssl/STAR.example.com.pem;
    ssl_certificate_key /etc/nginx/ssl/STAR.example.com_pem.key;

    include /etc/nginx/conf.d/*.conf;
}
```

```nginx
# conf.d/ridex_20800.conf — ssl_certificate 줄 필요 없음
server {
    listen 20800 ssl http2;
    server_name ridex;
    location / { proxy_pass http://ridex; ... }
}
```

특정 서비스만 다른 인증서를 써야 하면 해당 `server` 블록에만 덮어쓴다.

> **주의**: 같은 포트를 여러 `server`가 공유할 때만 SNI(`server_name`)가 유효하다. 포트가 다 다르면 `server_name`은 사실상 장식.

## 2. 키 패스프레이즈는 운영 환경에선 제거

nginx 재시작/리로드마다 비밀번호를 물어보면 자동화가 깨진다. 관례적으로 passphrase를 빼고 **파일 권한으로** 보호한다.

```bash
openssl rsa -in STAR.example.com.key -out STAR.example.com.nopass.key
chmod 600 STAR.example.com.nopass.key
chown root:root STAR.example.com.nopass.key
```

`ssl_password_file` 지시어도 있지만 어차피 평문 저장이라 보안상 차이가 거의 없다. 같은 서버 안에 복호화 수단이 공존해야 하는 구조라 암호화의 의미가 작기 때문.

## 3. 설정 변경 후엔 `reload`, 재실행 금지

이미 떠 있는데 `nginx`를 다시 치면 기존 프로세스가 포트를 잡고 있어서 바인딩이 죄다 실패한다.

```
nginx: [emerg] bind() to 0.0.0.0:443 failed (98: Address already in use)
```

올바른 순서:

```bash
nginx -t          # 문법 체크
nginx -s reload   # 무중단 리로드 (기존 마스터 유지)
```

## 4. 프로세스가 꼬였을 때 복구

`nginx -s stop`이 `No such process`로 실패하면 pid 파일이 틀어진 상태.

```bash
ps -ef | grep nginx              # 진짜 마스터 PID 확인
pkill -QUIT nginx                # graceful (워커까지 현재 커넥션 처리 후 종료)
# 안 죽으면
pkill -TERM nginx
# 최후의 수단
pkill -9 nginx

ss -tlnp | grep -E '443|20000'   # 포트 실제로 풀렸는지 확인
nginx -t && nginx                # 다시 띄우기
```
