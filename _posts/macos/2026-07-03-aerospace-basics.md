---
title       : AeroSpace 기본 — 워크스페이스·단축키·on-window-detected
description : "SIP 비활성화 없이 쓰는 macOS 타일링 워크스페이스 매니저 AeroSpace. 설치부터 alt-hjkl 포커스·이동, 워크스페이스 전환, .aerospace.toml의 mode.main.binding과 on-window-detected 자동 배치까지 기본기를 정리한다."
date        : 2026-07-03 14:00:00 +0900
updated     : 2026-11-16 10:10:00 +0900
categories  : [macos, "창 관리"]
tags        : [aerospace, window-manager, tiling]
pin         : false
hidden      : false
---

[AeroSpace](https://github.com/nikitabobko/AeroSpace)는 macOS용 타일링 워크스페이스 매니저다. 이 글은 처음 설치해서 손에 익히는 **기본기**를 다룬다. 최신 키맵·CLI 레퍼런스는 [AeroSpace Cheatsheet](https://github.com/clang-engineer/devkit/blob/main/reference/cheatsheets/aerospace.md)를 기준으로 보고, Hammerspoon과의 연동이나 심화 자동화는 [macOS 로드맵](./2026-07-03-00-macos-roadmap.md)의 창 관리 갈래에서 이어진다.

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

> `[mode.main.binding]`은 **기본 단축키를 전부 덮어쓴다.** 그래서 `alt-h` 같은 기본 키도 직접 다시 나열해야 한다. 바인딩 대체 방식과 서비스 모드까지 포함한 자세한 설명은 [AeroSpace 서비스 모드](./2026-07-14-aerospace-service-mode.md)에서 다룬다.
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

> 이 예시의 `if.app-id`는 현재도 지원되지만 공식 가이드에서 **기존 형식**으로 분류한다. 새 설정은 `if = 'test %{app-bundle-id} = …'`를 권장한다([공식 변경 안내](https://nikitabobko.github.io/AeroSpace/guide#legacy-on-window-detected-syntax)).
{: .prompt-info }

`if.app-id`에 넣을 앱 식별자는 아래로 확인한다.

```sh
# 실행 중인 앱들의 app-id 출력
aerospace list-apps
```

## floating을 기본값으로 두는 전략

위 설정에서 눈에 띄는 건 **대부분의 앱을 `layout floating`으로 둔다**는 점이다. 타일링 WM인데 왜 floating일까?

화면 안에서 창을 반·1/3로 나누는 **정밀한 배치는 Hammerspoon에 맡기고**, AeroSpace는 **워크스페이스(공간) 분리**에 집중시키는 분업이다. 즉 AeroSpace로 "어느 공간에 둘지"를, Hammerspoon으로 "그 공간 안 어디에 둘지"를 정한다. 이 분업의 실제 구현은 [Rectangle.app을 Hammerspoon으로 대체하기](./2026-07-03-hammerspoon-window-tiling-rectangle.md)에서 다룬다.

앱 종류마다 워크스페이스를 나눈 **내 설정에서는** 타일링이 자동으로 해결할 배치가 생각보다 적었다. 브라우저는 좁아지면 페이지를 보기 불편하고, IDE는 자체 분할 패널을 이미 갖췄다. 터미널 한 창 안의 분할은 tmux가 맡으므로, 터미널 워크스페이스에 창 하나만 열려 있으면 AeroSpace가 나눌 것도 없다. 이때 floating-first는 타일링을 못 쓰는 상태가 아니라 **앱을 어느 공간에 둘지**에 더 큰 값을 두는 선택이다. `focus` 단축키도 floating 창에 그대로 쓸 수 있다([공식 설명](https://nikitabobko.github.io/AeroSpace/commands#focus)).

반대로 tmux가 못 나누는 **서로 다른 앱**—예컨대 코드를 고치는 터미널과 결과를 보는 브라우저—을 나란히 놓을 때는 AeroSpace 타일링이 유용하다. 다만 앱별 워크스페이스를 고수하면 두 앱이 같은 공간에 있지 않다. 이런 작업이 잦다면 작업용 혼합 워크스페이스를 따로 두는 편이 낫고, 드물다면 그때만 창을 한 공간에 모아 `layout floating tiling`으로 전환하면 된다([공식 명령 설명](https://nikitabobko.github.io/AeroSpace/commands#layout)). 전환이 잦을 때만 주 단축키에 올리고, 아니라면 서비스 모드 등에 두는 편이 키 충돌을 줄인다. **항상 floating이 정답이라는 뜻은 아니다.** 동시에 여러 앱·창을 자주 볼수록 기본 타일링의 이득이 커진다.

## 다음 단계

AeroSpace 기본기가 잡혔다면:

- 서비스 모드의 기능과 설계 철학을 다룬 [AeroSpace 서비스 모드](./2026-07-14-aerospace-service-mode.md)
- 화면 내 정밀 배치와 자동화를 위한 [Hammerspoon 기본](./2026-07-03-hammerspoon-basics.md)
- 두 도구를 잇는 [AeroSpace + Hammerspoon 창 재정렬](./2026-07-03-aerospace-hammerspoon-window-reflow.md)
- 단축키가 갑자기 안 먹을 때 [macOS Secure Input](../reference/troubleshooting/2026-06-07-aerospace-secure-input.md)
