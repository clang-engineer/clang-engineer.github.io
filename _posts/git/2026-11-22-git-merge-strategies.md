---
title       : "Git 병합 전략 — Fast-forward·3-way·Squash·Rebase"
description : "Git의 병합 메커니즘과 커밋 이력 정리 방식을 구분하고 GitHub PR 옵션 및 상황별 선택 기준을 이해한다."
date        : 2026-11-22 20:00:00 +0900
categories  : [git, "개념·비교"]
tags        : [git, merge, fast-forward, three-way, squash, rebase, github]
pin         : false
hidden      : false
---

Git 병합을 이해할 때는 **변경 내용을 어떻게 통합하는가**와 **커밋 이력을 어떤 형태로 남기는가**를 먼저 구분해야 한다. Fast-forward와 3-way merge는 Git의 병합 동작이고, squash와 rebase는 커밋을 합치거나 다시 적용해 이력을 구성하는 방법이다.

## 전체 구조

```text
Git의 브랜치 통합
├─ 병합 메커니즘
│  ├─ Fast-forward: 조상 관계이면 ref만 이동
│  └─ 3-way: 공통 조상과 양쪽 tip을 비교해 통합
└─ 이력 구성
   ├─ Merge commit: 두 부모를 가진 커밋으로 연결
   ├─ Squash: 여러 변경을 하나의 새 커밋으로 기록
   └─ Rebase: 커밋을 다른 기준점 위에 재적용
```

`git merge`는 상황에 따라 fast-forward 또는 3-way merge를 수행한다. `git merge --squash`는 변경을 작업 트리와 인덱스에 반영하지만 병합 커밋이나 브랜치 조상 관계를 만들지는 않는다. `git rebase`는 엄밀히 말해 merge 명령의 한 방식이 아니라 이력 재작성 연산이다.

## 1. Fast-forward — 포인터만 이동

```text
병합 전
A ── B (main) ── C ── D (feature)

병합 후
A ── B ── C ── D (main, feature)
```

현재 main의 tip인 B가 feature의 조상이므로 새로운 커밋 없이 main ref를 D로 이동할 수 있다.

```bash
git switch main
git merge --ff-only feature
```

`--ff-only`는 fast-forward가 불가능하면 중단한다. 반대로 `--no-ff`는 fast-forward가 가능한 상황에서도 별도의 merge commit을 만들도록 한다.

## 2. 3-way Merge — 분기된 이력 통합

```text
병합 전              병합 후
    B (main)             B ── M (main)
   /                    /     /
  A                    A     /
   \                    \   /
    C (feature)          C (feature)
```

공통 조상 A, main의 B, feature의 C라는 세 스냅샷을 기준으로 변경을 합친다. 일반적인 비 fast-forward 병합은 두 부모를 가진 M을 만든다.

```bash
git switch main
git merge --no-ff feature
```

동일한 영역의 변경을 자동으로 합칠 수 없다면 충돌을 해결해야 한다. 3-way라는 말은 **부모가 세 개**라는 뜻이 아니라 비교 기준이 세 개라는 뜻이다.

## 3. Squash — 여러 변경을 하나로 기록

```text
A ── B (main)                A ── B ── S (main)
     \                                   (C+D 변경)
      C ── D (feature)         C ── D (feature)는 별도 이력
```

```bash
git switch main
git merge --squash feature
git commit -m "feat: integrate feature"
```

S는 변경 결과를 담은 새로운 단일 커밋이다. C, D의 부모 관계를 main에 연결하지 않으므로 이후 같은 브랜치의 변경을 다시 통합할 때 주의해야 한다. GitHub의 **Squash and merge**도 PR의 변경을 하나의 새 커밋으로 기록한다.

## 4. Rebase — 커밋을 다른 기준점에 다시 적용

```text
기존:      A ── B (main)
            \
             C ── D (feature)

rebase 후: A ── B ── C' ── D' (feature)
            \
             C ── D (기존 커밋)
```

```bash
git switch feature
git rebase main
git switch main
git merge --ff-only feature
```

Rebase는 C와 D의 변경을 B 위에 재적용하여 C', D'를 만든다. 부모와 커밋 식별자가 달라질 수 있으므로 공유 중인 브랜치에서 무분별한 rebase와 강제 push는 피한다.

## 5. GitHub PR의 병합 옵션

| GitHub 옵션 | main에 남는 결과 | 주의점 |
|---|---|---|
| Create a merge commit | PR의 커밋들과 별도 merge commit | 분기 구조를 보존 |
| Squash and merge | PR 변경을 담은 새 커밋 하나 | 원래 PR 커밋들의 조상 관계는 main에 연결되지 않음 |
| Rebase and merge | 각 커밋을 대상 브랜치 위에 다시 적용 | 새 커밋 SHA가 만들어짐 |

**GitHub PR의 Rebase and merge와 순수 Fast-forward는 다르다.** Fast-forward는 기존 커밋을 그대로 두고 ref만 이동하지만, GitHub Rebase and merge는 커밋을 다시 생성한다.

## 6. 상황별 선택 기준

| 상황 | 우선 검토할 방법 | 이유 |
|---|---|---|
| 개인 저장소의 단순 수정 | main 직접 커밋 | 불필요한 PR·브랜치 제거 |
| 짧은 기능 PR, 작업 중 커밋이 많음 | Squash and merge | 기능 단위로 이력 정리 |
| 각 커밋이 의미 있고 선형 이력이 필요 | Rebase 후 FF | 커밋 단위 보존, 선형 이력 |
| 장기 유지하는 upstream을 병합 | Merge commit | 조상 관계를 유지해 다음 동기화에 활용 |
| 예상하지 못한 분기가 발생 | 먼저 merge-base 확인 | 이력 관계를 진단한 후 정책 결정 |

Squash가 항상 더 깔끔한 정답은 아니다. **다음 동기화에서 조상 관계가 중요한가**가 핵심 판단 기준이다. 실제 upstream 동기화 사례는 [Chirpy Upstream 동기화]({% post_url reference/blog/2026-06-12-jekyll-chirpy-upstream-sync %})에서 확인할 수 있다.

## 관련 개념과 실무 사례

- [Git 내부 모델 — Object·Index·Ref와 History Rewrite]({% post_url git/2026-10-10-git-object-model-and-history %}): 커밋과 ref가 무엇인지
- [Git Branch 통합에서 non-fast-forward가 날 때]({% post_url git/2026-07-08-git-branch-consolidation-orphan %}): local과 origin의 실제 조상 관계 진단
- [Git 로드맵]({% post_url git/2026-10-01-git-roadmap %}): 전체 학습 흐름
- [Git 공식 문서 — git merge](https://git-scm.com/docs/git-merge)
- [Git 공식 문서 — git rebase](https://git-scm.com/docs/git-rebase)
