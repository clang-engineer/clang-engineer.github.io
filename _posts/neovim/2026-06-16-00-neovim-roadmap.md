---
title       : "Neovim 로드맵 — 편집 모델·상태·확장 구조"
description : "Neovim의 편집 모델, Buffer·Window·Tabpage 상태, Runtime API, 플러그인 시스템과 외부 도구 연동의 실제 관계를 보여주는 거시 개념지도."
date        : 2026-06-16 23:00:00 +0900
permalink   : /posts/neovim/2026-06-16-neovim-roadmap/
updated     : 2026-10-31 17:30:00 +0900
categories  : [neovim, "개요·인덱스"]
tags        : [roadmap, vim, lua, lazyvim]
pin         : false
hidden      : false
redirect_from:
  - /posts/neovim/2026-06-08-vim-neovim-lazyvim-feature-layers/
  - /posts/lazyvim/2026-06-08-vim-neovim-lazyvim-feature-layers/
---

Neovim은 Vim의 편집 모델을 계승하면서 **공개 API·런타임·외부 도구 연동**을 강화한 편집기다. 이 지도는 명령어나 글 목록이 아니라 **구성요소의 역할과 관계**를 보여준다.

## 전체 개념지도

```text
Neovim
├─ 편집 모델 (Vim 계승)
│  ├─ Mode / Operator / Motion / Text Object
│  └─ Register / Mark / Quickfix / Undo
├─ 편집기 상태·표시
│  ├─ Buffer ── Window ── Tabpage
│  └─ Extmark ── Virtual Text / Highlight
├─ 확장 기반
│  ├─ Lua / Vimscript ── Runtime API ── Core
│  ├─ Event ── Autocommand
│  └─ Job (프로세스 실행) / RPC (프로세스 간 호출)
├─ 언어 기능
│  ├─ Tree-sitter ── 구문 트리
│  └─ LSP Client ── Language Server
│       └─ Diagnostics / Definition / References
└─ UI·배포
   ├─ Floating Window / External UI
   └─ Plugin Manager / LazyVim
```

**핵심 관계:** 편집 동작은 Buffer를 바꾸고, Window는 Buffer를 표시하며, Tabpage는 Window 배치를 담는다. 플러그인은 API로 편집기 상태를 읽고 바꾼다. Extmark는 편집 중 위치와 화면 장식을 관리한다.

## 무엇을 계승하고 무엇을 확장했나?

| 구분 | 대표 개념 | 의미 |
|---|---|---|
| Vim 계승 | Mode·Motion·Mark·Quickfix·Location List | 편집과 위치 탐색의 기본 모델 |
| Neovim 구현 | 공개 API·MessagePack-RPC·Extmark·Floating Window | 편집기 상태 접근과 확장 UI |
| Neovim 구현 | LSP Client·`vim.diagnostic` | 언어 서버 통신과 진단 관리 |
| 외부 기술 통합 | LuaJIT·libuv·Tree-sitter | 내부 실행·비동기·구문 분석 기반 |

**기술의 출처와 실행 위치는 다르다.** Tree-sitter는 외부 프로젝트지만 파서는 보통 Neovim 프로세스 안에서 실행된다. LSP Client도 내부에 있지만 Language Server는 보통 외부 프로세스다. Neovim이 Lua·RPC·LSP 자체를 발명한 것은 아니며, Vim에도 Job·Channel·Popup·Text Properties 같은 유사 기능이 있다.

## 확장과 외부 프로세스의 관계

```text
┌────────────── Neovim 프로세스 ──────────────┐
│ Lua Plugin ──> 공개 API ──> Core / Buffer  │
│ Tree-sitter Parser       LSP Client ───────┼── JSON-RPC ──> Language Server
│ Job ───────────────────────────────────────┼── 실행 ─────> 외부 프로그램
└────────────────────────────────────────────┘
외부 프로그램 ── MessagePack-RPC ──> Neovim 공개 API
```

**API는 호출 가능한 기능, RPC는 프로세스 경계를 넘는 호출 방식, Job은 프로세스 실행·관리**를 뜻한다. Lua는 내부 플러그인을 작성하는 언어다. Vim은 Vim9script·Job·Channel을 발전시켰고, Neovim은 Lua·공개 API·RPC 중심 확장 구조를 강화했다. 이는 서로 다른 설계 선택이지 어느 한쪽에 기능이 전혀 없다는 뜻은 아니다.

## 더 깊이 보기

| 관심 영역 | 상세 문서 |
|---|---|
| 편집 모델·기본 조작 | [Vim 치트시트](https://github.com/clang-engineer/devkit/blob/main/reference/cheatsheets/vim.md) · [Vim 작동 원리](./2025-10-04-vim-core-engine.md) |
| Lua·API·Event·Job·RPC | [Runtime·API](./2026-06-19-neovim-runtime-api-events-processes.md) |
| Buffer·Window·Extmark | [편집기 상태와 화면 장식](./2026-06-19-neovim-buffer-window-extmark.md) |
| LSP·Diagnostics·결과 탐색 | [LSP 구성](./2026-07-08-neovim-lsp-three-layers-mason-lspconfig-vimlsp.md) · [코드 진단과 탐색](./2026-05-04-neovim-code-diagnostics-and-navigation.md) |
| 플러그인 조합·설정 | [LazyVim 기능 지도](./2026-06-07-lazyvim-feature-plugin-map.md) · [Neovim 치트시트](https://github.com/clang-engineer/devkit/blob/main/reference/cheatsheets/neovim.md) |

**경계:** Terminal은 PTY·렌더링, tmux는 세션·pane, dotfiles는 설정 재현을 다룬다. 이 문서는 Neovim의 내부 구성과 확장 경계만 다룬다.
