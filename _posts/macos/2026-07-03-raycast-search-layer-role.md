---
title       : "Raycast를 검색 계층으로 한정하기 — AeroSpace·Hammerspoon과 안 겹치게 쓰는 법"
description : "AeroSpace·Hammerspoon·Raycast는 모두 '단축키로 뭔가를 한다'는 점에서 기능이 겹친다. 세 도구를 공간·자동화·검색 세 축으로 분업하고, Raycast는 '검색형 진입 계층'으로 한정해 충돌을 없애는 멘탈 모델을 정리한다."
date        : 2026-07-03 18:00:00 +0900
updated     : 2026-07-03 18:00:00 +0900
categories  : [macos, "런처·생산성"]
tags        : [macos, raycast, hammerspoon, aerospace, productivity, guide]
pin         : false
hidden      : false
---

> **[macOS 로드맵](/posts/macos/2026-07-03-macos-roadmap/)** — 창 관리 시리즈에 이어 **런처·생산성** 갈래의 첫 글입니다.
> 런처 자체를 고르는 문제(Spotlight·Alfred·Raycast 비교)는 [macOS 생산성 런처 비교](/posts/macos/2025-10-31-productivity-launchers/)를 먼저 보세요. 이 글은 **이미 Raycast를 쓰기로 정한 뒤**, 창 관리 도구와 어떻게 안 겹치게 배치하느냐를 다룹니다.
{: .prompt-info }

Raycast를 설치하고 나면 흔히 부딪히는 문제가 있다. **이미 창 관리 도구를 쓰고 있는데 Raycast도 창 관리 기능을 갖고 있어서 서로 싸운다**는 것이다. 여기에 Hammerspoon 같은 자동화 런타임까지 있으면, 세 도구가 전부 "단축키를 누르면 뭔가 한다"는 점에서 역할이 뭉개진다.

이 글은 **AeroSpace(타일링 WM) + Hammerspoon(자동화) + Raycast(런처)** 세 도구를 쓸 때, Raycast를 어디까지만 맡겨야 충돌 없이 셋이 공존하는지를 정리한다. 결론부터 말하면 **Raycast는 "검색형 진입 계층"으로 한정**하는 것이다.

## 문제: 세 도구의 기능이 겹친다

각 도구는 원래 담당 영역이 다르지만, 기능 표를 펼쳐 보면 교집합이 크다.

| 기능 | AeroSpace | Hammerspoon | Raycast |
|---|:---:|:---:|:---:|
| 창 위치·크기 배치 | ✅ | ✅ | ✅ (내장) |
| 워크스페이스 전환 | ✅ | | |
| 전역 단축키(hotkey) | ✅ | ✅ | ✅ |
| 앱 실행·토글 | | ✅ | ✅ |
| 파일·명령 검색 | | | ✅ |
| 클립보드·스니펫 | | (직접 구현) | ✅ (내장) |
| 확장(외부 서비스 연동) | | | ✅ |

문제는 **"창 위치·크기 배치"와 "전역 단축키"** 행이다. 세 도구가 다 할 수 있다. 아무 계획 없이 각각의 기본값을 켜두면, 같은 창을 두 도구가 서로 다른 규칙으로 옮기려 들고, 같은 키 조합을 둘이 가로채려 든다. **가장 흔한 사고가 Raycast의 Window Management 기능을 켠 상태에서 타일링 WM을 함께 쓰는 것**이다.

## 멘탈 모델: 하나의 축에 하나의 도구

겹침을 없애는 원칙은 단순하다. **각 도구를 서로 다른 "축(axis)" 하나에만 배정**한다. macOS를 다루는 축은 크게 셋이다.

| 축 | 질문 | 담당 도구 |
|---|---|---|
| **공간(space)** | 작업 공간을 어떻게 나누나 | **AeroSpace** |
| **배치·자동화(action)** | 화면 안 창을 어떻게 놓고, 무엇을 자동화하나 | **Hammerspoon** |
| **검색·진입(search)** | 무엇을 타이핑해서 찾아 실행하나 | **Raycast** |

이 표의 핵심은 **"창 배치"를 Hammerspoon 한 곳에만 몰아준다**는 점이다. Raycast에도 창 관리 기능이 있지만 **쓰지 않는다**. 세 도구가 겹치는 유일한 실전 배치는 이렇게 나온다.

> 왜 배치를 Hammerspoon에 몰아주는가? 창 배치는 "이전 프레임을 기억했다가 토글", "특정 앱만 예외 처리" 같은 **상태와 조건이 붙는 로직**이 금방 필요해진다. Raycast의 내장 창 관리는 이런 커스텀이 막혀 있고, 스크립트로 확장하려면 결국 Hammerspoon 같은 런타임이 필요하다. 배치 로직을 한 곳(Hammerspoon)에 두면 규칙이 분산되지 않는다.
{: .prompt-tip }

AeroSpace·Hammerspoon 두 축을 실제로 엮는 방법은 이 블로그의 [창 관리 시리즈](/posts/macos/2026-07-03-aerospace-hammerspoon-window-reflow/)에서 다뤘다. 이 글은 세 번째 축인 **Raycast = 검색 계층**에 집중한다.

## 1단계: Raycast의 창 관리 기능을 끈다

가장 먼저 할 일은 충돌원 제거다. 타일링 WM이나 Hammerspoon으로 창을 배치하고 있다면, Raycast의 Window Management는 **완전히 비활성화**한다.

`Settings → Extensions → Window Management`에서 각 명령의 hotkey를 비우거나 확장 자체를 꺼두면 된다. 이걸 안 하면 "창을 반으로 나누는" 같은 조작이 어느 도구에 매핑됐는지 헷갈리고, 최악의 경우 두 도구가 같은 창을 동시에 옮기려다 프레임이 튄다.

**Raycast에 창을 맡기지 않는다** — 이 한 문장이 세 도구 공존의 전제다.

## 2단계: Raycast가 실제로 값어치 있는 지점만 남긴다

창 관리를 뺀 Raycast는 "무엇을 타이핑해서 찾아 실행하느냐"에 집중한다. 이 축에서 Raycast는 Spotlight를 확실히 넘어선다.

### Extension Store — 다른 런처와 갈리는 지점

Raycast의 정체성은 확장 스토어다. GitHub·Linear·Jira·Notion·1Password·Homebrew 같은 외부 서비스를 **런처 창 안에서 바로 조회·조작**한다.

- `brew` 검색으로 패키지 설치
- PR·이슈 목록을 런처에서 훑고 바로 열기
- 1Password 항목 검색

Alfred의 워크플로가 스크립트 조립이라면, Raycast는 **설치형 확장**이라 진입 장벽이 낮다.

### 클립보드 히스토리 · 스니펫 — 내장

별도 클립보드 앱(Maccy 등)이나 스니펫 앱을 띄우지 않아도 된다. Raycast에 기본 내장이라 **런처 하나로 검색 계층이 통합**된다. 이게 "진입 계층을 Raycast로 몰아준다"의 실질적 이득이다.

### Quicklink · Script Command — 검색형 실행

자주 여는 URL·경로·명령을 별칭으로 등록해두고 타이핑으로 실행한다. Hammerspoon의 물리 단축키와 목적이 겹쳐 보이지만, **진입 방식이 다르다** (아래에서 경계선을 정리한다).

## 3단계: Hammerspoon과 Raycast의 경계선

배치는 Hammerspoon, 검색은 Raycast로 갈랐지만, "앱을 띄운다" 같은 액션은 둘 다 할 수 있어 마지막 회색지대가 남는다. 경계선은 **진입 방식**으로 긋는다.

| 상황 | 도구 | 이유 |
|---|---|---|
| 손이 이미 키보드에 있고, **정해진 앱을 반사적으로** 토글 | **Hammerspoon** | 물리 단축키(`Cmd+Alt+T` → 터미널)가 무의식적 근육기억에 맞다 |
| **이름을 타이핑해서 찾아** 실행 (뭘 열지 매번 다름) | **Raycast** | 검색 UI가 후보를 좁혀준다 |
| 외부 서비스 조회·조작 (PR, 노션 페이지 등) | **Raycast** | 확장이 데이터를 가져온다 |
| 상태·조건이 붙는 자동화 (창 프레임 기억, 워크스페이스 훅) | **Hammerspoon** | 스크립트 런타임이 필요 |

한 문장으로: **"어느 키를 누를지 몸이 아는 것"은 Hammerspoon, "이름을 쳐서 찾는 것"은 Raycast**다. 이 기준으로 나누면 두 도구의 hotkey가 서로를 침범하지 않는다.

## 설정 관리: Cloud Sync가 정공법이다

마지막으로 실무적인 함정 하나. Raycast 설정을 dotfiles로 버전 관리하려는 시도는 대체로 헛수고다. **Raycast는 설정을 앱 내부 저장소에 보관**하고, 텍스트 설정 파일을 외부에 노출하지 않는다.

- 심링크로 dotfiles에 끌어오는 건 **도구가 의도하지 않은 우회**라, 앱 업데이트 때 깨지기 쉽다.
- 정공법은 **Raycast 자체의 Cloud Sync**로 설정·스니펫·Quicklink를 동기화하는 것이다.

그래서 dotfiles 쪽에는 **설치 정의 한 줄만** 남기는 게 맞다.

```ruby
# Brewfile
cask "raycast"
```

설정 이식은 Raycast에 맡기고, dotfiles는 "이 머신에 Raycast를 설치한다"는 사실만 추적한다. 도구가 제공하는 동기화 메커니즘을 억지로 파일로 우회하지 않는 것이 관리 비용을 낮춘다.

## 정리

세 도구가 겹쳐 보이는 건 전부 "단축키로 뭔가 한다"는 표면 때문이다. 축으로 나누면 겹침이 사라진다.

- **AeroSpace** → 공간(워크스페이스) 분할
- **Hammerspoon** → 화면 내 배치 + 조건·상태가 붙는 자동화 + 반사적 물리 단축키
- **Raycast** → 검색형 진입 계층 (앱·파일·확장·클립보드·스니펫). **창 관리 기능은 끈다.**

Raycast를 "또 하나의 단축키 도구"로 쓰면 Hammerspoon과 싸우기만 한다. **이름을 타이핑해 뭔가를 찾아 실행하는 검색 계층**으로 한정하는 것 — 그게 세 도구가 안 겹치는 유일한 배치다.

---

> **관련 글**
> - 런처 자체 선택: [macOS 생산성 런처 비교 (Spotlight vs Alfred vs Raycast)](/posts/macos/2025-10-31-productivity-launchers/)
> - 생산성 앱 전반: [macOS 생산성 앱 정리 (Raycast · Rectangle · BetterTouchTool)](/posts/macos/2025-12-29-mac-productivity-tool/)
> - 창 관리 축 실전: [AeroSpace + Hammerspoon 창 재정렬](/posts/macos/2026-07-03-aerospace-hammerspoon-window-reflow/), [Rectangle 대체 화면 분할](/posts/macos/2026-07-03-hammerspoon-window-tiling-rectangle/)
{: .prompt-info }
