---
title       : "AI 개발 지형 — 코딩 도구·외부 연결·API 개발의 세 축"
description : "AI 개발 글을 코딩 도구 사용, 외부 리소스 연결(MCP), 모델 API 개발이라는 서로 다른 축으로 나눈다. 하나의 학습 순서를 제시하기보다 목적에 맞는 실전 영역을 찾는 인덱스다."
date        : 2026-07-03 21:30:00 +0900
updated     : 2026-09-06 19:00:00 +0900
categories  : [ai, "개요·인덱스"]
tags        : [ai, index, claude-code, mcp, claude]
pin         : false
hidden      : false
---

AI 개발 도구를 익힐 때 서로 다른 질문을 한 줄에 놓기 쉽다.

```text
어떤 AI 코딩 도구를 쓸까?
→ Product / Workflow 선택

도구가 외부 File·DB·API를 어떻게 사용할까?
→ MCP / Tool 연결

내 Application에 Model을 어떻게 넣을까?
→ Model API 개발
```

이 세 질문은 **발전 단계가 아니라 서로 다른 축**이다. Claude Code를 잘 쓰기 위해 Claude API를 직접 다룰 필요는 없고, MCP는 Claude Code뿐 아니라 다른 MCP Client에서도 사용할 수 있다. 반대로 API를 직접 쓰는 Application이 Claude Code를 사용하지 않을 수도 있다.

따라서 이 문서는 학습 순서를 강제하는 Roadmap이 아니라, AI 관련 실전 글에서 현재 필요한 영역을 찾기 위한 **지형도이자 인덱스**다.

## 한눈에 보기

```text
AI 개발 지형
│
├─ 1. 코딩 도구 사용
│   └─ Claude Code
│       ├─ 개요
│       ├─ 명령·Memory
│       └─ Workflow·Hook
│
├─ 2. 외부 연결
│   └─ MCP
│       ├─ Protocol
│       ├─ Serena
│       └─ Server 확장
│
├─ 3. Application 개발
│   └─ Claude API
│       └─ Messages / Streaming / Tool Use / Cache
│
└─ 별도 사용자 Surface
    └─ claude.ai Web
```

| 영역 | 답하는 질문 | 관계 |
|---|---|---|
| 도구 지형 | 어떤 Form Factor와 제품을 선택할까 | 공통 탐색점 |
| Claude Code | Terminal Agent를 일상 개발에 어떻게 쓸까 | 도구 사용 축 |
| MCP | AI Client와 외부 Resource를 어떻게 표준 연결할까 | 필요할 때 탐색 |
| Claude API | 내가 만드는 Application에서 Model을 어떻게 호출할까 | 개발자 영역 |
| claude.ai Web | Browser Product의 기능을 어떻게 사용할까 | 별도 Surface |

## 0. 도구 지형 — 먼저 선택 좌표를 잡는다

| 글 | 핵심 |
|---|---|
| [AI 코딩 도구 지형도](./2026-07-03-ai-coding-tools-landscape.md) | Claude Code·OpenCode·Cursor·Copilot·Codex·Aider를 사용 환경, 모델 종속성, 과금, Open Source 여부로 비교 |

가장 먼저 보는 축은 "누가 더 좋나"가 아니라 **어디에서 어떤 방식으로 작업할 것인가**다.

```text
Terminal Agent
→ Claude Code / OpenCode / Codex CLI / Aider

Editor 중심
→ Cursor

기존 IDE Plugin
→ Copilot

Remote / Cloud Task
→ 제품별 Cloud Agent
```

여기서 선택한 뒤 아래 영역 중 필요한 곳만 본다.

## 1. 코딩 도구 사용 — Claude Code

이 블로그에서 가장 깊게 다루는 Practice 축이다.

### 1-1. 도구의 위치와 기본 계약

| 글 | 핵심 |
|---|---|
| [Claude Code 정리](./2025-10-24-claude-code.md) | Terminal Agent의 역할, 설치, 권한, 기본 기능, `CLAUDE.md`, MCP 연결의 위치 |

먼저 "AI Chat"이 아니라 **Repository를 읽고 Tool을 실행하며 변경을 수행하는 Agent Harness**라는 위치를 잡는다.

### 1-2. 매일 쓰기 — 명령과 Memory

| 글 | 핵심 |
|---|---|
| [Claude Code 슬래시 명령어 사전](./2025-10-24-claude-code-slash-commands.md) | Slash Command Reference와 Custom Command |
| [Claude Code 메모리 시스템 정리](./2026-03-12-claude-code-memory.md) | `CLAUDE.md`와 지속 Context의 역할 분리 |

> 📎 **치트시트** · [claude-code](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/claude-code.md) — 반복 명령 빠른 참조
{: .prompt-tip }

Reference를 모두 외우는 것이 아니라:

```text
현재 Session 조작
→ Command

Repository 규칙·지속 Context
→ Memory / CLAUDE.md
```

처럼 책임을 구분한다.

### 1-3. Workflow와 자동화

| 글 | 핵심 |
|---|---|
| [Claude Code 실전 워크플로](./2026-07-03-claude-code-workflow.md) | Plan, Subagent, 병렬 Tool, Headless 실행을 작업 흐름으로 조합 |
| [Claude Code hooks — 실행 흐름에 셸 끼우기](./2026-07-03-claude-code-hooks-custom-commands.md) | Tool 실행 전후 자동화, 정책·Format·알림·보안 경계 |

```text
사람이 방향·완료조건 설정
        ↓
Agent가 탐색·수정·검증
        ↓
Hook / CI가 반복 가능한 Guardrail 제공
```

Claude Code 사용 흐름은 여기서 한 번 정리된다. MCP와 API는 이 다음 "레벨"이 아니라 필요에 따라 옆으로 확장하는 별도 축이다.

## 2. 외부 연결 — MCP

MCP의 질문은 **코딩 Agent를 잘 쓰는 법**이 아니라, AI Client가 외부 Tool·Resource를 어떤 공통 계약으로 발견하고 호출할지다.

| 글 | 핵심 |
|---|---|
| [Model Context Protocol(MCP) 개념 정리](./2025-10-23-mcp.md) | MCP Client/Server, Tool·Resource·Prompt, Transport와 보안 경계 |
| [Serena 기본 가이드](./2025-11-07-serena-mcp.md) | Codebase 의미 검색·편집 MCP Server를 실제 Client에 연결 |
| [MCP 서버 더 붙이기](./2026-07-03-mcp-servers-catalog.md) | Server 등록 Scope, Transport, GitHub·Browser·DB 등 확장 시 신뢰 경계 |

이 영역 내부에서는 실제 순서가 있다.

```text
Protocol이 무엇인가
→ 구현체 하나를 연결
→ 여러 Server로 확장
→ 권한·신뢰 경계 관리
```

하지만 **Claude Code → MCP** 자체가 필수 선행 관계는 아니다. Claude Code는 MCP 없이도 사용할 수 있고, MCP는 다른 Client에서도 사용된다.

## 3. Application 개발 — Claude API

| 글 | 핵심 |
|---|---|
| [Claude API 기초](./2026-07-03-claude-api-basics.md) | Messages API, Model 선택, Streaming, Tool Use, Prompt Cache, Token Count |

API는 Claude Code 내부를 배우는 "더 낮은 단계"가 아니라 **내 Software가 Model Provider를 직접 호출하는 별도 개발 경로**다.

```text
내 Application
    ↓ HTTP / SDK
Model API
    ↓
Model Inference
```

여기서는 다음 질문이 중요하다.

- Request/Response 계약을 어떻게 설계할까?
- Streaming이 필요한가?
- Tool Call을 Application이 어떻게 실행할까?
- Context와 Cache를 어떻게 관리할까?
- 비용·Latency·Failure를 어떻게 관측할까?

### MCP와 API는 어디서 만나는가

둘은 계층 관계로 단순화하지 않는다.

```text
Model API Tool Use
→ Application이 Tool 호출 Loop를 직접 구현할 수 있음

MCP
→ Client와 Tool Provider 사이의 발견·호출 계약을 표준화
```

API 기반 Application이 MCP Client를 구현할 수도 있고, Claude Code 같은 완성된 Client가 MCP Server를 사용할 수도 있다. 즉 **조합되는 축**이다.

## 별도 Surface — claude.ai Web

| 글 | 핵심 |
|---|---|
| [claude.ai 웹 지형](./2026-07-13-claude-ai-web-tour.md) | Projects·Artifacts·Connectors·Skills/Routines 등 Browser Product Surface의 역할 |

Web UI는 CLI의 초급판이 아니다. 같은 Model 생태계의 **다른 Product Surface**다. Browser 중심으로 작업할 때 바로 들어가면 된다.

## 무엇을 찾고 있는가

```text
어떤 AI 코딩 도구를 쓸지 모르겠다
→ 도구 지형도

Claude Code를 일상 개발에 쓰고 싶다
→ Claude Code 개요
→ 명령·Memory
→ Workflow·Hook

GitHub·DB·Browser·Codebase Tool을 AI Client에 연결하고 싶다
→ MCP 개념
→ 구현체 하나
→ Server 확장

내 서비스에 Model 기능을 직접 넣고 싶다
→ Claude API

Browser Product만 정리하고 싶다
→ claude.ai Web 지형
```

Terminal Agent를 오래 쓰는 경우 셸·Session 환경 자체가 생산성에 영향을 준다. 이 부분은 [셸 로드맵](../shell/2026-07-03-shell-roadmap.md)과 [tmux 로드맵](../tmux/2026-06-16-tmux-roadmap.md)의 책임이다.

> **AI 글은 하나의 필수 학습 사다리가 아니다. 도구 사용, 외부 연결, Application 개발이라는 서로 다른 질문을 분리하고 현재 목적에 필요한 영역만 탐색한다.**
