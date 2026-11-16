---
title       : "Neovim 코드 진단과 결과 탐색 — LSP·Quickfix·Trouble"
description : "검색·빌드·LSP 결과가 생성되고 Quickfix·Diagnostics에 관리되며 Trouble·Picker로 탐색되는 관계와 LazyVim 사용법"
date        : 2026-05-04 10:00:00 +0900
updated     : 2026-11-16 00:00:00 +0900
categories  : [lazyvim, "플러그인"]
tags        : [trouble, diagnostics]
pin         : false
hidden      : false
redirect_from:
  - /posts/neovim/2026-05-04-lazyvim-leader-x-trouble/
---

## 전체 개념지도 — 생성·관리·표시

```text
                  결과 생성
         ┌───────────┼────────────┐
         ▼           ▼            ▼
      :vimgrep     :make       LSP / Linter
         │           │            │
         ▼           ▼       ┌────┴─────────┐
       검색 위치   빌드 오류   ▼              ▼
         └─────┬─────┘     Diagnostics   References 등
               ▼               │              │
       Quickfix / Loclist      │              │
               └───────────────┼──────────────┘
                               ▼
                        Trouble (탐색 UI)
```

위 그림은 대표적인 경로다. **Picker는 검색·LSP 결과를 직접 표시할 수도 있으므로 모든 결과가 Quickfix를 거치지 않는다.** `:make`는 `makeprg`의 외부 빌드를 실행하고 `errorformat`으로 오류 위치를 해석한다. `:vimgrep`은 검색 위치를 Quickfix에 채운다.

## 결과 관리 — Quickfix·Location List·Diagnostics

| 개념 | 책임 | 관리 범위 |
|---|---|---|
| Quickfix | 검색·빌드·진단 등을 담는 범용 위치 목록 | 편집기 전역 목록 및 이력 |
| Location List | Quickfix와 같은 위치 목록 모델 | Window별 독립 목록 |
| Diagnostics (`vim.diagnostic`) | LSP·Linter가 보고한 오류·경고·힌트의 현재 상태 | 버퍼·제공자(namespace)별 |

**Quickfix는 스냅샷 중심으로 활용하지만 플러그인이 계속 갱신할 수도 있다.** Diagnostics와의 본질적인 차이는 실시간 여부가 아니라 범용 위치 목록과 진단 상태라는 관리 모델이다. LSP 진단은 Quickfix에 자동 등록되지 않으며 `vim.diagnostic.setqflist()` 등으로 옮길 수 있다.

## 결과 표시 — Trouble과 Picker

Trouble은 Diagnostics·Quickfix·Location List·LSP 탐색 결과·TODO 위치 등을 목록으로 표시하는 플러그인이다. **언어 분석은 LSP 서버 등이 수행**한다. Trouble은 Neovim의 진단 상태를 읽거나 LSP Client를 통해 References·Definitions 등을 요청하고, 결과를 그룹화·미리보기·순회할 수 있다.

Picker도 검색·LSP 결과를 보여주지만 보통 **빠른 검색·필터링·선택**, Trouble은 **패널을 유지하며 여러 위치를 검토**하는 흐름에 적합하다. 예를 들어 `getUser()` 사용처 30곳 중 한 곳을 찾는다면 Picker, 여러 곳을 계속 검토한다면 Trouble이 편리할 수 있다. 둘 중 하나만 가능한 작업은 아니다.

```text
          LSP References (사용처 여러 곳)
                       │
            ┌──────────┴──────────┐
            ▼                     ▼
         Picker                 Trouble
      검색·빠른 선택         목록 유지·순회
```

## 키맵 요약

| 키 | 동작 | 설명 |
|---|---|---|
| `<leader>xx` | Diagnostics | 워크스페이스 전체 진단 결과 |
| `<leader>xX` | Buffer Diagnostics | 현재 버퍼의 진단 결과만 |
| `<leader>xL` | Location List | 현재 윈도우의 location list |
| `<leader>xQ` | Quickfix List | 전역 quickfix list |
| `<leader>cs` | Symbols | 현재 문서의 LSP 심볼 목록 |
| `<leader>cS` | LSP | references/definitions 등 LSP 결과 |
| `<leader>xt` | Todo | Trouble로 TODO/FIX/FIXME/HACK 등 검색 |
| `<leader>xT` | Todo/Fix/Fixme | Trouble로 TODO/FIX/FIXME만 검색 |

picker로 같은 항목을 검색하려면 `<leader>st`/`<leader>sT`를 쓴다.


---

> 진단 메시지·LSP 로그·`:messages`를 **실제로 열어 확인하는 방법**(`<leader>cd`, `:LspLog`, `:messages`)은 [LazyVim Diagnostics 로그/메시지 확인법](./2026-02-04-lazyvim-diagnostics.md)에 정리했습니다. 이 글은 Trouble 키맵·개념, 저 글은 로그 확인 절차입니다.

## LSP가 붙었는데 특정 정의로는 이동하지 못하는 경우

`gd`가 일부 Vue 단일 파일 컴포넌트의 `<script>` import에서는 작동하지만 `<template>`의 특정 computed 속성에서는 실패할 수 있다. 이는 Quickfix/Trouble UI 문제가 아니라 **언어 서버가 해당 심볼의 정적 정의를 찾을 수 있는가**의 문제다. 먼저 현재 버퍼에 Vue용 LSP client가 붙었는지 확인하고, 붙어 있다면 template 분석 경로와 코드의 정적 표현을 분리해 살펴본다.

예를 들어 Vue 2의 `mapGetters(['optionList'])`는 런타임에 이름을 computed 속성으로 펼치므로 일부 서버·버전에서 template 심볼의 정의를 찾지 못했다. 같은 Vuex API의 `mapGetters({ optionList: 'optionList' })`는 속성 키를 소스에 명시한다. 이것이 모든 Volar/Vetur 조합에서 `gd`를 보장한다는 뜻은 아니다. 설치·attach를 재시작하기 전에 **실패 범위가 템플릿의 동적 심볼에만 국한되는지** 확인하고, 도구가 추적 가능한 표현을 검토하는 사례다.
