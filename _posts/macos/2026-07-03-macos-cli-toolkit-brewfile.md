---
title       : macOS CLI 개발 도구 모음 — Brewfile로 관리하는 터미널 툴킷
description : "새 맥마다 다시 까는 터미널 개발 도구들을 Brewfile 하나로 관리한다. cat·ls·find·grep을 대체하는 모던 CLI(bat·eza·fd·ripgrep)부터 fzf·lazygit·delta, 언어 버전 관리까지 실제로 쓰는 도구를 갈래별로 정리한다."
date        : 2026-07-03 21:00:00 +0900
updated     : 2026-07-03 21:00:00 +0900
categories  : [macos, "시스템 운영"]
tags        : [homebrew, brewfile, cli, fzf, ripgrep]
pin         : false
hidden      : false
---

새 맥을 받을 때마다 "그때 뭘 깔았더라"를 반복하지 않으려고, 터미널 개발 도구를 `Brewfile` 하나에 선언해 둔다. 이 글은 그 Brewfile에 실제로 들어 있는 도구를 **왜 쓰는지** 중심으로 갈래별로 정리한 것이다. Brewfile을 만들고 재설치하는 방법 자체는 [새 맥 초기 설정](/posts/macos/2022-02-05-new-mac-initial-setup/) 글에서 다룬다.

여기 있는 건 전부 `brew`(CLI 도구)다. GUI 앱(`cask`)은 [생산성 앱 정리](/posts/macos/2025-12-29-mac-productivity-tool/) 쪽에서 따로 다룬다.

## 전통 도구를 대체하는 모던 CLI

가장 체감이 큰 갈래다. 오래 쓰던 유닉스 기본 명령을, 더 빠르고 읽기 좋은 도구로 바꾼다. 손버릇을 크게 바꾸지 않아도 출력이 컬러·구문 강조로 바뀌고 속도가 빨라진다.

| 대체 대상 | 도구 | 무엇이 나아지나 |
|---|---|---|
| `cat` | **bat** | 구문 강조 + 행 번호. fzf 미리보기 백엔드로도 쓴다 |
| `ls` | **eza** | 컬러, git 상태, 아이콘 표시 |
| `find` | **fd** | 직관적인 문법, 빠른 파일 검색. neovim 파일 탐색이 의존 |
| `grep` | **ripgrep**(`rg`) | 초고속 텍스트 검색. neovim grep 백엔드 |
| `cd` | **zoxide**(`z`) | 방문 기록 기반 디렉터리 점프 |
| `diff`(git) | **git-delta** | git diff를 구문 강조해 보여주는 페이저 |

이 중 몇 개는 다른 도구의 부품으로도 쓰인다. 예를 들어 `bat`은 fzf 미리보기에, `fd`·`ripgrep`은 neovim의 파일·텍스트 검색 백엔드로 물려 있다. 그래서 하나만 깔아도 다른 도구 경험까지 같이 좋아진다.

> zoxide는 손버릇을 바꾸는 폭이 커서 [별도 글](/posts/shell/2026-07-03-zoxide-directory-jump/)로 따로 정리했다. `z 키워드` 한 번이면 자주 가는 디렉터리로 점프한다.
{: .prompt-tip }

## 검색·탐색을 잇는 글루 도구

위 도구들을 **연결**하거나, 반복 작업을 TUI로 감싸는 역할이다.

| 도구 | 역할 |
|---|---|
| **fzf** | 퍼지 파인더. `Ctrl+R` 히스토리 검색, `Ctrl+T` 파일 선택. zsh·neovim(telescope)이 의존 |
| **lazygit** | Git TUI. add·commit·branch·rebase를 키 몇 번으로 |
| **gh** | GitHub CLI. PR·이슈·Actions를 터미널에서 |
| **jq** | CLI JSON 필터·변환. 스크립트에서 JSON 파싱할 때 |
| **tree** | 디렉터리 구조를 트리로 출력 |
| **tldr** | `man`의 요약판. 핵심 사용 예시만 빠르게 |

`fzf`가 이 갈래의 중심이다. 히스토리·파일·브랜치 등 "목록에서 하나 고르기"가 필요한 거의 모든 곳에 끼어들어, 다른 도구의 사용성을 끌어올린다.

## 언어·런타임 버전 관리

프로젝트마다 요구하는 언어 버전이 다르므로, 시스템에 하나만 깔기보다 버전 관리 도구로 전환하며 쓴다.

| 언어 | 도구 | 메모 |
|---|---|---|
| Java | **jenv** + **openjdk@11/17/21** | 프로젝트별 JDK 전환. `jdtls`는 neovim Java LSP |
| Node.js | **nvm** | Node 버전 전환 |
| Python | **pyenv** / **uv** | uv는 초고속 패키지 매니저. pyenv와 역할이 겹칠 수 있어 하나로 수렴 중 |
| Ruby | **rbenv** | Ruby 개발할 때만 |

## 상황에 따라 선택

항상 필요하진 않지만, 특정 작업을 할 때 있으면 편한 것들. Brewfile에 두되 "이건 왜 있는지"를 주석으로 남겨 두면 나중에 정리하기 쉽다.

| 도구 | 언제 필요한가 |
|---|---|
| **git-lfs** | 대용량 파일을 다루는 저장소를 쓸 때 |
| **libpq** | `psql` CLI가 필요할 때(PostgreSQL) |
| **wget** | 파일 다운로더. 기본 내장된 `curl`로 대개 대체 가능 |

## 마무리

핵심은 도구 목록 자체가 아니라, **"이 도구를 왜 두는지"를 Brewfile 주석으로 남겨 선언적으로 관리한다**는 점이다. 새 맥에서 `brew bundle` 한 번이면 이 툴킷이 통째로 복원되고, 몇 달 뒤 목록을 다시 봐도 각 줄이 스스로를 설명한다.

- 먼저 손볼 것 하나만 고른다면 **모던 CLI 대체 도구**(bat·eza·fd·ripgrep·zoxide) — 매일 쓰는 명령의 체감이 바로 바뀐다.
- Brewfile로 이 목록을 만들고 새 맥에 재설치하는 흐름은 [새 맥 초기 설정](/posts/macos/2022-02-05-new-mac-initial-setup/)에서.
