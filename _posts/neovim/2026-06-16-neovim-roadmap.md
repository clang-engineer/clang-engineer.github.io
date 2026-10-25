---
title       : "Neovim 로드맵 — 편집 모델·상태·확장 구조"
description : "Neovim의 편집 모델, Buffer·Window·Tabpage 상태, Runtime API, 플러그인 시스템과 외부 도구 연동의 실제 관계를 보여주는 거시 개념지도."
date        : 2026-06-16 23:00:00 +0900
updated     : 2026-10-25 20:00:00 +0900
categories  : [neovim, "개요·인덱스"]
tags        : [roadmap, vim, lua, lazyvim]
pin         : false
hidden      : false
redirect_from:
  - /posts/neovim/2026-06-08-vim-neovim-lazyvim-feature-layers/
  - /posts/lazyvim/2026-06-08-vim-neovim-lazyvim-feature-layers/
---

Neovim은 Vim의 모달 편집 모델을 계승하면서 편집기 상태를 API로 노출하고 플러그인·외부 프로세스와 연동하는 확장 가능한 편집기다. 이 로드맵은 **기존 글의 학습 순서가 아니라 Neovim 자체의 구성요소와 관계**를 보여준다. Lua·LazyVim·Plugin 제작은 전체 구조에서 필요한 부분만 더 깊이 살펴보는 선택적 주제다.

## 전체 개념지도

```text
Neovim
├─ 편집 모델
│  ├─ Mode / Operator / Motion / Text Object
│  └─ Register / Mark / Macro / Undo
├─ 편집기 상태
│  ├─ Buffer ── 문서 내용과 편집 상태
│  ├─ Window ── Buffer를 표시하는 View
│  ├─ Tabpage ── Window 레이아웃의 집합
│  └─ Option / Keymap / Command
├─ Runtime·확장
│  ├─ Lua / Vimscript / vim.api / vim.fn
│  ├─ Event / Autocommand / Async / Job / RPC
│  └─ Plugin / runtimepath / Package
├─ 언어·개발 도구 통합
│  ├─ Treesitter ── 구문 구조·하이라이트 등에 활용
│  ├─ LSP Client ↔ Language Server
│  └─ DAP Client ↔ Debug Adapter ↔ Debugger
└─ UI·설정
   ├─ Built-in TUI / External UI
   ├─ User Config / Plugin Manager
   └─ LazyVim 등 선택적 설정 배포판

핵심 관계
편집 동작 ──> Buffer의 내용·상태 변경
Window ──displays──> Buffer (여러 Window가 같은 Buffer 표시 가능)
Tabpage ──contains──> Window (Window는 해당 Tabpage에 속함)
Plugin ──uses──> Runtime API ──reads/modifies──> 편집기 상태
```

이 지도에서 **편집 모델**은 사용자가 어떤 동작을 요청하는지, **편집기 상태**는 무엇을 표시·변경하는지, **Runtime API**는 기능을 어떻게 확장하는지를 구분한다. 각 개념은 기존 게시글의 유무와 관계없이 필요한 위치에 놓는다.

## 핵심 개념과 관계

### 편집 모델과 편집기 상태

Mode는 키 입력이 어떤 편집 동작으로 해석되는지에 영향을 준다. Operator는 Motion 또는 Text Object와 결합해 범위를 대상으로 동작할 수 있다. Register는 yank·delete 등의 결과를 보관하고, Undo는 변경 이력을 관리한다.

```text
Tabpage
├─ Window A ──displays──> Buffer X
└─ Window B ──displays──> Buffer X

다른 Tabpage의 Window도 Buffer X를 표시할 수 있음
```

Buffer는 문서 내용의 중심이고 Window는 이를 표시하는 뷰다. Tabpage는 Window들의 배치를 구성한다. 관련 설명은 [Vim·Neovim 작동 원리](./2025-10-04-vim-core-engine.md)와 [Register](./2025-09-24-vim-register.md)를 참고한다. 기본 키 조작은 [Devkit Vim Cheatsheet](https://github.com/clang-engineer/devkit/blob/main/reference/cheatsheets/vim.md)에서 확인할 수 있다.

### Runtime API와 플러그인

Neovim은 Lua·Vimscript와 API를 통해 Buffer·Window·Option 등 편집기 상태를 조회·변경할 수 있다. Autocommand는 특정 Event에 반응하도록 기능을 연결하고, Job·RPC는 외부 프로그램과 상호작용하는 통로를 제공한다.

```text
Plugin / User Config
        │
        ├─ Runtime API ──> Buffer / Window / Option
        ├─ Event ──> Autocommand
        └─ Job / RPC ──> External Process
```

세부 구조는 [Neovim API 지도](./2026-06-19-neovim-vim-global-api-map.md), [Buffer·Window·Extmark](./2026-06-19-neovim-buffer-window-extmark.md), [Autocommand·Event](./2026-06-19-neovim-autocommand-events.md), [비동기·Job](./2026-06-19-neovim-async-vim-uv-system.md)에서 필요에 따라 살펴본다.

### 외부 개발 도구와 UI

Neovim의 LSP Client는 Language Server와 프로토콜로 통신하고, DAP 연동은 Debug Adapter를 통해 디버거 기능을 제공한다. Treesitter는 구문 트리를 활용하는 별도의 기능군이다. 이들은 플러그인 제작의 후속 단계가 아니라 **편집기 기능을 구성하는 서로 다른 통합 경로**다.

LSP는 [Mason·nvim-lspconfig·vim.lsp의 역할](./2026-07-08-neovim-lsp-three-layers-mason-lspconfig-vimlsp.md), DAP는 [Debug Adapter Protocol](./2026-07-12-nvim-dap-debug-adapter-protocol.md)에서 더 자세히 다룬다. 터미널 UI의 입출력 구조는 [Terminal 로드맵](../terminal/2026-09-05-terminal-roadmap.md)과 연결된다.

## 선택적 심화 문서

아래 문서는 **전체 개념지도의 필수 단계가 아니라** 설정·확장·도구 선택 등 특정 목적이 있을 때 살펴보는 자료다.

| 주제 | 더 깊이 살펴볼 내용 | 문서 |
|---|---|---|
| 설정 언어 | Lua 문법·모듈·require | [Lua 가이드](./2026-06-15-lua-syntax-guide.md) · [Lua 모듈](./2026-06-15-lua-modules.md) |
| 설정 시작점 | Vanilla·kickstart.nvim·LazyVim 비교 | [시작점 비교](./2026-06-16-neovim-starting-point-comparison.md) |
| Plugin Manager | spec·load·dependency·configuration | [lazy.nvim spec](./2026-06-19-lazy-nvim-plugin-spec-fields.md) |
| 설정 배포판 | LazyVim의 기능 구성과 설정 병합 | [기능 지도](./2026-06-07-lazyvim-feature-plugin-map.md) · [spec merge](./2026-06-07-lazyvim-spec-merge-and-dependency-layers.md) |
| Plugin 제작 | 디렉터리 관례·언어 선택·테스트·배포 | [구조](./2026-06-12-neovim-plugin-conventions.md) · [언어 선택](./2026-06-12-neovim-plugin-language-choice.md) · [테스트](./2026-06-18-neovim-plugin-testing-plenary-minitest-busted.md) · [배포](./2026-06-12-neovim-plugin-distribution.md) |
| Plugin 세부 | Lua/Vimscript 혼용·vimdoc·RPC | [혼용](./2026-06-12-neovim-plugin-mixing-lua-vimscript.md) · [vimdoc](./2026-06-19-neovim-plugin-vimdoc-panvimdoc.md) · [RPC](./2026-07-03-neovim-api-rpc-luajit.md) |
| 개인 지식 관리 | Obsidian·Org mode 등 | [PKM 지형](./2026-07-12-neovim-pkm-obsidian-orgmode.md) |
| 다른 편집기 | Emacs와의 비교 | [Emacs의 Elisp 런타임]({% post_url developer-tools/2026-07-03-neovim-user-view-of-emacs %}) |

## 다른 로드맵과의 경계

Neovim의 편집 모델·상태·API는 이 문서에서 다룬다. [Terminal](../terminal/2026-09-05-terminal-roadmap.md)은 PTY·터미널 렌더링, [tmux](../tmux/2026-06-16-tmux-roadmap.md)는 세션·pane 관리, [dotfiles](../shell/2026-07-08-dotfiles-roadmap.md)는 설정 파일의 머신 간 재현을 다룬다. 일반적인 프로그래밍 언어·운영체제 개념은 해당 개념지도에서 확인한다.
