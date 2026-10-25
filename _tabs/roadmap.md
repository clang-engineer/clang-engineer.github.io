---
layout: page
icon: fas fa-route
order: 1
title: 로드맵
---

각 Roadmap은 해당 영역의 **핵심 개념, 실제 관계, 필요한 상세 문서**를 연결하는 지도다. 순서대로 모든 글을 읽는 목차가 아니라, 전체 구조를 확인하고 필요한 주제에서만 상세 글로 내려간 뒤 다시 돌아오는 진입점이다.

문제 해결 기록과 도구 비교는 개념의 필수 학습 단계로 끼워 넣지 않고, 필요한 위치에서 연결한다.

개발환경 도구들은 하나의 필수 학습 순서로 이어지지 않는다. 아래 그림은 **운영체제, 명령 실행, 터미널 입출력, 작업공간 관리, 편집기**의 서로 다른 역할을 나타낸다.

```text
운영체제 (Linux / macOS 등)
  ├─ 프로세스·파일·권한·입출력 제공
  └─ 애플리케이션 실행 기반

명령 실행                     터미널 입출력
Shell ── 명령 실행·제어      Terminal Emulator ── 화면·키 입력
   │                                  │
   └────── PTY를 통한 상호작용 ────────┘
                  │
        tmux (선택적 세션·pane 관리)
                  │
        Neovim 등 터미널 애플리케이션
```

이 그림은 대표적인 대화형 사용 구성을 단순화한 것이다. Shell은 터미널 없이도 실행할 수 있고, Neovim도 tmux 없이 실행할 수 있다. tmux는 필수 계층이 아니다. macOS·dotfiles·키보드는 각각 운영체제 환경, 설정 재현, 입력 장치라는 별도 관점에서 살펴본다.

## 🖥️ 개발환경

### 개발 도구 전체 관계

에디터·터미널·멀티플렉서·에이전트 워크스페이스·코딩 에이전트의 역할과 대체·보완 관계 및 사용법은 [Devkit 도구 지도]({{ '/devkit/' | relative_url }})에서 탐색한다. 작동 원리와 학습 경로는 아래 개별 로드맵에서 다룬다.

### 시스템에서 터미널 애플리케이션까지

| 로드맵 | 무엇을 위한 지도인가 |
|------|------|
| [Linux](../_posts/linux/2026-07-11-linux-roadmap.md) | 서버에 접속 → 관측 → 계정·권한 → 서비스 → 로그로 이어지는 운영 흐름. Network·폐쇄망 등은 별도 Branch |
| [셸](../_posts/shell/2026-07-03-shell-roadmap.md) | Script 실행 모델 → Bash 해석·확장 → CLI 계약 → Process·Job·Session. 환경 재현과 tmux는 다른 Roadmap으로 넘김 |
| [Terminal](../_posts/terminal/2026-09-05-terminal-roadmap.md) | 물리 Terminal → Terminal Emulator·PTY → termios → ANSI/VT → terminfo → curses → 현대 TUI로 이어지는 입출력·렌더링 바닥 |
| [tmux](../_posts/tmux/2026-06-16-tmux-roadmap.md) | server/client와 session/window/pane 관계, 핵심 동작, 설정과 플러그인, 세션 관리 및 선택적 활용 |
| [Neovim](../_posts/neovim/2026-06-16-neovim-roadmap.md) | Vim/Neovim/Distro 계층 → 편집 기본기 → 최소 Lua → LazyVim 구조가 사용자 줄기. Plugin 개발·LSP/DAP는 별도 Branch |

### 개발환경을 구성하고 재현하는 다른 축

| 로드맵 | 무엇을 위한 지도인가 |
|------|------|
| [dotfiles](../_posts/shell/2026-07-08-dotfiles-roadmap.md) | Git 정본을 공통 기반으로, Home 배치(symlink·bare/yadm·chezmoi), Host별 값, Package 재현을 서로 다른 축으로 선택 |
| [macOS](../_posts/macos/2026-07-03-macos-roadmap.md) | System Setup · Launcher/Productivity · Window Management/Automation을 독립 문제축으로 탐색 |
| [키보드](../_posts/keyboard/2026-07-03-keyboard-roadmap.md) | 입력 습관 → Keymap 개념 → Firmware(QMK/ZMK) → ZMK 구현. VIA/Vial/ZMK Studio와 Karabiner는 다른 제어 계층으로 분리 |

## 🧠 기반 원리

| 로드맵 | 무엇을 위한 지도인가 |
|------|------|
| [Program Execution](../_posts/program-execution/2026-09-25-index.md) | 빌드·로딩·실행 경로와 ABI·Runtime·가상 메모리·시스템 호출의 횡단 관계 |

## 🔤 언어

| 로드맵 | 무엇을 위한 지도인가 |
|------|------|
| [모던 C++](../_posts/cpp/2026-07-03-cpp-learning-roadmap.md) | 객체·타입·수명, 추상화·표준 라이브러리, 동시성·예외, 프로그램 생성의 관계 |
| [Go](../_posts/go/2026-07-12-go-roadmap.md) | 프로그램 구성, 값·타입·인터페이스, 실패·동시성, Runtime과 도구 생태계의 관계 |
| [Rust](../_posts/rust/2026-07-12-rust-roadmap.md) | 값·타입, 소유권·빌림, 추상화·실패, 동시성·안전성 경계의 관계 |
