---
title       : "Neovim DAP — LSP의 형제, 디버깅용 프로토콜"
description : "DAP(Debug Adapter Protocol)는 LSP와 같은 뿌리(VS Code)에서 나온 디버깅용 표준이다. nvim-dap 플러그인 스택, 언어별 어댑터(debugpy·delve·codelldb), 그리고 LSP와 결정적으로 다른 '세션 중에만 뜨는' 생명주기를 정리한다."
date        : 2026-07-12 19:20:00 +0900
updated     : 2026-07-12 19:20:00 +0900
categories  : [neovim, "플러그인·생태계"]
tags        : [dap, debug, lsp, nvim-dap, mason]
pin         : false
hidden      : false
---

Neovim에서 디버깅을 붙이려면 DAP를 만난다. LSP를 이해했다면 DAP는 그 형제라 금방 잡힌다 — 둘 다 VS Code가 만든 표준이고, 구조가 판박이다.

## DAP는 LSP의 디버깅 버전

- **LSP(Language Server Protocol)** — 코드 **편집·분석**용 표준. 자동완성, 정의 이동, 에러 표시.
- **DAP(Debug Adapter Protocol)** — **디버깅**용 표준. 브레이크포인트, 스텝 실행, 변수·콜스택 확인.

둘 다 Microsoft가 VS Code를 만들며 설계한 프로토콜이고, 에디터와 언어별 도구(분석기/디버거)를 표준 규약으로 잇는다는 아이디어가 같다. 그래서 **서버·어댑터는 에디터 중립**이라 VS Code와 Neovim이 같은 걸 공유한다. Go를 예로 들면 편집엔 gopls(LSP), 디버깅엔 delve(DAP)가 붙고, 이건 VS Code에서도 똑같다.

## nvim-dap 플러그인 스택

Neovim에서 DAP 클라이언트 역할은 `nvim-dap`이 한다. 주변 플러그인이 UI·편의를 얹는다.

| 플러그인 | 역할 |
|---|---|
| `nvim-dap` | 핵심 DAP 클라이언트 |
| `nvim-dap-ui` | 변수·콜스택·스코프·watch 패널 UI |
| `nvim-dap-virtual-text` | 코드 옆에 변수 값 인라인 표시 |
| `mason-nvim-dap` | 디버그 어댑터 설치 관리(mason 연동) |

언어별로 **어댑터를 따로** 설정한다 — Python은 `debugpy`, Go는 `delve`, C/C++/Rust는 `codelldb`. 이 어댑터 설치를 `mason-nvim-dap`이 `mason`에 위임하는 구조는 LSP에서 `mason-lspconfig`가 하던 것과 정확히 같다.

> 설치(mason) / 설정 자료(nvim-lspconfig) / 코어 클라이언트(vim.lsp)로 나뉘는 구조는 [Neovim 0.11+ LSP 3계층 — mason·lspconfig·vim.lsp의 역할](/posts/neovim/2026-07-08-neovim-lsp-three-layers-mason-lspconfig-vimlsp/)에서 다뤘다. DAP에서는 `nvim-dap`이 클라이언트 역할을 맡는다.
{: .prompt-info }

## LSP와 결정적으로 다른 점 — 생명주기

LSP 서버와 DAP 어댑터 둘 다 **언어별 별도 프로세스**지만, 뜨는 시점이 다르다.

| | 뜨는 시점 | 상주 여부 |
|---|---|---|
| **LSP** (gopls 등) | 파일을 열면 자동 | 편집 내내 **상시 상주**(프로젝트 단위) |
| **DAP** (delve 등) | 디버그 세션 시작 시 | **세션 중에만** 일시적 |

Go 프로젝트를 편집만 하는 중이면 gopls만 떠 있고, 디버깅을 걸면(`dap.continue()`/F5) 그제야 delve가 추가로 뜬다. 세션이 끝나면 어댑터는 종료된다. LSP는 "켜두고 계속 분석", DAP는 "필요할 때만 켰다 끈다"인 셈이다.

## 정리

- DAP는 LSP의 **디버깅용 형제** — 둘 다 VS Code 표준, 서버·어댑터는 에디터 중립.
- Neovim 스택: `nvim-dap`(클라이언트) + `-ui`/`-virtual-text`(UI) + `mason-nvim-dap`(설치). LSP의 mason 3계층과 같은 골격.
- 언어별 어댑터: debugpy·delve·codelldb.
- LSP는 편집 중 상시, **DAP는 디버그 세션 중에만** 뜬다.
