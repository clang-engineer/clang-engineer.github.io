---
layout  : wiki
title   : cpplint와 clang-format을 사용한 google 스타일 코드 작성
summary : 
date    : 2023-04-20 16:38:01 +0900
updated : 2023-04-21 14:28:59 +0900
tags    : 
toc     : true
public  : true
parent  : [[clang/index]]
latex   : false
---
* TOC
{:toc}

# cpplint
- [cpplint](https://github.com/cpplint/cpplint)을  사용하면 Google 스타일을 따르는지 검사할 수 있음


## 1. cpplint 설치
```sh
# pip를 이용해서 설치
pip install cpplint

# homebrew를 이용해서 설치
brew install cpplint
```

## 2. cpplint를 이용해서 Google 스타일을 따르는지 검사
```sh
# --linelength=120: 한줄의 최대 길이를 120으로 설정 (기본값은 80)
# --extensions=h,hpp,cpp: 검사할 파일 확장자를 h, hpp, cpp로 설정
# src/*: 소스 코드가 있는 디렉토리 경로
cpplint --linelength=120 --extensions=h,hpp,cpp src/*

# 현재 디렉토리의 모든 hpp, cpp 파일을 Google 스타일로 검사
find . -name '*.hpp' -o -name '*.cpp' -exec cpplint --linelength=120 --extensions=h,hpp,cpp {} \;
```

# clang-format 설치
- [clang-format](https://clang.llvm.org/docs/ClangFormat.html) 을 사용하면 Google 스타일로 소스 코드를 정리할 수 있음

## 1. clang-format 설치
```sh
# homebrew를 이용해서 설치
brew install clang-format
```

## 2. clang-format을 이용해서 Google 스타일로 소스 코드 정리
```sh
# -style=Google: Google 스타일을 사용
# -i: 소스 코드를 정리한 후 원본 파일에 덮어씀
clang-format -style=Google -i src/*

# 현재 디렉토리의 모든 hpp, cpp 파일을 Google 스타일로 정리 
find . -name '*.hpp' -o -name '*.cpp' -exec clang-format -style=Google -i {} \;
```

## 3. .clang-format 파일을 이용해서 Google 스타일로 소스 코드 정리
```sh
# .clang-format 파일을 생성
# clang-format을 실행할 때 -style=file 옵션을 사용하면 .clang-format 파일을 참조해서 소스 코드를 정리함
clang-format -style=Google -dump-config > .clang-format

# 현재 디렉토리의 모든 hpp, cpp 파일을 .clang-format 파일을 참조해서 정리
find . -name '*.hpp' -o -name '*.cpp' -exec clang-format -style=file -i {} \;
```


# vim에서 clang-format 사용하기
- [vim-clang-format](https://github.com/rhysd/vim-clang-format)

## 1. vim-clang-format 설치
```sh
# vim-plug를 이용해서 설치
Plug 'rhysd/vim-clang-format'
```

## 2. vim-clang-format 설정
```vim
" set indent tab size to 2, use spaces instead of tabs
let g:clang_format#style_options = {
\ 'BasedOnStyle': 'Google',
\ 'IndentWidth': 2,
\ 'UseTab': 'Never',
\ 'TabWidth': 2,
\ }


" detect code style from .clang-format file
let g:clang_format#detect_style_file = 1

" auto format on save
let g:clang_format#auto_format = 1


autocmd FileType c,cpp nnoremap <buffer> <leader>cf :ClangFormat<CR>
```

> reference
- [Google C++ Style Guide](https://google.github.io/styleguide/cppguide.html)