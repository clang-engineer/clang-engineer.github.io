---
title       : Serena 기본 가이드
description : "코드베이스의 의미 기반 검색·편집을 지원하는 MCP 서버 Serena의 설치, 서버 실행, 설정 파일 구조, 프로젝트 활성화와 인덱싱, Claude Code·Codex·OpenCode 연동 흐름을 정리한다."
date        : 2025-11-07 13:43:00 +0900
updated     : 2026-07-23 14:00:07 +0900
categories  : [ai, "MCP"]
tags        : [mcp, serena, claude, codex, opencode, model-context-protocol]
pin         : false
hidden      : false
redirect_from:
  - /posts/ai/2025-11-07-serena-mcp/
---

## Serena 기본 가이드

> 관련: [AI 로드맵](/posts/ai/2026-07-03-ai-roadmap/)의 **MCP** 갈래 · 개념은 [MCP 개념 정리](/posts/ai/2025-10-23-mcp/), 여러 서버 붙이기는 [MCP 서버 더 붙이기](/posts/ai/2026-07-03-mcp-servers-catalog/)

> Serena는 코드베이스 내에서 **의미 기반(semantic) 검색·편집**을 가능하게 하는 MCP 서버다.
> 내부적으로 LSP(Language Server Protocol)를 써서 심볼 단위로 코드를 읽고 고치므로,
> Claude Code·Codex·OpenCode 같은 LLM 코딩 에이전트와 함께 쓸 때 토큰 효율과 수정 정확도가 크게 올라간다. ([GitHub][1])

> **빠른 시작(Claude Code)**: 프로젝트 루트에서 아래 한 줄이면 끝이다. 자세한 설명은 5장 참고.
>
> ```bash
> claude mcp add serena -- uvx --from git+https://github.com/oraios/serena \
>   serena start-mcp-server --context claude-code --project "$(pwd)"
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

### 여러 클라이언트에서 공용으로 쓸 때

Claude Code·Codex·OpenCode에 같은 Serena 설치를 연결하려면 `uv tool`로 한 번 설치한다.

```bash
uv tool install serena-agent
SERENA="$(uv tool dir --bin)/serena"
```

여기서 중요한 것은 `SERENA`의 **절대경로**다. 터미널에서 `serena`가 실행되더라도 GUI나 이미 실행 중인 코딩 에이전트는 `.zshrc`·`.bashrc`의 `PATH`를 상속하지 않을 수 있다. Serena 공식 문서도 이런 경우 MCP 설정에 실행 파일의 전체 경로를 넣으라고 권장한다. ([클라이언트 연결 문서][2])

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
> Claude Code에는 `claude-code`, Codex에는 `codex`, 그 밖의 IDE형 코딩 에이전트에는 `ide`를 쓴다.

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
  serena start-mcp-server --context claude-code --project "$(pwd)"
```

- `--context claude-code` : Claude Code와 겹치는 기본 파일 도구를 줄인다.
- `--project "$(pwd)"` : 현재 디렉토리를 프로젝트로 지정해 인덱싱·검색 범위를 고정한다.
- 사용자 범위로 등록하려면 `-s user`를 붙인다.

모든 프로젝트에서 공용으로 쓸 때는 설치 단계에서 구한 절대경로와 `--project-from-cwd`를 쓴다.

```bash
claude mcp add --scope user serena -- \
  "$SERENA" start-mcp-server --context claude-code --project-from-cwd
```

### 5.2. 확인 및 사용

Claude Code에서 `/mcp`로 `serena`가 연결됐는지 확인한 뒤, 새 대화에서 이렇게 시켜 본다.

- "이 프로젝트의 구조를 설명해줘"
- "authentication 관련 코드를 찾아줘"
- "error handling 패턴을 보여줘"

Serena가 코드베이스를 의미적으로 분석해 관련 코드를 찾아준다. 기본 설정에서는 로그·종료용 웹
대시보드(`http://localhost:24282/dashboard/index.html`)도 함께 띄운다.

### 5.3 여러 클라이언트에서 동시에 사용할 때

로컬 `stdio`(standard input/output, 표준 입출력으로 프로세스끼리 통신하는 방식) 연결에서는
Claude Code·Codex·OpenCode가 **각자 Serena 프로세스**를 시작한다. 하나의 Serena 세션에 여러
클라이언트가 붙는 구조가 아니다.

| 대상 | 공유 여부 |
| --- | --- |
| 같은 프로젝트의 소스 파일 | 공유됨. 디스크의 변경이 다른 클라이언트에도 보인다. |
| `.serena/` 설정과 저장된 memory(세션 밖에 보존하는 프로젝트 메모) | 디스크에서는 공유되지만 다른 세션이 자동으로 읽지는 않는다. |
| 에이전트의 대화·분석·수정 이유 | 공유되지 않는다. |
| LSP 런타임·도구 호출 이력·대시보드 | 클라이언트별로 독립적이다. |

여러 프로세스가 동시에 실행되면 대시보드 포트는 충돌을 피해 `24282`, `24283`, `24284`처럼
증가한다. 대시보드는 유지하되 시작할 때마다 브라우저 탭이 열리는 것만 막으려면
`~/.serena/serena_config.yml`을 다음처럼 설정한다.

```yaml
web_dashboard: true
web_dashboard_open_on_launch: false
```

대시보드 서버 자체를 끄는 설정과 브라우저 자동 열기를 끄는 설정은 서로 다르다. ([대시보드 문서][3])

이 격리는 장애와 프로세스 수명 주기를 분리하지만, 병렬 에이전트의 작업 충돌까지 막아주지는
않는다. 같은 프로젝트를 동시에 편집한다면 독립 작업은 Git branch와
worktree(독립 작업 디렉터리)로 나누고, 같은 함수나 설정 파일을 건드리는 작업은 한 에이전트에
맡기는 편이 낫다.

### 5.4 대시보드에 `Error loading ...`이 표시될 때

대시보드의 외형은 보이는데 configuration·stats·executions가 모두 `Error loading ...`이라면,
정적 HTML을 연 뒤 Serena 백엔드 프로세스가 종료된 **stale tab**(이미 끝난 서버의 남은 탭)일 수
있다. 브라우저에 로드된 화면은 남지만 내부 API 요청은 더 이상 응답받지 못한다.

주소창의 실제 포트로 서버와 listener(포트를 열고 요청을 기다리는 프로세스)를 확인한다.

```bash
curl -i --max-time 5 http://127.0.0.1:24282/dashboard/index.html
lsof -nP -iTCP:24282 -sTCP:LISTEN
pgrep -fl '[s]erena'
```

포트를 듣는 프로세스가 없고 `curl`도 `Couldn't connect to server`라면 설정 파싱 오류가 아니라
종료된 Serena 탭이다. MCP 클라이언트에서 Serena를 재시작하고 새로 출력된 dashboard URL을
연다. listener가 살아 있다면 그때 Serena 로그와 브라우저 Network 탭에서 실패한 API 응답을
확인한다.

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

## 8. OpenCode에서 사용하기

글로벌 설정 `~/.config/opencode/opencode.json` 또는 `opencode.jsonc`에 local MCP 서버를 추가한다. OpenCode는 설정 문자열의 `{env:HOME}`을 환경변수로 치환한다.

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "serena": {
      "type": "local",
      "command": [
        "{env:HOME}/.local/bin/serena",
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

`~/.local/bin`은 `uv`의 기본 tool 경로다. `uv tool dir --bin` 결과가 다르면 첫 번째 command를 그 절대경로로 바꾼다. 설정은 시작할 때 한 번 읽으므로 OpenCode를 완전히 재시작한 뒤 확인한다.

```bash
opencode mcp list
```

### 연결 확인이 프로젝트 파일을 바꿀 수 있다

`--project-from-cwd`는 현재 디렉토리에서 `.serena/project.yml`이나 `.git`을 찾아 프로젝트를 자동 활성화한다. 이때 Serena 버전이 바뀌었다면 기존 `.serena/project.yml`의 설명·필드를 새 형식으로 갱신할 수 있다.

연결 상태만 확인하려는 테스트는 작업 저장소가 아닌 임시 Git 저장소에서 실행하면 추적 파일이 뜻밖에 바뀌는 일을 피할 수 있다.

```bash
check_dir="$(mktemp -d)"
git -C "$check_dir" init
(cd "$check_dir" && opencode mcp list)
rm -rf "$check_dir"
```

---

## 9. 정리

```bash
# 로컬 클론 방식
git clone https://github.com/oraios/serena
cd serena
uv run serena start-mcp-server

# 또는 Claude Code에 한 줄로 등록 (uvx 원격 실행)
claude mcp add serena -- uvx --from git+https://github.com/oraios/serena \
  serena start-mcp-server --context claude-code --project "$(pwd)"
```

지원하는 MCP 클라이언트(Claude Code, Codex CLI, OpenCode 등)에서 Serena 서버를 연결하면 의미 기반 코드 검색·편집을 쓸 수 있다. 여러 클라이언트에 전역 등록할 때는 셸 `PATH` 대신 Serena 실행 파일의 절대경로를 쓰는 편이 안전하다.

MCP 프로토콜 자체의 개념은 [Model Context Protocol(MCP) 개념 정리](/posts/ai/2025-10-23-mcp/) 참고.

---

[1]: https://github.com/oraios/serena "GitHub - oraios/serena: A powerful coding agent toolkit providing semantic retrieval and editing capabilities (MCP server & other integrations)"
[2]: https://oraios.github.io/serena/02-usage/030_clients.html "Connecting Your MCP Client - Serena Documentation"
[3]: https://oraios.github.io/serena/02-usage/060_dashboard.html "The Serena Dashboard - Serena Documentation"
