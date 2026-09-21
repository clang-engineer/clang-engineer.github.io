---
title       : "Claude Code 슬래시 명령어 — 외우는 목록에서 만드는 명령으로"
description : "Claude Code 슬래시 명령을 전체 사전으로 외우기보다 세션 조작, 컨텍스트 관리, 설정, 커스텀 명령이라는 역할로 나누고, 반복 작업을 직접 명령으로 만드는 기준을 정리한다."
date        : 2025-10-24 11:30:00 +0900
updated     : 2026-09-21 22:50:00 +0900
categories  : [ai, "Claude Code"]
tags        : [claude-code, slash-commands, cli, guide]
pin         : false
hidden      : false
---

> 관련: [AI 로드맵](./2026-07-03-ai-roadmap.md)의 **Claude Code** 갈래 2단계(매일 쓰기) · 빠른 명령 참조는 [devkit의 Claude Code cheatsheet](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/claude-code.md)에서 관리한다.

Claude Code의 슬래시 명령은 전부 외우는 대상이 아니다. `/help`가 항상 최신 목록을 보여 주고, 명령 세부는 버전에 따라 바뀐다. 블로그 글에는 전체 사전보다 **어떤 역할의 명령이 있는지**, 그리고 **언제 커스텀 명령으로 빼야 하는지**를 남기는 편이 오래 간다.

## 먼저 역할로 나눈다

자주 쓰는 명령은 대략 네 묶음이다.

| 역할 | 예 | 질문 |
|---|---|---|
| 세션 조작 | `/clear`, `/resume`, `/compact` | 지금 대화를 계속 쓸까, 새로 시작할까, 요약할까 |
| 컨텍스트 확인 | `/context`, `/memory` | 모델이 무엇을 보고 있고 무엇을 기억할까 |
| 실행·복구 | `/rewind`, `/bashes`, `/todos` | 작업을 되돌리거나 진행 상태를 확인할까 |
| 설정·연결 | `/model`, `/permissions`, `/mcp`, `/hooks` | 모델·권한·외부 도구·자동화를 어떻게 설정할까 |

전체 명령 이름을 암기하기보다, 지금 막힌 문제가 어느 역할인지 먼저 생각한다.

```text
대화가 너무 길다
  → /compact 또는 /clear

이전 작업으로 돌아가고 싶다
  → /resume 또는 /rewind

권한 프롬프트가 반복된다
  → /permissions

외부 도구 연결 상태가 궁금하다
  → /mcp
```

## 명령은 조작이고, 메모리는 지속 컨텍스트다

슬래시 명령과 `CLAUDE.md`는 역할이 다르다.

```text
슬래시 명령
  → 지금 세션에서 무엇을 실행하거나 조작할까

CLAUDE.md / Memory
  → 이 프로젝트에서 계속 유지할 규칙·맥락은 무엇인가
```

예를 들어 "이 프로젝트는 pnpm을 쓴다"는 매번 실행할 명령이 아니라 `CLAUDE.md`에 둘 지식이다. 반대로 "현재 staged diff를 보고 커밋 메시지를 작성하라"는 반복 프롬프트이므로 커스텀 명령으로 빼기 좋다.

## 커스텀 명령 — 반복 프롬프트를 `/이름`으로 만든다

자주 시키는 작업은 마크다운 파일로 저장해 슬래시 명령으로 부를 수 있다. 여기서부터 슬래시 명령은 "외우는 목록"이 아니라 "내가 만드는 작업 단축키"가 된다.

| 위치 | 범위 | 호출 |
|---|---|---|
| `.claude/commands/` | 이 프로젝트 전용(팀 공유, git 커밋) | `/이름` |
| `~/.claude/commands/` | 내 모든 프로젝트 | `/이름` |

파일명이 곧 명령어 이름이다.

```text
.claude/commands/fix-issue.md
→ /fix-issue
```

### 인자 받기

`$ARGUMENTS`는 호출 시 뒤에 붙인 전체 문자열이고, `$1`, `$2`는 위치 인자다.

```markdown
GitHub 이슈를 분석하고 수정한다: $ARGUMENTS

단계:
1. `gh issue view`로 이슈 세부사항 확인
2. 코드베이스에서 관련 파일 검색
3. 수정 구현 → 테스트 → 린트·타입 체크 통과
4. 설명 포함 커밋 후 PR 생성
```

```bash
/fix-issue 1234
```

### frontmatter로 동작 제어

명령 파일 상단에 메타데이터를 붙이면 설명·인자 힌트·허용 도구·모델을 지정할 수 있다.

```markdown
---
description : 변경된 파일만 린트하고 자동 수정
argument-hint: "[브랜치명]"
allowed-tools: Bash(git diff:*), Bash(npm run lint:*)
model       : claude-haiku-4-5
---

`$1` 브랜치와의 diff에서 변경된 파일을 찾아 린트를 돌리고 고친다.
```

- `description` — 명령 목록에 표시되는 한 줄 설명
- `argument-hint` — 자동완성에 뜨는 인자 형식 힌트
- `allowed-tools` — 이 명령이 권한 프롬프트 없이 쓸 수 있는 도구 화이트리스트
- `model` — 명령 실행에 쓸 모델 고정

### 본문에서 셸·파일 끌어오기

명령 본문은 그대로 프롬프트가 된다. 두 접두어로 실행 시점의 컨텍스트를 주입한다.

- `!명령` — 셸 명령을 실행해 그 출력을 프롬프트에 넣는다.
- `@경로` — 파일 내용을 프롬프트에 넣는다.

```markdown
---
description: 현재 staged 변경에 대한 커밋 메시지 작성
allowed-tools: Bash(git diff:*)
---

다음 staged diff를 보고 Conventional Commits 형식으로 커밋 메시지를 써라:

!git diff --staged
```

## 커스텀 명령과 Hook의 경계

헷갈리기 쉬운 기준은 다음과 같다.

```text
사용자가 명시적으로 부르는 반복 작업
  → 커스텀 슬래시 명령

도구 실행 전후에 항상 보장할 자동 동작
  → Hook

프로젝트가 계속 기억해야 할 규칙
  → CLAUDE.md / Memory
```

예를 들어 "staged diff로 커밋 메시지 작성"은 사용자가 원할 때 부르는 작업이므로 커스텀 명령이 맞다. 반면 "Edit 후 자동 포맷"이나 "위험한 `rm -rf` 차단"은 매번 자동으로 걸려야 하므로 Hook이 맞다. Hook까지 포함한 작업 흐름은 [Claude Code 실전 워크플로](./2026-07-03-claude-code-workflow.md)에서 다룬다.

## 언제 커스텀 명령으로 빼나

다음 조건 중 하나라도 반복되면 커스텀 명령 후보로 본다.

- 같은 프롬프트를 세 번 이상 다시 친다.
- 매번 같은 파일이나 셸 출력이 필요하다.
- 작업 순서가 정해져 있다.
- 특정 도구 권한을 매번 허용한다.
- 팀원도 같은 방식으로 실행해야 한다.

반대로 한 번만 할 탐색, 맥락 의존적인 대화, 아직 절차가 안정되지 않은 작업은 바로 명령으로 만들지 않는다. 몇 번 손으로 실행하면서 흐름이 굳은 뒤 파일로 빼는 편이 낫다.

## 참고

- 빠른 명령 참조: [devkit Claude Code cheatsheet](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/claude-code.md)
- 전체 개요·설치·작동 모드: [Claude Code 정리](./2025-10-24-claude-code.md)
- 메모리 시스템: [Claude Code 메모리 시스템](./2026-03-12-claude-code-memory.md)
- 실전 자동화: [Claude Code 실전 워크플로](./2026-07-03-claude-code-workflow.md)
