---
title       : Git Shallow Clone — 전체 History 없이 필요한 깊이만 가져오기
description : "소스는 작지만 .git History가 큰 저장소에서 shallow clone으로 필요한 Commit 깊이만 가져오는 원리와 제약, unshallow·history rewrite·LFS와의 역할 차이를 정리한다."
date        : 2026-02-26 17:00:00 +0900
updated     : 2026-09-05 19:25:00 +0900
categories  : [git, "저장소·운영"]
tags        : [git, shallow-clone, performance, how-to]
pin         : false
hidden      : false
---

프로젝트의 현재 소스는 몇 MB밖에 안 되는데 `.git`은 수백 MB인 경우가 있다. 현재 working tree 크기와 Git 저장소 전체 History 크기는 서로 다른 문제이기 때문이다.

```text
현재 파일
→ 지금 Checkout된 Snapshot

.git
→ Commit / Tree / Blob / Tag 등 과거 Object 전체
```

과거에 큰 바이너리를 commit했다가 나중에 삭제해도 현재 파일에서는 사라지지만, 그 blob이 reachable한 History에 남아 있으면 clone할 때 여전히 가져올 수 있다.

Shallow Clone은 이 문제를 **History 자체를 고쳐서 해결하는 기능이 아니라, clone할 때 가져오는 History 깊이를 제한하는 방법**이다.

## 1. 먼저 현재 크기를 확인한다

현재 소스와 Git object 크기를 따로 본다.

```bash
du -sh src/
git count-objects -vH
```

예를 들어:

```text
src/        3.6 MiB
.git pack  728 MiB
```

라면 현재 소스보다 과거 History 쪽이 훨씬 큰 상태다.

## 2. Shallow Clone의 구조

일반 clone은 기본적으로 필요한 branch History를 따라 과거 object를 가져온다.

```text
A ─ B ─ C ─ D ─ E
                ↑ HEAD

일반 Clone
→ A~E History 사용 가능
```

`--depth 1`을 사용하면 현재 tip 근처의 제한된 History만 가져온다.

```text
A ─ B ─ C ─ D ─ E
                ↑
         Shallow Boundary

--depth 1
→ E 중심의 얕은 History
```

명령은:

```bash
git clone --depth 1 --branch <branch> <remote-url> <directory>
```

이다.

## 3. 무엇이 가벼워지고 무엇이 사라지나

| 관점 | 일반 Clone | Shallow Clone |
|---|---|---|
| 과거 Commit History | 전체 사용 가능 | 지정 깊이까지만 |
| 초기 전송량 | 큼 | 작음 |
| `.git` 초기 크기 | 큼 | 작음 |
| 현재 소스 빌드·수정 | 가능 | 가능 |
| 오래된 Commit 조회 | 가능 | 제한 |
| 깊은 `blame`·history 분석 | 가능 | 제한 |

즉 Shallow Clone은 **현재 버전을 받아 빌드·개발하는 작업에는 충분할 수 있지만 과거 이력이 필요한 작업에서는 제약**이 생긴다.

## 4. 일반적인 개발 작업은 가능한가

현재 shallow repository에서 새 commit을 만드는 것은 가능하다.

```bash
git add .
git commit -m "change"
git push
```

새 branch도 현재 알고 있는 commit에서 만들 수 있다.

```bash
git switch -c feature/test
```

다만 repository가 "전체 History를 알고 있다"고 가정하는 작업은 제한될 수 있다.

```text
오래된 Commit checkout
깊은 git log
정확한 과거 blame
일부 merge-base 계산
History 전체를 전제로 하는 도구
```

따라서 CI checkout이나 단순 빌드에는 shallow clone이 잘 맞지만, release/history 분석이나 복잡한 branch 작업에서는 필요한 깊이를 확인해야 한다.

## 5. 깊이가 더 필요하면 늘릴 수 있다

처음부터 전체 History를 받을 필요는 없다.

추가 History를 가져오려면:

```bash
git fetch --deepen 50
```

처럼 현재 shallow boundary를 더 과거로 확장할 수 있다.

전체 History가 필요해지면:

```bash
git fetch --unshallow
```

을 사용한다.

즉:

```text
depth 1
  ↓ 필요
더 깊게 fetch
  ↓ 필요
unshallow
```

처럼 단계적으로 확장할 수 있다.

## 6. Shallow Clone은 저장소 비대화의 근본 해결이 아니다

중요한 경계다.

```text
Shallow Clone
→ 이 Clone이 과거 History를 덜 받는다

History Rewrite
→ 원격 Repository의 과거 Object 자체를 다시 작성한다
```

과거 대용량 파일이 잘못 들어가 Repository 자체가 비대해졌다면 shallow clone은 사용자 입장에서 전송량을 줄이는 우회책이지 원본 History를 정리하지는 않는다.

## 7. 과거 대용량 파일을 찾아야 한다면

Git object를 조사해 큰 blob을 찾을 수 있다.

```bash
git rev-list --objects --all \
  | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' \
  | sed -n 's/^blob //p' \
  | sort -rnk2 \
  | head -10
```

실제 History 정리가 필요하다면 현재는 `git filter-repo` 같은 History Rewrite 도구를 우선 검토하는 편이 일반적이다.

History Rewrite는 commit SHA를 바꾸고 공동 작업자에게 영향을 주므로 **팀 전체와 조율한 뒤 수행해야 한다.**

## 8. Git LFS와는 역할이 다르다

Git LFS는 앞으로 관리할 큰 파일의 저장 방식을 바꾸는 도구다.

```text
일반 Git
Commit → 큰 Blob 자체를 Git Object로 저장

Git LFS
Commit → 작은 Pointer
          ↓
       LFS Storage에 실제 파일
```

예를 들어:

```bash
git lfs install
git lfs track "*.gif"
git add .gitattributes
```

LFS는 **대용량 파일을 계속 버전 관리해야 할 때** 적합하다.

이미 과거 History에 들어간 큰 blob은 별도 migration/history rewrite 없이 단순히 `git lfs track`만 실행한다고 사라지지 않는다.

## 9. `.gitignore`도 다른 문제를 해결한다

`.gitignore`는 아직 추적되지 않은 파일이 앞으로 실수로 추가되는 것을 막는다.

```gitignore
src/main/resources/guide/**/*.gif
src/main/resources/static/guide/**/*.gif
```

하지만 이미 commit된 blob의 과거 History를 제거하지는 않는다.

```text
.gitignore
→ 미래의 실수 방지

Git LFS
→ 큰 파일을 별도 방식으로 지속 관리

History Rewrite
→ 이미 들어간 과거 Blob 제거

Shallow Clone
→ Clone 시 가져오는 History 범위 제한
```

이 네 가지를 같은 해결책으로 보면 안 된다.

## 선택 기준

```text
현재 버전만 빠르게 받아 쓰고 싶은가?
→ Shallow Clone

과거 큰 파일 때문에 원격 History 자체를 정리해야 하는가?
→ History Rewrite

큰 파일을 앞으로도 버전 관리해야 하는가?
→ Git LFS

애초에 추적할 필요 없는 생성물인가?
→ .gitignore
```

## 정리

Shallow Clone의 핵심은 "큰 Git 저장소를 작게 만드는 것"보다 정확히는:

> **이 작업 사본이 필요한 만큼의 History만 가져오게 한다.**

는 것이다.

현재 버전 중심의 작업에서는 매우 유용하지만, History를 분석하거나 오래된 Commit과 관계를 계산해야 하는 작업에서는 깊이를 늘리거나 `--unshallow`로 전체 History를 복구해야 한다.
