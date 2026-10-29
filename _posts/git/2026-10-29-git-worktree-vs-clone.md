---
title       : "Git worktree — 디렉터리 복사·별도 clone과 무엇이 다른가"
description : "Git worktree가 저장소는 공유하고 작업 파일은 분리하는 방식을 살펴본다. 디렉터리 복사·별도 clone과 비교해 커밋과 미커밋 변경이 어디까지 보이는지 구분한다."
date        : 2026-10-29 17:03:00 +0900
updated     : 2026-10-29 17:03:00 +0900
categories  : [git, "개념·비교"]
tags        : [git, worktree, branch, guide]
pin         : false
hidden      : false
---

기능을 개발하다가 급한 수정이 들어왔다. 지금 디렉터리에는 아직 commit하지 않은 변경이 있어 브랜치를 전환하기 어렵다. 프로젝트 폴더를 복사하면 해결될까? **작업 파일을 분리하는 것**과 **Git 저장소까지 분리하는 것**을 구분하면 `git worktree`가 필요한 이유가 보인다.

## 하나의 저장소, 여러 작업 디렉터리

Git의 working tree(작업 트리)는 실제 파일을 편집하는 디렉터리다. `git worktree add`는 **같은 저장소에 연결된 작업 트리를 하나 더 만든다.** 각 작업 트리에는 자신의 `HEAD`, Index(스테이징 상태), 작업 파일이 있고, Git 객체와 브랜치 참조는 공유한다.

```text
                    공유하는 Git 저장소
                객체(커밋) · 브랜치 참조
                       /       \
                      /         \
프로젝트/ (main)                    프로젝트-fix/ (fix/login)
HEAD · Index · 작업 파일             HEAD · Index · 작업 파일
```

그림의 선은 두 디렉터리가 **같은 저장소에 연결된다**는 뜻이다. 파일 내용이 실시간으로 동기화된다는 뜻은 아니다. 한쪽에서 파일을 수정하거나 스테이징해도 다른 쪽 작업 파일은 바뀌지 않는다. 반면 새 commit을 만들면 같은 저장소에 기록되므로 다른 작업 트리에서 그 commit과 브랜치를 바로 조회할 수 있다. **다른 브랜치의 commit이 보이는 것과 현재 브랜치의 파일에 반영되는 것은 별개**다. 반영하려면 merge·rebase 등 별도의 작업이 필요하다.

> Git 모델의 Working Tree·Index·Commit 관계는 [Git 내부 모델](2026-10-10-git-object-model-and-history.md)에서 더 자세히 다룬다.

## 폴더 복사·별도 clone과 비교하면

비교할 축은 두 가지다. **작업 파일이 분리되는가**, **Git 저장소와 이후의 로컬 commit을 공유하는가**.

| 방식 | 작업 파일 | Git 저장소·새 로컬 commit | 미커밋 변경 |
|---|---|---|---|
| 폴더 전체 복사(`.git` 포함) | 복사 시점부터 별개 | 복제된 저장소에서 각각 따로 생성 | 복사 시점의 파일 변경도 함께 복사될 수 있음 |
| 별도 `git clone` | 별개 | 각각의 로컬 저장소에 따로 생성. 원격으로 주고받을 수 있음 | 원본의 미커밋 변경은 복제되지 않음 |
| `git worktree add` | 별개 | 같은 저장소에서 즉시 조회 가능 | 기존 작업 트리의 변경은 새 작업 트리로 넘어오지 않음 |

폴더 복사는 **복사 시점의 파일 상태까지** 가져온다는 점에서 별도 clone과도 다르다. `.git` 없이 파일만 복사하면 그 폴더는 원래 저장소에 연결된 Git 작업 트리가 아니다. 반대로 `git worktree`는 Git이 연결 관계를 관리하므로 원격에 push하거나 다른 clone에서 fetch하지 않아도 새 commit을 서로 조회할 수 있다. 그렇다고 어느 쪽의 미완료 작업이 다른 쪽에 자동으로 나타나지는 않는다.

## 급한 수정을 별도 작업 트리에서 하기

현재 `project/`의 `main`에서 작업 중이라고 하자. 변경을 지우거나 stash하지 않고 다른 디렉터리에서 `fix/login` 브랜치로 수정할 수 있다.

```sh
cd project
git worktree add -b fix/login ../project-fix main
git worktree list
cd ../project-fix
# 수정한 뒤 이 디렉터리에서만 add / commit
git add path/to/file
git commit -m "fix: correct login redirect"
```

이제 `project/`로 돌아오면 기존의 **미커밋 파일 변경은 그대로**이고 `main`의 파일도 자동으로 수정되지 않았다. 하지만 `git log fix/login -1`로 방금 만든 commit을 볼 수 있다. 필요할 때 `main`에 merge하거나 다른 방식으로 반영한다.

```sh
cd ../project
git log fix/login -1
# 통합할 준비가 됐다면: git merge fix/login
# 더 이상 필요 없고 project-fix가 clean하다면:
git worktree remove ../project-fix
```

`git worktree remove`는 연결된 작업 디렉터리를 정리하지만 **브랜치를 자동 삭제하지는 않는다.** 추적되지 않은 파일이나 수정한 파일이 남아 있다면 일반적인 remove는 거부된다. 작업을 확인하지 않고 강제 삭제하지 않는 편이 안전하다. 또한 하나의 로컬 브랜치를 두 작업 트리에서 동시에 체크아웃하는 것은 기본적으로 막힌다. 각 디렉터리에는 서로 다른 브랜치를 사용하면 된다.

## 어떤 방식을 고를까

같은 프로젝트에서 **서로 다른 브랜치를 동시에 열고, 각자의 작업 파일은 유지하면서 commit 이력은 바로 공유**하고 싶다면 worktree가 맞다. Git 저장소까지 독립시켜 서로 다른 설정·참조나 원격 동기화 흐름으로 운용해야 한다면 별도 clone을 선택한다. 단순 폴더 복사는 Git이 작업 디렉터리 사이의 관계를 관리해 주지 않으므로, 병렬 브랜치 작업의 기본 수단으로 삼기 어렵다.

핵심은 “다른 작업 내용을 볼 수 있나?”에 대한 답을 둘로 나누는 것이다. **commit은 같은 저장소에서 볼 수 있지만, 미커밋 작업 파일은 각 worktree에 남는다.**

명령·옵션을 다시 찾아볼 때는 [Git 개념 지도](https://github.com/clang-engineer/devkit/blob/main/reference/cheatsheets/git.md)와 [Git worktree 공식 문서](https://git-scm.com/docs/git-worktree)를 참고한다.
