---
title       : "Lua 에러 처리"
description : "error/assert로 던지고, pcall/xpcall로 잡기. error 객체 패턴, Neovim 플러그인의 에러 관행과 vim.notify 표시까지."
date        : 2026-06-15 17:00:00 +0900
updated     : 2026-06-16 10:00:00 +0900
categories  : [neovim, "원리·언어"]
tags        : [lua, neovim, guide]
pin         : false
hidden      : false
---

Lua의 에러 처리는 단순하다. **`error`로 던지고, `pcall`로 잡는다**. 예외 클래스 위계나 try/catch 같은 무거운 구조는 없다. 대신 메시지(문자열) 또는 객체(테이블)를 던지고, 호출 쪽이 `pcall`로 감싸 받는다. 이 글은 모든 사용 패턴과 Neovim 플러그인의 관행을 정리한다.

## 결론 먼저

- **`error(msg)`로 던지고, `pcall(fn, ...)`로 잡는다**.
- `error`는 기본적으로 `file:line: msg` 형식으로 위치를 붙인다. **`error(msg, 0)`**으로 위치 생략.
- **`assert(v, msg)`**는 `v`가 falsy면 에러. nil 체크 + 즉시 fail에 자주 씀.
- **`xpcall(fn, handler, ...)`**: 핸들러로 traceback 추가 (`debug.traceback`).
- 에러는 **문자열뿐 아니라 테이블도 던질 수 있다**.
- Neovim 관행: **보통 그대로 던지고**, UI 콜백이나 옵셔널 의존성 로딩에서만 `pcall`.

## error — 던지기

```lua
local function divide(a, b)
  if b == 0 then
    error("division by zero")
  end
  return a / b
end

divide(1, 0)
-- lua: example.lua:3: division by zero
-- stack traceback: ...
```

`error`는 호출 시점에 **`file:line:` 접두사를 자동으로 붙인다**. 안 붙이고 싶으면 두 번째 인자 `level`을 `0`으로.

```lua
error("raw message", 0)
-- lua: raw message
```

`level`을 `2`로 주면 **호출자 위치**가 표시된다. 헬퍼 함수에서 던질 때 유용.

```lua
local function check(x)
  if not x then
    error("x required", 2)   -- check를 부른 쪽 위치로 표시
  end
end
```

## assert — nil 체크의 정석

```lua
local function load_file(path)
  local f = assert(io.open(path, "r"), "cannot open " .. path)
  -- f가 nil이면 두 번째 인자 메시지로 에러
  return f:read("*a")
end
```

`assert(v)`는 `v`가 truthy면 그대로 반환, falsy면 에러. **단일 nil 체크 + 즉시 fail**에 가장 흔하게 쓴다.

## pcall — 잡기 (Protected Call)

```lua
local ok, result = pcall(divide, 1, 0)
print(ok)     -- false
print(result) -- example.lua:3: division by zero
```

- 함수와 인자를 따로 전달 (`pcall(fn, arg1, arg2, ...)`). 그래서 함수 안에서 던진 에러를 잡을 수 있다.
- 성공 시: `ok = true, result, ...` (함수 반환값).
- 실패 시: `ok = false, errmsg`.

**람다로 감싸는 패턴**:

```lua
local ok, err = pcall(function()
  do_something_dangerous()
  do_something_else()
end)
if not ok then
  vim.notify("failed: " .. tostring(err), vim.log.levels.ERROR)
end
```

`pcall(require, "modname")` 패턴이 가장 자주 보이는 형태.

```lua
local ok, mod = pcall(require, "optional-plugin")
if not ok then return end
```

## xpcall — 핸들러로 traceback

`pcall`은 에러 메시지만 받는다. **스택 traceback**을 보고 싶으면 `xpcall`.

```lua
local function handler(err)
  return debug.traceback(err, 2)
end

local ok, err = xpcall(function()
  error("oops")
end, handler)

print(err)
-- example.lua:8: oops
-- stack traceback:
--   ...
```

핸들러가 호출되는 시점이 **스택이 풀리기 전**이라 traceback이 의미 있다. 디버그 로깅에 유용.

> Lua 5.1: `xpcall(fn, handler)` 형태로 인자를 전달할 방법이 없어서 람다로 감싸야 함. Lua 5.2+: `xpcall(fn, handler, arg1, arg2, ...)`. LuaJIT은 두 형태 다 지원.

## 에러 객체로 테이블 던지기

문자열만 던질 수 있는 게 아니다. **테이블도 OK**.

```lua
local function fail()
  error({ code = "E_NOT_FOUND", msg = "no such file" })
end

local ok, e = pcall(fail)
if not ok then
  print(e.code, e.msg)   -- E_NOT_FOUND  no such file
end
```

이 패턴이 **catch 분기**를 가능하게 한다. 코드별 분기를 할 때 유용. 단, 테이블을 던지면 `error`가 `file:line:` 접두사를 안 붙인다 (메시지가 문자열이 아니라서).

## error vs return nil, err — 관용구 선택

Lua 표준 라이브러리는 **에러를 던지지 않고 `nil, errmsg`를 반환**하는 패턴이 많다 (`io.open`, `string.format` 일부).

```lua
local f, err = io.open("nope", "r")
if not f then
  print("failed:", err)
  return
end
```

선택 기준:
- **회복 가능한 실패** (파일 없음, 네트워크 에러) → `nil, err` 반환
- **프로그래머 실수** (잘못된 인자, 불변식 위반) → `error`로 던짐
- **외부 입력 검증** → `assert` 또는 명시적 체크 + `error`

Neovim 플러그인 코드를 보면 둘 다 섞여 있다. 본인 코드에서는 **API 경계에서 어떤 쪽인지 일관되게** 정하는 게 중요.

## Neovim 컨텍스트

**옵셔널 의존성 로드 (가장 흔한 pcall 사용)**

```lua
local ok, telescope = pcall(require, "telescope")
if not ok then
  vim.notify("telescope not installed", vim.log.levels.WARN)
  return
end
```

**키맵/콜백에서 에러 격리**

키맵 콜백에서 던진 에러는 화면에 직접 표시된다. 사용자 경험상 안 좋으면 감싸기.

```lua
vim.keymap.set("n", "<leader>x", function()
  local ok, err = pcall(function()
    do_something()
  end)
  if not ok then
    vim.notify(tostring(err), vim.log.levels.ERROR)
  end
end)
```

**autocmd 콜백도 마찬가지** — 자주 발화되는 이벤트라면 에러가 반복돼 짜증나므로 격리하는 게 낫다.

**vim.notify로 사용자에게 알림**

```lua
vim.notify("Saved", vim.log.levels.INFO)
vim.notify("LSP failed: " .. err, vim.log.levels.ERROR)
```

levels: `TRACE`, `DEBUG`, `INFO`, `WARN`, `ERROR`. nvim-notify, noice, snacks.notifier 같은 플러그인이 이걸 받아서 예쁘게 표시.

**vim.schedule로 안전 컨텍스트 옮기기**

LSP 핸들러 같은 fast event 컨텍스트에서는 `vim.api` 일부가 막혀있다. 에러 알림을 띄울 때 `vim.schedule`로 감싸 다음 이벤트 루프로 미루는 게 안전.

```lua
local ok, err = pcall(do_work)
if not ok then
  vim.schedule(function()
    vim.notify(tostring(err), vim.log.levels.ERROR)
  end)
end
```

**스택 traceback이 필요한 디버깅**

```lua
local function trace_handler(err)
  return debug.traceback(tostring(err), 2)
end

local ok, err = xpcall(suspicious_function, trace_handler)
if not ok then
  vim.notify(err, vim.log.levels.ERROR)
end
```

**플러그인이 던진 에러 그대로 두기 (관행)**

실제 LazyVim/플러그인 코드 대부분은 **`pcall` 없이 그대로 에러를 던진다**. 이유: 사용자가 `:messages`로 확인할 수 있고, 에러 위치가 명확해서 디버깅에 좋고, 개발자가 적극적으로 fail-fast 의도. **`pcall`은 "여기서 실패해도 진행해야 한다"는 의도가 명확할 때만** 쓰는 게 관례.

## 함정 정리

1. **`error(msg)`는 위치 접두사 자동**. 위치 빼려면 `error(msg, 0)`.
2. **`pcall(fn, ...)`의 인자는 함수에 그대로 전달**. 람다로 감싼 형태와 다름. `pcall(do_stuff, 1, 2)` ≠ `pcall(do_stuff(1, 2))` (후자는 호출 후 결과를 pcall에 넘김).
3. **테이블 에러는 `file:line:` 접두사가 안 붙음**. 문자열일 때만.
4. **`pcall`은 traceback 없음**. 필요하면 `xpcall(fn, debug.traceback)`.
5. **`assert(v, msg)`의 msg는 `v`가 falsy일 때만 평가하면 좋지만, Lua는 즉시 평가**. 비싼 메시지면 직접 `if not v then error(...)`.
6. **에러를 위로 던지는 게 기본**. 무지성 `pcall`로 다 감싸면 디버깅 못 함.

## Lua 시리즈

| 글 | 다루는 것 |
| --- | --- |
| [Lua 종합 가이드 (Neovim 컨텍스트)](/posts/neovim/2026-06-15-lua-syntax-guide/) | LuaJIT(5.1) 문법 한 번에 정리 — 타입·스코프·테이블·문자열 패턴·`vim.*` 헬퍼 |
| [Lua 모듈](/posts/neovim/2026-06-15-lua-modules/) | `require`/`package.path`, `local M = {} return M` 패턴, Neovim `lua/` 자동 등록 |
| [Lua 메타테이블](/posts/neovim/2026-06-15-lua-metatables/) | `__index`/`__newindex`/`__call`, OOP 클래스 패턴, `vim.opt`가 일반 테이블처럼 보이는 이유 |
| **Lua 에러 처리 (현재 글)** | `error`/`assert`로 던지고 `pcall`/`xpcall`로 잡기. Neovim 플러그인의 에러 관행 |
