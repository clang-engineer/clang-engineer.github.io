---
title       : "새 Mac 개발 환경 초기 설정 — 시스템 → Homebrew → Dotfiles → Git"
description : "새 Mac을 개발 환경으로 만들 때 시스템 설정, Homebrew와 Brewfile, dotfiles 복원, Git 인증·identity를 어떤 순서로 구성할지 정리한 day-1 셋업 런북."
date        : 2022-02-05 09:32:27 +0900
updated     : 2026-09-05 20:20:00 +0900
categories  : [macos, "시스템 운영"]
redirect_from:
  - /posts/etc/2022-02-05-new-mac-initial-setup/
tags        : [homebrew, dotfiles, git, setup, how-to]
pin         : false
hidden      : false
---

새 Mac을 받았을 때 필요한 앱을 생각나는 순서대로 하나씩 설치하면 설정 출처가 흩어지고 다음 장비에서 같은 작업을 반복하기 어렵다.

이 글은 세부 설치법보다 **어떤 순서로 개발 환경을 복원할지**를 잡는 day-1 런북이다.

```text
macOS 기본 설정
   ↓
Package Manager
   ↓
선언된 Tool 설치
   ↓
Dotfiles 복원
   ↓
Git 인증 / Identity
   ↓
동작 확인
```

각 도구의 상세 사용법은 개별 글과 devkit에 두고 여기서는 새 장비의 복원 흐름만 유지한다.

## 1. macOS 기본 설정부터 맞춘다

패키지를 설치하기 전에 macOS 자체 동작을 먼저 정한다.

예:

```text
Keyboard / 입력기
Trackpad
Dock
Finder
Security & Privacy 권한
Display
Hot Corner 등
```

이 단계는 이후 Window Manager, Launcher, Terminal 같은 앱의 동작에도 영향을 준다.

세부 항목은 [macOS 시스템 설정](/posts/macos/2026-07-03-macos-system-settings/)에서 관리한다.

## 2. Homebrew를 설치한다

Homebrew 공식 설치 스크립트를 사용한다.

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

설치가 끝나면 installer가 출력하는 `brew shellenv` 안내를 현재 shell 설정에 반영한다.

Apple Silicon의 기본 prefix는:

```text
/opt/homebrew
```

이고 Intel Mac은 일반적으로:

```text
/usr/local
```

을 사용한다.

직접 PATH 문자열을 하드코딩하기보다 설치기가 안내하는 `brew shellenv`를 기준으로 설정하면 architecture 차이를 줄일 수 있다.

확인:

```bash
brew --version
brew doctor
```

## 3. 개별 설치 대신 Brewfile로 Tool Set을 복원한다

새 Mac에서 매번:

```text
brew install ...
brew install ...
brew install --cask ...
```

를 기억해서 반복하기보다 **내가 사용하는 package 목록 자체를 선언**해두는 편이 재현성이 높다.

```text
Brewfile
   ↓
brew bundle
   ↓
CLI / GUI Tool Set 복원
```

Brewfile이 준비되어 있다면 해당 위치에서:

```bash
brew bundle
```

을 실행한다.

Brewfile 생성·검증·정리 흐름은 [Homebrew Brewfile로 패키지 선언적으로 관리하기](/posts/shell/2026-07-03-homebrew-brewfile-bundle/)에서 다룬다.

실제 CLI 도구 선택은 [macOS CLI 개발 도구 모음](/posts/macos/2026-07-03-macos-cli-toolkit-brewfile/)을 참고한다.

## 4. Dotfiles를 복원한다

패키지가 준비되면 shell, tmux, Neovim, Git 같은 사용자 설정을 복원한다.

핵심은 홈 디렉터리에 설정을 수동으로 다시 만드는 것이 아니라 **Git으로 관리하는 원본 설정을 연결하는 것**이다.

```text
Dotfiles Repository
      ↓
Bootstrap / Symlink 관리
      ↓
~/.zshrc
~/.config/...
~/.gitconfig 등
```

예를 들어 별도 dotfiles repository를 clone한 뒤 bootstrap script나 symlink manager를 실행한다.

Dotfiles 구조, 멱등 링크, bootstrap, secret 분리는 [dotfiles를 Git 저장소 + 심볼릭 링크로 관리하기](/posts/shell/2026-07-03-dotfiles-symlink-management/)에서 관리한다.

> 새 장비 복원에서는 "어떤 파일을 링크하는가"보다 bootstrap을 여러 번 실행해도 같은 결과가 나오는 **멱등성**이 중요하다.

## 5. Git 인증과 Commit Identity를 확인한다

Dotfiles가 Git 설정까지 복원하더라도 **인증 credential과 commit identity는 별도 축**으로 확인한다.

```text
GitHub Remote 인증
→ SSH Key 또는 HTTPS Credential

Commit 작성자
→ user.name / user.email
```

### SSH를 사용하는 경우

현재 key를 확인한다.

```bash
ls -la ~/.ssh
```

새 key가 필요하다면:

```bash
ssh-keygen -t ed25519
```

GitHub에 public key를 등록한 뒤 실제 인증을 확인한다.

```bash
ssh -T git@github.com
```

### Commit Identity 확인

```bash
git config --global --get user.name
git config --global --get user.email
```

개인·회사 계정을 함께 사용한다면 SSH Host alias와 Git `includeIf`를 사용해 인증과 identity를 독립적으로 전환할 수 있다.

관련 글: [GitHub 다중 계정 — SSH 인증과 Commit Identity를 분리해서 관리하기](/posts/git/2025-10-03-git-multiple-config/)

## 6. 개발 환경이 실제로 복원됐는지 검증한다

설정 파일이 존재한다는 것보다 실제 command가 예상 경로와 버전으로 동작하는지 확인한다.

```bash
which brew
which git
which nvim
which tmux

git --version
nvim --version
tmux -V
```

Shell 환경도 새 login shell을 열어 다시 확인한다.

```bash
echo "$SHELL"
echo "$PATH"
```

Dotfiles나 package 설정은 현재 terminal session에 우연히 남아 있는 환경변수 때문에 정상처럼 보일 수 있으므로 **새 terminal session에서 한 번 더 확인**하는 편이 좋다.

## 7. 새 Mac 복원의 기준 상태

최종적으로 다음 구조를 목표로 한다.

```text
macOS
├─ System Settings
├─ Homebrew
│   └─ Brewfile로 Package Set 관리
├─ Dotfiles
│   └─ Shell / tmux / Neovim / Git 설정
└─ Credential / Identity
    ├─ SSH 또는 HTTPS 인증
    └─ Git user.name / user.email
```

설정의 원본이 어디에 있는지도 명확해야 한다.

```text
OS 설정
→ macOS

Package 목록
→ Brewfile

사용자 설정
→ Dotfiles Repository

Secret / Credential
→ Keychain, SSH Key 등 별도 보안 저장소
```

## 정리

새 Mac 설정의 목표는 많은 설치 명령을 기록하는 것이 아니라 **환경을 다시 만들 수 있는 원본을 분리해 두고 정해진 순서로 복원하는 것**이다.

```text
System
→ Packages
→ Configuration
→ Credentials
→ Verification
```

이 흐름이 잡혀 있으면 장비를 바꿀 때마다 환경을 새로 "만드는" 대신 기존 개발 환경을 "복원"할 수 있다.

## 참고

- [Homebrew Installation](https://docs.brew.sh/Installation)
- [GitHub Docs — Connecting to GitHub with SSH](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)
