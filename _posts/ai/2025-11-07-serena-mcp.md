---
title       : Serena 기본 가이드
description : "코드베이스의 의미 기반 검색·편집을 지원하는 Serena의 설치, 프로젝트 설정과 인덱싱, Claude Code·Codex·OpenCode 연결 흐름을 정리한다."
date        : 2025-11-07 13:43:00 +0900
updated     : 2026-08-22 17:35:00 +0900
categories  : [ai, "MCP"]
tags        : [mcp, serena, claude, codex, opencode, model-context-protocol]
pin         : false
hidden      : false
redirect_from:
  - /posts/ai/2025-11-07-serena-mcp/
---

> 관련: [AI 로드맵](/posts/ai/2026-07-03-ai-roadmap/)의 **MCP** 갈래 · 개념은 [MCP 개념 정리](/posts/ai/2025-10-23-mcp/) · 장애 대응은 [Serena 트러블슈팅](/posts/ai/2026-08-22-serena-troubleshooting/)

Serena는 코드베이스의 **심볼과 구조를 이해해 검색·편집할 수 있도록 돕는 코딩 에이전트 도구**다. 기본적으로 언어 서버(Language Server)를 사용해 심볼 단위로 코드를 읽고 고치며, Claude Code·Codex·OpenCode 같은 MCP 클라이언트와 연결할 수 있다.

이 글은 Serena를 처음 연결해 쓰기 위한 기본 흐름에 집중한다.

```text
Serena 실행 환경 준비
  ↓
프로젝트 지정·인덱싱
  ↓
MCP 클라이언트에 등록
  ↓
연결 확인
  ↓
심볼 검색·편집에 사용
```

## 1. 가장 간단한 실행: `uvx`

로컬에 Serena 저장소를 직접 클론하지 않아도 `uvx`로 실행할 수 있다.

```bash
uvx --from git+https://github.com/oraios/serena \
  serena start-mcp-server
```

Claude Code에서 현재 프로젝트에 바로 등록하려면 프로젝트 루트에서 다음처럼 실행한다.

```bash
claude mcp add serena -- uvx --from git+https://github.com/oraios/serena \
  serena start-mcp-server --context claude-code --project "$(pwd)"
```

- `--context claude-code`: Claude Code 환경에 맞는 도구 구성을 사용한다.
- `--project "$(pwd)"`: 현재 디렉터리를 Serena 프로젝트로 지정한다.

## 2. 설치해서 여러 클라이언트에서 공용으로 쓰기

Claude Code·Codex·OpenCode에서 같은 Serena 실행 파일을 쓰고 싶다면 `uv tool`로 설치할 수 있다.

```bash
uv tool install serena-agent
SERENA="$(uv tool dir --bin)/serena"
```

여기서 중요한 것은 실행 파일의 **절대경로**다. 터미널에서는 `serena`가 실행되더라도 GUI 애플리케이션이나 이미 실행 중인 에이전트가 셸의 `PATH`를 그대로 상속하지 않을 수 있다. MCP 설정에는 실제 실행 파일 경로를 넣는 편이 안전하다.

## 3. 설정과 프로젝트

Serena 설정은 크게 전역 설정과 프로젝트 설정으로 나뉜다.

- 전역 설정: `~/.serena/serena_config.yml`
- 프로젝트 설정: 프로젝트 루트의 `.serena/project.yml`
- 실행 옵션: `--context`, `--mode`, `--project`, `--project-from-cwd` 등

CLI 기반 에이전트에서 현재 작업 디렉터리를 기준으로 프로젝트를 자동 찾고 싶다면 `--project-from-cwd`를 사용할 수 있다. Serena는 상위 디렉터리를 탐색하면서 가까운 `.serena/project.yml` 또는 `.git` 경계를 프로젝트로 선택한다.

### 프로젝트 활성화와 인덱싱

```bash
serena activate_project --project /path/to/my_project
serena project index
```

인덱싱은 큰 코드베이스의 첫 탐색 비용을 줄이는 데 도움이 된다. Serena는 언어 서버를 이용해 코드를 이해하므로 언어별 런타임이나 프로젝트 상태에 따라 첫 분석 시간이 달라질 수 있다.

## 4. Claude Code와 연결

### 프로젝트별 등록

```bash
claude mcp add serena -- uvx --from git+https://github.com/oraios/serena \
  serena start-mcp-server --context claude-code --project "$(pwd)"
```

### 사용자 범위 등록

설치한 Serena를 여러 프로젝트에서 공용으로 사용하려면 현재 디렉터리에서 프로젝트를 찾도록 등록할 수 있다.

```bash
claude mcp add --scope user serena -- \
  "$SERENA" start-mcp-server --context claude-code --project-from-cwd
```

Claude Code에서 `/mcp`로 `serena`가 연결됐는지 확인한 뒤 다음처럼 코드 구조를 묻거나 심볼을 찾아본다.

```text
이 프로젝트의 구조를 설명해줘.
authentication 관련 심볼을 찾아줘.
이 클래스의 참조 위치를 찾아줘.
```

Serena는 기본 설정에서 로컬 웹 대시보드도 띄운다. 기본 주소는 `http://localhost:24282/dashboard/index.html`이며 포트가 이미 사용 중이면 더 높은 포트를 사용할 수 있다.

## 5. Codex CLI와 연결

Codex에서는 `~/.codex/config.toml`에 Serena MCP 서버를 등록할 수 있다.

```toml
[mcp_servers.serena]
command = "uvx"
args = [
  "--from", "git+https://github.com/oraios/serena",
  "serena", "start-mcp-server",
  "--context", "codex"
]
```

Codex를 프로젝트 디렉터리에서 시작한 뒤 Serena에 현재 디렉터리를 활성화하도록 요청한다.

```text
Activate the current dir as project using serena
```

Serena 공식 문서에서 Codex에는 `codex` context를 사용하도록 안내한다. 대시보드가 자동으로 열리지 않으면 브라우저에서 직접 로컬 대시보드 주소를 열 수 있다.

## 6. OpenCode와 연결

OpenCode의 `opencode.json` 또는 `opencode.jsonc`에 로컬 MCP 서버를 추가한다. 설치한 Serena의 실제 절대경로를 사용하는 편이 안전하다.

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "serena": {
      "type": "local",
      "command": [
        "/absolute/path/to/serena",
        "start-mcp-server",
        "--context=ide",
        "--project-from-cwd"
      ],
      "enabled": true,
      "timeout": 30000
    }
  }
}
```

설정을 바꾼 뒤 OpenCode를 재시작하고 연결 상태를 확인한다.

```bash
opencode mcp list
```

클라이언트별 context와 설정 형식은 Serena·각 MCP 클라이언트의 버전에 따라 달라질 수 있으므로, 실제 적용 전 현재 공식 문서를 확인한다.

## 7. 여러 클라이언트를 함께 쓸 때

로컬 `stdio` 연결에서는 일반적으로 각 MCP 클라이언트가 자기 Serena 프로세스를 시작한다. 같은 프로젝트의 파일은 공유하지만 에이전트의 대화와 도구 실행 상태까지 공유하는 것은 아니다.

여러 에이전트가 같은 저장소를 동시에 편집한다면 MCP 프로세스 분리와 Git 작업 분리를 구분해야 한다. 독립 작업은 branch·worktree로 나눠 변경 충돌을 줄이는 편이 안전하다.

대시보드 오류, 남은 Serena 프로세스, Java/JDTLS 작업공간 문제처럼 운영 중 생기는 문제는 [Serena 트러블슈팅](/posts/ai/2026-08-22-serena-troubleshooting/)에서 별도로 다룬다.

## 8. 주요 명령어

| 명령 | 설명 |
| --- | --- |
| `serena config edit` | 전역 설정 파일 편집 |
| `serena start-mcp-server` | MCP 서버 실행 |
| `serena project index` | 프로젝트 인덱싱 |
| `serena activate_project` | 프로젝트 활성화 |
| `serena project health-check .` | 프로젝트와 언어 서버 상태 점검 |

## 9. 어디에 쓰는가

Serena의 핵심 가치는 단순 파일 검색보다 **코드 구조와 심볼 관계를 이용한 탐색·편집**에 있다.

```text
파일명·문자열 검색
  ↓
관련 파일 후보 찾기

Serena
  ↓
심볼 찾기
  ↓
정의·참조 관계 확인
  ↓
필요한 코드 범위만 읽고 편집
```

따라서 큰 코드베이스에서 특정 클래스·함수의 정의와 참조를 따라가거나, 에이전트가 불필요하게 많은 파일을 읽지 않도록 탐색 범위를 줄일 때 특히 유용하다.

MCP 자체가 왜 필요한지부터 보고 싶다면 [Model Context Protocol(MCP) 개념 정리](/posts/ai/2025-10-23-mcp/)로 돌아가면 된다.
