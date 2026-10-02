---
title       : "Git 로드맵 — 로컬 변경에서 GitHub 협업까지"
description : "Git을 로컬 변경 관리, History 이해, 원격 저장소, GitHub 플랫폼, 자동화 설정으로 나누어 기존 글의 위치를 정리한다."
date        : 2026-10-01 14:00:00 +0900
updated     : 2026-10-01 14:00:00 +0900
categories  : [git, "개요·인덱스"]
tags        : [roadmap, git, github]
pin         : false
hidden      : false
---

이 로드맵은 Git을 단순한 명령어 모음이 아니라 **변경분을 고르고, History를 만들고, 원격 저장소와 협업 플랫폼 위에서 운영하는 도구**로 본다.

먼저 Git 자체와 GitHub 플랫폼을 분리한다.

```text
[Git 줄기]
Working Tree 변경
   ↓
Index에 선택적으로 올림
   ↓
Commit으로 History 생성
   ↓
Branch / Remote와 동기화
   ↓
History를 복구·정리·보존

[GitHub 플랫폼]
Repository 관계
Issue / PR / Notification
Actions / Secrets / Templates
Contribution Graph
```

Git은 로컬에서도 완결되는 버전 관리 시스템이고, GitHub는 그 위에 협업·자동화·호스팅 기능을 얹은 플랫폼이다. 둘을 섞어 이해하면 `commit`, `push`, `PR`, `Actions`, `Contribution`의 책임 경계가 흐려진다.

## 한눈에 보기

| 구역 | 답하는 질문 | 성격 |
|---|---|---|
| 1. 변경 선택 | 어떤 변경을 commit에 넣을 것인가 | Git 기본 줄기 |
| 2. 상태 감지 | dirty, staged, ahead는 무엇이 다른가 | Git 기본 줄기 |
| 3. History 복구·정리 | 사라진 commit, 얕은 clone, branch 충돌을 어떻게 다루나 | 운영 |
| 4. 원격·계정 | 인증, 작성자, remote 관계를 어떻게 분리하나 | 운영 |
| 5. GitHub 협업 | Fork, Template, Watch, Activity는 어떤 플랫폼 기능인가 | GitHub |
| 6. 자동화·특별 파일 | hook, Actions, template, secrets는 누가 읽고 실행하나 | 자동화 |
| Branch | 보기 좋게 diff를 읽거나 commit 규칙을 정한다 | 보조 도구·규칙 |

## 1. 변경 선택 — commit에 무엇을 넣을지 정한다

| 글 | 핵심 |
|---|---|
| [Git hunk이란 — diff 덩어리와 부분 스테이징](./2026-07-12-git-hunk-and-interactive-staging.md) | hunk, `git add -p`, 변경분을 작은 commit으로 나누는 법 |

Git의 기본 단위는 파일 전체가 아니라 변경분이다.

```text
Working Tree 변경
   ↓
diff / hunk로 나누어 봄
   ↓
Index에 일부만 staging
   ↓
commit 생성
```

`git add .`만 쓰면 변경을 고르는 감각이 늦게 생긴다. 먼저 hunk를 이해하면 commit을 작업 로그가 아니라 리뷰 가능한 단위로 만들 수 있다.

## 2. 상태 감지 — dirty와 ahead는 다른 축이다

| 글 | 핵심 |
|---|---|
| [Git 상태 감지 — dirty와 ahead는 서로 다른 축이다](./2026-09-01-git-push-vs-commit-detection.md) | Working Tree 변경 여부와 remote보다 앞선 commit 여부를 분리 |

Git 상태는 한 문장으로 줄이기 어렵다.

```text
Working Tree / Index
→ 아직 commit되지 않은 변경이 있는가?

Local Branch / Remote Tracking Branch
→ local commit이 remote보다 앞서 있는가?
```

`dirty`는 commit 전 변경의 문제이고, `ahead`는 push 전 동기화의 문제다. 자동화나 상태 표시를 만들 때 두 축을 섞으면 잘못된 판단을 하기 쉽다.

## 3. History 복구·정리 — commit graph를 운영한다

| 글 | 핵심 |
|---|---|
| [git reflog로 사라진 커밋·브랜치 복구하기](./2025-10-03-restore.md) | branch pointer 이동 기록을 이용해 사라진 commit 복구 |
| [Git Shallow Clone — 전체 History 없이 필요한 깊이만 가져오기](./2026-02-26-git-shallow-clone.md) | clone 시 가져오는 history 범위 제한, LFS·history rewrite·gitignore와의 차이 |
| [Git Branch 통합에서 non-fast-forward가 날 때](./2026-07-08-git-branch-consolidation-orphan.md) | local과 origin의 history 관계를 먼저 비교 |
| [GitHub 저장소 정리와 Contribution 보존](./2026-06-08-github-repo-cleanup-preserve-contributions.md) | history 보존과 GitHub contribution 보존은 다른 문제 |

Git을 운영하다 보면 파일보다 commit graph 자체를 다루게 된다.

```text
commit이 사라졌는가?
→ reflog로 pointer 이동 기록 확인

clone이 너무 무거운가?
→ shallow clone / LFS / history rewrite / gitignore 중 문제 축 구분

push나 branch 통합이 막히는가?
→ local branch와 remote branch의 공통 조상·분기 확인

repository를 지워도 되는가?
→ Git history와 GitHub contribution 조건을 별도로 확인
```

이 영역의 핵심은 "파일이 있는가"보다 "어떤 commit이 어떤 reference에서 reachable한가"를 보는 것이다.

## 4. 원격·계정 — 인증과 작성자를 분리한다

| 글 | 핵심 |
|---|---|
| [GitHub 다중 계정 — 인증과 Commit Identity를 분리해서 관리하기](./2025-10-03-git-multiple-config.md) | SSH host 별칭은 원격 인증, Git config는 commit 작성자 정보 |
| [Git Submodule — 저장소 안에 다른 저장소의 특정 커밋을 연결하는 구조](./2025-06-24-submodule.md) | 상위 저장소가 하위 저장소의 특정 commit을 gitlink로 가리키는 구조 |

원격 저장소를 다룰 때는 세 가지를 구분한다.

```text
인증
→ 내가 remote에 접근할 수 있는가?

Commit Identity
→ 새 commit의 author / committer가 누구인가?

Repository 관계
→ 이 저장소가 다른 저장소와 어떤 history / reference 관계를 맺는가?
```

다중 GitHub 계정 문제는 인증과 commit identity를 분리해야 풀리고, submodule은 디렉터리 포함이 아니라 특정 commit을 가리키는 관계로 이해해야 한다.

## 5. GitHub 협업 — Git 밖의 플랫폼 기능을 구분한다

| 글 | 핵심 |
|---|---|
| [GitHub Fork vs Use this template](./2026-06-08-github-fork-vs-use-template.md) | fork network 관계를 유지할지, 출발점만 복사할지 |
| [GitHub Star vs Watch](./2026-07-12-github-watch-vs-star-notifications.md) | 북마크와 알림 구독의 차이 |
| [GitHub에서 내가 관여한 Issue·PR 찾기](./2026-07-12-github-my-activity-watch-vs-star.md) | `involves`, `commenter`, `reviewed-by` 같은 검색 축 |
| [GitHub 저장소 정리와 Contribution 보존](./2026-06-08-github-repo-cleanup-preserve-contributions.md) | GitHub contribution graph는 commit 존재만으로 결정되지 않음 |

GitHub 기능은 Git 명령어로만 설명되지 않는다.

```text
Fork
→ GitHub 플랫폼의 repository 관계

Remote
→ Git이 다른 저장소의 reference를 가져오는 방법

Star
→ 저장소 북마크

Watch
→ 알림 구독

Contribution
→ GitHub가 별도 규칙으로 계산하는 활동 기록
```

이 구역은 Git object보다 GitHub가 저장소와 사용자의 관계를 어떻게 해석하는지 보는 영역이다.

## 6. 자동화·특별 파일 — 누가 읽고 언제 실행하는가

| 글 | 핵심 |
|---|---|
| [Git과 GitHub가 알아보는 특별한 파일들](./2026-10-01-git-github-special-files.md) | `.git/hooks`, `.gitignore`, `.gitattributes`, `.github/*`, 도구 설정 파일의 실행 주체 구분 |
| [Git 커밋 훅은 어디에 쓰는가](../reference/tools/2026-10-01-git-commit-hooks.md) | `pre-commit` hook, Husky, pre-commit, prek의 역할 |
| [GitHub Actions Secrets vs Variables](./2025-10-22-github-secrets-and-variables.md) | 민감도와 적용 범위로 Actions 설정값 분리 |
| [Conventional Commits — 공식 규격과 팀 스타일 규칙을 분리해서 보기](./2026-09-01-conventional-commits-guide.md) | commit message 규격과 팀 규칙의 경계 |

자동화 설정은 먼저 실행 주체를 봐야 한다.

```text
.git/hooks/pre-commit
→ Git이 local에서 실행

.github/workflows/*.yml
→ GitHub Actions가 서버에서 실행

.pre-commit-config.yaml
→ pre-commit / prek가 읽음

package.json scripts.prepare
→ npm이 install 과정에서 실행
```

파일 위치가 비슷해 보여도 실행 주체와 시점이 다르면 문제 해결 방법도 달라진다.

## Branch A. 보기 좋은 Git — diff와 pager

| 글 | 핵심 |
|---|---|
| [git-delta 사용법 — Git diff를 읽기 좋게 만드는 pager](./2026-08-12-git-delta-pager.md) | syntax highlight, side-by-side diff, hunk navigation |

Git을 잘 쓰려면 변경을 잘 읽어야 한다. `delta`는 Git의 의미를 바꾸는 도구가 아니라 diff를 더 읽기 좋게 보여주는 pager다.

## 추천 순서

처음 Git을 다시 정리한다면 다음 순서가 좋다.

```text
1. hunk / interactive staging
   ↓
2. dirty / staged / ahead 상태 구분
   ↓
3. reflog와 branch history 복구
   ↓
4. remote / identity / submodule 관계
   ↓
5. GitHub fork·watch·activity 같은 플랫폼 기능
   ↓
6. hook / Actions / special files 자동화
```

이미 Git 명령어를 쓰고 있다면 모든 글을 순서대로 볼 필요는 없다. 막힌 문제가 로컬 변경, history, remote, GitHub 플랫폼, 자동화 중 어디에 속하는지 먼저 고르면 된다.

## 아직 비어 있는 영역

현재 글 묶음에는 다음 주제가 상대적으로 비어 있다.

```text
Git object 내부 구조
→ blob / tree / commit / tag

merge와 rebase의 정확한 차이
→ commit graph를 어떻게 바꾸는가

reset / restore / checkout 비교
→ working tree, index, HEAD 중 무엇을 움직이는가

tag와 release 운영
→ Git tag와 GitHub Release의 경계
```

이 영역은 나중에 별도 글이 생기면 로드맵에 연결한다.
