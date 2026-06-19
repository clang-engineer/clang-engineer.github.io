---
title       : 'nvim-treesitter "..<" query 에러 — 파서 버전 불일치부터 main 브랜치/0.12 함정까지'
description : "Kotlin rangeUntil(..<) 노드 에러의 진단/복구. :TSUpdate로 안 풀리면 nvim-treesitter main 브랜치가 nvim 0.11에 갇혔는지, lockfile이 LazyVim 핀을 덮었는지까지 추적한다."
date        : 2026-05-08 10:00:00 +0900
updated     : 2026-06-19 09:00:00 +0900
categories  : [lazyvim, "LSP·Treesitter"]
tags        : [neovim, treesitter, kotlin, snacks, lazy-nvim, troubleshooting]
pin         : false
hidden      : false
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

캐시가 꼬여 있으면 강제로 다시 깔자.

```sh
rm -rf ~/.local/share/nvim/lazy/nvim-treesitter/parser/kotlin.so
nvim --headless "+TSInstallSync kotlin" +qa
```

## :TSUpdate로 안 고쳐지면 — main 브랜치가 nvim 0.11에 갇힌 경우

`Invalid node type "..<"` 에러가 `:TSUpdate`로 안 고쳐지면, **nvim-treesitter rewrite(`main` 브랜치)가 nvim 0.11에 깔려있는 상태**일 가능성이 높다. main은 `vim.list.unique` 등 **Neovim 0.12+ API**를 써서 0.11에선 install/update 자체가 조용히 실패한다.

### 어떻게 이 상태가 되나

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

### 진단 한 줄

```vim
:lua print(vim.fn.has('nvim-0.12'), type(vim.list))
```

`0  nil`이면 0.11인데 main 브랜치에 갇혀있는지 의심.

### 복구

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

### 부수 함정

- main 브랜치엔 `:TSUpdateSync`, `:TSInstallSync` **없다**. 동기 설치는 위처럼 `:wait()`로.
- `info: Installed 2/2 languages` 메시지는 비동기 작업 트리거 직후라 **실제 .so가 디스크에 떨어지기 전**에 출력될 수 있음. `ls site/parser/`로 확인.
- 신규 파서가 깔려야 새 쿼리(`..<`, `tab` 노드 등)와 짝이 맞는다. 쿼리 파일만 새것이고 파서가 옛것이면 에러.

## 교훈

- `nvim-treesitter` 업데이트 = **쿼리 파일** 업데이트지 **파서 바이너리** 업데이트가 아니다. 파서는 `:TSUpdate`로 따로 갱신해야 짝이 맞는다.
- `highlights.scm`을 직접 수정하는 우회는 `:Lazy sync` 한 번이면 날아가니까 비추천. 정말 필요하면 `after/queries/<lang>/`에 override를 둔다.
- `:TSUpdate`가 만능 해결책이 아니다. 에러가 안 풀리면 **버전 호환성**과 **lockfile vs spec 핀** 충돌부터 의심.
