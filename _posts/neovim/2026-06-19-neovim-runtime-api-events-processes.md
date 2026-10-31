---
title       : "Neovim Runtime·API — Lua·Event·Job·RPC"
description : "Neovim 내부 Lua API, 이벤트·Autocommand, 외부 Job·RPC와 비동기 실행을 하나의 확장 구조로 정리."
date        : 2026-06-19 18:00:00 +0900
updated     : 2026-07-24 12:00:00 +0900
categories  : [neovim, "원리·언어"]
tags        : [lua, api]
pin         : false
hidden      : false
redirect_from:
  - /posts/reference/troubleshooting/2026-07-08-multiline-notify-hit-enter/
  - /posts/neovim/nvim-multiline-notify-hit-enter/
  - /posts/neovim/2026-06-19-neovim-autocommand-events/
  - /posts/neovim/2026-06-19-neovim-async-vim-uv-system/
  - /posts/neovim/2026-06-19-neovim-vim-global-api-map/
---

Neovim 플러그인을 Lua로 짜다 보면 `vim.opt`, `vim.api.nvim_*`, `vim.fn.*`, `vim.keymap.set` 같은 `vim.xxx` 호출이 끝없이 나온다. 이게 다 뭐고 언제 어떤 걸 쓰는지 한 장으로 정리한다. 문법(Lua 자체)이 아니라 **`vim`이라는 전역 객체의 지도**가 이 글의 주제다.

## 전체 확장 구조

```text
                  Neovim Core
                       ▲
                       │ 공개 API
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   Lua / vim.*     Event / Autocmd   Job / RPC
        │              │              │
    내부 플러그인    이벤트에 반응   외부 프로세스
```

**Lua는 내부 실행 언어, API는 공개된 기능, Job은 외부 프로세스 실행, RPC는 프로세스 간 원격 호출**이다. Vim의 Autocommand 개념을 Neovim은 Lua 콜백 API로도 제공한다. Job과 RPC는 대체 관계가 아니며, Neovim 원격 API의 MessagePack-RPC와 LSP의 JSON-RPC는 구별한다.

### 핵심 요약

- `vim`은 Neovim이 Lua 런타임에 주입하는 **단 하나의 전역 테이블**이다. 에디터를 만지는 모든 통로가 여기서 갈라진다.
- 옵션은 **범위(scope)**로 갈린다: 전역 `vim.o`/`vim.opt`, 버퍼 `vim.bo`, 윈도우 `vim.wo`, 전역 변수 `vim.g`.
- 동작 호출의 핵심 갈림길은 **`vim.api`(Neovim 공개 API) vs `vim.fn`(Vimscript 함수 접근)**. 기능의 성격과 기존 API 지원 여부에 따라 선택한다.
- 키매핑·커맨드·오토커맨드는 전용 헬퍼(`vim.keymap.set`, `nvim_create_user_command`, `nvim_create_autocmd`)가 표준.
- 비동기·이벤트 루프가 필요하면 `vim.schedule` / `vim.uv`.

## 왜 Lua와 API를 분리해서 이해해야 할까?

Lua는 **C 기반 프로그램에 내장하기 쉬운 가벼운 범용 언어**다. Neovim은 LuaJIT 기반 런타임에서 플러그인을 실행할 수 있고, 모듈·테이블·클로저로 복잡한 기능을 구성할 수 있다. 하지만 Lua 자체에는 Buffer를 수정하는 기능이 없다. 그 기능은 **Neovim이 공개한 API**가 제공한다. Lua 선택의 이점은 임베딩·성능·범용 프로그래밍 능력의 결합이지 RPC를 사용한다는 사실 자체가 아니다.

```text
       Neovim 프로세스 내부                  외부 프로세스
  Lua Plugin → vim.api ──┐                Python Plugin
                         ▼                      │
                    Neovim API ◀── MessagePack-RPC
                         │
                         ▼
                   Core / Buffer
```

**API는 무엇을 호출할 수 있는지**, **RPC는 프로세스 경계를 넘어 어떻게 호출하는지**를 정한다. 내부 Lua 호출에는 보통 RPC가 필요 없다. 외부 Python은 Neovim이 공개한 API를 MessagePack-RPC로 호출할 수 있다. 웹 백엔드의 공개 서비스 메서드와 전송 계층을 구분하는 것과 비슷하지만, 내부 C 함수를 임의로 호출할 수 있다는 뜻은 아니다.

`vim.api`는 공개 `nvim_*` API의 Lua 진입점이고, `vim.lsp`·`vim.diagnostic` 등은 별도의 Neovim Lua 인터페이스다.

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

`nvim_` 접두사가 붙은 Neovim 공개 API 함수들. 버퍼·윈도우·extmark·커맨드 등 Neovim이 새로 설계한 명시적 인터페이스다.

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
| 둘 다 있을 때 | `vim.api` 우선 고려 (명시적 인터페이스) |

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

## 메시지 출력의 함정 — `vim.notify`와 hit-enter

기본 메시지 UI에서 여러 줄의 `vim.notify`·`echomsg`가 명령줄 높이를 넘으면 `Press ENTER or type command to continue`가 나타날 수 있다. 기본 `cmdheight=1` 환경에서는 특히 쉽게 재현된다.

```lua
-- 여러 줄 메시지가 잦은 환경에서 명령줄 높이 조정
vim.o.cmdheight = 2
```

`cmdheight`를 키우는 것은 화면 공간을 사용하는 우회책이다. 플러그인을 만든다면 간단한 알림은 한 줄로 줄이고, 긴 내용은 `:messages`나 별도 버퍼로 안내하는 방법도 있다. noice.nvim·nvim-notify 같은 별도 메시지 UI를 사용하면 표시 방식이 달라진다. 참고: `:help hit-enter`, `:help 'cmdheight'`.

## 함정 정리

1. `vim`은 **nvim 프로세스 안에서만** 존재한다. 순수 `lua` 실행엔 없다 → 테스트는 헤드리스 nvim.
2. `vim.api`와 `vim.fn`의 인덱스 규칙은 **함수마다 확인**해야 한다. 특히 `nvim_buf_get_lines()`는 0-based이고 `getline()`은 줄 번호가 1-based다.
3. `vim.fn`의 불리언류는 **`true`가 아니라 `1`**. `if vim.fn.has("x") then` 말고 `== 1` 비교.
4. `vim.o`에 리스트 옵션을 테이블로 넣으면 안 된다 — 테이블 형태는 `vim.opt`만.
5. fast event(LSP 콜백 등)에서 `vim.api` 호출이 막히면 `vim.schedule`로 감싼다.
6. `#` 들어간 Vimscript 함수명은 `vim.fn.foo#bar()`가 아니라 `vim.fn["foo#bar"]()`로 인덱싱.

## 이벤트와 Autocommand

플러그인은 대부분 **이벤트 구동(event-driven)**이다. "파일 저장 직전에 포맷", "커서가 멈추면 힌트 표시", "LSP가 붙으면 키맵 등록" — 전부 특정 이벤트에 콜백을 거는 일이다. [vim 전역 API 지도](#vim--단일-진입점)에서 스니펫으로만 보여준 autocommand를, 이 글에서 제대로 판다.

### 핵심 요약

- 이벤트에 Lua 콜백을 다는 표준은 **`vim.api.nvim_create_autocmd`**.
- 같은 autocommand가 설정 리로드 때마다 쌓이는 걸 막으려면 **augroup + `clear = true`**. 이게 가장 중요한 관용구.
- 콜백은 **args 테이블**(`buf`, `file`, `match`, `data`)을 받는다. `true`를 반환하면 그 autocommand는 스스로 삭제된다.
- 내 플러그인도 **`nvim_exec_autocmds("User", ...)`로 공개 이벤트를 쏠 수 있다** — 다른 설정이 거기에 훅을 걸게 하는 확장점.

### 기본형

```lua
vim.api.nvim_create_autocmd("BufWritePre", {
  pattern = "*.lua",
  desc = "저장 직전 포맷",
  callback = function(args)
    -- args.buf, args.file, args.match ...
  end,
})
```

`callback`에 Lua 함수를 직접 넘기는 게 Lua 플러그인의 기본이다. (옛 `command = "..."` 방식은 Vimscript 문자열을 넘기는 레거시.)

### augroup — 중복 등록을 막는 핵심

이게 autocommand에서 제일 자주 빠뜨리는 부분이다. 설정을 `:source`하거나 플러그인을 리로드하면 autocommand가 **또 등록된다.** 두 번 등록되면 콜백이 두 번 돈다.

```lua
local group = vim.api.nvim_create_augroup("MyPlugin", { clear = true })

vim.api.nvim_create_autocmd("BufWritePre", {
  group = group,           -- 이 그룹에 소속
  pattern = "*.lua",
  callback = function() ... end,
})
```

`clear = true`로 augroup을 만들면 **같은 이름의 기존 그룹과 그 안의 autocommand가 전부 비워진다.** 그래서 리로드해도 항상 "딱 한 번만" 등록된 상태가 된다. 플러그인의 autocommand는 거의 무조건 named augroup에 넣는다.

### callback이 받는 args

```lua
callback = function(args)
  -- args.id     : 이 autocommand id
  -- args.event  : "BufWritePre" 같은 이벤트명
  -- args.buf    : 버퍼 번호
  -- args.file   : 파일 경로 (<afile>)
  -- args.match  : 매치된 패턴 값
  -- args.data   : User 이벤트 등에서 넘긴 임의 데이터
end
```

특히 **`return true`를 하면 그 autocommand가 자기 자신을 삭제**한다. "한 번만 실행하고 사라지는" 핸들러를 `once = true` 없이도 조건부로 만들 수 있다.

### pattern vs buffer

매칭 대상을 정하는 두 방식이 있다.

| | `pattern` | `buffer` |
| --- | --- | --- |
| 의미 | 파일명/값 글로브 매칭 | 특정 버퍼에만 |
| 예 | `pattern = "*.py"` | `buffer = 0` (현재 버퍼) |
| 용도 | 파일타입·확장자 단위 | 방금 만든 scratch 버퍼 등 한정 |

주의: **`FileType` 이벤트의 `pattern`은 글로브가 아니라 파일타입 이름**이다. `pattern = "python"`이지 `"*.py"`가 아니다. 이벤트마다 pattern이 무엇과 매칭되는지가 다르니 `:h autocmd-events`로 확인하는 습관이 필요하다.

### 자주 쓰는 이벤트

| 이벤트 | 발생 시점 | 흔한 용도 |
| --- | --- | --- |
| `BufReadPost` | 파일 읽은 직후 | 버퍼별 초기화 |
| `BufWritePre` / `BufWritePost` | 저장 직전 / 직후 | 포맷, 후처리 |
| `FileType` | 파일타입 결정 시 | 파일타입별 키맵·옵션 |
| `BufEnter` / `WinEnter` | 버퍼·창 진입 | 컨텍스트 갱신 |
| `CursorHold` | 커서가 `updatetime`동안 멈춤 | 힌트·diagnostic 띄우기 |
| `CursorMoved` | 커서 이동 | 하이라이트 갱신 (잦으니 가볍게) |
| `InsertEnter` / `InsertLeave` | 삽입 모드 전환 | 모드별 UI |
| `TextChanged` | 텍스트 변경 | 실시간 반영 |
| `LspAttach` | LSP 클라이언트 attach | 버퍼별 LSP 키맵 등록 |
| `VimEnter` | 시작 완료 | 지연 초기화 |
| `User` | 수동 발생 (커스텀) | 플러그인 간 신호 |

`CursorMoved`·`TextChanged`처럼 자주 터지는 이벤트는 콜백을 가볍게 두거나 디바운스한다.

### 내 플러그인의 공개 이벤트 — User

플러그인이 "이런 일이 일어났다"를 외부에 알리는 확장점은 `User` 이벤트다. 다른 사용자가 내 내부 함수를 몰라도 훅을 걸 수 있다.

```lua
-- 플러그인 쪽: 작업 끝났다고 신호
vim.api.nvim_exec_autocmds("User", {
  pattern = "MyPluginDone",
  data = { count = 3 },
})

-- 사용자 쪽: 그 신호에 반응
vim.api.nvim_create_autocmd("User", {
  pattern = "MyPluginDone",
  callback = function(args) print(args.data.count) end,
})
```

`lazy.nvim`의 `VeryLazy`, LSP의 `LspAttach`도 이 메커니즘 위에 있다. 공개 API를 함수뿐 아니라 이벤트로도 노출하면 결합도가 낮아진다.

### 조회·삭제

```lua
vim.api.nvim_get_autocmds({ group = "MyPlugin" })  -- 디버깅용 확인
vim.api.nvim_del_augroup_by_name("MyPlugin")       -- 그룹째 제거
vim.api.nvim_clear_autocmds({ buffer = 0 })        -- 조건으로 비우기
```

## 함정 정리

1. **augroup 없이 등록하면 리로드마다 쌓인다.** 콜백이 N번 도는 버그의 대부분이 이것.
2. `FileType`의 `pattern`은 글로브가 아니라 **파일타입 이름**. 이벤트마다 매칭 대상이 다르다.
3. `CursorMoved`·`TextChanged`는 매우 자주 터진다. 무거운 작업은 디바운스하거나 `CursorHold`로.
4. 일부 이벤트는 fast-event 컨텍스트라 `vim.api` 호출이 막힌다 → `vim.schedule`로 감싼다.
5. `callback`이 `true`를 반환하면 그 autocommand가 삭제된다. 의도치 않게 `true` 반환 주의.

## 외부 프로세스와 비동기 — Job·RPC·vim.uv

linter를 돌리고, `git`을 부르고, 파일을 읽어 결과를 버퍼에 채우는 플러그인 — 전부 외부 작업을 **UI를 멈추지 않고** 처리해야 한다. Neovim은 단일 스레드 이벤트 루프라, 블로킹 호출 하나가 에디터 전체를 얼린다. [vim 전역 API 지도](#vim--단일-진입점)에서 이름만 짚은 `vim.schedule`·`vim.uv`가 여기서 본론이 된다.

### 핵심 요약

- 외부 프로세스 호출의 현대 표준은 **`vim.system`**(Neovim 0.10+). 콜백/`:wait()` 둘 다 된다.
- 0.10 미만 호환이나 스트리밍이 필요하면 **`vim.fn.jobstart`**.
- 빠른 일회성 블로킹이면 `vim.fn.system` — 단 **UI를 멈추므로** 긴 작업엔 금지.
- 타이머·파일시스템·저수준 제어는 **`vim.uv`**(libuv, 구 `vim.loop`).
- **`vim.uv` 콜백과 `vim.system` 완료 콜백은 fast event에서 돈다.** 대부분의 `vim.api` 호출은 금지되므로 에디터 상태를 만질 때 `vim.schedule`로 되돌린다. `jobstart` 콜백까지 같은 규칙이라고 일반화하면 안 된다.

### 프로세스 실행(Job)과 통신(RPC)은 별개다

```text
Neovim ── Job / spawn ──> 외부 프로세스 실행
Neovim ◀──── RPC ──────▶ 외부 프로세스와 호출·응답
```

**Job은 프로세스를 실행·관리하는 기능**, **RPC는 프로세스 간 구조화된 메시지로 함수를 호출하는 통신 방식**이다. Job으로 시작한 프로세스와 RPC로 통신할 수도 있고, 이미 실행 중인 프로세스에 연결할 수도 있다. RPC는 '외부에서 Neovim으로'만 향하는 단방향 개념이 아니다.

프로토콜도 구분해야 한다. Neovim의 공개 원격 API는 **MessagePack-RPC**, Neovim LSP Client와 Language Server의 통신은 **JSON-RPC 기반 LSP**를 사용한다. 따라서 모든 외부 프로세스 통신이 Neovim RPC API를 통과하는 것은 아니다.

### vim.system — 0.10+ 표준

```lua
-- 비동기: 콜백으로 결과 받기
vim.system({ "rg", "--json", "TODO" }, { text = true }, function(obj)
  -- obj.code, obj.signal, obj.stdout, obj.stderr
  vim.schedule(function()
    print(obj.stdout)
  end)
end)

-- 동기: 결과를 바로 기다림 (짧은 호출만)
local obj = vim.system({ "git", "rev-parse", "HEAD" }, { text = true }):wait()
print(obj.stdout)
```

stdout/stderr는 기본 캡처에서도 Lua 문자열로 온다. `{ text = true }`는 반환 타입을 바꾸는 옵션이 아니라 Windows 줄바꿈 `\r\n`을 `\n`으로 정규화하는 옵션이다. `opts`에 `cwd`, `env`, `stdin`도 줄 수 있다. 새로 짜고 0.10+를 타깃해도 된다면 이게 1순위다.

### vim.fn.jobstart — 레거시·스트리밍

0.10 미만을 지원하거나, 출력이 **흘러나오는 대로** 처리해야 할 때(긴 빌드 로그 등).

```lua
vim.fn.jobstart({ "npm", "run", "build" }, {
  stdout_buffered = false,
  on_stdout = function(_, data, _)
    -- data는 라인 배열. 마지막 원소는 부분 라인일 수 있음
  end,
  on_exit = function(_, code, _) ... end,
})
```

함정: `on_stdout`의 `data`는 라인 배열인데 **마지막 원소가 잘린 부분 라인**이고, 끝에 빈 문자열 `""`이 sentinel로 온다. `stdout_buffered = true`를 주면 종료 시 전체를 한 번에 받아 이 처리를 피할 수 있다.

### vim.fn.system — 블로킹 일회성

```lua
local out = vim.fn.system({ "date" })  -- 끝날 때까지 UI 멈춤
```

가장 간단하지만 **프로세스가 끝날 때까지 에디터가 얼어붙는다.** `date` 같은 즉답 명령엔 괜찮고, 네트워크·빌드처럼 오래 걸리는 건 절대 쓰면 안 된다.

### vim.uv — libuv 저수준

타이머, 파일시스템, 직접 spawn 등 프로세스 호출 밑단. (`vim.loop`이 옛 이름, `vim.uv`로 통일되는 중.)

```lua
-- 타이머: 디바운스에 자주 씀
local timer = vim.uv.new_timer()
timer:start(200, 0, vim.schedule_wrap(function()
  -- 200ms 후 1회. schedule_wrap으로 메인 루프에서 실행
end))

-- 논블로킹 파일 stat
vim.uv.fs_stat(path, function(err, stat) ... end)
```

`vim.defer_fn(fn, ms)`는 이 타이머를 감싼 편의 함수다. 단순 지연이면 그걸 쓰고, 반복·취소가 필요하면 `vim.uv.new_timer()`를 직접 다룬다.

### 핵심: 콜백을 메인 루프로 되돌리기

`vim.uv`의 저수준 콜백과 `vim.system`의 완료 콜백은 **fast event 컨텍스트**에서 실행된다. 여기서 fast-safe가 아닌 `vim.api.nvim_buf_set_lines` 같은 호출을 하면 `E5560`이 난다. 반면 `jobstart`의 job 콜백은 같은 실행 컨텍스트라고 일반화하지 않는다. 확실하지 않은 콜백 경계에서는 `vim.in_fast_event()`로 확인할 수 있다.

```lua
vim.uv.fs_stat("README.md", function(err, stat)
  vim.schedule(function()
    assert(not err, err)
    local buf = vim.api.nvim_create_buf(false, true)
    vim.api.nvim_buf_set_lines(buf, 0, -1, false, { vim.inspect(stat) })
  end)
end)
```

규칙은 **`vim.uv`와 `vim.system`의 fast-event 콜백에서 에디터 상태를 만질 때 `vim.schedule`로 감싼다**이다. 모든 비동기 콜백을 같은 실행 컨텍스트로 취급하지 않는다. 콜백 자체를 `vim.schedule_wrap`으로 감싸는 패턴도 쓸 수 있다.

### 어느 걸 쓰나

| 상황 | 선택 |
| --- | --- |
| 외부 프로세스, 0.10+ | `vim.system` |
| 0.10 미만 호환 / 스트리밍 출력 | `vim.fn.jobstart` |
| 즉답 명령, 결과 바로 필요 | `vim.fn.system` (블로킹 감수) |
| 타이머·디바운스 | `vim.defer_fn` / `vim.uv.new_timer` |
| 논블로킹 파일 I/O·저수준 | `vim.uv` |

## 함정 정리

1. **`vim.uv`와 `vim.system` 완료 콜백은 fast event**. fast-safe가 아닌 `vim.api`·버퍼 조작은 `vim.schedule`로 감싼다.
2. `vim.fn.system`·`:wait()`는 **UI를 멈춘다.** 긴 작업에 쓰면 에디터가 얼어붙는다.
3. `vim.system`의 `{ text = true }`는 문자열 변환이 아니라 CRLF 줄바꿈 정규화다.
4. `jobstart`의 `on_stdout` data는 마지막 원소가 부분 라인. `stdout_buffered`로 피하거나 직접 이어 붙인다.
5. `vim.uv` 타이머는 명시적으로 `:stop()`/`:close()` 안 하면 샌다.

## 더 깊이

| 글 | 다루는 것 |
| --- | --- |
| [Lua 종합 가이드 (Neovim 컨텍스트)](./2026-06-15-lua-syntax-guide.md) | `vim.*`를 담는 그릇 — LuaJIT 문법·타입·테이블·패턴 |
| [Lua 메타테이블](./2026-06-15-lua-metatables.md) | `vim.opt.number = true`가 실제로는 C 함수 호출인 이유 |
| [Neovim 플러그인 작성 규칙](./2026-06-12-neovim-plugin-conventions.md) | 이 API들을 `plugin/`·`lua/` 어디에 둘지 |
| [Lua vs Vimscript 성능](./2026-06-12-neovim-lua-vs-vimscript-performance.md) | `vim.api`·`vim.fn`·`vim.cmd` 호출 비용 비교 |

정식 레퍼런스는 nvim 안에서 `:h lua-vim`, `:h vim.api`, `:h vim.fn`, `:h lua-stdlib`로 바로 볼 수 있다.
