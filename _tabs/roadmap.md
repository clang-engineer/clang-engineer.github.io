---
layout: page
icon: fas fa-route
order: 1
title: 로드맵
---

흩어진 글을 **전체 지형·관계·권장 진입 순서**로 묶은 학습 지도 모음이다. 모든 글을 순서대로 읽는 목차가 아니라, 각 Roadmap의 `한눈에 보기`에서 현재 문제에 맞는 줄기나 Branch를 골라 Zoom-in한다.

Troubleshooting·Tool·Comparison처럼 핵심 학습 경로와 역할이 다른 문서는 단계에 억지로 넣지 않고 별도 Branch나 Appendix로 둔다.

## 🖥️ 개발환경

| 로드맵 | 무엇을 위한 지도인가 |
|------|------|
| [Terminal](../_posts/terminal/2026-09-05-terminal-roadmap.md) | TTY/PTY → termios → ANSI/VT → terminfo → curses → 현대 TUI로 이어지는 터미널 입출력·렌더링 바닥 |
| [Neovim](../_posts/neovim/2026-06-16-neovim-roadmap.md) | Vim/Neovim/Distro 계층 → 편집 기본기 → 최소 Lua → LazyVim 구조가 사용자 줄기. Plugin 개발·LSP/DAP는 별도 Branch |
| [tmux](../_posts/tmux/2026-06-16-tmux-roadmap.md) | session/window/pane 구조 → 설정 → Plugin 사용 → 필요할 때 Session workflow. Plugin 제작·AI 관제·피커는 선택 Branch |
| [셸](../_posts/shell/2026-07-03-shell-roadmap.md) | Script 실행 모델 → Bash 해석·확장 → CLI 계약 → Process·Job·Session. 환경 재현과 tmux는 다른 Roadmap으로 넘김 |
| [dotfiles](../_posts/shell/2026-07-08-dotfiles-roadmap.md) | Git 정본을 공통 기반으로, Home 배치(symlink·bare/yadm·chezmoi), Host별 값, Package 재현을 서로 다른 축으로 선택 |
| [macOS](../_posts/macos/2026-07-03-macos-roadmap.md) | System Setup · Launcher/Productivity · Window Management/Automation을 독립 문제축으로 탐색 |
| [Linux](../_posts/linux/2026-07-11-linux-roadmap.md) | 서버에 접속 → 관측 → 계정·권한 → 서비스 → 로그로 이어지는 운영 흐름. Network·폐쇄망 등은 별도 Branch |
| [키보드](../_posts/keyboard/2026-07-03-keyboard-roadmap.md) | 입력 습관 → Keymap 개념 → Firmware(QMK/ZMK) → ZMK 구현. VIA/Vial/ZMK Studio와 Karabiner는 다른 제어 계층로 분리 |

## 🤖 AI

| 로드맵 | 무엇을 위한 지도인가 |
|------|------|
| [AI](../_posts/ai/2026-07-03-ai-roadmap.md) | AI Coding Tool 사용, 외부 연결(MCP), Application의 Model API 개발, Web Surface를 서로 다른 축으로 분리 |

## 🔤 언어

| 로드맵 | 무엇을 위한 지도인가 |
|------|------|
| [모던 C++](../_posts/cpp/2026-07-03-cpp-learning-roadmap.md) | compile/link 모델을 바닥에 두고 객체 수명 → RAII → move/ownership 표현 → STL·lambda → template·modern language로 진행. CMake·동시성은 Branch |
| [Go](../_posts/go/2026-07-12-go-roadmap.md) | package/module → struct/interface → core data types → explicit error flow → concurrency → idiom. Tooling은 전 과정에 걸친 축 |
| [Rust](../_posts/rust/2026-07-12-rust-roadmap.md) | ownership·borrow·lifetime을 중심으로 data model → failure → trait/generic → iterator/closure를 연결. Cargo·concurrency·smart pointer는 역할별 Branch |
