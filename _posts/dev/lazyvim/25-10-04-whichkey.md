---
title       : Which-Key Keymaps 정리
description : 
date        : 2025-10-04 14:48:24 +0900
updated     : 2025-10-04 14:50:43 +0900
categories  : ["dev", "lazyvim"]
tags        : ["lazyvim", "which-key", "keymaps", "prefix"]
pin         : false
hidden      : false
---

# Which-Key Keymaps 정리
- which-key는 등록된 keymap과 설정된 prefix 그룹을 탐지.
- prefix 키 조합을 누르면 관련 명령어 그룹과 설명을 팝업으로 표시

| 키 조합        | 그룹 / 설명                                  | 비고 |
| -------------- | ------------------------------------------ | ---- |
| `<leader><tab>` | Tabs                                        | 탭 관련 명령어 |
| `<leader>c`    | Code                                        | 코드 관련 명령어 |
| `<leader>d`    | Debug                                       | 디버그 관련 |
| `<leader>dp`   | Profiler                                    | 성능 분석 관련 |
| `<leader>f`    | File / Find                                 | 파일 열기 / 검색 |
| `<leader>g`    | Git                                         | Git 명령어 |
| `<leader>gh`   | Hunks                                       | Git hunk 관련 |
| `<leader>q`    | Quit / Session                              | 종료 및 세션 관련 |
| `<leader>s`    | Search                                      | 검색 관련 |
| `<leader>u`    | UI                                          | UI 관련 명령어 |
| `<leader>x`    | Diagnostics / Quickfix                      | 진단 / 빠른 수정 |
| `[ `           | Prev                                        | 이전 항목 이동 |
| `] `           | Next                                        | 다음 항목 이동 |
| `g`            | Goto                                        | 이동 관련 (definition, references 등) |
| `gs`           | Surround                                    | 텍스트 surround 관련 |
| `z`            | Fold                                        | 코드 접기 / 펼치기 |
| `<leader>b`    | Buffer                                      | 버퍼 관련 (동적 확장) |
| `<leader>w`    | Windows                                     | 창 관리 (`<C-w>` 기반) |
| `gx`           | Open with system app                         | 단일 명령어 |
| `<leader>?`    | Buffer Keymaps (which-key 메뉴 열기)         | 현재 버퍼에서 메뉴 표시 |
| `<C-w><space>` | Window Hydra Mode                            | 창 관련 Hydra 모드 열기 |

## 설정 코드

```lua
{
  "folke/which-key.nvim",
  event = "VeryLazy",
  opts_extend = { "spec" },
  opts = {
    preset = "helix",
    defaults = {},
    spec = {
      {
        mode = { "n", "v" },
        { "<leader><tab>", group = "tabs" },
        { "<leader>c", group = "code" },
        { "<leader>d", group = "debug" },
        { "<leader>dp", group = "profiler" },
        { "<leader>f", group = "file/find" },
        { "<leader>g", group = "git" },
        { "<leader>gh", group = "hunks" },
        { "<leader>q", group = "quit/session" },
        { "<leader>s", group = "search" },
        { "<leader>u", group = "ui" },
        { "<leader>x", group = "diagnostics/quickfix" },
        { "[", group = "prev" },
        { "]", group = "next" },
        { "g", group = "goto" },
        { "gs", group = "surround" },
        { "z", group = "fold" },
        {
          "<leader>b",
          group = "buffer",
          expand = function()
            return require("which-key.extras").expand.buf()
          end,
        },
        {
          "<leader>w",
          group = "windows",
          proxy = "<c-w>",
          expand = function()
            return require("which-key.extras").expand.win()
          end,
        },
        -- better descriptions
        { "gx", desc = "Open with system app" },
      },
    },
  },
  keys = {
    {
      "<leader>?",
      function()
        require("which-key").show({ global = false })
      end,
      desc = "Buffer Keymaps (which-key)",
    },
    {
      "<c-w><space>",
      function()
        require("which-key").show({ keys = "<c-w>", loop = true })
      end,
      desc = "Window Hydra Mode (which-key)",
    },
  },
  config = function(_, opts)
    local wk = require("which-key")
    wk.setup(opts)
    if not vim.tbl_isempty(opts.defaults) then
      LazyVim.warn("which-key: opts.defaults is deprecated. Please use opts.spec instead.")
      wk.register(opts.defaults)
    end
  end,
}
```
