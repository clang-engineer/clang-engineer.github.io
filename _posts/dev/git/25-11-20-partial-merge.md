---
title       : Git Partial Merge 시 develop 변경이 삭제되는 문제 정리
description : 
date        : 2025-11-20 09:35:56 +0900
updated     : 2025-11-20 09:46:37 +0900
categories  : [dev, git]
tags        : [git, merge, partial-merge, 개발팁]
pin         : false
hidden      : false
---

# # Git Partial Merge 시 develop 변경이 삭제되는 문제와 올바른 해결 방법

실제 프로젝트를 진행하다 보면,
`main` 브랜치에서 `develop` 브랜치의 변경 중 **일부만** 가져오고 싶은 상황이 생긴다.
예를 들어:

* develop 전체를 main에 반영하기엔 아직 불안정한데
* 특정 기능/버그픽스만 main에 필요할 때

이때 다음과 같은 방식으로 흔히 partial merge(부분 병합)를 시도한다.

```bash
git checkout main
git merge develop --no-ff --no-commit
# 필요 없는 변경 제거 → commit
```

하지만 이 방식은 **심각한 부작용**을 만든다.

---

# ## 문제 상황

아래와 같이 partial merge commit이 main에 생성되었다고 하자.

```
main
 └─ partial merge commit
develop
 └─ 여러 변경들…
```

이제 나중에 다시 develop → main merge를 시도하면 다음 문제가 발생한다:

* develop 변경 사항이 **삭제된 것처럼** 취급됨
* diff가 거의 안 나타남
* merge가 “비어 있는 병합”처럼 동작함
* develop 코드를 덮어쓰지 못함
* 변경이 사라져 버림

즉, partial merge를 한 이후부터 **Git이 develop의 나머지 변경을 무시해버린다**.

---

# ## 왜 이런 일이 발생하는가?

`git merge --no-commit` 으로 develop의 변경을 가져온 뒤,
원치 않는 코드를 삭제하고 commit을 만들어버리면
이 commit은 Git에게 이렇게 보인다.

> “develop의 나머지 변경은 main에서 **의도적으로 삭제한 코드**이다.”

즉, partial merge commit은 **삭제 의도 기록**을 포함한 merge commit이 되어버린다.

Git의 merge-base가 이렇게 업데이트되면:

* develop에서 새로 merge해도
* Git은 “이미 삭제한 변경”으로 간주하고 스킵한다
* 그 결과 develop 쪽 코드가 삭제되거나 적용되지 않는다

➡ 이것이 partial merge 후 develop 코드가 사라지는 이유다.

---

# ## 잘못된 방식의 예

아래는 partial merge에 절대 사용하면 안 되는 패턴이다.

```bash
git merge develop --no-ff --no-commit
# 변경 일부 제거
git commit   # ← merge commit 생성됨
```

이 commit 하나 때문에 develop과 main은 앞으로 영구적으로 엇갈린다.

---

# ## 해결 방법

정답은 단 하나다.

# 👉 **merge commit을 만들지 않고 partial merge를 수행**해야 한다.

즉,

* merge staging 상태는 이용하되
* merge commit 대신 “일반 commit”을 만든다
* 필요 시 hook 우회를 위해 `--no-verify`도 사용한다

이렇게 하면 partial merge이면서도
develop의 나머지 변경이 **삭제로 기록되지 않는다.**

---

# ## 1) 잘못된 partial merge commit 되돌리기 (필수 단계)

이미 merge commit을 만들었다면 먼저 제거해야 한다.

### 히스토리를 보존하며 되돌리기 (안전)

```bash
git checkout main
git revert <partial-merge-commit>
```

### 아예 커밋 자체를 없애고 싶다면 (혼자 사용하는 브랜치에서만)

```bash
git reset --hard <partial-merge 이전>
```

이제 main은 깨끗한 상태가 된다.

---

# ## 2) 올바른 partial merge 방식

partial merge를 하고 싶을 때는 다음 중 하나를 사용해야 한다.

---

# ### 방법 A · merge staging + 일반 commit 방식 (가장 직관적)

1. merge staging만 가져온다

```bash
git checkout main
git merge develop --no-commit --no-ff
```

2. 코드 수동 정리
   (필요한 코드는 남기고, 필요 없는 코드는 직접 수정/삭제)

3. **merge commit을 만들지 않고 일반 commit으로 만든다**

```bash
git add .
git commit -m "partial merge (manual)" --no-verify
```

### ✔ 왜 `--no-verify`가 필요한가?

이 commit은 개발 완성 commit이 아니라
“임시 수동 정리 commit”인 경우가 대부분이기 때문에:

* lint-staged, eslint/prettier 검사
* 테스트 실행
* husky hook
* commit-msg 규칙

등의 hook이 commit을 막아버릴 수 있다.

하지만 partial merge의 초반 commit은 코드 품질이 불안정할 수 있으므로
**hook 우회가 필요할 때가 많다.**

그래서 실무에서는 아래처럼 commit하는 것이 일반적이다:

```bash
git commit -m "partial merge (manual)" --no-verify
```

### ✔ merge commit이 아니기 때문에:

* develop의 나머지 code를 “삭제한 변경”으로 기록하지 않음
* 이후 develop → main merge 시 conflict 없이 정상 작동함

---

# ### 방법 B · diff patch 기반 partial merge (정확도 최고)

1. diff 생성

```bash
git diff main..develop > partial.patch
```

2. 필요한 부분만 patch에서 삭제하거나 편집

3. main에 patch 적용

```bash
git checkout main
git apply partial.patch
git commit -am "partial merge (patch-based)" --no-verify
```

➡ 삭제 기록이 남지 않기 때문에 안전하다.

---

# ### 방법 C · 파일 단위 checkout (간단한 경우)

```bash
git checkout develop -- path/to/file.tsx
git commit -am "partial merge (file-level)" --no-verify
```

➡ 특정 파일만 가져오고 싶을 때 유용하다.

---

# ## 요약

| 방식                                          | partial merge 용도로 적합? | develop → main merge 시 문제 발생 |
| ------------------------------------------- | --------------------- | ---------------------------- |
| merge --no-ff --no-commit 후 merge commit 생성 | ❌ 절대 금지               | develop 코드 삭제로 기록됨           |
| merge → 일반 commit (`--no-verify` 포함 가능)     | ✔ 안전                  | 정상 병합됨                       |
| diff/patch 기반 partial merge                 | ✔ 매우 안전               | 문제 없음                        |
| cherry-pick                                 | ✔ 안전                  | 문제 없음                        |
| 파일 단위 checkout                              | ✔ 안전                  | 문제 없음                        |

---

# ## 결론

> **partial merge에서 가장 중요한 원칙은
> "merge commit을 절대 만들지 않는 것"이다.**

merge commit을 만들면 Git이 나머지 변경을 *삭제 기록*으로 간주한다.
반대로 일반 commit을 만들면 Git은 이것을 단순 코드 수정으로 취급한다.

그리고 일반 commit을 만들 때
lint/test hook 때문에 막힌다면:

```
git commit --no-verify
```

로 안전하게 우회할 수 있다.
