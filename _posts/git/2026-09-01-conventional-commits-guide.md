---
title       : "Conventional Commits — 공식 규격과 팀 스타일 규칙을 분리해서 보기"
description : "Conventional Commits 1.0.0의 필수 구조와 feat·fix·Breaking Change의 SemVer 의미를 먼저 정리하고, 50자 제한·명령문·소문자 같은 팀별 커밋 스타일 규칙과 구분한다."
date        : 2026-09-01 12:00:00 +0900
updated     : 2026-09-05 19:40:00 +0900
categories  : [git, "커밋·히스토리"]
tags        : [git, commit, conventional-commits, changelog, comparison]
pin         : false
hidden      : false
---

Conventional Commits는 커밋 메시지에 **기계가 해석할 수 있는 최소 구조**를 부여하는 규격이다. 사람이 읽기 좋은 문장 스타일 전체를 정하는 규칙은 아니다.

먼저 두 층을 분리해야 한다.

```text
Conventional Commits 공식 규격
→ type / optional scope / description / body / footer
→ feat / fix / BREAKING CHANGE의 의미

팀별 Commit Message Style
→ 50자 제한
→ 명령문 사용
→ 소문자 시작
→ 마침표 사용 여부
→ 허용 type 목록
```

둘을 섞으면 팀에서 정한 취향을 마치 Conventional Commits의 필수 규칙처럼 오해하기 쉽다.

## 1. 공식 규격의 기본 구조

Conventional Commits 1.0.0의 기본 형태는 다음과 같다.

```text
<type>[optional scope][optional !]: <description>

[optional body]

[optional footer(s)]
```

역할을 나누면:

```text
type
→ 변경의 종류

scope
→ 선택적인 변경 범위

description
→ 변경의 짧은 설명

body
→ 추가 맥락

footer
→ Breaking Change, issue reference 등 metadata
```

## 2. 반드시 의미가 정해진 Type은 feat와 fix다

Conventional Commits는 `feat`와 `fix`에 SemVer와 연결되는 의미를 부여한다.

| Type | 의미 | SemVer 영향 |
|---|---|---|
| `feat` | 새로운 기능 | MINOR 후보 |
| `fix` | 버그 수정 | PATCH 후보 |

그 밖의 type도 사용할 수 있다.

```text
docs
style
refactor
perf
test
build
ci
chore
...
```

하지만 이런 목록 전체가 Conventional Commits 규격에서 의무화된 것은 아니다. 프로젝트나 commitlint preset 등에서 별도 convention으로 정할 수 있다.

즉:

```text
feat / fix
→ 규격에서 특별한 의미가 있음

그 밖의 Type
→ 프로젝트가 정의 가능
```

으로 기억하면 된다.

## 3. Scope는 선택적인 좌표다

Scope는 type 뒤 괄호 안에 변경 영역을 붙이는 선택 요소다.

```text
feat(parser): add array syntax
fix(auth): handle expired token
```

Scope의 핵심은 파일 경로를 반드시 적는 것이 아니라 **변경이 어느 영역에 속하는지 추가 맥락을 제공하는 것**이다.

프로젝트 규모가 작거나 type만으로 충분하다면 생략할 수 있다.

## 4. Breaking Change는 별도의 중요 축이다

호환성을 깨는 변경은 type과 별개로 표현한다.

두 대표 형식이 있다.

### `!` 사용

```text
feat(api)!: remove legacy endpoint
```

### Footer 사용

```text
feat(api): change authentication flow

BREAKING CHANGE: legacy token format is no longer accepted
```

Breaking Change는 `feat`나 `fix`에만 붙는 개념이 아니다. 어떤 type이든 호환성을 깨면 Breaking Change가 될 수 있다.

```text
Commit Type
      +
Breaking 여부
```

는 서로 다른 축이다.

## 5. 공식 규격과 팀 스타일을 구분한다

다음 규칙은 많이 사용하는 좋은 스타일일 수 있지만 **Conventional Commits 자체의 필수 규격은 아니다.**

```text
Description 50자 이내
명령문 사용
소문자로 시작
마침표를 붙이지 않음
Body 72자 줄바꿈
```

이런 규칙을 사용하고 싶다면 프로젝트의 commit convention으로 별도로 명시하는 편이 정확하다.

예를 들어 이 저장소에서 다음 스타일을 선택할 수는 있다.

```text
프로젝트 스타일
├─ description은 짧게
├─ 명령형 동사 선호
├─ 마침표 생략
└─ 자주 쓰는 type 목록 제한
```

하지만 이것을 "Conventional Commits 공식 규칙"이라고 부르지는 않는다.

## 6. 좋은 Commit은 구조뿐 아니라 의미가 분명해야 한다

규격만 맞춘다고 좋은 메시지가 되는 것은 아니다.

```text
fix: update stuff
```

는 형식상 type과 description이 있지만 무엇을 고쳤는지 거의 알려주지 않는다.

반대로:

```text
fix(auth): prevent duplicate token refresh
```

처럼 **변경 의도와 범위가 바로 읽히는 것**이 중요하다.

필요한 배경은 body에서 설명할 수 있다.

```text
fix(auth): prevent duplicate token refresh

Concurrent requests could trigger multiple refresh calls.
Serialize refresh attempts through the existing lock.
```

## 7. Footer는 Metadata를 담는다

Footer에는 Breaking Change나 issue reference 같은 metadata를 둘 수 있다.

```text
Closes #123
Refs #456
Co-authored-by: Name <email@example.com>
```

Git trailer 형태와 잘 맞기 때문에 자동화 도구가 metadata를 해석하기 쉽다.

## 8. 자동화와 연결되는 이유

Conventional Commits의 가치는 예쁜 메시지보다 **변경 의미를 기계가 안정적으로 분류할 수 있다는 것**에 있다.

```text
Commit Messages
     ↓ Parser
feat / fix / breaking 구분
     ↓
Release / CHANGELOG Automation
```

대표적으로:

```text
fix
→ PATCH 후보

feat
→ MINOR 후보

BREAKING CHANGE
→ MAJOR 후보
```

로 SemVer 기반 release automation과 연결할 수 있다.

실제 버전 상승 여부는 사용하는 release tool과 프로젝트 정책에 따라 최종 결정된다.

## 9. `.gitmessage`는 팀 스타일을 보조하는 도구다

반복적으로 같은 형식을 사용한다면 Git commit template을 둘 수 있다.

```bash
git config --global commit.template ~/.gitmessage
```

예:

```text
# <type>(optional-scope): <description>

# Body: 변경 이유와 필요한 맥락

# Footer: Closes #N / BREAKING CHANGE: ...
```

이 템플릿은 Conventional Commits 규격을 기억하게 해주는 보조 장치이고, 별도의 팀 문체 규칙도 함께 넣을 수 있다.

## 정리

```text
Conventional Commits
= 기계가 해석할 수 있는 Commit 의미 구조

팀 Commit Style
= 사람이 읽기 좋은 표현 방식과 프로젝트 관례
```

공식 규격에서 중요한 것은 `type`, 선택적 `scope`, `description`, `body/footer`, 그리고 `feat`·`fix`·Breaking Change의 의미다. **50자·명령문·소문자 같은 표현 규칙은 별도 팀 스타일 축으로 관리하는 것이 정확하다.**

## 참고

- [Conventional Commits 1.0.0](https://www.conventionalcommits.org/ko/v1.0.0/)
- [cheatsheet — git](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/git.md) — Git 명령어 빠른 참조
