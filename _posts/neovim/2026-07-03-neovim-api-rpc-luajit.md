---
title       : "vim.api 아래층 — nvim_* API·MessagePack-RPC·LuaJIT"
description : "vim.api는 본체가 아니라 통로다. 진짜 API인 언어중립 nvim_* 집합, 그 아래 MessagePack-RPC 계층 스택과 C 코어, 그리고 Neovim이 Lua를 돌리는 LuaJIT의 정체까지 파고든다."
date        : 2026-07-03 09:20:00 +0900
categories  : [neovim, "원리·언어"]
tags        : [api, rpc, msgpack, luajit, architecture]
pin         : false
hidden      : false
---

> `vim.*`의 3분류(상태/동작/유틸)와 `vim.api`(네이티브) vs `vim.fn`(Vim 브리지) 구분, 0-base/1-base와 `1` vs `true` 함정은 [vim 전역 API 지도](/posts/neovim/2026-06-19-neovim-vim-global-api-map/)에서 다뤘다. 이 글은 그 아래 계층 — `nvim_*`의 실체, RPC, LuaJIT — 을 판다.
{: .prompt-info }

## 결론 먼저

- `vim.api`는 본체가 아니라 **통로**다. 진짜 API는 언어중립적인 **`nvim_*` 함수 집합**이고, Lua·Vimscript·외부 RPC 클라이언트가 각자 다른 경로로 같은 API에 닿는다.
- `nvim_*`의 본체는 Neovim 소스의 C 코드(`src/nvim/api/*.c`)에 있고, 빌드 과정에서 시그니처를 스캔해 디스패치 테이블과 메타데이터를 자동 생성한다. `nvim --api-info`로 확인.
- 이 API가 **MessagePack-RPC로 노출**되기 때문에 GUI 분리(Neovide, nvim-qt), 에디터 임베딩(vscode-neovim), `nvim --remote`가 가능하다.
- Neovim이 Lua를 돌리는 런타임은 **LuaJIT**(Lua 5.1 기준 + `ffi`/`bit`/`jit`)이다. "Lua 5.3 문서대로 했는데 안 된다"의 대부분이 여기서 온다.

## vim.api는 본체가 아니라 통로

Neovim API가 전부 `vim.xxx` 형태인 건 아니다. Lua **런타임 안에서** 접근할 때 거의 모든 게 `vim` 테이블로 노출될 뿐이고, API의 본체는 따로 있다.

진짜 핵심 API는 **`nvim_*` 함수 집합**이다. 이건 언어 중립적인 MessagePack-RPC 인터페이스로 정의돼 있어서 접근 경로가 여럿이다.

- Lua: `vim.api.nvim_create_autocmd(...)`
- Vimscript: `nvim_create_autocmd(...)` (그냥 함수로)
- 외부 클라이언트(pynvim, Rust 등): RPC로 같은 `nvim_*` 호출

즉 `vim.api.nvim_xxx`의 `vim.api`는 Lua에서 그 API에 닿는 **껍데기**이고, 정체는 `nvim_*`이다. 반대로 `vim.fn.*`, `vim.tbl_*`, `vim.loop`는 `vim.*`이긴 해도 nvim API가 아니다 — 각각 Vim 호환 함수, Lua 헬퍼, libuv 바인딩이다.

## nvim_*의 정체 — C 코어를 RPC로 노출

`nvim_*` 함수의 본체는 Neovim 소스의 C 코드에 있다 (`src/nvim/api/*.c` — `vim.c`, `buffer.c`, `window.c` 등). 단순 C 모듈로 두는 게 아니라 **RPC로 노출되는 공개 API**로 등록하는 게 핵심이다.

- 빌드 과정에서 C 함수 시그니처를 스캔해 디스패치 테이블과 메타데이터를 자동 생성한다. `nvim --api-info`로 확인.
- `vim.api.nvim_xxx`는 같은 프로세스 안에서 이 C 함수를 직접 부르는 빠른 경로(RPC 안 거침).
- Vim에는 이 `nvim_*` 레이어와 RPC API 자체가 없다. "에디터를 라이브러리/서버처럼 다루게" 하려던 Neovim 초기 리팩터링의 핵심 목표였다.

## RPC 계층 스택

"RPC로 노출된다"는 건 `nvim_*`를 Neovim 안에서만 쓰는 게 아니라 **외부 프로세스가 파이프/소켓으로 호출**할 수 있게 공개했다는 뜻이다. 이 덕에 GUI 분리(Neovide, nvim-qt), 에디터 임베딩(vscode-neovim), `nvim --remote` 연동이 가능하다. 층으로 보면:

```
nvim_buf_set_lines(...)   ← 호출하려는 API (무엇을)
   ↓
MessagePack-RPC           ← 프로토콜 (요청/응답/알림 메시지 규격)
   ↓
MessagePack               ← 직렬화 포맷 (JSON 비슷한 바이너리)
   ↓
소켓 / 파이프(stdio)       ← 전송 수단
```

syscall 비유는 "안정적 공개 API 뒤에 구현을 숨긴다"는 점만 닮았다. 특권 경계 전환(trap)이 아니라 같은 유저 권한 두 프로세스의 양방향 메시지 교환이라, 오히려 D-Bus나 클라이언트-서버 API 호출에 가깝다.

## LuaJIT과의 관계

Neovim이 Lua를 실행하는 런타임은 **LuaJIT**이다. `vim` 전역 테이블은 Neovim이 이 LuaJIT 런타임에 주입한 모듈이다 — LuaJIT이 "엔진", `vim.*`가 그 위의 "API".

- LuaJIT은 **Lua 5.1 기준** + 확장(`ffi`, `bit`, `jit`). Lua 5.2/5.3 기능(`goto`, `//`, `<<`/`>>` 등)은 부분 백포트만 된다.
- `vim.loop`(=`vim.uv`)는 LuaJIT의 FFI 위에 libuv를 바인딩한 것.
- "Lua 5.3 문서대로 했는데 안 된다"면 LuaJIT(5.1) 기준이라 그런 경우가 많다. 확인: `:lua print(jit and jit.version or _VERSION)`.

## 더 깊이

| 글 | 다루는 것 |
| --- | --- |
| [vim 전역 API 지도](/posts/neovim/2026-06-19-neovim-vim-global-api-map/) | `vim.*` 3분류 · `vim.api` vs `vim.fn` · 옵션 범위 · 함정 |

정식 레퍼런스는 nvim 안에서 `:h vim.api`, `:h lua-vim`, `:h lua-stdlib`, `:h api`, `:h rpc`로 바로 볼 수 있다.
