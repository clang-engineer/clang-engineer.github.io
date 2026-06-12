---
title       : "Lua vs Vimscript 성능 — 정량 차이와 체감되는 영역"
description : "LuaJIT은 JIT 컴파일러, Vimscript는 트리 워킹 인터프리터. 산술·문자열은 10~100배 차이지만 대부분의 플러그인 작업에선 체감 안 됨. 진짜 차이 나는 영역과 측정 방법."
date        : 2026-06-12 20:00:00 +0900
updated     : 2026-06-12 20:00:00 +0900
categories  : [vim, "원리·언어"]
tags        : [neovim, lua, luajit, vimscript, performance, benchmark]
pin         : false
hidden      : false
---

"Lua가 Vimscript보다 빠르다"는 말은 흔하지만, **어느 정도 빠른지, 어디서 빠른지**는 잘 정리되지 않는다. 이 글은 실제 차이가 어디서 발생하고 어디선 무의미한지 정리한다.

## 결론 먼저

- **순수 산술/문자열/테이블 조작**: LuaJIT이 Vimscript보다 **10~100배** 빠르다 (객관적 사실)
- **`vim.api.*` / `:call` API 호출**: 거의 차이 없음 (둘 다 C 코어로 내려감)
- **체감되는 영역**: 시작 시간, 버퍼 전체 순회, 타이트한 루프, 정규식 처리
- **체감 안 되는 영역**: 키맵, autocmd, 단순 커맨드 — 1초에 몇 번 실행 안 됨

성능을 이유로 언어를 고를 만한 플러그인은 소수다. 신규를 Lua로 짜는 진짜 이유는 성능보다 **생태계 정렬**이다.

## 왜 차이가 나는가 — 실행 모델

### Vimscript: 트리 워킹 인터프리터

```
소스 → 파싱 → AST 생성 → 매 실행마다 트리 순회 실행
```

매 호출마다 AST를 위에서부터 다시 순회한다. 함수가 1000번 호출되면 AST 순회를 1000번 한다. 캐시·최적화 없음.

### Lua (LuaJIT): JIT 컴파일러

```
소스 → 바이트코드 → 핫스팟 감지 → 네이티브 머신코드로 컴파일 → 직접 실행
```

자주 실행되는 코드 경로를 감지해 **네이티브 머신코드**로 컴파일한다. 한 번 컴파일되면 그 다음부터는 C 수준 속도로 실행된다.

LuaJIT은 동적 언어 구현 중 가장 빠른 축에 속한다 — Python(CPython)보다 10~100배 빠른 케이스가 흔하다.

## 정량 비교 — 차이가 큰 영역

| 작업 | Vimscript | Lua (LuaJIT) | 배수 |
| --- | --- | --- | --- |
| 100만 회 산술 루프 | ~수백ms | ~수ms | **수십~100배** |
| 1만 줄 문자열 처리 (`split`, `gsub`) | 느림 | 빠름 | **10~50배** |
| 1만 키 dict/table 순회 | 느림 | 빠름 | **10~30배** |
| 정규식 검색·치환 | `substitute()` 느림 | `string.gsub` 빠름 | **5~20배** |

산술·문자열·자료구조 조작이 **스크립트 안에서 일어나면** Lua가 압도적이다.

## 정량 비교 — 차이가 작은 영역

| 작업 | Vimscript | Lua (LuaJIT) | 배수 |
| --- | --- | --- | --- |
| `vim.api.nvim_*` API 호출 | `:call`로 호출 | 직접 호출 | **거의 동일** |
| 버퍼 라인 읽기 | `getline()` | `vim.api.nvim_buf_get_lines` | 거의 동일 |
| 옵션 설정 | `:set ...` | `vim.opt.*` | 거의 동일 |
| autocmd 트리거 | 동일 메커니즘 | 동일 메커니즘 | 동일 |

**Neovim C API를 호출하는 순간 둘 다 C 코어로 내려간다.** 그 안에서는 똑같이 빠르다. 차이가 나는 건 **C API 호출 사이의 글루 코드**뿐이다.

이게 핵심 포인트다. 대부분의 플러그인은 글루 코드가 5~10줄, 진짜 일은 API가 한다. 그래서 둘 다 동작은 멀쩡하게 빠르다.

## 체감되는 영역 — 실제 플러그인 사례

### 1. 시작 시간 (`plugin/*.{vim,lua}` 자동 로드)

Neovim 시작 시 모든 `plugin/` 파일이 동기로 로드된다. 플러그인 50개가 startup-load되면 누적된다.

- Vimscript 위주 환경: 200~500ms
- Lua + lazy-load 환경: 30~100ms

다만 **이건 언어 차이라기보다 lazy-load 여부**가 더 큰 변수다. 같은 플러그인을 startup-load하느냐 lazy-load하느냐가 10배 차이를 만든다.

### 2. 린터·파서 (버퍼 전체 순회)

`ale` (Vimscript) vs `nvim-lint` / `null-ls` (Lua):

- 10만 줄 버퍼에서 줄 단위 처리 시 Vimscript는 체감 렉
- Lua는 무사통과

### 3. 정규식 검색·치환

대형 파일에서 `:%s/pat/rep/g` 같은 작업의 후처리:

- `substitute()` 반복 vs `string.gsub` 일괄 → Lua가 보통 5~20배 빠름

### 4. Tree-sitter 후처리

Tree-sitter 파서 자체는 C로 짜여 있어 언어 무관. 다만 노드 1만 개 순회하면서 변환·필터링하는 후처리 코드는 Lua가 압도적.

## 체감 안 되는 영역

- **키맵, autocmd, 단순 커맨드**: 1초에 몇 번 실행 안 됨. 사람이 못 느낌
- **UI 한 번 그리기 (statusline, winbar)**: 그리는 빈도가 낮음
- **LSP 핸들러**: 대부분 시간이 LSP 서버 응답 대기. 글루 코드는 무의미
- **단순 옵션 set, 변수 할당**: 마이크로초 단위

## 측정 — 추측하지 말고 재라

언어 차이가 정말 체감되는지 의심되면 측정한다.

### 시작 시간 프로파일

```bash
nvim --startuptime startup.log
```

가장 오래 걸린 파일 순으로 정렬된다. 100ms 이상 걸리는 게 있으면 lazy-load 검토.

### Lua 함수 프로파일

```vim
" profile.nvim 사용 예시
:lua require('profile').start("*")
" ... 작업 ...
:lua require('profile').stop("trace.json")
" → trace.json을 chrome://tracing 또는 ui.perfetto.dev에서 열기
```

### Vimscript 프로파일

```vim
:profile start profile.log
:profile func *
:profile file *
" ... 작업 ...
:profile pause
:noautocmd qall!
```

`profile.log`에 함수별·라인별 호출 횟수·누적 시간이 나온다.

## 그래서 언어를 성능 기준으로 골라야 하나

| 시나리오 | 답 |
| --- | --- |
| 키맵·autocmd·단순 커맨드 | **둘 다 무관**. 생태계 정렬로 결정 |
| 버퍼 전체 스캔·린터·파서 | **Lua 필수** |
| 시작 시 무거운 setup | **Lua + lazy-load** |
| 인터랙티브 UI (실시간 갱신) | **Lua** |
| 어댑터·monkey-patch 같은 글루 코드 | **부모 정렬** (성능 무관) |

대부분의 플러그인은 "성능 기준으로 언어를 골라야 할 만한" 영역에 해당하지 않는다.

## 결론

- **순수 성능**: LuaJIT가 Vimscript 인터프리터보다 한 자릿수~두 자릿수 배 빠름. 객관적 사실.
- **체감 성능**: 대부분의 플러그인 작업은 C 코어에서 일어나서 언어 차이가 안 보임.
- **진짜 차이 나는 영역**: 버퍼 순회·파서·린터·tight loop. 이건 무조건 Lua.
- **결정 변수**: 언어보다 **lazy-loading 전략**과 **C API를 얼마나 잘 쓰느냐**가 훨씬 큼.

신규 플러그인을 Lua로 짜는 진짜 이유는 성능이 아니라 **생태계 정렬**(다른 사람이 읽기 편하고 매니저와 잘 붙는다)이다. 성능은 그 정렬의 부수 효과에 가깝다.

성능이 의심되면 **추측하지 말고 측정**. `nvim --startuptime`이 첫 단계다.
