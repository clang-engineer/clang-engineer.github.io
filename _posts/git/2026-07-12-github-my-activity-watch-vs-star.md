---
title       : "GitHub에서 내가 관여한 Issue·PR 찾기 — involves, commenter, review 검색"
description : "GitHub에서 내가 작성·댓글·리뷰·멘션으로 관여한 Issue와 Pull Request를 검색 qualifier로 다시 찾는 방법을 목적별로 정리한다."
date        : 2026-07-12 18:20:00 +0900
updated     : 2026-09-05 19:55:00 +0900
categories  : [git, "GitHub·플랫폼"]
tags        : [github, search, issue, pull-request, review, how-to]
pin         : false
hidden      : false
---

GitHub에서 "내가 관여했던 Issue나 PR을 다시 찾고 싶다"는 목적과 "Repository 알림을 줄이고 싶다"는 목적은 서로 다른 문제다.

이 글은 전자만 다룬다.

```text
내 활동 다시 찾기
→ Issue / PR Search Qualifier

Repository 알림 관리
→ Watch / Subscription 설정
```

알림과 Star/Watch 차이는 [GitHub Star vs Watch — 북마크와 알림 구독의 차이](/posts/git/2026-07-12-github-watch-vs-star-notifications/)에서 별도로 정리한다.

## 1. 가장 넓게 찾기 — `involves:`

내가 어떤 방식으로든 관여한 Issue·PR을 넓게 찾으려면 `involves:`부터 시작한다.

```text
involves:<username>
```

예:

```text
involves:octocat sort:updated-desc
```

`involves:`는 작성, 할당, 멘션, 댓글 등 여러 참여 관계를 넓게 포함한다.

따라서 "분명 예전에 내가 뭔가 했는데 정확히 무엇이었는지 기억나지 않는다"는 상황에 가장 좋은 출발점이다.

## 2. 내가 작성한 Issue·PR — `author:`

내가 직접 만든 항목만 보고 싶다면:

```text
author:<username>
```

PR로 한정:

```text
is:pr author:<username>
```

열린 PR만:

```text
is:open is:pr author:<username>
```

Issue라면:

```text
is:issue author:<username>
```

처럼 대상 유형을 명시할 수 있다.

## 3. 내가 댓글을 남긴 항목 — `commenter:`

내가 작성자는 아니지만 댓글을 남긴 Issue·PR을 찾으려면:

```text
commenter:<username>
```

을 사용한다.

이 qualifier는 "내가 참여한 모든 것"보다 범위를 좁혀 **실제로 댓글로 대화에 참여한 항목**을 찾을 때 유용하다.

## 4. Review 요청받은 PR — `review-requested:`

특정 사용자가 reviewer로 요청된 PR을 찾으려면:

```text
is:pr review-requested:<username>
```

내 계정 기준으로 직접 리뷰 요청된 열린 PR을 찾는 UI/검색에서는 `user-review-requested:@me` 같은 qualifier도 사용할 수 있다.

```text
is:open is:pr user-review-requested:@me
```

팀 단위 요청은 별도 `team-review-requested:` qualifier가 있다.

## 5. 내가 Review한 PR — `reviewed-by:`

내가 이미 review한 PR을 찾고 싶다면:

```text
is:pr reviewed-by:<username>
```

을 사용한다.

즉 review 관련 상태도 둘로 나뉜다.

```text
review-requested
→ 나에게 Review 요청이 들어온 것

reviewed-by
→ 내가 이미 Review한 것
```

## 6. 목적별로 Query를 조합한다

### 최근 내가 관여한 항목

```text
involves:<username> sort:updated-desc
```

### 내가 연 Open PR

```text
is:open is:pr author:<username> sort:updated-desc
```

### 댓글을 남긴 Open Issue

```text
is:open is:issue commenter:<username> sort:updated-desc
```

### 아직 Review해야 할 PR

```text
is:open is:pr review-requested:<username>
```

검색 qualifier는 여러 조건을 조합해 **내가 지금 다시 찾으려는 활동의 역할**을 좁히는 방식으로 쓰면 된다.

## 7. UI와 Search의 역할을 구분한다

GitHub의 Issues / Pull requests 화면에는 내가 만든 것, 할당된 것, review 요청된 것 등을 보는 기본 filter가 있다.

하지만 "내가 댓글을 남긴 모든 항목"이나 여러 참여 관계를 한 번에 찾는 작업은 Search qualifier가 더 직접적이다.

```text
UI
→ 자주 쓰는 대표 상태를 빠르게 탐색

Search
→ 참여 관계와 상태를 원하는 조건으로 조합
```

따라서 UI에서 찾기 어렵다고 해서 Activity가 사라진 것이 아니라, 검색축이 UI 기본 filter와 다를 수 있다.

## 8. CLI에서도 같은 Search 개념을 사용할 수 있다

GitHub CLI에서는 `gh issue list`나 `gh pr list`에 search query를 넘길 수 있다.

```bash
gh pr list --search 'review-requested:@me is:open'
```

또는:

```bash
gh issue list --search 'involves:@me sort:updated-desc'
```

사용 가능한 qualifier와 실제 지원 범위는 GitHub Issue/PR Search 문서를 기준으로 확인한다.

## 정리

```text
내가 넓게 관여한 것
→ involves:

내가 만든 것
→ author:

내가 댓글 단 것
→ commenter:

Review 요청받은 것
→ review-requested:

내가 Review한 것
→ reviewed-by:
```

핵심은 GitHub Activity를 한 화면에서 찾으려 하기보다 **작성자·댓글·리뷰 같은 관계 축을 qualifier로 표현하는 것**이다.

## 참고

- [GitHub Docs — Filtering and searching issues and pull requests](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/filtering-and-searching-issues-and-pull-requests)
