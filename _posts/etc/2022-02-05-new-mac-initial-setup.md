---
title       : PC 초기 설정
description : "맥 기본 환경설정, Homebrew Brewfile로 라이브러리 이관, 터미널 테마, dotfiles 심볼릭 링크까지 새 맥 초기 셋업 과정을 정리한다."
date        : 2022-02-05 09:32:27 +0900
updated     : 2026-07-03 00:00:00 +0900
categories  : [etc, "macOS"]
tags        : [homebrew, dotfiles]
pin         : false
hidden      : false
---

새 맥을 받았을 때 매번 처음부터 찾아 헤매지 않도록, 시스템 설정부터 Homebrew·dotfiles·터미널까지 초기 셋업 과정을 체크리스트로 정리한다.

## 시스템·키보드 설정

- 독 위치 조정 (System Settings → Desktop & Dock)
- 세벌식 입력 소스 추가
- 자동 대소문자 전환 끄기 (System Settings → Keyboard → Text → Capitalize words automatically)
- Caps Lock으로 대소문자 전환 활성화 (System Settings → Keyboard → Input Sources)
- 세 손가락 드래그 활성화
  + System Settings → 손쉬운 사용(Accessibility) → 포인터 제어기 → 트랙패드 옵션
  + 드래그 활성화에서 "세 손가락으로 드래그하기" 선택
- vim에서 `Ctrl + ↑/↓/←/→`를 사용하려면 Mission Control 단축키와 충돌을 없애야 한다 (Mission Control → 단축키 → Mission Control → '이동' 항목 체크 해제)

## Homebrew로 라이브러리 이관

기존 맥에서 Homebrew로 설치해 두었다면 `brew bundle dump`로 Brewfile을 만들어 새 맥에 그대로 재설치할 수 있다.

```sh
# 기존 맥에서 아래 명령어를 실행해 Brewfile 생성
# brew install <package>       로 라이브러리 설치
# brew install --cask <package> 로 GUI 애플리케이션 설치
brew bundle dump  # 현재 설치된 패키지 목록을 Brewfile로 덤프
```

1. 새 맥에서 Homebrew 설치

```sh
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"
```

> 설치 후 환경변수 설정이 필요한 경우가 있다 → Apple Silicon(M1 이상) 맥은 `/opt/homebrew/bin`을 PATH에 추가해야 한다.
{: .prompt-tip }

2. 백업해 둔 Brewfile 가져오기

```sh
# 개인 git 저장소에 Brewfile을 올려두고 내려받는 경우
curl -O https://raw.githubusercontent.com/clang-engineer/dotfiles/master/Brewfile
```

3. Brewfile이 있는 위치에서 `brew bundle` 실행

```sh
brew bundle  # 현재 디렉토리의 Brewfile을 읽어 패키지 설치
```

## 터미널 테마

- [macos-terminal-themes](https://github.com/lysyi3m/macos-terminal-themes)에서 테마 다운로드
- Terminal → Preferences → Profiles → Import → 내려받은 테마 파일 선택

> VS Code Dark 테마를 추천한다.
{: .prompt-tip }

## dotfiles 이관

기존에 사용하던 설정파일(`.xxx` dotfile)은 [dotfiles 저장소](https://github.com/clang-engineer/dotfiles)처럼 별도로 관리하는 것이 좋다. 저장소를 clone한 뒤 아래와 같이 심볼릭 링크를 걸어준다.

> Homebrew로 zsh, tmux, neovim 등이 이미 설치되어 있다고 가정한다.
{: .prompt-info }

```sh
ln -s $PWD/bashrc ~/.bashrc
ln -s $PWD/bash_profile ~/.bash_profile

# neovim 설정
mkdir -p ~/.config
ln -s $PWD/nvim ~/.config/nvim
# 플러그인은 lazy.nvim이 첫 실행 시 자동 설치 (별도 부트스트랩 불필요)

# zsh 설정
sh -c "$(curl -fsSL https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh)"  # oh-my-zsh 설치
ln -s $PWD/zshrc ~/.zshrc
chsh -s /usr/bin/zsh  # zsh를 기본 쉘로 변경

# tmux 설정
ln -s $PWD/tmux.conf ~/.tmux.conf
tmux source-file ~/.tmux.conf

ln -s $PWD/gitconfig ~/.gitconfig        # git 설정
ln -s $PWD/hammerspoon ~/.hammerspoon    # hammerspoon 설정 (권한·자동 실행 별도 설정 필요)
ln -s $PWD/ideavimrc ~/.ideavimrc        # IntelliJ vim 설정
```

## Git 환경 설정

1. GitHub 접근에 필요한 SSH 키 생성

```sh
ssh-keygen
```

2. 생성된 공개키를 GitHub에 등록 (Settings → SSH and GPG keys → SSH keys)

3. 여러 계정을 사용하려면 GitHub host명을 구분해 인증서를 지정한다. `~/.ssh/config` 파일을 만들고 다음과 같이 추가한다.

```plaintext
# personal account
Host github.com-clang-engineer
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_rsa_clang-engineer

# work account
Host github.com-work
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_rsa_work
```

4. 통신 확인

```sh
ssh -T github.com-clang-engineer
ssh -T github.com-work
```

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
sudo apt-get install autojump   # autojump
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
