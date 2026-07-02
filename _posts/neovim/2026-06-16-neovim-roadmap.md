---
title       : "Neovim 실력 향상 로드맵 — vim·neovim·lazyvim 글을 어떻게 읽을까"
description : "Vim 기본기 → Lua → Neovim 내부 → LazyVim 구조 → 플러그인 작성까지, 이 블로그의 vim/neovim/lazyvim 글을 단계별로 큐레이션."
date        : 2026-06-16 23:00:00 +0900
updated     : 2026-06-19 22:00:00 +0900
categories  : [neovim, "개요·인덱스"]
tags        : [roadmap, vim, lua, lazyvim]
pin         : false
hidden      : false
---

이 블로그에는 vim·neovim·lazyvim 세 디렉토리에 걸쳐 40여 편의 글이 있다. 처음 들어온 사람이 길을 잃지 않도록, "어떤 순서로 읽으면 Neovim 실력이 향상되는지"를 단계별로 정리했다.

## 어디서 시작할까

Vim/Neovim/배포판이 헷갈린다면 먼저 셋의 관계부터 잡자.

| 글 | 핵심 |
|---|---|
| [Vim vs Neovim vs 배포판 — 각 계층이 제공하는 기능](/posts/neovim/2026-06-08-vim-neovim-lazyvim-feature-layers/) | "이 기능이 어디서 온 건지" 정리. 가장 먼저 읽기 좋은 한 장 |
| [Neovim을 어디서 시작할까 — Vanilla / kickstart.nvim / LazyVim 비교](/posts/neovim/2026-06-16-neovim-starting-point-comparison/) | 세 시작점의 학습 곡선·추천 맥락 + LazyVim·NvChad·AstroNvim distro 카탈로그. "어디서 출발할지" 결정용 |
| [Vim & Neovim 작동 원리 정리](/posts/neovim/2025-10-04-vim-core-engine/) | 모드·버퍼·윈도우·탭, 명령 파이프라인 — 모든 글의 전제 |

## 1단계 — Vim 기본기

이 단계는 LazyVim을 쓰더라도 결국 한 번은 통과해야 하는 지점이다. 키맵·레지스터·vimscript는 "Neovim/LazyVim 너머"에 있는 게 아니라 그대로 깔려 있다.

| 글 | 핵심 |
|---|---|
| [Vim/Neovim 레지스터 정리](/posts/neovim/2025-09-24-vim-register/) | `y`/`d`/`c`/`p`가 거치는 저장소들. 명명·익명·블랙홀 레지스터 |
| [Vimscript 종합 가이드 (legacy)](/posts/neovim/2026-06-15-vimscript-syntax-guide/) | Vim 8 legacy 기준 문법 — 타입·스코프 prefix·비교 함정·함수/람다·List/Dict |
| [Learn Vimscript the Hard Way 핵심 정리](/posts/neovim/2024-09-15-learn-vimscript-the-hard-way/) | Steve Losh 책 55챕터에서 실전에 남는 핵심만. 한 장짜리 reference |

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
| [Neovim 프로젝트별 로컬 설정 가이드 — exrc · .nvim.lua · trust](/posts/neovim/2026-06-15-neovim-exrc-nvim-lua-guide/) | Neovim 0.9+ exrc 동작·검색 파일명·trust 시스템·함정 한 번에 || [Windows에서 Dotfiles의 Neovim 설정 연결하기](/posts/neovim/2026-01-07-window-neovim/) | Windows에서 dotfiles 연결 시 경로 함정 |

## 5단계 — 플러그인 작성

이 단계까지 오면 "Neovim 사용자"에서 "Neovim 생태계 기여자"로 넘어간다. 4부작(배치·발행) + 런타임 API(구현 심화) + 실전 케이스 + 등록까지.

### 발행 순서 (0 → 등록)

플러그인 하나를 빈 디렉토리에서 awesome-neovim 등록까지 올리는 실제 순서. 각 단계의 상세 글은 아래 표(4부작·런타임 API·실전 케이스·테스트)에 모았다.

1. **언어 결정** — Lua/Vimscript 택
2. **골격 잡기** — runtimepath 관례대로 `plugin/` vs `lua/` 배치
3. **구현** — 필요하면 Lua·Vimscript 혼용 경계 최소화
4. **테스트** — plenary / mini.test / busted 중 택1
5. **문서화** — `panvimdoc`로 README를 `:help`로 변환 → [vimdoc 작성](/posts/neovim/2026-06-19-neovim-plugin-vimdoc-panvimdoc/) (awesome-neovim 등록 요건)
6. **노출 채널 결정** — awesome-neovim · Dotfyle · VimAwesome · GitHub Topics
7. **awesome-neovim 등록** — gh CLI로 PR

### 4부작 (이론)

| 글 | 핵심 |
|---|---|
| [플러그인을 Lua로 짤까 Vimscript로 짤까](/posts/neovim/2026-06-12-neovim-plugin-language-choice/) | 신규는 Lua가 표준, 단 부모 생태계가 Vimscript면 Vimscript가 자연스럽다 |
| [한 플러그인에 Lua와 Vimscript 섞기](/posts/neovim/2026-06-12-neovim-plugin-mixing-lua-vimscript/) | 호출 경계 최소화, 흔한 안티패턴, 모범 분담 |
| [Neovim 플러그인 작성 규칙 — runtimepath 관례](/posts/neovim/2026-06-12-neovim-plugin-conventions/) | runtimepath 자동 로드, `plugin/` vs `lua/`, 헬프·헬스체크·after/ |
| [직접 만든 플러그인 노출시키기 — 4가지 채널](/posts/neovim/2026-06-12-neovim-plugin-distribution/) | awesome-neovim · Dotfyle · VimAwesome · GitHub Topics |

### 런타임 API (구현 심화)

4부작이 "어떻게 배치·발행하느냐"라면, 이쪽은 "플러그인이 실제로 기능을 만드는 런타임 메커니즘"이다. `vim.*` 지도가 입구고 거기서 버퍼·이벤트·비동기 3편으로 분기한다.

| 글 | 핵심 |
|---|---|
| [vim 전역 API 지도 — vim.api vs vim.fn](/posts/neovim/2026-06-19-neovim-vim-global-api-map/) | 플러그인 코드의 `vim.*` 전체 지도. 옵션 범위·동작 호출·유틸의 갈래 |
| [버퍼·윈도우·extmark 조작](/posts/neovim/2026-06-19-neovim-buffer-window-extmark/) | scratch 버퍼·floating window·virtual text. 화면에 그리는 거의 모든 것 |
| [autocommand·이벤트 심화](/posts/neovim/2026-06-19-neovim-autocommand-events/) | augroup 중복 방지·이벤트 종류·User 공개 이벤트. 플러그인의 이벤트 구동 |
| [비동기 — vim.uv / vim.system](/posts/neovim/2026-06-19-neovim-async-vim-uv-system/) | 외부 프로세스를 UI 멈춤 없이. `vim.schedule`로 메인 루프 복귀 |

### 실전 케이스

| 글 | 핵심 |
|---|---|
| [vim-dadbod 어댑터 플러그인 만들기](/posts/neovim/2026-06-12-vim-dadbod-adapter-plugin-build/) | 4부작을 실제로 적용한 케이스. 디렉토리 골격부터 dadbod-ui 트리 통합까지 |
| [awesome-neovim에 PR 보내기 — gh CLI로 한 번에](/posts/neovim/2026-06-12-awesome-neovim-pr-walkthrough/) | CONTRIBUTING.md 규칙을 한 번에 통과시키는 절차 |
| [mini.nvim 관련 정리](/posts/neovim/2025-10-04-mininvim/) | 한 저장소에 잘 묶인 mini 시리즈를 읽으며 패턴 학습 |

### 테스트

| 글 | 핵심 |
|---|---|
| [Neovim 플러그인 테스트 방법 — plenary / mini.test / busted+nlua](/posts/neovim/2026-06-18-neovim-plugin-testing-plenary-minitest-busted/) | 헤드리스 nvim 안에서 도는 세 방식의 대중성·선택 기준 비교 |

### 직접 발행한 결과물

위 순서를 실제로 통과시켜 awesome-neovim에 올린 플러그인들. 글과 코드를 같이 보면 "이론 → 실물" 간극이 메워진다.

| 플러그인 | 무엇 | 관련 글 |
|---|---|---|
| [dadbod-vertica.nvim](https://github.com/clang-engineer/dadbod-vertica.nvim) | vim-dadbod에 Vertica 어댑터 + dadbod-ui schema-tree 통합 | [어댑터 만들기 (제작 가이드)](/posts/neovim/2026-06-12-vim-dadbod-adapter-plugin-build/) |
| [jvm-env.nvim](https://github.com/clang-engineer/jvm-env.nvim) | jdtls용 JVM(JAVA_HOME) 환경 선택. 첫 OSS 플러그인 | [발행 회고 (보강 사이클)](/posts/neovim/2026-06-17-jvm-env-nvim-publication-retrospective/) |

## 환경 세팅·운영

| 글 | 핵심 |
|---|---|
| [Neovim으로 C++ 개발 환경 세팅 (coc.nvim + clangd)](/posts/neovim/2024-04-04-neovim-cpp-setting/) | C++ 워크플로 한 세트 |

## 트러블슈팅 모음

실력 향상 흐름과 분리해서 모았다. 같은 에러를 만났을 때 검색해서 들어오는 용도.

| 영역 | 글 |
|---|---|
| 진단 도구 | [LazyVim Diagnostics 로그/메시지 확인법](/posts/lazyvim/2026-02-04-lazyvim-diagnostics/) |
| LSP | [Java LSP (jdtls) 작동 안함](/posts/lazyvim/2025-12-17-java-lsp-jdtls/) · [kotlin-language-server documentHighlight 크래시](/posts/lazyvim/2026-06-08-kotlin-language-server-document-highlight-crash/) · [kotlin-language-server가 import를 못 잡을 때 (kls_database.db 캐시)](/posts/neovim/2026-06-16-kotlin-language-server-stale-kls-database/) · [LSP가 안 붙을 때 — 헤드리스 모드로 attach 검증](/posts/neovim/2026-06-15-neovim-lsp-headless-attach-debug/) · [특정 LSP의 server_capability 한 줄로 끄기](/posts/lazyvim/2026-06-16-lazyvim-disable-lsp-server-capability/) |
| Treesitter | [kotlin 쿼리 "..<" 노드 에러 + main 브랜치 0.12 전용 함정](/posts/lazyvim/2026-05-08-nvim-treesitter-kotlin-rangeuntil-query-error/) |
| Lint | [PowerShell 프로필이 nvim-lint ktlint JSON을 깨뜨릴 때](/posts/lazyvim/2026-05-06-powershell-profile-pollutes-nvim-lint/) |
| Lazygit | [Windows에서 'e' 키 에러](/posts/lazyvim/2026-03-13-lazygit-nvim-windows-edit-error/) · [Windows에서 한글 깨짐](/posts/lazyvim/2026-03-13-nvim-lazygit-korean-broken/) |
| Dadbod | [dbout 결과창 레이아웃 커스터마이징](/posts/lazyvim/2026-05-06-vim-dadbod-dbout-layout/) · [PostgreSQL .pgpass 인증 (Windows)](/posts/lazyvim/2026-05-06-vim-dadbod-pgpass-windows/) |
| AI | [CopilotChat Model not found 에러](/posts/lazyvim/2026-06-05-copilotchat-model-not-found/) · [Copilot Business + CopilotChat "Model not found" 우회](/posts/neovim/2026-06-17-copilotchat-copilot-business-model-not-found/) |
| 윈도우·tmux | [floating window + tmux 이동/복귀 포커스](/posts/lazyvim/2026-06-08-neovim-floating-window-tmux-refocus/) |
| Swap·복구 | [Neovim swap 파일 안전하게 정리하기](/posts/neovim/2026-06-11-nvim-swap-cleanup/) |

---

본인의 현재 위치에서 가까운 단계부터 진입하면 된다. 입문자는 "어디서 시작할까"부터, LazyVim 사용자는 3단계, 플러그인 만들고 싶은 사람은 2단계 → 5단계가 자연스러운 경로다.

터미널 멀티플렉서를 함께 쓴다면 [tmux 로드맵](/posts/tmux/2026-06-16-tmux-roadmap/)도 곁에 두면 좋다. `vim-tmux-navigator`로 Neovim 창과 tmux 패널을 한 키맵으로 오가는 구성이 자연스럽다.
