---
title       : "터미널 로드맵 — TTY·PTY에서 현대 TUI까지"
description : "터미널을 단순한 명령창이 아니라 하나의 입출력·렌더링 스택으로 이해하기 위한 학습 지도. TTY/PTY, termios, ANSI/VT, terminfo, curses를 거쳐 현대 TUI 프레임워크와 실제 애플리케이션 구조까지 바닥부터 올라간다."
date        : 2026-09-05 12:30:00 +0900
updated     : 2026-09-05 12:30:00 +0900
categories  : [terminal]
tags        : [roadmap, terminal, tty, pty, termios, ansi, vt, terminfo, ncurses, tui]
pin         : false
hidden      : false
---

터미널에서 동작하는 도구를 오래 쓰다 보면 서로 다른 질문이 결국 같은 바닥으로 모인다. `tmux`는 왜 터미널을 중첩할 수 있는가, SSH에서도 왜 Neovim 화면이 그대로 보이는가, TUI 앱은 픽셀을 그리지 않는데 어떻게 화면 전체를 갱신하는가, `fzf`와 `btop`은 무엇을 직접 구현했고 OpenTUI나 Ratatui는 무엇을 대신해주는가.

이 로드맵은 특정 도구의 사용법보다 **그 도구들이 공통으로 기대는 터미널의 원리**를 다룬다. 도구 자체의 설정과 사용법은 기존 `shell`, `tmux`, `neovim` 로드맵에 두고, 여기서는 그 아래의 공통 기반을 바닥부터 올라간다.

## 한눈에 보기

| 단계 | 핵심 질문 | 주요 주제 |
|---|---|---|
| 1. 터미널의 정체 | 터미널은 프로그램인가 장치인가? | terminal emulator, TTY |
| 2. 프로세스와 연결 | 셸과 앱은 터미널에 어떻게 붙는가? | PTY, stdin/stdout, controlling terminal |
| 3. 입력 모드 | 왜 TUI는 키를 즉시 받을 수 있나? | termios, canonical/raw mode, echo, signal |
| 4. 화면 제어 | stdout으로 어떻게 커서를 움직이나? | ANSI/VT escape sequence, cursor, color, alternate screen |
| 5. 터미널 차이 추상화 | 터미널마다 기능이 다른데 앱은 어떻게 대응했나? | termcap, terminfo |
| 6. 고전 TUI | escape sequence를 직접 안 쓰고 UI를 어떻게 만들었나? | curses, ncurses, screen/window abstraction |
| 7. TUI 엔진 | 화면 전체를 매번 다시 그리는가? | event loop, state, layout, renderer, diff/redraw |
| 8. 현대 TUI | 최근 프레임워크는 무엇을 더 추상화하나? | Bubble Tea, Ratatui, Textual, OpenTUI |
| 9. 실제 앱 해부 | 내가 쓰는 앱은 어느 계층에 서 있나? | fzf, btop, lazygit, yazi, Harlequin, OpenCode |
| 10. 플랫폼으로서의 TUI | TUI 위에 다시 UI 생태계가 생길 수 있나? | Neovim builtin TUI, UI protocol, vim.ui, nui, Snacks, LazyVim |
| 11. 전체 연결 | tmux와 SSH는 이 스택 어디에 끼나? | terminal emulator ↔ PTY ↔ shell/tmux/SSH ↔ application |

## 1. 터미널은 무엇인가

출발점은 GUI 앱으로서의 Ghostty·Kitty·iTerm2가 아니라, Unix가 말하는 **터미널이라는 추상화가 무엇인지** 이해하는 것이다. 물리 터미널에서 terminal emulator로 바뀌었어도 프로그램 입장에서는 여전히 터미널 장치와 대화하는 것처럼 보인다.

여기서 TTY의 역사와 현재 의미를 잡는다.

## 2. TTY와 PTY — 프로세스는 터미널에 어떻게 붙는가

현대 터미널 에뮬레이터는 보통 pseudo-terminal(PTY)을 만들고 그 반대편에 shell을 실행한다.

```text
Terminal Emulator
       ↕
      PTY
       ↕
      zsh
       ↕
 Application
```

이 구조를 이해하면 `ssh`, `tmux`, 컨테이너의 `-t`, 터미널 resize 같은 현상이 한 계통으로 연결되기 시작한다.

## 3. stdin/stdout과 termios — 키 입력은 어떻게 앱까지 오는가

평범한 셸 입력에서는 Enter 전까지 한 줄을 모으지만, Neovim이나 `fzf`는 키 하나를 누르는 즉시 반응한다. 차이는 terminal driver의 입력 모드다.

- canonical mode
- raw mode
- echo
- control character
- `Ctrl-C`와 signal

여기서는 `termios`를 직접 바꿔보며 입력 경로를 확인한다.

## 4. ANSI/VT Escape Sequence — 텍스트로 화면을 그리는 법

TUI 앱이 보통 픽셀을 직접 그리는 것은 아니다. stdout에 일반 문자와 함께 escape sequence를 출력하고 terminal emulator가 이를 커서 이동·색상·화면 지우기 명령으로 해석한다.

직접 `printf`로 커서를 움직이고 화면을 지우는 실험을 해본다.

## 5. termcap과 terminfo — 서로 다른 터미널을 다루는 법

과거 터미널마다 지원 기능과 제어 문자열이 달랐다. 이를 데이터로 기술하고 애플리케이션이 조회할 수 있게 한 계층이 `termcap`과 `terminfo`다.

여기서 `TERM`, capability database, `tput`이 연결된다.

## 6. curses/ncurses — Screen과 Window의 등장

escape sequence를 직접 조합하는 대신 화면을 하나의 상태로 다루고 필요한 부분을 갱신하는 라이브러리가 등장했다.

```text
Application
    ↓
curses / ncurses
    ↓
terminfo
    ↓
Terminal
```

`vi` 같은 초기 애플리케이션과 이후 curses 계열 프로그램을 비교하며 추상화 수준이 어떻게 올라갔는지 본다.

## 7. TUI Engine — Event Loop와 Renderer

현대 TUI 프레임워크를 이해하려면 내부의 공통 구조를 먼저 본다.

```text
Input Event
    ↓
Event Loop
    ↓
State Update
    ↓
Layout
    ↓
Render
    ↓
Terminal
```

핵심은 전체 화면을 무작정 출력하는 것이 아니라 **현재 UI 상태와 터미널 셀의 차이를 계산해 필요한 부분을 갱신하는 방식**이다.

## 8. 현대 TUI Framework

고전 curses에서 더 올라가 상태·컴포넌트·레이아웃까지 프레임워크가 담당하기 시작한다.

| 생태계 | 대표 도구 | 주로 추상화하는 것 |
|---|---|---|
| Go | Bubble Tea | Elm식 Model/Update/View |
| Rust | Ratatui + Crossterm | Widget/Layout + terminal backend |
| Python | Textual | Widget, event, CSS형 layout/style |
| TypeScript | OpenTUI | component, layout, native renderer, React/Solid bindings |

기존 글: [TUI의 역사와 현대 프레임워크 — ncurses에서 OpenTUI까지](/posts/terminal/2026-09-05-tui-history-and-modern-frameworks/)

## 9. 실제 애플리케이션을 추상화 계층에 꽂아보기

프레임워크 이름을 외우는 대신 실제 사용하는 도구가 어느 계층을 선택했는지 본다.

- `fzf`, `btop`, Neovim처럼 자체 TUI 처리 계층을 가진 프로그램
- Bubble Tea 계열의 Go 애플리케이션
- Rust TUI 생태계와 `yazi`
- Textual 기반 Harlequin
- OpenTUI 기반 OpenCode

같은 "TUI"라도 어떤 앱은 터미널에 가까이 내려가고, 어떤 앱은 고수준 프레임워크 위에서 만들어진다.

## 10. Neovim — TUI가 다시 플랫폼이 되는 사례

Neovim은 단순한 터미널 애플리케이션에서 끝나지 않는다.

```text
Terminal
   ↑
Neovim builtin TUI
   ↑
Neovim UI / Window / Buffer API
   ↑
vim.ui / nui.nvim / Snacks
   ↑
Plugin
   ↑
LazyVim
```

자체 TUI가 다시 플러그인용 UI 플랫폼의 바닥이 되고, 그 위에 UI 라이브러리와 배포판 생태계가 올라간다. **추상화가 한 번만 일어나는 것이 아니라 반복해서 층을 만든다**는 좋은 사례다.

## 11. tmux·SSH까지 전체 스택 연결하기

마지막에는 개별 개념을 한 그림으로 연결한다.

```text
Ghostty
   ↕
local PTY
   ↕
tmux client
   ↕
tmux server
   ↕
PTY
   ↕
Neovim / fzf / shell
```

SSH가 들어오면 어느 쪽에서 PTY가 생기는지, `TERM`은 어디서 전달되는지, resize와 signal은 어떻게 흘러가는지를 추적한다.

## 다른 로드맵과의 경계

이 로드맵은 **공통 기반 원리**만 다룬다.

- zsh/bash 문법·파이프·스크립팅·환경변수 관리 → `shell`
- tmux 설정·키맵·세션·플러그인 → `tmux`
- Neovim 편집·LSP·플러그인·LazyVim 사용법 → `neovim`
- 터미널 자체, PTY, 입력 모드, escape sequence, TUI 렌더링 원리 → `terminal`

즉 **도구를 쓰는 법은 도구 폴더, 도구들이 공통으로 기대는 터미널 원리는 이 로드맵**에 둔다.
