---
title       : Git Partial Merge 시 develop 변경이 삭제되는 문제 정리
description : 
date        : 2025-11-20 09:35:56 +0900
updated     : 2025-11-20 10:24:10 +0900
categories  : [dev, git]
tags        : [git, merge, partial-merge, 개발팁]
pin         : false
hidden      : false
---

# # Git Partial Merge 시 발생하는 develop 삭제 문제 — 전체 정리

## 1) 문제의 시작

너는 `main` 브랜치에서 `develop`의 **일부 변경만** 가져오고 싶어서 다음 명령을 사용했다:

```
git merge develop --no-ff --no-commit
# 이후 원하지 않는 변경 제거
git commit -m "partial merge" --no-verify
```

겉으로는 잘 된 것처럼 보였지만, 이후 문제 발생:

* develop → main merge 시
* develop 변경이 diff로 잡히지 않음
* 일부 변경이 **삭제된 것처럼 취급됨**
* 심하면 develop 코드가 사라져버림

---

## 2) 원인

문제의 핵심은 다음 한 줄이다:

> **merge commit(부모가 2개인 commit)이 생성되면 Git은
> develop의 나머지 변경을 “삭제된 변경”으로 기록한다.**

즉,

```
git merge develop --no-commit
git commit
```

이 조합은 반드시 **merge commit**을 만든다.

이 merge commit은:

* main이 develop의 일부 변경을 **삭제했다(거부했다)**
* 나머지 develop 변경은 main에서는 필요 없다고 판단했다

라고 Git에게 기록된다.

그 결과:

* 이후 develop → main merge 시 Git은 나머지 변경을 스킵함
* diff가 나오지 않거나
* develop 코드가 삭제된 상태가 유지됨
* Git이 “네가 예전에 그 코드 삭제했잖아?”라고 판단하는 것

---

## 3) 중요한 사실

### ❗ merge commit을 만들면 —no-verify를 써도 의미가 없다

`--no-verify`는 pre-commit hook 우회 옵션일 뿐,
merge commit 구조 자체를 변경하지 않는다.

삭제 기록이 남는 이유는:

* hook 때문이 아니라
* **merge commit 자체 때문**

따라서:

```
git commit -m … --no-verify
```

은 삭제 문제의 원인과 무관하다.

---

## 4) 부분 병합을 하면서 삭제 기록을 남기지 않는 단 한 가지 원칙

# 👉 **merge commit을 만들지 말아야 한다.**

이 원칙만 지키면 partial merge는 100% 안전하게 된다.

---

## 5) 삭제 기록 없이 Partial Merge를 수행하는 정석 절차

### 🔥 정답 절차

```
git merge develop --no-commit --no-ff
git reset HEAD          # ✨ merge-parent 정보 제거
# 필요한 코드만 직접 수정/정리
git add .
git commit -m "partial merge (manual)" --no-verify
```

### 이 절차의 핵심:

* `git merge`는 staging까지는 쓸 수 있다
* 하지만 commit 단계에서 merge-parent를 반드시 제거해야 한다
* 그래서 **git reset HEAD** 가 결정적으로 중요

### 결과:

* 이 commit은 merge commit이 아닌 **일반 commit**
* Git은 이것을 “코드 변경”으로만 인식
* develop의 나머지 변경을 삭제했다는 기록이 없음
* 향후 develop → main merge도 정상 diff가 뜬다

---

## 6) 이미 잘못된 partial merge commit이 있다면?

### 1) 되돌리기(안전)

```
git revert <partial-merge-commit>
```

### 2) 히스토리 삭제(혼자 작업할 때)

```
git reset --hard <문제 커밋 이전 SHA>
```

이후 올바른 방식으로 partial merge를 다시 진행하면 됨.

---

## 7) 디렉터리/파일을 특정할 수 없을 때?

코드 조각을 직접 보고 판단해야 하는 상황이라면:

* merge staging 활용
* merge-parent 제거
* 일반 commit 생성

이 방식이 가장 현실적이다.

```
git merge develop --no-commit
git reset HEAD
# 코드 보고 필요한 부분만 반영
git add .
git commit -m "partial merge" --no-verify
```

폴더를 지정할 필요 없음.

---

## 8) diff 기반 partial merge

경로를 특정하기 어렵지만 전체 diff에서 특정 부분만 가져오고 싶다면:

```
git diff main..develop > partial.patch
git apply partial.patch
git commit -am "partial merge (patch)" --no-verify
```

이것도 안전하다.

---

# 최종 결론 (정리의 정리)

## ❌ 잘못된 partial merge

```
git merge develop --no-commit
git commit     # merge commit → 삭제 기록 생성
```

## ✔ 올바른 partial merge

```
git merge develop --no-commit
git reset HEAD
(코드 정리)
git add .
git commit --no-verify   # 일반 commit
```

> **핵심은 merge commit을 만들지 않는 것이다.**
