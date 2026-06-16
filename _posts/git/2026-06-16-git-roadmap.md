---
title       : "Git·GitHub 로드맵 — 이 블로그의 git 글을 어떻게 읽을까"
description : "git 안전망(reflog)부터 저장소 구조, GitHub 활용, 잔디·기여 관리, 트러블슈팅까지 12편을 단계별로 큐레이션."
date        : 2026-06-16 00:01:00 +0900
updated     : 2026-06-16 00:01:00 +0900
categories  : [git, "개요·인덱스"]
tags        : [roadmap, git, github, guide]
pin         : false
hidden      : false
---

이 블로그에는 git 디렉토리에 12편의 글이 있다. 안전망부터 GitHub 활용, 잔디·기여 관리까지 어떤 순서로 읽으면 좋은지 단계별로 정리했다.

## 어디서 시작할까

git을 본격적으로 쓰기 전에 "잘못해도 되돌릴 수 있다"는 안전망 한 가지부터 잡는 게 좋다.

| 글 | 핵심 |
|---|---|
| [삭제된 로그를 복구하고 싶을 때](/posts/git/2025-10-03-restore/) | `git reflog`는 모든 git 작업의 안전망. reset/rebase로 사라진 커밋, 삭제된 브랜치 복구 |

## 1단계 — 저장소 구조와 이력

git의 동작 원리를 이해하는 단계. 다른 저장소 포함, 거대 저장소 가볍게 다루기.

| 글 | 핵심 |
|---|---|
| [Git Submodule을 사용하여 다른 Git 저장소를 포함하기](/posts/git/2025-06-24-submodule/) | 서브모듈은 "다른 저장소를 포함"이 아니라 **특정 커밋 SHA를 가리키는 포인터**. .gitmodules·detached HEAD 함정 |
| [Git Shallow Clone으로 비대해진 저장소 가볍게 사용하기](/posts/git/2026-02-26-git-shallow-clone/) | `git clone --depth 1`로 가볍게 받고, 필요해지면 `--unshallow`로 전체 히스토리 복구 |

## 2단계 — GitHub 활용

GitHub 위에서 자주 만나는 4가지 — 다중 계정, fork·template 선택, Actions Secrets, raw 파일 받기.

| 글 | 핵심 |
|---|---|
| [GitHub 다중 계정 관리 Cheat Sheet](/posts/git/2025-10-03-git-multiple-config/) | SSH 키·`Host` 별칭·`.gitconfig`의 `includeIf`로 디렉토리마다 user.email까지 자동 전환 |
| [GitHub Fork와 Use this template의 차이](/posts/git/2026-06-08-github-fork-vs-use-template/) | fork network·이력 복사·upstream PR 가능 여부가 다르다. 선택 기준 |
| [GitHub Actions Secrets & Variables 설정 가이드](/posts/git/2025-10-22-github-secrets-and-variables/) | Secrets vs Variables 차이, 적용 범위(Repository/Environment/Organization) |
| [Github 파일 다운로드 가이드](/posts/git/2022-07-19-github-githubusercontent/) | REST API의 `download_url`과 `raw.githubusercontent.com` URL 구조로 인증 없이 curl |

## 3단계 — 잔디·기여 관리

GitHub 활동 그래프(잔디)를 의식하면서 저장소를 정리하고 싶을 때. 잔디 빈칸 복구부터 정리 후 잔디 보존까지.

| 글 | 핵심 |
|---|---|
| [커밋 author 일괄 수정 — filter-repo로 GitHub 잔디 복구](/posts/git/2026-06-01-fix-commit-author-email-filter-repo/) | 잔디 빈칸의 원인은 author email이 GitHub 계정에 미등록된 경우. `filter-repo`가 표준, `filter-branch`는 deprecated |
| [GitHub repo 정리하면서 잔디 보존하기](/posts/git/2026-06-08-github-repo-cleanup-preserve-contributions/) | 여러 repo를 subtree로 흡수해 한 archive repo로 정리. 원본을 지워도 잔디는 그대로 |

## 트러블슈팅

특정 에러를 만났을 때 검색해서 들어오는 용도.

| 영역 | 글 |
|---|---|
| 머지 | [Git Partial Merge 시 develop 변경이 삭제되는 문제](/posts/git/2025-11-20-partial-merge/) |
| gh CLI | [gh repo create --push가 조용히 실패할 때 — SSH protocol과 키 등록 함정](/posts/git/2026-06-08-gh-cli-ssh-protocol-trap/) |
| LFS | [LFS 데이터가 사라진 repo를 subtree로 흡수하기](/posts/git/2026-06-08-git-lfs-subtree-orphaned-files/) |

---

본인의 현재 위치에서 가까운 단계부터 진입하면 된다. git 입문자는 "어디서 시작할까"부터, GitHub 활용을 정리하고 싶다면 2단계, 활동 그래프 관리에 관심 있다면 3단계로.
