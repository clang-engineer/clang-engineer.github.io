---
title       : "Vim vs Neovim vs 배포판 — 각 계층이 제공하는 기능 정리"
description : "Vim 내장, Neovim 추가, 배포판 계층별로 어떤 기능을 제공하는지 구분 정리"
date        : 2026-06-08 10:00:00 +0900
updated     : 2026-07-24 12:00:00 +0900
categories  : [neovim, "개요·인덱스"]
tags        : [vim, lsp, treesitter, lazyvim]
redirect_from:
  - /posts/lazyvim/2026-06-08-vim-neovim-lazyvim-feature-layers/
pin         : false
hidden      : false
---

Vim의 기본 기능, Neovim이 추가한 기능, 배포판(LazyVim·NvChad·AstroNvim 등)이 올린 계층을 구분해서 정리한다.
"이 기능이 어디서 온 건지" 헷갈릴 때 참고용. 3계층은 배포판 중 LazyVim을 예시로 든다.

> 어디서 출발할지 고민이라면 [Neovim을 어디서 시작할까 — Vanilla / kickstart.nvim / LazyVim 비교](/posts/neovim/2026-06-16-neovim-starting-point-comparison/) 글 참고.

## Vim — 기본 제공

1991년 Bram Moolenaar가 vi의 개선판("Vi IMproved")으로 발표.
이후 30년 넘게 Bram이 사실상 단일 메인테이너로 유지했고, 2023년 8월 그의 사망 이후 커뮤니티가 이어받고 있다.
에디터의 근간 — 모션, 오퍼레이터, 레지스터 등 시간이 지나도 변하지 않는 것들.

| 기능 | 설명 | 명령/키 |
|------|------|---------|
| Quickfix | 에러/검색 결과 목록, 순차 이동 | `:copen`, `:cn`, `:cp`, `:cdo` |
| Location list | 윈도우별 quickfix | `:lopen`, `:ln`, `:lp` |
| Marks | 파일 내/전역 점프 포인트 | `ma` (설정), `` `a `` (이동), `:marks` |
| Registers | 이름 붙은 클립보드, 매크로 저장소 | `"ay` (복사), `"ap` (붙여넣기), `:reg` |
| Macros | 키 입력 녹화/재생 | `qa` (녹화), `q` (정지), `@a` (재생) |
| Text objects | 의미 단위로 조작 | `ciw`, `ca{`, `dip`, `vat` |
| Tags | LSP 없이 심볼 정의 이동 (ctags) | `Ctrl-]`, `:tag` |
| `gf` / `gd` | 커서 아래 파일 열기 / 로컬 선언 이동 | `gf`, `gd` |
| `:g` | 패턴 매치 라인에 Ex 명령 실행 | `:g/pattern/d`, `:g/TODO/t$` |
| Folding | 코드 접기 | `za` (토글), `zR` (전체 열기), `zM` (전체 접기) |
| Spell check | 내장 맞춤법 검사 | `:set spell`, `]s`, `z=` |
| Sessions | 에디터 상태 저장/복원 | `:mksession`, `:source Session.vim` |
| `=` | 자동 인덴트 | `==` (한 줄), `gg=G` (전체) |
| `%` | 매칭 괄호/블록 이동 | `%` |

## Neovim — Vim 위에 추가된 것

2014년 Thiago de Arruda가 Vim에서 fork. 직접적 계기는 그의 대규모 리팩토링 패치를 Bram이 거부한 것이지만, 근본 동기는 1인 메인테이너 의존, 비동기 처리 부재, 모놀리식 C 코드베이스의 확장성 한계였다.
이후 Lua 임베딩, 비동기 작업, RPC API를 도입했고, 0.5에서 LSP 클라이언트와 Treesitter를 코어에 내장하면서 "플러그인 없이도 IDE 기반이 깔린 에디터"가 됐다.

### 내장 LSP 클라이언트 (`vim.lsp`)

플러그인이 아니라 **Neovim 코어**에 포함된 LSP 프로토콜 구현체.

| 기능 | 설명 | API |
|------|------|-----|
| Diagnostics | 에러/경고 인라인 표시 | `vim.diagnostic.open_float()` |
| Hover | 타입/문서 팝업 | `vim.lsp.buf.hover()` |
| Definition / References | 정의 이동, 참조 목록 | `vim.lsp.buf.definition()`, `references()` |
| Rename | 프로젝트 범위 심볼 리네임 | `vim.lsp.buf.rename()` |
| Code actions | 수정 제안, import, 리팩토링 | `vim.lsp.buf.code_action()` |
| Formatting | LSP 기반 포맷 | `vim.lsp.buf.format()` |
| CodeLens | 함수 위 액션 힌트 (참조 수, 테스트 실행 등) | `vim.lsp.codelens.run()` |
| Document highlight | 커서 위치 심볼과 같은 심볼 강조 | `vim.lsp.buf.document_highlight()` |
| Inlay hints | 인라인 타입/파라미터 힌트 (0.10+) | `vim.lsp.inlay_hint.enable(true)` |
| Semantic tokens | LSP 기반 의미론적 구문 강조 | 서버 지원 시 자동 활성화 |

> CodeLens, inlay hints, document highlight 등은 모두 **Neovim 내장 기능**이다.
> LazyVim은 키맵(`<leader>cc` 등)만 붙여준 것.

### Treesitter (`vim.treesitter`)

AST 기반 파서 프레임워크. 정규식이 아닌 구문 트리로 코드를 이해한다.

| 기능 | 설명 | API |
|------|------|-----|
| Syntax highlighting | AST 기반 정확한 구문 강조 | `:TSInstall <lang>` |
| Incremental selection | 구문 노드 단위로 선택 확장/축소 | `gnn`, `grn`, `grc` |
| Folding | 구문 노드 기반 접기 (들여쓰기 아닌) | `foldmethod=expr` + `vim.treesitter.foldexpr()` |

### 기타 Neovim 전용

| 기능 | 설명 | API |
|------|------|-----|
| Lua API | Vimscript 대신 Lua로 에디터 스크립팅 | `vim.api`, `vim.fn`, `vim.keymap`, `vim.opt` |
| Floating windows | 화면 어디든 팝업 윈도우 | `vim.api.nvim_open_win()` |
| `vim.ui.select/input` | 오버라이드 가능한 UI 프리미티브 | `vim.ui.select(items, opts, cb)` |
| `vim.notify` | 오버라이드 가능한 알림 시스템 | `vim.notify("msg", vim.log.levels.WARN)` |
| Async I/O | libuv 기반 비동기 작업 | `vim.uv`, `vim.system()` |
| Terminal | 버퍼 안에서 터미널 실행 | `:terminal`, `Ctrl-\ Ctrl-n` (나가기) |
| checkhealth | 내장 상태 진단 | `:checkhealth` |

## 배포판 — Neovim 위에 올린 것

Neovim 0.5에서 LSP·Treesitter가 코어에 들어왔지만, 실제로 IDE처럼 쓰려면 lspconfig·mason·cmp·telescope·gitsigns 같은 플러그인을 직접 조립해야 한다.
이 조립 비용을 미리 해결해 둔 것이 **배포판(distribution)** 이다 — 플러그인 큐레이션 + 키맵 컨벤션 + 언어 팩을 한 묶음으로 제공한다.
대표적으로 **LazyVim**, **NvChad**, **AstroNvim** 이 현역 인기 배포판이다(2026-06 기준, GitHub 스타 14k~28k, 모두 활발히 유지보수 중).
별개로 **kickstart.nvim** 은 "한 파일짜리 출발점"을 복사해서 직접 수정하는 starter 템플릿으로, Neovim 공식 진영(`nvim-lua` org)이 미는 사실상 표준이다 — 배포판은 아니지만 같은 슬롯에서 자주 비교된다.
한때 인기였던 **LunarVim** 은 2025년 6월 이후 업데이트가 멈춰 현역 추천에서 빠진다.
각각의 차이는 [Neovim을 어디서 시작할까 — 배포판/프레임워크 카탈로그](/posts/neovim/2026-06-16-neovim-starting-point-comparison/#배포판프레임워크-카탈로그) 참고.

이 글에서는 **LazyVim** 을 예시로 본다. 2023년 1월 Folke Lemaitre가 본인이 만든 플러그인 매니저 `lazy.nvim` 위에 출시했고, 기존 distro와 달리 "framework" 컨셉 — 사용자가 LazyVim 설정을 자기 dotfiles처럼 그대로 override·확장할 수 있는 구조를 지향한다.

### 플러그인 큐레이션 (LazyVim 예시)

Neovim의 LSP/Treesitter 기반 위에 실용적인 플러그인을 미리 조합해 놓은 것.

| 플러그인 | 역할 |
|----------|------|
| nvim-lspconfig + mason.nvim | 서버별 설정 제공 / 외부 도구 설치 |
| blink.cmp 또는 nvim-cmp extra | 자동완성 엔진 |
| conform.nvim | 포맷팅 |
| nvim-lint | 린팅 |
| snacks.picker·fzf-lua·telescope 중 선택한 extra | 퍼지 파인더 |
| snacks explorer·neo-tree 중 선택한 extra | 파일 탐색기 |
| which-key.nvim | 키맵 디스커버리 |
| gitsigns.nvim + snacks.lazygit | 버퍼 Git 표시 / 외부 lazygit 실행 |
| mini.ai + mini.pairs | 텍스트 객체 / 자동 괄호 |
| snacks.bufdelete | 레이아웃을 보존하는 버퍼 삭제 |

### Extras 시스템

`:LazyExtras`로 언어·도구 spec 묶음을 선택적으로 활성화한다. 언어 extra는 필요에 따라 LSP·포맷터·린터·DAP 중 일부를 조합하며, 모든 extra가 네 종류를 전부 제공하는 것은 아니다.

LazyVim의 현재 picker·completion·explorer도 같은 선택 계층이다. 새 설치는 각각 snacks picker·blink.cmp·snacks explorer를 fallback 기본값으로 고르지만, `vim.g.lazyvim_picker`/`vim.g.lazyvim_cmp`나 활성화한 extra에 따라 fzf-lua·Telescope·nvim-cmp·neo-tree로 바뀔 수 있다. 따라서 이 도구들을 모두 core 기본 플러그인이라고 보면 안 된다.

### 키맵 레이어

Neovim API 위에 `<leader>` 기반 일관된 키맵을 제공.

| 키 | 동작 | 실제 호출 |
|----|------|-----------|
| `<leader>cc` | CodeLens 실행 | `vim.lsp.codelens.run()` |
| `<leader>ca` | Code action | `vim.lsp.buf.code_action()` |
| `<leader>cr` | Rename | `vim.lsp.buf.rename()` |
| `<leader>cf` | Format | conform.nvim |
| `<leader>cd` | 라인 진단 float | `vim.diagnostic.open_float()` |
| `<leader>ff` | 파일 찾기 | 선택된 LazyVim picker |
| `<leader>/` | 전체 검색 | 선택된 LazyVim picker |
| `<leader>gg` | Lazygit | snacks.lazygit |
| `<leader>e` | 파일 탐색기 | 선택된 LazyVim explorer |

> `<leader>cc`로 CodeLens를 실행하지만, CodeLens 자체는 Neovim 내장이다.
> LazyVim은 키맵을 붙여준 것일 뿐.

## 요약

| 계층 | 한 줄 요약 |
|------|-----------|
| **Vim** | 모션, 오퍼레이터, 레지스터, quickfix, ex 명령 — 에디팅의 근간 |
| **Neovim** | 내장 LSP, Treesitter, Lua API, floating window — IDE 기반 |
| **배포판** | 플러그인 큐레이션 + 키맵 컨벤션 + 언어 팩 — 즉시 사용 가능한 IDE (LazyVim·NvChad·AstroNvim 등) |
