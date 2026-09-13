---
title       : "TUI 엔진의 공통 구조 — 이벤트 루프에서 렌더링까지"
description : "터미널 제어 추상화 이후, 현대 TUI가 Event → State → UI Structure → Layout → Render → Diff 구조로 애플리케이션 전체를 조직하는 방식을 정리한다."
date        : 2026-09-05 14:30:00 +0900
updated     : 2026-09-13 22:00:00 +0900
categories  : [terminal]
tags        : [terminal, tui, event-loop, renderer, state, layout, buffer, diff, component]
pin         : false
hidden      : false
---

앞 단계까지는 주로 **터미널 자체를 어떻게 다룰 것인가**를 봤다.

```text
TTY / PTY
= 프로세스와 터미널을 어떻게 연결할까?

termios
= 입력을 어떤 규칙으로 전달할까?

ANSI / VT
= 화면을 어떤 제어 시퀀스로 움직일까?

TERM / terminfo
= 터미널 인터페이스 차이를 어떻게 흡수할까?

curses
= 화면·입력 처리를 어떻게 공통 API로 올릴까?
```

여기까지가 주로 **터미널 UI를 다루는 저수준 책임을 줄이는 층**이었다면, 이 문서부터는 질문이 한 단계 올라간다.

> **터미널을 하나의 UI 플랫폼처럼 사용해서, 대화형 애플리케이션 전체를 어떻게 구조화할까?**

다만 먼저 경계를 두 가지 잡아야 한다.

첫째,

> **이벤트 루프 자체가 현대 TUI에서 처음 생긴 것은 아니다.**

curses를 사용한 고전 TUI도 애플리케이션이 직접 다음 같은 반복 구조를 만들 수 있었다.

```text
while running:
    input = getch()
    update_state(input)
    redraw()
    refresh()
```

이것도 이미 이벤트 루프다.

차이는 **누가 그 구조를 얼마나 책임지는가**에 있다.

```text
curses 계열
= 화면·입력 API 제공
= 이벤트 루프와 상태 구조는 앱이 직접 구성하는 경우가 많음

현대 TUI 프레임워크
= Event / State / Component / Layout / Render 같은
  애플리케이션 구조 자체를 더 강하게 모델링하거나 제공
```

둘째,

> **현대 TUI 프레임워크가 curses 위에 올라가는 계층이라고 생각하면 안 된다.**

`ncurses`는 curses API를 직접 구현한 대표적인 라이브러리다. 반면 Bubble Tea, Ratatui, Textual, OpenTUI 같은 현대 TUI 프레임워크는 일반적으로 curses API의 구현체가 아니며, 내부적으로도 curses를 반드시 거쳐야 하는 것은 아니다.

```text
고전 curses 계열
app
→ curses API
→ ncurses 같은 구현체
→ terminfo / termios / ANSI·VT 계열 제어
→ terminal emulator

현대 TUI 계열
app
→ TUI framework
→ 자체 event / state / component / layout / renderer / terminal backend
→ termios / ANSI·VT 계열 제어
→ terminal emulator
```

즉 **구현 계층은 별도일 수 있지만, 해결하려는 문제와 일부 설계 아이디어는 이어진다.**

특히 curses의 `refresh()`가 원하는 화면 상태와 현재 화면 상태의 차이를 실제 터미널에 반영한다는 점은 현대 TUI의 렌더링 구조와도 연결된다.

## 전체 그림 — 네 층으로 본다

이 문서의 구조는 세부 API보다 다음 네 층으로 잡는 편이 쉽다.

```text
1. 애플리케이션 실행 구조
   Event Source → Event Loop → State Update

2. UI 구조
   Immediate-style 또는 Component Tree

3. 화면 계산
   Layout → Render Representation

4. 실제 출력
   Diff → Terminal Output
```

전체 흐름으로 연결하면:

```text
Event Source
   ↓
Event Loop
   ↓
State Update
   ↓
UI Structure
   ↓
Layout
   ↓
Render Representation
   ↓
Diff
   ↓
Terminal Output
```

이 구조를 이해하면 Bubble Tea, Ratatui, Textual, OpenTUI가 서로 완전히 다른 세계가 아니라 **같은 TUI 애플리케이션 문제에서 서로 다른 범위를 대신해주는 프레임워크**라는 점이 보인다.

---

# Part 1. 애플리케이션 실행 구조

## 1. Event Source — 변화의 시작은 키보드만이 아니다

가장 아래의 키 입력 경로는 앞에서 본 그대로다.

```text
키보드
  ↓
터미널 에뮬레이터
  ↓
PTY
  ↓
raw / noncanonical 입력
  ↓
애플리케이션
```

방향키나 Function Key는 여러 바이트의 Escape Sequence일 수 있다. 애플리케이션이나 하위 라이브러리는 이 바이트 스트림을 논리적인 입력 이벤트로 해석한다.

```text
ESC [ A
  ↓ 입력 파서
KeyUp
```

하지만 현대 TUI의 Event Source는 키보드에 한정되지 않는다.

```text
키 이벤트
마우스 이벤트
터미널 크기 변경
타이머
네트워크 결과
프로세스 출력
백그라운드 작업 완료
```

즉 첫 번째 질문은:

> **애플리케이션의 다음 상태 변화를 일으킬 사건이 무엇인가?**

다.

## 2. Event Loop — Event를 받아 다음 처리를 반복한다

가장 단순한 구조는 이런 모양이다.

```text
while running:
    event = read_event()
    update_state(event)
    render()
```

Event Loop는 한 번 실행하고 끝나는 함수가 아니라:

```text
Event 받기
→ State 변경
→ 필요하면 Render
→ 다시 다음 Event 대기
```

를 반복하는 실행 구조다.

중요한 점은 이 구조 자체는 curses 시대에도 만들 수 있었다는 것이다.

현대 프레임워크에서는 여기에 메시지 큐, 비동기 작업, 렌더 스케줄링, 컴포넌트 이벤트 전달 같은 기능까지 결합하면서 **애플리케이션 실행 기반**으로 발전한다.

## 3. State — 화면을 직접 고치기보다 데이터를 바꾼다

좋은 TUI 구조에서는 화면 좌표를 여기저기 직접 수정하기보다 **애플리케이션 상태(State)를 먼저 바꾸고 화면은 그 상태의 결과로 만든다.**

예를 들어 파일 목록 UI라면:

```text
State
├─ files
├─ selected_index
├─ current_directory
├─ search_query
└─ preview_visible
```

`j`가 들어오면 화면의 `>` 문자를 직접 아래로 옮기는 대신:

```text
selected_index: 4 → 5
```

처럼 상태를 바꾸고 다음 렌더링에서 화면을 다시 만든다.

```text
UI = f(State)
```

여기까지가 애플리케이션 실행 구조다.

```text
Event
→ State Update
```

다음부터는 **그 State를 어떤 UI 구조로 표현할 것인가**가 문제다.

---

# Part 2. UI 구조 — 화면을 어떤 방식으로 기술할까

## 4. Immediate-style — 현재 화면을 다시 기술한다

어떤 TUI 라이브러리는 매 Frame 현재 State를 기준으로 화면을 다시 기술하는 방식에 가깝다.

```text
State
  ↓
현재 Frame을 다시 기술
  ↓
Layout / Widget
  ↓
Render Representation
```

Ratatui를 단순화하면 이런 감각이다.

```text
terminal.draw(frame => {
    render sidebar
    render main
    render statusbar
})
```

매번 **"현재 화면은 이렇게 보여야 한다"**를 다시 기술한다.

그렇다고 실제 터미널 전체를 매번 다시 출력한다는 뜻은 아니다. 뒤의 Diff 단계에서 실제 출력량은 줄일 수 있다.

## 5. Component Tree — UI 구조를 트리로 유지한다

다른 프레임워크는 UI를 컴포넌트 트리로 오래 유지한다.

```text
Root
├─ Sidebar
├─ Main
│  ├─ List
│  └─ Preview
└─ StatusBar
```

이 구조에서는 각 Component가 역할을 나눠 가진다.

```text
Component
├─ 자신의 State 또는 Props
├─ 자식 Component
├─ Layout 참여
└─ Rendering 참여
```

이 사고방식은 React의 Component Tree와 상당히 비슷하다.

```text
React
Component Tree
→ DOM / Native UI

TUI Framework
Component Tree
→ Layout
→ Terminal Render Representation
→ Terminal
```

다만 **모든 현대 TUI가 React 방식이라는 뜻은 아니다.**

핵심은 UI를 구성하는 두 대표적인 사고방식이 있다는 것이다.

```text
Immediate-style
= 현재 State를 기준으로 매번 화면을 다시 기술

Retained / Component-style
= UI 구조를 Tree / Component로 유지
```

이 구분을 먼저 잡으면 뒤의 Layout과 Render가 훨씬 자연스럽다.

---

# Part 3. 화면 계산

## 6. Layout — UI 구조를 터미널 좌표로 배치한다

State와 UI 구조만으로는 아직 어느 터미널 셀에 무엇을 보여줄지 정해지지 않는다.

```text
120 x 40
┌──────────────┬─────────────────────────┐
│ 사이드바 30   │ 메인 90                 │
│              │                         │
└──────────────┴─────────────────────────┘
```

Layout 단계에서는:

```text
어떤 Component / Widget을
어느 위치에
어떤 크기로
배치할 것인가?
```

를 계산한다.

현대 프레임워크는 비율, Constraint, Flex Layout, 최소·최대 크기, Padding, Alignment 같은 방식으로 이 부분을 추상화한다.

## 7. Render — 다음 화면 상태를 만든다

Layout이 정해지면 다음에 보여줄 화면을 계산한다.

```text
State
  ↓
UI Structure
  ↓
Layout
  ↓
Render
  ↓
다음 화면 상태
```

이때 내부 표현은 프레임워크마다 다를 수 있다.

TUI Renderer에서 자주 쓰이는 대표적인 표현이 **2차원 Cell Buffer**다.

```text
┌───┬───┬───┬───┐
│ H │ e │ l │ l │ ...
├───┼───┼───┼───┤
│   │ > │ a │ . │ ...
└───┴───┴───┴───┘
```

각 셀에는 문자 또는 Grapheme, 전경색, 배경색, Bold·Underline 같은 속성이 들어갈 수 있다.

하지만:

> **모든 현대 TUI 프레임워크가 반드시 같은 형태의 Cell Buffer를 직접 노출하거나 내부적으로 똑같이 구현하는 것은 아니다.**

여기서는 **다음 터미널 화면 상태를 표현하는 대표적인 내부 모델**로 이해하면 충분하다.

---

# Part 4. 실제 출력

## 8. Diff — 실제 터미널에는 변경분만 보낸다

다음 화면 상태가 만들어졌다고 해서 화면 전체를 무조건 다시 출력할 필요는 없다.

```text
이전 화면 상태
   ↕ 비교
다음 화면 상태
   ↓
변경된 부분
   ↓
커서 이동 + 필요한 문자열 출력
```

여기서 curses와의 연결도 보인다.

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

완전히 같은 구현이라는 뜻은 아니지만, **원하는 화면 상태를 만든 뒤 실제 출력은 필요한 변경만 반영한다**는 문제의식은 이어진다.

## 9. 현재 화면과 다음 화면을 따로 유지할 수 있다

다음 Frame을 별도의 화면 상태에 완성한 뒤 현재 화면 상태와 비교할 수 있다.

```text
현재 화면 상태      다음 화면 상태
현재 표시 기준       다음 화면 작성 중
                       ↓
                     완성
                       ↓ 차이 계산
터미널 ← 변경분만 출력
```

이를 이중 버퍼와 비슷하게 설명할 수 있지만, 여기서는 그래픽 시스템의 모든 Double Buffering 의미와 동일시하기보다:

> **현재 상태와 다음 상태를 분리해 Frame 단위로 갱신한다.**

정도로 이해하면 충분하다.

## 10. 언제 다시 그릴 것인가 — Render Scheduling

모든 TUI가 게임처럼 계속 같은 속도로 Render할 필요는 없다.

```text
키 이벤트
  ↓
State 변경
  ↓
Render 요청
```

또는:

```text
타이머 Tick
  ↓
지표 갱신
  ↓
Render
```

즉 Event 기반, 주기적 Tick, 요청 기반 Rendering을 사용할 수 있다.

핵심 질문은:

> **State가 바뀐 뒤 언제 다음 화면을 계산하고 터미널에 반영할 것인가?**

다.

---

# Part 5. 현대 TUI Framework에 대입해보기

## 11. Event Source가 많아지면 Application Runtime처럼 보인다

TUI 앱이 복잡해지면 동시에 처리해야 할 Event Source가 늘어난다.

```text
키 입력
프로세스 결과
파일 변경
타이머
터미널 크기 변경
네트워크 결과
백그라운드 작업 완료
```

그래서 현대 TUI Framework는 단순히 "터미널에 그림을 그리는 라이브러리"에 머물지 않고, Event 처리와 State 흐름까지 관리하는 **애플리케이션 실행 기반**처럼 발전하기도 한다.

## 12. 프레임워크를 공통 구조에 대입해보기

### Bubble Tea

```text
Model   = State
Msg     = Event
Update  = State Transition
View    = State를 UI 표현으로 바꿈
```

상태와 메시지 흐름을 강하게 구조화한다.

### Ratatui

```text
Event Loop / State
→ 애플리케이션이 비교적 직접 구성

Layout / Widget / Buffer / Diff
→ Ratatui가 강하게 지원
```

현재 State에서 화면을 다시 기술하는 Immediate-style에 가까운 감각으로 이해하기 쉽다.

### Textual / OpenTUI 계열

```text
Event
State
Component Tree
Layout
Rendering
```

까지 더 넓은 범위를 Framework가 관리하는 방향으로 올라간다.

특히 Component Tree를 유지하는 방식은 React 같은 GUI/Web UI 프레임워크와도 사고방식이 닮아 있다.

각 Framework의 구체적인 철학과 차이는 [현대 TUI 프레임워크 비교](./2026-09-05-modern-tui-frameworks-abstraction.md)에서 따로 본다.

---

# 고전과 현대를 연결하면

지금까지의 흐름은 단절된 기술 목록이 아니다.

```text
Escape Sequence
       ↓
termcap / terminfo
       ↓
curses 화면·입력 API
       ↓
앱이 직접 구성한 Event Loop / State
       ↓
현대 TUI Framework
       ↓
Component / 선언형 TUI
```

하지만 이 그림은 **구현 계층도**가 아니다.

현대 TUI Framework가 curses를 내부적으로 반드시 호출한다는 뜻이 아니라, 개발자가 직접 책임하던 범위가 역사적으로 어떻게 더 높은 추상화로 이동했는지를 나타낸 것이다.

질문의 변화로 보면 더 간단하다.

```text
"커서를 어떻게 움직이지?"
        ↓
"화면을 어떻게 갱신하지?"
        ↓
"이벤트와 State를 어떻게 조직하지?"
        ↓
"UI 구조를 어떻게 표현하지?"
        ↓
"Layout과 Render를 누가 책임지지?"
```

즉 이 지점부터는 본격적으로 **터미널을 단순 입출력 장치가 아니라 UI 애플리케이션의 화면으로 사용하는 단계**라고 볼 수 있다.

## 기억할 전체 흐름

```text
Event Source
   ↓
Event Loop
   ↓
State Update
   ↓
UI Structure
   ├─ Immediate-style
   └─ Component Tree
   ↓
Layout
   ↓
Render Representation
   ↓
Diff
   ↓
Terminal Output
```

이 구조를 기준으로 보면 Framework 이름이 달라져도 어느 층을 대신해주는지 다시 찾아갈 수 있다.
