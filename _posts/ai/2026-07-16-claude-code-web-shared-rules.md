---
title       : "Claude Code 웹은 내 글로벌 룰을 안 읽는다 — 한 원본에서 여러 repo로 배포하기"
description : "claude.ai의 Code(웹)는 연결된 repo에 커밋된 config만 읽는다. 로컬 CLI가 쓰는 ~/.claude 글로벌 룰·메모리는 로드되지 않는다. @import·submodule 우회가 왜 웹에서 깨지는지, 그리고 공통 원칙을 단일 원본에서 여러 repo로 중복 없이 배포하는 방법."
date        : 2026-07-16 11:00:00 +0900
updated     : 2026-07-16 11:00:00 +0900
categories  : [ai, "Claude Code"]
tags        : [claude, claude-code, dotfiles, guide]
pin         : false
hidden      : false
---

> 관련: claude.ai 웹의 메뉴 지형은 [claude.ai 웹 지형](/posts/ai/2026-07-13-claude-ai-web-tour/)에서 · 로컬 CLI의 규칙·메모리 구조는 [Claude Code 메모리 시스템](/posts/ai/2026-03-12-claude-code-memory/)에서.

로컬에서 Claude Code CLI를 쓰다 보면 `~/.claude/CLAUDE.md`에 내 개인 원칙(가독성 우선, YAGNI, 커밋 컨벤션…)을 적어두고, 모든 프로젝트에서 그게 자동으로 적용되는 데 익숙해진다. 그런데 claude.ai의 **Code(웹)** — GitHub repo를 연결해 클라우드 샌드박스에서 돌리는 버전 — 로 넘어가면, 그 룰이 **하나도 안 먹는다.** 왜 그런지, 그리고 어떻게 하면 개인 원칙을 웹에서도 쓰게 만드는지 정리한다.

## 웹은 "repo에 커밋된 config"만 읽는다

Claude Code 웹은 연결된 repo를 **`git clone`** 해서 샌드박스에 올린다. 즉 로드되는 설정의 범위가 **그 clone 안에 존재하는 파일**로 한정된다. 구체적으로 웹이 읽는 것:

- `CLAUDE.md` (repo 루트의 프로젝트 지침)
- `.claude/rules/`, `.claude/settings.json`
- `.claude/skills/`, `.claude/agents/`, `.claude/commands/`
- `.mcp.json`

반대로 **안** 읽는 것 — 로컬 CLI는 읽지만 clone에는 없는 것들:

- `~/.claude/CLAUDE.md` — **글로벌 룰.** 홈 디렉토리는 clone에 포함되지 않는다.
- `~/.claude/...`의 auto-memory, user-level `settings.json`
- 사용자 레벨 MCP 서버 설정

원리는 단순하다. **홈 디렉토리가 샌드박스에 없으니 홈에 있는 것은 존재하지 않는다.** 로컬의 편의(홈에 한 번 적어두면 전역 적용)가 웹에서는 성립하지 않는 이유가 여기 있다. 그래서 웹에서 원칙을 적용하려면 **원칙이 repo 안에 커밋돼 있어야** 한다.

## 안 되는 우회들부터 지운다

"그럼 링크만 걸면 되지 않나" 싶은 우회가 몇 개 떠오르는데, 웹에서는 대부분 조용히 깨진다. 먼저 지우고 가자.

### `@import`로 홈 파일 가져오기 — ✗

`CLAUDE.md`는 다른 파일을 `@path/to/file` 문법으로 가져올 수 있다(최대 4 hop). 그래서 각 repo의 `CLAUDE.md`에 `@~/.claude/CLAUDE.md` 한 줄만 넣으면 될 것 같지만 — **홈 경로 import는 웹에서 broken.** clone 안에 홈이 없으니 `~`가 가리킬 대상이 없다.

### git submodule + import — ✗

원칙 repo를 각 프로젝트에 **submodule**(다른 git repo를 하위 디렉토리로 품는 것)로 넣고 `@submodule/rules.md`로 참조하는 방법. 이건 로컬에선 되지만 웹에서 깨진다. **웹의 `git clone`은 submodule을 auto-init 하지 않는다** — `git clone --recurse-submodules`가 아니라 얕은 clone이라, submodule 디렉토리가 비어 있다. SessionStart 훅으로 `git submodule update`를 돌리는 우회도 있지만, 훅 실행과 config 로드의 타이밍 경합(race)이 있어 취약하다. 정공법이 아니다.

### org 레벨 공유 설정(`claudeMd`) — ✗ (개인 플랜)

조직 단위로 규칙을 서버에서 관리해 모든 repo에 주입하는 기능은 있다. 다만 **Teams/Enterprise 전용**이라 개인 플랜에서는 못 쓴다.

→ 남는 정공법은 하나. **각 repo에 실제 규칙 파일을 커밋**한다(`<repo>/.claude/rules/principles.md`). 링크가 아니라 파일이니 clone에 그대로 딸려와 웹이 읽는다. 문제는 "그럼 N개 repo에 같은 파일이 중복되는데?"인데, 이걸 단일 원본으로 관리하는 게 이 글의 본론이다.

## 되는 방법: 단일 원본 → 추출 → N repo 배포

### private 원본을 그대로 뿌리면 안 된다

내 글로벌 `CLAUDE.md`(private repo에 보관)를 각 repo에 그대로 복사하면 세 가지가 터진다:

1. **유출** — 글로벌 룰에는 개인 vault 경로, 내부 워크플로우, 익명화 규칙 같은 게 섞여 있다. 이게 public repo에 커밋되면 내부 구조가 샌다.
2. **웹에서 broken** — 머신 로컬 경로(`~/.claude/...`), 로컬 메모리 참조 등은 웹에서 의미가 없다.
3. **노이즈** — 개인 알림·학습 워크플로우 규칙까지 남의(혹은 협업) 프로젝트 컨텍스트에 매번 주입할 필요가 없다.

그래서 배포 대상은 전체가 아니라, **어느 환경·어느 프로젝트에서나 통하는 순수 엔지니어링 원칙만** 뽑은 subset이어야 한다.

### 마커로 감싸 추출하면 원본이 하나로 유지된다

subset을 **별도 파일로 손으로 관리**하면, 원본을 고칠 때마다 subset도 맞춰줘야 하는 **drift**(두 사본이 어긋남)가 생긴다. 이걸 없애는 방법은 subset을 "손으로 유지하는 사본"이 아니라 "원본에서 뽑아낸 생성물"로 만드는 것.

원본 `CLAUDE.md`에서 portable한 구간을 주석 마커로 감싼다:

```markdown
# Global Claude Code Instructions

<!-- portable:start -->

## 최우선 원칙: 가독성
...
## 커밋 컨벤션
...

<!-- portable:end -->

## 구조 정리   ← 여기부터는 개인용, 배포 안 함
...
```

그리고 배포 스크립트가 마커 사이만 뽑는다:

```bash
awk '/<!-- portable:start/{g=1;next} /<!-- portable:end/{g=0} g' CLAUDE.md
```

`awk`(Aho·Weinberger·Kernighan 세 저자 이름 머리글자)로 `portable:start`를 만나면 플래그 `g`를 켜고, `portable:end`에서 끄고, `g`가 켜진 줄만 출력한다. 이렇게 뽑은 블록에 "이 파일은 생성물이니 직접 고치지 말 것" 배너를 붙여 각 repo의 `.claude/rules/principles.md`로 쓴다.

```bash
#!/usr/bin/env bash
set -euo pipefail

TARGETS=("$DOTFILES_DIR" "$DEVKIT_DIR" "$BLOG_DIR")   # 웹에서 여는 public repo만

portable="$(awk '/<!-- portable:start/{g=1;next} /<!-- portable:end/{g=0} g' "$SOURCE_CLAUDE_MD")"
content="# Engineering Principles

<!-- 생성됨: 원본 CLAUDE.md의 portable 블록에서 추출. 직접 고치지 말 것. -->
$portable"

for repo in "${TARGETS[@]}"; do
  mkdir -p "$repo/.claude/rules"
  printf '%s\n' "$content" > "$repo/.claude/rules/principles.md"
  git -C "$repo" add "$repo/.claude/rules/principles.md"
done
```

이제 authored 원본은 **`CLAUDE.md` 한 곳**이고, 각 repo의 `principles.md`는 순수 생성물이다. 손으로 관리하는 사본이 0개라 drift가 원천적으로 불가능하다. 원칙을 고칠 일이 생기면 **원본 마커 블록만 고치고 스크립트를 돌린 뒤, 각 repo에서 커밋·push**하면 웹에 반영된다.

> **전제 하나:** 마커 추출이 깔끔하려면 portable한 섹션이 파일 안에서 **연속된 블록**이어야 한다. 개인용 섹션이 파일 아래쪽으로 몰려 있으면 상단을 통째로 뗄 수 있지만, 여기저기 흩어져 있으면 마커를 여러 쌍 쓰거나 파일을 재구조화해야 한다.

## 곁다리 인사이트 — "중복 제거"에도 방향이 둘이다

이 작업에서 나온 판단 하나가 재사용할 만하다. 처음엔 배포 대상 목록을 `targets.txt`라는 **데이터 파일**로 분리했다("반복되는 값은 데이터로 분리한다"는 통념대로). 그런데 그 목록의 소비자가 스크립트 하나뿐이고 4줄짜리라, 외부 파일을 읽느라 주석 제거·공백 트림 파싱까지 스크립트에 붙는 역효과가 났다. 그래서 bash 배열로 **인라인**해 파싱 로직째 지웠다.

같은 세션에서 원칙 subset은 반대로 **마커 추출로 한 소스에 합쳤다.** 둘 다 "중복 제거"인데 방향이 정반대다 — 하나는 파일을 없애고, 하나는 파일을 (생성물로) 만든다. 가르는 기준은 **파일 개수가 아니라 손으로 관리하는(authored) 사본이 몇 개냐**다.

- target 목록: authored 사본이 원래 **1개** → 굳이 파일로 떼면 과분리. 인라인이 맞다.
- 원칙 subset: authored 사본이 **2개**(원본 + 손 관리 복사본) → 마커 추출로 1개로 줄이는 게 맞다.

곁들여, 배포 스크립트에 "각 repo에 커밋까지 해주는 `--commit` 플래그"를 넣었다가 뺐다. push는 어차피 repo마다 수동이라 자동화로 절약되는 게 `git commit` 한 줄뿐이었고, 드물게 쓰는 편의를 위해 상시 유지하는 분기는 YAGNI(You Aren't Gonna Need It)였다. **편의 기능도 실제 절약폭으로 값을 매긴다.**

## 정리

- Claude Code **웹은 clone된 repo의 커밋 config만** 읽는다. `~/.claude`의 글로벌 룰·메모리는 홈이 clone에 없어 로드되지 않는다.
- `@~/` import·submodule·org 설정 우회는 개인 플랜 웹에서 깨지거나 못 쓴다. 정공법은 **repo에 규칙 파일을 커밋**하는 것.
- 중복은 **단일 원본(마커 블록) → 추출 → 배포**로 없앤다. 배포본은 private 전체가 아니라 **portable subset**만.
- 정리의 방향(합치기 vs 뽑기)은 파일 수가 아니라 **authored 사본 수**로 판단한다.
