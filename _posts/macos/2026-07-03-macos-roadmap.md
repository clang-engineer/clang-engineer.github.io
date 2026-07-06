---
title       : "macOS 로드맵 — 개발환경으로 길들이는 글 모음"
description : "macOS를 개발·생산성 환경으로 다듬는 학습 인덱스. 새 맥 셋업(시스템 운영)에서 시작해 런처·생산성, 창 관리(AeroSpace + Hammerspoon)까지 갈래별로 순서대로 큐레이션하고, 개별 트러블슈팅은 각 갈래 끝의 별도 구획으로 분리했다."
date        : 2026-07-03 17:30:00 +0900
updated     : 2026-07-06 09:00:00 +0900
categories  : [macos, "개요·인덱스"]
tags        : [roadmap, macos, aerospace, hammerspoon, window-manager]
pin         : false
hidden      : false
---

macOS를 개발환경으로 길들이는 일은 여러 갈래로 나뉜다 — 시스템을 어떻게 운영하느냐, 무엇을 얼마나 빨리 호출하느냐, 창을 어떻게 배치하느냐. 이 로드맵은 그 갈래를 **배우는 순서**로 묶은 학습 인덱스다. **시스템 운영 → 런처·생산성 → 창 관리**가 얕은 데서 깊은 데로 가는 척추고, 새 맥을 막 받았다면 위에서부터 순서대로 읽으면 된다. 이미 익숙한 갈래는 건너뛰고 관심 지점부터 진입해도 좋다.

각 갈래에서 **특정 증상 전용 트러블슈팅**은 학습 흐름에 섞지 않고, 갈래 끝의 `트러블슈팅` 구획으로 내려 두었다. 배우는 동안은 본문 표만 따라 읽고, 같은 벽에 부딪혔을 때만 그 구획으로 찾아 들어오면 된다.

## 한눈에 보기

| 갈래 | 무엇을 잡나 | 여기서 출발 |
|---|---|---|
| 1. 시스템 운영 | 새 맥 셋업 · CLI·유틸 갖추기 | [새 맥 초기 설정](/posts/macos/2022-02-05-new-mac-initial-setup/) |
| 2. 런처·생산성 | 무엇을 빠르게 호출하나 — 런처 고르기부터 Raycast 역할 한정까지 | [런처 고르기](/posts/macos/2025-10-31-productivity-launchers/) |
| 3. 창 관리 | 워크스페이스(AeroSpace) + 화면 내 배치·자동화(Hammerspoon) | [Rectangle.app 기본](/posts/macos/2026-07-03-rectangle-app-basics/) |

창 관리 갈래는 두 도구를 각각 익히는 **기본기**에서 시작해, **연동 → 화면 내 배치 → 오버레이**로 이어지는 단계가 아래에 세부로 붙는다.

## 시스템 운영

도구를 얹기 전에, macOS 자체를 개발환경으로 갖추는 셋업 갈래. 새 맥의 출발점이 여기다. 위에서 아래로 **셋업 순서 → 자체 설정 → CLI 툴킷 → 보조 유틸**의 흐름으로 읽으면 된다.

| 글 | 핵심 |
|---|---|
| [새 맥 초기 설정 — 셋업 순서](/posts/macos/2022-02-05-new-mac-initial-setup/) | 시스템 설정 → Homebrew → dotfiles → Git 계정으로 이어지는 day-1 셋업 순서. 각 단계를 심화 글로 연결하는 런북(진입점) |
| [macOS 시스템 설정 — 세벌식·트랙패드·터미널·앱 권한](/posts/macos/2026-07-03-macos-system-settings/) | 세벌식 입력, Caps Lock 전환, 세 손가락 드래그, Mission Control 충돌부터 터미널 테마·앱 접근 권한·vim 스크롤까지 macOS 자체 설정 모음 |
| [macOS CLI 개발 도구 모음 — Brewfile로 관리하는 터미널 툴킷](/posts/macos/2026-07-03-macos-cli-toolkit-brewfile/) | cat·ls·find·grep을 대체하는 모던 CLI(bat·eza·fd·ripgrep·zoxide)부터 fzf·lazygit·delta, 언어 버전 관리까지 실제 Brewfile 기준 갈래별 정리 |
| [새 맥에 더 얹을 보조 유틸 모음](/posts/macos/2026-07-03-macos-extra-utilities/) | Ice(메뉴바)·Stats(모니터)·Shottr(스크린샷)·BetterDisplay(디스플레이)·Ghostty(터미널) — 큰 도구 다음에 취향껏 얹는 보조 유틸을 무엇·왜·대안까지 |

> 📎 **치트시트** · [modern-cli](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/modern-cli.md) · [fzf](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/fzf.md) · [lazygit](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/lazygit.md) — 터미널 툴킷(bat·eza·fd / 퍼지 파인더 / Git TUI) 빠른 참조 (GitHub)
{: .prompt-tip }

여기까지면 새 맥을 개발환경으로 세우는 큰 줄기는 끝난다. 다음 갈래(런처·생산성)로 넘어가면 된다.

### 트러블슈팅 — 셋업 중 막혔을 때

학습 순서와는 무관하게, 같은 증상에 부딪혔을 때만 찾아 들어오면 되는 개별 사례들.

| 글 | 핵심 |
|---|---|
| [Docker 실행 시 Operation not permitted 에러 해결](/posts/virtualization/2023-12-16-mac-docker-operation-not-permitted/) | macOS 파일·폴더 접근 권한 누락이 원인. 시스템 설정에서 Docker에 권한을 부여해 해결 |
| [brew cleanup 후 java_home이 엉뚱한 버전을 반환할 때](/posts/macos/2026-06-07-homebrew-cleanup-java-symlink-broken/) | Homebrew가 옛 JDK를 지우며 깨진 `/Library/Java/JavaVirtualMachines` 심볼릭 링크 복구 |

## 런처·생산성 — Raycast

시스템을 잡았다면, 다음은 **"무엇을 빠르게 호출하느냐"**의 축이다. 명령 팔레트·클립보드 히스토리·스니펫·확장이 여기 속한다. 위에서 아래로 **런처 고르기 → 생산성 앱 큰 그림 → 역할 한정**의 흐름으로 읽으면 된다. Raycast에도 창 관리 기능이 있어 뒤에 나올 창 관리 도구들과 **역할이 겹칠 수 있는데**, "무엇을 끄고 어디까지만 맡기느냐"를 정리하는 마지막 글이 이 갈래의 종착점이다.

| 글 | 핵심 |
|---|---|
| [macOS 생산성 런처 — Spotlight vs Alfred vs Raycast](/posts/macos/2025-10-31-productivity-launchers/) | 런처 자체를 고르는 첫 단계. 가격·확장성·클립보드·동기화·개발자 친화성으로 세 런처를 비교하고 사용자 유형별로 추천 |
| [macOS 생산성 앱 정리](/posts/macos/2025-12-29-mac-productivity-tool/) | Raycast·Rectangle·BetterTouchTool 3대장과 대표 조합. 런처 밖 창 관리·입력 자동화까지 생산성 앱 전반의 큰 그림 |
| [Raycast를 검색 계층으로 한정하기 — AeroSpace·Hammerspoon과 안 겹치게 쓰는 법](/posts/macos/2026-07-03-raycast-search-layer-role/) | 세 도구를 공간·자동화·검색 세 축으로 분업, Raycast의 창 관리 기능은 끄고 "검색형 진입 계층"으로 한정, Hammerspoon과의 경계선, 설정은 Cloud Sync가 정공법 |

마지막 글은 다음에 나올 창 관리 갈래(AeroSpace·Hammerspoon)를 전제로 하니, 그 두 도구가 아직 낯설면 창 관리 갈래를 먼저 훑고 돌아와 읽어도 된다.

## 창 관리 — AeroSpace + Hammerspoon

가장 깊이 들어가는 갈래. macOS 창 관리는 결국 두 축이다. **작업 공간(워크스페이스)을 나누는 것**과 **한 화면 안에서 창을 배치하는 것**. 이 블로그는 각각을 잘하는 도구에 맡긴다 — [AeroSpace](https://github.com/nikitabobko/AeroSpace)(공간)와 [Hammerspoon](https://www.hammerspoon.org/)(배치·자동화). 둘은 `open -g hammerspoon://` **URL scheme**으로 느슨하게 연결된다.

핵심 멘탈 모델은 **분업**이다.

| 담당 | 도구 |
|---|---|
| 공간(워크스페이스) 관리 | AeroSpace |
| 화면 내 창 위치·크기 | Hammerspoon |
| 정보 표시·알림·자동화 | Hammerspoon |

> AeroSpace를 고른 이유는 **SIP(System Integrity Protection)를 비활성화하지 않는다**는 점이다. 자체 가상 워크스페이스로 macOS 네이티브 Spaces를 우회해 OS 업데이트에 강하다. (yabai는 전체 기능에 SIP 비활성화가 필요해 업데이트마다 깨지기 쉽다.)
{: .prompt-tip }

**어디서 들어갈까**

- **타일링 WM이 처음이라면** 기본기의 Rectangle.app으로 감을 잡고, AeroSpace 기본 단축키(`Alt+1~9` 전환, `Alt+H/J/K/L` 포커스)에 익숙해진 뒤 심화로.
- **AeroSpace는 쓰는데 Hammerspoon 연동이 처음이라면** 심화 ① 재정렬 글이 가장 좋은 출발점.
- **한 화면 안 배치가 불편하다면** 심화 ② Rectangle 대체로 직행.
- **워크스페이스 전환이 헷갈린다면** 심화 ③ 오버레이로.

### 기본기 — 두 도구를 각각 먼저 익히기

연동에 들어가기 전에, AeroSpace와 Hammerspoon을 하나씩 손에 익히는 단계. 각 도구의 설치·핵심 개념·기본 단축키를 잡는다.

| 글 | 핵심 |
|---|---|
| [Rectangle.app 기본 — 가장 쉬운 macOS 창 분할](/posts/macos/2026-07-03-rectangle-app-basics/) | 코드 없이 지금 당장 창 분할. 무료·오픈소스 앱 설치, `⌃⌥` 반·1/3·꼭짓점 분할 단축키, 드래그 스냅. 가장 쉬운 출발점 |
| [AeroSpace 기본 — 워크스페이스·단축키·on-window-detected](/posts/macos/2026-07-03-aerospace-basics/) | SIP 비활성화 없이 쓰는 타일링 워크스페이스 매니저. `alt-hjkl` 포커스·이동, 워크스페이스 전환, `.aerospace.toml`의 `mode.main.binding`과 앱 자동 배치 |
| [Hammerspoon 기본 — init.lua·hs API·ipc CLI·모듈 구조](/posts/macos/2026-07-03-hammerspoon-basics/) | Lua로 macOS 자동화. Accessibility 권한, `hs.hotkey.bind`, hs API 맛보기, `hs` CLI와 URL scheme, 설정을 모듈로 쪼개기 |

> 📎 **치트시트** · [aerospace](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/aerospace.md) — 워크스페이스·바인딩·모드 빠른 참조 (GitHub)
{: .prompt-tip }

가장 쉬운 진입은 **Rectangle.app**(GUI 앱)으로 창 분할 감을 잡는 것이다. 여기서 더 나아가 워크스페이스 분리는 AeroSpace, 정밀 배치·자동화는 Hammerspoon으로 넘어간다. Rectangle의 기능을 Hammerspoon으로 옮기는 과정은 아래 심화 ②에서 다룬다.

### 심화 — 연동 → 배치 → 오버레이

기본기를 잡았으면 세 글로 깊어진다. ① 두 도구를 잇고(연동), ② 화면 내 배치를 Hammerspoon으로 직접 구현하고, ③ 워크스페이스 상태를 화면에 띄운다(오버레이). ①의 URL scheme 연동 패턴이 나머지 둘의 토대이므로 순서대로 읽는 게 좋다.

| 순서 | 글 | 핵심 |
|---|---|---|
| ① 연동 | [창을 한 번에 제자리로 재정렬하기](/posts/macos/2026-07-03-aerospace-hammerspoon-window-reflow/) | `on-window-detected`가 한 번만 발동하는 한계, `.aerospace.toml` 매핑을 파싱해 전체 창 재배치, `open -g hammerspoon://`로 완료 알림. bash 3.2 함정·ipc 모듈까지. 나머지 둘의 토대 |
| ② 배치 | [Rectangle.app을 Hammerspoon으로 대체하기](/posts/macos/2026-07-03-hammerspoon-window-tiling-rectangle/) | `move_win` 클로저 팩토리로 모든 분할을 한 줄로, `win:id()`별 프레임 저장으로 전체화면 토글. **"AeroSpace를 왜 floating으로 두나"**라는 분업의 실체가 여기서 드러난다 |
| ③ 오버레이 | [워크스페이스에 정보 오버레이 붙이기](/posts/macos/2026-07-03-aerospace-workspace-overlay/) | `exec-on-workspace-change` 훅, 중첩 `hs.task`로 비동기 연쇄(앞 결과가 뒤 입력), stdout 파싱·중복 제거, `hs.alert` 스타일 커스터마이즈 |

### 보완 — 창 전환기 (AltTab)

방향 이동·워크스페이스로는 안 잡히는 **"흩어진 특정 창으로 점프"**는 별도 창 전환기가 메운다. 타일링 셋업과 독립적으로 얹는 보완 도구다.

| 글 | 핵심 |
|---|---|
| [AltTab — 타일링 WM의 빈틈을 메우는 창 전환기](/posts/macos/2026-07-03-alttab-window-switcher/) | macOS `Cmd+Tab`이 못 하는 **창 단위·썸네일·크로스 워크스페이스** 전환. 권한(손쉬운 사용+화면 기록), `Option+Tab`으로 충돌 회피 |

### 트러블슈팅 — 단축키가 갑자기 안 될 때

| 글 | 핵심 |
|---|---|
| [AeroSpace 단축키가 갑자기 안 될 때 — macOS Secure Input](/posts/macos/2026-06-07-aerospace-secure-input-hotkey-blocked/) | Secure Input이 활성이면 시스템 핫키를 못 잡는다. 어느 프로세스가 잡았는지 진단하고 푸는 법 |

> 📎 **치트시트** · [macos-admin](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/macos-admin.md) — Secure Input·LaunchDaemons 등 진단 빠른 참조 (GitHub)
{: .prompt-tip }

---

macOS를 개발환경으로 세우려는 사람은 이렇게 읽으면 된다:

- **새 맥을 막 받았다면** 시스템 운영 갈래를 셋업 순서 → 자체 설정 → CLI 툴킷 → 보조 유틸 순으로.
- **호출 속도를 올리고 싶다면** 런처·생산성 갈래에서 Raycast의 역할부터 정리한다.
- **창 배치까지 손대려면** 창 관리 갈래를 기본기 → 연동 → 화면 내 배치 → 오버레이 단계로 밟는다.
- **막힌 증상이 있을 때만** 해당 갈래 끝의 `트러블슈팅` 구획으로 직행한다.

이 로드맵은 macOS **시스템·런처·창 관리**까지의 데스크톱 계층을 다룬다. 그 위·옆에 얹히는 개발환경의 나머지 축은 각각 별도 로드맵으로 이어진다.

- **터미널 안 공간 관리** — [tmux 로드맵](/posts/tmux/2026-06-16-tmux-roadmap/). 데스크톱–터미널 양쪽 공간 관리를 한 번에.
- **셸 환경·스크립트** — [셸 로드맵](/posts/shell/2026-07-03-shell-roadmap/). Brewfile·dotfiles로 시작한 셸 설정을 스크립트 작성까지 밀고 나간다.
- **에디터** — [Neovim 로드맵](/posts/neovim/2026-06-16-neovim-roadmap/). 터미널 기반 편집 환경으로 들어가는 갈래.
- **키보드 커스텀** — [키보드 로드맵](/posts/etc/2026-07-03-keyboard-roadmap/). 시스템 설정의 세벌식·Caps Lock 리맵에서 더 들어가면 세벌식·Karabiner·커스텀 키맵까지.
