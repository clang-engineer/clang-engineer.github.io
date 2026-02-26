---
title       : Git Shallow Clone으로 비대해진 저장소 가볍게 사용하기
description :
date        : 2026-02-26 17:00:00 +0900
updated     : 2026-02-26 17:00:00 +0900
categories  : [dev, git]
tags        : [git, shallow clone, git history, performance]
pin         : false
hidden      : false
---

## 문제 상황

프로젝트 소스코드는 몇 MB에 불과한데, `.git` 폴더가 수백 MB에 달하는 경우가 있다.

```bash
# 실제 소스코드
du -sh src/
# 3.6M

# git 히스토리
git count-objects -vH
# size-pack: 728.74 MiB
```

### 원인

과거에 대용량 파일(GIF, 이미지, 바이너리 등)을 커밋했다가 삭제한 경우, 파일은 워킹 디렉토리에서 사라지지만 **Git 히스토리에는 그대로 남아있다.**

```bash
# Git 히스토리에서 대용량 파일 확인
git rev-list --objects --all \
  | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' \
  | sed -n 's/^blob //p' \
  | sort -rnk2 \
  | head -10
```

---

## Shallow Clone

최신 커밋만 가져와서 히스토리를 잘라내는 방식이다.

```bash
# 최신 커밋 1개만 클론
git clone --depth 1 -b <branch> <remote-url> <directory>
```

### 일반 clone vs shallow clone

| | 일반 clone | shallow clone (`--depth 1`) |
|---|---|---|
| 가져오는 범위 | 전체 커밋 히스토리 | 최신 커밋 1개 |
| `.git` 크기 | 히스토리 누적분 전체 | 최소한의 크기 |
| `git log` | 전체 이력 조회 가능 | 최신 1개만 조회 |

### 가능한 작업

- `git add` / `git commit` / `git push` — **정상 동작**
- `git pull` — **정상 동작**
- 새 브랜치 생성 및 전환 — **정상 동작**

### 제한되는 작업

- `git log` — 최신 커밋만 보임
- `git blame` — 과거 변경 이력 추적 불가
- 과거 특정 커밋으로 `checkout` 불가

### 히스토리 복구

전체 히스토리가 필요해지면 언제든 복구 가능하다.

```bash
git fetch --unshallow
```

---

## 기타 대안

### 1. BFG Repo-Cleaner

Git 히스토리에서 대용량 파일을 **영구 제거**한다. 팀 전체에 영향이 가므로 협의 후 사용해야 한다.

```bash
# 10MB 이상 파일 히스토리에서 제거
java -jar bfg.jar --strip-blobs-bigger-than 10M <repo>
git reflog expire --expire=now --all && git gc --prune=now --aggressive
```

### 2. Git LFS

대용량 파일을 별도 스토리지에 저장하여 Git 히스토리가 비대해지는 것을 방지한다.

```bash
git lfs install
git lfs track "*.gif"
git add .gitattributes
```

### 3. .gitignore

향후 대용량 파일이 커밋되지 않도록 예방한다.

```gitignore
# 가이드 GIF 파일 제외
src/main/resources/guide/**/*.gif
src/main/resources/static/guide/**/*.gif
```
