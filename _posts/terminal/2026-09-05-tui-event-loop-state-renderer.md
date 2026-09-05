---
title       : "TUI 엔진의 공통 구조 — 이벤트 루프에서 렌더링까지"
description : "curses 이후 현대 TUI 프레임워크를 관통하는 입력 이벤트 → 상태 갱신 → 레이아웃 → 셀 버퍼 → 차이 렌더링 구조를 Ratatui와 OpenTUI 사례로 정리한다."
date        : 2026-09-05 14:30:00 +0900
updated     : 2026-09-05 18:03:00 +0900
categories  : [terminal]
tags        : [terminal, tui, event-loop, renderer, state, layout, buffer, diff]
pin         : false
hidden      : false
---

curses까지 오면 터미널의 좌표와 제어 문자열을 직접 다루는 부담은 크게 줄어든다.

하지만 실제 대화형 TUI 애플리케이션을 만들려면 여전히 한 단계 더 높은 구조가 필요하다.

사용자가 키를 누르고, 상태가 바뀌고, 레이아웃을 계산하고, 화면을 다시 그리는 전체 흐름이다.

프레임워크마다 API 이름은 다르지만 현대 TUI 엔진의 공통 구조를 단순화하면 다음과 같다.

```text
입력(Input)
  ↓
이벤트(Event)
  ↓
이벤트 루프(Event Loop)
  ↓
상태 갱신(State Update)
  ↓
레이아웃(Layout)
  ↓
셀 버퍼에 렌더링
  ↓
차이 계산(Diff)
  ↓
터미널 출력
```

이 구조를 이해하면 Bubble Tea, Ratatui, Textual, OpenTUI가 서로 완전히 다른 세계가 아니라 **같은 문제에 서로 다른 추상화를 씌운 것**이라는 게 보인다.

## 1. 입력 — 시작은 결국 바이트 스트림이다

아래쪽은 앞에서 본 그대로다.

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

방향키나 function key는 여러 바이트의 escape sequence일 수 있다.

그래서 첫 단계는 원시 바이트 스트림을 논리적인 입력 이벤트(Input Event)로 해석하는 것이다.

```text
ESC [ A
  ↓ 파서(Parser)
위쪽 키(KeyUp)
```

마우스를 지원하는 TUI라면 mouse sequence도 같은 식으로 해석한다.

터미널 크기 변경은 보통 `SIGWINCH` 같은 별도 이벤트로 들어온다.

즉 이벤트 루프가 받는 것은 단순 키 하나만이 아니다.

```text
키 이벤트
마우스 이벤트
크기 변경 이벤트
타이머
네트워크 결과
백그라운드 작업 완료
```

현대 TUI가 복잡해질수록 일반 GUI 앱의 이벤트 루프와 매우 비슷해진다.

## 2. 이벤트 루프 — 입력과 상태 변경을 직렬화한다

가장 단순한 TUI 루프는 이런 모양이다.

```text
while running:
    event = read_event()
    update_state(event)
    render()
```

조금 더 현실적으로는:

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

이 루프가 애플리케이션의 시간 흐름을 만든다.

사용자가 `j`를 누르면:

```text
Key(j)
  ↓
selected_index += 1
  ↓
새 상태
  ↓
다음 프레임
```

이런 식으로 진행된다.

## 3. 상태 — 화면 자체보다 먼저 데이터가 있다

좋은 TUI 구조에서는 화면 좌표를 여기저기 직접 고치기보다 **애플리케이션 상태(State)를 먼저 바꾸고 화면은 그 상태의 결과로 만든다.**

예를 들어 파일 목록 UI라면:

```text
상태
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

로 상태를 바꾸고 다음 렌더링에서 다시 표현한다.

이 사고방식이 현대 선언형 UI와 연결된다.

```text
UI = f(state)
```

## 4. 레이아웃 — 상태를 터미널 좌표로 변환한다

상태만으로는 아직 터미널 셀 위치가 정해지지 않는다.

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

현대 프레임워크는 이 부분도 추상화한다.

- 비율(Percentage)
- 제약 조건(Constraint)
- Flex 레이아웃
- 최소/최대 크기
- 여백(Padding)
- 정렬(Alignment)

OpenTUI처럼 Flexbox/Yoga 계열 레이아웃을 사용하는 프레임워크도 있다.

웹 UI의 레이아웃 모델이 터미널 셀 공간으로 내려온 셈이다.

## 5. 셀 버퍼 — 픽셀이 아니라 터미널 셀을 그린다

TUI 렌더러의 대표적인 내부 모델은 **2차원 셀 버퍼(Cell Buffer)**다.

```text
┌───┬───┬───┬───┐
│ H │ e │ l │ l │ ...
├───┼───┼───┼───┤
│   │ > │ a │ . │ ...
└───┴───┴───┴───┘
```

각 셀에는 보통 다음 같은 정보가 들어간다.

```text
문자 또는 grapheme
전경색
배경색
속성(bold, underline 등)
```

Ratatui도 프레임 안의 widget을 버퍼에 렌더링하고, OpenTUI도 렌더러가 소유하는 셀 버퍼를 사용한다.

OpenTUI의 `OptimizedBuffer`는 문자와 전경/배경 색, 속성 등을 터미널 셀 단위로 관리한다.

즉 현대 TUI 렌더러가 그리는 표면은 대체로:

> 픽셀 framebuffer가 아니라 터미널 셀 framebuffer

라고 이해하면 좋다.

## 6. Immediate Mode와 Retained/Component 방식

여기서 프레임워크별 철학 차이가 나타난다.

### Ratatui 스타일

Ratatui는 대표적으로 **현재 상태를 기준으로 프레임 전체를 다시 기술하는 Immediate Mode 스타일**에 가깝다.

```text
terminal.draw(frame => {
    render sidebar
    render main
    render statusbar
})
```

매 draw마다 "지금 화면은 이렇게 생겨야 한다"를 다시 버퍼에 기록한다.

그렇다고 실제 터미널에 모든 셀을 다시 출력하는 것은 아니다.

버퍼의 차이 계산이 뒤에서 최적화한다.

### Component / Retained 스타일

Textual이나 OpenTUI의 고수준 API에서는 UI 트리나 컴포넌트가 더 오래 살아 있는 객체처럼 느껴진다.

```text
Root
├─ Sidebar
├─ Main
│  ├─ List
│  └─ Preview
└─ StatusBar
```

상태 변화가 컴포넌트·레이아웃·렌더링 스케줄링과 연결된다.

React binding을 쓰는 OpenTUI라면 웹 프론트엔드와 더 비슷한 형태까지 올라간다.

하지만 내부 끝에는 결국 셀 버퍼와 터미널 출력이 있다.

## 7. 차이 렌더링 — 매 프레임 전체를 출력하지 않는다

가장 중요한 최적화다.

이전 프레임:

```text
> file-a
  file-b
```

새 프레임:

```text
  file-a
> file-b
```

화면 전체를 지우고 다시 출력할 수도 있다.

하지만 렌더러가 두 버퍼를 비교하면 바뀐 셀만 찾을 수 있다.

```text
이전 버퍼
   ↕ 비교
다음 버퍼
   ↓
변경된 셀
   ↓
커서 이동 + 최소 문자열 출력
```

Ratatui는 이중 버퍼(Double Buffer)를 두고 현재 버퍼와 이전 버퍼의 차이를 계산해 터미널에 필요한 변경만 쓴다.

OpenTUI도 `currentRenderBuffer`와 `nextRenderBuffer`를 비교해 변경된 셀을 native renderer가 출력한다.

수십 년 전 curses의 가상/물리 화면 개념과 현대 프레임워크의 이중 버퍼·차이 렌더러가 같은 문제를 계속 풀고 있다는 점이 재미있다.

## 8. 이중 버퍼 — 다음 화면을 따로 만든다

왜 버퍼가 두 개 필요한지 생각해보자.

화면을 그리는 중간 상태를 실제 터미널에 바로 보여주면:

```text
사이드바 그림
→ 사용자에게 보임
메인 영역 그림
→ 다시 보임
상태 표시줄 그림
→ 다시 보임
```

같은 부분 렌더링이 보일 수 있다.

대신 다음 프레임을 화면 밖 버퍼(Off-screen Buffer)에 완성한다.

```text
현재 버퍼        다음 버퍼
현재 화면         다음 화면 작성 중
                    ↓
                  완성
                    ↓ 차이 계산
터미널 ← 변경분만 출력
```

이 방식은 화면 갱신을 하나의 프레임처럼 다루게 해준다.

## 9. 렌더링 스케줄 — 언제 다시 그릴 것인가

모든 TUI가 게임처럼 초당 60번 렌더링할 필요는 없다.

UI에 변화가 있을 때만 렌더링할 수도 있다.

```text
키 이벤트
  ↓ 상태 변경
렌더링 요청
```

반대로 CPU/네트워크 모니터링 앱은 주기적으로 프레임을 갱신할 필요가 있다.

```text
타이머 Tick
  ↓
지표 갱신
  ↓
렌더링
```

그래서 현대 렌더러는 보통 다음 전략 중 하나 또는 조합을 가진다.

```text
이벤트 기반 렌더링(Event-driven Rendering)
고정 FPS / Tick 렌더링
요청 기반 렌더링(Demand Rendering)
```

OpenTUI의 렌더러도 프레임 스케줄링을 관리하고 target FPS나 demand 계열 동작을 제공한다.

## 10. 이벤트 루프에는 비동기 작업도 들어온다

TUI 앱이 파일만 보여주는 수준을 넘어가면 I/O가 많아진다.

예를 들어 lazygit 같은 앱이라면:

```text
키 입력
Git 프로세스 결과
파일 변경
타이머
터미널 크기 변경
```

가 동시에 발생할 수 있다.

AI 코딩 도구라면:

```text
키 입력
HTTP 스트리밍 토큰
백그라운드 프로세스 출력
LSP 이벤트
```

까지 들어온다.

그래서 현대 TUI 프레임워크가 단순 "터미널 그림 라이브러리"가 아니라 **애플리케이션 런타임(Application Runtime)**처럼 발전하는 이유가 있다.

## 11. Bubble Tea의 Model / Update / View가 보이기 시작한다

이 공통 구조를 알고 Bubble Tea를 보면 이해가 쉽다.

```text
Model   = 상태(State)
Message = 이벤트(Event)
Update  = 상태 전이(State Transition)
View    = 상태 → UI 표현
```

즉 Elm Architecture를 터미널 애플리케이션에 적용한 것이다.

```text
Msg
 ↓
Update(Model, Msg)
 ↓
새 Model
 ↓
View(Model)
```

우리가 지금까지 만든 일반식과 거의 같다.

## 12. Ratatui도 같은 문제를 다른 방식으로 푼다

Ratatui에서는 애플리케이션이 상태와 이벤트 루프를 직접 구성하는 느낌이 더 강하다.

```text
이벤트 대기
  ↓
애플리케이션 상태 갱신
  ↓
terminal.draw(|frame| render(app, frame))
```

Widget은 프레임의 버퍼를 채우고, 마지막 flush에서 이전 버퍼와의 차이를 계산한다.

즉:

```text
상태 소유권       → 애플리케이션
렌더링 추상화     → Ratatui
```

로 나뉘는 편이다.

## 13. OpenTUI는 훨씬 위까지 가져간다

OpenTUI는 렌더러뿐 아니라:

```text
입력 파싱
레이아웃
컴포넌트/Renderable 트리
프레임 스케줄링
버퍼
native rendering
```

까지 넓은 범위를 가진다.

고수준에서는 React/Solid binding도 제공하므로 애플리케이션 개발자는 터미널 좌표보다 컴포넌트와 상태를 먼저 생각할 수 있다.

하지만 내부를 내려가면 역시:

```text
컴포넌트 트리
   ↓ 레이아웃
Renderable
   ↓
다음 셀 버퍼
   ↓ 차이 계산
현재 셀 버퍼
   ↓
터미널 출력
```

이라는 구조가 보인다.

## 고전과 현대를 연결하면

지금까지의 역사는 단절된 것이 아니다.

```text
Escape Sequence
       ↓
termcap / terminfo
       ↓
curses 가상 화면
       ↓
애플리케이션 전용 이벤트 루프
       ↓
현대 TUI 프레임워크
       ↓
컴포넌트 / 선언형 TUI
```

각 시대마다 개발자가 직접 담당하던 부분이 프레임워크 안으로 이동했다.

그래서 TUI 추상화의 역사는 다음 질문의 변화로 볼 수 있다.

```text
"커서를 어떻게 움직이지?"
        ↓
"화면을 어떻게 갱신하지?"
        ↓
"상태를 어떻게 관리하지?"
        ↓
"컴포넌트를 어떻게 구성하지?"
```

## 다음 단계 — 프레임워크들을 같은 축에서 비교하기

이제 Bubble Tea, Ratatui, Textual, OpenTUI를 단순 기능표로 비교할 필요가 없다.

다음 질문으로 비교하면 된다.

```text
이벤트 루프를 누가 소유하는가?
상태 모델을 프레임워크가 얼마나 강제하는가?
레이아웃은 어디까지 제공하는가?
렌더러와 버퍼는 누가 관리하는가?
컴포넌트 추상화가 있는가?
비동기 작업을 어떻게 통합하는가?
```

이 기준으로 보면 각 프레임워크의 철학 차이가 훨씬 선명해진다.
