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

## 1. 구조와 핵심 동작

**먼저 확인할 질문:** server와 client는 무엇이 다르며, detach 후에도 작업공간이 남는 이유는 무엇인가? window와 pane은 어떤 단위인가?

- [tmux 기본 조작 Cheat Sheet](./2021-11-30-tmux-config.md) — session·window·pane, attach/detach, 기본 조작과 대상 지정 문법

PTY와 터미널 에뮬레이터 자체의 구조는 [Terminal 로드맵](../terminal/2026-09-05-terminal-roadmap.md), 셸 프로세스와 작업 제어는 [셸 로드맵](../shell/2026-07-03-shell-roadmap.md)에서 다룬다.

## 2. 설정과 플러그인

**핵심 질문:** tmux 기본 기능 중 무엇을 설정으로 바꾸고, 어떤 기능을 플러그인으로 보완할까?

- [tmux 설정과 TPM 플러그인](./2025-11-17-tmux-tpm.md) — 설정 파일과 TPM, 대표 플러그인
- [Oh My Tmux!](./2026-07-12-oh-my-tmux.md) — 설정을 직접 조합하는 대신 배포판을 활용하는 선택지
- [추가 tmux 플러그인](./2026-07-11-tmux-plugins-beyond-essentials.md) — 필요에 따라 고르는 확장 기능

Oh My Tmux는 필수 후속 단계가 아니라 직접 설정과 비교할 대안이다.

## 3. 세션 관리와 자동화

**핵심 질문:** 기존 세션을 유지하는 것, 같은 작업공간을 다시 만드는 것, 여러 세션 중 하나를 선택하는 것은 어떻게 다른가?

- [tmux 세션 부트스트랩](./2026-02-21-tmux-bootstrap.md) — 반복 가능한 세션·레이아웃 구성과 세션 매니저
- [sesh 세션 피커](./2026-07-12-sesh-tmux-session-picker.md) — 디렉터리·저장소 기반으로 세션을 찾아 전환

tmux 자체의 세션 유지와 외부 도구를 통한 레이아웃 재생성은 서로 다른 문제다.

## 4. 필요할 때 확장

다음은 tmux 입문에 필수인 학습 단계가 아니라 특정 목적이 있을 때 살펴볼 응용 주제다.

- [tmux 플러그인 제작](./2026-07-09-tmux-plugin-authoring.md) — 스크립트·tmux CLI·hook을 이용한 확장
- [tmux로 AI 에이전트 관제](./2026-07-09-tmux-ai-agent-status-detection.md) — 여러 작업의 상태를 확인하는 활용 사례
- [tmux 선택을 AI 에이전트 pane으로 전달](./2026-07-11-tmux-send-selection-to-agent-pane.md) — 선택한 텍스트를 다른 pane으로 보내는 작업 흐름

AI 에이전트 자체의 구조와 사용법은 [AI 로드맵](../ai/2026-07-03-ai-roadmap.md)을 참고한다.

## 학습 경로와 문서 경계

처음에는 **구조와 핵심 동작 → 설정** 순서로 읽으면 된다. 이후 반복 작업공간 구성이 필요하면 세션 관리로, 특정 기능을 구현하려면 해당 응용 글로 이동한다. 모든 문서를 순서대로 읽을 필요는 없다.

명령·옵션을 빠르게 찾아볼 때는 [devkit tmux cheatsheet](https://github.com/clang-engineer/devkit/blob/main/reference/cheatsheets/tmux.md)를 사용한다. 설정을 여러 환경에서 재현하는 문제는 [dotfiles 로드맵](../shell/2026-07-08-dotfiles-roadmap.md)의 영역이다.
