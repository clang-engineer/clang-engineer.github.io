---
title       : "Neovim 플러그인 작성 규칙 — runtimepath 디렉토리 관례 정리"
description : "Vim 시절부터 이어진 runtimepath 자동 로드 규칙, Lua 추가분, plugin/ vs lua/ 역할 분리, 헬프·헬스체크·after/ 관례까지."
date        : 2026-06-12 18:00:00 +0900
updated     : 2026-06-12 18:00:00 +0900
categories  : [vim, "플러그인·생태계"]
tags        : [neovim, plugin, lua, runtimepath, lazy-nvim, lazyvim]
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
