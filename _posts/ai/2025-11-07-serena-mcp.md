---
title       : Serena 기본 가이드
description : "코드베이스의 의미 기반 검색·편집을 지원하는 MCP 서버 Serena의 설치, 서버 실행, 설정 파일 구조, 프로젝트 활성화와 인덱싱, Claude Code·Codex 연동 흐름을 정리한다."
date        : 2025-11-07 13:43:00 +0900
updated     : 2026-06-19 11:00:00 +0900
categories  : [ai, "MCP"]
tags        : [mcp, serena, claude, model-context-protocol]
pin         : false
hidden      : false
redirect_from:
  - /posts/ai/2025-11-07-serena-mcp/
---

## Serena 기본 가이드

> 관련: [AI 로드맵](/posts/ai/2026-07-03-ai-roadmap/)의 **MCP** 갈래 · 개념은 [MCP 개념 정리](/posts/ai/2025-10-23-mcp/), 여러 서버 붙이기는 [MCP 서버 더 붙이기](/posts/ai/2026-07-03-mcp-servers-catalog/)

> Serena는 코드베이스 내에서 **의미 기반(semantic) 검색·편집**을 가능하게 하는 MCP 서버다.
> 내부적으로 LSP(Language Server Protocol)를 써서 심볼 단위로 코드를 읽고 고치므로,
> Claude Code·Codex 같은 LLM 코딩 에이전트와 함께 쓸 때 토큰 효율과 수정 정확도가 크게 올라간다. ([GitHub][1])

> **빠른 시작(Claude Code)**: 프로젝트 루트에서 아래 한 줄이면 끝이다. 자세한 설명은 5장 참고.
>
> ```bash
> claude mcp add serena -- uvx --from git+https://github.com/oraios/serena \
>   serena start-mcp-server --context ide-assistant --project $(pwd)
> ```

---

## 1. 설치 (로컬 방식)

저장소를 직접 클론해서 쓰는 방식이다. `uvx`로 원격 실행할 거면 이 단계는 건너뛰어도 된다.

```bash
git clone https://github.com/oraios/serena
cd serena
```

설정 파일은 선택적으로 미리 손볼 수 있다.

```bash
uv run serena config edit
```

건드리지 않아도 첫 실행 시 기본 설정 파일이 자동 생성된다.

---

## 2. 서버 실행

```bash
uv run serena start-mcp-server
```

백그라운드나 외부 디렉토리에서 실행할 경우 디렉토리를 명시해 주는 것이 좋다.

```bash
uv run --directory /abs/path/to/serena serena start-mcp-server
```

---

## 3. 설정(Configuration)

Serena는 설정으로 동작 방식과 통합 클라이언트를 조정한다.

- **일반 설정**: 홈 디렉토리의 `~/.serena/serena_config.yml`
- **프로젝트 설정**: 프로젝트 루트의 `.serena/project.yml`
- **실행 옵션**: `--context`, `--mode` 등으로 동작 맥락(Context)·모드(Mode)를 지정

> `--context`는 어떤 클라이언트에 붙는지를 알려 툴 구성을 맞춘다.
> 코딩 에이전트(Claude Code 등)에는 `ide-assistant`, Codex에는 `codex`를 쓴다.

---

## 4. 프로젝트 활성화 및 인덱싱

특정 코드베이스에서 제대로 쓰려면 프로젝트를 활성화하고 인덱싱하는 것이 좋다.

```bash
# 프로젝트 활성화
uv run serena activate_project --project /path/to/my_project

# 인덱싱
uv run serena project index
```

인덱싱을 하지 않으면 첫 사용 시 처리 속도가 느릴 수 있다.

---

## 5. Claude Code와 통합

### 5.1. 권장: `claude mcp add` 한 줄

프로젝트 루트에서 아래를 실행하면 로컬 설치 없이 `uvx`가 Serena를 받아 MCP 서버로 등록한다.

```bash
claude mcp add serena -- uvx --from git+https://github.com/oraios/serena \
  serena start-mcp-server --context ide-assistant --project $(pwd)
```

- `--context ide-assistant` : 코딩 에이전트용 툴 구성을 잡아준다.
- `--project $(pwd)` : 현재 디렉토리를 프로젝트로 지정해 인덱싱·검색 범위를 고정한다.
- 사용자 범위로 등록하려면 `-s user`를 붙인다.

### 5.2. 확인 및 사용

Claude Code에서 `/mcp`로 `serena`가 연결됐는지 확인한 뒤, 새 대화에서 이렇게 시켜 본다.

- "이 프로젝트의 구조를 설명해줘"
- "authentication 관련 코드를 찾아줘"
- "error handling 패턴을 보여줘"

Serena가 코드베이스를 의미적으로 분석해 관련 코드를 찾아준다. 서버는 로그·종료용 웹 대시보드
(`http://localhost:24282/dashboard/index.html`)도 함께 띄운다.

---

## 6. 주요 명령어 요약

| 명령 | 설명 |
| --- | --- |
| `serena config edit` | 설정 파일 편집 |
| `serena start-mcp-server` | MCP 서버 실행 |
| `serena project index` | 프로젝트 인덱싱 |
| `serena activate_project` | 프로젝트 활성화 |
| `serena tools list` | 사용 가능한 툴 목록 확인 |

---

## 7. Codex CLI에서 사용하기

Serena는 Claude뿐 아니라 **Codex CLI**(MCP 클라이언트)에서도 그대로 쓸 수 있다.
`~/.codex/config.toml`에 서버 실행 커맨드를 등록하면 된다.

### 7.1 사전 준비

```bash
# Codex CLI 설치
npm install -g @openai/codex@latest
codex login

# uv 설치 (Serena 실행용)
curl -LsSf https://astral.sh/uv/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"   # 셸 프로파일에도 추가
```

### 7.2 config.toml에 Serena 등록

`~/.codex/config.toml`(없으면 생성)에 다음을 추가한다.

```toml
[mcp_servers.serena]
command = "uvx"
args = [
  "--from", "git+https://github.com/oraios/serena",
  "serena", "start-mcp-server",
  "--context", "codex"
]

# (옵션) 기동·툴 실행 타임아웃
startup_timeout_sec = 120
tool_timeout_sec    = 600
```

`--context codex`는 Codex 전용 툴 구성을 잡아주므로 꼭 붙인다.

### 7.3 연결 확인 및 프로젝트 활성화

```bash
codex          # TUI 실행
```

TUI 안에서 `/mcp` 입력 → 목록에 `serena`가 보이면 연결 성공.
그 다음 대화 안에서 다음처럼 말해 현재 디렉토리를 프로젝트로 활성화한다.

> "Activate the current dir as project using serena"

활성화 후엔 `~/.serena/serena_config.yml`과 `<프로젝트>/.serena/project.yml`이 생성되어 다음부턴 자동 인식된다.

### 7.4 Codex + Serena 팁

- **대시보드**: `http://localhost:24282/dashboard/index.html`에 세션 로그가 뜬다. Codex가 브라우저를 못 띄우면 직접 열면 된다.
- **`failed` 표시 무시**: Codex UI에서 Serena 툴 실행이 `failed`로 보여도 실제로는 잘 동작하는 알려진 버그가 있다. Serena 공식 문서에도 명시돼 있다.
- **사전 인덱싱**: 큰 레포라면 첫 호출 속도를 위해 `uvx --from git+https://github.com/oraios/serena serena project index`를 한 번 돌려두면 검색이 훨씬 빨라진다.

---

## 8. 정리

```bash
# 로컬 클론 방식
git clone https://github.com/oraios/serena
cd serena
uv run serena start-mcp-server

# 또는 Claude Code에 한 줄로 등록 (uvx 원격 실행)
claude mcp add serena -- uvx --from git+https://github.com/oraios/serena \
  serena start-mcp-server --context ide-assistant --project $(pwd)
```

지원하는 MCP 클라이언트(Claude Code, Codex CLI 등)에서 Serena 서버를 연결하면 의미 기반 코드 검색·편집을 쓸 수 있다.

MCP 프로토콜 자체의 개념은 [Model Context Protocol(MCP) 개념 정리](/posts/ai/2025-10-23-mcp/) 참고.

---

[1]: https://github.com/oraios/serena "GitHub - oraios/serena: A powerful coding agent toolkit providing semantic retrieval and editing capabilities (MCP server & other integrations)"
