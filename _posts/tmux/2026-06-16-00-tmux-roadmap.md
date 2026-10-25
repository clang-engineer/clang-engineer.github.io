---
title       : "tmux 로드맵 — 구조·동작·설정·활용"
description : "tmux의 server·client와 session·window·pane 구조를 중심으로 핵심 동작, 설정, 세션 관리 및 활용 문서를 연결하는 개념지도."
date        : 2026-06-16 15:00:00 +0900
permalink   : /posts/tmux/2026-06-16-tmux-roadmap/
updated     : 2026-10-25 20:30:00 +0900
categories  : [tmux, "개요·인덱스"]
tags        : [roadmap, terminal]
pin         : false
hidden      : false
---

tmux는 하나의 터미널에서 여러 작업공간을 관리하고, 클라이언트가 연결을 끊어도 서버에 작업공간을 유지하는 터미널 멀티플렉서다. 이 로드맵은 명령어 목록보다 **구성요소의 관계와 주요 사용 흐름**을 먼저 보여준다. 이 지도는 게시글 유무와 관계없이 tmux의 핵심 개념과 관계를 보여준다. 필요한 원리와 사용 예만 아래 문서에서 더 깊이 살펴본다.

## 전체 지도

```text
tmux — 터미널 멀티플렉서
│
├─ Server (작업공간·PTY 상태 관리)
│  ├─ Session ── Window를 참조하는 작업공간
│  │                 │
│  │                 └─ Window ── Pane들의 레이아웃
│  │                               └─ Pane ── PTY + 실행 프로그램
│  └─ Socket ── Client와 통신
│
└─ Client ── Server에 접속해 Session을 표시·조작

핵심 관계
├─ attach / detach ── Client 연결 상태 변화
├─ Window·Pane 조작 ── 레이아웃·PTY 배치 변화
├─ Session·Server 종료 ── 작업공간 수명 변화
└─ 설정·Hook·Plugin ── 동작의 구성·확장

선택적 활용: 반복 배치 자동화 / 세션 탐색 / 에이전트 관제
```

이 그림의 들여쓰기는 구성요소의 포함·관리 관계를 간략화한 것이다. client는 session 안에 포함되는 요소가 아니라 server에 연결하는 별도 구성요소다. pane은 프로세스 자체가 아니며, 각 pane에 연결된 PTY에서 셸이나 프로그램이 실행된다. 또한 하나의 window를 여러 session에서 참조할 수 있으므로 단순한 소유 트리로만 이해하지 않는다.

## 핵심 개념과 관계

### 연결과 작업공간의 수명

tmux Client는 Socket을 통해 Server에 연결한다. Server가 Session·Window·Pane과 각 Pane의 PTY를 관리하므로 Client를 detach해도 작업공간은 유지될 수 있다. Session이 종료되거나 Server가 종료되는 것은 Client 연결 해제와 다른 사건이다.

```text
Terminal Emulator → tmux Client ──socket──> tmux Server
                                            │
                                      Session ↔ Window
                                                  │
                                                 Pane
                                                  │
                                                 PTY
                                                  │
                                            Shell / Program
```

Window는 여러 Session에서 참조될 수 있다. Pane은 프로세스가 아니라 PTY와 연결된 터미널 영역이다.

### 유지·재현·탐색의 차이

이미 실행 중인 Session에 재접속하는 것, 새로운 Session과 Layout을 다시 만드는 것, 여러 Session 중 하나를 선택하는 것은 서로 다른 작업이다. `attach/detach`는 연결을, Session 구성 스크립트는 재현을, Session Picker는 탐색을 담당한다.

### 설정과 확장

tmux의 옵션·Key Binding·Hook은 기본 동작을 조정한다. Plugin은 이를 조합해 기능을 확장할 수 있으며, TPM은 Plugin 관리 도구다. Oh My Tmux는 사전 구성된 설정을 제공하는 선택지이지 tmux 실행에 필수인 계층이 아니다.

## 필요한 경우 더 깊이 살펴보기

[기본 조작](./2021-11-30-tmux-config.md), [설정·TPM](./2025-11-17-tmux-tpm.md), [세션 구성](./2026-02-21-tmux-bootstrap.md), [sesh](./2026-07-12-sesh-tmux-session-picker.md), [플러그인 제작](./2026-07-09-tmux-plugin-authoring.md)을 필요할 때 참고한다. PTY는 [Terminal](../terminal/2026-09-05-00-terminal-roadmap.md), Shell 작업 제어는 [Shell](../shell/2026-07-03-00-shell-roadmap.md), 환경 설정 재현은 [dotfiles](../shell/2026-07-08-00-dotfiles-roadmap.md)의 영역이다.
