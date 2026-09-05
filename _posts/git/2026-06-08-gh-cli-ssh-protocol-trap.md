---
title       : "gh repo create --push에서 저장소만 생성되고 Push가 실패할 때"
description : "gh CLI의 API 인증과 Git의 SSH/HTTPS 인증이 서로 다른 계층이라는 점에서 repo 생성은 성공하지만 push만 publickey 오류로 실패하는 원인과 해결 방법을 정리한다."
date        : 2026-06-08 15:00:00 +0900
updated     : 2026-09-05 19:30:00 +0900
categories  : [git, "GitHub·플랫폼"]
tags        : [gh-cli, github, ssh, https, troubleshooting]
pin         : false
hidden      : false
---

`gh repo create --source=. --push`를 실행했는데 GitHub에는 저장소가 생성되고 마지막 push만 실패할 수 있다.

```text
Repository 생성  → 성공
Remote 설정      → 성공
Git Push         → 실패
```

겉으로는 하나의 `gh` 명령이지만 내부에서는 **GitHub API 인증과 Git 전송 인증이 서로 다른 계층**을 사용하기 때문이다.

## 증상

```bash
gh repo create my-repo --public --source=. --remote=origin --push
```

실행 후 다음 오류가 나타난다.

```text
git@github.com: Permission denied (publickey).
fatal: Could not read from remote repository.
```

그런데 GitHub 웹에서는 이미 repository가 생성되어 있고 로컬 `origin`도 존재한다.

## 원인 — gh 인증과 Git 인증을 분리해서 본다

전체 흐름을 나누면 이해하기 쉽다.

```text
gh repo create
   │
   ├─ GitHub API 호출
   │    ↓
   │   gh의 로그인 Credential
   │    ↓
   │   Repository 생성
   │
   └─ git push
        ↓
      Remote URL의 Protocol
        ├─ SSH   → SSH Key 인증
        └─ HTTPS → Credential Helper/Token 인증
```

`gh auth login`이 성공했다는 사실만으로 SSH push까지 자동으로 성공하는 것은 아니다.

Git 작업 protocol을 SSH로 선택해 `origin`이 다음 형태라면:

```text
git@github.com:<user>/<repo>.git
```

실제 push 인증은 SSH가 담당한다. GitHub에 등록된 적절한 SSH key가 없거나 현재 SSH 설정이 그 key를 사용하지 못하면 repository 생성과 무관하게 push가 실패한다.

## 확인

먼저 `gh` 로그인 상태를 확인한다.

```bash
gh auth status
```

그다음 remote가 어떤 protocol인지 확인한다.

```bash
git remote -v
```

SSH라면 실제 SSH 인증도 별도로 확인한다.

```bash
ssh -T git@github.com
```

즉 문제를 다음 두 질문으로 나누면 된다.

```text
GitHub API 호출이 되는가?
→ gh auth 상태

Git Remote에 Push할 수 있는가?
→ Remote Protocol + 해당 Protocol의 Credential
```

## 해결 1 — SSH를 계속 사용한다

SSH가 목적이라면 올바른 key를 생성·등록하고 현재 GitHub host가 그 key를 사용하도록 설정한다.

여러 GitHub 계정을 함께 쓴다면 Host alias를 사용하는 방법은 [GitHub 다중 계정 — SSH 인증과 Commit Identity를 분리해서 관리하기](/posts/git/2025-10-03-git-multiple-config/)에서 다룬다.

인증 확인:

```bash
ssh -T git@github.com
```

정상이라면 다시 push한다.

```bash
git push -u origin main
```

## 해결 2 — HTTPS와 gh Credential을 사용한다

SSH key를 별도로 관리하지 않으려면 remote를 HTTPS로 바꿀 수 있다.

```bash
git remote set-url origin https://github.com/<user>/<repo>.git
gh auth setup-git
git push -u origin main
```

`gh auth setup-git`은 Git이 HTTPS credential을 요청할 때 `gh`의 credential helper를 사용할 수 있게 설정한다.

```text
Git Push
  ↓ HTTPS
Git Credential Helper
  ↓
gh Credential
  ↓
GitHub
```

## 왜 Repository만 남았나

이 현상은 rollback되지 않은 중간 상태로 이해하면 된다.

```text
1. GitHub API로 Repository 생성   ← 이미 성공
2. origin Remote 구성             ← 성공
3. git push                        ← SSH 인증 실패
```

3번이 실패했다고 1번에서 생성한 GitHub repository가 자동 삭제되는 것은 아니다.

따라서 다시 `gh repo create`부터 반복하기보다 **기존 repository와 remote를 유지한 채 push 인증만 고치면 된다.**

## 관련 있지만 별도 문제 — Token 권한

GitHub API의 특정 작업이 실패한다면 그때는 token 권한 문제를 본다. 예를 들어 추가 권한이 필요한 작업은 `gh auth refresh`로 필요한 scope를 요청할 수 있다.

하지만 `Permission denied (publickey)`는 token scope 문제가 아니다.

```text
publickey 오류
→ SSH 인증 계층

GitHub API 권한 오류
→ gh Credential / Token 권한 계층
```

두 문제를 섞지 않는 것이 중요하다.

## 정리

```text
gh 로그인 성공
≠ 모든 Git 전송 인증 성공

GitHub API 인증
→ Repository 생성 등

Git Remote 인증
→ SSH 또는 HTTPS Push/Pull
```

`gh repo create --push`에서 repository만 생성되고 push가 실패한다면 **명령 전체를 하나로 보지 말고 어느 단계까지 성공했는지 먼저 분리**하면 원인을 빠르게 찾을 수 있다.
