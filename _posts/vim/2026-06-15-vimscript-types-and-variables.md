---
title       : "Vimscript 문법 1 — 타입과 변수"
description : "Vim 사용자를 위한 Vimscript 핵심 문법 시리즈 1편. 7개 기본 타입, :let/:const/:unlet, 스코프 prefix(g:/s:/b:/w:/t:/l:/a:/v:), ==# 비교 함정까지."
date        : 2026-06-15 14:00:00 +0900
updated     : 2026-06-15 14:00:00 +0900
categories  : [vim, "원리·언어"]
tags        : [vimscript]
pin         : false
hidden      : false
---

vimrc를 진지하게 다루거나 ftplugin을 직접 짜려면 Vimscript 문법은 피할 수 없다. Neovim이 Lua로 전환되었어도 `vim.cmd`·`vim.fn`·기존 플러그인 생태계는 여전히 Vimscript 위에 서 있기 때문이다. 이 시리즈는 vim 사용자가 본인 설정을 읽고 고칠 수 있는 수준까지 Vimscript를 정리한다. 1편은 가장 기초 — **타입과 변수**.

## 결론 먼저

- 기본 타입은 **7개**: `Number`, `Float`, `String`, `List`, `Dictionary`, `Funcref`, `Special`(`v:true`/`v:false`/`v:null`). 비교적 최근에 `Blob`이 추가되어 사실상 8개.
- 변수는 **스코프 prefix가 곧 선언**이다 (`g:`, `s:`, `b:`, `w:`, `t:`, `l:`, `a:`, `v:`).
- 함수 안에서 prefix 없는 변수는 **자동으로 `l:`(함수 로컬)**, 함수 밖에서는 **자동으로 `g:`(전역)**.
- 비교 연산자 `==`는 사용자의 `ignorecase` 설정에 따라 동작이 바뀐다. **스크립트에서는 `==#`/`==?`만 쓴다**.

## 7개 기본 타입

`type()`로 확인할 수 있다. 반환값은 정수 상수.

```vim
echo type(0)         " 0  (Number)
echo type(0.0)       " 5  (Float)
echo type("hi")      " 1  (String)
echo type([])        " 3  (List)
echo type({})        " 4  (Dictionary)
echo type(function('tr'))  " 2  (Funcref)
echo type(v:true)    " 6  (Special)
```

상수는 `v:t_number`, `v:t_string` 등으로도 접근 가능하다. 매직 넘버 대신 이걸 쓰는 게 가독성에 좋다.

```vim
if type(x) == v:t_string
  " ...
endif
```

### Number — 정수만, 64비트

`Number`는 **정수**다 (vim 8 이후 대부분 64비트). `Float`와 구분된다.

```vim
echo 1 / 2           " 0  (정수 나눗셈)
echo 1.0 / 2         " 0.5 (Float 섞이면 Float)
echo 0x1F            " 31  (16진수)
echo 0b101           " 5   (2진수)
echo 0o17            " 15  (8진수)
```

### Float — IEEE 754 double

옵션 `+float` 없이 컴파일된 vim에서는 못 쓰지만 요즘 빌드는 거의 다 지원.

```vim
echo 1.5 + 0.25      " 1.75
echo str2float("1.5e2")  " 150.0
echo float2nr(3.7)   " 3  (잘림)
```

### String — 큰따옴표 vs 작은따옴표

이게 함정 1순위. **두 따옴표는 동작이 다르다**.

| 따옴표 | 이스케이프 해석 |
| --- | --- |
| `"..."` | 해석함 (`\n`, `\t`, `\<esc>` 등) |
| `'...'` | 해석 안 함 (리터럴) |

```vim
echo "a\nb"          " a, 줄바꿈, b
echo 'a\nb'          " a\nb  (리터럴)

echo "\<esc>"        " ESC 문자 1개
echo '\<esc>'        " \<esc> 6글자
```

**정규식이나 경로처럼 백슬래시가 들어가는 문자열은 작은따옴표를 기본으로 쓴다**. 그래야 `\v`나 `\s`가 의도대로 들어간다.

```vim
let pat = '\v\s+$'           " OK
let pat = "\v\s+$"            " \v가 해석되지 않는 escape로 처리됨 — 함정
```

### List — `[1, 2, 3]`

배열. 4편에서 자세히.

```vim
let xs = [1, 'two', 3.0]     " 혼합 가능
echo xs[0]                   " 1
echo xs[-1]                  " 3.0  (음수 인덱스 OK)
echo xs[0:1]                 " [1, 'two']  (slice)
```

### Dictionary — `{'a': 1}`

해시맵. 4편에서 자세히.

```vim
let d = {'name': 'foo', 'age': 30}
echo d.name                  " foo  (dot 접근, 키가 식별자 형태일 때)
echo d['age']                " 30
```

### Funcref — 함수 값

함수도 값이다. 3편에서 자세히.

```vim
function! Greet(name)
  return 'hello ' . a:name
endfunction

let F = function('Greet')
echo F('world')              " hello world
```

### Special — `v:true`, `v:false`, `v:null`

vim 7.4부터 추가된 진짜 boolean/null.

```vim
echo v:true      " v:true
echo v:false     " v:false
echo v:null      " v:null

if v:true | echo 'yes' | endif
```

그 전엔 `0`/`1`로 충분히 살았기 때문에 기존 코드는 거의 `Number`로 boolean을 다룬다. **`if x` 같은 조건문에서 `0`은 falsy, **그 외 Number는 모두 truthy**. 빈 문자열 `""`은 0으로 변환되어 falsy, 비어있지 않은 문자열은 숫자 변환을 시도한다.

```vim
if 0 | echo 'no' | endif      " 출력 안 됨
if "" | echo 'no' | endif     " 출력 안 됨 (0으로 변환)
if "0" | echo 'no' | endif    " 출력 안 됨 (0으로 변환)
if "abc" | echo 'yes' | endif " 출력 안 됨 (0으로 변환)
if 1 | echo 'yes' | endif     " 출력됨
```

`if [string]`의 동작이 직관과 다르다는 게 함정. **문자열 비어있는지 확인은 `empty(s)`나 `s ==# ''`**.

## 자동 형변환 — 문자열과 숫자

vim은 문맥에 따라 알아서 변환한다. 편하지만 함정이 많다.

```vim
echo "1" + "2"       " 3   (문자열이 숫자로 변환된 후 덧셈)
echo "1" . "2"       " 12  (문자열 연결은 .)
echo 1 . 2           " 12  (숫자도 문자열로 변환됨)

echo "abc" + 1       " 1   ("abc"가 0으로 변환됨, 에러 아님)
```

**`+`는 항상 산술, `.`은 항상 문자열 연결**. 다른 언어 감각으로 `+`를 쓰면 침묵하는 버그를 만든다.

> vim 9의 vim9script에서는 이 자동 변환이 사라지고 타입 에러가 난다. 하지만 일반 Vimscript(legacy)에서는 여전히 변환됨.

## :let — 모든 할당의 기본

```vim
let x = 1
let s = "hello"
let xs = [1, 2, 3]

let xs[0] = 10           " 리스트 원소 변경
let d.name = 'bar'       " 딕셔너리 키 변경

let x += 1               " 복합 할당
let s .= " world"        " 문자열 연결 할당
```

`:let`만 단독으로 치면 현재 정의된 모든 변수를 나열한다. 디버깅용.

```vim
:let                     " 모든 변수
:let g:                  " 전역 변수만
:let x                   " x 값 보기
```

### :const — 불변 (vim 8.0.1707+)

```vim
const PI = 3.14
" let PI = 3.0           " E741: 값 변경 불가
```

리스트나 딕셔너리에 쓰면 **재바인딩만 막고, 안쪽 변경은 허용한다**. 깊은 불변은 아님.

```vim
const xs = [1, 2, 3]
" let xs = [4, 5]        " E741: 에러
call add(xs, 4)          " OK — 내부는 바꿀 수 있음
```

### :unlet — 변수 제거

```vim
let x = 1
unlet x
echo exists('x')         " 0
unlet! x                 " 없어도 에러 안 남 (! 변형)
```

## 스코프 prefix — 변수 선언의 핵심

Vimscript는 **prefix가 곧 스코프 선언**이다. `let g:foo`는 전역, `let s:foo`는 스크립트 로컬.

| prefix | 범위 | 어디서 쓰나 |
| --- | --- | --- |
| `g:` | 전역 | 사용자가 건드릴 전역 옵션 (`g:mapleader`) |
| `s:` | 스크립트 로컬 | 플러그인 내부 상태·헬퍼 함수 |
| `b:` | 버퍼 로컬 | 파일타입별 상태 (`b:undo_ftplugin`) |
| `w:` | 윈도우 로컬 | 윈도우별 상태 |
| `t:` | 탭 로컬 | 탭별 상태 |
| `l:` | 함수 로컬 | 함수 안의 명시적 로컬 |
| `a:` | 함수 인자 | `a:name`, `a:1`, `a:000` (3편) |
| `v:` | vim 내장 | `v:true`, `v:count`, `v:shell_error` |
| `&` | 옵션 | `&number`, `&l:tabstop`, `&g:colorscheme` |
| `@` | 레지스터 | `@a`, `@"`, `@+` (시스템 클립보드) |
| `$` | 환경변수 | `$HOME`, `$PATH` |

### 함수 안과 밖에서 기본 스코프가 다르다

```vim
let x = 1              " 함수 밖: g:x와 동등
function! F()
  let y = 2            " 함수 안: l:y와 동등
  echo x               " g:x 참조 (l:x가 없어서 g:로 fallback)
endfunction
```

이 자동 fallback이 함정이 된다. 함수 안에서 의도치 않게 전역을 건드릴 수 있다. **플러그인 작성 시엔 명시적으로 prefix를 붙이는 게 안전**.

### `s:` — 플러그인의 캡슐화

플러그인 파일 안에서 `s:foo`는 **그 파일에서만 보인다**. 같은 함수 이름 충돌을 막는 핵심 도구.

```vim
" plugin/myplugin.vim
let s:state = {}                    " 다른 플러그인과 충돌 없음

function! s:helper(x)               " s: 함수도 같은 규칙
  return a:x + 1
endfunction

function! myplugin#run()             " 외부 진입점은 autoload 네임스페이스
  echo s:helper(s:state.count)
endfunction
```

### `b:` — 버퍼별 상태

ftplugin에서 가장 흔하다.

```vim
" ftplugin/python.vim
setlocal expandtab shiftwidth=4
let b:undo_ftplugin = 'setlocal expandtab< shiftwidth<'
```

`b:undo_ftplugin`은 ftplugin의 관례 — 다른 파일타입으로 전환될 때 vim이 자동 실행해 원복한다.

### `&` — 옵션 변수처럼 다루기

```vim
echo &number                 " 현재 (지역 우선) 값
echo &l:tabstop              " local 값만
echo &g:colorscheme          " global 값만
let &tabstop = 4             " :set tabstop=4와 동등
let &l:tabstop = 4           " :setlocal tabstop=4와 동등
```

옵션을 동적으로 바꿀 때 `:set`보다 `let &...`이 편할 때가 있다 (변수 보간 등).

### `@` — 레지스터를 변수처럼

```vim
echo @"              " unnamed register (마지막 yank/delete)
echo @+              " 시스템 클립보드
let @a = "hello"     " a 레지스터에 직접 쓰기
```

매크로 편집할 때 유용. `qa...q`로 녹화한 후 `:let @a = ...`로 수정.

## 비교 연산자 — `==`의 함정

가장 중요한 함정. **`==`는 사용자의 `'ignorecase'` 옵션에 따라 동작이 달라진다**.

```vim
if "HELLO" == "hello"     " ignorecase가 켜져 있으면 true (지뢰)
if "HELLO" ==# "hello"    " 항상 대소문자 구분 → false
if "HELLO" ==? "hello"    " 항상 대소문자 무시 → true
```

**스크립트에서는 `==`를 절대 쓰지 말 것**. 똑같은 코드가 사용자 설정에 따라 다르게 동작한다.

같은 규칙이 `!=`, `>`, `<`, `=~` (정규식 매치), `!~` (정규식 불일치)에도 적용된다.

| 의도 | 대소문자 구분 | 대소문자 무시 |
| --- | --- | --- |
| 같음 | `==#` | `==?` |
| 다름 | `!=#` | `!=?` |
| 정규식 매치 | `=~#` | `=~?` |
| 정규식 불일치 | `!~#` | `!~?` |

### `is` / `isnot` — 참조 동일성

리스트나 딕셔너리는 `==`로 내용을 비교하고, `is`로 같은 객체인지를 비교한다.

```vim
let a = [1, 2, 3]
let b = [1, 2, 3]
let c = a

echo a == b          " 1  (내용 같음)
echo a is b          " 0  (다른 객체)
echo a is c          " 1  (같은 객체)
```

## 변수 존재 확인 — `exists()`

```vim
if exists('g:loaded_myplugin') | finish | endif
let g:loaded_myplugin = 1
```

**플러그인 로드 가드의 정석**. 두 번 로드되어 함수 재정의 에러가 나는 걸 막는다.

`exists()` 인자는 문자열이고, prefix별 의미가 약간 다르다.

```vim
echo exists('g:foo')       " 변수 존재
echo exists('*Foo')        " 함수 존재
echo exists('&number')     " 옵션 존재
echo exists(':MyCommand')  " 명령 존재 (0/1/2 반환)
echo exists('#FileType')   " autocmd 존재
```

## vim 컨텍스트

**vimrc 진입부 — 매핑 prefix 설정**

```vim
" mapleader는 매핑 정의 그 순간의 값으로 박힌다. 매핑보다 먼저 설정.
let g:mapleader = ','
let g:maplocalleader = '\\'

nnoremap <leader>w :w<cr>
```

**플러그인 진입점 — 로드 가드 + s: 상태**

```vim
" plugin/myplug.vim
if exists('g:loaded_myplug') | finish | endif
let g:loaded_myplug = 1

let s:default_opts = {'border': 'rounded', 'width': 80}

command! MyPlugRun call myplug#run()
```

**ftplugin — buffer-local 옵션 + undo**

```vim
" ftplugin/markdown.vim
if exists('b:did_ftplugin') | finish | endif
let b:did_ftplugin = 1

setlocal wrap linebreak conceallevel=2
let b:undo_ftplugin = 'setlocal wrap< linebreak< conceallevel<'
```

**조건부 옵션 적용**

```vim
if has('termguicolors')
  set termguicolors
endif

if executable('rg')
  let &grepprg = 'rg --vimgrep'
endif
```

## 함정 정리

1. **`"..."`와 `'...'`은 다르다**. 백슬래시 들어가는 패턴은 `'...'`.
2. **`+`는 산술, `.`은 문자열 연결**. `"1" + "2"`는 `3`, `1 . 2`는 `"12"`.
3. **`==`는 ignorecase에 따라 동작이 바뀜**. 항상 `==#` 또는 `==?`.
4. **함수 안에서 prefix 없는 변수는 자동 l:**, **밖에서는 자동 g:**. 의도와 다른 스코프로 새기 쉽다.
5. **`if "abc"`는 false**다 — 문자열이 숫자로 변환되어 0이 되니까. 빈 문자열 체크는 `empty(s)`.
6. **`const`는 얕은 불변**. 리스트·딕셔너리 내부는 여전히 변경 가능.
7. **`==`와 `is`는 다르다**. 내용 비교 vs 참조 동일성.

## 다음 편

2편은 **제어 흐름**: `if`/`while`/`for`, `continue`/`break`, `try/catch/finally`, 그리고 `:execute`로 동적 명령 만들기. Vimscript만의 관용구(예외 처리로 옵션 존재 확인 등)도 함께 정리한다.
