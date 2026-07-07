---
title       : "Neovim LSP 3계층 — mason·lspconfig·vim.lsp는 '언제' 일하는가"
description : "'LSP가 안 된다'의 원인 층을 못 찾는 이유는 셋이 관여하는 시점이 다르기 때문. mason은 설치 시, lspconfig는 시작 시, vim.lsp는 편집 내내. 3계층 분리와 attach의 의미, LSP vs Treesitter, 편집 경험 5축까지 한 장으로."
date        : 2026-07-08 10:00:00 +0900
categories  : [neovim, "원리·언어"]
tags        : [neovim, lsp, lspconfig, mason, treesitter, guide]
pin         : false
hidden      : false
---

Neovim을 IDE처럼 만드는 조각들은 이름이 비슷해서 헷갈린다. mason, lspconfig, `vim.lsp` — 셋 다 "LSP 관련"이지만 결정적으로 다른 점은 **관여하는 시점**이다. mason은 설치할 때만, lspconfig는 시작할 때만, `vim.lsp`는 편집하는 내내 일한다. 이 시점 구분을 못 하면 "자동완성이 안 뜬다", "정의 점프가 안 된다" 같은 증상이 **어느 층에서** 생긴 문제인지 짚지 못한다.

## 3계층 — 각자 다른 시점에 일한다

| 계층 | 역할 | 언제 일하나 |
|------|------|------------|
| **mason** | 서버 바이너리 설치 — gopls 같은 언어 서버를 어디서 구해와 어디에 둘지 | 설치 시 |
| **lspconfig** | 설정 주입 — "이 filetype이 열리면 이 서버를 이렇게 붙여라"를 autocmd로 등록 | Neovim 시작 시 (등록 후 물러남) |
| **vim.lsp** | 실제 통신 엔진 — 서버 프로세스와 JSON-RPC를 주고받음 | 편집 내내 |

가장 오해하기 쉬운 지점: **lspconfig는 Neovim이 계속 바라보는 상주 컴포넌트가 아니다.** 시작할 때 `vim.lsp`에 규칙(autocmd)을 심어두고 손을 뗀다. 그 이후 실제 일은 전부 `vim.lsp`가 한다.

```text
Neovim 시작
   └─ lspconfig 실행 → vim.lsp에 autocmd 등록 → (물러남)

.go 파일 열기
   └─ autocmd 발동 → vim.lsp가 gopls 실행 + 버퍼에 attach
        ├─ 편집 내용 → gopls로 전송
        └─ gopls 응답(완성·에러·정의 위치) → 버퍼에 표시
```

이 구조를 알면 문제 층을 바로 좁힐 수 있다.

- 서버가 **설치조차 안 됨** → mason 층 (`:Mason`)
- 설치는 됐는데 **파일 열어도 안 붙음** → lspconfig 등록 or root_dir 문제 (`:LspInfo`)
- 붙긴 했는데 **응답이 이상함** → `vim.lsp` ↔ 서버 통신 문제 (`:LspLog`)

## attach — "붙는다"가 무슨 뜻인가

LSP에서 "붙는다(attach)"는 **떠 있는 언어 서버와 지금 편집 중인 버퍼를 연결하는 것**이다. 서버가 실행 중이라는 것과, 그 서버가 이 버퍼에 붙었다는 것은 별개다. 붙은 뒤에야 그 버퍼에서 자동완성·정의 점프·에러 표시가 작동한다.

한 버퍼에 서버가 여러 개 붙기도 한다. 예를 들어 Python 버퍼에는 `pyright`(타입 체크)와 `ruff`(린트)가 동시에 붙을 수 있다.

확인용 명령 3종:

- `:LspInfo` — 이 버퍼에 무엇이 붙었나, root_dir이 어디로 잡혔나
- `:LspLog` — `vim.lsp`와 서버가 실제로 주고받은 JSON-RPC 로그
- `:Mason` — 설치된 서버 목록 (설치 계층이 별개임을 눈으로 확인)

### lspconfig는 '필수'가 아니라 '편의'다

lspconfig 없이도 LSP는 완전히 동작한다. `vim.lsp.start()`에 실행 명령·root_dir·filetype을 직접 넘기면 서버가 뜨고 붙는다. lspconfig가 하는 일은 그 인자들을 **각 서버별로 대신 채워주는 것**뿐이다. 즉 편의 계층이다.

이 점은 Neovim 0.11의 방향과도 이어진다. 0.11이 내장한 `vim.lsp.config()` / `vim.lsp.enable()`은 lspconfig가 하던 "설정 주입" 역할을 코어로 흡수한다. lspconfig가 점점 얇아지는 이유가 이것이다. 개념적으로는 여전히 "시작 시 설정을 심는 층"이지만, 그 층이 플러그인에서 코어로 이동하는 중이다.

## LSP vs Treesitter — 가장 자주 섞이는 축

둘 다 "코드를 똑똑하게 다루는" 기능이라 묶어서 생각하기 쉽지만, 보는 대상이 완전히 다르다.

- **Treesitter = 구문(syntax) 파싱.** 하이라이트, 코드 접기, 구조 기반 선택. "이건 함수 이름이니 초록색으로" 같은 판단. 파일 하나만 보면 된다.
- **LSP = 의미(semantic) 분석.** 완성 후보, 에러 진단, "이 변수가 어디서 정의됐나", 정의 점프. 프로젝트 전체 맥락을 서버가 이해해야 가능하다.

색이 안 나오면 Treesitter, 완성/에러/점프가 안 되면 LSP — 이 한 줄이 디버깅 방향을 절반으로 줄여준다.

## 편집 경험 5축 — IDE화 전체 지도

Neovim을 IDE처럼 쓰는 전체 그림은 이 다섯 축이면 정리된다. 각 축은 서로 다른 도구가 담당한다.

- **Treesitter** — 보기 (하이라이트·구조)
- **LSP** — 이해 (완성 후보·에러·점프)
- **cmp / blink.cmp** — 완성 UI. LSP는 후보 목록만 제공하고, 그걸 팝업으로 띄워 고르게 하는 건 별도 플러그인이다. blink.cmp는 최신 LazyVim의 기본
- **conform.nvim / nvim-lint** — 포맷·검사. prettier·eslint·gofmt 등 LSP 바깥의 도구를 끼워 넣는다 (구세대는 none-ls)
- **DAP** — 디버깅

여기서 핵심은 **"LSP가 완성 후보를 준다"와 "완성 팝업이 뜬다"가 다른 축**이라는 것. 완성이 안 뜰 때 LSP만 의심하면 절반은 헛짚는다. 후보 자체가 안 오는지(LSP), 후보는 오는데 UI가 안 띄우는지(cmp/blink)를 나눠 봐야 한다.

## 정리

- 세 이름의 차이는 역할이 아니라 **시점**이다: mason(설치 시) → lspconfig(시작 시) → `vim.lsp`(편집 내내).
- lspconfig는 상주하지 않는다. 시작 시 autocmd를 심고 물러나며, 실제 통신은 `vim.lsp`가 한다.
- attach = 서버와 버퍼의 연결. 서버 실행 ≠ 버퍼 attach.
- LSP(의미)와 Treesitter(구문)는 보는 대상이 다르다.
- 완성은 "후보 제공(LSP)"과 "팝업 UI(cmp/blink)"가 별개 축이다.

이 시점 지도 하나면 "LSP가 안 된다"를 만났을 때 `:Mason` → `:LspInfo` → `:LspLog` 순으로 층을 좁혀 들어갈 수 있다.

> 관련: 각 기능 영역을 **어떤 플러그인들이 분담**해 만드는지는 [LazyVim 기능 지도](/posts/lazyvim/2026-06-07-lazyvim-feature-plugin-map/)에서 다룬다. Vim·Neovim·배포판이 **계층별로 무슨 기능**을 얹는지는 [Vim vs Neovim vs 배포판](/posts/neovim/2026-06-08-vim-neovim-lazyvim-feature-layers/)을, LSP가 실제로 안 붙을 때의 **검증 방법**은 [헤드리스 모드로 attach 검증하기](/posts/neovim/2026-06-15-neovim-lsp-headless-attach-debug/)를 참고.
