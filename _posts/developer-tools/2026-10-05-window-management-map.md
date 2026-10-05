---
title       : "Window Management Map — i3·sway·AeroSpace·yabai·Rectangle의 관계"
description : "Linux와 macOS의 창 관리 도구를 tiling window manager, compositor, window placement utility로 나누고 i3·sway·AeroSpace·yabai·Rectangle의 관계와 장단점을 정리한다."
date        : 2026-10-05 18:52:00 +0900
updated     : 2026-10-05 18:52:00 +0900
categories  : [developer-tools, "관계도"]
tags        : [window-manager, tiling, i3, sway, aerospace, yabai, rectangle, macos, linux, map]
pin         : false
hidden      : false
---

창 관리 도구는 모두 "창을 배치한다"는 점 때문에 비슷해 보이지만, 실제로는 **window manager 자체인지, compositor인지, 단순한 배치 utility인지**가 다르다.

## 전체 관계

```text
Window Management
├─ Linux / X11
│  └─ i3
│      └─ keyboard-driven tiling WM
│
├─ Linux / Wayland
│  └─ sway
│      └─ i3-compatible Wayland compositor
│
└─ macOS
   ├─ AeroSpace
   │   └─ i3-like tiling / workspace model
   ├─ yabai
   │   └─ tiling + scripting / automation
   ├─ Hammerspoon
   │   └─ general automation runtime
   └─ Rectangle
       └─ window placement utility
```

가장 중요한 구분은 **Rectangle은 i3/sway/AeroSpace/yabai와 정확히 같은 종류가 아니라는 것**이다.

## i3 → sway

i3는 X11 환경의 대표적인 keyboard-driven tiling window manager다.

sway는 Wayland 환경에서 i3와 비슷한 설정과 사용 경험을 제공하는 compositor다.

```text
i3
X11 tiling WM
 │
 └─ i3-compatible workflow
          ↓
        sway
   Wayland compositor
```

따라서 i3에서 sway로 갈 때는 "완전히 새로운 조작 철학"을 배우기보다 기존 i3 감각을 Wayland 환경으로 가져가는 느낌에 가깝다.

## macOS의 두 방향

macOS에서는 Linux처럼 window manager 자체를 완전히 교체하기 어렵기 때문에 별도 도구들이 OS 위에서 창을 제어한다.

### AeroSpace

AeroSpace는 i3-like keyboard workflow와 자체 workspace 모델을 지향한다.

강점:

- 키보드 중심 workspace 이동
- 자동 tiling
- macOS 기본 Spaces와 다른 빠른 가상 workspace 흐름

관련 글:

- [AeroSpace 기본]({% post_url macos/2026-07-03-aerospace-basics %})
- [AeroSpace 서비스 모드]({% post_url macos/2026-07-14-aerospace-service-mode %})

### yabai

yabai는 macOS의 창을 자동 배치하고 scripting으로 제어하는 강력한 도구다.

강점은 자동화 자유도와 세밀한 제어다. 반대로 macOS 보안 정책과 권한, 일부 고급 기능의 제약을 더 신경 써야 한다.

### Rectangle

Rectangle은 **자동 tiling WM이라기보다 window placement utility**에 가깝다.

```text
shortcut
→ left half
→ right half
→ maximize
→ thirds / quarters
```

즉 "창 관리가 필요하지만 WM 전체를 도입하고 싶지는 않다"는 사용자에게 훨씬 단순하다.

- [Rectangle.app 기본]({% post_url macos/2026-07-03-rectangle-app-basics %})

## Hammerspoon은 어디에 놓이는가

Hammerspoon은 window manager가 아니라 **Lua 기반 macOS automation runtime**이다.

```text
Hammerspoon
├─ hotkey
├─ window control
├─ app control
├─ notification
└─ external command / automation
```

창 배치도 할 수 있기 때문에 Rectangle과 기능이 겹치지만, 본질적으로 더 넓은 자동화 도구다.

- [Hammerspoon 기본]({% post_url macos/2026-07-03-hammerspoon-basics %})
- [Rectangle.app을 Hammerspoon으로 대체하기]({% post_url macos/2026-07-03-hammerspoon-window-tiling-rectangle %})

## 대략적인 선택 기준

| 원하는 것 | 도구 |
|---|---|
| Linux/X11의 전통적 keyboard tiling | i3 |
| Wayland + i3 사용 감각 | sway |
| macOS에서 i3-like workspace/tiling | AeroSpace |
| macOS에서 강한 scripting/tiling | yabai |
| macOS에서 단순한 반/1⁄3 창 배치 | Rectangle |
| 창 배치를 포함한 macOS 전체 자동화 | Hammerspoon |

## 블로그에서의 위치

개별 설치·설정 글은 계속 `macos` 같은 자연스러운 영역에 둔다. 이 글은 도구를 옮겨 모으는 대신 **서로 어떤 관계인지 보여주는 지도** 역할만 한다.

새 도구를 발견했을 때도 먼저 이 관계도에 한 줄 추가하고, 실제로 깊게 사용할 때만 독립 글을 만든다.
