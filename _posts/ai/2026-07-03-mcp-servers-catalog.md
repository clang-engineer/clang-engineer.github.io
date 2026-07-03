---
title       : "MCP 서버 더 붙이기 — claude mcp add와 쓸 만한 서버들"
description : "MCP 개념과 Serena를 넘어, Claude Code에 여러 MCP 서버를 붙이는 실전. claude mcp add 문법과 스코프(local·project·user), 전송 방식, 공식 레퍼런스 서버와 인기 서드파티(GitHub·Playwright·Context7·DB), 그리고 신뢰·보안 주의점을 정리한다."
date        : 2026-07-03 21:55:00 +0900
updated     : 2026-07-03 21:55:00 +0900
categories  : [ai, "MCP"]
tags        : [mcp, claude-code, model-context-protocol]
pin         : false
hidden      : false
---

> 관련: [AI 로드맵](/posts/ai/2026-07-03-ai-roadmap/)의 **저변·원리** 갈래 · 개념은 [MCP 개념 정리](/posts/ai/2025-10-23-mcp/), 첫 구현체는 [Serena 기본 가이드](/posts/ai/2025-11-07-serena-mcp/)에서.

[MCP가 무엇인지](/posts/ai/2025-10-23-mcp/) 잡고 [Serena](/posts/ai/2025-11-07-serena-mcp/) 하나를 붙여봤다면, 이제 **여러 서버를 실제로 등록하고 관리**하는 단계다. 이 글은 Claude Code에 MCP 서버를 붙이는 문법과, 붙일 만한 서버들, 그리고 보안 주의점을 정리한다.

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
claude mcp add --transport http --scope user context7 https://...   # 어디서나
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

**공식 레퍼런스** ([modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)) — 현재 유지되는 것:

- **filesystem** — 접근 제어가 붙는 파일 조작
- **git** — 저장소 읽기·검색·조작
- **fetch** — URL을 가져와 마크다운으로 변환
- **memory** — 지식 그래프 기반 지속 메모리
- **sequential-thinking** — 단계적 추론 스캐폴드
- **time** — 현재 시각·타임존 변환

> 예전 레퍼런스의 **GitHub·PostgreSQL·SQLite·Puppeteer·Slack·Sentry 서버는 아카이브**됐다. 아래 대체제를 쓴다.
{: .prompt-warning }

**인기 서드파티**:

- **GitHub** — `github-mcp-server`(공식). 요즘은 호스티드 원격 서버로 붙이는 게 일반적. 저장소·이슈·PR·코드리뷰
- **Playwright** — `@playwright/mcp`(Microsoft 공식). 접근성 트리 기반 브라우저 자동화(스크린샷 아님)
- **Context7** — `@upstash/context7-mcp`. 최신·버전별 라이브러리 문서를 컨텍스트에 주입
- **DB** — `@bytebase/dbhub`(다중 DB). 레퍼런스 Postgres/SQLite가 아카이브됐으니 여기로

## 로컬 vs 원격 — 성격이 다르다

- **로컬(stdio)**: 내 머신에서 npx/uvx로 실행. 파일·시스템 직접 접근, 시크릿은 `--env`로, OAuth 없음.
- **원격(호스티드 HTTP)**: URL에 접속, `/mcp`에서 OAuth 인증, 벤더가 유지·자동 재연결. SaaS 통합은 이쪽으로 가는 추세.

## 보안 — 아무거나 붙이지 않는다

MCP 서버는 **클라이언트와 같은 권한**에서 돈다. 잘못 붙이면 곧 LLM이 파일·계정을 마음대로 만지는 결과다.

- **신뢰하는 서버만.** 특히 외부 콘텐츠(웹·이슈·티켓·메일)를 가져오는 서버는 **프롬프트 인젝션** 페이로드를 실어 나를 수 있다.
- **OAuth 스코프를 좁게.** 업스트림이 광범위한 권한을 요구하면 필요한 범위로 제한한다.
- **시크릿은 커밋 금지.** `local`/`user` 스코프나 `.mcp.json`의 `${ENV_VAR}` 확장을 쓰고, 토큰을 커밋 파일에 하드코딩하지 않는다.
- 권한 규칙에서 도구 이름은 `mcp__<서버>__<도구>` 형태 — allow/deny 목록에 쓸 수 있다.

---

정리하면 — **붙이는 건 `claude mcp add` 한 줄**이지만, 스코프·전송·신뢰를 함께 판단해야 한다. 개념 복습은 [MCP 개념 정리](/posts/ai/2025-10-23-mcp/), 의미 기반 코드 검색 서버 하나를 제대로 세팅하는 흐름은 [Serena 기본 가이드](/posts/ai/2025-11-07-serena-mcp/). 전체 경로는 [AI 로드맵](/posts/ai/2026-07-03-ai-roadmap/).
