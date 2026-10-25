---
title       : "셸 로드맵 — 실행 모델에서 스크립트와 세션까지"
description : "셸의 명령 해석·실행, 스크립팅, 프로세스·작업 제어, CLI 설계와 주변 도구의 관계를 연결하는 로드맵."
date        : 2026-07-03 14:30:00 +0900
updated     : 2026-10-25 20:30:00 +0900
categories  : [shell, "개요·인덱스"]
tags        : [roadmap, shell, zsh, bash]
pin         : false
hidden      : false
---

셸은 사용자의 명령을 해석하고 프로그램을 실행하며, 파이프·리다이렉션·작업 제어를 제공하는 명령 실행 환경이다. 스크립트는 이 동작을 파일로 작성해 재사용하는 방법이다. 이 로드맵은 **실행·해석·작업 제어·초기화의 실제 개념 관계**를 먼저 보여준다. 게시글 유무는 개념 포함 기준이 아니다.

## 전체 개념지도

```text
Shell
├─ 입력·해석 ── Parsing / Quote / Expansion / Globbing
├─ 실행 ── Builtin / Function / External Command / PATH
├─ 입출력 ── Pipeline / Redirection
├─ 제어 ── Exit Status / Condition / Loop / Job / Signal
└─ 환경 ── Variable / Startup File / Working Directory

입력 → 해석·확장 → 명령 실행 → 종료 상태
                      │
                Process / I/O
별도 영역: PTY·Terminal / tmux / dotfiles
```

## 핵심 개념과 관계

### 명령 해석과 실행

Shell은 입력을 파싱하고 인용·확장 규칙을 적용한 뒤 Builtin·Function 또는 외부 명령을 실행한다. Pipeline과 Redirection은 명령의 표준 입출력을 연결하고, Exit Status는 조건 분기와 제어 흐름에 활용된다.

```text
Command Input
      │
Parsing / Quote / Expansion
      │
      ├─ Builtin / Function
      └─ External Command ──> Process
                │
       Pipe / Redirection
                │
        Exit Status → Control Flow
```

### 프로세스와 작업 제어

Shell의 Job Control은 Foreground·Background 작업과 프로세스 그룹을 다룬다. `&`, `jobs`, `fg`, `bg`는 작업 제어와 관련되지만 `nohup`은 신호 처리·출력 재지정에 관련되고, tmux는 터미널 작업공간을 유지한다. 이들을 동일한 단계로 취급하지 않는다.

### 환경과 초기화

환경변수, 현재 디렉터리, Login·Interactive 여부, Startup File은 명령의 실행 맥락을 결정한다. Shell Script는 이 기능들을 파일로 구성해 반복 실행하는 방식이며, CLI 인자 설계는 스크립트·프로그램의 외부 인터페이스에 해당한다.

## 필요한 경우 더 깊이 살펴보기

[스크립트 실행](./2026-07-04-first-shell-script.md), [Bash 문법](./2026-07-03-bash-syntax-guide.md), [CLI 인자](./2026-06-10-cli-positional-vs-flag.md), [백그라운드 작업](./2026-06-16-background-jobs-and-session.md)을 참고할 수 있다. 파이프·리다이렉션·셸 초기화처럼 독립 문서가 없는 핵심 개념도 지도에는 유지한다.

[Terminal](../terminal/2026-09-05-terminal-roadmap.md)은 PTY와 화면 입출력, [tmux](../tmux/2026-06-16-tmux-roadmap.md)는 작업공간, [dotfiles](./2026-07-08-dotfiles-roadmap.md)는 설정 재현을 다룬다. direnv·zoxide는 필요에 따라 사용하는 보조 도구다.
