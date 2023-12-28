---
layout  : wiki
title   : Git Commit Message Convention
summary : 
date    : 2023-12-28 09:22:34 +0900
updated : 2023-12-28 09:22:45 +0900
tags    : 
toc     : true
public  : true
parent  : [[git/index]]
latex   : false
---
* TOC
{:toc}

# Commit Message Format

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

# Type (타입, 필수)

## 타입 종류
- feat: 새로운 기능 추가
- fix: 버그 수정
- docs: 문서 수정
- style: 코드 포맷팅, 세미콜론 누락, 코드 변경이 없는 경우
- refactor: 코드 리펙토링
- test: 테스트 코드, 리펙토링 테스트 코드 추가
- chore: 빌드 업무 수정, 패키지 매니저 수정

## 추가적인 타입
- design: UI/UX 디자인 변경
- rename: 파일 혹은 폴더명을 수정하거나 옮기는 작업만인 경우
- remove: 파일을 삭제하는 작업만 수행한 경우
- revert: 이전 커밋을 되돌릴 경우
- merge: 브랜치를 병합하는 작업을 수행한 경우
- etc: 기타 변경사항


# Scope (적용범위, 선택사항)

- 추가적인 문맥을 제공하기 위해 사용
- 이슈의 범위, 영향을 받는 부분, 적용 대상 등을 작성
- ex) UI, API, DB, ...
- ex) login, logout, ...
- ex) #1, #2, ...


# Subject (제목, 필수)

- 50자를 넘기지 않게 작성한다.
- 마침표 및 기타 특수문자를 사용하지 않는다.
- 과거시제를 사용하지 않는다.
- 대문자를 사용하지 않는다.
- 명령문으로 작성한다.

# Body (본문, 선택사항)

- 72자를 넘기지 않는다.
- 어떻게 보다는 무엇을, 왜에 맞춰 작성한다.
- 과거시제를 사용하지 않는다.
- 명령어로 작성한다.
- 어떻게 보다는 무엇을, 왜에 맞춰 작성한다.

# Footer (꼬리말, 선택사항)

- BREAKING CHANGE: 커다란 API 변경
- Closes: 이슈를 닫을 때 사용
- Implements: 이슈를 구현할 때 사용
- Author: 커밋 작성자
- Co-authored-by: 공동 작업자
- Signed-off-by: 커밋 작성자 
- Acked-by: 리뷰어 (승인자)
- Reviewed-by: 리뷰어
- Tested-by: 테스트를 수행한 사람
- Refs: 참고할 이슈가 있을 때 사용

# 예제
## 설명과 BREAKING CHANGE 꼬리말을 가지는 커밋 메세지
```
feat: allow provided config object to extend other configs

BREAKING CHANGE: `extends` key in config file is now used for extending other config files
```

## 단절적 변경(breaking change)에 주의를 주기 위해 !를 포함한 커밋 메세지
```
feat!: send an email to the customer when a product is shipped
```

## 단절적 변경(breaking change)에 주의를 주기위해 적용 범위와 ! 를 포함한 커밋 메세지
```
feat(api)!: send an email to the customer when a product is shipped
```

## BREAKING CHANGE 꼬리말과 !를 함께 포함한 커밋 메세지
```
chore!: drop support for Node 6

BREAKING CHANGE: use JavaScript features not available in Node 6.
```

## 본문이 없는 커밋 메세지
```
docs: correct spelling of CHANGELOG
```

## 적용 범위를 가지는 커밋 메세지
```
feat(lang): add polish language
```

## 다중-단락 본문과 다수의 꼬리말을 가진 커밋 메세지
```
fix: prevent racing of requests

Introduce a request id and a reference to latest request. Dismiss
incoming responses other than from latest request.

Remove timeouts which were used to mitigate the racing issue but are
obsolete now.

Reviewed-by: Z
Refs: #123
```


# 참고
- [https://www.conventionalcommits.org/](https://www.conventionalcommits.org/)
- [https://udacity.github.io/git-styleguide/]](https://udacity.github.io/git-styleguide/)
- [https://www.lesstif.com/gitbook/github-push-pr-pull-request-issue-129008869.html](https://www.lesstif.com/gitbook/github-push-pr-pull-request-issue-129008869.html)