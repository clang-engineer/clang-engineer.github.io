---
title       : "Neovim 실력 향상 로드맵 — vim·neovim·lazyvim 글을 어떤 순서로 읽을까"
description : "입문(계층 이해) → 편집 기본기 → 언어(Lua·Vimscript) → LazyVim 구조 → 플러그인 개발을 하나의 학습 줄기로 세우고, 이 블로그의 neovim/lazyvim 글을 그 순서로 큐레이션. 플러그인을 만들지 않을 사람은 3단계에서 완결되고, 4단계부터는 만들 사람만 들어오면 된다. 비교·생태계, 프로젝트·언어별 환경 설정, 트러블슈팅은 학습 단계가 아닌 별도 축의 부록으로 분리."
date        : 2026-06-16 23:00:00 +0900
updated     : 2026-07-08 10:00:00 +0900
categories  : [neovim, "개요·인덱스"]
tags        : [roadmap, vim, lua, lazyvim]
pin         : false
hidden      : false
---

이 블로그에는 neovim·lazyvim 디렉토리에 걸쳐 50여 편의 Neovim 글이 있다. 처음 들어온 사람이 길을 잃지 않도록, "어떤 순서로 읽으면 실력이 올라가는지"를 하나의 **학습 줄기**로 묶었다 — 입문(계층 이해)에서 출발해 편집 기본기 → 언어(Lua·Vimscript) → LazyVim 구조 → 플러그인 개발로 올라간다. 본인 위치에서 가까운 단계부터 진입하면 된다.

한 가지만 미리: **플러그인을 만들지 않을 사람은 3단계(LazyVim 구조)에서 완결된다.** 4단계 "플러그인 개발"은 사다리의 윗칸이 아니라, *만들려는 사람만* 들어오는 갈림길이다. 그래서 표와 본문에 그 지점을 표시해 뒀다.

실력 진행과 **결이 다른 축** — 옆 도구와의 비교·생태계, 프로젝트·언어별 환경 설정, 트러블슈팅 — 은 아래 **부록**으로 분리했다. 단계가 아니라, 해당 상황을 만났을 때 직행하는 다른 축이다.

## 한눈에 보기

입문 → 1 → 2 → 3단계가 "잘 쓰는" 큰 줄기, 4단계가 "만드는" 갈림길이다.

| 구역 | 답하는 질문 | 성격 |
|---|---|---|
| 입문 | Vim·Neovim·배포판이 뭐가 다른가 | 학습 전제 |
| 1단계 — 편집 기본기 | 모션·레지스터로 빠르게 편집 | 줄기 |
| 2단계 — 언어 (Lua·Vimscript) | 설정·플러그인을 고칠 언어 | 줄기 |
| 3단계 — LazyVim 구조 이해 | spec merge·extras override로 알고 고치기 | 줄기 |
| 4단계 — 플러그인 개발 | 런타임 API·구조·발행·테스트 | 줄기 · **만들 사람만** |
| 부록 A | 비교·생태계 — 옆 도구와 경계 긋기 | 다른 축 |
| 부록 B | 프로젝트·언어별 환경 설정 | 필요할 때 |
| 부록 C | 트러블슈팅 모음 | 다른 축 |

## 입문 — 어디서 시작할까

Vim/Neovim/배포판이 헷갈린다면, 먼저 셋의 관계부터 잡자.

| 글 | 핵심 |
|---|---|
| [Vim vs Neovim vs 배포판 — 각 계층이 제공하는 기능](/posts/neovim/2026-06-08-vim-neovim-lazyvim-feature-layers/) | "이 기능이 어디서 온 건지" 정리. 가장 먼저 읽기 좋은 한 장 |
| [Neovim을 어디서 시작할까 — Vanilla / kickstart.nvim / LazyVim 비교](/posts/neovim/2026-06-16-neovim-starting-point-comparison/) | 세 시작점의 학습 곡선·추천 맥락 + LazyVim·NvChad·AstroNvim distro 카탈로그. "어디서 출발할지" 결정용 |
| [Vim & Neovim 작동 원리 정리](/posts/neovim/2025-10-04-vim-core-engine/) | 모드·버퍼·윈도우·탭, 명령 파이프라인 — 모든 글의 전제 |

## 1단계 — 편집 기본기

Vim의 진짜 심장은 모션·오퍼레이터·텍스트오브젝트로 편집을 "문장처럼" 조합하는 것이다. LazyVim을 쓰더라도 이 층은 그대로 깔려 있으니, 결국 한 번은 통과해야 한다.

| 글 | 핵심 |
|---|---|
| [Vim/Neovim 레지스터 정리](/posts/neovim/2025-09-24-vim-register/) | `y`/`d`/`c`/`p`가 거치는 저장소들. 명명·익명·블랙홀 레지스터 |

> 📎 **치트시트** · [vim](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/vim.md) — 모드별 명령어·모션·오퍼레이터 빠른 참조 (GitHub)
{: .prompt-tip }

> **빈칸 고지 — 편집 기본기 본체는 이 블로그에 아직 없다.** hjkl·모션·오퍼레이터·텍스트오브젝트·dot-repeat·매크로 — Vim 편집의 심장에 전용 글이 없다. 이 로드맵은 그 자리를 다른 글로 메우지 않고 비워 둔다. 당장은 `vimtutor`나 *Practical Vim*으로 채우고, 위 레지스터 글은 그 위에 얹는 보강으로 읽으면 된다.
{: .prompt-warning }

## 2단계 — 언어 (Lua와 Vimscript)

Neovim 설정·플러그인을 "고칠 수 있는" 수준이 되려면 Lua는 피할 수 없다. 시리즈 4부작 + 성능 1편으로 구성했다. [Lua 종합 가이드](/posts/neovim/2026-06-15-lua-syntax-guide/)가 hub고, 거기서 심화 3편으로 분기한다. (Vimscript 갈래를 택할 거라면 아래 두 글을 함께.)

> **설정만 할 거면 여기서 깊이 들어가지 않아도 된다.** LazyVim을 고치는 데 필요한 Lua는 **테이블·`require` 수준**이면 충분하다. 문법 가이드와 모듈까지만 훑고 바로 3단계로 가도 된다. 메타테이블·에러 처리는 플러그인을 직접 짤 때(4단계) 다시 와서 떼면 늦지 않다.
{: .prompt-info }

| 글 | 핵심 |
|---|---|
| [Lua 종합 가이드 (Neovim 컨텍스트)](/posts/neovim/2026-06-15-lua-syntax-guide/) | LuaJIT(5.1) 기준 문법 한 번에 정리. 타입·스코프·테이블·문자열 패턴·`vim.*` 헬퍼 |
| [Lua 모듈](/posts/neovim/2026-06-15-lua-modules/) | `require`/`package.path`, `local M = {} return M` 패턴, Neovim `lua/` 자동 등록과의 연결 |
| [Lua 메타테이블](/posts/neovim/2026-06-15-lua-metatables/) | `__index`/`__newindex`/`__call`, OOP 클래스 패턴, `vim.opt`가 일반 테이블처럼 보이는 이유 |
| [Lua 에러 처리](/posts/neovim/2026-06-15-lua-error-handling/) | `error`/`assert`로 던지고 `pcall`/`xpcall`로 잡기. Neovim 플러그인의 에러 관행 |
| [Lua vs Vimscript 성능](/posts/neovim/2026-06-12-neovim-lua-vs-vimscript-performance/) | 정량 차이와 실제 체감되는 영역. "그냥 Lua가 빠르다"보다 한 단계 깊은 이해 |
| [Vimscript 종합 가이드 (legacy)](/posts/neovim/2026-06-15-vimscript-syntax-guide/) | Vim 8 legacy 기준 문법 — 타입·스코프 prefix·비교 함정·함수/람다·List/Dict. Vimscript 플러그인·기존 코드를 읽어야 할 때 |
| [Learn Vimscript the Hard Way 핵심 정리](/posts/neovim/2024-09-15-learn-vimscript-the-hard-way/) | Steve Losh 책 55챕터에서 실전에 남는 핵심만. 한 장짜리 reference |

## 3단계 — LazyVim 구조 이해

LazyVim을 "그냥 쓰는" 단계에서 "어떻게 동작하는지 알고 고치는" 단계로. 이걸 모르면 extras override·spec merge에서 매번 막힌다. **플러그인을 만들 생각이 없다면 여기까지가 완결이다.**

| 글 | 핵심 |
|---|---|
| [LazyVim 주요 플러그인 정리](/posts/lazyvim/2026-06-07-lazyvim-plugins-overview/) | UI/편집/Git/진단/LSP 각 영역에 어떤 플러그인이 들어가 있는지 |
| [LazyVim 기능 지도](/posts/lazyvim/2026-06-07-lazyvim-feature-plugin-map/) | 각 기능 영역(Git·검색·LSP·완성·DAP)이 어떤 플러그인 묶음으로 만들어지는지, snacks.nvim의 hub 역할 |
| [lazy.nvim 플러그인 spec 필드 완전 정리](/posts/lazyvim/2026-06-19-lazy-nvim-plugin-spec-fields/) | `lazy`·`keys`·`cmd`·`ft`·`priority`(로드 트리거), `init`·`opts`·`config`(로드 시 동작), `dependencies`·`optional`·`branch`(관계)를 실행 순서와 함께. spec merge를 읽기 전에 필드부터 |
| [LazyVim 의존성 계층 — spec merge](/posts/lazyvim/2026-06-07-lazyvim-spec-merge-and-dependency-layers/) | lazy.nvim → core → extras → 사용자 plugin이 합쳐지는 순서 |
| [LazyVim extra의 spec에 의존성만 보강하기](/posts/lazyvim/2026-05-07-lazyvim-extra-override-merge-deps/) | 같은 이름으로 다시 작성해 `dependencies`만 머지하는 패턴 |
| [Which-Key Keymaps 정리](/posts/lazyvim/2025-10-04-whichkey/) | LazyVim 기본 키맵 그룹의 전체 지도 |
| [LazyVim `<leader>x` — Trouble 기반 코드 문제 탐색](/posts/lazyvim/2026-05-04-lazyvim-leader-x-trouble/) | Diagnostics/Quickfix/Location List/Todo를 Trouble UI로 통합 |
| [LazyVim의 Git 플러그인 구성](/posts/lazyvim/2026-06-09-lazyvim-git-plugins/) | gitsigns · lazygit · snacks 3축 |

> 📎 **치트시트** · [lazyvim](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/lazyvim.md) · [lazygit](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/lazygit.md) — LazyVim 키맵 / lazygit TUI 단축키 (GitHub)
{: .prompt-tip }

> **경계 — IDE 기능 레이어는 이 줄기가 직접 가르치지 않는다.** LSP 설정 기초·자동완성/스니펫·DAP(디버깅)·Treesitter는 학습 단계로 두지 않았다. LazyVim이 이 넷을 기본값으로 얹어 주므로, [기능 지도](/posts/lazyvim/2026-06-07-lazyvim-feature-plugin-map/)에서 "어떤 플러그인이 담당하나"만 확인하고 실제 사용은 기본값에 맡기는 구성이다. 다만 그 LSP 레이어가 실제로 **어떻게 물려 도는지**(mason·lspconfig·vim.lsp의 시점 분리)를 한 장으로 잡아 두면, 설정을 직접 안 만지더라도 "LSP가 안 될 때 어느 층 문제인지"를 짚을 수 있다 → [Neovim LSP 3계층 — mason·lspconfig·vim.lsp는 '언제' 일하는가](/posts/neovim/2026-07-08-neovim-lsp-three-layers-mason-lspconfig-vimlsp/). 밑바닥부터 직접 설정·이해할 일이 생기면 이 글과 부록 C의 LSP·Treesitter 항목으로 직행하면 된다. (직접 손보는 유일한 예외가 언어별 환경 설정 — 부록 B.)
{: .prompt-info }

---

## 4단계 — 플러그인 개발

> **여기부터는 플러그인을 직접 만들 사람만.** "Neovim 사용자"에서 "생태계 기여자"로 넘어가는 갈림길이다. 앞의 1~3단계와 달리 위아래 실력 순서가 아니라 목적이 다른 갈래다. 편집 기본기와 Lua만 되어 있으면 바로 들어와도 된다 — 빈 디렉토리에서 awesome-neovim 등록까지 올리는 실제 흐름을, 런타임 API → 구조·발행 → 테스트·실전 순으로 묶었다.
{: .prompt-warning }

### 런타임 API (구현 심화)

플러그인이 실제로 기능을 만드는 런타임 메커니즘이다. `vim.*` 지도가 입구고 거기서 버퍼·이벤트·비동기 3편으로 분기한다.

| 글 | 핵심 |
|---|---|
| [vim 전역 API 지도 — vim.api vs vim.fn](/posts/neovim/2026-06-19-neovim-vim-global-api-map/) | 플러그인 코드의 `vim.*` 전체 지도. 옵션 범위·동작 호출·유틸의 갈래 |
| [버퍼·윈도우·extmark 조작](/posts/neovim/2026-06-19-neovim-buffer-window-extmark/) | scratch 버퍼·floating window·virtual text. 화면에 그리는 거의 모든 것 |
| [autocommand·이벤트 심화](/posts/neovim/2026-06-19-neovim-autocommand-events/) | augroup 중복 방지·이벤트 종류·User 공개 이벤트. 플러그인의 이벤트 구동 |
| [비동기 — vim.uv / vim.system](/posts/neovim/2026-06-19-neovim-async-vim-uv-system/) | 외부 프로세스를 UI 멈춤 없이. `vim.schedule`로 메인 루프 복귀 |

`vim.*`를 손에 익혔다면 한 층 더 내려가 볼 수 있다 — 이 헬퍼들이 실제로 무엇을 호출하는지.

| 글 | 핵심 |
|---|---|
| [vim.api 아래층 — nvim_* API·MessagePack-RPC·LuaJIT](/posts/neovim/2026-07-03-neovim-api-rpc-luajit/) | `vim.api`는 통로일 뿐. 진짜 API인 언어중립 `nvim_*` 집합, 그 아래 **MessagePack-RPC** 계층과 C 코어, Neovim이 Lua를 돌리는 **LuaJIT**의 정체까지. 원격 플러그인·RPC 클라이언트를 이해하는 토대 |

### 구조·발행

플러그인 하나를 빈 디렉토리에서 awesome-neovim 등록까지 올리는 실제 순서.

1. **언어 결정** — Lua/Vimscript 택
2. **골격 잡기** — runtimepath 관례대로 `plugin/` vs `lua/` 배치
3. **구현** — 필요하면 Lua·Vimscript 혼용 경계 최소화
4. **테스트** — plenary / mini.test / busted 중 택1 (아래 테스트 파트)
5. **문서화** — `panvimdoc`로 README를 `:help`로 변환 → [vimdoc 작성](/posts/neovim/2026-06-19-neovim-plugin-vimdoc-panvimdoc/) (awesome-neovim 등록 요건)
6. **노출 채널 결정** — awesome-neovim · Dotfyle · VimAwesome · GitHub Topics
7. **awesome-neovim 등록** — gh CLI로 PR

| 글 | 핵심 |
|---|---|
| [플러그인을 Lua로 짤까 Vimscript로 짤까](/posts/neovim/2026-06-12-neovim-plugin-language-choice/) | 신규는 Lua가 표준, 단 부모 생태계가 Vimscript면 Vimscript가 자연스럽다 |
| [한 플러그인에 Lua와 Vimscript 섞기](/posts/neovim/2026-06-12-neovim-plugin-mixing-lua-vimscript/) | 호출 경계 최소화, 흔한 안티패턴, 모범 분담 |
| [Neovim 플러그인 작성 규칙 — runtimepath 관례](/posts/neovim/2026-06-12-neovim-plugin-conventions/) | runtimepath 자동 로드, `plugin/` vs `lua/`, 헬프·헬스체크·after/ |
| [Neovim 플러그인 vimdoc 작성 — panvimdoc](/posts/neovim/2026-06-19-neovim-plugin-vimdoc-panvimdoc/) | README를 `:help`로 변환. awesome-neovim 등록 요건 |
| [직접 만든 플러그인 노출시키기 — 4가지 채널](/posts/neovim/2026-06-12-neovim-plugin-distribution/) | awesome-neovim · Dotfyle · VimAwesome · GitHub Topics |

### 테스트·실전

| 글 | 핵심 |
|---|---|
| [Neovim 플러그인 테스트 방법 — plenary / mini.test / busted+nlua](/posts/neovim/2026-06-18-neovim-plugin-testing-plenary-minitest-busted/) | 헤드리스 nvim 안에서 도는 세 방식의 대중성·선택 기준 비교 |
| [vim-dadbod 어댑터 플러그인 만들기](/posts/neovim/2026-06-12-vim-dadbod-adapter-plugin-build/) | 위 흐름을 실제로 적용한 케이스. 디렉토리 골격부터 dadbod-ui 트리 통합까지 |
| [awesome-neovim에 PR 보내기 — gh CLI로 한 번에](/posts/neovim/2026-06-12-awesome-neovim-pr-walkthrough/) | CONTRIBUTING.md 규칙을 한 번에 통과시키는 절차 |
| [mini.nvim 관련 정리](/posts/neovim/2025-10-04-mininvim/) | 한 저장소에 잘 묶인 mini 시리즈를 읽으며 패턴 학습 |

위 흐름을 실제로 통과시켜 awesome-neovim에 올린 플러그인들. 글과 코드를 같이 보면 "이론 → 실물" 간극이 메워진다.

| 플러그인 | 무엇 | 관련 글 |
|---|---|---|
| [dadbod-vertica.nvim](https://github.com/clang-engineer/dadbod-vertica.nvim) | vim-dadbod에 Vertica 어댑터 + dadbod-ui schema-tree 통합 | [어댑터 만들기 (제작 가이드)](/posts/neovim/2026-06-12-vim-dadbod-adapter-plugin-build/) |
| [jvm-env.nvim](https://github.com/clang-engineer/jvm-env.nvim) | jdtls용 JVM(JAVA_HOME) 환경 선택. 첫 OSS 플러그인 | [발행 회고 (보강 사이클)](/posts/neovim/2026-06-17-jvm-env-nvim-publication-retrospective/) |

---

## 부록 A — 비교·생태계 (다른 축)

어느 단계도 아닌 **다른 축**이다. 옆 도구와의 비교 — "이 도구가 대체 뭐랑 다른 거지"를 짚어 두면 선택이 명확해진다. 겹쳐 보이는 도구의 **경계선**을 긋는 글들.

| 글 | 핵심 |
|---|---|
| [Telescope vs fzf — 퍼지 파인더의 경계선](/posts/neovim/2026-07-03-telescope-vs-fzf/) | fzf는 Neovim 없이도 도는 **독립 Go 바이너리**, Telescope는 Neovim API에 얹힌 **순수 Lua 플러그인**. "둘 다 파일 검색된다"는 겹치는 기능 하나일 뿐, 어디서 도느냐가 본질 |
| [LazyVim 사용자가 본 Emacs — 에디터가 아니라 Elisp 런타임](/posts/neovim/2026-07-03-neovim-user-view-of-emacs/) | 차이는 단축키가 아니라 "에디터를 무엇으로 보느냐". evil-mode, Doom=설정 레이어 vs Neovim=포크, magit/org-mode/런타임 리프로그래밍, 생태계 규모까지 |

## 부록 B — 프로젝트·언어별 환경 설정 (필요할 때)

글로벌 설정은 척추(3단계)에서 다뤘고, 여기는 "특정 프로젝트·언어에 맞춰 별도로 손보는" 축이다. 해당 상황이 생겼을 때 찾아 들어오면 된다.

| 글 | 핵심 |
|---|---|
| [Neovim 프로젝트별 로컬 설정 가이드 — exrc · .nvim.lua · trust](/posts/neovim/2026-06-15-neovim-exrc-nvim-lua-guide/) | dotfiles 글로벌 설정 위에 프로젝트마다 다르게 얹기. Neovim 0.9+ exrc 동작·검색 파일명·trust 시스템·함정 한 번에 |
| [Neovim으로 C++ 개발 환경 세팅 (coc.nvim + clangd)](/posts/neovim/2024-04-04-neovim-cpp-setting/) | 언어별 개발 환경 예시. coc.nvim 기반 C++ 워크플로 한 세트(초기 글이라 네이티브 LSP 이전 접근) |

## 부록 C — 트러블슈팅 모음 (다른 축)

척추 흐름과 분리해서 모았다. 같은 에러를 만났을 때 검색해서 들어오는 용도.

| 영역 | 글 |
|---|---|
| 프로젝트 설정 | [Windows에서 Dotfiles의 Neovim 설정 연결하기](/posts/neovim/2026-01-07-window-neovim/) — Windows dotfiles 연결 시 경로 함정 |
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

본인 위치에 따라:

- **Vim/Neovim/배포판이 헷갈린다면** 입문 세 글로 계층부터.
- **잘 쓰고 싶다면** 1단계 편집 기본기 → 2단계 언어 → 3단계 LazyVim 구조. 여기서 완결된다.
- **LazyVim만 쓰고 있었다면** 3단계 "LazyVim 구조 이해"로 바로 (설정에 필요한 Lua는 2단계에서 문법·모듈까지만).
- **플러그인을 만들고 싶다면** 4단계 — 런타임 API → 구조·발행 → 테스트·실전. 1~3단계를 다 거치지 않아도, 편집 기본기와 Lua만 되어 있으면 된다.

그다음은 상황껏 — 옆 도구와 견주고 싶으면 부록 A, 프로젝트·언어별로 환경을 손봐야 하면 부록 B, 에러에 막히면 부록 C로 직행하면 된다. 터미널 멀티플렉서를 함께 쓴다면 [tmux 로드맵](/posts/tmux/2026-06-16-tmux-roadmap/)도 곁에 두면 좋다. `vim-tmux-navigator`로 Neovim 창과 tmux 패널을 한 키맵으로 오가는 구성이 자연스럽다.
