---
title       : "커밋 author 일괄 수정 — filter-repo로 GitHub 잔디 복구 (legacy filter-branch 포함)"
description : "잔디 빈칸의 원인은 author email이 GitHub 계정에 미등록된 경우. filter-repo가 표준, filter-branch는 deprecated."
date        : 2026-06-01 10:00:00 +0900
updated     : 2026-06-01 10:00:00 +0900
categories  : [git, "커밋·히스토리"]
tags        : [commit, github, contribution-graph]
pin         : false
hidden      : false
---

커밋이 분명히 있는데 잔디(contribution graph)가 비어 보인다면, **author 이메일이 GitHub 계정에 등록돼 있지 않은 경우**다. 커밋 개수가 아니라 author 이메일 매칭으로 카운트되기 때문.

전형적인 발생 시나리오: PC 재셋팅 직후 git `user.email`이 비어 있어 기본값 `<사용자>@<호스트>.local`로 커밋이 며칠째 찍히는 케이스. 이 `.local` 이메일은 GitHub 계정에 등록·인증이 불가능해서 잔디로 안 잡힌다.

## 잘못된 커밋 찾기

```bash
# 계정 이메일이 아닌 '내' 커밋 찾기
git log main --format="%ad | %ae | %H | %s" --date=short | grep -E "\.local$"
# 예: 2026-05-29 | clang@clangs-MacBook-Air.local | ... | chore: daily
```

## 해결 (현행) — `git filter-repo`

이미 푸시된 커밋은 이메일을 바꾸려면 히스토리 재작성이 필요하다. `git filter-repo`가 빠르고 안전 (수천 커밋도 몇 초). Git 공식 권장 도구다.

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
- `filter-repo`는 실행 후 **`origin` remote를 자동 제거**한다 → `git remote add origin <url>`로 다시 추가.
- 재작성이라 `git push --force origin main` 필요. 미리 백업: `git branch backup/pre-rewrite main`.
- 잔디는 push 후 보통 몇 분 내 재집계됨.

## 해결 (legacy) — `git filter-branch`

`filter-branch`는 Git 공식적으로 deprecated 경고가 뜨는 도구지만, `filter-repo` 설치가 어려운 환경(파이썬 없음 등)이라면 여전히 동작한다.

```sh
git filter-branch --commit-filter '
        if [ "$GIT_COMMITTER_NAME" = "<Old Name>" ];
        then
                GIT_COMMITTER_NAME="<New Name>";
                GIT_AUTHOR_NAME="<New Name>";
                GIT_COMMITTER_EMAIL="<New Email>";
                GIT_AUTHOR_EMAIL="<New Email>";
                git commit-tree "$@";
        else
                git commit-tree "$@";
        fi' HEAD
```

Windows CMD에서는 따옴표 escape가 달라 다음 형태를 사용한다.

```cmd
git filter-branch --commit-filter "
        if [ "$GIT_COMMITTER_NAME" = "<Old Name>" ];
        then
                GIT_COMMITTER_NAME="<New Name>";
                GIT_AUTHOR_NAME="<New Name>";
                GIT_COMMITTER_EMAIL="<New Email>";
                GIT_AUTHOR_EMAIL="<New Email>";
                git commit-tree "$@";
        else
                git commit-tree "$@";
        fi" HEAD
```

## 재발 방지

각 머신에서 한 번씩 설정:

```bash
git config --global user.name  "clang.engineer"
git config --global user.email "clang.engineer@gmail.com"
```

## 참고

- [Why are my contributions not showing up?](https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile/managing-contribution-settings-on-your-profile/why-are-my-contributions-not-showing-up-on-my-profile)
- [git filter-repo](https://github.com/newren/git-filter-repo)
- [https://stackoverflow.com/questions/750172/how-do-i-change-the-author-and-committer-name-email-for-multiple-commits](https://stackoverflow.com/questions/750172/how-do-i-change-the-author-and-committer-name-email-for-multiple-commits)
