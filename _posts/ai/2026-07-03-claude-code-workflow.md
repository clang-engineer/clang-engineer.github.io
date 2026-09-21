---
title       : "Claude Code 실전 워크플로 — Plan·Subagent·Headless·Hook으로 자동화하기"
description : "Claude Code를 조작법 너머 활용법으로. Plan으로 전략을 먼저 받고, Subagent로 컨텍스트를 격리하고, 병렬 도구 실행과 Headless 실행을 활용하며, Hook으로 포맷·차단·알림을 자동화하는 흐름을 정리한다."
date        : 2026-07-03 21:40:00 +0900
updated     : 2026-09-21 22:45:00 +0900
categories  : [ai, "Claude Code"]
tags        : [claude-code, workflow, subagents, plan-mode, headless, hooks, settings]
redirect_from:
  - /posts/ai/2026-07-03-claude-code-hooks-custom-commands/
pin         : false
hidden      : false
---

> 관련: [AI 로드맵](./2026-07-03-ai-roadmap.md)의 **실전 워크플로** 갈래 · 기본 개념·설치·권한 모드는 [Claude Code 정리](./2025-10-24-claude-code.md)에서 먼저.

Claude Code를 깔고 명령을 몇 번 쳐 봤다면, 다음 질문은 **큰 작업을 어떻게 안전하고 반복 가능하게 굴리느냐**다. 이 글은 Plan·Subagent·병렬 도구 실행·Headless·Hook을 하나의 실전 흐름으로 묶는다.

```text
큰 변경
  → Plan으로 먼저 조사·전략 수립
  → Subagent로 장황한 탐색 격리
  → 병렬 도구 호출로 독립 탐색 가속
  → Headless로 반복 작업 자동화
  → Hook으로 포맷·차단·알림을 실행 흐름에 삽입
```

설치·권한 모드 기본은 [Claude Code 정리](./2025-10-24-claude-code.md)에 있다. 여기서는 기능 목록보다 **언제 어떤 손잡이를 잡을지**에 집중한다.

## 1. Plan — 고치기 전에 전략부터

큰 변경을 바로 시키면 엉뚱한 방향으로 파일을 왕창 고칠 위험이 있다. **Plan**은 코드를 건드리기 전에 탐색과 계획 제안에 집중하게 만드는 단계다.

- 진입: `Shift+Tab`으로 모드 순환(default → acceptEdits → plan), 또는 그 턴만 `/plan`, 또는 시작 시 `claude --permission-mode plan`
- 계획이 나오면 승인하며 자동 실행, 편집 자동 수락, 매 편집 검토 중 적절한 방식을 고른다.

핵심은 연구 → 계획 → 검토 → 구현을 나누는 것이다. 특히 파일 구조를 아직 모를 때, 변경 범위가 넓을 때, 테스트 전략이 불명확할 때 먼저 Plan을 거치면 사고가 줄어든다.

## 2. Subagent — 컨텍스트를 격리한다

Subagent는 자체 컨텍스트·도구·권한을 가진 별도 에이전트다. 쓰는 이유는 두 가지다.

- **컨텍스트 격리**: 장황한 탐색·검색 출력이 메인 대화를 오염시키지 않게 하고 요약만 돌려받는다.
- **병렬·독립 작업**: 서로 무관한 여러 갈래를 동시에 조사한다.

`.claude/agents/*.md`에 정의하고 프로젝트에 두거나, `~/.claude/agents/`에 전역으로 둔다. frontmatter로 지침·도구·모델을 지정한다.

```markdown
---
name: code-reviewer
description: 코드 품질·베스트 프랙티스 관점으로 변경사항을 리뷰
tools: Read, Grep, Glob
model: sonnet
---

너는 시니어 코드 리뷰어다. 변경된 코드를 분석하고 피드백을 준다...
```

`description`이 좋으면 Claude가 작업에 맞춰 알아서 위임하고, `@code-reviewer`처럼 직접 부를 수도 있다. `Explore`(빠른 읽기 전용 탐색)·`Plan`(플랜 모드 조사) 같은 내장 에이전트도 있다.

> 매 파일 읽기·순차 작업까지 Subagent로 쪼개지 않는다. 병렬·독립 워크스트림이거나, 출력이 장황해 메인 컨텍스트를 아끼고 싶을 때가 제자리다.
{: .prompt-tip }

## 3. 병렬 도구 실행 — 독립 탐색은 한 번에

Claude Code는 서로 의존하지 않는 도구 호출을 한 턴에 묶어 동시에 실행할 수 있다. 파일 3개 동시 읽기, 두 디렉토리 동시 grep 같은 식이다. 별도 설정할 것은 없고 자동으로 동작한다.

반대로 의존 관계가 있는 호출은 순차로 돈다.

```text
독립 탐색: A 읽기 + B 읽기 + C grep  → 병렬 가능
의존 작업: 읽기 → 편집 → 테스트       → 순차 실행
```

이 차이를 알고 있으면 요청을 더 잘 나눌 수 있다. "관련 파일을 찾아보고 각각 요약해줘"처럼 독립 탐색을 맡기면 빠르고, "이 파일을 읽고 그 결과에 따라 수정해줘"는 자연스럽게 순차 작업이 된다.

## 4. Headless — 스크립트·CI에 태우기

`claude -p "..."`(`--print`)는 대화형 없이 한 번 실행하고 종료한다. 파이프·스크립트·CI에 태울 때 쓰는 진입점이다.

```bash
# 로그를 물려 요약
tail -f app.log | claude -p "에러나 이상 징후가 보이면 요약해줘"

# 구조화 출력(JSON) — 파싱해서 후속 처리
claude -p "auth.py의 함수 이름을 추출해줘" --output-format json

# 도구를 미리 허용해 프롬프트 없이
claude -p "테스트 돌리고 실패 고쳐줘" --allowedTools "Bash,Read,Edit"
```

`--output-format`은 `text`(기본)·`json`(비용·세션 ID 포함)·`stream-json`(실시간)을 지원한다. 세션을 이어가려면 `--resume <session-id>`로 앞 세션 ID를 넘긴다.

Headless는 반복 가능한 작업에 맞다. 예를 들어 로그 요약, 변경 파일 리뷰, 특정 형식의 리포트 생성처럼 입력과 출력이 비교적 분명한 작업이다.

## 5. Hook — 도구 실행 흐름에 셸을 끼운다

Headless가 Claude Code를 밖에서 자동 실행하는 손잡이라면, **Hook**은 Claude Code 내부의 도구 실행 전후에 셸 스크립트를 끼우는 장치다. 편집 후 자동 포맷, 위험한 명령 차단, 작업 완료 알림 같은 일을 맡긴다.

Hook은 `settings.json`에 정의한다.

| 위치 | 범위 |
|---|---|
| `~/.claude/settings.json` | 모든 프로젝트 |
| `.claude/settings.json` | 이 프로젝트(공유, 커밋) |
| `.claude/settings.local.json` | 이 프로젝트(개인, gitignore) |

주요 이벤트는 `PreToolUse`·`PostToolUse`(도구 호출 전/후), `UserPromptSubmit`, `Stop`(응답 끝), `SessionStart`/`SessionEnd`다. 구조는 이벤트 → `matcher`(도구 이름 매칭) → 실행할 `command`다. Hook은 stdin으로 JSON 입력을 받고, 종료 코드로 제어한다. `exit 0`은 통과, `exit 2`는 차단이며 stderr가 피드백으로 전달된다.

### 예제 1 — 편집 후 자동 포맷

`Edit`·`Write` 뒤에 포맷터를 돌린다.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/format.sh" }
        ]
      }
    ]
  }
}
```

### 예제 2 — 작업 끝나면 데스크톱 알림

긴 작업을 걸어두고 다른 일 할 때 유용하다.

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          { "type": "command", "command": "osascript -e 'display notification \"완료\" with title \"Claude Code\"'" }
        ]
      }
    ]
  }
}
```

### 예제 3 — 위험한 명령 차단

`PreToolUse`에서 stdin JSON을 검사해 `exit 2`로 막는다.

```bash
#!/bin/bash
COMMAND=$(jq -r '.tool_input.command')
if echo "$COMMAND" | grep -q 'rm -rf'; then
  echo "위험한 명령 차단됨" >&2
  exit 2
fi
exit 0
```

> Hook은 임의의 셸 명령을 실행한다. `settings.json`에 담긴 Hook은 코드처럼 다룬다. 신뢰할 수 없는 저장소를 클론했을 때는 프로젝트 Hook이 무엇을 실행하는지 확인하고 시작한다.
{: .prompt-warning }

## 6. 커스텀 명령·스킬과의 경계

자동화 장치가 많아질수록 역할을 나눠야 한다.

- **커스텀 슬래시 명령** — 반복 프롬프트를 `/이름` 하나로 부른다. 저장 위치·`$ARGUMENTS`·frontmatter·`!명령`/`@파일` 전처리는 [슬래시 명령어 사전](./2025-10-24-claude-code-slash-commands.md#커스텀-명령어-만들기)에 정리해 두었다.
- **스킬**(`.claude/skills/<이름>/SKILL.md`) — 커스텀 명령보다 무거운 작업 단위다. Claude가 작업에 맞을 때 알아서 불러올 수 있고, 보조 스크립트·템플릿을 함께 패키징할 수 있다.
- **Hook** — 사용자가 무엇을 시킬지보다, 도구 실행 전후에 무엇을 자동으로 보장할지를 담당한다.

역할로 나누면 다음과 같다.

```text
무엇을 시킬까?
  → 커스텀 명령 / 스킬

언제 자동으로 실행할까?
  → Hook

대화 밖에서 반복 실행할까?
  → Headless
```

## 7. 세션·컨텍스트 관리

긴 작업에서는 세션과 컨텍스트 관리도 워크플로의 일부다.

- `claude --continue`(`-c`) — 최근 세션 이어가기
- `claude --resume`(`-r`) — 목록에서 골라 재개
- `/clear` — 새로 시작한다. 이전 대화는 저장·재개 가능하다.
- `/compact` — 오래된 대화를 요약해 공간을 확보한다.
- `/context` — 무엇이 컨텍스트를 채우는지 시각화한다.

## 정리

큰 변경은 Plan으로 전략을 먼저 세운다. 장황하거나 병렬인 탐색은 Subagent로 격리한다. 독립적인 읽기·검색은 병렬 도구 실행에 맡긴다. 반복 가능한 외부 실행은 Headless로 스크립트화한다. 그리고 편집 후 포맷, 위험 명령 차단, 완료 알림처럼 실행 흐름에 붙어야 하는 것은 Hook으로 처리한다.

Claude Code의 실전 워크플로는 결국 하나의 루프로 수렴한다.

```text
사람이 방향·완료조건 설정
        ↓
Agent가 탐색·수정·검증
        ↓
Hook / CI가 반복 가능한 Guardrail 제공
```

전체 학습 경로는 [AI 로드맵](./2026-07-03-ai-roadmap.md)에서 이어진다.
