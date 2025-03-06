---
title       : Cpplint와 ClangFormat을 사용한 Google 스타일 코드 작성
description :
date        : 2023-04-20 16:38:01 +0900
updated     : 2025-02-21 22:50:42 +0900
categories  : [dev, c++]
tags        : [c++, cpplint, clang-format]
pin         : false
hidden      : false
---

# Cpplint
- [cpplint](https://github.com/cpplint/cpplint)을 사용하여 전체 소스 코드를 Google 스타일로 작성했는지 검사할 수 있습니다.

1. Cpplint 설치
```sh
pip install cpplint # pip를 이용해서 설치할 경우
brew install cpplint # homebrew를 이용해서 설치할 경우
```

2. Cpplint를 이용해서 Google 스타일을 따르는지 검사
```sh
cpplint --linelength=120 --extensions=h,hpp,cpp src/* # src 디렉토리의 모든 파일을 검사
find . -name '*.hpp' -o -name '*.cpp' -exec cpplint --linelength=120 --extensions=h,hpp,cpp {} \; # 현재 디렉토리의 모든 hpp, cpp 파일을 검사
```
- `--linelength=120`: 한 줄의 길이가 120자를 넘지 않도록 검사
- `--extensions=h,hpp,cpp`: h, hpp, cpp 확장자 파일만 검사
- `src/*`: src 디렉토리의 모든 파일을 검사

# clang-format 설치
- [clang-format](https://clang.llvm.org/docs/ClangFormat.html) 을 사용하면 Google 스타일로 소스 코드를 일괄 정리할 수 있습니다.

1. clang-format 설치
```sh
# macOS
brew install clang-format
```

2. clang-format을 이용해서 Google 스타일로 소스 코드 정리
```sh
clang-format -style=Google -i src/* # src 디렉토리의 모든 파일을 Google 스타일로 정리
find . -name '*.hpp' -o -name '*.cpp' -exec clang-format -style=Google -i {} \; # 현재 디렉토리의 모든 hpp, cpp 파일을 Google 스타일로 정리
```
- '-style=Google': Google 스타일을 사용
- '-i': 소스 코드를 정리한 후 원본 파일에 덮어씀
- 'src/*': src 디렉토리의 모든 파일을 Google 스타일로 정리

3. .clang-format 파일을 이용해서 Google 스타일로 소스 코드 정리
```sh
clang-format -style=Google -dump-config > .clang-format # .clang-format 파일을 생성
find . -name '*.hpp' -o -name '*.cpp' -exec clang-format -style=file -i {} \; # .clang-format 파일을 참조해서 Google 스타일로 정리
```
- `.clang-format` 파일을 생성
- `clang-format`을 실행할 때 `-style=file` 옵션을 사용하면 `.clang-format` 파일을 참조해서 소스 코드를 정리함


# vim에서 clang-format 사용하기
- [vim-clang-format](https://github.com/rhysd/vim-clang-format)

1. vim-clang-format 설치
```sh
# vim-plug를 이용해서 설치
Plug 'rhysd/vim-clang-format'
```

2. vim-clang-format 설정
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
