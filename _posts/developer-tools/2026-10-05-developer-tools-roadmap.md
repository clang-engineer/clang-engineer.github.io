---
title       : "Developer Tools Roadmap — 개발 도구를 역할별로 보는 입구"
description : "편집기, 터미널, 셸, CLI/TUI, 버전 관리, 파일 관리, 생산성 도구를 같은 레이어의 대안과 서로 조합되는 도구로 나눠 읽는 개발 도구 로드맵."
date        : 2026-10-05 18:30:00 +0900
updated     : 2026-10-05 18:40:00 +0900
categories  : [developer-tools, "개요·인덱스"]
tags        : [developer-tools, roadmap, editor, terminal, shell, cli, tui, vcs]
redirect_from:
  - /posts/developer-tools/2026-10-05-development-environment-tool-map/
pin         : false
hidden      : false
---

개발 도구는 이름만 나열하면 관계가 잘 보이지 않는다. 중요한 건 **같은 레이어에서 경쟁하는 도구인지**, 아니면 **서로 다른 레이어에서 함께 조합되는 도구인지** 구분하는 것이다.

이 문서는 블로그 전반에 흩어진 개발 도구 글의 **통합 입구**다. 글을 억지로 한 디렉터리에 모으지 않고, 각 글은 가장 자연스러운 주제에 두되 이 로드맵에서 역할별로 연결한다.

## 전체 지도

```text
Developer Tools
├─ Editors
│  ├─ Neovim
│  ├─ Emacs
│  ├─ Helix
│  ├─ Zed
│  └─ Sublime Text
│
├─ Terminal / Session
│  ├─ Terminal Emulator
│  ├─ tmux
│  └─ TUI
│
├─ Shell / Environment
│  ├─ direnv
│  ├─ zoxide
│  └─ dotfiles tools
│      ├─ chezmoi
│      └─ yadm / bare git
│
├─ CLI / TUI Utilities
│  ├─ fzf
│  ├─ bat
│  ├─ btop
│  ├─ Yazi
│  └─ Harlequin
│
├─ Version Control
│  ├─ Git
│  │  ├─ git CLI
│  │  ├─ lazygit
│  │  └─ delta
│  └─ Jujutsu
│      ├─ jj
│      └─ jjui
│
└─ Productivity / Extensible Tools
   ├─ Obsidian
   └─ Raycast / Alfred / Spotlight
```

이 Roadmap이 전체 입구다. 세부 관계는 아래 지도로 내려간다.

- [Editor Map — Vim·Neovim·Emacs·Helix·Zed의 관계]({% post_url developer-tools/2026-10-05-editor-map %})
- [VCS Map — SVN·Git·Jujutsu와 lazygit·jjui의 레이어]({% post_url developer-tools/2026-10-05-vcs-map %})
- [Window Management Map — i3·sway·AeroSpace·yabai·Rectangle의 관계]({% post_url developer-tools/2026-10-05-window-management-map %})
- Terminal/TUI는 기존 [Terminal Roadmap]({% post_url terminal/2026-09-05-terminal-roadmap %})이 이미 관계도 역할을 한다.

## 1. Editors

같은 레이어에서 가장 직접적으로 비교되는 도구들이다.

```text
Editor
├─ Neovim      조립형 modal editor / platform
├─ Emacs       Elisp runtime 위의 programmable environment
├─ Helix       selection-first modal editor
├─ Zed         native GUI + integrated tooling
└─ Sublime     빠른 전통적 GUI editor
```

관계는 [Editor Map]({% post_url developer-tools/2026-10-05-editor-map %})에서 먼저 본다.

깊이 있는 글:

- [LazyVim 사용자가 본 Emacs — 에디터가 아니라 Elisp 런타임]({% post_url developer-tools/2026-07-03-neovim-user-view-of-emacs %})
- [Neovim Roadmap]({% post_url neovim/2026-06-16-neovim-roadmap %})

## 2. Terminal / Session / TUI

터미널 자체, 세션 관리자, 그 위에서 동작하는 TUI 애플리케이션은 서로 다른 레이어다.

```text
Terminal Emulator
        ↓
      Shell
        ↓
      tmux
        ↓
 CLI / TUI Applications
```

관련 글:

- [Terminal Roadmap]({% post_url terminal/2026-09-05-terminal-roadmap %})
- [tmux Roadmap]({% post_url tmux/2026-06-16-tmux-roadmap %})
- [TUI의 역사와 현대 Framework]({% post_url terminal/2026-09-05-tui-history-and-modern-frameworks %})
- [현대 TUI Framework의 추상화]({% post_url terminal/2026-09-05-modern-tui-frameworks-abstraction %})
- [Neovim을 TUI Platform으로 보기]({% post_url terminal/2026-09-05-neovim-as-tui-platform %})

## 3. Shell / Environment

이 도구들은 독립 프로그램이지만 셸과 프로젝트 환경에 밀접하게 붙는다. 따라서 파일은 `shell`에 두고 이 로드맵에서 함께 연결하는 편이 자연스럽다.

### 프로젝트 환경

- [direnv 사용법 정리]({% post_url shell/2026-02-21-direnv %}) — 디렉터리 단위 환경 변수
- [zoxide로 디렉터리 이동 빠르게]({% post_url shell/2026-07-03-zoxide-directory-jump %}) — frecency 기반 directory jump

### dotfiles

- [Dotfiles Roadmap]({% post_url shell/2026-07-08-dotfiles-roadmap %})
- [chezmoi 사용법 — 소스 표현과 apply 흐름]({% post_url shell/2026-07-08-chezmoi-usage-source-apply %})
- [chezmoi vs 심링크 dotfiles]({% post_url shell/2026-07-08-chezmoi-vs-symlink-dotfiles %})
- [bare git repo · yadm로 dotfiles 관리하기]({% post_url shell/2026-07-08-dotfiles-bare-git-yadm %})

## 4. CLI / TUI Utilities

작지만 개발 흐름을 크게 바꾸는 독립 도구들이다.

### 파일 탐색

- [Yazi는 단순한 파일 탐색기가 아니다]({% post_url shell/2026-09-04-yazi-terminal-file-manager %})

Yazi는 `shell`에 있지만 성격상 이 로드맵에서도 중요한 독립 개발 도구다.

### 시스템 모니터링

- [top · htop · btop 시스템 모니터링]({% post_url linux/2026-08-26-top-htop-btop-system-monitoring %})

### DB TUI

- [Vertica에서 쓸 만한 터미널 DB 클라이언트는 무엇일까?]({% post_url db/2026-09-05-harlequin-vertica-tui-db-client %})

Harlequin 자체는 개발 도구지만 현재 글은 Vertica 비교가 중심이므로 `db`에 남겨두는 게 자연스럽다.

## 5. Version Control

먼저 [VCS Map]({% post_url developer-tools/2026-10-05-vcs-map %})에서 **VCS 자체와 그 UI 레이어**를 분리해서 본다.

```text
Git                  Jujutsu
├─ git CLI           ├─ jj CLI
├─ lazygit           └─ jjui
└─ delta
```

현재 글:

- [Git Roadmap]({% post_url git/2026-10-01-git-roadmap %})
- [Git delta pager]({% post_url git/2026-08-12-git-delta-pager %})

## 6. Window Management

창 관리 도구도 같은 이름 아래 여러 레이어가 섞인다.

- [Window Management Map — i3·sway·AeroSpace·yabai·Rectangle의 관계]({% post_url developer-tools/2026-10-05-window-management-map %})
- [AeroSpace 기본]({% post_url macos/2026-07-03-aerospace-basics %})
- [Hammerspoon 기본]({% post_url macos/2026-07-03-hammerspoon-basics %})
- [Rectangle.app 기본]({% post_url macos/2026-07-03-rectangle-app-basics %})

관계도에서는 i3/sway/AeroSpace/yabai 같은 tiling 계열과 Rectangle 같은 placement utility, Hammerspoon 같은 automation runtime을 분리한다.

## 7. Productivity / Extensible Tools

코딩만 하는 도구는 아니지만 개발자의 작업 환경을 구성하거나 확장 플랫폼 역할을 하는 도구들이다.

### Obsidian

- [Obsidian Plugin Architecture 이해하기]({% post_url reference/tools/2026-08-30-obsidian-plugin-architecture %})

### Launcher

- [macOS Launcher 비교 — Spotlight vs Alfred vs Raycast]({% post_url macos/2025-10-31-productivity-launchers %})

이 글은 macOS 의존성이 강하므로 `macos`에 남겨두되, 개발 환경 관점에서는 여기에서도 찾아갈 수 있게 한다.

## 분류 원칙

이 로드맵에서는 **물리적인 저장 위치와 개념적인 분류를 분리**한다.

```text
파일 위치
→ 가장 자연스러운 기술 영역에 둔다.

Developer Tools Roadmap
→ 여러 영역의 도구 글을 역할별로 다시 연결한다.
```

예를 들어:

```text
Yazi      → shell에 저장
Harlequin → db에 저장
btop      → linux에 저장
Raycast   → macos에 저장
Emacs     → developer-tools에 저장

하지만 모두 Developer Tools Roadmap에서 만난다.
```

따라서 새 도구를 발견했다고 매번 `developer-tools`로 파일을 이동할 필요는 없다. **독립 주제가 없는 도구나 여러 영역을 가로지르는 비교 글만 `developer-tools`에 두고, 도메인이 분명한 글은 원래 영역에 둔다.**

## 읽는 순서

처음 들어왔다면 다음 정도면 충분하다.

1. 이 Developer Tools Roadmap에서 전체 레이어를 본다.
2. Editor / VCS / Window Management 같은 관계도로 내려간다.
3. 같은 레이어의 대안과 장단점을 비교한다.
4. 실제 사용법이 필요할 때 개별 도구 글로 내려간다.

이 구조를 유지하면 디렉터리를 깊게 만들지 않고도 글이 늘어날수록 관계가 더 잘 보인다.
