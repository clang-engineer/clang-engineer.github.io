---
title       : "GitHub 잔디가 안 채워질 때 — 커밋 author 이메일 점검"
description : "잔디 빈칸의 원인은 보통 author email이 GitHub 계정에 미등록된 경우. filter-repo로 일괄 재작성."
date        : 2026-06-01 10:00:00 +0900
updated     : 2026-06-01 10:00:00 +0900
categories  : [git, "GitHub·잔디"]
tags        : [git, github, contribution-graph, filter-repo, author-email]
pin         : false
hidden      : false
---

커밋이 분명히 있는데 잔디(contribution graph)가 비어 보인다면, **author 이메일이 GitHub 계정에 등록돼 있지 않은 경우**다. 커밋 개수가 아니라 author 이메일 매칭으로 카운트되기 때문.

## 원인

머신에 git `user.email`이 설정 안 돼 있으면 git이 기본값 `<사용자>@<호스트>.local`로 커밋을 찍는다. 이 `.local` 이메일은 GitHub 계정에 등록·인증이 불가능해서 잔디로 안 잡힌다.

```bash
# 계정 이메일이 아닌 '내' 커밋 찾기
git log main --format="%ad | %ae | %H | %s" --date=short | grep -E "\.local$"
# 예: 2026-05-29 | clang@clangs-MacBook-Air.local | ... | chore: daily
```

## 해결 — author 이메일 재작성 후 force-push

이미 푸시된 커밋은 이메일을 바꾸려면 히스토리 재작성이 필요하다. `git filter-repo`가 빠르고 안전 (수천 커밋도 몇 초).

```bash
pip install git-filter-repo

# 특정 잘못된 이메일들만 골라서 교체 (정상 커밋·upstream 커밋은 그대로)
git filter-repo --force --commit-callback '
old = [b"clang@clangs-MacBook-Air.local", b"zero@zeros-Mac-mini.local"]
if commit.author_email in old:
    commit.author_email = b"clang.engineer@gmail.com"
    commit.author_name = b"clang.engineer"
if commit.committer_email in old:
    commit.committer_email = b"clang.engineer@gmail.com"
    commit.committer_name = b"clang.engineer"
'
```

주의점:
- `filter-repo`는 실행 후 **`origin` remote를 자동 제거**한다 → `git remote add origin <url>` 로 다시 추가.
- 재작성이라 `git push --force origin main` 필요. 미리 백업: `git branch backup/pre-rewrite main`.
- 잔디는 push 후 보통 몇 분 내 재집계됨.

## 재발 방지

각 머신에서 한 번씩 설정:

```bash
git config --global user.name  "clang.engineer"
git config --global user.email "clang.engineer@gmail.com"
```

## 참고

- [Why are my contributions not showing up?](https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile/managing-contribution-settings-on-your-profile/why-are-my-contributions-not-showing-up-on-my-profile)
