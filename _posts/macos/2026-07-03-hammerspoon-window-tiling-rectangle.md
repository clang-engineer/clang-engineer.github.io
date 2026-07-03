---
title       : "Rectangle.app을 Hammerspoon으로 대체하기 — 화면 내 창 분할"
description : "Rectangle.app 없이 Hammerspoon Lua 수십 줄로 반분할·3분할·꼭짓점 배치·전체화면 토글을 직접 구현한다. move_win 클로저 팩토리 패턴과, AeroSpace의 floating 레이아웃과 역할을 나누는 이유까지."
date        : 2026-07-03 16:30:00 +0900
updated     : 2026-07-03 16:30:00 +0900
categories  : [macos, "창 관리"]
tags        : [hammerspoon, rectangle, macos, tiling, window-manager, lua, guide]
pin         : false
hidden      : false
---

> **AeroSpace × Hammerspoon 시리즈**
> 1. [연계 & 창 재정렬](/posts/macos/2026-07-03-aerospace-hammerspoon-window-reflow/)
> 2. **Rectangle 대체 — 화면 내 창 분할** (현재 글)
> 3. [워크스페이스 정보 오버레이](/posts/macos/2026-07-03-aerospace-workspace-overlay/)
{: .prompt-info }

[AeroSpace](https://github.com/nikitabobko/AeroSpace)로 워크스페이스(가상 공간)를 나눴다면, 이제 **한 화면 안에서 창을 반으로, 1/3로, 꼭짓점에** 착착 배치하고 싶어진다. 보통 [Rectangle.app](https://rectangleapp.com/)을 쓰지만, 이미 Hammerspoon을 쓰고 있다면 Lua 수십 줄로 같은 걸 만들 수 있다.

## 왜 Rectangle 대신 Hammerspoon인가

- **의존성 하나 감소** — Hammerspoon을 이미 쓰는데 창 배치용 앱을 또 깔 이유가 줄어든다.
- **무한 커스터마이즈** — 분할 비율, 단축키, 동작을 코드로 원하는 만큼 바꾼다.
- **다른 자동화와 통합** — 창 배치를 알림·이벤트·다른 스크립트와 한 런타임에서 엮는다.

단, "설치하고 GUI로 끝"인 Rectangle의 간편함은 포기해야 한다. 코드로 관리할 의향이 있을 때의 선택이다.

## AeroSpace와의 역할 분담 — 왜 floating인가

여기서 짚을 게 있다. AeroSpace를 쓰면서 이 Hammerspoon 창 배치를 같이 쓰려면, AeroSpace 설정에서 창을 **floating**으로 둬야 한다.

```toml
# ~/.aerospace.toml
[[on-window-detected]]
run = 'layout floating'   # 기본을 floating으로
```

이유는 분업이다.

| 담당 | 도구 | 하는 일 |
|---|---|---|
| **공간(워크스페이스)** | AeroSpace | 창을 어느 가상 데스크톱에 둘지 |
| **화면 내 위치** | Hammerspoon | 그 화면 안에서 창을 어디에·얼마 크기로 |

AeroSpace의 타일링(자동 분할)에 창을 맡기면 Hammerspoon이 `setFrame`으로 위치를 잡으려 할 때 서로 싸운다. 그래서 **AeroSpace는 워크스페이스 관리만, 화면 안 배치는 Hammerspoon에** 넘기려고 floating으로 둔다. 이러면 macOS 네이티브 Spaces를 안 건드리는 AeroSpace의 안정성 + Rectangle식 직관적 배치를 둘 다 얻는다.

## 핵심 패턴 — move_win 클로저 팩토리

배치 함수 하나로 모든 분할을 만든다. 화면 대비 **비율**(x, y, 너비, 높이)을 받아 창 프레임을 설정하는 함수를 반환하는 구조다.

```lua
-- move window: 화면 비율(0~1)로 위치·크기 지정
local function move_win(xx, yy, ww, hh)
    return function()
        local win = hs.window.focusedWindow()
        local frame = win:frame()
        local screen = win:screen():frame()
        frame.x = screen.x + screen.w * xx
        frame.y = screen.y + screen.h * yy
        frame.w = screen.w * ww
        frame.h = screen.h * hh
        win:setFrame(frame)
    end
end
```

`move_win(0, 0, 1/2, 1)`은 "화면 왼쪽 끝(0,0)에서 너비 절반(1/2)·높이 전체(1)" → **왼쪽 반**이다. `hs.hotkey.bind`가 함수를 인자로 받으므로, 이렇게 **함수를 반환하는 함수(클로저 팩토리)**로 만들면 바인딩마다 값만 바꿔 재사용할 수 있다.

## 반분할 · 꼭짓점

```lua
local mod = {'ctrl', 'option'}

-- 반분할
hs.hotkey.bind(mod, 'left',  move_win(0,   0, 1/2, 1))    -- 왼쪽 반
hs.hotkey.bind(mod, 'right', move_win(1/2, 0, 1/2, 1))    -- 오른쪽 반
hs.hotkey.bind(mod, 'up',    move_win(0,   0, 1, 1/2))    -- 위쪽 반
hs.hotkey.bind(mod, 'down',  move_win(0, 1/2, 1, 1/2))    -- 아래쪽 반

-- 꼭짓점 (1/4)
hs.hotkey.bind(mod, 'u', move_win(0,   0,   1/2, 1/2))    -- 좌상
hs.hotkey.bind(mod, 'i', move_win(1/2, 0,   1/2, 1/2))    -- 우상
hs.hotkey.bind(mod, 'j', move_win(0,   1/2, 1/2, 1/2))    -- 좌하
hs.hotkey.bind(mod, 'k', move_win(1/2, 1/2, 1/2, 1/2))    -- 우하
```

## 1/3 · 2/3 분할

와이드 모니터에서 진가를 발휘하는 세로 3분할이다.

```lua
-- 1/3 분할
hs.hotkey.bind(mod, 'd', move_win(0,   0, 1/3, 1))    -- 첫 1/3
hs.hotkey.bind(mod, 'f', move_win(1/3, 0, 1/3, 1))    -- 가운데 1/3
hs.hotkey.bind(mod, 'g', move_win(2/3, 0, 1/3, 1))    -- 마지막 1/3

-- 2/3 분할
hs.hotkey.bind(mod, 'e', move_win(0,   0, 2/3, 1))    -- 앞 2/3
hs.hotkey.bind(mod, 't', move_win(1/3, 0, 2/3, 1))    -- 뒤 2/3

-- 중앙 (3/4 크기)
hs.hotkey.bind(mod, 'c', move_win(1/8, 1/8, 3/4, 3/4))
```

`move_win`이 비율만 받으므로, 새 분할이 필요하면 **한 줄만 추가**하면 된다. Rectangle의 고정 메뉴보다 유연한 지점이다.

## 전체화면 토글 — 이전 크기 복원

단순히 최대화만 하면 되돌릴 수 없다. 창별로 **이전 프레임을 저장**해뒀다가, 이미 최대화 상태면 복원하는 토글을 만든다.

```lua
local prev_frames = {}   -- 창 id별 이전 프레임 저장

hs.hotkey.bind(mod, 'return', function()
  local win = hs.window.focusedWindow()
  if not win then return end
  local id = win:id()
  local frame = win:frame()
  local screen = win:screen():frame()
  local max = hs.geometry.rect(screen.x, screen.y, screen.w, screen.h)

  if frame:equals(max) and prev_frames[id] then
    win:setFrame(prev_frames[id])   -- 복원
    prev_frames[id] = nil
  else
    prev_frames[id] = frame:copy()  -- 저장 후 최대화
    win:setFrame(max)
  end
end)
```

포인트는 **`win:id()`를 키로 상태를 저장**하는 것이다. 창마다 독립적으로 "최대화 전 크기"를 기억하므로, 여러 창을 오가며 토글해도 각자 제 크기로 돌아온다. `frame:copy()`로 값 복사를 하는 것도 중요하다 — 참조를 저장하면 이후 프레임 변경에 같이 바뀌어버린다.

## 정리

- **`move_win(x, y, w, h)` 클로저 팩토리** 하나로 모든 분할을 표현 → 새 배치는 한 줄 추가.
- 전체화면 토글은 **`win:id()`별 이전 프레임 저장**으로 복원 가능하게.
- AeroSpace와 함께 쓸 때는 **floating 레이아웃**으로 둬서, 공간 관리(AeroSpace)와 화면 내 배치(Hammerspoon)의 역할을 분리한다.

다음 편에서는 AeroSpace 워크스페이스를 전환할 때 **현재 공간과 그 안의 앱 목록을 오버레이로 띄우는** Hammerspoon 연동을 다룬다.
