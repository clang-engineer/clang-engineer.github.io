---
title       : Serena 기본 가이드
description : 
date        : 2025-10-23 13:43:00 +0900
updated     : 2025-11-07 23:41:28 +0900
categories  : [dev, ai]
tags        : [ai, mcp, serena, claude, anthrophic, model-context-protocol]
pin         : false
hidden      : false
---

# Serena 기본 가이드

> Serena는 코드베이스 내에서 의미 기반(semantic) 검색·편집을 가능하게 하는 도구로, 특히 Claude Code 등 LLM(대형 언어모델)과 함께 이용될 때 효과가 큽니다. ([GitHub][1])

---

## 1. 설치 (로컬 방식)

```bash
git clone https://github.com/oraios/serena
cd serena
```

위 명령으로 저장소를 내려받고 프로젝트 폴더로 이동합니다. ([GitHub][1])
그 다음, 설정 파일을 수정할 수 있습니다(선택):

```bash
uv run serena config edit
```

설정을 건드리지 않아도 다음 명령 실행 시 자동으로 기본 설정 파일이 생성됩니다. ([GitHub][1])

---

## 2. 서버 실행

```bash
uv run serena start-mcp-server
```

위 명령으로 Serena의 MCP 서버를 실행할 수 있습니다. ([GitHub][1])
백그라운드나 외부 디렉토리에서 실행할 경우에는 다음처럼 디렉토리를 명시해 주는 것이 좋습니다:

```bash
uv run --directory /abs/path/to/serena serena start-mcp-server
```

([GitHub][1])

---

## 3. 설정(Configuration)

Serena는 설정을 통해 동작 방식이나 통합되는 클라이언트 등을 조정할 수 있습니다. ([GitHub][1])

- 사용자 홈 디렉토리(`~/.serena/serena_config.yml`)에 일반 설정 파일이 위치합니다. ([GitHub][1])
- 프로젝트 단위 설정 파일(`.serena/project.yml`)도 존재합니다. ([GitHub][1])
- 서버 실행 시 `--context`, `--mode` 등의 옵션으로 동작 맥락(Context)이나 모드(Mode)를 지정할 수 있습니다. ([GitHub][1])

---

## 4. 프로젝트 활성화 및 인덱싱

Serena를 특정 코드 베이스에서 제대로 활용하기 위해서는 프로젝트를 활성화하고 인덱싱하는 것이 좋습니다. ([GitHub][1])

```bash
# 프로젝트 활성화 예시
uv run serena activate_project --project /path/to/my_project

# 인덱싱 예시
uv run serena project index
```

인덱싱을 하지 않으면 첫 사용 시 처리 속도가 느릴 수 있습니다. ([GitHub][1])

---

## 5. Claude Code와 통합

Serena를 Claude Code의 MCP 서버로 추가하여 코드베이스에서 의미 기반 검색 및 편집 기능을 사용할 수 있습니다. ([GitHub][1])

### 5.1. MCP 서버 시작

Serena의 MCP 서버를 저장소에서 직접 실행합니다:

```bash
uv run serena start-mcp-server
```

이 명령은 로그 및 종료를 위한 웹 대시보드(`http://localhost:24282/dashboard/index.html`)와 함께 로컬 서버를 시작합니다. ([GitHub][1])

### 5.2. Claude Code에 Serena 추가

터미널에서 Serena를 MCP 서버로 Claude Code에 추가합니다:

```bash
claude mcp add-json "serena" '{"command":"uvx","args":["--from","git+https://github.com/oraios/serena","serena-mcp-server"]}'
```

이 명령은 Claude Code에 로컬 설치 없이 Serena의 MCP 서버를 사용하도록 지시합니다. ([GitHub][1])

### 5.3. 테스트하기

Claude Code를 열고 새 대화를 시작한 다음, 다음과 같은 명령을 시도해 볼 수 있습니다:

- "이 프로젝트의 구조를 설명해줘"
- "authentication 관련 코드를 찾아줘"
- "error handling 패턴을 보여줘"

Serena가 코드베이스를 의미적으로 분석하여 관련 코드를 찾아줍니다. ([GitHub][1])

---

## 6. 주요 명령어 요약

- `serena config edit` : 설정 파일을 편집
- `serena start-mcp-server` : MCP 서버 실행
- `serena project index` : 프로젝트 인덱싱
- `serena activate_project` : 프로젝트 활성화
- `serena tools list` : 사용할 수 있는 도구(툴)의 목록 확인 ([GitHub][1])

---

## 7. 간단 사용 예시

```bash
git clone https://github.com/oraios/serena
cd serena
# (선택) 설정 수정
uv run serena config edit
# 서버 실행
uv run serena start-mcp-server
```

이제 지원하는 MCP 클라이언트(Claude Code 등)에서 Serena 서버를 연결하면 코드 검색·편집 기능을 활용할 수 있습니다.

---

[1]: https://github.com/oraios/serena "GitHub - oraios/serena: A powerful coding agent toolkit providing semantic retrieval and editing capabilities (MCP server & other integrations)"
