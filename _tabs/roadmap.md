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
| [셸](/posts/shell/2026-07-03-shell-roadmap/) | 동작 원리 → 문법 → 실전 관용구로 스크립트 직접 짜기까지 줄기. 환경 관리·일상 속도·원격은 부록 |
| [dotfiles](/posts/shell/2026-07-08-dotfiles-roadmap/) | git+심링크로 모으기 → 설치도 선언적으로(Brewfile) → 머신 분기(심링크 vs chezmoi)까지 "설정을 코드로 재현" 줄기. 초기화·SSH·새 맥 셋업은 부록 |
| [macOS](/posts/macos/2026-07-03-macos-roadmap/) | 시스템 운영(새 맥·Brewfile) → 런처(Raycast) → 창 관리(AeroSpace·Hammerspoon)까지 macOS를 개발환경으로 다듬는 인덱스 |
| [Linux](/posts/linux/2026-07-11-linux-roadmap/) | 접속(배포판·SSH) → 관측(프로세스·모니터링·디스크) → 계정·권한(사용자·sudo·특수 비트·PAM) → 서비스(systemd) → 로그(수집·감사·회전)까지 서버를 운영하는 줄기. 네트워크·방화벽·폐쇄망은 부록 |
| [키보드](/posts/keyboard/2026-07-03-keyboard-roadmap/) | 세벌식·HHKB 배경 → 펌웨어 지형도 → ZMK로 내 키맵 직접 짜기까지 줄기. QMK·VIA/VIAL·Karabiner는 부록 |

## 🤖 AI

| 로드맵 | 줄기 · 부록 |
|------|------|
| [AI](/posts/ai/2026-07-03-ai-roadmap/) | 도구 지형도 → 매일 쓰기·실전 확장 → MCP로 외부 연결 → Claude API까지, AI 코딩 도구를 워크플로에 들이는 순서 |

## 🔤 언어

| 로드맵 | 줄기 · 부록 |
|------|------|
| [모던 C++](/posts/cpp/2026-07-03-cpp-learning-roadmap/) | 참조자·동적 할당 → 클래스·RAII → 이동 시맨틱·스마트 포인터 → STL → 템플릿 → 모던 문법 → 동시성 → 빌드(CMake)까지, 필수/나중/선택 우선순위로 정리 |
| [Go](/posts/go/2026-07-12-go-roadmap/) | 문법·모듈 → struct·interface → slice·map → error·defer → goroutine·channel·context → 표준 라이브러리·관용구 → 도구까지. C++ 대응은 발판으로만 쓰고 Go 고유 규칙을 줄기에 둠 |
| [Rust](/posts/rust/2026-07-12-rust-roadmap/) | 문법·불변성 → **소유권·빌림·수명** → struct·enum·match → 컬렉션 → trait·제네릭 → Result·Option → **반복자·클로저** → 스마트 포인터 → 동시성 → cargo. C++ RAII·이동은 이해의 발판으로 사용하되 Rust 소유권과 같은 의미론으로 등치하지 않음 |

## 🗄️ 데이터베이스

| 로드맵 | 줄기 · 부록 |
|------|------|
| [DB](/posts/db/2026-07-03-db-roadmap/) | 트랜잭션·조인·옵티마이저 원리 → 정규화·파티셔닝·캐싱 성능 설계 → PostgreSQL 운영 → CAP 분산 이론까지 줄기. 연동·장애 트러블슈팅은 부록 |

## 🧩 CS·설계

| 로드맵 | 줄기 · 부록 |
|------|------|
| [프로그래밍 언어 개념](/posts/concept/2026-07-13-concept-roadmap/) | 안전과 실패 → 메모리·값·불변 → 함수·실행·상태 → 타입 추상화와 디스패치의 네 축. C++을 발판으로 쓰되 각 언어에서 의미론이 갈라지는 지점을 함께 봄 |
| [디자인 패턴](/posts/design-pattern/2026-06-19-roadmap/) | GoF 23개 패턴을 생성·구조·행위로 나눠 쉬운 것부터 쌓는 순서. 헷갈리는 쌍은 참고 부록 |
