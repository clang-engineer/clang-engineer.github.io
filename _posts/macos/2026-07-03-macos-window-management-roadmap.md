---
title       : "macOS 창 관리 로드맵 — AeroSpace + Hammerspoon 글을 어떻게 읽을까"
description : "SIP를 건드리지 않는 타일링 WM AeroSpace와 자동화 런타임 Hammerspoon을 역할별로 조합하는 흐름. 개념(분업) → 화면 내 배치 → 워크스페이스 연동까지 이 블로그의 macOS 창 관리 글을 단계별로 큐레이션."
date        : 2026-07-03 17:30:00 +0900
updated     : 2026-07-03 17:30:00 +0900
categories  : [macos, "개요·인덱스"]
tags        : [roadmap, aerospace, hammerspoon, macos, window-manager]
pin         : false
hidden      : false
---

macOS에서 창 관리를 제대로 하려면 결국 두 축이 필요하다. **여러 작업 공간(워크스페이스)을 나누는 것**과, **한 화면 안에서 창을 배치하는 것**이다. 이 블로그는 이 둘을 각각 잘하는 도구에 맡기는 조합을 쓴다 — [AeroSpace](https://github.com/nikitabobko/AeroSpace)(공간)와 [Hammerspoon](https://www.hammerspoon.org/)(배치·자동화). 이 로드맵은 그 조합을 다룬 글들을 개념부터 실전까지 묶었다.

## 왜 이 조합인가

- **AeroSpace** — i3 스타일 타일링 WM. 핵심은 **SIP(System Integrity Protection)를 비활성화하지 않는다**는 것. 자체 가상 워크스페이스를 구현해 macOS 네이티브 Spaces를 우회하므로 OS 업데이트에 강하다. (yabai는 전체 기능에 SIP 비활성화가 필요해 업데이트마다 깨지기 쉽다.)
- **Hammerspoon** — Lua 자동화 런타임. 알림 UI·키바인딩·이벤트 반응 스크립팅이 강점. AeroSpace가 약한 "정보 표시·화면 내 정밀 배치"를 채운다.
- **연결** — 둘은 `open -g hammerspoon://` **URL scheme** 하나로 느슨하게 결합된다. AeroSpace가 이벤트를 쏘고 Hammerspoon이 받아 반응하는 단방향 구조.

핵심 멘탈 모델은 **분업**이다.

| 담당 | 도구 |
|---|---|
| 공간(워크스페이스) 관리 | AeroSpace |
| 화면 내 창 위치·크기 | Hammerspoon |
| 정보 표시·알림·자동화 | Hammerspoon |

이 분업을 이해하면 나머지 글이 왜 그렇게 구성됐는지 자연스럽게 읽힌다.

## 1단계 — 연동의 기본기 (연계 & 재정렬)

먼저 두 도구를 어떻게 잇는지, 그 seam을 실전 예제로 익히는 단계. 손으로 잘못 옮긴 창을 단축키 하나로 제자리에 되돌리는 기능을 만든다.

| 글 | 핵심 |
|---|---|
| [AeroSpace + Hammerspoon — 창을 한 번에 제자리로 재정렬하기](/posts/macos/2026-07-03-aerospace-hammerspoon-window-reflow/) | `on-window-detected`가 한 번만 발동하는 한계, `.aerospace.toml` 매핑을 파싱해 전체 창 재배치, `open -g hammerspoon://`로 완료 알림. bash 3.2 함정·ipc 모듈까지 |

여기서 URL scheme 연동 패턴을 익히면 나머지 두 글의 토대가 된다.

## 2단계 — 화면 내 배치 (Hammerspoon 단독)

워크스페이스를 나눴다면, 이제 한 화면 안에서 창을 반·1/3·꼭짓점으로 배치하고 싶어진다. Rectangle.app 대신 Hammerspoon으로 직접 구현한다. 이 단계에서 **"AeroSpace를 왜 floating으로 두는가"**라는 분업의 실체가 드러난다.

| 글 | 핵심 |
|---|---|
| [Rectangle.app을 Hammerspoon으로 대체하기 — 화면 내 창 분할](/posts/macos/2026-07-03-hammerspoon-window-tiling-rectangle/) | `move_win` 클로저 팩토리로 모든 분할을 한 줄로, `win:id()`별 이전 프레임 저장으로 전체화면 토글, AeroSpace floating 레이아웃과의 역할 분담 |

## 3단계 — 워크스페이스 연동 심화 (정보 오버레이)

연동에 익숙해지면 "지금 몇 번 공간이지, 뭐가 열려 있지"를 화면에 띄우는 HUD를 붙일 수 있다. 여기서 Hammerspoon의 **비동기 처리**(외부 CLI 연쇄 호출)를 다룬다.

| 글 | 핵심 |
|---|---|
| [AeroSpace 워크스페이스에 정보 오버레이 붙이기 — Hammerspoon 비동기 알림](/posts/macos/2026-07-03-aerospace-workspace-overlay/) | `exec-on-workspace-change` 훅, 중첩 `hs.task`로 비동기 연쇄(앞 결과가 뒤 입력), stdout 파싱·중복 제거, `hs.alert` 스타일 커스터마이즈 |

---

본인 위치에 따라:

- **타일링 WM이 처음이라면** 먼저 AeroSpace를 설치하고 기본 단축키(`Alt+1~9` 전환, `Alt+H/J/K/L` 포커스)에 익숙해진 뒤 1단계로.
- **AeroSpace는 쓰는데 Hammerspoon 연동이 처음이라면** 1단계 재정렬 글이 가장 좋은 출발점 — URL scheme seam을 실전으로 익힌다.
- **한 화면 안 배치가 불편하다면** 2단계 Rectangle 대체로 직행.
- **워크스페이스 전환이 헷갈린다면** 3단계 오버레이로.

"단축키 몇 개"로 시작했다가 결국 두 도구를 URL scheme으로 엮어 나만의 창 관리 자동화를 짜는 게 자연스러운 흐름이다. 터미널 쪽 작업 공간 관리는 [tmux 로드맵](/posts/tmux/2026-06-16-tmux-roadmap/)과 함께 보면 데스크톱–터미널 양쪽의 공간 관리를 한 번에 잡을 수 있다.
