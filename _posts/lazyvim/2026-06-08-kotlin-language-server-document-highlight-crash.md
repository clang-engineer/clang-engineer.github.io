---
title       : "kotlin-language-server v1.3.13 documentHighlight 크래시 해결"
description : "Mason fwcd 빌드의 NoTopLevelDescriptorProvider 크래시 — community fork 빌드 또는 documentHighlight 끄기."
date        : 2026-06-08 13:00:00 +0900
updated     : 2026-06-08 13:00:00 +0900
categories  : [lazyvim, "LSP·Treesitter"]
tags        : [neovim, lsp, kotlin, mason]
pin         : false
hidden      : false
---

Mason의 kotlin-language-server(fwcd) v1.3.13에서 Kotlin class 파일 열면 `NoTopLevelDescriptorProvider: Should not be called` 에러가 발생한다. upstream 미수정 버그로, 커뮤니티 fork로 해결.

## 원인

`documentHighlight` 요청 시 커서가 class 선언 위에 있으면, class 전체를 expression으로 `compileKtExpression`에 넘기는데, top-level context가 없어서 크래시.

- GitHub issue: [fwcd/kotlin-language-server#600](https://github.com/fwcd/kotlin-language-server/issues/600) (OPEN)
- Mason 최신에도 v1.3.13이 최신이라 업데이트로 해결 불가

## 해결: 커뮤니티 fork 빌드

[kotlin-community-tools/kotlin-language-server](https://github.com/kotlin-community-tools/kotlin-language-server)에서 수정됨.

```sh
git clone https://github.com/kotlin-community-tools/kotlin-language-server.git
cd kotlin-language-server
./gradlew :server:installDist
mkdir -p ~/.local/share/kotlin-language-server
cp -r server/build/install/server/* ~/.local/share/kotlin-language-server/
```

LazyVim 설정 (`lua/plugins/lsp.lua`):

```lua
kotlin_language_server = function(_, opts)
  opts.cmd = { os.getenv("HOME") .. "/.local/share/kotlin-language-server/server/bin/kotlin-language-server" }
end,
```

## 더 간단한 대안

빌드가 번거로우면 documentHighlight만 비활성화:

```lua
vim.api.nvim_create_autocmd("LspAttach", {
  callback = function(args)
    local client = vim.lsp.get_client_by_id(args.data.client_id)
    if client and client.name == "kotlin_language_server" then
      client.server_capabilities.documentHighlightProvider = false
    end
  end,
})
```
