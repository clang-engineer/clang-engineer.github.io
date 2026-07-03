---
title       : "Claude Code 슬래시 명령어 사전"
description : "Claude Code(CLI)에서 사용 가능한 슬래시 명령어를 기본/설정/프로젝트/Git/계정/통합 카테고리로 분류해 한눈에 보기."
date        : 2025-10-24 11:30:00 +0900
updated     : 2026-06-19 10:00:00 +0900
categories  : [ai, "Claude Code"]
tags        : [claude-code, slash-commands, cli]
pin         : false
hidden      : false
---

> 관련: [AI 로드맵](/posts/ai/2026-07-03-ai-roadmap/)의 **Claude Code** 갈래 2단계(매일 쓰기)

Claude Code(CLI)의 슬래시 명령어 전체 사전. 영역별로 묶어 정리. 전체 개요·설치·MCP는 [Claude Code 개요](/posts/ai/2025-10-24-claude-code/) 참고.

## 자주 쓰는 것

| 명령어 | 설명 | 언제 쓰나 |
| --- | --- | --- |
| `/clear` | 대화 기록 초기화 | 작업 주제가 바뀔 때. 이전 맥락이 남아 엉뚱한 참조를 하기 전에 끊어준다 |
| `/compact [instructions]` | 대화 기록을 요약해 컨텍스트 유지 | 긴 작업 중 컨텍스트가 차오를 때. instructions로 "무엇을 남길지" 지정 가능 |
| `/context` | 컨텍스트 사용량을 컬러 그리드로 시각화 | 응답이 느려지거나 잘림이 의심될 때 어디서 토큰이 새는지 확인 |
| `/rewind` | 코드·대화를 이전 시점으로 복원 | 에이전트가 파일을 잘못 건드렸을 때 git 없이 되감기 |
| `/resume` | 이전 대화 재개 | 세션을 닫았다가 같은 맥락에서 다시 시작할 때 |
| `/usage` | 토큰 사용량(플랜 한도 대비) 확인 | 사용량 제한에 가까워졌는지 점검 |
| `/cost` | 현재 세션의 총 비용·소요 시간 | API 키 과금 시 세션 단위 비용 추적 |
| `/export` | 현재 대화를 파일·클립보드로 내보내기 | 작업 기록을 공유하거나 보관할 때 |
| `/help` | 도움말 및 사용 가능한 명령어 표시 | 명령어가 기억 안 날 때 (이 글이 안 보일 때의 대안) |

## 설정·관리

| 명령어 | 설명 |
| --- | --- |
| `/permissions` | 도구 권한 규칙 관리 (허용/거부) |
| `/config` | 설정 패널 열기 |
| `/model` | Claude Code의 AI 모델 설정 |
| `/privacy-settings` | 개인정보 설정 보기/업데이트 |
| `/output-style` | 출력 스타일 설정 |
| `/statusline` | Claude Code의 상태 표시줄 UI 설정 |
| `/vim` | Vim과 일반 편집 모드 간 전환 |

## 프로젝트·개발

| 명령어 | 설명 |
| --- | --- |
| `/init` | 새로운 `CLAUDE.md` 파일 초기화(코드베이스 문서화) |
| `/add-dir` | 새 작업 디렉토리 추가 |
| `/memory` | Claude 메모리 파일 편집 |
| `/todos` | 현재 todo 항목 목록 표시 |
| `/bashes` | 백그라운드 작업 목록 및 관리 |
| `/agents` | 에이전트 구성 관리 |
| `/hooks` | 도구 이벤트에 대한 훅 구성 관리 |

## Git·PR

| 명령어 | 설명 |
| --- | --- |
| `/review` | Pull Request 리뷰 |
| `/pr-comments` | GitHub Pull Request의 댓글 가져오기 |
| `/security-review` | 현재 브랜치의 보류 중인 변경사항 보안 리뷰 |
| `/install-github-app` | 저장소에 Claude GitHub Actions 설정 |

## 계정·시스템

| 명령어 | 설명 |
| --- | --- |
| `/login` | Anthropic 계정으로 로그인 |
| `/logout` | Anthropic 계정에서 로그아웃 |
| `/status` | Claude Code 상태 표시(버전, 모델, 계정, API 연결 등) |
| `/doctor` | Claude Code 설치/설정 진단 |
| `/upgrade` | Max 플랜으로 업그레이드(더 높은 속도 제한) |
| `/release-notes` | 릴리스 노트 보기 |
| `/feedback` | Claude Code에 대한 피드백 제출 |

## 통합

| 명령어 | 설명 |
| --- | --- |
| `/mcp` | MCP 서버 관리 |
| `/plugin` | Claude Code 플러그인 관리 |
| `/ide` | IDE 통합 관리 및 상태 표시 |
| `/terminal-setup` | 새 줄을 위한 Shift+Enter 키 바인딩 설치 |

## 커스텀 명령어 만들기

자주 시키는 작업은 마크다운 파일로 저장해 슬래시 명령으로 부른다. 여기가 슬래시 명령어를 "외우는" 단계에서 "내가 만드는" 단계로 넘어가는 부분이다.

### 저장 위치 — 범위가 곧 폴더

| 위치 | 범위 | 호출 |
| --- | --- | --- |
| `.claude/commands/` | 이 프로젝트 전용 (팀 공유, git 커밋) | `/이름` |
| `~/.claude/commands/` | 내 모든 프로젝트 | `/이름` |

파일명이 곧 명령어 이름이다. `.claude/commands/fix-issue.md` → `/fix-issue`.

### 인자 받기

`$ARGUMENTS`는 호출 시 뒤에 붙인 전체 문자열, `$1` `$2`는 위치 인자다.

```markdown
GitHub 이슈를 분석하고 수정한다: $ARGUMENTS

단계:
1. `gh issue view`로 이슈 세부사항 확인
2. 코드베이스에서 관련 파일 검색
3. 수정 구현 → 테스트 → 린트·타입 체크 통과
4. 설명 포함 커밋 후 PR 생성
```

```bash
> /fix-issue 1234        # $ARGUMENTS = "1234"
```

### frontmatter로 동작 제어

명령 파일 상단에 메타데이터를 붙여 설명·인자 힌트·허용 도구·모델을 지정한다.

```markdown
---
description : 변경된 파일만 린트하고 자동 수정
argument-hint: "[브랜치명]"
allowed-tools: Bash(git diff:*), Bash(npm run lint:*)
model       : claude-haiku-4-5
---

`$1` 브랜치와의 diff에서 변경된 파일을 찾아 린트를 돌리고 고친다.
```

- `description` — `/help`와 명령 목록에 표시되는 한 줄 설명
- `argument-hint` — 자동완성에 뜨는 인자 형식 힌트
- `allowed-tools` — 이 명령이 권한 프롬프트 없이 쓸 수 있는 도구 화이트리스트
- `model` — 명령 실행에 쓸 모델 고정 (간단한 작업은 저렴한 모델로)

### 본문에서 셸·파일 끌어오기

명령 본문은 그대로 프롬프트가 된다. 두 접두어로 실행 시점의 컨텍스트를 주입한다.

- `!명령` — 셸 명령을 **실행**해 그 출력을 프롬프트에 넣는다 (예: `!git status`)
- `@경로` — 파일 내용을 프롬프트에 넣는다 (예: `@src/config.ts`)

```markdown
---
description: 현재 staged 변경에 대한 커밋 메시지 작성
allowed-tools: Bash(git diff:*)
---

다음 staged diff를 보고 Conventional Commits 형식으로 커밋 메시지를 써라:

!git diff --staged
```

### 하위 폴더로 분류

`.claude/commands/git/sync.md`처럼 폴더에 넣으면 `/help`에서 그룹으로 묶여 보인다. 호출은 여전히 `/sync` (폴더명은 표시용 네임스페이스).

> 슬래시 명령은 단발 작업용이다. 권한 규칙·자동 실행처럼 "매번 X 하면 Y" 같은 동작은 명령이 아니라 hooks(`/hooks`)나 `CLAUDE.md`로 풀어야 한다.
{: .prompt-tip }

## 참고

- 전체 개요·설치·작동 모드: [Claude Code 개요](/posts/ai/2025-10-24-claude-code/)
- 메모리 시스템: [Claude Code 메모리 시스템](/posts/ai/2026-03-12-claude-code-memory/)
- MCP 프로토콜: [Model Context Protocol(MCP) 개념 정리](/posts/ai/2025-10-23-mcp/)
