---
title       : "Lua 문법 1 — 타입과 변수"
description : "Neovim 사용자를 위한 Lua 핵심 문법 시리즈 1편. 8개 기본 타입, local/global 스코프, 다중 할당, LuaJIT(5.1)이라서 생기는 차이까지."
date        : 2026-06-15 10:00:00 +0900
updated     : 2026-06-15 10:00:00 +0900
categories  : [neovim, "원리·언어"]
tags        : [lua, neovim]
pin         : false
hidden      : false
---

Neovim 설정과 플러그인을 진지하게 다루려면 Lua 문법은 피할 수 없다. LazyVim 설정 한 줄 한 줄이 다 Lua고, `vim.api.*` 호출은 결국 Lua 호출 규약을 따르기 때문이다. 이 시리즈는 Neovim 사용자가 본인 설정을 읽고 고칠 수 있는 수준까지 Lua를 정리한다. 1편은 가장 기초 — **타입과 변수**.

## 결론 먼저

- Lua의 기본 타입은 **8개**: `nil`, `boolean`, `number`, `string`, `function`, `userdata`, `thread`, `table`.
- 변수는 **기본이 global**이다. `local`을 안 붙이면 전역으로 새는 게 함정.
- 스코프는 **block 단위** (`do ... end`, `if ... end`, `for ... end` 등).
- Neovim은 **LuaJIT(Lua 5.1 호환)**. 5.3의 integer 분리, `//` 연산자, `<const>` 같은 건 안 된다.

## 8개 기본 타입

`type()`로 확인할 수 있다.

```lua
print(type(nil))      -- nil
print(type(true))     -- boolean
print(type(42))       -- number
print(type("hi"))     -- string
print(type(print))    -- function
print(type({}))       -- table
```

`userdata`와 `thread`는 직접 만들 일이 거의 없다. Neovim에서는 가끔 C 쪽 핸들(`vim.loop` 핸들 등)이 userdata로 노출되고, `thread`는 코루틴(`coroutine.create`)을 만들 때 나온다.

### nil — 부재

값이 없음을 나타낸다. 선언만 하고 할당하지 않으면 자동으로 `nil`.

```lua
local x       -- x는 nil
print(x)      -- nil

local t = { a = 1 }
print(t.b)    -- nil  (없는 키 접근은 에러가 아니라 nil)
```

변수에 `nil`을 다시 할당하면 **사실상 제거**되는 효과가 있다. 테이블에서 더 명확하다.

```lua
local t = { a = 1, b = 2 }
t.a = nil
print(t.a)    -- nil
-- 이제 t에는 b만 남는다
```

### boolean — true/false만 falsy

여기서 처음 함정. **`false`와 `nil`만 falsy**고, **`0`, `""`, `{}`은 전부 truthy**다. Python·JS 감각으로 짜면 틀린다.

```lua
if 0 then print("0은 truthy") end       -- 출력됨
if "" then print("빈 문자열도 truthy") end  -- 출력됨
if {} then print("빈 테이블도 truthy") end  -- 출력됨
```

LazyVim 설정에서 `opts.enabled = false`로 비활성화하는 패턴이 이 falsy 규칙 위에 서 있다.

### number — 다 같은 number

Lua 5.1/LuaJIT에서는 **정수와 실수의 구분이 없다**. 모두 IEEE 754 double.

```lua
print(type(1))      -- number
print(type(1.5))    -- number
print(1 / 2)        -- 0.5  (정수 나눗셈 아님)
print(math.floor(1 / 2))  -- 0
```

> Lua 5.3부터 integer/float가 분리되고 `//` (floor division) 연산자가 생겼지만 **Neovim은 LuaJIT이라 5.1 기준**. `//`나 `~`(비트 XOR) 같은 5.3 연산자 쓰면 syntax error.

### string — 불변, 작은따옴표/큰따옴표 동등

```lua
local s = "hello"
local s2 = 'hello'         -- 같음
local multi = [[
여러 줄
문자열
]]
local multi2 = [==[
대괄호 안에 ]] 가 있어도
이 형태로 감싸면 OK
]==]
```

문자열은 불변. `s:upper()` 같은 메서드 호출이 가능한 건 Lua가 string에 자동으로 메타테이블을 붙여놨기 때문 (5편에서 다룸).

```lua
print(("hello"):upper())   -- HELLO
print(#"hello")            -- 5  (#는 길이)
```

### function — 일급 값

함수도 값이다. 변수에 담고 전달할 수 있다. 자세한 건 3편.

```lua
local f = function(x) return x * 2 end
print(f(3))   -- 6
```

### table — 만능

Lua 자료구조의 거의 전부. 배열, 해시맵, 객체, 모듈, 네임스페이스 다 table이다. 4편에서 깊게 다룸.

```lua
local t = { 1, 2, 3 }            -- 배열처럼
local m = { name = "neo", age = 30 }  -- 해시맵처럼
local mixed = { 1, 2, name = "neo" }  -- 섞어도 됨
```

## local vs global — 가장 큰 함정

**`local`을 안 붙이면 전역**이다.

```lua
x = 10        -- 전역 변수 (사실상 _G.x)
local y = 20  -- 지역 변수
```

전역은 어디서든 접근 가능해 디버깅 지옥의 첫 단추가 된다. Neovim 설정에서 거의 모든 변수를 `local`로 쓰는 이유. 플러그인을 만들 때도 마찬가지 — 모듈에서 반환할 테이블만 노출하고 나머지는 전부 `local`.

```lua
-- 나쁜 예: helper가 전역으로 샌다
function helper(x)
  return x + 1
end

-- 좋은 예
local function helper(x)
  return x + 1
end
```

LazyVim 한 플러그인 spec 파일을 봐도 패턴이 동일하다.

```lua
-- ~/.config/nvim/lua/plugins/example.lua
return {
  "owner/plugin.nvim",
  opts = function()
    local Util = require("lazy.util")   -- local
    local config = { ... }              -- local
    return config
  end,
}
```

## 블록 스코프

스코프는 **블록**으로 결정된다. `do ... end`, `if ... end`, `for ... end`, `while ... end`, `function ... end`가 전부 블록.

```lua
local x = 1
do
  local x = 2     -- 안쪽 스코프, 바깥 x를 가린다
  print(x)        -- 2
end
print(x)          -- 1
```

`if` 블록 안의 `local`도 if 밖에서는 안 보인다. C/JS와 같은 lexical scope.

```lua
if true then
  local y = 10
end
-- print(y)   -- error: y is nil (실제로는 nil로 평가됨)
```

## 다중 할당

Lua는 한 줄에 여러 변수를 동시에 할당할 수 있다.

```lua
local a, b, c = 1, 2, 3
print(a, b, c)   -- 1  2  3

-- 값이 부족하면 nil로 채움
local x, y, z = 1, 2
print(x, y, z)   -- 1  2  nil

-- 값이 남으면 버림
local p, q = 1, 2, 3
print(p, q)      -- 1  2
```

**스왑이 한 줄로 된다**. 다중 반환과 합치면 더 강력해진다 (3편).

```lua
local a, b = 1, 2
a, b = b, a
print(a, b)   -- 2  1
```

## Neovim 컨텍스트

본인의 LazyVim 설정을 열어보면 첫 줄이 거의 다 이런 식이다.

```lua
-- lua/config/options.lua
local opt = vim.opt
local g = vim.g

opt.number = true
opt.relativenumber = true
g.mapleader = " "
```

- `local opt = vim.opt` — 전역 `vim.opt`를 짧은 지역 alias로 받는 관례. 코드가 짧아지고 `vim.opt` 반복 룩업을 피한다.
- `g.mapleader = " "` — `vim.g`는 Vim global 변수 네임스페이스. 여기에 키 넣는 게 `let g:mapleader = " "`와 동치.

플러그인 spec에서도 동일하다.

```lua
return {
  "nvim-telescope/telescope.nvim",
  keys = function()
    local builtin = require("telescope.builtin")  -- local로 받기
    return {
      { "<leader>ff", builtin.find_files },
      { "<leader>fg", builtin.live_grep },
    }
  end,
}
```

## 함정 정리

1. **`local` 빠뜨리면 전역으로 샌다**. `:luafile` 후 `_G`에 이상한 게 쌓이면 이거.
2. **`0`, `""`, `{}`는 truthy**. `if not x then` 같은 nil-check 의도가 다른 falsy 값에 안 걸린다는 뜻.
3. **`nil`에 `.`이나 `[]`로 접근하면 에러**, 하지만 **테이블의 없는 키 접근은 nil**. 헷갈리지 말 것.
   ```lua
   local t = nil
   print(t.x)  -- error: attempt to index a nil value
   
   local t2 = {}
   print(t2.x) -- nil (정상)
   ```
4. **LuaJIT은 Lua 5.1**. 5.3 문법(`//`, `<const>`, bitwise `~/&/|`)은 안 된다. 비트 연산은 LuaJIT 내장 `bit` 모듈 (`bit.band`, `bit.bor`).
5. **숫자는 전부 double**. `1 == 1.0`은 true, `1 / 2 == 0.5` (정수 나눗셈 아님).

## 다음 편

2편은 **제어 흐름**: `if`, `while`, `repeat-until`, 두 종류의 `for`, `break`. Lua만의 특이점(`continue`가 없다, `repeat-until`이 살아있다 등)을 짚는다.
