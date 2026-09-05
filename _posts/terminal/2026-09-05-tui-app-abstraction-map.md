---
title       : "실제 TUI 앱은 어느 추상화 계층에 서 있나 — fzf부터 OpenCode까지"
description : "fzf, btop, lazygit, Yazi, Harlequin, OpenCode, Neovim을 실제 구현 선택 기준으로 비교해 자체 렌더러, 중간 라이브러리, 고수준 프레임워크의 차이를 정리한다."
date        : 2026-09-05 15:10:00 +0900
updated     : 2026-09-05 18:03:00 +0900
categories  : [terminal]
tags        : [tui, fzf, btop, lazygit, yazi, harlequin, opencode, neovim, architecture]
pin         : false
hidden      : false
---

프레임워크 목록만 보면 TUI 앱이 다 비슷하게 만들어질 것 같지만 실제로는 그렇지 않다.

같은 전체 화면(Full-screen) 터미널 UI라도 어떤 프로그램은 터미널 제어를 꽤 직접 다루고, 어떤 프로그램은 중간 수준의 TUI 라이브러리를 쓰고, 어떤 프로그램은 컴포넌트 프레임워크 위에서 만들어진다.

이 차이를 **추상화 계층 지도**에 꽂아보면 훨씬 잘 보인다.

```text
고수준 컴포넌트 프레임워크
  ├─ Textual
  └─ OpenTUI React/Solid

애플리케이션/TUI 라이브러리
  ├─ gocui
  └─ Ratatui 계열

자체 TUI 엔진
  ├─ fzf
  ├─ btop
  └─ Neovim 내장 TUI

터미널 Capability / Escape Sequence

PTY / termios
```

## 한눈에 보기

| 앱 | 주요 언어 | UI 접근 | 대략적인 추상화 위치 |
|---|---|---|---|
| fzf | Go | 자체 TUI 계층 + 렌더러 backend | 낮음~중간 |
| btop | C++ | 자체 터미널 UI 엔진 | 낮음 |
| lazygit | Go | 프로젝트 내부 gocui 기반 | 중간 |
| Yazi | Rust | Rust TUI 생태계 + 비동기 아키텍처 | 중간 |
| Harlequin | Python | Textual | 높음 |
| OpenCode | TypeScript | OpenTUI/Solid | 매우 높음 |
| Neovim | C | 내장 TUI + UI protocol | 자체 플랫폼 |

중요한 것은 언어가 아니라 **어떤 추상화를 직접 소유하느냐**다.

## fzf — 작고 빠른 도구가 자체 TUI 계층을 가진 경우

`fzf`는 Go 프로그램이지만 Bubble Tea 위에서 만들어진 앱은 아니다.

소스에는 자체 터미널 UI 계층이 있고, 렌더러 추상화도 별도로 존재한다.

현재 구조에는 기본적인 light renderer와 tcell 기반 renderer 경로가 있다.

단순화하면:

```text
fzf 핵심 검색 상태
       ↓
터미널 / 창 추상화
       ↓
렌더러 인터페이스
   ├─ light renderer
   └─ tcell renderer
       ↓
터미널
```

즉 `fzf`는 "Go니까 Bubble Tea" 같은 구조가 아니다.

자신의 요구사항에 맞는 UI·이벤트·렌더링 계층을 프로젝트 안에 직접 갖고 있다.

왜 이런 선택을 했는지 생각해보면 자연스럽다.

`fzf`의 핵심 요구사항은:

```text
매우 빠른 시작
대량 후보의 실시간 필터링
빠른 다시 그리기
작은 바이너리
특수한 미리보기/레이아웃 동작
```

같은 데 있다.

범용 애플리케이션 프레임워크보다 자신의 작업 특성에 맞춘 렌더링과 제어가 중요하다.

## btop — UI 자체가 제품의 핵심인 자체 엔진

`btop`은 C++ 기반 시스템 모니터다.

그래프, meter, process list, mouse, resize, color 등 복잡한 터미널 UI를 자체 코드에서 깊게 다룬다.

```text
시스템 지표 수집기
       ↓
애플리케이션 상태
       ↓
자체 그리기/입력 코드
       ↓
ANSI/터미널 제어
       ↓
터미널
```

이런 모니터링 도구는 주기적으로 많은 셀을 갱신하면서 성능과 시각 표현을 세밀하게 제어해야 한다.

따라서 범용 고수준 프레임워크보다 프로젝트 전용 렌더링 경로를 갖는 선택이 충분히 자연스럽다.

`btop --tty`처럼 터미널 capability에 따라 표현 수준을 조절하는 옵션이 존재하는 것도 이 계층을 직접 다룬다는 감각을 보여준다.

## lazygit — 애플리케이션과 TUI 라이브러리 사이의 전형적인 분리

`lazygit`은 Go 기반이지만 현재 Bubble Tea 앱이 아니다.

프로젝트 내부에서 유지하는 `gocui` 계층이 UI 이벤트 루프, 키 입력, View 렌더링을 담당한다.

```text
Git 도메인 로직
      ↓
Lazygit controller / context / presentation
      ↓
gocui
      ↓
터미널
```

여기서 `View`가 중요한 추상화다.

```text
Branches View
Files View
Commits View
Main View
Popup View
```

같이 애플리케이션 화면을 영역으로 나눈 뒤 각 영역에 내용을 채운다.

즉 lazygit은 터미널 escape code부터 직접 만들지는 않지만, Textual/OpenTUI 같은 컴포넌트 프레임워크보다 훨씬 애플리케이션에 가까운 TUI 라이브러리를 사용한다.

## Yazi — TUI뿐 아니라 비동기 런타임 구조가 중요한 경우

Yazi는 Rust로 작성된 파일 관리자이고 non-blocking async I/O를 핵심 특징으로 내세운다.

파일 관리자는 UI 렌더링보다도:

```text
파일 시스템 탐색
미리보기 로딩
이미지 디코딩
Metadata
검색
플러그인
백그라운드 작업
```

같은 작업이 동시에 진행된다.

따라서 구조를 단순히 "Rust TUI"로만 보면 중요한 부분을 놓친다.

```text
비동기 작업 / 파일 시스템
          ↓
애플리케이션 상태
          ↓
TUI 렌더링
          ↓
터미널
```

Yazi가 빠르게 느껴지는 이유도 렌더러 하나보다 **비동기 I/O와 작업 스케줄링을 포함한 전체 애플리케이션 아키텍처**에 있다.

그리고 터미널 이미지 protocol까지 지원하기 때문에 문자 셀만 다루는 전통적인 TUI보다 터미널 capability 영역도 넓다.

## Harlequin — 고수준 프레임워크가 잘 맞는 IDE형 TUI

Harlequin은 Python 기반 SQL IDE이며 Textual을 사용한다.

SQL IDE에는 다음이 필요하다.

```text
Data Catalog 트리
Query Editor
결과 Table
Dialog
Tab
Focus
키보드 탐색
비동기 DB Query
```

이런 UI는 저수준 렌더러보다 **Widget/애플리케이션 프레임워크**가 훨씬 중요하다.

그래서 구조가 자연스럽게:

```text
Harlequin 도메인/앱 로직
         ↓
Textual Widget / Message / Layout
         ↓
Textual 렌더러/런타임
         ↓
터미널
```

로 내려간다.

Harlequin이 특정 DB adapter를 plugin으로 붙이는 구조까지 생각하면 고수준 애플리케이션 프레임워크 선택이 더 잘 이해된다.

## OpenCode — 웹 프론트엔드에 가까운 TUI

OpenCode의 현재 TUI는 OpenTUI 계열 위에 있다.

OpenTUI 자체가:

```text
Zig native core
TypeScript binding
컴포넌트/Renderable 트리
Flexbox 레이아웃
입력
셀 차이 렌더러
React/Solid binding
```

을 제공한다.

OpenCode 쪽에서도 `@opentui/core`, `@opentui/keymap`, `@opentui/solid` 타입과 API를 직접 사용한다.

구조를 단순화하면:

```text
OpenCode 세션/앱 상태
          ↓
Solid 컴포넌트
          ↓
OpenTUI Renderable / Layout / Keymap
          ↓
Zig native renderer
          ↓
터미널
```

이건 우리가 처음 이야기했던 "TypeScript로 터미널 앱을 만든다"가 가능한 이유를 잘 보여준다.

터미널 제어는 native core 아래로 내려가고 개발자는 컴포넌트와 상태를 중심으로 작업한다.

## Neovim — 앱이면서 동시에 UI 플랫폼

Neovim은 다른 사례와 조금 다르다.

자체 내장 TUI가 있지만 Editor Core와 UI protocol이 분리되어 있다.

```text
Neovim Core
      ↓ UI 이벤트
UI Protocol
  ├─ 내장 TUI
  └─ 외부 GUI
```

그리고 내장 TUI 위에서 끝나는 것도 아니다.

Neovim 내부 API가 다시 플러그인용 UI 플랫폼이 된다.

```text
터미널
   ↑
Neovim 내장 TUI
   ↑
Window / Buffer / Highlight API
   ↑
vim.ui / nui.nvim / Snacks
   ↑
플러그인
   ↑
LazyVim
```

즉 자체 TUI 엔진이 **다른 UI 추상화의 기반 플랫폼**으로 다시 사용되는 사례다.

이건 별도 글에서 더 깊게 본다.

## 프레임워크를 안 쓰는 것이 낡은 방식은 아니다

여기서 중요한 결론이 있다.

```text
자체 렌더러 = 구식
고수준 프레임워크 = 최신
```

으로 보면 안 된다.

유명하고 오래 살아남은 도구가 자체 계층을 유지하는 이유는 대개 분명하다.

```text
성능 요구
시작 비용
바이너리 크기
특수한 레이아웃
기존 코드베이스
터미널 예외 상황 제어
앱 자체가 프레임워크보다 먼저 존재
```

반대로 새롭고 복잡한 애플리케이션을 빠르게 만들려면 프레임워크가 주는 추상화 가치가 크다.

## 앱의 성격과 추상화 선택

대략 이런 패턴이 보인다.

### 단일 목적 + 극한 반응성

```text
fzf
btop
```

→ 자체/저수준 제어가 강함

### 복잡한 도메인 + 패널형 UI

```text
lazygit
Yazi
```

→ 중간 수준 TUI 추상화 + 앱 자체 아키텍처

### IDE형 복잡 UI

```text
Harlequin
OpenCode
```

→ 고수준 컴포넌트/애플리케이션 프레임워크가 유리

### 플랫폼 자체

```text
Neovim
```

→ 자체 UI 엔진 + 외부/플러그인 UI 추상화

## 같은 TUI인데 완전히 다른 스택

최종적으로 이렇게 비교할 수 있다.

```text
fzf
앱 → 자체 TUI 렌더러 → 터미널

lazygit
앱 → gocui → 터미널

Harlequin
앱 → Textual → 터미널

OpenCode
앱 → Solid → OpenTUI → Zig 렌더러 → 터미널

Neovim
Editor Core → UI Protocol → 내장 TUI → 터미널
                         ↑
                      플러그인
```

화면만 보면 다 "터미널 앱"이지만 내부 추상화 스택은 꽤 다르다.

이 관점이 생기면 새로운 TUI를 볼 때도:

> 이 앱은 어느 계층을 직접 구현했을까?

라는 질문부터 할 수 있다.

## 다음 단계 — Neovim을 별도로 뜯어보기

다음에는 Neovim을 좀 더 깊게 본다.

특히:

```text
왜 Editor Core와 TUI가 분리됐는지
UI Protocol은 무엇인지
외부 GUI는 어떻게 붙는지
플러그인 UI API는 어느 층인지
LazyVim은 왜 TUI 계층이 아닌지
```

를 하나의 스택으로 정리한다.

## 참고

- fzf source — 자체 `src/tui` 렌더러 추상화
- lazygit codebase guide — 프로젝트 내부 gocui가 이벤트 루프, 키 입력, 렌더링 담당
- Yazi — Rust + non-blocking async I/O 아키텍처
- Harlequin — Python/Textual 기반 SQL IDE
- OpenTUI/OpenCode — native Zig core + TypeScript/Solid integration
- Neovim UI protocol / 내장 TUI 문서
