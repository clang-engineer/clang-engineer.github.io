---
title       : "Serena 트러블슈팅 — 다중 클라이언트·대시보드·JDTLS 오류"
description : "Serena를 Claude Code·Codex·OpenCode와 함께 쓸 때 생길 수 있는 다중 프로세스, 대시보드 stale tab, Java JDTLS 작업공간 오류를 진단하는 순서를 정리한다."
date        : 2026-08-22 17:35:00 +0900
updated     : 2026-08-22 17:35:00 +0900
categories  : [ai, "MCP"]
tags        : [mcp, serena, troubleshooting, jdtls, claude-code, codex, opencode]
pin         : false
hidden      : false
---

> 관련: 기본 설치·연결은 [Serena 기본 가이드](/posts/ai/2025-11-07-serena-mcp/) · 프로토콜 개념은 [MCP 개념 정리](/posts/ai/2025-10-23-mcp/)

이 글은 Serena의 설치법이 아니라 **이미 연결한 Serena가 이상하게 동작할 때 어디부터 확인할지**를 다룬다. 기본 원칙은 MCP 연결, Serena 프로세스, 언어 서버를 한꺼번에 같은 문제로 보지 않고 층을 나눠 확인하는 것이다.

```text
MCP 클라이언트
  ↓
Serena 프로세스
  ↓
프로젝트 활성화
  ↓
언어 서버(LSP)
  ↓
프로젝트별 작업공간·캐시
```

## 1. 여러 클라이언트에서 동시에 사용할 때

로컬 `stdio` 연결에서는 Claude Code·Codex·OpenCode가 **각자 Serena 프로세스**를 시작한다. 하나의 Serena 세션을 여러 클라이언트가 공유하는 구조가 아니다.

| 대상 | 공유 여부 |
| --- | --- |
| 같은 프로젝트의 소스 파일 | 공유된다. 디스크의 변경이 다른 클라이언트에도 보인다. |
| `.serena/` 설정과 저장된 memory | 디스크에서는 공유되지만 다른 세션이 자동으로 같은 대화 상태를 갖지는 않는다. |
| 에이전트의 대화·분석·수정 이유 | 공유되지 않는다. |
| LSP 런타임·도구 호출 이력·대시보드 | 클라이언트별로 독립적이다. |

Serena 공식 문서도 여러 에이전트가 서로 다른 프로젝트에서 작업한다면 각 클라이언트가 `stdio` 방식으로 자기 서버를 시작하는 구성을 권장한다.

같은 프로젝트를 여러 에이전트가 동시에 편집한다면 Serena 프로세스가 분리돼 있다는 것만으로 변경 충돌이 막히지는 않는다. 독립 작업은 Git branch와 worktree(독립 작업 디렉터리)로 나누고, 같은 함수나 설정 파일을 동시에 고치는 작업은 피하는 편이 안전하다.

## 2. 대시보드 포트와 자동 열기

Serena는 기본적으로 로컬 웹 대시보드를 띄운다. 기본 포트는 `24282`이며 이미 사용 중이면 더 높은 포트를 사용할 수 있다.

대시보드는 유지하되 시작할 때 브라우저 탭이 자동으로 열리는 것만 막으려면 `~/.serena/serena_config.yml`에서 다음처럼 설정한다.

```yaml
web_dashboard: true
web_dashboard_open_on_launch: false
```

대시보드 서버를 끄는 것과 브라우저 자동 열기를 끄는 것은 다른 설정이다.

## 3. 대시보드에 `Error loading ...`이 표시될 때

대시보드 외형은 보이는데 configuration·stats·executions가 모두 `Error loading ...`이라면, 브라우저에 정적 HTML만 남고 Serena 백엔드 프로세스가 이미 종료된 경우부터 확인한다.

주소창의 실제 포트를 기준으로 서버와 listener(포트를 열고 요청을 기다리는 프로세스)를 확인한다.

```bash
curl -i --max-time 5 http://127.0.0.1:24282/dashboard/index.html
lsof -nP -iTCP:24282 -sTCP:LISTEN
pgrep -fl '[s]erena'
```

포트를 듣는 프로세스가 없고 `curl`도 연결하지 못한다면 Serena를 재시작하고 새로 출력된 대시보드 주소를 연다. listener가 살아 있다면 Serena 로그와 브라우저 Network 탭에서 실패한 API 응답을 확인한다.

## 4. “Serena 없이 계속할까요?”가 반복될 때

에이전트가 Serena를 사용할 수 없다고 말해도 MCP 연결 자체가 끊겼다고 바로 결론 내리지 않는다. Serena 프로세스는 살아 있지만 내부 언어 서버가 시작에 실패하면 심볼 검색·편집 도구가 연쇄적으로 실패할 수 있다.

Java 프로젝트에서는 다음 오류가 함께 나타나는지 확인한다.

```text
The language server manager is not initialized
LanguageServerTerminatedException
ObjectNotFoundException: Tree element '.../DeletedFile.java' not found
```

이 조합이 보이면 JDTLS의 Eclipse 작업공간 메타데이터가 현재 프로젝트 상태와 어긋났는지 확인한다. 클라이언트만 재시작해도 프로젝트별 작업공간이 그대로 남아 있으면 같은 오류가 반복될 수 있다.

먼저 같은 프로젝트를 사용하는 MCP 클라이언트를 종료하고 JDTLS 로그에서 오류가 발생한 작업공간을 찾는다.

```bash
rg -n 'ObjectNotFoundException|LanguageServerTerminatedException' \
  ~/.serena/language_servers/static/EclipseJDTLS/workspaces/*/data_dir/.metadata/.log
```

문제가 특정 프로젝트 작업공간으로 좁혀졌다면 `workspaces` 전체나 `~/.gradle/caches`를 지우기보다 해당 디렉터리만 이름을 바꿔 보관한 뒤 다시 시작한다.

```bash
cache="$HOME/.serena/language_servers/static/EclipseJDTLS/workspaces/<project-hash>"
mv "$cache" "$cache.backup-$(date +%Y%m%d-%H%M%S)"

serena project health-check .
```

`health-check`가 통과하면 MCP 클라이언트를 하나만 먼저 시작해 Serena 도구 호출을 확인한다. 이후 병렬 작업이 필요하면 worktree로 작업 경로와 변경 범위를 분리한다.

> JDTLS 내부 경로와 Serena의 캐시 구조는 버전에 따라 바뀔 수 있다. 위 절차를 적용하기 전에 현재 Serena 로그와 설정에서 실제 경로를 확인한다.
{: .prompt-warning }

## 5. Serena 버전과 프로젝트 설정을 함께 확인한다

Serena 버전이 바뀐 뒤 처음 실행하면 프로젝트 설정 형식이 갱신될 수 있다. 문제를 재현하거나 업그레이드한 뒤에는 작업 저장소의 `git status`를 확인해 `.serena/project.yml` 같은 설정 파일이 의도치 않게 바뀌지 않았는지 본다.

`uv tool` 설치가 특정 버전에 고정돼 있다면 업그레이드 명령이 기대한 버전으로 올리지 못할 수 있으므로 실제 버전을 먼저 확인한다.

```bash
serena --version
uv tool list
```

## 6. 진단 순서

문제가 생겼을 때는 넓은 캐시 삭제부터 하지 않고 아래 순서로 범위를 좁힌다.

```text
1. MCP 클라이언트에서 Serena가 등록돼 있는가
2. Serena 프로세스가 실제로 살아 있는가
3. 현재 프로젝트가 활성화됐는가
4. Serena 로그에 언어 서버 오류가 있는가
5. 특정 프로젝트 작업공간에서만 재현되는가
6. 문제가 확인된 범위만 재생성한다
```

이 순서의 목적은 MCP 연결 문제와 언어 서버 문제를 구분하고, 필요 이상으로 전역 캐시나 다른 프로젝트 상태를 지우지 않는 것이다.
