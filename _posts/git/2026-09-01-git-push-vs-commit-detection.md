---
title       : "git push vs commit 구분 — 스크립트에서 dirty/ahead 판정"
description : "git status --porcelain으로 dirty(미커밋 변경)를 판별하고, git log @{u}..HEAD로 ahead(푸시 안 된 커밋)를 검사하는 두 감지 명령의 차이를 정리한다. tmux status bar, pre-commit hook 등 실전 활용 포함."
date        : 2026-09-01 12:00:00 +0900
updated     : 2026-09-01 12:00:00 +0900
categories  : [git, "커밋·히스토리"]
tags        : [git, tmux, status-bar, automation]
pin         : false
hidden      : false
---

tmux status bar에서 Git 브랜치와 상태를 표시하거나, pre-commit hook을 만들 때 "커밋했지만 push 안 됨"과 "아직 커밋도 안 됨"을 구분해야 한다. 두 상태는 감지 명령이 다르다.

## 두 가지 상태

| 상태 | 의미 | 감지 명령 |
|------|------|-----------|
| **ahead** | 커밋은 했지만 push 안 됨 | `git log @{u}..HEAD --oneline` |
| **dirty** | 아직 커밋 안 된 변경 존재 | `git status --porcelain` |

## ahead 판정 (푸시 안 된 커밋)

```bash
# upstream이 없으면 스킵
git rev-parse "@{u}" &>/dev/null || continue

# ahead가 있으면 push 대상
git log "@{u}..HEAD" --oneline
```

- `@{u}`는 upstream 브랜치 (예: `origin/main`)
- 출력이 있으면 = push 대상 커밋이 있다는 뜻
- upstream이 없는 브랜치에서는 에러가 나므로 `rev-parse`로 먼저 확인

## dirty 판정 (미커밋 변경)

```bash
[ -n "$(git status --porcelain)" ] && echo "dirty"
```

- `--porcelain`: 변경 있으면 파일 목록, 없으면 빈 문자열
- 스크립트에서 안정적으로 dirty 판정 가능
- `git status`의 출력은 로케일에 따라 달라지지만 porcelain은 고정

## 실전 조합 — tmux status bar

```bash
# tmux에서 Git 상태 표시
git_branch="#(git branch --show-current 2>/dev/null)"
git_dirty="#([ -n \"$(git status --porcelain 2>/dev/null)\" ] && echo '*')"
git_ahead="#([ -n \"$(git log @{u}..HEAD --oneline 2>/dev/null)\" ] && echo '↑')"

set -g status-right "$git_branch$git_dirty$git_ahead"
```

결과: `main*↑` (main 브랜치, 미커밋 변경 있음, push 대상 있음)

## 주의사항

- `--porcelain`은 `git status` 출력과 달리 사람이 읽기 어려운 대신 스크립트에 안정적
- upstream이 없는 브랜치에서는 ahead 검사 전에 `git rev-parse "@{u}"` 필수
- 여러 레포를 순회하는 스크립트에서는 `git -C <path>`로 경로 지정

## 참고

- [cheatsheet — git](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/git.md) — Git 명령어 빠른 참조
