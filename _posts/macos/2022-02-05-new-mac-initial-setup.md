---
title       : PC 초기 설정
description : "새 맥 초기 셋업 체크리스트. 시스템·키보드 설정부터 Homebrew, dotfiles, Git 계정까지 큰 흐름을 짚고, 무거운 주제는 각 심화 글로 연결하는 허브."
date        : 2022-02-05 09:32:27 +0900
updated     : 2026-07-03 22:30:00 +0900
categories  : [macos, "시스템 운영"]
redirect_from:
  - /posts/etc/2022-02-05-new-mac-initial-setup/
tags        : [homebrew, dotfiles]
pin         : false
hidden      : false
---

새 맥을 받았을 때 매번 처음부터 찾아 헤매지 않도록, 시스템 설정부터 Homebrew·dotfiles·터미널까지 초기 셋업 과정을 체크리스트로 정리한다. 각 항목의 큰 흐름만 짚고, Homebrew 패키지 관리·dotfiles·Git 계정처럼 깊이 들어가는 주제는 심화 글로 연결한다.

## 시스템·키보드 설정

- 독 위치 조정 (System Settings → Desktop & Dock)
- 세벌식 입력 소스 추가
- 자동 대소문자 전환 끄기 (System Settings → Keyboard → Text → Capitalize words automatically)
- Caps Lock으로 대소문자 전환 활성화 (System Settings → Keyboard → Input Sources)
- 세 손가락 드래그 활성화
  + System Settings → 손쉬운 사용(Accessibility) → 포인터 제어기 → 트랙패드 옵션
  + 드래그 활성화에서 "세 손가락으로 드래그하기" 선택
- vim에서 `Ctrl + ↑/↓/←/→`를 사용하려면 Mission Control 단축키와 충돌을 없애야 한다 (Mission Control → 단축키 → Mission Control → '이동' 항목 체크 해제)

## Homebrew 설치와 패키지 이관

1. 새 맥에서 Homebrew 설치

```sh
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"
```

> 설치 후 환경변수 설정이 필요한 경우가 있다 → Apple Silicon(M1 이상) 맥은 `/opt/homebrew/bin`을 PATH에 추가해야 한다.
{: .prompt-tip }

2. 패키지는 `Brewfile`로 선언해 두고 `brew bundle` 한 번에 재설치한다. dump·bundle·cleanup·check로 패키지를 선언적으로 관리하는 자세한 방법은 [Homebrew Brewfile로 패키지 선언적으로 관리하기](/posts/shell/2026-07-03-homebrew-brewfile-bundle/)에 정리해 두었다.

> 어떤 도구를 담는지 — cat·ls·find·grep을 대체하는 모던 CLI, fzf·lazygit 같은 실제 툴킷은 [macOS CLI 개발 도구 모음](/posts/macos/2026-07-03-macos-cli-toolkit-brewfile/) 참고.
{: .prompt-info }

## 터미널 테마

- [macos-terminal-themes](https://github.com/lysyi3m/macos-terminal-themes)에서 테마 다운로드
- Terminal → Preferences → Profiles → Import → 내려받은 테마 파일 선택

> VS Code Dark 테마를 추천한다.
{: .prompt-tip }

## dotfiles 이관

기존에 사용하던 설정파일(`.xxx` dotfile)은 [dotfiles 저장소](https://github.com/clang-engineer/dotfiles)처럼 별도 git 저장소로 관리하는 것이 좋다. 저장소를 clone한 뒤, 설정 원본을 홈 디렉터리로 **심볼릭 링크**하면 원본은 git으로 추적되고 수정은 즉시 반영된다.

> Homebrew로 zsh, tmux, neovim 등이 이미 설치되어 있다고 가정한다.
{: .prompt-info }

저장소 구조·멱등 링크 헬퍼·`bootstrap.sh` 오케스트레이션·시크릿 분리까지 dotfiles 관리 방법 전체는 [dotfiles를 git 저장소 + 심볼릭 링크로 관리하기](/posts/shell/2026-07-03-dotfiles-symlink-management/)에 정리했다.

## Git 환경 설정

1. GitHub 접근에 필요한 SSH 키 생성

```sh
ssh-keygen
```

2. 생성된 공개키를 GitHub에 등록 (Settings → SSH and GPG keys → SSH keys)

3. 개인·회사 계정을 한 PC에서 함께 쓴다면 `~/.ssh/config`의 Host 별칭으로 키를 분리하고, `.gitconfig`의 `includeIf`로 디렉터리별 커밋 이메일까지 자동 전환할 수 있다. 자세한 방법은 [GitHub 다중 계정 관리 Cheat Sheet](/posts/git/2025-10-03-git-multiple-config/)에 정리했다.

## JetBrains 환경 설정

- Toolbox를 통해 IntelliJ, CLion, DataGrip 등을 설치한다.

## Hammerspoon 설정

- Privacy & Security → Accessibility에서 Hammerspoon 접근 권한을 허용한다.

## Linux에서 별도 설치가 필요한 프로그램

맥이 아닌 Linux 환경을 함께 쓰는 경우, 아래 도구들은 직접 설치해야 한다.

```sh
sudo apt-get install tmux       # tmux
sudo apt-get install neovim     # neovim
sudo apt-get install git        # git
sudo apt-get install zsh        # zsh
# oh-my-zsh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh)"
sudo apt-get install autojump   # autojump (zoxide로 대체 가능 — /posts/shell/2026-07-03-zoxide-directory-jump/)
# zsh 플러그인
sudo apt-get install zsh-autosuggestions      # git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
sudo apt-get install zsh-syntax-highlighting  # git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
```

> zsh 플러그인 설치 후 `~/.zshrc`에 설정파일을 읽어오는 부분을 추가해야 한다.
{: .prompt-info }

```sh
source ~/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh
source ~/.oh-my-zsh/custom/plugins/zsh-autosuggestions/zsh-autosuggestions.zsh
```

## 터미널에서 vim 스크롤이 안 될 때

Terminal → Settings → Profiles에서 "Scroll alternate screen" 옵션을 비활성화하면 된다.

![터미널 대체 화면 스크롤 옵션 비활성화](https://user-images.githubusercontent.com/39648594/207744062-ad50f078-7b15-44a6-98b4-ac12a7262f51.png)
