---
title       : "legacy kotlin-language-server v1.3.13 documentHighlight 크래시"
description : "Mason의 legacy fwcd 서버에서 발생하는 NoTopLevelDescriptorProvider 크래시를 진단하고, 공식 Kotlin LSP 이전과 임시 완화책을 구분한다."
date        : 2026-06-08 13:00:00 +0900
updated     : 2026-07-24 15:00:00 +0900
categories  : [lazyvim, "LSP·Treesitter"]
tags        : [neovim, lsp, kotlin, mason, troubleshooting]
pin         : false
hidden      : false
---

Mason의 kotlin-language-server(fwcd) v1.3.13에서 Kotlin class 파일을 열면 `NoTopLevelDescriptorProvider: Should not be called` 에러가 발생할 수 있다. 이 fwcd 서버는 현재 deprecated 상태이고 JetBrains가 [공식 Kotlin LSP](https://github.com/Kotlin/kotlin-lsp)를 공개했다. 새 환경이라면 공식 서버 지원 여부를 먼저 확인하고, 아래 community fork 빌드는 legacy fwcd 구성을 당장 유지해야 할 때의 임시 선택으로 본다.

## 원인

`documentHighlight` 요청 시 커서가 class 선언 위에 있으면, class 전체를 expression으로 `compileKtExpression`에 넘기는데, top-level context가 없어서 크래시.

- GitHub issue: [fwcd/kotlin-language-server#600](https://github.com/fwcd/kotlin-language-server/issues/600) (OPEN)
- Mason 최신에도 v1.3.13이 최신이라 업데이트로 해결 불가

## 1순위: 공식 Kotlin LSP로 이전 검토

에디터·배포판이 `Kotlin/kotlin-lsp`를 지원한다면 그 경로를 우선한다. Mason package 이름과 LazyVim extra가 아직 legacy fwcd를 가리킬 수 있으므로, "Mason에서 최신"과 "Kotlin 공식 최신 서버"를 같은 뜻으로 보면 안 된다.

## 임시 해결: 커뮤니티 fork 빌드

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
-- ~/.config/nvim/lua/plugins/kotlin-lsp.lua
return {
  {
    "neovim/nvim-lspconfig",
    opts = {
      servers = {
        kotlin_language_server = {
          cmd = { vim.fn.expand("~/.local/share/kotlin-language-server/bin/kotlin-language-server") },
        },
      },
    },
  },
}
```

`cp -r server/build/install/server/* ~/.local/share/kotlin-language-server/`는 설치 디렉터리의 **내용**을 복사하므로 실행 파일은 `.../bin/kotlin-language-server`에 생긴다. 경로에 `server/`를 한 번 더 넣으면 빌드는 성공해도 LSP 실행 파일을 찾지 못한다.

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
