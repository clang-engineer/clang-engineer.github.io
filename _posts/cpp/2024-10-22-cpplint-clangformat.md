---
title       : Cpplint와 ClangFormat을 사용한 Google 스타일 코드 작성
description : "cpplint로 C++ 소스가 Google 스타일을 따르는지 검사하고, clang-format과 .clang-format 파일로 일괄 포맷팅하며 vim-clang-format으로 저장 시 자동 정리까지 적용하는 방법을 정리한다."
date        : 2023-04-20 16:38:01 +0900
updated     : 2026-07-03
categories  : [cpp]
tags        : [clang-format]
pin         : false
hidden      : false
---

## 왜 Google 스타일을 도입하나

C++는 들여쓰기, 중괄호 위치, 네이밍, 헤더 정렬 등 스타일 선택지가 넓어서 팀마다 코드 모양이 제각각이 되기 쉽습니다. 스타일이 흩어지면 diff에 실제 로직 변경과 포맷팅 변경이 뒤섞이고, 리뷰에서 "여기 공백 하나 더" 같은 소모적인 지적이 반복됩니다.

[Google C++ Style Guide](https://google.github.io/styleguide/cppguide.html)는 널리 검증된 규칙 집합이라 팀 자체 컨벤션을 처음부터 정의하는 것보다 도입 비용이 낮습니다. 여기에 다음 두 도구를 붙이면 스타일을 사람의 의지가 아니라 도구로 강제할 수 있습니다.

- `cpplint`: 소스가 스타일을 지키는지 **검사**(lint)만 합니다. CI에 걸어 위반을 차단하는 용도로 적합합니다.
- `clang-format`: 코드를 규칙대로 **자동 정리**합니다. 저장 시 자동 포맷 또는 커밋 전 일괄 포맷에 적합합니다.

도입 시점은 이렇습니다. 새 프로젝트라면 첫 커밋 전에 스타일을 고정하는 게 가장 싸고, 기존 프로젝트라면 대규모 포맷 커밋 한 번으로 기준선을 맞춘 뒤 이후부터 도구로 유지하는 방식이 무난합니다. 스타일을 리포지토리에 못박아 두려면 `.clang-format` 파일을 커밋해 모두가 같은 규칙을 공유하게 합니다.

## Google 스타일이 강제하는 것 — 네이밍·구조

도구를 붙이기 전에, Google 스타일이 실제로 뭘 규정하는지 요약합니다. 자주 참조하는 네이밍 규칙은 다음과 같습니다.

| 대상 | 컨벤션 |
|---|---|
| 클래스·함수 | `CamelCase` |
| 변수 (로컬·일반) | `snake_case` |
| 클래스 데이터 멤버 | `snake_case_` (뒤에 `_`) |
| 상수 | `kCamelCase` (앞에 `k`) |
| enum 값 | `kEnumName` 권장 (`ENUM_NAME`도 허용) |

구조 측면의 핵심 규칙:

- 모든 코드는 namespace 안에. 헤더에 `using namespace` 금지.
- `struct`는 POD(Plain Old Data) 컨테이너용, 로직이 들어가면 `class`.
- 상속보다 구성(composition) 우선, 상속은 명확한 is-a 관계에서만.
- out parameter(포인터로 결과 받기) 지양, 결과를 반환하는 함수.

아래 두 도구가 이 규칙들을 검사·강제합니다.

## Cpplint

[cpplint](https://github.com/cpplint/cpplint)을 사용하면 전체 소스 코드가 Google 스타일을 따르는지 검사할 수 있습니다.

### Cpplint 설치

```sh
pip install cpplint   # pip로 설치
brew install cpplint  # homebrew로 설치
```

### Google 스타일 검사

```sh
cpplint --linelength=120 --extensions=h,hpp,cpp src/* # src 디렉토리의 모든 파일을 검사
find . -name '*.hpp' -o -name '*.cpp' -exec cpplint --linelength=120 --extensions=h,hpp,cpp {} \; # 현재 디렉토리의 모든 hpp, cpp 파일을 검사
```

- `--linelength=120`: 한 줄의 길이가 120자를 넘지 않도록 검사
- `--extensions=h,hpp,cpp`: `h`, `hpp`, `cpp` 확장자 파일만 검사
- `src/*`: `src` 디렉토리의 모든 파일을 검사

## clang-format

[clang-format](https://clang.llvm.org/docs/ClangFormat.html)을 사용하면 Google 스타일로 소스 코드를 일괄 정리할 수 있습니다.

### clang-format 설치

```sh
# macOS
brew install clang-format
```

### 명령줄 옵션으로 정리

```sh
clang-format -style=Google -i src/* # src 디렉토리의 모든 파일을 Google 스타일로 정리
find . -name '*.hpp' -o -name '*.cpp' -exec clang-format -style=Google -i {} \; # 현재 디렉토리의 모든 hpp, cpp 파일을 Google 스타일로 정리
```

- `-style=Google`: Google 스타일을 사용
- `-i`: 소스 코드를 정리한 후 원본 파일에 덮어씀(in-place)
- `src/*`: `src` 디렉토리의 모든 파일을 Google 스타일로 정리

### .clang-format 파일로 스타일 고정

명령줄 옵션은 실행할 때마다 넘겨야 하지만, 리포지토리에 `.clang-format` 파일을 두면 팀 전체가 같은 규칙을 공유하고 에디터·CI도 이를 자동으로 참조합니다.

가장 단순한 형태는 Google 스타일을 기반으로 두고 필요한 항목만 덮어쓰는 것입니다.

```yaml
# .clang-format
BasedOnStyle: Google
IndentWidth: 2
ColumnLimit: 120
```

전체 옵션이 채워진 파일을 만들고 싶다면 `-dump-config`로 생성할 수 있습니다.

```sh
clang-format -style=Google -dump-config > .clang-format # .clang-format 파일을 생성
find . -name '*.hpp' -o -name '*.cpp' -exec clang-format -style=file -i {} \; # .clang-format 파일을 참조해서 Google 스타일로 정리
```

- `clang-format`을 실행할 때 `-style=file` 옵션을 사용하면 `.clang-format` 파일을 참조해서 소스 코드를 정리합니다.

## vim에서 clang-format 사용하기

[vim-clang-format](https://github.com/rhysd/vim-clang-format)을 사용하면 Vim에서 저장 시 자동 정리까지 붙일 수 있습니다.

### vim-clang-format 설치

```sh
# vim-plug를 이용해서 설치
Plug 'rhysd/vim-clang-format'
```

### vim-clang-format 설정

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

## Reference

- [Google C++ Style Guide](https://google.github.io/styleguide/cppguide.html)
