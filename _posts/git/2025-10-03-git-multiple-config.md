---
title       : GitHub 다중 계정 — 인증과 Commit Identity를 분리해서 관리하기
description : "여러 GitHub 계정을 한 PC에서 사용할 때 SSH Host 별칭은 원격 인증을, Git includeIf는 commit 작성자 정보를 담당한다는 구조를 먼저 잡고 설정 절차를 정리한다."
date        : 2025-10-03 12:37:44 +0900
updated     : 2026-09-05 19:25:00 +0900
categories  : [git, "GitHub·플랫폼"]
tags        : [github, ssh, includeif, how-to]
pin         : false
hidden      : false
---

회사 GitHub 계정과 개인 계정을 한 PC에서 함께 사용할 때 가장 먼저 구분해야 하는 것은 **원격 저장소 인증(Authentication)**과 **Commit 작성자 정보(Identity)**다.

```text
GitHub에 어떤 계정으로 접속할까?
→ SSH Key / Host Alias

Commit에 어떤 이름·Email을 남길까?
→ Git user.name / user.email / includeIf
```

둘은 서로 다른 문제다. SSH 인증이 올바르더라도 `user.email`이 잘못되면 commit 작성자가 원하는 계정으로 연결되지 않을 수 있고, 반대로 작성자 정보가 맞아도 원격 인증 Key가 다르면 push가 실패한다.

## 1. 전체 구조

예를 들어 개인 프로젝트와 회사 프로젝트를 디렉터리로 나눈다고 하자.

```text
~/workspace/personal/...
~/workspace/company/...
```

구성은 다음 두 층으로 나눈다.

```text
Remote URL
   ↓
SSH Host Alias
   ↓
계정별 SSH Key
   ↓
GitHub 인증

Repository 경로
   ↓
includeIf
   ↓
계정별 user.name / user.email
   ↓
Commit Identity
```

이렇게 두면 저장소 위치와 remote URL만으로 대부분 자동 전환된다.

## 2. 계정별 SSH Key를 준비한다

개인용과 업무용 Key를 별도로 만든다.

```bash
ssh-keygen -t ed25519 -C "personal@example.com" -f "$HOME/.ssh/id_ed25519_personal"
ssh-keygen -t ed25519 -C "work@example.com" -f "$HOME/.ssh/id_ed25519_work"
```

각 Public Key를 해당 GitHub 계정에 등록한다.

필요한 환경에서는 SSH Agent에 추가한다.

```bash
ssh-add ~/.ssh/id_ed25519_personal
ssh-add ~/.ssh/id_ed25519_work
```

## 3. SSH Host Alias로 인증 경로를 분리한다

`~/.ssh/config`에서 실제 Host는 둘 다 `github.com`이지만 서로 다른 별칭과 Key를 사용하게 한다.

```sshconfig
Host github-personal
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_personal
    IdentitiesOnly yes

Host github-work
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_work
    IdentitiesOnly yes
```

관계는:

```text
github-personal
→ github.com + personal key

github-work
→ github.com + work key
```

다.

확인:

```bash
ssh -T git@github-personal
ssh -T git@github-work
```

## 4. Remote URL에 원하는 계정의 Alias를 사용한다

개인 저장소:

```bash
git remote set-url origin git@github-personal:personal/project.git
```

업무 저장소:

```bash
git remote set-url origin git@github-work:company/project.git
```

이제 `git push`할 때 SSH가 Host Alias에 연결된 Key를 선택한다.

```text
origin URL
   ↓
github-work
   ↓
id_ed25519_work
   ↓
업무 GitHub 계정
```

## 5. Commit Identity는 includeIf로 분리한다

SSH 설정은 GitHub 로그인 계정을 결정하지만 commit의 작성자 이름과 Email은 Git 설정에서 정한다.

먼저 기본 Identity를 둔다.

```ini
# ~/.gitconfig
[user]
    name = Personal User
    email = personal@example.com
```

업무용 설정을 별도 파일로 만든다.

```ini
# ~/.gitconfig-work
[user]
    name = Work User
    email = work@example.com
```

그리고 업무 디렉터리 아래 repository에만 자동 포함한다.

```ini
# ~/.gitconfig
[includeIf "gitdir:~/workspace/company/"]
    path = ~/.gitconfig-work
```

즉:

```text
현재 Repository 경로
       ↓
~/workspace/company/ 아래인가?
       ↓ Yes
.gitconfig-work 포함
       ↓
work user.email 적용
```

## 6. 적용 결과를 확인한다

업무 Repository에서:

```bash
cd ~/workspace/company/project-a

git config --get user.name
git config --get user.email
```

어떤 설정 파일에서 값이 들어왔는지까지 확인하려면:

```bash
git config --show-origin --get user.email
```

Remote 인증 경로는:

```bash
git remote -v
ssh -T git@github-work
```

로 따로 확인한다.

## 7. 왜 두 설정을 모두 해야 하나

다음 경우를 구분하면 된다.

| 문제 | 담당 설정 |
|---|---|
| `push`할 때 어느 GitHub 계정으로 인증할지 | SSH Key + Host Alias |
| Commit의 Author/Committer 이름·Email | Git `user.*` |
| 디렉터리별 작성자 정보 자동 전환 | `includeIf` |
| 어떤 저장소가 어떤 SSH Key를 사용할지 | Remote URL의 Host Alias |

즉:

```text
Authentication ≠ Commit Identity
```

다.

이 둘을 하나의 "GitHub 계정 설정"으로 뭉뚱그리면 문제를 진단하기 어려워진다.

## 8. 자주 생기는 문제

### Remote URL은 여전히 `github.com`이다

SSH config에 Alias를 만들어도 remote가:

```text
git@github.com:...
```

이면 Alias를 사용하지 않는다.

```bash
git remote -v
```

로 확인하고 필요한 Host Alias로 바꾼다.

### 예상과 다른 Email로 Commit된다

```bash
git config --show-origin --get user.email
```

로 어느 config가 실제 값을 제공했는지 확인한다.

`includeIf`의 `gitdir:` 경로는 repository의 Git directory 경로를 기준으로 매칭되므로 실제 프로젝트 디렉터리 구조와 맞는지 확인한다.

### 이미 잘못된 Identity로 Commit했다

다중 계정 설정은 앞으로 생성될 commit에 적용된다. 이미 만들어진 commit의 author를 바꾸는 것은 별도의 History 수정 작업이다.

## 정리

다중 GitHub 계정 관리는 한 기능으로 해결하는 문제가 아니다.

```text
원격 인증
SSH Host Alias + Key

Commit Identity
Git user.* + includeIf
```

**원격 접근 계정과 commit 작성자 정보를 별도 계층으로 분리해서 관리하면**, 여러 계정을 사용해도 설정과 문제 원인을 훨씬 쉽게 추적할 수 있다.
