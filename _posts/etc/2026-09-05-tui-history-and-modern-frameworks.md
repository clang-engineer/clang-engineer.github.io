---
title       : "TUI의 역사와 현대 프레임워크 — ncurses에서 OpenTUI까지"
description : "터미널 UI(TUI)의 역사와 CLI와의 차이, ncurses에서 Bubble Tea·Ratatui·Textual·OpenTUI로 이어지는 현대 TUI 프레임워크의 흐름을 정리합니다."
date        : 2026-09-05 11:50:00 +0900
updated     : 2026-09-05 11:50:00 +0900
categories  : [etc, "terminal"]
tags        : [tui, terminal, cli, ncurses, opentui, bubble-tea, ratatui, textual]
pin         : false
hidden      : false
---

터미널에서 동작하는 프로그램을 떠올리면 보통 `ls`, `git`, `grep` 같은 CLI를 먼저 생각한다. 하지만 `lazygit`, `btop`, `yazi`, `k9s`, `OpenCode`처럼 화면 전체를 사용하고 키보드로 탐색하는 프로그램은 조금 다르다. 이런 프로그램을 **TUI(Text User Interface)**라고 부른다.

요즘 TUI가 새롭게 느껴지지만 역사는 매우 오래됐다. 흥미로운 점은 TUI 자체가 새로 생긴 것이 아니라, **만드는 방식이 현대적인 UI 프레임워크의 영향을 받아 크게 바뀌고 있다는 것**이다.

## CLI와 TUI는 무엇이 다른가

CLI(Command Line Interface)는 보통 명령을 입력하고 결과를 출력하는 구조다.

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

마우스가 없어도 방향키, Vim 키, 단축키 등으로 화면 안의 컴포넌트를 탐색할 수 있다. 즉 터미널을 단순한 출력 장치가 아니라 **UI 렌더링 대상**으로 사용하는 것이다.

## TUI의 시작

1960~70년대에는 오늘날의 GUI 환경이 없었다. 사용자는 텔레타이프나 문자 터미널을 통해 컴퓨터와 상호작용했다.

초기에는 명령과 출력이 순차적으로 쌓이는 형태였지만, CRT 기반 터미널이 등장하면서 커서를 특정 위치로 이동하고 화면 일부를 다시 그릴 수 있게 됐다. 이때부터 텍스트만으로도 메뉴, 입력창, 패널 같은 UI를 만들 수 있게 된다.

하지만 문제가 하나 있었다. 터미널마다 커서 이동, 화면 지우기, 색상 표현 방식이 달랐다.

이 차이를 추상화하기 위해 등장한 것이 **curses**이고, 이후 Unix 계열에서는 **ncurses**가 사실상의 표준 역할을 하게 된다.

```text
Application
    ↓
ncurses
    ↓
Terminal capabilities
    ↓
Terminal
```

오랫동안 "TUI 개발"이라고 하면 C와 ncurses를 떠올리는 이유다.

## 한동안 TUI는 어디에 남아 있었나

1990년대 이후 GUI와 웹이 대중화되면서 일반 사용자용 애플리케이션은 데스크톱과 브라우저로 이동했다.

하지만 TUI가 사라진 것은 아니다. 서버 관리, Unix/Linux 도구, 설치 프로그램, 텍스트 편집기 같은 영역에서는 계속 살아남았다.

대표적으로 다음과 같은 도구들이 있다.

- `vi`, `vim`, `emacs`
- Midnight Commander
- `top`, `htop`
- `tmux`
- 각종 Linux 설치·관리 도구

터미널만 있어도 동작하고, SSH 환경에서도 그대로 사용할 수 있다는 장점이 컸다.

## Modern TUI의 부활

2010년대 이후 개발자 도구를 중심으로 TUI가 다시 눈에 띄기 시작했다.

대표적인 프로그램들이 `lazygit`, `k9s`, `btop`, `yazi`다.

예전 TUI가 "터미널의 특정 좌표에 문자를 그린다"에 가까웠다면, 현대 TUI는 상태 관리, 레이아웃, 컴포넌트, 이벤트 처리 같은 **GUI 프레임워크의 아이디어를 적극적으로 가져온다.**

이 변화와 함께 언어별로 대표적인 TUI 프레임워크 생태계도 만들어졌다.

| 언어 | 대표 프레임워크 | 특징 |
| --- | --- | --- |
| C | ncurses | 전통적인 저수준 TUI |
| C++ | FTXUI | 현대적인 C++ TUI |
| Go | Bubble Tea | Elm 스타일의 상태 기반 구조 |
| Rust | Ratatui | 빠르고 가벼운 immediate-mode 스타일 |
| Python | Textual | 고수준 애플리케이션 프레임워크 |
| TypeScript | OpenTUI, Ink | 웹 프론트엔드와 유사한 개발 경험 |

## Go — Bubble Tea

Go에서는 **Bubble Tea**가 대표적인 TUI 프레임워크다.

Bubble Tea는 Elm Architecture의 영향을 받아 대략 다음 구조로 프로그램을 만든다.

```text
Model
  ↓
Update(message)
  ↓
View()
  ↓
Terminal
```

입력이 들어오면 메시지가 발생하고, `Update`가 상태를 변경한 뒤 `View`가 현재 상태를 화면으로 표현한다.

Go의 단일 바이너리 배포와 잘 맞고, CLI/TUI 개발자 도구를 만들기에 좋은 조합이다.

`lazygit` 같은 Go 기반 TUI 도구가 널리 알려지면서 Go는 현대 TUI 생태계에서 매우 강한 언어가 됐다.

## Rust — Ratatui

Rust에서는 **Ratatui**가 대표적이다.

Ratatui는 현재 상태를 기반으로 매 프레임 UI를 그리는 방식에 가깝다.

```text
Application state
       ↓
Terminal.draw()
       ↓
Frame
       ↓
Layout + Widget
```

Rust 특유의 성능과 메모리 효율을 살릴 수 있어서 파일 탐색기, 모니터링 도구, 대규모 데이터 표시처럼 빠른 렌더링이 필요한 프로그램과 잘 맞는다.

`yazi` 같은 빠른 터미널 파일 관리 도구가 Rust로 작성된 것도 이런 흐름과 잘 맞는다.

## Python — Textual

Python에서는 **Textual**이 현대적인 TUI 프레임워크로 자리 잡았다.

Textual은 단순한 터미널 출력 라이브러리라기보다 애플리케이션 프레임워크에 가깝다. 위젯, 이벤트, 레이아웃, CSS와 유사한 스타일 시스템 등을 제공한다.

Python 생태계를 그대로 활용할 수 있기 때문에 데이터 도구나 관리용 애플리케이션을 빠르게 만들 때 특히 편리하다.

SQL TUI인 Harlequin 역시 Python/Textual 계열의 대표적인 사례다.

## TypeScript — OpenTUI

최근 가장 흥미로운 흐름 중 하나가 **TypeScript 기반 TUI**다.

OpenTUI는 네이티브 터미널 렌더링 코어를 Zig로 구현하고 그 위에 TypeScript API를 제공한다. 공식적으로 Core API뿐 아니라 React와 Solid 바인딩도 제공한다.

구조를 단순화하면 다음과 같다.

```text
TypeScript / React / Solid
          ↓
       OpenTUI
          ↓
   Zig native renderer
          ↓
       Terminal
```

OpenTUI는 컴포넌트 트리를 렌더링하고 Flexbox 기반 레이아웃을 계산하며, 변경된 터미널 셀만 갱신한다. OpenCode도 실제 프로덕션 UI에 OpenTUI를 사용한다.

React 바인딩을 쓰면 웹 프론트엔드와 매우 비슷한 방식으로 TUI를 구성할 수 있다.

```tsx
function App() {
  return (
    <box flexDirection="column">
      <text>Database</text>
      <box flexDirection="row">
        <Sidebar />
        <Main />
      </box>
    </box>
  )
}
```

예전에는 TUI를 만든다고 하면 터미널 제어, 커서 좌표, 화면 갱신부터 생각해야 했다. 이제는 React처럼 **컴포넌트와 상태를 먼저 생각하고 터미널을 렌더링 타깃으로 사용할 수 있게 된 것**이다.

## 실제 도구들은 무엇으로 만들었나

현대적인 TUI 도구들은 특정 언어 하나에 몰려 있지 않다.

| 프로그램 | 주요 언어 | 성격 |
| --- | --- | --- |
| lazygit | Go | Git TUI |
| btop | C++ | 시스템 모니터 |
| yazi | Rust | 파일 관리자 |
| k9s | Go | Kubernetes 관리 TUI |
| Harlequin | Python | SQL IDE/TUI |
| OpenCode | TypeScript + OpenTUI | AI 코딩 도구 |

여기서 중요한 것은 "TUI에는 어떤 언어를 써야 한다"가 아니라 **각 언어마다 성숙한 TUI 생태계가 생겼다는 점**이다.

## 과거와 현재의 가장 큰 차이

TUI의 변화는 다음처럼 정리할 수 있다.

```text
과거

C
 ↓
ncurses
 ↓
좌표 / 문자 / 터미널 제어


현재

Application state
      ↓
Component / Widget
      ↓
Layout
      ↓
Renderer
      ↓
Terminal
```

GUI 프레임워크에서 발전한 **컴포넌트, 선언적 UI, 상태 관리, 이벤트 루프, Flexbox 같은 개념이 TUI로 들어왔다.**

그래서 현대 TUI는 단순히 "CLI에 박스를 그린 것"이라기보다, 터미널을 렌더링 백엔드로 사용하는 하나의 UI 애플리케이션이라고 보는 편이 더 정확하다.

## 어떤 프레임워크를 고르면 좋을까

새로운 TUI 프로그램을 만든다면 언어와 배포 방식에 따라 대략 이렇게 시작할 수 있다.

```text
Go         → Bubble Tea
Rust       → Ratatui
Python     → Textual
TypeScript → OpenTUI
C++        → FTXUI
```

단일 바이너리와 단순한 배포가 중요하면 Go나 Rust가 매력적이고, 빠른 개발과 Python 생태계가 중요하면 Textual이 좋다.

웹 프론트엔드 경험이 있고 TypeScript/React 방식으로 터미널 UI를 만들고 싶다면 OpenTUI는 특히 흥미로운 선택이다.

## 정리

- TUI는 새로운 기술이 아니라 **수십 년의 역사를 가진 사용자 인터페이스 방식**이다.
- 초기 TUI 생태계에서는 curses/ncurses가 터미널 차이를 추상화하는 핵심 역할을 했다.
- GUI와 웹 시대에도 서버와 Unix 개발 도구 영역에서 계속 사용됐다.
- 최근에는 `lazygit`, `k9s`, `btop`, `yazi` 같은 개발자 도구를 중심으로 Modern TUI가 다시 크게 성장했다.
- 현재는 Go의 Bubble Tea, Rust의 Ratatui, Python의 Textual, TypeScript의 OpenTUI처럼 **언어별 대표 프레임워크가 존재한다.**
- 특히 OpenTUI는 React/Solid와 컴포넌트 기반 UI 개념을 터미널로 가져오면서 TUI 개발 방식이 얼마나 현대화됐는지를 잘 보여준다.

TUI는 오래된 기술이 다시 유행하는 것이 아니라, **오래된 인터페이스가 현대적인 UI 설계 방식과 만나 새로운 개발 플랫폼으로 진화하고 있는 것**에 가깝다.

## 참고

- [OpenTUI 공식 문서](https://opentui.com/docs/)
- [OpenTUI React bindings](https://opentui.com/docs/bindings/react/)
- [Ratatui 공식 사이트](https://ratatui.rs/)
- [Bubble Tea GitHub](https://github.com/charmbracelet/bubbletea)
- [Textual 공식 문서](https://textual.textualize.io/)
- [ncurses](https://invisible-island.net/ncurses/)
