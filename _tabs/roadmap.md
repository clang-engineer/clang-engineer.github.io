---
layout: page
icon: fas fa-route
order: 1
title: 로드맵
---

흩어진 글을 "어떤 순서로 읽으면 되는지" 묶은 학습 지도 모음. 각 로드맵은 맨 위 **"한눈에 보기"** 표에서 본인 위치를 고른 뒤 그 지점부터 읽으면 되고, 트러블슈팅·도구 비교 같은 곁가지는 **부록**으로 빼 두었으니 필요할 때만 들어가면 됩니다.

## 🖥️ 개발환경

| 로드맵 | 줄기 · 부록 |
|------|------|
| [Neovim](/posts/neovim/2026-06-16-neovim-roadmap/) | 편집 기본기 → 언어(Lua·Vimscript) → LazyVim 구조까지가 "잘 쓰는" 줄기. 플러그인 개발은 만들 사람만 타는 선택 갈림길 |
| [tmux](/posts/tmux/2026-06-16-tmux-roadmap/) | 구조·설치 → 옵션 → 플러그인 → 세션 부트스트랩까지 세션 관리 줄기. 트러블슈팅은 부록 |
| [셸](/posts/shell/2026-07-03-shell-roadmap/) | 동작 원리 → 문법 → 실전 관용구로 스크립트 직접 짜기까지 줄기. 환경 관리·일상 속도·원격은 부록 |
| [dotfiles](/posts/shell/2026-07-08-dotfiles-roadmap/) | git+심링크로 모으기 → 설치도 선언적으로(Brewfile) → 머신 분기(심링크 vs chezmoi)까지 "설정을 코드로 재현" 줄기. 초기화·SSH·새 맥 셋업은 부록 |
| [macOS](/posts/macos/2026-07-03-macos-roadmap/) | 시스템 운영(새 맥·Brewfile) → 런처(Raycast) → 창 관리(AeroSpace·Hammerspoon)까지 macOS를 개발환경으로 다듬는 인덱스 |
| [Linux](/posts/linux/2026-07-11-linux-roadmap/) | 접속(배포판·SSH) → 관측(프로세스·모니터링·디스크) → 계정·권한(사용자·sudo·특수 비트·PAM) → 서비스(systemd) → 로그(수집·감사·회전)까지 서버를 운영하는 줄기. 네트워크·방화벽·폐쇄망은 부록 |
| [키보드](/posts/etc/2026-07-03-keyboard-roadmap/) | 세벌식·HHKB 배경 → 펌웨어 지형도 → ZMK로 내 키맵 직접 짜기까지 줄기. QMK·VIA/VIAL·Karabiner는 부록 |

## 🤖 AI

| 로드맵 | 줄기 · 부록 |
|------|------|
| [AI](/posts/ai/2026-07-03-ai-roadmap/) | 도구 지형도(왜 Claude Code) → 매일 쓰기·실전 확장 → MCP로 외부 연결 → Claude API까지, AI 코딩 도구를 워크플로에 들이는 순서 |

## 🔤 언어

| 로드맵 | 줄기 · 부록 |
|------|------|
| [모던 C++](/posts/cpp/2026-07-03-cpp-learning-roadmap/) | 참조자·동적 할당 → 클래스·RAII → 이동 시맨틱·스마트 포인터 → STL → 템플릿 → 동시성 → 모던 문법 → 빌드(CMake)까지, 필수/나중/선택 우선순위로 |

## 🗄️ 데이터베이스

| 로드맵 | 줄기 · 부록 |
|------|------|
| [DB](/posts/db/2026-07-03-db-roadmap/) | 트랜잭션·조인·옵티마이저 원리 → 정규화·파티셔닝·캐싱 성능 설계 → PostgreSQL 운영 → CAP 분산 이론까지 줄기. 연동·장애 트러블슈팅은 부록 |

## 🧩 CS·설계

| 로드맵 | 줄기 · 부록 |
|------|------|
| [디자인 패턴](/posts/design-pattern/2026-06-19-roadmap/) | GoF 23개 패턴을 생성·구조·행위로 나눠 쉬운 것부터 쌓는 순서. 헷갈리는 쌍은 참고 부록 |
