---
title       : "한 Neovim 플러그인에 Lua와 Vimscript 섞기 — 분담 기준과 안티패턴"
description : "Neovim은 두 인터프리터를 다 내장해서 한 플러그인 안에 두 언어를 섞을 수 있다. 호출 경계를 최소화하는 분담 원칙, 흔한 안티패턴, dadbod-vertica식 모범 패턴."
date        : 2026-06-12 19:30:00 +0900
updated     : 2026-06-12 19:30:00 +0900
categories  : [vim, "플러그인·생태계"]
tags        : [neovim, lua, vimscript, plugin, interop, dadbod]
pin         : false
hidden      : false
---

Neovim 플러그인을 만들다 보면 한 레포 안에 `.vim`과 `.lua`가 같이 들어 있는 걸 흔히 본다. 두 언어를 섞을 수 있는 건 Neovim 코어가 양쪽 인터프리터를 다 내장하고 있기 때문이다. 다만 **아무렇게나 섞으면 유지보수가 지옥**이 된다. 이 글은 섞을 때 따라야 할 분담 원칙과 흔한 안티패턴을 정리한다.

## 결론 먼저

세 줄 원칙:

1. **한 파일 = 한 언어**
2. **언어 경계는 데이터 전달만 (`vim.g.*` 변수). 함수 호출 핑퐁 금지**
3. **autoload는 Vimscript, lua/는 Lua, 나머지는 부모와 같은 언어**

## 왜 섞을 수 있는가 — Neovim 내부 구조

Neovim은 한 바이너리 안에 **C 코어 + Vimscript 인터프리터 + LuaJIT** 셋을 다 품고 있다.

```
┌─────────────────────────────────────────────┐
│            Neovim 실행 파일                  │
│                                             │
│  ┌───────────────┐    ┌────────────────┐   │
│  │ Vimscript 인터프리터 │    │ LuaJIT 인터프리터 │   │
│  └──────┬────────┘    └────────┬───────┘   │
│         │                      │            │
│         └────────┬─────────────┘            │
│                  ▼                          │
│  ┌─────────────────────────────────────┐   │
│  │  C 코어 — 버퍼·창·렌더링·nvim_* API   │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

두 인터프리터는 **C 코어를 통해 서로 호출**할 수 있다. 그래서 한 플러그인 안에서 `.vim`과 `.lua`를 자유롭게 섞을 수 있다.

## 양방향 호출 메커니즘

### Lua → Vimscript

```lua
-- 함수 호출
vim.fn.expand("%:p")
vim.fn["db#adapter#vertica#interactive"]("vertica://...")

-- 명령 실행
vim.cmd([[ source autoload/foo.vim ]])
vim.cmd("normal! gg")

-- 변수 읽기/쓰기
vim.g.some_var = "hello"
local x = vim.g.some_var
```

### Vimscript → Lua

```vim
" 명령으로 한 줄 실행
:lua print("hello")
:lua require('foo').setup()

" 표현식 평가
let result = luaeval('1 + 2')
let mapped = luaeval('vim.tbl_map(_A.fn, _A.list)', { 'fn': function('strlen'), 'list': ['a','bb','ccc'] })
```

내부적으로 두 언어의 값 객체(Vimscript dict ↔ Lua table)가 C 함수를 거쳐 자동 변환된다. 변환 비용은 작지만 호출 횟수가 많아지면 누적된다.

## 분담 원칙 — 한 파일 = 한 언어

가장 중요한 원칙. **호출 경계를 파일 경계와 일치**시킨다.

| 파일/디렉토리 | 권장 언어 | 이유 |
| --- | --- | --- |
| `lua/foo/init.lua` (사용자 진입점) | **Lua** | `setup(opts)` 관례, lazy.nvim 호환 |
| `lua/foo/*.lua` (내부 로직) | **Lua** | 진입점과 같은 언어 유지 |
| `plugin/foo.{vim,lua}` (자동 로드) | **부모와 같은 언어** | 부모 Vimscript면 `.vim`, 신규면 `.lua` |
| `autoload/foo/bar.vim` | **Vimscript 강제** | `foo#bar()` 호출 문법이 Vimscript autoload 전용 |
| `ftplugin/python.{vim,lua}` | **둘 다 OK** | 짧으면 Vimscript도 깔끔 |
| 외부 Vimscript 함수 monkey-patch | **Vimscript** | 같은 언어로 덮어쓰는 게 깔끔 |

## 안티패턴 — 이건 피하기

### 1. 인라인 `vim.cmd([[ 큰 덩어리 ]])`

```lua
-- 나쁜 예: Lua 안에서 Vimscript 큰 덩어리 박기
vim.cmd([[
  function! s:my_complex_logic(arg) abort
    let result = {}
    " ... 20줄짜리 Vimscript ...
    return result
  endfunction
]])
local r = vim.fn["s:my_complex_logic"]("x")  -- script-local 접근 불가
```

문제점:

- 문법 하이라이트가 깨짐 (문자열 안의 Vimscript)
- 에러 라인이 `vim.cmd:1`처럼 뭉뚱그려 나옴
- `s:` script-local 변수가 Lua 쪽에서 접근 안 됨
- 변경 시 매번 cmd 호출 → 매번 Vimscript 파서가 돌아감

**해결**: Vimscript 함수는 `autoload/foo/bar.vim` 파일로 빼라.

### 2. 함수 호출 핑퐁

```vim
" Vimscript에서 Lua 호출
function! s:foo() abort
  let result = luaeval('require("foo").complex_thing(_A)', { 'a': 1, 'b': 2 })
  call s:bar(result)
endfunction
```

```lua
-- Lua에서 다시 Vimscript 호출
function M.complex_thing(opts)
  return vim.fn["s:foo"]()  -- 무한 핑퐁 위험
end
```

호출 경계가 여러 번 왔다 갔다 하면 디버깅이 어려워지고, 변환 비용이 누적된다.

**해결**: 한쪽 언어로 로직을 모은다. 다른 언어는 데이터 전달만.

### 3. 큰 dict/table 인자로 던지기

```lua
-- 나쁜 예: 100개짜리 list를 매번 Vimscript로 변환
for i = 1, 1000 do
  vim.fn["foo#process"](huge_list)  -- 매 호출마다 변환 비용
end
```

C 변환 비용 자체는 작지만 타이트한 루프 안에서 반복되면 누적된다.

**해결**: 루프는 한 언어 안에서 끝낸다. 결과만 다른 언어로 넘긴다.

## 모범 패턴 — dadbod-vertica.nvim 식

vim-dadbod 어댑터를 예로 본다.

```
dadbod-vertica.nvim/
├── plugin/dadbod-vertica.vim       ← Vimscript 본체 (부모 정렬)
├── autoload/db/adapter/vertica.vim  ← Vimscript autoload (강제)
└── lua/dadbod-vertica/init.lua     ← Lua 10줄 setup 래퍼
```

### Lua 진입점 — 10줄

```lua
-- lua/dadbod-vertica/init.lua
local M = {}

function M.setup(opts)
  opts = opts or {}
  if opts.vsql ~= nil then
    vim.g.dadbod_vertica_vsql = opts.vsql
  end
end

return M
```

### Vimscript 본체 — 읽기만

```vim
" plugin/dadbod-vertica.vim
if exists('g:loaded_dadbod_vertica') | finish | endif
let g:loaded_dadbod_vertica = 1

if !exists('g:dadbod_vertica_vsql')
  let g:dadbod_vertica_vsql = 'vsql'
endif

" 이후 g:dadbod_vertica_vsql을 사용하는 로직...
```

### 사용자 입장

```lua
-- lazy.nvim spec
return {
  "myuser/dadbod-vertica.nvim",
  opts = { vsql = "/usr/local/bin/vsql" },
}
```

### 왜 좋은가

- **호출 경계 단 한 번**: `setup(opts)`에서 `vim.g.*` 변수 set만 함
- **두 언어가 직접 함수 호출 안 함** → 호출 경계 0개
- **lazy.nvim 사용자 편의**: `opts = {...}`만 적으면 자동 호출
- **Vimscript 본체**: 부모(vim-dadbod-ui) 규약과 정렬

언어 경계가 **데이터 전달 한 번**으로 끝나는 게 핵심이다.

## 강제 vs 관례 — 한 줄 정리

| 항목 | 강제 여부 |
| --- | --- |
| `autoload/foo/bar.vim` → Vimscript 사용 | **강제** (메커니즘 자체가 Vimscript autoload 문법) |
| `lua/foo.lua` → Lua 사용 | **강제** (`require()`는 Lua만 인식) |
| `plugin/foo.{vim,lua}` 자동 로드 | 둘 다 가능, 강제 아님 |
| 사용자 진입점 `setup(opts)` | **관례** (안 따라도 동작) |
| 한 파일 한 언어 | **관례** (안 따라도 동작) |

진짜 강제는 두 가지(`autoload/`, `lua/`)뿐. 나머지는 다 커뮤니티 표준이다.

## 정리

Neovim 코어가 두 인터프리터를 내장하기 때문에 한 플러그인 안에 Lua와 Vimscript가 공존할 수 있다. 자유는 있지만, 그게 "편한 대로 섞으라"는 뜻은 아니다.

원칙은 단순하다:

- **한 파일 = 한 언어** — 호출 경계를 파일 경계와 일치시킨다
- **언어 경계는 데이터 전달만** — `vim.g.*` 변수 set/get 정도가 적정선
- **함수 호출 핑퐁 금지** — 디버깅·성능 모두 나빠진다

신규 플러그인이고 부모 의존이 없다면 **그냥 전부 Lua**로 가는 게 가장 단순하다. 섞는 건 부모 생태계가 Vimscript여서 어쩔 수 없을 때의 해법이다.
