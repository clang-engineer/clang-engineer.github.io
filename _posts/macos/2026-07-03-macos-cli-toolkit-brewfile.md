---
title       : macOS CLI 개발 도구 모음 — Brewfile로 관리하는 터미널 툴킷
description : "새 맥마다 다시 까는 터미널 개발 도구들을 Brewfile 하나로 관리한다. cat·ls·find·grep을 대체하는 모던 CLI(bat·eza·fd·ripgrep)부터 fzf·lazygit·delta, 언어 버전 관리까지 실제로 쓰는 도구를 갈래별로 정리한다."
date        : 2026-07-03 11:00:00 +0900
updated     : 2026-11-16 12:00:00 +0900
categories  : [macos, "시스템 운영"]
tags        : [homebrew, brewfile, cli, fzf, ripgrep]
pin         : false
hidden      : false
---

새 맥을 받을 때마다 "그때 뭘 깔았더라"를 반복하지 않으려고, 터미널 개발 도구를 `Brewfile` 하나에 선언해 둔다. 이 글은 그 Brewfile에 실제로 들어 있는 도구를 **왜 쓰는지** 중심으로 갈래별로 정리한 것이다. Brewfile을 만들고 재설치하는 방법 자체는 [새 맥 초기 설정](./2022-02-05-new-mac-initial-setup.md) 글에서 다룬다.

여기 있는 건 전부 `brew`(CLI 도구)다. GUI 앱(`cask`)은 [생산성 런처·앱 정리](./2025-10-31-productivity-launchers.md) 쪽에서 따로 다룬다.

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

> zoxide는 손버릇을 바꾸는 폭이 커서 [별도 글](../shell/2026-07-03-zoxide-directory-jump.md)로 따로 정리했다. `z 키워드` 한 번이면 자주 가는 디렉터리로 점프한다.
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

| 언어 | 현재 선택 | 메모 |
|---|---|---|
| Java·Node.js·Ruby | **mise** | 별도 jenv·nvm·rbenv 초기화 대신 프로젝트별 버전을 한 셸 통합으로 전환 |
| Python | **mise 또는 uv** | 런타임 버전과 패키지 환경을 어느 도구가 맡을지 역할을 분명히 나눈다 |

### 네 버전 매니저를 하나로 묶으며 알게 된 경계

2026년 7월에는 셸 시작마다 jenv·nvm·pyenv·rbenv를 각각 초기화하던 구성을 mise로 합쳤다. 핵심은 **버전 선언, 바이너리 설치, 실행 환경 활성화가 별개 단계**라는 점이다. 전역 `~/.config/mise/config.toml`은 기본 버전을, 프로젝트의 `mise.toml`은 지역 선택을 담는다. 대화형 셸에서는 `mise activate zsh`가 디렉터리 이동과 프롬프트 시점에 `PATH`를 갱신한다. 따라서 설정 파일만 복원하고 셸 활성화를 빠뜨리면 런타임이 바뀌지 않은 듯 보인다. 반대로 CI나 스크립트에서는 activation이 필수가 아니며 `mise exec`·`mise run`을 쓸 수 있다. GUI/IDE처럼 셸 초기화 파일을 읽지 않는 프로그램은 shim 등 별도 경로를 검토해야 한다.

```text
사용자·프로젝트의 버전 선언
         ↓  설치
mise가 관리하는 실제 런타임
         ↓  activate / exec / shim 중 실행 환경에 맞는 방식
현재 명령의 PATH
```

이주했다고 Homebrew의 JDK를 무조건 지우지는 않았다. **개발 셸이 선택하는 JDK**와 **다른 Homebrew 패키지가 의존하는 JDK**는 역할이 다르기 때문이다. Brewfile이 설치된 전체 패키지의 완전한 목록이 아니라면 `brew bundle cleanup`으로 예전 매니저를 정리하는 것도 위험하다. 의존성을 확인한 뒤 제거 대상을 명시적으로 골라야 한다. 버전 파일 호환성·설치·진단 명령은 [devkit mise cheatsheet](https://github.com/clang-engineer/devkit/blob/main/reference/cheatsheets/mise.md)와 [mise 셸 활성화 문서](https://mise.jdx.dev/shell-setup.html)를 참고한다.

설정 파일을 dotfiles 도구(예: chezmoi)로 복원하고 설치 작업을 별도 스크립트로 실행하면 새 머신에서 선언과 실제 설치를 구분해 재현할 수 있다. 이전 매니저 홈을 치울 때도 모든 파일이 현재 사용자 소유라고 가정해서는 안 된다. 당시 오래된 Ruby gem의 일부가 root 소유여서 보통 권한으로 제거되지 않았다. 이런 경우 먼저 소유자와 내용을 확인하고, 자신의 홈 안에서 **삭제할 범위만 특정**해야 한다. 이주는 “새 명령이 잡힌다”로 끝나지 않고 옛 초기화 블록·중복 shim·잔여 설치본까지 확인하는 과정이다.

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
- Brewfile로 이 목록을 만들고 새 맥에 재설치하는 흐름은 [새 맥 초기 설정](./2022-02-05-new-mac-initial-setup.md)에서.
