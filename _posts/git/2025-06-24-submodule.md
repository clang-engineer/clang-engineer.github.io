---
title       : Git Submodule 을 사용하여 다른 Git 저장소를 포함하기
description : "서브모듈은 다른 저장소를 포함하는 게 아니라 특정 커밋 SHA를 가리키는 포인터다. .gitmodules 구조, detached HEAD 함정, 원격 추적 옵션까지."
date        : 2025-06-24 10:00:00 +0900
updated     : 2026-06-13 10:00:00 +0900
categories  : [git, "저장소·운영"]
tags        : [submodule, gitmodules]
pin         : false
hidden      : false
---

Submodule은 다른 Git 저장소를 현재 프로젝트의 한 디렉토리로 포함시키는 기능. 다만 "포함"이 아니라 "특정 커밋을 가리키는 포인터"라는 게 핵심이다.

## 동작 원리

상위 저장소(superproject)는 서브모듈의 디렉토리 위치에 **특정 커밋 SHA를 기록**한다. `git submodule update`는 그 SHA를 체크아웃한다. 따라서 서브모듈 작업 디렉토리는 보통 detached HEAD다.

생성된 `.gitmodules`:

```ini
[submodule "sub1"]
    path = sub1
    url = https://github.com/clang-engineer/sub1
```

그리고 인덱스에는 `sub1`이 *gitlink* (special tree entry)로 기록된다.

## 추가

```sh
git submodule add https://github.com/clang-engineer/sub1 sub1
git commit -m "add sub1 submodule"
```

## 클론 시 같이 받기

```sh
git clone --recurse-submodules <repo>

# 이미 클론했으면
git submodule update --init --recursive
```

`--init`은 `.gitmodules` 정보를 `.git/config`에 등록하고, `--recursive`는 중첩 서브모듈까지 처리.

## 명령어 요약

| 명령어 | 설명 |
|---|---|
| `git submodule add <repo> [path]` | 서브모듈 추가 |
| `git submodule init` | `.gitmodules`를 `.git/config`로 복사 |
| `git submodule update` | 기록된 SHA로 체크아웃 |
| `git submodule update --init --recursive` | 한방에 초기화 |
| `git submodule update --remote` | 원격 브랜치 최신으로 갱신 |
| `git submodule status` | 현재 SHA·상태 확인 |
| `git submodule foreach <cmd>` | 모든 서브모듈에서 명령 실행 |
| `git clone --recurse-submodules <repo>` | 서브모듈 포함 클론 |
| `git submodule sync` | `.gitmodules`와 `.git/config` URL 동기화 |

## detached HEAD 함정

`git submodule update`는 항상 *특정 SHA*를 체크아웃하므로 서브모듈은 detached HEAD가 된다. 그 상태에서 그냥 commit하면 어디 브랜치에도 속하지 않은 커밋이 만들어진다.

서브모듈에서 직접 작업할 때는 먼저 브랜치로 체크아웃:

```sh
cd sub1
git checkout main      # 또는 작업 브랜치
# 수정 → commit → push
cd ..
git add sub1
git commit -m "bump sub1"
```

`git add sub1`은 새 SHA를 superproject에 기록한다. 이걸 잊으면 다른 사람은 옛날 SHA를 그대로 받는다.

## 원격 브랜치 끝으로 따라가기

서브모듈마다 branch를 추적하게 하려면:

```sh
git config -f .gitmodules submodule.sub1.branch main
git submodule update --remote
```

이걸 안 하고 `--remote`만 쓰면 기본 브랜치를 따라간다.

## 제거

```sh
git submodule deinit -f sub1     # .git/config에서 등록 해제
git rm -f sub1                   # 인덱스/.gitmodules에서 제거
rm -rf .git/modules/sub1         # 내부 저장 영역 정리
git commit -m "remove sub1 submodule"
```

## Submodule vs Subtree

- **Submodule**: 외부 저장소에 대한 *링크*. 가볍지만 update를 잊으면 협업이 꼬임
- **Subtree**: 외부 저장소 내용을 *복사해서* 상위 저장소 히스토리에 머지. 무겁지만 클론 한 번이면 모든 게 들어와서 협업이 쉬움

라이브러리처럼 외부 그대로 추적하고 싶으면 submodule, 코드 베이스의 일부로 가져와 같이 빌드·수정하고 싶으면 subtree가 자연스럽다.
