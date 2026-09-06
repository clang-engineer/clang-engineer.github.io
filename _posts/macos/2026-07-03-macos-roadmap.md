---
title       : "macOS 로드맵 — 셋업·런처·창 관리의 세 갈래"
description : "macOS 개발환경 글을 시스템 셋업, 런처·생산성, 창 관리·자동화라는 세 독립 축으로 나눈다. 새 Mac에서는 시스템 셋업을 먼저 권장하지만, 세 축을 얕은→깊은 학습 단계로 보지 않는다."
date        : 2026-07-03 17:30:00 +0900
updated     : 2026-09-06 19:00:00 +0900
categories  : [macos, "개요·인덱스"]
tags        : [roadmap, macos, aerospace, hammerspoon, window-manager]
pin         : false
hidden      : false
---

macOS를 개발환경으로 다듬을 때 만나는 문제는 하나의 학습 사다리가 아니다.

```text
시스템 셋업
→ 새 Machine을 개발 가능한 상태로 만든다

런처·생산성
→ App·명령·정보에 빨리 접근한다

창 관리·자동화
→ Workspace와 Window를 배치하고 반복 동작을 자동화한다
```

세 갈래는 서로 영향을 주지만 **독립적인 문제축**이다. 새 Mac을 막 받았다면 시스템 셋업부터 하는 것이 자연스럽지만, 이미 환경이 갖춰져 있다면 런처나 창 관리부터 바로 들어가도 된다.

## 한눈에 보기

| 갈래 | 답하는 질문 | 대표 진입점 |
|---|---|---|
| 시스템 셋업 | 새 Mac을 어떻게 재현 가능한 개발환경으로 만들까 | [새 맥 초기 설정](./2022-02-05-new-mac-initial-setup.md) |
| 런처·생산성 | Spotlight·Alfred·Raycast 중 무엇을 어디까지 맡길까 | [생산성 런처 비교](./2025-10-31-productivity-launchers.md) |
| 창 관리·자동화 | Workspace·Window 배치·자동화를 어떤 도구에 맡길까 | [Rectangle 기본](./2026-07-03-rectangle-app-basics.md) · [AeroSpace 기본](./2026-07-03-aerospace-basics.md) |

새 Mac에서의 **추천 작업 순서**와 세 갈래의 **개념적 관계**는 구분한다.

```text
새 Mac Day-1 추천
System Setup
→ 필요한 Tool 설치
→ 필요하면 Launcher / Window Manager 추가

개념 관계
System Setup   Launcher   Window Management
     │             │             │
     └──── 서로 조합되지만 독립 축 ────┘
```

## 1. 시스템 셋업 — Machine을 개발 가능한 상태로 만든다

이 갈래는 실제 Day-1 작업 순서가 있다.

| 글 | 핵심 |
|---|---|
| [새 맥 초기 설정 — 셋업 순서](./2022-02-05-new-mac-initial-setup.md) | 시스템 설정 → Homebrew → dotfiles → Git 인증·Identity로 이어지는 Runbook |
| [macOS 시스템 설정](./2026-07-03-macos-system-settings.md) | 입력·Trackpad·Mission Control·Terminal·Accessibility 등 OS 자체 설정 |
| [macOS CLI 개발 도구 모음](./2026-07-03-macos-cli-toolkit-brewfile.md) | bat·eza·fd·ripgrep·fzf·lazygit 등 CLI Tool의 역할 지도 |
| [새 맥에 더 얹을 보조 유틸](./2026-07-03-macos-extra-utilities.md) | Menu Bar·Monitoring·Screenshot·Display·Terminal 등 선택적 Utility |

Package 목록과 설정 파일을 **재현 가능한 상태로 관리하는 정본**은 macOS Roadmap이 아니다.

```text
macOS Roadmap
→ 새 Machine에서 무엇을 어떤 순서로 준비할지

dotfiles Roadmap
→ 설정·Package·Machine별 차이를 어떻게 코드로 재현할지
```

환경 재현을 깊게 보면 [dotfiles 로드맵](../shell/2026-07-08-dotfiles-roadmap.md)으로 넘어간다.

### Troubleshooting — 셋업 중 막힐 때

| 글 | 증상 |
|---|---|
| [brew cleanup 후 java_home이 엉뚱한 버전을 반환할 때](./2026-06-07-homebrew-cleanup-java-symlink-broken.md) | JDK Symlink가 깨져 Version 탐색이 꼬인 경우 |
| [Docker 실행 시 Operation not permitted](./2023-12-16-docker-operation-not-permitted.md) | macOS File/Folder 접근 권한 문제 |

Troubleshooting은 셋업 학습의 다음 단계가 아니라 **같은 증상이 생겼을 때만 들어오는 분기**다.

## 2. 런처·생산성 — 무엇을 빠르게 호출할 것인가

| 글 | 핵심 |
|---|---|
| [Spotlight vs Alfred vs Raycast — 생산성 런처 비교](./2025-10-31-productivity-launchers.md) | Search·Action·확장 모델·Clipboard·Sync·비용이라는 공통 비교축으로 선택 |
| [Raycast를 검색 계층으로 한정하기](./2026-07-03-raycast-search-layer-role.md) | AeroSpace·Hammerspoon과 기능이 겹치지 않게 Search/Command Entry 역할로 한정 |

여기서 중요한 것은 "Raycast가 더 고급"이 아니라 **역할 경계**다.

```text
검색·명령 진입
→ Spotlight / Alfred / Raycast

Workspace 관리
→ AeroSpace

Window 배치·자동화
→ Hammerspoon
```

Raycast의 Window Management 기능을 쓸 수도 있지만, 여러 도구를 함께 쓸 경우 한 기능의 Owner를 하나로 정해야 Shortcut 충돌과 설정 중복이 줄어든다.

## 3. 창 관리·자동화 — 공간과 배치를 분리한다

창 관리 갈래에서는 먼저 두 질문을 분리한다.

```text
어느 작업 공간에 둘까?
→ Workspace Management

현재 화면 안에서 어디에 배치할까?
→ Window Layout / Automation
```

이 블로그의 주 조합은 다음과 같다.

| 책임 | 도구 |
|---|---|
| 가장 쉬운 GUI Window Split | Rectangle |
| Workspace·Focus·이동 | AeroSpace |
| 정밀 Window 배치·Automation·Overlay | Hammerspoon |
| 여러 Workspace에 흩어진 특정 Window 탐색 | AltTab |

### 3-1. 가장 쉬운 출발점

| 글 | 핵심 |
|---|---|
| [Rectangle.app 기본](./2026-07-03-rectangle-app-basics.md) | GUI와 Shortcut으로 Window Split을 먼저 익힘 |

Rectangle은 필수 선행지식이 아니라 **창 배치 요구를 가장 낮은 진입 비용으로 경험하는 선택지**다.

### 3-2. Workspace와 자동화 도구를 각각 이해한다

| 글 | 핵심 |
|---|---|
| [AeroSpace 기본](./2026-07-03-aerospace-basics.md) | Workspace·Focus·Move·`on-window-detected` 등 공간 관리 |
| [AeroSpace 서비스 모드](./2026-07-14-aerospace-service-mode.md) | 기본 사용 위에 서비스 모드의 역할과 설계 철학을 Zoom-in |
| [Hammerspoon 기본](./2026-07-03-hammerspoon-basics.md) | `init.lua`, `hs.*` API, Hotkey, IPC, Module 구조로 macOS Automation |

AeroSpace와 Hammerspoon은 경쟁 도구로만 보지 않는다.

```text
AeroSpace
→ Workspace / Tiling state

Hammerspoon
→ macOS Automation / Window Geometry / UI

필요할 때
→ 느슨하게 연동
```

### 3-3. 두 축이 실제 Workflow에서 만나는 지점

| 글 | 핵심 |
|---|---|
| [AeroSpace + Hammerspoon 창 재정렬](./2026-07-03-aerospace-hammerspoon-window-reflow.md) | Workspace 상태와 화면 배치 Automation을 연결 |
| [Rectangle.app을 Hammerspoon으로 대체하기](./2026-07-03-hammerspoon-window-tiling-rectangle.md) | GUI Window Split을 직접 Automation Code로 옮김 |
| [AeroSpace Workspace 정보 Overlay](./2026-07-03-aerospace-workspace-overlay.md) | 현재 Workspace 정보를 Hammerspoon UI로 표시 |
| [AltTab Window Switcher](./2026-07-03-alttab-window-switcher.md) | App 전환과 Window 전환의 차이를 보완 |

이 네 글은 모든 사용자가 순서대로 읽어야 하는 단계가 아니다. **현재 불편의 종류에 따라 들어가는 Zoom-in**이다.

```text
Workspace 전환 후 Window 위치가 흐트러진다
→ Reflow

Rectangle 기능을 Code로 통합하고 싶다
→ Hammerspoon Window Tiling

현재 Workspace가 헷갈린다
→ Overlay

특정 Window를 바로 찾고 싶다
→ AltTab
```

### Troubleshooting — 단축키가 갑자기 막힐 때

| 글 | 증상 |
|---|---|
| [AeroSpace 단축키가 갑자기 안 될 때 — Secure Input](./2026-06-07-aerospace-secure-input-hotkey-blocked.md) | 특정 App/보안 입력 상태에서 Global Hotkey가 차단되는 문제 |

## 다른 Roadmap과의 경계

```text
macOS 자체 설정·Productivity Surface
→ 현재 Roadmap

설정과 Package를 Machine 간 재현
→ dotfiles Roadmap

Terminal / TTY / PTY 내부 원리
→ Terminal Roadmap

Shell Script와 Process·Job
→ Shell Roadmap

키보드 Firmware·OS Key Remap
→ Keyboard Roadmap
```

- [dotfiles 로드맵](../shell/2026-07-08-dotfiles-roadmap.md)
- [Terminal 로드맵](../terminal/2026-09-05-terminal-roadmap.md)
- [셸 로드맵](../shell/2026-07-03-shell-roadmap.md)
- [키보드 로드맵](../keyboard/2026-07-03-keyboard-roadmap.md)

## 어디서 시작할까

```text
새 Mac을 받았다
→ 새 맥 초기 설정
→ macOS 시스템 설정
→ 환경 재현은 dotfiles Roadmap

App·명령을 더 빨리 찾고 실행하고 싶다
→ 생산성 런처 비교
→ 필요하면 Raycast 역할 한정

창 배치가 불편하다
→ Rectangle
또는
→ AeroSpace / Hammerspoon 중 필요한 책임부터

AeroSpace와 Hammerspoon을 이미 쓴다
→ 현재 문제에 따라 Reflow / Tiling / Overlay / AltTab로 Zoom-in
```

> **시스템 셋업, 런처, 창 관리는 하나의 얕은→깊은 사다리가 아니다. 새 Mac에서는 셋업을 먼저 할 뿐, 이후에는 독립된 문제축에서 필요한 문서로 바로 들어간다.**
