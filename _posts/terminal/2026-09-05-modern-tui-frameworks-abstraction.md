---
title       : "현대 TUI 프레임워크 비교 — 무엇을 얼마나 추상화하는가"
description : "Bubble Tea, Ratatui, Textual, OpenTUI를 기능표가 아니라 event loop, state, layout, renderer, component 추상화 수준으로 비교한다."
date        : 2026-09-05 14:50:00 +0900
updated     : 2026-09-05 14:50:00 +0900
categories  : [terminal]
tags        : [tui, bubble-tea, ratatui, textual, opentui, architecture, framework]
pin         : false
hidden      : false
---

현대 TUI 프레임워크를 단순히 언어별 목록으로 외우면 차이가 잘 안 보인다.

```text
Go         Bubble Tea
Rust       Ratatui
Python     Textual
TypeScript OpenTUI
```

더 유용한 질문은 이것이다.

> 각 프레임워크가 TUI 엔진의 어느 부분까지 대신해주는가?

앞 글에서 본 공통 구조를 다시 놓고 비교해보자.

```text
Input
  ↓
Event Loop
  ↓
State
  ↓
Layout
  ↓
Cell Buffer
  ↓
Renderer / Diff
  ↓
Terminal
```

## 한눈에 보기

| 프레임워크 | 핵심 철학 | State 모델 | Layout | Renderer | Component 수준 |
|---|---|---|---|---|---|
| Bubble Tea | Elm Architecture | 강하게 제시 | 별도 조합 | 내장 cell renderer | 중간 |
| Ratatui | immediate-mode rendering | 앱이 직접 소유 | Constraint/Layout | double-buffer diff | 낮음~중간 |
| Textual | application framework | reactive state | CSS 계열 | framework가 관리 | 높음 |
| OpenTUI | native renderer + component tree | Core/React/Solid 선택 | Flexbox/Yoga | Zig native diff renderer | 높음 |

이 표에서 중요한 것은 "누가 더 좋다"가 아니다.

**애플리케이션 개발자가 직접 책임질 영역이 얼마나 남아 있는가**가 다르다.

## Bubble Tea — 아키텍처를 강하게 잡아준다

Bubble Tea는 The Elm Architecture를 기반으로 한다.

핵심 구조는:

```text
Model
  ↓
Msg
  ↓
Update
  ↓
Model
  ↓
View
```

이다.

공식적으로 프로그램은 state를 가진 Model과 `Init`, `Update`, `View`를 중심으로 구성된다.

```go
func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd)
func (m model) View() tea.View
```

여기서:

```text
Model = application state
Msg   = event
Update = state transition
View   = state → UI
```

라고 볼 수 있다.

즉 Bubble Tea가 가장 강하게 추상화하는 것은 **애플리케이션의 흐름 자체**다.

개발자가 이벤트 루프를 직접 `for {}`로 만들기보다 framework runtime이 message를 받아 `Update`로 흘려준다.

비동기 I/O도 `Cmd → Msg` 패턴으로 다시 event loop에 합류시킨다.

```text
HTTP request
   ↓ Cmd
result
   ↓ Msg
Update
```

그래서 복잡한 interactive CLI/TUI에서도 state transition의 경계가 명확해진다.

## Ratatui — 렌더링은 강하지만 앱 구조는 자유롭다

Ratatui는 Bubble Tea보다 application architecture를 덜 강제한다.

전형적인 구조는:

```text
앱이 event를 poll
   ↓
앱 state 수정
   ↓
terminal.draw(|frame| ...)
```

에 가깝다.

즉 event loop와 state ownership은 애플리케이션이 직접 설계하는 경우가 많다.

대신 Ratatui는 다음 부분을 잘 추상화한다.

```text
Frame
Widget
Layout
Style
Buffer
Diff rendering
```

특히 렌더링은 immediate-mode 사고방식이 강하다.

매 frame마다 현재 state 기준으로 원하는 UI 전체를 다시 기술한다.

```rust
terminal.draw(|frame| {
    frame.render_widget(...);
    frame.render_widget(...);
});
```

하지만 실제 terminal에는 모든 셀을 재출력하지 않는다.

Ratatui는 이전/현재 buffer의 diff를 계산해 필요한 부분만 backend를 통해 출력한다.

즉:

```text
Application architecture 자유도 ↑
Rendering abstraction 강도 ↑
```

라는 조합이다.

Rust 개발자가 event loop나 async runtime을 직접 조합하고 싶은 경우 잘 맞는다.

## Textual — TUI보다 Application Framework에 가깝다

Textual은 abstraction 수준이 훨씬 높다.

단순히:

```text
터미널에 Widget 그리기
```

를 넘어:

```text
Widget tree
Message/Event
Reactive state
Focus
CSS-like styling/layout
Application lifecycle
```

까지 하나의 framework 안에서 제공한다.

그래서 Python GUI/Web framework와 비슷한 감각으로 접근할 수 있다.

```text
App
 ├─ Header
 ├─ Sidebar
 ├─ DataTable
 ├─ Input
 └─ Footer
```

UI tree와 reactive property가 살아 있고 state 변경이 다시 layout/render로 이어진다.

Harlequin 같은 SQL IDE가 Textual과 잘 맞는 이유도 여기에 있다.

단순 선택 메뉴가 아니라 editor, tree, table, dialog, focus 이동 등 **복잡한 application UI**가 필요하기 때문이다.

## OpenTUI — 웹 UI 추상화를 터미널까지 끌고 온다

OpenTUI는 조금 특이하다.

낮은 층에는 Zig로 작성된 native terminal renderer가 있고, 위에는 TypeScript API가 있다.

```text
TypeScript
   ↓
OpenTUI Core
   ↓ ABI
Zig renderer
   ↓
Terminal
```

Core만 써도:

```text
Renderable tree
Input parsing
Flexbox layout
Frame scheduling
Cell buffer
Diff rendering
```

을 제공한다.

그리고 그 위에 React/Solid binding까지 있다.

```text
React / Solid
      ↓
Component tree
      ↓
OpenTUI Core
      ↓
Native renderer
```

즉 개발자는:

```tsx
<box flexDirection="row">
  <Sidebar />
  <Main />
</box>
```

처럼 terminal coordinate를 거의 생각하지 않고 component를 먼저 설계할 수 있다.

OpenTUI 공식 문서 기준으로 renderer는 component tree를 layout하고 변경된 terminal cell만 업데이트한다.

이건 TUI 추상화가 웹 프론트엔드의 abstraction 수준에 거의 도달한 사례다.

## 같은 Todo 앱을 만든다고 생각해보자

### Bubble Tea

주로 생각할 것:

```text
Model은 무엇인가?
어떤 Msg가 있는가?
Update에서 state를 어떻게 바꿀까?
View가 무엇을 반환할까?
```

### Ratatui

주로 생각할 것:

```text
App state는 어떻게 둘까?
Event loop를 어떻게 돌릴까?
Layout을 어떻게 나눌까?
Frame에 어떤 Widget을 render할까?
```

### Textual

주로 생각할 것:

```text
Widget tree는 어떻게 구성할까?
Message/Event handler는 어디에 둘까?
Reactive state는 무엇인가?
CSS layout/style을 어떻게 줄까?
```

### OpenTUI

Core라면:

```text
Renderable tree
Event
Flex layout
```

React/Solid라면:

```text
Component
State/Signal
Hook/Effect
Flex layout
```

을 먼저 생각한다.

## 추상화가 높다고 무조건 좋은 것은 아니다

고수준 framework는 많은 것을 대신해주지만 그만큼 runtime과 framework 규칙도 커진다.

반대로 낮은 수준은 boilerplate가 늘지만 제어권이 크다.

```text
낮은 추상화
Ratatui-ish
  ↑ 제어권 큼
  ↑ 앱 구조 직접 설계

Bubble Tea
  ↑ 상태 흐름 구조화

Textual / OpenTUI high-level
  ↑ component/runtime 제공
  ↑ 빠른 복잡 UI 구성
```

실제로 어떤 앱은 framework가 제공하는 구조보다 특수 요구사항이 더 중요해서 자체 TUI engine을 유지한다.

이게 다음 글의 주제다.

## 중요한 트렌드 — renderer보다 application model이 위로 올라왔다

역사를 길게 놓으면 관심사의 변화가 보인다.

```text
1970s
"어떤 escape sequence를 보내지?"

1980s
"어떤 terminal capability를 쓰지?"

curses
"어떤 screen/window를 갱신하지?"

modern TUI
"어떤 state와 event가 있지?"

component TUI
"어떤 component tree를 만들지?"
```

터미널은 그대로 cell grid인데 **개발자가 생각하는 추상화 수준만 계속 올라간 것**이다.

## 프레임워크 선택 기준

언어가 이미 정해졌다면 생태계 선택이 상당 부분 자동으로 된다.

하지만 구조 관점에서는 다음 질문이 더 중요하다.

```text
작은 single-screen 도구인가?
복잡한 IDE형 앱인가?
비동기 I/O가 많은가?
state transition을 강하게 구조화하고 싶은가?
렌더링 제어권이 중요한가?
웹 frontend 경험을 재사용하고 싶은가?
```

대략:

```text
Go + message/state architecture → Bubble Tea
Rust + renderer/layout 중심       → Ratatui
Python + 복잡한 앱 UI            → Textual
TypeScript + component UI        → OpenTUI
```

로 출발점을 잡을 수 있다.

## 다음 단계 — 실제 앱은 무엇을 선택했나

이제 framework 이론을 실제 도구에 꽂아본다.

```text
fzf
btop
lazygit
yazi
Harlequin
OpenCode
Neovim
```

흥미로운 점은 유명 TUI 앱이 모두 최신 framework를 쓰는 것이 아니라는 것이다.

일부는 자체 renderer를 만들고, 일부는 중간 수준 library를 쓰고, 일부는 high-level framework를 사용한다.

그 차이를 보면 **언제 abstraction을 사고 언제 직접 구현하는지**가 보인다.

## 참고

- Bubble Tea — The Elm Architecture 기반 Model/Update/View
- Ratatui — immediate-mode frame rendering과 double-buffer diff
- Textual — Python reactive TUI application framework
- OpenTUI — Zig native core + TypeScript, React/Solid bindings, Flexbox layout
