---
title       : "GitHub에서 내 활동 몰아보기 + Watch vs Star 알림 정리"
description : "내가 단 댓글·연 PR·리뷰 요청받은 것을 한 번에 보는 검색 필터(involves:/author:/review-requested:)와 UI 탭 위치, 그리고 쓸데없는 릴리스 알림의 정체(Star가 아니라 Watch)를 정리한다."
date        : 2026-07-12 18:20:00 +0900
updated     : 2026-07-12 18:20:00 +0900
categories  : [git, "GitHub·플랫폼"]
tags        : [github, search, notifications, watch, star]
pin         : false
hidden      : false
---

내가 참여한 이슈·PR을 몰아보고 싶은데 GitHub UI만으론 잘 안 잡힌다. 검색 필터와 UI 탭을 나눠 정리하고, 겸사겸사 "Star 해둔 레포에서 알림이 계속 온다"는 흔한 오해도 짚는다.

## 검색 필터로 몰아보기

검색창에 아래 쿼리를 넣으면 된다.

**내가 관여한 것**

- `involves:내아이디` — 작성·할당·멘션·댓글 등 내가 **관여한 모든 것** (가장 광범위)
- `commenter:내아이디` — 내가 **댓글 단** 모든 이슈/PR

**내가 연 PR**

- `author:내아이디 type:pr` — 내가 만든 PR
- `is:open author:내아이디 type:pr` — 그중 열려 있는 것

**리뷰 관련**

- `review-requested:내아이디 type:pr` — 내가 리뷰 요청받은 PR
- `reviewed-by:내아이디 type:pr` — 내가 리뷰한 PR

댓글까지 한 번에 훑기엔 `involves:내아이디 sort:updated-desc`가 제일 편하다.

## UI로 보기

로그인 상태에서 우측 상단 메뉴에 이미 탭이 있다.

- **Issues** 메뉴 → Created / Assigned / Mentioned 탭
- **Pull requests** 메뉴(`/pulls`) → Created / Assigned / Review requests / Mentioned 탭

PR·이슈 몰아보기는 이 두 메뉴가 제일 낫다. 다만 **"내가 댓글 단 것 전부"를 보여주는 전용 UI는 없다** — Mentioned 탭이 가깝지만 정확히 일치하진 않으니, 그건 검색 `commenter:`가 사실상 유일하다.

> 프로필(`github.com/내아이디`) 아래 contribution activity를 펼치면 월별로 "Opened N PRs / Created N commits" 식으로 접혀 나온다. 몰아보기용은 아니고 회고용에 가깝다.
{: .prompt-tip }

## 쓸데없는 알림의 정체 — Star가 아니라 Watch

"Star 해둔 레포에서 릴리스 알림이 계속 뜬다"는 흔한 착각이다. **Star는 알림을 만들지 않는다.** 즐겨찾기(북마크)일 뿐이다. 알림을 만드는 건 **Watch**다.

| | Star | Watch |
|---|---|---|
| 역할 | 북마크·좋아요 표시 | 활동 구독 |
| 알림 | ❌ 없음 | ✅ 이슈/PR/릴리스 등 |
| 목록 | `/내아이디?tab=stars` | `/watching` |

대개 **예전에 fork하거나 기여할 때 자동으로 Watch가 걸린** 경우다. 정리는 이렇게.

- **개별 레포**: 상단 **Watch 버튼(눈 모양)** → `Participating and @mentions` 또는 `Ignore`. Custom으로 Releases만 빼는 것도 가능.
- **한꺼번에**: [github.com/watching](https://github.com/watching)에서 Watch 중인 레포 전체를 훑고 불필요한 걸 Unwatch.
- **알림 종류 자체**: [github.com/settings/notifications](https://github.com/settings/notifications)에서 이메일/웹 토글 조정.

가장 깔끔한 건 `/watching`을 한 번 훑어 청소하는 것이다. Star 목록을 아무리 정리해도 알림은 안 줄어든다 — 애초에 Star는 알림과 무관하니까.
