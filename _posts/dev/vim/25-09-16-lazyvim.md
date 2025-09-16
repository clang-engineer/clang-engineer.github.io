insert, normal, command, visual

## general
- s 대신 c를 사용한다.
- 기본 s -> cl
- gc: 주석 
- space + u + conceal level 끄자

```sh
Ctrl+h        select file tree
Ctrl+l        select file editor
Shift+h       left editor tab
Shift+l       right editor tab
Alt+j         move current line up
Alt+k         move current line down
double space  filename search(telescope) - `Ctrl+d` and `Ctrl+u` to scroll preview
gg=G          reindent - gg goes to the top of the file, = fixes the indentation and G to perform to the end
gc            comment selected(`gcgc` no select to uncomment block)
%             jump to other bracket of the current block
_             jump to the first non blank char on the line
$             jump to the last non blank char on the line
0             jump to the start of the line
\text         seach for text, `n` for next occurence, `N` for previous
f"            find first `"`, jump to it with right arrow
ci"           delete and start editing inside of the next string literal
vi"           select inside of the next string literal
viw           select current word
di"           delete inside of the next string literal
u             undo
Ctrl+r        redo
ma            set local mark `a`
mA            set global mark `A`
`             list marks
`a            go to mark `a`
```


## shortcut

### file & find
- space + e : open exploer
- space * 2 : find file
- space + / : grep text

## noice
- vim 명령어 모드를 ui 입력창으로 보여줌
- Noice Diable로 끌 수 있다.

## snacks
- vim 탐색기
- hl : folder 여닫기
- P : 미리보기
- <C-j>, <C-k> : 

## mini.move
- 줄이동 플러그인

## gitsigns
- editor에 git 변경된 줄 표시

## LazyExtras
- :LazyExtras 통해서 추가 플러그인 넣을수 있다. (*원하는 플러그인에서 <x> key)

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

| 플러그인 | 기능 | 기본 단축키/키맵 |
|----------|------|----------------|
| blink-cmp-copilot | nvim-cmp + GitHub Copilot 자동완성 | Insert 모드: `<Tab>` / `<C-l>` 수락 |
| blink.cmp | nvim-cmp 자동완성 | `<C-n>`/`<C-p>` 선택, `<CR>` 선택, `<Tab>`/`<S-Tab>` snippet 이동 |
| bufferline.nvim | 탭/버퍼 라인 시각화 | `<leader>bp` 이전, `<leader>bn` 다음 버퍼 |
| copilot.lua | GitHub Copilot NeoVim 클라이언트 | `<C-l>` 추천 수락, `<C-]>` 다음 추천 |
| flash.nvim | 빠른 커서 이동 (jump/highlight) | `s` 단일 이동, `S` 범위 이동 |
| friendly-snippets | 다양한 언어 snippet 제공 | `<Tab>` / `<S-Tab>` snippet 이동 |
| gitsigns.nvim | Git diff, hunk 표시, blame, stage/undo | `]c`/`[c` 다음/이전 hunk, `<leader>hs` stage, `<leader>hb` blame |
| lazy.nvim | 플러그인 매니저 | - |
| lazydev.nvim | LazyVim 개발용 도구 | - |
| LazyVim | LazyVim 프레임워크 | - |
| lualine.nvim | 상태바 표시 | - |
| mason-lspconfig.nvim / mason.nvim | LSP 서버 설치/관리 | `:Mason` |
| mini.ai | 텍스트 객체 확장 | `af`/`if` 등 |
| mini.icons | 아이콘 지원 | - |
| mini.pairs | 자동 괄호/따옴표 닫기 | - |
| mini.surround | 주변 문자 수정/삭제 | `ysw)`, `ds"`, `cs"'` |
| noice.nvim | 메시지 / Cmdline UI 개선 | `<leader>cn` 메시지 창 |
| nui.nvim | UI 컴포넌트 지원 | - |
| nvim-lint | 실시간 코드 린팅 | - |
| nvim-lspconfig | LSP 서버 설정 | `gd` 정의 이동, `gr` 참조 찾기, `K` hover |
| nvim-treesitter / nvim-treesitter-textobjects | 문법 기반 하이라이트, 텍스트 객체 | `af`/`if` 등 |
| nvim-ts-autotag | HTML/XML 자동 태그 닫기 | - |
| persistence.nvim | 세션 저장/복원 | - |
| snacks.nvim | LazyVim 유틸 모음 | Snacks Explorer: `h/l` 접기/열기, `j/k` 이동, `<CR>` 열기 |
| todo-comments.nvim | TODO/FIXME 주석 하이라이트 | `<leader>st` TODO 목록 보기 |
| tokyonight.nvim | 컬러 테마 | - |
| trouble.nvim | LSP / Diagnostics 리스트 보기 | `<leader>xx` 열기, `<leader>xw` workspace diagnostics |
| ts-comments.nvim | Treesitter 기반 주석 처리 | `gcc`, `gc` |
| which-key.nvim | 키 힌트 팝업 | `<leader>` |
