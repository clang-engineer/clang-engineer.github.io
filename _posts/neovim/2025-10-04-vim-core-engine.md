---
title       : Vim과 Neovim은 어떻게 동작하는가 — Core에서 UI까지
description : "Vim과 Neovim의 공통 편집기 Core에서 시작해 명령·스크립트 계층, Neovim의 공개 API·RPC·UI 분리가 어떻게 연결되는지 거시에서 미시 순서로 정리한다."
date        : 2025-10-04 12:16:25 +0900
updated     : 2026-09-05 19:06:00 +0900
categories  : [neovim, "Vim·Vimscript"]
tags        : [neovim, vim, architecture]
pin         : false
hidden      : false
---

Vim과 Neovim을 설정하다 보면 Vimscript, Lua, `vim.api`, Ex 명령, RPC 같은 여러 인터페이스를 만나게 된다. 이들을 각각 외우기보다 먼저 **모두 편집기 Core를 제어하거나 그 결과를 표현하기 위한 서로 다른 계층**이라는 좌표를 잡는 편이 이해하기 쉽다.

```text
사용자 / 플러그인 / 외부 클라이언트
              ↓
       명령·확장 인터페이스
              ↓
          편집기 Core
              ↓
      Buffer / Window / Option
              ↓
          UI / OS 자원
```

Vim과 Neovim은 이 큰 구조를 공유하지만, Neovim은 Core 주변의 API·RPC·UI 경계를 더 명시적으로 분리하고 Lua를 일급 확장 환경으로 제공한다.

## 1. 공통 출발점 — 편집기 상태를 소유하는 Core

Vim과 Neovim 모두 핵심 편집 동작은 C로 구현된 편집기 Core가 담당한다.

Core가 관리하는 대표 상태는 다음과 같다.

```text
편집기 Core
├─ Buffer
├─ Window / Tab
├─ Option
├─ 명령과 편집 상태
├─ 입력·이벤트 처리
└─ 화면에 반영할 UI 상태
```

사용자가 `:set number`를 실행하거나 플러그인이 Buffer를 수정해도 최종적으로 바뀌는 것은 이 Core가 가진 상태다.

따라서 Vimscript나 Lua를 별도의 편집기 엔진으로 보는 것보다 **Core에 명령을 전달하는 확장·제어 계층**으로 보는 편이 정확하다.

## 2. Vim — Ex 명령과 Vimscript가 Core를 제어한다

Vim에서는 Ex 명령과 Vimscript가 전통적인 확장 인터페이스다.

```text
사용자 입력 / vimrc / 플러그인
             ↓
      Ex / Vimscript
             ↓
          Vim Core
             ↓
    Buffer / Window / Option
```

예를 들어:

```vim
:set number
```

를 실행하면 Ex 명령 처리 경로가 `set`을 해석하고 Core의 Window option 상태를 변경한다.

구현 수준에서는 `ex_cmds.c`, `buffer.c`, `window.c` 같은 C 코드와 내부 명령 테이블이 이 동작을 담당한다. 하지만 구조를 이해할 때 중요한 것은 특정 C 함수 이름보다:

> **Vimscript와 Ex 명령이 Core 상태를 조작하는 상위 인터페이스다.**

라는 관계다.

## 3. Neovim — Core 주변의 경계를 더 분리했다

Neovim은 Vim에서 출발했지만 Core 주변을 모듈화하면서 API, RPC, UI를 더 명확한 경계로 분리했다.

큰 그림은 다음과 같다.

```text
                   Lua
                    ↓
Vimscript / Ex → Neovim Core ← RPC 클라이언트
                    ↓
              공개 nvim_* API
                    ↓
             Buffer / Window 등
                    ↓
                UI 계층
```

실제 호출 경로는 기능마다 다르므로 모든 명령이 반드시 `nvim_*` API를 거친다고 보면 안 된다. Ex/Vimscript는 내부 실행 경로를 사용할 수 있고, Lua의 `vim.api.nvim_*`는 공개 `nvim_*` API에 대한 바인딩이다.

핵심은 **외부와 내부 확장이 공유할 수 있는 명시적인 공개 API 경계가 커졌다는 것**이다.

## 4. Lua는 Neovim을 다시 구현하는 언어가 아니다

Neovim은 Lua 5.1 호환 실행 환경을 일급 확장 인터페이스로 제공한다.

```text
Lua 플러그인
    ↓
vim.api / vim.fn / vim.*
    ↓
Neovim Core와 기존 기능
```

예를 들어:

```lua
vim.api.nvim_set_option_value("number", true, {})
```

는 공개 `nvim_*` API를 Lua에서 호출하는 형태다.

지원 플랫폼의 일반적인 빌드는 LuaJIT 또는 호환 구현을 사용할 수 있지만, 플러그인이 의존해야 하는 공개 언어 계약은 LuaJIT 전용 문법이 아니라 Lua 5.1 호환 환경이다.

즉 Lua는 Core를 대체하는 것이 아니라 **Core와 Neovim 기능을 조합하는 고수준 확장 환경**이다.

## 5. RPC — 같은 API 경계를 프로세스 밖에서도 사용한다

Neovim의 중요한 차이 중 하나는 MessagePack-RPC를 통해 외부 프로세스도 Neovim과 통신할 수 있다는 점이다.

```text
외부 프로그램
    ↓ MessagePack-RPC
Neovim API
    ↓
Neovim Core
```

이 구조 덕분에 플러그인·도구가 반드시 같은 프로세스 안의 Vimscript나 Lua로만 작성될 필요가 없다.

Lua와 RPC는 실행 위치는 다르지만, Neovim이 공개한 API를 중심으로 Core를 제어할 수 있다는 공통점이 있다.

## 6. UI도 Core에서 분리할 수 있다

Neovim은 UI도 Core와 분리할 수 있다.

```text
Neovim Core
     ↓ UI 이벤트
 UI Protocol
   ├─ 내장 TUI → 터미널
   └─ 외부 GUI → 그래픽 환경
```

터미널에서 `nvim`을 실행할 때 보는 화면은 Neovim 자체와 완전히 동일한 하나의 덩어리가 아니라 **Core의 상태를 표현하는 내장 TUI 클라이언트**로 볼 수 있다.

이 부분은 [Neovim은 왜 TUI 앱이면서 UI 플랫폼인가](/posts/terminal/2026-09-05-neovim-as-tui-platform/)에서 별도로 다룬다.

## 7. 한 번의 동작을 전체 흐름에 놓아보기

Lua 플러그인이 Window option을 변경하는 상황을 단순화하면:

```text
플러그인
  ↓
Lua 코드
  ↓
vim.api.nvim_* 호출
  ↓
공개 nvim_* API
  ↓
Core 상태 변경
  ↓
UI 갱신
  ↓
내장 TUI 또는 외부 GUI
```

Ex 명령이라면 앞부분의 경로가 달라진다.

```text
사용자 :set 명령
  ↓
Ex 명령 처리
  ↓
Core 상태 변경
  ↓
UI 갱신
```

즉 서로 다른 입력·확장 인터페이스가 결국 **같은 편집기 상태와 UI 결과로 수렴한다.**

## 8. Vim과 Neovim의 차이를 같은 축에서 비교

| 관점 | Vim | Neovim |
|---|---|---|
| 핵심 엔진 | C 기반 편집기 Core | Vim에서 출발해 리팩터링한 C 기반 Core |
| 전통적 확장 | Ex / Vimscript | Ex / Vimscript 유지 |
| 추가 확장 환경 | Vim9 script 등 Vim 자체 확장 | Lua 5.1 호환 환경을 일급 제공 |
| 공개 API | Vim의 함수·job·channel 등 인터페이스 | 명시적인 `nvim_*` API를 Lua와 RPC에 폭넓게 노출 |
| 비동기 기반 | job·channel·timer | libuv 이벤트 루프와 job·RPC 통합 |
| UI | Vim 자체 UI 구조 | UI protocol을 통해 내장 TUI와 외부 UI 분리 가능 |

차이를 단순히 "Vimscript vs Lua"로 보면 중요한 구조를 놓친다.

Neovim의 핵심 변화는 **확장 언어 하나를 추가한 것보다 Core 주변의 API·RPC·UI 경계를 넓히고 명시적으로 만든 것**에 가깝다.

## 9. 세부 구현을 볼 때의 좌표

소스 코드를 읽다가 특정 C 함수나 구조체를 만나면 다음 순서로 위치를 잡으면 된다.

```text
이 코드는
어떤 사용자/플러그인 요청을 받는가?
        ↓
어느 명령·API 경계를 지나는가?
        ↓
어떤 Core 상태를 바꾸는가?
        ↓
그 결과가 UI에 어떻게 반영되는가?
```

이 좌표를 먼저 잡으면 `ex_set()` 같은 개별 구현 이름을 외우지 않아도 전체 흐름 안에서 역할을 이해할 수 있다.

## 정리

```text
Vim
사용자 / Vimscript
       ↓
   Ex·내부 명령
       ↓
      Core
       ↓
      UI

Neovim
Lua / Vimscript / 외부 Client
          ↓
   API / 명령 / RPC 경계
          ↓
       Neovim Core
          ↓
      UI Protocol
       ↙       ↘
    내장 TUI   외부 GUI
```

Vim과 Neovim 모두 중심에는 편집기 Core가 있다. 차이는 Neovim이 그 주변의 **확장 API, 프로세스 간 RPC, UI 경계**를 더 적극적으로 분리해 편집기를 하나의 확장 가능한 플랫폼으로 발전시켰다는 데 있다.
