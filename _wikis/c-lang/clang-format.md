---
layout  : wiki
title   : clang-format을 사용해서 c 스타일 코드를 정리해보자
summary : 
date    : 2023-04-20 16:38:01 +0900
updated : 2023-04-20 16:38:47 +0900
tags    : 
toc     : true
public  : true
parent  : 
latex   : false
---
* TOC
{:toc}


# clang-format 설치
- [clang-format 설치](https://clang.llvm.org/docs/ClangFormat.html)
- clang-format은 macOS에서는 Xcode Command Line Tools를 설치하면 함께 설치됨

```sh
xcode-select --install
```

# Google 스타일을 사용하는 clang-format 파일 생성

## 1. clang-format 을  위한  cpplint.py 다운로드
```sh
curl -O https://raw.githubusercontent.com/google/styleguide/gh-pages/cpplint/cpplint.py
```

## 2. cpplint.py 를 이용해서 문법 검사후 .clang-format 파일 생성
- [cpplint.py](https://github.com/google/styleguide/blob/gh-pages/cpplint/cpplint.py) 는 Google 스타일을 검사하는 스크립트
- cpplint.py 를 이용해서 Google 스타일을 검사하고 .clang-format 파일을 생성함

```sh
#  path/to/source/dir: 소스 코드가 있는 디렉토리 경로
#  path/to/save/.clang-format: .clang-format 파일을 저장할 경로 및 파일 이름
# --linelength=120: 한줄의 최대 길이를 120으로 설정 (기본값은 80, clang-format은 80으로 설정되어 있음)
python cpplint.py --root=path/to/source/dir --linelength=120 --extensions=h,hpp,cpp --output=path/to/save/.clang-format
```

# clang-format을 사용해서 소스 코드 정리

## 1. 형식 지정을 적용할 소스 코드가 있는 디렉토리로 이동
```sh
cd path/to/source/dir
```

## 2. 형식 지정을 적용
```sh
# -style=<path>: .clang-format 파일의 경로
# clang-format은 상위 디렉토리를 차례로 거슬러 올라가며 .clang-format 파일을 찾음. 최상위 디렉토리에 도달하면 파일을 찾지 못하면 오류 발생.
find . -regex '.*\.\(h\|hpp\|cpp\)' -exec clang-format -style=path/to/save/.clang-format -i {} \;
```