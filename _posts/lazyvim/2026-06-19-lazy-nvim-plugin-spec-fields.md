---
title       : "lazy.nvim 플러그인 spec 필드 완전 정리 — 로드 트리거 / init·opts·config / 의존성"
description : "lazy.nvim의 플러그인 spec을 읽고 쓸 때 만나는 필드들 — lazy·keys·cmd·ft·priority(언제 로드), init·opts·config(로드 시 동작), dependencies·optional·branch(관계) — 를 실행 순서와 함께 정리한다. opts의 테이블 vs 함수 차이와 흔한 함정 포함."
date        : 2026-06-19 12:00:00 +0900
categories  : [lazyvim, "구조·설정"]
tags        : [neovim, lazy-nvim, guide]
pin         : false
hidden      : false
---

LazyVim 설정을 만지다 보면 `lua/plugins/` 아래 파일마다 `opts`, `init`, `config`, `lazy`, `keys`, `dependencies` 같은 키들이 제각각 섞여 나온다. 처음엔 "왜 어떤 건 `opts`고 어떤 건 `config`지?", "`init`이랑 `config`은 뭐가 다르지?" 싶다.

이 글은 lazy.nvim **plugin spec의 필드들을 세 묶음으로 나눠** 정리한다 — (1) 언제 로드되나, (2) 로드될 때 뭘 하나, (3) 다른 플러그인과의 관계. 각 필드가 따로 노는 게 아니라 역할이 분명히 갈린다는 걸 보면 spec이 한눈에 읽히기 시작한다.

> 이 글은 **하나의 spec을 읽고 쓰는 법**(필드 레퍼런스)에 집중한다. core/extras/사용자 plugin이 **여러 spec으로 어떻게 합쳐지는지**(머지 알고리즘)는 시리즈의 [의존성 계층 글](/posts/lazyvim/2026-06-07-lazyvim-spec-merge-and-dependency-layers/)에서 다룬다.

## spec은 테이블 하나다

lazy.nvim에서 플러그인 하나는 Lua 테이블(spec) 하나로 정의된다. 첫 원소가 `"owner/repo"` 문자열이고, 나머지는 전부 옵션 키다.

```lua
return {
  "owner/repo",
  -- 언제 로드?
  lazy = true,
  keys = { "<leader>x" },
  -- 로드될 때 뭘?
  opts = { foo = 1 },
  config = function(_, opts) require("plugin").setup(opts) end,
  -- 관계
  dependencies = { "other/dep" },
}
```

이 키들을 세 묶음으로 보면 된다.

## 1. 언제 로드되나 — 지연 로딩 트리거

| 필드 | 의미 |
|------|------|
| `lazy = true` | 지연 로드. 트리거(아래)가 올 때까지 로드 안 함 |
| `lazy = false` | 시작 시 즉시 로드 |
| `event` | 특정 이벤트에 로드 (예: `"VeryLazy"`, `"BufReadPost"`) |
| `keys` | 그 키를 **처음 누를 때** 로드 |
| `cmd` | 그 명령을 **처음 쓸 때** 로드 |
| `ft` | 그 파일타입을 **열 때** 로드 |
| `priority` | `lazy=false`인 것들끼리의 **로드 순서** (클수록 먼저) |

`keys`/`cmd`/`ft`/`event` 중 하나라도 주면 lazy.nvim은 자동으로 그 플러그인을 lazy로 간주한다. 즉 트리거를 명시하는 것 자체가 "이 시점까지 미뤄라"는 뜻이다.

```lua
-- 마크다운 파일 열 때만 로드
{ "iamcco/markdown-preview.nvim", ft = { "markdown" } }

-- 이 키 누를 때만 로드
{ "mg979/vim-visual-multi", keys = { { "<C-n>", mode = { "n", "v" } } } }

-- 이 명령 쓸 때만 로드
{ "christoomey/vim-tmux-navigator", cmd = { "TmuxNavigateLeft", "TmuxNavigateRight" } }
```

### `priority` — 즉시 로드되는 것들의 순서 보장

`lazy = false`인 플러그인이 여러 개면 로드 순서가 문제 될 수 있다. A 플러그인이 시작 시 환경변수를 깔고, B 플러그인이 그 값을 읽어야 한다면 A가 먼저 떠야 한다.

```lua
-- JDK 환경변수를 시작 시점에 주입하는 플러그인
{
  "clang-engineer/jvm-env.nvim",
  lazy = false,
  priority = 100,        -- 다른 lazy=false 플러그인보다 먼저
  opts = { jdtls = "21", gradle = "11" },
}
```

`priority = 100`이면 같은 `lazy=false` 그룹 안에서 우선 실행된다. 뒤에서 이 env를 읽는 jdtls 설정이 빈 값을 보지 않도록 순서를 못 박는 용도다. (colorscheme 플러그인이 흔히 `priority = 1000`을 쓰는 것도 같은 이유 — 다른 UI가 뜨기 전에 테마를 먼저 적용하려고.)

## 2. 로드될 때 뭘 하나 — 라이프사이클 훅

여기가 핵심이다. `init` / `opts` / `config`는 **실행 시점이 다르다.**

```
init  →  (플러그인 로드)  →  opts 해석  →  config(opts)
```

| 훅 | 실행 시점 | 보통 하는 일 |
|----|-----------|--------------|
| `init` | 플러그인 로드 **전**, **시작 시 항상** | `vim.g.*` 전역 변수 선세팅 |
| `opts` | (config 직전) | `setup()`에 넘길 옵션 테이블 만들기 |
| `config` | 플러그인 로드 **후** 1회 | `require(plugin).setup(opts)` 실행 |

### `init` vs `config` — 가장 헷갈리는 둘

- **`init`은 플러그인이 lazy여도 시작 시점에 항상 실행된다.** 플러그인 본체는 아직 로드되지 않았어도 `init`은 돈다.
- **`config`는 플러그인이 실제로 로드(트리거 발동)될 때 한 번 실행된다.**

그래서 "플러그인이 켜지기 **전에** 깔려 있어야 하는 전역값"은 `init`에 둔다. 대표적으로 vim-dadbod-ui는 켜질 때 `vim.g.dbs`를 읽는데, 이 플러그인은 lazy다. 접속 목록을 `config`에 넣으면 늦으므로 `init`에서 미리 세팅한다.

```lua
{
  "kristijanhusak/vim-dadbod-ui",
  init = function()
    vim.g.dbs = require("user.db").all()   -- 플러그인 켜지기 전에 깔아둬야 함
  end,
}
```

반대로, 플러그인을 로드한 뒤 `setup()`만 부르면 되는 단순한 경우는 `config`다.

```lua
{
  "maarutan/nvim-nocut",
  config = function()
    require("no-cut").setup()
  end,
}
```

### `opts` — 테이블 vs 함수

`opts`는 `config`가 호출할 `setup(opts)`의 인자다. lazy.nvim은 `config`를 생략하면 자동으로 `require(<main>).setup(opts)`를 불러준다. 그래서 단순 설정은 `config` 없이 `opts`만 주면 된다.

`opts`는 **테이블**일 수도, **함수**일 수도 있고 둘은 동작이 다르다.

**테이블 형** — 정적인 값. lazy.nvim이 플러그인 기본값 및 다른 spec의 opts와 **깊은 병합(deep merge)** 한다.

```lua
{ "LazyVim/LazyVim", opts = { colorscheme = "tokyonight" } }
```

**함수 형** — `function(_, opts)`. lazy.nvim이 **먼저** 기본값+다른 spec들을 병합해 `opts` 테이블을 만든 뒤, 그걸 두 번째 인자로 넘겨준다. 함수는 그걸 변형/확장하고 돌려준다.

함수 형은 다음 두 경우에 **필요해서** 쓴다 (취향이 아니다):

1. **기존/기본 opts를 받아 확장**해야 할 때 — 리스트에 append, 기존 함수 wrap 등
2. **로드 시점에 코드를 실행**해야 할 때 — `require`, 환경변수 읽기, 조건 분기

```lua
-- 환경변수를 읽어 cmd를 만들고, 기존 opts.jdtls에 "병합"
{
  "mfussenegger/nvim-jdtls",
  opts = function(_, opts)
    local java_home = vim.env.JDTLS_JAVA_HOME
    if not java_home then return opts end

    opts.jdtls = vim.tbl_deep_extend("force", opts.jdtls or {}, {
      cmd = { vim.fn.exepath("jdtls"), "--java-executable", java_home .. "/bin/java" },
    })
  end,
}
```

### ⚠️ 함수 형의 함정 — 받은 opts를 통째로 버리지 말 것

함수 형에서 두 번째 인자 `opts`는 **LazyVim 기본값 + 다른 spec의 병합 결과**다. 이걸 무시하고 새 테이블을 통째로 반환하면 그 병합분이 전부 날아간다.

```lua
-- ❌ 위험 — 기본값/다른 spec의 opts를 모두 덮어씀
opts = function()
  return { foo = 1 }
end

-- ✅ 안전 — 받은 opts를 확장하거나 병합
opts = function(_, opts)
  opts.foo = 1
  return opts                     -- 변형 후 반환
end

-- ✅ 안전 — 깊은 병합
opts = function(_, opts)
  return vim.tbl_deep_extend("force", opts, { foo = 1 })
end
```

기본값에 의존하는 LazyVim 위에서는 이 차이가 특히 크다. 인자 없는 `opts = function() return {...} end`를 보면 일단 의심하자.

## 3. 다른 플러그인과의 관계 — 메타 필드

| 필드 | 의미 |
|------|------|
| `dependencies` | 이 플러그인보다 **먼저** 로드할 것들 (함께 끌려옴) |
| `optional = true` | 다른 데서 이미 추가된 경우에만 이 spec 적용 (단독으론 무시) |
| `name` | 내부 식별명 (clone 디렉토리 / require 경로) |
| `branch` | 기본 브랜치가 아닌 특정 브랜치 |
| `specs` | 이 플러그인 활성화 시 함께 적용할 별도 spec 묶음 |

### `dependencies`

표기는 단일이면 문자열, 복수면 테이블 — 둘 다 유효하다.

```lua
{ "kdheepak/lazygit.nvim", dependencies = { "nvim-lua/plenary.nvim" } }
{ "mfussenegger/nvim-dap", dependencies = "mason-org/mason.nvim" }   -- 문자열도 OK
```

`dependencies`는 "먼저 로드"일 뿐 아니라 **부모가 로드될 때 함께 로드**된다. 그래서 lazy 플러그인의 의존은 부모가 켜질 때 같이 켜진다.

### `optional = true`

"내가 이 플러그인을 새로 추가하진 않는다. 이미 다른 곳(예: LazyVim core/extras)에서 추가됐을 때만 내 설정을 얹는다"는 뜻이다. 단독으로 두면 무시된다 — 기존 spec에 옵션만 보태는 안전한 override에 쓴다.

```lua
{
  "mfussenegger/nvim-dap",
  optional = true,             -- dap이 이미 켜진 경우에만 이 설정 적용
  opts = function()
    local dap = require("dap")
    dap.adapters.kotlin = { type = "executable", command = "kotlin-debug-adapter" }
  end,
}
```

### `branch`

lazy.nvim은 브랜치를 명시하지 않으면 **리포의 기본 브랜치**를 쓴다. 그래서 기본 브랜치가 이미 `master`인 플러그인에 `branch = "master"`를 적는 건 사실상 중복이다 — 설치 스니펫을 복붙하면 따라오는 경우가 많다. 해롭진 않지만, 기본과 다른 브랜치를 써야 할 때만 적는 게 깔끔하다.

### `name`

clone될 디렉토리명과 require 경로 식별에 쓰인다. 리포명과 모듈명이 다를 때 맞춰준다.

```lua
{ "catppuccin/nvim", name = "catppuccin" }   -- require("catppuccin")로 쓰려고
```

## 한눈에 — 필드 분류표

| 묶음 | 필드 | 한 줄 |
|------|------|-------|
| 언제 로드 | `lazy` | 지연 여부 |
| | `event`/`keys`/`cmd`/`ft` | 로드 트리거 (있으면 자동 lazy) |
| | `priority` | `lazy=false`들의 순서 |
| 로드 시 동작 | `init` | 로드 **전**, 시작 시 항상 (전역값 선세팅) |
| | `opts` | setup 인자 (테이블=병합 / 함수=확장·실행) |
| | `config` | 로드 **후** setup 실행 |
| 관계 | `dependencies` | 먼저·함께 로드 |
| | `optional` | 이미 있을 때만 적용 |
| | `branch`/`name` | 브랜치·식별명 |
| | `specs` | 활성화 시 딸려가는 spec |

## 왜 플러그인마다 설정 모양이 다를까 — 껍데기 vs 알맹이

여러 플러그인을 설정하다 보면 "왜 어떤 건 `opts` 테이블 하나로 끝나고, 어떤 건 `vim.g.*`를 쓰고, 어떤 건 `opts` 안에 또 콜백을 넣지?" 싶다. 답은 **설정 방식이 두 층에서 나오기** 때문이다.

**① lazy.nvim 층 (공통)** — `opts` / `init` / `config` / `keys` … 이 **껍데기**는 모든 플러그인에 동일하다. lazy.nvim이 정한 규약이다.

**② 플러그인 층 (제각각)** — 그 껍데기 *안에* 무엇을 어떤 모양으로 넣느냐. 이 **알맹이**는 플러그인이 설정을 받도록 만든 방식에 따라 다르다:

| 알맹이 방식 | 모양 | 예 |
|-------------|------|-----|
| `setup(opts)` 테이블 | `opts = { ... }` | 대부분의 모던 Lua 플러그인 |
| 전역변수 | `init`에서 `vim.g.* = ...` | vim-dadbod-ui(`vim.g.dbs`), markdown-preview(`vim.g.mkdp_*`) |
| setup **안의** 콜백/핸들러 구조 | `opts = { x = { y = function() end } }` | 아래 참고 |

즉 `opts`라는 껍데기는 같아도 그 안에 채울 내용은 **각 플러그인의 README / `:h <plugin>`**이 정한다. lazy.nvim은 그걸 `setup()`에 전달만 할 뿐이다.

### 함정 — `opts` 안의 키가 lazy.nvim 것이 아닐 때

특히 헷갈리는 건, `opts` 테이블 안에 lazy.nvim 필드와 **이름이 같은** 플러그인 고유 키가 등장하는 경우다.

```lua
-- nvim-lspconfig (LazyVim 통합)
{
  "neovim/nvim-lspconfig",
  opts = {
    setup = {                         -- ← 이 'setup'은 lazy.nvim 게 아니다!
      clangd = function(_, opts) ... end,
    },
  },
}
```

여기 `opts.setup.<server>` 핸들러는 **LazyVim의 lspconfig 통합이 정의한 스키마**다. lazy.nvim의 `config`/`setup`과 무관하고, "raw nvim-lspconfig"을 직접 쓸 때와도 또 다르다.

```lua
-- snacks.nvim
opts = {
  picker = { sources = { explorer = {
    config = function(opts) ... end,   -- ← 이 'config'도 snacks 거지 lazy.nvim 거 아님
  } } },
}
```

이 `config` 역시 snacks가 정한 콜백이지 lazy.nvim의 `config` 훅이 아니다. **이름만 같고 다른 것** — 어느 층의 키인지 항상 구분해야 한다.

### ③ LazyVim이 한 겹 더 얹는다

LazyVim은 일부 플러그인(특히 nvim-lspconfig, conform, mason 등)에 **자기만의 opts 스키마**를 추가로 끼워넣는다. 위 `opts.setup` 핸들러나 `opts.servers`가 그것이다. 그래서 같은 플러그인이라도 **"raw로 쓸 때 vs LazyVim 위에서 쓸 때"** 설정 모양이 갈린다. 검색으로 찾은 설정 예제가 안 먹는다면, 그게 raw 기준인지 LazyVim 기준인지부터 확인하자.

## 정리

- spec의 필드는 **언제(트리거) / 무엇을(init·opts·config) / 관계(deps·optional)** 세 축으로 읽으면 한눈에 들어온다.
- `init`은 로드 전·시작 시 항상, `config`는 로드 후 1회 — **전역값 선세팅은 `init`, setup 호출은 `config`.**
- `opts`는 정적이면 테이블, 확장·실행이 필요하면 함수. 함수 형에서 받은 `opts`를 통째로 버리면 병합분이 날아간다.
- `keys`/`cmd`/`ft`를 주는 것 자체가 lazy 선언이다. 시작이 무거우면 즉시 로드를 트리거 기반으로 미뤄라.
- **껍데기(opts/init/config)는 공통, 알맹이는 플러그인마다 다르다.** `opts` 안의 키가 lazy.nvim 것인지 플러그인/LazyVim 것인지 구분하라.

## LazyVim 구조 시리즈

| 글 | 다루는 것 |
| --- | --- |
| [LazyVim 주요 플러그인 정리](/posts/lazyvim/2026-06-07-lazyvim-plugins-overview/) | LazyVim에 어떤 플러그인들이 어떤 키맵으로 들어있는지 — 글로벌 명함 |
| [LazyVim 기능 지도](/posts/lazyvim/2026-06-07-lazyvim-feature-plugin-map/) | 기능 영역(Git·검색·LSP·완성·DAP)별로 어떤 플러그인이 협력하는지, snacks.nvim의 hub 역할 |
| [LazyVim 의존성 계층 — spec merge](/posts/lazyvim/2026-06-07-lazyvim-spec-merge-and-dependency-layers/) | lazy.nvim → core → extras → 사용자 plugin이 합쳐지는 머지 알고리즘 |
| **lazy.nvim plugin spec 필드 완전 정리 (현재 글)** | 하나의 spec을 읽고 쓰는 법 — 로드 트리거 / init·opts·config / 의존성 |
