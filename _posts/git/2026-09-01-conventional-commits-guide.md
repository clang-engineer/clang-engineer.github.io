---
title       : "Conventional Commits 컨벤션 가이드 — 타입, 스코프, Breaking Change"
description : "커밋 메시지를 type(scope): subject 형식으로 통일하면 CHANGELOG 자동 생성, 릴리스 버전 관리, 코드 리뷰 품질이 좋아진다. 형식과 규칙을 정리하고, 실전 예시와 .gitmessage 템플릿을 포함한다."
date        : 2026-09-01 12:00:00 +0900
updated     : 2026-09-01 12:00:00 +0900
categories  : [git, "커밋·히스토리"]
tags        : [git, commit, conventional-commits, changelog]
pin         : false
hidden      : false
---

커밋 메시지가 "fix bug"나 "update"로만 되어 있으면 6개월 뒤에 무슨 작업을 했는지 알 수 없다. Conventional Commits는 커밋 메시지에 구조화된 형식을 적용해 자동 CHANGELOG 생성, 릴리스 버전 결정, 코드 리뷰 품질을 높이는 컨벤션이다.

## 기본 형식

```
<type>(<scope>): <subject>

<body>

<footer>
```

- **type**: 커밋의 성격 (필수)
- **scope**: 변경 범위 (선택)
- **subject**: 50자 이내 요약 (필수)
- **body**: 무엇/왜 중심 설명 (선택)
- **footer**: Breaking change, 이슈 참조 (선택)

## Type 목록

| type | 의미 | 예시 |
|------|------|------|
| `feat` | 새로운 기능 | `feat: add user login` |
| `fix` | 버그 수정 | `fix: prevent race condition` |
| `docs` | 문서 변경 | `docs: update README` |
| `style` | 포맷 변경 (동작 변경 없음) | `style: format with prettier` |
| `refactor` | 리팩토링 | `refactor: extract auth module` |
| `test` | 테스트 코드 | `test: add unit tests for user service` |
| `chore` | 빌드·패키지 매니저 | `chore: update dependencies` |
| `revert` | 이전 커밋 되돌리기 | `revert: undo feat: add user login` |

## Subject 규칙

- **50자 이내** (GitHub PR에서 자동 잘림)
- **마침표 붙이지 않음**
- **명령문 (현재 시제)**: "add" rather than "added" or "adds"
- **소문자 시작**

## Breaking Change 표기

호환성을 깨는 변경은 `!`를 붙이거나 footer에 명시한다.

```
feat!: send email to customer

BREAKING CHANGE: email API v1 removed
```

또는 scope와 함께:

```
feat(api)!: drop legacy endpoint
```

## Footer — 이슈 참조

```
Closes #123
Refs #456
Co-authored-by: name <email>
Signed-off-by: name <email>
```

## 실전 예시

### 좋은 예

```
fix(auth): prevent token refresh race condition

Multiple concurrent requests were triggering duplicate token
refresh calls. Added mutex lock to serialize refresh attempts.

Closes #234
```

### 나쁜 예

```
update stuff
fix bug
로그인 고침
```

## .gitmessage 템플릿

반복적으로 같은 형식을 쓰려면 템플릿을 설정한다.

```sh
git config --global commit.template ~/.gitmessage
```

```text
# <type>: subject (50자 이내, 명령문, 마침표 X)

# Body — 무엇/왜 (72자 폭)

# Footer: Closes #N, BREAKING CHANGE: ...
```

이제 `git commit`만 치면 템플릿이 에디터에 뜬다.

## 컨벤션을 적용하면 좋은 이유

1. **자동 CHANGELOG 생성**: `conventional-changelog` 같은 도구가 type별로 분류
2. **릴리스 버전 자동 결정**: `feat`는 minor, `fix`는 patch, Breaking change는 major
3. **코드 리뷰 효율**: 커밋만 보고 어떤 성격의 변경인지 바로 파악
4. **이슈 추적 용이**: footer의 `Closes #N`으로 이슈-커밋 연결

## 참고

- [Conventional Commits 공식](https://www.conventionalcommits.org/)
- [cheatsheet — git](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/git.md) — Git 명령어 빠른 참조
