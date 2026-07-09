---
title       : "Claude Code hooks — 도구 실행 흐름에 셸 끼우기 (포맷·차단·알림)"
description : "settings.json의 hooks로 도구 실행 전후에 셸 스크립트를 끼워 넣는다 — 편집 후 자동 포맷, 위험한 명령 차단, 작업 완료 알림. 이벤트·구조·예제와 보안 주의점, 그리고 커스텀 명령·스킬과의 경계를 정리한다."
date        : 2026-07-03 21:45:00 +0900
updated     : 2026-07-09 09:00:00 +0900
categories  : [ai, "Claude Code"]
tags        : [claude-code, hooks, settings]
pin         : false
hidden      : false
---

> 관련: [AI 로드맵](/posts/ai/2026-07-03-ai-roadmap/)의 **실전 워크플로** 갈래 · [Claude Code 실전 워크플로](/posts/ai/2026-07-03-claude-code-workflow/)에 이어지는 확장 편.

플랜·서브에이전트·헤드리스로 [Claude Code를 굴리는 법](/posts/ai/2026-07-03-claude-code-workflow/)에 익숙해지면, 다음은 **도구 자체를 확장**하는 단계다. 확장의 한 축이 **hooks** — 도구 실행 흐름에 셸을 끼워 넣는 장치다. (다른 축인 **커스텀 슬래시 명령**은 [슬래시 명령어 사전](/posts/ai/2025-10-24-claude-code-slash-commands/#커스텀-명령어-만들기)에서 다룬다.)

## hooks — 실행 흐름에 셸을 끼운다

hooks는 특정 시점에 셸 스크립트(또는 HTTP·프롬프트)를 실행하게 하는 장치다. `settings.json`에 정의한다.

| 위치 | 범위 |
|---|---|
| `~/.claude/settings.json` | 모든 프로젝트 |
| `.claude/settings.json` | 이 프로젝트(공유, 커밋) |
| `.claude/settings.local.json` | 이 프로젝트(개인, gitignore) |

주요 이벤트: `PreToolUse`·`PostToolUse`(도구 호출 전/후), `UserPromptSubmit`, `Stop`(응답 끝), `SessionStart`/`SessionEnd`.

구조는 이벤트 → `matcher`(도구 이름 매칭) → 실행할 `command`. 훅은 stdin으로 JSON 입력을 받고, **종료 코드로 제어**한다 — `exit 0`은 통과, `exit 2`는 차단(stderr가 피드백으로 전달).

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
  exit 2   # 즉시 차단
fi
exit 0
```

> hooks는 **임의의 셸 명령을 실행**한다. `settings.json`에 담긴 훅은 코드처럼 다뤄라 — 신뢰할 수 없는 저장소를 클론했을 때 그 프로젝트의 훅이 무엇을 실행하는지 확인하고 시작한다.
{: .prompt-warning }

## 커스텀 명령·스킬과의 경계

확장의 나머지 두 조각은 hooks와 역할이 다르다.

- **커스텀 슬래시 명령** — 반복 프롬프트를 `/이름` 하나로. 저장 위치·`$ARGUMENTS`·frontmatter(`allowed-tools`·`model`)·`!명령`/`@파일` 전처리까지는 [슬래시 명령어 사전 › 커스텀 명령어 만들기](/posts/ai/2025-10-24-claude-code-slash-commands/#커스텀-명령어-만들기)에 정리해 두었다.
- **스킬**(`.claude/skills/<이름>/SKILL.md`) — 커스텀 명령과 비슷하지만, `/이름`으로 직접 부르는 것뿐 아니라 **Claude가 작업에 맞을 때 알아서 불러온다**(모델 호출 vs 사용자 호출). 보조 스크립트·템플릿을 함께 패키징할 수 있어 무거운 워크플로에 맞다.

역할로 나누면 — **hooks는 "무엇을 자동으로 실행할까"**(포맷·차단·알림), **커스텀 명령/스킬은 "무엇을 시킬까"**(프롬프트 재사용). 셋을 합치면 Claude Code를 팀·프로젝트에 맞게 길들이는 도구가 갖춰진다. 전체 학습 경로는 [AI 로드맵](/posts/ai/2026-07-03-ai-roadmap/)에서.
