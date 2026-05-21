---
title       : 'HTTPS 페이지에 "주의 요함"이 뜨는 진짜 원인은 대개 Mixed Content'
description : "인증서가 멀쩡한데도 크롬이 주의 요함을 띄울 때, 가장 흔한 원인은 Mixed Content와 X-Forwarded-Proto 미처리"
date        : 2026-04-22 10:00:00 +0900
updated     : 2026-04-22 10:00:00 +0900
categories  : [dev, network]
tags        : [https, tls, mixed-content, reverse-proxy, network]
pin         : false
hidden      : false
---

인증서가 멀쩡해도 크롬이 "주의 요함"을 띄우면 90%는 Mixed Content다.

## 증상

- 주소창에 `https://` 로 들어갔는데 자물쇠 대신 "주의 요함" 표시
- 자물쇠 눌러 확인해보면 **인증서는 유효함**

## 원인 우선순위

1. **Mixed Content** — HTTPS 페이지 내부에서 `http://` 리소스(이미지/JS/CSS/iframe/WebSocket) 로드
2. **Reverse Proxy 뒤 앱이 `http://`로 리다이렉트 URL 생성** — `X-Forwarded-Proto` 헤더 미처리 (Spring Boot 등에서 자주)
3. **인증서 자체 문제** — SAN 누락, 중간 인증서 체인 누락, 도메인 불일치

## 확인 방법

### 브라우저 (가장 빠름)

F12 → Console 탭에서 `Mixed Content:` 로 시작하는 경고 찾기.
Network 탭의 Scheme 열에서 `http`로 내려오는 리소스 확인.

### 인증서 상태 확인 (Windows, openssl 없이)

```powershell
$req = [System.Net.HttpWebRequest]::Create("https://example.com:20000")
$req.AllowAutoRedirect = $false
try { $req.GetResponse() | Out-Null } catch {}
$cert = $req.ServicePoint.Certificate
$cert2 = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($cert)
$cert2 | Format-List Subject, Issuer, NotBefore, NotAfter, Thumbprint
$cert2.Extensions |
  Where-Object { $_.Oid.FriendlyName -eq "Subject Alternative Name" } |
  ForEach-Object { $_.Format($true) }
```

또는 `curl.exe` (PowerShell의 curl alias 아님, 반드시 `.exe` 명시):

```powershell
curl.exe -v https://example.com:20000
```

## 흔한 함정

- 프론트에서 API URL을 `http://...` 하드코딩
- WebSocket이 `ws://` (HTTPS 페이지에선 `wss://` 여야 함)
- WAF/프록시에서 TLS 종료 후 백엔드는 HTTP — 앱이 이걸 모르고 `http://` 리다이렉트 발급
  → 해결: 프록시에서 `X-Forwarded-Proto: https` 내려주고 앱이 이 헤더 신뢰하도록 설정
