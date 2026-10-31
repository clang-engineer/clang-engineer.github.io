---
title       : "Tiling Window Management — 창 배치와 작업 공간의 구조"
description : "창·레이아웃·워크스페이스·포커스의 관계와 Linux의 i3·Sway, macOS의 AeroSpace·yabai를 비교하고 tmux와의 관리 계층을 구분한다."
date        : 2026-10-05 18:52:00 +0900
updated     : 2026-10-31 13:00:00 +0900
categories  : [developer-tools, "관계도"]
tags        : [window-manager, tiling, i3, sway, aerospace, yabai, macos, linux, map]
pin         : false
hidden      : false
---

> **도구 목록·치트시트는 [Devkit 도구 지도]({{ '/devkit/' | relative_url }})에서 탐색한다.** 이 글은 특정 제품의 사용법보다 타일링 창 관리의 개념과 플랫폼별 구현 차이를 설명한다.
{: .prompt-info }

## 왜 창 관리가 필요한가

GUI에서 여러 프로그램을 동시에 다루려면 창의 **위치·크기(Layout)**, 현재 작업할 창(**Focus**), 작업 단위(**Workspace**)를 관리해야 한다. 전통적인 floating 배치는 창을 겹쳐 자유롭게 놓고, tiling 배치는 화면 영역을 나눠 창을 배치한다.

```text
Window Management
├─ Window     : 관리 대상인 GUI 창
├─ Layout     : 창의 크기와 배치 (Floating / Tiling)
├─ Focus      : 키보드 입력을 받을 창
└─ Workspace  : 창을 묶고 전환하는 작업 공간
```

타일링은 단순히 창을 반으로 나누는 단축키가 아니라 **창이 추가·제거될 때 레이아웃을 지속적으로 관리하는 방식**이다. 필요에 따라 floating 창을 함께 사용할 수 있다.

## 플랫폼에 따라 구현 계층이 다르다

```text
Tiling Window Management
│
├─ Linux
│  ├─ X11     → i3    (Window Manager)
│  └─ Wayland → Sway  (Compositor)
│
└─ macOS
   ├─ AeroSpace      (i3-like workspace / tiling)
   └─ yabai          (tiling / scripting)
```

**i3**는 X11 서버와 협력하는 타일링 윈도우 매니저다. **Sway**는 i3의 조작 모델과 설정 철학을 Wayland 환경으로 가져온 컴포지터로, 화면 출력과 입력·창 합성까지 담당한다. Ubuntu 같은 Linux 데스크톱에서는 GNOME 세션 대신 i3 또는 Sway 세션을 선택할 수 있다.

macOS는 시스템 윈도우 서버를 Linux의 i3/Sway처럼 교체하는 방식이 아니다. **AeroSpace**와 **yabai**는 기존 macOS 위에서 창 배치와 작업 공간을 제어한다. 따라서 네 도구는 기능적으로 같은 문제를 풀지만 운영체제를 가로질러 직접 설치·교체하는 경쟁 제품은 아니다.

## macOS: AeroSpace와 yabai

| 관점 | AeroSpace | yabai |
|---|---|---|
| 핵심 경험 | i3 스타일 키보드 중심 작업 | 자동 타일링과 세밀한 스크립팅 |
| 작업 공간 | 자체 워크스페이스 모델 | macOS Spaces와 연동 |
| 배치 | 컨테이너 기반 트리 레이아웃 | BSP 기반 레이아웃 |
| 도입 시 고려 | 워크스페이스 동작 방식 | 일부 고급 기능의 권한·시스템 설정 |

이미 AeroSpace로 원하는 배치와 전환이 가능하다면 yabai는 필수 추가 도구가 아니라 **대체 후보**다.

- [AeroSpace 기본]({% post_url macos/2026-07-03-aerospace-basics %})
- [AeroSpace 서비스 모드]({% post_url macos/2026-07-14-aerospace-service-mode %})

## 터미널 분할과는 관리 계층이 다르다

```text
Desktop
└─ AeroSpace / i3 / Sway / yabai  : GUI Window · Workspace
   └─ Terminal Emulator           : 터미널 창
      └─ tmux                      : Session · Window · Pane
         └─ Shell / Neovim         : 명령 실행 · 편집
```

GUI 타일링은 **애플리케이션 창의 공간 배치**를 담당한다. tmux의 Pane도 화면을 분할하지만, **터미널 세션과 실행 상태를 유지**하는 기능까지 제공한다. 그래서 두 도구는 분할 기능이 겹쳐도 서로 완전히 대체하지 않는다.

## 인접 도구와 경계

**Rectangle**은 단축키로 창을 화면의 절반·사분면 등에 놓는 *window placement utility*다. **Hammerspoon**은 Lua로 창 제어를 포함한 macOS 전반을 자동화하는 *desktop automation runtime*이다. 둘 다 창을 움직일 수 있지만 i3·Sway·AeroSpace·yabai와 같은 타일링 매니저 범주로 묶지는 않는다.

- [Rectangle 기본]({% post_url macos/2026-07-03-rectangle-app-basics %})
- [Hammerspoon 기본]({% post_url macos/2026-07-03-hammerspoon-basics %})

## 선택 기준

Linux에서 X11을 쓴다면 i3, Wayland 기반 타일링 세션을 원한다면 Sway를 검토한다. macOS에서는 AeroSpace와 yabai 중 **워크스페이스 모델과 자동화 요구**에 맞는 하나를 선택하면 된다. 단순한 창 위치 단축키가 목적이라면 Rectangle만으로 충분할 수 있다.

이 문서는 개념과 관계를 관리한다. 설치 방법·단축키·개별 설정은 각 도구 문서와 Devkit 치트시트에 둔다.
