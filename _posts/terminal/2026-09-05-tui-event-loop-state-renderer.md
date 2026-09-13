---
title       : "TUI 엔진의 공통 구조 — 이벤트 루프에서 렌더링까지"
description : "터미널 제어 추상화 이후, 현대 TUI가 Event → State → Layout → Render → Diff 구조로 애플리케이션 전체를 조직하는 방식을 정리한다."
date        : 2026-09-05 14:30:00 +0900
updated     : 2026-09-13 21:00:00 +0900
categories  : [terminal]
tags        : [terminal, tui, event-loop, renderer, state, layout, buffer, diff]
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

여기까지가 주로 **터미널 제어를 더 쉽게 만드는 층**이었다면, 이 문서부터는 질문이 한 단계 올라간다.

> **터미널을 하나의 UI 플랫폼처럼 사용해서, 대화형 애플리케이션 전체를 어떻게 구조화할까?**

즉 이제 중심 관심사는 "어떤 제어 시퀀스를 보낼까?"가 아니라 다음 흐름이다.

```text
무슨 일이 발생했는가?
→ 앱 상태를 어떻게 바꿀까?
→ 화면을 어떻게 배치할까?
→ 다음 화면을 어떻게 만들까?
→ 실제 터미널에는 무엇만 보낼까?
```

curses와 완전히 단절되는 것은 아니다. curses의 `refresh()`도 내부 화면 상태와 현재 표시 상태를 비교해 필요한 변경만 출력한다는 점에서 현대 TUI 렌더링과 이어지는 아이디어가 있다.

다만 현대 TUI에서는 여기서 더 나아가 **Event Loop, Application State, Layout, Rendering 같은 애플리케이션 구조 자체**를 중심으로 설계한다.

프레임워크마다 API 이름은 달라도 먼저 다음 질문으로 보면 공통 구조가 잡힌다.

```text
1. 무엇이 앱의 변화를 시작시키는가?
   → 키, 마우스, 크기 변경, 타이머, I/O 결과 같은 Event Source

2. Event가 들어오면 무엇을 바꾸는가?
   → Application State

3. State를 화면의 어디에 놓을 것인가?
   → Layout

4. 다음 화면을 어떤 내부 표현으로 만들 것인가?
   → Render Representation
     대표적인 예: Terminal Cell Buffer

5. 실제 터미널에는 무엇을 출력할 것인가?
   → 이전 화면과 비교한 변경분
```

이 질문을 실행 흐름으로 놓으면 다음과 같다.

```text
Event Source
  ↓
Event
  ↓
Event Loop
  ↓
State Update
  ↓
Layout
  ↓
Render Representation
  ↓
Diff / Output
  ↓
터미널 에뮬레이터
```

이 구조를 이해하면 Bubble Tea, Ratatui, Textual, OpenTUI가 서로 완전히 다른 세계가 아니라 **같은 TUI 애플리케이션 문제에서 서로 다른 범위를 대신해주는 프레임워크**라는 점이 보인다.

## 1. Event Source — 변화의 시작은 키보드만이 아니다

가장 아래의 키 입력 경로는 앞에서 본 그대로다.

```text
키보드
  ↓
터미널 에뮬레이터
  ↓
PTY
  ↓
raw/noncanonical 입력
  ↓
애플리케이션
```

방향키나 Function Key는 여러 바이트의 Escape Sequence일 수 있다. 따라서 애플리케이션이나 하위 라이브러리는 원시 바이트 스트림을 논리적인 입력 이벤트(Input Event)로 해석한다.

```text
ESC [ A
  ↓ 입력 파서(Parser)
위쪽 키(KeyUp)
```

마우스를 지원하는 TUI라면 Mouse Sequence도 같은 식으로 해석한다. 터미널 크기 변경은 `SIGWINCH` 같은 별도 이벤트로 들어올 수 있다.

그리고 현대 TUI의 Event Source는 키보드에 한정되지 않는다.

```text
키 이벤트
마우스 이벤트
크기 변경 이벤트
타이머
네트워크 결과
백그라운드 작업 완료
```

즉 첫 번째 질문은 단순히 "무슨 키가 눌렸는가?"가 아니라:

> **애플리케이션의 다음 상태 변화를 일으킬 사건이 무엇인가?**

다.

## 2. 이벤트 루프 — Event를 받아 다음 처리를 반복한다

가장 단순한 TUI 실행 구조는 이런 모양이다.

```text
while running:
    event = read_event()
    update_state(event)
    render()
```

조금 더 구조적으로 보면:

```text
┌────────────────┐
│   이벤트 루프   │◀──────────────┐
└───────┬────────┘               │
        ↓                        │
      이벤트                     │
        ↓                        │
     상태 갱신                    │
        ↓                        │
     렌더링                      │
        └────────────────────────┘
```

Event Loop는 한 번 실행하고 끝나는 함수가 아니라 **다음 Event를 받고, 처리하고, 다시 다음 Event를 기다리는 반복 실행 구조**다.

사용자가 `j`를 누르면:

```text
Key(j)
  ↓
selected_index += 1
  ↓
새 상태
  ↓
다음 화면 렌더링
```

처럼 한 번의 처리 흐름이 만들어지고, 이후 다시 다음 Event를 받는다.

## 3. 상태 — 화면을 직접 고치기보다 데이터를 바꾼다

좋은 TUI 구조에서는 화면 좌표를 여기저기 직접 수정하기보다 **애플리케이션 상태(State)를 먼저 바꾸고 화면은 그 상태의 결과로 만든다.**

예를 들어 파일 목록 UI라면:

```text
상태
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

이 사고방식은 다음처럼 요약할 수 있다.

```text
UI = f(State)
```

즉 두 번째 큰 질문은:

> **Event가 들어왔을 때 애플리케이션의 어떤 상태가 어떻게 바뀌는가?**

다.

## 4. 레이아웃 — State를 터미널 좌표로 배치한다

State만으로는 아직 어느 터미널 셀에 무엇을 보여줄지 정해지지 않는다.

터미널 크기가 120x40이라면 화면을 어떻게 나눌지 계산해야 한다.

```text
120 x 40
┌──────────────┬─────────────────────────┐
│ 사이드바 30   │ 메인 90                 │
│              │                         │
└──────────────┴─────────────────────────┘
```

전통적인 TUI에서는 좌표를 직접 계산할 수 있다.

```text
sidebar_width = 30
main_x = 30
main_width = terminal_width - 30
```

현대 프레임워크는 이 부분도 여러 방식으로 추상화한다.

- 비율(Percentage)
- 제약 조건(Constraint)
- Flex Layout
- 최소/최대 크기
- 여백(Padding)
- 정렬(Alignment)

OpenTUI처럼 Flexbox/Yoga 계열 Layout을 사용하는 프레임워크도 있다.

여기서 질문은:

> **현재 State를 주어진 터미널 크기 안에서 어디에 배치할 것인가?**

다.

## 5. 렌더 표현 — 다음 화면을 어떤 형태로 만들 것인가

State와 Layout이 정해지면 다음에 보여줄 화면을 어떤 내부 표현으로 만들지 결정해야 한다.

TUI Renderer에서 자주 쓰이는 대표적인 표현이 **2차원 셀 버퍼(Cell Buffer)**다.

```text
┌───┬───┬───┬───┐
│ H │ e │ l │ l │ ...
├───┼───┼───┼───┤
│   │ > │ a │ . │ ...
└───┴───┴───┴───┘
```

각 셀에는 보통 다음 같은 정보가 들어간다.

```text
문자 또는 Grapheme
전경색
배경색
속성(Bold, Underline 등)
```

Ratatui는 Frame 안의 Widget을 Buffer에 렌더링하고, OpenTUI도 Renderer가 관리하는 셀 버퍼를 사용한다.

다만 **모든 현대 TUI 프레임워크가 반드시 같은 형태의 Cell Buffer를 직접 노출하거나 내부적으로 똑같이 구현하는 것은 아니다.** 여기서는 "다음 터미널 화면 상태를 표현하는 대표적인 내부 모델"로 이해하면 된다.

즉 TUI Renderer가 다루는 화면은 픽셀 Framebuffer보다 **터미널의 문자 셀 격자**에 가까운 경우가 많다.

```text
State
  ↓
Layout
  ↓
Render Representation
  ↓
예: Cell Buffer
```

여기까지 오면 애플리케이션이 원하는 다음 화면이 만들어진다.

## 6. 화면을 기술하는 방식은 프레임워크마다 다르다

공통 구조가 같더라도 "다음 화면을 어떻게 표현할 것인가"는 프레임워크마다 다를 수 있다.

### 매 Frame 현재 화면을 다시 기술하는 방식

Ratatui는 현재 State를 기준으로 Frame을 다시 채우는 방식에 가깝다.

```text
terminal.draw(frame => {
    render sidebar
    render main
    render statusbar
})
```

매번 "지금 화면은 이렇게 생겨야 한다"를 Buffer에 다시 기록한다.

그렇다고 실제 터미널에 모든 셀을 다시 출력하는 것은 아니다. 실제 출력량은 뒤의 Diff 단계에서 줄일 수 있다.

### Component Tree를 오래 유지하는 방식

Textual이나 OpenTUI의 고수준 API에서는 UI Tree나 Component가 더 오래 살아 있는 구조로 느껴진다.

```text
Root
├─ Sidebar
├─ Main
│  ├─ List
│  └─ Preview
└─ StatusBar
```

상태 변화가 Component, Layout, Rendering Schedule과 연결된다.

두 방식의 차이는 중요하지만 이 문서의 핵심은 어느 방식이 더 좋은지가 아니다.

> **어떤 방식으로 UI를 기술하더라도 결국 다음에 보여줄 터미널 화면 상태를 만들고 실제 출력 단계로 내려간다.**

## 7. 차이 렌더링 — 실제 터미널에는 변경분만 보낸다

이전 Frame:

```text
> file-a
  file-b
```

새 Frame:

```text
  file-a
> file-b
```

화면 전체를 지우고 다시 출력할 수도 있다. 하지만 Renderer가 이전 화면 상태와 다음 화면 상태를 비교하면 바뀐 부분만 찾을 수 있다.

```text
이전 화면 상태
   ↕ 비교
다음 화면 상태
   ↓
변경된 부분
   ↓
커서 이동 + 필요한 문자열 출력
```

Ratatui는 이전/현재 Buffer 차이를 계산해 필요한 변경을 터미널에 쓰고, OpenTUI도 두 Render Buffer의 차이를 이용해 변경된 셀을 출력한다.

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

여기서 마지막 질문이 나온다.

> **다음 화면 전체 중 실제 터미널에 꼭 보내야 하는 변경분은 무엇인가?**

## 8. 두 화면 상태를 유지해 다음 Frame을 완성한다

화면을 그리는 중간 상태를 실제 터미널에 바로 보여주면:

```text
사이드바 그림
→ 사용자에게 보임
메인 영역 그림
→ 다시 보임
상태 표시줄 그림
→ 다시 보임
```

처럼 부분적으로 그려지는 과정이 노출될 수 있다.

대신 다음 Frame을 별도의 화면 상태에 완성한 뒤 현재 화면 상태와 비교할 수 있다.

```text
현재 화면 상태      다음 화면 상태
현재 표시 기준       다음 화면 작성 중
                       ↓
                     완성
                       ↓ 차이 계산
터미널 ← 변경분만 출력
```

이 구조를 흔히 이중 버퍼와 비슷하게 설명할 수 있지만, 여기서는 그래픽 시스템의 모든 Double Buffering 의미와 동일시하기보다 **현재 상태와 다음 상태를 분리해 Frame 단위로 갱신한다**는 정도로 이해하면 충분하다.

## 9. 언제 다시 그릴 것인가

모든 TUI가 게임처럼 계속 같은 속도로 Render할 필요는 없다.

UI에 변화가 있을 때만 다시 그릴 수 있다.

```text
키 이벤트
  ↓ 상태 변경
렌더링 요청
```

CPU나 네트워크 상태를 보여주는 모니터링 앱처럼 주기적으로 State가 달라지는 프로그램은 Timer Tick에 맞춰 다시 그릴 수 있다.

```text
타이머 Tick
  ↓
지표 갱신
  ↓
렌더링
```

따라서 TUI는 상황에 따라 Event 기반, 주기적 Tick, 요청 기반 Rendering을 사용할 수 있다.

핵심은 FPS 자체가 아니라:

> **State가 바뀐 뒤 언제 다음 화면을 계산하고 터미널에 반영할 것인가?**

다.

## 10. Event Source가 많아지면 TUI도 Application Runtime처럼 보인다

TUI 앱이 복잡해지면 동시에 처리해야 할 Event Source가 늘어난다.

예를 들어 Git 도구라면:

```text
키 입력
Git 프로세스 결과
파일 변경
타이머
터미널 크기 변경
```

AI 코딩 도구라면:

```text
키 입력
HTTP Streaming 결과
백그라운드 프로세스 출력
LSP 이벤트
```

같은 Event가 들어올 수 있다.

그래서 현대 TUI Framework는 단순히 "터미널에 그림을 그리는 라이브러리"에 머물지 않고, Event 처리와 상태 흐름까지 관리하는 애플리케이션 실행 기반처럼 발전하기도 한다.

## 11. 프레임워크를 공통 구조에 대입해보기

여기서는 각 프레임워크의 세부 기능을 비교하지 않고, 지금까지 본 공통 구조의 어느 부분을 주로 맡는지만 본다.

### Bubble Tea

```text
Model   = State
Msg     = Event
Update  = State Transition
View    = State를 UI 표현으로 바꿈
```

즉 상태와 메시지 흐름을 강하게 구조화한다.

### Ratatui

```text
Event Loop / State
→ 애플리케이션이 비교적 직접 구성

Layout / Widget / Buffer / Diff
→ Ratatui가 강하게 지원
```

즉 실행 구조의 자유도를 남기면서 Rendering 계층을 많이 맡는다.

### Textual / OpenTUI 계열

```text
Event
State
Component Tree
Layout
Rendering
```

까지 더 넓은 범위를 Framework가 관리하는 방향으로 올라간다.

여기서 각 Framework의 구체적인 철학과 차이는 [현대 TUI 프레임워크 비교](./2026-09-05-modern-tui-frameworks-abstraction.md)에서 따로 본다.

## 고전과 현대를 연결하면

지금까지의 흐름은 단절된 기술 목록이 아니다.

```text
Escape Sequence
       ↓
termcap / terminfo
       ↓
curses 가상 화면
       ↓
애플리케이션 전용 Event Loop
       ↓
현대 TUI Framework
       ↓
Component / 선언형 TUI
```

다만 이것을 모든 기술이 앞 기술을 대체한 단일 발전 단계로 외우기보다, **개발자가 직접 책임지던 범위가 점차 Framework 안으로 이동한 흐름**으로 보는 편이 정확하다.

질문의 변화로 보면 더 간단하다.

```text
"커서를 어떻게 움직이지?"
        ↓
"화면을 어떻게 갱신하지?"
        ↓
"State를 어떻게 바꾸지?"
        ↓
"UI 구조를 어떻게 구성하지?"
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
Layout
   ↓
Render Representation
   ↓
Diff
   ↓
Terminal Output
```

각 단계에서 묻는 질문은 다음과 같다.

```text
무슨 일이 발생했는가?
      ↓
State가 어떻게 바뀌는가?
      ↓
화면 어디에 놓이는가?
      ↓
다음 화면 상태는 무엇인가?
      ↓
실제 터미널에 무엇만 보낼 것인가?
```

이 구조를 기준으로 보면 Framework 이름이 달라져도 어느 층을 대신해주는지 다시 찾아갈 수 있다.