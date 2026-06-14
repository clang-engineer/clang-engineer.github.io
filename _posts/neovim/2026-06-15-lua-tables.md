---
title       : "Lua 문법 4 — 테이블"
description : "array와 hash가 한 자료형. # 연산자 함정, ipairs vs pairs 차이, table.* 라이브러리, Neovim vim.tbl_* 헬퍼까지."
date        : 2026-06-15 13:00:00 +0900
updated     : 2026-06-15 13:00:00 +0900
categories  : [neovim, "원리·언어"]
tags        : [lua, neovim]
pin         : false
hidden      : false
---

Lua에서 **table은 사실상 유일한 자료구조**다. 배열, 해시맵, 객체, 모듈, 네임스페이스, 클래스 다 table 위에 올라간다. LazyVim 설정도, 플러그인 spec도, `vim.opt` 결과도 전부 table. 이번 편은 table의 정확한 동작, 자주 물리는 함정, 그리고 Neovim에서 자주 쓰는 헬퍼들을 정리한다.

## 결론 먼저

- table 하나가 **array와 hash를 동시에** 담을 수 있다.
- 배열 인덱스는 **1부터 시작**.
- `#t`는 sparse table(중간에 nil)에서 부정확하다.
- `ipairs`는 정수 키만 1부터 nil까지, `pairs`는 모든 키 (순서 없음).
- Neovim 설정 병합은 `vim.tbl_deep_extend("force", a, b)` 패턴.

## 테이블 생성

리터럴 두 가지 방식이 섞여 있다.

```lua
local arr = { 10, 20, 30 }                    -- 배열 부분
local map = { name = "neo", age = 30 }        -- 해시 부분
local mixed = { 1, 2, 3, name = "neo" }       -- 둘 다

-- 동적 키 (계산된 키)
local k = "dynamic"
local t = { [k] = 1, ["literal-key"] = 2 }
print(t.dynamic, t["literal-key"])   -- 1  2
```

배열 부분의 인덱스는 **1, 2, 3, ...**. 0이 아니다.

```lua
local arr = { 10, 20, 30 }
print(arr[1], arr[2], arr[3])   -- 10  20  30
print(arr[0])                   -- nil
```

## array vs hash — 사실 같은 테이블

내부적으로는 array part와 hash part가 있고 자동으로 나뉜다. 사용자 입장에선 신경 안 써도 됨.

```lua
local t = {}
t[1] = "a"      -- array part로 들어감
t[2] = "b"
t.name = "neo"  -- hash part로 들어감
```

배열 부분에 string 키를 섞거나, sparse하게 비우면 array part가 쪼개진다. 성능 미세 조정이 필요할 때나 의식.

## `#` 연산자 — 길이의 함정

`#t`는 **연속된 정수 키의 길이**다. 중간에 nil이 있으면 동작이 정의되지 않는다.

```lua
local a = { 1, 2, 3 }
print(#a)        -- 3 (안전)

local b = { 1, nil, 3 }
print(#b)        -- 1 또는 3 (구현 의존, "border" 찾기)

a[10] = "x"
print(#a)        -- 3 또는 10 (역시 구현 의존)
```

규칙: **sparse table에서 `#`은 신뢰 못 함**. 가변 인자에서 받은 테이블, 동적으로 키 삽입/삭제한 테이블에서 특히 조심.

정확한 개수가 필요하면 직접 세거나, `select("#", ...)`(가변 인자 시) 사용.

## ipairs vs pairs

이 둘의 차이는 "왜 내 루프가 끝까지 안 도느냐"의 답이다.

```lua
local t = { "a", "b", "c", name = "neo" }

for i, v in ipairs(t) do
  print(i, v)
end
-- 1  a
-- 2  b
-- 3  c
-- (name은 안 나옴 — 정수 키만)

for k, v in pairs(t) do
  print(k, v)
end
-- 1  a
-- 2  b
-- 3  c
-- name  neo
-- (순서는 보장 X)
```

- **`ipairs(t)`**: `i = 1, 2, 3, ...`를 시도하다가 `t[i] == nil`이면 멈춤. 정수 키만, 순서 보장.
- **`pairs(t)`**: 모든 키 순회. **순서 보장 없음**. 구현 의존.

sparse 배열에서 `ipairs`가 멈춰버린다.

```lua
local s = { 1, 2, nil, 4 }
for i, v in ipairs(s) do
  print(i, v)
end
-- 1  1
-- 2  2
-- (nil에서 멈춤, 4는 못 봄)
```

**순서가 중요한 정수 키**면 `ipairs`, **순서 무관**이면 `pairs`. 또는 `for i = 1, #t do` 직접 인덱싱.

## table.* 라이브러리

자주 쓰는 것만 정리.

| 함수 | 역할 |
| --- | --- |
| `table.insert(t, v)` | 배열 끝에 추가 |
| `table.insert(t, pos, v)` | 위치에 삽입 (뒤로 밀림) |
| `table.remove(t)` | 마지막 제거하고 반환 |
| `table.remove(t, pos)` | 위치의 값 제거하고 반환 |
| `table.concat(t, sep)` | 배열 → 문자열 (sep로 join) |
| `table.sort(t, cmp)` | 제자리 정렬, cmp 옵션 |
| `table.unpack(t)` 또는 `unpack(t)` | 배열을 가변 인자로 펼침 |

```lua
local t = {}
table.insert(t, "a")
table.insert(t, "b")
table.insert(t, 1, "head")   -- 앞에 끼움
print(table.concat(t, ","))   -- head,a,b

table.sort(t)                 -- 사전순
table.sort(t, function(a, b) return #a < #b end)  -- 짧은 순

local arr = { 10, 20, 30 }
print(unpack(arr))            -- 10  20  30
```

> LuaJIT에서는 전역 `unpack`이 살아있고, `table.unpack`도 동작. Lua 5.2+에서는 `table.unpack` 권장이지만 Neovim에서는 둘 다 OK.

## 참조 타입

테이블은 참조로 다뤄진다. 할당은 복사가 아니라 같은 객체를 가리킨다.

```lua
local a = { 1, 2, 3 }
local b = a
b[1] = 99
print(a[1])   -- 99 (같은 테이블)

print(a == b)             -- true (같은 참조)
print(a == { 1, 2, 3 })   -- false (다른 객체)
```

깊은 비교나 복사가 필요하면 직접 작성하거나 헬퍼 사용 (Neovim의 `vim.deepcopy`).

## Neovim 컨텍스트

**vim.tbl_deep_extend — 설정 병합의 정석**

LazyVim/플러그인 opts 병합에 가장 많이 쓴다.

```lua
local defaults = {
  ui = { border = "rounded", width = 80 },
  keys = { close = "q" },
}

local user = {
  ui = { border = "double" },     -- width는 안 건드림
}

local merged = vim.tbl_deep_extend("force", defaults, user)
-- merged = {
--   ui = { border = "double", width = 80 },
--   keys = { close = "q" },
-- }
```

`"force"`는 충돌 시 뒤쪽 우선, `"keep"`은 앞쪽 우선, `"error"`는 충돌 시 에러.

**자주 쓰는 vim.tbl_* 헬퍼**

| 함수 | 역할 |
| --- | --- |
| `vim.tbl_extend(mode, ...)` | 얕은 병합 |
| `vim.tbl_deep_extend(mode, ...)` | 깊은 병합 |
| `vim.tbl_contains(t, v)` | 값 포함 여부 |
| `vim.tbl_keys(t)` | 키 배열 |
| `vim.tbl_values(t)` | 값 배열 |
| `vim.tbl_filter(fn, t)` | 필터 |
| `vim.tbl_map(fn, t)` | 매핑 |
| `vim.tbl_isempty(t)` | 비었는지 |
| `vim.deepcopy(t)` | 깊은 복사 |

**LazyVim 플러그인 spec의 opts**

```lua
return {
  "folke/which-key.nvim",
  opts = {
    plugins = {
      marks = true,
      registers = true,
    },
    win = {
      border = "rounded",
    },
  },
}
```

이 `opts`는 LazyVim 내부에서 다른 spec의 `opts`와 `vim.tbl_deep_extend("force", ...)`로 머지된다. 같은 키를 다른 파일에서 잡으면 force 우선순위로 합쳐진다.

**`vim.opt` 결과도 테이블 같은 객체**

```lua
vim.opt.runtimepath:append("/some/path")    -- 메서드 호출
vim.opt.listchars = { tab = "→ ", trail = "·" }
```

5편 메타테이블에서 이게 어떻게 동작하는지 풀린다.

## 함정 정리

1. **인덱스는 1부터**. C/JS 감각으로 0번 접근하면 nil.
2. **`#t`는 sparse table에서 부정확**. 중간에 nil 있으면 신뢰 X.
3. **`ipairs`는 nil에서 멈춘다**. sparse 배열 끝까지 못 도는 원인.
4. **`pairs`는 순서 보장 없음**. 순서 의존 코드 짜면 환경마다 다르게 동작.
5. **테이블은 참조**. `b = a` 후 `b` 수정하면 `a`도 바뀐다.
6. **`a == b`는 같은 참조인지**. 내용 비교 아님.
7. **`vim.tbl_deep_extend`의 mode 인자 필수**. 빼먹으면 에러.

## 다음 편

5편은 **메타테이블** — `__index`, `__newindex`, `__call` 같은 메타메서드와 클래스 패턴. 문자열의 메서드 호출(`("hi"):upper()`)이 어떻게 가능한지, Neovim의 `vim.opt`가 왜 일반 테이블처럼 보이지만 다르게 동작하는지 풀린다.
