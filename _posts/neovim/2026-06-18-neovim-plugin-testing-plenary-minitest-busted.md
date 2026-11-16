---
title       : "Neovim 플러그인 테스트 방법 — plenary / mini.test / busted+nlua"
description : "헤드리스 nvim 안에서 도는 세 가지 테스트 방식의 대중성과 선택 기준 비교"
date        : 2026-06-18 10:00:00 +0900
updated     : 2026-11-16 00:00:00 +0900
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
| [언어 선택](./2026-06-12-neovim-plugin-language-choice.md) | Lua가 표준이지만 부모 생태계가 Vimscript면 Vimscript가 자연스럽다 |
| [Lua와 Vimscript 섞기](./2026-06-12-neovim-plugin-mixing-lua-vimscript.md) | 호출 경계 최소화, 흔한 안티패턴, 모범 분담 |
| [Lua vs Vimscript 성능](./2026-06-12-neovim-lua-vs-vimscript-performance.md) | LuaJIT vs 트리 워킹 인터프리터, 진짜 차이 나는 영역과 측정법 |
| [runtimepath 디렉토리 관례](./2026-06-12-neovim-plugin-conventions.md) | `plugin/` vs `lua/`, 헬프·헬스체크·after/ 자동 로드 규칙 |
| **플러그인 테스트 방법 (현재 글)** | plenary · mini.test · busted+nlua 비교와 선택 기준 |
| [4가지 채널로 노출시키기](./2026-06-12-neovim-plugin-distribution.md) | awesome-neovim · Dotfyle · VimAwesome · GitHub Topics |

실전 케이스로 [vim-dadbod 어댑터 플러그인 만들기](./2026-06-12-vim-dadbod-adapter-plugin-build.md)에서 위 원칙을 한 번에 적용해본다.

## 테스트 러너 밖의 로컬 검증 — 원격 푸시 전에 무엇을 보는가

순수 함수만 검증해서는 “실제 설정에서 플러그인 명령이 등록되고 결과 파일까지 만들어지는가”를 확인할 수 없다. 일상 개발에는 [lazy.nvim의 개발 경로 설정](https://lazy.folke.io/configuration#dev)을 활용해 플러그인 저장소를 로컬로 가리키고, 해당 plugin spec에만 `dev = true`를 켜서 수정 → 로드 → 실사용 확인을 반복한다. 원격 release를 시험하는 단계에서는 이 임시 토글을 제거해야 설치본과 개발본을 혼동하지 않는다.

독립된 headless Neovim을 임시 작업 디렉터리에서 띄우는 스모크 검사는 별도 층이다. 여기서는 `runtimepath`에 대상 플러그인을 추가해 `setup()`·사용자 명령·파일 부수효과를 끝까지 보고, 테스트 러너는 파서·정렬 같은 재현 가능한 순수 로직에 쓴다. 렌더링과 하이라이트가 핵심이면 위에서 비교한 mini.test가 적합하다. 즉 **개발 경로는 실제 환경에서의 빠른 반복**, **plenary는 알고리즘 회귀**, **headless smoke는 명령과 부수효과**라는 서로 다른 실패를 잡는다.
