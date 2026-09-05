---
title       : "TUI Engine의 공통 구조 — Event Loop, State, Layout, Renderer"
description : "curses 이후 현대 TUI 프레임워크를 관통하는 input event → state update → layout → cell buffer → diff render 구조를 Ratatui와 OpenTUI 사례로 정리한다."
date        : 2026-09-05 14:30:00 +0900
updated     : 2026-09-05 14:30:00 +0900
categories  : [terminal]
tags        : [terminal, tui, event-loop, renderer, state, layout, buffer, diff]
pin         : false
hidden      : false
---

curses까지 오면 터미널의 좌표와 제어 문자열을 직접 다루는 부담은 크게 줄어든다.

하지만 실제 interactive TUI 애플리케이션을 만들려면 여전히 한 단계 더 높은 구조가 필요하다.

사용자가 키를 누르고, 상태가 바뀌고, 레이아웃을 계산하고, 화면을 다시 그리는 전체 흐름이다.

프레임워크마다 API 이름은 다르지만 현대 TUI 엔진의 공통 구조를 단순화하면 다음과 같다.

```text
Input
  ↓
Event
  ↓
Event Loop
  ↓
State Update
  ↓
Layout
  ↓
Render to Cell Buffer
  ↓
Diff
  ↓
Terminal Output
```

이 구조를 이해하면 Bubble Tea, Ratatui, Textual, OpenTUI가 서로 완전히 다른 세계가 아니라 **같은 문제에 서로 다른 추상화를 씌운 것**이라는 게 보인다.

## 1. Input — 시작은 결국 byte stream이다

아래쪽은 앞에서 본 그대로다.

```text
Keyboard
  ↓
Terminal Emulator
  ↓
PTY
  ↓
raw/noncanonical input
  ↓
Application
```

방향키나 function key는 여러 byte의 escape sequence일 수 있다.

그래서 첫 단계는 raw byte stream을 논리적인 input event로 해석하는 것이다.

```text
ESC [ A
  ↓ parser
KeyUp
```

마우스를 지원하는 TUI라면 mouse sequence도 같은 식으로 해석한다.

resize는 보통 terminal size 변경이나 `SIGWINCH` 같은 별도 이벤트로 들어온다.

즉 event loop가 받는 것은 단순 키 하나만이 아니다.

```text
Key Event
Mouse Event
Resize Event
Timer
Network Result
Background Task Completion
```

현대 TUI가 복잡해질수록 일반 GUI 앱의 event loop와 매우 비슷해진다.

## 2. Event Loop — 입력과 상태 변경을 직렬화한다

가장 단순한 TUI loop는 이런 모양이다.

```text
while running:
    event = read_event()
    update_state(event)
    render()
```

조금 더 현실적으로는:

```text
┌───────────────┐
│   Event Loop  │◀──────────────┐
└───────┬───────┘               │
        ↓                       │
     Event                      │
        ↓                       │
  State Update                  │
        ↓                       │
    Render                      │
        └───────────────────────┘
```

이 loop가 애플리케이션의 시간 흐름을 만든다.

사용자가 `j`를 누르면:

```text
Key(j)
  ↓
selected_index += 1
  ↓
새 state
  ↓
다음 frame
```

이런 식으로 진행된다.

## 3. State — 화면 자체보다 먼저 데이터가 있다

좋은 TUI 구조에서는 화면 좌표를 여기저기 직접 고치기보다 **애플리케이션 상태를 먼저 바꾸고 화면은 그 상태의 결과로 만든다.**

예를 들어 파일 목록 UI라면:

```text
state
├─ files
├─ selected_index
├─ current_directory
├─ search_query
└─ preview_visible
```

`j`가 들어오면 화면의 `>` 문자를 직접 아래로 옮기는 것이 아니라:

```text
selected_index: 4 → 5
```

로 상태를 바꾸고 다음 render에서 다시 표현한다.

이 사고방식이 현대 선언형 UI와 연결된다.

```text
UI = f(state)
```

## 4. Layout — state를 terminal 좌표로 변환한다

상태만으로는 아직 터미널 셀 위치가 정해지지 않는다.

터미널 크기가 120x40이라면 화면을 어떻게 나눌지 계산해야 한다.

```text
120 x 40
┌──────────────┬─────────────────────────┐
│ Sidebar 30   │ Main 90                 │
│              │                         │
└──────────────┴─────────────────────────┘
```

전통적인 TUI에서는 좌표를 직접 계산할 수 있다.

```text
sidebar_width = 30
main_x = 30
main_width = terminal_width - 30
```

현대 framework는 이 부분도 추상화한다.

- percentage
- constraint
- flex layout
- min/max size
- padding
- alignment

같은 개념이 등장한다.

OpenTUI처럼 Flexbox/Yoga 계열 layout을 사용하는 프레임워크도 있다.

웹 UI의 layout 모델이 터미널 셀 공간으로 내려온 셈이다.

## 5. Cell Buffer — 픽셀이 아니라 터미널 셀을 그린다

TUI renderer의 대표적인 내부 모델은 **2차원 cell buffer**다.

```text
┌───┬───┬───┬───┐
│ H │ e │ l │ l │ ...
├───┼───┼───┼───┤
│   │ > │ a │ . │ ...
└───┴───┴───┴───┘
```

각 cell에는 보통 다음 같은 정보가 들어간다.

```text
character / grapheme
foreground color
background color
attributes (bold, underline, ...)
```

Ratatui도 frame 안의 widget들을 buffer에 렌더하고, OpenTUI도 renderer-owned cell buffer를 사용한다.

OpenTUI의 `OptimizedBuffer`는 문자와 전경/배경 색, 속성 등을 terminal cell 단위로 관리한다.

즉 현대 TUI renderer가 그리는 표면은 대체로:

> 픽셀 framebuffer가 아니라 terminal cell framebuffer

라고 이해하면 좋다.

## 6. Immediate-mode와 retained/component 방식

여기서 프레임워크별 철학 차이가 나타난다.

### Ratatui 스타일

Ratatui는 대표적으로 **현재 state를 기준으로 frame 전체를 다시 기술하는 immediate-mode 스타일**에 가깝다.

```text
terminal.draw(frame => {
    render sidebar
    render main
    render statusbar
})
```

매 draw마다 "지금 화면은 이렇게 생겨야 한다"를 다시 buffer에 기록한다.

그렇다고 실제 terminal에 모든 셀을 다시 출력하는 것은 아니다.

buffer diff가 뒤에서 최적화한다.

### Component / retained 스타일

Textual이나 OpenTUI의 고수준 API에서는 UI tree/component가 더 오래 살아 있는 객체처럼 느껴진다.

```text
Root
├─ Sidebar
├─ Main
│  ├─ List
│  └─ Preview
└─ StatusBar
```

state 변화가 component/layout/render scheduling과 연결된다.

React binding을 쓰는 OpenTUI라면 웹 프론트엔드와 더 비슷한 형태까지 올라간다.

하지만 내부 끝에는 결국 cell buffer와 terminal output이 있다.

## 7. Diff Rendering — 매 frame 전체를 출력하지 않는다

가장 중요한 최적화다.

이전 frame:

```text
> file-a
  file-b
```

새 frame:

```text
  file-a
> file-b
```

화면 전체를 지우고 다시 출력할 수도 있다.

하지만 renderer가 두 buffer를 비교하면 바뀐 셀만 찾을 수 있다.

```text
previous buffer
       ↕ compare
next buffer
       ↓
changed cells
       ↓
cursor move + 최소 문자열 출력
```

Ratatui는 double buffer를 두고 현재 buffer와 이전 buffer의 diff를 계산해 terminal에 필요한 변경만 쓴다.

OpenTUI도 `currentRenderBuffer`와 `nextRenderBuffer`를 비교해 변경된 cell을 native renderer가 출력한다.

수십 년 전 curses의 virtual/physical screen 개념과 현대 framework의 double buffer/diff renderer가 같은 문제를 계속 풀고 있다는 점이 재미있다.

## 8. Double Buffer — 다음 화면을 따로 만든다

왜 buffer가 두 개 필요한지 생각해보자.

화면을 그리는 중간 상태를 실제 terminal에 바로 보여주면:

```text
Sidebar 그림
→ 사용자에게 보임
Main 그림
→ 다시 보임
Statusbar 그림
→ 다시 보임
```

같은 부분 렌더링이 보일 수 있다.

대신 다음 frame을 off-screen buffer에 완성한다.

```text
Current Buffer   Next Buffer
현재 화면         다음 화면 작성 중
                    ↓
                 완성
                    ↓ diff
Terminal ← 변경분만 출력
```

이 방식은 화면 갱신을 하나의 frame처럼 다루게 해준다.

## 9. Rendering Schedule — 언제 다시 그릴 것인가

모든 TUI가 게임처럼 초당 60번 render할 필요는 없다.

UI에 변화가 있을 때만 render할 수도 있다.

```text
Key event
  ↓ state changed
render requested
```

반대로 CPU/네트워크 모니터링 앱은 주기적으로 frame을 갱신할 필요가 있다.

```text
Timer tick
  ↓
metric update
  ↓
render
```

그래서 modern renderer는 보통 다음 전략 중 하나 또는 조합을 가진다.

```text
event-driven rendering
fixed FPS / tick rendering
demand rendering
```

OpenTUI의 renderer도 frame scheduling을 관리하고 target FPS나 demand 계열 동작을 제공한다.

## 10. Event Loop에는 비동기 작업도 들어온다

TUI 앱이 파일만 보여주는 수준을 넘어가면 I/O가 많아진다.

예를 들어 lazygit 같은 앱이라면:

```text
키 입력
Git process 결과
파일 변경
Timer
Resize
```

가 동시에 발생할 수 있다.

AI 코딩 도구라면:

```text
키 입력
HTTP streaming token
background process output
LSP/event
```

까지 들어온다.

그래서 현대 TUI framework가 단순 "터미널 그림 라이브러리"가 아니라 **application runtime**처럼 발전하는 이유가 있다.

## 11. Bubble Tea의 Model / Update / View가 보이기 시작한다

이 공통 구조를 알고 Bubble Tea를 보면 이해가 쉽다.

```text
Model = State
Message = Event
Update = State transition
View = State → UI representation
```

즉 Elm architecture를 터미널 애플리케이션에 적용한 것이다.

```text
Msg
 ↓
Update(Model, Msg)
 ↓
New Model
 ↓
View(Model)
```

우리가 지금까지 만든 일반식과 거의 같다.

## 12. Ratatui도 같은 문제를 다른 방식으로 푼다

Ratatui에서는 애플리케이션이 state와 event loop를 직접 구성하는 느낌이 더 강하다.

```text
poll event
  ↓
update app state
  ↓
terminal.draw(|frame| render(app, frame))
```

Widget들은 frame의 buffer를 채우고, 마지막 flush에서 이전 buffer와 diff를 계산한다.

즉:

```text
State ownership은 앱 쪽
Rendering abstraction은 Ratatui 쪽
```

으로 나뉘는 편이다.

## 13. OpenTUI는 훨씬 위까지 가져간다

OpenTUI는 renderer뿐 아니라:

```text
input parsing
layout
component/renderable tree
frame scheduling
buffer
native rendering
```

까지 넓은 범위를 가진다.

고수준에서는 React/Solid binding도 제공하므로 애플리케이션 개발자는 terminal coordinate보다 component와 state를 먼저 생각할 수 있다.

하지만 내부를 내려가면 역시:

```text
component tree
   ↓ layout
renderables
   ↓
next cell buffer
   ↓ diff
current cell buffer
   ↓
terminal output
```

이라는 구조가 보인다.

## 고전과 현대를 연결하면

지금까지의 역사는 단절된 것이 아니다.

```text
Escape Sequence
       ↓
termcap / terminfo
       ↓
curses virtual screen
       ↓
application-specific event loop
       ↓
modern TUI framework
       ↓
component / declarative TUI
```

각 시대마다 개발자가 직접 담당하던 부분이 framework 안으로 이동했다.

그래서 TUI 추상화의 역사는 다음 질문의 변화로 볼 수 있다.

```text
"커서를 어떻게 움직이지?"
        ↓
"화면을 어떻게 갱신하지?"
        ↓
"state를 어떻게 관리하지?"
        ↓
"component를 어떻게 구성하지?"
```

## 다음 단계 — 프레임워크들을 같은 축에서 비교하기

이제 Bubble Tea, Ratatui, Textual, OpenTUI를 단순 기능표로 비교할 필요가 없다.

다음 질문으로 비교하면 된다.

```text
Event loop를 누가 소유하는가?
State 모델을 framework가 얼마나 강제하는가?
Layout은 어디까지 제공하는가?
Renderer와 buffer는 누가 관리하는가?
Component abstraction이 있는가?
비동기 작업을 어떻게 통합하는가?
```

이 기준으로 보면 각 framework의 철학 차이가 훨씬 선명해진다.

## 참고

- Ratatui — rendering under the hood, double buffer와 diff 기반 flush
- OpenTUI — Renderer / Buffer API, current/next render buffer 구조
