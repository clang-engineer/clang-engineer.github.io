---
title       : "Neovim 0.11+ LSP 3계층 — mason·lspconfig·vim.lsp의 역할"
description : "mason은 서버 바이너리를 설치하고, nvim-lspconfig는 서버별 기본 설정을 제공하며, Neovim 0.11+의 vim.lsp.config/enable이 설정·시작·통신을 맡는다. attach와 진단 순서까지 한 장으로 정리."
date        : 2026-07-08 10:00:00 +0900
updated     : 2026-07-24 12:00:00 +0900
categories  : [neovim, "원리·언어"]
tags        : [neovim, lsp, lspconfig, mason, treesitter, guide]
pin         : false
hidden      : false
---

Neovim을 IDE처럼 만드는 조각들은 이름이 비슷해서 헷갈린다. mason, nvim-lspconfig, `vim.lsp`는 모두 LSP 주변에 있지만 책임이 다르다. **mason은 실행 파일을 설치하고, nvim-lspconfig는 서버별 설정 자료를 제공하며, Neovim 코어의 `vim.lsp`가 설정 병합·활성화·프로세스 시작·통신을 맡는다.** 이 경계를 모르면 "서버는 설치됐는데 왜 안 붙지?" 같은 증상의 원인 층을 찾기 어렵다.

## 3계층 — 설치, 설정 자료, 실행 엔진

| 계층 | 역할 | 경계 |
|------|------|------|
| **mason.nvim** | gopls·lua-language-server 같은 외부 도구 설치 | 패키지 설치·경로 관리. LSP client가 아님 |
| **nvim-lspconfig** | `lsp/<server>.lua` 형태의 서버별 기본 config 제공 | 실행 파일 이름·filetypes·root markers·기본 설정 자료 |
| **`vim.lsp`** | config 병합·enable·client 시작·attach·JSON-RPC 통신 | Neovim 코어의 실제 LSP client |

Neovim 0.11부터 중심 API는 `vim.lsp.config()`와 `vim.lsp.enable()`이다. nvim-lspconfig는 이름과 달리 별도의 LSP 엔진이 아니라, 이 코어 API가 runtimepath에서 발견해 사용할 서버별 config 모음이다. 예전의 `require("lspconfig").gopls.setup({})` 설명을 현재 구조에 그대로 적용하면 계층을 잘못 이해하게 된다.

```text
Neovim 시작
   ├─ runtimepath의 lsp/gopls.lua에서 기본 config 발견
   ├─ vim.lsp.config("gopls", 사용자 설정)으로 병합
   └─ vim.lsp.enable("gopls")로 활성화

.go 파일 열기
   └─ vim.lsp가 filetype·root 조건을 확인해 gopls 실행 + 버퍼에 attach
        ├─ 편집 내용 → gopls로 전송
        └─ gopls 응답(완성·에러·정의 위치) → 버퍼에 표시
```

이 구조를 알면 문제 층을 바로 좁힐 수 있다.

- 서버가 **설치조차 안 됨** → mason 층 (`:Mason`)
- 설치는 됐는데 **config가 없음/비활성** → `vim.lsp.config`·`vim.lsp.enable`과 runtimepath 확인
- config는 있는데 **파일 열어도 안 붙음** → filetype·root marker·실행 경로 확인 (`:checkhealth vim.lsp`)
- 붙긴 했는데 **응답이 이상함** → `vim.lsp` ↔ 서버 로그 확인

## attach — "붙는다"가 무슨 뜻인가

LSP에서 "붙는다(attach)"는 **떠 있는 언어 서버와 지금 편집 중인 버퍼를 연결하는 것**이다. 서버가 실행 중이라는 것과, 그 서버가 이 버퍼에 붙었다는 것은 별개다. 붙은 뒤에야 그 버퍼에서 자동완성·정의 점프·에러 표시가 작동한다.

한 버퍼에 서버가 여러 개 붙기도 한다. 예를 들어 Python 버퍼에는 `pyright`(타입 체크)와 `ruff`(린트)가 동시에 붙을 수 있다.

확인용 명령:

- `:checkhealth vim.lsp` — 활성 config와 client 상태, 실행 파일·root 문제 진단
- `:lua =vim.lsp.get_clients({ bufnr = 0 })` — 현재 버퍼에 붙은 client 확인
- `:lua vim.cmd.edit(vim.lsp.log.get_filename())` — 내장 LSP 로그 열기
- `:Mason` — 설치된 서버 목록 (설치 계층이 별개임을 눈으로 확인)

### nvim-lspconfig는 필수가 아니라 config 모음이다

nvim-lspconfig 없이도 LSP는 동작한다. 직접 config를 정의하고 활성화하면 된다.

```lua
vim.lsp.config("my_server", {
  cmd = { "my-language-server", "--stdio" },
  filetypes = { "mylang" },
  root_markers = { ".git", "mylang.toml" },
})
vim.lsp.enable("my_server")
```

nvim-lspconfig를 설치하면 널리 쓰는 서버의 `cmd`, `filetypes`, `root_markers` 기본값을 직접 작성하지 않아도 된다. 사용자 설정은 `vim.lsp.config("gopls", { ... })`로 그 기본 config 위에 합쳐진다.

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

- 세 이름은 **책임**으로 나눈다: mason(외부 도구 설치) → nvim-lspconfig(서버별 config 제공) → `vim.lsp`(config·enable·attach·통신).
- Neovim 0.11+의 설정 중심은 `vim.lsp.config()`와 `vim.lsp.enable()`이다.
- attach = 서버와 버퍼의 연결. 서버 실행 ≠ 버퍼 attach.
- LSP(의미)와 Treesitter(구문)는 보는 대상이 다르다.
- 완성은 "후보 제공(LSP)"과 "팝업 UI(cmp/blink)"가 별개 축이다.

"LSP가 안 된다"면 `:Mason`에서 실행 파일을 확인하고, `:checkhealth vim.lsp`에서 config·root·client를 확인한 뒤, 필요할 때 LSP 로그를 연다. 설치 여부와 attach 여부를 분리하는 것이 핵심이다.

> 관련: 각 기능 영역을 **어떤 플러그인들이 분담**해 만드는지는 [LazyVim 기능 지도](/posts/lazyvim/2026-06-07-lazyvim-feature-plugin-map/)에서 다룬다. Vim·Neovim·배포판이 **계층별로 무슨 기능**을 얹는지는 [Vim vs Neovim vs 배포판](/posts/neovim/2026-06-08-vim-neovim-lazyvim-feature-layers/)을, LSP가 실제로 안 붙을 때의 **검증 방법**은 [헤드리스 모드로 attach 검증하기](/posts/neovim/2026-06-15-neovim-lsp-headless-attach-debug/)를 참고.
