---
title       : "Git과 GitHub가 알아보는 특별한 파일들"
description : "저장소 안의 특별한 파일을 Git, GitHub, 개발 도구가 각각 어떻게 인식하는지 정리한다."
date        : 2026-10-01 13:00:00 +0900
updated     : 2026-10-01 13:00:00 +0900
categories  : [git]
tags        : [git, github, github-actions, repository, automation]
pin         : false
hidden      : false
---

Git 저장소에는 이름만으로 특별하게 동작하는 파일들이 있다.

예를 들어 `.git/hooks/pre-commit`은 커밋 직전에 실행되고, `.github/workflows/ci.yml`은 GitHub Actions workflow로 인식된다. `.gitignore`는 Git이 추적하지 않을 파일을 결정하고, `.github/ISSUE_TEMPLATE/`은 GitHub 이슈 작성 화면을 바꾼다.

겉으로는 모두 "저장소 안의 설정 파일"처럼 보이지만, 실제로는 **누가 읽는 파일인가**가 다르다.

```text
Git이 읽는 파일
  → 로컬 Git 명령의 동작을 바꿈

GitHub가 읽는 파일
  → GitHub 웹/서버 기능의 동작을 바꿈

개발 도구가 읽는 파일
  → 각 도구의 lint, format, build, release 동작을 바꿈
```

이 구분을 알고 있으면 저장소 루트에 흩어진 설정 파일들이 훨씬 덜 낯설다.

## 1. Git이 직접 인식하는 파일

Git이 직접 인식하는 파일은 로컬 Git 명령의 동작에 영향을 준다.

### `.git/hooks/*`

Git hook은 Git 이벤트가 일어날 때 실행되는 스크립트다.

```text
.git/hooks/pre-commit   → commit 생성 직전
.git/hooks/commit-msg   → commit 메시지 검사
.git/hooks/pre-push     → push 직전
.git/hooks/post-merge   → merge 완료 후
```

예를 들어 `.git/hooks/pre-commit` 파일이 실행 가능하면 `git commit` 직전에 Git이 그 파일을 실행한다.

```sh
chmod +x .git/hooks/pre-commit
```

다만 `.git/hooks/`는 보통 저장소에 커밋되지 않는다. 팀에서 공유하려면 Husky, pre-commit, prek 같은 도구가 별도 설정 파일을 관리하고, 로컬 hook에는 wrapper를 설치하는 방식을 쓴다.

자세한 내용은 [Git 커밋 훅은 어디에 쓰는가](../reference/tools/2026-10-01-git-commit-hooks.md)에서 다룬다.

### `.gitignore`

`.gitignore`는 아직 Git이 추적하지 않는 파일 중에서 무시할 대상을 정한다.

```gitignore
node_modules/
.env
.DS_Store
dist/
```

중요한 점은 `.gitignore`가 **이미 추적 중인 파일을 자동으로 추적 해제하지는 않는다**는 것이다. 이미 커밋된 파일을 빼려면 `git rm --cached`가 필요하다.

```sh
git rm --cached .env
```

`.gitignore`는 보통 빌드 산출물, 로컬 설정, 시크릿, OS 임시 파일을 제외하는 데 쓴다.

### `.gitattributes`

`.gitattributes`는 파일 경로 패턴별로 Git의 처리 방식을 지정한다.

대표 용도는 줄바꿈, diff 방식, merge 전략, Git LFS 연결이다.

```gitattributes
*.sh text eol=lf
*.png binary
*.psd filter=lfs diff=lfs merge=lfs -text
```

`.gitignore`가 "추적할지 말지"에 가깝다면, `.gitattributes`는 "추적하는 파일을 어떻게 다룰지"에 가깝다.

### `.gitmodules`

`.gitmodules`는 Git submodule 정보를 담는다.

```ini
[submodule "vendor/example"]
  path = vendor/example
  url = https://github.com/example/example.git
```

저장소 안에 다른 Git 저장소를 하위 디렉터리로 포함할 때 사용한다. submodule은 clone, update, CI 환경에서 별도 초기화가 필요할 수 있으므로 단순한 디렉터리 복사처럼 생각하면 안 된다.

## 2. GitHub가 인식하는 파일

GitHub 전용 파일은 대개 `.github/` 아래에 둔다. 이 파일들은 로컬 Git이 특별하게 처리하지 않는다. GitHub 웹 서비스와 GitHub 서버가 읽는다.

```text
.github/
├─ workflows/
├─ ISSUE_TEMPLATE/
├─ pull_request_template.md
├─ CODEOWNERS
├─ dependabot.yml
├─ FUNDING.yml
└─ SECURITY.md
```

### `.github/workflows/*.yml`

GitHub Actions workflow 파일이다.

```yaml
name: CI

on:
  push:
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test
```

로컬 Git hook이 내 컴퓨터에서 실행된다면, GitHub Actions는 GitHub 서버에서 실행된다.

```text
git commit
  → local hook 실행 가능

git push / pull request
  → GitHub Actions 실행 가능
```

그래서 중요한 검사는 로컬 hook에만 두지 말고 CI에도 두는 편이 안전하다. 로컬 hook은 `--no-verify`로 우회할 수 있지만, GitHub branch protection과 CI는 팀 단위의 최종 방어선이 될 수 있다.

### `.github/ISSUE_TEMPLATE/*`

이슈 템플릿은 GitHub에서 새 이슈를 만들 때 선택지를 제공한다.

```text
.github/ISSUE_TEMPLATE/bug_report.md
.github/ISSUE_TEMPLATE/feature_request.md
.github/ISSUE_TEMPLATE/config.yml
```

예를 들어 버그 리포트 템플릿에는 재현 방법, 기대 동작, 실제 동작, 환경 정보를 미리 적어둘 수 있다.

```md
## 재현 방법

## 기대 동작

## 실제 동작

## 환경
```

이 파일은 Git이 아니라 GitHub의 이슈 작성 화면이 읽는다.

### `.github/pull_request_template.md`

PR 템플릿은 Pull Request 본문 기본값을 정한다.

```md
## 변경 내용

## 확인한 것

- [ ] 테스트 통과
- [ ] 문서 업데이트
```

팀에서 리뷰 전에 확인해야 할 항목을 반복해서 놓친다면 PR 템플릿이 효과적이다.

### `.github/CODEOWNERS`

`CODEOWNERS`는 경로별 기본 리뷰어를 지정한다.

```text
*.md @docs-team
/src/auth/ @security-team
```

GitHub는 PR에서 변경된 파일 경로를 보고 해당 owner를 리뷰어로 제안하거나, branch protection 설정과 함께 필수 리뷰어로 요구할 수 있다.

### `.github/dependabot.yml`

Dependabot 설정 파일이다. 의존성 업데이트 PR을 자동으로 열게 할 수 있다.

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
```

npm, GitHub Actions, Docker, Maven, Gradle 등 여러 생태계의 의존성 업데이트를 감시할 수 있다.

### `.github/FUNDING.yml`

GitHub 저장소에 Sponsor 버튼을 표시하기 위한 설정이다.

```yaml
github: [username]
open_collective: project-name
```

오픈소스 프로젝트에서 후원 경로를 노출할 때 사용한다.

### `.github/SECURITY.md`

보안 취약점 제보 정책을 안내하는 문서다.

```md
## Reporting a Vulnerability

Please report security issues to security@example.com.
```

GitHub는 이 파일을 Security 탭이나 취약점 제보 흐름에서 활용한다. 공개 이슈로 취약점을 올리지 말고 별도 채널로 제보하라는 안내를 둘 수 있다.

## 3. 개발 도구가 인식하는 파일

Git이나 GitHub가 직접 읽지는 않지만, 개발 도구가 관례적으로 읽는 파일도 많다.

```text
.pre-commit-config.yaml  → pre-commit / prek
package.json             → npm / pnpm / yarn
pyproject.toml           → Python build / formatter / linter
Cargo.toml               → Rust Cargo
go.mod                   → Go module
renovate.json            → Renovate
.editorconfig            → editor formatting convention
```

예를 들어 `.pre-commit-config.yaml`은 Git 자체가 읽는 파일이 아니다. `pre-commit`이나 `prek`가 읽는 설정 파일이다.

```yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v5.0.0
    hooks:
      - id: check-merge-conflict
```

`package.json`도 마찬가지다. Git이 `scripts.prepare`를 직접 실행하지 않는다. npm이 install 과정에서 `prepare`를 실행하고, 그 안에서 Husky가 Git hook wrapper를 설치한다.

```json
{
  "scripts": {
    "prepare": "husky install"
  }
}
```

즉 같은 저장소 파일이라도 실행 주체는 다를 수 있다.

```text
.git/hooks/pre-commit
  → Git이 실행

.github/workflows/ci.yml
  → GitHub Actions가 실행

.pre-commit-config.yaml
  → pre-commit / prek가 읽음

package.json
  → npm / pnpm / yarn이 읽음
```

## 4. 로컬 전용 파일과 커밋되는 파일을 구분한다

특별 파일을 볼 때는 이 파일이 저장소에 커밋되는지부터 확인하는 것이 좋다.

```text
보통 커밋하지 않음
├─ .git/hooks/*
├─ .git/config
└─ 개인 로컬 환경 파일

보통 커밋함
├─ .gitignore
├─ .gitattributes
├─ .gitmodules
├─ .github/workflows/*
├─ .github/ISSUE_TEMPLATE/*
├─ .github/pull_request_template.md
├─ .github/CODEOWNERS
└─ 도구 설정 파일
```

`.git/` 아래의 파일은 대부분 로컬 저장소 내부 상태다. 반면 `.github/`, `.gitignore`, `.gitattributes`, 도구 설정 파일은 보통 팀과 공유하기 위해 커밋한다.

이 차이 때문에 Husky 같은 도구가 필요해진다.

```text
문제:
  .git/hooks/pre-commit은 커밋되지 않는다.

해결:
  .husky/pre-commit은 커밋한다.
  npm install 시 Husky가 .git/hooks/pre-commit wrapper를 로컬에 만든다.
```

## 5. 전체 그림

저장소의 특별 파일은 다음처럼 보면 된다.

```text
로컬 Git
├─ .git/hooks/*
├─ .gitignore
├─ .gitattributes
└─ .gitmodules

GitHub
├─ .github/workflows/*
├─ .github/ISSUE_TEMPLATE/*
├─ .github/pull_request_template.md
├─ .github/CODEOWNERS
├─ .github/dependabot.yml
├─ .github/FUNDING.yml
└─ .github/SECURITY.md

도구 생태계
├─ .pre-commit-config.yaml
├─ package.json
├─ pyproject.toml
├─ Cargo.toml
├─ go.mod
├─ renovate.json
└─ .editorconfig
```

저장소 루트의 설정 파일을 볼 때 먼저 물어볼 질문은 하나다.

> 이 파일은 누가 읽는가?

Git이 읽는지, GitHub가 읽는지, 특정 개발 도구가 읽는지 구분하면 파일의 위치와 동작 시점이 자연스럽게 정리된다.
