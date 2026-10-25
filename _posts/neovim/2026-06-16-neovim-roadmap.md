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

## 개념군별 심화 문서

| 구역 | 핵심 질문 | 성격 |
|---|---|---|
| 0. 계층 | Vim·Neovim·LazyVim은 각각 무엇을 제공하나 | 필수 전제 |
| 1. 편집 | Vim의 operator·motion·register 모델을 아는가 | 필수 |
| 2. 설정 언어 | Neovim 설정을 읽고 수정할 만큼 Lua를 아는가 | 필수 최소 |
| 3. Distro 구조 | LazyVim이 Plugin spec을 어떻게 조합하나 | 사용자의 핵심 |
| Branch A | Neovim Plugin은 어떤 Runtime API 위에 만들어지나 | 제작자용 |
| Branch B | LSP·DAP 같은 IDE 기능은 어떤 계층으로 연결되나 | 필요할 때 |
| Appendix | PKM·다른 Editor·Plugin 생태계 | 다른 축 |

## 편집 모델과 확장 계층

같은 기능처럼 보여도 **어느 계층이 실제로 구현하고 누가 기본값을 조립하는지**를 구분해야 한다.

| 계층 | 책임 | 대표 예 |
|---|---|---|
| Vim | 편집 모델·기본 명령 | mode, operator, motion, register, macro |
| Neovim | 확장 가능한 runtime·API | Lua API, LSP client, diagnostic, async/RPC |
| Plugin | 구체 기능 구현 | completion, picker, formatter 연동, UI |
| Distro (LazyVim 등) | 플러그인 조합·기본값·키맵 | lazy.nvim spec, extras, user overrides |

```text
Vim에서 이어진 편집 모델 (mode / motion / operator)
                    │
             Neovim Core / API
                    │
          ┌─────────┴──────────┐
          │                    │
      내장 기능          Plugin 확장 기능
          │                    │
          └─────────┬──────────┘
                    │
        LazyVim: Plugin 조합·기본 설정 (선택)
                    │
           사용자 설정·재정의
```

이 그림은 기능의 출처와 설정 책임을 구분한 것이다. Vim은 Neovim 내부에서 실행되는 별도 계층이 아니며, Neovim의 모든 기능이 Plugin을 거치는 것도 아니다. LazyVim은 선택적인 배포판이다.

예를 들어 LazyVim에서 LSP 기능을 호출하는 키를 눌렀다고 해서 LSP 기능 자체가 LazyVim 구현인 것은 아니다. **Neovim 내장 기능인지, Plugin이 제공하는 기능인지, LazyVim과 사용자 설정이 어떻게 연결하는지**를 구분해 추적한다.

| 더 알아볼 질문 | 문서 |
|---|---|
| Vanilla / kickstart.nvim / LazyVim 중 어디서 시작할까 | [시작점 비교](./2026-06-16-neovim-starting-point-comparison.md) |
| 편집기 내부의 mode·buffer·window 구조는? | [Vim & Neovim 작동 원리](./2025-10-04-vim-core-engine.md) |
| LazyVim은 어떤 플러그인을 어떻게 조립하나 | [LazyVim 기능 지도](./2026-06-07-lazyvim-feature-plugin-map.md) |
| spec과 override가 합쳐지는 규칙은? | [LazyVim spec merge](./2026-06-07-lazyvim-spec-merge-and-dependency-layers.md) |

## 편집 기본기 — Distro 아래의 Vim 문법

현재 블로그에는 편집 기본기 전체를 설명하는 전용 Concept가 아직 부족하다. 없는 내용을 Plugin 문서로 메우지 않는다.

| 글/자료 | 역할 |
|---|---|
| [Vim/Neovim 레지스터](./2025-09-24-vim-register.md) | yank/delete/change가 값을 어디에 보관하는지 Zoom-in |
| [vim cheatsheet](https://github.com/clang-engineer/devkit/blob/main/reference/cheatsheets/vim.md) | motion·operator·mode 빠른 Reference |

`operator + motion/text object`, dot-repeat, macro 등은 `vimtutor`·*Practical Vim* 같은 외부 학습 자료로 보완한다. Roadmap은 이 빈칸을 숨기지 않는다.

## Lua — 설정을 읽을 만큼 먼저, 깊이는 제작할 때

Lua 전체를 다 익힌 뒤 Neovim으로 갈 필요는 없다.

```text
설정 사용자
→ table / function / require / module 정도

Plugin 제작자
→ metatable / error boundary / Lua-Vimscript interop까지
```

| 글 | 역할 |
|---|---|
| [Lua 종합 가이드](./2026-06-15-lua-syntax-guide.md) | Neovim에서 자주 쓰는 Lua 문법의 Hub |
| [Lua 모듈](./2026-06-15-lua-modules.md) | `require`·`package.path`·`lua/` 구조를 이해하는 핵심 Zoom-in |

심화가 필요하면 Hub에서 [메타테이블](./2026-06-15-lua-metatables.md), [에러 처리](./2026-06-15-lua-error-handling.md), [Lua vs Vimscript 성능](./2026-06-12-neovim-lua-vs-vimscript-performance.md)으로 내려간다. 기존 Vimscript Plugin을 읽어야 할 때만 [Vimscript 종합 가이드](./2026-06-15-vimscript-syntax-guide.md)를 별도 Reference로 사용한다.

## LazyVim — 기능 목록보다 조립 구조를 이해한다

LazyVim을 직접 수정하려면 “어떤 Plugin이 있나”보다 **lazy.nvim spec이 어느 계층에서 합쳐지는지**가 중요하다.

```text
lazy.nvim (Plugin Manager)
├─ LazyVim 기본 Plugin spec
├─ 선택한 extras
└─ 사용자 Plugin spec / override
         ↓
   최종 설정 해석·Plugin 로딩
```

| 글 | 역할 |
|---|---|
| [LazyVim 기능 지도](./2026-06-07-lazyvim-feature-plugin-map.md) | Git·Search·LSP·DAP 등 기능이 어떤 Plugin 조합으로 만들어지는지 보는 Architecture Hub |
| [lazy.nvim Plugin spec 필드](./2026-06-19-lazy-nvim-plugin-spec-fields.md) | load trigger·configuration·dependency 필드를 실행 의미로 정리하는 Reference/Concept |
| [LazyVim spec merge와 의존성 계층](./2026-06-07-lazyvim-spec-merge-and-dependency-layers.md) | core→extras→user override가 합쳐지는 실제 구조를 설명하는 Architecture |

개별 Plugin 목록이나 Keymap은 필요할 때 [주요 Plugin 정리](./2026-06-07-lazyvim-feature-plugin-map.md), [Which-Key](./2025-10-04-whichkey.md), [Git Plugin 구성](./2026-06-09-lazyvim-git-plugins.md)으로 Zoom-in한다.

## Plugin 개발

사용자 경로의 다음 단계가 아니라 **역할이 제작자로 바뀌는 Branch**다.

### Runtime API

| 글 | 역할 |
|---|---|
| [vim 전역 API 지도](./2026-06-19-neovim-vim-global-api-map.md) | `vim.api`·`vim.fn`·option·utility의 전체 위치를 잡는 Hub |
| [Buffer·Window·Extmark](./2026-06-19-neovim-buffer-window-extmark.md) | 화면/문서 상태를 직접 조작하는 Runtime Zoom-in |
| [Autocommand·Event](./2026-06-19-neovim-autocommand-events.md) | Plugin이 Event에 반응하는 구조 |
| [비동기 — vim.uv / vim.system](./2026-06-19-neovim-async-vim-uv-system.md) | 외부 작업과 Main Loop 경계 |

더 아래 계층이 필요할 때만 [nvim_* API·MessagePack-RPC·LuaJIT](./2026-07-03-neovim-api-rpc-luajit.md)로 내려간다.

### 구조·발행

```text
언어·경계 결정
→ runtimepath 구조
→ 구현
→ test
→ vimdoc
→ distribution
```

| 글 | 역할 |
|---|---|
| [Plugin 언어 선택](./2026-06-12-neovim-plugin-language-choice.md) | Lua/Vimscript를 생태계·유지보수 축으로 선택 |
| [Plugin 디렉터리 관례](./2026-06-12-neovim-plugin-conventions.md) | `plugin/`·`lua/`·`autoload/`·`doc/`의 자동 로드 경계 |
| [Plugin 테스트](./2026-06-18-neovim-plugin-testing-plenary-minitest-busted.md) | plenary·mini.test·busted의 역할 비교 |
| [Plugin 배포](./2026-06-12-neovim-plugin-distribution.md) | GitHub 공개부터 Plugin Manager·awesome-neovim까지의 배포 흐름 |

Lua/Vimscript 혼용이 실제로 필요할 때만 [두 언어 섞기](./2026-06-12-neovim-plugin-mixing-lua-vimscript.md), 문서 자동화가 필요할 때 [vimdoc·panvimdoc](./2026-06-19-neovim-plugin-vimdoc-panvimdoc.md)로 추가 Zoom-in한다.

## IDE 기능 계층

LazyVim이 기본값을 제공하더라도 장애를 진단하거나 직접 구성하려면 계층을 알아야 한다.

| 글 | 역할 |
|---|---|
| [Neovim 0.11+ LSP 3계층](./2026-07-08-neovim-lsp-three-layers-mason-lspconfig-vimlsp.md) | Mason / nvim-lspconfig / `vim.lsp`의 책임을 분리하는 Architecture |
| [DAP — Debug Adapter Protocol](./2026-07-12-nvim-dap-debug-adapter-protocol.md) | Editor·nvim-dap·Debug Adapter·Debugger의 연결 구조를 설명하는 Concept/Architecture |

LSP와 DAP를 “LazyVim 다음 단계”로 두지 않는다. 실제 개발환경에서 해당 기능을 직접 다룰 때 들어간다.

## 다른 축의 대표 진입점

Roadmap이 50여 개 글의 전체 목차가 되지 않도록 대표 Hub만 둔다.

| 문제축 | 대표 진입점 |
|---|---|
| PKM / Obsidian / Org mode | [Neovim PKM 지형](./2026-07-12-neovim-pkm-obsidian-orgmode.md) |
| 다른 Editor와의 경계 | [Neovim 사용자가 본 Emacs]({% post_url developer-tools/2026-07-03-neovim-user-view-of-emacs %}) |


## 다른 Roadmap과의 경계

- Terminal rendering·PTY·TUI 바닥 → [Terminal](../terminal/2026-09-05-terminal-roadmap.md)
- tmux Session·Pane → [tmux](../tmux/2026-06-16-tmux-roadmap.md)
- Lua가 아닌 일반 Programming Concept → 정보관리기술사 Knowledge
- dotfiles로 Neovim config를 Machine에 배포 → [dotfiles](../shell/2026-07-08-dotfiles-roadmap.md)

## 필요할 때 더 살펴보기

```text
Vim/Neovim/LazyVim 관계가 헷갈린다
→ 계층 지도

LazyVim 설정을 직접 고치고 싶다
→ 최소 Lua
→ LazyVim feature/spec/merge

Plugin을 직접 만든다
→ Runtime API Branch
→ 구조·테스트·배포

LSP/DAP가 문제다
→ IDE 기능 Branch
```


