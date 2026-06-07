---
title       : "nvim-treesitter main 브랜치는 nvim 0.12+ 전용 — lockfile이 LazyVim 핀을 덮어쓰면 깨진다"
description : "nvim 0.11에서 nvim-treesitter main 브랜치가 lockfile 갱신으로 박제되는 함정 — 진단/복구 절차"
date        : 2026-05-08 11:00:00 +0900
updated     : 2026-05-08 11:00:00 +0900
categories  : [lazyvim]
tags        : [neovim, treesitter, lazy-nvim, lazyvim, lockfile]
pin         : false
hidden      : false
---

`Invalid node type "..<"` 같은 treesitter query 에러가 `:TSUpdate`로 안 고쳐지면, **nvim-treesitter rewrite(`main` 브랜치)가 nvim 0.11에 깔려있는 상태**일 가능성이 높다. main은 `vim.list.unique` 등 **Neovim 0.12+ API**를 써서 0.11에선 install/update 자체가 조용히 실패한다.

## 어떻게 이 상태가 되나

LazyVim은 nvim 버전에 따라 안전 커밋을 pin한다.

```lua
-- LazyVim/lua/lazyvim/plugins/treesitter.lua
{
  "nvim-treesitter/nvim-treesitter",
  branch = "main",
  commit = vim.fn.has("nvim-0.12") == 0
    and "7caec274fd19c12b55902a5b795100d21531391f"
    or nil,
  ...
}
```

그런데 `:Lazy update nvim-treesitter` 한 번이면 lockfile이 최신 main HEAD로 덮어써지고, 다음부터 lazy.nvim은 lockfile을 따라가서 **LazyVim의 0.11 안전 핀이 무력화**된다. 깨진 채로 박제됨.

## 진단 한 줄

```vim
:lua print(vim.fn.has('nvim-0.12'), type(vim.list))
```

`0  nil`이면 0.11인데 main 브랜치에 갇혀있는지 의심.

## 복구

플러그인을 안전 커밋으로 되돌리고 lockfile 동기화:

```sh
cd ~/.local/share/nvim/lazy/nvim-treesitter
git fetch --depth 50 origin main
git checkout 7caec274fd19c12b55902a5b795100d21531391f
```

```jsonc
// lazy-lock.json
"nvim-treesitter": { "branch": "main", "commit": "7caec274..." }
```

그 다음 깨진 파서 강제 재컴파일:

```vim
:lua require('nvim-treesitter').install({'kotlin','vim'}, {force=true}):wait(180000)
```

## 부수 함정

- main 브랜치엔 `:TSUpdateSync`, `:TSInstallSync` **없다**. 동기 설치는 위처럼 `:wait()`로.
- `info: Installed 2/2 languages` 메시지는 비동기 작업 트리거 직후라 **실제 .so가 디스크에 떨어지기 전**에 출력될 수 있음. `ls site/parser/`로 확인.
- 신규 파서가 깔려야 새 쿼리(`..<`, `tab` 노드 등)와 짝이 맞는다. 쿼리 파일만 새것이고 파서가 옛것이면 에러.

## 교훈

`:TSUpdate`가 만능 해결책이 아니다. 에러가 안 풀리면 **버전 호환성**과 **lockfile vs spec 핀** 충돌부터 의심.
