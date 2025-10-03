---
title       : Git 커밋 메시지 컨벤션
description : >-
date        : 2021-12-08 09:00:45 +0900
updated     : 2025-10-03 12:28:22 +0900
categories  : [dev, git]
tags        : [git, commit, convention, message]
pin         : false
hidden      : false
---

# Git Commit Message Format

커밋 메시지를 일관성 있게 작성하기 위한 형식과 예시를 정리합니다.

```

<type>(<scope>): <subject>

<body>

<footer>
```

---

## 1. Type (타입, 필수)

### 기본 타입

* **feat**: 새로운 기능 추가
* **fix**: 버그 수정
* **docs**: 문서 수정
* **style**: 코드 포맷팅, 세미콜론 누락, 코드 변경 없는 경우
* **refactor**: 코드 리팩토링
* **test**: 테스트 코드 작성, 테스트 코드 리팩토링
* **chore**: 빌드 관련, 패키지 매니저 수정

### 추가적인 타입

* **design**: UI/UX 디자인 변경
* **rename**: 파일/폴더명 수정 혹은 이동
* **remove**: 파일 삭제
* **revert**: 이전 커밋 되돌리기
* **merge**: 브랜치 병합
* **etc**: 기타 변경사항

---

## 2. Scope (적용범위, 선택사항)

* 변경 사항의 적용 범위를 명시
* 이슈 번호, 기능, API 등 작성 가능
* 예시: `UI`, `API`, `DB`, `login`, `logout`, `#1`, `#2` 등

---

## 3. Subject (제목, 필수)

* 50자 이내
* 마침표 및 특수문자 사용 금지
* 과거 시제 금지
* 소문자 사용
* 명령문 형태로 작성

---

## 4. Body (본문, 선택사항)

* 72자 이내로 작성
* **무엇을/왜** 중심으로 작성 (어떻게보다는 무엇을)
* 과거 시제 금지
* 명령문 형태 사용

---

## 5. Footer (꼬리말, 선택사항)

* **BREAKING CHANGE**: 큰 API 변경
* **Closes**: 이슈 닫기
* **Implements**: 이슈 구현
* **Author**: 작성자
* **Co-authored-by**: 공동 작업자
* **Signed-off-by**: 작성자 서명
* **Acked-by**: 리뷰어 승인
* **Reviewed-by**: 리뷰어
* **Tested-by**: 테스트 수행자
* **Refs**: 참고 이슈

---

## 6. 커밋 메시지 예시

### 6.1 설명과 BREAKING CHANGE

```
feat: allow provided config object to extend other configs

BREAKING CHANGE: `extends` key in config file is now used for extending other config files
```

### 6.2 단절적 변경 주의(!)

```
feat!: send an email to the customer when a product is shipped
feat(api)!: send an email to the customer when a product is shipped
chore!: drop support for Node 6

BREAKING CHANGE: use JavaScript features not available in Node 6.
```

### 6.3 본문 없는 커밋

```
docs: correct spelling of CHANGELOG
```

### 6.4 적용 범위 포함

```
feat(lang): add polish language
```

### 6.5 다중 단락과 여러 꼬리말

```
fix: prevent racing of requests

Introduce a request id and a reference to latest request. Dismiss
incoming responses other than from latest request.

Remove timeouts which were used to mitigate the racing issue but are
obsolete now.

Reviewed-by: Z
Refs: #123
```

---

## 7. `.gitmessage` 템플릿

* 프로젝트 루트에 `.gitmessage` 파일 생성
* 템플릿 작성 후 git 설정:

```sh
git config commit.template .gitmessage   # 로컬
git config --global commit.template .gitmessage  # 전역
```

### gitmessage 예제

```
# Title: Summary, imperative, start upper case, don't end with a period
# No more than 50 chars

# Blank line between title and body

# Body: Explain *what* and *why* (not *how*), wrap at 72 chars

# Co-authored-by: name <user@users.noreply.github.com>
```

---

## 8. 참고 & 출처

* [Conventional Commits](https://www.conventionalcommits.org/)
* [Udacity Git Styleguide](https://udacity.github.io/git-styleguide/)
* [GitBook GitHub Push/PR/Issue](https://www.lesstif.com/gitbook/github-push-pr-pull-request-issue-129008869.html)
* [Git Commit Gist](https://gist.github.com/lisawolderiksen/a7b99d94c92c6671181611be1641c733)
* [Chris Beams Git Commit](https://cbea.ms/git-commit/)

```



