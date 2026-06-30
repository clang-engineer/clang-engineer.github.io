---
title       : "Lua 종합 가이드 (Neovim 컨텍스트)"
description : "Neovim 설정·플러그인을 읽고 고치는 수준까지 Lua 문법을 한 번에 정리. 타입·스코프·테이블·문자열 패턴, 자주 쓰는 vim.* 헬퍼와 함정까지."
date        : 2026-06-15 16:00:00 +0900
updated     : 2026-06-16 10:00:00 +0900
categories  : [neovim, "원리·언어"]
tags        : [lua]
pin         : false
hidden      : false
---

Neovim 설정·플러그인을 읽고 고치는 데 필요한 Lua 문법을 한 번에 정리한 글이다. **LuaJIT(Lua 5.1 호환)** 기준 — 5.3에서 추가된 `//`, `<const>`, bitwise `~`/`&`/`|`는 쓸 수 없다. 비트 연산은 LuaJIT 내장 `bit` 모듈(`bit.band`, `bit.bor`)을 쓴다.

심화 주제(메타테이블·모듈·에러 처리)는 별도 글에서 따로 다룬다 — 본문 끝의 [Lua 시리즈](#lua-시리즈) 섹션 참고.

## 8개 기본 타입

`type(x)`로 확인한다.

| 타입 | 예시 | 비고 |
|---|---|---|
| `nil` | `nil` | 부재. 변수 선언만 하면 nil |
| `boolean` | `true` / `false` | `false`와 `nil`만 falsy. **`0`, `""`, `{}`는 모두 truthy** |
| `number` | `1`, `1.5` | LuaJIT은 정수/실수 구분 없음 (IEEE 754 double) |
| `string` | `"hi"`, `'hi'`, `[[...]]` | 불변. `s:upper()` 가능 |
| `function` | `function(x) ... end` | 일급 값 |
| `table` | `{1, 2}`, `{a=1}` | 자료구조의 거의 전부 |
| `userdata` | (C 핸들) | `vim.loop` 핸들 등 |
| `thread` | `coroutine.create(...)` | 코루틴 |

## 변수와 스코프

`local`을 안 붙이면 **전역으로 샌다**. Neovim 설정에서는 거의 모든 변수를 `local`로 둔다.

```lua
x = 10              -- 전역 (_G.x)
local y = 20        -- 지역 (블록 단위)
local a, b, c = 1, 2, 3   -- 다중 할당
a, b = b, a         -- 스왑 (다중 반환과 결합 시 강력)
```

스코프는 `do ... end`, `if ... end`, `for ... end`, `while ... end`, `function ... end` 단위다.

## 제어 흐름

```lua
if x > 0 then
elseif x < 0 then
else
end

while cond do ... end

repeat ... until cond    -- 조건이 참이면 멈춤 (while과 반대)

for i = 1, 10 do ... end       -- 끝값 포함
for i = 1, 10, 2 do ... end    -- step
for i = 10, 1, -1 do ... end   -- 역방향

for i, v in ipairs(t) do ... end   -- 배열 (nil에서 멈춤)
for k, v in pairs(t) do ... end    -- 전체 (순서 X)
```

`and`/`or`는 **마지막 평가값을 반환**한다(boolean 강제 X). 삼항 흉내:

```lua
local label = (count > 0) and "있음" or "없음"
-- 가운데가 falsy면 무너진다 — 그땐 if 사용
```

**`continue`가 없다**. 우회 두 가지:

```lua
-- 1. if로 본문 감싸기
for _, item in ipairs(items) do
  if item.enabled then ... end
end

-- 2. goto continue (Lua 5.2+, LuaJIT 지원)
for _, item in ipairs(items) do
  if not item.enabled then goto continue end
  ...
  ::continue::
end
```

`return`은 **블록의 마지막**이어야 한다. 중간 종료는 `do return end` 트릭으로.

## 함수

```lua
function f(x) return x + 1 end           -- 전역
local function g(x) return x + 1 end     -- 지역 (재귀 안전)
local h = function(x) return x + 1 end   -- anonymous (재귀 위험)
```

### 다중 반환

```lua
local function divmod(a, b) return math.floor(a/b), a%b end
local q, r = divmod(10, 3)
```

**다중 반환은 표현식의 마지막 위치일 때만 전부 보존된다**. 중간 위치면 첫 값만 전달:

```lua
print(f())         -- 1 2 3
print(f(), 99)     -- 1 99   (중간 → 첫 값만)
local t = { f() }      -- {1, 2, 3}
local t = { f(), 99 }  -- {1, 99}
```

### 가변 인자

```lua
local function logger(level, ...)
  local args = { ... }
  print(#args)              -- nil 섞이면 부정확
  print(select("#", ...))   -- 정확한 개수
  print(select(2, ...))     -- 2번째부터
end
```

### 클로저

```lua
local function counter()
  local n = 0
  return function()
    n = n + 1
    return n
  end
end
local c = counter()
print(c(), c(), c())   -- 1  2  3
```

같은 호출에서 만든 함수는 같은 upvalue를 공유하고, 다른 호출은 별개 upvalue를 가진다.

### 메서드 호출 — `:` vs `.`

**`t:method()`는 `t.method(t)`의 sugar**다. 정의도 `:`로 했어야 self 인자가 매칭된다.

```lua
function t:greet(name)  return "hi " .. name end
t:greet("neo")          -- self가 자동 전달
t.greet(t, "neo")       -- 위와 동등
```

## 테이블

```lua
local arr = { 10, 20, 30 }                 -- 배열 (1-indexed)
local map = { name = "neo", age = 30 }
local mixed = { 1, 2, name = "neo" }       -- 섞어도 됨
local k = "dynamic"
local t = { [k] = 1, ["with-hyphen"] = 2 } -- 동적 키
```

**인덱스는 1부터** 시작한다. `arr[0]`은 nil.

### `#t` 함정

`#t`는 **연속된 정수 키의 길이**다. 중간에 nil이 있는 sparse table에서는 부정확하다.

```lua
print(#{1, 2, 3})         -- 3 (안전)
print(#{1, nil, 3})       -- 1 또는 3 (구현 의존)
```

### ipairs vs pairs

- `ipairs(t)`: 1부터 nil까지, 정수 키만, **순서 보장**
- `pairs(t)`: 모든 키, **순서 보장 없음**
- 가장 단순한 형태: `for i = 1, #t do`

```lua
for i, v in ipairs({1, 2, nil, 4}) do print(i, v) end
-- 1 1 / 2 2 (nil에서 멈춤, 4는 못 봄)
```

### table.* 라이브러리

| 함수 | 역할 |
| --- | --- |
| `table.insert(t, v)` | 끝에 추가 |
| `table.insert(t, pos, v)` | 위치 삽입 |
| `table.remove(t)` / `table.remove(t, pos)` | 제거하고 반환 |
| `table.concat(t, sep)` | 배열 → 문자열 |
| `table.sort(t, cmp)` | 제자리 정렬 |
| `table.unpack(t)` / `unpack(t)` | 가변 인자로 펼침 |

### 참조 vs 복사

```lua
local b = a              -- 참조 (같은 객체)
print(a == b)            -- true (같은 참조)
print(a == { 1, 2, 3 })  -- false (다른 객체)
```

깊은 복사는 `vim.deepcopy(t)`.

## 문자열

### 기본 함수

| 함수 | 역할 |
| --- | --- |
| `#s` / `string.len(s)` | **바이트 길이** (UTF-8 코드포인트 X) |
| `string.sub(s, i, j)` | 부분 문자열 (1-indexed, j 포함) |
| `string.upper(s)` / `string.lower(s)` | 대소문자 |
| `string.rep(s, n, sep)` | 반복 |
| `string.reverse(s)` | 뒤집기 |
| `string.byte(s, i)` / `string.char(n)` | 코드 ↔ 문자 |
| `string.format(fmt, ...)` | printf 스타일 |

### string.format 지정자

| 지정자 | 의미 |
| --- | --- |
| `%d` / `%i` | 정수 |
| `%f` / `%.2f` | 실수 / 소수점 2자리 |
| `%s` | 문자열 |
| `%q` | 안전한 따옴표 escape |
| `%x` / `%X` | 16진수 |
| `%%` | 리터럴 `%` |
| `%5d` / `%-5d` | 너비 5 우/좌 정렬 |

### Lua 패턴 (정규식이 아님)

escape가 `\`가 아니라 **`%`**다. `|`(or), `{n,m}`, lookahead가 없다.

**문자 클래스**:

| 클래스 | 의미 | 반대 |
| --- | --- | --- |
| `%a` 알파벳 | `%d` 숫자 | `%A` / `%D` |
| `%w` 영숫자 | `%s` 공백 | `%W` / `%S` |
| `%l` / `%u` 소/대문자 | `%p` 구두점 | `%L` / `%U` |
| `%x` 16진수 | `.` 아무 문자 | `%X` |

**수량자**: `*` 0+ greedy, `+` 1+ greedy, `-` 0+ **lazy**, `?` 0/1.

**앵커·캡처**:
- `^pattern` / `pattern$` — 시작/끝
- `%b()` — 짝 맞춘 괄호
- `%f[set]` — frontier
- `(pattern)` — 캡처

```lua
print(string.match("name=neo", "(%w+)=(%w+)"))   -- name  neo
print(string.match("<b>x</b>", "<.->"))           -- <b>    (lazy)
print(string.match("<b>x</b>", "<.*>"))           -- <b>x</b> (greedy)
```

### 매칭 함수

```lua
string.match(s, pat)            -- 첫 매치 (또는 캡처)
string.find(s, pat)             -- 위치 반환 (i, j)
string.find(s, pat, 1, true)    -- plain (리터럴 검색)

for w in string.gmatch(s, "%w+") do ... end   -- 이터레이터

s, n = string.gsub(s, pat, repl)
-- repl: 문자열("%1:%2"), 함수, 테이블
print((string.gsub("a1b2", "%d", function(d) return d*10 end)))
-- a10b20
print((string.gsub("hello", "%w+", { hello = "안녕" })))
-- 안녕
```

## 에러 처리 (요약)

```lua
local ok, err = pcall(require, "optional-plugin")
if not ok then return end

local ok, result = pcall(function()
  return compute()
end)
```

`pcall`/`xpcall`로 잡고, `error`/`assert`로 던지는 게 기본. 에러 객체 패턴, traceback 핸들러, Neovim 플러그인의 에러 관행은 별도 글에서 자세히 다룬다 → [Lua 문법 8 — 에러 처리](/posts/neovim/2026-06-15-lua-error-handling/).

## Neovim 자주 쓰는 헬퍼

### vim.tbl_*

| 함수 | 역할 |
| --- | --- |
| `vim.tbl_extend(mode, ...)` | 얕은 병합 |
| `vim.tbl_deep_extend(mode, ...)` | 깊은 병합 |
| `vim.tbl_contains(t, v)` | 값 포함 |
| `vim.tbl_keys(t)` / `vim.tbl_values(t)` | 키/값 배열 |
| `vim.tbl_filter(fn, t)` / `vim.tbl_map(fn, t)` | 필터 / 매핑 |
| `vim.tbl_isempty(t)` | 비었는지 |
| `vim.deepcopy(t)` | 깊은 복사 |

`mode`: `"force"` 뒤쪽 우선 / `"keep"` 앞쪽 우선 / `"error"` 충돌 시 에러.

```lua
local merged = vim.tbl_deep_extend("force", defaults, user)
```

### vim.* 자주 쓰는 것

```lua
local opt = vim.opt
local g = vim.g
local bo = vim.bo[bufnr]                -- 버퍼 옵션
local wo = vim.wo[winid]                -- 윈도우 옵션

vim.keymap.set("n", "<leader>w", function() vim.cmd.write() end, { desc = "Save" })

vim.api.nvim_create_autocmd("BufWritePre", {
  pattern = "*.py",
  callback = function(args) ... end,
})

vim.schedule(function() ... end)        -- 다음 이벤트 루프
vim.notify("msg", vim.log.levels.INFO)

vim.fn.matchstr("abc123", "\\d\\+")     -- Vim regex (Lua 패턴 아님)
```

`vim.*` 네임스페이스 전체 지도(`vim.api` vs `vim.fn`, 옵션 범위, 매핑·커맨드)는 [Neovim의 vim 전역 API 지도](/posts/neovim/2026-06-19-neovim-vim-global-api-map/)에서 따로 다룬다.

### Lua 패턴 활용

```lua
-- basename
local function basename(path) return path:match("([^/\\]+)$") or path end

-- 확장자
local function ext(path) return path:match("%.([^.]+)$") end

-- 메시지 파싱
local file, line, col, text = msg:match("([^:]+):(%d+):(%d+):%s*(.+)")
```

## 함정 정리

1. `local`을 빠뜨리면 전역으로 샌다.
2. `0`, `""`, `{}`는 **truthy**.
3. 다중 반환은 **표현식 마지막 위치**에서만 전부 보존된다.
4. `{...}`는 nil이 섞이면 부정확 → `select("#", ...)`.
5. `:`로 호출하면 self가 자동 전달되며, 정의도 `:`로 해야 매칭된다.
6. **인덱스 1부터**다. `#t`는 sparse table에서 부정확.
7. `ipairs`는 nil에서 멈춘다.
8. **escape는 `\`가 아니라 `%`**. `|`(or) 없음.
9. `#s`는 **바이트 길이**, UTF-8 코드포인트 수가 아니다.
10. `gsub`은 다중 반환(`new, count`) → `print((s:gsub(...)))`로 두 번째 값을 잘라낸다.

## Lua 시리즈

| 글 | 다루는 것 |
| --- | --- |
| **Lua 종합 가이드 (Neovim 컨텍스트) (현재 글)** | LuaJIT(5.1) 문법 한 번에 정리 — 타입·스코프·테이블·문자열 패턴·`vim.*` 헬퍼 |
| [Lua 모듈](/posts/neovim/2026-06-15-lua-modules/) | `require`/`package.path`, `local M = {} return M` 패턴, Neovim `lua/` 자동 등록 |
| [Lua 메타테이블](/posts/neovim/2026-06-15-lua-metatables/) | `__index`/`__newindex`/`__call`, OOP 클래스 패턴, `vim.opt`가 일반 테이블처럼 보이는 이유 |
| [Lua 에러 처리](/posts/neovim/2026-06-15-lua-error-handling/) | `error`/`assert`로 던지고 `pcall`/`xpcall`로 잡기. Neovim 플러그인의 에러 관행 |
