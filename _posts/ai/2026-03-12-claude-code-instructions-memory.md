---
title       : "Claude Code 지침·메모리 — 로컬과 클라우드에서 같은 원칙 유지하기"
description : "CLAUDE.md·경로별 규칙·Auto Memory의 역할과 로딩 범위를 구분하고, 로컬 지침을 클라우드에 적용할 때 공개 가능한 부분만 단일 원본에서 배포하는 방법을 설명한다."
date        : 2026-03-12 23:30:00 +0900
updated     : 2026-11-18 12:00:00 +0900
categories  : [ai, "Claude Code"]
tags        : [claude-code, memory, instructions, dotfiles, cloud, guide]
redirect_from:
  - /posts/ai/2026-03-12-claude-code-memory/
  - /posts/ai/2026-07-16-claude-code-web-shared-rules/
pin         : false
hidden      : false
---

> 관련: [AI 개발 지형](./2026-07-03-ai-development-map.md) · 작업 절차와 자동화는 [Claude Code 작업 설계](./2026-07-03-claude-code-workflow.md) · 화면 구분은 [claude.ai 웹 지형](./2026-07-13-claude-ai-web-tour.md)

Claude Code에 “기억해 줘”라고 할 때 서로 다른 두 가지를 섞기 쉽다. 하나는 사람이 정한 규칙이고, 다른 하나는 작업 중 얻은 프로젝트 지식이다. 여기에 로컬과 클라우드의 실행 환경 차이가 겹치면 “홈에 한 번 적어 두었는데 왜 웹에서는 안 읽지?”라는 문제가 생긴다.

먼저 **내용의 성격과 파일의 가시성**을 나눠 본다. 아래 화살표는 파일을 발견해 컨텍스트로 읽는 과정이며, 로컬 파일을 원격으로 동기화하는 경로가 아니다.

```text
사람이 정한 지침                  작업에서 학습한 맥락
CLAUDE.md / .claude/rules/        Auto Memory의 주제 파일
            │                              │
            └──── 실행 환경에서 접근 가능한가? ───┘
                               ↓
               시작 시 로드 / 파일 접근 시 로드 / 필요할 때 읽기
                               ↓
                    현재 세션의 컨텍스트

로컬 홈의 파일 ≠ Git 저장소의 파일 ≠ 클라우드 환경의 파일
```

## 지침과 학습은 서로 대체하지 않는다

| 내용 | 적합한 위치 | 예 |
|---|---|---|
| 조직 정책 | 관리자가 배포하는 지침·설정 | 보안·컴플라이언스 |
| 모든 프로젝트의 개인 원칙 | `~/.claude/CLAUDE.md`, 사용자 규칙 | 언어·공통 작업 선호 |
| 팀의 저장소 계약 | 프로젝트 `CLAUDE.md` 또는 `.claude/CLAUDE.md` | 빌드·검증·변경 금지선 |
| 특정 파일군의 규칙 | `.claude/rules/*.md`의 `paths` | 프런트엔드 코드 규칙 |
| 개인의 프로젝트별 지침 | `CLAUDE.local.md` | 로컬 개발 환경; 직접 gitignore 확인 |
| 작업 중 얻은 맥락 | Auto Memory | 특정 테스트 데이터의 준비 순서 |

`CLAUDE.md`는 명시 지침이고 Auto Memory는 Claude가 관리하는 학습 기록이다. 어느 쪽도 보안 정책이나 테스트를 기계적으로 강제하지 않는다. “항상 테스트해야 한다”는 지침과 “CI가 테스트 실패 시 병합을 막는다”는 서로 다른 보장이다.

Managed Policy 지침의 대표 위치는 macOS `/Library/Application Support/ClaudeCode/CLAUDE.md`, Linux·WSL `/etc/claude-code/CLAUDE.md`, Windows `C:\Program Files\ClaudeCode\CLAUDE.md`다. 조직 배포와 사용자 로컬 설정을 같은 파일로 취급하지 않는다.

## 로딩은 덮어쓰기가 아니라 문맥의 누적이다

시작할 때 상위 경로의 지침을 읽고, 하위 디렉터리의 지침은 해당 파일을 다룰 때 추가로 읽는다. 사용자·프로젝트 규칙이 함께 로드될 수 있지만 CSS처럼 후순위가 항상 앞의 규칙을 덮는 계약은 아니다. 충돌하는 지침을 두 곳에 쓰면 모델이 일관되지 않게 해석할 수 있다.

```text
~/.claude/CLAUDE.md         # 이 머신의 개인 공통 지침
project/CLAUDE.md           # 팀 공유 지침
project/CLAUDE.local.md     # 개인 프로젝트 지침; 커밋 제외
project/src/CLAUDE.md       # 해당 경로를 다룰 때 로드
project/.claude/rules/      # 주제·경로별 규칙
```

같은 규칙을 여러 계층에 복제하기보다 소유하는 위치를 정한다. `/memory`로 현재 지침·Memory를 확인하고, `/init`으로 만든 초기 지침도 저장소의 실제 빌드·검증 방법에 맞춰 검토한다.

### Import는 사본을 줄이지만 컨텍스트를 줄이지 않는다

```markdown
@src/docs/coding-standards.md
@~/.claude/instructions.md
@../shared/common-rules.md
```

상대경로는 현재 셸의 cwd가 아니라 **가져오는 파일의 위치**를 기준으로 해석한다. 재귀 Import는 최대 4 hops이고, 실제 파일이 있어야 한다. 작업 디렉터리 밖의 Import에는 승인 등 추가 경계가 적용될 수 있다.

Import는 내용을 함께 로드하는 것이므로 긴 지침을 다른 파일로 옮기고 모두 Import한다고 입력 토큰이 줄어드는 것은 아니다. 모든 작업에서 필요하지 않은 긴 절차라면 [Skill](./2026-07-03-claude-code-workflow.md)로 분리하는 편이 맞다.

### 경로별 규칙은 적용 대상을 좁힌다

```markdown
---
paths:
  - "src/**/*.tsx"
  - "src/**/*.ts"
---

- React 컴포넌트는 함수형으로 작성한다.
- 이 경로의 변경은 TypeScript 검사를 수행한다.
```

`paths`가 없는 규칙은 시작부터 적용될 수 있고, 경로가 지정된 규칙은 해당 파일 접근 시 로드된다. `.claude/rules/`를 기능·언어별로 나누되, 모든 파일을 무조건 세분화하는 대신 적용 범위가 실제로 다른지를 본다.

## Auto Memory는 인덱스와 주제 파일로 관리한다

Auto Memory는 기본 활성화된 프로젝트 학습 영역이다. 기본 경로는 다음과 같다.

```text
~/.claude/projects/<project>/memory/
├── MEMORY.md                 # 시작 시 읽는 짧은 인덱스
├── debugging.md              # 필요할 때 읽는 상세 내용
├── architecture.md
└── feedback_test_setup.md
```

시작 시 자동 로드되는 것은 `MEMORY.md`의 **처음 200줄 또는 25KB 중 먼저 도달하는 범위**다. 주제 파일은 필요할 때 읽는다. 따라서 인덱스에 상세 경험을 끝없이 쌓기보다 요약·링크를 남긴다.

같은 저장소의 worktree·하위 디렉터리는 Auto Memory를 공유하지만, 서로 다른 머신이나 클라우드 환경까지 자동 동기화되는 것은 아니다. `CLAUDE.local.md`처럼 gitignore된 지침은 각 작업 디렉터리에서 별도로 존재할 수 있으므로 공유 범위를 따로 본다.

### “기억해”와 “잊어”는 파일·인덱스를 함께 처리한다

“테스트 전에 데이터를 준비해야 한다”는 교정이라면, 모든 세션이 지킬 명시 계약인지 경험에서 얻은 맥락인지 먼저 구분한다. 후자라면 같은 주제 파일을 갱신하고 `MEMORY.md`에서 찾을 수 있게 한다.

잊어 달라는 요청도 주제 파일과 해당 인덱스 항목을 함께 처리해야 한다. 하나만 지우면 깨진 참조나 오래된 요약이 다음 세션에 다시 나타난다. 다른 프로세스가 파일을 갱신했을 수 있으므로 편집 직전에 다시 읽는다.

과거 메모에 등장한 `metadata.type` 같은 frontmatter나 프로젝트 절대경로 문자 치환법을 안정적인 저장 계약으로 일반화하지 않는다. 공식 문서는 `user`·`feedback`·`project`·`reference`를 `type`으로 설명한다. 파일 위치와 현재 내용은 `/memory`에서 확인한다.

Auto Memory를 끄려면 지원되는 환경에서 `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`을 사용할 수 있다. 상세한 범위·조직 정책은 [공식 Memory 문서](https://code.claude.com/docs/en/memory)를 따른다.

## 로컬에서 읽던 지침이 클라우드에서 빠지는 이유

로컬 CLI는 내 홈 디렉터리의 지침과 설정에 접근한다. 클라우드 세션은 **다른 머신의 환경**에서 실행되므로 내 `~/.claude/CLAUDE.md`, 로컬 Memory, 사용자 Hook이 자동으로 따라가지 않는다.

하지만 “웹은 저장소에 커밋한 파일만 읽을 수 있다”는 절대 규칙도 정확하지 않다. 현재 [클라우드 환경 문서](https://code.claude.com/docs/en/cloud-environments)는 환경의 Setup Script로 클라우드의 `~/.claude/CLAUDE.md`를 준비하는 방법도 제공한다. 계정 동기화 기능과 조직 관리 기능도 로컬 파일 복사와 별도로 확인해야 한다.

| 경로 | 성립 조건 | 주의점 |
|---|---|---|
| 저장소에 공개 가능한 지침 커밋 | clone에 파일이 포함됨 | 팀이 검토할 수 있으나 개인 정보 제외 필요 |
| 환경 Setup Script로 준비 | 시작 전에 실행되고 필요한 파일 접근 가능 | 인증·네트워크·캐시·실행 순서 확인 |
| `@~/.claude/...` Import | 클라우드의 그 경로에 실제 파일이 있음 | 로컬 홈을 원격에서 읽는 마법의 링크가 아님 |
| submodule 경로 Import | 해당 환경에서 submodule checkout이 완료됨 | 자동 초기화 여부와 지침 로딩 시점을 검증 |
| 조직 관리·계정 동기화 | 해당 기능·플랜·클라우드 모드가 지원 | 로컬 `~/.claude` 전체 동기화와는 다름 |

과거 웹 실험에서 submodule이 비어 있고 세션 Hook의 준비 시점이 늦는 문제를 겪었다고 해도, 이를 모든 현재 클라우드의 영구 제약으로 일반화하지 않는다. 반대로 환경 초기화가 가능하다는 이유로 사용자 Hook·플러그인이 모든 웹 모드에서 동일하게 실행된다고 가정해서도 안 된다. 단일 저장소 세션과 프로젝트의 클라우드 스레드 등 실행 표면별 차이가 있다.

## 여러 저장소에 같은 원칙을 배포할 때

여러 저장소에서 바로 읽을 공통 지침이 필요하다면, **한 원본에서 공개 가능한 부분만 추출해 생성물로 배포**할 수 있다. 이 방법의 목적은 모든 사람이 같은 개인 지침을 쓰게 하는 것이 아니라, 손으로 관리하는 사본을 하나로 줄이는 것이다.

개인 원본 전체를 복사하면 문제가 생긴다.

1. 비공개 경로·내부 작업 방식·개인 정보가 공개 저장소로 나갈 수 있다.
2. 로컬 홈·Memory 참조는 클라우드에서 성립하지 않을 수 있다.
3. 개인 알림과 무관한 절차까지 매 세션에 주입하면 컨텍스트가 커진다.

그래서 배포할 부분을 portable subset으로 한정한다.

### 마커 블록을 원본으로, 저장소 파일을 생성물로

```markdown
# Global Instructions

<!-- portable:start -->

## 엔지니어링 원칙
- 변경 전에 영향 범위를 확인한다.
- 검증 결과를 실제 실행한 범위대로 보고한다.

<!-- portable:end -->

## 개인 환경
이 아래의 경로·알림·내부 절차는 공개 배포하지 않는다.
```

아래는 추출 원리를 보여 주는 예시다. `SOURCE_CLAUDE_MD`는 원본 경로, `TARGET_REPOS`는 검토한 대상 경로 배열이다. 실제 배포 도구를 만드는 경우에는 마커의 누락·중복과 생성 결과도 검증한다.

```bash
#!/usr/bin/env bash
set -euo pipefail

SOURCE_CLAUDE_MD="/path/to/private/CLAUDE.md"
TARGET_REPOS=("/path/to/project-a" "/path/to/project-b")

portable=$(awk '
  /<!-- portable:start -->/ { g=1; next }
  /<!-- portable:end -->/   { g=0 }
  g
' "$SOURCE_CLAUDE_MD")
[[ -n "$portable" ]] || { printf '%s\n' '배포할 내용 없음' >&2; exit 1; }

for repo in "${TARGET_REPOS[@]}"; do
  mkdir -p "$repo/.claude/rules"
  {
    printf '%s\n\n' '# Engineering Principles'
    printf '%s\n\n' '<!-- 생성물: 원본의 portable 블록을 수정하고 다시 배포한다. -->'
    printf '%s\n' "$portable"
  } > "$repo/.claude/rules/principles.md"
done
# 각 저장소에서 diff·공개 가능 내용을 검토한 뒤 명시적으로 커밋·push
```

`awk`는 마커 사이에서만 출력하는 상태를 유지한다. 배포 파일을 손으로 고치지 않으므로 원본과 수동 사본이 서로 어긋나는 drift를 줄인다. 다만 **원본을 바꾼 뒤 배포를 잊는 지연**은 여전히 생길 수 있다. 생성물이라는 사실만으로 모든 동기화 문제가 사라지는 것은 아니다.

마커 안의 내용은 연속된 블록이어야 한다. 개인 내용과 배포 내용이 뒤섞여 있다면 파일을 먼저 재구성하거나 명시적인 여러 블록 정책을 정한다. 생성된 파일에도 비밀이 없는지 검토하고, 자동 생성이 커밋·원격 공개 승인까지 의미한다고 보지 않는다.

### 중복 제거는 파일 수보다 작성 원본 수를 본다

배포 대상이 두세 곳뿐이고 소비자가 스크립트 하나라면 대상 목록을 별도 텍스트 파일로 떼는 것보다 배열로 두는 편이 단순할 수 있다. 반대로 공통 원칙을 여러 저장소에서 손으로 관리하고 있다면 생성 배포로 작성 원본을 하나로 줄일 가치가 있다.

```text
작은 대상 목록 : 작성 원본이 이미 1개 → 불필요한 파일·파서 추가를 피함
공통 지침 사본 : 작성 원본이 여러 개 → 원본 1개 + 생성물로 변경
```

가끔 쓰는 `--commit` 편의를 추가하기 위해 여러 저장소의 staging·커밋 정책까지 스크립트가 관리하면 유지 비용이 더 커질 수 있다. 자동화 범위는 실제 절약되는 작업과 공개 위험으로 결정한다.

## 정리

지침은 사람이 정한 계약이고, Memory는 학습한 맥락이다. 어느 파일이든 현재 실행 환경에서 접근할 수 있어야 읽힌다. 로컬 지침이 클라우드로 저절로 따라간다고 기대하지 않고, 환경 초기화와 저장소 배포 중 맞는 경로를 고른다.

여러 저장소가 같은 공통 원칙을 필요로 한다면 공개 가능한 부분만 단일 원본에서 생성한다. **무엇을 기억할지, 어디서 읽을지, 누가 원본을 수정할지**를 구분하면 규칙 복제와 환경 차이로 생기는 혼란을 줄일 수 있다.

## 참고

- [Claude Code Memory](https://code.claude.com/docs/en/memory)
- [Cloud environments](https://code.claude.com/docs/en/cloud-environments)
- [Skills](https://code.claude.com/docs/en/skills)
- [작업 설계: Plan·Skill·Subagent·Hook](./2026-07-03-claude-code-workflow.md)
