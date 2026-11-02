---
layout: post
title: "Hammerspoon — 이벤트 기반 macOS 자동화 구조"
date: 2026-10-31
categories: [reference]
tags: [macos, hammerspoon, lua, automation]
---

Hammerspoon은 단축키 모음이 아니라 **이벤트를 감지해 Lua Callback으로 macOS API를 호출하는 런타임**이다. 창 배치 관리자 AeroSpace와 달리 자동화 트리거·스크립트 실행 자체가 중심이다.

## 전체 작동 모델

```text
~/.hammerspoon/init.lua
          │ 로드 / 리로드
          ▼
    Hammerspoon Runtime
          │
  ┌───────┼──────────┐
  ▼       ▼          ▼
Hotkey   Timer     Eventtap
  └───────┼──────────┘
          ▼
     Lua Callback
          │
    ┌─────┴─────────┐
    ▼               ▼
hs.window         hs.alert / hs.application
창 조회·조작      알림·앱 제어
```

`hs.hotkey`·`hs.timer`는 이벤트를 받아 Callback을 실행하게 하고, `hs.window`는 Callback에서 호출할 수 있는 창 조작 API다. 이벤트 소스와 실행 동작을 같은 계층으로 보지 않는다.

## 대표 예시 — 단축키로 창 선택

```lua
hs.hotkey.bind({"shift"}, "F1", function()
  hs.hints.windowHints()
end)
```

이벤트는 Shift+F1이고, Callback은 Window Hint를 표시한다. 특정 창의 위치를 바꾸려면 `hs.window.focusedWindow()`로 대상을 얻어 창 API를 호출한다.

## 입력 리매핑과 운영 경계

```lua
hs.hotkey.bind({"ctrl"}, "h", function()
  hs.eventtap.keyStroke({}, "left")
end)
```

이 예시는 Ctrl+h를 가로채 왼쪽 화살표 입력을 발생시킨다. 앱별 단축키와 충돌할 수 있고, 접근성 권한이 필요할 수 있다. 원치 않는 전역 리매핑을 피하려면 바인딩을 제한하거나 enable/disable을 고려한다.

`~/.hammerspoon/init.lua`를 수정한 뒤 메뉴바에서 Reload Config를 선택하거나 Lua Console에서 `hs.reload()`를 실행한다. CLI가 필요하면 `hs.ipc.cliInstall()`을 설정에 넣고 최초 한 번은 수동 리로드한다. 이후 `hs -c "hs.reload()"`를 사용할 수 있다.

전체 API는 [Hammerspoon 공식 문서](https://www.hammerspoon.org/docs/)를 참고한다.
