---
title       : "Neovim 로드맵 — 편집 모델·상태·확장 구조"
description : "Neovim의 편집 모델, Buffer·Window·Tabpage 상태, Runtime API, 플러그인 시스템과 외부 도구 연동의 실제 관계를 보여주는 거시 개념지도."
date        : 2026-06-16 23:00:00 +0900
permalink   : /posts/neovim/2026-06-16-neovim-roadmap/
updated     : 2026-10-25 20:00:00 +0900
categories  : [neovim, "개요·인덱스"]
tags        : [roadmap, vim, lua, lazyvim]
pin         : false
hidden      : false
redirect_from:
  - /posts/neovim/2026-06-08-vim-neovim-lazyvim-feature-layers/
  - /posts/lazyvim/2026-06-08-vim-neovim-lazyvim-feature-layers/
---

Neovim은 Vim의 모달 편집 모델을 계승하면서 편집기 상태를 API로 노출하고 플러그인·외부 프로세스와 연동하는 확장 가능한 편집기다. 이 로드맵은 **기존 글의 학습 순서가 아니라 Neovim 자체의 구성요소와 관계**를 보여준다. 세부 문서의 존재 여부는 지도에 포함할 개념을 결정하지 않는다.

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

## Neovim은 실제로 무엇을 개발했는가?

**Neovim의 차별점은 Lua·RPC·LSP 같은 기술 자체를 발명한 것이 아니라, 편집기 코어에 연결되는 확장 인터페이스와 통합 기능을 구현한 것**이다. 기존 Vim에서 계승한 편집 모델과 Neovim에서 설계·구현한 기능을 구분한다.

```text
                   Neovim 확장 플랫폼
                           │
           ┌───────────────┴────────────────┐
           ▼                                ▼
     자체 API·기능 구현                 외부 기술 통합
           │                                │
     Neovim API / RPC 서버            LuaJIT Runtime
     Extmark / Virtual Text           Treesitter Parser
     Floating Window API              libuv Event Loop
     Diagnostics API                   LSP Protocol
     Built-in LSP Client                    │
           │                                │
           └───────────────┬────────────────┘
                           ▼
                    Plugin / External UI
```

이 그림은 **구현 책임과 기술의 출처**를 구분한 것이다. LSP는 외부 표준이지만 **LSP Client는 Neovim의 내장 구현**이고, Treesitter는 외부 파서지만 **이를 활용하는 Neovim API는 자체 통합 기능**이다. LuaJIT·libuv는 Neovim이 만든 기술이 아니다. Vim에도 Job·Channel·Popup·Text Properties 등 유사한 기능이 있으므로 'Neovim에서 구현'이 곧 '편집기 역사상 최초'를 의미하지는 않는다.

| Neovim에서 구현한 기능 | 실제 역할 |
|---|---|
| 공개 API + MessagePack-RPC | 내부 Lua 또는 외부 프로세스에서 편집기 기능 호출 |
| Extmark + Virtual Text/Lines | 편집에 따라 위치를 추적하고 버퍼를 바꾸지 않는 화면 정보 표시 |
| Floating Window API | 별도 Window를 화면 위에 배치 |
| 내장 LSP Client | 외부 Language Server와 JSON-RPC 기반 LSP 통신 |
| `vim.diagnostic` | LSP·Linter의 진단 상태 관리 및 화면 표시 |
| Treesitter API | 외부 구문 파서의 트리를 편집 기능에 활용 |
| Job·비동기 API | 외부 프로세스 실행·관리 및 이벤트 기반 처리 |

이후 절에서는 **왜 Lua를 선택했는지**, **API와 RPC가 어떻게 다른지**, **Job과 RPC가 어떤 관계인지** 등 각 기능의 설계·동작 원리를 설명한다.

## Vim에서 계승한 것과 Neovim의 확장 기반

Neovim을 **Vim + 플러그인**으로만 이해하면 내장 API의 역할을 놓치기 쉽다. 다만 아래 분류는 개념의 최초 발명자를 뜻하지 않는다. **Vim에도 유사 기능이 있는지**와 **Neovim이 어떤 API를 기본 제공하는지**를 구분한다.

```text
                   Neovim
                      │
         ┌────────────┴────────────┐
         ▼                         ▼
     Vim 계승 모델             Neovim 확장 기반
         │                         │
   Mode / Motion              Lua / vim.api
   Register / Mark            LSP Client / Diagnostics
   Quickfix / Loclist         Extmark / Virtual Text
   Buffer / Window            Treesitter API
   Autocommand                Job / RPC / Floating UI
         │                         │
         └────────────┬────────────┘
                      ▼
               Plugin / LazyVim
```

| 구분 | 개념 | 이해할 핵심 |
|---|---|---|
| 계승 | Quickfix / Location List | 검색·빌드 등의 위치 목록을 전역 또는 창별로 관리 |
| 계승 | Mark / Jump List / Change List | 수동 책갈피·점프 이력·변경 위치 이력 |
| Neovim 내장 | `vim.lsp` | 언어 서버와 통신해 정의·참조·진단 등을 수신 |
| Neovim 내장 | `vim.diagnostic` | 버퍼·진단 제공자별 오류·경고 상태 관리 |
| Neovim 확장 API | Extmark | 편집에 따라 추적되는 위치·범위와 화면 장식의 기반 |
| Neovim 확장 API | Lua / `vim.api` | 편집기 상태를 조회·변경하는 플러그인 인터페이스 |
| Neovim 통합 | Treesitter / Job·RPC / Floating Window | 구문 분석·외부 통신·화면 표현에 활용 |

**Quickfix와 Diagnostics의 차이:** Quickfix는 범용 위치 목록이고 Diagnostics는 현재 코드의 진단 상태를 제공자별로 관리한다. Quickfix도 플러그인으로 지속 갱신할 수 있으므로 '스냅샷 대 실시간'만으로 구분하지 않는다. Trouble은 이들 및 LSP References 등을 표시하는 **별도 플러그인**이며 Neovim의 내장 기능이 아니다.

**Mark와 Extmark의 차이:** Mark는 사용자가 돌아올 위치를 기억하는 편집 기능이고, Extmark는 플러그인이 위치·범위·Virtual Text 등을 관리하는 API다.

개발 도구 결과가 생성·관리·표시되는 관계는 [코드 진단과 결과 탐색](./2026-05-04-neovim-code-diagnostics-and-navigation.md), 구체적인 확장 인터페이스는 [Neovim API 지도](./2026-06-19-neovim-vim-global-api-map.md)에서 다룬다.

## 설계 방향 — Vim은 왜 Neovim과 같은 길을 택하지 않았을까?

둘 다 Vim의 편집 모델을 발전시키지만 **확장 기능을 구축하는 기본 경로**가 다르다. Vim은 기존 Vimscript의 성능·표현력을 개선하는 **Vim9script**와 외부 도구를 연결하는 **Job·Channel**을 발전시켰다. Neovim은 Vim 코어를 포크·리팩터링하면서 **Lua API·MessagePack-RPC·외부 UI·플러그인 통합**을 중요한 설계 축으로 삼았다. Vim에 외부 프로세스 연동이 없거나 Neovim이 RPC를 발명했다는 뜻은 아니다.

```text
                 Vim 편집 모델
                       │
           ┌───────────┴───────────┐
           ▼                       ▼
          Vim                    Neovim
           │                       │
    Vim9script 개선            Lua / Runtime API
    Job / Channel              RPC / Remote UI
    기존 스크립트 호환          코어 API·확장 경계 정비
           │                       │
           └───────────┬───────────┘
                       ▼
              서로 다른 확장 전략
```

**왜 Vim9script인가?** Vim의 공식 설계 문서는 기존 Vimscript의 실행 비용과 호환성 제약을 지적하고, 새 함수 컴파일 방식으로 속도와 언어 표현력을 개선하려는 목표를 설명한다. 또한 외부 도구는 Job·Channel로 통신하도록 권장하며, 기존 내장 언어 인터페이스의 우선순위를 낮추는 방향을 제시한다. [Vim9 설계 배경](https://github.com/vim/vim/blob/master/README_VIM9.md) · [Vim9 공식 도움말](https://vimhelp.org/vim9.txt.html)

**왜 Neovim의 API·RPC인가?** Neovim의 공식 비전은 플러그인 작성자의 제약을 줄이고 Lua 인터페이스와 조합 가능한 확장 구조를 제공하는 것이다. Lua는 프로세스 내부 확장 언어이고 RPC는 외부 프로세스가 공개 API를 호출하는 통신 경로다. [Neovim Vision](https://neovim.io/charter/)

**생태계 관점:** RPC 하나만으로 플러그인 생태계의 성장을 설명할 수는 없다. Lua·LSP·UI API와 플러그인·배포판의 결합이 개발·사용 진입장벽을 낮췄다는 해석은 가능하지만, 각 요인의 성장 기여도를 입증한 정량적 결론은 아니다.

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

### 프로세스 경계와 코드 분석

```text
┌────────────── Neovim 프로세스 ──────────────┐
│ C Core / 편집기 상태                       │
│     ▲                                      │
│     │ 공개 API                             │
│ Lua Runtime ── Lua Plugin                  │
│     │                                      │
│ Treesitter Parser ── 구문 트리             │
│ LSP Client ────────┐                       │
│ Job ───────────────┼── 외부 프로세스 실행  │
└────────────────────┼───────────────────────┘
                     │ LSP (JSON-RPC)
                     ▼
              Language Server
                (별도 프로세스)

외부 Python ── MessagePack-RPC ──> Neovim 공개 API
```

**Treesitter 파서는 일반적으로 Neovim 프로세스 안에서 실행**하고, **Language Server는 보통 별도 프로세스**에서 실행된다. LSP의 JSON-RPC와 Neovim 외부 API의 MessagePack-RPC는 다른 통신 경로다. Job은 외부 프로세스 실행·관리, RPC는 실행 중인 프로세스 사이의 원격 호출이다.

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

LSP는 [Mason·nvim-lspconfig·vim.lsp의 역할](./2026-07-08-neovim-lsp-three-layers-mason-lspconfig-vimlsp.md), DAP는 [Debug Adapter Protocol](./2026-07-12-nvim-dap-debug-adapter-protocol.md)에서 더 자세히 다룬다. 터미널 UI의 입출력 구조는 [Terminal 로드맵](../terminal/2026-09-05-00-terminal-roadmap.md)과 연결된다.

## 필요한 경우 더 깊이 살펴보기

전체 지도의 개념을 이해하는 데 별도 문서가 필수인 것은 아니다. 특정 개념의 원리나 구현이 궁금할 때만 아래 자료로 이동한다.

- 편집 상태와 내부 구조: [Vim·Neovim 작동 원리](./2025-10-04-vim-core-engine.md), [Buffer·Window·Extmark](./2026-06-19-neovim-buffer-window-extmark.md)
- 확장 API: [Neovim API 지도](./2026-06-19-neovim-vim-global-api-map.md), [Autocommand·Event](./2026-06-19-neovim-autocommand-events.md)
- 외부 개발 도구: [LSP](./2026-07-08-neovim-lsp-three-layers-mason-lspconfig-vimlsp.md), [DAP](./2026-07-12-nvim-dap-debug-adapter-protocol.md)
- 선택적 설정·확장: [LazyVim 기능 지도](./2026-06-07-lazyvim-feature-plugin-map.md), [Plugin 구조](./2026-06-12-neovim-plugin-conventions.md)

## 다른 로드맵과의 경계

Neovim의 편집 모델·상태·API는 이 문서에서 다룬다. [Terminal](../terminal/2026-09-05-00-terminal-roadmap.md)은 PTY·터미널 렌더링, [tmux](../tmux/2026-06-16-00-tmux-roadmap.md)는 세션·pane 관리, [dotfiles](../shell/2026-07-08-00-dotfiles-roadmap.md)는 설정 파일의 머신 간 재현을 다룬다. 일반적인 프로그래밍 언어·운영체제 개념은 해당 개념지도에서 확인한다.
