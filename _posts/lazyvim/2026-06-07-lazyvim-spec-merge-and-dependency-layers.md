---
title       : "LazyVim 의존성 계층 — lazy.nvim → core → extras → 사용자 plugin이 합쳐지는 방식"
description : "lazy.nvim의 spec/import 모델, LazyVim이 어떻게 자체 spec을 모아 lazyvim.json의 extras를 활성화하는지, 그리고 사용자 plugin이 그 위에 override되는 순서"
date        : 2026-06-07 12:00:00 +0900
updated     : 2026-06-07 12:00:00 +0900
categories  : [lazyvim, "구조·설정"]
tags        : [neovim, lazy-nvim]
pin         : false
hidden      : false
---

LazyVim 을 쓰다 보면 "이 플러그인은 어디서 들어온 거지?", "내가 override 한 게 왜 안 먹지?" 같은 질문이 자주 생긴다. 답을 알려면 LazyVim 이 **하나의 단일 플러그인 매니저가 아니라**, lazy.nvim 위에 spec 들을 층층이 쌓아 올린 구조라는 점을 봐야 한다.

이 글은 그 계층 — **lazy.nvim → LazyVim core → extras → 사용자 plugin** — 이 어떻게 머지되어 최종 플러그인 목록이 되는지 정리한다.

## 1. lazy.nvim 의 spec 모델

LazyVim 의 토대는 `folke/lazy.nvim`. lazy.nvim 은 **spec** 이라는 단위로 플러그인을 정의한다.

```lua
-- 가장 단순한 spec
{ "owner/repo" }

-- 옵션·의존성·로드 시점까지 포함한 spec
{
  "owner/repo",
  dependencies = { "other/dep" },
  event = "VeryLazy",        -- 언제 로드할지
  opts = { foo = 1 },        -- setup()에 넘길 옵션 (자동 호출)
  keys = { "<leader>x" },    -- 이 키 처음 누를 때 로드
  cmd = { "MyCmd" },         -- 이 명령 처음 쓸 때 로드
}
```

spec 은 단순 테이블이고, lazy.nvim 은 **spec 들의 트리** 를 받는다. 트리 구성은 두 가지 방식:

```lua
require("lazy").setup({
  spec = {
    -- (1) 직접 spec 나열
    { "tpope/vim-fugitive" },
    -- (2) import: 다른 lua 모듈을 spec 소스로
    { import = "plugins" },                       -- lua/plugins/*.lua
    { "LazyVim/LazyVim", import = "lazyvim.plugins" },  -- LazyVim 패키지의 spec들
  },
})
```

여기서 핵심은 **`import` 가 spec 의 또 다른 형태**라는 점이다. lazy.nvim 은 `import = "module"` 을 만나면 그 모듈을 require 해서 반환되는 spec 들을 트리에 흡수한다. **재귀적**으로 처리되니, import 가 또 다른 import 를 부르는 식으로 깊어질 수 있다.

## 2. 같은 spec 이 여러 번 등장하면? — Deep Merge

같은 플러그인이 여러 spec 에 등장하면 lazy.nvim 은 **이름(`"owner/repo"`)을 키로 deep merge** 한다. 대략 이런 규칙:

- 스칼라 (`event`, `cmd`, `lazy` 등): **뒤에 정의된 값이 이김**
- 테이블 (`opts`, `dependencies`, `keys` 등): **deep merge** (병합)
- `config` 함수: 마지막에 정의된 것이 이김

이게 LazyVim 의 override 메커니즘의 전부다. 사용자가 자신의 `lua/plugins/foo.lua` 에 같은 이름의 spec 을 다시 쓰면, 그 spec 이 LazyVim 의 spec 과 **합쳐진다**.

```lua
-- LazyVim core 어딘가에 이런 spec 이 있다고 치자
{ "nvim-mini/mini.pairs", event = "VeryLazy", opts = { ... } }

-- 사용자가 plugins/editing.lua 에 같은 이름으로 다시 쓰면
{ "nvim-mini/mini.pairs", opts = { skip_unbalanced = false } }
-- → 최종: event 유지 + opts 는 deep merge
```

> **이게 [이전 글에서 다룬]({% post_url 2026-05-07-lazyvim-extra-override-merge-deps %}) "extra spec 에 dependencies 만 보강하기" 가 가능한 이유.** 같은 이름으로 빈껍데기처럼 다시 작성해도 dependencies 만 더해진다.

## 3. LazyVim 의 진입점 — `init.lua → config.lazy`

표준 LazyVim 진입 코드는 짧다.

```lua
-- init.lua
require("config.lazy")
```

`lua/config/lazy.lua`:
```lua
require("lazy").setup({
  spec = {
    { "LazyVim/LazyVim", import = "lazyvim.plugins" },  -- (A) LazyVim 자체
    { import = "plugins" },                              -- (B) 사용자
  },
  defaults = { lazy = false, version = false },
  ...
})
```

여기서 두 줄이 모든 걸 결정한다.

- **(A)** `import = "lazyvim.plugins"` — LazyVim 패키지의 spec 트리를 통째로 가져온다.
- **(B)** `import = "plugins"` — 사용자의 `lua/plugins/*.lua` 를 가져온다. (A) 다음에 처리되므로 같은 이름의 spec 은 사용자 쪽이 마지막 발언자가 된다.

순서가 이래야 사용자가 override 할 수 있다. **(B) 가 먼저면** LazyVim 이 사용자 설정을 덮어쓴다.

## 4. LazyVim 패키지 안에 뭐가 들어있나

`lazyvim.plugins` 가 가져오는 건 `~/.local/share/nvim/lazy/LazyVim/lua/lazyvim/plugins/` 디렉토리다. 안을 보면:

```
plugins/
├── init.lua          # 진입점 — LazyVim 자체 + snacks.nvim
├── coding.lua        # mini.pairs, mini.ai, ts-comments, lazydev, ...
├── editor.lua        # which-key, gitsigns, todo-comments, ...
├── ui.lua            # bufferline, lualine, noice, ...
├── colorscheme.lua   # tokyonight 등
├── formatting.lua    # conform.nvim
├── linting.lua       # nvim-lint
├── treesitter.lua    # nvim-treesitter
├── lsp/              # nvim-lspconfig, mason, ...
├── util.lua
├── xtras.lua         # ← extras 활성화 메커니즘 (다음 절)
└── extras/           # 선택 활성화 plugin pack 들
    ├── ai/copilot.lua
    ├── coding/mini-comment.lua
    ├── lang/java.lua
    ├── dap/core.lua
    └── ...
```

`plugins/init.lua` 에서 lazy.nvim 의 import 자동 탐색이 위 모든 파일(except `extras/`)을 spec 트리에 흡수한다. `extras/` 만 다르다 — 이건 **켤지 말지 사용자가 선택**하는 영역이고, 켜고 끄는 게 `xtras.lua` 의 일이다.

## 5. extras 와 `lazyvim.json` — `:LazyExtras` 의 정체

`:LazyExtras` 로 본인이 활성화한 extras 는 `lua/lazyvim.json` 에 저장된다.

```json
{
  "extras": [
    "lazyvim.plugins.extras.ai.copilot",
    "lazyvim.plugins.extras.coding.mini-comment",
    "lazyvim.plugins.extras.dap.core",
    "lazyvim.plugins.extras.lang.java",
    ...
  ],
  "version": 8
}
```

`lazyvim/plugins/xtras.lua` 가 시작 시 이 파일을 읽고, 각 항목을 **spec 의 `import = "..."` 형태로 변환해서 반환**한다.

```lua
-- xtras.lua 핵심 (단순화)
return vim.tbl_map(function(extra)
  return { import = extra }
end, extras)
```

이게 다시 lazy.nvim 의 spec 트리에 흡수되니, extras 의 spec 도 **core 와 사용자 spec 사이의 한 층**으로 자연스레 들어간다.

> `xtras.lua` 에는 우선순위(`prios`) 테이블도 있어서, `dap.core`/`test.core`/`nvim-cmp` 같은 "다른 extra 가 의존하는 기반" 은 먼저 import 되도록 강제한다. 같은 spec 이름이 여러 extra 에서 등장할 때 머지 순서가 의미 있는 경우를 위한 것.

## 6. 사용자 plugin 의 위치 — override 와 신규 추가

사용자 `lua/plugins/*.lua` 의 spec 은 두 가지 일을 한다.

### (a) 기존 LazyVim/extras spec 의 override

같은 이름으로 spec 을 다시 쓰면 merge:

```lua
-- plugins/lazygit.lua
return {
  -- 신규 추가
  { "kdheepak/lazygit.nvim", lazy = true, dependencies = { "nvim-lua/plenary.nvim" } },

  -- LazyVim core 의 snacks.nvim spec override (opts.lazygit 만 추가)
  {
    "folke/snacks.nvim",
    opts = {
      lazygit = {
        configure = true,
        config = { os = { editPreset = "", ... } },
      },
    },
  },
}
```

여기서 `snacks.nvim` 은 LazyVim core 가 이미 priority/lazy 설정과 함께 가져온 플러그인이다. 사용자가 빈 `opts.lazygit` 만 덧붙이면 나머지는 그대로 두고 그 키만 deep-merge 된다.

### (b) extras 가 만든 spec 의 의존성만 보강

이전 글에서 다룬 케이스 — extras 의 spec 에 dependencies 만 더하기:

```lua
-- plugins/refactoring.lua  (예시)
return {
  {
    "ThePrimeagen/refactoring.nvim",  -- 어떤 extra 가 만든 spec
    dependencies = { "nvim-lua/plenary.nvim" },  -- 추가 의존성만
  },
}
```

`dependencies` 는 deep merge 대상 테이블이라 누락이 아니라 보강이 된다.

### (c) 순수 신규 플러그인

LazyVim/extras 와 무관한 새 플러그인은 그냥 일반 spec.

## 7. 전체 그림

```
init.lua
  └─ require("config.lazy")
       └─ lazy.setup{ spec = {
            { "LazyVim/LazyVim", import = "lazyvim.plugins" },
            { import = "plugins" },
          }}
                ↓ lazy.nvim 이 spec 트리 빌드
                ↓
  ┌─────────────────────────────────────────────────────────┐
  │ Layer 1 — LazyVim core                                  │
  │   plugins/init.lua + coding.lua + ui.lua + editor.lua + │
  │   formatting.lua + linting.lua + treesitter.lua + lsp/ +│
  │   colorscheme.lua                                       │
  ├─────────────────────────────────────────────────────────┤
  │ Layer 2 — LazyVim extras (lazyvim.json 에서 활성화된 것)│
  │   plugins/xtras.lua → vim.tbl_map(import = "...")       │
  │   ai/copilot, coding/mini-comment, dap/core,            │
  │   lang/java, lang/kotlin, lang/typescript, ...          │
  ├─────────────────────────────────────────────────────────┤
  │ Layer 3 — 사용자 plugins                                │
  │   lua/plugins/*.lua                                     │
  │   - 같은 이름의 spec 이면 deep merge로 override         │
  │   - 새 이름이면 신규 추가                               │
  └─────────────────────────────────────────────────────────┘
                ↓
        최종 플러그인 목록
        (lazy=false 인 것은 즉시, true 인 것은 트리거 시 로드)
```

## 8. 디버깅 — "이 플러그인 어디서 왔지?"

- `:Lazy` 로 플러그인 목록 → 항목 클릭하면 **source 파일 경로** 가 보인다. core 인지 extras 인지 본인 plugin 인지 한눈에 구분.
- `:Lazy log <plugin>` 로 머지 결과·로드 시점 확인.
- `:LazyExtras` 로 어떤 extras 가 켜져 있는지, 추가 후보는 뭐가 있는지.
- LazyVim core spec 직접 확인하려면 `~/.local/share/nvim/lazy/LazyVim/lua/lazyvim/plugins/` 를 읽으면 된다. 코드가 짧고 깔끔하다.

## 정리

- **lazy.nvim** 은 spec 트리만 받는다. spec 머지 규칙 (이름이 같으면 deep merge) 이 모든 override 의 기반.
- **LazyVim core** 는 그냥 spec 묶음. 사용자 plugin 과 동등한 자격으로 트리에 들어간다.
- **extras** 는 `:LazyExtras` 로 lazyvim.json 에 기록되고, 시작 시 `xtras.lua` 가 import spec 으로 변환해 트리에 흡수한다.
- **사용자 plugin** 은 LazyVim/extras spec 위에 deep merge 되는 마지막 층이다. 같은 이름이면 override, 다른 이름이면 신규.

LazyVim 은 "특별한 매니저" 가 아니라 "잘 정리된 lazy.nvim spec 묶음" 이다. 이 구조만 잡히면 override 가 안 먹는 이유, extra 끼리 충돌하는 이유, dependencies 보강 같은 패턴이 다 lazy.nvim 의 같은 머지 규칙 하나로 설명된다.
