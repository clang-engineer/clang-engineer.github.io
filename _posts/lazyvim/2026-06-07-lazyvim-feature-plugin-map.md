---
title       : "LazyVim 기능 지도 — Git·검색·LSP·완성을 만드는 플러그인 묶음"
description : "LazyVim에서 각 기능 영역(Git, 검색, LSP, 자동완성, DAP 등)이 어떤 플러그인들이 협력해 만들어지는지, 그리고 snacks.nvim이 어떻게 새로운 hub가 되었는지"
date        : 2026-06-07 13:00:00 +0900
updated     : 2026-06-07 13:00:00 +0900
categories  : [lazyvim, "플러그인"]
tags        : [neovim, snacks, gitsigns, lazygit, mason]
pin         : false
hidden      : false
---

"Git 띄울 때 lazygit가 뜨는 거야 그렇다 치고, gitsigns 는 또 뭐가 하지?", "Telescope 끄면 검색이 안 될 텐데 왜 안 끊기지?" — LazyVim 을 좀 쓰다 보면 **하나의 기능을 여러 플러그인이 분담**한다는 게 보이기 시작한다. 이 글은 그 분담 관계를 기능 영역별로 정리한다.

[지난 글](/posts/lazyvim/2026-06-07-lazyvim-spec-merge-and-dependency-layers/) 이 "LazyVim이 어떻게 조립되는가(구조)"였다면, 이번 글은 "그 안에 뭐가 들어 있는가(내용)" 다.

> 본인 환경 기준 (LazyVim 11.x, snacks.nvim 시대). 10.x 이하라면 Telescope/alpha 가 살아있어서 다르다.

## 0. 한눈에 — snacks.nvim 이 새 hub 다

10.x → 11.x 로 넘어오면서 LazyVim 의 진영이 크게 정리됐다. 한때 따로 깔던 것들이 **snacks.nvim 하나로 흡수**됐다:

| 옛 LazyVim (~10.x) | 현재 LazyVim (11.x) — `snacks.nvim` |
|---|---|
| Telescope (picker) | `snacks.picker` |
| alpha-nvim (dashboard) | `snacks.dashboard` |
| nvim-notify | `snacks.notifier` |
| vim-floaterm/toggleterm | `snacks.terminal` |
| nvim-bufdel | `snacks.bufdelete` |
| (외부 명령) lazygit | `snacks.lazygit` |

Telescope 가 자취를 감추니 처음엔 당황스럽지만, picker 호출 키 (`<leader>ff` 등) 는 그대로다. **인터페이스는 같고 엔진만 바뀐 것.**

이 점만 이해해도 아래의 기능 묶음들이 훨씬 자연스럽게 읽힌다.

## 1. Git — gitsigns + lazygit.nvim + snacks.lazygit

세 컴포넌트가 다른 영역을 담당한다.

| 컴포넌트 | 담당 |
|---|---|
| `gitsigns.nvim` | **버퍼 안의 Git 표시** — gutter sign, hunk 단위 stage/reset, blame, diff |
| `lazygit` (외부 바이너리) | **풀스크린 Git TUI** — commit, branch, stash, rebase 등 |
| `snacks.lazygit` | nvim 안에서 `lazygit` 을 floating window 로 띄우는 launcher |
| `kdheepak/lazygit.nvim` (옵션) | 같은 역할의 별도 플러그인, `<leader>gg` 매핑 등 |

```
버퍼 내부 변경 표시 / hunk 조작        →  gitsigns
풀스크린 Git 작업 (commit/branch/...)  →  lazygit (외부 바이너리)
nvim 에서 lazygit 띄우기                →  snacks.lazygit (또는 lazygit.nvim)
```

키바인딩 흐름:
- `]h` / `[h` → gitsigns 가 처리 (다음/이전 hunk)
- `<leader>ghs` → gitsigns stage hunk
- `<leader>gg` → snacks/lazygit.nvim 가 외부 `lazygit` 띄움

즉 **gitsigns 는 inline, lazygit 은 fullscreen** 으로 역할이 명확히 갈린다.

> Git 영역의 전체 키맵과 작업 동선은 [LazyVim의 Git 플러그인 구성 — gitsigns·lazygit·snacks](/posts/lazyvim/2026-06-09-lazyvim-git-plugins/) 에서 따로 깊게 다룬다.

## 2. 검색 / Picker — snacks.picker + grug-far + flash

세 종류의 "검색" 이 따로 있다.

| 컴포넌트 | 담당 |
|---|---|
| `snacks.picker` | **파일/문자열/심볼 등 picker UI** (옛 Telescope 자리) |
| `grug-far.nvim` | **프로젝트 전체 검색/치환 UI** (`:GrugFar`, `<leader>sr`) |
| `flash.nvim` | **화면 내 점프** — `s` + 두 글자로 라벨 점프 |

```
"파일/심볼 골라서 열기"      →  snacks.picker
"코드 안에서 일괄 치환"      →  grug-far
"현재 화면에서 빠른 점프"    →  flash
```

`<leader>ff`, `<leader>sg`, `<leader>fb` 같은 키는 전부 snacks.picker 가 받는다. Telescope 키를 같은 자리에 매핑했기 때문에 익숙한 흐름은 유지된다.

> 안에서 ripgrep (`rg`) 을 부르므로 시스템에 `rg` 가 깔려 있어야 함. snacks.picker 가 grep 을 못 한다고 느껴지면 `:checkhealth snacks` 부터 본다.

## 3. LSP — lspconfig + mason 생태계 + lazydev / jdtls

LSP 관련은 세 층으로 나뉜다.

```
[ Layer A — LSP 서버 자체 ]
   gopls, tsserver, jdtls, lua-language-server, ...
        ↑ 설치/업데이트
[ Layer B — mason 생태계 ]
   mason.nvim              ← 통합 설치 관리자
   mason-lspconfig.nvim    ← mason ↔ lspconfig 연결
   mason-nvim-dap.nvim     ← mason ↔ nvim-dap 연결
        ↑ "이 LSP 서버 깔아둬" 라는 요청
[ Layer C — nvim 측 클라이언트 ]
   nvim-lspconfig          ← 서버별 시작 옵션·root_dir 등 표준 설정
   lazydev.nvim            ← Lua 작성 시 nvim API 자동완성/타입
   nvim-jdtls              ← Java 는 별도 어댑터 필요 (extras lang.java)
   SchemaStore.nvim        ← JSON/YAML 스키마 데이터
```

`<leader>cd` (diagnostics), `gd` (definition), `K` (hover) 같은 키는 LazyVim 이 `lsp/keymaps.lua` 에서 일괄 매핑한다. 즉 LSP 서버가 어떤 거든 사용자가 보는 키맵은 동일하다.

Java 가 유난한 이유 — `jdtls` 가 표준 LSP 가 아니라 별도 wrapper (`nvim-jdtls`) 가 필요해서. 이게 `extras/lang/java.lua` 가 별도로 분리된 배경이다.

## 4. 자동완성 — blink.cmp + blink-copilot + copilot.lua

11.x 시점 LazyVim 기본 completion 은 nvim-cmp 가 아니라 **blink.cmp** 다.

| 컴포넌트 | 담당 |
|---|---|
| `blink.cmp` | completion 엔진. Rust 기반으로 빠름 |
| `friendly-snippets` | 언어별 snippet 데이터셋 |
| `blink-copilot` | **GitHub Copilot 결과를 blink.cmp 의 source 로 노출** |
| `copilot.lua` | Copilot 자체 클라이언트 (`extras/ai/copilot.lua`) |
| `CopilotChat.nvim` | 챗 UI (`extras/ai/copilot-chat.lua`) |

흐름:
```
copilot.lua  ─(Copilot 인증·API 호출)─>  blink-copilot  ─(source)─>  blink.cmp  ─(UI)─>  사용자
```

`blink-copilot` 이 **두 시스템을 잇는 어댑터** 역할이다. 이게 없으면 Copilot 후보가 completion popup 에 안 뜬다.

## 5. 편집 보조 — mini 묶음 + ts-comments + autotag

LazyVim 의 "잔잔한 편집 도구" 는 거의 다 `nvim-mini/*` 시리즈로 통일됐다.

| 플러그인 | 담당 |
|---|---|
| `mini.pairs` | 자동 괄호 닫기 |
| `mini.ai` | 확장 텍스트 객체 (`vif`, `vac` 등) |
| `mini.surround` | 감싸기/벗기기 (`gsa`, `gsd`) |
| `mini.comment` (coding.mini-comment) | 주석 토글 — `ts_context_commentstring` 와 연동해 JSX/Vue 같은 hybrid 파일도 대응 |
| `mini.icons` | 파일타입 아이콘 |
| `ts-comments.nvim` | mini.comment 와 합쳐 다중언어 주석 처리 보완 |
| `nvim-ts-autotag` | JSX/HTML 태그 자동 닫기 |
| `yanky.nvim` (extras coding.yanky) | yank 히스토리 (`<leader>p`) |

`mini.comment` 가 `ts_context_commentstring` 를 부르는 식의 **수평 의존성** 이 많다. 한쪽 만 꺼두면 다른 쪽이 무력화된다.

## 6. Treesitter — 본체 + context + textobjects

```
nvim-treesitter             ← 본체 (파서 + 하이라이트)
nvim-treesitter-textobjects ← @function.outer, @class.inner 같은 TS 기반 텍스트객체
nvim-treesitter-context     ← 상단에 현재 함수/클래스 컨텍스트 표시
```

`mini.ai` 의 텍스트 객체 정의가 `nvim-treesitter-textobjects` 의 캡처 이름 (`@function.outer` 등) 을 그대로 쓴다. **편집 보조 ↔ Treesitter 는 강한 결합**.

## 7. Diagnostics / Quickfix — trouble + todo-comments

```
LSP / linter / nvim-lint  ─(vim.diagnostic API)─>  trouble.nvim   (사이드 패널)
todo-comments.nvim       ──────────────────────>  trouble.nvim   (:TodoTrouble)
                                                       ↓
                                          <leader>xx 로 토글
```

`trouble.nvim` 은 diagnostic 자체를 만들지 않는다. **수집된 진단을 보여주는 viewer 만 담당**. 진단 데이터는 LSP/linter 가 만든 것 그대로.

## 8. 포매터 / 린터 — conform + nvim-lint

LSP 와 **분리된 라인** 이다.

| 컴포넌트 | 담당 | 호출 시점 |
|---|---|---|
| `conform.nvim` | 포매터 통합 (prettier, black, ktlint, stylua, ...) | `:Format`, BufWrite |
| `nvim-lint` | 린터 통합 (eslint_d, shellcheck, ...) | BufWrite, InsertLeave |
| `mason.nvim` | conform/lint 가 쓰는 외부 바이너리 설치 관리자 |

흐름:
```
mason 으로 prettier 설치  →  conform.nvim 이 prettier 경로 인식  →  저장 시 자동 포맷
mason 으로 eslint_d 설치  →  nvim-lint 가 eslint_d 호출        →  diagnostics 로 표시  →  trouble 에 노출
```

LSP 와 무관하게 동작하므로 (LSP 가 없는 언어도) 포맷·린트 가능.

## 9. DAP — 디버거 — dap + dap-ui + virtual-text + mason-dap

```
nvim-dap                   ← 디버거 프로토콜 (DAP) 클라이언트
nvim-dap-ui                ← TUI (스택/변수/스코프 패널)
nvim-dap-virtual-text      ← 현재 라인에 변수값 inline 표시
mason-nvim-dap.nvim        ← mason 으로 디버그 어댑터 설치
nvim-nio                   ← async I/O — nvim-dap-ui 의 의존성
nvim-jdtls (Java) / kotlin-dap (user) ← 언어별 어댑터
```

`extras dap.core` 만 켜면 위 핵심 5개가 한꺼번에 들어온다. Java 디버깅은 추가로 `nvim-jdtls` 가, Kotlin 은 사용자 custom plugin (`plugins/kotlin-dap.lua`) 가 해결.

## 10. UI / 잡일 — snacks.nvim 단독

대시보드·터미널·notifier·indent guide·input prompt 등 잡다한 UI 는 **snacks.nvim 한 군데** 로 모인다. snacks 의 서브모듈들:

| 서브모듈 | 역할 |
|---|---|
| `snacks.dashboard` | 시작 화면 |
| `snacks.notifier` | toast notification |
| `snacks.terminal` | floating terminal |
| `snacks.picker` | (위 2번에서 본) picker 엔진 |
| `snacks.lazygit` | (1번) lazygit launcher |
| `snacks.bufdelete` | 버퍼 안전 삭제 (split/window 보존) |
| `snacks.input` | `vim.ui.input` 대체 |
| `snacks.scroll` | 부드러운 스크롤 |
| `snacks.indent` | indent guide |
| `snacks.statuscolumn` | sign/number 영역 커스텀 |

`noice.nvim` (cmdline·msg overlay) + `lualine.nvim` (statusline) + `bufferline.nvim` (tabs) 가 snacks 옆에서 보완한다.

## 11. DB — vim-dadbod 삼총사 (extras lang.sql)

```
vim-dadbod              ← 코어 (DB 연결, SQL 실행 — tpope)
vim-dadbod-ui           ← 사이드바 UI (DBUI)
vim-dadbod-completion   ← SQL 자동완성 (blink.cmp source)
```

`extras lang.sql` 을 켜면 셋 다 들어온다. 더 깊은 이야기는 [vim-dadbod 인증 함정](/posts/lazyvim/2026-05-06-vim-dadbod-pgpass-windows/), [dbout 레이아웃 커스터마이징](/posts/lazyvim/2026-05-06-vim-dadbod-dbout-layout/) 글 참고.

## 정리 — "이 기능이 안 먹어" 일 때 어디부터 보는가

기능 영역과 담당 플러그인을 머릿속에 두면, 문제 발생 시 의심 순서가 명확해진다.

| 증상 | 우선 의심 |
|---|---|
| Git 표시(gutter sign) 가 안 보임 | `gitsigns.nvim` 설정·LazyFile 이벤트 |
| `<leader>gg` 가 안 뜸 | `snacks.lazygit` config / 외부 `lazygit` 바이너리 |
| 검색이 안 됨 | `snacks.picker` + 시스템 `rg` |
| 완성 후보에 Copilot 이 없음 | `blink-copilot` (어댑터) |
| `gd` 작동 안 함 | LSP 서버가 안 뜬 것. `:LspInfo` → `:Mason` |
| 저장 시 포맷 안 됨 | `conform.nvim` + mason 에 포매터 깔렸는지 |
| 한쪽 lint 만 안 됨 | `nvim-lint` source 설정 |

LazyVim 은 **"풍부한 기본값을 가진 spec 묶음"** 이고, 그 spec 들이 위와 같이 기능 영역으로 나뉘어 협력한다. 각 영역의 주연·조연만 외워두면 어디를 만져야 할지가 보인다.

## LazyVim 구조 시리즈

| 글 | 다루는 것 |
| --- | --- |
| [LazyVim 주요 플러그인 정리](/posts/lazyvim/2026-06-07-lazyvim-plugins-overview/) | LazyVim에 어떤 플러그인들이 어떤 키맵으로 들어있는지 — 글로벌 명함 |
| **LazyVim 기능 지도 (현재 글)** | 기능 영역(Git·검색·LSP·완성·DAP)별로 어떤 플러그인이 협력하는지, snacks.nvim의 hub 역할 |
| [LazyVim 의존성 계층 — spec merge](/posts/lazyvim/2026-06-07-lazyvim-spec-merge-and-dependency-layers/) | lazy.nvim → core → extras → 사용자 plugin이 합쳐지는 머지 알고리즘 |
