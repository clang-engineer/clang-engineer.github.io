---
title       : Claude Code 정리
description : "터미널에서 동작하는 Anthropic의 AI 코딩 도구 Claude Code의 특징과 설치, 핵심 기능·권한 모드·키보드 단축키·MCP 연동·CLAUDE.md 활용을 정리한다."
date        : 2025-10-24 09:47:55 +0900
updated     : 2026-06-19 00:00:00 +0900
categories  : [ai, "Claude Code"]
tags        : [claude, claude-code]
pin         : false
hidden      : false
---

## 📌 Claude Code란?

Claude Code는 터미널에서 직접 실행되는 AI 코딩 도구로, 자연어 명령으로 코드 작성·디버깅·Git 워크플로우를 수행한다. 별도 IDE나 채팅 창 없이 현재 작업 디렉토리에서 바로 동작한다.

- **터미널 통합** — 익숙한 개발 환경에서 바로 작업
- **실행 가능** — 파일 편집, 명령 실행, 커밋 생성 등 직접 액션 수행
- **프로젝트 인식** — 전체 코드베이스 구조 파악
- **MCP 통합** — Google Drive, Slack 등 외부 데이터소스 연동
- **Unix 철학** — 파이프로 조합·스크립트화 가능 (`claude -p`)

---

## 🚀 설치

npm으로 설치하려면 Node.js 18 이상이 필요하다 (네이티브 설치 프로그램을 쓰면 Node.js 불필요).

```bash
npm install -g @anthropic-ai/claude-code

cd your-project       # 프로젝트로 이동
claude                # 실행 — 처음이면 로그인 프롬프트
```

---

## 💡 주요 기능

### 1. 기능 구축
원하는 기능을 자연어로 설명하면 계획을 세우고 코드를 작성한다.

```text
> 사용자 로그인 기능을 JWT 토큰 방식으로 추가해줘
```

### 2. 디버깅
버그 증상이나 에러 로그를 붙여넣으면 코드베이스를 분석해 수정한다.

```text
> 로그인할 때 500 에러가 나. 에러 로그: [에러 내용]
```

### 3. 코드베이스 탐색

```text
> 인증 로직이 어디에 구현돼 있어?
> 이 함수가 어떻게 동작하는지 설명해줘
```

### 4. 지루한 작업 자동화
Lint 수정, merge conflict 해결, release notes 작성, 문서 업데이트 등.

---

## ⌨️ 입력 모드와 단축키

### 입력 첫 글자로 모드 전환

| 입력 | 기능 |
|------|------|
| `!` | Bash 모드 — 쉘 명령 직접 실행 |
| `/` | 슬래시 명령 모드 |
| `@` | 파일 경로 참조 (자동완성) |

> 메모리에 기록은 `/memory` 명령으로 한다.

### 편집·제어 단축키

| 단축키 | 기능 |
|--------|------|
| `Shift + Tab` | 권한 모드 순환 (아래 *권한 모드* 참고) |
| `Shift + Enter` | 줄바꿈 (전송 안 함) |
| `Tab` | 프롬프트 자동완성 |
| `Option/Alt + T` | 확장 사고(extended thinking) 토글 |
| `Ctrl + T` | Todo 목록 표시 |
| `Ctrl + O` | 트랜스크립트(상세 출력) 토글 |
| `Ctrl + V` | 이미지 붙여넣기 |
| `ESC ESC` | 입력 지우기 / 되감기(rewind) |

---

## 🎮 권한 모드

작업 승인 정책은 하나의 "모드"로 묶여 있고, `Shift + Tab` 으로 순환한다.

- **default** — 파일 변경·명령 실행 전마다 승인 요청 (가장 안전)
- **acceptEdits** — 파일 편집은 자동 수락, 위험한 bash 명령은 여전히 승인
- **plan** — 코드를 건드리지 않고 계획만 수립 (복잡한 변경 전 전략 짜기)

이 밖에 `auto` / `bypassPermissions` 모드가 있다. 시작 시 직접 지정하거나, 권한 규칙을 관리할 수도 있다.

```bash
claude --permission-mode plan          # 특정 모드로 시작
claude --dangerously-skip-permissions  # 모든 권한 우회 (주의!)
> /permissions                         # 허용/거부 규칙 관리
```

---

## 🛠️ 주요 명령어

```bash
claude                       # 대화형 실행
claude -p "버그를 찾아 수정해줘"  # 헤드리스(print) 모드 — 실행 후 종료
claude --continue            # 또는 -c. 최근 대화 이어가기
```

슬래시 명령 전체 목록(기본/설정/Git/계정/통합 + 커스텀 커맨드)은 [Claude Code 슬래시 명령어 사전](/posts/ai/2025-10-24-claude-code-slash-commands/)에 따로 정리했다.

---

## 🔌 MCP (Model Context Protocol)

MCP로 Claude Code를 외부 데이터소스·도구와 연결한다.

```bash
claude mcp add <name> -- <command...>   # 서버 추가 (stdio)
claude mcp list                         # 등록된 서버 목록
claude mcp get <name>                   # 서버 설정 확인
claude --debug                          # MCP 포함 디버그 로그
```

프로젝트 루트에 `.mcp.json` 을 두면 팀 전체가 공유한다.

```json
{
  "mcpServers": {
    "puppeteer": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-puppeteer"]
    }
  }
}
```

---

## 📋 베스트 프랙티스

### CLAUDE.md 로 프로젝트 컨텍스트 제공
프로젝트 루트의 `CLAUDE.md` 는 매 세션 자동으로 읽힌다. 기술 스택·코딩 규칙·디렉토리 구조를 적어 두면 매번 설명할 필요가 없다.

```markdown
# 프로젝트 개요
Next.js 기반 전자상거래 플랫폼.

## 코딩 규칙
- 함수형 컴포넌트, TypeScript strict
- 테스트 커버리지 80% 이상

## 구조
- `/app` 앱 라우터 · `/components` 컴포넌트 · `/lib` 유틸
```

### 복잡한 작업은 단계로 나눠 진행
연구 → 계획 → 구현 → 문서화. plan 모드로 계획을 먼저 받고 검토한 뒤 구현시키면 큰 변경의 사고를 줄인다.

### Sub-Agents 로 작업 분담
`/agents` 로 코드 리뷰어·테스터 등 전문화된 서브 에이전트를 만든다. 각자 자체 지침과 권한을 가진다.

### 파이프라인으로 조합
```bash
tail -f app.log | claude -p "에러나 이상 징후가 보이면 요약해줘"
```

---

## 🔧 설정과 통합

### 설정 파일 위치
- 전역: `~/.claude/settings.json`
- 프로젝트: `.claude/settings.json` (공유) · `.claude/settings.local.json` (개인 override)

### 컨텍스트 윈도우
Claude Code는 최신 Claude 모델(Opus·Sonnet 계열)을 사용한다. `[1m]` 컨텍스트를 지원하는 모델·플랜에서는 최대 1M 토큰까지 쓸 수 있다. 다만 효율을 위해 필요한 파일만 포함하고, 큰 `CLAUDE.md` 는 작은 문서로 쪼개는 게 좋다.

### IDE 통합
VS Code·JetBrains(IntelliJ, PyCharm 등) 확장이 있어 터미널 없이도 사용할 수 있다.

### 비용
Claude API 토큰을 표준 API 가격으로 사용한다 (Claude 구독 또는 API 키 기반 과금).

---

## 🆘 트러블슈팅

- **응답 없음** — `curl https://api.anthropic.com` 로 연결 확인 후 재시작
- **MCP 서버 문제** — `claude mcp list` / `claude mcp get <name>` 로 설정 확인, `claude --debug` 로 로그 확인

---

## 📚 추가 리소스

- [Claude Code 공식 문서](https://docs.claude.com/en/docs/claude-code)
- [Claude Code GitHub](https://github.com/anthropics/claude-code)
- [Claude Code 베스트 프랙티스](https://www.anthropic.com/engineering/claude-code-best-practices)
