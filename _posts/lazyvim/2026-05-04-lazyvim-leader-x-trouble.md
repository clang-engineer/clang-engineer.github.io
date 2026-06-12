---
title       : "LazyVim <leader>x — Trouble 기반 코드 문제 탐색"
description : Diagnostics / Quickfix / Location List / Todo Comments를 Trouble UI 하나로 통합 탐색하는 키맵 그룹 정리
date        : 2026-05-04 10:00:00 +0900
categories  : [lazyvim, 기타]
tags        : [trouble, diagnostics, quickfix, location-list, todo-comments]
pin         : false
hidden      : false
---

## 개요

LazyVim에서 `<leader>x`는 **Trouble** 플러그인을 통해 코드 문제와 목록을 탐색하는 키맵 그룹이다. Diagnostics, Quickfix List, Location List, Todo Comments 등을 통합 UI로 제공한다.

## 키맵 요약

| 키 | 동작 | 설명 |
|---|---|---|
| `<leader>xx` | Diagnostics | 워크스페이스 전체 진단 결과 |
| `<leader>xX` | Buffer Diagnostics | 현재 버퍼의 진단 결과만 |
| `<leader>xL` | Location List | 현재 윈도우의 location list |
| `<leader>xQ` | Quickfix List | 전역 quickfix list |
| `<leader>xs` | Symbols | LSP 심볼 목록 |
| `<leader>xl` | LSP | LSP references/definitions 등 |
| `<leader>xt` | Todo Comments | TODO/FIX/FIXME/HACK 등 전체 |
| `<leader>xT` | Todo (filtered) | TODO/FIX/FIXME만 필터링 |

## 핵심 개념 비교

### Diagnostics

LSP(Language Server Protocol)가 코드를 분석해서 제공하는 **에러, 경고, 힌트** 목록이다.

- 소스: LSP 서버 (tsserver, pyright, jdtls 등)
- 범위: 워크스페이스 전체 또는 버퍼 단위
- 예시: 타입 불일치, 미사용 변수, import 누락

```text
error: Type 'string' is not assignable to type 'number'.  [ts(2322)]
warn:  'foo' is declared but its value is never read.     [ts(6133)]
```

### Quickfix List

Vim이 **전역적으로** 관리하는 에러/결과 목록이다. `:make`, `:grep`, `:vimgrep` 등의 명령 결과가 여기에 쌓인다.

- 소스: 빌드 에러, grep 결과, LSP 출력 등
- 범위: **전역** (Vim 인스턴스당 하나)
- 관련 명령: `:copen`, `:cnext`, `:cprev`

```vim
:vimgrep /TODO/ **/*.lua    " 결과가 quickfix list에 들어감
:copen                       " quickfix 창 열기
```

### Location List

Quickfix와 구조는 같지만 **윈도우 단위**로 관리된다. 각 윈도우가 독립적인 location list를 가진다.

- 소스: `:lmake`, `:lgrep`, `:lvimgrep` 등
- 범위: **윈도우 로컬** (윈도우마다 별도)
- 관련 명령: `:lopen`, `:lnext`, `:lprev`

```text
Quickfix List  →  전역 1개   →  :copen / :cnext / :cprev
Location List  →  윈도우별   →  :lopen / :lnext / :lprev
```

### Todo Comments

코드에 작성된 `TODO`, `FIX`, `FIXME`, `HACK`, `NOTE` 등의 주석을 수집해서 보여준다. [todo-comments.nvim](https://github.com/folke/todo-comments.nvim) 플러그인이 담당한다.

```lua
-- TODO: 이 로직 리팩토링 필요
-- FIXME: 엣지 케이스 처리 안 됨
-- HACK: 임시 우회, 다음 스프린트에 제거
```

## Trouble 플러그인의 역할

위 4가지는 각각 다른 소스에서 오지만, **Trouble**이 통합 UI로 묶어준다.

```text
┌─────────────────────────────────┐
│           Trouble UI            │
├─────────┬───────────┬───────────┤
│  LSP    │  Vim      │  Plugin   │
│  Diag   │  QF / Loc │  Todo     │
└─────────┴───────────┴───────────┘
```

- 일관된 인터페이스로 탐색 (같은 키로 이동, 접기/펼치기)
- 파일별 그룹핑, 미리보기, 자동 갱신 지원
- `<leader>x` 하나로 모든 목록에 접근 가능
