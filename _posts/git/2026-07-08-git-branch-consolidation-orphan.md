---
title       : "Git Branch 통합에서 non-fast-forward가 날 때 — local과 origin의 History부터 비교하기"
description : "main·master 정리 과정에서 local branch만 보고 fast-forward 가능하다고 판단했다가 origin에서 non-fast-forward가 발생하는 원인을 fetch·merge-base·remote ref 기준으로 진단한다."
date        : 2026-07-08 11:00:00 +0900
updated     : 2026-09-05 19:50:00 +0900
categories  : [git, "저장소·운영"]
tags        : [branch, fast-forward, merge-base, unrelated-history, non-fast-forward, troubleshooting]
pin         : false
hidden      : false
---

`main`과 `master`를 하나로 정리하는 작업에서 local graph만 보고 "선형이니 fast-forward면 끝"이라고 판단했는데 push가 `non-fast-forward`로 거부될 수 있다.

이때 가장 먼저 확인할 것은 **local `main`과 remote의 `origin/main`이 정말 같은 History인가**다.

```text
Local Branch 이름
≠
Remote Tracking Ref의 실제 Commit Graph
```

브랜치 이름이 같아도 서로 전혀 다른 commit을 가리킬 수 있다.

## 증상

local에서 branch 정리를 끝낸 뒤:

```bash
git push origin main
```

했는데 다음처럼 거부된다.

```text
! [rejected] main -> main (non-fast-forward)
```

local graph만 보면 `main`이 원하는 작업 line을 정상적으로 가리키고 있어 원인이 잘 보이지 않을 수 있다.

## 1. 먼저 Remote 상태를 최신으로 만든다

파괴적인 작업 전에 항상 fetch한다.

```bash
git fetch origin --prune
```

이제 비교 대상은 local branch 이름이 아니라:

```text
main
origin/main
master
origin/master
```

각 ref가 실제로 가리키는 commit이다.

## 2. `merge-base`로 두 History의 관계를 확인한다

예를 들어 현재 local `main`과 remote `origin/main`의 공통 조상을 확인한다.

```bash
git merge-base main origin/main
```

### 공통 조상이 없다

출력이 없고 종료 상태가 실패라면 두 ref는 unrelated history일 수 있다.

```text
History A
A1 -- A2 -- A3

History B
B1 -- B2

공통 조상 없음
```

이 경우 fast-forward는 불가능하다.

### 한쪽 Tip이 Merge Base다

예를 들어:

```bash
git merge-base --is-ancestor origin/main main
```

이 성공한다면 remote tip이 local main의 조상이다.

```text
origin/main
    A -- B
         \
          C -- D  main
```

이 관계라면 일반적인 fast-forward push가 가능하다.

반대로 local이 remote의 조상이면 remote가 더 앞서 있으므로 먼저 remote 변경을 어떻게 처리할지 결정해야 한다.

## 3. Commit 차이를 직접 본다

양쪽에만 존재하는 commit을 확인한다.

```bash
git log --oneline --left-right main...origin/main
```

또는 각각:

```bash
git log --oneline origin/main..main
git log --oneline main..origin/main
```

이 단계에서 "원격이 단순히 몇 commit 앞선 것"인지 "애초에 뿌리가 다른 branch"인지 구분한다.

## 실제로 발생한 구조

문제 상황은 대략 다음과 같았다.

```text
실제 작업 History
A -- B -- C -- ... -- Z
                    ↑
                  local main

GitHub에 남아 있던 초기 main
X -- Y -- Q
     ↑
 origin/main
```

`main`이라는 이름은 같지만 두 branch는 공통 조상이 없었다.

그래서 local에서 원하는 작업 line을 `main`으로 정리한 것만으로는 `origin/main`을 fast-forward할 수 없었다.

## 4. 해결은 "원격 History를 보존할 것인가"부터 결정한다

여기서 바로 force push하지 않는다.

먼저 remote `main`의 기존 history가 정말 버려도 되는 초기/실수 branch인지 확인한다.

```text
origin/main History가 필요하다
→ merge/rebase 또는 별도 보존 방법 검토

origin/main History가 명확히 폐기 대상이다
→ remote main을 새 History로 교체 가능
```

폐기 전에 backup branch를 remote나 local에 남기는 것도 안전하다.

```bash
git branch backup/origin-main origin/main
```

## 5. Remote Branch를 교체해야 한다면

기존 remote history를 의도적으로 새 history로 바꾸는 작업은 **history replacement**다.

보호 정책이 허용되고 영향 범위를 확인했다면:

```bash
git push --force-with-lease origin main
```

을 고려할 수 있다.

`--force-with-lease`는 단순 `--force`보다 현재 알고 있는 remote ref가 예상과 다르게 바뀌었는지 확인하는 안전장치를 제공한다.

```text
내가 마지막 fetch에서 본 origin/main
        ↓
현재 Remote와 같은가?
├─ Yes → 교체 진행 가능
└─ No  → 중단하고 다시 확인
```

Remote branch를 삭제한 뒤 다시 push하는 방법도 가능하지만, **삭제 자체가 더 안전한 방식은 아니다.** 둘 다 기존 remote history를 교체하는 파괴적 작업이므로 의도와 보호 절차가 중요하다.

## 6. Default Branch 이름까지 바꾸는 경우

예를 들어 `master → main`으로 전환하면서 기존 `master`를 삭제한다면 새 branch를 먼저 remote에 만든다.

```bash
git push -u origin main
```

그다음 GitHub default branch를 `main`으로 전환한다.

```bash
gh repo edit --default-branch main
```

마지막으로 더 이상 필요 없는 remote `master`를 삭제한다.

```bash
git push origin --delete master
```

핵심 순서는:

```text
새 Branch Push
   ↓
Default Branch 전환
   ↓
구 Branch 삭제
```

이다.

## 7. `non-fast-forward`는 원인이 아니라 안전장치다

`non-fast-forward`는 단순히 "remote가 더 최신이다"라는 하나의 원인만 뜻하지 않는다.

다음 경우 모두 나타날 수 있다.

```text
Remote에 Local이 모르는 Commit 존재
Local/Remote가 Diverged
History가 완전히 Unrelated
```

공통점은 **현재 push가 remote history를 단순 확장하는 fast-forward가 아니라는 것**이다.

따라서 오류를 없애기 위해 즉시 force하는 것이 아니라 graph 관계부터 확인해야 한다.

## 정리

```text
Push가 non-fast-forward로 거부
   ↓
git fetch origin --prune
   ↓
Local ref vs origin/* 비교
   ↓
merge-base / left-right log 확인
   ↓
관계 판정
├─ Remote가 조상 → 일반 Fast-forward
├─ Diverged → Merge/Rebase 정책 결정
└─ Unrelated → History 보존/교체 여부 결정
                    ↓
              필요할 때만 강제 교체
```

**브랜치 이름이 아니라 Commit Graph를 비교하고, force push는 진단 결과가 아니라 마지막 정책 선택으로 둔다**는 것이 핵심이다.
