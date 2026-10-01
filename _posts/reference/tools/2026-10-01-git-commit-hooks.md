---
title       : "Git 커밋 훅은 어디에 쓰는가"
description : "커밋 직전에 자동 검사를 거는 Git hook의 역할과 Husky, pre-commit, prek의 사용 패턴을 정리한다."
date        : 2026-10-01 12:00:00 +0900
updated     : 2026-10-01 12:00:00 +0900
categories  : [git]
tags        : [git, hook, pre-commit, husky, prek, code-quality]
pin         : false
hidden      : false
---

Git 커밋 훅은 **커밋 같은 Git 이벤트가 일어날 때 자동으로 실행되는 스크립트**다.

그중 가장 자주 쓰는 것은 `pre-commit` 훅이다. 이름 그대로 커밋이 만들어지기 직전에 실행된다. 여기서 포맷터, 린터, 타입 체크, 비밀정보 검사 같은 작업을 돌리고 실패하면 커밋을 막을 수 있다.

```text
git commit
   ↓
pre-commit hook 실행
   ↓
검사 성공 → commit 생성
검사 실패 → commit 중단
```

핵심은 단순하다. 사람이 커밋 전에 매번 기억해서 실행해야 하는 검사를 Git 흐름 안에 넣는 것이다.

## Git hook 자체는 그냥 파일이다

Git hook은 저장소의 `.git/hooks/` 아래에 있는 실행 파일이다.

```sh
ls .git/hooks
```

예를 들어 `.git/hooks/pre-commit` 파일이 실행 가능 상태로 있으면, `git commit` 시점에 Git이 이 파일을 실행한다.

가장 단순한 예시는 이렇다.

```sh
#!/bin/sh

npm test
```

이 파일에 실행 권한을 주면 커밋 전에 `npm test`가 돈다.

```sh
chmod +x .git/hooks/pre-commit
```

다만 이 방식에는 큰 단점이 있다. `.git/hooks/`는 보통 Git에 커밋되지 않는다. 즉 팀원이 저장소를 clone해도 hook 파일은 따라오지 않는다. 그래서 실제 프로젝트에서는 hook 파일을 직접 관리하기보다 Husky, pre-commit, prek 같은 도구를 많이 쓴다.

## 무엇을 검사하나

커밋 훅에는 보통 빠르고 확실한 검사를 둔다.

```text
커밋 훅에 잘 맞는 것
├─ formatter 검사 또는 자동 적용
├─ linter
├─ staged 파일 대상 테스트
├─ merge conflict marker 검사
├─ 큰 파일 커밋 방지
└─ secret / token 패턴 검사
```

반대로 너무 오래 걸리는 전체 테스트나 배포 검증은 커밋 훅에 넣으면 개발 흐름을 자주 끊는다. 이런 검사는 CI에서 돌리고, 커밋 훅에는 빠른 1차 방어선을 두는 편이 좋다.

## Husky — Node 프로젝트에서 익숙한 방식

Husky는 JavaScript / TypeScript 프로젝트에서 많이 쓰는 Git hook 관리 도구다.

보통 다음 조합으로 사용한다.

```text
Husky
  → Git hook 설치와 실행 담당
lint-staged
  → staged 파일만 골라서 lint / format 실행
```

예를 들어 `.husky/pre-commit`은 이런 식이다.

```sh
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm exec lint-staged
```

그리고 `package.json`에는 설치 시 hook을 준비하는 스크립트를 둔다.

```json
{
  "scripts": {
    "prepare": "husky install"
  },
  "devDependencies": {
    "husky": "^9.0.0",
    "lint-staged": "^15.0.0"
  }
}
```

`lint-staged` 설정은 staged 파일만 대상으로 명령을 실행한다.

```json
{
  "lint-staged": {
    "*.{js,ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{md,json,yml}": ["prettier --write"]
  }
}
```

이 방식의 장점은 Node 생태계와 잘 맞는다는 것이다. 프론트엔드 프로젝트라면 ESLint, Prettier, TypeScript, Vitest 같은 도구를 npm script와 자연스럽게 연결할 수 있다.

## pre-commit — 언어 중립적인 hook 설정

`pre-commit`은 Python 생태계에서 시작했지만 특정 언어에 묶이지 않는 hook 관리 도구다.

설정 파일은 보통 저장소 루트의 `.pre-commit-config.yaml`이다.

```yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v5.0.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files
      - id: check-merge-conflict
```

여기서 `repo:`는 hook 정의를 어디서 가져올지 뜻한다.

```text
repo: https://...
  → 외부 hook 묶음을 받아서 사용

repo: local
  → 이 YAML 파일 안에 직접 hook 정의
```

예를 들어 `repo: local`은 내 시스템에 설치된 명령을 직접 실행하게 할 때 쓴다.

```yaml
repos:
  - repo: local
    hooks:
      - id: shellcheck
        name: ShellCheck
        language: system
        entry: shellcheck -x
        types: [shell]

      - id: stylua
        name: Stylua
        language: system
        entry: stylua --check
        types: [lua]
```

이 설정은 Shell 파일에는 `shellcheck -x`, Lua 파일에는 `stylua --check`를 실행한다.

수동으로도 실행할 수 있다.

```sh
pre-commit run
pre-commit run --all-files
```

기본 실행은 보통 staged 파일 대상이고, `--all-files`를 붙이면 저장소 전체 파일을 대상으로 검사한다.

## prek — 빠른 pre-commit 호환 도구

`prek`는 `pre-commit` 설정 형식을 사용하면서 더 빠른 실행을 목표로 하는 도구다. 사용 감각은 거의 비슷하다.

```sh
prek run
prek run --all-files
prek run --config ~/.config/prek/global.yaml
```

프로젝트별 설정은 `.pre-commit-config.yaml`에 두고, 개인 전역 설정은 별도 파일로 둘 수 있다.

```text
~/.config/prek/global.yaml
  → 개인 전역 hook 설정

./.pre-commit-config.yaml
  → 프로젝트별 hook 설정
```

예를 들어 Git의 전역 hook에서 다음처럼 실행하면 모든 저장소에서 공통 검사를 걸 수 있다.

```sh
#!/usr/bin/env bash
set -euo pipefail

command -v prek >/dev/null 2>&1 || exit 0

prek run --config "$HOME/.config/prek/global.yaml"

if [[ -f .pre-commit-config.yaml ]]; then
  prek run
fi
```

이 구조는 다음 순서로 동작한다.

```text
모든 repo에서 git commit
  ↓
개인 전역 prek 설정 실행
  ↓
현재 repo에 .pre-commit-config.yaml이 있으면 프로젝트별 hook도 실행
```

전역 hook을 쓰면 모든 저장소에 최소한의 안전장치를 걸 수 있다. 다만 너무 많은 검사를 전역으로 넣으면 관계없는 프로젝트에서도 계속 `no files to check`가 뜨거나 커밋이 느려질 수 있다.

## 전역 훅과 프로젝트 훅은 역할을 나누는 게 좋다

커밋 훅을 오래 쓰려면 범위를 나누는 것이 중요하다.

```text
전역 hook
  → 모든 repo에 적용해도 부담 없는 검사
  → merge conflict marker, 큰 파일, 기본 공백 검사 등

프로젝트 hook
  → 해당 프로젝트의 언어와 빌드 도구에 묶인 검사
  → ESLint, Prettier, ShellCheck, Stylua, gofmt, cargo fmt 등
```

예를 들어 개인 전역 설정에는 가벼운 범용 검사만 둔다.

```yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v5.0.0
    hooks:
      - id: check-merge-conflict
      - id: check-added-large-files
```

그리고 프로젝트별로 필요한 검사를 추가한다.

```yaml
repos:
  - repo: local
    hooks:
      - id: eslint
        name: ESLint
        language: system
        entry: npm run lint --
        types_or: [javascript, ts, tsx]
```

이렇게 나누면 전역 hook은 안전망 역할만 하고, 실제 품질 기준은 각 프로젝트가 스스로 정의한다.

## 커밋 훅에 넣을 때 조심할 점

첫째, 너무 느리면 안 된다. 커밋은 자주 하는 작업이므로 몇 초 안에 끝나는 검사가 좋다.

둘째, 자동 수정 hook은 팀 합의가 필요하다. `prettier --write`, `end-of-file-fixer`, `trailing-whitespace`처럼 파일을 수정하는 hook은 편하지만, 커밋 중 staged 파일을 바꿀 수 있다. 수정 후 다시 `git add`가 필요할 수 있다는 점을 팀원이 알고 있어야 한다.

셋째, 커밋 훅은 CI를 대체하지 않는다. 로컬 hook은 우회할 수 있다.

```sh
git commit --no-verify
```

따라서 중요한 검사는 CI에도 있어야 한다. 커밋 훅은 실수를 빨리 잡는 장치이고, CI는 최종 검증선이다.

## 정리

커밋 훅은 대단한 시스템이라기보다, Git이 제공하는 자동 실행 지점을 개발 습관에 맞게 활용하는 장치다.

- JS 프로젝트라면 Husky + lint-staged가 자연스럽다.
- 여러 언어를 다루거나 공통 품질 검사를 두고 싶다면 pre-commit / prek가 편하다.
- 전역 hook에는 가벼운 범용 검사만 두고, 언어별 검사는 프로젝트별 설정으로 두는 편이 유지보수하기 좋다.

잘 만든 커밋 훅은 개발자를 귀찮게 하는 문지기가 아니라, 커밋 직전에 실수를 조용히 걸러주는 얇은 안전망에 가깝다.
