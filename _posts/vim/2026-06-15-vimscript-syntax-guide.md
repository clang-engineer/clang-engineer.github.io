---
title       : "Vimscript 종합 가이드 (legacy)"
description : "Vim 8의 legacy Vimscript 기준 문법을 한 번에 정리. 8개 타입과 스코프 prefix, 비교 연산자의 함정, 함수/람다/Funcref, List·Dict, 자주 쓰는 관용구까지."
date        : 2026-06-15 16:30:00 +0900
updated     : 2026-06-15 16:30:00 +0900
categories  : [vim, "원리·언어"]
tags        : [vimscript]
pin         : false
hidden      : false
---

Vim 9의 `:def`(vim9script)가 아닌 **legacy Vimscript** 기준으로 정리한 글이다. Neovim Lua 시대에도 `vim.cmd`/`vim.fn`을 거치면 결국 이 개념을 호출하게 되므로, 플러그인을 읽고 고치는 데 필요한 만큼의 Vimscript는 여전히 유효하다.

## 8개 타입

`type(x)`로 확인한다 (반환은 정수 상수, `v:t_number` 등으로도 비교 가능).

| 타입 | 예시 | `v:t_*` |
|---|---|---|
| `Number` | `1`, `0x1F`, `0b101`, `0o17` | `v:t_number` (0) |
| `Float` | `1.5`, `1.5e2` | `v:t_float` (5) |
| `String` | `"hi"`, `'hi'`, `[[...]]` | `v:t_string` (1) |
| `List` | `[1, 'two']` | `v:t_list` (3) |
| `Dictionary` | `{'a': 1}` | `v:t_dict` (4) |
| `Funcref` | `function('Tr')`, `{x -> x+1}` | `v:t_func` (2) |
| `Special` | `v:true`, `v:false`, `v:null` | `v:t_bool`/`v:t_null` (6) |
| `Blob` | `0z...` | `v:t_blob` (10) |

### String — 따옴표 차이가 함정 1순위

| 따옴표 | escape 해석 |
| --- | --- |
| `"..."` | 해석함 (`\n`, `\t`, `\<esc>`) |
| `'...'` | 리터럴 |

**정규식·경로처럼 백슬래시가 들어가는 문자열은 작은따옴표로 감싸야 한다.**

```vim
let pat = '\v\s+$'    " OK
let pat = "\v\s+$"     " \v가 잘못 해석됨
```

### Number — 진법 리터럴

```vim
echo 0x1F      " 31  (16진수)
echo 0b101     " 5   (2진수)
echo 0o17      " 15  (8진수)
echo 1 / 2     " 0   (정수 나눗셈)
echo 1.0 / 2   " 0.5 (Float이 섞이면 Float)
```

### 자동 형변환 — `+`는 산술, `.`은 문자열

```vim
echo "1" + "2"    " 3   (숫자 변환 후 덧셈)
echo "1" . "2"    " 12  (문자열 연결)
echo "abc" + 1    " 1   ("abc" → 0)
```

## 변수와 스코프 prefix

**Vimscript는 prefix가 곧 스코프 선언**이다.

| prefix | 범위 | 예시 |
| --- | --- | --- |
| `g:` | 전역 | `g:mapleader` |
| `s:` | 스크립트 로컬 | 플러그인 내부 |
| `b:` | 버퍼 로컬 | `b:undo_ftplugin` |
| `w:` | 윈도우 로컬 | |
| `t:` | 탭 로컬 | |
| `l:` | 함수 로컬 | (함수 안 prefix 없는 변수의 자동 스코프) |
| `a:` | 함수 인자 | `a:name`, `a:0`, `a:1`, `a:000` |
| `v:` | vim 내장 | `v:true`, `v:count`, `v:shell_error` |
| `&` | 옵션 | `&number`, `&l:tabstop`, `&g:colorscheme` |
| `@` | 레지스터 | `@a`, `@"`, `@+` (시스템 클립보드) |
| `$` | 환경변수 | `$HOME`, `$PATH` |

**함수 안에서 prefix 없는 변수는 자동 `l:`**, **밖에서는 자동 `g:`** 다.

```vim
let g:loaded_myplug = 1     " 전역
let s:state = {}            " 스크립트 로컬 (다른 플러그인과 충돌 X)
let b:did_ftplugin = 1      " ftplugin 정석
```

## :let / :const / :unlet

```vim
let x = 1
let xs[0] = 10           " 리스트 원소
let d.name = 'bar'       " 딕셔너리 키
let x += 1               " 복합 할당
let s .= " world"        " 문자열 연결 할당

const PI = 3.14          " 재바인딩 막음 (얕은 불변)
" const xs = [1,2,3] 뒤 add(xs, 4)는 OK

unlet x
unlet! x                 " 없어도 에러 X

let                      " 모든 변수 (디버깅)
let g:                   " 전역만
exists('g:foo')          " 존재 확인
exists('*Foo')           " 함수 존재
exists('&number')        " 옵션 존재
```

## 비교 연산자 — `==`의 함정

**`==`는 사용자의 `'ignorecase'` 설정에 따라 동작이 바뀐다**. 스크립트에서는 절대 쓰지 말 것.

| 의도 | 대소문자 구분 | 무시 |
| --- | --- | --- |
| 같음 | `==#` | `==?` |
| 다름 | `!=#` | `!=?` |
| 정규식 매치 | `=~#` | `=~?` |
| 정규식 불일치 | `!~#` | `!~?` |

```vim
is / isnot      " 참조 동일성 (리스트·딕셔너리가 같은 객체인지)
```

```vim
let a = [1,2,3]
let b = [1,2,3]
echo a == b    " 1 (내용 같음)
echo a is b    " 0 (다른 객체)
```

## 제어 흐름

블록은 **`endif` / `endwhile` / `endfor` / `endtry`로 닫는다**. 명령 구분자는 줄바꿈 또는 `|`.

```vim
if x > 0
elseif x < 0
else
endif

" 한 줄 가드
if exists('g:loaded') | finish | endif

" 삼항
let label = (count > 0) ? 'some' : 'none'
```

falsy 규칙:
- `0`, `""`(0으로 변환), `"0"`, `"abc"`(0으로 변환) → false
- `1`, `"1abc"`(1로 변환) → true
- **List·Dict는 `if`에 직접 못 넣는다** → `!empty(x)` 또는 `len(x)`

### while / for

```vim
while cond
  if x | continue | endif
  if y | break | endif
endwhile

for x in [10, 20, 30] | echo x | endfor
for [k, v] in items({'a':1}) | echo k.'='.v | endfor

for i in range(5)        " 0..4
for i in range(1, 10)    " 1..10 (포함)
for i in range(0, 10, 2) " step
for i in range(10,1,-1)  " 역방향
```

**순회 중 컬렉션 변경 금지** → `copy()`로 사본을 순회한다.

### try / catch / finally

```vim
try
  source ~/.vimrc.local
catch /^Vim\%((\a\+)\)\=:E484/    " 파일 없음
endtry

" 옵션·플러그인 존재 우회
try
  colorscheme gruvbox
catch /E185/
  colorscheme habamax
endtry

" 정리 보장
let save = &more
set nomore
try
  " ...
finally
  let &more = save
endtry

throw 'MyErr: ...'
" catch에서 v:exception, v:throwpoint 접근
```

### :execute — 동적 명령

```vim
execute cmd . ' ' . file

" normal 모드 특수키
execute "normal! mqA;\<esc>`q"

" 사용자 입력은 반드시 escape
execute 'edit ' . fnameescape(name)
execute '!grep ' . shellescape(pattern)
```

### :silent / :silent!

```vim
silent !rm /tmp/foo            " 출력 억제 (에러는 보임)
silent! call MaybeMissingFn()  " 에러까지 무시
```

## 함수

```vim
function! Greet(name) abort
  echom 'hello ' . a:name
endfunction

call Greet('world')
```

규칙:
1. **함수명은 대문자로 시작**한다(prefix가 없을 때). `function! greet()`는 에러.
2. **`function!`**의 `!` — 재정의를 허용한다. vimrc reload에 안전.
3. **`abort`** — 에러 발생 시 즉시 중단. 거의 항상 붙인다.
4. **인자는 `a:name`**으로만 접근.
5. `endfunction`(또는 `endfunc`)으로 닫기.

### 함수명 형태

| 형태 | 예 |
| --- | --- |
| 대문자 시작 (전역) | `Greet` |
| `s:` (스크립트 로컬) | `s:helper` |
| `b:` (버퍼 로컬) | 드묾 |
| `<SID>` (매핑에서 s: 호출) | `<SID>helper` |
| autoload | `myplug#run`, `myplug#core#init` |

### 가변 인자

```vim
function! Log(level, ...) abort
  echo a:0                 " 개수
  echo a:000               " 리스트
  if a:0 >= 1 | echo a:1 | endif
endfunction

" 기본값 인자가 없으므로 가변 인자로 흉내
function! Greet(name, ...) abort
  let greeting = a:0 >= 1 ? a:1 : 'hello'
  echo greeting . ' ' . a:name
endfunction
```

### autoload 네임스페이스

| 함수명 | 정의 위치 |
| --- | --- |
| `myplug#run()` | `autoload/myplug.vim` |
| `myplug#core#init()` | `autoload/myplug/core.vim` |

호출 시점에 파일을 로드한다. 진입점은 `plugin/`, 본체는 `autoload/`가 표준 구조.

### 람다 + Funcref

```vim
let F = {x -> x * 2}                       " vim 8.0+
let xs = map([1,2,3], {_, v -> v * 10})    " [10, 20, 30]

let F = function('Greet')                  " 이름 → Funcref
let F = funcref('Greet')                   " 정의 시점 바인딩
let Hi = function('Greet', ['hi'])         " partial (첫 인자 미리)
```

람다는 자동 closure. `function!`로 정의한 함수는 `closure` 한정자가 필요하다:

```vim
function! MakeCounter() abort
  let count = 0
  function! Inner() abort closure
    let count += 1
    return count
  endfunction
  return funcref('Inner')
endfunction
```

### dict 함수 (메서드 흉내)

```vim
let obj = {'n': 0}
function! obj.inc() dict
  let self.n += 1
  return self.n
endfunction
echo obj.inc()    " 1
```

## 호출

| 위치 | 형태 |
| --- | --- |
| 명령 (반환값 버림) | `call F(x)` |
| 표현식 | `echo F(x)`, `let y = F(x)` |

## List

```vim
let xs = [10, 'two', 3.0]
echo xs[0]       " 10
echo xs[-1]      " 3.0  (음수 인덱스)
echo xs[1:3]     " 끝값 **포함** (Python과 다름)
echo xs[:2]      " 처음~2
echo xs[3:]      " 3~끝
echo xs[:]       " 복사본
```

### 자주 쓰는 함수

| 함수 | 역할 | 파괴적? |
| --- | --- | --- |
| `add(xs, v)` | 끝에 추가 | ✓ |
| `insert(xs, v, pos)` | 위치 삽입 (기본 0) | ✓ |
| `extend(xs, ys, pos)` | 합치기 | ✓ |
| `remove(xs, i)` / `remove(xs, i, j)` | 제거하고 반환 | ✓ |
| `sort(xs, fn)` | 제자리 정렬 | ✓ |
| `reverse(xs)` | 제자리 뒤집기 | ✓ |
| `join(xs, sep)` | 문자열로 | ✗ |
| `index(xs, v)` | 인덱스 (없으면 -1) | ✗ |
| `count(xs, v)` | 등장 횟수 | ✗ |

```vim
echo sort([10, 9, 100])           " [10, 100, 9]  ← 문자열 정렬!
echo sort([10, 9, 100], 'n')      " [9, 10, 100]  숫자
echo sort([10, 9, 100], 'i')      " 대소문자 무시
echo sort(xs, {a, b -> a - b})    " 람다
```

### `map()` / `filter()` — 파괴적

**원본을 변경한다**. 보존하려면 `copy()` 먼저.

```vim
let ys = map(copy(xs), 'v:val * 2')          " 문자열 표현식
let ys = map(copy(xs), {i, v -> v * 2})      " 람다
let zs = filter(copy(xs), {i, v -> v > 5})
```

### 참조 vs 복사

```vim
let b = a           " 참조 (같은 객체)
let c = copy(a)     " 얕은 복사
let d = deepcopy(a) " 깊은 복사
```

## Dictionary

```vim
let d = {'name': 'neo', 'age': 30}
echo d.name           " dot 접근 (식별자 형태 키만)
echo d['age']         " bracket
echo d['user-name']   " 하이픈 키는 bracket 필수
let d.age = 31        " 추가/변경
unlet d.age           " 제거
```

키는 문자열만 허용된다. 숫자 키도 내부에서 문자열로 변환된다.

### 자주 쓰는 함수

| 함수 | 역할 |
| --- | --- |
| `keys(d)` / `values(d)` / `items(d)` | 키/값/쌍 리스트 (순서 X) |
| `has_key(d, k)` | 키 존재 |
| `get(d, k, default)` | 안전한 접근 |
| `remove(d, k)` | 키 제거 후 반환 |
| `extend(d, e, mode)` | 병합 (`force`/`keep`/`error`) |
| `empty(d)` / `len(d)` | 비었는지 / 크기 |
| `map(d, fn)` / `filter(d, fn)` | 파괴적 |

```vim
" 옵션 병합 정석
let final = extend(copy(s:defaults), user_opts)

" Neovim의 vim.tbl_deep_extend("force", ...)에 해당하는 깊은 병합은 직접 구현
function! s:deep_extend(a, b) abort
  for [k, v] in items(a:b)
    if has_key(a:a, k) && type(a:a[k]) == v:t_dict && type(v) == v:t_dict
      call s:deep_extend(a:a[k], v)
    else | let a:a[k] = v | endif
  endfor
  return a:a
endfunction
```

순서가 필요하면 `sort(keys(d))`로 정렬한 뒤 돌린다.

## 자주 쓰는 관용구

### 플러그인 로드 가드

```vim
if exists('g:loaded_myplug') | finish | endif
let g:loaded_myplug = 1
```

### ftplugin 표준

```vim
if exists('b:did_ftplugin') | finish | endif
let b:did_ftplugin = 1

setlocal expandtab shiftwidth=4
let b:undo_ftplugin = 'setlocal expandtab< shiftwidth<'
```

### augroup으로 중복 등록 방지

```vim
augroup MyAutos
  autocmd!
  autocmd FileType python,lua call s:setup_indent()
augroup END
```

### 매핑 일괄 등록

```vim
let s:maps = [
\  ['<leader>w', ':w<cr>'],
\  ['<leader>q', ':q<cr>'],
\ ]
for [lhs, rhs] in s:maps
  execute 'nnoremap ' . lhs . ' ' . rhs
endfor
```

> 줄 끝 `\`은 다음 줄 이어쓰기.

### 매핑에서 `s:` 함수 호출

```vim
function! s:on_enter() abort
  echo 'entered'
endfunction
nnoremap <leader>e :call <SID>on_enter()<cr>
```

### 조건부 옵션

```vim
if has('termguicolors') | set termguicolors | endif
if executable('rg') | let &grepprg = 'rg --vimgrep' | endif
```

## 함정 정리

1. **`"..."`와 `'...'`는 다르다**. 백슬래시가 들어가는 패턴은 `'...'`.
2. **`+`는 산술, `.`는 문자열 연결**. 절대 헷갈리지 말 것.
3. **`==`는 ignorecase 영향을 받는다** → 항상 `==#` 또는 `==?`.
4. **`==`(내용)과 `is`(참조)는 다르다**.
5. **함수 안 prefix 없는 변수는 자동 `l:`**, 밖에서는 자동 `g:`.
6. **`if "abc"`는 false** (0으로 변환). 빈 문자열 체크는 `empty(s)`.
7. **함수명 대문자 시작** + **`function!`** + **`abort`** 거의 항상.
8. **`map()`/`filter()`는 파괴적** → `copy()` 먼저.
9. **슬라이스 끝값 포함** (Python·Lua와 다르다).
10. **`sort()` 기본은 문자열 정렬** → 숫자는 `'n'` 옵션.
11. **`extend()`는 얕은 병합** → 중첩은 직접 재귀.
12. **할당은 참조** → `let b = a` 후 b를 수정하면 a도 변한다.
