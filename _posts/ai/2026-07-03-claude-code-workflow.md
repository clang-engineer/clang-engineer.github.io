---
title       : "Claude Code 실전 워크플로 — 플랜 모드·서브에이전트·병렬·헤드리스"
description : "Claude Code를 조작법 너머 활용법으로. 플랜 모드로 전략을 먼저 받고, 서브에이전트로 컨텍스트를 격리하고, 병렬 도구 실행을 활용하고, 헤드리스(claude -p)로 스크립트·CI에 태우는 실전 흐름을 정리한다."
date        : 2026-07-03 21:40:00 +0900
updated     : 2026-07-03 21:40:00 +0900
categories  : [ai, "Claude Code"]
tags        : [claude-code, workflow, subagents, plan-mode, headless]
pin         : false
hidden      : false
---

> 관련: [AI 로드맵](/posts/ai/2026-07-03-ai-roadmap/)의 **실전 워크플로** 갈래 · 기본 개념·설치·권한 모드는 [Claude Code 정리](/posts/ai/2025-10-24-claude-code/)에서 먼저.

Claude Code를 깔고 명령을 몇 번 쳐 봤다면, 다음은 **"큰 작업을 어떻게 안전하고 빠르게 굴리느냐"**다. 이 글은 플랜 모드·서브에이전트·병렬 실행·헤드리스 네 가지를 실전 흐름 관점에서 묶는다. 설치·권한 모드 기본은 [Claude Code 정리](/posts/ai/2025-10-24-claude-code/)에 있다.

## 1. 플랜 모드 — 고치기 전에 전략부터

큰 변경을 바로 시키면 엉뚱한 방향으로 파일을 왕창 고칠 위험이 있다. **플랜 모드**는 코드를 건드리지 않고 **탐색 → 계획 제안**까지만 한다.

- 진입: `Shift+Tab`으로 모드 순환(default → acceptEdits → plan), 또는 그 턴만 `/plan`, 또는 시작 시 `claude --permission-mode plan`
- 계획이 나오면 승인하며 "자동 실행 / 편집만 자동 수락 / 매 편집 검토" 중 고른다.

연구 → 계획 → (검토) → 구현으로 단계를 나누는 게 큰 변경의 사고를 줄이는 핵심이다.

## 2. 서브에이전트 — 컨텍스트를 격리한다

서브에이전트는 **자체 컨텍스트·도구·권한**을 가진 별도 에이전트다. 쓰는 이유는 두 가지다.

- **컨텍스트 격리**: 장황한 탐색·검색 출력이 메인 대화를 오염시키지 않게. 요약만 돌려받는다.
- **병렬·독립 작업**: 서로 무관한 여러 갈래를 동시에.

`.claude/agents/*.md`에 정의하고(프로젝트) `~/.claude/agents/`(전역)에 둔다. 프론트매터로 지침·도구·모델을 지정한다.

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

> 매 파일 읽기·순차 작업까지 서브에이전트로 쪼개지 말 것. 병렬·독립 워크스트림이나, 출력이 장황해 메인 컨텍스트를 아끼고 싶을 때가 제자리다.
{: .prompt-tip }

## 3. 병렬 도구 실행

Claude Code는 **서로 의존하지 않는 도구 호출을 한 턴에 묶어** 동시에 실행한다 — 파일 3개 동시 읽기, 두 디렉토리 동시 grep 같은 식. 설정할 게 없다(자동). 의존 관계가 있는 호출(읽기 → 편집 → 테스트)은 순차로 돈다. 알아두면 "왜 이렇게 빠르지"가 설명된다.

## 4. 헤드리스 — 스크립트·CI에 태우기

`claude -p "..."`(`--print`)는 대화형 없이 **한 번 실행하고 종료**한다. 파이프·CI·자동화의 핵심.

```bash
# 로그를 물려 요약
tail -f app.log | claude -p "에러나 이상 징후가 보이면 요약해줘"

# 구조화 출력 (JSON) — 파싱해서 후속 처리
claude -p "auth.py의 함수 이름을 추출해줘" --output-format json

# 도구를 미리 허용해 프롬프트 없이
claude -p "테스트 돌리고 실패 고쳐줘" --allowedTools "Bash,Read,Edit"
```

`--output-format`은 `text`(기본)·`json`(비용·세션ID 포함)·`stream-json`(실시간)을 지원한다. 세션을 이어가려면 `--resume <session-id>`로 앞 세션 ID를 넘긴다.

## 5. 세션·컨텍스트 관리

긴 작업에서 컨텍스트를 다루는 손잡이들:

- `claude --continue`(`-c`) 최근 세션 이어가기 · `claude --resume`(`-r`) 목록에서 골라 재개
- `/clear` 새로 시작(이전 대화는 저장·재개 가능) · `/compact` 요약해 공간 확보 · `/context` 무엇이 컨텍스트를 채우는지 시각화

---

정리하면 흐름은 이렇다 — **큰 변경은 플랜 모드로 전략을 먼저**, **장황하거나 병렬인 일은 서브에이전트로 격리**, **반복·자동화는 헤드리스로 스크립트화**. 여기서 더 나아가 훅·커스텀 명령으로 도구 자체를 확장하는 이야기는 [Claude Code 확장하기 — hooks와 커스텀 슬래시 명령](/posts/ai/2026-07-03-claude-code-hooks-custom-commands/)으로 이어진다. 전체 경로는 [AI 로드맵](/posts/ai/2026-07-03-ai-roadmap/).
