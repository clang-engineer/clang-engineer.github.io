---
title       : "LFS Object가 사라진 저장소를 Subtree로 가져올 때 실패하는 이유와 복구"
description : "Git LFS object가 유실된 저장소를 subtree로 가져올 때 checkout의 smudge 실패와 GitHub push의 missing LFS object 검증을 분리해 진단하고, 필요하면 history rewrite로 해당 경로를 제거하는 절차를 정리한다."
date        : 2026-06-08 10:00:00 +0900
updated     : 2026-09-05 19:30:00 +0900
categories  : [git, "저장소·운영"]
tags        : [git-lfs, subtree, filter-repo, github, troubleshooting]
pin         : false
hidden      : false
---

Git LFS를 사용했던 오래된 저장소를 `git subtree`로 흡수하려 할 때, LFS 서버의 실제 object가 이미 사라져 있으면 두 단계에서 서로 다른 실패를 만날 수 있다.

```text
Subtree로 History 가져오기
   ↓
Checkout / Smudge
   ↓ 실패 1
LFS Object를 내려받지 못함

Pointer 상태로 가져오기
   ↓
GitHub Push
   ↓ 실패 2
필요한 LFS Object가 Remote에 없음
```

둘 다 "LFS 파일이 없다"에서 시작하지만 **첫 번째는 로컬 checkout 문제이고 두 번째는 push 시 remote 검증 문제**다. 이 둘을 분리해서 보는 것이 핵심이다.

## 발생 조건

원본 repository에는 LFS pointer가 commit되어 있지만 해당 pointer가 가리키는 실제 binary object를 더 이상 LFS storage에서 가져올 수 없는 상황이다.

`.gitattributes`에서 LFS 추적 여부를 먼저 확인할 수 있다.

```bash
grep -n "filter=lfs" .gitattributes
```

개념적으로 repository에 남아 있는 것은:

```text
Git History
   ↓
LFS Pointer
   ↓ oid
LFS Storage의 실제 Object
```

인데 마지막 object가 유실된 상태다.

## 증상 1 — Subtree 작업 중 Smudge 실패

```text
error: external filter 'git-lfs filter-process' failed
fatal: <path>.war: smudge filter lfs failed
```

Git이 working tree를 만들면서 LFS pointer를 실제 binary로 바꾸려 하지만 object를 내려받지 못해 실패한다.

```text
Git Blob의 LFS Pointer
   ↓ smudge
LFS Object Fetch
   ↓
실제 Binary
```

Object가 없으므로 마지막 단계로 갈 수 없다.

## 확인 — 실제 파일이 필요한가, Pointer만 있어도 되는가

여기서 먼저 목적을 나눈다.

```text
실제 Binary가 반드시 필요하다
→ 원본 LFS Storage/Backup에서 Object 복구가 우선

과거 Binary는 필요 없고 History만 흡수하면 된다
→ Pointer 상태로 가져온 뒤 History 정리 가능
```

실제 데이터가 필요한 상황에서 `GIT_LFS_SKIP_SMUDGE`는 복구 방법이 아니다. 단지 실제 object 다운로드를 생략하는 우회다.

## 1차 우회 — Smudge를 건너뛰고 Pointer 상태로 가져온다

과거 binary가 필요 없다는 전제라면:

```bash
GIT_LFS_SKIP_SMUDGE=1 \
git subtree add --prefix=foo https://.../foo.git main
```

을 사용할 수 있다.

```text
LFS Pointer
  ↓
Smudge 생략
  ↓
Pointer 파일 그대로 Working Tree에 유지
```

이 단계는 **로컬 checkout 실패만 우회**한다.

## 증상 2 — GitHub Push에서 다시 거부된다

Pointer 상태로 subtree merge가 완료돼도 push에서 remote가 누락된 LFS object를 문제 삼을 수 있다.

```text
Local Git History
   ↓
LFS Pointer 포함
   ↓ Push
GitHub
   ↓
Pointer가 참조하는 LFS Object 확인
   ↓
Object 없음 → Push 거부
```

따라서:

```bash
git config lfs.allowincompletepush true
```

같은 클라이언트 설정만으로 remote의 검증 요구사항까지 없앨 수 있는 것은 아니다.

## 해결 방향을 결정한다

이 시점에는 두 가지 근본 방향이 있다.

### A. LFS Object를 복구한다

실제 binary와 history를 모두 보존해야 한다면 가장 올바른 해결은 **누락된 LFS object를 원래 storage나 backup에서 복구해 remote에 존재하게 만드는 것**이다.

### B. 해당 파일의 History 자체를 제거한다

과거 binary가 더 이상 필요 없고 새 통합 repository에서도 보존할 이유가 없다면 history rewrite로 해당 path를 제거할 수 있다.

이 글에서는 B의 경우를 다룬다.

## History에서 유실된 LFS 파일 제거

`git filter-repo`로 특정 경로를 모든 commit에서 제거한다.

```bash
git filter-repo \
  --force \
  --invert-paths \
  --path-glob '*.war'
```

의미는:

```text
--path-glob '*.war'
→ 대상 Path 선택

--invert-paths
→ 선택한 Path를 보존하는 대신 제거

filter-repo
→ 전체 History를 다시 작성
```

이 작업 뒤에는 해당 파일이 과거 commit과 tree에서도 사라진다.

> History rewrite는 commit SHA를 바꾸는 파괴적인 작업이다. 이미 여러 사람이 공유하는 repository라면 영향 범위를 먼저 확인한다.

## Rewrite 후 Remote와 Push 확인

`git filter-repo`는 안전을 위해 `origin`을 제거할 수 있으므로 현재 remote를 먼저 확인한다.

```bash
git remote -v
```

필요하면 다시 추가한다.

```bash
git remote add origin https://github.com/<user>/<repo>.git
```

그다음 새 history를 push한다. 기존 remote history를 교체해야 한다면 force push가 필요할 수 있다.

```bash
git push origin main --force-with-lease
```

상황에 따라 remote가 새 repository라면 일반 push로 충분할 수 있다. **무조건 force push부터 실행하지 않는다.**

## 전체 흐름

과거 LFS binary를 버려도 되는 경우의 흐름은 다음과 같다.

```text
LFS Object 유실 확인
   ↓
실제 Binary 보존 필요 여부 판단
   ↓ 필요 없음
Smudge를 건너뛰고 Subtree History 가져오기
   ↓
Push에서 Missing LFS Object 확인
   ↓
filter-repo로 해당 Path의 History 제거
   ↓
Remote 확인
   ↓
새 History Push
```

## `.gitattributes`는 별도로 확인한다

파일 history를 제거해도 `.gitattributes`에 해당 확장자의 LFS 규칙이 남을 수 있다.

```text
*.war filter=lfs diff=lfs merge=lfs -text
```

앞으로 해당 파일을 다시 LFS로 관리할 계획이라면 유지할 수 있고, 더 이상 사용하지 않는 규칙이라면 함께 정리하는 편이 명확하다.

즉 stale rule이 "당장 오류가 없으니 무조건 유지" 대상인 것은 아니다.

## 정리

```text
Smudge 실패
→ 로컬에서 LFS Object를 Working Tree로 만들지 못한 문제

Push 거부
→ Remote가 필요한 LFS Object를 확인하지 못한 문제

GIT_LFS_SKIP_SMUDGE
→ 첫 문제만 우회

filter-repo
→ Object를 복구하는 것이 아니라 해당 파일 History를 제거하는 선택
```

가장 중요한 판단은 명령어가 아니라 **유실된 binary를 보존해야 하는지**다. 보존해야 한다면 object 복구가 우선이고, 버려도 된다면 그때 history rewrite를 선택한다.
