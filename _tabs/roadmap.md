---
layout: page
icon: fas fa-route
order: 1
title: 로드맵
---

흩어진 글을 "어떤 순서로 읽으면 되는지" 묶은 학습 지도 모음이다. 각 로드맵은 맨 위 **"한눈에 보기"** 표에서 현재 위치를 고른 뒤 그 지점부터 읽으면 된다. 트러블슈팅·도구 비교처럼 학습 줄기와 다른 내용은 **부록**으로 분리해 필요할 때 들어간다.

## 🖥️ 개발환경

| 로드맵 | 줄기 · 부록 |
|------|------|
| [Terminal](/posts/terminal/2026-09-05-terminal-roadmap/) | 터미널의 정체 → TTY/PTY → termios·raw mode → ANSI/VT → terminfo → curses → 현대 TUI → 실제 앱 구조까지, 도구들이 공통으로 기대는 터미널 바닥을 따라가는 줄기 |
| [Neovim](/posts/neovim/2026-06-16-neovim-roadmap/) | 편집 기본기 → 언어(Lua·Vimscript) → LazyVim 구조까지가 "잘 쓰는" 줄기. 플러그인 개발은 만들 사람만 타는 선택 갈림길 |
| [tmux](/posts/tmux/2026-06-16-tmux-roadmap/) | 구조·설치 → 옵션 → 플러그인 → 세션 부트스트랩까지 세션 관리 줄기. 트러블슈팅은 부록 |
| [셸](/posts/shell/2026-07-03-shell-roadmap/) | Script 실행 모델 → Bash 해석·문법 → CLI 계약 → Process·Job·Session이 줄기. dotfiles·direnv·zoxide·tmux는 별도 문제축으로 분리 |
| [dotfiles](/posts/shell/2026-07-08-dotfiles-roadmap/) | git+심링크로 모으기 → 설치도 선언적으로(Brewfile) → 머신 분기(심링크 vs chezmoi)까지 "설정을 코드로 재현" 줄기. 초기화·SSH·새 맥 셋업은 부록 |
| [macOS](/posts/macos/2026-07-03-macos-roadmap/) | 시스템 셋업 · 런처/생산성 · 창 관리/자동화를 세 독립 갈래로 탐색. 새 Mac에서는 셋업을 먼저 권장하지만 하나의 얕은→깊은 사다리로 보지 않음 |
| [Linux](/posts/linux/2026-07-11-linux-roadmap/) | 접속(배포판·SSH) → 관측(프로세스·모니터링·디스크) → 계정·권한(사용자·sudo·특수 비트·PAM) → 서비스(systemd) → 로그(수집·감사·회전)까지 서버를 운영하는 줄기. 네트워크·방화벽·폐쇄망은 부록 |
| [키보드](/posts/keyboard/2026-07-03-keyboard-roadmap/) | 세벌식·HHKB 배경 → 펌웨어 지형도 → ZMK로 내 키맵 직접 짜기까지 줄기. QMK·VIA/VIAL·Karabiner는 부록 |

## 🤖 AI

| 로드맵 | 줄기 · 부록 |
|------|------|
| [AI](/posts/ai/2026-07-03-ai-roadmap/) | 도구 선택·Claude Code 사용, 외부 연결(MCP), Application의 Model API 개발을 서로 다른 축으로 분리해 필요한 갈래만 Zoom-in |

## 🔤 언어

| 로드맵 | 줄기 · 부록 |
|------|------|
| [모던 C++](/posts/cpp/2026-07-03-cpp-learning-roadmap/) | 참조자·동적 할당 → 클래스·RAII → 이동 시맨틱·스마트 포인터 → STL → 템플릿 → 모던 문법 → 동시성 → 빌드(CMake)까지, 필수/나중/선택 우선순위로 정리 |
| [Go](/posts/go/2026-07-12-go-roadmap/) | 문법·모듈 → struct·interface → slice·map → error·defer → goroutine·channel·context → 표준 라이브러리·관용구 → 도구까지. C++ 대응은 발판으로만 쓰고 Go 고유 규칙을 줄기에 둠 |
| [Rust](/posts/rust/2026-07-12-rust-roadmap/) | 문법·불변성 → **소유권·빌림·수명** → struct·enum·match → 컬렉션 → trait·제네릭 → Result·Option → **반복자·클로저** → 스마트 포인터 → 동시성 → cargo. C++ RAII·이동은 이해의 발판으로 사용하되 Rust 소유권과 같은 의미론으로 등치하지 않음 |

## 🗄️ 데이터베이스

| 로드맵 | 줄기 · 부록 |
|------|------|
| [DB](/posts/db/2026-07-03-db-roadmap/) | 설계·DBMS 동시성 구현·Query 성능·운영·분산 Practice를 질문별로 탐색. 트랜잭션·인덱스 같은 일반 개념 정본은 정보관리기술사 Knowledge에 둠 |
