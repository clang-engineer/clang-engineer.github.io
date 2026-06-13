---
title       : "GitHub Fork와 Use this template의 차이"
description : "비슷해 보이지만 fork network·이력 복사·upstream PR 가능 여부가 다르다. 선택 기준 정리."
date        : 2026-06-08 11:00:00 +0900
updated     : 2026-06-08 11:00:00 +0900
categories  : [git, "GitHub·잔디"]
tags        : [github, fork, template, git]
pin         : false
hidden      : false
---

이름이 비슷해 보이지만 GitHub의 "Fork"와 "Use this template"은 동작과 의도가 다르다. 새 repo를 시작할 때 잘못 고르면 의도와 다른 관계가 만들어진다.

## 차이점

| | Fork | Use this template |
|---|---|---|
| 부모 관계 | "forked from" 표시 유지 | 독립 repo (관계 없음) |
| upstream PR | 가능 | 불가능 |
| 복사 범위 | 전체 commit history | **초기 스냅샷만** |
| upstream 동기화 | `git fetch upstream` | 수동 재가져오기 |
| fork network 표시 | O | X |

## 언제 어느 쪽?

- **Fork**: 원본에 기여하거나 upstream을 따라가고 싶을 때 (라이브러리, 테마 본체 등)
- **Use this template**: 출발점만 빌리고 독립 프로젝트로 갈 때 (boilerplate, starter)

GitHub이 template repo 기능을 따로 만든 이유 자체가 "fork network에 개인 프로젝트가 쌓이지 않도록" 하기 위함이다. template repo는 fork가 아닌 template button으로 쓰는 게 convention.

## 예시: Chirpy 블로그 테마

- `cotes2020/jekyll-theme-chirpy` — 테마 본체. 일반 repo → fork 대상
- `cotes2020/chirpy-starter` — template repo로 설정됨 → "Use this template" 대상

starter를 fork할 수도 있지만 메인테이너 의도와 어긋남.

## fork 없이 upstream 따라가기

진짜 fork 관계가 필요 없고 단지 upstream 업데이트만 받고 싶다면 remote 추가로 충분:

```sh
git remote add upstream https://github.com/<org>/<repo>.git
git fetch upstream
git merge upstream/main
```

GitHub UI 상 "forked from" 라벨은 없지만 실질적 가치(업데이트 머지)는 동일.

## 참고

- 기존 repo를 다른 repo의 fork로 **변환하는 기능은 GitHub에 없음**. 진짜 fork 관계를 원하면 repo를 새로 만들어야 함
- `git merge --allow-unrelated-histories`로 두 unrelated 이력을 한 브랜치로 합칠 수 있어, 새 fork에 기존 repo의 이력을 통합하는 것도 가능
