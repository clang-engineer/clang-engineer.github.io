---
layout  : wiki
title   : 맥북 셋팅
summary : 
date    : 2022-02-05 16:24:30 +0900
updated : 2022-12-16 08:29:32 +0900
tags    : 
toc     : true
public  : true
parent  : [[etc/index]]
latex   : false
---
* TOC
{:toc}

# 1. 기본 설정

1. 독 위치 조정
(system settings >> Desktop & Dock)
2. 세벌식 변경
3. 자동 대소문자 전환 끄기
(system settings >> keyboard >> text >> capitalize words automatically)
4. 대소문자 전환 capslock 활성화
(system settings >> keyboard >> input sources)
5. 세 손가락 드래그
- 시스템 환경설정 - 손쉬운 사용 - 포인트 제어기 - 트랙패드 옵션
- 드래그 활성화에서 세 손가락으로 드래그하기

# 2. Brew로 기존에 사용하던 맥 라이브러리들 옮기기 

1. 기존 사용하던 pc에서 Brewfile 생성

```sh
$ brew install mac
$ brew bundle dump
```

- brew bundle dump의 결과 Brewfile이 생성됨 누락된 어플리케이션이 있다면 수동으로 설치
(brew cask를 활용하여 gui 기반의 어플리케이션을 관리한다면 Brewfile에 추가됨)

2. 신규pc에서 Homebrew 설치

```sh
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"
```

- m1의 경우 별도로 환경 변수 설정
```sh
touch ~/.zshrc
export PATH=/opt/homebrew/bin:$PATH
source ~/.zshrc
```

3. 백업 Brew 파일 다운로드

```sh
$ curl -O https://raw.githubusercontent.com/yorez/dotfiles/master/Brewfile
```

4. Brewfile 다운받은 위치에서 brew bundle 실행
 
```sh
brew bundle
```

# 3. dotfile설정
- oh my zsh 별도 설치
```
$ sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```
- https://github.com/yorez/dotfiles 의 설정파일들을 링크


# 4. git ssh 환경 설정

1. sshkey 생성

```sh
ssh-keygen
```

2. github에 공개키 등록

- 1.에서 생성한 공개키를 github settings - SSH and GPG keys - SSH keys에 등록

3. local pc 개인키 등록 

- ~/.ssh/config 파일을 생성하고 다음과 값이 추가
 
```sh
# personl account-yorez 
host github.com-yorez
hostname github.com
user git
    identityfile ~/.ssh/id_rsa_yorez
# business account-planit-zero
host github.com-planit-zero
hostname github.com
user git
    identityfile ~/.ssh/id_rsa_planit-zero
```

> 각각 별개 인증서 필요

4. 연결 확인
```sh
ssh -T github.com-yorez
ssh -T github.com-planit-zero
```

# vim 환경 설정

1. neovim download
```sh
$ brew install neovim
```

2. plugin manager 설치 
 
```sh 
# vundle 을 사용할 경우
$ git clone https://github.com/VundleVim/Vundle.vim.git ~/.vim/bundle/Vundle.vim

# vim-plug 를 사용할 경우
$ sh -c 'curl -fLo "${XDG_DATA_HOME:-$HOME/.local/share}"/nvim/site/autoload/plug.vim --create-dirs \
       https://raw.githubusercontent.com/junegunn/vim-plug/master/plug.vim'
```

3. plugin 설치
 
```sh
# vim을 사용할 경우
~/.vimrc # plugin 설정 추가
$ source $MYVIMRC

# neovim을 사용할 경우
$ mkdir ~/.config/nvim
$ touch ~/.config/nvim/init.vim # plugin 설정 추가
$ source $MYVIMRC

# vundle 을 사용할 경우 
vim 실행 >> :PluginInstall # vim +PluginInstall +qall  

# vim-plug 을 사용할 경우
vim 실행 >> :PlugInstall
```

# Jebrains 환경 설정
- Toolbox 다운로드
- 라이선스를 갖고 있는 IDE를 추가로 설치

# tmux 설정
- 사용하는 쉘 rc 파일에 tmux 자동 실행 스크립트 추가

```sh
# zsh 의 경우
case $- in *i*)
    [ -z "$TMUX" ] && exec tmux
esac
```

# zsh 설정
1. intall zsh
```sh
sudo apt-get update
sudo apt-get intall zsh -y
chsh -s /usr/bin/zsh # change default shell
```
2. install on my zsh
```sh
# Curl을 이용한 설치
sh -c "$(curl -fsSL https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh)"

# wget을 이용한 설치
sh -c "$(wget https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh -O -)"
```
3. zsh 플러그인 설정 

3-1. Autojump
```sh
$ brew install autojump

.zshrc
plugins=(get autojump)
```

3-2. Auto Suggestions

```sh
$ brew install zsh-autosuggestions  # git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions

$ echo 
"source /usr/local/share/zsh-autosuggestions/zsh-autosuggestions.zsh"
 >> ~/.zshrc
```

3-3. Syntax Highlighting

```sh
$ brew install zsh-syntax-highlighting  # git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting

$ echo 
"source ~/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh"
 >> ${HOME}/.zshrc
```

# hammerspoon 설정
- privacy & security >> accessibility 

# brew install list
- brew install —-cask google-chrome
- brew install --cask jetbrains-toolbox
- brew install --cask intellij-idea

 
> 참조: https://johngrib.github.io/wiki/migrate-to-new-macbook/
