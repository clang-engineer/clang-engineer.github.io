---
title       : "Learn Vimscript the Hard Way 핵심 정리"
description : "Steve Losh의 vimscript 책 55챕터에서 실전에 남는 핵심만 추려 한 글에 정리. 매핑·autocmd·operator-pending·스코프 prefix·execute/normal·플러그인 구조·autoload."
date        : 2024-11-01 14:20:44 +0900
updated     : 2026-06-15 22:00:00 +0900
categories  : [vim, "원리·언어"]
tags        : [vimscript]
pin         : false
hidden      : false
---

`Learn Vimscript the Hard Way`(Steve Losh)는 55개 챕터로 vimscript의 거의 모든 영역을 다룬다. 이 글은 책 전체에서 **실전에 남는 핵심**만 추려서 주제별로 묶어 정리한 노트다. 챕터를 한 줄씩 따라가는 요약이 아니라 "다시 책을 안 펴도 되도록" 압축한 한 장짜리 reference에 가깝다.

## 1. 메시지 출력 — `:echo` vs `:echom`

| 명령 | 동작 | `:messages` 히스토리 |
| --- | --- | --- |
| `:echo` | 명령창에 출력만 | 저장 안 됨 |
| `:echom` (`:echomsg`) | 출력 + 저장 | 저장됨 |

스크립트가 끝나거나 다음 명령이 화면을 덮으면 `:echo` 출력은 사라지지만 `:echom`은 `:messages`로 다시 볼 수 있다. **디버깅은 항상 `:echom`**.

## 2. 옵션 설정 — `:set`

```vim
:set number          " 켜기
:set nonumber        " 끄기
:set number!         " 토글
:set number?         " 현재값 확인
:set numberwidth=10  " 값 지정
```

부울 옵션은 `no` 접두사로 끄고, `!`로 토글, `?`로 조회. 값 옵션은 `=`로 지정.

## 3. 매핑 — `map`은 잊고 `noremap`만 써라

```vim
:nmap x dd
:nnoremap \ x       " \는 dd가 아니라 진짜 x로 동작 (재귀 안 풀림)
```

`map`은 우변을 다시 매핑으로 풀어서 적용한다. 그래서 플러그인과 충돌하거나, 심지어 무한 재귀에 빠질 수 있다. **항상 `noremap` 계열만 쓴다**.

| 일반 | 모드 한정 |
| --- | --- |
| `noremap` | normal·visual·operator-pending |
| `nnoremap` | normal |
| `vnoremap` | visual |
| `inoremap` | insert |
| `onoremap` | operator-pending |

### 함정: insert 모드에서 `:imap <c-d> dd`

insert 모드에서 `dd`는 두 글자 d가 그냥 입력될 뿐 줄을 지우지 않는다. normal 모드 명령을 insert 모드에서 쓰려면 모드 전환을 끼워 넣어야 한다.

```vim
:inoremap <c-d> <esc>ddi
```

## 4. Leader 키

```vim
:let mapleader = ","
:let maplocalleader = "\\"   " vimscript 문자열에서 \\는 백슬래시 1개
:nnoremap <leader>d dd
```

핵심 두 가지:

- **순서**: `<leader>`는 매핑 정의 **그 순간의** `mapleader` 값으로 치환된다. mapleader를 먼저 설정한 뒤 매핑을 정의해야 한다.
- `<leader>`는 전역 단축키 prefix, `<localleader>`는 파일타입별 prefix(`ftplugin/`에서 사용).

## 5. 약어 — `:iabbrev`

```vim
:iabbrev sig -- \n홍길동
:iabbrev adn and
```

자주 치는 오타·서명·상용구를 자동 치환. `inoremap`과 달리 **단어 경계에서만 발동**하므로 의도치 않은 폭주가 없다. 버퍼 한정은 `:iabbrev <buffer>`.

## 6. autocmd — 이벤트 훅

```vim
:autocmd BufNewFile,BufRead *.html setlocal nowrap
:autocmd BufWritePre *.py :%s/\s\+$//e
```

대표 이벤트:

- `BufNewFile` / `BufRead` — 신규 / 기존 파일 열 때. 보통 함께 묶어 씀.
- `BufWritePre` / `BufWritePost` — 저장 직전 / 직후.
- `FileType` — 파일타입 결정 직후. `setlocal`과 잘 어울림.
- `InsertEnter` / `InsertLeave`.

### autocmd group — 재로드 중복 방지

```vim
augroup my_html
  autocmd!                       " 그룹 내 기존 autocmd 전부 제거
  autocmd BufWritePre *.html :normal gg=G
augroup END
```

vimrc를 reload할 때마다 같은 autocmd가 누적되는 사고를 막는 가장 중요한 패턴. **개인 vimrc의 모든 autocmd는 group으로 감싼다**.

## 7. Operator-Pending 매핑 — vimscript의 진짜 무기

`d`, `y`, `c` 같은 오퍼레이터가 모션 입력을 기다리는 그 상태에서 발동하는 매핑. **한 번 정의하면 모든 오퍼레이터에 자동 적용**된다.

```vim
:onoremap p i(                              " dp/yp/cp = 괄호 안
:onoremap in( :<c-u>normal! f(vi(<cr>      " '다음 괄호 안'
```

직접 텍스트 객체를 만드는 메커니즘이다. 책 후반부의 백미.

## 8. 변수와 스코프 prefix

```vim
let g:foo = 1   " global
let s:foo = 1   " script-local (해당 .vim 파일 안에서만)
let b:foo = 1   " buffer-local
```

| prefix | 범위 |
| --- | --- |
| `g:` | 전역 |
| `s:` | 스크립트 로컬 (해당 파일 안에서만) |
| `b:` | 버퍼 로컬 |
| `w:` | 윈도우 로컬 |
| `t:` | 탭 로컬 |
| `l:` | 함수 로컬 |
| `a:` | 함수 인자 (`a:1`, `a:000`) |
| `v:` | vim 내장 (`v:true`, `v:count`) |
| `&` | 옵션 (`&number`) |
| `@` | 레지스터 (`@a`) |
| `$` | 환경변수 (`$HOME`) |

플러그인을 짤 때 내부 함수·변수는 거의 다 `s:`로 묶어서 전역을 오염시키지 않는다.

## 9. 조건과 비교 — `==`의 함정

```vim
if "HELLO" == "hello"     " 'ignorecase' 옵션에 따라 결과가 바뀜 (지뢰)
if "HELLO" ==# "hello"    " 항상 대소문자 구분 → false
if "HELLO" ==? "hello"    " 항상 대소문자 무시 → true
```

**스크립트에서는 그냥 `==`를 쓰면 안 된다.** 사용자의 `ignorecase` 설정에 따라 같은 코드가 다르게 동작한다. 명시적으로 `==#` 또는 `==?`를 쓴다. `!=`, `=~`, `!~`도 마찬가지로 `#`/`?` 변형이 있다.

## 10. 함수

```vim
function! s:Greet(name) abort
  echom "Hello, " . a:name
endfunction

call s:Greet("world")
```

규칙:

- 함수명은 **대문자 시작 강제** (스코프 prefix가 없을 때).
- `function!`의 `!` — 이미 정의된 함수 덮어쓰기 허용. 재로드를 위해 거의 항상 붙임.
- `abort` — 함수 안에서 에러 발생 시 즉시 중단. 거의 항상 붙임.
- 인자는 `a:name`. 가변 인자는 `...`, 개수는 `a:0`, 리스트는 `a:000`.
- 명시적 반환이 없으면 `0` 반환.

호출:

- 명령으로: `:call Foo(arg)`
- 표현식으로: `echom Bar()`

## 11. 실행 메커니즘 — `:execute`, `:normal`, `:normal!`

| 명령 | 역할 |
| --- | --- |
| `:execute "..."` | 문자열을 ex 명령으로 실행. 동적 명령 생성. |
| `:normal ...` | 인자를 normal 모드 명령처럼 실행 (사용자 매핑 적용됨). |
| `:normal! ...` | 매핑 무시하고 기본 동작만. **스크립트에서는 거의 항상 `!`**. |

### `execute "normal! ..."` 조합이 표준 관용구

`normal!`만으로는 `<esc>`, `<cr>` 같은 특수키를 문자로 받지 못한다. `execute`로 감싸면 백슬래시 표기를 해석해준다.

```vim
:execute "normal! mqA;\<esc>`q"
```

→ 현재 위치를 `q`에 마크 → 줄 끝 삽입 → `;` 입력 → esc → 마크 `q`로 복귀 (커서 유지하면서 줄 끝에 세미콜론 추가).

## 12. 정규식 — `\v` very-magic을 기본으로

vim 기본 정규식은 `(`, `+`, `?` 등을 리터럴로 취급해서 백슬래시 지옥이 된다. `\v`를 붙이면 PCRE에 가까운 문법이 된다.

```vim
/\v(foo|bar)+
:s/\v(\w+)\s+\1/duplicate/g
```

검색·치환은 거의 항상 `\v`로 시작하는 게 가독성에 좋다. 반대 방향으로 `\V`(very-nomagic, 거의 모두 리터럴)도 있다.

## 13. 리스트와 딕셔너리

```vim
let xs = [1, 2, 3]
let xs[0] = 10
call add(xs, 4)
echo len(xs)

let d = {'name': 'foo', 'age': 30}
let d.age = 31
echo get(d, 'missing', 'default')
```

`for x in xs | ... | endfor` 루프, `map()`·`filter()` 함수형 호출도 지원.

### 함정: vimscript의 `map`/`filter`는 **파괴적**

```vim
let xs = [1, 2, 3]
let ys = map(xs, 'v:val * 2')
" 이제 xs도 [2, 4, 6]이 됨
```

원본을 보존하려면 `copy(xs)` 또는 `deepcopy(xs)`를 먼저 떠야 한다.

## 14. 플러그인 디렉토리 구조

| 디렉토리 | 로드 시점 | 용도 |
| --- | --- | --- |
| `plugin/` | vim 시작 시 1회 | 매핑·커맨드 정의 (사용자 진입점) |
| `autoload/` | 함수 호출 시 lazy | 무거운 로직, 지연 로딩 대상 |
| `ftplugin/<ft>.vim` | 해당 filetype 진입 시 | `setlocal` 옵션·버퍼-로컬 매핑 |
| `syntax/<ft>.vim` | filetype 결정 시 | 신택스 하이라이트 정의 |
| `doc/` | 수동(`:helptags`) | `:help` 문서 |
| `after/` | 위 디렉토리들 이후 | 기본 동작 override |

## 15. autoload — 지연 로딩의 표준

함수명의 `#`이 곧 파일 경로다.

| 함수명 | 정의 위치 |
| --- | --- |
| `foo#bar()` | `autoload/foo.vim` |
| `foo#baz#qux()` | `autoload/foo/baz.vim` |

해당 함수가 **처음 호출되는 시점**에만 파일이 로드된다. 시작 시간을 줄이는 핵심 메커니즘. 단, `:command`/`:nmap` 같은 사용자 진입점은 autoload 불가 — 사용자가 호출할 수 없기 때문이다. 진입점은 `plugin/`에 두고, 그 안에서 `autoload#` 함수를 호출하는 패턴.

## 16. 책에는 있지만 이 정리에서 뺀 영역

- **syntax highlighting 작성** (`syntax match`, `syntax region`, `hi link`) — 새 언어를 직접 추가하지 않는 한 잘 안 씀.
- **folding 직접 구현** — 요즘은 tree-sitter나 indent 기반으로 거의 해결.
- **Pathogen** — 현재는 vim-plug / lazy.nvim 시대. 역사 자료로만.
- **Potion 섹션 무브먼트 케이스 스터디** — 학습용 사례라 실용성은 낮음.

대신 책 끝의 **Documentation**(`:help` 문서 작성법)과 **Distribution**(레포 분리·라이선스)은 실제 플러그인을 배포할 때 한 번 훑어볼 만하다.

## 마무리 — Neovim 시대의 vimscript 위치

Neovim 이후 신규 플러그인은 Lua가 표준이지만 vimscript는 여전히:

- 모든 vim에서 동작하는 보편성
- 기존 vim 플러그인 생태계(tpope·dadbod 계열)와의 정렬
- `ftplugin/`·`autoload/`·autocmd group 같은 메커니즘 자체가 vim 코어 개념

때문에 사라지지 않는다. **Lua로 짜더라도 결국 `vim.cmd`·`vim.fn`을 거쳐 vimscript 개념을 호출**하게 되므로, 한 번은 익혀두는 게 좋다. 이 책이 그 학습 경로 중 가장 잘 짜인 입문서다. 이 정리본으로 부족하면 [원문](https://learnvimscriptthehardway.stevelosh.com/)을 챕터 단위로 읽으면 된다.

> [Learn Vimscript the Hard Way](https://learnvimscriptthehardway.stevelosh.com/)를 읽고 핵심을 정리한 글입니다.
