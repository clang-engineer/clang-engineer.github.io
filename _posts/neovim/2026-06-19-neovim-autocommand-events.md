---
title       : "Neovim autocommand·이벤트 심화 — 플러그인은 이벤트로 움직인다"
description : "augroup로 중복 등록 막기, callback이 받는 args, pattern vs buffer, 자주 쓰는 이벤트, nvim_exec_autocmds로 내 플러그인의 공개 이벤트 만들기까지."
date        : 2026-06-19 20:00:00 +0900
updated     : 2026-07-24 12:00:00 +0900
categories  : [neovim, "플러그인·생태계"]
tags        : [lua, api, plugin]
pin         : false
hidden      : false
---

플러그인은 대부분 **이벤트 구동(event-driven)**이다. "파일 저장 직전에 포맷", "커서가 멈추면 힌트 표시", "LSP가 붙으면 키맵 등록" — 전부 특정 이벤트에 콜백을 거는 일이다. [vim 전역 API 지도](/posts/neovim/2026-06-19-neovim-vim-global-api-map/)에서 스니펫으로만 보여준 autocommand를, 이 글에서 제대로 판다.

## 결론 먼저

- 이벤트에 Lua 콜백을 다는 표준은 **`vim.api.nvim_create_autocmd`**.
- 같은 autocommand가 설정 리로드 때마다 쌓이는 걸 막으려면 **augroup + `clear = true`**. 이게 가장 중요한 관용구.
- 콜백은 **args 테이블**(`buf`, `file`, `match`, `data`)을 받는다. `true`를 반환하면 그 autocommand는 스스로 삭제된다.
- 내 플러그인도 **`nvim_exec_autocmds("User", ...)`로 공개 이벤트를 쏠 수 있다** — 다른 설정이 거기에 훅을 걸게 하는 확장점.

## 기본형

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

## augroup — 중복 등록을 막는 핵심

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

## callback이 받는 args

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

## pattern vs buffer

매칭 대상을 정하는 두 방식이 있다.

| | `pattern` | `buffer` |
| --- | --- | --- |
| 의미 | 파일명/값 글로브 매칭 | 특정 버퍼에만 |
| 예 | `pattern = "*.py"` | `buffer = 0` (현재 버퍼) |
| 용도 | 파일타입·확장자 단위 | 방금 만든 scratch 버퍼 등 한정 |

주의: **`FileType` 이벤트의 `pattern`은 글로브가 아니라 파일타입 이름**이다. `pattern = "python"`이지 `"*.py"`가 아니다. 이벤트마다 pattern이 무엇과 매칭되는지가 다르니 `:h autocmd-events`로 확인하는 습관이 필요하다.

## 자주 쓰는 이벤트

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

## 내 플러그인의 공개 이벤트 — User

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

## 조회·삭제

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

## 더 깊이

| 글 | 다루는 것 |
| --- | --- |
| [vim 전역 API 지도](/posts/neovim/2026-06-19-neovim-vim-global-api-map/) | autocommand가 `vim.api` 전체에서 차지하는 위치 |
| [버퍼·윈도우·extmark 조작](/posts/neovim/2026-06-19-neovim-buffer-window-extmark/) | 이벤트에 반응해 무엇을 그릴지 |
| [비동기 — vim.uv / vim.system](/posts/neovim/2026-06-19-neovim-async-vim-uv-system/) | fast-event·스케줄링과의 연결 |
| [Neovim 플러그인 작성 규칙](/posts/neovim/2026-06-12-neovim-plugin-conventions/) | `plugin/`에서의 등록 가드 패턴 |

정식 레퍼런스는 `:h autocmd-events`, `:h nvim_create_autocmd`, `:h User`.
