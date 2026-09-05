---
title       : "실제 TUI 앱은 어느 추상화 계층에 서 있나 — fzf부터 OpenCode까지"
description : "fzf, btop, lazygit, yazi, Harlequin, OpenCode, Neovim을 실제 구현 선택 기준으로 비교해 자체 renderer, 중간 라이브러리, 고수준 framework의 차이를 정리한다."
date        : 2026-09-05 15:10:00 +0900
updated     : 2026-09-05 15:10:00 +0900
categories  : [terminal]
tags        : [tui, fzf, btop, lazygit, yazi, harlequin, opencode, neovim, architecture]
pin         : false
hidden      : false
---

프레임워크 목록만 보면 TUI 앱이 다 비슷하게 만들어질 것 같지만 실제로는 그렇지 않다.

같은 full-screen terminal UI라도 어떤 프로그램은 terminal control을 꽤 직접 다루고, 어떤 프로그램은 중간 수준의 TUI library를 쓰고, 어떤 프로그램은 component framework 위에서 만들어진다.

이 차이를 **추상화 계층 지도**에 꽂아보면 훨씬 잘 보인다.

```text
High-level Component Framework
  ├─ Textual
  └─ OpenTUI React/Solid

Application/TUI Library
  ├─ gocui
  └─ Ratatui 계열

Custom TUI Engine
  ├─ fzf
  ├─ btop
  └─ Neovim builtin TUI

Terminal Capability / Escape Sequence

PTY / termios
```

## 한눈에 보기

| 앱 | 주요 언어 | UI 접근 | 대략적인 추상화 위치 |
|---|---|---|---|
| fzf | Go | 자체 TUI layer + renderer backend | 낮음~중간 |
| btop | C++ | 자체 terminal UI engine | 낮음 |
| lazygit | Go | in-tree gocui 기반 | 중간 |
| yazi | Rust | Rust TUI 생태계 + async architecture | 중간 |
| Harlequin | Python | Textual | 높음 |
| OpenCode | TypeScript | OpenTUI/Solid | 매우 높음 |
| Neovim | C | builtin TUI + UI protocol | 자체 플랫폼 |

중요한 것은 언어가 아니라 **어떤 추상화를 직접 소유하느냐**다.

## fzf — 작고 빠른 도구가 자체 TUI layer를 가진 경우

`fzf`는 Go 프로그램이지만 Bubble Tea 위에서 만들어진 앱은 아니다.

소스에는 자체 terminal UI 계층이 있고, renderer abstraction도 별도로 존재한다.

현재 구조에는 기본적인 light renderer와 tcell 기반 renderer 경로가 있다.

단순화하면:

```text
fzf core/search state
       ↓
Terminal / Window abstraction
       ↓
Renderer interface
   ├─ light renderer
   └─ tcell renderer
       ↓
Terminal
```

즉 `fzf`는 "Go니까 Bubble Tea" 같은 구조가 아니다.

자신의 요구사항에 맞는 UI/event/rendering layer를 프로젝트 안에 직접 갖고 있다.

왜 이런 선택을 했는지 생각해보면 자연스럽다.

`fzf`의 핵심 요구사항은:

```text
극도로 빠른 startup
대량 후보 실시간 filtering
빠른 redraw
작은 binary
특수한 preview/layout 동작
```

같은 데 있다.

범용 application framework보다 자신의 workload에 맞춘 renderer/control이 중요하다.

## btop — UI 자체가 제품의 핵심인 custom engine

`btop`은 C++ 기반 system monitor다.

그래프, meter, process list, mouse, resize, color 등 복잡한 terminal UI를 자체 코드에서 깊게 다룬다.

```text
System metric collectors
       ↓
Application state
       ↓
Custom drawing/input code
       ↓
ANSI/terminal control
       ↓
Terminal
```

이런 monitoring 도구는 주기적으로 많은 cell을 갱신하면서 성능과 시각 표현을 세밀하게 제어해야 한다.

따라서 범용 high-level framework보다 프로젝트 전용 render path를 갖는 선택이 충분히 자연스럽다.

`btop --tty`처럼 terminal capability에 따라 표현 수준을 조절하는 옵션이 존재하는 것도 이 계층을 직접 다룬다는 감각을 보여준다.

## lazygit — 애플리케이션과 TUI library 사이의 전형적인 분리

`lazygit`은 Go 기반이지만 현재 Bubble Tea 앱이 아니다.

프로젝트 내부에서 유지하는 `gocui` 계층이 UI event loop, keypress, View rendering을 담당한다.

```text
Git domain logic
      ↓
Lazygit controllers / contexts / presentation
      ↓
gocui
      ↓
Terminal
```

여기서 `View`가 중요한 abstraction이다.

```text
Branches View
Files View
Commits View
Main View
Popup View
```

같이 애플리케이션 화면을 영역으로 나눈 뒤 각 영역에 내용을 채운다.

즉 lazygit은 terminal escape code부터 직접 만들지는 않지만, Textual/OpenTUI 같은 component framework보다 훨씬 애플리케이션에 가까운 TUI library를 사용한다.

## Yazi — TUI뿐 아니라 비동기 runtime 구조가 중요한 경우

Yazi는 Rust로 작성된 file manager이고 non-blocking async I/O를 핵심 특징으로 내세운다.

파일 관리자는 UI rendering보다도:

```text
filesystem scan
preview loading
image decoding
metadata
search
plugin
background task
```

같은 작업이 동시에 진행된다.

따라서 구조를 단순히 "Rust TUI"로만 보면 중요한 부분을 놓친다.

```text
Async tasks / filesystem
          ↓
Application state
          ↓
TUI rendering
          ↓
Terminal
```

Yazi가 빠르게 느껴지는 이유도 renderer 하나보다 **비동기 I/O와 task scheduling을 포함한 전체 application architecture**에 있다.

그리고 terminal image protocol까지 지원하기 때문에 문자 cell만 다루는 전통적인 TUI보다 terminal capability 영역도 넓다.

## Harlequin — high-level framework가 잘 맞는 IDE형 TUI

Harlequin은 Python 기반 SQL IDE이며 Textual을 사용한다.

SQL IDE에는 다음이 필요하다.

```text
Data Catalog tree
Query Editor
Results Table
Dialogs
Tabs
Focus
Keyboard navigation
Async DB queries
```

이런 UI는 low-level renderer보다 **widget/application framework**가 훨씬 중요하다.

그래서 구조가 자연스럽게:

```text
Harlequin domain/app logic
         ↓
Textual widgets / messages / layout
         ↓
Textual renderer/runtime
         ↓
Terminal
```

로 내려간다.

Harlequin이 특정 DB adapter를 plugin으로 붙이는 구조까지 생각하면 high-level application framework 선택이 더 잘 이해된다.

## OpenCode — 웹 프론트엔드에 가까운 TUI

OpenCode의 현재 TUI는 OpenTUI 계열 위에 있다.

OpenTUI 자체가:

```text
Zig native core
TypeScript bindings
component/renderable tree
Flexbox layout
input
cell diff renderer
React/Solid binding
```

을 제공한다.

OpenCode 쪽에서도 `@opentui/core`, `@opentui/keymap`, `@opentui/solid` 타입과 API를 직접 사용한다.

구조를 단순화하면:

```text
OpenCode session/app state
          ↓
Solid components
          ↓
OpenTUI renderables/layout/keymap
          ↓
Zig native renderer
          ↓
Terminal
```

이건 우리가 처음 이야기했던 "TypeScript로 터미널 앱을 만든다"가 가능한 이유를 잘 보여준다.

터미널 제어는 native core 아래로 내려가고 개발자는 component와 state를 중심으로 작업한다.

## Neovim — 앱이면서 동시에 UI 플랫폼

Neovim은 다른 사례와 조금 다르다.

자체 builtin TUI가 있지만 Editor Core와 UI protocol이 분리되어 있다.

```text
Neovim Core
      ↓ UI events
UI Protocol
  ├─ builtin TUI
  └─ external GUI
```

그리고 builtin TUI 위에서 끝나는 것도 아니다.

Neovim 내부 API가 다시 플러그인용 UI platform이 된다.

```text
Terminal
   ↑
Neovim builtin TUI
   ↑
Window / Buffer / Highlight API
   ↑
vim.ui / nui.nvim / Snacks
   ↑
Plugin
   ↑
LazyVim
```

즉 custom TUI engine이 **다른 UI abstraction의 기반 플랫폼**으로 다시 사용되는 사례다.

이건 별도 글에서 더 깊게 본다.

## 프레임워크를 안 쓰는 것이 낡은 방식은 아니다

여기서 중요한 결론이 있다.

```text
자체 renderer = 구식
high-level framework = 최신
```

으로 보면 안 된다.

유명하고 오래 살아남은 도구가 custom layer를 유지하는 이유는 대개 분명하다.

```text
성능 요구
startup 비용
binary size
특수한 layout
기존 codebase
terminal edge case 제어
앱 자체가 framework보다 먼저 존재
```

반대로 새롭고 복잡한 application을 빠르게 만들려면 framework가 주는 abstraction 가치가 크다.

## 앱의 성격과 추상화 선택

대략 이런 패턴이 보인다.

### 단일 목적 + 극한 반응성

```text
fzf
btop
```

→ custom / lower-level 제어가 강함

### 복잡한 domain + 패널형 UI

```text
lazygit
Yazi
```

→ 중간 수준 TUI abstraction + 앱 자체 architecture

### IDE형 복잡 UI

```text
Harlequin
OpenCode
```

→ high-level component/application framework가 유리

### 플랫폼 자체

```text
Neovim
```

→ 자체 UI engine + 외부/플러그인 UI abstraction

## 같은 TUI인데 완전히 다른 스택

최종적으로 이렇게 비교할 수 있다.

```text
fzf
App → own TUI renderer → Terminal

lazygit
App → gocui → Terminal

Harlequin
App → Textual → Terminal

OpenCode
App → Solid → OpenTUI → Zig renderer → Terminal

Neovim
Editor Core → UI protocol → builtin TUI → Terminal
                    ↑
                 Plugins
```

화면만 보면 다 "터미널 앱"이지만 내부 abstraction stack은 꽤 다르다.

이 관점이 생기면 새로운 TUI를 볼 때도:

> 이 앱은 어느 계층을 직접 구현했을까?

라는 질문부터 할 수 있다.

## 다음 단계 — Neovim을 별도로 뜯어보기

다음에는 Neovim을 좀 더 깊게 본다.

특히:

```text
왜 Editor Core와 TUI가 분리됐는지
UI protocol은 무엇인지
external GUI는 어떻게 붙는지
plugin UI API는 어느 층인지
LazyVim은 왜 TUI layer가 아닌지
```

를 하나의 stack으로 정리한다.

## 참고

- fzf source — 자체 `src/tui` renderer abstraction
- lazygit codebase guide — in-tree gocui가 event loop, keypress, rendering 담당
- Yazi — Rust + non-blocking async I/O architecture
- Harlequin — Python/Textual 기반 SQL IDE
- OpenTUI/OpenCode — native Zig core + TypeScript/Solid integration
- Neovim UI protocol / builtin TUI docs
