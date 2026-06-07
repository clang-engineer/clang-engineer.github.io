---
title       : LazyVim Diagnostics 로그/메시지 확인법
description : Diagnostics 팝업, Trouble 리스트, LSP 로그, :messages 사용법 정리
date        : 2026-02-04 10:00:00 +0900
updated     : 2026-02-04 10:00:00 +0900
categories  : [dev, lazyvim]
tags        : [lazyvim, neovim, diagnostics, lsp, trouble, messages]
pin         : false
hidden      : false
---

# LazyVim(Neovim)에서 Diagnostics 로그/메시지 확인 방법

목적별로 3가지를 구분하면 편합니다: (1) 진단 메시지, (2) LSP 통신 로그, (3) Neovim 메시지 히스토리.

---

## 빠른 키/명령 요약

- `gl` — 커서 위치 diagnostic 팝업
- `]d` / `[d` — 다음/이전 diagnostic 이동
- `:Trouble diagnostics` — 프로젝트/버퍼 diagnostics 리스트 보기
- `:LspLog` — LSP 통신 로그 파일 열기
- `:messages` — Neovim 메시지 히스토리 보기

---

## 1) 진단 메시지를 창으로 보기 (가장 흔함)

- `gl`: 커서 위치의 diagnostic message를 floating window로 확인
- `]d` / `[d`: 다음/이전 diagnostic로 점프
- `:Trouble diagnostics`: 프로젝트/버퍼 전체 diagnostics를 트리/리스트로 확인
- LazyVim 기본 번들에 Trouble이 포함된 경우가 많아, 이 조합이 가장 편리합니다.

## 2) LSP 로그 파일 열기 (통신 로그)

```vim
:LspLog
```

- 기본 로그 파일: `~/.local/state/nvim/lsp.log`
- 로그가 비어 있다면 LSP 로그 레벨이 낮을 수 있습니다(필요 시 설정에서 log_level을 올리세요).

## 3) 메시지 히스토리 보기 (Neovim 메시지 로그)

```vim
:messages
```

- 명령 실행 중 출력된 메시지/에러를 순서대로 다시 확인할 때 사용합니다.

---

## 추천 선택 기준

1) 에러/워닝 목록을 보고 싶다 → `:Trouble diagnostics` (+ `]d`/`[d`, `gl`)
2) LSP 서버 통신 로그를 보고 싶다 → `:LspLog` (경로: `~/.local/state/nvim/lsp.log`)
3) 최근 명령 출력/에러를 다시 보고 싶다 → `:messages`

---

## 추가 팁

- Trouble 창에서 `?`로 키 바인딩을 바로 확인할 수 있습니다.
- `]d`/`[d` 이동 후 `gl`을 눌러 현재 위치 메시지를 곧바로 확인하면 편합니다.
- 로그를 별도 보관하려면 `:LspLog`로 연 뒤 `:w lsp-debug.log`처럼 다른 이름으로 저장하세요.
