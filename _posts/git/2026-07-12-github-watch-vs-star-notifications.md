---
title       : "GitHub Star vs Watch — 북마크와 알림 구독의 차이"
description : "GitHub Star는 저장소를 다시 찾기 위한 북마크·관심 표시이고 Watch는 저장소 활동 알림을 구독하는 기능이라는 차이와 알림을 줄이는 방법을 정리한다."
date        : 2026-07-12 18:30:00 +0900
updated     : 2026-09-05 19:55:00 +0900
categories  : [git, "GitHub·플랫폼"]
tags        : [github, notifications, watch, star, comparison]
pin         : false
hidden      : false
---

GitHub에서 Star와 Watch는 같은 "관심 표시"처럼 보이지만 목적이 다르다.

```text
Star
→ 다시 찾기 위한 북마크·관심 표시

Watch
→ Repository Activity 알림 구독
```

따라서 "Star한 repository에서 알림이 너무 많이 온다"고 느낄 때 실제 원인은 Star가 아니라 **Watch 또는 개별 conversation subscription**일 가능성이 높다.

## 1. 비교축 — 저장인가, 구독인가

| 비교축 | Star | Watch |
|---|---|---|
| 핵심 목적 | Repository를 저장하고 관심 표시 | Repository Activity 구독 |
| Notification 영향 | Star 자체는 알림을 만들지 않음 | 선택한 Activity 알림을 받을 수 있음 |
| 대표 사용 | 나중에 다시 찾기, 관심 프로젝트 표시 | Issue·PR·Release 등 변화 추적 |
| 관리 위치 | Stars 목록 | Watched repositories / Notification 설정 |

둘의 차이는 기능 수가 아니라 **사용자와 repository 사이에 어떤 관계를 만드는가**다.

## 2. Star — 저장하고 다시 찾는 기능

Star는 repository를 관심 목록에 넣는 기능이다.

```text
관심 Repository
   ↓ Star
Stars 목록
   ↓
나중에 다시 탐색
```

Star 수는 프로젝트에 대한 관심의 신호로도 사용되지만, Star 자체가 repository activity notification을 구독시키지는 않는다.

따라서 알림을 줄이기 위해 Star를 해제하는 것은 문제의 축과 맞지 않을 수 있다.

## 3. Watch — Repository Activity를 구독한다

Watch는 repository에서 발생하는 activity에 대한 notification subscription이다.

```text
Repository Activity
   ↓
Watch 설정
   ↓
GitHub Notifications / Email 등
```

Repository별로 전체 activity를 보거나 특정 event type만 받도록 custom 설정할 수 있다.

예를 들어:

```text
Issues
Pull Requests
Releases
Security Alerts
Discussions
```

등 필요한 종류만 선택할 수 있다.

## 4. Watch하지 않아도 Notification이 올 수 있다

알림이 왔다고 반드시 repository 전체를 Watch하고 있는 것은 아니다.

GitHub에서는 다음 이유로도 conversation에 subscribe될 수 있다.

```text
Issue / PR에 Comment함
@mention됨
Reviewer로 요청됨
Assignee가 됨
직접 Subscribe함
```

즉 알림 문제도 두 층으로 구분해야 한다.

```text
Repository-level Subscription
→ Watch

Conversation-level Subscription
→ Issue / PR 참여·멘션·구독
```

Repository를 Unwatch해도 내가 참여 중인 특정 conversation의 알림은 계속 올 수 있다.

## 5. 알림이 많을 때 진단 순서

```text
알림이 많다
   ↓
어느 Repository/Conversation에서 오는지 확인
   ↓
Repository 전체 Watch 때문인가?
├─ Yes → Watch 설정 조정
└─ No
    ↓
개별 Issue/PR Subscription인가?
    ↓
필요하면 Unsubscribe
```

처음부터 Star 목록을 정리할 필요는 없다.

## 6. Watched Repository 정리

GitHub의 Watched repositories 화면에서 현재 Watch 중인 repository를 한꺼번에 검토할 수 있다.

오래전에 사용했지만 더 이상 전체 activity가 필요 없는 repository는:

```text
Watching
→ Participating and @mentions
```

처럼 낮추거나 완전히 Unwatch할 수 있다.

반대로 release만 보고 싶다면 Custom notification에서 Release만 선택하는 방식이 더 적합할 수 있다.

## 7. Notification 전달 방식은 또 다른 축이다

Watch 여부와 notification을 **어디로 받을지**도 별개다.

```text
무엇을 구독할까?
→ Watch / Conversation Subscription

어디로 받을까?
→ GitHub Inbox / Email / Mobile
```

따라서 email만 줄이고 GitHub inbox는 유지하고 싶다면 Watch를 없애기보다 Notification delivery 설정을 조정하는 것이 맞다.

## 8. 선택 기준

```text
나중에 다시 찾고 싶은 Repository다
→ Star

새 Issue·PR·Release 등을 지속적으로 추적하고 싶다
→ Watch

특정 Issue/PR만 계속 보고 싶다
→ Conversation Subscribe
```

같은 repository에 Star와 Watch를 동시에 사용할 수도 있다. 둘은 대체 관계가 아니라 서로 다른 목적의 기능이다.

## 정리

```text
Star
= 관심 Repository 저장

Watch
= Repository Activity 구독

Subscribe
= 특정 Conversation 구독
```

알림이 너무 많다면 **Star를 지우기보다 어떤 Subscription이 알림을 만들고 있는지부터 확인하는 것**이 핵심이다.

## 참고

- [GitHub Docs — Saving repositories with stars](https://docs.github.com/en/get-started/exploring-projects-on-github/saving-repositories-with-stars)
- [GitHub Docs — Configuring notifications](https://docs.github.com/en/subscriptions-and-notifications/get-started/configuring-notifications)
- [GitHub Docs — Viewing your subscriptions](https://docs.github.com/en/subscriptions-and-notifications/how-tos/managing-subscriptions-for-activity-on-github/viewing-your-subscriptions)
