---
title       : "브랜치 통합 함정 — 로컬 ref ≠ 원격 ref, orphan main과 non-ff"
description : "로컬 ref만 보고 ff로 판단했다가 원격에서 non-fast-forward로 거부되는 orphan 브랜치 함정과 해법."
date        : 2026-07-08 11:00:00 +0900
updated     : 2026-07-08 11:00:00 +0900
categories  : [git]
tags        : [branch, fast-forward, merge-base, orphan-branch, non-fast-forward, default-branch]
pin         : false
hidden      : false
---

`main`·`master`가 뒤섞인 repo를 하나로 정리할 때, **로컬 ref만 보고 "선형이니 ff로 끝"이라 판단하면 원격에서 non-fast-forward로 거부**될 수 있다. 로컬 `main`과 `origin/main`이 같은 이름·같은 커밋 메시지여도 실체(히스토리)가 다를 수 있기 때문. 파괴적 작업 전엔 반드시 `git fetch` 후 **원격 ref 기준**으로 `merge-base`를 확인한다.

## 선형성/무관성 검증 순서

```sh
git fetch origin
# A에 있고 B에 없는 커밋
git log --oneline B..origin/A
# 공통 조상 — 비어 있으면 "완전 무관한 히스토리"(unrelated)
git merge-base origin/A B
```

- `merge-base`가 **비어 있음** → 두 브랜치는 공통 뿌리가 없는 **orphan/unrelated** 관계. ff 불가, merge도 `--allow-unrelated-histories` 필요.
- `merge-base == 한쪽 tip` → 그쪽이 다른쪽의 **순수 조상** → ff 가능(충돌·머지커밋 0).

## 실제로 밟은 함정

- GitHub repo에 **버려진 초기 `main`**(자동 생성된 `Initial commit` 3개짜리)이 진짜 작업 라인(`master` 계열 450커밋)과 **뿌리부터 무관**하게 존재.
- 로컬 `main`(진짜 라인의 조상)을 작업본으로 ff → `git push origin main`이 **non-fast-forward로 거부**. 원인은 origin/main이 그 고아 브랜치였기 때문.
- 무관한 두 히스토리는 ff가 원천적으로 불가 → 교체하려면 원격을 `--force` 하거나 **삭제 후 재push**.

```sh
# 고아 원격 브랜치를 실제 작업본으로 교체 (force 대신 삭제+push가 의도 명확)
git push origin --delete main
git push origin main            # 로컬 main(진짜 작업본)으로 새로 생성
```

## default 브랜치 삭제 순서

원격 **기본 브랜치(default branch)는 삭제 불가**. `master`→`main` 전환 시 순서를 지켜야 한다:

```sh
git push origin main                     # 1. 새 default 후보를 먼저 push
gh repo edit --default-branch main       # 2. GitHub default 전환
git push origin --delete master          # 3. 그 다음에야 구 default 삭제
```

## 교훈

- 로컬 브랜치 그래프(`git log --all --graph`)는 **원격 실체를 반영 안 할 수 있다**. 통합·삭제 전 `git fetch` 필수.
- `non-fast-forward` 거부는 대개 "원격이 앞서 있다"지만, **공통 조상이 아예 없는 orphan**일 때도 뜬다 — `merge-base`로 구분.
- 파괴적 push 실패는 **오히려 안전장치**다. 강제로 밀지 말고 원격 상태부터 조사.
