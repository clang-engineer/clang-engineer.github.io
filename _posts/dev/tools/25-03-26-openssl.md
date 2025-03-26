---
title       : OpenSSL을 사용한 자체 인증서 발급
description : >-
    OpenSSL을 사용하여 자체 인증서를 발급하는 방법을 기록
date        : 2025-03-26 08:50:30 +0900
updated     : 2025-03-26 08:50:42 +0900
categories  : [dev, tools]
tags        : [openssl]
pin         : false
hidden      : false
---

## 인증서 발행 절차
1. 개인키 생성
2. CSR(Certificate Signing Request) 생성
3. CSR을 CA에 전송  
4. CA에서 인증서 발급
5. 인증서 설치

## OpenSSL을 사용한 자체 인증서 발급
1. 개인키 생성
genrsa 또는 genpkey 명령어를 사용하여 RSA 알고리즘을 사용한 개인키를 생성한다. (*genpkey 명령어 권장)

```bash
openssl genrsa -out private.key 2048 # 2048은 키의 비트 수
```
```bash
# openssl genrsa -out private.key 2048 (*genpkey 명령어가 더 권장됨, genrsa는 암호화 방식 RSA만 지원)
# -aes256 : 개인키 암호화 방식 지정, 지정하지 않으면 암호화되지 않은 개인키 생성
openssl genpkey -algorithm RSA -out private.key -aes256 
```

2. CSR(Certificate Signing Request) 생성    
CSR은 인증서 발급 요청서로, 인증서에 포함될 정보를 담고 있다.
```bash
# openssl req -new -key private.key -out request.csr -subj "/C=KR/ST=Seoul/L=Gangnam/O=MyCompany/OU=Dev/CN=example.com" 로 옵션 추가 가능
openssl req -new -key private.key -out request.csr
```

3. 인증서 생성
```bash
openssl x509 -req -days 365 -in request.csr -signkey private.key -out certificate.crt
```

4. 인증서 확인
```bash
openssl x509 -in certificate.crt -text -noout
```