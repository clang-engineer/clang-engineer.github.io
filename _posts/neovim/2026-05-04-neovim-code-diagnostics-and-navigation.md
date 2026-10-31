---
title       : "Neovim 코드 진단과 결과 탐색 — LSP·Quickfix·Trouble"
description : "검색·빌드·LSP 결과가 생성되고 Quickfix·Diagnostics에 관리되며 Trouble·Picker로 탐색되는 관계와 LazyVim 사용법"
date        : 2026-05-04 10:00:00 +0900
updated     : 2026-07-24 12:00:00 +0900
categories  : [lazyvim, "플러그인"]
tags        : [trouble, diagnostics]
pin         : false
hidden      : false
redirect_from:
  - /posts/neovim/2026-05-04-lazyvim-leader-x-trouble/
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

## 왜 Quickfix·Diagnostics·Trouble이 따로 있을까?

이 셋은 같은 종류의 **코드 위치 정보**를 다루지만 책임이 다르다.

| 개념 | 무엇인가 | 주된 관리 방식 |
|---|---|---|
| Quickfix (Vim 내장) | 검색·빌드 오류 등 범용 **위치 목록** | 명령이나 플러그인이 목록을 채우고 갱신 |
| Diagnostics (`vim.diagnostic`, Neovim 내장) | 오류·경고 등 **현재 코드의 진단 상태** | 버퍼·진단 제공자(namespace)별 갱신 |
| Trouble (플러그인) | 진단·Quickfix·LSP 위치를 **표시하고 탐색하는 UI** | 데이터 소스를 읽거나 LSP 요청을 통해 결과를 가져옴 |
| Picker (Snacks 등) | 후보를 검색·필터링해 **빠르게 선택하는 UI** | 검색 또는 LSP 결과를 대화형으로 표시 |

Quickfix를 계속 갱신하면 실시간 오류 목록처럼 쓸 수 있다. 차이는 단순히 '스냅샷 대 실시간'이나 '정보량'이 아니라 **범용 목록과 진단 상태라는 관리 모델**이다. Diagnostics는 LSP뿐 아니라 Linter의 진단도 관리하며, Quickfix는 진단이 아닌 텍스트 검색 결과도 담는다.

### 결과는 어디서 만들어지고 어디에 표시될까?

```text
                    결과 생성
            ┌───────────┼────────────┐
            ▼           ▼            ▼
        :vimgrep       :make      LSP / Linter
            │           │            │
        검색 위치     빌드 오류     진단·코드 관계
            │           │            │
            └─────┬─────┘       ┌─────┴─────────┐
                  ▼             ▼               ▼
             Quickfix       Diagnostics     References 등
                  │             │               │
                  └─────────────┼───────────────┘
                                ▼
                         Trouble (UI)
```

이 그림은 가능한 경로를 단순화했다. **LSP 진단이 자동으로 Quickfix에 등록되지는 않는다.** Trouble은 Neovim의 Diagnostics를 직접 읽을 수 있고, LSP References 등은 LSP 클라이언트를 통해 요청해 보여줄 수 있다. Picker도 자체 검색 결과나 LSP 결과를 직접 보여줄 수 있다. Trouble이나 Picker가 Quickfix를 반드시 거치는 것은 아니다.

### 왜 Trouble에 References까지 있을까?

오류 목록과 참조 목록은 모두 **파일·줄·열로 표현되는 위치 집합**이기 때문이다. Trouble은 이미 목록을 파일별로 묶고, 미리보기와 위치 이동을 제공하므로 같은 UI를 다른 결과에도 활용한다.

```text
Diagnostics                         References
├─ main.js:10  타입 오류             ├─ main.js:15  getUser() 호출
└─ api.js:40   경고                 └─ api.js:50   getUser() 호출
         │                                  │
         └──────── Trouble의 위치 탐색 UI ───┘
```

Trouble이 코드의 참조를 자체 분석하는 것은 아니다. **언어 서버가 참조 위치를 계산하고, Trouble은 Neovim LSP 기능을 통해 결과를 받아 탐색하게 한다.** Diagnostics 모드에서는 Neovim이 이미 관리하는 진단 상태를 읽는다.

### Picker와 Trouble은 왜 둘 다 있을까?

예를 들어 Java의 `getUser()` 사용처가 30곳이라고 해보자. **특정 호출 한 곳을 빨리 찾는다면** `gr` 등으로 Picker를 열어 검색·선택하는 흐름이 편하다. **30곳을 차례로 검토하거나 수정한다면** Trouble 패널을 유지하며 그룹별로 순회하는 흐름이 편하다. 어느 한쪽만 가능한 것은 아니며, 키맵과 기본 UI는 LazyVim 버전·설정에 따라 달라진다.

```text
          LSP References (위치 30곳)
                       │
            ┌──────────┴──────────┐
            ▼                     ▼
         Picker                 Trouble
      검색·필터·선택        목록 유지·그룹·순회
```

**사용 기준:** 일회성 검색은 Picker, 오류·경고의 현재 상태는 Trouble Diagnostics, 여러 검색·빌드 결과를 보관할 때는 Quickfix, 여러 LSP 참조를 계속 검토할 때는 Trouble LSP 목록을 고려한다. Vim의 Mark는 개별 위치를 직접 저장하는 책갈피, Jump List는 점프 방문 이력이므로 별개다.

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
