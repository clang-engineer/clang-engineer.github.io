---
title       : "gh repo create --push가 조용히 실패할 때 — SSH protocol과 키 등록 함정"
description : "gh auth login에서 SSH protocol을 골랐는데 SSH key가 없으면 repo는 생성되지만 push가 거부된다."
date        : 2026-06-08 15:00:00 +0900
updated     : 2026-06-08 15:00:00 +0900
categories  : [git, "GitHub·플랫폼"]
tags        : [gh-cli, github, ssh, https, troubleshooting]
pin         : false
hidden      : false
---

`gh auth login`에서 "Git operations protocol"을 SSH로 골랐는데 SSH key가 GitHub에 등록 안 돼 있으면, `gh repo create --source=. --push`가 묘하게 실패한다. **repo 자체는 만들어졌는데 push만 거부되는 비대칭**이라 디버깅이 헷갈린다.

## 증상

```sh
gh repo create my-repo --public --source=. --remote=origin --push
```

```
git@github.com: Permission denied (publickey).
fatal: Could not read from remote repository.
```

repo는 GitHub에 생성되어 있고 로컬 remote도 `git@github.com:...`로 잡힘. push만 실패한 상태.

## 원인

`gh auth login`은 두 단계로 동작한다:

1. **gh CLI 인증** — OAuth로 token 받음 → REST API 호출은 다 됨 → repo 생성 OK
2. **git 작업용 protocol 선택** — SSH 또는 HTTPS 중 선택. **SSH 고르면 git 자체는 OS의 SSH 설정에 의존**

SSH를 골랐는데 `~/.ssh/`에 GitHub 등록된 key가 없으면 2단계만 깨진다.

## 해결: HTTPS로 전환 + gh token 위임

```sh
git remote set-url origin https://github.com/<user>/<repo>.git
gh auth setup-git
git push -u origin main
```

`gh auth setup-git`은 git credential helper에 gh token을 등록한다. 한 번만 하면 이후 HTTPS push에 gh token이 자동 사용됨. SSH key 안 만들고도 push 가능.

## 상태 확인 명령

```sh
gh auth status                # 어떤 계정·scope·protocol인지
gh auth status --show-token   # token 값까지
```

## 곁가지 — 기본 scope의 한계

`gh auth login` 후 받는 기본 token scope: `admin:public_key, gist, read:org, repo`. 다음은 기본에 **없음**:

| 기능 | 필요한 scope | 추가 명령 |
|---|---|---|
| repo 삭제 | `delete_repo` | `gh auth refresh -h github.com -s delete_repo` |
| 이메일 조회 | `user` / `user:email` | `gh auth refresh -s user` |
| org 관리 | `admin:org` | `gh auth refresh -s admin:org` |
| workflow 수정 | `workflow` | `gh auth refresh -s workflow` |

처음부터 한 번에:

```sh
gh auth login --scopes "delete_repo,user,workflow"
```

## 핵심

- `gh repo create --push` 실패 시 **repo 생성 여부와 push 여부를 분리해서 보기**. repo만 생기고 push만 실패하면 99% protocol 문제.
- SSH key 설정이 귀찮으면 `gh auth setup-git`으로 HTTPS + gh token 경로가 가장 빠르다.
