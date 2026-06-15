---
title       : "Lua 모듈"
description : "require/package.path, local M = {} return M 패턴, require 캐시, Neovim lua/ 디렉토리 자동 등록과의 연결."
date        : 2026-06-15 15:00:00 +0900
updated     : 2026-06-15 15:00:00 +0900
categories  : [neovim, "원리·언어"]
tags        : [lua, neovim, guide]
pin         : false
hidden      : false
---

Lua의 모듈 시스템은 단순하다. **파일 = 모듈**, **`require`로 로드**, **`return M`으로 노출**. 하지만 `package.path`가 어떻게 만들어지고, `require`가 무엇을 캐싱하고, Neovim의 `lua/` 자동 등록과 어떻게 맞물리는지 알면 본인 설정을 모듈로 쪼개기가 훨씬 쉬워진다.

## 결론 먼저

- 모듈은 그냥 Lua 파일이고, `return`한 값이 `require`의 결과가 된다.
- 관례는 **`local M = {} ... return M`**. 노출할 것만 `M`에 담는다.
- `require("foo.bar")`는 `package.path`의 `?`을 `foo/bar`로 치환해서 찾는다.
- **`require`는 결과를 캐시**한다. 두 번째 호출은 같은 객체 반환.
- Neovim은 `runtimepath/lua/`를 자동으로 `package.path`에 더해준다. `lua/foo/init.lua` → `require("foo")`.

## 가장 단순한 모듈

```lua
-- 파일: lua/mymath.lua
local M = {}

function M.add(a, b)
  return a + b
end

function M.mul(a, b)
  return a * b
end

return M
```

사용처:

```lua
local m = require("mymath")
print(m.add(1, 2))   -- 3
```

`return M`이 전부다. `M`은 그냥 컨벤션 (다른 이름이어도 됨). 노출하고 싶지 않은 헬퍼는 `M`에 안 담고 그냥 `local`로 둔다.

## 모듈 안 헬퍼는 local로

```lua
local M = {}

local function format_name(s)   -- 내부용, 노출 X
  return s:lower():gsub("%s", "_")
end

function M.greet(name)
  return "hi " .. format_name(name)
end

return M
```

`format_name`은 `M.format_name = ...`로 안 했으니 `require("mod").format_name`로 접근 안 된다.

## require의 동작

`require("foo.bar")`이 실제로 하는 일:

1. 이미 로드돼 있나 확인 (`package.loaded["foo.bar"]`).
2. 있으면 그 값 반환 (캐시).
3. 없으면 `package.path`를 순회하며 `foo/bar.lua`를 찾는다 (`.`은 `/`로 바뀜).
4. 찾으면 실행해서 `return` 값을 `package.loaded["foo.bar"]`에 저장하고 반환.
5. 못 찾으면 에러.

`package.path` 확인:

```lua
print(package.path)
-- 보통 ./?.lua;./?/init.lua;/usr/share/lua/5.1/?.lua;... 식
```

`?`이 모듈 경로(슬래시로 변환된)로 치환된다.

```
require("foo.bar")
→ "foo/bar"
→ ./foo/bar.lua 시도
→ ./foo/bar/init.lua 시도
→ ...
```

`init.lua`가 디렉토리의 entry point다. `foo/init.lua`가 있으면 `require("foo")`로 로드된다. **Python의 `__init__.py`와 같은 역할**.

## require 캐시의 함정

```lua
local a = require("mymath")
local b = require("mymath")
print(a == b)   -- true
```

같은 객체다. 즉 **모듈의 상태는 공유**된다. 개발 중 모듈을 수정해도 `require`로 다시 불러도 옛 버전이 나온다. 강제 리로드:

```lua
package.loaded["mymath"] = nil
local fresh = require("mymath")
```

Neovim에서는 `vim.loader`나 lazy.nvim의 reload, 또는 plenary의 `R("modname")` 등으로 자주 처리한다.

## Neovim과 package.path

Neovim 시작 시 `runtimepath`의 모든 `lua/` 디렉토리가 `package.path`에 자동 추가된다.

```
~/.config/nvim/lua/
~/.local/share/nvim/lazy/<plugin>/lua/
/opt/homebrew/share/nvim/runtime/lua/
...
```

따라서:

```
~/.config/nvim/lua/config/options.lua  →  require("config.options")
~/.config/nvim/lua/plugins/init.lua    →  require("plugins")  (init.lua 자동)
~/.config/nvim/lua/util/keys.lua       →  require("util.keys")
```

플러그인 코드도 똑같다.

```
nvim/lazy/telescope.nvim/lua/telescope/builtin.lua
→ require("telescope.builtin")
```

LazyVim 기본 구조의 정체.

## init.lua의 두 가지 의미

헷갈리기 쉽다.

1. **`~/.config/nvim/init.lua`**: Neovim의 **시작 파일**. `:lua` 없이 그냥 Lua가 실행된다.
2. **`lua/foo/init.lua`**: `foo` 모듈의 **엔트리**. `require("foo")`로 로드.

두 번째 init.lua는 `lua/foo.lua`와 동등하지만, `foo/` 디렉토리 안에 서브모듈을 둘 때 쓴다.

```
lua/util/init.lua    -- require("util")
lua/util/keys.lua    -- require("util.keys")
lua/util/lsp.lua     -- require("util.lsp")
```

## 모듈 안에서 다른 모듈 참조

```lua
-- lua/util/keys.lua
local lsp = require("util.lsp")   -- 같은 디렉토리도 절대 경로로
local M = {}

function M.setup() lsp.attach() end

return M
```

상대 경로는 없다. 전부 `runtimepath/lua/` 기준 절대 경로.

## 순환 import

A가 B를 require하고 B가 A를 require하는 상황. Lua는 부분 로드된 모듈을 반환해 동작하긴 한다.

```lua
-- a.lua
local M = {}
package.loaded["a"] = M       -- 캐시에 미리 등록 (관용구)
local b = require("b")
function M.foo() return b.bar() end
return M
```

이 패턴이 안전. 하지만 가능하면 순환 의존성 자체를 피하는 게 낫다.

## 그 외 유용한 함수

- **`pcall(require, "modname")`**: 모듈 없을 때 에러 대신 false 반환.
  ```lua
  local ok, mod = pcall(require, "optional-plugin")
  if not ok then return end
  ```
- **`package.loaded["modname"] = nil`**: 캐시 제거.
- **`pairs(package.loaded)`**: 현재 로드된 모듈 목록.

## Neovim 컨텍스트

**LazyVim의 표준 구조**

```
~/.config/nvim/
├── init.lua                    -- "require 'config.lazy'" 정도
├── lua/
│   ├── config/
│   │   ├── lazy.lua            -- lazy.nvim 부트스트랩
│   │   ├── options.lua         -- vim.opt.*
│   │   ├── keymaps.lua         -- vim.keymap.set
│   │   └── autocmds.lua
│   └── plugins/
│       ├── init.lua            -- 또는 그냥 폴더 (lazy.nvim이 스캔)
│       ├── telescope.lua       -- 한 파일 = 한 플러그인 spec
│       └── ...
```

`init.lua`의 첫 줄들:

```lua
-- ~/.config/nvim/init.lua
require("config.options")
require("config.keymaps")
require("config.autocmds")
require("config.lazy")
```

각 모듈 파일은 `return M` 패턴.

**플러그인 spec 반환**

```lua
-- lua/plugins/which-key.lua
return {
  "folke/which-key.nvim",
  opts = { ... },
}
```

여기서는 `M` 없이 바로 테이블을 `return`. lazy.nvim이 `require("plugins.which-key")` 결과를 spec으로 해석한다.

**조건부 require로 옵셔널 의존성**

```lua
local ok, dap = pcall(require, "dap")
if not ok then
  vim.notify("dap not installed", vim.log.levels.WARN)
  return
end
-- dap 사용
```

**개발 중 모듈 강제 리로드**

```lua
-- 빠른 디버깅용
package.loaded["my.module"] = nil
local m = require("my.module")
```

## 함정 정리

1. **`require`는 캐시**. 수정 후 다시 require해도 옛 버전. `package.loaded[name] = nil` 또는 reload 헬퍼.
2. **`return M` 빼먹으면** `require` 결과가 nil. 모듈 안 함수 못 부름.
3. **`function M.foo` vs `local function foo`**: 전자만 외부로 노출.
4. **`require("foo.bar")`의 `.`은 디렉토리 구분자**. `foo_bar.lua` 아니라 `foo/bar.lua`.
5. **모듈 안에서 같은 패키지 모듈 참조도 절대 경로**. 상대 경로 없음.
6. **lua/foo.lua와 lua/foo/init.lua가 동시에 있으면** 어느 게 먼저인지 `package.path` 순서에 의존. 헷갈리지 않게 하나만 두기.
