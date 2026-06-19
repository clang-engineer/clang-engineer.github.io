---
title       : "Neovim 플러그인 테스트 방법 — plenary / mini.test / busted+nlua"
description : "헤드리스 nvim 안에서 도는 세 가지 테스트 방식의 대중성과 선택 기준 비교"
date        : 2026-06-18 10:00:00 +0900
updated     : 2026-06-18 10:00:00 +0900
categories  : [neovim]
tags        : [neovim, plugin, testing, lua, plenary, busted]
pin         : false
hidden      : false
---

Neovim 플러그인은 `vim.fn` / `vim.api` / `vim.uv`가 **nvim 프로세스 안에서만** 존재하므로, 일반 Lua 테스트가 아니라 **헤드리스 nvim을 띄워 그 안에서** 돌린다.

## 표준: plenary.nvim busted 러너

대부분의 소형~중형 플러그인이 쓰는 사실상 표준. `describe`/`it`/`assert` (busted 스타일) + `:PlenaryBustedDirectory` 명령.

```bash
nvim --headless --noplugin -u tests/minimal_init.lua \
  -c "PlenaryBustedDirectory tests/ {minimal_init = 'tests/minimal_init.lua', sequential = true}" \
  +q
```

- `--noplugin` : 기본 플러그인 로드 안 함 (격리)
- `-u <file>` : 이 파일만 설정으로 사용

### minimal_init.lua = 테스트 전용 부트스트랩

평소 사용자 설정에 오염되지 않은 깨끗한 환경을 만드는 게 목적.

```lua
vim.opt.rtp:prepend(".")  -- 현재 플러그인 루트를 runtimepath 맨 앞에 → require 로드
vim.opt.rtp:append(vim.fn.expand("~/.local/share/nvim/site/pack/vendor/start/plenary.nvim"))
vim.cmd("runtime plugin/plenary.vim")  -- :PlenaryBustedDirectory 명령 등록
```

함정: plenary가 **저 고정 경로**에 있어야 한다. LazyVim 등은 plenary를 다른 곳에 설치하므로 로컬 테스트가 "plenary 못 찾음"으로 실패할 수 있다 → CI처럼 minimal_init에서 직접 clone하는 부트스트랩으로 바꾸면 해결.

## 대안 비교

| 방법 | 대중성 | 특징 / 언제 |
|---|---|---|
| **plenary busted** | 최주류 | 순수 로직·소형 플러그인 기본값. 러너 기능은 단순(태그·병렬 빈약) |
| **mini.test** | 주류, 성장 중 | child nvim 띄워 **스크린샷 기반 UI 검증**이 강점. UI 없는 로직엔 오버킬 |
| **busted + nlua** | 비주류, 증가 | `nlua`를 인터프리터로 써서 표준 busted 풀 기능. 태그/필터 필요할 만큼 커지면. luarocks 셋업 번거로움 |

**선택 기준**: 순수 함수/로직만이면 plenary로 충분. UI 동작(렌더링·하이라이트)까지 봐야 하면 mini.test. 테스트가 많아져 태그/필터/포맷이 필요하면 busted+nlua.

## CI (GitHub Actions)

`rhysd/action-setup-vim@v1`로 nvim 설치 → plenary를 고정 경로에 clone → 위 헤드리스 명령 실행. busted+nlua는 `nvim-neorocks/nvim-busted-action` 사용 가능.

## 플러그인 작성 시리즈

| 글 | 다루는 것 |
| --- | --- |
| [언어 선택](/posts/neovim/2026-06-12-neovim-plugin-language-choice/) | Lua가 표준이지만 부모 생태계가 Vimscript면 Vimscript가 자연스럽다 |
| [Lua와 Vimscript 섞기](/posts/neovim/2026-06-12-neovim-plugin-mixing-lua-vimscript/) | 호출 경계 최소화, 흔한 안티패턴, 모범 분담 |
| [Lua vs Vimscript 성능](/posts/neovim/2026-06-12-neovim-lua-vs-vimscript-performance/) | LuaJIT vs 트리 워킹 인터프리터, 진짜 차이 나는 영역과 측정법 |
| [runtimepath 디렉토리 관례](/posts/neovim/2026-06-12-neovim-plugin-conventions/) | `plugin/` vs `lua/`, 헬프·헬스체크·after/ 자동 로드 규칙 |
| **플러그인 테스트 방법 (현재 글)** | plenary · mini.test · busted+nlua 비교와 선택 기준 |
| [4가지 채널로 노출시키기](/posts/neovim/2026-06-12-neovim-plugin-distribution/) | awesome-neovim · Dotfyle · VimAwesome · GitHub Topics |

실전 케이스로 [vim-dadbod 어댑터 플러그인 만들기](/posts/neovim/2026-06-12-vim-dadbod-adapter-plugin-build/)에서 위 원칙을 한 번에 적용해본다.
