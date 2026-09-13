---
title       : "TUI 엔진의 공통 구조 — 이벤트 루프에서 렌더링까지"
description : "터미널 제어 추상화 이후, 현대 TUI가 Event → State → Layout → Render → Diff 구조로 애플리케이션 전체를 조직하는 방식을 정리한다."
date        : 2026-09-05 14:30:00 +0900
updated     : 2026-09-13 21:40:00 +0900
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

여기까지가 주로 **터미널 UI를 다루는 저수준 책임을 줄이는 층**이었다면, 이 문서부터는 질문이 한 단계 올라간다.

> **터미널을 하나의 UI 플랫폼처럼 사용해서, 대화형 애플리케이션 전체를 어떻게 구조화할까?**

다만 여기서 중요한 경계가 두 가지 있다.

첫째,

> **이벤트 루프 자체가 현대 TUI에서 처음 생긴 것은 아니다.**

curses를 사용한 고전 TUI도 애플리케이션이 직접 다음과 같은 반복 구조를 만들 수 있었다.

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
= 이벤트 루프와 애플리케이션 상태 구조는 앱이 직접 구성하는 경우가 많음

현대 TUI 프레임워크
= Event / State / Update / Layout / Render 같은
  애플리케이션 구조 자체를 더 강하게 모델링하거나 제공
```

즉 현대 TUI의 핵심 변화는 이벤트 루프의 발명이 아니라, **앱마다 직접 만들던 실행 구조를 프레임워크 수준의 공통 추상화로 끌어올린 것**에 가깝다.

둘째,

> **현대 TUI 프레임워크가 curses 위에 올라가는 계층이라고 생각하면 안 된다.**

`ncurses`는 curses API를 직접 구현한 대표적인 라이브러리다. 반면 Bubble Tea, Ratatui, Textual, OpenTUI 같은 현대 TUI 프레임워크는 일반적으로 curses API의 구현체가 아니며, 내부적으로도 curses를 반드시 거쳐야 하는 것은 아니다.

관계는 위아래 계층보다 **서로 다른 TUI 구현 계열**에 가깝다.

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
→ 자체 event / state / layout / renderer / terminal backend
→ termios / ANSI·VT 계열 제어
→ terminal emulator
```

즉 두 계열은 아래쪽의 터미널 기반 기술을 공유할 수 있지만:

```text
현대 TUI Framework
        ↓
      curses
```

라는 필수 계층 관계는 아니다.

curses와 완전히 단절되는 것도 아니다. curses의 `refresh()`는 내부 화면 상태와 현재 표시 상태를 비교해 필요한 변경만 출력한다는 점에서 현대 TUI 렌더링과 이어지는 아이디어가 있다.

즉 **구현 계층은 별도일 수 있지만, 해결하려는 문제와 일부 설계 아이디어는 이어진다.**

이제 중심 질문은 다음과 같다.

```text
무슨 일이 발생했는가?
→ 앱 상태를 어떻게 바꿀까?
→ 화면을 어떻게 배치할까?
→ 다음 화면을 어떻게 만들까?
→ 실제 터미널에는 무엇만 보낼까?
```

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

Event Loop는 한 번 실행하고 끝나는 함수가 아니라 **다음 Event를 받고, 처리하고, 다시 다음 Event를 기다리는 반복 실행 구조**다.

```text
Event
  ↓
State Update
  ↓
Render
  ↓
다시 다음 Event 대기
```

중요한 점은 이 구조 자체는 curses 시대에도 애플리케이션이 직접 만들 수 있었다는 것이다.

현대 프레임워크에서는 이 반복 구조에 메시지 큐, 비동기 작업, 렌더 스케줄링, 컴포넌트 이벤트 전달 같은 기능까지 결합하면서 **애플리케이션 실행 기반**으로 발전한다.

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

```text
UI = f(State)
```

## 4. 레이아웃 — State를 터미널 좌표로 배치한다

State만으로는 아직 어느 터미널 셀에 무엇을 보여줄지 정해지지 않는다.

```text
120 x 40
┌──────────────┬─────────────────────────┐
│ 사이드바 30   │ 메인 90                 │
│              │                         │
└──────────────┴─────────────────────────┘
```

현대 프레임워크는 비율, 제약 조건, Flex Layout, 최소·최대 크기, 여백, 정렬 같은 방식으로 이 부분을 추상화한다.

핵심 질문은:

> **현재 State를 주어진 터미널 크기 안에서 어디에 배치할 것인가?**

다.

## 5. 렌더 표현 — 다음 화면을 어떤 형태로 만들 것인가

State와 Layout이 정해지면 다음 화면을 내부적으로 표현해야 한다.

TUI Renderer에서 자주 쓰이는 대표적인 표현이 **2차원 셀 버퍼(Cell Buffer)**다.

```text
┌───┬───┬───┬───┐
│ H │ e │ l │ l │ ...
├───┼───┼───┼───┤
│   │ > │ a │ . │ ...
└───┴───┴───┴───┘
```

각 셀에는 문자 또는 Grapheme, 전경색, 배경색, Bold·Underline 같은 속성이 들어갈 수 있다.

다만 **모든 현대 TUI 프레임워크가 반드시 같은 형태의 Cell Buffer를 직접 노출하거나 내부적으로 똑같이 구현하는 것은 아니다.** 여기서는 다음 터미널 화면 상태를 표현하는 대표적인 내부 모델로 이해하면 된다.

## 6. 화면을 기술하는 방식은 프레임워크마다 다르다

어떤 프레임워크는 매 Frame 현재 화면을 다시 기술하고, 어떤 프레임워크는 Component Tree를 오래 유지한다.

```text
Immediate-style에 가까운 방식
State → 매 Frame 화면 기술 → Buffer

Retained/Component-style에 가까운 방식
State → Component Tree → Layout / Rendering
```

중요한 것은 어느 방식이 더 좋은지가 아니다.

> **결국 다음에 보여줄 터미널 화면 상태를 만들고 실제 출력 단계로 내려간다.**

## 7. 차이 렌더링 — 실제 터미널에는 변경분만 보낸다

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

## 8. 두 화면 상태를 유지해 다음 Frame을 완성한다

다음 Frame을 별도의 화면 상태에 완성한 뒤 현재 화면 상태와 비교할 수 있다.

```text
현재 화면 상태      다음 화면 상태
현재 표시 기준       다음 화면 작성 중
                       ↓
                     완성
                       ↓ 차이 계산
터미널 ← 변경분만 출력
```

이 구조를 흔히 이중 버퍼와 비슷하게 설명할 수 있지만, 그래픽 시스템의 모든 Double Buffering 의미와 동일시하기보다 **현재 상태와 다음 상태를 분리해 Frame 단위로 갱신한다**는 정도로 이해하면 충분하다.

## 9. 언제 다시 그릴 것인가

모든 TUI가 게임처럼 계속 같은 속도로 Render할 필요는 없다.

```text
키 이벤트
  ↓ 상태 변경
렌더링 요청
```

또는:

```text
타이머 Tick
  ↓
지표 갱신
  ↓
렌더링
```

즉 Event 기반, 주기적 Tick, 요청 기반 Rendering을 사용할 수 있다.

핵심은:

> **State가 바뀐 뒤 언제 다음 화면을 계산하고 터미널에 반영할 것인가?**

다.

## 10. Event Source가 많아지면 TUI도 Application Runtime처럼 보인다

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

그래서 현대 TUI Framework는 단순히 "터미널에 그림을 그리는 라이브러리"에 머물지 않고, Event 처리와 상태 흐름까지 관리하는 애플리케이션 실행 기반처럼 발전하기도 한다.

## 11. 프레임워크를 공통 구조에 대입해보기

### Bubble Tea

```text
Model   = State
Msg     = Event
Update  = State Transition
View    = State를 UI 표현으로 바꿈
```

### Ratatui

```text
Event Loop / State
→ 애플리케이션이 비교적 직접 구성

Layout / Widget / Buffer / Diff
→ Ratatui가 강하게 지원
```

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
curses 화면·입력 API
       ↓
앱이 직접 구성한 Event Loop / State
       ↓
현대 TUI Framework
       ↓
Component / 선언형 TUI
```

하지만 이 그림도 **구현 계층도**로 읽으면 안 된다. 현대 TUI Framework가 curses를 내부적으로 호출한다는 뜻이 아니라, 개발자가 직접 책임하던 범위가 역사적으로 어떻게 더 높은 추상화로 이동했는지를 나타낸 것이다.

핵심은:

> **개발자가 직접 책임지던 범위가 점차 공통 라이브러리와 Framework 안으로 이동했다.**

질문의 변화로 보면 더 간단하다.

```text
"커서를 어떻게 움직이지?"
        ↓
"화면을 어떻게 갱신하지?"
        ↓
"이벤트와 State를 어떻게 조직하지?"
        ↓
"UI 구조 전체를 어떻게 구성하지?"
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

이 구조를 기준으로 보면 Framework 이름이 달라져도 어느 층을 대신해주는지 다시 찾아갈 수 있다.
