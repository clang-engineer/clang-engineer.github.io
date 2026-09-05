---
title       : "macOS Launcher 비교 — Spotlight vs Alfred vs Raycast"
description : "macOS 26의 Spotlight, Alfred, Raycast를 검색·동작 실행·확장 모델·클립보드·동기화·비용이라는 같은 비교축에 놓고 어떤 사용자에게 맞는지 정리한다."
date        : 2025-10-31 09:20:19 +0900
updated     : 2026-09-05 20:25:00 +0900
categories  : [macos, "런처·생산성"]
redirect_from:
  - /posts/etc/2025-10-31-productivity-launchers/
  - /posts/macos/2025-12-29-mac-productivity-tool/
  - /posts/etc/2025-12-29-mac-productivity-tool/
tags        : [macos, spotlight, alfred, raycast, comparison]
pin         : false
hidden      : false
---

macOS에서 Spotlight, Alfred, Raycast는 모두 키보드로 앱과 정보를 빠르게 찾는 Launcher지만 **현재는 단순 검색 속도만으로 비교하기 어렵다.**

특히 macOS 26의 Spotlight는 앱·파일 검색을 넘어 Action 실행, Shortcut 호출, Clipboard History까지 제공하면서 예전보다 훨씬 높은 계층으로 올라왔다.

따라서 비교축을 먼저 잡는다.

```text
기본 검색·앱 실행
        ↓
Action / Automation
        ↓
Extension 생태계
        ↓
Clipboard / Snippet
        ↓
Sync / Team 기능
        ↓
비용과 관리 복잡도
```

## 1. 세 도구의 위치

```text
macOS 기본 기능
└─ Spotlight

독립 Launcher + Workflow 중심
└─ Alfred

독립 Productivity Platform + Extension 중심
└─ Raycast
```

셋 모두 "검색창"처럼 보이지만 확장 방식과 제품 철학이 다르다.

## 2. 한눈에 비교

| 비교축 | Spotlight | Alfred | Raycast |
|---|---|---|---|
| 기본 제공 | macOS 내장 | 별도 설치 | 별도 설치 |
| 앱·파일 검색 | 강함 | 강함 | 강함 |
| Action 실행 | macOS 26에서 크게 강화 | Workflow/Universal Actions | Commands/Extensions 중심 |
| Shortcut 연동 | macOS Shortcuts와 직접 통합 | Workflow에서 연동 가능 | Extension/Command 조합 |
| Clipboard History | macOS 26에서 제공 | Powerpack | Free plan 포함, 보관 기간 제한 |
| 확장 모델 | Apple의 System Action/Shortcut | Alfred Workflow | Extension Store + Custom Extension |
| 사용자 확장 개발 | Shortcuts/시스템 범위 | Script·Workflow | TypeScript/React 기반 Extension |
| Cloud Sync | Apple 생태계 기능에 따름 | 원하는 Sync Storage로 설정 | Pro 기능 |
| 비용 | macOS에 포함 | 기본 무료 + Powerpack 유료 | Free + Pro 구독 |

중요한 변화는 **Spotlight를 더 이상 "검색만 되는 기본 런처"로 보면 안 된다는 것**이다.

## 3. Spotlight — 운영체제에 가장 가까운 Launcher

Spotlight의 가장 큰 장점은 설치가 필요 없고 macOS 자체 데이터와 기능을 직접 알고 있다는 점이다.

현재 macOS 26에서는:

```text
App 검색
File 검색
Clipboard 탐색
System / App Action 실행
Shortcut 실행
빠른 키(Quick Keys)
```

까지 지원한다.

즉 구조적으로:

```text
macOS System / Apps
       ↓
   Spotlight Index
       +
   System Actions
       +
    Shortcuts
       ↓
    Spotlight UI
```

에 가깝다.

### Spotlight가 잘 맞는 경우

```text
추가 앱을 최소화하고 싶다
macOS 기본 기능과 Shortcut을 많이 쓴다
검색 + 일반적인 Action이면 충분하다
```

예전처럼 "자동화 기능이 없다"고 보는 것은 현재 macOS에서는 맞지 않는다.

## 4. Alfred — Workflow를 직접 조립하는 Launcher

Alfred의 강점은 오랫동안 쌓인 **Workflow 기반 사용자 자동화**다.

기본 앱은 무료로 사용할 수 있지만 Workflow, Clipboard History, Snippets 같은 핵심 고급 기능은 Powerpack에서 제공된다.

```text
Keyword / Hotkey
      ↓
Alfred Workflow
├─ Script Filter
├─ Action
├─ File / URL 처리
└─ 외부 API / Script
```

Workflow를 블록처럼 연결하거나 Bash, Python, AppleScript 등 외부 script를 넣을 수 있어 **내가 원하는 자동화 흐름을 세밀하게 소유하고 싶은 사용자**에게 잘 맞는다.

### Alfred가 잘 맞는 경우

```text
기존 Alfred Workflow 자산이 많다
Script 기반 자동화를 세밀하게 구성하고 싶다
Subscription보다 일회성 License를 선호한다
설정 Sync 위치도 직접 통제하고 싶다
```

현재 Alfred 5 Powerpack은 별도 유료 license이며 lifetime upgrade가 포함된 상위 license도 따로 있다. 가격은 변할 수 있으므로 구매 시 공식 페이지를 확인한다.

## 5. Raycast — Extension 생태계를 중심으로 한 Productivity Platform

Raycast는 Launcher 위에 많은 productivity 기능을 하나의 Command/Extension 모델로 통합한다.

```text
Raycast
├─ Built-in Commands
├─ Clipboard History
├─ Snippets
├─ Window Management
├─ Quicklinks
├─ Extension Store
└─ Custom Extensions
```

Extension 개발은 TypeScript/React 생태계를 사용하므로 웹 프론트엔드 경험을 재사용하기 좋다.

### Free와 Pro를 구분해야 한다

Raycast의 개인 Free plan에도 상당한 핵심 기능이 포함된다.

```text
Clipboard History
Window Management
Snippets
Public Extensions
Custom Extensions / Developer Tooling
```

하지만 현재 기준으로 Cloud Sync, AI, Dictation, Custom Themes 등은 Pro에 포함된다. Free plan의 Clipboard History도 보관 기간 등에서 Pro와 차이가 있다.

따라서:

```text
Raycast = 완전 무료
```

라고 단정하기보다 **강한 Free tier + 선택적 Pro subscription**으로 이해하는 편이 정확하다.

### Raycast가 잘 맞는 경우

```text
Extension Store에서 기능을 빠르게 추가하고 싶다
TypeScript 기반 확장을 직접 만들고 싶다
Launcher에 Clipboard·Window·Snippet 등을 함께 묶고 싶다
필요하면 Cloud Sync·AI까지 한 제품에서 사용하고 싶다
```

## 6. 세 도구의 가장 큰 차이는 확장 모델이다

검색 성능보다 이 축이 장기 사용 경험을 더 크게 가른다.

```text
Spotlight
→ OS가 제공하는 Action + Shortcuts

Alfred
→ 사용자가 조립하는 Workflow

Raycast
→ Command / Extension Platform
```

따라서 "어떤 게 제일 강력한가"보다 **내 자동화가 어느 모델과 잘 맞는가**가 더 좋은 질문이다.

## 7. 선택 기준

### 기본 기능으로 최대한 해결

```text
Spotlight
```

macOS 26의 Action과 Clipboard 기능까지 먼저 사용해보고 부족한 지점을 확인한다.

### 자동화 흐름을 직접 설계

```text
Alfred + Powerpack
```

오랫동안 사용할 개인 Workflow와 Script를 세밀하게 구성하고 싶을 때 적합하다.

### Extension 중심의 통합 Productivity Layer

```text
Raycast
```

다양한 app integration을 쉽게 붙이고 TypeScript 기반 확장을 활용하고 싶다면 유리하다.

## 8. Launcher와 다른 Productivity Tool을 같은 축에 놓지 않는다

Rectangle, AeroSpace, BetterTouchTool 같은 앱은 Launcher와 일부 기능이 겹칠 수 있지만 주 역할은 다르다.

```text
검색·Command 호출
→ Spotlight / Alfred / Raycast

Window Layout / Tiling
→ Rectangle / AeroSpace

입력 Device·Gesture·Macro 자동화
→ BetterTouchTool / Hammerspoon 등
```

Raycast가 Window Management를 제공한다고 해서 전문 Window Manager와 같은 제품군이 되는 것은 아니다.

이 경계는 [Raycast를 검색 계층으로 한정하기](/posts/macos/2026-07-03-raycast-search-layer-role/)에서 더 구체적으로 다룬다.

## 정리

```text
Spotlight
→ OS 통합이 가장 깊은 기본 Launcher

Alfred
→ Workflow를 직접 설계하는 성숙한 Automation Launcher

Raycast
→ Extension 생태계를 중심으로 기능을 통합한 Productivity Platform
```

현재 macOS에서는 Spotlight 자체가 크게 강해졌기 때문에 **기본 기능으로 해결되는 범위를 먼저 확인한 뒤, 부족한 확장 모델에 따라 Alfred나 Raycast를 선택하는 것**이 가장 합리적이다.

## 참고

- [Apple — macOS 26 Spotlight](https://support.apple.com/guide/mac-help/mchl4953dfeb/mac)
- [Alfred Powerpack](https://www.alfredapp.com/powerpack/)
- [Raycast Pricing](https://www.raycast.com/pricing)
