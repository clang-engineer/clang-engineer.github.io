---
title       : macOS 시스템 설정 — 세벌식·트랙패드·터미널·앱 권한
description : "새 맥을 개발 환경으로 다듬을 때 손보는 시스템 설정 모음. 세벌식 입력, Caps Lock 전환, 세 손가락 드래그, Mission Control 단축키 충돌부터 터미널 테마, JetBrains, 앱 접근 권한, vim 스크롤까지."
date        : 2026-07-03 13:30:00 +0900
updated     : 2026-07-03 13:30:00 +0900
categories  : [macos, "시스템 운영"]
tags        : [macos, settings, terminal]
pin         : false
hidden      : false
---

새 맥을 개발 환경으로 만들 때, 도구를 얹기 전에 macOS 자체에서 손봐 두는 설정들이 있다. 한 번 맞춰 두면 이후 작업이 훨씬 매끄러워지는 항목만 모았다.

> 새 맥 셋업의 전체 순서(이 설정 → Homebrew → dotfiles → Git)는 [새 맥 초기 설정](/posts/macos/2022-02-05-new-mac-initial-setup/)에서 다룬다. 이 글은 그중 **시스템 설정 단계**를 자세히 푼 것이다.
{: .prompt-info }

## 시스템·키보드 설정

- 독 위치 조정 (System Settings → Desktop & Dock)
- 세벌식 입력 소스 추가
- 자동 대소문자 전환 끄기 (System Settings → Keyboard → Text → Capitalize words automatically)
- Caps Lock으로 대소문자 전환 활성화 (System Settings → Keyboard → Input Sources)
- 세 손가락 드래그 활성화
  + System Settings → 손쉬운 사용(Accessibility) → 포인터 제어기 → 트랙패드 옵션
  + 드래그 활성화에서 "세 손가락으로 드래그하기" 선택
- vim에서 `Ctrl + ↑/↓/←/→`를 사용하려면 Mission Control 단축키와 충돌을 없애야 한다 (Mission Control → 단축키 → Mission Control → '이동' 항목 체크 해제)

## 터미널 테마

- [macos-terminal-themes](https://github.com/lysyi3m/macos-terminal-themes)에서 테마 다운로드
- Terminal → Preferences → Profiles → Import → 내려받은 테마 파일 선택

> VS Code Dark 테마를 추천한다.
{: .prompt-tip }

## JetBrains 환경 설정

- Toolbox를 통해 IntelliJ, CLion, DataGrip 등을 설치한다.

## 앱 접근 권한

일부 앱은 시스템 제어를 위해 접근 권한을 명시적으로 허용해야 동작한다.

- Hammerspoon: Privacy & Security → Accessibility에서 접근 권한 허용
- AeroSpace 등 단축키 기반 도구도 마찬가지로 Accessibility 권한이 필요하다.

> 단축키가 갑자기 안 먹는다면 권한 문제일 수 있다. [AeroSpace 단축키가 갑자기 안 될 때 — macOS Secure Input](/posts/macos/2026-06-07-aerospace-secure-input-hotkey-blocked/)도 함께 참고.
{: .prompt-tip }

## 터미널에서 vim 스크롤이 안 될 때

Terminal → Settings → Profiles에서 "Scroll alternate screen" 옵션을 비활성화하면 된다.

![터미널 대체 화면 스크롤 옵션 비활성화](https://user-images.githubusercontent.com/39648594/207744062-ad50f078-7b15-44a6-98b4-ac12a7262f51.png)
