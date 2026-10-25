---
title       : "셸 로드맵 — 실행 모델에서 스크립트와 세션까지"
description : "셸의 명령 해석·실행, 스크립팅, 프로세스·작업 제어, CLI 설계와 주변 도구의 관계를 연결하는 로드맵."
date        : 2026-07-03 14:30:00 +0900
updated     : 2026-10-25 18:30:00 +0900
categories  : [shell, "개요·인덱스"]
tags        : [roadmap, shell, zsh, bash]
pin         : false
hidden      : false
---

셸은 사용자의 명령을 해석하고 프로그램을 실행하며, 파이프·리다이렉션·작업 제어를 제공하는 명령 실행 환경이다. 스크립트는 이 동작을 파일로 작성해 재사용하는 방법이다. 이 로드맵은 **실행·해석·작업 제어·초기화의 실제 개념 관계**를 먼저 보여준다. 게시글 유무는 개념 포함 기준이 아니다.

## 전체 지도

```text
Shell — 명령 실행 환경
├─ 입력·해석
│  ├─ Token / Quote / Expansion / Globbing
│  └─ Command / Redirection / Pipeline
├─ 명령 실행
│  ├─ Builtin / Function / External Command
│  ├─ PATH / Environment / Exit Status
│  └─ Script / Interpreter / Shebang
├─ 흐름·작업 제어
│  ├─ Condition / Loop / Function
│  └─ Process / Job / Signal / Foreground·Background
└─ 초기화·상태
   ├─ Login / Interactive / Non-interactive
   └─ Startup File / Variable / Working Directory

연결: 해석 결과 → 명령 실행 → 종료 상태·제어 흐름
      Pipeline·Redirection → 프로세스 입출력 연결

별도 영역: Terminal·PTY / tmux / dotfiles / direnv·zoxide
```

위 가지는 서로 연관된 기능군이지 필수 학습 단계가 아니다. 예를 들어 job control은 CLI 인터페이스를 설계한 뒤에야 배울 수 있는 기능이 아니다. 처음 스크립트를 만든다면 실행 모델과 문법부터 읽고, 오래 실행하는 작업이 궁금하다면 프로세스·작업 제어로 바로 이동하면 된다.

파이프·리다이렉션·글로빙·텍스트 처리 등 일부 기초 영역은 아직 전용 본문이 부족하다. 없는 글을 억지로 연결하지 않고 아래에 빈 영역으로 표시한다.

## 1. 실행 모델 — 첫 스크립트를 실행한다

| 글 | 핵심 |
|---|---|
| [첫 셸 스크립트 만들고 실행하기](./2026-07-04-first-shell-script.md) | shebang, 실행 권한, `./`, PATH, CRLF |

문법보다 먼저 실행 계약을 잡는다.

```text
Script File
→ 어떤 Interpreter가 읽는가
→ 실행 권한이 있는가
→ 이름을 어떻게 찾는가(PATH)
→ 현재 Directory를 명시해야 하는가(./)
```

이 바닥이 잡혀야 문법 오류와 실행 환경 오류를 구분할 수 있다.

## 2. 문법·확장 — Bash가 한 줄을 어떻게 읽는가

| 글 | 핵심 |
|---|---|
| [셸 스크립트 문법 종합 가이드](./2026-07-03-bash-syntax-guide.md) | 변수·인용·Parameter Expansion·조건·반복·함수·배열·확장 순서·`set -euo pipefail` |

핵심 질문은 문법 Keyword 수가 아니다.

```text
값은 언제 확장되는가?
공백은 언제 Argument를 나누는가?
Quote는 어떤 확장을 막거나 보존하는가?
명령의 종료 Code가 다음 제어 흐름에 어떻게 소비되는가?
실패를 어디까지 전파할 것인가?
```

낯선 Script를 읽을 때도 Interpreter → Quote → Expansion → Exit Status 순으로 추적하면 실행 의미를 놓치지 않는다.

> 📎 **치트시트** · [shell](https://github.com/clang-engineer/devkit/blob/main/reference/cheatsheets/shell.md) · [zsh](https://github.com/clang-engineer/devkit/blob/main/reference/cheatsheets/zsh.md)
{: .prompt-tip }

## 3. CLI 설계 — Script를 작은 도구로 만든다

| 글 | 핵심 |
|---|---|
| [CLI 인자 컨벤션 — positional과 --flag는 왜 섞어 쓰나](./2026-06-10-cli-positional-vs-flag.md) | Positional·Option·Environment Variable의 역할 분리 |

```text
핵심 대상
→ positional argument

선택 동작·변형
→ --flag / --option

실행 환경의 기본값·Context
→ environment variable
```

여기서 중요한 것은 Bash Parsing Code 자체보다 **입력 계약을 어떤 축으로 나눌지**다.

## 4. Process·Job·Session — 명령을 오래 실행하면 무엇이 남는가

| 글 | 핵심 |
|---|---|
| [백그라운드 작업과 세션 지속](./2026-06-16-background-jobs-and-session.md) | `&`, Job Control, `nohup`, Shell 종료와 Process 생존, tmux 경계 |

```text
현재 Shell 안에서 Background 전환
→ & / jobs / fg / bg

Shell이 끝나도 Process만 계속 실행
→ nohup 등

작업 화면·여러 Shell·Session 자체를 유지
→ tmux
```

`&`, `nohup`, tmux는 같은 기능의 발전 단계가 아니다. **현재 Shell의 Job Control / Process 생존 / Terminal Session 보존**이라는 서로 다른 문제를 해결한다.

Terminal·PTY·Session 자체를 더 깊게 보면 [Terminal 로드맵](../terminal/2026-09-05-terminal-roadmap.md), tmux 사용 구조는 [tmux 로드맵](../tmux/2026-06-16-tmux-roadmap.md)으로 이어진다.

## Branch A — Directory별 환경변수

| 글 | 핵심 |
|---|---|
| [direnv 사용법 정리](./2026-02-21-direnv.md) | Directory 진입 시 `.envrc`를 허용한 범위에서 자동 적용 |

`direnv`는 Bash 문법의 다음 단계가 아니라 **Project Directory라는 Context에 환경변수를 묶는 Tool**이다.

```text
전역 Shell 설정
→ ~/.zshrc / ~/.bashrc 등

Directory별 개발환경
→ direnv

Application 내부 .env Loading
→ dotenv 계열
```

## Branch B — 일상 탐색 마찰 줄이기

| 글 | 핵심 |
|---|---|
| [zoxide로 디렉토리 이동 빠르게](./2026-07-03-zoxide-directory-jump.md) | 방문 기록의 Frecency로 자주 가는 Directory Jump |

```text
정확한 경로를 안다
→ cd

자주 갔던 목적지를 일부만 기억한다
→ zoxide

후보 목록에서 Fuzzy Search가 필요하다
→ fzf 계열
```

이것도 셸 언어 학습 단계가 아니라 반복 작업의 마찰을 줄이는 Tool 축이다.

## 다른 Roadmap과의 경계

### 환경을 재현하고 싶다 → dotfiles

설정 파일·Package·Machine 차이를 코드로 재현하는 문제는 [dotfiles 로드맵](./2026-07-08-dotfiles-roadmap.md)이 정본이다.

```text
dotfiles
→ 설정 파일 원본과 배치

Brewfile
→ 설치 Package 선언

chezmoi
→ Machine별 Render·Secret·배포
```

Shell Roadmap에서 이 문서들을 다시 단계별로 중복 큐레이션하지 않는다.

### Terminal Session을 관리하고 싶다 → tmux

현재 Process 하나를 Background로 남기는 것과 여러 Pane·Window·Shell State를 Session으로 유지하는 것은 다르다. 후자는 [tmux 로드맵](../tmux/2026-06-16-tmux-roadmap.md)의 책임이다.

## 아직 비어 있는 영역

현재 문서셋 기준으로 전용 글이 부족한 영역은 그대로 빈칸으로 둔다.

- Pipe와 Redirection
- Globbing과 Command Substitution의 전체 실행 순서
- `grep`·`awk`·`cut`·`sort` 중심 Text Processing
- Login / Interactive / Non-interactive Shell 초기화 전체 모델
- `set -x`, ShellCheck 중심 Debugging
- POSIX `sh`와 Bash/Zsh 경계

필요성이 생기면 기존 짧은 메모를 되살리는 대신 현재 문서 원칙으로 새로 작성한다.

## 어디서 시작할까

```text
셸 Script를 처음 만든다
→ 첫 셸 스크립트
→ Bash 문법
→ CLI 설계

오래 실행하는 명령과 Session이 헷갈린다
→ Background Jobs
→ Terminal Roadmap / tmux Roadmap

새 Machine에서 개발환경을 재현하고 싶다
→ dotfiles Roadmap

Project마다 환경변수가 다르다
→ direnv
```

> **Shell Roadmap의 줄기는 실행·해석·CLI·Process다. 환경 재현과 Terminal Session은 각각 dotfiles와 tmux라는 독립 Roadmap으로 넘긴다.**
