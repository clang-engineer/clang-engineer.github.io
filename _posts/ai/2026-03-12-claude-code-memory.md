---
title       : Claude Code 메모리 시스템 정리
description : CLAUDE.md와 Auto Memory를 활용한 프로젝트 컨텍스트 관리
date        : 2026-03-12 23:30:00 +0900
updated     : 2026-11-16 12:00:00 +0900
categories  : [ai, "Claude Code"]
tags        : [claude-code]
pin         : false
hidden      : false
---

> 관련: [AI 로드맵](./2026-07-03-ai-roadmap.md)의 **Claude Code** 갈래 2단계(매일 쓰기)

## 메모리 시스템 개요

Claude Code는 세션 간 컨텍스트를 유지하기 위해 두 가지 축의 메모리 시스템을 제공한다.

- **CLAUDE.md** : 명시적으로 작성하는 지침 파일. 프로젝트 규칙, 코딩 컨벤션 등을 기록
- **Auto Memory** : 대화 중 자동으로 학습·저장되는 패턴 기반 메모리

---

## 6가지 메모리 저장소

| 유형 | 위치 | 범위 | 용도 |
|------|------|------|------|
| **Managed Policy** | OS별 시스템 경로 (아래 참고) | 조직 전체 | 보안·컴플라이언스 정책 |
| **Project Memory** | `./CLAUDE.md` 또는 `./.claude/CLAUDE.md` | 팀 공유 | 프로젝트 규칙·컨벤션 |
| **Project Rules** | `./.claude/rules/*.md` | 팀 공유 | 언어/주제별 모듈화된 규칙 |
| **User Memory** | `~/.claude/CLAUDE.md` | 개인 전역 | 모든 프로젝트에 적용되는 개인 설정 |
| **Local Memory** | `./CLAUDE.local.md` | 개인 프로젝트 | 로컬 환경 설정 (자동 `.gitignore`) |
| **Auto Memory** | `~/.claude/projects/<project>/memory/` | 개인 프로젝트 | 자동 학습된 패턴·인사이트 |

로딩 순서 : System → User → Project → Directory-specific 순으로 계층적으로 로드된다.

> **Managed Policy 경로는 OS마다 다르다.**
> - macOS: `/Library/Application Support/ClaudeCode/CLAUDE.md`
> - Linux · WSL: `/etc/claude-code/CLAUDE.md`
> - Windows: `C:\Program Files\ClaudeCode\CLAUDE.md`

---

## CLAUDE.md 작성법

### 파일 계층 구조

```
/etc/claude-code/CLAUDE.md          # 조직 정책
~/.claude/CLAUDE.md                  # 개인 전역 설정
./CLAUDE.md                          # 프로젝트 공유 규칙
./.claude/CLAUDE.md                  # 확장 프로젝트 가이드
src/components/CLAUDE.md             # 디렉토리별 컨텍스트
```

하위 디렉토리에 CLAUDE.md를 두면, 해당 디렉토리의 파일을 다룰 때만 자동으로 로드된다.

### Import 문법 (`@`)

외부 파일을 참조하여 내용을 직접 포함시킬 수 있다.

```markdown
@src/docs/coding-standards.md
@~/.claude/instructions.md
@../shared/common-rules.md
```

- 상대 경로, 절대 경로, 홈 디렉토리 경로(`~`) 모두 지원
- import한 파일이 다시 import하는 재귀 참조는 **최대 4단계(4 hops)** 까지 가능

### Path-specific Rules (`.claude/rules/`)

`.claude/rules/` 디렉토리에 주제별 규칙 파일을 분리할 수 있다. YAML frontmatter의 `paths` 필드로 적용 범위를 지정한다.

```markdown
---
paths:
  - "src/**/*.tsx"
  - "src/**/*.ts"
---

- React 컴포넌트는 함수형으로 작성
- TypeScript strict 모드 사용
```

### CLAUDE.local.md

개인 로컬 설정용 파일로, 자동으로 `.gitignore`에 추가된다. 팀원에게 공유할 필요 없는 설정에 활용한다.

```markdown
# 로컬 개발 환경
- API URL: http://localhost:3000
- 테스트 DB: localhost:5432/dev_db
```

---

## Auto Memory

### 동작 방식

- 별도 설정 없이 **기본 활성화**
- 대화 중 프로젝트 관련 유용한 정보를 자동으로 저장
- 다음 세션 시작 시 자동 로드
- 명시적 저장 : `"bun을 사용해, npm 아님. 기억해"` 처럼 요청 가능

### 저장 구조

```
~/.claude/projects/<project>/memory/
├── MEMORY.md              # 인덱스 파일 (자동 로드)
├── debugging.md           # 주제별 상세 파일
├── architecture.md
└── user_preferences.md
```

- `MEMORY.md`는 인덱스 역할로, 각 주제 파일에 대한 포인터만 포함
- 상세 내용은 별도 주제 파일에 작성

### 200줄 제한

`MEMORY.md`는 **처음 200줄 또는 25KB 중 먼저 도달하는 지점까지만** 모든 대화 시작 시 로드된다. 초과분은 자동 로드되지 않으므로 인덱스는 간결하게 유지하고 상세 내용은 주제 파일로 분리해야 한다 (주제 파일은 필요할 때 on-demand로 읽힌다).

### 비활성화

```bash
# 환경 변수
export CLAUDE_CODE_DISABLE_AUTO_MEMORY=1

# 또는 settings.json에서 설정
```

---

## 실전 팁

- **프로젝트 시작 시** `/init` 명령어로 CLAUDE.md를 자동 생성할 수 있다
- **모듈화** : 하나의 거대한 CLAUDE.md보다 `.claude/rules/`에 주제별 파일을 분리하는 것이 관리에 유리
- **팀 협업** : CLAUDE.md 변경은 PR 리뷰를 거치는 것을 권장
- **Multi-worktree** : 프로젝트 경로 대신 홈 디렉토리 참조(`@~/.claude/instructions.md`) 활용
- **메모리 확인** : `/memory` 명령어로 로드된 메모리 파일과 Auto Memory 상태를 확인
- **효과적 작성** : 구체적 예시를 포함하고, 왜 그런 규칙인지 이유를 함께 기록
- **MEMORY.md** : 200줄 이내로 유지하고, 상세 내용은 주제 파일에 분리

### “기억해 줘”와 “잊어 줘”를 파일 관점에서 보기

예를 들어 “이 저장소에서는 테스트 전에 데이터를 준비해야 한다”는 교정을 기억시키려면 먼저 **지침인지 학습인지** 구분한다. 모든 세션이 지켜야 할 명시적 규칙이라면 `CLAUDE.md`가 적합하다. 경험을 통해 알게 된 프로젝트별 맥락이라면 Auto Memory의 주제 파일에 짧게 기록하고 `MEMORY.md` 인덱스에서 찾을 수 있게 한다.

```text
memory/
├── MEMORY.md                # 한 줄 요약과 주제 파일 링크
└── feedback_test_setup.md   # 교정의 배경과 적용 범위
```

같은 주제의 파일이 있다면 새 파일을 늘리기보다 내용을 갱신한다. 제목이나 의미가 달라지면 인덱스의 요약도 함께 고친다. “잊어 줘”라는 요청은 주제 파일 **및 해당 인덱스 항목**을 같이 처리해야 한다. 하나만 지우면 깨진 링크가 남거나 원치 않는 정보가 다음 세션에 다시 나타난다. 파일이 다른 프로세스에서 바뀌었다면 다시 읽고 편집해야 한다.

2026년 6월의 개인 메모에는 `name`·`description`·`metadata.type` 형태의 frontmatter 예시와 프로젝트 절대경로 문자 치환법이 적혀 있었다. 이를 **필수 스키마나 안정적인 경로 생성 계약으로 일반화하지 않는다.** 현재 공식 문서는 `user`·`feedback`·`project`·`reference`의 네 종류를 `type` 필드로 설명하고, 저장 경로를 저장소 기반의 `<project>`로 기술한다. 동일 저장소의 worktree가 메모리를 공유하며, 별도 주제 파일은 시작 시 자동 로드되지 않고 필요할 때 읽힌다. 저장한 기억을 확인하거나 수정하려면 `/memory`에서 파일을 연다. [Claude Code 공식 메모리 문서](https://code.claude.com/docs/en/memory)를 기준으로 실제 설치 버전의 동작을 확인하자.

---

## 참고

- [goddaehee - Claude Code 메모리 시스템 완벽 가이드](https://goddaehee.tistory.com/530)
- [Claude Code 공식 문서](https://docs.anthropic.com/en/docs/claude-code)
