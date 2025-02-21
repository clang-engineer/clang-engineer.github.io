---
layout  : wiki
title   : Neovim으로 cpp 개발시 유용한  설정 
summary : 
date    : 2024-04-04 08:50:59 +0900
updated : 2024-04-04 08:53:21 +0900
tags    : 
toc     : true
public  : false
parent  : [[issue/index]] 
latex   : false
---
* TOC
{:toc}


# Coc.nvim 설치
- `coc.nvim`은 `neovim`에서 제공하는 자동완성 및 코드 분석 플러그인이다.
- `.config/nvim/init.vim` 파일에 다음과 같이 추가한다.
```text
Plug 'neoclide/coc.nvim', {'branch': 'release'}
```

- nvim을 실행하고 `:PlugInstall` 명령어를 입력한다.

# coc-clangd 설치
- `coc-clangd`는 `coc.nvim`에서 제공하는 clangd를 사용하기 위한 플러그인이다.
- `coc-clangd`를 설치하기 위해서는 `coc.nvim`이 먼저 설치되어 있어야 한다.
- `coc-clangd`를 설치하기 위해서는 다음과 같이 vim 명령어를 입력한다.

```vim
CocInstall coc-clangd
```
> `vim-polyglot`을 추가로 설치했다.

# Clang Formatter 설치
- `clang-format`은 코드를 정렬해주는 툴이다.
- `clang-format`을 설치하기 위해서는 다음과 같이 명령어를 입력한다.

```bash
sudo apt install clang-format
```