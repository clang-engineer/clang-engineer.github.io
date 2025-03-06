---
title       : Neovim으로 cpp 개발시 유용한 설정
description : >-
    Neovim으로 cpp 개발시 유용한 설정 방법을 정리하였습니다.
date        : 2024-04-04 08:50:59 +0900
updated     : 2024-04-04 08:53:21 +0900
categories  : [dev, tip]
tags        : [neovim, cpp, coc.nvim, coc-clangd, clang-format]
pin         : false
hidden      : false
---


## Coc.nvim 설치
- `coc.nvim`은 `neovim`에서 제공하는 자동완성 및 코드 분석 플러그인입니다.
- `coc.nvim`을 설치하기 위해서는 다음과 같이 설정합니다.

```plaintext
// .config/nvim/init.vim 에 다음과 같이 추가합니다.
Plug 'neoclide/coc.nvim', {'branch': 'release'}

:source % // 설정파일을 다시 읽어옵니다.

:PlugInstall // 플러그인을 설치합니다.
```

## coc-clangd 설치
- `coc-clangd`는 `coc.nvim`에서 제공하는 clangd를 사용하기 위한 플러그인 입니다.
- `coc-clangd`를 설치하기 위해서는 `coc.nvim`이 먼저 설치되어 있어야 합니다.
- `coc-clangd`를 설치하기 위해서는 다음과 같이 vim 명령어를 입력합니다.
> `vim-polyglot`을 추가로 설치하면 더욱 좋습니다.
```vim
CocInstall coc-clangd
```

## Clang Formatter 설치
- `clang-format`은 코드를 정렬해주는 툴입니다.
- `clang-format`을 설치하기 위해서는 다음과 같이 명령어를 입력합니다.

```bash
sudo apt install clang-format
```