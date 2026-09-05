---
title       : 'nvim-treesitter "..<" query 에러 — 파서 버전 불일치부터 main 브랜치/0.12 함정까지'
description : "Kotlin rangeUntil(..<) 노드 에러의 진단/복구. parser·query 불일치와 Neovim 0.11/0.12용 nvim-treesitter 세대가 섞였는지 추적하고 manager 경로로 복구한다."
date        : 2026-05-08 10:00:00 +0900
updated     : 2026-07-24 15:00:00 +0900
categories  : [lazyvim, "LSP·Treesitter"]
tags        : [neovim, treesitter, kotlin, snacks, lazy-nvim, troubleshooting]
pin         : false
hidden      : false
redirect_from:
  - /posts/lazyvim/2026-05-08-nvim-treesitter-main-branch-needs-0.12/
---

snacks picker에서 `Query error at 350:4. Invalid node type "..<"` 가 터지면, 보통 `nvim-treesitter`의 `kotlin/highlights.scm`은 최신인데 설치된 tree-sitter-kotlin 파서 `.so`가 옛날 버전이라 둘이 안 맞는 상황이다.

## 무슨 일이 벌어졌나

Kotlin 1.7.20에서 추가된 `rangeUntil` 연산자(`..<`)가 highlights 쿼리에 들어왔는데, 파서가 그 노드 타입을 모르면 쿼리 컴파일 자체가 실패한다. 픽커가 kotlin 파일을 하이라이트하려고 쿼리를 로드하는 순간 에러가 올라온다.

```
.../vim/treesitter/query.lua:373: Query error at 350:4. Invalid node type "..<"
```

## 해결

```vim
:TSUpdate kotlin
```

그래도 남으면 먼저 현재 nvim-treesitter 세대에 맞는 제거·재설치 명령을 쓴다. 플러그인 디렉터리의 parser 파일을 직접 지우기 전에 `:checkhealth nvim-treesitter`로 실제 parser 설치 경로를 확인한다.

```vim
:TSUninstall kotlin
:TSInstall kotlin
```

## :TSUpdate로 안 고쳐지면 — main 브랜치가 nvim 0.11에 갇힌 경우

`Invalid node type "..<"` 에러가 `:TSUpdate`로 안 고쳐지면, **nvim-treesitter rewrite(`main` 브랜치)가 nvim 0.11에 깔려있는 상태**일 가능성이 높다. main은 `vim.list.unique` 등 **Neovim 0.12+ API**를 써서 0.11에선 install/update 자체가 조용히 실패한다.

### 어떻게 이 상태가 되나

LazyVim과 nvim-treesitter는 Neovim 버전에 맞는 spec을 제공한다. 명시적인 `commit` 제약은 lockfile보다 우선하므로 `:Lazy update` 한 번이 그 제약을 무력화하지 않는다. 0.11에서 0.12 전용 main이 들어왔다면 사용자 override, 수동 checkout, 오래된 lockfile과 현재 spec의 불일치부터 확인한다.

### 진단 한 줄

```vim
:lua print(vim.fn.has('nvim-0.12'), type(vim.list))
```

`0  nil`이면 0.11인데 main 브랜치에 갇혀있는지 의심.

### 복구

플러그인 디렉터리에서 직접 `git checkout`하거나 `lazy-lock.json`을 손으로 고치지 않는다. 먼저 사용자 spec의 `branch`·`commit` override를 제거한 뒤 lazy.nvim이 현재 LazyVim spec과 lockfile을 동기화하게 한다.

```vim
:Lazy restore nvim-treesitter
:Lazy sync
```

그 다음 사용하는 nvim-treesitter 세대의 API로 Kotlin parser를 다시 설치한다. 0.12+ main API라면:

```vim
:lua require('nvim-treesitter').install({'kotlin','vim'}, {force=true}):wait(180000)
```

### 부수 함정

- main 브랜치엔 `:TSUpdateSync`, `:TSInstallSync` **없다**. 동기 설치는 위처럼 `:wait()`로.
- `info: Installed 2/2 languages` 메시지는 비동기 작업 트리거 직후라 **실제 .so가 디스크에 떨어지기 전**에 출력될 수 있음. `ls site/parser/`로 확인.
- 신규 파서가 깔려야 새 쿼리(`..<`, `tab` 노드 등)와 짝이 맞는다. 쿼리 파일만 새것이고 파서가 옛것이면 에러.

## 교훈

- plugin manager의 nvim-treesitter 업데이트는 **쿼리·Lua 코드**를 갱신하고, `:TSUpdate` 또는 main API의 `install(..., { force = true })`는 **parser 바이너리**를 갱신한다. 둘의 버전을 맞춰야 한다.
- `highlights.scm`을 직접 수정하는 우회는 `:Lazy sync` 한 번이면 날아가니까 비추천. 정말 필요하면 `after/queries/<lang>/`에 override를 둔다.
- `:TSUpdate`가 만능 해결책이 아니다. 에러가 안 풀리면 **버전 호환성**과 **lockfile vs spec 핀** 충돌부터 의심.
