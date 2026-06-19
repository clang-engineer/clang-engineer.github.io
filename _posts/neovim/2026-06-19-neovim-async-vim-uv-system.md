---
title       : "Neovim 플러그인 비동기 — vim.system · jobstart · vim.uv"
description : "외부 프로세스를 UI 멈춤 없이 돌리는 법. 0.10+ vim.system, 레거시 jobstart, 저수준 vim.uv(libuv), 그리고 콜백을 vim.schedule로 메인 루프에 되돌리는 이유."
date        : 2026-06-19 21:00:00 +0900
categories  : [neovim, "플러그인·생태계"]
tags        : [lua, api, plugin]
pin         : false
hidden      : false
---

linter를 돌리고, `git`을 부르고, 파일을 읽어 결과를 버퍼에 채우는 플러그인 — 전부 외부 작업을 **UI를 멈추지 않고** 처리해야 한다. Neovim은 단일 스레드 이벤트 루프라, 블로킹 호출 하나가 에디터 전체를 얼린다. [vim 전역 API 지도](/posts/neovim/2026-06-19-neovim-vim-global-api-map/)에서 이름만 짚은 `vim.schedule`·`vim.uv`가 여기서 본론이 된다.

## 결론 먼저

- 외부 프로세스 호출의 현대 표준은 **`vim.system`**(Neovim 0.10+). 콜백/`:wait()` 둘 다 된다.
- 0.10 미만 호환이나 스트리밍이 필요하면 **`vim.fn.jobstart`**.
- 빠른 일회성 블로킹이면 `vim.fn.system` — 단 **UI를 멈추므로** 긴 작업엔 금지.
- 타이머·파일시스템·저수준 제어는 **`vim.uv`**(libuv, 구 `vim.loop`).
- **libuv 콜백은 메인 루프 밖에서 돈다.** 거기서 `vim.api`를 부르면 깨진다 → `vim.schedule`로 되돌린다.

## vim.system — 0.10+ 표준

```lua
-- 비동기: 콜백으로 결과 받기
vim.system({ "rg", "--json", "TODO" }, { text = true }, function(obj)
  -- obj.code, obj.signal, obj.stdout, obj.stderr
  vim.schedule(function()
    print(obj.stdout)  -- 콜백은 메인 루프 밖 → schedule로 감싸 UI 접근
  end)
end)

-- 동기: 결과를 바로 기다림 (짧은 호출만)
local obj = vim.system({ "git", "rev-parse", "HEAD" }, { text = true }):wait()
print(obj.stdout)
```

`{ text = true }`를 줘야 stdout/stderr가 문자열로 온다(안 주면 바이트). `opts`에 `cwd`, `env`, `stdin`도 줄 수 있다. 새로 짜고 0.10+를 타깃해도 된다면 이게 1순위다.

## vim.fn.jobstart — 레거시·스트리밍

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

## vim.fn.system — 블로킹 일회성

```lua
local out = vim.fn.system({ "date" })  -- 끝날 때까지 UI 멈춤
```

가장 간단하지만 **프로세스가 끝날 때까지 에디터가 얼어붙는다.** `date` 같은 즉답 명령엔 괜찮고, 네트워크·빌드처럼 오래 걸리는 건 절대 쓰면 안 된다.

## vim.uv — libuv 저수준

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

## 핵심: 콜백을 메인 루프로 되돌리기

`vim.system`/`jobstart`/`vim.uv`의 콜백은 **fast event 컨텍스트**(메인 이벤트 루프 밖)에서 실행된다. 여기서 `vim.api.nvim_buf_set_lines` 같은 호출을 하면 `E5560` 류 에러가 나거나 동작이 깨진다.

```lua
vim.system({ "rg", "foo" }, { text = true }, function(obj)
  vim.schedule(function()
    -- 여기는 메인 루프 → 버퍼·윈도우 조작 안전
    local buf = vim.api.nvim_create_buf(false, true)
    vim.api.nvim_buf_set_lines(buf, 0, -1, false, vim.split(obj.stdout, "\n"))
  end)
end)
```

규칙은 단순하다 — **비동기 콜백 안에서 에디터 상태를 만지면 `vim.schedule`로 감싼다.** 콜백 자체를 `vim.schedule_wrap`으로 한 번 감싸 두는 패턴도 많이 쓴다.

## 어느 걸 쓰나

| 상황 | 선택 |
| --- | --- |
| 외부 프로세스, 0.10+ | `vim.system` |
| 0.10 미만 호환 / 스트리밍 출력 | `vim.fn.jobstart` |
| 즉답 명령, 결과 바로 필요 | `vim.fn.system` (블로킹 감수) |
| 타이머·디바운스 | `vim.defer_fn` / `vim.uv.new_timer` |
| 논블로킹 파일 I/O·저수준 | `vim.uv` |

## 함정 정리

1. **비동기 콜백은 메인 루프 밖**. `vim.api`·버퍼 조작은 `vim.schedule`로 감싼다.
2. `vim.fn.system`·`:wait()`는 **UI를 멈춘다.** 긴 작업에 쓰면 에디터가 얼어붙는다.
3. `vim.system`에 `{ text = true }`를 빠뜨리면 stdout이 바이트로 온다.
4. `jobstart`의 `on_stdout` data는 마지막 원소가 부분 라인. `stdout_buffered`로 피하거나 직접 이어 붙인다.
5. `vim.uv` 타이머는 명시적으로 `:stop()`/`:close()` 안 하면 샌다.

## 더 깊이

| 글 | 다루는 것 |
| --- | --- |
| [vim 전역 API 지도](/posts/neovim/2026-06-19-neovim-vim-global-api-map/) | `vim.schedule`·`vim.uv`가 전체에서 차지하는 위치 |
| [버퍼·윈도우·extmark 조작](/posts/neovim/2026-06-19-neovim-buffer-window-extmark/) | 비동기 결과를 받아 그릴 대상 |
| [autocommand·이벤트 심화](/posts/neovim/2026-06-19-neovim-autocommand-events/) | fast-event 컨텍스트와 디바운스 |
| [Lua 에러 처리](/posts/neovim/2026-06-15-lua-error-handling/) | 콜백 안 에러를 `pcall`·`vim.schedule`로 안전하게 다루기 |

정식 레퍼런스는 `:h vim.system()`, `:h jobstart()`, `:h vim.uv`, `:h vim.schedule()`.
