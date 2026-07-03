---
title       : "AeroSpace 단축키가 갑자기 안 될 때 — macOS Secure Input"
description : "Secure Input 활성 상태에서는 시스템 핫키를 잡지 못한다. 진단부터 해결까지."
date        : 2026-06-07 12:00:00 +0900
updated     : 2026-06-07 12:00:00 +0900
categories  : [macos, "창 관리"]
redirect_from:
  - /posts/etc/2026-06-07-aerospace-secure-input-hotkey-blocked/
tags        : [macos, troubleshooting]
pin         : false
hidden      : false
---

AeroSpace 단축키가 어느 순간 먹통이 되는 경우가 있다. 재시작해도 안 되고, 설정도 멀쩡한데 동작만 안 함. 거의 항상 **Secure Input**이 켜져 있는 상황이다.

## Secure Input이 무엇이고 왜 단축키를 막나

Secure Input은 macOS의 키 입력 가로채기를 막는 보안 메커니즘이다. 비밀번호 필드처럼 민감한 입력을 받는 앱이 활성화하면, **다른 앱(= AeroSpace 같은 핫키 매니저 포함)이 키 이벤트를 받지 못한다**. 그래서 단축키가 전부 무시된다.

## 진단

지금 누가 Secure Input을 잡고 있는지 확인:

```sh
ioreg -l -w 0 | grep SecureInput
# kCGSSessionSecureInputPID = <PID>

ps -p <PID> -o comm=
# 어떤 앱인지 확인
```

## 흔한 원인 & 해결

| 원인 | 해결 |
|---|---|
| **IntelliJ 내장 터미널** | 창을 다른 데로 포커스 → 돌아오기. 안 되면 IntelliJ 재시작 |
| **Terminal.app** | Settings → Profiles → Advanced → "Secure Keyboard Entry" 체크 해제 |
| **1Password / KeePassXC** | 앱을 닫거나 최소화 |

## 근본적 해결

자주 발생한다면 **Secure Input을 기본 활성화하지 않는 터미널**로 갈아타는 게 정답:

- iTerm2
- Alacritty
- Kitty
- WezTerm

특히 IntelliJ 내장 터미널은 자주 원인이 되니, 외부 터미널을 띄워서 쓰는 게 안전하다.

## 핵심 정리

AeroSpace 단축키가 안 먹으면 **재설정·재설치 전에 `ioreg` 한 줄 먼저**. 십중팔구 어떤 앱이 Secure Input을 잡고 있다.
