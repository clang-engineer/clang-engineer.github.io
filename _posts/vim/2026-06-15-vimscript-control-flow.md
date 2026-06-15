---
title       : "Vimscript 문법 2 — 제어 흐름"
description : "if/while/for, continue/break, try/catch/finally, :execute로 동적 명령 생성. Vimscript 특유의 :endif·:endfor·라인 구분 규칙까지."
date        : 2026-06-15 15:00:00 +0900
updated     : 2026-06-15 15:00:00 +0900
categories  : [vim, "원리·언어"]
tags        : [vimscript]
pin         : false
hidden      : false
---

Vimscript의 제어 흐름은 다른 언어와 비슷해 보이지만 **블록 종료 키워드(`endif`, `endfor`, `endwhile`)** 와 **한 줄 = 한 명령** 규칙 때문에 의외로 자주 막힌다. 이번 편은 각 구문의 정확한 동작, `try/catch`로 옵션·함수 존재를 우회하는 관용구, `:execute`로 동적 명령을 만드는 패턴까지 정리한다.

## 결론 먼저

- 블록은 `if`/`endif`, `while`/`endwhile`, `for`/`endfor`, `try`/`endtry`로 닫는다.
- **명령 구분자는 줄바꿈 또는 `|`**. 한 줄에 여러 명령은 `|`로 잇는다.
- `for`는 **리스트 순회**만. C 스타일 `for(i=0;...)`는 없고 `range()`로 만든다.
- **`continue`는 있다** (Lua와 다른 점). `break`도 있음.
- `try/catch`는 **옵션·함수·플러그인 존재 확인을 우회**하는 관용구로도 쓰인다.

## if / elseif / else / endif

```vim
if x > 0
  echo 'positive'
elseif x < 0
  echo 'negative'
else
  echo 'zero'
endif
```

블록 끝에 **반드시 `endif`**. `elseif`는 한 단어 (`else if`로 띄면 endif가 한 번 더 필요해진다).

falsy 규칙은 1편 복습: **0과 0으로 변환되는 값은 falsy**. 문자열이 숫자로 변환되어 0이 되는 함정 주의.

```vim
if ""        | echo 'no'  | endif    " 출력 안 됨 (0)
if "0"       | echo 'no'  | endif    " 출력 안 됨 (0)
if "abc"     | echo 'no'  | endif    " 출력 안 됨 (0)
if "1abc"    | echo 'yes' | endif    " 출력됨 (1로 변환)
if []        | echo 'no'  | endif    " 에러! Number만 받음
```

**리스트·딕셔너리는 `if`에 직접 못 넣는다**. `empty()`나 `len()`으로 감싸야 한다.

```vim
if !empty(xs)
  " 비어있지 않을 때
endif
```

### `|`로 한 줄에 묶기

```vim
if exists('g:loaded') | finish | endif
```

vimrc·플러그인에서 자주 보는 관용구. 가독성을 위해서가 아니라 **한 줄 가드**가 필요할 때 쓴다.

### inline if는 없다 — 삼항 흉내는 `?:`

```vim
let label = (count > 0) ? 'some' : 'none'
```

C 스타일 삼항 연산자가 있다. 다른 언어처럼 작동.

## while

```vim
let i = 1
while i <= 5
  echo i
  let i += 1
endwhile
```

`break`로 탈출, `continue`로 다음 반복.

```vim
let i = 0
while i < 10
  let i += 1
  if i % 2 == 0 | continue | endif
  if i > 7 | break | endif
  echo i        " 1 3 5 7
endwhile
```

## for — 리스트 순회만

Vimscript의 `for`는 **리스트(또는 그에 준하는 객체)만 순회**한다. C 스타일 `for(i=0; i<n; i++)`는 없다.

```vim
for x in [10, 20, 30]
  echo x
endfor

for [k, v] in items({'a': 1, 'b': 2})    " 딕셔너리 순회 패턴
  echo k . '=' . v
endfor
```

### 정수 카운트는 `range()`

```vim
for i in range(5)         " 0, 1, 2, 3, 4
  echo i
endfor

for i in range(1, 10)     " 1..10 (끝값 포함)
  echo i
endfor

for i in range(0, 10, 2)  " 0, 2, 4, 6, 8, 10  (step)
  echo i
endfor

for i in range(10, 1, -1) " 10..1 역방향
  echo i
endfor
```

`range()` 결과는 **실제 리스트**다. 크면 메모리 잡아먹는다 — 보통은 신경 안 써도 됨.

### unpacking — `[k, v]` 패턴

리스트의 원소가 또 리스트라면 한 번에 풀 수 있다.

```vim
for [name, age] in [['neo', 30], ['morpheus', 40]]
  echo name . ' is ' . age
endfor
```

`items(dict)`가 정확히 `[키, 값]` 쌍의 리스트를 반환하기 때문에 위 패턴이 딕셔너리 순회의 정석이 된다.

### 함정: 순회 중 컬렉션 변경

리스트를 도는 중에 추가/삭제하면 결과가 정의되지 않는다.

```vim
let xs = [1, 2, 3]
for x in xs
  call add(xs, x * 10)    " 무한 루프 위험
endfor
```

원본을 보호하려면 `copy()`로 복사본을 돈다.

```vim
for x in copy(xs)
  call add(xs, x * 10)    " xs는 [1, 2, 3, 10, 20, 30]
endfor
```

## break / continue

`while`, `for` 둘 다에 동작한다. Lua와 달리 **`continue`가 정상적으로 있다**.

```vim
for x in range(10)
  if x % 2 == 0 | continue | endif
  if x > 7 | break | endif
  echo x        " 1 3 5 7
endfor
```

## try / catch / finally

vim 7에서 추가. 예외 처리뿐 아니라 **존재 확인 우회 관용구**로도 자주 쓴다.

```vim
try
  source ~/.vimrc.local
catch /^Vim\%((\a\+)\)\=:E484/    " 파일 없음
  " 무시
endtry
```

### 패턴: 옵션·플러그인 존재 우회

```vim
try
  colorscheme gruvbox
catch /^Vim\%((\a\+)\)\=:E185/    " colorscheme 없음
  colorscheme default
endtry
```

`exists()`로 확인할 수 없는 경우 (예: colorscheme 파일이 runtimepath에 있는지) try/catch가 가장 깔끔하다.

### 정규식 매칭으로 특정 에러만 잡기

vim 에러는 `E<번호>` 형식. `^Vim:E484`처럼 정규식으로 특정 번호만 잡을 수 있다.

```vim
try
  call SomeFunc()
catch /E117/    " Unknown function
  echom 'function not defined yet'
catch            " 그 외 모든 예외
  echom 'unknown error: ' . v:exception
endtry
```

`v:exception`은 catch 블록에서 잡힌 메시지, `v:throwpoint`는 발생 위치.

### finally — 항상 실행

```vim
let save = &more
set nomore
try
  " 무언가 출력 많이
finally
  let &more = save     " 예외가 나든 안 나든 복원
endtry
```

옵션을 임시로 바꿨다가 원복할 때의 정석.

### :throw — 직접 예외 던지기

```vim
function! Divide(a, b)
  if a:b == 0
    throw 'DivByZero: cannot divide by zero'
  endif
  return a:a / a:b
endfunction
```

catch에서는 정규식으로 매칭.

```vim
try
  call Divide(1, 0)
catch /DivByZero/
  echom 'caught'
endtry
```

## :execute — 동적 명령 생성

문자열을 vim 명령으로 실행한다. 매핑 키나 변수를 명령에 끼워넣을 때 핵심.

```vim
let cmd = 'edit'
let file = '~/.vimrc'
execute cmd . ' ' . file       " :edit ~/.vimrc 실행

" 매핑 정의를 함수에서 만들 때
execute 'nnoremap <leader>' . key . ' :' . action . '<cr>'
```

### `:execute "normal! ..."` — 표준 관용구

`:normal!`만으로는 `<esc>`, `<cr>` 같은 특수키를 문자로 받지 못한다. `:execute`로 감싸면 큰따옴표 안의 백슬래시 표기를 해석해준다.

```vim
execute "normal! mqA;\<esc>`q"
```

→ 현재 위치를 `q`에 마크 → 줄 끝 삽입 → `;` 입력 → esc → 마크 복귀.

**스크립트 안에서 normal 모드 명령을 호출할 때 거의 항상 이 형태**. `!`는 사용자 매핑을 무시하라는 뜻 (자세한 건 [Learn Vimscript the Hard Way 핵심 정리](/posts/learn-vimscript-the-hard-way/) 11장 참고).

### 함정: `:execute`에 사용자 입력 그대로 넣지 말 것

```vim
let name = input('name: ')
execute 'edit ' . name      " 사용자가 ' | call system("rm -rf ~")'를 넣으면?
```

명령 인젝션이 가능하다. 사용자 입력을 명령에 넣을 땐 `fnameescape()`, `shellescape()`로 감싼다.

```vim
execute 'edit ' . fnameescape(name)
```

## :silent / :silent! — 출력·에러 억제

```vim
silent !rm /tmp/foo            " 명령 출력 안 보임 (에러는 보임)
silent! call MaybeMissingFn()  " 에러까지 무시 (있으면 실행, 없으면 조용)
```

`silent!`는 **함수가 있을 수도 있고 없을 수도 있을 때** 자주 쓴다. try/catch보다 가볍지만 무엇이 실패했는지 모르게 된다.

## vim 컨텍스트

**플러그인 로드 가드 + 옵션 확인**

```vim
if exists('g:loaded_myplug') | finish | endif
if !has('python3')
  echohl WarningMsg | echo 'myplug needs +python3' | echohl None
  finish
endif
let g:loaded_myplug = 1
```

**매핑 일괄 등록 — 데이터 + for 루프**

```vim
let s:maps = [
\  ['<leader>w', ':w<cr>'],
\  ['<leader>q', ':q<cr>'],
\  ['<leader>x', ':x<cr>'],
\ ]
for [lhs, rhs] in s:maps
  execute 'nnoremap ' . lhs . ' ' . rhs
endfor
```

> 줄 끝 `\`은 다음 줄로 이어지는 표시. 별도 문법(`:set cpoptions`)이 영향 — vimrc 안에서는 안전.

**autocmd group + 조건 분기**

```vim
augroup MyAutos
  autocmd!
  autocmd FileType python,lua call s:setup_indent()
  autocmd BufWritePre *.py %s/\s\+$//e
augroup END

function! s:setup_indent() abort
  if &filetype ==# 'python'
    setlocal expandtab shiftwidth=4
  elseif &filetype ==# 'lua'
    setlocal expandtab shiftwidth=2
  endif
endfunction
```

**colorscheme fallback**

```vim
try
  colorscheme gruvbox
catch /E185/
  colorscheme habamax    " vim 9 내장
endtry
```

## 함정 정리

1. **블록은 `endif`/`endfor`/`endwhile`/`endtry`로 닫는다**. 잊기 쉽다.
2. **명령 구분자는 줄바꿈 또는 `|`**. 한 줄에 여러 개는 `|`.
3. **`if`에 리스트·딕셔너리 직접 못 넣는다**. `!empty(x)` 또는 `len(x)`.
4. **`for`는 리스트 순회만**. 정수 카운트는 `range()`.
5. **순회 중 컬렉션 변경 금지**. 필요하면 `copy()`로 사본 순회.
6. **`:execute`에 사용자 입력 그대로 넣지 말 것**. `fnameescape`/`shellescape`로 감싸기.
7. **`silent!`는 에러를 침묵시키지만 진단을 어렵게 한다**. 가능하면 `exists()` + 분기.

## 다음 편

3편은 **함수** — `function!`/`abort`, 인자 `a:name`/`a:1`/`a:000`, 람다 `{x -> x + 1}`, Funcref와 `function()`. 그리고 `dict` 함수로 메서드 흉내 내기와 `closure` 한정자까지 다룬다.
