---
title       : "Claude Code 작업 설계 — Plan·Skill·Subagent·Hook의 역할 나누기"
description : "Claude Code의 계획·권한·Skill·Subagent·Headless·Hook을 작업 흐름으로 연결하고, 반복 지시를 둘 위치와 검증·복구·PR 공개의 경계를 정리한다."
date        : 2026-07-03 21:40:00 +0900
updated     : 2026-11-18 12:00:00 +0900
categories  : [ai, "Claude Code"]
tags        : [claude-code, workflow, skills, subagents, plan-mode, headless, hooks, guide]
redirect_from:
  - /posts/ai/2026-07-03-claude-code-hooks-custom-commands/
  - /posts/ai/2025-10-24-claude-code/
  - /posts/ai/2025-10-24-claude-code-slash-commands/
pin         : false
hidden      : false
---

> 관련: [AI 개발 지형](./2026-07-03-ai-development-map.md) · 도구 비교는 [AI 코딩 도구 지형도](./2026-07-03-ai-coding-tools-landscape.md) · 설치·명령·키맵은 [devkit Claude Code 치트시트](https://github.com/clang-engineer/devkit/blob/main/reference/cheatsheets/claude-code.md)

Claude Code는 저장소를 읽고 파일을 수정하며 명령을 실행하는 코딩 에이전트다. 코드 설명만 받는 챗과 달리 **모델의 제안이 실제 파일·프로세스·외부 서비스의 변경으로 이어진다.** 그래서 기능을 많이 켜는 것보다 작업의 방향, 실행 권한, 검증과 공개 시점을 나누는 일이 중요하다.

처음에는 “이 기능을 만들어 줘”만으로 충분하다. 그러나 큰 작업과 반복 작업에서는 다음 흐름이 더 안정적이다. 화살표는 작업 진행 순서이고, 아래의 지침·권한·Hook은 그 흐름에 영향을 주는 별도 장치다.

```text
사람이 목표·완료 조건 설정
           ↓
탐색·계획 → 검토 → 구현 → 테스트·diff 확인 → 공개 승인
           │        │           │
           └─ Subagent로 독립 조사·검토 분담

CLAUDE.md / Memory : 지속 지침·프로젝트 맥락
Skill             : 필요할 때 부르는 작업 절차
권한 정책          : 실제 도구 실행의 허용·확인·거부
Hook / CI         : 지정 이벤트·검증 단계의 자동 검사
```

이 글은 이 장치들을 **언제 조합하고 어디에 경계를 둘지** 설명한다. 전체 명령 사전은 복제하지 않는다. 기능의 제공 범위와 키는 버전·계정에 따라 달라지므로 실행 중 `/help`와 공식 문서에서 확인한다.

## 1. 계획과 실행 권한은 별개다

Plan은 구현 전에 파일을 조사하고 접근법을 검토하는 단계다. 저장소 구조를 아직 모르거나 변경 범위가 넓고 테스트 전략도 불분명할 때 유용하다. 시작 시 `claude --permission-mode plan`을 사용할 수 있고, 대화형에서는 현재 버전의 Plan 진입 경로를 확인한다.

계획을 승인했다는 사실이 모든 셸 명령과 원격 작업을 승인했다는 뜻은 아니다.

| 조절 대상 | 질문 | 예 |
|---|---|---|
| 계획 | 무엇을 어떤 순서로 바꿀까? | 탐색 → 변경안 → 검증 전략 |
| 도구 권한 | 이 호출을 실행해도 될까? | 파일 편집 허용, 셸 실행 확인 |
| 추론 강도 | 모델이 얼마나 깊이 추론할까? | `/effort`; 모델·버전별 지원 확인 |
| 출력 속도 | 같은 모델의 응답 경로를 바꿀까? | 지원 모델에서 `/fast`; 모델 교체와 다름 |

`default`는 권한 검사를 적용하고, `acceptEdits`는 편집을 자동 허용하며, `plan`은 조사·계획에 집중한다. `bypassPermissions`는 권한 검사를 우회하는 위험한 선택이다. 현재의 **`auto` 권한 모드와 `bypassPermissions`는 같은 것이 아니며**, OMP의 `auto` 추론 정책과도 전혀 다르다. 정확한 범위는 [Claude Code 권한 문서](https://code.claude.com/docs/en/permissions)를 따른다.

예를 들어 JWT 로그인 기능을 추가한다면, 처음에는 기존 인증 흐름과 데이터 경계를 조사하게 한다. 계획에서 세션 정책·오류 응답·테스트를 확인하고, 구현 후에는 성공뿐 아니라 만료·누락·잘못된 토큰도 검증한다. “알아서 끝까지”라는 요청보다 **완료 조건을 검사 가능한 형태로 먼저 정하는 것**이 중요하다.

## 2. 명령·지침·Skill·Hook은 서로 다른 곳에 둔다

자주 어기는 규칙을 발견할 때마다 전역 메모리에 긴 절차를 덧붙이면 모든 작업의 컨텍스트가 커진다. 무엇을 반복하는지에 따라 둘 곳이 다르다.

| 반복되는 내용 | 둘 곳 | 이유 |
|---|---|---|
| “이 저장소는 pnpm을 쓴다” | `CLAUDE.md` / 프로젝트 규칙 | 계속 적용되는 사실·지침 |
| “이 프로젝트의 테스트는 데이터 준비가 필요하다” | 명시 규칙 또는 프로젝트 Memory | 강제할 규칙인지 학습한 맥락인지 구분 |
| “staged diff를 보고 커밋 메시지를 작성한다” | Skill | 호출할 때 필요한 절차 |
| “편집 후 포맷터를 실행한다” | Hook | 도구 이벤트에 연결할 자동화 |
| “테스트 통과를 병합 조건으로 삼는다” | CI·저장소 정책 | 모델의 지시 이행 여부와 독립된 검증 |

지침과 Memory의 계층·적용 범위는 [지침·메모리와 웹 배포](./2026-03-12-claude-code-instructions-memory.md)에서 다룬다. 프롬프트 지침은 행동을 유도하지만 OS 권한이나 강제 검사를 대신하지 않는다.

### 슬래시 명령은 목록보다 조작 대상을 본다

내장 명령과 사용자가 정의한 Skill은 `/이름`으로 비슷하게 보이지만 구현과 제공 범위가 다르다.

| 조작 대상 | 대표 진입점 | 판단 |
|---|---|---|
| 세션 | `/resume`, `/compact`, `/rewind` | 이어갈까, 요약할까, 복구할까 |
| 컨텍스트 | `/context`, `/memory` | 무엇을 보고 무엇을 유지할까 |
| 권한·연결 | `/permissions`, `/mcp` | 무엇을 허용하고 어떤 도구를 연결할까 |
| 반복 작업 | `/summarize-changes` 같은 Skill | 어떤 절차를 다시 실행할까 |

전체 목록을 외우기보다 현재 문제의 조작 대상을 찾는다. `@파일`은 요청에 파일을 참조하고, `!명령`은 대화에서 셸 명령을 입력하는 경로다. 이런 입력 문법과 지속 설정 파일을 같은 종류의 “명령”으로 묶지 않는다.

## 3. 반복 프롬프트는 Skill로 만든다

같은 프롬프트를 반복하고, 필요한 파일·셸 출력·작업 순서가 안정됐을 때 Skill로 뺀다. 한 번뿐인 탐색이나 아직 계속 바뀌는 절차를 곧바로 자동화할 필요는 없다.

2026년 11월 공식 문서에서는 **사용자 정의 명령이 Skill에 통합**되어 있다. 기존 `.claude/commands/*.md`도 계속 동작하지만, 신규 다중 파일 작업은 `.claude/skills/<이름>/SKILL.md`로 구성하는 편이 자연스럽다. Skill은 사용자가 직접 부르거나 설명에 따라 Claude가 선택하며, 본문은 사용할 때 로드된다.

다음은 변경 리뷰를 사람이 명시적으로 부르는 Skill의 예다.

```markdown
---
name: summarize-changes
description: 현재 변경의 목적과 위험을 요약한다.
disable-model-invocation: true
---

## 현재 변경

!`git diff HEAD`

## 절차

1. 변경 목적과 영향 범위를 요약한다.
2. 테스트·호환성·보안상 확인할 점을 구분한다.
3. 파일 수정이나 커밋은 하지 않는다.
```

프로젝트의 `.claude/skills/summarize-changes/SKILL.md`에 두면 `/summarize-changes`로 부를 수 있다. 개인 공통 Skill은 `~/.claude/skills/`에 두되, 그 로컬 경로가 클라우드에 자동 전달된다고 가정하지 않는다.

### 인자·동적 입력·권한을 구분한다

- `$ARGUMENTS`는 호출 인자 전체다. 위치 인자는 0부터 시작해서 `$ARGUMENTS[0]` 또는 `$0`가 첫 번째, `$1`이 두 번째다. `/fix-issue 42`처럼 작업 대상을 전달할 수 있다.
- `` !`git diff HEAD` `` 같은 동적 입력은 실행 시점의 출력을 본문에 넣는다. 앞의 일반 대화 `!명령` 문법과 구분한다.
- `@경로`는 파일을 참조한다. 긴 보조 문서를 전부 항상 넣기보다 필요한 파일을 읽는 절차로 구성할 수 있다.
- `description`, `argument-hint`, `allowed-tools`, `model` 같은 frontmatter는 발견·호출·도구 허용·모델 선택을 조절한다. `allowed-tools`를 OS sandbox로 해석하지 않는다.

예전 `.claude/commands/lint-changes.md`에서도 다음과 같이 설명과 인자 힌트·도구·모델을 선언했다. 파일 하나의 명령을 유지하는 용도라면 계속 쓸 수 있고, 새 파일 구조가 필요할 때 Skill로 옮기면 된다.

```yaml
description: 기준 브랜치와 달라진 파일을 확인한다
argument-hint: "[브랜치명]"
allowed-tools: Bash(git diff:*)
model: haiku
```

단, 과거 본문에 사용한 `!명령` 형태를 현재 동적 입력의 보편 문법으로 복사하지 않는다. 실제 전처리·frontmatter 계약은 [공식 Skills 문서](https://code.claude.com/docs/en/skills)를 확인한다.

### 절차 교정은 해당 Skill에서 한다

`/publish`를 부를 때마다 승인 없이 공개한다면, 전역 메모리에 “꼭 물어봐”를 누적하기보다 그 Skill에 승인 단계를 넣는다.

```markdown
쓰기 전에 후보와 영향을 보여 주고 승인받는다.
사용자가 `--auto`를 명시한 경우에만 로컬 작성 승인 단계를 생략한다.
원격 반영은 별도의 `--push` 승인이 있을 때만 수행한다.
```

위 플래그는 **사용자 정의 절차의 설계 예시**이지 Claude Code의 표준 CLI 옵션이 아니다. 로컬 확인 생략과 원격 공개는 위험도가 다르므로 하나로 묶지 않는다.

호출 시점도 중요하다. `/review <대상>`은 인자에 대상이 있지만, 대화 내용을 모으는 `/notes`류 Skill은 작업 전에 부르면 정리할 맥락이 없다. 작업 뒤에 호출하거나 “작업을 마친 뒤 기록”이라고 순서를 명시한다. 과거 특정 버전에서 관찰한 입력 합성 제약을 현재의 불변 규칙으로 일반화하지 않는다.

## 4. Subagent와 병렬 도구는 다른 종류의 병렬화다

Subagent는 자체 컨텍스트·지침·도구를 가진 별도 작업자다. 장황한 탐색 결과를 요약해서 돌려받거나 독립적인 검토를 분담할 때 유용하다.

```markdown
---
name: code-reviewer
description: 변경사항의 호환성과 테스트 누락을 검토한다.
tools: Read, Grep, Glob
model: sonnet
---

변경된 코드와 요구사항을 비교하고 위험·누락만 보고한다.
파일은 수정하지 않는다.
```

프로젝트 `.claude/agents/` 또는 사용자 `~/.claude/agents/`에 정의하고 `/agents`에서 관리한다. `description`은 위임 대상을 고르는 단서다. 내장 탐색·계획 Agent와 사용자 정의 Agent의 제공 범위는 버전별로 확인한다.

반면 병렬 도구 실행은 한 에이전트가 독립된 파일 읽기·검색을 함께 요청하는 것이다.

```text
독립 조사 : A 읽기 + B 읽기 + C 검색 → 병렬 가능
의존 작업 : 읽기 → 편집 → 테스트    → 순차
```

모든 파일 읽기를 Subagent로 쪼개면 지침과 맥락을 반복 전달하는 비용이 생긴다. **독립된 질문·결과물이 있는가, 긴 탐색 결과를 격리할 가치가 있는가**로 판단한다. 별도 터미널 세션과 worktree의 조율은 [병렬 세션의 코드·상태·분석 분리](./2026-11-16-claude-parallel-session-coordination.md)로 이어진다.

## 5. Headless는 바깥에서, Hook은 실행 흐름 안에서 자동화한다

`claude -p`는 비대화형으로 요청을 처리하는 진입점이다. 반복 리뷰나 구조화된 보고처럼 입력·출력이 명확한 작업을 스크립트·CI에 연결할 때 쓴다.

```sh
claude -p "auth.py의 공개 함수와 역할을 요약해줘" --output-format json
claude -p "테스트를 실행하고 실패 원인을 보고해줘" --allowedTools "Bash,Read"
```

`json`은 후속 코드의 파싱에, `stream-json`은 진행 중 이벤트 처리에 쓴다. 세션을 이어갈 때는 저장한 ID와 `--resume`을 사용한다. 파이프로 로그를 전달할 수도 있지만, 끝나지 않는 `tail -f`의 입력·종료 시점과 오류 처리는 호출하는 스크립트가 책임져야 한다.

Hook은 이와 달리 `PreToolUse`, `PostToolUse`, `Stop`, `SessionStart` 같은 **내부 이벤트**에 동작을 연결한다. 전역·프로젝트·로컬 `settings.json`의 어느 범위에 둘지 먼저 정한다.

### 편집 후 포맷과 완료 알림

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "\"${CLAUDE_PROJECT_DIR}\"/.claude/hooks/format.sh" }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          { "type": "command", "command": "osascript -e 'display notification \"완료\" with title \"Claude Code\"'" }
        ]
      }
    ]
  }
}
```

포맷 스크립트는 프로젝트에서 준비한 파일이어야 하고, 알림 예시는 macOS용이다. Hook은 사용자의 권한으로 코드를 실행하므로 외부 저장소에서 가져온 설정도 실행 코드처럼 검토한다.

### 차단은 이벤트의 의미를 따라야 한다

다음은 `PreToolUse` 입력의 `tool_input.command`에서 특정 문자열을 찾는 **교육용 최소 예시**다. `jq`가 필요하다.

```bash
#!/usr/bin/env bash
set -euo pipefail
command=$(jq -r '.tool_input.command // ""')
if [[ "$command" == *"rm -rf"* ]]; then
  printf '%s\n' '위험한 명령 후보: 직접 검토 필요' >&2
  exit 2
fi
```

이 검사는 옵션 순서 변경, 다른 삭제 명령, Python·다른 도구 경로를 막지 못한다. 실제 보안 경계는 권한 정책과 실행 격리로 설계한다.

또한 **`exit 2`가 모든 이벤트에서 같은 뜻은 아니다.** `PreToolUse`에서는 실행을 차단할 수 있지만 `PostToolUse` 시점에는 이미 도구가 실행됐다. `Stop` 차단은 종료 대신 추가 작업을 유도하므로 무한 반복 방지도 필요하다. 이벤트별 입력·종료 계약은 [공식 Hook 문서](https://code.claude.com/docs/en/hooks)를 따른다.

## 6. 세션 복구와 변경 검증을 함께 본다

긴 작업에서는 대화를 계속 유지하는 것 자체가 목표가 아니다.

- `/context`로 실제로 무엇이 문맥을 차지하는지 확인한다.
- 같은 문제를 이어간다면 `/compact`, 무관한 작업이라면 새 세션을 고려한다.
- `/resume`은 대화를 재개하는 경로다. 다른 브랜치나 외부 시스템 상태까지 복원하지 않는다.
- `/rewind`는 체크포인트를 이용한 복구지만 임의의 셸·DB·원격 부작용을 모두 되돌리는 Git 대체재는 아니다.

“테스트가 통과했다”도 충분하지 않다. 기대값이 구현을 복제했는지, 실패 입력을 검사했는지, 잘못된 구현에서 실제로 실패하는지 [자동 생성 테스트 검토](../reference/code-quality/2026-08-12-auto-generated-test-check.md)를 함께 확인한다.

## 7. 이슈에서 PR까지 — 공개 권한을 별도로 둔다

“이슈 #42를 해결하는 PR을 만들어 줘”는 **문제 이해 → 변경 → 검증 → 외부 공개**의 연속이다. 다음 경계를 명시한다.

1. 이슈 본문·댓글과 저장소 상태를 확인한다. 기존 미커밋 작업은 사용자의 작업으로 취급한다.
2. 별도 브랜치에서 완료 조건에 맞게 수정한다. Plan은 방향 결정에, Subagent는 독립 조사에 사용한다.
3. diff와 새 파일을 검토하고 실제로 필요한 검사를 수행한다. 스테이징은 파일을 명시해 관련 없는 변경·비밀 파일을 제외한다.
4. 승인된 범위에서만 push·PR 생성을 수행하고 URL과 실제 검증 결과를 전달한다.

```sh
gh issue view 42 --comments
git status --short --branch
git diff --check
git add path/to/changed-file
git diff --cached
# 원격 반영은 승인된 브랜치·본문에 한해서만 수행
```

`Closes #42`는 이슈를 닫으려는 의도가 있을 때 사용한다. 기본 브랜치를 대상으로 한 PR의 연결·병합 시점 규칙은 [GitHub 문서](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue)를 확인한다.

## 정리

Claude Code의 작업 설계는 기능을 전부 켜는 일이 아니다. 지속 지침은 `CLAUDE.md`에, 반복 절차는 Skill에, 이벤트 자동화는 Hook에 둔다. 큰 변경은 계획 검토와 실행 권한을 나누고, 독립 작업만 병렬화하며, 테스트·diff 확인과 외부 공개 승인을 마지막 경계로 남긴다.

설치·키·설정 세부는 [devkit 치트시트](https://github.com/clang-engineer/devkit/blob/main/reference/cheatsheets/claude-code.md), 전체 위치는 [AI 개발 지형](./2026-07-03-ai-development-map.md), 지속 컨텍스트와 클라우드 배포는 [지침·메모리 글](./2026-03-12-claude-code-instructions-memory.md)에서 이어진다.
