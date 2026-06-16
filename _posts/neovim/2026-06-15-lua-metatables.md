---
title       : "Lua 메타테이블"
description : "__index/__newindex/__call 같은 메타메서드, OOP 클래스 패턴, 문자열 메서드 호출의 비밀, Neovim vim.opt가 일반 테이블처럼 보이는 이유."
date        : 2026-06-15 14:00:00 +0900
updated     : 2026-06-16 10:00:00 +0900
categories  : [neovim, "원리·언어"]
tags        : [lua, neovim, guide]
pin         : false
hidden      : false
---

Lua의 메타테이블은 "테이블이 어떤 연산에서 어떻게 행동할지"를 외부에서 바꾸는 메커니즘이다. 다른 언어의 operator overloading, `__getattr__`, 클래스 시스템이 전부 이걸로 만들어진다. Neovim에서 `vim.opt.number = true`처럼 평범한 할당이 실제로는 `setoption()` C 함수 호출이 되는 이유, 문자열에 `:upper()` 같은 메서드가 붙어 있는 이유가 다 메타테이블 때문이다.

## 결론 먼저

- 모든 테이블에 **메타테이블 1개**를 붙일 수 있다 (`setmetatable`).
- 메타테이블 안의 `__index`, `__newindex`, `__call` 등 **메타메서드**가 동작을 가로챈다.
- **`__index`가 OOP의 핵심**. 키 조회 실패 시 다른 테이블/함수로 폴백.
- **클래스 패턴**: `setmetatable(instance, { __index = Class })`.
- **문자열도 메타테이블이 있다** (전역, 모든 문자열이 공유). 그래서 `s:upper()`가 동작.

## 메타테이블 기초

```lua
local t = {}
local mt = { __index = function(_, k) return "missing: " .. k end }
setmetatable(t, mt)

print(t.foo)   -- missing: foo
```

`t.foo`를 조회했더니 `foo`가 없으니까 `mt.__index` 함수가 호출되어 결과를 반환한다.

```lua
print(getmetatable(t) == mt)   -- true
```

## __index — 키 조회 폴백

가장 자주 쓴다. **테이블** 또는 **함수**일 수 있다.

### __index가 테이블인 경우

키가 없으면 그 테이블에서 조회한다.

```lua
local defaults = { color = "red", size = 10 }
local t = setmetatable({}, { __index = defaults })

print(t.color)    -- red    (t에 없어서 defaults로 폴백)
print(t.size)     -- 10
t.color = "blue"
print(t.color)    -- blue   (t에 있으면 그걸 사용)
print(defaults.color)  -- red (defaults는 안 건드림)
```

이게 **상속의 메커니즘**이다.

### __index가 함수인 경우

키가 없을 때 함수가 호출된다 (`(table, key)` 인자).

```lua
local lazy = setmetatable({}, {
  __index = function(t, k)
    print("loading " .. k)
    return "value-" .. k
  end,
})

print(lazy.foo)   -- loading foo / value-foo
```

캐시·지연 로딩·동적 모듈 같은 데 쓴다.

## __newindex — 키 할당 가로채기

`t.k = v`를 가로챈다. 단, **이미 존재하는 키**에는 동작 안 함. **새 키 추가 시점**에만 호출.

```lua
local readonly = setmetatable({}, {
  __newindex = function(_, k, _)
    error("readonly: cannot set " .. k)
  end,
})

readonly.x = 1   -- error: readonly: cannot set x
```

값을 실제로 어딘가에 저장하고 싶으면 `rawset(t, k, v)`로 메타메서드를 우회한다.

```lua
local store = {}
local proxy = setmetatable({}, {
  __index = store,
  __newindex = function(_, k, v)
    print("setting " .. k)
    rawset(store, k, v)
  end,
})

proxy.x = 10   -- setting x
print(proxy.x) -- 10
```

## __call — 테이블을 함수처럼

테이블을 `t(...)`로 호출할 수 있게 한다.

```lua
local greeter = setmetatable({}, {
  __call = function(self, name) return "hello " .. name end,
})

print(greeter("neo"))   -- hello neo
```

LazyVim의 일부 모듈, Snacks, 그리고 많은 플러그인이 `require("foo")(opts)` 형태를 제공할 때 이 패턴을 쓴다.

## 자주 쓰는 메타메서드

| 메서드 | 호출 시점 |
| --- | --- |
| `__index` | `t.k` / `t[k]` 조회 실패 |
| `__newindex` | `t.k = v` 새 키 할당 |
| `__call` | `t(...)` 호출 |
| `__tostring` | `tostring(t)`, `print(t)` |
| `__eq` | `t1 == t2` (같은 메타테이블일 때만) |
| `__lt`, `__le` | `<`, `<=` |
| `__add`, `__sub`, `__mul`, `__div`, `__mod`, `__pow`, `__unm` | 산술 연산자 |
| `__concat` | `..` 연산자 |
| `__len` | `#t` (Lua 5.2+, LuaJIT 지원) |
| `__pairs` | `pairs(t)` (Lua 5.2+) |

```lua
local Vec = {}
Vec.__index = Vec
Vec.__add = function(a, b) return Vec.new(a.x + b.x, a.y + b.y) end
Vec.__tostring = function(v) return ("(%d, %d)"):format(v.x, v.y) end

function Vec.new(x, y)
  return setmetatable({ x = x, y = y }, Vec)
end

local a, b = Vec.new(1, 2), Vec.new(3, 4)
print(a + b)   -- (4, 6)
```

## 클래스 패턴

Lua는 클래스가 따로 없다. 관례로 만든다.

```lua
local Animal = {}
Animal.__index = Animal       -- 메타테이블 자신이 메서드 룩업의 폴백

function Animal.new(name)
  local self = setmetatable({}, Animal)
  self.name = name
  return self
end

function Animal:speak()       -- self 자동 전달
  return self.name .. " speaks"
end

local a = Animal.new("dog")
print(a:speak())              -- dog speaks
```

핵심: 인스턴스 테이블에 `Animal`을 `__index`로 붙이면, 인스턴스에 없는 키(`speak`)는 `Animal`에서 조회된다. `Animal:speak()` 정의는 `Animal.speak(self)`의 sugar라 첫 인자로 인스턴스가 들어온다.

### 상속

```lua
local Dog = setmetatable({}, { __index = Animal })  -- Dog는 Animal의 메서드 상속
Dog.__index = Dog

function Dog.new(name)
  local self = Animal.new(name)
  return setmetatable(self, Dog)
end

function Dog:bark()
  return self.name .. " barks"
end

local d = Dog.new("rex")
print(d:speak())   -- rex speaks  (Animal에서 옴)
print(d:bark())    -- rex barks
```

체인: `d` → `Dog` → `Animal`. 키 조회가 단계적으로 폴백된다.

## 문자열 메서드의 비밀

`"hi":upper()`는 어떻게 동작할까?

```lua
print(getmetatable(""))   -- 출력은 nil 같지만, 사실 Lua가 숨김
print(("hello"):upper())  -- HELLO
```

내부적으로 모든 문자열은 같은 메타테이블을 공유하고, 그 `__index`는 `string` 테이블이다. 그래서 `s:upper()`는 `string.upper(s)`로 풀린다.

```lua
print(string.upper == ("x"):upper)   -- false (다른 함수 객체)
print(string.upper("hello") == ("hello"):upper())  -- true (결과는 같음)
```

이건 Lua가 string에 한해 자동으로 해주는 특수 처리. table에는 안 해준다 (직접 setmetatable).

## Neovim 컨텍스트

**vim.opt — 메타테이블의 정수**

```lua
vim.opt.number = true               -- 실제로는 __newindex가 setoption 호출
vim.opt.listchars = { tab = "→ " }  -- table → 옵션 문자열 변환
vim.opt.runtimepath:append("/x")    -- :append는 메서드. vim.opt 결과가 객체
```

`vim.opt`는 일반 테이블이 아니라 **메타테이블이 붙은 프록시 객체**다. `vim.opt.number = true`라고 쓰면 `__newindex`가 가로채서 `nvim_set_option` 같은 C API를 호출한다. 읽을 때(`vim.opt.number:get()`)도 `__index`로 옵션 값을 가져온다.

**플러그인 OOP**

많은 Neovim Lua 플러그인이 위의 클래스 패턴을 그대로 쓴다.

```lua
-- 예: plenary.nvim의 Job
local Job = require("plenary.job")
local j = Job:new({ command = "ls", args = { "-la" } })
j:sync()
```

`Job:new(...)`은 `__index = Job`인 인스턴스를 만들고, `j:sync()`는 `Job.sync(j)`.

**LazyVim Util 모듈의 `__call`**

```lua
-- LazyVim 내부 패턴 (단순화)
local M = setmetatable({}, {
  __call = function(_, opts) return M.setup(opts) end,
})

function M.setup(opts) ... end

return M
-- 사용처: require("lazyvim.util")(opts)  또는  require("lazyvim.util").setup(opts)
```

## 함정 정리

1. **메타테이블은 테이블당 1개**. 두 번째 `setmetatable`은 덮어쓴다.
2. **`__newindex`는 새 키만 가로챈다**. 기존 키 재할당은 그대로 들어감.
3. **메타테이블을 우회하려면 `rawget`/`rawset`/`rawequal`**. 무한 재귀 방지용으로 메타메서드 안에서 자주 씀.
4. **`__index`가 테이블이면 그 테이블의 메타테이블은 따라가지 않는다**. 다단 상속하려면 그 테이블에 또 메타테이블을 붙여야 함.
5. **클래스 패턴에서 `Class.__index = Class` 빠뜨리면** 인스턴스에 메서드 안 보임.
6. **`==`은 같은 메타테이블일 때만 `__eq` 호출** (Lua 5.1). 다른 메타테이블이면 그냥 false.

## Lua 시리즈

| 글 | 다루는 것 |
| --- | --- |
| [Lua 종합 가이드 (Neovim 컨텍스트)](/posts/neovim/2026-06-15-lua-syntax-guide/) | LuaJIT(5.1) 문법 한 번에 정리 — 타입·스코프·테이블·문자열 패턴·`vim.*` 헬퍼 |
| [Lua 모듈](/posts/neovim/2026-06-15-lua-modules/) | `require`/`package.path`, `local M = {} return M` 패턴, Neovim `lua/` 자동 등록 |
| **Lua 메타테이블 (현재 글)** | `__index`/`__newindex`/`__call`, OOP 클래스 패턴, `vim.opt`가 일반 테이블처럼 보이는 이유 |
| [Lua 에러 처리](/posts/neovim/2026-06-15-lua-error-handling/) | `error`/`assert`로 던지고 `pcall`/`xpcall`로 잡기. Neovim 플러그인의 에러 관행 |
