---
title       : LazyVim 주요 플러그인 정리 — UI / 편집 / Git / 진단 / LSP
description :
date        : 2026-06-07 12:00:00 +0900
categories  : [lazyvim, "플러그인"]
tags        : [neovim, lazyvim, plugin]
pin         : false
hidden      : false
---

LazyVim 기본 활성화된 주요 플러그인과 단축키/명령어 모음.

## UI · 메시지

### noice.nvim
- cmdline / 메시지 / 팝업 UI를 개선
- `:Noice disable` 로 끄기, `:NoiceHistory` 로 히스토리 확인

### snacks.dashboard
- 시작 화면 대시보드
- 재진입: `:lua Snacks.dashboard()`

### bufferline.nvim

| 키 | 설명 |
|---|---|
| `<leader>bp` | 버퍼 pin 토글 |
| `<leader>bP` | pin 안 된 버퍼 모두 삭제 |

## 편집 보조

### mini.move
- `<A-j>` / `<A-k>` — 줄 위/아래 이동

### mini.comment / coding.mini-comment
- `gcc` — 현재 줄 주석 토글
- `gc{motion}` — 영역 주석 토글

### mini.surround / coding.mini-surround
- `surround.vim` 기반 최소 기능 — 추가/삭제/변경

### mini.pairs
- 자동 괄호 닫기 (자동 적용)

### mini.ai
- 확장 텍스트 객체: `vai`, `vi"`, `vi'`, `vi(`, `vi[`, `vi{`, `vi<`, `` vi` ``, `viB`, `vib`, `viw`, `viW`

### flash.nvim
- 한 화면 내 빠른 점프

| 동작 | 키 |
|---|---|
| 단어/문자 점프 | `s{문자}` |
| 단어 전체 점프 | `S` |
| 시각 모드 선택 중 점프 | `v` → `s` |
| Treesitter 연동 탐색 | `s` (코드 구조 모드) |
| 플래시 종료 | `<Esc>` |

## Git

### gitsigns
- 변경된 줄 표시 (numhl, signs, linehl, deleted, word_diff, current_line_blame 등)
- `:Gitsigns <옵션>`

### lazygit.nvim
- `<leader>gg` — lazygit 실행
- 설치:
  ```sh
  brew install lazygit
  ```
  ```lua
  return {
    "kdheepak/lazygit.nvim",
    lazy = true,
    dependencies = { "nvim-lua/plenary.nvim" },
  }
  ```

## Diagnostics · 검색

### trouble.nvim
- 사이드 패널로 진단/검색 결과 시각화

| 키 | 기능 |
|---|---|
| `<leader>xx` | Trouble Diagnostics 토글 |
| `<leader>xX` | 현재 버퍼 Diagnostics |
| `<leader>xq` | Quickfix 목록 |
| `<leader>xl` | Location List |
| `<leader>xt` | TODO 목록 (`todo-comments.nvim` 연동) |

연동 가능 소스:

| 항목 | 설명 |
|---|---|
| LSP Diagnostics | `:Trouble diagnostics` 로 LSP 에러/워닝 트리 |
| QuickFix / Location | `:Trouble quickfix`, `:Trouble loclist` |
| TODO Comments | `:TodoTrouble` 로 TODO/FIXME |
| References / Definitions | `:Trouble lsp_references`, `:Trouble lsp_definitions` |
| Telescope 통합 | `require("trouble").open_with_trouble` |

### todo-comments

| 명령 | 표시 |
|---|---|
| `:TodoTelescope` | Floating Picker |
| `:TodoQuickFix` | 하단 리스트 |
| `:TodoTrouble` | 사이드 패널 |

탐지 키워드: TODO / FIXME / BUG / HACK / WARN / NOTE / PERF / TEST

### 파일/심볼 탐색 (`<leader>f`)
- `<leader>fb` / `<leader>fB` — 버퍼 검색
- `<leader>fc` — lazy config 검색
- `<leader>ff` / `<leader>fF` — 파일 검색
- `<leader>fg` — git 파일 검색
- `<leader>fr` / `<leader>fR` — 최근 파일
- `<leader>fp` — 프로젝트 검색

> 끝 글자 소문자=root, 대문자=current

### grug-far / GrugFar
- 프로젝트 전체 검색/치환 UI
- `<leader>sr` — 프로젝트 전체 치환

| 명령 | ripgrep 실행 위치 | 내부 |
|---|---|---|
| `:GrugFar` | 현재 프로젝트 root | `rg --vimgrep <pattern> .` |
| `:GrugFarWithin` | 지정 path (또는 현재 파일) | `rg --vimgrep <pattern> <path>` |

### Snack File Explorer (`<leader>e`)

| 키 | 설명 |
|---|---|
| `P` | Preview 토글 |
| `Z` | 모든 fold 닫기 |
| `H` | 숨김 파일 토글 |
| `I` | .ignore 파일 토글 |
| `l` | confirm |
| `.` | 현재 파일에 focus |
| `<C-v>` | vertical split |
| `<C-s>` | horizontal split |
| `<C-a>` | 전체 선택 |
| `<C-F>` | preview scroll down |
| `<C-B>` | preview scroll up |
| `i` | 검색창 focus |
| `/` | focus 토글 |
| `?` | help 토글 |

## LSP · Mason

### Mason
- LSP / DAP / 포매터 / 린터 통합 설치 관리자
- LazyExtras 활성화 시 자동 포함
- 수동: `:MasonInstall typescript-language-server`, `:MasonInstall jdtls`

### LSP TypeScript 단축키

| 키 | 명령 | 설명 |
|---|---|---|
| `gD` | `typescript.goToSourceDefinition` | 소스 정의로 점프 |
| `gR` | `typescript.findAllFileReferences` | 현재 파일 내 모든 참조 |
| `<leader>co` | `source.organizeImports` | import 정리 |
| `<leader>cM` | `source.addMissingImports.ts` | 누락 import 추가 |
| `<leader>cu` | `source.removeUnused.ts` | 미사용 제거 |
| `<leader>cD` | `source.fixAll.ts` | 전체 diagnostics 자동 수정 |
| `<leader>cV` | `typescript.selectTypeScriptVersion` | TS 버전 선택 |

### conform.nvim
- 포매터 통합 (prettier, black, ktlint 등)
- LSP 와 독립, LazyVim 기본 포함
- 로그: `~/.local/state/nvim/conform.log`

## Markdown

### RenderMarkdown
- LazyVim 기본 활성. 기본 비활성으로 두려면:
  ```lua
  -- ~/.config/nvim/lua/plugins/render-markdown.lua
  return {
    {
      "MeanderingProgrammer/render-markdown.nvim",
      opts = { enabled = false },
    },
  }
  ```
- 토글: `:RenderMarkdown toggle`, `:RenderMarkdown enable/disable`

### Markdown Preview
- `:MarkdownPreviewToggle` — 미리보기 창 토글

## 기타

### WhichKey
- 등록된 keymap과 prefix 그룹 자동 탐지
- prefix를 누르면 그룹 팝업 표시

### Undotree
- `<leader>su` — Undotree 토글

### Copilot Chat

| 키 | 설명 |
|---|---|
| `<leader>aa` | 토글 |
| `<leader>ap` | Prompt |
| `<leader>aq` | quit |
| `<leader>ax` | clear |

### vim-dadbod-ui (DB UI)
- `:DBUI` — 데이터베이스 UI 토글
- `<leader>r` — 페이징 추가 로드

### colorscheme lazy load
```vim
:Lazy load gruvbox
:colorscheme gruvbox
```

## LazyExtras
- `:LazyExtras` — 추가 플러그인 활성화 (원하는 항목에서 `x` 키)
- 자주 쓰는 것: `lang.java`, `lang.kotlin`

## Diagnostic 시스템 흐름도

```
[LSP 서버들]
   ↓
Neovim 내장 Diagnostic 시스템 (vim.diagnostic)
   ↓
LazyVim UI 계층
 ├─ Trouble.nvim      → 진단 목록 패널 (<leader>xx)
 ├─ Noice.nvim        → 메시지 / 경고 팝업
 ├─ Telescope.nvim    → 진단 검색 (<leader>fD)
 ├─ Lualine.nvim      → 상태줄의 에러/경고 카운트
 └─ Virtual Text / Signs → 코드 옆의 빨간줄, 아이콘
```
