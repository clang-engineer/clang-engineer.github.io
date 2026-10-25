---
title       : "Terminal 로드맵 — 터미널 입출력과 제어 구조"
description : "TTY·PTY·제어 터미널, termios, ANSI/VT, TERM·terminfo와 원격·다중화의 실제 관계를 설명하는 거시 개념지도."
date        : 2026-09-05 12:30:00 +0900
updated     : 2026-10-25 20:30:00 +0900
categories  : [terminal]
tags        : [roadmap, terminal, tty, pty, termios, ansi, vt, terminfo, ncurses, tui]
pin         : false
hidden      : false
redirect_from:
  - /posts/terminal/2026-09-05-tui-history-and-modern-frameworks/
---

Terminal은 프로그램과 사용자 사이에서 문자 기반 입출력을 매개하는 인터페이스다. 이 로드맵은 **프로세스가 터미널과 연결되는 방식, 입력 처리, 화면 표현과 호환성**의 관계를 설명한다. 그 위에 대화형 애플리케이션을 설계하는 문제는 별도의 [TUI 로드맵](./2026-10-25-tui-roadmap.md)에서 다룬다.

## 전체 개념지도

```text
Terminal System
├─ 프로세스·터미널 관계
│  ├─ TTY / PTY (master ↔ slave)
│  ├─ Session / Process Group / Controlling Terminal
│  └─ Standard Input / Output / Error
├─ 입력 처리
│  ├─ Terminal Driver / termios
│  └─ Canonical·Noncanonical / Echo / Signal
├─ 출력 표현
│  ├─ Terminal Emulator
│  └─ ANSI / VT Control Sequence
└─ 기능 호환성
   ├─ TERM / terminfo / termcap
   └─ Terminal Capability

대표적인 로컬 PTY 연결
Keyboard → Emulator → PTY master ↔ PTY slave ↔ App
Display  ← Emulator ← PTY master ↔ PTY slave ← App

응용 경계
├─ tmux: Client·Server 및 추가 Pane PTY
├─ SSH: 원격 프로세스·선택적 PTY 할당
└─ TUI: Event·State·Layout·Rendering
```

이 그림은 대표적인 Unix 계열 PTY 구성을 단순화한 것이다. 모든 프로그램이 PTY를 필요로 하지는 않으며, PTY와 프로세스는 같은 개념이 아니다.

## 핵심 개념과 관계

### TTY·PTY와 프로세스

터미널 에뮬레이터는 일반적으로 PTY master 쪽에서 입출력을 처리하고, 셸이나 애플리케이션은 PTY slave 쪽을 터미널로 사용한다. 제어 터미널과 프로세스 그룹은 대화형 작업 제어 및 터미널에서 발생하는 신호를 이해할 때 중요하다.

### termios와 입력 처리

termios는 터미널 드라이버의 입력·출력 처리 설정을 다룬다. Canonical 모드의 줄 단위 입력, Echo, 제어 문자에 의한 신호 생성 등은 서로 다른 설정이다. Raw 모드는 이러한 처리를 크게 줄이는 구성이다.

### ANSI/VT와 TERM·terminfo

애플리케이션이 출력하는 제어 시퀀스를 터미널 에뮬레이터가 해석해 커서·색상·화면 상태를 바꾼다. `TERM`은 터미널 유형을 식별하고 terminfo는 그 유형의 기능 정보를 제공한다. 모든 애플리케이션이 terminfo를 반드시 거치는 것은 아니다.

### 다중화와 원격 접속

tmux는 Client와 Server 사이에서 터미널 작업공간을 관리하고 각 Pane에 PTY를 제공한다. SSH는 원격 명령 실행과 대화형 세션을 지원하며 필요에 따라 원격 PTY를 할당한다. 둘은 Terminal의 필수 구성요소가 아니라 이 인터페이스를 활용하는 별도 시스템이다.

## 필요한 경우 더 깊이 살펴보기

[TTY·PTY](./2026-09-05-terminal-tty-pty.md), [termios·Raw Mode](./2026-09-05-termios-canonical-raw-mode.md), [ANSI/VT](./2026-09-05-ansi-vt-escape-sequences.md), [TERM·terminfo](./2026-09-05-termcap-terminfo-tput.md), [tmux·SSH 연결](./2026-09-05-tmux-ssh-terminal-stack.md)을 참고할 수 있다.

터미널 위의 대화형 UI 구조는 [TUI 로드맵](./2026-10-25-tui-roadmap.md), 셸의 명령 해석과 작업 제어는 [Shell 로드맵](../shell/2026-07-03-shell-roadmap.md)에서 다룬다.
