---
title       : AeroSpace 기본 — 워크스페이스·단축키·on-window-detected
description : "SIP 비활성화 없이 쓰는 macOS 타일링 워크스페이스 매니저 AeroSpace. 설치부터 alt-hjkl 포커스·이동, 워크스페이스 전환, .aerospace.toml의 mode.main.binding과 on-window-detected 자동 배치까지 기본기를 정리한다."
date        : 2026-07-03 23:30:00 +0900
updated     : 2026-07-03 23:30:00 +0900
categories  : [macos, "창 관리"]
tags        : [aerospace, window-manager, tiling]
pin         : false
hidden      : false
---

[AeroSpace](https://github.com/nikitabobko/AeroSpace)는 macOS용 타일링 워크스페이스 매니저다. 이 글은 처음 설치해서 손에 익히는 **기본기**를 다룬다. Hammerspoon과의 연동이나 심화 자동화는 [macOS 로드맵](/posts/macos/2026-07-03-macos-roadmap/)의 창 관리 갈래에서 이어진다.

> AeroSpace를 고르는 이유는 **SIP(System Integrity Protection)를 비활성화하지 않는다**는 점이다. 자체 가상 워크스페이스로 macOS 네이티브 Spaces를 우회하므로 OS 업데이트에 강하다. (yabai는 전체 기능에 SIP 비활성화가 필요해 업데이트마다 깨지기 쉽다.)
{: .prompt-tip }

## 설치

```sh
brew install --cask nikitabobko/tap/aerospace
```

설정 파일은 `~/.aerospace.toml`이다. 로그인 시 자동 실행하려면 맨 위에 다음을 둔다.

```toml
start-at-login = true
```

## 핵심 개념 — 워크스페이스와 타일링

AeroSpace의 두 축은 **워크스페이스**와 **레이아웃**이다.

- **워크스페이스**: 창을 담는 가상 공간. 숫자·이름으로 구분하고 단축키로 즉시 전환한다. macOS 기본 Spaces와 달리 애니메이션 없이 순간 전환된다.
- **레이아웃**: 한 워크스페이스 안에서 창을 어떻게 배치하는가. `tiles`(바둑판)·`accordion`(겹침)·`floating`(자유 배치).

## 기본 단축키

단축키는 `[mode.main.binding]` 아래에 선언한다. 아래는 실제로 쓰는 설정의 핵심이다.

```toml
[mode.main.binding]
# 포커스 이동 (vim 방향키)
alt-h = 'focus left'
alt-j = 'focus down'
alt-k = 'focus up'
alt-l = 'focus right'

# 창 이동
alt-shift-h = 'move left'
alt-shift-j = 'move down'
alt-shift-k = 'move up'
alt-shift-l = 'move right'

# 워크스페이스 전환
alt-1 = 'workspace 1:Browser'
alt-2 = 'workspace 2:Terminal'
alt-3 = 'workspace 3:Company'
alt-4 = 'workspace 4:JetBrains'

# 레이아웃
alt-slash = 'layout tiles horizontal vertical'
alt-comma = 'layout accordion horizontal vertical'
alt-f = 'fullscreen'
alt-tab = 'workspace-back-and-forth'    # 직전 워크스페이스로 토글
```

> `[mode.main.binding]`은 **기본 단축키를 전부 덮어쓴다.** 그래서 `alt-h` 같은 기본 키도 직접 다시 나열해야 한다. 처음에 "왜 기본 키가 안 먹지" 하는 함정이 여기다.
{: .prompt-warning }

워크스페이스에 `1:Browser`처럼 이름을 붙이면, 전환·이동 명령에서 같은 이름을 그대로 쓴다. 숫자만 쓸 때보다 "지금 어디로 가는지"가 명확해진다.

## on-window-detected — 앱을 워크스페이스에 자동 배치

창이 새로 뜰 때 규칙에 따라 자동으로 워크스페이스에 보내고 레이아웃을 정할 수 있다. 앱을 열 때마다 손으로 옮기지 않아도 된다.

```toml
# Ghostty 터미널 → 2번 워크스페이스
[[on-window-detected]]
if.app-id = 'com.mitchellh.ghostty'
run = 'move-node-to-workspace 2:Terminal'

# Chrome → 1번 워크스페이스, floating으로
[[on-window-detected]]
if.app-id = 'com.google.Chrome'
run = ['move-node-to-workspace 1:Browser', 'layout floating']

# 그 외 모든 창 → 기본 floating
[[on-window-detected]]
run = 'layout floating'
```

`if.app-id`에 넣을 앱 식별자는 아래로 확인한다.

```sh
# 실행 중인 앱들의 app-id 출력
aerospace list-apps
```

## floating을 기본값으로 두는 전략

위 설정에서 눈에 띄는 건 **대부분의 앱을 `layout floating`으로 둔다**는 점이다. 타일링 WM인데 왜 floating일까?

화면 안에서 창을 반·1/3로 나누는 **정밀한 배치는 Hammerspoon에 맡기고**, AeroSpace는 **워크스페이스(공간) 분리**에 집중시키는 분업이다. 즉 AeroSpace로 "어느 공간에 둘지"를, Hammerspoon으로 "그 공간 안 어디에 둘지"를 정한다. 이 분업의 실제 구현은 [Rectangle.app을 Hammerspoon으로 대체하기](/posts/macos/2026-07-03-hammerspoon-window-tiling-rectangle/)에서 다룬다.

## 다음 단계

AeroSpace 기본기가 잡혔다면:

- 화면 내 정밀 배치와 자동화를 위한 [Hammerspoon 기본](/posts/macos/2026-07-03-hammerspoon-basics/)
- 두 도구를 잇는 [AeroSpace + Hammerspoon 창 재정렬](/posts/macos/2026-07-03-aerospace-hammerspoon-window-reflow/)
- 단축키가 갑자기 안 먹을 때 [macOS Secure Input](/posts/macos/2026-06-07-aerospace-secure-input-hotkey-blocked/)
