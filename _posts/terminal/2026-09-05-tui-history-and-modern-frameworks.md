---
title       : "TUI의 역사와 현대 프레임워크 — ncurses에서 OpenTUI까지"
description : "터미널 사용자 인터페이스(TUI)가 터미널 제어 중심에서 화면 추상화, 상태·이벤트, 컴포넌트 기반 UI로 발전해 온 흐름을 정리한다."
date        : 2026-09-05 11:50:00 +0900
updated     : 2026-09-13 18:15:00 +0900
categories  : [terminal]
tags        : [tui, terminal, cli, ncurses, opentui, bubble-tea, ratatui, textual, neovim]
pin         : false
hidden      : false
---

터미널에서 동작하는 프로그램을 떠올리면 보통 `ls`, `git`, `grep` 같은 CLI(Command Line Interface, 명령줄 인터페이스)를 먼저 생각한다. 하지만 `lazygit`, `btop`, Yazi, `k9s`, OpenCode처럼 화면 전체를 사용하고 키보드로 탐색하는 프로그램은 조금 다르다. 이런 프로그램을 **TUI(Terminal User Interface, 터미널 사용자 인터페이스)**라고 부른다.

요즘 TUI가 새롭게 느껴지지만 역사는 오래됐다. 중요한 변화는 TUI 자체가 새로 생긴 것이 아니라, **애플리케이션 개발자가 직접 책임지는 범위가 점점 위로 올라왔다는 것**이다.

이 글에서는 다음 흐름만 먼저 잡는다.

```text
터미널 제어 문자열을 직접 다룸
        ↓
화면·창 단위로 추상화
        ↓
상태와 이벤트 중심으로 앱을 구성
        ↓
레이아웃·컴포넌트까지 프레임워크가 담당
```

세부 프레임워크의 구조와 장단점은 [현대 TUI 프레임워크 비교](./2026-09-05-modern-tui-frameworks-abstraction.md)에서 따로 본다.

## CLI와 TUI는 무엇이 다른가

CLI는 보통 명령을 입력하고 결과를 출력하는 구조다.

```text
$ git status
On branch main
nothing to commit
```

반면 TUI는 터미널 전체를 하나의 화면처럼 사용한다.

```text
┌─────────────────────────────┐
│ Files                       │
├─────────────────────────────┤
│ > README.md                 │
│   package.json              │
│   src/                      │
│                             │
└─────────────────────────────┘
```

마우스가 없어도 방향키, Vim 키, 단축키 등으로 화면 안의 구성요소를 탐색할 수 있다. 즉 터미널을 단순한 출력 장치가 아니라 **계속 갱신되는 UI 화면**으로 사용하는 것이다.

## 1. 시작 — 터미널을 직접 제어하던 시기

1960~70년대에는 오늘날의 GUI 환경이 없었다. 사용자는 텔레타이프나 문자 터미널을 통해 컴퓨터와 상호작용했다.

초기에는 명령과 출력이 순차적으로 쌓이는 형태였지만, CRT 기반 터미널이 등장하면서 커서를 특정 위치로 이동하고 화면 일부를 다시 그릴 수 있게 됐다. 텍스트만으로도 메뉴, 입력창, 패널 같은 화면을 만들 수 있게 된 것이다.

하지만 애플리케이션이 화면을 제어하려면 터미널의 커서 이동·화면 지우기 같은 기능을 알아야 했고, 터미널마다 지원 기능과 제어 문자열도 달랐다.

```text
애플리케이션
   ↓
터미널 제어 문자열
   ↓
터미널
```

이 시기에는 개발자의 관심사가 터미널 자체에 매우 가까웠다.

> 어떤 제어 문자열을 보내야 원하는 화면을 만들 수 있는가?

## 2. curses — 터미널 제어에서 화면·창으로 올라간다

터미널마다 다른 기능을 `termcap`이나 `terminfo` 같은 capability database로 기술할 수 있게 되면서, 애플리케이션은 터미널 모델마다 제어 문자열을 직접 하드코딩하지 않아도 됐다.

그 위에서 curses는 개발자의 관심사를 한 단계 더 끌어올렸다.

```text
애플리케이션
    ↓
curses / ncurses
    ↓
terminfo
    ↓
터미널
```

이제 개발자는:

```text
"커서를 어떻게 움직이지?"
```

보다:

```text
"화면의 어느 위치에 무엇을 그리고,
어느 창을 갱신하지?"
```

를 더 많이 생각할 수 있게 됐다.

Unix 계열에서는 이후 ncurses가 널리 쓰이는 curses 구현으로 자리 잡았고, 오랫동안 TUI 개발의 대표적인 기반으로 사용됐다.

구체적인 화면·창·refresh 구조는 [curses와 ncurses](./2026-09-05-curses-ncurses-screen-window.md)에서 자세히 본다.

## 3. GUI와 웹 시대에도 TUI는 사라지지 않았다

1990년대 이후 GUI와 웹이 대중화되면서 일반 사용자용 애플리케이션의 중심은 데스크톱과 브라우저로 이동했다.

하지만 TUI는 서버 관리, Unix/Linux 도구, 설치 프로그램, 텍스트 편집기 같은 영역에서 계속 사용됐다.

대표적으로 다음과 같은 도구들이 있다.

- `vi`, `vim`, `emacs`
- Midnight Commander
- `top`, `htop`
- `tmux`
- 각종 Linux 설치·관리 도구

터미널만 있으면 사용할 수 있고 SSH 환경에서도 같은 인터페이스를 유지할 수 있다는 점이 중요한 장점이었다.

## 4. 현대 TUI — 화면보다 상태와 이벤트를 먼저 생각한다

2010년대 이후 개발자 도구를 중심으로 TUI가 다시 눈에 띄기 시작했다. `lazygit`, `k9s`, `btop`, Yazi 같은 프로그램이 대표적이다.

여기서 중요한 변화는 단순히 TUI 프로그램 수가 늘었다는 것이 아니다.

애플리케이션을 만드는 사고방식이 달라졌다.

```text
과거
터미널 좌표
  ↓
문자 출력
  ↓
화면 갱신

현재
애플리케이션 상태
  ↓
이벤트 처리
  ↓
레이아웃
  ↓
렌더링
  ↓
터미널
```

컴포넌트, 선언형 UI, 상태 관리, 이벤트 루프, Flexbox 같은 GUI/Web UI의 아이디어가 TUI에도 들어오기 시작했다.

이 공통 구조는 [TUI 엔진의 공통 구조](./2026-09-05-tui-event-loop-state-renderer.md)에서 자세히 본다.

## 5. 현대 프레임워크는 서로 다른 높이까지 추상화한다

현대 TUI 생태계에서는 언어와 설계 철학에 따라 여러 프레임워크가 사용된다.

| 언어 | 대표 프레임워크 | 이 글에서 볼 위치 |
| --- | --- | --- |
| C | ncurses | 화면·창 추상화 |
| C++ | FTXUI | 현대 TUI 계층 |
| Go | Bubble Tea | 상태·메시지 중심 구조 |
| Rust | Ratatui | 레이아웃·렌더링 중심 구조 |
| Python | Textual | 고수준 애플리케이션 프레임워크 |
| TypeScript | OpenTUI, Ink | 컴포넌트 기반 TUI |

여기서 중요한 것은 프레임워크 이름을 외우는 것이 아니라 **개발자가 직접 책임지는 영역이 어디까지 남아 있는가**다.

```text
낮은 추상화
→ 입력·상태·렌더링 구조를 애플리케이션이 더 많이 직접 설계

높은 추상화
→ 프레임워크가 상태 흐름·레이아웃·컴포넌트·렌더링을 더 많이 담당
```

Bubble Tea, Ratatui, Textual, OpenTUI의 구체적인 차이는 [현대 TUI 프레임워크 비교](./2026-09-05-modern-tui-frameworks-abstraction.md)에서 같은 비교축으로 본다.

## 6. 실제 애플리케이션은 같은 높이를 선택하지 않는다

현대적인 TUI라고 해서 모두 고수준 프레임워크를 사용하는 것은 아니다.

어떤 프로그램은 자체 TUI 엔진을 유지하고, 어떤 프로그램은 중간 수준 라이브러리를 사용하며, 어떤 프로그램은 고수준 컴포넌트 프레임워크 위에서 만들어진다.

```text
자체 TUI 계층
→ fzf / btop / Neovim 계열

중간 수준 TUI 추상화
→ 애플리케이션이 상태와 실행 구조를 상당 부분 직접 소유

고수준 애플리케이션 프레임워크
→ Textual / OpenTUI 계열
```

이 차이는 오래된 방식과 최신 방식의 차이가 아니라, **애플리케이션이 어떤 제어권과 추상화를 필요로 하는가**의 차이다.

실제 프로그램을 같은 지도에 배치한 비교는 [실제 TUI 앱은 어느 추상화 계층에 서 있나](./2026-09-05-tui-app-abstraction-map.md)에서 본다.

## 7. TUI가 다시 플랫폼이 되기도 한다 — Neovim

Neovim은 단순한 TUI 애플리케이션에서 한 단계 더 나아간 사례다.

```text
Neovim Core
   ↓
UI Protocol
   ├─ 내장 TUI → 터미널
   └─ 외부 GUI
```

그리고 Neovim 내부에서는 Window, Buffer, Highlight 같은 API가 다시 플러그인용 UI 기반이 된다.

```text
플러그인
  ↓
Neovim UI API
  ↓
Neovim Core
  ↓
UI Protocol
  ↓
내장 TUI
  ↓
터미널
```

즉 하나의 TUI 애플리케이션이 다시 다른 UI와 플러그인이 올라가는 플랫폼 역할을 할 수 있다.

이 구조는 [Neovim은 왜 TUI 앱이면서 UI 플랫폼인가](./2026-09-05-neovim-as-tui-platform.md)에서 따로 본다.

## 과거와 현재를 한 번에 놓으면

TUI의 변화는 다음처럼 정리할 수 있다.

```text
터미널 제어
"어떤 제어 문자열을 보내지?"
        ↓

Capability 추상화
"현재 터미널에서 이 기능을 어떻게 쓰지?"
        ↓

화면·창 추상화
"어느 화면 영역을 갱신하지?"
        ↓

상태·이벤트 중심 TUI
"입력에 따라 상태를 어떻게 바꾸지?"
        ↓

컴포넌트 TUI
"어떤 UI 구조를 만들지?"
```

터미널 자체는 여전히 문자 셀과 제어 시퀀스를 기반으로 동작하지만, **개발자가 직접 생각해야 하는 추상화 수준이 계속 올라온 것**이다.

## 정리

- TUI는 새로운 기술이 아니라 오래된 사용자 인터페이스 방식이다.
- 초기에는 애플리케이션이 터미널 제어에 가까이 붙어 있었다.
- terminfo와 curses 계층이 등장하면서 터미널별 제어보다 화면·창을 중심으로 생각할 수 있게 됐다.
- 현대 TUI에서는 상태, 이벤트, 레이아웃, 렌더링 같은 애플리케이션 구조가 더 중요해졌다.
- 최근 프레임워크는 이 구조를 서로 다른 높이까지 추상화한다.
- 실제 애플리케이션은 자신의 요구사항에 따라 자체 엔진부터 고수준 컴포넌트 프레임워크까지 서로 다른 계층을 선택한다.
- Neovim처럼 TUI 애플리케이션 자체가 다시 UI 플랫폼이 되는 경우도 있다.

핵심은 다음 한 문장으로 줄일 수 있다.

> **TUI의 변화는 터미널이 완전히 다른 것이 된 역사가 아니라, 개발자가 직접 다루는 관심사가 터미널 제어에서 화면, 상태, 컴포넌트로 점점 올라온 과정이다.**

## 참고

- [터미널 로드맵](./2026-09-05-terminal-roadmap.md)
- [curses와 ncurses](./2026-09-05-curses-ncurses-screen-window.md)
- [TUI 엔진의 공통 구조](./2026-09-05-tui-event-loop-state-renderer.md)
- [현대 TUI 프레임워크 비교](./2026-09-05-modern-tui-frameworks-abstraction.md)
- [실제 TUI 앱 추상화 지도](./2026-09-05-tui-app-abstraction-map.md)
- [Neovim은 왜 TUI 앱이면서 UI 플랫폼인가](./2026-09-05-neovim-as-tui-platform.md)
- [OpenTUI 공식 문서](https://opentui.com/docs/)
- [Ratatui 공식 사이트](https://ratatui.rs/)
- [Bubble Tea GitHub](https://github.com/charmbracelet/bubbletea)
- [Textual 공식 문서](https://textual.textualize.io/)
- [Neovim TUI](https://neovim.io/doc/user/tui/)
- [ncurses](https://invisible-island.net/ncurses/)