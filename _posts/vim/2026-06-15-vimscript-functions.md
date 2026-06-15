---
title       : "Vimscript 문법 3 — 함수"
description : "function!/abort, 인자 a:name·a:1·a:000, 람다 {x -> x+1}, Funcref와 function(), dict 함수와 closure 한정자, autoload 네임스페이스까지."
date        : 2026-06-15 16:00:00 +0900
updated     : 2026-06-15 16:00:00 +0900
categories  : [vim, "원리·언어"]
tags        : [vimscript]
pin         : false
hidden      : false
---

Vimscript의 함수는 다른 언어에 비해 **선언 규칙이 까다롭다**. 대문자 시작 강제, `function!`의 `!`, `abort` 한정자, 인자 prefix `a:` 등 외워야 할 게 많다. 대신 익히고 나면 vimrc 한 줄 한 줄이 다 읽힌다. 이번 편은 함수 정의의 모든 형태, 인자 패턴, 람다/Funcref, 그리고 autoload 네임스페이스까지 정리한다.

## 결론 먼저

- 함수명은 **대문자 시작 강제** (스코프 prefix가 없을 때).
- **`function!`의 `!`** — 재정의 허용. vimrc reload를 위해 거의 항상 붙임.
- **`abort`** — 에러 발생 시 함수 즉시 중단. 거의 항상 붙임.
- 인자는 `a:name`. 가변 인자는 `...`, 개수는 `a:0`, 리스트는 `a:000`.
- 람다 `{x -> x + 1}`는 vim 8.0부터. 결과는 Funcref.
- `dict` 한정자 = 메서드 (`self` 접근), `closure` 한정자 = 외부 스코프 캡처.

## 함수 정의 — 기본형

```vim
function! Greet(name) abort
  echom 'hello ' . a:name
endfunction

call Greet('world')        " hello world
```

규칙 5가지:

1. **함수명 대문자 시작** (스코프 prefix가 없을 때). `function! greet()`은 에러.
2. **`function!`의 `!`**. 같은 이름이 이미 정의되어 있어도 덮어쓰기. vimrc를 `:source %`로 다시 읽을 때 에러 방지.
3. **`abort`**. 함수 안에서 에러 발생 시 그 자리에서 중단. 없으면 에러가 나도 다음 줄을 계속 실행해 상태가 망가진다.
4. **`endfunction`으로 닫기**. 줄임말 `:endfunc` 허용.
5. **인자는 `a:이름`으로 접근**. 그냥 `name`으로 못 씀.

### 함수명 규칙

| 형태 | 가능 여부 | 예시 |
| --- | --- | --- |
| 대문자 시작 | OK (전역) | `Greet` |
| 소문자 시작 | 에러 | ~~`greet`~~ |
| `s:` 시작 | OK (스크립트 로컬) | `s:helper` |
| `b:` 시작 | OK (버퍼 로컬, 드물게 사용) | `b:on_save` |
| `<SID>` | s: 함수를 매핑 RHS에서 호출 | `<SID>helper` |
| autoload 네임스페이스 | OK | `myplug#run` |

소문자 함수명을 만들고 싶으면 prefix를 붙이는 수밖에 없다. 그래서 플러그인 내부 함수는 대부분 `s:helper` 형태.

### `abort`를 왜 거의 항상 붙이나

```vim
function! Bad()         " abort 없음
  let x = undefined_var  " 에러 발생
  echo 'still running'   " 그래도 실행됨!
endfunction

function! Good() abort
  let x = undefined_var  " 에러 발생 → 즉시 중단
  echo 'never reached'
endfunction
```

abort 없으면 함수가 망가진 상태로 끝까지 돌아간다. **abort는 거의 항상 붙인다**.

## 인자

### 명명된 인자

```vim
function! Add(a, b) abort
  return a:a + a:b
endfunction

echo Add(1, 2)         " 3
```

**인자는 `a:` prefix로만 접근**한다. `a` 그냥 쓰면 다른 변수.

### 가변 인자 `...`

함수 시그니처 끝에 `...`을 쓰면 나머지 인자를 받는다.

```vim
function! Log(level, ...) abort
  echo a:level . ': ' . join(a:000, ' ')
endfunction

call Log('info', 'user', 'logged', 'in')
" info: user logged in
```

세 가지 접근 방법:

| 표현 | 의미 |
| --- | --- |
| `a:0` | 가변 인자 개수 (Number) |
| `a:000` | 가변 인자 전체 (List) |
| `a:1`, `a:2`, ... | 개별 인자 (있을 때만) |

```vim
function! F(...)
  echo a:0                 " 인자 개수
  echo a:000               " 인자 리스트
  if a:0 >= 1 | echo a:1 | endif
endfunction
```

`a:1` 접근은 그 인덱스에 인자가 실제로 있을 때만 안전하다. `a:0`로 먼저 확인.

### 기본값 인자가 없다 (legacy)

Vimscript(legacy)에는 기본값 인자 문법이 없다. 가변 인자로 흉내 낸다.

```vim
function! Greet(name, ...) abort
  let greeting = a:0 >= 1 ? a:1 : 'hello'
  echo greeting . ' ' . a:name
endfunction

call Greet('neo')              " hello neo
call Greet('neo', 'hi')        " hi neo
```

> vim 9의 `:def` 함수에서는 `function! F(name: string, greeting = 'hello')` 처럼 기본값을 직접 쓸 수 있다.

## 반환값

명시적 `return`이 없으면 `0`을 반환한다.

```vim
function! NoReturn()
endfunction
echo NoReturn()        " 0
```

리스트·딕셔너리 등 다른 타입을 명시적으로 반환할 수 있다.

```vim
function! MakeOpts() abort
  return {'width': 80, 'height': 24}
endfunction
```

## 호출 — `:call` vs 표현식

| 위치 | 형태 |
| --- | --- |
| 명령 (반환값 버림) | `:call F(x)` |
| 표현식 (반환값 사용) | `echo F(x)`, `let y = F(x)` |

```vim
call Greet('world')          " 명령으로
let g = Greet('world')        " 표현식으로 (이 경우 echo 결과만 보임)
```

vim 9의 `:def` 함수에서는 `:call`이 선택이지만, legacy에서는 **표현식이 아닌 위치에서 함수를 부르려면 `:call` 필수**.

## 스코프 prefix가 있는 함수

### `s:` — 스크립트 로컬

```vim
" plugin/myplug.vim
function! s:helper(x) abort
  return a:x * 2
endfunction

function! myplug#run() abort
  echo s:helper(21)
endfunction
```

`s:helper`는 그 `.vim` 파일 안에서만 보인다. 다른 플러그인과 이름이 겹쳐도 충돌 없음.

### `<SID>` — s: 함수를 매핑에서 호출

매핑 RHS는 글로벌 컨텍스트라 `s:` 함수를 직접 못 부른다. `<SID>`로 우회.

```vim
function! s:on_enter() abort
  echo 'entered'
endfunction

nnoremap <silent> <leader>e :call <SID>on_enter()<cr>
```

`<SID>`는 vim이 매핑 정의 시점의 스크립트 ID로 치환해준다.

### autoload 네임스페이스 — `#`

함수명에 `#`을 쓰면 자동 로드 대상이 된다. `#`이 곧 파일 경로.

| 함수명 | 정의 위치 |
| --- | --- |
| `myplug#run()` | `autoload/myplug.vim` |
| `myplug#core#init()` | `autoload/myplug/core.vim` |

호출 시점에 파일이 로드된다. 시작 시간을 줄이는 표준 메커니즘.

```vim
" autoload/myplug.vim
function! myplug#run() abort     " s: 같은 캡슐화 효과
  echo 'running'
endfunction
```

> autoload 함수는 진입점으로 쓸 수 없다 — `:command MyRun call myplug#run()`처럼 `plugin/`에서 매핑·커맨드를 만들고 그 안에서 호출하는 패턴.

## 람다 `{x -> x + 1}`

vim 8.0부터. 결과는 **Funcref**이고, `function('Name')`과 동일한 자리에 쓸 수 있다.

```vim
let F = {x -> x * 2}
echo F(21)                   " 42

let xs = map([1, 2, 3], {_, v -> v * 10})
echo xs                       " [10, 20, 30]
```

`map()`/`filter()` 콜백 형태가 람다 도입 전후로 갈린다.

```vim
" 람다 이전 (문자열 형태, 여전히 동작)
echo map([1, 2, 3], 'v:val * 2')

" 람다 이후
echo map([1, 2, 3], {_, v -> v * 2})
```

람다는 자동으로 **외부 변수를 캡처**한다 (closure).

```vim
function! MakeAdder(n) abort
  return {x -> x + a:n}
endfunction

let add5 = MakeAdder(5)
echo add5(3)                 " 8
```

## Funcref — 함수 값

함수도 값이다. 변수에 담고 인자로 전달할 수 있다.

```vim
function! Greet(name) abort
  return 'hello ' . a:name
endfunction

let F = function('Greet')
echo F('world')              " hello world
```

`function('Name')`은 이름으로 Funcref를 만든다. 람다 결과도 같은 Funcref.

### `funcref()` — 정의 시점 바인딩

`function()`은 호출 시점에 함수를 찾는다. 같은 이름의 함수를 나중에 재정의하면 새 정의를 부른다.

```vim
function! G() | echo 'old' | endfunction
let F = function('G')
function! G() | echo 'new' | endfunction
call F()                     " new (호출 시점에 G 찾음)
```

`funcref()`는 정의 시점에 바인딩한다. 재정의해도 옛 함수가 살아있다.

```vim
function! G() | echo 'old' | endfunction
let F = funcref('G')
function! G() | echo 'new' | endfunction
call F()                     " old (정의 시점 바인딩)
```

거의 항상 `function()`으로 충분. `funcref()`는 라이브러리에서 안전한 콜백을 보장하고 싶을 때.

### partial — 일부 인자 미리 바인딩

```vim
function! Greet(greeting, name) abort
  return a:greeting . ' ' . a:name
endfunction

let Hi = function('Greet', ['hi'])    " 첫 인자 미리 바인딩
echo Hi('neo')                          " hi neo
```

## `dict` 한정자 — 메서드 흉내

함수에 `dict` 한정자를 붙이면 딕셔너리의 메서드처럼 동작한다. 안에서 `self`로 자기 자신 접근.

```vim
function! Counter() abort
  let obj = {'n': 0}
  function! obj.inc() dict
    let self.n += 1
    return self.n
  endfunction
  return obj
endfunction

let c = Counter()
echo c.inc()                 " 1
echo c.inc()                 " 2
```

요즘은 람다와 closure로 더 자연스럽게 쓰는 경우가 많다.

## `closure` 한정자

`function!`로 정의한 함수는 외부 스코프를 자동으로 캡처하지 않는다 (람다와 다른 점). 캡처하려면 `closure` 한정자를 붙인다.

```vim
function! MakeCounter() abort
  let count = 0
  function! Inner() abort closure
    let count += 1            " 외부 count 캡처
    return count
  endfunction
  return funcref('Inner')
endfunction

let c = MakeCounter()
echo c()                     " 1
echo c()                     " 2
```

람다는 `closure` 자동 적용이라 위 패턴을 더 간결하게 쓸 수 있다.

```vim
function! MakeCounter() abort
  let count = 0
  return {-> [extend(l:, {'count': count + 1}), count][1]}
  " 가독성을 위해선 보통 function! + closure 형태가 낫다
endfunction
```

## vim 컨텍스트

**플러그인 구조 — plugin/ 진입점 + autoload/ 본체**

```vim
" plugin/myplug.vim
if exists('g:loaded_myplug') | finish | endif
let g:loaded_myplug = 1

command! MyPlugRun call myplug#run()
nnoremap <silent> <leader>m :MyPlugRun<cr>
```

```vim
" autoload/myplug.vim
function! myplug#run() abort
  call s:prepare()
  echo 'running...'
endfunction

function! s:prepare() abort
  " 내부 헬퍼
endfunction
```

진입점은 `plugin/`에 두고 실제 로직은 `autoload/`로 미루는 게 표준. 시작 시간이 짧아진다.

**autocmd 콜백을 함수로 분리**

```vim
function! s:on_save() abort
  if &filetype ==# 'python'
    %s/\s\+$//e
  endif
endfunction

augroup MyTrim
  autocmd!
  autocmd BufWritePre * call s:on_save()
augroup END
```

**Operator-pending 매핑 + `<SID>`**

```vim
function! s:next_paren(visual) abort
  execute "normal! f(v" . (a:visual ? 'i(' : 'i(')
endfunction

onoremap <silent> in( :<c-u>call <SID>next_paren(0)<cr>
xnoremap <silent> in( :<c-u>call <SID>next_paren(1)<cr>
```

**Funcref를 옵션 값으로 (`statusline` 등)**

```vim
function! StatusFile() abort
  return expand('%:t') ==# '' ? '[No Name]' : expand('%:t')
endfunction

set statusline=%{StatusFile()}%=%l:%c
```

옵션 안의 `%{...}`는 매 redraw마다 평가된다. 비싼 함수는 캐싱.

## 함정 정리

1. **함수명 대문자 시작 강제** (prefix 없을 때). `Foo` OK, `foo` 에러.
2. **`function!` 안 붙이면 재정의 에러** — vimrc reload 때마다 깨진다.
3. **`abort` 없으면 에러 후에도 계속 실행**. 거의 항상 붙일 것.
4. **인자는 `a:name`**. `name`으로 직접 접근 안 됨.
5. **`a:1` 접근은 `a:0` 확인 후**. 없으면 E121 (Undefined variable).
6. **매핑 RHS에서 `s:` 직접 호출 불가** — `<SID>` 사용.
7. **autoload 함수는 진입점으로 못 쓴다** — `:command`/`:map`은 `plugin/`에.
8. **`function!`는 외부 변수 자동 캡처 X**. 캡처하려면 `closure` 한정자 또는 람다.
9. **dict 함수 안의 `self`는 호출 형태에 따라 다르다**. `c.inc()`로 호출해야 self가 c.

## 다음 편

4편은 **리스트와 딕셔너리** — 인덱싱·슬라이싱, 자주 쓰는 메서드(`add`/`extend`/`insert`/`sort`), `map()`/`filter()`의 파괴적 동작, `copy()`/`deepcopy()`, 그리고 딕셔너리 키 접근의 dot vs bracket 차이. 시리즈를 마무리하는 핵심 자료구조 편.
