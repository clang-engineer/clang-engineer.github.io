---
title       : "Neovim의 vim 전역 API 지도 — vim.api vs vim.fn, 옵션·매핑·커맨드"
description : "플러그인 Lua 코드에 나오는 vim.* 가 대체 뭔지 한 장으로. 옵션 4갈래(o/opt/bo/wo/g), vim.api와 vim.fn의 갈림길, 키매핑·커맨드·오토커맨드·유틸·스케줄링까지."
date        : 2026-06-19 18:00:00 +0900
categories  : [neovim, "원리·언어"]
tags        : [lua, api]
pin         : false
hidden      : false
---

Neovim 플러그인을 Lua로 짜다 보면 `vim.opt`, `vim.api.nvim_*`, `vim.fn.*`, `vim.keymap.set` 같은 `vim.xxx` 호출이 끝없이 나온다. 이게 다 뭐고 언제 어떤 걸 쓰는지 한 장으로 정리한다. 문법(Lua 자체)이 아니라 **`vim`이라는 전역 객체의 지도**가 이 글의 주제다.

## 결론 먼저

- `vim`은 Neovim이 Lua 런타임에 주입하는 **단 하나의 전역 테이블**이다. 에디터를 만지는 모든 통로가 여기서 갈라진다.
- 옵션은 **범위(scope)**로 갈린다: 전역 `vim.o`/`vim.opt`, 버퍼 `vim.bo`, 윈도우 `vim.wo`, 전역 변수 `vim.g`.
- 동작 호출의 핵심 갈림길은 **`vim.api`(네이티브 C, 권장) vs `vim.fn`(레거시 Vimscript 함수)**. API에 있으면 API, 없으면 `vim.fn`.
- 키매핑·커맨드·오토커맨드는 전용 헬퍼(`vim.keymap.set`, `nvim_create_user_command`, `nvim_create_autocmd`)가 표준.
- 비동기·이벤트 루프가 필요하면 `vim.schedule` / `vim.uv`.

## vim — 단일 진입점

`vim`은 `require` 없이 어디서나 쓸 수 있는 전역이다. nvim 프로세스 안에서만 존재하므로, 일반 `lua` 인터프리터에서 스크립트를 돌리면 `vim`이 nil이다 (그래서 플러그인 테스트는 헤드리스 nvim을 띄워서 돌린다).

크게 세 부류로 나눠 보면 머릿속이 정리된다.

| 부류 | 예시 | 정체 |
| --- | --- | --- |
| **상태(state) 접근자** | `vim.o`, `vim.bo`, `vim.wo`, `vim.g`, `vim.b`, `vim.env` | 옵션·변수를 읽고 쓰는 프록시 |
| **동작(action) 호출** | `vim.api.*`, `vim.fn.*`, `vim.cmd` | 에디터에게 뭔가 시키기 |
| **유틸·런타임** | `vim.tbl_*`, `vim.split`, `vim.schedule`, `vim.uv`, `vim.notify` | Lua 쪽 헬퍼와 이벤트 루프 |

## 1. 옵션·변수 — 범위로 갈린다

Vimscript의 `set`, `let g:`, `&l:option`을 Lua에서 대신하는 자리다.

```lua
vim.o.number = true            -- 전역 옵션 (옛 :set number)
vim.opt.shortmess:append("c")  -- 리스트·맵 옵션 편의 래퍼
vim.bo.shiftwidth = 2          -- 현재 버퍼 옵션 (vim.bo[bufnr]로 특정 버퍼)
vim.wo.wrap = false            -- 현재 윈도우 옵션
vim.g.mapleader = " "          -- 전역 변수 (옛 let g:mapleader)
vim.b.did_ftplugin = true      -- 버퍼 로컬 변수
vim.env.PATH = vim.env.PATH .. ":/x"  -- 환경변수
```

### vim.o vs vim.opt — 헷갈리는 단짝

| | `vim.o` | `vim.opt` |
| --- | --- | --- |
| 값 형태 | 원시 값 (문자열·불리언·숫자) | 메타테이블 프록시 객체 |
| 리스트 옵션 | `vim.o.listchars = "tab:→ "` 문자열 직접 | `vim.opt.listchars = { tab = "→ " }` 테이블 |
| 메서드 | 없음 | `:append()` / `:remove()` / `:get()` |
| 읽기 | `vim.o.number` → `true` | `vim.opt.number:get()` → `true` |

규칙은 단순하다 — **단순 값은 `vim.o`, `+=`/`-=`가 필요한 리스트·맵 옵션은 `vim.opt`.** `vim.opt`이 평범한 할당처럼 보이는데 실제로는 C 함수를 부르는 이유는 메타테이블 때문이다(아래 시리즈의 메타테이블 글 참고).

## 2. vim.api vs vim.fn — 가장 중요한 갈림길

동작을 시킬 때 거의 항상 이 둘 중 하나다.

### vim.api — 네이티브 API (권장)

`nvim_` 접두사가 붙은 C 구현 함수들. 버퍼·윈도우·extmark·커맨드 등 Neovim이 새로 설계한 명시적 인터페이스다.

```lua
vim.api.nvim_buf_get_lines(0, 0, -1, false)   -- 버퍼 0의 전체 라인
vim.api.nvim_win_get_cursor(0)                -- {row, col}
vim.api.nvim_get_current_buf()                -- 현재 버퍼 핸들
vim.api.nvim_create_user_command(...)         -- 커맨드 등록
```

특징: 인자·반환이 명확하고(0-base 인덱스, 핸들 정수), 문서가 `:h nvim_buf_get_lines`처럼 직접 매칭된다. 새로 짜면 여기부터 찾는다.

### vim.fn — 레거시 Vimscript 함수

`expand()`, `has()`, `glob()`, `getline()`처럼 Vim 시절부터 있던 함수를 Lua에서 호출하는 통로다.

```lua
vim.fn.expand("%:p")           -- 현재 파일 절대경로
vim.fn.has("nvim-0.10")        -- 기능 존재 여부 (0/1 반환)
vim.fn.glob("~/.config/*")
vim.fn.executable("rg")        -- 1/0
vim.fn["db#adapter#vertica#interactive"]("...")  -- # 들어간 함수명은 인덱싱
```

특징: **1-base 인덱스, 불리언 대신 0/1 반환** 같은 Vimscript 관습을 그대로 물려받는다. API에 대응물이 없는 기존 함수는 여기로 간다.

### 어느 쪽?

| 상황 | 선택 |
| --- | --- |
| 버퍼·윈도우·탭·extmark 조작 | `vim.api` |
| 커맨드·오토커맨드·키맵 등록 | `vim.api` (또는 `vim.keymap`) |
| 경로 확장, `has()`, `glob()`, `system()` 등 | `vim.fn` |
| 둘 다 있을 때 | `vim.api` 우선 (C 직행, 명시적) |

성능은 둘 다 결국 C 코어로 내려가서 **체감 차이가 거의 없다** — 선택 기준은 속도가 아니라 명확성과 대응물 존재 여부다.

## 3. vim.cmd — Ex 커맨드 탈출구

API에도 `vim.fn`에도 깔끔한 대응이 없을 때, Vimscript/Ex 커맨드를 문자열로 그대로 던진다.

```lua
vim.cmd("colorscheme tokyonight")
vim.cmd.write()                       -- vim.cmd.<name>() 형태도 가능
vim.cmd.normal({ "gg", bang = true }) -- :normal! gg
vim.cmd([[
  highlight Normal guibg=NONE
  autocmd FileType python setlocal expandtab
]])
```

편하지만 문자열이라 정적 검사가 안 된다. API/헬퍼로 표현 가능하면 그쪽이 낫고, `vim.cmd`는 컬러스킴 적용·복합 Ex 명령 같은 탈출구로 쓴다.

## 4. 키매핑·커맨드·오토커맨드

플러그인이 사용자에게 노출하는 3종 세트. 전용 헬퍼가 표준이다.

```lua
-- 키매핑
vim.keymap.set("n", "<leader>w", function() vim.cmd.write() end, { desc = "Save", silent = true })

-- 사용자 커맨드
vim.api.nvim_create_user_command("MyHello", function(opts)
  print("hi " .. opts.args)
end, { nargs = "?" })

-- 오토커맨드 (그룹으로 묶어 중복 등록 방지)
local group = vim.api.nvim_create_augroup("MyPlugin", { clear = true })
vim.api.nvim_create_autocmd("BufWritePre", {
  group = group,
  pattern = "*.lua",
  callback = function(args) ... end,  -- args.buf, args.file 등
})
```

`vim.keymap.set`은 Lua 함수를 직접 콜백으로 받고 `desc`로 which-key 설명까지 붙는다 — 옛 `nvim_set_keymap`보다 이쪽이 관례다.

## 5. 유틸과 런타임

Lua에는 표준 라이브러리가 빈약해서, Neovim이 자주 쓰는 헬퍼를 `vim.*`로 채워 넣었다.

```lua
-- 테이블·문자열
vim.tbl_deep_extend("force", defaults, user)  -- setup 옵션 병합의 핵심
vim.split("a,b,c", ",")                        -- → { "a", "b", "c" }
vim.tbl_map(fn, t)  vim.tbl_filter(fn, t)  vim.tbl_isempty(t)
vim.deepcopy(t)     vim.inspect(t)             -- 디버깅 출력

-- 알림
vim.notify("done", vim.log.levels.INFO)

-- 이벤트 루프 / 비동기
vim.schedule(function() ... end)   -- 다음 이벤트 루프로 미룸 (fast-event 탈출)
vim.defer_fn(fn, 200)              -- 200ms 후 실행
vim.uv.fs_stat(path)              -- libuv 직행 (옛 vim.loop)
```

`vim.schedule`이 특히 중요하다 — LSP 핸들러 같은 **fast event 컨텍스트에서는 `vim.api` 일부가 막혀** 있어서, 알림이나 버퍼 조작을 `vim.schedule`로 감싸 다음 루프로 미뤄야 안전하다.

## 6. 하위 모듈 — 더 깊은 영역

`vim` 밑에는 큰 하위 시스템들이 또 모듈로 달려 있다. 이름만 알아두면 필요할 때 `:h`로 파고들 수 있다.

| 모듈 | 영역 |
| --- | --- |
| `vim.lsp` | LSP 클라이언트 (`get_clients`, `buf.hover` 등) |
| `vim.diagnostic` | 진단 표시·설정 |
| `vim.treesitter` | 파서·쿼리·하이라이트 |
| `vim.ui` | `select`/`input` (다른 플러그인이 오버라이드 가능) |
| `vim.keymap` | 키매핑 |
| `vim.uv` | libuv 비동기 I/O (구 `vim.loop`) |

## 함정 정리

1. `vim`은 **nvim 프로세스 안에서만** 존재한다. 순수 `lua` 실행엔 없다 → 테스트는 헤드리스 nvim.
2. `vim.api`는 **0-base**, `vim.fn`은 **1-base**. 라인·컬럼 인덱스 섞으면 off-by-one.
3. `vim.fn`의 불리언류는 **`true`가 아니라 `1`**. `if vim.fn.has("x") then` 말고 `== 1` 비교.
4. `vim.o`에 리스트 옵션을 테이블로 넣으면 안 된다 — 테이블 형태는 `vim.opt`만.
5. fast event(LSP 콜백 등)에서 `vim.api` 호출이 막히면 `vim.schedule`로 감싼다.
6. `#` 들어간 Vimscript 함수명은 `vim.fn.foo#bar()`가 아니라 `vim.fn["foo#bar"]()`로 인덱싱.

## 더 깊이

| 글 | 다루는 것 |
| --- | --- |
| [Lua 종합 가이드 (Neovim 컨텍스트)](/posts/neovim/2026-06-15-lua-syntax-guide/) | `vim.*`를 담는 그릇 — LuaJIT 문법·타입·테이블·패턴 |
| [Lua 메타테이블](/posts/neovim/2026-06-15-lua-metatables/) | `vim.opt.number = true`가 실제로는 C 함수 호출인 이유 |
| [Neovim 플러그인 작성 규칙](/posts/neovim/2026-06-12-neovim-plugin-conventions/) | 이 API들을 `plugin/`·`lua/` 어디에 둘지 |
| [Lua vs Vimscript 성능](/posts/neovim/2026-06-12-neovim-lua-vs-vimscript-performance/) | `vim.api`·`vim.fn`·`vim.cmd` 호출 비용 비교 |

정식 레퍼런스는 nvim 안에서 `:h lua-vim`, `:h vim.api`, `:h vim.fn`, `:h lua-stdlib`로 바로 볼 수 있다.
