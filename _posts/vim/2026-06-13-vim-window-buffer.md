---
title       : "Vim Window·Buffer 조작 — 분할·이동·재로드"
description : "윈도우 분할·이동·크기 조정과 외부에서 변경된 파일을 다시 읽는 :e/:e! 정리"
date        : 2026-06-13 10:00:00 +0900
updated     : 2026-06-13 10:00:00 +0900
categories  : [vim, "사용·키맵"]
tags        : []
pin         : false
hidden      : false
---

## 윈도우 분할과 이동

| 키 | 동작 |
|---|---|
| `<C-w>s` / `:split` | 가로 분할 |
| `<C-w>v` / `:vsplit` | 세로 분할 |
| `<C-w>{h,j,k,l}` | 인접 윈도우로 포커스 이동 |
| `<C-w>x` | 인접 윈도우와 자리 교환 |
| `<C-w>=` | 윈도우 크기 균등 |
| `<C-w>_` | 가로 분할 중 현재 윈도우 최대화 |
| `<C-w>\|` | 세로 분할 중 현재 윈도우 최대화 |
| `<C-w>c` / `:close` | 현재 윈도우 닫기 |
| `<C-w>o` / `:only` | 현재 윈도우만 남기기 |

## 버퍼 재로드

```vim
:e         " 디스크에서 다시 읽기 (수정 있으면 거부)
:e!        " 강제 재로드 (수정 폐기)
```

외부에서 파일이 바뀐 경우 `:e`로 동기화. checktime을 켜두면 자동.

```vim
:set autoread
:au CursorHold,CursorHoldI * checktime
```

## 버퍼 이동

| 키 | 동작 |
|---|---|
| `:ls` / `:buffers` | 버퍼 목록 |
| `:b {n}` / `:b {name}` | 버퍼 전환 |
| `:bn`, `:bp` | 다음/이전 버퍼 |
| `:bd` | 현재 버퍼 닫기 |
