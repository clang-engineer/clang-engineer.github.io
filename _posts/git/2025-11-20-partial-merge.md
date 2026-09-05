---
title       : Git에서 일부 변경만 Merge한 뒤 나머지 변경이 다시 안 보이는 이유
description : "develop을 merge한 뒤 일부 내용만 남긴 merge commit을 만들면 이후 merge-base가 이미 병합된 것으로 계산되어 기대한 변경이 다시 나타나지 않을 수 있다. 원인과 안전한 대안을 정리한다."
date        : 2025-11-20 09:35:56 +0900
updated     : 2026-09-05 19:25:00 +0900
categories  : [git, "저장소·운영"]
tags        : [merge, troubleshooting, merge-base]
pin         : false
hidden      : false
---

`main`에서 `develop`의 변경 중 일부만 가져오고 싶어서 전체 merge를 시작한 뒤 원하지 않는 파일이나 코드를 되돌리고 그대로 merge commit을 만들 수 있다.

```bash
git switch main
git merge develop --no-commit --no-ff
# 일부 변경을 되돌림
git commit -m "partial merge"
```

그 순간 원하는 코드만 들어간 것처럼 보이지만, 이후 다시 `develop → main`을 merge했을 때 **전에 제외했던 변경이 예상대로 다시 나타나지 않는 문제**가 생길 수 있다.

이 문제는 "Git이 거부한 코드를 삭제 기록으로 저장해서"라기보다 **merge commit의 그래프 의미와 merge-base 계산** 때문에 생긴다.

## 1. 증상

처음 상태를 단순화하면:

```text
main    A
         \
develop   B ─ C ─ D
```

`B~D`의 변경 중 일부만 `main`에 반영하고 싶어서 `develop` 전체를 merge 대상으로 선택한 뒤 일부 내용을 제거한 merge commit `M`을 만든다고 하자.

```text
main    A ───── M
         \     /
develop   B ─ C ─ D
```

`M`의 최종 파일 내용에는 `develop` 변경 일부가 빠져 있을 수 있다. 하지만 **Commit Graph에서는 M이 develop의 D를 부모로 가진 merge commit**이다.

이후 develop에 추가 변경 `E`가 생기면:

```text
main    A ───── M
         \     /
develop   B ─ C ─ D ─ E
```

다음 merge에서는 Git이 `D` 이전의 History를 이미 merge한 것으로 본다. 그래서 과거 `B~D`에서 의도적으로 제외했던 내용을 "이번에 처음 들어오는 변경"처럼 다시 제시하지 않는다.

## 2. 원인 — Merge 결과와 Merge History는 별개다

핵심은 merge commit이 두 가지 정보를 동시에 가진다는 점이다.

```text
Merge Commit M
├─ 결과 Tree
│   → 실제 파일 내용
└─ Parent 2개
    ├─ main의 이전 Commit
    └─ develop의 당시 Commit
```

일부 코드를 되돌린 뒤 commit해도 **두 번째 부모가 develop의 D라는 사실은 그대로**다.

따라서 Git History 관점에서는:

> main은 develop의 D까지 한 번 merge했다.

라는 관계가 만들어진다.

반면 최종 Tree에서는 일부 develop 변경을 제거했을 수 있다.

```text
Graph 의미
develop D까지 병합됨

Tree 내용
D의 변경 일부는 없음
```

이 둘의 차이가 이후 merge에서 혼란을 만든다.

## 3. `--no-verify`는 원인과 관계없다

```bash
git commit --no-verify
```

의 `--no-verify`는 commit hook을 건너뛰는 옵션이다.

```text
--no-verify
→ Hook 실행 여부

Merge Parent
→ Commit Graph 구조
```

이므로 이 문제의 원인이나 해결과는 관계가 없다.

## 4. 먼저 결정해야 할 것 — 정말 "Merge"가 필요한가

일부 변경만 가져오는 목적이라면 먼저 질문을 바꿔야 한다.

```text
develop라는 Branch 전체를 병합하려는가?
        │
        ├─ Yes → 정상 Merge
        │
        └─ No
            ↓
특정 Commit / 파일 / Hunk만 가져오려는가?
            ↓
Cherry-pick / restore / patch 사용
```

**전체 Branch를 merge하지 않을 것이라면 merge commit을 만들지 않는 편이 History 의미와 실제 의도가 일치한다.**

## 5. 특정 Commit만 필요하면 Cherry-pick

필요한 변경이 commit 단위로 구분된다면 가장 명확하다.

```bash
git switch main
git cherry-pick <commit-sha>
```

여러 commit이라면 필요한 것만 선택한다.

```text
develop
B ─ C ─ D
    ↑   ↑
    필요한 Commit만
        ↓
main에 Cherry-pick
```

이 경우 main은 `develop 전체를 merge했다`는 관계를 만들지 않는다.

## 6. 특정 파일만 필요하면 restore

특정 파일의 현재 버전만 가져오고 싶다면:

```bash
git restore --source=develop -- path/to/file

git add path/to/file
git commit -m "bring selected file from develop"
```

이것도 일반 commit이므로 branch 전체를 merge했다는 그래프 관계가 생기지 않는다.

## 7. 일부 Hunk만 필요하면 Patch 또는 Interactive 선택

파일 안에서도 일부 변경만 가져오고 싶다면 patch 단위로 선택할 수 있다.

예를 들어:

```bash
git restore -p --source=develop -- .
```

또는 diff를 patch로 만들어 필요한 부분만 적용할 수 있다.

```bash
git diff main...develop > changes.patch
git apply --index changes.patch
```

실제로는 전체 patch를 그대로 적용하기보다 필요한 hunk만 선택·편집하는 편이 목적에 맞다.

핵심은 결과 commit이:

```text
Parent 1개
→ 일반 Commit
```

으로 남게 하는 것이다.

## 8. Merge를 미리 펼쳐 보고 일부만 가져오는 방법

전체 merge 결과를 작업 트리에서 한번 보고 필요한 부분만 일반 commit으로 만들고 싶다면, merge를 **최종 History로 기록하지 않고 작업 재료로만 사용**해야 한다.

예를 들어 merge를 시작한 뒤 최종 merge 상태를 취소하고 working tree의 필요한 변경을 다시 선택하는 방법을 사용할 수 있다. 다만 `git reset`·`git merge --abort`의 동작은 현재 index/working tree 상태에 영향을 주므로, 이것을 일반적인 "부분 merge 공식"처럼 외우는 것보다 `cherry-pick`, `restore -p`, patch처럼 의도가 명확한 방법을 우선하는 편이 안전하다.

즉 과거에 사용했던:

```bash
git merge develop --no-commit
git reset HEAD
```

패턴은 상황에 따라 작업 트리를 남기는 데 활용할 수 있지만, **부분 변경을 가져오는 기본 해법으로 권장하지 않는다.**

## 9. 이미 문제가 되는 Merge Commit을 만들었다면

먼저 해당 merge commit이 이미 공유됐는지 확인한다.

### 아직 Push하지 않았거나 History 재작성 가능

merge 전 상태로 돌아가 올바른 방식으로 다시 적용할 수 있다.

```bash
git reset --hard <merge-before-sha>
```

단, 현재 작업을 반드시 먼저 보호한다.

### 이미 공유된 History

공유 branch의 merge commit을 단순 삭제하기보다 팀의 History 정책에 맞게 revert 또는 후속 수정 commit을 선택해야 한다.

Merge commit을 revert하려면 mainline parent를 지정해야 할 수 있다.

```bash
git revert -m 1 <merge-commit-sha>
```

여기서 `-m 1`은 첫 번째 parent를 mainline으로 선택한다는 뜻이므로 실제 parent 관계를 확인한 뒤 사용한다.

그리고 나중에 같은 branch를 다시 merge하려면 **merge revert의 그래프 의미**까지 고려해야 하므로 단순한 일반 commit revert보다 주의가 필요하다.

## 10. 기억할 핵심

잘못 이해하기 쉬운 표현은:

> Merge commit이 제외한 변경을 "삭제 기록"으로 저장한다.

가 아니다.

더 정확한 그림은:

```text
일부 내용만 남긴 Merge Commit
          ↓
Tree에는 일부 변경이 없음
          +
Graph에는 develop을 Parent로 기록
          ↓
Git은 해당 develop History를 이미 Merge한 것으로 판단
          ↓
다음 Merge에서 과거 변경이 새 Diff로 다시 등장하지 않음
```

이다.

## 정리

**Branch 전체를 병합할 의도가 없다면 Branch 전체를 merge한 History를 만들지 않는다.**

```text
특정 Commit → cherry-pick
특정 File   → git restore --source
특정 Hunk   → git restore -p / patch
Branch 전체 → git merge
```

부분 반영 문제는 "merge 명령을 어떻게 꼼수로 사용할까"보다 **내가 History에 어떤 관계를 기록하려는가**부터 결정하면 훨씬 단순해진다.
