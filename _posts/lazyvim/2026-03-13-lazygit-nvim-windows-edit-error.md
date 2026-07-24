---
title       : "Windows에서 Neovim 내 Lazygit 'e' 키 에러 해결"
description : "nvim → lazygit에서 파일 편집 시 '[ is not recognized' 에러 해결 방법"
date        : 2026-03-13 10:30:00 +0900
updated     : 2026-07-24 15:00:00 +0900
categories  : [lazyvim, "Lazygit"]
tags        : [neovim, lazygit, windows, snacks, troubleshooting, oss-contrib]
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

Snacks는 이 생성 파일을 기존 `LG_CONFIG_FILE` 목록 또는 기본 `config.yml` 뒤에 추가한다. lazygit은 파일들을 순서대로 병합하므로 사용자 설정 전체가 사라지는 것은 아니지만, 뒤 파일의 `os.editPreset`처럼 **겹치는 키는 Snacks 값이 우선**한다.

`nvim-remote` preset은 내부적으로 다음과 같은 bash 문법을 사용한다:

{% raw %}
```bash
[ -z "$NVIM" ] && nvim -- {{filename}} || nvim --server "$NVIM" --remote-tab {{filename}}
```
{% endraw %}

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

lazygit 플러그인 설정 파일에서 snacks.nvim의 lazygit config를 오버라이드한다. 현행 lazygit schema에는 `editCommand`, `editCommandTemplate`, `shellArg` 필드가 없으므로 그런 키를 추가하지 않고 지원되는 `os.editPreset`만 바꾼다.

{% raw %}
```lua
-- ~/.config/nvim/lua/plugins/lazygit.lua
return {
  -- snacks.nvim lazygit: Windows에서 editPreset "nvim-remote"가
  -- POSIX shell 문법([)을 사용하므로 일반 nvim preset으로 전환
  {
    "folke/snacks.nvim",
    opts = {
      lazygit = {
        configure = true,
        config = {
          os = {
            editPreset = "nvim",
          },
        },
      },
    },
  },
}
```
{% endraw %}

이 설정은 부모 Neovim으로 remote-tab을 여는 대신 lazygit 터미널 안에서 일반 `nvim` 편집기를 실행한다. 부모 인스턴스 재사용이 꼭 필요하면 lazygit이 Windows용 `nvim-remote` 명령을 지원하는지 먼저 확인하고, 지원 전에는 문서화되지 않은 config 키나 강제 shell 전환을 섞지 않는다.

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

## 2026-06-12 추가

이 버그를 lazygit 본체까지 거슬러 올라가 OSS 이슈로 정리한 기록은 별도 글로 분리했다 → [lazygit nvim-remote preset의 cmd 분기 부재 — 본체로 거슬러 올라가 이슈 제기](/posts/opensource/2026-06-12-lazygit-nvim-remote-cmd-shell-missing/).
