---
title       : Neovim으로 C++ 개발 환경 세팅 (coc.nvim + clangd)
description : >-
    coc-clangd로 LSP를 붙이고 .clang-format/compile_commands.json으로 인덱싱·포매팅까지 잡기
date        : 2024-04-04 08:50:59 +0900
updated     : 2026-06-13 10:00:00 +0900
categories  : [neovim, "플러그인·생태계"]
tags        : [clang-format]
pin         : false
hidden      : false
---

Vim/Neovim에 C++ LSP를 붙이는 가장 흔한 두 길은 (1) `coc.nvim` + `coc-clangd`, (2) `nvim-lspconfig` + clangd 직접 연결이다. 이 글은 vim-plug 기반 셋업이라 (1)을 다룬다. LazyVim 같은 nvim 디스트로 쓰는 경우라면 본 블로그의 [LazyVim 글들](/categories/lazyvim/)이 더 가깝다.

## clangd가 무엇

C/C++용 LSP 서버. 코드 인덱싱·자동완성·정의 점프·진단을 담당한다. 컴파일 정보(어떤 매크로·include 경로·표준)가 필요한데, 이를 `compile_commands.json` 파일로 받는다.

## 0. clangd 설치

```sh
# macOS
brew install llvm                   # clangd 포함

# Debian/Ubuntu
sudo apt install clangd

# 버전 확인
clangd --version
```

## 1. coc.nvim 설치

```vim
" ~/.config/nvim/init.vim
Plug 'neoclide/coc.nvim', {'branch': 'release'}
```

```vim
:source %
:PlugInstall
```

## 2. coc-clangd 설치

```vim
:CocInstall coc-clangd
```

clangd가 PATH에 없으면 다음으로 받아둘 수 있다.

```vim
:CocCommand clangd.install
```

## 3. compile_commands.json 만들기

clangd가 정확히 인덱싱하려면 빌드 시스템이 사용한 컴파일 옵션을 알려줘야 한다.

**CMake 프로젝트**

```sh
cmake -B build -DCMAKE_EXPORT_COMPILE_COMMANDS=ON
ln -s build/compile_commands.json .
```

**Make 프로젝트** — [bear](https://github.com/rizsotto/Bear)로 빌드 명령을 가로채 생성

```sh
bear -- make
```

## 4. clang-format 설치와 설정

코드 정렬용 별도 도구.

```sh
brew install clang-format            # 또는 apt install clang-format
```

프로젝트 루트에 `.clang-format`을 두면 컨벤션이 박힌다.

```yaml
# .clang-format
BasedOnStyle: Google
IndentWidth: 4
ColumnLimit: 100
```

coc-clangd가 자동으로 이걸 읽어 포매팅에 적용한다. `:CocCommand editor.action.formatDocument`로 수동 포맷 가능.

## 자주 쓰는 키맵

```vim
nmap <silent> gd <Plug>(coc-definition)
nmap <silent> gr <Plug>(coc-references)
nmap <silent> [g <Plug>(coc-diagnostic-prev)
nmap <silent> ]g <Plug>(coc-diagnostic-next)
nmap <silent> K  :call CocActionAsync('doHover')<CR>
```

## 동작 안 할 때 체크

- `:CocCommand clangd.statusBar.toggle` — clangd가 실제로 떠 있나
- 프로젝트 루트에 `compile_commands.json`이 있나
- `:CocConfig`에서 clangd 경로가 맞나
- `:CocOpenLog`로 통신 로그 확인
