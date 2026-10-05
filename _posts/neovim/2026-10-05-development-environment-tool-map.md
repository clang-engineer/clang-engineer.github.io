---
title       : "Neovim 밖의 개발 환경 도구 지도 — 편집기·터미널·CLI를 한눈에"
description : "Neovim을 기준점으로 Helix·Zed·Sublime Text, Ghostty·Kitty·Alacritty, fish·tmux, fzf·bat·btop, lazygit·Yazi까지 개발 환경 도구를 역할별로 정리한다."
date        : 2026-10-05 17:10:00 +0900
updated     : 2026-10-05 17:10:00 +0900
categories  : [neovim, "플러그인·생태계"]
tags        : [editor, helix, zed, terminal, shell, cli, lazygit, yazi, developer-tools]
pin         : false
hidden      : false
---

Neovim을 오래 쓰다 보면 에디터 자체보다 주변 도구가 더 눈에 들어오기 시작한다. Helix나 Zed처럼 편집 방식을 다시 설계한 에디터도 있고, Ghostty·Kitty 같은 터미널 에뮬레이터, fish·tmux 같은 셸/세션 도구, fzf·bat·lazygit·Yazi 같은 CLI 도구도 있다.

이들을 한 줄에 놓고 비교하면 역할이 섞인다. **에디터, 터미널, 셸, 세션 관리자, CLI 유틸리티, VCS UI는 서로 다른 레이어**다. 이 글은 Neovim을 기준점으로 각 도구가 개발 환경의 어디에 놓이는지 정리한다.

## 전체 지도

```text
Development Environment
├─ Editor
│  ├─ Neovim
│  ├─ Emacs
│  ├─ Helix
│  ├─ Zed
│  └─ Sublime Text
│
├─ Terminal Emulator
│  ├─ Ghostty
│  ├─ Kitty
│  ├─ Alacritty
│  ├─ foot
│  ├─ iTerm
│  └─ Windows Terminal
│
├─ Shell
│  └─ fish
│
├─ Terminal Multiplexer
│  └─ tmux
│
├─ CLI Utilities
│  ├─ fzf
│  ├─ bat
│  └─ btop
│
├─ Version Control UI
│  └─ lazygit
│
├─ File / Document
│  ├─ Yazi
│  └─ Zathura
│
└─ Development Platform / Browser
   ├─ Gitea
   └─ qutebrowser
```

핵심은 **대체 관계와 조합 관계를 구분하는 것**이다.

- Neovim ↔ Helix ↔ Zed ↔ Emacs는 같은 **편집기 레이어**에서 비교할 수 있다.
- Ghostty ↔ Kitty ↔ Alacritty는 같은 **터미널 에뮬레이터 레이어**다.
- fish는 셸이고 tmux는 멀티플렉서라 서로 직접 대체하는 관계가 아니다.
- lazygit은 Git 자체가 아니라 **Git을 조작하는 TUI**다.
- Yazi는 파일 관리자이므로 Neovim과 경쟁하기보다 함께 쓰는 도구다.

## 편집기

### Neovim — 조합하는 모달 편집기

Neovim은 Vim 계열의 모달 편집기다. Lua API, libuv 기반 비동기 처리, LSP·Treesitter 같은 현대 개발 기능을 중심으로 생태계가 확장됐다.

Neovim의 특징은 완성된 IDE라기보다 **작은 코어 위에 원하는 구성 요소를 조립하는 플랫폼**에 가깝다는 점이다.

```text
Neovim
├─ LSP
├─ Treesitter
├─ fuzzy finder
├─ completion
├─ debugger
└─ plugins
```

이 때문에 자유도가 높지만 설정과 생태계를 이해해야 하는 비용도 있다.

### Helix — 모달 편집을 다시 설계

Helix는 Kakoune과 Neovim에서 영향을 받은 현대적인 모달 편집기다. Vim의 명령 문법을 그대로 복제하기보다 **selection-first** 방식으로 편집 흐름을 다시 구성했다.

Neovim과 비교하면 차이가 선명하다.

| | Neovim | Helix |
|---|---|---|
| 편집 철학 | Vim 계열 operator → motion | selection → action |
| 확장 방식 | 매우 큰 플러그인 생태계 | 기본 기능 중심 |
| 설정 | Lua 중심 | TOML 중심 |
| LSP / Treesitter | 코어 + 생태계 | 기본 통합 성격이 강함 |
| 성격 | 조립형 플랫폼 | 완성도 높은 현대적 modal editor |

따라서 Helix는 "Neovim 플러그인 하나"가 아니라 **Neovim 자체와 같은 레이어의 다른 편집기**다.

### Zed — 네이티브 GUI 코드 편집기

Zed는 Rust로 작성된 미니멀 코드 편집기로, 속도와 실시간 협업을 핵심에 둔다. 현재는 LSP, DAP, Git, 원격 개발, AI 에이전트 기능까지 편집기 안으로 적극 통합하고 있다.

Neovim과의 차이는 "빠르냐 느리냐"보다 **통합 방향**에 있다.

```text
Neovim
작은 코어
  ↓
필요한 기능을 플러그인으로 조합

Zed
네이티브 GUI
  ↓
개발 기능·협업·AI를 편집기 안에 통합
```

Zed에는 Vim/Helix 스타일 모달 편집 지원도 있어서, 모달 편집 습관을 유지하면서 GUI 편집기를 쓰고 싶은 경우 비교 대상이 된다.

### Emacs — 에디터보다 런타임에 가까운 환경

Emacs는 같은 편집기 레이어에 있지만 방향은 더 독특하다. Elisp 런타임 위에서 편집기뿐 아니라 Git, 메일, 노트, 일정 같은 작업 환경 전체를 구성한다.

Neovim 관점에서 Emacs의 구조는 별도 글에서 정리했다.

- [LazyVim 사용자가 본 Emacs — 에디터가 아니라 Elisp 런타임](./2026-07-03-neovim-user-view-of-emacs.md)

### Sublime Text — 빠르고 완성된 전통적 GUI 편집기

Sublime Text는 코드·마크업·일반 텍스트를 위한 GUI 텍스트 편집기다. Neovim이나 Helix처럼 modal editing이 정체성인 편집기도 아니고, Zed처럼 협업/AI를 중심으로 재설계된 편집기도 아니다.

대신 빠른 실행과 반응성, 안정적인 GUI 편집 경험이라는 전통적인 강점이 있다.

## 터미널 에뮬레이터

터미널 에뮬레이터는 Neovim, fish, tmux 같은 프로그램이 **실제로 화면에 출력되는 창**을 제공한다.

```text
Terminal Emulator
      ↓
     Shell
      ↓
 tmux / CLI
      ↓
   Neovim
```

이 구조를 알면 "Kitty와 fish 중 무엇을 쓸까?" 같은 비교가 잘못된 질문이라는 게 보인다. 둘은 동시에 사용한다.

### Ghostty

Ghostty는 Zig로 작성된 빠른 크로스 플랫폼 터미널 에뮬레이터다. 네이티브 UI와 GPU 가속을 사용하고, 별도 설정 없이도 바로 쓸 수 있는 환경을 지향한다.

### Kitty

Kitty는 GPU 가속과 풍부한 기능을 갖춘 터미널 에뮬레이터다. 이미지 프로토콜, 탭/윈도 관리 등 터미널 자체 기능을 적극적으로 확장한다.

### Alacritty

Alacritty는 GPU 가속을 사용하는 크로스 플랫폼 터미널 에뮬레이터다. 상대적으로 터미널 자체 기능을 크게 늘리기보다 **빠르고 단순한 터미널**이라는 방향이 강하다.

### foot

foot는 Wayland 환경을 위한 가볍고 빠른 터미널 에뮬레이터다. Linux + Wayland 환경에서 특히 자연스럽다.

### iTerm / Windows Terminal

- **iTerm2**: macOS에서 널리 쓰이는 터미널 에뮬레이터
- **Windows Terminal**: Windows에서 PowerShell, WSL, Command Prompt 등을 한 UI에서 다루는 터미널

운영체제에 밀접한 기본 선택지라는 점에서 같은 위치에 놓을 수 있다.

## 셸과 세션

### fish — 셸

fish는 명령어를 해석하고 실행하는 **셸**이다. 자동완성, syntax highlighting 등 대화형 사용성을 기본 제공하는 쪽에 초점을 둔다.

```text
Terminal Emulator
  └─ fish
      ├─ git
      ├─ fzf
      ├─ nvim
      └─ tmux
```

### tmux — 터미널 멀티플렉서

tmux는 셸이 아니라 **터미널 세션을 분할하고 유지하는 프로그램**이다.

```text
Terminal
  ↓
tmux
├─ pane: nvim
├─ pane: shell
└─ pane: server log
```

SSH 연결이 끊겨도 세션을 유지하거나, 한 터미널 안에서 여러 작업을 동시에 다루는 데 사용한다.

## CLI 생산성 도구

### fzf — 범용 fuzzy finder

fzf는 텍스트 목록에서 원하는 항목을 빠르게 찾는 범용 fuzzy finder다.

파일 검색뿐 아니라 Git branch, process, command history 등 **문자열 목록이면 무엇이든 선택 UI로 바꿀 수 있다.**

```text
find / git / history / process list
              ↓
             fzf
              ↓
         선택된 항목
```

Neovim의 Telescope나 fzf-lua도 이와 비슷한 탐색 경험을 에디터 안으로 가져온다.

### bat — cat의 현대적 대안

bat은 파일 내용을 출력하는 `cat` 계열 도구지만 syntax highlighting, line number, Git 변경 표시 같은 개발자 편의 기능을 제공한다.

단순한 대체 관계로 보면:

```text
cat → bat
```

### btop — 시스템 리소스 모니터

btop은 CPU, 메모리, 디스크, 프로세스 등을 터미널에서 시각적으로 모니터링한다. 편집 도구라기보다 개발 중 시스템 상태를 확인하는 운영 도구에 가깝다.

## Git과 파일 관리

### lazygit — Git의 TUI

lazygit은 Git 명령을 터미널 UI로 조작하게 해주는 도구다.

중요한 계층은 다음과 같다.

```text
Git
├─ git CLI
└─ lazygit
```

즉 lazygit은 Git과 경쟁하는 VCS가 아니다. 같은 Git repository를 다른 인터페이스로 조작한다.

Jujutsu를 사용하는 `jjui`와 비교하면 UI 레이어는 비슷하지만 밑의 VCS가 다르다.

```text
Git            Jujutsu
├─ git         ├─ jj
└─ lazygit     └─ jjui
```

### Yazi — 터미널 파일 관리자

Yazi는 터미널 안에서 파일을 탐색·선택·이동하는 파일 관리자다.

```text
Shell
 ├─ cd / ls
 └─ Yazi
      ↓
   파일 선택
      ↓
   Neovim
```

따라서 Neovim의 파일 탐색 플러그인과 일부 기능은 겹치지만, 에디터 바깥의 파일 시스템까지 다루는 독립 도구라는 차이가 있다.

### Zathura — 문서 뷰어

Zathura는 키보드 중심의 가벼운 문서 뷰어다. PDF 등 문서를 자주 참조하면서 터미널 중심 환경을 쓰는 경우 개발 환경 주변 도구로 함께 배치할 수 있다.

## 개발 플랫폼과 브라우저

### Gitea

Gitea는 Git repository를 웹으로 호스팅하고 issue, pull request, 사용자 관리 등을 제공하는 자체 호스팅 개발 플랫폼이다.

이쪽은 `git`이나 `lazygit`과 같은 로컬 도구가 아니라 GitHub/GitLab과 비슷한 **서버 측 레이어**다.

```text
Developer
   ↓
git / lazygit
   ↓
Git repository
   ↓
Gitea / GitHub / GitLab
```

### qutebrowser

qutebrowser는 키보드 중심으로 조작하는 브라우저다. Vim 계열 키 조작을 브라우저까지 확장하고 싶은 사람에게 특히 잘 맞는다.

## 무엇부터 볼까

Neovim 사용자의 관점에서는 전부 설치할 필요가 없다. **현재 사용 중인 도구의 한 레이어씩 비교**하면 된다.

| 현재 관심 | 비교해볼 도구 |
|---|---|
| Neovim 자체가 궁금함 | Helix |
| GUI 에디터도 궁금함 | Zed |
| 에디터를 작업환경 전체로 확장하고 싶음 | Emacs |
| 터미널을 바꾸고 싶음 | Ghostty / Kitty / Alacritty |
| 셸 UX가 불편함 | fish |
| 터미널 세션 관리 | tmux |
| 검색/선택을 빠르게 | fzf |
| Git 명령이 번거로움 | lazygit |
| 터미널 파일 탐색 | Yazi |

개인적으로 가장 흥미로운 순서는 **Helix → Zed → Ghostty → Yazi**다. 네 도구를 통째로 바꾸기보다, 기존 Neovim 환경과 무엇이 같은 레이어이고 무엇이 조합되는 레이어인지 비교하면서 보면 새로운 도구의 설계 의도가 훨씬 잘 보인다.

## 정리

개발 환경은 하나의 프로그램이 아니라 여러 레이어가 쌓인 구조다.

```text
Editor              Neovim / Helix / Zed / Emacs
Terminal Emulator   Ghostty / Kitty / Alacritty
Shell               fish
Session             tmux
CLI                 fzf / bat / btop
VCS UI              lazygit
File Manager        Yazi
Hosting             Gitea
```

따라서 새로운 도구를 발견했을 때 가장 먼저 물어볼 질문은 **"이게 무엇을 대체하는가?"보다 "어느 레이어에 있는가?"** 다.

그 위치가 보이면 기존 도구와 경쟁하는지, 아니면 함께 조합하는 도구인지도 자연스럽게 정리된다.
