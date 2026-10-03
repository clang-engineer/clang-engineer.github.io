---
title       : "오픈소스 기여 기록"
description : "직접 만든 공개 패키지와 upstream에 보낸 PR을 한곳에 관리하는 개인 오픈소스 활동 로그."
date        : 2026-10-03 13:00:00 +0900
categories  : [reference, "open-source"]
tags        : [open-source, github, contribution, log]
pin         : false
hidden      : false
---

공개 저장소와 upstream PR을 한곳에서 관리하기 위한 개인 기록이다. GitHub profile이나 About에 PR을 길게 나열하면 과해 보이므로, 상세 이력은 이 글에 모아둔다.

## 직접 만든 공개 패키지

| 프로젝트 | 설명 | 배포·등록 |
|---|---|---|
| [harlequin-h2](https://github.com/clang-engineer/harlequin-h2) | Harlequin용 H2 JDBC community adapter | [PyPI](https://pypi.org/project/harlequin-h2/), [Harlequin 공식 문서 PR](https://github.com/tconbeer/harlequin-web/pull/162) merged |
| [harlequin-odbc-vertica](https://github.com/clang-engineer/harlequin-odbc-vertica) | Harlequin용 Vertica ODBC community adapter | [PyPI](https://pypi.org/project/harlequin-odbc-vertica/), [공식 문서 PR](https://github.com/tconbeer/harlequin-web/pull/163) 진행 중 |
| [jvm-env.nvim](https://github.com/clang-engineer/jvm-env.nvim) | Neovim에서 jdtls·Gradle용 JDK 경로를 분리해 주입하는 plugin | [awesome-neovim PR](https://github.com/rockerBOO/awesome-neovim/pull/2365) merged |
| [dadbod-vertica.nvim](https://github.com/clang-engineer/dadbod-vertica.nvim) | vim-dadbod용 Vertica adapter | [awesome-neovim PR](https://github.com/rockerBOO/awesome-neovim/pull/2355) merged |
| [pi-extensions](https://github.com/clang-engineer/pi-extensions) | Pi coding agent extension monorepo | [`@clang.engineer/pi-notify`](https://www.npmjs.com/package/@clang.engineer/pi-notify) npm 배포 |

## Upstream PR

| PR | 상태 | 내용 |
|---|---|---|
| [anomalyco/opentui#1460](https://github.com/anomalyco/opentui/pull/1460) | merged | tmux terminal capability reply가 요청한 pane에 머물도록 수정 |
| [tconbeer/harlequin-web#162](https://github.com/tconbeer/harlequin-web/pull/162) | merged | Harlequin H2 community adapter 공식 문서 등록 |
| [tconbeer/harlequin-web#163](https://github.com/tconbeer/harlequin-web/pull/163) | open | Harlequin Vertica community adapter 공식 문서 제안 |
| [rockerBOO/awesome-neovim#2355](https://github.com/rockerBOO/awesome-neovim/pull/2355) | merged | `dadbod-vertica.nvim` 등록 |
| [rockerBOO/awesome-neovim#2365](https://github.com/rockerBOO/awesome-neovim/pull/2365) | merged | `jvm-env.nvim` 등록 |
| [Dking08/textual-vim-textarea#2](https://github.com/Dking08/textual-vim-textarea/pull/2) | merged | word/quote text object 추가 |
| [hiroppy/tmux-agent-sidebar#123](https://github.com/hiroppy/tmux-agent-sidebar/pull/123) | open | sidebar cleanup과 target window 처리 개선 제안 |

## 관련 글

- [작은 Pi extension을 만들고 npm에 배포하기](./2026-10-03-pi-notify-extension.md)
