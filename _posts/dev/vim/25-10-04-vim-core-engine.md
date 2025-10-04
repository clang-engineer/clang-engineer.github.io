---
title       : Vim & Neovim 작동 원리 정리
description : 
date        : 2025-10-04 12:16:25 +0900
updated     : 2025-10-04 12:30:13 +0900
categories  : ["dev","vim"]
tags        : ["vim","init.vim","neovim"]
pin         : false
hidden      : false
---

# ⚙️ Vim & Neovim 작동 원리 정리

## 1. 전체 구조 개요
- Vim과 Neovim 모두 “C로 짜인 편집기 엔진”을 중심으로, 그 위에 “스크립트 인터프리터(Vimscript, Lua 등)”가 올라가서 명령을 해석하고 최종적으로 C 엔진을 호출하는 구조
- 엔진 상위에 사용자의 명령이나 설정을 해석하기 위한 **스크립트 인터프리터 계층**이 얹혀 있다.

```
┌─────────────────────────────┐
│         User Input           │
│   (명령줄, 키 입력, 설정)    │
└────────────┬────────────────┘
             │
┌────────────┴────────────┐
│   Script Interpreter     │
│   (Vimscript / Lua)      │
└────────────┬────────────┘
             │
┌────────────┴────────────┐
│   Core Engine (C Code)   │
│  - 버퍼 관리              │
│  - 윈도우/탭 구조체       │
│  - 명령 테이블 & 옵션     │
│  - 화면 렌더링, I/O 등    │
└────────────┬────────────┘
             │
┌────────────┴────────────┐
│   OS 레벨 자원 접근       │
│   (파일, 터미널, 이벤트)  │
└──────────────────────────┘
```

---

## 2. Vim의 구조

### 🏗️ 2.1 구성 요소

* **C 엔진 (core/main.c)**
  Vim의 모든 기능은 C 코드로 구현되어 있으며, `ex_cmds.c`, `buffer.c`, `window.c` 같은 파일에 명령이 등록되어 있다.
* **Vimscript 인터프리터**

  * 사용자의 명령(`:set`, `:map`, `:autocmd`, `:if`, `:function`)을 파싱.
  * 내부적으로 명령 문자열을 해석하고, 해당 C 함수 포인터를 찾아 호출한다.
  * 예:

    ```vim
    :set number
    ```

    → 파서가 `"set"` 명령을 인식
    → 내부 테이블에서 `ex_set()` C 함수를 찾아 호출
    → `curwin->w_p_nu = true` 설정

### ⚙️ 2.2 실행 흐름

```
User 입력 → Vimscript 파서 → 명령 트리(AST) 생성
 → 해당 C 함수 호출 → 엔진 상태 갱신 (buffer/window 등)
```

즉, Vimscript는 “명령 해석기(interpreter)” 역할을 할 뿐이고,
**실제 동작은 모두 C 엔진이 처리한다.**

---

## 3. Neovim의 구조

### 🧩 3.1 기본 철학

Neovim은 **Vim의 엔진을 리팩토링**한 버전으로,

* 코드를 모듈화 (Core / UI / RPC / API),
* **LuaJIT을 내장**하여 새로운 인터프리터를 추가한 형태.

즉, 기존 Vimscript 인터프리터도 유지하지만
Lua 인터프리터(LuaJIT)를 **공식 통합 언어**로 도입했다.

---

### ⚙️ 3.2 동작 흐름

1. 사용자가 Lua 또는 Vimscript 명령을 실행한다.
2. 각 언어 인터프리터는 Neovim의 **C API(nvim_*)**를 호출한다.
3. C 엔진이 버퍼, 윈도우, 옵션 구조체를 갱신한다.
4. 결과가 이벤트 루프를 통해 다시 사용자에게 반영된다.

```
User → Lua/Vimscript → Neovim API → C Core → Event Loop → UI
```

---

### 🧠 3.3 LuaJIT 통합의 의미

* LuaJIT은 Lua 코드를 JIT(Just-In-Time) 컴파일로 **기계어 수준**으로 최적화한다.
* Lua에서 `vim.api.nvim_set_option_value()` 같은 함수를 호출하면
  직접 C API를 타고 엔진 함수를 호출하므로 **Vimscript보다 훨씬 빠르다.**

---

## 4. Vim vs Neovim 비교 (엔진 관점)

| 구분       | Vim                    | Neovim                             |
| -------- | ---------------------- | ---------------------------------- |
| 엔진 언어    | C                      | C (Vim에서 포크 후 리팩토링)                |
| 인터프리터    | Vimscript              | Vimscript + LuaJIT                 |
| 명령 실행 방식 | Vimscript 파서 → C 함수 호출 | Vimscript/Lua → nvim API → C 함수 호출 |
| API 계층   | 내부 전용                  | 명시적 C API (RPC, Lua 등)             |
| 비동기 처리   | 제한적                    | 완전한 event loop 기반                  |
| 외부 연동    | 없음                     | RPC, LSP, Tree-sitter 등 통합         |

---

## 5. 한 줄 요약

> 🧩 **Vim과 Neovim은 모두 “C 엔진”을 중심으로 돌아가는 구조이며,
> Vimscript나 Lua는 단지 그 엔진을 제어하기 위한 인터프리터 계층일 뿐이다.**
>
> 차이는 Neovim이 **C API를 공식화**하고 **LuaJIT을 내장**해,
> 더 빠르고 확장 가능한 방식으로 그 엔진을 호출할 수 있다는 점이다.
