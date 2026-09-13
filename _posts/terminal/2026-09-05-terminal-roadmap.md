---
title       : "터미널 로드맵 — TTY·PTY에서 현대 TUI까지"
description : "터미널을 단순한 명령창이 아니라 하나의 입출력·렌더링 스택으로 이해하기 위한 학습 지도. TTY/PTY, termios, ANSI/VT, terminfo, curses를 거쳐 현대 TUI 프레임워크와 실제 애플리케이션 구조까지 바닥부터 올라간다."
date        : 2026-09-05 12:30:00 +0900
updated     : 2026-09-13 21:45:00 +0900
categories  : [terminal]
tags        : [roadmap, terminal, tty, pty, termios, ansi, vt, terminfo, ncurses, tui]
pin         : false
hidden      : false
---

터미널에서 동작하는 도구를 오래 쓰다 보면 서로 다른 질문이 결국 같은 바닥으로 모인다. `tmux`는 왜 터미널을 중첩할 수 있는가, SSH에서도 왜 Neovim 화면이 그대로 보이는가, TUI 앱은 픽셀을 그리지 않는데 어떻게 화면 전체를 갱신하는가, `fzf`와 `btop`은 무엇을 직접 구현했고 OpenTUI나 Ratatui는 무엇을 대신해주는가.

이 로드맵은 특정 도구의 사용법보다 **그 도구들이 공통으로 기대는 터미널의 원리와, 그 위에 UI 애플리케이션을 만드는 구조**를 다룬다.

큰 흐름은 세 구간으로 보면 가장 쉽다.

```text
1. 터미널 기반 기술
   TTY / PTY / termios / ANSI·VT / TERM·terminfo

2. 고전적인 터미널 UI 추상화
   curses / ncurses

3. 본격적인 TUI 애플리케이션 구조
   Event / State / UI Structure / Layout / Render / Diff / Framework
```

즉 앞부분은 **터미널 자체가 어떻게 동작하는가**를 이해하는 단계이고, 뒤로 갈수록 **터미널을 하나의 UI 플랫폼처럼 어떻게 사용할 것인가**로 질문이 올라간다.

## 먼저 잡을 다섯 질문

세부 기술 이름부터 외우지 않고, 터미널 전체를 다음 다섯 질문으로 본다.

```text
1. 프로세스는 터미널과 어떻게 연결되는가?
   → TTY / PTY / 표준 입출력 / 제어 터미널

2. 입력 바이트는 어떤 의미로 처리되는가?
   → termios / canonical / raw / echo / signal

3. 출력 바이트는 어떻게 화면 제어가 되는가?
   → ANSI / VT Escape Sequence / Terminal Emulator

4. 터미널 차이와 저수준 제어를 어떻게 추상화하는가?
   → termcap / terminfo / curses

5. TUI 애플리케이션 전체는 이벤트·상태·UI 구조·화면 갱신을 어떻게 조직하는가?
   → Event Loop / State / UI Structure / Layout / Renderer / TUI Framework
```

이 다섯 질문이 이 로드맵의 좌표다.

## 기술 목록이 아니라 책임 이동으로 본다

이 로드맵을 단일한 역사적 발전 단계처럼 외우면 오히려 헷갈린다. 핵심은 **개발자가 직접 책임지던 범위가 어디까지 공통 계층으로 이동했는가**다.

```text
프로세스와 터미널 연결
→ PTY

입력 의미 처리
→ termios

화면 제어 명령
→ ANSI / VT

터미널별 capability 차이
→ termcap / terminfo

화면·입력의 반복 처리
→ curses API

이벤트·상태·UI 구조·레이아웃·렌더링 구조
→ 앱 자체 또는 현대 TUI Framework
```

여기서 주의할 점이 있다.

> **이벤트 루프는 현대 TUI에서 처음 등장한 개념이 아니다.**

curses를 사용한 고전 TUI도 애플리케이션이 직접 `getch() → 상태 변경 → redraw → refresh()` 같은 이벤트 루프를 만들 수 있었다.

현대 TUI 프레임워크의 차이는 이벤트 루프를 발명한 것이 아니라, **Event / State / UI Structure / Layout / Render 같은 애플리케이션 구조 자체를 더 많이 공통화하고 프레임워크 안으로 끌어올린 것**이다.

## 한눈에 보기

| 단계 | 핵심 질문 | 주요 주제 |
|---|---|---|
| 1. 터미널의 정체 | 터미널은 프로그램인가 장치인가? | 터미널 에뮬레이터, TTY |
| 2. 프로세스와 연결 | 셸과 앱은 터미널에 어떻게 붙는가? | PTY, 표준 입출력, 제어 터미널 |
| 3. 입력 모드 | 왜 TUI는 키를 즉시 받을 수 있나? | termios, canonical/raw mode, echo, signal |
| 4. 화면 제어 | 출력 바이트로 어떻게 커서와 화면을 제어하나? | ANSI/VT escape sequence, cursor, color, alternate screen |
| 5. 호환성 | 터미널 인터페이스 차이를 앱은 어떻게 흡수하나? | TERM, termcap, terminfo |
| 6. 고전 TUI API | 제어 시퀀스와 입력 바이트를 직접 안 다루고 UI를 어떻게 만들었나? | curses API, ncurses, refresh, 입력 추상화, Window |
| 7. TUI 앱 구조 | 터미널을 UI 플랫폼처럼 사용할 때 앱 전체를 어떻게 조직하나? | Event Loop, State, UI Structure, Layout, Render, Diff |
| 8. 현대 TUI Framework | 그 앱 구조 중 어디까지 Framework가 대신하나? | Bubble Tea, Ratatui, Textual, OpenTUI |
| Branch A. 실제 앱 | 실제 앱은 어느 추상화 계층을 선택했나? | fzf, btop, lazygit, Yazi, Harlequin, OpenCode |
| Branch B. TUI 플랫폼 | TUI 앱이 다시 상위 UI 플랫폼이 될 수 있나? | Neovim 내장 TUI, UI protocol, vim.ui, nui, Snacks, LazyVim |
| Integration. 전체 연결 | tmux와 SSH는 이 스택 어디에 끼나? | 터미널 에뮬레이터 ↔ PTY ↔ 셸/tmux/SSH ↔ 애플리케이션 |

---

# Part 1. 터미널 자체를 이해하는 단계

## 1. 터미널은 무엇인가

출발점은 GUI 앱으로서의 Ghostty·Kitty·iTerm2가 아니라, Unix가 말하는 **터미널이라는 추상화가 무엇인지** 이해하는 것이다.

물리 터미널에서 터미널 에뮬레이터로 바뀌었어도 프로그램 입장에서는 여전히 터미널 장치와 대화하는 것처럼 보인다.

## 2. TTY와 PTY — 프로세스는 터미널에 어떻게 붙는가

현대 터미널 에뮬레이터는 보통 PTY를 만들고 그 반대편에 셸이나 TUI 프로그램을 실행한다.

```text
Terminal Emulator
       ↕
   PTY master
       ↕
   PTY slave
       ↕
Shell / TUI 프로그램
```

프로그램은 터미널 없이도 실행될 수 있다. PTY는 프로그램이 **대화형 터미널 환경을 필요로 할 때** 연결되는 입출력 계층이다.

글: [터미널은 무엇인가 — TTY에서 PTY까지](./2026-09-05-terminal-tty-pty.md)

## 3. termios — 입력 바이트는 어떻게 처리되는가

```text
keyboard
→ terminal emulator
→ PTY master
→ PTY slave / terminal driver
→ termios 규칙에 따른 처리
→ shell / app
```

핵심 질문은 다음이다.

```text
ICANON = Enter까지 모을까?
ECHO   = 입력 문자를 다시 보여줄까?
ISIG   = Ctrl-C 같은 제어 문자를 signal로 바꿀까?
raw    = 이런 가공을 얼마나 줄일까?
```

글: [termios와 raw mode — Ctrl-C는 언제 문자가 아니라 signal이 되는가](./2026-09-05-termios-canonical-raw-mode.md)

## 4. ANSI/VT — 출력 바이트가 화면 제어 명령이 되는 법

애플리케이션은 일반 문자와 제어 시퀀스를 같은 바이트 스트림으로 출력한다.

```text
app output
→ PTY
→ terminal emulator parser
→ 일반 문자면 표시
→ control sequence면 화면 상태 변경
```

즉 ANSI/VT는 프로그램이 아니라 **터미널 에뮬레이터가 해석하는 화면 제어용 문법/약속**이다.

글: [ANSI/VT Escape Sequence — 표준 출력으로 커서를 움직이고 화면을 그리는 법](./2026-09-05-ansi-vt-escape-sequences.md)

## 5. TERM과 terminfo — 터미널 인터페이스 차이를 다루는 법

ANSI/VT 계열의 공통 문법이 있어도 모든 터미널 인터페이스가 capability를 완전히 동일하게 제공하는 것은 아니다.

```text
TERM
= 사용할 터미널 인터페이스 정의의 이름

terminfo
= 그 정의의 capability와 sequence 정보

tput
= TERM + terminfo를 사용하는 조회/출력 도구
```

앱이 항상 terminfo를 거쳐야 하는 것은 아니다. 직접 ANSI/VT를 출력할 수도 있고, curses 같은 상위 라이브러리가 아래 계층을 처리할 수도 있다.

글: [termcap과 terminfo — 터미널마다 다른 제어 코드를 어떻게 숨겼나](./2026-09-05-termcap-terminfo-tput.md)

---

# Part 2. 고전적인 터미널 UI 추상화

## 6. curses/ncurses — 터미널 제어를 화면·입력 API로 올린다

여기가 중요한 경계다.

```text
이전
= 터미널을 어떻게 제어할까?

curses
= 터미널 UI의 반복적인 처리를 어떻게 공통 API로 만들까?
```

`curses`는 고전적인 TUI API/추상화 계열이고, `ncurses`는 그 대표적인 구현체다.

```text
curses
= API / 추상화 계열

ncurses
= 대표적인 구현
```

curses 계열은 애플리케이션이 ANSI/VT 제어 시퀀스와 특수키 입력 바이트를 직접 처리하는 부담을 줄이고, 화면 상태·`refresh()`·논리적 키·Window 같은 API를 제공한다.

```text
app
→ curses API
→ ncurses 같은 구현체
→ terminfo / termios / terminal control
→ terminal emulator
```

다만 curses가 애플리케이션 전체 구조까지 대신해주는 것은 아니다.

```text
while running:
    ch = getch()
    update_state(ch)
    redraw()
    refresh()
```

같은 이벤트 루프와 상태 구조는 앱이 직접 만들 수 있다.

즉 curses는 **현대 TUI와 단절된 세계라기보다, 터미널 제어 추상화와 애플리케이션 구조 사이의 경계층**으로 보는 편이 정확하다.

글: [curses와 ncurses — 터미널 제어가 화면·입력 추상화로 올라온 순간](./2026-09-05-curses-ncurses-screen-window.md)

---

# Part 3. 터미널을 본격적인 UI 플랫폼으로 사용하는 단계

## 7. TUI 엔진 — Event에서 Render까지

이제 질문이 달라진다.

> **터미널을 하나의 UI 화면으로 쓸 때, 대화형 애플리케이션 전체 실행 흐름과 UI 구조를 어떻게 조직할까?**

대표적인 공통 구조는 다음과 같다.

```text
Event Source
   ↓
Event Loop
   ↓
State Update
   ↓
UI Structure
   ├─ Immediate-style
   └─ Component Tree / Retained-style
   ↓
Layout
   ↓
Render Representation
   ↓
Diff
   ↓
Terminal Output
```

여기서 `UI Structure`는 화면을 어떤 방식으로 조직하고 기술할지에 대한 상위 개념이다.

```text
Immediate-style
= 현재 State에서 매번 다음 화면을 다시 기술

Component Tree / Retained-style
= UI를 부모·자식 Component 구조로 유지하고
  State·Layout·Rendering을 그 구조에 연결
```

따라서 Component Tree는 Cell Buffer 같은 렌더링 구현 세부보다 위쪽에 있는 **UI 구성 방식**으로 보는 편이 자연스럽다. React의 Component Tree와 비슷하게 느껴지는 것도 이 때문이다. 다만 모든 현대 TUI 프레임워크가 Component Tree 방식을 쓰는 것은 아니다.

여기서 중요한 것은 Event Loop 자체의 존재가 새롭다는 것이 아니다.

**현대 TUI에서는 앱이 직접 만들던 Event / State / UI Structure / Layout / Render 구조를 명시적인 아키텍처로 보고, 프레임워크가 그중 더 많은 책임을 맡기 시작한다.**

렌더링 측면에서는 curses의 `refresh()`와 현대 TUI의 `Diff Rendering` 사이에도 이어지는 아이디어가 있다.

```text
curses
가상 화면 ↔ 현재 화면 모델
        ↓
     refresh()

현대 TUI
이전 Render 상태 ↔ 다음 Render 상태
        ↓
       Diff
```

글: [TUI 엔진의 공통 구조 — 이벤트 루프에서 렌더링까지](./2026-09-05-tui-event-loop-state-renderer.md)

## 8. 현대 TUI 프레임워크 — 앱 구조 중 어디까지 대신하는가

현대 프레임워크들은 curses API를 구현한 것이 아니다.

대신 **curses가 풀던 터미널 UI 문제에서 더 올라가, 애플리케이션 구조 자체를 각자의 방식으로 추상화한다.**

| 생태계 | 대표 도구 | 주로 맡는 범위 |
|---|---|---|
| Go | Bubble Tea | Model / Msg / Update / View |
| Rust | Ratatui + Crossterm | Event 처리 기반 + Widget / Layout / Buffer / Diff |
| Python | Textual | Event / Widget / State / Layout / Rendering |
| TypeScript | OpenTUI | Component / Layout / Renderer / React·Solid bindings |

즉 현대 TUI를 이해할 때 질문은:

> **이 프레임워크가 curses를 구현했나?**

가 아니라:

> **Event → State → UI Structure → Layout → Render 흐름 중 어디까지 대신해주나?**

가 더 중요하다.

글: [현대 TUI 프레임워크 비교 — 무엇을 얼마나 추상화하는가](./2026-09-05-modern-tui-frameworks-abstraction.md)

배경 글: [TUI의 역사와 현대 프레임워크 — ncurses에서 OpenTUI까지](./2026-09-05-tui-history-and-modern-frameworks.md)

여기까지가 로드맵의 **핵심 학습 경로**다. 아래부터는 이 구조를 실제 앱과 통합 사례에 적용하는 선택적 Zoom-in이다.

---

# Zoom-in

## Branch A — 실제 애플리케이션을 추상화 계층에 꽂아보기

프레임워크 이름을 외우는 대신 실제 사용하는 도구가 어느 계층을 선택했는지 본다.

- `fzf`, `btop`, Neovim처럼 자체 TUI 처리 계층을 가진 프로그램
- 중간 수준 TUI 계층을 사용하는 lazygit/Yazi
- Textual 기반 Harlequin
- OpenTUI 기반 OpenCode

같은 TUI라도 어떤 앱은 터미널에 가까이 내려가고, 어떤 앱은 고수준 프레임워크 위에서 만들어진다.

글: [실제 TUI 앱은 어느 추상화 계층에 서 있나 — fzf부터 OpenCode까지](./2026-09-05-tui-app-abstraction-map.md)

## Branch B — Neovim: TUI가 다시 플랫폼이 되는 사례

Neovim은 단순한 터미널 애플리케이션에서 끝나지 않는다.

```text
터미널
   ↑
Neovim 내장 TUI
   ↑
Neovim UI / Window / Buffer API
   ↑
vim.ui / nui.nvim / Snacks
   ↑
플러그인
   ↑
LazyVim
```

자체 TUI가 다시 플러그인용 UI 플랫폼의 바닥이 되고, 그 위에 UI 라이브러리와 배포판 생태계가 올라간다.

글: [Neovim은 왜 TUI 앱이면서 UI 플랫폼인가](./2026-09-05-neovim-as-tui-platform.md)

## Integration — tmux·SSH까지 전체 스택 연결하기

마지막에는 개별 개념을 한 그림으로 연결한다.

```text
Ghostty
   ↕
로컬 PTY
   ↕
tmux client
   ↕ socket
tmux server
   ↕
Pane PTY
   ↕
Neovim / fzf / shell
```

SSH가 들어오면 단순 명령 실행과 대화형 PTY 세션을 구분하고, 어느 쪽에서 PTY가 생기는지, `TERM`은 어디서 전달되는지, 터미널 크기 변경과 signal은 어떻게 흘러가는지를 추적한다.

글: [tmux와 SSH까지 연결한 터미널 전체 스택](./2026-09-05-tmux-ssh-terminal-stack.md)

## 다른 로드맵과의 경계

이 로드맵은 **공통 기반 원리**만 다룬다.

- zsh/bash 문법·파이프·스크립팅·환경변수 관리 → `shell`
- tmux 설정·키맵·세션·플러그인 → `tmux`
- Neovim 편집·LSP·플러그인·LazyVim 사용법 → `neovim`
- 터미널 자체, PTY, 입력 모드, escape sequence, TUI 렌더링 원리 → `terminal`

즉 **도구를 쓰는 법은 도구 폴더, 도구들이 공통으로 기대는 터미널 원리와 TUI 구조는 이 로드맵**에 둔다.
