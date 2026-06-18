---
title       : "LazyVim에서 특정 LSP의 server_capabilities 한 줄로 끄기"
description : "서버를 끄지 않고 opts.setup의 on_attach에서 특정 server_capability만 false로 잘라낸다"
date        : 2026-06-16 12:00:00 +0900
updated     : 2026-06-16 12:00:00 +0900
categories  : [lazyvim]
tags        : [neovim, lazyvim, lsp, nvim-lspconfig]
pin         : false
hidden      : false
---

특정 LSP 서버가 특정 요청(예: `textDocument/documentHighlight`)에서 크래시를 던질 때, **서버를 통째로 끄지 않고 그 capability만 잘라낼 수 있다**. LazyVim의 `opts.setup` 핸들러에서 `on_attach`로 클라이언트 capability를 false 처리.

## 패턴

```lua
-- ~/.config/nvim/lua/plugins/lsp.lua
return {
  {
    "neovim/nvim-lspconfig",
    opts = {
      setup = {
        kotlin_language_server = function(_, opts)
          opts.on_attach = function(client, _)
            client.server_capabilities.documentHighlightProvider = false
          end
        end,
      },
    },
  },
}
```

- `setup`의 키는 lspconfig 서버명 (`mason-lspconfig` 매핑 그대로)
- `client.server_capabilities.*`에 nil/false 넣으면 nvim 코어가 해당 요청 자체를 보내지 않음
- 다른 서버 capability는 영향 없음 (서버별 격리)

## 끌 수 있는 대표 capability

| 키 | 영향 |
|---|---|
| `documentHighlightProvider` | CursorHold 자동 하이라이트 (`<cword>` 강조) |
| `documentFormattingProvider` | `vim.lsp.buf.format()` 비활성 — null-ls/conform 위임 시 유용 |
| `semanticTokensProvider` | LSP 시맨틱 토큰 끔 (treesitter만 사용) |
| `inlayHintProvider` | inlay hint 끔 |

## 언제 쓰는가

- 업스트림 버그로 특정 요청만 깨질 때 (예: fwcd/kotlin-language-server v1.3.13 #600의 `documentHighlight` 크래시 — [import 안 잡히는 캐시 문제](/posts/neovim/2026-06-16-kotlin-language-server-stale-kls-database/)와 혼동 주의)
- 한 capability가 다른 플러그인(formatter, illuminate 등)과 충돌할 때
- 서버 끄긴 아깝고 한 기능만 막고 싶을 때

## 검증

```vim
:lua =vim.lsp.get_clients({bufnr=0})[1].server_capabilities.documentHighlightProvider
" → false 면 적용 성공
```

`:LspRestart` 후 확인. 캐시 없음 — `on_attach`는 매 attach마다 실행.
