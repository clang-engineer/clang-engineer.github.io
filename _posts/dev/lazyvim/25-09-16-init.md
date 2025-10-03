# LazyVim 플러그인 정리 (52개)

## 1. AI / Copilot 관련

| 플러그인               | 역할 / 목적                        | 비고                                  |
| ------------------ | ------------------------------ | ----------------------------------- |
| `CopilotChat.nvim` | Copilot Chat UI, 코드 제안 및 AI 채팅 | `<leader>aq`, `<leader>ap` 등 단축키 제공 |
| `copilot.lua`      | Copilot 백엔드 기능 제공              | BufReadPost 시 로드                    |
| `blink-copilot`    | Copilot 코드 제안 깜박임 UI           | `blink.cmp` 연동                      |
| `blink.cmp`        | Copilot + cmp UI 통합            | InsertEnter 시 로드                    |

---

## 2. LSP / 개발 편의

| 플러그인                   | 역할 / 목적                     | 비고                |
| ---------------------- | --------------------------- | ----------------- |
| `nvim-lspconfig`       | LSP 서버 설정 관리                | LazyFile 로드       |
| `mason.nvim`           | LSP / DAP / Linters 설치 및 관리 | nvim-lspconfig 연계 |
| `mason-lspconfig.nvim` | mason + lspconfig 통합        | 자동 연결 지원          |
| `snacks.nvim`          | LSP picker/UI 제공            | LSP 탐색 지원         |
| `nvim-lint`            | Linters 실행 관리               | LazyFile 로드       |

---

## 3. Git / 버전 관리

| 플러그인                    | 역할 / 목적                         |            |
| ----------------------- | ------------------------------- | ---------- |
| `gitsigns.nvim`         | 좌측 sign, blame, hunk, git 상태 표시 |            |
| `vim-dadbod`            | DB 접속 / 쿼리 실행                   |            |
| `vim-dadbod-completion` | SQL 자동완성                        |            |
| `vim-dadbod-ui`         | DB UI, buffer 관리                | Not Loaded |

---

## 4. UI / 편의

| 플러그인              | 역할 / 목적                   |
| ----------------- | ------------------------- |
| `lualine.nvim`    | 상태바 표시                    |
| `bufferline.nvim` | 버퍼 라인 / 탭 표시              |
| `which-key.nvim`  | 키맵 힌트 표시                  |
| `noice.nvim`      | 메시지/알림/command line UI 개선 |
| `nui.nvim`        | noice, 기타 UI 컴포넌트         |
| `tokyonight.nvim` | 테마                        |
| `lazy.nvim`       | LazyVim 플러그인 관리           |
| `LazyVim`         | LazyVim 코어                |

---

## 5. Editing / 편집 보조

| 플러그인                          | 역할 / 목적                 |
| ----------------------------- | ----------------------- |
| `mini.ai`                     | 텍스트 객체 확장               |
| `mini.comment`                | 주석 빠른 토글                |
| `mini.pairs`                  | 괄호/따옴표 자동 짝             |
| `ts-comments.nvim`            | Treesitter 기반 주석 처리     |
| `flash.nvim`                  | 빠른 이동 / 검색              |
| `nvim-treesitter`             | 구문 강조, 코드 이해 기반         |
| `nvim-treesitter-textobjects` | Treesitter 기반 텍스트 객체 확장 |
| `nvim-ts-autotag`             | HTML/XML 태그 자동 닫기       |
| `mini.icons`                  | UI/상태바 아이콘              |

---

## 6. Markdown / 문서

| 플러그인                   | 역할 / 목적             |
| ---------------------- | ------------------- |
| `render-markdown.nvim` | Markdown 렌더링, 하이라이트 |
| `todo-comments.nvim`   | TODO, FIXME 주석 강조   |

---

## 7. 세션 / 상태 유지

| 플러그인               | 역할 / 목적  |
| ------------------ | -------- |
| `persistence.nvim` | 세션 저장/복원 |

---

## 8. Not Loaded (Lazy Load / Optional)

| 플러그인                            | 역할 / 목적                        |
| ------------------------------- | ------------------------------ |
| `catppuccin`                    | 테마                             |
| `conform.nvim`                  | 코드 포맷터 통합 (`<leader>cF`)       |
| `grug-far.nvim`                 | Fuzzy finder 확장 (`<leader>sr`) |
| `gruvbox.nvim`                  | 테마                             |
| `lazydev.nvim`                  | Lua 개발 지원                      |
| `lazygit.nvim`                  | Git UI                         |
| `markdown-preview.nvim`         | Markdown 미리보기 (`<leader>cp`)   |
| `mason-nvim-dap.nvim`           | DAP 설치 관리                      |
| `mini.surround`                 | 텍스트 surround 관리 (`gs*`)        |
| `nvim-dap`                      | Debug Adapter Protocol         |
| `nvim-dap-ui`                   | DAP UI (`<leader>de`)          |
| `nvim-dap-virtual-text`         | DAP 디버그 가상 텍스트 표시              |
| `nvim-jdtls`                    | Java LSP                       |
| `nvim-nio`                      | DAP 관련 유틸                      |
| `nvim-ts-context-commentstring` | 파일 타입별 commentstring           |
| `plenary.nvim`                  | 공용 라이브러리 (다른 플러그인 의존)          |
| `vim-visual-multi`              | 멀티 커서 편집 (`<C-n>`)             |

---

## 🔹 요약

1. **AI / Copilot** → 코드 제안, 채팅, 자동 완성
2. **LSP / 개발 지원** → LSP, lint, picker 등
3. **Git / DB** → 버전 관리, SQL 편의
4. **UI / 상태바 / 테마** → 상태 표시, 알림, 색상, 버퍼 라인
5. **편집 보조** → 주석, 텍스트 객체, 자동 태그, 이동
6. **Markdown / 문서** → 렌더링, TODO 강조
7. **세션 / 상태 유지** → LazyVim 관리, 세션 복원
8. **Optional / Lazy Loaded** → 필요할 때만 로드되는 플러그인

---

## snacks.nvim 1.51ms  start
- <leader> + e : open exploer
- <leader> + e + / : find on exploer
- <leader> \* 2 : find file
- <leader> + / : grep text

---

## file & find

## noice

- Noice Diable로 끌 수 있다.
- vim 명령어 모드를 ui 입력창으로 보여줌

- vim 탐색기
- hl : folder 여닫기
- P : 미리보기

## snacks

- <C-h>, <C-l> :

- 줄이동 플러그인

## mini.move

## gitsigns

- editor에 git 변경된 줄 표시
- :Gitsigns <옵션>
- numhl, signs(형광표시), linehl, deleted, word_diff, current_line_blame 등

## LazyExtras

- :LazyExtras 통해서 추가 플러그인 넣을수 있다. (\*원하는 플러그인에서 <x> key)
- lang.java, lang.kotlin

아래 플러그인을 별도 추가하였다.

```
    ● ai.copilot    blink-cmp-copilot  copilot-cmp  copilot.lua  blink.cmp  lualine.nvim  nvim-cmp
    ● ai.copilot-chat  CopilotChat.nvim  edgy.nvim
    ● coding.blink  blink.cmp  friendly-snippets  blink.compat  catppuccin
    ● editor.snacks_explorer    snacks.nvim
      Snacks File Explorer
    ● editor.snacks_picker    nvim-lspconfig  snacks.nvim  alpha-nvim  dashboard-nvim  flash.nvim  mini.starter  todo-comments.nvim
      Fast and modern file picker
    ● formatting.prettier  mason.nvim  conform.nvim  none-ls.nvim
    ● linting.eslint  nvim-lspconfig

    ● lang.clangd    clangd_extensions.nvim  nvim-lspconfig  nvim-treesitter  mason.nvim  nvim-cmp  nvim-dap
    ● lang.java  mason.nvim  nvim-jdtls  nvim-lspconfig  nvim-treesitter  which-key.nvim  nvim-dap
    ● lang.json    SchemaStore.nvim  nvim-lspconfig  nvim-treesitter
    ● lang.kotlin  mason.nvim  nvim-lspconfig  nvim-treesitter  conform.nvim  none-ls.nvim  nvim-dap  nvim-lint
    ● lang.markdown    markdown-preview.nvim  mason.nvim  nvim-lspconfig  render-markdown.nvim  conform.nvim  none-ls.nvim  nvim-lint
    ● lang.typescript    mason.nvim  mini.icons  nvim-lspconfig  nvim-dap
```

## marks

- m으로 마크하고, delm + key 로 마크 삭제
- delm! 전부 삭제
- ` 누르면 마크 목록

## lazy vim default

    ● blink-cmp-copilot 0.19ms  blink.cmp
    ● blink.cmp 8.57ms  InsertEnter
    ● bufferline.nvim 2.65ms  VeryLazy
    ● copilot.lua 22.21ms  BufReadPost
    ● flash.nvim 1.1ms  VeryLazy
    ● friendly-snippets 0.23ms  blink.cmp
    ● gitsigns.nvim 10.8ms  LazyFile
    ● lazy.nvim 13.21ms  init.lua
    ● lazydev.nvim 1.78ms 󰢱 lazydev.integrations.blink  blink.cmp
    ● LazyVim 5.02ms  start
    ● lualine.nvim 8.49ms  VeryLazy
    ● mason-lspconfig.nvim 0.03ms  start
    ● mason.nvim 26.19ms  nvim-lspconfig
    ● mini.ai 0.68ms  VeryLazy
    ● mini.icons 1.32ms 󰢱 mini.icons  snacks.nvim
    ● mini.pairs 1.09ms  VeryLazy
    ● mini.surround 0.82ms  start
    ● noice.nvim 1.04ms  VeryLazy
    ● nui.nvim 0.04ms 󰢱 nui.object  noice.nvim
    ● nvim-lint 2.15ms  LazyFile
    ● nvim-lspconfig 33.11ms  LazyFile
    ● nvim-treesitter 5.66ms  VeryLazy
    ● nvim-treesitter-textobjects 1.67ms  VeryLazy
    ● nvim-ts-autotag 3.92ms  LazyFile
    ● persistence.nvim 3.65ms  BufReadPre
    ● snacks.nvim 1.51ms  start
    ● todo-comments.nvim 3.73ms  LazyFile
    ● tokyonight.nvim 3.52ms 󰢱 tokyonight  LazyVim
    ● trouble.nvim 1.08ms 󰢱 trouble  lualine.nvim
    ● ts-comments.nvim 1.45ms  VeryLazy
    ● which-key.nvim 0.6ms  VeryLazy

| 플러그인                                      | 기능                                   | 기본 단축키/키맵                                                  |
| --------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------- |
| blink-cmp-copilot                             | nvim-cmp + GitHub Copilot 자동완성     | Insert 모드: `<Tab>` / `<C-l>` 수락                               |
| blink.cmp                                     | nvim-cmp 자동완성                      | `<C-n>`/`<C-p>` 선택, `<CR>` 선택, `<Tab>`/`<S-Tab>` snippet 이동 |
| bufferline.nvim                               | 탭/버퍼 라인 시각화                    | `<leader>bp` 이전, `<leader>bn` 다음 버퍼                         |
| copilot.lua                                   | GitHub Copilot NeoVim 클라이언트       | `<C-l>` 추천 수락, `<C-]>` 다음 추천                              |
| flash.nvim                                    | 빠른 커서 이동 (jump/highlight)        | `s` 단일 이동, `S` 범위 이동                                      |
| friendly-snippets                             | 다양한 언어 snippet 제공               | `<Tab>` / `<S-Tab>` snippet 이동                                  |
| gitsigns.nvim                                 | Git diff, hunk 표시, blame, stage/undo | `]c`/`[c` 다음/이전 hunk, `<leader>hs` stage, `<leader>hb` blame  |
| lazy.nvim                                     | 플러그인 매니저                        | -                                                                 |
| lazydev.nvim                                  | LazyVim 개발용 도구                    | -                                                                 |
| LazyVim                                       | LazyVim 프레임워크                     | -                                                                 |
| lualine.nvim                                  | 상태바 표시                            | -                                                                 |
| mason-lspconfig.nvim / mason.nvim             | LSP 서버 설치/관리                     | `:Mason`                                                          |
| mini.ai                                       | 텍스트 객체 확장                       | `af`/`if` 등                                                      |
| mini.icons                                    | 아이콘 지원                            | -                                                                 |
| mini.pairs                                    | 자동 괄호/따옴표 닫기                  | -                                                                 |
| mini.surround                                 | 주변 문자 수정/삭제                    | `ysw)`, `ds"`, `cs"'`                                             |
| noice.nvim                                    | 메시지 / Cmdline UI 개선               | `<leader>cn` 메시지 창                                            |
| nui.nvim                                      | UI 컴포넌트 지원                       | -                                                                 |
| nvim-lint                                     | 실시간 코드 린팅                       | -                                                                 |
| nvim-lspconfig                                | LSP 서버 설정                          | `gd` 정의 이동, `gr` 참조 찾기, `K` hover                         |
| nvim-treesitter / nvim-treesitter-textobjects | 문법 기반 하이라이트, 텍스트 객체      | `af`/`if` 등                                                      |
| nvim-ts-autotag                               | HTML/XML 자동 태그 닫기                | -                                                                 |
| snacks.nvim                                   | LazyVim 유틸 모음                      | Snacks Explorer: `h/l` 접기/열기, `j/k` 이동, `<CR>` 열기         |
| persistence.nvim                              | 세션 저장/복원                         | -                                                                 |
| todo-comments.nvim                            | TODO/FIXME 주석 하이라이트             | `<leader>st` TODO 목록 보기                                       |
| tokyonight.nvim                               | 컬러 테마                              | -                                                                 |
| trouble.nvim                                  | LSP / Diagnostics 리스트 보기          | `<leader>xx` 열기, `<leader>xw` workspace diagnostics             |
| ts-comments.nvim                              | Treesitter 기반 주석 처리              | `gcc`, `gc`                                                       |
| which-key.nvim                                | 키 힌트 팝업                           | `<leader>`                                                        |

## colorscheme

- :Lazy load gruvbox -> colorscheme gruvbox : 플러그인 추가로드 후 변경


## lazygit

- lazygit 설치 &

```
brew isntall lazygit
```

- lazygit plugin 설치

```
-- nvim v0.8.0
return {
  "kdheepak/lazygit.nvim",
  lazy = true,
  cmd = {
    "LazyGit",
    "LazyGitConfig",
    "LazyGitCurrentFile",
    "LazyGitFilter",
    "LazyGitFilterCurrentFile",
  },
  -- optional for floating window border decoration
  dependencies = {
    "nvim-lua/plenary.nvim",
  },
  -- setting the keybinding for LazyGit with 'keys' is recommended in
  -- order to load the plugin when the command is run for the first time
  keys = {
    { "<leader>lg", "<cmd>LazyGit<cr>", desc = "LazyGit" },
  },
}
```

## mason tyscript-language-server 설치

- :MasonInstall typescript-language-server
- :MasonInstall jdtls

### shortcut

| 단축키       | 명령                                 | 설명                                                      |
| ------------ | ------------------------------------ | --------------------------------------------------------- |
| `gD`         | `typescript.goToSourceDefinition`    | 커서 심볼의 **소스 정의**로 점프 (Declaration/Definition) |
| `gR`         | `typescript.findAllFileReferences`   | 현재 파일 내에서 심볼 **모든 참조 검색**                  |
| `<leader>co` | `source.organizeImports`             | 현재 파일 **import 정리**                                 |
| `<leader>cM` | `source.addMissingImports.ts`        | 누락된 TypeScript import **자동 추가**                    |
| `<leader>cu` | `source.removeUnused.ts`             | 사용하지 않는 import/변수 **제거**                        |
| `<leader>cD` | `source.fixAll.ts`                   | TypeScript 관련 **모든 diagnostics 자동 수정**            |
| `<leader>cV` | `typescript.selectTypeScriptVersion` | **TS workspace 버전 선택**                                |

## keywordprg

shift + k 하면 함수정의 미리보기

## ktlint

= ~/.local/state/nvim/conform.log 에서 메시지 확인 복사 가능

## coding.mini-comment

- gc : 주석 toggle

## snack - <leader> + e

- P : toggle Preview
- Z : close all folds
- H : toggle hidden files
- I : toggle .files(ignore)
- l : confirm
- . : focus current file on explorer
- <C-v> : vertical split
- <C-s> : horizontal split
- <C-a> : select all
- <C-F> : preview scroll down
- <C-B> : preview scroll up
- i : 검색창 focus
- / : toggle focus
- ? : toggle help




## RenderMarkdown
- RenderMarkdown plugin은 lazyvim설정에 기본적으로 활성화 되어있다.
- 아래와 같이 기본 비활성화 후, :RenderMarkdown toggle 명령어로 활성화/비활성화 가능
```lua
-- ~/.config/nvim/lua/plugins/render-markdown.lua
return {
  {
    "MeanderingProgrammer/render-markdown.nvim",
    opts = {
      enabled = false,
    },
  },
}
```

