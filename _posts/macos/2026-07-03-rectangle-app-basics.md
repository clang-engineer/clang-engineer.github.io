---
title       : Rectangle.app 기본 — 가장 쉬운 macOS 창 분할
description : "무료·오픈소스 창 분할 앱 Rectangle.app의 기본. 설치와 Accessibility 권한, 반·1/3·꼭짓점 분할 기본 단축키, 드래그 스냅, 설정 커스터마이즈까지. macOS 창 분할을 처음 시작할 때 가장 쉬운 길을 정리한다."
date        : 2026-07-03 23:55:00 +0900
updated     : 2026-07-03 23:55:00 +0900
categories  : [macos, "창 관리"]
tags        : [rectangle, window-manager, macos]
pin         : false
hidden      : false
---

macOS는 기본적으로 창을 화면 반·1/3로 착착 나누는 기능이 약하다. 이걸 채워 주는 앱 중 사실상 표준이 [Rectangle.app](https://rectangleapp.com/)이다. **무료·오픈소스**이고(단종된 Spectacle의 사실상 후속), 설치 후 단축키 몇 개만 익히면 바로 쓸 수 있어 macOS 창 분할을 **처음 시작할 때 가장 쉬운 길**이다.

> 이 블로그는 최종적으로 Rectangle의 기능을 Hammerspoon으로 옮겨 쓴다. 다만 "코드 없이 지금 당장" 창 분할이 필요하다면 Rectangle이 가장 빠른 출발점이라, 그 기본을 먼저 정리한다. 스크립트로 옮기는 길은 글 끝에서 이어진다.
{: .prompt-info }

## 설치와 권한

```sh
brew install --cask rectangle
```

또는 [공식 사이트](https://rectangleapp.com/)에서 직접 내려받아도 된다. 창을 움직이는 앱이므로 **접근 권한**이 필요하다.

- System Settings → Privacy & Security → Accessibility에서 Rectangle 허용

## 두 가지 사용법

Rectangle은 창을 배치하는 방법을 두 가지 제공한다.

1. **키보드 단축키** — `Ctrl+Opt`(⌃⌥) 조합으로 반·1/3·꼭짓점에 즉시 배치
2. **드래그 스냅** — 창을 화면 가장자리·모서리로 끌면 그 영역에 맞춰 스냅 (Windows의 창 스냅과 같은 감각)

## 기본 단축키

설치 직후 바로 쓸 수 있는 기본 단축키다. 모두 `Ctrl+Opt`(⌃⌥)가 베이스다.

| 동작 | 단축키 |
|---|---|
| 왼쪽 / 오른쪽 반 | `⌃⌥←` / `⌃⌥→` |
| 위 / 아래 반 | `⌃⌥↑` / `⌃⌥↓` |
| 최대화 | `⌃⌥↩` |
| 중앙 배치 | `⌃⌥C` |
| 1/3 (왼·중앙·오른쪽) | `⌃⌥D` / `⌃⌥F` / `⌃⌥G` |
| 2/3 (왼·오른쪽) | `⌃⌥E` / `⌃⌥T` |
| 꼭짓점 1/4 (좌상·우상·좌하·우하) | `⌃⌥U` / `⌃⌥I` / `⌃⌥J` / `⌃⌥K` |
| 크게 / 작게 | `⌃⌥=` / `⌃⌥-` |
| 이전 크기로 복원 | `⌃⌥⌫` |
| 다른 모니터로 이동 | `⌃⌥⌘←` / `⌃⌥⌘→` |

반분할(`⌃⌥←`/`→`)과 최대화(`⌃⌥↩`) 세 개만 손에 익혀도 체감이 확 온다. 나머지는 필요할 때 하나씩 추가하면 된다.

## 설정 커스터마이즈

메뉴바 아이콘 → Settings에서 동작을 조정한다. 자주 건드리는 것만:

- **단축키 변경** — 기본 조합이 다른 앱과 충돌하면 원하는 키로 재지정
- **드래그 스냅 on/off** — 가장자리 스냅이 거슬리면 끌 수 있다
- **창 사이 간격(gap)** — 분할된 창들 사이에 여백 지정
- **거의 최대화(Almost Maximize)** — 화면 꽉 채우기 대신 살짝 여백 두고 배치

## 맥락 — 대안과 다음 단계

- **Magnet** — 같은 목적의 유료 앱(App Store). Rectangle이 무료·오픈소스라 대개 Rectangle로 충분하다.
- **Rectangle Pro** — Rectangle의 유료 버전으로 앱별 레이아웃·더 세밀한 제어를 제공한다. 기본 분할만 필요하면 무료 Rectangle로 족하다.

Rectangle에 익숙해진 뒤, **분할 로직을 코드로 직접 관리하고 다른 자동화와 엮고 싶다면** Hammerspoon으로 같은 기능을 재구현할 수 있다. 앱 하나를 덜고 무한 커스터마이즈를 얻는 대신 코드로 관리해야 한다. 그 과정은 [Rectangle.app을 Hammerspoon으로 대체하기](/posts/macos/2026-07-03-hammerspoon-window-tiling-rectangle/)에서 이어진다.
