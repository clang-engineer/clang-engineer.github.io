---
title       : "Neovim 코드 진단과 결과 탐색 — LSP·Quickfix·Trouble"
description : "검색·빌드·LSP 결과가 생성되고 Quickfix·Diagnostics에 관리되며 Trouble·Picker로 탐색되는 관계와 LazyVim 사용법"
date        : 2026-05-04 10:00:00 +0900
updated     : 2026-07-24 12:00:00 +0900
categories  : [lazyvim, "플러그인"]
tags        : [trouble, diagnostics]
pin         : false
hidden      : false
---

## 전체 개념지도 — 생성·관리·표시는 다르다

```text
             결과 생성
                 │
       ┌─────────┼─────────┐
       ▼         ▼         ▼
     Search     Build      LSP / Linter
       │         │         │
       ▼         ▼         ▼
    검색 위치   오류 위치   참조·진단 위치
       │         │         │
       ├─────────┘         │
       ▼                   ▼
 Quickfix / Location    Diagnostics
       List                 │
       │                    │
       └─────────┬──────────┘
                 ▼
          Trouble / Picker
             결과 탐색
```

위 그림은 대표 경로를 단순화한 것이다. **Quickfix는 Vim의 기본 위치 목록**이고 `:vimgrep`·`:make`가 결과를 채울 수 있다. `:make`는 `makeprg`로 외부 빌드를 실행하고 `errorformat`으로 출력을 해석한다. LSP 진단은 Neovim의 `vim.diagnostic`에서 관리되며 **자동으로 Quickfix에 등록되는 것은 아니다**. `vim.diagnostic.setqflist()`처럼 명시적으로 옮길 수 있다. Trouble은 진단을 직접 읽거나 Quickfix를 표시한다. Picker는 검색 결과를 직접 보여줄 수도 있어 모든 탐색이 Quickfix를 거치지는 않는다.

**선택 기준:** 일회성 검색·선택은 Picker, 여러 위치를 보관·순회할 때는 Quickfix, LSP 오류·경고나 참조를 목록으로 살필 때는 Trouble을 사용한다. Mark는 직접 지정한 개별 책갈피, Jump List는 주요 점프의 자동 방문 이력이라는 점에서 별개다.

## 개요

LazyVim은 **Trouble** 플러그인으로 Diagnostics, Quickfix List, Location List, Todo Comments와 LSP 결과를 통합해 보여준다. 현행 기본 키맵은 문제 목록을 `<leader>x`, 코드 탐색 목록을 `<leader>c` 아래에 나눈다. Todo는 Trouble 키맵 `<leader>xt`/`<leader>xT`와 picker 키맵 `<leader>st`/`<leader>sT`를 모두 제공한다.

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
- 범위: **전역** (현재 Quickfix 목록을 사용하며 이전 목록 이력은 `:colder` / `:cnewer`로 탐색 가능)
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
Quickfix List  →  전역 목록 및 이력  →  :copen / :cnext / :cprev
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
- 문제 목록은 `<leader>x`, 코드 구조·LSP 목록은 `<leader>c`로 접근

---

> 진단 메시지·LSP 로그·`:messages`를 **실제로 열어 확인하는 방법**(`<leader>cd`, `:LspLog`, `:messages`)은 [LazyVim Diagnostics 로그/메시지 확인법](./2026-02-04-lazyvim-diagnostics.md)에 정리했습니다. 이 글은 Trouble 키맵·개념, 저 글은 로그 확인 절차입니다.
