---
title       : "Neovim 플러그인 작성 규칙 — runtimepath 디렉토리 관례 정리"
description : "Vim 시절부터 이어진 runtimepath 자동 로드 규칙, Lua 추가분, plugin/ vs lua/ 역할 분리, 헬프·헬스체크·after/ 관례까지."
date        : 2026-06-12 18:00:00 +0900
updated     : 2026-06-17 22:00:00 +0900
categories  : [neovim, "플러그인·생태계"]
tags        : [plugin, lua, lazy-nvim, lazyvim]
pin         : false
hidden      : false
---

Neovim 플러그인을 만들려고 보면 "어디에 어떤 파일을 두면 자동으로 로드되는지"부터 막힌다. 사실 Vim 시절부터 이어진 **runtimepath 디렉토리 규약**과 **`require("name").setup(opts)` 관례** 두 가지가 핵심이고, 나머지(가드·헬프·헬스체크)는 "있으면 좋은" 관례다. 이 글은 그 규칙을 한 장으로 정리한다.

## 결론 먼저

- 디렉토리 이름이 곧 로드 방식이다 (`plugin/`은 자동, `lua/`는 require, `ftplugin/`은 파일타입별 ...).
- 엔트리포인트(`plugin/`)와 로직(`lua/`)을 분리하는 게 관례.
- `require("foo").setup(opts)` 패턴이 사실상 표준.
- LazyVim은 별도 플러그인 시스템이 아니라 lazy.nvim spec일 뿐, 일반 Neovim 플러그인을 그대로 등록한다.

## 디렉토리 규칙 (runtimepath 자동 로드)

| 디렉토리 | 역할 | 로드 시점 |
| --- | --- | --- |
| `plugin/*.{vim,lua}` | 플러그인 본체. 커맨드/오토커맨드 등록 | **시작 시 자동** |
| `lua/<name>/*.lua` | `require("name")`로 불러올 모듈 | **명시적 require 시** |
| `autoload/*.vim` | Vimscript 지연 로드 (`name#func()` 호출 시) | 함수 호출 시 |
| `ftplugin/<ft>.{vim,lua}` | 파일타입별 설정 | 해당 파일타입 열 때 |
| `syntax/<ft>.{vim,lua}` | 구문 강조 | 파일타입 감지 시 |
| `indent/<ft>.{vim,lua}` | 들여쓰기 규칙 | 파일타입 감지 시 |
| `colors/*.{vim,lua}` | 컬러스킴 | `:colorscheme` 호출 시 |
| `queries/<lang>/*.scm` | Tree-sitter 쿼리 | TS 파서 로드 시 |
| `doc/*.txt` | 헬프 문서 (`:helptags` 필요) | `:help` 호출 시 |
| `after/<위 디렉토리>` | 기본 로드 **이후** 실행 (오버라이드용) | 각 디렉토리 규칙 후 |

`lua/`, `queries/`, `:checkhealth` 프로토콜은 Neovim 전용이고, 나머지는 Vim에서 그대로 이어진 규약이다.

### 강제 vs 관례 — 헷갈리지 말 것

위 표의 디렉토리 규칙은 **Neovim이 강제하는 진짜 룰**이다 (`autoload/`는 Vimscript `foo#bar()` 호출 메커니즘이 그 위치에서만 동작하고, `lua/`는 `require()`가 그 경로만 인식한다).

반면 아래 다룰 "plugin/ vs lua/ 분리", "`setup(opts)` 패턴", "가드·헬스체크·헬프" 등은 **커뮤니티 관례**다. 안 지켜도 플러그인은 동작한다. 다만 다른 사람이 읽기 어려워지고 lazy.nvim 같은 매니저의 편의가 깨질 뿐이다.

### 파일 확장자 — `.vim` 또는 `.lua` 만

Neovim이 인식하는 코드 파일 확장자는 두 가지다.

- `*.vim` → Vimscript
- `*.lua` → Lua

**`*.nvim` 파일은 존재하지 않는다.** GitHub 레포명에 자주 보이는 `xxx.nvim`(예: `telescope.nvim`, `lazy.nvim`)은 **레포 이름 컨벤션**일 뿐 코드와 무관하다. 레포를 깔보면 안은 `.vim` 또는 `.lua` (또는 둘 혼합)이다.

## 표준 디렉토리 골격

```
my-plugin/
├── lua/
│   └── my-plugin/
│       ├── init.lua      -- M.setup(opts) 진입점
│       ├── config.lua
│       └── health.lua    -- :checkhealth my-plugin
├── plugin/
│   └── my-plugin.lua     -- 시작 시 자동 로드 (커맨드/오토커맨드 등록)
├── doc/
│   └── my-plugin.txt
└── README.md
```

`lua/`, `plugin/`, `doc/`, `ftplugin/` 등은 모두 **repo root의 형제(sibling) 위치**다. `lua/<name>/` 안에 `doc/`나 `plugin/`을 중첩시키면 runtimepath가 인식하지 못한다 — 흔한 함정 (자세한 건 다음 절 "흔한 함정" 참고).

## 여러 플러그인은 어떻게 합쳐지나 — runtimepath 머지 모델

위 골격은 **한 플러그인의 모습**이고, 실제 환경에는 그런 골격을 가진 repo가 수십 개 동시에 올라가 있다. Neovim은 어떻게 그걸 합쳐서 하나의 환경으로 만드는가.

### rtp는 디렉토리 리스트, 각 항목이 독립적으로 같은 구조를 가짐

`:set runtimepath?`를 찍으면 대략 이런 구조가 보인다.

```
~/.config/nvim/                              -- 개인 config
~/.local/share/nvim/lazy/lazy.nvim/          -- 플러그인 매니저
~/.local/share/nvim/lazy/LazyVim/            -- LazyVim 본체
~/.local/share/nvim/lazy/snacks.nvim/        -- 설치된 플러그인 1
~/.local/share/nvim/lazy/telescope.nvim/     -- 설치된 플러그인 2
~/.local/share/nvim/lazy/<수십개>/           -- ...
/opt/homebrew/share/nvim/runtime/            -- Neovim 내장 ($VIMRUNTIME)
~/.config/nvim/after/                        -- 덮어쓰기용 (역순 마지막)
```

**각 항목이 독립적으로 자기만의 `plugin/`, `doc/`, `ftplugin/`, `lua/`, `colors/`, `autoload/`를 가질 수 있다.** Neovim은 모두 순회하며 카테고리별로 합쳐서 처리한다.

### 같은 카테고리는 모두 실행 — guard가 필요한 진짜 이유

| 카테고리 | 다중 존재 시 동작 |
| --- | --- |
| `plugin/*.lua` | 모든 rtp의 `plugin/`을 합쳐서 **전부 source** |
| `ftplugin/<ft>.lua` | filetype 진입 시 **모든 rtp의 `ftplugin/<ft>.lua` 전부 실행** |
| `doc/*.txt` | **모두 인덱싱**. `:help`가 전체에서 검색 |
| `colors/<name>.lua` | 파일명 기준으로 선택. `:colorscheme tokyonight`이면 `*/colors/tokyonight.lua` 중 첫 매칭 |
| `lua/foo.lua` | **하나의 namespace로 머지.** 같은 이름 모듈이 여러 plugin에 있으면 rtp 순서상 앞쪽이 이김 |
| `autoload/foo.vim` | 동일 (rtp 순서 우선) |
| `after/...` | **rtp 역순으로 마지막에 추가 source**. user override용 |

이게 `b:did_ftplugin`·`vim.g.loaded_foo` 같은 가드 패턴이 필요한 이유다. ftplugin은 LazyVim·다른 플러그인·user config가 각각 `python.lua`를 두면 **세 번 다 실행**된다. 가드 없으면 옵션이 덮어써지거나 매핑이 중복 등록된다.

### `lua/` 네임스페이스 충돌

`lua/foo.lua`가 두 플러그인에 동시에 있으면 `require("foo")`는 **rtp 순서상 앞쪽 하나만** 로드한다. 다른 쪽은 영원히 안 불린다.

→ 그래서 플러그인 이름과 `lua/<name>/`의 `<name>`을 **unique하게** 잡는 게 관례다 (보통 repo 이름과 일치시킴). `lua/utils.lua`, `lua/config.lua`처럼 일반적인 이름을 노출시키면 다른 플러그인의 같은 이름과 충돌한다.

### 흔한 함정 — `doc/`·`plugin/` 위치

`doc/`나 `plugin/`을 `lua/<name>/` **안에** 두면 Neovim은 못 본다. rtp가 인식하는 건 **rtp에 등록된 디렉토리의 직접 자식**뿐이다.

```
my-plugin/                  -- 이게 rtp에 등록됨
├── lua/my-plugin/
│   ├── init.lua            -- OK: require("my-plugin")
│   └── doc/foo.txt         -- 무시됨 (lua/ 안)
└── doc/my-plugin.txt       -- OK: :help my-plugin
```

dotfiles에 임베드된 모듈을 나중에 떼낼 때 자주 실수한다. `lua/my-plugin/` 옆에 `doc/`·`README.md`·`LICENSE`를 같이 두면, 떼낼 때 `lua/my-plugin/`은 그대로 두고 **나머지를 한 단계 위로 올려야** 진짜 플러그인이 된다.

### 실제로 머지 결과 보는 법

| 명령 | 용도 |
| --- | --- |
| `:set runtimepath?` | rtp 전체 출력. 어떤 디렉토리들이 머지 대상인지 확인 |
| `:scriptnames` | 지금까지 source된 `.vim`·`.lua` 파일 전부 (실행 순서대로) |
| `:checkhealth` | ftplugin·plugin·lua 로딩 상태 진단 |
| `:verbose set <option>?` | 옵션이 **어느 파일에서** 마지막으로 설정됐는지 추적 (ftplugin 충돌 디버깅에 유용) |
| `:Lazy` (lazy.nvim) | 플러그인별 로드 상태·시간·rtp 등록 여부 |

`:verbose set tabstop?` 같이 쓰면 "왜 내 설정이 안 먹지?" 류의 문제를 거의 다 잡을 수 있다.

## `plugin/` vs `lua/` 역할 분리

가장 흔히 혼동하는 부분이다.

- `plugin/foo.lua` → **엔트리포인트**. 보통 커맨드·키맵·오토커맨드만 등록하고 무거운 로직은 두지 않는다. Neovim이 시작 시 자동 실행하므로 비싸면 시작이 느려진다.
- `lua/foo/init.lua` → **실제 로직**. `require("foo").setup(opts)`로 사용자가 명시적으로 부를 때 실행된다.

```lua
-- plugin/my-plugin.lua  (시작 시 자동 실행)
if vim.g.loaded_my_plugin then return end
vim.g.loaded_my_plugin = true

vim.api.nvim_create_user_command("MyHello", function()
  require("my-plugin").hello()  -- 호출 시점에 lua 모듈 로드
end, {})
```

```lua
-- lua/my-plugin/init.lua  (require 시 실행)
local M = {}
M.opts = { greeting = "hello" }

function M.setup(opts)
  M.opts = vim.tbl_deep_extend("force", M.opts, opts or {})
end

function M.hello()
  print(M.opts.greeting)
end

return M
```

### "도서관"과 "자동 부트" — 멘탈 모델

| 관점 | `lua/` | `plugin/` |
| --- | --- | --- |
| 디렉토리 중첩 인식 | O (dotted require path) | O (재귀 source) |
| 자동 실행 | **X** (require 명시 필요) | **O** (startup 시) |
| 트리거 | `require("...")` 호출 | Neovim 시작 |
| 비유 | 부르면 깨어나는 도서관 | 일제 기상 자동 부트 폴더 |

`lua/` 는 Neovim 입장에서 **자동 로드 규약이 0개**다. rtp 등록 시 `package.path` 에 추가되어 `require` 가 찾을 수 있게 만들어주는 게 전부. `lua/foo.lua` 를 둬도 누가 `require("foo")` 하지 않으면 영원히 안 실행된다.

반면 `plugin/` 은 startup 일제 실행이라, 진입 코드(커맨드·키맵·오토커맨드 등록)만 둔다. 무거운 로직은 `lua/` 에 두고 `require` 호출로 깨우는 게 lazy 효과를 살리는 방법.

### `plugin/` (단수) vs `lua/plugins/` (복수) — 흔한 함정

이름이 거의 같지만 완전히 다른 메커니즘이다.

| 디렉토리 | 자동 로드? | 누가 처리하나 |
| --- | --- | --- |
| **`plugin/`** (rtp 루트의 형제, 단수) | **O** | Neovim runtimepath 규약 — startup 자동 source |
| **`lua/plugins/`** (lua 아래, 복수) | **X** | lazy.nvim 의 `{ import = "plugins" }` 가 명시적으로 스캔할 때만 의미 가짐 |

```
my-config/
├── plugin/foo.lua          -- 만들면 startup 자동 실행 (Neovim 규약)
└── lua/
    └── plugins/foo.lua     -- lazy.nvim 의 import = "plugins" 가 깨워야 동작
```

`lua/plugins/` 의 `plugins` 라는 이름은 Neovim 차원에서 의미 없다 — lazy.nvim 이 약속한 컨벤션 이름일 뿐. `lua/myspecs/` 로 만들고 `{ import = "myspecs" }` 라고 써도 동일하게 작동한다.

## 관례 6가지

### 1. 가드 패턴 (중복 로드 방지)

```lua
-- plugin/foo.lua 최상단
if vim.g.loaded_foo then return end
vim.g.loaded_foo = true
```

`plugin/` 디렉토리가 runtimepath에 두 번 들어가거나, 패키지 매니저가 reload할 때 안전망이 된다.

### 2. `lua/foo.lua` 단일 파일보다 `lua/foo/init.lua` 디렉토리

서브모듈 확장 여지를 남기기 위해서다. `lua/foo/config.lua`, `lua/foo/util.lua`처럼 분리하려면 디렉토리가 필요하다.

### 3. 네임스페이스 프리픽스

전역 변수와 커맨드는 플러그인 이름으로 프리픽스를 붙인다.

- `vim.g.foo_enabled`
- `:FooToggle`, `:FooStatus`
- `<Plug>(foo-action)` (사용자 정의 키맵 노출용)

다른 플러그인과 충돌할 여지를 없앤다.

### 4. `require("foo").setup(opts)` 패턴

사용자가 호출하는 진입점은 거의 항상 `setup(opts)`다. lazy.nvim은 `opts` 키만 넘기면 자동으로 `setup(opts)`를 호출해주기 때문에 이 관례를 따르는 게 호환성에 유리하다.

```lua
-- lazy.nvim spec
return {
  "myuser/my-plugin",
  opts = { greeting = "hi" }, -- 자동으로 require("my-plugin").setup({greeting = "hi"}) 호출
}
```

### 5. 헬스체크

`:checkhealth foo`로 호출되는 진단 모듈.

```lua
-- lua/foo/health.lua
return {
  check = function()
    vim.health.start("foo")
    if vim.fn.executable("rg") == 1 then
      vim.health.ok("ripgrep 발견")
    else
      vim.health.error("ripgrep 미설치", "brew install ripgrep")
    end
  end,
}
```

외부 바이너리 의존이 있는 플러그인은 거의 필수다.

### 6. 헬프 문서 (`doc/foo.txt`)

Vim 헬프 포맷 규약을 따른다.

```
*foo.txt*    My plugin description

==============================================================================
CONTENTS                                                        *foo-contents*

1. Introduction ............................ |foo-intro|
2. Configuration ........................... |foo-config|

==============================================================================
1. Introduction                                                    *foo-intro*

...
```

- 첫 줄에 `*foo.txt*` 태그
- 섹션 태그는 `*foo-config*` 형식
- 설치 시 `:helptags ALL`이 인덱싱 (lazy.nvim이 자동 처리)

## `after/` 디렉토리 — 주의

`after/`는 다른 플러그인 설정을 **덮어쓸 때**만 사용한다. 예: 특정 ftplugin의 옵션을 사용자 환경에서 강제 변경할 때 `after/ftplugin/python.lua`에 둔다.

일반 플러그인 본체는 `after/`에 두면 안 된다. 로드 순서가 꼬여 디버깅이 어려워진다.

## LazyVim의 위치

흔히 "LazyVim 플러그인"이라는 표현을 쓰지만, **LazyVim은 별도 플러그인 시스템이 아니다**. lazy.nvim(플러그인 매니저) 위에 깔린 프리셋 설정 모음이다. 즉 LazyVim 환경에서 플러그인을 등록한다는 건 일반 Neovim 플러그인을 lazy.nvim spec으로 선언하는 것일 뿐이다.

```lua
-- ~/.config/nvim/lua/plugins/my-plugin.lua
return {
  "myuser/my-plugin",
  event = "VeryLazy",         -- lazy-load 시점: cmd, ft, keys, event 중 하나
  opts = { greeting = "hi" },
  dependencies = { "nvim-lua/plenary.nvim" },
}
```

lazy.nvim의 `event`/`cmd`/`ft`/`keys` 키가 lazy-loading을 담당한다. 플러그인 자체는 그냥 표준 Neovim 플러그인 구조면 된다.

### `lua/config/` vs `lua/plugins/` — LazyVim 개인 config 의 두 디렉토리

LazyVim 환경의 개인 config 는 보통 두 디렉토리로 나뉜다. 이름 자체는 Neovim 차원에서 의미 없고, **전부 LazyVim·lazy.nvim 의 상위 약속**이다.

| 디렉토리 | 무엇을 담나 | 누가 어떻게 부르나 |
| --- | --- | --- |
| `lua/config/` | Neovim 자체 설정 (옵션·키맵·autocmd) + lazy.nvim 부트스트랩 | LazyVim 의 라이프사이클 규약으로 정해진 시점에 자동 require |
| `lua/plugins/` | lazy.nvim plugin spec (외부 플러그인 선언) | `lazy.lua` 의 `{ import = "plugins" }` 가 디렉토리 전체를 자동 스캔 |

`config/` 안의 파일은 LazyVim 이 정한 시점에 자동 require 된다.

| 파일 | 호출 시점 |
| --- | --- |
| `config/options.lua` | **즉시** (UI 띄우기 전 — colorscheme·옵션 깜빡임 방지) |
| `config/keymaps.lua` | `VeryLazy` 이벤트 (UI 직후) |
| `config/autocmds.lua` | `VeryLazy` 이벤트 |
| `plugins/*.lua` | 각 spec 의 `event`·`cmd`·`ft`·`keys` 트리거 따라 lazy load |

분리 이유는 세 가지가 겹쳐 있다.

1. **자동 스캔 vs 명시 require** — `plugins/` 는 lazy.nvim 의 `import` 가 자동 스캔, `config/` 는 LazyVim 의 자동 호출 규약.
2. **로드 시점이 다름** — options 만 즉시, 나머지는 `VeryLazy` 또는 plugin spec 트리거 시점.
3. **관심사 분리** — `config/` 변경은 본인 Neovim 환경, `plugins/` 변경은 외부 의존성 관리.

## 대중성·대안

- **언어**: Lua가 표준. Vimscript는 레거시(여전히 동작하지만 신규 작성은 안 함). Fennel·Teal은 마이너.
- **플러그인 매니저**: lazy.nvim이 사실상 표준. packer.nvim은 archive됨, vim-plug는 Lua 통합이 약함, rocks.nvim은 소수 사용자.
- **설정 진입점**: `setup(opts)` 패턴이 표준. 일부 플러그인은 `setup` 없이 모듈 호출만으로 동작하기도 하지만(예: `vim-fugitive`는 Vimscript여서 다름), 신규 Lua 플러그인은 `setup` 관례를 따르는 게 무난하다.

## 공식 레퍼런스

Neovim 안에서 바로 확인:

- `:help write-plugin` — 플러그인 작성 일반론
- `:help lua-guide` — Lua 측 API 가이드
- `:help health` — 헬스체크 프로토콜
- `:help runtimepath` — 디렉토리 로드 규칙

## 정리

규칙은 두 가지다.

1. **runtimepath 디렉토리 규약**: 이름이 곧 로드 방식. `plugin/`은 자동, `lua/`는 require, `ftplugin/`은 파일타입별.
2. **`require("name").setup(opts)` 관례**: 사용자 진입점은 거의 항상 이 형태.

가드 패턴·네임스페이스·헬스체크·헬프 문서는 있으면 좋은 관례이고, `after/`는 오버라이드 전용이다. LazyVim에서 쓴다고 특별한 게 없고, 그냥 lazy.nvim spec으로 일반 플러그인을 등록하는 것뿐이다.

## 플러그인 작성 시리즈

| 글 | 다루는 것 |
| --- | --- |
| [언어 선택](/posts/neovim/2026-06-12-neovim-plugin-language-choice/) | Lua가 표준이지만 부모 생태계가 Vimscript면 Vimscript가 자연스럽다 |
| [Lua와 Vimscript 섞기](/posts/neovim/2026-06-12-neovim-plugin-mixing-lua-vimscript/) | 호출 경계 최소화, 흔한 안티패턴, 모범 분담 |
| **runtimepath 디렉토리 관례 (현재 글)** | `plugin/` vs `lua/`, 헬프·헬스체크·after/ 자동 로드 규칙 |
| [4가지 채널로 노출시키기](/posts/neovim/2026-06-12-neovim-plugin-distribution/) | awesome-neovim · Dotfyle · VimAwesome · GitHub Topics |

실전 케이스로 [vim-dadbod 어댑터 플러그인 만들기](/posts/neovim/2026-06-12-vim-dadbod-adapter-plugin-build/)에서 위 4가지 원칙을 한 번에 적용해본다.
