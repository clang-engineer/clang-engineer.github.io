---
title       : "Neovim LSP가 안 붙을 때 — 헤드리스 모드로 attach 검증하기"
description : "헤드리스 nvim + sleep + get_clients로 LSP attach를 한 줄 스크립트로 검증한다 — sleep은 충분히 길게"
date        : 2026-06-15 13:00:00 +0900
updated     : 2026-06-15 13:00:00 +0900
categories  : [neovim]
tags        : [neovim, lazyvim, lsp, kotlin, debugging]
pin         : false
hidden      : false
---

`:LspInfo`에 LSP가 안 보일 때, 매번 GUI nvim 띄워서 30~60초 기다리며 확인하는 게 비효율적이다. **헤드리스 모드 + sleep + `vim.lsp.get_clients()`**로 한 줄 스크립트화할 수 있다.

## attach 확인 (한 방)

```bash
timeout 60 nvim --headless \
  +"edit path/to/file.kt" \
  +"sleep 45" \
  +"lua local c = vim.lsp.get_clients({bufnr=0}); print('filetype:', vim.bo.filetype); print('clients:', #c); for _,cl in ipairs(c) do print('  -', cl.name) end" \
  +"qa!" 2>&1 | tail -10
```

출력 예:
```
filetype: kotlin
clients: 2
  - kotlin_language_server
  - copilot
```

핵심:
- `sleep 45` 충분히 길게 — kotlin-language-server는 첫 attach까지 **30~60초** 걸린다 (JVM 부팅 + lspconfig 초기화)
- 너무 짧으면 attach 전에 종료돼서 "안 붙는 것처럼" 보임 → 진단 오판의 원인

## 실제 `gd`(go-to-definition)까지 검증

attach만으로 부족하면 cross-file 점프까지 시뮬레이션:

```bash
timeout 120 nvim --headless \
  +"edit src/main/kotlin/com/example/Foo.kt" \
  +"sleep 90" \
  +"call cursor(5, 47)" \
  +"lua vim.lsp.buf.definition()" \
  +"sleep 5" \
  +"lua print('after gd:', vim.api.nvim_buf_get_name(0), 'line:', vim.api.nvim_win_get_cursor(0)[1])" \
  +"qa!" 2>&1 | tail -10
```

`gd` 호출 후 버퍼가 다른 파일로 바뀌고 라인 번호가 정의부로 점프했다면 LSP가 완전히 살아있음.

## kotlin-language-server 특이사항

- 첫 attach: 30~60초 (체감 1분)
- multi-module Gradle 인덱싱: 추가로 1~3분 — 그동안 `gd`는 "definition not found"
- 반드시 `settings.gradle.kts`가 있는 **프로젝트 루트**에서 nvim 실행 (root_dir 인식 실패 시 attach 자체가 안 됨)

## 자주 만나는 함정

- **`cmd` 경로 오타로 LSP 침묵사**: 사용자 설정에서 `cmd = { "..." }`로 override 했는데 경로가 틀리면 nvim은 **에러를 띄우지 않고 조용히 죽음**. `:LspInfo`에 attached:0으로만 표시되어 원인이 안 보인다. override 의심되면 일단 제거하고 lspconfig 기본 + Mason `PATH` 자동 주입에 맡기는 게 안전.
- **헤드리스 모드의 `sleep`이 짧으면**: 위 함정의 진단에서도 똑같이 "안 붙는다" 결론으로 빠짐. 최소 45초.
