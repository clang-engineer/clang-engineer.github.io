---
title       : "Neovim은 왜 TUI 앱이면서 UI 플랫폼인가"
description : "Neovim Core, 내장 TUI, UI protocol, Window/Buffer API, vim.ui, nui.nvim, Snacks, LazyVim이 어떤 층에 놓이는지 하나의 스택으로 정리한다."
date        : 2026-09-05 15:30:00 +0900
updated     : 2026-09-05 18:03:00 +0900
categories  : [terminal]
tags        : [neovim, tui, ui-protocol, vim-ui, nui, snacks, lazyvim, architecture]
pin         : false
hidden      : false
---

Neovim을 단순한 터미널 에디터라고만 보면 구조가 잘 안 보인다.

Neovim은 동시에 세 가지 역할을 가진다.

```text
에디터 핵심(Editor Core)
TUI 애플리케이션
UI 플랫폼
```

이 셋이 분리되어 있기 때문에 내장 TUI도 사용할 수 있고 외부 GUI도 붙일 수 있으며, 그 위에서 다시 플러그인 UI 생태계가 만들어질 수 있다.

## 가장 아래 — Neovim Core와 UI는 분리되어 있다

Neovim의 중요한 구조적 특징은 Editor Core와 UI 클라이언트(Client)가 분리될 수 있다는 점이다.

개념적으로:

```text
Neovim Core
   ↓ UI 이벤트
UI Protocol
   ↓
UI 클라이언트
```

UI 클라이언트는 터미널일 수도 있고 GUI일 수도 있다.

```text
                 ┌─ 내장 TUI → 터미널
Neovim Core → UI ┤
                 └─ 외부 GUI → OS 그래픽
```

공식 UI protocol은 터미널과 비슷한 grid를 기본 모델로 제공하고, 외부 UI는 RPC API를 통해 `nvim_ui_attach()`로 붙을 수 있다.

즉 Neovim Core 자체가 터미널 escape sequence를 직접 화면에 뿌리는 단일 덩어리로만 설계된 것이 아니다.

## 내장 TUI도 하나의 UI 클라이언트다

보통 터미널에서:

```bash
nvim
```

을 실행하면 내장 TUI를 사용한다.

현재 Neovim 공식 문서에서도 기본 실행 시 내장 터미널 UI가 시작된다고 설명한다.

개념적으로:

```text
Neovim Core
   ↓ UI Protocol
내장 TUI
   ↓ 터미널 제어
터미널 에뮬레이터
```

내장 TUI가 Core의 grid/update 이벤트를 받아 실제 터미널 출력으로 변환한다.

이 부분이 우리가 앞에서 본:

```text
셀/격자 상태
→ 차이 계산/렌더링
→ Escape Sequence
→ 터미널
```

계층에 해당한다.

## 외부 GUI가 가능한 이유

Core가 터미널에 직접 묶여 있지 않으므로 같은 UI protocol을 구현한 GUI가 붙을 수 있다.

```text
Neovim Core
   ↓
UI Protocol
   ↓
GUI 클라이언트
   ↓
Window System / GPU
```

즉 GUI라고 해서 별도의 Vim Core를 다시 구현하는 것이 아니다.

에디터 상태와 명령, Buffer, Mode 등의 핵심은 Neovim Core가 가지고 UI는 결과를 표현한다.

이 구조 때문에 하나의 Neovim 인스턴스에 여러 UI가 연결될 수 있는 모델도 가능하다.

## 여기까지는 "Neovim을 그리는 UI"

이제 방향을 뒤집어보자.

Neovim 내부에서 플러그인이 만드는 popup, picker, floating window는 내장 TUI를 직접 조작하지 않는다.

대신 Neovim API를 사용한다.

```text
플러그인
  ↓
Neovim Window / Buffer / Highlight API
  ↓
Neovim Core UI 상태
  ↓
UI Protocol
  ↓
내장 TUI
  ↓
터미널
```

예를 들어 Floating Window를 만들 때 플러그인이 ANSI 커서 이동을 직접 출력하지 않는다.

대략:

```lua
vim.api.nvim_open_win(...)
```

같은 API를 사용한다.

Neovim이 그 Window를 자신의 UI 모델에 반영하고 내장 TUI가 최종 터미널 렌더링을 맡는다.

## Buffer와 Window가 UI Primitive가 된다

일반 TUI 프레임워크에서는 `Panel`, `Box`, `Widget` 같은 Primitive가 있다.

Neovim 플러그인 생태계에서는:

```text
Buffer
Window
Floating Window
Highlight
Extmark
Namespace
```

같은 Neovim 자체 개념이 UI Primitive 역할을 한다.

그래서 플러그인 개발자는 터미널 좌표보다 Neovim 객체 모델을 먼저 생각한다.

```text
터미널 셀
    ↑
Neovim Window
    ↑
Buffer 내용
    ↑
플러그인 상태
```

이 시점에서 Neovim 자체가 **UI 런타임(UI Runtime)**처럼 보이기 시작한다.

## vim.ui — 표현 방법까지 추상화한다

`vim.ui`는 또 한 층 위다.

플러그인이 사용자에게 선택을 요청한다고 하자.

직접 popup을 만들 수도 있지만 더 추상적으로:

```lua
vim.ui.select(items, opts, callback)
```

를 호출할 수 있다.

그러면 플러그인은:

> 선택 UI가 필요하다

만 표현한다.

실제로 그것을 기본 UI로 보여줄지, Telescope/Snacks 같은 다른 구현체가 더 화려하게 표현할지는 별도 계층에서 결정될 수 있다.

```text
플러그인의 의도
   ↓
vim.ui.select/input
   ↓
UI 구현체
   ↓
Neovim Window/Buffer API
```

이건 웹에서 Interface와 Renderer가 분리되는 것과 비슷한 형태의 추상화다.

## nui.nvim — Neovim 위의 UI 라이브러리

`nui.nvim` 같은 라이브러리는 Neovim API를 더 높은 수준으로 감싼다.

개념적으로:

```text
Neovim 저수준 API
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

같은 UI 컴포넌트 개념으로 올린다.

즉:

```text
터미널
   ↑
Neovim TUI
   ↑
Neovim UI Primitive
   ↑
nui.nvim 컴포넌트 추상화
```

이라는 층이 만들어진다.

여기서 TUI 위에 다시 UI 프레임워크가 생긴 셈이다.

## Snacks는 더 고수준의 기능 묶음

Snacks 같은 플러그인은 picker, dashboard, notifier, terminal 등 더 완성된 상호작용을 제공한다.

이 정도가 되면 단순 UI Primitive가 아니라 **애플리케이션 기능(Application Feature)**에 가까워진다.

```text
Snacks Picker
      ↓
Neovim API / 내부 추상화
      ↓
Neovim UI 모델
      ↓
TUI
```

사용자는 터미널 렌더러 구현을 전혀 의식하지 않는다.

## LazyVim은 어디에 있나

LazyVim을 TUI 프레임워크라고 생각하면 계층이 꼬인다.

LazyVim은 터미널 화면을 그리는 렌더러가 아니다.

```text
LazyVim
  ↓
플러그인 선택 + 기본값 + Keymap + 설정
  ↓
Snacks / Treesitter / LSP / 기타 플러그인
  ↓
Neovim API
  ↓
Neovim Core + TUI
```

즉 **Neovim 배포판/설정 계층**에 가깝다.

화면이 화려하게 보이더라도 LazyVim이 터미널 escape sequence를 직접 렌더링하는 것은 아니다.

## 전체 계층

지금까지를 한 번에 놓으면:

```text
사용자 설정 / 배포판
           LazyVim
              ↓
애플리케이션 수준 플러그인
      Snacks / Telescope / Noice
              ↓
UI 라이브러리 / 인터페이스
       nui.nvim / vim.ui
              ↓
Neovim UI Primitive
Window / Buffer / Highlight / Extmark
              ↓
         Neovim Core
              ↓
          UI Protocol
         ┌────┴────┐
         ↓         ↓
     내장 TUI    GUI 클라이언트
         ↓
       터미널
```

이 구조가 Neovim을 특이하게 만든다.

## "TUI 위에 UI가 또 있다"는 말의 정확한 의미

엄밀하게는 플러그인 UI가 내장 TUI를 직접 호출하는 것은 아니다.

더 정확한 구조는:

```text
플러그인
  ↓
Neovim API/Core UI 모델
  ↓
UI Protocol
  ↓
내장 TUI
```

이다.

하지만 개발자 경험 관점에서는 Neovim이 터미널 UI의 복잡성을 숨기고 Window/Buffer 같은 상위 Primitive를 제공하기 때문에 **TUI 위의 UI 플랫폼**처럼 동작한다.

그리고 그 API 위에 다시 `nui.nvim`, Snacks 같은 추상화가 올라간다.

## 일반 TUI 프레임워크와 비교

OpenTUI의 경우:

```text
React 컴포넌트
   ↓
OpenTUI Renderable
   ↓
셀 버퍼
   ↓
터미널
```

Neovim은:

```text
플러그인 UI
   ↓
Neovim Window/Buffer 모델
   ↓
UI Protocol Grid
   ↓
내장 TUI
   ↓
터미널
```

이다.

둘 다 상위 컴포넌트/상태를 터미널 Grid로 내리지만 Neovim은 **에디터 도메인 자체가 중간 런타임**이라는 점이 다르다.

## 그래서 Neovim 플러그인은 독립 TUI 앱이 아니다

Neovim 플러그인이 아무리 복잡한 UI를 만들어도 보통 독립 터미널 프로그램은 아니다.

```text
플러그인
  ↓
Neovim 런타임 필요
```

이기 때문이다.

반면 `lazygit`, `fzf`, `Harlequin`은 자기 터미널 세션과 이벤트/렌더링 루프를 직접 소유하는 독립 애플리케이션이다.

이 구분이 중요하다.

## TUI가 플랫폼이 되는 조건

Neovim 사례에서 일반화하면 TUI 앱이 플랫폼으로 발전하려면 대략 다음이 필요하다.

```text
안정적인 UI/Data API
확장 가능한 런타임
플러그인 생명주기
이벤트 시스템
레이아웃/표시 Primitive
입력/Keymap 추상화
```

Neovim은 에디터라는 강한 도메인을 중심으로 이 조건이 갖춰지면서 플러그인 UI 생태계가 크게 성장했다.

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
로컬 터미널
   ↓
SSH 전송
   ↓
원격 PTY
   ↓
원격 Neovim
```

가 된다.

마지막 글에서는 지금까지 배운 TTY/PTY, termios, TERM, escape sequence, 터미널 크기 변경, signal을 tmux와 SSH 한 장에 모두 연결한다.

## 참고

- Neovim TUI documentation — 내장 TUI 클라이언트
- Neovim UI protocol — `nvim_ui_attach()`와 Grid/Event 모델
- Neovim GUI documentation — 외부 UI 클라이언트 모델
