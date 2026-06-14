---
title       : "Lua 문법 2 — 제어 흐름"
description : "if/while/repeat-until, 두 종류의 for, break/return. continue가 없는 Lua 특유의 패턴과 LuaJIT의 goto까지."
date        : 2026-06-15 11:00:00 +0900
updated     : 2026-06-15 11:00:00 +0900
categories  : [neovim, "원리·언어"]
tags        : [lua, neovim]
pin         : false
hidden      : false
---

Lua의 제어 흐름은 단순하다. `if`, `while`, `repeat-until`, 두 종류의 `for`, 그리고 `break`/`return`. 하지만 **`continue`가 없다**는 특이점이 있어서 다른 언어 감각으로 짜면 막힌다. 이번 편에서는 각 구문의 정확한 동작과 Lua만의 관용구를 정리한다.

## 결론 먼저

- 모든 블록은 `end`로 닫는다 (`then`, `do`, `function` 이후 모두).
- `repeat-until`은 **조건이 참일 때 멈춘다** (while과 반대 — 거짓일 때 반복하는 게 아니다).
- `for`는 **numeric**(`i = 1, 10`)과 **generic**(`k, v in pairs(t)`) 두 가지.
- **`continue`는 없다**. `goto continue` 패턴 또는 `if`로 우회.
- LuaJIT은 `goto`/labels를 지원 (Lua 5.2 도입). Neovim에서 안전하게 쓸 수 있다.

## if / elseif / else

```lua
if x > 0 then
  print("양수")
elseif x < 0 then
  print("음수")
else
  print("0")
end
```

`then`을 잊지 말 것. `elseif`는 한 단어 (`else if`로 띄어 쓰면 `end`가 한 번 더 필요해진다).

falsy 규칙은 1편 복습: **`false`와 `nil`만 falsy**.

```lua
local opts = nil
if opts then
  -- nil이면 안 들어옴
end

if opts and opts.enabled then
  -- 단락 평가: opts가 nil이면 opts.enabled는 평가 안 함
end
```

`and`/`or`는 **마지막으로 평가된 값을 반환**한다. 다른 언어처럼 boolean을 강제하지 않는다.

```lua
local x = nil
local y = x or "default"   -- "default"
local z = false or 0       -- 0
local w = 1 and 2          -- 2  (1이 truthy니까 2 반환)
```

이 동작이 Lua의 **삼항 연산자 흉내**가 된다.

```lua
local label = (count > 0) and "있음" or "없음"
```

> 함정: 가운데 값이 falsy면 무너진다. `truthy and false or "X"`는 항상 `"X"`. 이게 문제가 될 수 있는 자리에서는 그냥 `if`로 쓰자.

## while

조건이 참인 동안 반복.

```lua
local i = 1
while i <= 5 do
  print(i)
  i = i + 1
end
```

## repeat-until

`do-while`의 사촌인데 **조건이 참이 되면 멈춘다**. C의 `do { } while (cond)`와 정반대 의미. while을 뒤집은 것.

```lua
local i = 1
repeat
  print(i)
  i = i + 1
until i > 5    -- i가 6이 되면 멈춤
```

특이점: `until` 조건에서 **repeat 블록 안의 local 변수에 접근할 수 있다**. 다른 언어와 다르다.

```lua
repeat
  local line = read_line()
until line == "quit"   -- line이 보임
```

실무에서는 거의 안 쓴다. 알아두기만 하면 된다.

## numeric for

가장 자주 쓴다.

```lua
for i = 1, 10 do
  print(i)         -- 1, 2, ..., 10
end

for i = 1, 10, 2 do  -- step
  print(i)         -- 1, 3, 5, 7, 9
end

for i = 10, 1, -1 do  -- 역방향
  print(i)         -- 10, 9, ..., 1
end
```

- 시작값, 끝값, (옵션) 스텝. 끝값은 **포함**이다.
- 시작/끝/스텝은 루프 시작 시 한 번만 평가된다. 안에서 바꿔도 안 먹힘.

```lua
local n = 10
for i = 1, n do
  n = 5         -- 효과 없음
  print(i)      -- 1..10 다 출력
end
```

## generic for

테이블 순회. `pairs`와 `ipairs`가 핵심.

```lua
local t = { 10, 20, 30 }
for i, v in ipairs(t) do
  print(i, v)    -- 1 10 / 2 20 / 3 30
end

local m = { a = 1, b = 2, c = 3 }
for k, v in pairs(m) do
  print(k, v)    -- 순서는 보장 안 됨
end
```

- **`ipairs`**: 1부터 시작해 `nil`을 만날 때까지 정수 키만 순회. 순서 보장.
- **`pairs`**: 모든 키 순회. 순서 보장 없음.

4편에서 더 깊게 다룬다. 일단은 "배열은 ipairs, 해시맵은 pairs".

## break

가장 가까운 루프를 빠져나간다.

```lua
for i = 1, 10 do
  if i == 5 then break end
  print(i)   -- 1..4
end
```

## continue가 없다

이게 가장 큰 충격. Lua에는 `continue` 키워드가 없다. 두 가지 우회법.

**1. `if`로 본문을 감싸기** (가장 흔함)

```lua
for _, item in ipairs(items) do
  if item.enabled then
    -- 본문
  end
end
```

**2. `goto continue` 라벨** (Lua 5.2+, LuaJIT 지원)

```lua
for _, item in ipairs(items) do
  if not item.enabled then goto continue end
  -- 본문
  ::continue::
end
```

LazyVim 코드베이스에서도 `goto continue` 패턴을 종종 본다. 중첩 조건이 깊어지면 가독성이 살아난다.

## return은 블록 끝에서만

`return`은 **블록의 마지막 문장**이어야 한다. 중간에 못 쓴다.

```lua
function f()
  if x then
    return 1   -- OK (if 블록의 마지막)
  end
  return 2     -- OK (함수 블록의 마지막)
end
```

중간에 빠지고 싶으면 `do return end` 트릭이 있다. Lua 파서를 우회하는 관용구.

```lua
function f()
  do return end    -- 함수 즉시 종료
  -- 아래는 dead code
  print("not reached")
end
```

쓸 일은 거의 없다.

## goto / labels

LuaJIT은 Lua 5.2 문법인 `goto`/`::label::`을 지원한다.

```lua
for i = 1, 10 do
  if i % 2 == 0 then goto skip end
  print(i)
  ::skip::
end
```

쓰임은 거의 `continue` 흉내가 전부. 다중 루프 탈출은 함수로 감싸고 `return`을 쓰는 게 깔끔하다.

## Neovim 컨텍스트

**키맵 등록 루프**

```lua
local keys = {
  { "<leader>ff", "<cmd>Telescope find_files<cr>", desc = "Find files" },
  { "<leader>fg", "<cmd>Telescope live_grep<cr>",  desc = "Grep" },
  { "<leader>fb", "<cmd>Telescope buffers<cr>",    desc = "Buffers" },
}

for _, k in ipairs(keys) do
  vim.keymap.set("n", k[1], k[2], { desc = k.desc })
end
```

**조건부 플러그인 활성화 (LazyVim)**

```lua
return {
  "owner/heavy-plugin",
  enabled = function()
    return vim.fn.has("nvim-0.10") == 1   -- truthy 평가
  end,
}
```

**파일 타입 분기**

```lua
vim.api.nvim_create_autocmd("FileType", {
  pattern = { "python", "lua" },
  callback = function(args)
    local ft = vim.bo[args.buf].filetype
    if ft == "python" then
      vim.bo[args.buf].expandtab = true
    elseif ft == "lua" then
      vim.bo[args.buf].shiftwidth = 2
    end
  end,
})
```

## 함정 정리

1. **`continue` 없음**. `if`로 감싸거나 `goto continue` 패턴.
2. **`repeat-until` 의미가 반대**. while과 같은 감각으로 읽으면 틀린다.
3. **`return`은 블록 끝에서만**. 중간 종료는 `do return end` (거의 안 씀).
4. **`and`/`or`는 boolean 강제 안 함**. 마지막 평가값을 반환. 삼항 흉내 시 가운데 falsy 주의.
5. **numeric for의 시작/끝/스텝은 한 번만 평가**. 안에서 변경 무효.
6. **`ipairs`는 nil에서 멈춘다**. sparse 배열을 끝까지 못 돈다 (4편에서 자세히).

## 다음 편

3편은 **함수** — 정의 형태, 다중 반환, 가변 인자, 클로저, 메서드 호출(`t:f()` vs `t.f(t)`). Neovim 콜백 패턴이 여기서 다 풀린다.
