---
title       : "AeroSpace 단축키가 갑자기 안 될 때 — macOS Secure Input 확인하기"
description : "AeroSpace global hotkey가 멈췄을 때 설정 오류로 단정하지 않고 Secure Input 여부와 해당 기능을 활성화한 앱을 먼저 확인하는 진단 흐름을 정리한다."
date        : 2026-06-07 12:00:00 +0900
updated     : 2026-10-26 15:02:00 +0900
categories  : [troubleshooting, "macos"]
redirect_from:
  - /posts/etc/2026-06-07-aerospace-secure-input-hotkey-blocked/
  - /posts/macos/2026-06-07-aerospace-secure-input-hotkey-blocked/
tags        : [macos, aerospace, secure-input, hotkey, troubleshooting]
pin         : false
hidden      : false
---

AeroSpace의 global hotkey가 갑자기 전부 동작하지 않는데 설정 파일은 바뀐 게 없다면 **macOS Secure Input**을 확인할 가치가 있다.

AeroSpace 자체에서도 Secure Input이 global hotkey를 가로채지 못하게 만드는 흔한 원인이라고 안내해 왔고, 최근 버전은 Secure Input 상태를 표시하는 기능도 추가했다.

다만:

```text
AeroSpace Hotkey가 안 됨
= 무조건 Secure Input
```

은 아니다. 단축키 충돌, Accessibility/Input Monitoring 권한, 설정 오류도 별도 원인이 될 수 있으므로 **Secure Input은 빠르게 배제할 수 있는 한 진단 축**으로 본다.

## 1. Secure Input은 무엇인가

macOS의 Secure Input(Secure Event Input)은 비밀번호처럼 민감한 키 입력을 다른 process가 가로채지 못하도록 보호하는 메커니즘이다.

```text
Keyboard
   ↓
Secure Input 활성 App
   ↓
민감한 입력 보호

다른 Global Hotkey Listener
→ Key Event 접근 제한
```

이 기능 자체는 보안 기능이므로 끄는 것이 목적이 아니다. **필요하지 않은 상황에서도 어떤 앱이 Secure Input 상태를 계속 유지하고 있는지**를 찾는 것이 진단의 핵심이다.

## 2. AeroSpace에서 먼저 상태를 본다

최근 AeroSpace 버전에서는 Secure Input이 활성화된 상태를 UI에서 표시할 수 있다.

따라서 hotkey가 갑자기 멈췄다면:

```text
AeroSpace Secure Input 표시 확인
        ↓
표시됨
→ Secure Input을 잡고 있는 앱 조사

표시 없음
→ Key Binding / Permission / Config 축 확인
```

처럼 시작할 수 있다.

## 3. PID를 확인하고 싶다면

환경에 따라 `ioreg` 출력에서 Secure Input 관련 PID를 확인할 수 있다.

```bash
ioreg -l -w 0 | grep -i SecureInput
```

출력에 PID가 보이면 해당 process를 확인한다.

```bash
ps -p <PID> -o pid=,comm=
```

macOS 내부 출력 형식은 버전에 따라 달라질 수 있으므로 특정 key 이름 하나에 script를 강하게 의존하기보다 **현재 Secure Input 상태와 process를 찾는 진단 보조 수단**으로 사용한다.

## 4. 원인 앱을 좁힌다

Secure Input을 사용하는 앱은 비밀번호 입력기, password manager, terminal 등 여러 종류일 수 있다.

AeroSpace 사용자 사례에서도 1Password, Bitwarden 같은 앱이 Secure Input을 유지해 hotkey가 막힌 사례가 있다.

따라서 원인을 모르면:

```text
Secure Input 활성 확인
   ↓
최근 Focus했던 민감 입력 App부터 종료/재실행
   ↓
AeroSpace Hotkey 재확인
   ↓
원인 App 좁히기
```

방식으로 접근한다.

특정 제품을 "항상 원인"으로 외우지 않는다.

## 5. 실제 사례: Chrome에서 벗어났는데도 단축키가 안 됨 (2026-10-26)

`Option + 숫자`로 AeroSpace 워크스페이스를 전환하던 중 단축키가 갑자기 먹히지 않았다. 전면 앱은 터미널이었지만, 다음을 확인했다.

- AeroSpace 프로세스는 실행 중이고 현재 모드는 `main`이었다.
- `aerospace config --get mode.main.binding.alt-1`은 설정된 워크스페이스 명령을 반환했다.
- Hammerspoon의 `hs.eventtap.isSecureInputEnabled()`는 `true`였다.
- `ioreg -l -w 0 | grep -i SecureInput`에 나온 점유 PID를 `ps`로 조회하니 **Google Chrome**이었다.

즉 **현재 화면에 보이는 앱과 Secure Input을 점유한 앱이 달랐다.** 포커스를 터미널로 옮긴 것만으로 Secure Input이 해제됐다고 가정하면 원인을 놓칠 수 있다. Chrome의 비밀번호·인증 입력 화면을 닫고 단축키를 다시 확인한다. 보호할 입력이 없는데도 상태가 지속된다면 Chrome을 정상 종료·재실행한 뒤 재검사한다. Secure Input 자체를 강제로 끄지는 않는다.

이 사례에서는 점유 앱과 활성 상태를 확인했고 이후 단축키가 다시 동작했다. **Chrome의 어떤 화면이 상태를 유지했는지, 정확히 어떤 조치로 해제됐는지는 확인하지 못했으므로** 특정 기능의 버그라고 단정하지 않는다.

## 6. Terminal.app의 Secure Keyboard Entry

Apple Terminal에는 명시적인 **Secure Keyboard Entry** 기능이 있다.

현재 상태는 Terminal 메뉴에서:

```text
Terminal → Secure Keyboard Entry
```

의 체크 여부로 확인한다.

Apple도 이 기능을 켜면 다른 앱이 Terminal에서 입력한 키를 감지하지 못하도록 할 수 있다고 설명한다.

AeroSpace hotkey가 Terminal 사용 중에만 동작하지 않고 Secure Keyboard Entry가 필요하지 않은 상황이라면 해당 기능을 끈 뒤 다시 확인할 수 있다.

반대로 password나 민감한 정보를 입력하기 위해 의도적으로 켠 상태라면 보안 기능을 무작정 비활성화하기보다 **작업이 끝난 뒤 상태가 정상적으로 해제되는지**를 본다.

## 7. Secure Input이 아니라면 다음 축으로 이동한다

Secure Input이 비활성인데 AeroSpace key binding이 동작하지 않는다면 다음을 확인한다.

```text
AeroSpace Config
├─ Binding 자체가 존재하는가?
├─ 현재 Mode가 다른가?
└─ 다른 App Hotkey와 충돌하는가?

macOS Permission
├─ Accessibility
└─ 필요한 Keyboard 관련 권한

AeroSpace Process
└─ 정상 실행 중인가?
```

즉 Secure Input 진단으로 문제가 아니라고 확인했다면 같은 축에서 앱을 계속 종료하기보다 다음 계층으로 이동한다.

## 8. "다른 Terminal로 바꾸기"가 근본 해결은 아니다

Secure Input은 Terminal.app만의 기능이 아니라 macOS 전체 메커니즘이다. 다른 terminal emulator나 password manager도 상황에 따라 Secure Input을 사용할 수 있다.

따라서:

```text
Secure Input 문제
→ Terminal 제품 자체를 무조건 교체
```

보다는:

```text
어떤 App이 언제 Secure Input을 활성화하는가?
        ↓
의도된 동작인가, 해제되지 않은 상태인가?
        ↓
App 설정·업데이트·재시작으로 원인 해결
```

순서가 맞다.

## 정리

```text
AeroSpace Global Hotkey 먹통
   ↓
Secure Input 상태 확인
   ↓
활성이라면 원인 Process 확인
   ↓
의도되지 않은 Secure Input 상태 해제
   ↓
Hotkey 재검증
   ↓
아니면 Config / Permission / 충돌 진단
```

핵심은 AeroSpace를 바로 재설치하거나 설정을 갈아엎기 전에 **macOS가 global key interception 자체를 제한하고 있는 상황인지 먼저 분리하는 것**이다.

## 참고

- [Apple — Use secure keyboard entry in Terminal on Mac](https://support.apple.com/guide/terminal/trml109/mac)
- [AeroSpace Issue #1486 — Secure Input indication](https://github.com/nikitabobko/AeroSpace/issues/1486)
