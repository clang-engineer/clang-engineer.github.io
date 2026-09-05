---
title       : LazyVim에서 Diagnostics·LSP 로그·메시지 확인하기
description : "LazyVim/Neovim에서 코드 진단, LSP 통신 로그, Neovim 메시지 기록을 목적별로 구분하고 각각 어디서 확인하는지 정리한다."
date        : 2026-02-04 10:00:00 +0900
updated     : 2026-09-05 19:10:00 +0900
categories  : [neovim, "LSP·Treesitter"]
tags        : [neovim, lazyvim, diagnostics, lsp, trouble, how-to]
pin         : false
hidden      : false
---

LazyVim에서 "에러 로그를 보고 싶다"고 할 때 실제로 찾는 대상은 서로 다를 수 있다. 먼저 **코드 진단(Diagnostics), LSP 통신 로그, Neovim 메시지 기록**을 구분하면 필요한 화면으로 바로 갈 수 있다.

```text
코드의 Error/Warning을 보고 싶다
→ Diagnostics / Trouble

LSP 서버와 무슨 통신을 했는지 보고 싶다
→ LSP Log

Neovim이 방금 출력한 메시지를 다시 보고 싶다
→ :messages
```

## 빠른 선택

| 목적 | 확인 방법 |
|---|---|
| 현재 위치의 진단 내용 | `<leader>cd` |
| 다음/이전 진단으로 이동 | `]d` / `[d` |
| 진단 목록 전체 보기 | `:Trouble diagnostics` |
| LSP 통신 로그 보기 | `:LspLog` |
| 최근 Neovim 메시지 다시 보기 | `:messages` |

## 1. 코드 진단을 확인한다

LSP나 다른 진단 소스가 만든 Error/Warning을 확인하려는 경우다.

현재 커서 위치의 diagnostic은:

```text
<leader>cd
```

로 확인할 수 있고 다음·이전 diagnostic으로 이동하려면:

```text
]d
[d
```

를 사용한다.

프로젝트나 버퍼의 진단을 목록으로 보고 싶다면:

```vim
:Trouble diagnostics
```

를 사용한다.

즉 **코드에 붙은 문제 자체를 보고 싶다면 Diagnostics/Trouble 계층**을 보면 된다.

## 2. LSP 통신 로그를 확인한다

Diagnostic 결과가 이상하거나 LSP 서버 자체의 요청·응답을 확인해야 한다면 UI에 표시된 진단보다 한 단계 아래인 LSP 로그를 본다.

```vim
:LspLog
```

일반적인 로그 위치는 다음과 같다.

```text
~/.local/state/nvim/lsp.log
```

로그 내용이 충분하지 않다면 현재 LSP 로그 레벨 설정도 함께 확인한다.

```text
LSP Server
   ↕
Neovim LSP Client
   ↓
LSP Log
```

즉 `:LspLog`는 "현재 코드의 에러 목록"을 보여주는 명령이 아니라 **LSP client/server 통신을 진단하기 위한 로그**다.

## 3. Neovim 메시지 기록을 확인한다

플러그인이나 명령 실행 중 잠깐 나타났다가 사라진 메시지를 다시 보고 싶다면:

```vim
:messages
```

를 사용한다.

이건 Diagnostics나 LSP 전용 기능이 아니라 **Neovim의 메시지 히스토리**다.

```text
명령 / 플러그인 실행
       ↓
Neovim 메시지 출력
       ↓
:messages
```

따라서 "방금 화면 아래에 에러가 떴는데 사라졌다"면 가장 먼저 확인하기 좋다.

## 어떤 것을 먼저 볼까

```text
코드 줄에 Error/Warning 표시가 있다
→ <leader>cd / Trouble

LSP가 이상하게 동작한다
→ :LspLog

명령 실행 직후 메시지가 사라졌다
→ :messages
```

문제의 위치가 불분명하다면 `:messages` → Diagnostics → LSP Log 순으로 범위를 좁혀도 된다.

## 확인 후 로그를 보관하고 싶다면

`:LspLog`로 연 로그를 별도 파일로 저장할 수 있다.

```vim
:w lsp-debug.log
```

Trouble의 키맵과 Diagnostics·Quickfix·Location List의 관계는 [LazyVim Trouble — 코드 문제와 목록 탐색](/posts/lazyvim/2026-05-04-lazyvim-leader-x-trouble/)에서 별도로 다룬다. 이 글의 목적은 **문제가 있을 때 어떤 정보원을 어디서 확인할지 빠르게 선택하는 것**이다.
