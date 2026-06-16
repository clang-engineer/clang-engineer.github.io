---
title       : "Neovim 실력 향상 로드맵 — vim·neovim·lazyvim 글을 어떻게 읽을까"
description : "Vim 기본기 → Lua → Neovim 내부 → LazyVim 구조 → 플러그인 작성까지, 이 블로그의 vim/neovim/lazyvim 글을 단계별로 큐레이션."
date        : 2026-06-16 00:00:00 +0900
updated     : 2026-06-16 00:00:00 +0900
categories  : [neovim, "개요·인덱스"]
tags        : [roadmap, neovim, vim, lua, lazyvim, guide]
pin         : true
hidden      : false
---

이 블로그에는 vim·neovim·lazyvim 세 디렉토리에 걸쳐 40여 편의 글이 있다. 처음 들어온 사람이 길을 잃지 않도록, "어떤 순서로 읽으면 Neovim 실력이 향상되는지"를 단계별로 정리했다.

## 어디서 시작할까

Vim/Neovim/LazyVim이 헷갈린다면 먼저 셋의 관계부터 잡자.

| 글 | 핵심 |
|---|---|
| [Vim vs Neovim vs LazyVim — 각 계층이 제공하는 기능](/posts/lazyvim/2026-06-08-vim-neovim-lazyvim-feature-layers/) | "이 기능이 어디서 온 건지" 정리. 가장 먼저 읽기 좋은 한 장 |
| [Neovim 배포판/프레임워크 비교 소개](/posts/lazyvim/2025-10-04-neovim-distribution/) | LazyVim·NvChad·LunarVim·AstroNvim 비교 — 본인에게 맞는 출발점 선택 |
| [Vim & Neovim 작동 원리 정리](/posts/vim/2025-10-04-vim-core-engine/) | 모드·버퍼·윈도우·탭, 명령 파이프라인 — 모든 글의 전제 |

## 1단계 — Vim 기본기

이 단계는 LazyVim을 쓰더라도 결국 한 번은 통과해야 하는 지점이다. 키맵·레지스터·vimscript는 "Neovim/LazyVim 너머"에 있는 게 아니라 그대로 깔려 있다.

| 글 | 핵심 |
|---|---|
| [Vim/Neovim 레지스터 정리](/posts/vim/2025-09-24-vim-register/) | `y`/`d`/`c`/`p`가 거치는 저장소들. 명명·익명·블랙홀 레지스터 |
| [Vimscript 종합 가이드 (legacy)](/posts/vim/2026-06-15-vimscript-syntax-guide/) | Vim 8 legacy 기준 문법 — 타입·스코프 prefix·비교 함정·함수/람다·List/Dict |
| [Learn Vimscript the Hard Way 핵심 정리](/posts/vim/2024-09-15-learn-vimscript-the-hard-way/) | Steve Losh 책 55챕터에서 실전에 남는 핵심만. 한 장짜리 reference |

## 2단계 — Neovim 내부 (Lua)

Neovim 설정·플러그인을 "고칠 수 있는" 수준이 되려면 Lua는 피할 수 없다. 시리즈 4부작 + 부록 1편으로 구성했다. `[Lua 종합 가이드](/posts/neovim/2026-06-15-lua-syntax-guide/)`가 hub고, 거기서 심화 3편으로 분기한다.

| 글 | 핵심 |
|---|---|
| [Lua 종합 가이드 (Neovim 컨텍스트)](/posts/neovim/2026-06-15-lua-syntax-guide/) | LuaJIT(5.1) 기준 문법 한 번에 정리. 타입·스코프·테이블·문자열 패턴·`vim.*` 헬퍼 |
| [Lua 모듈](/posts/neovim/2026-06-15-lua-modules/) | `require`/`package.path`, `local M = {} return M` 패턴, Neovim `lua/` 자동 등록과의 연결 |
| [Lua 메타테이블](/posts/neovim/2026-06-15-lua-metatables/) | `__index`/`__newindex`/`__call`, OOP 클래스 패턴, `vim.opt`가 일반 테이블처럼 보이는 이유 |
| [Lua 에러 처리](/posts/neovim/2026-06-15-lua-error-handling/) | `error`/`assert`로 던지고 `pcall`/`xpcall`로 잡기. Neovim 플러그인의 에러 관행 |
| [Lua vs Vimscript 성능](/posts/neovim/2026-06-12-neovim-lua-vs-vimscript-performance/) | 정량 차이와 실제 체감되는 영역. "그냥 Lua가 빠르다"보다 한 단계 깊은 이해 |

## 3단계 — LazyVim 구조 이해

LazyVim을 "그냥 쓰는" 단계에서 "어떻게 동작하는지 알고 고치는" 단계로 넘어가는 구간. 이걸 모르면 extras override·spec merge에서 매번 막힌다.

| 글 | 핵심 |
|---|---|
| [LazyVim 주요 플러그인 정리](/posts/lazyvim/2026-06-07-lazyvim-plugins-overview/) | UI/편집/Git/진단/LSP 각 영역에 어떤 플러그인이 들어가 있는지 |
| [LazyVim 기능 지도](/posts/lazyvim/2026-06-07-lazyvim-feature-plugin-map/) | 각 기능 영역(Git·검색·LSP·완성·DAP)이 어떤 플러그인 묶음으로 만들어지는지, snacks.nvim의 hub 역할 |
| [LazyVim 의존성 계층 — spec merge](/posts/lazyvim/2026-06-07-lazyvim-spec-merge-and-dependency-layers/) | lazy.nvim → core → extras → 사용자 plugin이 합쳐지는 순서 |
| [LazyVim extra의 spec에 의존성만 보강하기](/posts/lazyvim/2026-05-07-lazyvim-extra-override-merge-deps/) | 같은 이름으로 다시 작성해 `dependencies`만 머지하는 패턴 |
| [Which-Key Keymaps 정리](/posts/lazyvim/2025-10-04-whichkey/) | LazyVim 기본 키맵 그룹의 전체 지도 |
| [LazyVim `<leader>x` — Trouble 기반 코드 문제 탐색](/posts/lazyvim/2026-05-04-lazyvim-leader-x-trouble/) | Diagnostics/Quickfix/Location List/Todo를 Trouble UI로 통합 |
| [LazyVim의 Git 플러그인 구성](/posts/lazyvim/2026-06-09-lazyvim-git-plugins/) | gitsigns · lazygit · snacks 3축 |

## 4단계 — 프로젝트별 설정

dotfiles에 깔린 글로벌 설정 위에, 프로젝트마다 다르게 적용하고 싶은 케이스. exrc / `.nvim.lua` 메커니즘이 핵심.

| 글 | 핵심 |
|---|---|
| [Neovim 프로젝트별 로컬 설정 가이드 — exrc · .nvim.lua · trust](/posts/neovim/2026-06-15-neovim-exrc-nvim-lua-guide/) | Neovim 0.9+ exrc 동작·검색 파일명·trust 시스템·함정 한 번에 |
| [프로젝트 `.nvim.lua`에서 dotfiles의 lua 모듈 재사용하기](/posts/lazyvim/2026-05-07-nvim-exrc-require-dotfiles-module/) | 글로벌 dotfiles의 모듈을 프로젝트별 exrc에서 require하는 패턴 |
| [Windows에서 Dotfiles의 Neovim 설정 연결하기](/posts/lazyvim/2026-01-07-window-neovim/) | Windows에서 dotfiles 연결 시 경로 함정 |

## 5단계 — 플러그인 작성

이 단계까지 오면 "Neovim 사용자"에서 "Neovim 생태계 기여자"로 넘어간다. 4부작 + 실전 케이스 + 등록까지.

### 4부작 (이론)

| 글 | 핵심 |
|---|---|
| [플러그인을 Lua로 짤까 Vimscript로 짤까](/posts/neovim/2026-06-12-neovim-plugin-language-choice/) | 신규는 Lua가 표준, 단 부모 생태계가 Vimscript면 Vimscript가 자연스럽다 |
| [한 플러그인에 Lua와 Vimscript 섞기](/posts/neovim/2026-06-12-neovim-plugin-mixing-lua-vimscript/) | 호출 경계 최소화, 흔한 안티패턴, 모범 분담 |
| [Neovim 플러그인 작성 규칙 — runtimepath 관례](/posts/neovim/2026-06-12-neovim-plugin-conventions/) | runtimepath 자동 로드, `plugin/` vs `lua/`, 헬프·헬스체크·after/ |
| [직접 만든 플러그인 노출시키기 — 4가지 채널](/posts/neovim/2026-06-12-neovim-plugin-distribution/) | awesome-neovim · Dotfyle · VimAwesome · GitHub Topics |

### 실전 케이스

| 글 | 핵심 |
|---|---|
| [vim-dadbod 어댑터 플러그인 만들기](/posts/neovim/2026-06-12-vim-dadbod-adapter-plugin-build/) | 4부작을 실제로 적용한 케이스. 디렉토리 골격부터 dadbod-ui 트리 통합까지 |
| [awesome-neovim에 PR 보내기 — gh CLI로 한 번에](/posts/neovim/2026-06-12-awesome-neovim-pr-walkthrough/) | CONTRIBUTING.md 규칙을 한 번에 통과시키는 절차 |
| [mini.nvim 관련 정리](/posts/neovim/2025-10-04-mininvim/) | 한 저장소에 잘 묶인 mini 시리즈를 읽으며 패턴 학습 |

## 환경 세팅·운영

| 글 | 핵심 |
|---|---|
| [Neovim으로 C++ 개발 환경 세팅 (coc.nvim + clangd)](/posts/neovim/2024-04-04-neovim-cpp-setting/) | C++ 워크플로 한 세트 |

## 트러블슈팅 모음

실력 향상 흐름과 분리해서 모았다. 같은 에러를 만났을 때 검색해서 들어오는 용도.

| 영역 | 글 |
|---|---|
| 진단 도구 | [LazyVim Diagnostics 로그/메시지 확인법](/posts/lazyvim/2026-02-04-lazyvim-diagnostics/) |
| LSP | [Java LSP (jdtls) 작동 안함](/posts/lazyvim/2025-12-17-java-lsp-jdtls/) · [kotlin-language-server documentHighlight 크래시](/posts/lazyvim/2026-06-08-kotlin-language-server-document-highlight-crash/) |
| Treesitter | [kotlin 쿼리 "..<" 노드 에러 (파서 버전)](/posts/lazyvim/2026-05-08-nvim-treesitter-kotlin-rangeuntil-query-error/) · [main 브랜치는 nvim 0.12+ 전용](/posts/lazyvim/2026-05-08-nvim-treesitter-main-branch-needs-0.12/) |
| Lint | [PowerShell 프로필이 nvim-lint ktlint JSON을 깨뜨릴 때](/posts/lazyvim/2026-05-06-powershell-profile-pollutes-nvim-lint/) |
| Lazygit | [Windows에서 'e' 키 에러](/posts/lazyvim/2026-03-13-lazygit-nvim-windows-edit-error/) · [Windows에서 한글 깨짐](/posts/lazyvim/2026-03-13-nvim-lazygit-korean-broken/) |
| Dadbod | [dbout 결과창 레이아웃 커스터마이징](/posts/lazyvim/2026-05-06-vim-dadbod-dbout-layout/) · [PostgreSQL .pgpass 인증 (Windows)](/posts/lazyvim/2026-05-06-vim-dadbod-pgpass-windows/) |
| AI | [CopilotChat Model not found 에러](/posts/lazyvim/2026-06-05-copilotchat-model-not-found/) |
| 윈도우·tmux | [floating window + tmux 이동/복귀 포커스](/posts/lazyvim/2026-06-08-neovim-floating-window-tmux-refocus/) |
| Swap·복구 | [Neovim swap 파일 안전하게 정리하기](/posts/neovim/2026-06-11-nvim-swap-cleanup/) |

---

본인의 현재 위치에서 가까운 단계부터 진입하면 된다. 입문자는 "어디서 시작할까"부터, LazyVim 사용자는 3단계, 플러그인 만들고 싶은 사람은 2단계 → 5단계가 자연스러운 경로다.
