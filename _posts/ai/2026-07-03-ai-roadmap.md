---
title       : "AI 로드맵 — 도구 지형도에서 Claude Code·MCP·API까지 읽는 순서"
description : "AI 코딩 도구를 개발 워크플로에 들이는 주제별 인덱스. 도구 지형도(왜 Claude Code인가)에서 시작해 Claude Code를 매일 쓰고 실전으로 확장하고, MCP로 외부를 연결하고, 그 아래 Claude API까지 — 이 블로그의 AI 글을 단계별로 큐레이션한다."
date        : 2026-07-03 21:30:00 +0900
updated     : 2026-07-03 22:00:00 +0900
categories  : [ai, "개요·인덱스"]
tags        : [roadmap, ai, claude-code, mcp, claude]
pin         : false
hidden      : false
---

AI 코딩 도구는 "채팅창에 붙여넣기"에서 멈추기 쉽다. 그런데 터미널에서 도구로 들이기 시작하면 — 어느 도구를 고르고, 무엇을 매일 호출하고, 프로젝트 맥락을 어떻게 기억시키고, 외부 리소스를 어떻게 연결하고, 그 아래 API를 어떻게 직접 다루느냐 — 작업 방식 자체가 달라진다. 이 로드맵은 이 블로그의 AI 글을 그 흐름대로 묶은 인덱스다. **지형도·비교 → Claude Code → MCP → API**, 처음이라면 위에서부터 순서대로 읽으면 된다.

## 입문 — 도구 지형도부터

무엇을 설치하기 전에, 지금 뭐가 있고 왜 Claude Code인지부터. 폼팩터로 갈리는 선택지를 훑고 진입한다.

| 글 | 핵심 |
|---|---|
| [AI 코딩 도구 지형도](/posts/ai/2026-07-03-ai-coding-tools-landscape/) | Claude Code·Cursor·Copilot·Codex·Aider를 폼팩터(터미널·에디터·플러그인·클라우드)·모델 종속성·과금·오픈소스 네 축으로 비교. "왜 이 도구인가"를 잡는 진입점 |

여기서 "터미널 에이전트 vs 에디터 vs 클라우드"의 갈림길을 잡고 나면, 이 블로그가 왜 Claude Code에 집중하는지가 선명해진다.

## Claude Code — 도구 익히기

### 1단계 — 무엇을 하는 도구인가

| 글 | 핵심 |
|---|---|
| [Claude Code 정리](/posts/ai/2025-10-24-claude-code/) | 터미널에서 동작하는 Anthropic의 AI 코딩 도구. 설치·핵심 기능·권한 모드·단축키·MCP 연동·CLAUDE.md 활용까지 전체 개요 |

### 2단계 — 매일 쓰기: 명령과 메모리

반복해서 치는 명령과 프로젝트 맥락을 다루는 단계. 명령으로 조작하고, 메모리로 "매번 다시 설명하는" 낭비를 없앤다.

| 글 | 핵심 |
|---|---|
| [Claude Code 슬래시 명령어 사전](/posts/ai/2025-10-24-claude-code-slash-commands/) | 기본/설정/프로젝트/Git/계정/통합 카테고리로 묶은 슬래시 명령어 전체 사전. 필요할 때 찾아 쓰는 레퍼런스 |
| [Claude Code 메모리 시스템 정리](/posts/ai/2026-03-12-claude-code-memory/) | `CLAUDE.md`(프로젝트 규칙)와 Auto Memory(대화 간 지속되는 사실)로 컨텍스트를 관리. 매번 같은 배경을 다시 설명하지 않게 만드는 축 |

### 3단계 — 실전 워크플로와 확장

조작법에서 활용법으로. 큰 작업을 안전·빠르게 굴리고, 도구 자체를 프로젝트에 맞게 확장한다.

| 글 | 핵심 |
|---|---|
| [Claude Code 실전 워크플로](/posts/ai/2026-07-03-claude-code-workflow/) | 플랜 모드로 전략 먼저, 서브에이전트로 컨텍스트 격리, 병렬 도구 실행, 헤드리스(`claude -p`)로 스크립트·CI에 태우기 |
| [Claude Code 확장하기 — hooks와 커스텀 슬래시 명령](/posts/ai/2026-07-03-claude-code-hooks-custom-commands/) | `settings.json`의 hooks로 실행 전후에 셸을 끼우고(포맷·차단·알림), `.claude/commands`로 반복 프롬프트를 명령 하나로 |

## MCP — 외부로 확장

도구 안 사용에 익숙해지면 다음은 **"바깥의 무엇을 연결하느냐"**다. 개념(프로토콜)을 잡고, 구현체 하나로 감을 굳히고, 여러 서버로 넓힌다.

| 글 | 핵심 |
|---|---|
| [Model Context Protocol(MCP) 개념 정리](/posts/ai/2025-10-23-mcp/) | AI 모델과 외부 리소스를 잇는 오픈 프로토콜. 통신·구조·전송·보안을 최신 스펙 기준으로. 구현체를 보기 전 잡아야 할 줄기 |
| [Serena 기본 가이드](/posts/ai/2025-11-07-serena-mcp/) | 코드베이스의 **의미 기반** 검색·편집 MCP 서버. 설치·실행·설정·인덱싱·Claude Code 연동. 개념이 실제로 붙는 첫 구현체 |
| [MCP 서버 더 붙이기](/posts/ai/2026-07-03-mcp-servers-catalog/) | `claude mcp add` 문법과 스코프(local·project·user), 전송 방식, 쓸 만한 서버들(GitHub·Playwright·Context7·DB), 신뢰·보안 주의 |

## 저변 — Claude API

도구 아래에 무엇이 있는지. 직접 앱에 Claude를 붙일 때의 최소 지형이다.

| 글 | 핵심 |
|---|---|
| [Claude API 기초](/posts/ai/2026-07-03-claude-api-basics/) | 모델 ID·가격, Messages API 기본 요청, adaptive thinking·effort, 스트리밍, tool use, 프롬프트 캐싱, 토큰 카운팅을 공식 SDK 기준으로 |

MCP는 이 tool use를 **표준 프로토콜로** 감싼 것이다 — API의 도구 사용을 이해하고 나면 MCP가 왜 필요한지가 함께 읽힌다.

---

본인 위치에 따라:

- **어느 도구를 쓸지 아직 못 정했다면** 입문 지형도부터.
- **Claude Code를 깔았는데 겉핥기라면** 2단계(명령·메모리) → 3단계(워크플로·확장). 체감 차이가 가장 크다.
- **코드베이스·외부 리소스를 물려 쓰고 싶다면** MCP 갈래(개념 → Serena → 서버 확장).
- **직접 앱에 Claude를 붙인다면** 저변의 API 기초로.

Claude Code는 터미널 도구다. 터미널 환경 자체(세션·창·셸)를 함께 다듬으면 궁합이 좋다 — [tmux 로드맵](/posts/tmux/2026-06-16-tmux-roadmap/)과 [셸 로드맵](/posts/shell/2026-07-03-shell-roadmap/)을 곁에 두면 AI 도구를 얹을 바탕이 단단해진다.
