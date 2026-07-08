---
title       : "snacks explorer의 focus는 nvim cwd를 안 바꾼다 — 트리에서 lazygit이 엉뚱한 곳에서 열릴 때"
description : "snacks explorer의 . focus는 picker 필터 root만 바꾸고 nvim cwd는 그대로다. nested repo 트리에서 lazygit이 엉뚱한 폴더에서 열리는 원인과 tcd 다리."
date        : 2026-07-08 10:00:00 +0900
updated     : 2026-07-08 10:00:00 +0900
categories  : [lazyvim]
tags        : [neovim, snacks, explorer, lazygit, cwd, git]
pin         : false
hidden      : false
---

## 증상

git repo가 아닌 상위 폴더(예: `~/dev`) 아래에 여러 repo가 흩어져 있는 구조.
snacks explorer(`<leader>e`)를 그 상위에서 열고, 트리에서 특정 subrepo 폴더로 `.`(focus)를 눌러
들어간 다음 `<leader>gg`(lazygit)를 누르면 — **그 repo가 아니라 원래 상위(non-git) 폴더에서** lazygit이 열린다.
non-git이라 lazygit 바이너리가 "not a git repository"를 뱉으며 잠깐 떴다 닫혀 **짧은 hang처럼** 보인다.

## 원인 1 — `.`(focus)는 picker cwd만 바꾼다

explorer의 `.`는 `explorer_focus` 액션이고, 내부적으로 `picker:set_cwd(picker:dir())`를 호출한다.
그런데 `set_cwd`는 picker의 **필터 root**(picker 내부 cwd)만 갱신할 뿐, `:cd`/`:tcd`를 하지 **않는다**.

```lua
-- snacks picker core
function M:set_cwd(cwd)
  self.input.filter:set_cwd(cwd)  -- picker 내부 필터 root만
  self.opts.cwd = cwd
end
```

즉 `.`로 트리를 subrepo로 좁혀 들어가도 **nvim의 실제 cwd는 그대로**다.
lazygit·grep 같은 **cwd 기반 명령엔 아무 영향이 없다.** 이건 버그가 아니라
"explorer는 뷰(view)지 cwd 변경기가 아니다"라는 의도된 분리다.

## 원인 2 — `<leader>gg`는 버퍼 경로 → cwd로 폴백

LazyVim 기본 매핑:

```lua
<leader>gg = Snacks.lazygit({ cwd = LazyVim.root.git() })  -- Root Dir
<leader>gG = Snacks.lazygit()                              -- cwd
```

`LazyVim.root.git()`은 **현재 버퍼의 파일 경로**를 우선으로 root를 탐지한다(LSP → `.git` 패턴).
그런데 explorer 버퍼는 파일 경로가 없어서 **cwd로 폴백**한다.
그 cwd가 non-git 상위 폴더면 lazygit이 거기서 열려 위 증상이 난다.

## 해결 — 커스텀 없이, `<C-c>`(tcd)로 다리 놓기

snacks explorer 기본 키맵에 이미 **`<C-c>` = `tcd`**가 있다. focus한 폴더를 nvim (탭) cwd로 바꿔준다.

```text
트리에서 폴더 위 → <C-c>(tcd) → <leader>gg / <leader>gG
#  <C-c>로 nvim cwd 자체가 그 repo로 옮겨지므로 lazygit이 정위치에서 열린다
```

두 키의 차이를 한 번에:

| 키 | 바뀌는 것 | 영향 범위 |
|----|-----------|-----------|
| `.` (`explorer_focus`) | explorer 트리 표시 root | 트리 표시만 (cwd 무관) |
| `<BS>` (`explorer_up`) | 트리 root 한 단계 상위 | `.` 되돌리기 |
| `<C-c>` (`tcd`) | nvim (탭) cwd | grep·lazygit 등 cwd 기반 전부 |

### 대안 (둘 다 표준)

```text
<leader>fp            # 프로젝트 picker로 통째 이동 (cwd 변경 후 gg)
파일 열고 <leader>gg  # 버퍼 경로로 repo 자동 인식 (cwd 무관)
```

cwd가 바뀌는 걸 이미 받아들이는 워크플로우(`<leader>fp`)를 쓰고 있었다면, `<C-c>` 흐름으로 충분하다.

## (선택) cwd를 안 바꾸고 한 키로 열고 싶다면

`.`로 좁힌 상태 그대로, cwd를 건드리지 않고 **커서 위 항목의 git root**에서 lazygit을 열고 싶다면
explorer source에 액션을 하나 더할 수 있다.

```lua
-- lua/plugins/explorer.lua 의 sources.explorer 안
win = { list = { keys = { ["<leader>gg"] = "explorer_lazygit" } } },
actions = {
  explorer_lazygit = function(picker)
    local root = Snacks.git.get_root(picker:dir())  -- 커서 항목의 git root
    if root then
      Snacks.lazygit({ cwd = root })
    else
      Snacks.notify.warn("not a git repo: " .. picker:dir())
    end
  end,
}
```

`win.list.keys`라 explorer 창 버퍼에서만 유효해 전역 `<leader>gg`는 그대로다(스코프 안전).
다만 위 `<C-c>` 표준 흐름으로 대체 가능하므로 대개는 불필요하다 —
**커스텀을 짜기 전에 소스 기본 키맵부터 확인하는 게 먼저다.**
