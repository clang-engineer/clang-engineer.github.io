---
title       : "Git 상태 감지 — dirty와 ahead는 서로 다른 축이다"
description : "스크립트에서 미커밋 변경(dirty)과 upstream보다 앞선 커밋(ahead)을 같은 상태로 보지 않고 Working Tree/Index와 Commit Graph라는 서로 다른 축으로 판정하는 방법을 정리한다."
date        : 2026-09-01 12:00:00 +0900
updated     : 2026-09-05 19:40:00 +0900
categories  : [git, "커밋·히스토리"]
tags        : [git, tmux, status-bar, automation, concept]
pin         : false
hidden      : false
---

Git 상태 표시를 만들 때 "아직 commit하지 않은 변경"과 "commit은 했지만 upstream에 없는 변경"을 같은 상태로 보면 안 된다.

둘은 서로 다른 층을 본다.

```text
Working Tree / Index 상태
→ dirty

Local Branch / Upstream Commit Graph 상태
→ ahead / behind
```

따라서 tmux status bar나 자동화 스크립트에서도 별도로 감지해야 한다.

## 1. 큰 그림 — dirty와 ahead는 동시에 존재할 수 있다

예를 들어 현재 상태가:

```text
origin/main: A -- B
                   \
local main:         C
                    +
Working Tree 수정 있음
```

이라면:

```text
ahead = 1
 dirty = true
```

다.

즉 둘 중 하나를 선택하는 상태가 아니라 **독립적인 두 축**이다.

## 2. dirty — Commit되지 않은 로컬 변경

`git status --porcelain`은 Working Tree와 Index 상태를 스크립트가 읽기 쉬운 안정적인 형식으로 출력한다.

```bash
git status --porcelain
```

출력이 비어 있지 않으면 일반적으로 다음 중 하나 이상이 있다는 뜻이다.

```text
Staged 변경
Unstaged 변경
Untracked 파일
```

간단한 Boolean 판정:

```bash
if [ -n "$(git status --porcelain)" ]; then
  echo "dirty"
fi
```

여기서 dirty는 "push가 필요한가"와 직접 관계가 없다.

```text
파일 수정
 ↓
dirty = true
 ↓ commit 전
Commit Graph 변화 없음
```

## 3. ahead — Upstream에 없는 Local Commit

현재 branch에 upstream이 설정되어 있다면 Local HEAD와 upstream 사이 Commit Graph를 비교할 수 있다.

```bash
git rev-parse --abbrev-ref --symbolic-full-name '@{u}'
```

upstream이 존재할 때 local에만 있는 commit 수는:

```bash
git rev-list --count '@{u}..HEAD'
```

로 확인할 수 있다.

```text
@{u}..HEAD
= HEAD에서는 reachable하지만 upstream에서는 reachable하지 않는 Commit
```

결과가 0보다 크면 local branch가 upstream보다 앞선 commit을 가진다.

```bash
if git rev-parse '@{u}' >/dev/null 2>&1; then
  ahead=$(git rev-list --count '@{u}..HEAD')
fi
```

## 4. behind도 같은 Commit Graph 축이다

반대 방향을 보면 upstream에만 있는 commit 수를 알 수 있다.

```bash
git rev-list --count 'HEAD..@{u}'
```

따라서 branch 동기화 상태는:

```text
Local only Commit   → ahead
Remote only Commit  → behind
양쪽 모두 존재      → diverged
```

로 볼 수 있다.

좀 더 직접적으로 두 값을 한 번에 얻으려면:

```bash
git rev-list --left-right --count '@{u}...HEAD'
```

을 사용할 수 있다.

출력의 좌우 의미를 사용할 때는 실제 명령 방향을 고정해서 스크립트에서 일관되게 해석한다.

## 5. 왜 `git log @{u}..HEAD`도 동작하나

기존에 다음처럼 확인할 수도 있다.

```bash
git log '@{u}..HEAD' --oneline
```

출력이 있으면 local-only commit이 있다는 뜻이다.

하지만 스크립트가 단순히 "몇 개나 ahead인가"를 판정하려면 commit 내용을 생성하는 `git log`보다:

```bash
git rev-list --count '@{u}..HEAD'
```

처럼 graph count를 직접 구하는 편이 의도가 더 분명하다.

## 6. Upstream이 없는 Branch는 별도 상태다

새 local branch에는 upstream이 없을 수 있다.

이 경우:

```text
ahead = ?
```

라고 보는 편이 정확하다. 비교 대상 자체가 없기 때문이다.

먼저 확인한다.

```bash
if ! git rev-parse '@{u}' >/dev/null 2>&1; then
  echo "no-upstream"
fi
```

upstream 없음과 `ahead = 0`을 같은 상태로 처리하지 않는 것이 좋다.

## 7. tmux Status Bar 예시

개념을 단순화한 예시는 다음과 같다.

```bash
branch=$(git branch --show-current 2>/dev/null)

dirty=""
if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  dirty="*"
fi

ahead=""
if git rev-parse '@{u}' >/dev/null 2>&1; then
  count=$(git rev-list --count '@{u}..HEAD' 2>/dev/null)
  if [ "${count:-0}" -gt 0 ]; then
    ahead="↑${count}"
  fi
fi

printf '%s%s%s\n' "$branch" "$dirty" "$ahead"
```

예:

```text
main*↑2
```

의미는:

```text
main
→ 현재 Branch

*
→ Commit되지 않은 변경 존재

↑2
→ Upstream에 없는 Local Commit 2개
```

다.

## 8. 자동화에서는 상태 정의를 먼저 정한다

상황에 따라 dirty의 범위를 다르게 보고 싶을 수도 있다.

예를 들어 untracked 파일은 무시하고 tracked 파일 변경만 보려면 `git status --porcelain` 결과를 그대로 Boolean 처리하는 것보다 원하는 status code만 해석해야 한다.

마찬가지로 "push할 게 있다"는 표현도:

```text
Local Commit이 Upstream에 없음
```

을 뜻하는지,

```text
현재 Branch에 Upstream 자체가 없음
```

까지 포함하는지 정책을 먼저 정해야 한다.

즉 명령어보다 먼저 **어떤 상태를 표시하려는지 정의하는 것**이 중요하다.

## 정리

```text
dirty
→ Working Tree / Index
→ 아직 Commit되지 않은 변경

ahead
→ Commit Graph
→ Upstream에는 없는 Local Commit

behind
→ Commit Graph
→ Local에는 없는 Upstream Commit
```

`dirty`와 `ahead`를 구분하면 tmux status bar, shell prompt, repository 순회 스크립트 같은 자동화에서도 현재 Git 상태를 훨씬 정확하게 표현할 수 있다.

## 참고

- [cheatsheet — git](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/git.md) — Git 명령어 빠른 참조
