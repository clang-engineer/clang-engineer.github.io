---
title       : "Neovim 로드맵 — Vim 바닥에서 LazyVim과 Plugin 개발까지"
description : "Vim/Neovim/배포판 계층을 먼저 잡고, 편집 기본기 → 필요한 만큼의 Lua → LazyVim 구조 이해까지를 사용자 학습의 핵심 경로로 둔다. Plugin 개발은 별도 Branch, LSP·DAP·PKM·비교는 필요할 때 들어가는 별도 Branch와 부록으로 분리한다."
date        : 2026-06-16 23:00:00 +0900
updated     : 2026-10-25 19:00:00 +0900
categories  : [neovim, "개요·인덱스"]
tags        : [roadmap, vim, lua, lazyvim]
pin         : false
hidden      : false
redirect_from:
  - /posts/neovim/2026-06-08-vim-neovim-lazyvim-feature-layers/
  - /posts/lazyvim/2026-06-08-vim-neovim-lazyvim-feature-layers/
---

Neovim의 편집 모델, 상태, Runtime API, 개발 도구 통합, 설정·배포를 먼저 구분한다. 사용자 학습과 Plugin 제작은 같은 개념 구조를 서로 다른 깊이로 탐색하는 활동이다.

```text
Neovim — 편집기·확장 시스템
├─ 편집 모델
│  ├─ Mode / Operator / Motion / Text Object
│  └─ Register / Mark / Macro / Undo
├─ 편집기 상태
│  ├─ Buffer / Window / Tabpage
│  └─ Option / Keymap / Command
├─ Runtime·확장 API
│  ├─ Lua / Vimscript / Autocommand / Event
│  ├─ RPC / Async / Job / Terminal
│  └─ Plugin / Runtimepath / Package
├─ 개발 도구 통합
│  ├─ LSP / Diagnostic / Completion
│  └─ DAP / Formatter / Treesitter
└─ 설정·배포
   ├─ Neovim Core + 사용자 Config
   └─ Plugin Manager / LazyVim 등 선택적 구성

관계: 편집기 상태 ↔ Runtime API ↔ Plugin
      LazyVim은 선택적인 설정 조합이지 필수 실행 계층이 아님
```

Plugin을 만들지 않는다면 **LazyVim 구조 이해에서 핵심 경로가 끝난다.** LSP·DAP 같은 IDE 기능도 모두 순서대로 배울 필요는 없고, 문제가 생기거나 직접 구성할 때 해당 Branch로 들어간다.

## 개념을 따라 읽기

### 1. 편집 모델에서 편집기 상태로

```text
Mode ── Operator + Motion / Text Object
  │                 │
  │             편집 동작
  │                 ▼
  └────────── Buffer (문서 내용)
                    │
               Window (표시)
                    │
               Tabpage (배치)
```

Vim의 편집 문법을 먼저 이해하면 Neovim의 상태와 API가 무엇을 조작하는지도 분명해진다. `yank/delete/change`의 저장 위치는 [Register](./2025-09-24-vim-register.md), 모드·상태의 내부 관계는 [Vim & Neovim 작동 원리](./2025-10-04-vim-core-engine.md)를 참고한다. 실제 키 조합은 [Devkit Vim](https://github.com/clang-engineer/devkit/blob/main/reference/cheatsheets/vim.md)에서 확인한다.

### 2. 설정 언어에서 Plugin 구성으로

```text
Lua: table / function / require
               │
               ▼
       사용자 Config
               │
      lazy.nvim Plugin spec
          ┌────┼─────┐
          ▼    ▼     ▼
       기본값 extras override
          └────┼─────┘
               ▼
       Plugin 로딩·설정
```

Lua를 전부 배우는 게 아니라 설정 파일을 읽는 데 필요한 [문법](./2026-06-15-lua-syntax-guide.md)과 [모듈·require](./2026-06-15-lua-modules.md)부터 이해한다. 그다음 [Plugin spec의 필드](./2026-06-19-lazy-nvim-plugin-spec-fields.md)가 로딩과 설정을 어떻게 제어하는지, [LazyVim spec merge](./2026-06-07-lazyvim-spec-merge-and-dependency-layers.md)가 설정을 어떻게 조합하는지 살펴본다.

어떤 기능을 어떤 Plugin이 제공하는지 확인할 때만 [LazyVim 기능 지도](./2026-06-07-lazyvim-feature-plugin-map.md)로 이동한다. 여기까지가 일반 사용자에게 필요한 핵심 경로다. 시작 구성을 고르는 문제는 [Vanilla·kickstart·LazyVim 비교](./2026-06-16-neovim-starting-point-comparison.md)를 참고한다.

### 3. Plugin 제작 — 편집기 상태를 API로 조작하기

```text
Buffer / Window / Extmark
           ▲
       vim.api / vim.fn
           ▲
    Plugin (Lua / Vimscript)
       │          │
       ├─ Event → Autocommand
       └─ 외부 작업 → Async / Job / RPC
                       │
                 Test / Vimdoc
                       │
                  Distribution
```

Plugin은 Runtime API로 편집기 상태를 조작하고 Event에 반응한다. [API 지도](./2026-06-19-neovim-vim-global-api-map.md)를 출발점으로, 필요에 따라 [Buffer·Window·Extmark](./2026-06-19-neovim-buffer-window-extmark.md), [Autocommand](./2026-06-19-neovim-autocommand-events.md), [비동기 실행](./2026-06-19-neovim-async-vim-uv-system.md)을 살펴본다.

구현물을 만들 때는 [Plugin 디렉터리와 runtimepath](./2026-06-12-neovim-plugin-conventions.md) → [테스트](./2026-06-18-neovim-plugin-testing-plenary-minitest-busted.md) → [배포](./2026-06-12-neovim-plugin-distribution.md)로 이어진다. [언어 선택](./2026-06-12-neovim-plugin-language-choice.md), [Lua/Vimscript 혼용](./2026-06-12-neovim-plugin-mixing-lua-vimscript.md), [vimdoc](./2026-06-19-neovim-plugin-vimdoc-panvimdoc.md), [RPC 내부 구조](./2026-07-03-neovim-api-rpc-luajit.md)는 필요할 때만 확장한다.

### 4. IDE 기능 — 독립적으로 연결되는 프로토콜

```text
Neovim
 ├─ LSP Client ── Language Server
 │                 (분석·진단·완성 지원)
 └─ nvim-dap ──── Debug Adapter ── Debugger
                   (디버깅 제어)
```

LSP·DAP는 Plugin 개발의 후속 단계가 아니라 편집기에 외부 개발 도구를 연결하는 별도 축이다. [LSP 3계층](./2026-07-08-neovim-lsp-three-layers-mason-lspconfig-vimlsp.md)은 Mason·nvim-lspconfig·`vim.lsp`의 책임을, [DAP 구조](./2026-07-12-nvim-dap-debug-adapter-protocol.md)는 Editor·Adapter·Debugger의 경계를 설명한다.

## 다른 문제를 만났을 때

PKM·Obsidian·Org mode는 [Neovim PKM 지형](./2026-07-12-neovim-pkm-obsidian-orgmode.md), 다른 편집기와의 비교는 [Emacs의 Elisp 런타임]({% post_url developer-tools/2026-07-03-neovim-user-view-of-emacs %})을 참고한다. Terminal의 PTY·렌더링은 [Terminal Roadmap](../terminal/2026-09-05-terminal-roadmap.md), 세션 관리는 [tmux Roadmap](../tmux/2026-06-16-tmux-roadmap.md), 설정 재현은 [dotfiles Roadmap](../shell/2026-07-08-dotfiles-roadmap.md)의 영역이다.
