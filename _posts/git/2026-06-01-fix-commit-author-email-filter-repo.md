---
title       : "GitHub Contribution이 누락될 때 — Author Email부터 History Rewrite까지"
description : "GitHub Contribution Graph에서 커밋이 보이지 않을 때 author email, default branch, fork 여부 등 조건을 먼저 확인하고, 이메일 연결로 해결할지 history rewrite가 필요한지 단계적으로 판단한다."
date        : 2026-06-01 10:00:00 +0900
updated     : 2026-09-05 19:45:00 +0900
categories  : [git, "커밋·히스토리"]
tags        : [commit, github, contribution-graph, troubleshooting, filter-repo]
pin         : false
hidden      : false
---

GitHub에 commit이 존재하는데 Contribution Graph에 보이지 않는다면 **author email만 바로 고치기 전에 먼저 Contribution 조건을 분리해서 확인**해야 한다.

대표적인 확인 축은 다음과 같다.

```text
Commit Author가 내 계정과 연결되는가?
        ↓
Commit이 Contribution 대상 Branch에 포함되는가?
        ↓
Repository가 Fork가 아닌가?
        ↓
GitHub가 아직 재집계 중인 것은 아닌가?
```

Author email 불일치는 흔한 원인이지만 유일한 원인은 아니다.

## 1. 먼저 실제 Author Email을 확인한다

최근 commit의 author 정보를 확인한다.

```bash
git log --format='%h %an <%ae> %s' -n 20
```

특정 commit이라면:

```bash
git show --no-patch --format=fuller <commit-sha>
```

GitHub는 commit author email을 계정과 연결해 attribution을 판단한다. 현재 설정도 함께 확인한다.

```bash
git config --get user.name
git config --get user.email
```

## 2. Email만의 문제인지 확인한다

Contribution Graph에 commit이 표시되려면 email 외에도 조건이 있다.

대표적으로 commit은 GitHub 계정과 연결 가능한 author email을 사용해야 하고, standalone repository의 default branch 또는 GitHub Pages의 `gh-pages` branch 같은 Contribution 대상 위치에 있어야 한다.

따라서 다음처럼 판단한다.

```text
Email은 맞다
  +
Commit은 feature branch에만 있다
→ Default branch에 merge되기 전에는 Graph에 나타나지 않을 수 있음

Email은 맞다
  +
Fork에서만 작업했다
→ Fork 자체 Commit은 일반 Contribution 조건과 다름

Email이 계정과 연결되지 않는다
→ Email attribution 문제
```

## 3. 가장 먼저 시도할 해결 — 과거 Email을 계정에 연결

과거 commit에 사용한 email이 실제로 내가 소유하거나 GitHub 계정에 추가할 수 있는 주소라면 **history를 다시 쓰는 것보다 해당 email을 GitHub 계정에 연결하는 것이 먼저**다.

```text
기존 Commit SHA 유지
        +
과거 Email을 계정에 연결
        ↓
GitHub Attribution 복원 가능
```

이 방법은 commit history를 바꾸지 않으므로 협업 저장소에서도 가장 안전하다.

GitHub가 제공하는 `noreply` 주소를 사용했던 경우에도 해당 계정과 정상적으로 연결되는 주소인지 확인한다.

## 4. Generic `.local` Email은 별도 문제다

머신을 새로 설정한 뒤 Git user 설정이 잘못되어 다음처럼 generic host email로 commit한 경우가 있다.

```text
user@computer.local
```

이런 generic email은 GitHub 계정에 연결할 수 없으므로 단순히 계정 설정만으로 과거 attribution을 복구하기 어렵다.

이 경우 **정말 Contribution attribution을 복구할 필요가 있다면 history rewrite를 고려**한다.

## 5. Rewrite 전에 영향 범위를 확인한다

Commit의 author/committer metadata를 바꾸면 commit SHA가 바뀐다.

```text
Author Email 변경
   ↓
Commit Object 변경
   ↓
Commit SHA 변경
   ↓
후속 Commit SHA도 연쇄 변경
```

따라서 이미 여러 사람이 공유하는 branch라면 단순한 profile 정리를 위해 history를 rewrite하는 것이 더 큰 비용을 만들 수 있다.

먼저 backup reference를 만든다.

```bash
git branch backup/before-author-rewrite
```

그리고 rewrite 대상이 정확히 어떤 commit인지 확인한다.

```bash
git log --all --format='%h %ae %s' | grep '<old-email>'
```

## 6. `git filter-repo`로 특정 Email만 변경한다

Rewrite가 필요하다고 판단했다면 `git filter-repo`로 잘못된 email만 선택적으로 바꿀 수 있다.

```bash
git filter-repo --force --commit-callback '
old = b"old-user@computer.local"
new = b"your-verified-email@example.com"

if commit.author_email == old:
    commit.author_email = new
if commit.committer_email == old:
    commit.committer_email = new
'
```

필요하다면 name도 함께 변경할 수 있다.

중요한 것은 **모든 author를 일괄 덮어쓰지 않고 잘못된 metadata만 조건부로 수정하는 것**이다.

## 7. Rewrite 후 확인하고 Push한다

먼저 local history를 확인한다.

```bash
git log --format='%h %an <%ae> %s' -n 20
```

`filter-repo` 실행 후 remote가 제거되었는지도 확인한다.

```bash
git remote -v
```

필요하면 다시 추가한다.

```bash
git remote add origin <repository-url>
```

이미 remote branch에 존재하는 history를 교체해야 한다면 force push가 필요할 수 있다.

```bash
git push --force-with-lease origin main
```

공유 저장소에서는 다른 사용자의 새 commit을 덮어쓰지 않도록 사전에 협의한다.

## 8. Graph 반영은 즉시라고 가정하지 않는다

조건을 고쳤거나 history를 다시 push한 뒤 Contribution Graph가 바로 갱신되지 않을 수 있다.

따라서:

```text
수정 완료
 ↓
GitHub에 Commit 정상 반영 확인
 ↓
Contribution 재집계 시간 대기
 ↓
그래도 누락되면 조건 재확인
```

순서로 본다.

## 9. 재발 방지

새 머신에서는 작업 전에 identity를 확인한다.

```bash
git config --global user.name "Your Name"
git config --global user.email "your-verified-email@example.com"
```

여러 GitHub 계정을 쓰는 환경이라면 global identity 하나로 덮기보다 `includeIf`를 사용해 directory별 identity를 분리하는 편이 안전하다.

관련 글: [GitHub 다중 계정 — SSH 인증과 Commit Identity를 분리해서 관리하기](/posts/git/2025-10-03-git-multiple-config/)

## 정리

```text
Contribution 누락
   ↓
Email / Branch / Fork 등 조건 확인
   ↓
과거 Email을 계정에 연결할 수 있는가?
├─ Yes → History 유지 + Email 연결 우선
└─ No
    ↓
Generic/잘못된 Email인가?
    ↓
Rewrite 비용을 감수할 가치가 있는가?
├─ No  → History 유지
└─ Yes → filter-repo로 선택적 Metadata 수정
```

**Contribution Graph를 고치기 위해 History Rewrite부터 시작하지 않는 것**이 핵심이다. 먼저 attribution 조건을 확인하고, 기존 history를 유지한 채 해결할 수 없는 경우에만 rewrite를 선택한다.

## 참고

- [GitHub Docs — Troubleshooting missing contributions](https://docs.github.com/en/account-and-profile/how-tos/contribution-settings/troubleshooting-missing-contributions)
- [GitHub Docs — Profile contributions reference](https://docs.github.com/en/account-and-profile/reference/profile-contributions-reference)
- [git-filter-repo](https://github.com/newren/git-filter-repo)
