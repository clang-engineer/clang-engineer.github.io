---
title       : "Vimscript 문법 4 — 리스트와 딕셔너리"
description : "인덱싱/슬라이싱, add/extend/insert/sort, map과 filter의 파괴적 동작, copy와 deepcopy, 딕셔너리 dot vs bracket 차이까지."
date        : 2026-06-15 17:00:00 +0900
updated     : 2026-06-15 17:00:00 +0900
categories  : [vim, "원리·언어"]
tags        : [vimscript]
pin         : false
hidden      : false
---

Vimscript의 자료구조는 사실상 **List와 Dictionary 두 개**다. 옵션 파싱, 매핑 정의 묶음, 플러그인 설정, 함수 인자 풀기까지 거의 모든 코드가 이 둘 위에 올라간다. 이번 편은 두 타입의 정확한 동작, 자주 쓰는 메서드, **`map()`/`filter()`의 파괴적 동작** 같은 함정을 정리한다. 시리즈를 마무리하는 핵심 자료구조 편.

## 결론 먼저

- 인덱스는 **0부터** (Lua와 반대, 일반 언어와 같음).
- 음수 인덱스 OK, 슬라이스 `[a:b]`도 OK (끝값 **포함**).
- **`map()`/`filter()`는 원본을 변경**한다. 보존하려면 `copy()` 또는 `deepcopy()` 후 호출.
- 딕셔너리 키는 **문자열만**. 숫자 키도 내부에서 문자열로 변환.
- 딕셔너리 dot 접근(`d.name`)은 키가 **식별자 형태일 때만** 가능.
- 할당은 **참조**다. `let b = a` 후 `b` 변경하면 `a`도 바뀐다.

## List

### 생성과 인덱싱

```vim
let xs = [10, 'two', 3.0, [1, 2]]
echo xs[0]                   " 10
echo xs[-1]                  " [1, 2]  (마지막)
echo xs[-2]                  " 3.0

echo len(xs)                 " 4
echo empty(xs)               " 0
echo empty([])               " 1
```

### 슬라이스 `[a:b]` — 끝값 포함

```vim
let xs = [0, 1, 2, 3, 4]
echo xs[1:3]                 " [1, 2, 3]   (끝값 포함, Python과 다름)
echo xs[:2]                  " [0, 1, 2]
echo xs[3:]                  " [3, 4]
echo xs[:]                   " [0, 1, 2, 3, 4]  (복사본)
echo xs[-2:]                 " [3, 4]
```

**Python·Lua와 가장 다른 점**: 끝 인덱스가 포함된다. `xs[1:3]`이 원소 3개. 이거 하나만 기억해두면 헷갈릴 일이 없다.

### 변경

```vim
let xs = [10, 20, 30]
let xs[0] = 99               " [99, 20, 30]
let xs += [40, 50]           " [99, 20, 30, 40, 50]  (연결)
let xs[1:2] = ['a', 'b']     " [99, 'a', 'b', 40, 50]  (슬라이스 치환)
unlet xs[0]                  " [20, 30, 'a', 'b', 40, 50]  (원소 제거)
```

### 자주 쓰는 함수

| 함수 | 역할 | 파괴적? |
| --- | --- | --- |
| `add(xs, v)` | 끝에 추가 | ✓ |
| `insert(xs, v, pos=0)` | 위치에 삽입 | ✓ |
| `extend(xs, ys, pos)` | 다른 리스트 합치기 | ✓ |
| `remove(xs, i)` | 인덱스 제거하고 반환 | ✓ |
| `remove(xs, i, j)` | 슬라이스 제거 | ✓ |
| `sort(xs, fn)` | 제자리 정렬 | ✓ |
| `reverse(xs)` | 제자리 뒤집기 | ✓ |
| `join(xs, sep)` | 문자열로 합침 | ✗ |
| `index(xs, v)` | 값의 인덱스 (없으면 -1) | ✗ |
| `count(xs, v)` | 등장 횟수 | ✗ |
| `min(xs)`, `max(xs)` | 최솟·최댓값 | ✗ |

```vim
let xs = [3, 1, 4, 1, 5]
call add(xs, 9)              " [3, 1, 4, 1, 5, 9]
call sort(xs)                " [1, 1, 3, 4, 5, 9]
echo join(xs, ',')           " 1,1,3,4,5,9
echo index(xs, 4)            " 3
```

### `sort()` — 기본은 문자열 정렬

함정 1순위. **`sort()`의 기본 비교는 문자열 비교**다.

```vim
echo sort([10, 9, 100])      " [10, 100, 9]   (문자열 정렬!)
echo sort([10, 9, 100], 'n') " [9, 10, 100]   (숫자 정렬)
echo sort([10, 9, 100], 'N') " [9, 10, 100]   (자연 정렬)
echo sort([10, 9, 100], {a, b -> a - b})   " 람다 비교
```

`sort(xs, 'n')`로 숫자 정렬, `sort(xs, 'i')`로 대소문자 무시. 람다로 임의 비교.

### `map()` / `filter()` — 파괴적

**가장 많이 물리는 함정**. 원본 리스트를 직접 변경한다.

```vim
let xs = [1, 2, 3]
let ys = map(xs, 'v:val * 2')
echo xs                      " [2, 4, 6]   원본도 바뀜
echo ys                      " [2, 4, 6]   같은 참조
```

원본 보존하려면 **반드시 `copy()`** 먼저.

```vim
let xs = [1, 2, 3]
let ys = map(copy(xs), 'v:val * 2')
echo xs                      " [1, 2, 3]   유지
echo ys                      " [2, 4, 6]
```

콜백 형태 두 가지:

```vim
" 문자열 표현식 — v:val, v:key 사용
echo map(copy([1, 2, 3]), 'v:val * 2')

" 람다 (vim 8.0+)
echo map(copy([1, 2, 3]), {i, v -> v * 2})
echo filter(copy([1, 2, 3, 4]), {i, v -> v % 2 == 0})
```

람다 인자 2개: 인덱스(또는 키), 값.

### 참조 vs 복사

```vim
let a = [1, 2, 3]
let b = a                    " 참조 복사 (같은 객체)
let b[0] = 99
echo a                       " [99, 2, 3]   a도 바뀜
echo a is b                  " 1

let c = copy(a)              " 얕은 복사
let c[0] = 7
echo a                       " [99, 2, 3]   c 변경에 영향 없음
echo a is c                  " 0

let nested = [[1, 2], [3, 4]]
let shallow = copy(nested)
let shallow[0][0] = 'x'
echo nested[0][0]            " 'x'   안쪽은 공유

let deep = deepcopy(nested)
let deep[0][0] = 'y'
echo nested[0][0]            " 'x'   안쪽까지 분리
```

규칙: **재할당만 막으려면 `copy()`, 중첩까지 분리하려면 `deepcopy()`**.

## Dictionary

### 생성과 접근

```vim
let d = {'name': 'neo', 'age': 30}
echo d.name                  " neo   (dot 접근)
echo d['name']               " neo   (bracket 접근)
echo d['age']                " 30

echo len(d)                  " 2
echo empty(d)                " 0
echo has_key(d, 'name')      " 1
echo get(d, 'missing', 'default')   " default
```

### 키는 문자열만

숫자 키도 내부에서 문자열로 변환된다.

```vim
let d = {1: 'one', 2: 'two'}
echo d[1]                    " one
echo d['1']                  " one    (같음)
echo keys(d)                 " ['1', '2']   문자열
```

### dot vs bracket 함정

dot 접근(`d.name`)은 **키가 `[A-Za-z_][A-Za-z0-9_]*` 형태일 때만** 가능하다. 하이픈, 공백, 숫자 시작 등은 bracket 필수.

```vim
let d = {'user-name': 'neo', '1st': 'first'}
echo d.user-name             " 에러! 'd.user' - 'name'으로 파싱됨
echo d['user-name']          " neo   OK
echo d['1st']                " first OK
```

내가 만드는 키는 식별자 형태로 통일하면 이 함정을 피할 수 있다.

### 변경

```vim
let d = {'name': 'neo'}
let d.age = 30               " 추가
let d.name = 'morpheus'       " 변경
unlet d.age                  " 제거
echo d                       " {'name': 'morpheus'}
```

### 자주 쓰는 함수

| 함수 | 역할 |
| --- | --- |
| `keys(d)` | 키 리스트 (순서 보장 X) |
| `values(d)` | 값 리스트 (순서 보장 X) |
| `items(d)` | `[키, 값]` 리스트 (for 루프용) |
| `has_key(d, k)` | 키 존재 여부 |
| `get(d, k, default)` | 안전한 접근 |
| `remove(d, k)` | 키 제거하고 값 반환 |
| `extend(d, e)` | e의 항목을 d에 병합 (제자리) |
| `copy(d)` / `deepcopy(d)` | 복사 |
| `map(d, fn)` / `filter(d, fn)` | 파괴적 (리스트와 동일) |

```vim
let d = {'a': 1, 'b': 2, 'c': 3}

for [k, v] in items(d)
  echo k . '=' . v
endfor

call extend(d, {'d': 4, 'a': 99})
echo d                       " {'a': 99, 'b': 2, 'c': 3, 'd': 4}
```

### `extend()` — 충돌 처리

세 번째 인자로 충돌 시 동작을 지정.

```vim
let a = {'x': 1, 'y': 2}
let b = {'y': 99, 'z': 3}

call extend(copy(a), b)              " {'x':1, 'y':99, 'z':3}  (force, 기본)
call extend(copy(a), b, 'keep')      " {'x':1, 'y':2, 'z':3}   (앞쪽 우선)
call extend(copy(a), b, 'error')     " 충돌 시 에러
```

설정 병합의 정석.

```vim
let s:defaults = {'border': 'rounded', 'width': 80}
let user_opts = {'border': 'double'}
let final = extend(copy(s:defaults), user_opts)   " {'border':'double', 'width':80}
```

> Neovim의 `vim.tbl_deep_extend("force", a, b)`가 정확히 이 패턴의 Lua판. `extend()`는 **얕은 병합**만 해서 중첩 딕셔너리는 직접 처리해야 한다.

### 깊은 병합 헬퍼

`extend()`가 얕은 병합만 하므로 중첩은 직접 짠다.

```vim
function! s:deep_extend(a, b) abort
  for [k, v] in items(a:b)
    if has_key(a:a, k) && type(a:a[k]) == v:t_dict && type(v) == v:t_dict
      call s:deep_extend(a:a[k], v)
    else
      let a:a[k] = v
    endif
  endfor
  return a:a
endfunction
```

### 순회 순서

`keys()`/`values()`/`items()` 모두 **순서 보장이 없다**. 순서가 필요하면 `sort(keys(d))`로 정렬해서 돈다.

```vim
for k in sort(keys(d))
  echo k . '=' . d[k]
endfor
```

## 리스트와 딕셔너리 변환

```vim
" 딕셔너리 → 리스트
let kvs = items({'a': 1, 'b': 2})    " [['a',1], ['b',2]] (순서 보장 X)

" 리스트(쌍) → 딕셔너리
function! s:from_pairs(pairs) abort
  let d = {}
  for [k, v] in a:pairs
    let d[k] = v
  endfor
  return d
endfunction

echo s:from_pairs([['a', 1], ['b', 2]])    " {'a':1, 'b':2}
```

## vim 컨텍스트

**매핑을 데이터로 관리**

```vim
let s:maps = [
\  ['<leader>w', ':w<cr>',     'Save'],
\  ['<leader>q', ':q<cr>',     'Quit'],
\  ['<leader>x', ':bdelete<cr>', 'Close buffer'],
\ ]

for [lhs, rhs, _desc] in s:maps
  execute 'nnoremap <silent> ' . lhs . ' ' . rhs
endfor
```

**플러그인 옵션 병합**

```vim
let s:defaults = {
\  'border': 'rounded',
\  'width': 80,
\  'mappings': {'close': 'q', 'next': 'j'},
\ }

function! myplug#setup(user_opts) abort
  let s:opts = extend(deepcopy(s:defaults), a:user_opts)
endfunction
```

`deepcopy(s:defaults)`로 호출할 때마다 원본을 보호. 안 그러면 다음 호출에서 이전 사용자 설정이 잔류한다.

**옵션 문자열 파싱 — `split` + 리스트 조작**

```vim
let parts = split(&runtimepath, ',')
echo len(parts) . ' entries in rtp'

" 필터 후 다시 합치기
let cleaned = filter(parts, 'v:val !~# "/old/"')
let &runtimepath = join(cleaned, ',')
```

**autocmd 메타데이터 — `items()` 순회**

```vim
let s:auto_handlers = {
\  'BufWritePre':  's:trim_trailing',
\  'InsertLeave':  's:save_session',
\  'CursorHold':   's:check_external',
\ }

augroup MyAutos
  autocmd!
  for [event, fn] in items(s:auto_handlers)
    execute 'autocmd ' . event . ' * call ' . fn . '()'
  endfor
augroup END
```

## 함정 정리

1. **`map()`/`filter()`는 원본 변경**. 보존하려면 `copy()` 먼저.
2. **슬라이스 끝값은 포함**. `xs[1:3]`이 원소 3개.
3. **`sort()` 기본은 문자열 정렬**. 숫자는 `sort(xs, 'n')` 또는 람다.
4. **`copy()`는 얕은 복사**. 중첩은 `deepcopy()`.
5. **dot 접근은 식별자 형태 키만**. 하이픈/숫자 시작은 bracket.
6. **`keys()`/`pairs()` 순서 무보장**. 순서 의존하면 안 됨.
7. **`extend()`는 얕은 병합**. 중첩 딕셔너리는 직접 재귀.
8. **할당은 참조**. `let b = a` 후 b 변경하면 a도 바뀐다.

## 마무리 — 시리즈를 마치며

4편으로 Vimscript의 핵심을 다 훑었다.

- [1편 타입과 변수](/posts/vimscript-types-and-variables/) — 8개 타입, 스코프 prefix, ==# 비교
- [2편 제어 흐름](/posts/vimscript-control-flow/) — if/while/for, try/catch, :execute
- [3편 함수](/posts/vimscript-functions/) — function!/abort, 람다, autoload
- 4편 리스트와 딕셔너리 — 이 글

이 정도면 LazyVim 이전 시대의 vimrc·플러그인 거의 모든 코드를 읽을 수 있고, 본인이 직접 ftplugin이나 작은 플러그인을 짤 수도 있다. 더 깊은 reference는 별도 글 [Learn Vimscript the Hard Way 핵심 정리](/posts/learn-vimscript-the-hard-way/)에 매핑·autocmd group·operator-pending 등 실전 패턴 위주로 정리되어 있다.

Neovim 신규 플러그인은 Lua로 가지만, **`vim.cmd`·`vim.fn`을 거치면 결국 Vimscript 개념을 호출**하게 된다. 한 번 익혀두면 두 세계를 넘나드는 비용이 거의 0이 된다. 마침 [Lua 문법 시리즈](/posts/lua-types-and-variables/)도 4편 구조로 정리되어 있으니, 비교해 가며 읽으면 두 언어의 설계 차이가 선명해진다.
