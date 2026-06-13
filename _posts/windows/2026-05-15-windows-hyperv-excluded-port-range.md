---
title       : "Windows에서 포트가 '갑자기' 안 잡히면 Hyper-V 동적 예약 범위부터 확인"
description : "Hyper-V/WSL/Docker가 부팅 시 동적으로 예약하는 TCP 포트 범위를 확인하는 진단 절차"
date        : 2026-05-15 13:00:00 +0900
updated     : 2026-05-15 13:00:00 +0900
categories  : [windows, "네트워크·트러블"]
tags        : [port, netsh]
pin         : false
hidden      : false
---

윈도우는 부팅 시점에 Hyper-V / WSL / Docker Desktop 가 쓸 TCP 포트 범위를 동적으로 예약한다. 어제까지 잘 잡히던 9060 이 갑자기 안 뜨면, 진짜 충돌이 아니라 **이 예약 범위에 들어가서 OS 가 막은 것**일 수 있다.

## 진단

```powershell
netsh int ipv4 show excludedportrange protocol=tcp
```

출력 예:

```text
Start Port    End Port
----------    --------
      7895        7895
     50000       50059     *
     53129       53228
     55440       55539
     64732       64831
```

- 이 범위에 든 포트는 **어떤 프로세스도** 바인딩 불가
- `netstat` 으로 LISTEN 안 보임 → "아무도 안 잡고 있는데 왜 안 돼?" 상태
- `*` 는 명시적 관리자 예약, 표시 없음은 부팅 시 동적 예약

## "갑자기" 가 발생하는 트리거

- 윈도우 업데이트 / 재부팅 후 예약 범위가 바뀜
- Hyper-V·WSL 새로 활성화
- Docker Desktop 시작/정지 후 범위 변동

## 해결

상황별로 셋 중 하나:

1. **포트 바꾸기** — 가장 빠름. dev-server 면 `devServer.port` 를 예약 범위 밖 안전한 값(3000, 8081 등) 으로.
2. **동적 범위 자체 옮기기** — 관리자 PowerShell, 재부팅 필요.
   ```powershell
   netsh int ipv4 set dynamic tcp start=49152 num=16384
   ```
3. **Hyper-V 끄기** — 가상화 안 쓰는 사람만.

## 함께 외워 두면 좋은 진단 순서

dev-server 가 묘하게 안 뜰 때:

```powershell
# 누가 잡고 있는가
netstat -ano | findstr LISTENING | findstr ":<port>"

# OS 가 예약했는가
netsh int ipv4 show excludedportrange protocol=tcp

# 좀비 프로세스 있는가
tasklist | findstr node.exe
```

셋 다 깨끗한데도 안 되면 그때 비로소 IPv6 루프백 / dual-stack / 라이브러리 호환 의심.
