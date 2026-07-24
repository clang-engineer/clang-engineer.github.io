---
title       : Vim & Neovim 작동 원리 정리
description : "Vim과 Neovim의 C 코어, Ex 명령·Vimscript 실행기, Neovim Lua와 공개 nvim_* API가 어떻게 연결되는지 구분해 설명."
date        : 2025-10-04 12:16:25 +0900
updated     : 2026-07-24 15:00:00 +0900
categories  : [neovim, "Vim·Vimscript"]
tags        : [neovim]
pin         : false
hidden      : false
---

## ⚙️ Vim & Neovim 작동 원리 정리

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
User 입력 → Ex/Vimscript 파싱·실행
 → 해당 내부 명령 구현 호출 → 엔진 상태 갱신 (buffer/window 등)
```

즉, Vimscript는 “명령 해석기(interpreter)” 역할을 할 뿐이고,
**실제 동작은 모두 C 엔진이 처리한다.**

---

## 3. Neovim의 구조

### 🧩 3.1 기본 철학

Neovim은 **Vim의 엔진을 리팩토링**한 버전으로,

* 코드를 모듈화 (Core / UI / RPC / API),
* **Lua 5.1 호환 실행 환경**을 일급 인터페이스로 추가한 형태.

즉, 기존 Vimscript 인터프리터도 유지하지만
Lua 5.1을 **공식 통합 언어**로 도입했다. 지원 플랫폼의 일반적인 빌드는 LuaJIT 또는 호환 구현을 쓰지만, 공개 언어 계약은 LuaJIT 전용 문법이 아니라 Lua 5.1이다.

---

### ⚙️ 3.2 동작 흐름

1. 사용자가 Lua 또는 Vimscript 명령을 실행한다.
2. `vim.api.nvim_*`를 사용한 Lua 코드는 공개 `nvim_*` API를 호출한다. Ex 명령·Vimscript와 `vim.fn`은 각자의 내부 실행 경로를 쓸 수 있다.
3. C 엔진이 버퍼, 윈도우, 옵션 구조체를 갱신한다.
4. 결과가 이벤트 루프를 통해 다시 사용자에게 반영된다.

```
User → Lua/Vimscript/Ex → 공개 API 또는 내부 명령 경로 → C Core → Event Loop → UI
```

---

### 🧠 3.3 Lua 통합의 의미

* Neovim의 플러그인 인터페이스가 보장하는 언어 기준은 **Lua 5.1**이다.
* 공식 빌드는 보통 LuaJIT 또는 호환 구현을 사용하지만, 플러그인이 `jit` 전역의 존재를 확인하지 않고 LuaJIT 전용 기능을 가정하면 안 된다.
* `vim.api.nvim_set_option_value()` 같은 함수는 공개 `nvim_*` API에 대한 Lua 바인딩이다. 이 구조는 API 경계를 명확히 하지만, 호출 하나가 항상 Vimscript보다 빠르다는 뜻은 아니다.

---

## 4. Vim vs Neovim 비교 (엔진 관점)

| 구분       | Vim                    | Neovim                             |
| -------- | ---------------------- | ---------------------------------- |
| 엔진 언어    | C                      | C (Vim에서 포크 후 리팩토링)                |
| 인터프리터    | Vimscript              | Vimscript + Lua 5.1 호환 환경      |
| 명령 실행 방식 | Ex/Vimscript 실행 경로 → 내부 구현 | Ex/Vimscript 내부 경로 + Lua `vim.api` → `nvim_*` API |
| API 계층   | 함수·채널·job 등 Vim 인터페이스 | 명시적인 `nvim_*` API를 Lua와 RPC에 공통 노출 |
| 비동기 처리   | job·channel·timer 지원 | libuv 이벤트 루프와 job·RPC 통합 |
| 외부 연동    | job/channel, terminal, client-server | MessagePack-RPC, 내장 LSP client, Tree-sitter 등 |

---

## 5. 한 줄 요약

> 🧩 **Vim과 Neovim은 모두 “C 엔진”을 중심으로 돌아가는 구조이며,
> Vimscript나 Lua는 단지 그 엔진을 제어하기 위한 인터프리터 계층일 뿐이다.**
>
> 차이는 Neovim이 **언어 중립적인 `nvim_*` API와 RPC 경계**를 넓게 공개하고 Lua 5.1 환경을 일급 확장 인터페이스로 제공한다는 점이다.
