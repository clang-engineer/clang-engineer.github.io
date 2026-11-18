---
title       : "MCP 서버 선택 — 필요한 도구·등록 범위·권한을 함께 판단하기"
description : "MCP 서버를 늘리기 전에 내장 도구와의 중복, 프로젝트·사용자 등록 범위, 로컬·원격의 권한과 신뢰 경계를 비교하고 용도별 후보를 고르는 기준을 정리한다."
date        : 2026-07-03 21:55:00 +0900
updated     : 2026-11-18 12:00:00 +0900
categories  : [ai, "MCP"]
tags        : [mcp, claude-code, model-context-protocol]
pin         : false
hidden      : false
redirect_from:
  - /posts/ai/2026-07-03-mcp-servers-catalog/
---

> 관련: [AI 개발 지형](./2026-07-03-ai-development-map.md)의 외부 연결 영역 · 개념은 [MCP 개념 정리](./2025-10-23-mcp.md), 첫 구현체는 [Serena 연결 경계](./2025-11-07-serena-mcp-client-integration.md)에서.

[MCP](./2025-10-23-mcp.md)를 이해했다고 여러 서버를 붙일 필요는 없다. 코딩 에이전트에 파일·셸·검색이 이미 있다면 같은 기능을 다시 노출해 Tool 설명과 권한 경계만 늘릴 수 있다. 먼저 **현재 없는 작업 능력과 필요한 접근 범위**를 정하고 서버를 고른다.

```text
해결할 작업
   ↓ 내장 도구로 충분한가?
부족한 외부 기능 확인
   ↓
서버의 제공자·권한·실행 위치 검토
   ↓
등록 Scope 결정 → 테스트 작업으로 검증 → 필요할 때만 유지
```

화살표는 도입 판단 순서다. 설치 개수보다 검증할 외부 연결이 얼마나 늘어나는지가 중요하다.

## 붙이는 문법

```bash
# 로컬 stdio 서버 (-- 뒤는 서버 실행 명령 그대로 전달)
claude mcp add playwright -- npx @playwright/mcp@latest

# 원격 HTTP 서버 (클라우드 서비스에 권장)
claude mcp add --transport http notion https://mcp.notion.com/mcp

# 관리
claude mcp list            # 등록된 서버 목록
claude mcp get <name>      # 한 서버 상세
claude mcp remove <name>
```

`--` 구분자가 중요하다 — 그 뒤 전부가 서버로 넘어간다. 없으면 Claude Code가 서버의 플래그(`--port` 등)를 자기 것으로 오해한다. 세션 안에서는 `/mcp`로 서버 상태·인증을 관리한다(원격 서버는 여기서 OAuth 브라우저 로그인).

## 스코프 — 어디까지 보이게 할까

| 스코프 | 로드 범위 | 팀 공유 | 저장 위치 |
|---|---|---|---|
| `local`(기본) | 현재 프로젝트만 | ✗ | `~/.claude.json` |
| `project` | 현재 프로젝트만 | ✓(버전관리) | 프로젝트 루트 `.mcp.json` |
| `user` | 내 모든 프로젝트 | ✗ | `~/.claude.json` |

```bash
claude mcp add --transport http --scope user example https://mcp.example.com/mcp
```

팀과 공유하려면 `--scope project`로 `.mcp.json`에 담아 커밋한다. 이 파일의 서버는 보안상 **첫 사용 전 명시적 승인**이 필요하다.

```json
{
  "mcpServers": {
    "playwright": { "command": "npx", "args": ["@playwright/mcp@latest"] }
  }
}
```

## 전송 방식

| 전송 | `--transport` | 성격 |
|---|---|---|
| **stdio** | `stdio` | 로컬 프로세스(npx/uvx/바이너리). 파일·시스템 직접 접근 |
| **HTTP** | `http` | 원격·클라우드에 권장. OAuth 지원, 자동 재연결 |
| ~~SSE~~ | `sse` | **폐기 예정** — HTTP를 쓸 것 |

## 쓸 만한 서버들

**프로토콜의 레퍼런스 구현** ([modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers))은 기능과 연결 구조를 살펴보는 출발점이다. 운영용 인증·보안·유지보수까지 보장한다는 의미는 아니다. 알려진 예시는 다음과 같고, 현재 유지 여부는 원본에서 확인한다.

- **filesystem** — 접근 제어가 붙는 파일 조작
- **git** — 저장소 읽기·검색·조작
- **fetch** — URL을 가져와 마크다운으로 변환
- **memory** — 지식 그래프 기반 지속 메모리
- **sequential-thinking** — 단계적 추론 스캐폴드
- **time** — 현재 시각·타임존 변환

> 예전 레퍼런스의 **GitHub·PostgreSQL·SQLite·Puppeteer·Slack·Sentry 서버는 아카이브**됐다. 아래 대체제를 쓴다.
{: .prompt-warning }

**용도별 검토 후보** — 인기 순위가 아니라 필요한 기능으로 고른다:

| 작업 | 후보 | 핵심 검토 |
|---|---|---|
| 저장소·이슈·PR | [GitHub MCP Server](https://github.com/github/github-mcp-server) | 읽기와 PR 생성 권한 분리, 조직 정책 |
| 브라우저 조작 | [Playwright MCP](https://github.com/microsoft/playwright-mcp) | 접근성 기반 조작과 브라우저 프로필·인증 상태 |
| 라이브러리 문서 | [Context7](https://github.com/upstash/context7) | 필요한 버전의 문서를 찾는지, 외부 전송 내용 |
| DB 질의 | [DBHub](https://github.com/bytebase/dbhub) | 읽기 전용 계정·허용 DB·질의 범위 |
| 코드 심볼 탐색 | [Serena](./2025-11-07-serena-mcp-client-integration.md) | 에이전트 내장 LSP와 중복되는지, 프로젝트 선택 |

공식 서버라는 말도 구분한다. MCP 프로젝트의 레퍼런스와 GitHub·Microsoft 같은 서비스 제공자의 서버는 주체가 다르다. 둘 중 어느 쪽도 등록한 자격 증명의 과도한 권한을 자동으로 줄여 주지는 않는다.

## 로컬 vs 원격 — 성격이 다르다

- **로컬(stdio)**: 클라이언트가 실행하는 프로세스다. 실행 계정의 파일·네트워크 접근 범위를 제한하고, 서버가 요구하는 자격 증명은 환경 변수 등 안전한 경로로 전달한다. 전송이 로컬이라는 사실이 외부 통신이 없다는 뜻은 아니다.
- **원격(HTTP)**: 별도 서버에 요청한다. 서버 운영자·인증 방식·OAuth Scope·재연결과 감사 정책을 확인한다. 모든 HTTP 서버가 같은 OAuth 흐름이나 운영 보장을 제공하는 것은 아니다.

## 보안 — 아무거나 붙이지 않는다

로컬 서버는 보통 실행 계정의 권한으로 동작하고, 원격 서버는 원격 환경의 권한과 전달된 자격 증명으로 동작한다. 어느 쪽이든 모델이 호출을 제안하는 것과 실제 실행을 승인하는 것을 구분한다.

- **신뢰하는 서버만.** 특히 외부 콘텐츠(웹·이슈·티켓·메일)를 가져오는 서버는 **프롬프트 인젝션** 페이로드를 실어 나를 수 있다.
- **OAuth 스코프를 좁게.** 업스트림이 광범위한 권한을 요구하면 필요한 범위로 제한한다.
- **시크릿은 커밋 금지.** `local`/`user` 스코프나 `.mcp.json`의 `${ENV_VAR}` 확장을 쓰고, 토큰을 커밋 파일에 하드코딩하지 않는다.
- 권한 규칙에서 도구 이름은 `mcp__<서버>__<도구>` 형태 — allow/deny 목록에 쓸 수 있다.

---

정리하면 — 등록 명령보다 먼저 **어떤 기능이 부족하고 누가 무엇에 접근할지**를 결정한다. 스코프·전송·신뢰를 함께 판단하고, 반복 CLI 참조는 [devkit Claude Code 치트시트](https://github.com/clang-engineer/devkit/blob/main/reference/cheatsheets/claude-code.md), 현재 등록·인증 계약은 [Claude Code MCP 문서](https://code.claude.com/docs/en/mcp)에서 확인한다. 개념 복습은 [MCP 개념 정리](./2025-10-23-mcp.md), 의미 기반 코드 검색 서버 하나를 제대로 세팅하는 흐름은 [Serena 연결 경계](./2025-11-07-serena-mcp-client-integration.md). 전체 경로는 [AI 개발 지형](./2026-07-03-ai-development-map.md).
