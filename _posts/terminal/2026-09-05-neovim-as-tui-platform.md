---
title       : "Neovim은 왜 TUI 앱이면서 UI 플랫폼인가"
description : "Neovim Core, builtin TUI, UI protocol, Window/Buffer API, vim.ui, nui.nvim, Snacks, LazyVim이 어떤 층에 놓이는지 하나의 스택으로 정리한다."
date        : 2026-09-05 15:30:00 +0900
updated     : 2026-09-05 15:30:00 +0900
categories  : [terminal]
tags        : [neovim, tui, ui-protocol, vim-ui, nui, snacks, lazyvim, architecture]
pin         : false
hidden      : false
---

Neovim을 단순한 terminal editor라고만 보면 구조가 잘 안 보인다.

Neovim은 동시에 세 가지 역할을 가진다.

```text
Editor Core
TUI Application
UI Platform
```

이 셋이 분리되어 있기 때문에 builtin TUI도 사용할 수 있고 external GUI도 붙일 수 있으며, 그 위에서 다시 plugin UI 생태계가 만들어질 수 있다.

## 가장 아래 — Neovim Core와 UI는 분리되어 있다

Neovim의 중요한 구조적 특징은 Editor Core와 UI client가 분리될 수 있다는 점이다.

개념적으로:

```text
Neovim Core
   ↓ UI events
UI Protocol
   ↓
UI Client
```

UI client는 terminal일 수도 있고 GUI일 수도 있다.

```text
                 ┌─ builtin TUI → Terminal
Neovim Core → UI ┤
                 └─ external GUI → OS graphics
```

공식 UI protocol은 terminal-like grid를 기본 모델로 제공하고, 외부 UI는 RPC API를 통해 `nvim_ui_attach()`로 붙을 수 있다.

즉 Neovim Core 자체가 terminal escape sequence를 직접 화면에 뿌리는 단일 덩어리로만 설계된 것이 아니다.

## builtin TUI도 하나의 UI client다

보통 터미널에서:

```bash
nvim
```

을 실행하면 builtin TUI를 사용한다.

현재 Neovim 공식 문서에서도 기본 실행 시 builtin terminal UI가 시작된다고 설명한다.

개념적으로:

```text
Neovim Core
   ↓ UI protocol
builtin TUI
   ↓ terminal control
Terminal Emulator
```

builtin TUI가 core의 grid/update event를 받아 실제 terminal output으로 변환한다.

이 부분이 우리가 앞에서 본:

```text
cell/grid state
→ diff/render
→ escape sequence
→ terminal
```

계층에 해당한다.

## external GUI가 가능한 이유

Core가 terminal에 직접 묶여 있지 않으므로 같은 UI protocol을 구현한 GUI가 붙을 수 있다.

```text
Neovim Core
   ↓
UI Protocol
   ↓
GUI Client
   ↓
Window system / GPU
```

즉 GUI라고 해서 별도의 Vim core를 다시 구현하는 것이 아니다.

editor state와 command, buffer, mode 등의 핵심은 Neovim Core가 가지고 UI는 결과를 표현한다.

이 구조 때문에 하나의 Neovim 인스턴스에 여러 UI가 연결될 수 있는 모델도 가능하다.

## 여기까지는 "Neovim을 그리는 UI"

이제 방향을 뒤집어보자.

Neovim 내부에서 플러그인이 만드는 popup, picker, floating window는 builtin TUI를 직접 조작하지 않는다.

대신 Neovim API를 사용한다.

```text
Plugin
  ↓
Neovim Window / Buffer / Highlight API
  ↓
Neovim Core UI state
  ↓
UI Protocol
  ↓
builtin TUI
  ↓
Terminal
```

예를 들어 floating window를 만들 때 plugin이 ANSI cursor movement를 직접 출력하지 않는다.

대략:

```lua
vim.api.nvim_open_win(...)
```

같은 API를 사용한다.

Neovim이 그 window를 자신의 UI 모델에 반영하고 builtin TUI가 최종 terminal rendering을 맡는다.

## Buffer와 Window가 UI primitive가 된다

일반 TUI framework에서는 `Panel`, `Box`, `Widget` 같은 primitive가 있다.

Neovim plugin 생태계에서는:

```text
Buffer
Window
Floating Window
Highlight
Extmark
Namespace
```

같은 Neovim 자체 개념이 UI primitive 역할을 한다.

그래서 plugin 개발자는 terminal coordinate보다 Neovim 객체 모델을 먼저 생각한다.

```text
Terminal cell
    ↑
Neovim Window
    ↑
Buffer content
    ↑
Plugin state
```

이 시점에서 Neovim 자체가 **UI runtime**처럼 보이기 시작한다.

## vim.ui — 표현 방법까지 추상화한다

`vim.ui`는 또 한 층 위다.

plugin이 사용자에게 선택을 요청한다고 하자.

직접 popup을 만들 수도 있지만 더 추상적으로:

```lua
vim.ui.select(items, opts, callback)
```

를 호출할 수 있다.

그러면 plugin은:

> 선택 UI가 필요하다

만 표현한다.

실제로 그것을 기본 UI로 보여줄지, Telescope/Snacks 같은 다른 구현체가 더 화려하게 표현할지는 별도 계층에서 결정될 수 있다.

```text
Plugin intent
   ↓
vim.ui.select/input
   ↓
UI implementation
   ↓
Neovim Window/Buffer API
```

이건 웹에서 interface와 renderer가 분리되는 것과 비슷한 형태의 추상화다.

## nui.nvim — Neovim 위의 UI library

`nui.nvim` 같은 라이브러리는 Neovim API를 더 높은 수준으로 감싼다.

개념적으로:

```text
Neovim raw API
nvim_create_buf
nvim_open_win
keymap
autocmd
highlight
```

를 매번 직접 조합하는 대신:

```text
Popup
Layout
Menu
Input
Tree
```

같은 UI component 개념으로 올린다.

즉:

```text
Terminal
   ↑
Neovim TUI
   ↑
Neovim UI primitive
   ↑
nui.nvim component abstraction
```

이라는 층이 만들어진다.

여기서 TUI 위에 다시 UI framework가 생긴 셈이다.

## Snacks는 더 고수준의 기능 묶음

Snacks 같은 플러그인은 picker, dashboard, notifier, terminal 등 더 완성된 interaction을 제공한다.

이 정도가 되면 단순 UI primitive가 아니라 **application feature**에 가까워진다.

```text
Snacks Picker
      ↓
Neovim APIs / internal abstractions
      ↓
Neovim UI model
      ↓
TUI
```

사용자는 terminal renderer 구현을 전혀 의식하지 않는다.

## LazyVim은 어디에 있나

LazyVim을 TUI framework라고 생각하면 계층이 꼬인다.

LazyVim은 terminal 화면을 그리는 renderer가 아니다.

```text
LazyVim
  ↓
Plugin selection + defaults + keymaps + configuration
  ↓
Snacks / Treesitter / LSP / etc
  ↓
Neovim APIs
  ↓
Neovim Core + TUI
```

즉 **Neovim distribution/configuration layer**에 가깝다.

화면이 화려하게 보이더라도 LazyVim이 terminal escape sequence를 직접 렌더링하는 것은 아니다.

## 전체 계층

지금까지를 한 번에 놓으면:

```text
User Configuration / Distribution
           LazyVim
              ↓
Application-level Plugins
      Snacks / Telescope / Noice
              ↓
UI Library / Interface
       nui.nvim / vim.ui
              ↓
Neovim UI Primitives
Window / Buffer / Highlight / Extmark
              ↓
         Neovim Core
              ↓
          UI Protocol
         ┌────┴────┐
         ↓         ↓
   builtin TUI   GUI Client
         ↓
      Terminal
```

이 구조가 Neovim을 특이하게 만든다.

## "TUI 위에 UI가 또 있다"는 말의 정확한 의미

엄밀하게는 plugin UI가 builtin TUI를 직접 호출하는 것은 아니다.

더 정확한 구조는:

```text
Plugin
  ↓
Neovim API/Core UI model
  ↓
UI Protocol
  ↓
builtin TUI
```

이다.

하지만 개발자 경험 관점에서는 Neovim이 terminal UI의 복잡성을 숨기고 Window/Buffer 같은 상위 primitive를 제공하기 때문에 **TUI 위의 UI platform**처럼 동작한다.

그리고 그 API 위에 다시 `nui.nvim`, Snacks 같은 추상화가 올라간다.

## 일반 TUI framework와 비교

OpenTUI의 경우:

```text
React Component
   ↓
OpenTUI Renderable
   ↓
Cell Buffer
   ↓
Terminal
```

Neovim은:

```text
Plugin UI
   ↓
Neovim Window/Buffer model
   ↓
UI protocol grid
   ↓
builtin TUI
   ↓
Terminal
```

이다.

둘 다 상위 component/state를 terminal grid로 내리지만 Neovim은 **에디터 domain 자체가 중간 runtime**이라는 점이 다르다.

## 그래서 Neovim 플러그인은 독립 TUI 앱이 아니다

Neovim plugin이 아무리 복잡한 UI를 만들어도 보통 독립 terminal program은 아니다.

```text
Plugin
requires Neovim runtime
```

이기 때문이다.

반면 `lazygit`, `fzf`, `Harlequin`은 자기 terminal session과 event/render loop를 직접 소유하는 독립 애플리케이션이다.

이 구분이 중요하다.

## TUI가 platform이 되는 조건

Neovim 사례에서 일반화하면 TUI 앱이 platform으로 발전하려면 대략 다음이 필요하다.

```text
안정적인 UI/data API
확장 가능한 runtime
plugin lifecycle
event system
layout/display primitives
input/keymap abstraction
```

Neovim은 editor라는 강한 domain을 중심으로 이 조건이 갖춰지면서 plugin UI 생태계가 크게 성장했다.

## 다음 단계 — tmux와 SSH로 전체 연결

이제 마지막으로 Neovim 자체보다 더 바깥을 본다.

```text
Ghostty
   ↓
PTY
   ↓
tmux
   ↓
PTY
   ↓
Neovim
```

그리고 SSH가 들어가면:

```text
Local Terminal
   ↓
SSH transport
   ↓
Remote PTY
   ↓
Remote Neovim
```

가 된다.

마지막 글에서는 지금까지 배운 TTY/PTY, termios, TERM, escape sequence, resize, signal을 tmux와 SSH 한 장에 모두 연결한다.

## 참고

- Neovim TUI documentation — builtin TUI client
- Neovim UI protocol — `nvim_ui_attach()`와 grid/event model
- Neovim GUI documentation — external UI client model
