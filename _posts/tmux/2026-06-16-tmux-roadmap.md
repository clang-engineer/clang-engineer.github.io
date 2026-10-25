---
title       : "tmux 로드맵 — 구조·동작·설정·활용"
description : "tmux의 server·client와 session·window·pane 구조를 중심으로 핵심 동작, 설정, 세션 관리 및 활용 문서를 연결하는 개념지도."
date        : 2026-06-16 15:00:00 +0900
updated     : 2026-10-25 18:30:00 +0900
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

## 관계를 따라 이해하기

### 연결과 작업공간은 별개다

```text
Terminal Emulator
       │
   tmux Client ── Socket ── tmux Server
                               │
                            Session
                               │
                             Window
                               │
                          Pane (PTY)
                               │
                        Shell / Program
```

`attach`와 `detach`는 Client의 연결 상태를 바꾸며, Server에 남아 있는 Session·Pane을 종료하지 않는다. Session·Window·Pane의 대상 지정과 기본 조작은 [Devkit tmux](https://github.com/clang-engineer/devkit/blob/main/reference/cheatsheets/tmux.md)에서 확인한다. PTY 자체는 [Terminal 로드맵](../terminal/2026-09-05-terminal-roadmap.md), Shell의 작업 제어는 [셸 로드맵](../shell/2026-07-03-shell-roadmap.md)의 영역이다.

### 작업공간의 유지와 재현은 다르다

```text
이미 실행 중인 작업
    └─ detach / attach → 같은 Session에 재접속

작업공간을 새로 구성
    └─ 설정·스크립트·smug → Session/Window/Pane 생성

여러 작업공간 중 선택
    └─ sesh → 기존 Session 탐색 또는 새 Session 시작
```

따라서 세션이 살아 있는 문제와 작업공간을 다시 만드는 문제를 혼동하지 않는다. [세션 부트스트랩](./2026-02-21-tmux-bootstrap.md)은 재현, [sesh](./2026-07-12-sesh-tmux-session-picker.md)는 탐색·전환을 다룬다.

### 기본 기능에서 확장으로

```text
tmux 기본 기능
   │
   ├─ tmux.conf / Key Binding / Hook → 동작 조정
   ├─ TPM / Plugin → 추가 기능
   └─ Oh My Tmux → 사전 구성된 설정 선택지
```

설정과 플러그인의 경계는 [tmux 설정·TPM](./2025-11-17-tmux-tpm.md), 사전 구성 선택은 [Oh My Tmux](./2026-07-12-oh-my-tmux.md)를 참고한다. [추가 플러그인](./2026-07-11-tmux-plugins-beyond-essentials.md)은 필요할 때만 살펴본다.

### 응용은 필수 학습 단계가 아니다

Plugin 제작은 [CLI·Hook 기반 확장](./2026-07-09-tmux-plugin-authoring.md), 여러 에이전트 작업의 관찰은 [상태 감지](./2026-07-09-tmux-ai-agent-status-detection.md), Pane 간 입력 전달은 [선택 텍스트 보내기](./2026-07-11-tmux-send-selection-to-agent-pane.md)로 연결된다. 에이전트 자체의 동작은 [AI 로드맵](../ai/2026-07-03-ai-roadmap.md)에서 다룬다.

**읽는 기준:** 구조와 연결 상태를 먼저 이해하고, 실제로 필요한 작업공간 관리·설정·응용으로만 내려간다. 모든 글을 순서대로 읽을 필요는 없다.
