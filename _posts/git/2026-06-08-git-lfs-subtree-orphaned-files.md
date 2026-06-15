---
title       : "LFS 데이터가 사라진 repo를 subtree로 흡수하기"
description : "LFS smudge 실패와 GitHub pre-receive 거부의 우회 — GIT_LFS_SKIP_SMUDGE + filter-repo --invert-paths."
date        : 2026-06-08 10:00:00 +0900
updated     : 2026-06-08 10:00:00 +0900
categories  : [git, "저장소·운영"]
tags        : [github]
pin         : false
hidden      : false
---

LFS-tracked 파일이 있는 옛 repo를 subtree로 흡수할 때 두 가지 벽이 있다. smudge filter가 실제 binary를 fetch 못해 fail하고, 어찌어찌 commit해도 GitHub pre-receive hook이 LFS 누락으로 push를 거부한다. 결국 history에서 LFS 파일을 strip해야 한다.

## 증상 1: subtree add 중 smudge 실패

```
error: external filter 'git-lfs filter-process' failed
fatal: <path>.war: smudge filter lfs failed
```

원본 LFS 서버에 binary가 없거나 접근 불가일 때. checkout 시 LFS pointer를 실제 파일로 못 만든다.

**우회**: smudge 자체를 건너뛰기.

```sh
GIT_LFS_SKIP_SMUDGE=1 git subtree add --prefix=foo https://.../foo.git main
```

이렇게 하면 pointer 파일 그대로 commit됨. subtree merge는 성공.

## 증상 2: GitHub push 거부

```
remote rejected (pre-receive hook declined)
```

GitHub은 LFS pointer가 가리키는 실제 object가 LFS 저장소에 있는지 검증한다. 없으면 거부.

`git config lfs.allowincompletepush true`는 **클라이언트 쪽 보호만 끄는 것**. GitHub 서버 체크는 그대로라 여전히 reject됨.

## 해결: history에서 LFS 파일 strip

`git filter-repo`의 `--invert-paths`로 특정 path를 history 전체에서 제거.

```sh
git filter-repo --force --invert-paths --path-glob '*.war'
```

이후 force push:
```sh
git remote add origin https://github.com/<user>/<repo>.git
git fetch origin main
git push origin main --force
```

- `--invert-paths`는 match된 path를 **제거** (그렇지 않으면 기본은 keep)
- `--path-glob`은 glob 패턴 매칭
- 다른 확장자도: `--path-glob '*.psd' --path-glob '*.zip'` 등 누적 가능
- 모든 commit과 tree에서 해당 path가 통째로 사라짐

## 한 번에 가는 흐름

```sh
GIT_LFS_SKIP_SMUDGE=1 git subtree add --prefix=foo https://.../foo.git main
# push 시도 → LFS 거부 시
git filter-repo --force --invert-paths --path-glob '*.war'
git remote add origin https://...   # filter-repo는 origin 제거하므로 재추가
git fetch origin main
git push origin main --force
```

## 미리 알았으면 좋았을 것

- LFS 사용 여부는 `.gitattributes`에 `filter=lfs`로 표시됨. subtree add 전에 확인하면 미리 대응 가능
- 25,000+ commit 규모에서 filter-repo는 ~10초. 빠르다
- `.gitattributes` 자체는 남기되 `*.war` 파일만 사라지는 식. attr는 stale해지지만 동작엔 무해

## 참고

- `GIT_LFS_SKIP_SMUDGE`: clone/checkout/fetch 시 LFS pointer를 그대로 둠. push에는 영향 없음
- filter-repo `--path-glob`은 fnmatch 규칙. `**/*.war`처럼 깊은 경로도 지정 가능
