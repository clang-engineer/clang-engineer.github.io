---
title       : PC 초기 설정
description : >-
    맥 초기 설정 및 기본 설정 파일 이관 방법에 대해 기록
date        : 2022-02-05 09:32:27 +0900
updated     : 2025-03-06 09:33:16 +0900
categories  : [dev, tip]
tags        : [mac, setting]
pin         : false
hidden      : false
---

## 맥 기본 설정
- 독 위치 조정 (system settings >> Desktop & Dock)
- 세벌식 변경
- 자동 대소문자 전환 끄기 (system settings >> keyboard >> text >> capitalize words automatically)
- 대소문자 전환 capslock 활성화 (system settings >> keyboard >> input sources)
- 세 손가락 드래그 활성화
  + 시스템 환경설정 - 손쉬운 사용 - 포인트 제어기 - 트랙패드 옵션
  + 드래그 활성화에서 세 손가락으로 드래그하기

## 맥 Brew로 기존에 사용하던 맥 라이브러리들 옮기기 
기존 사용하던 pc에서 Brew 를 통해 설치했다면 dump 명령어를 통해 Brewfile을 생성하여 새로운 pc에 라이브러리를 그대로 설치할 수 있다.
```sh
# 기존 pc에서 아래와 같이 명령어를 실행하여 Brewfile을 생성
# brew install <package> 로 라이브러리를 설치
# brew cask install <package> 로 gui 기반의 어플리케이션을 설치
brew bundle dump  # Brewfile 생성 (현재 설치된 라이브러리 목록을 Brewfile로 생성)
```

1.&nbsp;신규pc에서 Homebrew 설치 (전역 환경변수 설정)
```sh
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"
```
> brew 설치 후 별도 환경변수 설정이 필요한 경우가 있음 &#8594;
> m1 mac의 경우 /opt/homebrew/bin을 PATH에 추가해야함

2.&nbsp;사전에 백업해둔 기존 pc의 Brew 파일 가져오가
```sh
# 아래의 경우 개인 git repository에 Brewfile을 올려놓고 다운로드 받는 경우
curl -O https://raw.githubusercontent.com/clang-engineer/dotfiles/master/Brewfile
```

3.&nbsp;Brewfile 다운받은 위치에서 brew bundle 실행
```sh
brew bundle # bundle 명령어는 해당 디렉토리에 있는 Brewfile을 읽어서 패키지를 설치
```

## 맥 termimal theme 설정
- [terminal theme](https://github.com/lysyi3m/macos-terminal-themes) 다운로드
- terminal >> preferences >> profiles >> import >> 다운로드 받은 테마 파일 선택
> Vscode dark theme 추천


## 기본 설정파일(.xxx, dotfile) 이관
- 기존에 사용하던 설정파일들(.xxx, dotfile) 이관 
- [dotfile repository](https://github.com/clang-engineer/dotfiles) 와 같이 별도로 관리하는 것이 좋음
- 위 저장소를 clone한뒤 아래와 같이 link를 걸어주면 된다.
> brew를 통해서 zsh, tmux, neovim 등이 되었다고 가정

```ssh
ln -s $PWD/bashrc ~/.bashrc
ln -s $PWD/bash_profile ~/.bash_profile

# neovim 설정
mkdir -p ~/.config
ln -s $PWD/nvim ~/.config/nvim

# neovim plugin manager 설치
sh -c 'curl -fLo "${XDG_DATA_HOME:-$HOME/.local/share}"/nvim/site/autoload/plug.vim --create-dirs \
       https://raw.githubusercontent.com/junegunn/vim-plug/master/plug.vim'

:PlugInstall

# zsh 설정
sh -c "$(curl -fsSL https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh)" # oh-my-zsh 다운로드
ln -s $PWD/zshrc ~/.zshrc
chsh -s /usr/bin/zsh # zsh를 기본 쉘로 변경

# tmux 설정
ln -s $PWD/tmux.conf ~/.tmux.conf
tmux source-file ~/.tmux.conf

ln -s $PWD/gitconfig ~/.gitconfig  # git 설정
ln -s $PWD/hammerspoon ~/.hammerspoon # hammerspoon 설정, 권한 설정 및 자동 실행 설정 필요

ln -s $PWD/ideavimrc ~/.ideavimrc # intellij vim 설정
```

## Git 환경 설정
1.&nbsp;Github 접근에 필요한 ssh key 생성
```sh
ssh-keygen
```

2.&nbsp;생성된 공개키 등록
github settings - SSH and GPG keys - SSH keys에 등록

3.&nbsp;여러 계정을 사용하고 싶은 경우 아래와 같이 github host명을 구분하여 사용할 인증서를 지정
~/.ssh/config 파일을 생성하고 다음과 값이 추가
```plaintext
# personl account-clang-engineer 
host github.com-clang-engineer
hostname github.com
user git
    identityfile ~/.ssh/id_rsa_id_rsa_clang-engineer
# business account-planit-zero
host github.com-planit-zero
hostname github.com
user git
    identityfile ~/.ssh/id_rsa_planit-zero
```

4.&nbsp;통신 확인
```sh
ssh -T github.com-yorez
ssh -T github.com-planit-zero
```

## Jebrains 환경 설정
- Toolbox를 통해 intellij, clion, datagrid 등을 설치

## hammerspoon 설정
- privacy & security >> accessibility 

## linux에서 별도 설치 필요한 프로그램
```sh
# tmux
sudo apt-get install tmux
# neovim
sudo apt-get install neovim
# git
sudo apt-get install git
# zsh
sudo apt-get install zsh
# on my zsh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh)"
# autojump
sudo apt-get install autojump
# auto suggestions
sudo apt-get install zsh-autosuggestions # git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
# syntax highlighting
sudo apt-get install zsh-syntax-highlighting # git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
```
> zsh plugin 설치 후 ~/.zshrc에 설정파일 읽어오는 부분 추가 필요
```sh
source ~/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh
source ~/.oh-my-zsh/custom/plugins/zsh-autosuggestions/zsh-autosuggestions.zsh
```