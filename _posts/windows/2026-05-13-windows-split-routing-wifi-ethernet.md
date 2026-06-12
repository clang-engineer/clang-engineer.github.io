---
title       : Windows에서 WiFi(인터넷) + Ethernet(사내망) split routing
description : "Ethernet 게이트웨이를 비우고 route -p add로 특정 대역만 라우팅해 WiFi 인터넷과 사내망 동시 사용"
date        : 2026-05-13 10:00:00 +0900
updated     : 2026-05-13 10:00:00 +0900
categories  : [windows, "네트워크·트러블"]
tags        : [powershell, routing, split-tunnel, sudo, netsh, windows]
pin         : false
hidden      : false
---

WiFi로 인터넷, 랜선으로 사내망을 동시에 쓰려면 **Ethernet에는 기본 게이트웨이를 박지 말고**, 특정 대역만 `route -p add`로 명시 라우팅한다.

## 핵심 원리

- 라우팅은 **longest prefix match**. `/16`, `/12`는 기본 라우트 `/0`보다 항상 우선.
- WiFi: 기본 게이트웨이 유지 → `0.0.0.0/0` 담당 (외부 트래픽)
- Ethernet: 고정 IP만 박고 **게이트웨이는 비워둠** → 사내망 특정 대역만 명시 라우팅으로 잡음
- 둘 다 게이트웨이를 박으면 metric 경합으로 한쪽이 죽음

## 셋업 (관리자 PowerShell)

```powershell
# 1. Ethernet에 고정 IP만 (gateway 인자 생략!)
netsh interface ipv4 set address name="이더넷" static 10.130.248.217 255.255.255.0

# 2. 사내망 대역 영구 라우팅 (-p = persistent, 재부팅해도 유지)
route -p add 10.130.0.0 mask 255.255.0.0   10.130.248.1
route -p add 172.16.0.0 mask 255.240.0.0   10.130.248.1   # 172.16~31 통째
```

`netsh ... static IP MASK`까지만 — `gateway` 인자를 안 주는 게 포인트. 주는 순간 Ethernet이 기본 라우트 후보로 등록돼서 WiFi 인터넷이 끊기거나 느려질 수 있다.

## 검증

```powershell
# 사내 IP가 Ethernet으로 나가는지
Find-NetRoute -RemoteIPAddress 172.22.101.131
# → InterfaceAlias: 이더넷, NextHop: 10.130.248.1   ✅

# 외부는 WiFi로 나가는지
Find-NetRoute -RemoteIPAddress 8.8.8.8
# → InterfaceAlias: Wi-Fi, NextHop: 192.168.0.1     ✅

# 라우팅 테이블 전체 확인
Get-NetRoute -AddressFamily IPv4 |
  Where-Object { $_.DestinationPrefix -match '^(10\.130|172\.1[6-9]|172\.2[0-9]|172\.3[01])\.' } |
  Format-Table DestinationPrefix, NextHop, InterfaceAlias, RouteMetric
```

## 함정

### 1. 한글 Windows의 인터페이스 별칭은 "이더넷"

`netsh interface ipv4 set address name="Ethernet"` 은 한글 Windows에서 **실패**한다. 실제 별칭이 한글 "이더넷"이라서. `Get-NetAdapter`로 정확한 이름 먼저 확인:

```powershell
Get-NetAdapter | Select-Object Name, InterfaceDescription, Status
```

크로스 플랫폼 스크립트라면 인터페이스 이름은 변수로 빼두고 OS 로케일별로 다르게 잡아야 함.

### 2. macOS와 비교

| 항목 | macOS | Windows |
|---|---|---|
| 영구 라우팅 | 매 부팅마다 재등록 필요 | `route -p add` 한 번이면 끝 |
| 기본 GW 처리 | Service Order로 우선순위 | metric으로 우선순위 |
| Ethernet에 GW 설정 | `networksetup -setmanual ... GW` (service order로 회피 가능) | 박는 순간 경합 — 비워두는 게 정답 |

### 3. Windows 11에 native sudo 있다

설정 → 시스템 → 개발자용 → "sudo 사용" 토글, 또는:

```powershell
sudo config --enable normal
```

이후 일반 PowerShell에서 `sudo netsh ...`로 권한 승격. UAC 모달 한 번 뜸. 따로 관리자 터미널 열 필요 없어짐.

## 참고

- 이 패턴은 사내망 점프 호스트 없이 직접 접근할 때 흔히 쓰는 dual-homing 셋업. VPN과는 별개 — VPN은 가상 인터페이스를 또 하나 만들 뿐 원리는 동일.
