---
title       : "Windows에서 Neovim 내 Lazygit 'e' 키 에러 해결"
description : "nvim → lazygit에서 파일 편집 시 '[ is not recognized' 에러 해결 방법"
date        : 2026-03-13 10:30:00 +0900
updated     : 2026-03-13 10:30:00 +0900
categories  : [dev, vim]
tags        : [neovim, lazygit, windows, snacks.nvim, troubleshooting]
pin         : false
hidden      : false
---

## 증상

Windows 환경에서 **Neovim 안에서 lazygit을 실행**한 뒤, 파일 목록에서 `e`를 눌러 에디터를 열면 다음 에러가 발생한다.

```
[ is not recognized as an internal or external command, operable program or batch file
```

단독으로 lazygit을 실행했을 때는 정상 동작하고, **nvim → lazygit** 경로에서만 발생한다.

## 원인

LazyVim에 기본 포함된 **snacks.nvim**이 lazygit 실행 시 아래와 같은 설정을 자동 생성한다.

```yaml
# lazygit-theme.yml (snacks.nvim이 자동 생성)
os:
  editPreset: "nvim-remote"
```

이 파일을 `LG_CONFIG_FILE` 환경변수로 lazygit에 전달하여, 사용자의 `config.yml`을 **덮어쓴다**.

`nvim-remote` preset은 내부적으로 다음과 같은 bash 문법을 사용한다:

```bash
[ -z "$NVIM" ] && nvim -- {{filename}} || nvim --server "$NVIM" --remote-tab {{filename}}
```

nvim의 내장 터미널은 Windows 기본 shell(cmd.exe)을 사용하므로, bash 전용 명령어인 `[`를 인식하지 못해 에러가 발생한다.

### 흐름 요약

```
nvim (shell=cmd.exe)
  → lazygit (snacks.nvim이 editPreset="nvim-remote" 주입)
    → 'e' 키 → "[ -z "$NVIM" ] && ..." 실행
      → cmd.exe가 '[' 명령을 인식 못함 → 에러
```

## 해결

### 1. snacks.nvim lazygit 설정 오버라이드

lazygit 플러그인 설정 파일에서 snacks.nvim의 lazygit config를 오버라이드한다.

```lua
-- ~/.config/nvim/lua/plugins/lazygit.lua
return {
  "kdheepak/lazygit.nvim",
  lazy = true,
  dependencies = {
    "nvim-lua/plenary.nvim",
  },

  -- snacks.nvim lazygit: Windows에서 editPreset "nvim-remote"가
  -- bash 문법([)을 사용하여 cmd.exe에서 에러 발생 → 비활성화
  {
    "folke/snacks.nvim",
    opts = {
      lazygit = {
        configure = true,
        config = {
          os = {
            editPreset = "",
            editCommand = "nvim",
            editCommandTemplate = '{{editor}} -- "{{filename}}"',
            shell = "bash",
            shellArg = "-c",
          },
        },
      },
    },
  },
}
```

### 2. 캐시 정리

snacks.nvim이 이전에 생성한 theme 파일을 삭제한다. nvim 재시작 시 새 설정으로 재생성된다.

```bash
rm ~/AppData/Local/nvim-data/lazygit-theme.yml
```

## 환경

- Windows 11
- Neovim 0.11.5
- LazyVim (snacks.nvim 포함)
- lazygit 0.44+
- Git Bash
