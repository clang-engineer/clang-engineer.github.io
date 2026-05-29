---
title       : 'nvim-treesitter kotlin 쿼리의 "..<" 노드 에러는 파서 버전 불일치'
description : "Kotlin 1.7.20 rangeUntil 연산자(..<)를 모르는 옛 파서가 새 highlights 쿼리와 충돌할 때의 진단/복구"
date        : 2026-05-08 10:00:00 +0900
updated     : 2026-05-08 10:00:00 +0900
categories  : [dev, lazyvim]
tags        : [neovim, treesitter, kotlin, snacks-nvim, lazyvim]
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

## 교훈

- `nvim-treesitter` 업데이트 = **쿼리 파일** 업데이트지 **파서 바이너리** 업데이트가 아니다. 파서는 `:TSUpdate`로 따로 갱신해야 짝이 맞는다.
- `highlights.scm`을 직접 수정하는 우회는 `:Lazy sync` 한 번이면 날아가니까 비추천. 정말 필요하면 `after/queries/<lang>/`에 override를 둔다.
