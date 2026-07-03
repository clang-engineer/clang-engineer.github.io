---
title       : Hammerspoon 기본 — init.lua·hs API·ipc CLI·모듈 구조
description : "Lua로 macOS를 자동화하는 Hammerspoon의 기본기. 설치와 Accessibility 권한, init.lua와 hs.hotkey.bind, 리로드, hs API 맛보기, 외부에서 리로드하는 ipc CLI, 설정을 모듈로 쪼개는 구조까지 정리한다."
date        : 2026-07-03 14:10:00 +0900
updated     : 2026-07-03 14:10:00 +0900
categories  : [macos, "창 관리"]
tags        : [hammerspoon, lua, automation]
pin         : false
hidden      : false
---

[Hammerspoon](https://www.hammerspoon.org/)은 **Lua 스크립트로 macOS를 제어**하는 자동화 도구다. 창 배치, 단축키, 알림, 외부 명령 실행 등을 코드로 정의한다. 이 글은 설치부터 설정을 모듈로 나누기까지 **기본기**를 다룬다. 창 분할·AeroSpace 연동 같은 실전 활용은 [macOS 로드맵](/posts/macos/2026-07-03-macos-roadmap/)의 창 관리 갈래에서 이어진다.

## 설치와 권한

```sh
brew install --cask hammerspoon
```

Hammerspoon은 다른 앱의 창을 움직이므로 **접근 권한이 필수**다.

- System Settings → Privacy & Security → Accessibility에서 Hammerspoon 허용

권한이 없으면 창 제어 API가 조용히 실패하니, 처음에 반드시 확인한다.

## init.lua — 설정의 진입점

모든 설정은 `~/.hammerspoon/init.lua`에서 시작한다. 가장 기본은 단축키 하나를 바인딩해 보는 것이다.

```lua
-- Alt+Cmd+R 을 누르면 알림 표시
hs.hotkey.bind({ 'alt', 'cmd' }, 'R', function()
  hs.alert.show('Hello from Hammerspoon')
end)
```

파일을 저장한 뒤 메뉴바 아이콘 → **Reload Config**(또는 아래 `hs` CLI)로 다시 읽으면 즉시 적용된다.

## hs API 맛보기

Hammerspoon의 기능은 전부 `hs.*` 네임스페이스로 제공된다. 창 관리에서 자주 쓰는 것만 추리면:

| API | 역할 |
|---|---|
| `hs.hotkey.bind` | 전역 단축키 등록 |
| `hs.window` | 창 조회·이동·리사이즈 |
| `hs.screen` | 모니터(화면) 정보 |
| `hs.application` | 앱 실행·포커스 |
| `hs.alert` | 화면에 잠깐 뜨는 알림 |
| `hs.task` | 외부 CLI 비동기 실행 |

예를 들어 포커스된 창을 화면 왼쪽 절반으로 옮기는 코드는 이렇게 된다.

```lua
hs.hotkey.bind({ 'alt', 'cmd' }, 'Left', function()
  local win = hs.window.focusedWindow()
  local frame = win:screen():frame()
  frame.w = frame.w / 2
  win:setFrame(frame)
end)
```

## ipc CLI — 외부에서 리로드·실행

`hs.ipc.cliInstall()`을 호출하면 터미널에서 `hs` 명령을 쓸 수 있다. 설정을 외부 스크립트에서 리로드하거나 Lua 코드를 평가할 때 쓴다.

```lua
hs.ipc.cliInstall() -- `hs` CLI 활성화
```

```sh
hs -c "hs.reload()"                 # 설정 리로드
hs -c "hs.alert.show('from shell')" # 셸에서 Lua 실행
```

이 ipc와 짝을 이루는 게 **URL scheme**이다. 다른 앱이나 스크립트가 `open -g hammerspoon://<이벤트>`로 Hammerspoon 함수를 호출할 수 있어, **AeroSpace 같은 외부 도구와 느슨하게 연동**하는 핵심 통로가 된다.

```lua
hs.urlevent.bind('my-event', function()
  hs.alert.show('URL scheme으로 호출됨')
end)
```

```sh
open -g "hammerspoon://my-event"
```

## 설정을 모듈로 쪼개기

`init.lua` 하나에 모든 코드를 쌓으면 금방 관리가 어려워진다. 기능별로 파일을 나누고 `require`로 불러오면 깔끔하다. 실제로 쓰는 `init.lua`는 이렇게 얇다.

```lua
-- ~/.hammerspoon/init.lua
hs.ipc.cliInstall() -- `hs` CLI 활성화

require('modules.rectangle')         -- 화면 내 창 분할
require('modules.window-hint')       -- 창 힌트(단축키로 창 선택)
require('modules.aerospace-windows') -- AeroSpace 연동
```

`~/.hammerspoon/modules/` 아래에 `rectangle.lua`, `window-hint.lua`처럼 파일을 두면 `require('modules.rectangle')`로 로드된다. 각 모듈이 자기 단축키와 로직만 책임지므로, 기능을 켜고 끄기도 `require` 한 줄이면 된다.

> 커뮤니티가 만든 재사용 패키지를 쓰고 싶다면 **Spoon**(`~/.hammerspoon/Spoons/`)이라는 배포 형식도 있다. 다만 창 관리 정도는 직접 모듈로 짜는 편이 동작이 투명하다.
{: .prompt-tip }

## 다음 단계

- 화면을 반·1/3로 나누는 [Rectangle.app을 Hammerspoon으로 대체하기](/posts/macos/2026-07-03-hammerspoon-window-tiling-rectangle/)
- AeroSpace와 잇는 [창 재정렬](/posts/macos/2026-07-03-aerospace-hammerspoon-window-reflow/)과 [워크스페이스 오버레이](/posts/macos/2026-07-03-aerospace-workspace-overlay/)
