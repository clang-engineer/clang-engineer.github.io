---
title       : LazyVim extra의 플러그인 spec에 의존성만 보강하기
description : "LazyVim extra의 spec을 같은 이름으로 다시 작성해 dependencies 배열만 머지 추가하는 방법"
date        : 2026-05-07 11:00:00 +0900
updated     : 2026-05-07 11:00:00 +0900
categories  : [lazyvim]
tags        : [neovim, lazyvim, lazy.nvim, refactoring.nvim]
pin         : false
hidden      : false
---

LazyVim extra가 제공하는 플러그인 spec을, 같은 이름으로 spec을 다시 작성해 **`dependencies` 배열만 추가** 머지할 수 있다.

## 문제

`lazyvim.plugins.extras.editor.refactoring` 활성화 시 다음 에러로 로드 실패:

```
refactoring.nvim/lua/refactoring.lua:45: module 'async' not found
```

`refactoring.nvim` 최근 master가 `lewis6991/async.nvim`을 의존성으로 추가했지만 LazyVim extra spec이 아직 반영하지 못한 상태 ([LazyVim#7130](https://github.com/LazyVim/LazyVim/issues/7130)).

## 해결 — override 파일 한 개

`lua/plugins/refactoring.lua`:

```lua
return {
  "ThePrimeagen/refactoring.nvim",
  dependencies = { "lewis6991/async.nvim" },
}
```

`:Lazy sync` 후 재로드:

```vim
:Lazy sync
:Lazy reload refactoring.nvim
```

## 핵심 동작

- lazy.nvim은 **같은 플러그인 이름**의 spec을 자동 머지한다
- `dependencies`는 **배열 병합** — 기존 plenary 등은 유지되고 새 항목만 추가됨
- 따라서 LazyVim extra의 모든 설정(키맵, opts, config)은 그대로 살아있고 의존성만 보강된다
- extra를 비활성화하거나 fork할 필요가 없음

## 일반화

LazyVim에서 비슷한 패턴이 필요한 경우:
- extra가 가져오는 플러그인의 누락 의존성 보강
- `event` / `cmd` / `keys` 추가 트리거
- `enabled = false`로 일부만 끄기

모두 같은 이름의 spec 파일을 `lua/plugins/`에 추가하면 머지된다.

## 참고

- [LazyVim issue #7130](https://github.com/LazyVim/LazyVim/issues/7130)
- [refactoring.nvim issue #522](https://github.com/ThePrimeagen/refactoring.nvim/issues/522)
- [lazy.nvim — spec merging](https://lazy.folke.io/spec)
