---
title       : "Lua 문법 3 — 함수"
description : "정의 형태, 다중 반환, 가변 인자, 일급 함수, 클로저, 메서드 호출 t:f() vs t.f(t). Neovim 콜백 패턴의 근간."
date        : 2026-06-15 12:00:00 +0900
updated     : 2026-06-15 12:00:00 +0900
categories  : [neovim, "원리·언어"]
tags        : [lua, neovim]
pin         : false
hidden      : false
---

Lua에서 함수는 **값**이다. 변수에 담고 인자로 전달하고 반환할 수 있다. Neovim API의 키맵 콜백, autocmd 콜백, `vim.schedule(fn)` 같은 패턴이 전부 이 위에 서 있다. 이번 편은 함수 정의의 모든 형태, 다중 반환, 클로저, 그리고 콜론(`:`) vs 점(`.`) 호출의 차이를 정리한다.

## 결론 먼저

- `function f() end`와 `local function f() end`는 둘 다 같은 것의 syntactic sugar. local 권장.
- **다중 반환**이 1급 시민. `a, b = f()` 식으로 받음.
- **가변 인자 `...`** + `select("#", ...)`로 개수 확인.
- **클로저**가 자연스럽다 — upvalue를 잡아둠.
- **`t:method()`는 `t.method(t)`의 sugar**. `self` 자동 전달.

## 함수 정의의 세 가지 형태

```lua
-- 1. function statement (전역)
function f(x) return x + 1 end

-- 2. local function statement (지역, 권장)
local function g(x) return x + 1 end

-- 3. anonymous function expression (값으로)
local h = function(x) return x + 1 end
```

위 셋은 거의 동등하다. 차이 하나만 알면 된다:

```lua
local function g(x)
  if x > 0 then return g(x - 1) end   -- 자기 자신 참조 OK
end

local h = function(x)
  if x > 0 then return h(x - 1) end   -- 동작은 하지만,
end
-- 위 형태는 사실 좌변 h가 우변 평가 시점에는 아직 nil이 아닌 경우만 동작 (재할당 시 위험)
-- local function 형태가 재귀에 안전
```

## 다중 반환

Lua는 함수가 여러 값을 반환할 수 있다. 별도 문법 없이 그냥 콤마로 나열.

```lua
local function divmod(a, b)
  return a // 1 and math.floor(a / b), a % b   -- LuaJIT은 // 안 됨
end
-- LuaJIT 호환:
local function divmod(a, b)
  return math.floor(a / b), a % b
end

local q, r = divmod(10, 3)
print(q, r)   -- 3  1
```

받는 쪽이 부족하면 잘리고, 남으면 nil로 채워진다.

```lua
local q = divmod(10, 3)        -- 3 (r은 버려짐)
local q, r, s = divmod(10, 3)  -- 3, 1, nil
```

### 다중 반환의 위치 함정

**다중 반환은 표현식 위치가 마지막일 때만 전부 보존된다**. 중간에 있으면 첫 값만 살아남는다.

```lua
local function f() return 1, 2, 3 end

print(f())               -- 1 2 3  (마지막 → 전부)
print(f(), 99)           -- 1 99   (중간 → 첫 값만)
local t = { f() }        -- { 1, 2, 3 }
local t = { f(), 99 }    -- { 1, 99 }
```

테이블 리터럴, 함수 인자, `return`, `=` 우변에서 모두 적용된다. **`vim.api.nvim_buf_get_text` 같은 다중 반환 API를 한 줄에 묶을 때 자주 물린다**.

## 가변 인자 (`...`)

함수 시그니처에 `...`을 쓰면 나머지 인자를 다 받는다.

```lua
local function logger(level, ...)
  print(level, ...)
end

logger("info", "user", "logged", "in")
-- info  user  logged  in
```

`...`은 표현식이라 그대로 쓸 수도 있고, 테이블에 담을 수도 있다.

```lua
local function f(...)
  local args = { ... }       -- 테이블로
  print(#args)               -- 길이 (nil 없을 때만 정확)
  print(select("#", ...))    -- 정확한 개수 (nil 포함)
  print(select(2, ...))      -- 2번째부터 끝까지
end

f(1, nil, 3)
-- #args는 1 또는 3 (구현 의존, sparse)
-- select("#", ...)는 3 (정확)
```

`nil`이 섞인 가변 인자에서 개수가 정확히 필요하면 `select("#", ...)`. 그 외엔 `{...}`로 충분.

## 일급 함수

함수는 값이라 어디든 다닐 수 있다.

```lua
local function apply(fn, x) return fn(x) end

print(apply(function(n) return n * 2 end, 5))   -- 10
```

Neovim 콜백 등록이 전부 이 형태다.

```lua
vim.keymap.set("n", "<leader>x", function()
  print("hi")
end)

vim.api.nvim_create_autocmd("BufWritePre", {
  callback = function(args)
    print("saving", args.file)
  end,
})
```

## 클로저

함수가 정의된 스코프의 지역 변수를 잡아둔다. 이게 **upvalue**.

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

`n`은 inner function 안에서만 살아있다. 같은 `counter()` 호출에서 만든 함수들은 같은 `n`을 공유, 다른 호출은 별개의 `n`.

```lua
local a = counter()
local b = counter()
print(a(), a(), b())   -- 1  2  1
```

Neovim 콜백에서 상태를 들고 있을 때 자주 쓴다.

```lua
local function make_toggle()
  local on = false
  return function()
    on = not on
    print(on and "켜짐" or "꺼짐")
  end
end

vim.keymap.set("n", "<leader>t", make_toggle())
```

## 메서드 호출: `:` vs `.`

이게 OOP 흉내의 핵심이고, Neovim API에서도 종종 나온다.

```lua
local t = {}
function t.greet(self, name)
  return "hello " .. name .. " from " .. tostring(self)
end

-- 둘은 동등:
t.greet(t, "neo")
t:greet("neo")        -- self가 자동 전달
```

**정의할 때 `:`을 쓰면 첫 인자 `self`가 암묵적으로 들어간다**.

```lua
function t:greet(name)     -- self가 첫 인자로 자동
  return "hello " .. name
end
```

문자열 메서드가 그 예. `"hi":upper()`는 `string.upper("hi")`와 같다.

```lua
print(("hello"):upper())   -- HELLO
print(string.upper("hello")) -- HELLO  (동등)
```

5편 메타테이블에서 이 메커니즘이 풀린다.

## Neovim 컨텍스트

**키맵 콜백 (가장 흔한 형태)**

```lua
vim.keymap.set("n", "<leader>w", function()
  vim.cmd.write()
end, { desc = "Save file" })
```

**autocmd 콜백 + args 객체**

```lua
vim.api.nvim_create_autocmd("LspAttach", {
  callback = function(args)
    local bufnr = args.buf
    local client = vim.lsp.get_client_by_id(args.data.client_id)
    -- 키맵 등록 등
  end,
})
```

**vim.schedule — 다음 이벤트 루프에서 실행**

```lua
vim.schedule(function()
  vim.notify("이벤트 루프 안전한 시점에서 실행됨")
end)
```

**다중 반환 활용**

```lua
local row, col = unpack(vim.api.nvim_win_get_cursor(0))  -- {row, col}
-- 또는 직접 다중 반환을 쓰는 API
local ok, err = pcall(require, "optional-plugin")
if not ok then return end
```

**`require()` 결과의 메서드 호출**

```lua
local builtin = require("telescope.builtin")
vim.keymap.set("n", "<leader>ff", builtin.find_files)
-- builtin.find_files는 함수 값, 그대로 콜백으로 전달
```

## 함정 정리

1. **다중 반환은 표현식 위치가 마지막일 때만 전부 보존**. 중간이면 첫 값만.
2. **`local function f`와 `local f = function`은 재귀 시 다르다**. 재귀하려면 `local function`.
3. **`{...}`는 nil 섞인 가변 인자에서 길이가 부정확**. 정확한 개수는 `select("#", ...)`.
4. **`:` 호출은 self 자동 전달**. 정의도 `:`로 했어야 매칭. 점/콜론 섞으면 인자 어긋남.
5. **클로저는 같은 함수 호출 안에서만 upvalue 공유**. 호출마다 별개의 state.

## 다음 편

4편은 **테이블**: Lua 자료구조의 거의 전부. array vs hash, `#`의 함정, `ipairs`/`pairs`의 정확한 차이, `table.*` 라이브러리, 그리고 Neovim에서 자주 쓰는 `vim.tbl_deep_extend`까지.
