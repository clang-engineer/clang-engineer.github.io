---
title       : "Developer Tools Roadmap — 도구 탐색에서 원리 학습으로"
description : "도구 비교와 사용법은 Devkit에서 탐색하고, 터미널·편집기·버전 관리·자동화의 작동 원리는 블로그 로드맵에서 공부한다."
date        : 2026-10-05 18:30:00 +0900
updated     : 2026-10-11 19:22:00 +0900
categories  : [developer-tools, "개요·인덱스"]
tags        : [developer-tools, roadmap, editor, terminal, shell, cli, tui, vcs]
redirect_from:
  - /posts/developer-tools/2026-10-05-development-environment-tool-map/
pin         : false
hidden      : false
---

이 문서는 **도구 목록의 또 다른 복사본이 아니라 학습을 시작하는 입구**다. 어떤 도구가 있는지, 무엇을 대체·보완하는지, 명령은 어떻게 쓰는지는 [Devkit 도구 지도와 치트시트]({{ '/devkit/' | relative_url }})에서 탐색한다. 블로그는 그 도구들이 동작하는 **원리와 실행 모델**을 이해하는 데 집중한다.

```text
Devkit: 무엇을 쓸까?                  Blog: 왜 그렇게 동작할까?
도구 지도 ─ 관계·대안·보완          Terminal / PTY / TUI
치트시트 ─ 명령·설정·원문           Editor / Runtime / Plugin
tldr ─ 실시간 빠른 예시             VCS / Commit / Revision
            │                                  ▲
            └──── 선택한 도구의 심화 글 ───────┘
```

## 분야별 학습 경로

| 질문 | 개념 학습 입구 | 도구 탐색 |
|---|---|---|
| 터미널에 입력한 명령은 어떻게 실행되나? | [Terminal Roadmap]({% post_url terminal/2026-09-05-terminal-roadmap %}) · [Shell Roadmap]({% post_url shell/2026-07-03-shell-roadmap %}) | [Devkit]({{ '/devkit/' | relative_url }}) |
| Vim·Neovim은 어떤 실행 모델과 확장 구조를 갖나? | [Neovim Roadmap]({% post_url neovim/2026-06-16-neovim-roadmap %}) · [Emacs의 Elisp 런타임]({% post_url developer-tools/2026-07-03-neovim-user-view-of-emacs %}) | [Devkit]({{ '/devkit/' | relative_url }}) |
| Git의 작업 트리·인덱스·커밋은 무엇인가? | [Git Roadmap]({% post_url git/2026-10-01-git-roadmap %}) · [Jujutsu 작업 모델]({% post_url git/2026-10-10-jujutsu-git-alternative %}) | [Devkit]({{ '/devkit/' | relative_url }}) |
| 세션과 창을 분리하는 이유는? | [tmux Roadmap]({% post_url tmux/2026-06-16-tmux-roadmap %}) | [Devkit]({{ '/devkit/' | relative_url }}) |
| 도구 설정을 여러 환경에 재현하려면? | [Dotfiles Roadmap]({% post_url shell/2026-07-08-dotfiles-roadmap %}) | [Devkit]({{ '/devkit/' | relative_url }}) |
| 에이전트와 개발 도구는 어떻게 조합되나? | [AI 코딩 도구 지형]({% post_url ai/2026-07-03-ai-coding-tools-landscape %}) · [tmux 에이전트 상태 감지]({% post_url tmux/2026-07-09-tmux-ai-agent-status-detection %}) | [Devkit]({{ '/devkit/' | relative_url }}) |

## 도구 비교와 기술 원리를 구분하기

```text
fd ↔ find, bat ↔ cat
  └─ 대안·옵션·사용법 → Devkit

Terminal Emulator → PTY → Shell → Process
  └─ 실행·입출력·제어 원리 → Blog

Git ↔ Jujutsu, lazygit ↔ jjui
  └─ 제품·도구 선택 → Devkit
  └─ index / change / revision / operation log → Blog
```

기존에 작성한 [Editor 비교]({% post_url developer-tools/2026-10-05-editor-map %}), [VCS 비교]({% post_url developer-tools/2026-10-05-vcs-map %}), [Window Management 비교]({% post_url developer-tools/2026-10-05-window-management-map %})는 과거 링크와 상세 비교 설명을 보존하기 위해 유지한다. 앞으로 도구의 단순 목록·장단점·관계는 Devkit 원본 카탈로그에서 관리하고, 블로그의 심화 설명은 학습 문서로 남긴다.

## 읽는 순서

1. [Devkit]({{ '/devkit/' | relative_url }})에서 도구의 위치와 관계를 확인한다.
2. 필요한 도구의 tldr·치트시트·공식 문서로 사용법을 익힌다.
3. 실행 원리가 궁금해지면 위 표의 블로그 로드맵을 따라간다.

> **도구 카탈로그의 원본은 Devkit, 학습 경로와 작동 원리의 원본은 블로그**다. 같은 비교 표와 도구 목록을 두 곳에서 계속 관리하지 않는다.
