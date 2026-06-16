---
title       : "Neovim floating window + tmux 이동/복귀 포커스 문제 해결"
description : "vim-tmux-navigator가 float에서 한 번에 안 넘어가는 문제와 복귀 시 포커스 빠지는 문제를 tmux 직접 호출 + FocusGained로."
date        : 2026-06-08 14:00:00 +0900
updated     : 2026-06-08 14:00:00 +0900
categories  : [lazyvim, "플러그인"]
tags        : [neovim, snacks, troubleshooting]
pin         : false
hidden      : false
---

vim-tmux-navigator 사용 시 floating window에서 tmux pane 이동이 두 번 눌러야 되는 문제와, 복귀 시 포커스가 뒤쪽 버퍼로 빠지는 문제 해결.

## 문제

1. float에서 `<C-h/j/k/l>` → vim 윈도우가 있으니 float→버퍼로 이동 → 한번 더 눌러야 tmux 이동
2. tmux에서 돌아오면 float가 아닌 뒤쪽 버퍼에 포커스

## 해결: tmux 직접 호출 + FocusGained 재포커스

```lua
-- float 안에서 vim-tmux-navigator 우회, tmux 직접 호출
local function tmux_move(direction)
  return function()
    vim.fn.system("tmux select-pane -" .. direction)
  end
end

local win = Snacks.win({
  file = path,
  keys = {
    q = "close",
    ["<C-h>"] = { tmux_move("L"), desc = "tmux left" },
    ["<C-j>"] = { tmux_move("D"), desc = "tmux down" },
    ["<C-k>"] = { tmux_move("U"), desc = "tmux up" },
    ["<C-l>"] = { tmux_move("R"), desc = "tmux right" },
  },
})

-- 복귀 시 float로 재포커스
local aug = vim.api.nvim_create_augroup("toolbox_refocus", { clear = true })
vim.api.nvim_create_autocmd("FocusGained", {
  group = aug,
  callback = function()
    if win.win and vim.api.nvim_win_is_valid(win.win) then
      vim.api.nvim_set_current_win(win.win)
    else
      vim.api.nvim_del_augroup_by_id(aug)
    end
  end,
})
```

## 핵심

- `vim.fn.system("tmux select-pane -X")`로 vim 윈도우 탐색을 건너뛰고 tmux 직접 이동
- float를 닫지 않고 유지 → 돌아오면 `FocusGained`로 자동 재포커스
- `tmux select-pane` 방향: `-L`(좌), `-D`(하), `-U`(상), `-R`(우)
