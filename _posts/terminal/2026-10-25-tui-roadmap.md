---
title       : "TUI 로드맵 — 이벤트·상태·레이아웃·렌더링"
description : "터미널 기반 대화형 UI의 입력, 상태 관리, 화면 구성, 렌더링과 추상화 계층의 관계를 설명하는 거시 개념지도."
date        : 2026-10-25 20:00:00 +0900
categories  : [terminal, "개요·인덱스"]
tags        : [roadmap, tui, event-loop, rendering, ncurses]
pin         : false
hidden      : false
---

TUI(Text User Interface)는 터미널의 문자 셀과 제어 시퀀스를 이용해 대화형 화면을 구성한다. 핵심은 특정 프레임워크가 아니라 **입력 이벤트가 상태 변경을 거쳐 화면 표현으로 이어지는 관계**다. 터미널 입출력의 바닥 원리는 [Terminal 로드맵](./2026-09-05-terminal-roadmap.md)에서 다룬다.

## 전체 개념지도

```text
TUI Application
├─ 입력·이벤트
│  ├─ Keyboard / Resize / Timer / External I/O
│  └─ Event Loop / Dispatch
├─ 상태·동작
│  ├─ Application State
│  └─ Update / Command / Side Effect
├─ UI 구성
│  ├─ Component / Widget / Focus
│  ├─ Layout / Constraint
│  └─ Immediate 또는 Retained 구성 방식
└─ 화면 출력
   ├─ Render Model / Cell Buffer
   ├─ 변경 영역 계산 / Diff (선택적)
   └─ Terminal Control Sequence

입력 이벤트 ──> 상태 변경 ──> UI 구성·렌더 ──> 터미널
     ▲                                         │
     └──────── 사용자에게 표시된 결과 ──────────┘

구현 선택: 직접 처리 / curses 계열 / TUI Framework
```

이 그림은 대표적인 대화형 앱의 개념 관계다. 모든 TUI가 같은 아키텍처, Component Tree 또는 Diff 알고리즘을 사용하는 것은 아니다.

## 핵심 관계

### 이벤트와 상태

키 입력·화면 크기 변경·외부 작업 결과가 이벤트가 될 수 있다. 이벤트 루프는 이를 받아 상태를 갱신하고 필요한 부수효과를 수행한다. 이벤트 루프는 현대 TUI 프레임워크에서 새로 등장한 개념이 아니다.

### UI 구성과 화면 출력

애플리케이션은 상태를 바탕으로 표시할 내용을 정하고 레이아웃을 계산한다. 렌더러는 터미널에 전달할 문자·스타일·커서 이동 등의 출력을 만든다. 화면 전체를 다시 출력할 수도 있고 이전 화면과의 차이를 이용해 갱신량을 줄일 수도 있다.

```text
Application State
       │
       ▼
UI Structure / Layout
       │
       ▼
Render Representation
       │
       ├─ Full redraw
       └─ Diff / Partial update
                 │
                 ▼
       Terminal Output
```

### 구현 방식과 추상화 경계

직접 ANSI/VT 시퀀스를 처리하는 방식, curses/ncurses 같은 화면·입력 API를 사용하는 방식, 더 높은 수준의 TUI 프레임워크를 사용하는 방식은 **선택 가능한 구현 접근법**이다. 하나의 필수 발전 단계가 아니다.

프레임워크를 비교할 때는 언어보다도 이벤트 처리, 상태 관리, 레이아웃, 렌더링 중 어느 책임을 제공하는지 확인한다. Bubble Tea·Ratatui·Textual·OpenTUI는 이 책임을 서로 다르게 분담한다.

## 다른 개념지도와의 경계

[Terminal](./2026-09-05-terminal-roadmap.md)은 PTY·termios·ANSI/VT·terminfo 같은 입출력·표현 기반을, 이 로드맵은 그 위에서 동작하는 대화형 앱 구조를 다룬다. [Neovim](../neovim/2026-06-16-neovim-roadmap.md)은 편집기 상태와 확장 API를, [tmux](../tmux/2026-06-16-tmux-roadmap.md)는 터미널 작업공간과 다중화를 다룬다.

## 필요한 경우 더 깊이 살펴보기

[curses·ncurses](./2026-09-05-curses-ncurses-screen-window.md), [TUI 엔진의 공통 구조](./2026-09-05-tui-event-loop-state-renderer.md), [프레임워크 비교](./2026-09-05-modern-tui-frameworks-abstraction.md), [실제 앱의 추상화](./2026-09-05-tui-app-abstraction-map.md), [Neovim의 TUI 플랫폼](./2026-09-05-neovim-as-tui-platform.md)을 필요할 때 참고한다.
