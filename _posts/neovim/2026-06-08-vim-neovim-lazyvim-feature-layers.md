---
title       : "Vim vs Neovim vs 배포판 — 기능은 어느 계층에서 오는가"
description : "Vim의 편집 모델, Neovim의 확장 API와 IDE 기반, LazyVim 같은 배포판의 조립·기본값 계층을 구분해 기능의 실제 소유 위치를 한눈에 잡는다."
date        : 2026-06-08 10:00:00 +0900
updated     : 2026-09-06
categories  : [neovim, "개요·인덱스"]
tags        : [vim, lsp, treesitter, lazyvim]
redirect_from:
  - /posts/lazyvim/2026-06-08-vim-neovim-lazyvim-feature-layers/
pin         : false
hidden      : false
---

> [Neovim 로드맵](./2026-06-16-neovim-roadmap.md)의 **0단계 — 계층 지도**다. 어디에서 시작할지 고르는 문제는 [Vanilla / kickstart.nvim / LazyVim 비교](./2026-06-16-neovim-starting-point-comparison.md)에서 따로 본다.

Neovim을 쓰다 보면 "이 기능이 Neovim 자체 기능인가, Plugin인가, LazyVim이 만든 기능인가"가 자주 헷갈린다. 이 글의 목적은 기능 목록을 외우는 것이 아니라 **Vim → Neovim → 배포판이라는 세 계층의 책임을 구분하는 것**이다.

```text
Vim
→ 편집 모델과 오래된 Editor 기본 기능

Neovim
→ Vim 모델 위에 확장 API·비동기·LSP·Treesitter 같은 기반 추가

배포판(LazyVim 등)
→ Neovim과 Plugin을 조합하고 기본값·Keymap·언어 구성을 제공
```

핵심 질문은 하나다.

> **지금 보고 있는 기능의 실제 소유자는 어느 계층인가?**

## 한눈에 보기

| 계층 | 주로 책임지는 것 | 대표 예 |
|---|---|---|
| **Vim** | 편집 방식과 Editor 기본 모델 | mode, operator, motion, text object, register, macro, quickfix |
| **Neovim** | 확장 가능한 Runtime·UI·IDE 기반 | Lua API, `vim.lsp`, `vim.diagnostic`, Treesitter, floating window, async/RPC |
| **Plugin** | 특정 기능의 구현·확장 | completion, formatter 연동, file picker, Git UI 등 |
| **Distro** | Plugin 조립과 기본 사용자 경험 | LazyVim의 Plugin spec, extras, 기본 Keymap·설정 |

Plugin은 Neovim과 배포판 사이의 별도 실행 계층이다. 배포판은 기능을 전부 직접 구현하기보다 **Neovim core와 여러 Plugin을 선택·조합·설정**한다.

## 1. Vim — 편집의 바닥

Vim 계층에서 먼저 잡을 것은 개별 명령 목록이 아니라 **편집 모델**이다.

```text
mode
  ↓
operator + motion / text object
  ↓
register / repeat / macro
  ↓
buffer·window·quickfix 같은 Editor 상태
```

예를 들어 `ciw`, register, macro, quickfix는 LazyVim이 새로 만든 개념이 아니다. Neovim에서도 이 Vim 계층의 편집 모델이 그대로 바닥에 깔린다.

따라서 Distro를 사용하더라도 Vim 기본기를 건너뛰면 Keymap은 외울 수 있어도 **왜 그런 조작 모델이 존재하는지** 이해하기 어렵다.

편집 명령의 빠른 참조는 별도 cheatsheet를 사용하고, Roadmap에서는 이 계층의 존재와 역할만 잡는다.

## 2. Neovim — 편집기 위에 확장 기반을 올린다

Neovim은 Vim 편집 모델을 유지하면서 Plugin과 외부 Tool이 붙기 쉬운 Runtime을 확장했다.

대표적인 기반을 역할로 보면 다음과 같다.

```text
Editor 제어
→ Lua / nvim API

언어 기능 Client
→ vim.lsp / vim.diagnostic

구문 구조
→ Treesitter

UI 확장
→ floating window / extmark / vim.ui

외부 작업·연동
→ async / vim.system / RPC
```

여기서 중요한 경계는 **"Neovim이 기반을 제공한다"와 "사용자에게 완성된 IDE 경험을 제공한다"는 다른 말**이라는 것이다.

예를 들어 Neovim에는 LSP Client가 내장돼 있지만 Language Server 설치·서버별 설정·자동완성·Formatting 경험 전체가 하나의 core 기능으로 완성되어 있는 것은 아니다. 그 사이를 Plugin과 설정이 조합한다.

LSP 계층을 더 깊게 볼 때는 [Neovim 0.11+ LSP 3계층](./2026-07-08-neovim-lsp-three-layers-mason-lspconfig-vimlsp.md)으로 Zoom-in한다.

## 3. Plugin — Core 위에서 구체 기능을 만든다

Plugin은 Neovim API를 사용해 특정 문제를 해결한다.

```text
Neovim core capability
        ↓
Plugin이 기능으로 조합
        ↓
사용자가 직접 설정하거나
Distro가 대신 조립
```

예를 들어 다음은 서로 다른 책임이다.

```text
LSP protocol client
→ Neovim core

Language Server 설정 보조
→ Plugin

외부 Language Server 설치 관리
→ Plugin / Tool

이들을 기본값으로 묶어 제공
→ LazyVim 같은 Distro
```

그래서 화면에 같은 결과가 보여도 "어느 계층이 실제 기능을 제공하는가"를 구분해야 문제를 고칠 위치도 찾을 수 있다.

개별 Plugin 지형은 [LazyVim 기능 지도](./2026-06-07-lazyvim-feature-plugin-map.md)에서 본다.

## 4. 배포판 — 기능을 새로 만드는 것보다 조립한다

LazyVim·NvChad·AstroNvim 같은 배포판은 Neovim 위에 **선택된 Plugin, 설정, Keymap, 언어별 구성을 일관된 기본값으로 조립**한다.

LazyVim을 예로 들면 큰 구조는 다음처럼 보면 된다.

```text
Neovim core
   ↓
lazy.nvim
   ↓
LazyVim core spec
   ↓
optional extras
   ↓
user spec / override
   ↓
최종 Plugin configuration
```

따라서 LazyVim에서 어떤 Key를 눌러 LSP 기능이 실행된다고 해서 그 LSP 기능 자체가 LazyVim 구현인 것은 아니다. LazyVim은 **Neovim 또는 Plugin의 기능에 일관된 진입점과 기본 구성을 제공**하는 경우가 많다.

LazyVim의 실제 조립 규칙은 다음 문서에서 더 깊게 본다.

- [LazyVim 기능 지도](./2026-06-07-lazyvim-feature-plugin-map.md)
- [lazy.nvim Plugin spec 필드](./2026-06-19-lazy-nvim-plugin-spec-fields.md)
- [LazyVim spec merge와 의존성 계층](./2026-06-07-lazyvim-spec-merge-and-dependency-layers.md)

## 기능이 헷갈릴 때 역으로 추적한다

기능 이름을 외우기보다 아래 순서로 출처를 찾는다.

```text
지금 쓰는 기능
   ↓
Vim/Neovim core에 원래 있는가?
   ↓ 아니면
어떤 Plugin이 구현하는가?
   ↓
Distro는 그 Plugin을 어떻게 설정·Keymap했는가?
   ↓
내 user config가 무엇을 override했는가?
```

이 순서를 알면 "LazyVim이 이상하다"고 뭉뚱그리지 않고 문제의 실제 계층을 좁힐 수 있다.

## 경계만 기억한다

```text
Vim
= 편집 모델의 바닥

Neovim
= 확장 가능한 Runtime과 IDE 기반

Plugin
= 구체 기능 구현

Distro
= Plugin과 기본값을 조립한 사용자 경험
```

이 지도에서 세부 기능을 전부 펼치지 않는다. **현재 기능이 어느 계층에 있는지 찾은 뒤, 필요한 계층의 문서로 Zoom-in하는 것이 목적**이다.
