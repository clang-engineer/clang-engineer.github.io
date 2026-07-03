---
title       : "macOS 로드맵 — 개발환경으로 길들이는 글 모음"
description : "macOS를 개발·생산성 환경으로 다듬는 주제별 인덱스. 창 관리(AeroSpace + Hammerspoon)를 시작으로, 이 블로그의 macOS 활용 글을 갈래별로 큐레이션한다."
date        : 2026-07-03 17:30:00 +0900
updated     : 2026-07-03 17:30:00 +0900
categories  : [macos, "개요·인덱스"]
tags        : [roadmap, macos, aerospace, hammerspoon, window-manager]
pin         : false
hidden      : false
---

macOS를 개발환경으로 길들이는 일은 여러 갈래로 나뉜다 — 창을 어떻게 배치하느냐, 무엇을 얼마나 빨리 호출하느냐, 시스템을 어떻게 운영하느냐. 이 로드맵은 그 갈래를 **주제별 섹션**으로 묶은 인덱스다. 지금은 **창 관리**와 **런처·생산성** 갈래가 채워져 있고, 앞으로 시스템 운영 등으로 확장한다. 본인 관심 갈래부터 진입하면 된다.

## 창 관리 — AeroSpace + Hammerspoon

macOS 창 관리는 결국 두 축이다. **작업 공간(워크스페이스)을 나누는 것**과 **한 화면 안에서 창을 배치하는 것**. 이 블로그는 각각을 잘하는 도구에 맡긴다 — [AeroSpace](https://github.com/nikitabobko/AeroSpace)(공간)와 [Hammerspoon](https://www.hammerspoon.org/)(배치·자동화). 둘은 `open -g hammerspoon://` **URL scheme**으로 느슨하게 연결된다.

핵심 멘탈 모델은 **분업**이다.

| 담당 | 도구 |
|---|---|
| 공간(워크스페이스) 관리 | AeroSpace |
| 화면 내 창 위치·크기 | Hammerspoon |
| 정보 표시·알림·자동화 | Hammerspoon |

> AeroSpace를 고른 이유는 **SIP(System Integrity Protection)를 비활성화하지 않는다**는 점이다. 자체 가상 워크스페이스로 macOS 네이티브 Spaces를 우회해 OS 업데이트에 강하다. (yabai는 전체 기능에 SIP 비활성화가 필요해 업데이트마다 깨지기 쉽다.)
{: .prompt-tip }

### 1단계 — 연동의 기본기 (연계 & 재정렬)

두 도구를 어떻게 잇는지, 그 seam을 실전 예제로 익히는 단계. 손으로 잘못 옮긴 창을 단축키 하나로 제자리에 되돌리는 기능을 만든다.

| 글 | 핵심 |
|---|---|
| [AeroSpace + Hammerspoon — 창을 한 번에 제자리로 재정렬하기](/posts/macos/2026-07-03-aerospace-hammerspoon-window-reflow/) | `on-window-detected`가 한 번만 발동하는 한계, `.aerospace.toml` 매핑을 파싱해 전체 창 재배치, `open -g hammerspoon://`로 완료 알림. bash 3.2 함정·ipc 모듈까지 |

여기서 URL scheme 연동 패턴을 익히면 나머지 두 글의 토대가 된다.

### 2단계 — 화면 내 배치 (Hammerspoon 단독)

워크스페이스를 나눴다면, 이제 한 화면 안에서 창을 반·1/3·꼭짓점으로 배치하고 싶어진다. Rectangle.app 대신 Hammerspoon으로 직접 구현한다. 이 단계에서 **"AeroSpace를 왜 floating으로 두는가"**라는 분업의 실체가 드러난다.

| 글 | 핵심 |
|---|---|
| [Rectangle.app을 Hammerspoon으로 대체하기 — 화면 내 창 분할](/posts/macos/2026-07-03-hammerspoon-window-tiling-rectangle/) | `move_win` 클로저 팩토리로 모든 분할을 한 줄로, `win:id()`별 이전 프레임 저장으로 전체화면 토글, AeroSpace floating 레이아웃과의 역할 분담 |

### 3단계 — 워크스페이스 연동 심화 (정보 오버레이)

연동에 익숙해지면 "지금 몇 번 공간이지, 뭐가 열려 있지"를 화면에 띄우는 HUD를 붙일 수 있다. 여기서 Hammerspoon의 **비동기 처리**(외부 CLI 연쇄 호출)를 다룬다.

| 글 | 핵심 |
|---|---|
| [AeroSpace 워크스페이스에 정보 오버레이 붙이기 — Hammerspoon 비동기 알림](/posts/macos/2026-07-03-aerospace-workspace-overlay/) | `exec-on-workspace-change` 훅, 중첩 `hs.task`로 비동기 연쇄(앞 결과가 뒤 입력), stdout 파싱·중복 제거, `hs.alert` 스타일 커스터마이즈 |

**창 관리 갈래 진입 가이드**

- **타일링 WM이 처음이라면** 먼저 AeroSpace를 설치하고 기본 단축키(`Alt+1~9` 전환, `Alt+H/J/K/L` 포커스)에 익숙해진 뒤 1단계로.
- **AeroSpace는 쓰는데 Hammerspoon 연동이 처음이라면** 1단계 재정렬 글이 가장 좋은 출발점.
- **한 화면 안 배치가 불편하다면** 2단계 Rectangle 대체로 직행.
- **워크스페이스 전환이 헷갈린다면** 3단계 오버레이로.

## 런처·생산성 — Raycast

창 관리가 "무엇을 어디에 배치하느냐"라면, 런처는 **"무엇을 빠르게 호출하느냐"**의 축이다. 명령 팔레트·클립보드 히스토리·스니펫·확장이 여기 속한다. 창 관리와는 다른 축이지만, Raycast에도 창 관리 기능이 있어 앞의 도구들과 **역할이 겹칠 수 있다**. 그래서 이 갈래의 출발점은 "무엇을 켜느냐"가 아니라 **"무엇을 끄고 어디까지만 맡기느냐"**다.

| 글 | 핵심 |
|---|---|
| [Raycast를 검색 계층으로 한정하기 — AeroSpace·Hammerspoon과 안 겹치게 쓰는 법](/posts/macos/2026-07-03-raycast-search-layer-role/) | 세 도구를 공간·자동화·검색 세 축으로 분업, Raycast의 창 관리 기능은 끄고 "검색형 진입 계층"으로 한정, Hammerspoon과의 경계선, 설정은 Cloud Sync가 정공법 |

먼저 런처 자체를 고르는 단계라면 [Spotlight·Alfred·Raycast 비교](/posts/etc/2025-10-31-productivity-launchers/)부터 보고 오면 된다.

## 앞으로 다룰 갈래

이 인덱스는 계속 확장된다. 다음 후보:

- **시스템 운영** — 디스크 정리, LaunchDaemons, 심볼릭 링크 등 macOS 관리 트러블슈팅.

---

데스크톱 쪽 공간 관리를 잡았다면, 터미널 안 공간 관리는 [tmux 로드맵](/posts/tmux/2026-06-16-tmux-roadmap/)과 함께 보면 데스크톱–터미널 양쪽을 한 번에 다룰 수 있다.
