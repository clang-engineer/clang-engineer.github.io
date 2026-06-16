---
title       : "Neovim 플러그인을 Lua로 짤까 Vimscript로 짤까 — 언어 선택 기준"
description : "신규 플러그인은 Lua가 표준이지만, 부모 생태계가 Vimscript인 경우엔 Vimscript가 더 자연스럽다. dadbod 어댑터 사례로 본 선택 기준."
date        : 2026-06-12 19:00:00 +0900
updated     : 2026-06-16 10:00:00 +0900
categories  : [neovim, "원리·언어"]
tags        : [lua, vimscript, plugin]
pin         : false
hidden      : false
---

"Neovim 플러그인은 Lua로 만든다"가 흔한 답변이지만, 실제 생태계를 둘러보면 **Vimscript로 짜인 신규 플러그인도 있고 그게 정당한 경우가 있다**. 이 글은 그 경계를 정리한다.

## 결론 먼저

| 상황 | 권장 언어 |
| --- | --- |
| 새 플러그인을 **처음부터** 만든다 | Lua |
| 기존 **Vimscript 플러그인의 어댑터·확장**을 만든다 | Vimscript (부모와 정렬) |
| 사용자 진입점(`setup`)만 추가 | Lua 얇은 래퍼 |
| 무거운 외부 처리 (LSP·인덱서 등) | 외부 언어(Rust/Go) + RPC |

핵심 원칙은 **"부모 생태계와 같은 언어를 쓴다"**이다.

## Lua vs Neovim — 자주 헷갈리는 층위 차이

먼저 짚고 갈 것. Lua와 Neovim은 완전히 다른 층위다.

- **Lua**: 범용 프로그래밍 언어 (1993, PUC-Rio). 게임 엔진·nginx·redis 등 수많은 곳에서 임베디드 스크립트로 쓰임.
- **Neovim**: 텍스트 에디터. 내부에 LuaJIT 인터프리터를 **내장**하고, `vim.*` API를 노출.

```
┌──────────────────────────────┐
│         Neovim (에디터)        │
│  ┌────────────────────────┐  │
│  │  LuaJIT 인터프리터       │  │  ← Neovim이 빌드 시 내장
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │  C 코어 엔진            │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

설정·플러그인을 Lua로 작성하기 때문에 두 단어가 항상 같이 등장하지만, "Lua = Neovim의 설정 언어"는 오해다. Lua 자체는 Neovim과 무관하게 존재하고, Neovim은 그 인터프리터를 빌려 쓸 뿐이다.

```lua
-- 이건 그냥 Lua 문법
local x = 10
print(x + 5)

-- 이건 Lua로 짰지만 Neovim API 호출
vim.api.nvim_set_option("number", true)  -- vim.* 가 Neovim이 주입한 API
```

`vim.*`를 빼면 일반 Lua 코드다.

## 신규 플러그인 — Lua가 답인 이유

| 선택지 | 상태 | 결론 |
| --- | --- | --- |
| **Lua** | 현재 표준 | **이걸로 만든다** |
| Vimscript | 레거시 (동작은 함) | 신규 작성은 안 함 |
| Fennel | 마이너 (Lua로 컴파일되는 Lisp 방언) | Lisp 광이면 |
| Teal | 거의 죽음 (Lua + 정적 타입) | 쓰지 말 것 |

신규 플러그인을 Lua로 짜는 정당한 이유:

1. **내장 인터프리터** — 추가 설치 불필요, LuaJIT 덕분에 빠름
2. **공식 권장** — `vim.*` API가 Lua 기준으로 설계됨
3. **생태계 정렬** — 99%의 모던 Neovim 플러그인이 Lua. 참고할 코드·라이브러리가 압도적
4. **lazy.nvim과 호환** — `opts` 자동 주입 같은 편의가 Lua `setup(opts)` 관례 전제

### 단, "강제 룰"은 아니다

명확히 해두자면 — Neovim은 **"신규는 Lua로 짜라"는 룰을 강제하지 않는다**. Vimscript로 새 플러그인을 짜도 동작에는 문제 없다. 유일한 기술적 강제는 `autoload/foo/bar.vim`의 `foo#bar()` 호출 메커니즘이 Vimscript 전용이라는 것 정도다.

그래서 위 "정당한 이유" 4개는 **커뮤니티 표준**에 가깝다. 안 따라도 플러그인은 동작하지만, 따르지 않으면 사용자·매니저와의 정렬이 깨질 뿐이다.

## 예외 — Vimscript가 더 자연스러운 경우

신규 플러그인이라도 **부모 플러그인이 Vimscript면 Vimscript로 짜는 게 더 자연스럽다**. dadbod 어댑터를 예로 본다.

### 사례: vim-dadbod 어댑터

`vim-dadbod`, `vim-dadbod-ui`(tpope·kristijanhusak)는 **순수 Vimscript** 플러그인이다. 새 DBMS 어댑터를 붙이려면 이 두 부모의 규약을 따라야 한다.

규약 자체가 Vimscript 기준이다:

- `db#adapter#vertica#interactive()` 같은 함수명 (`#`은 Vimscript autoload 문법)
- `g:db_ui_table_helpers` 같은 전역 dict
- `db_ui#schemas#get()` 호출 규약

이걸 Lua로 재구현하면 **호출 경계마다 Vimscript ↔ Lua 변환 오버헤드**가 생기고, 함수명·전역 dict 접근이 `vim.fn["db#adapter#vertica#interactive"]()`·`vim.g.db_ui_table_helpers` 같은 형태로 지저분해진다.

### monkey-patch가 필요할 때

dadbod-ui의 schema-tree는 내부 dict가 script-local이어서 공개 훅이 없다. 끼어들려면 `db_ui#schemas#get()` 함수 자체를 **재정의(override)** 해야 한다:

```vim
function! db_ui#schemas#get(scheme) abort
  return get(s:schemes_cache, a:scheme, {})
endfunction
```

이건 Vimscript 함수를 같은 언어로 덮어쓰는 작업이다. Lua에서 하려면 `vim.cmd([[function! db_ui#schemas#get(scheme) abort ... ]])` 같은 식으로 문자열을 던져야 하는데, 가독성이 급격히 나빠진다.

### Lua는 진입점 래퍼로만

그래도 lazy.nvim 사용자를 위해 `setup(opts)` 진입점은 Lua로 두는 게 좋다:

```lua
-- lua/dadbod-vertica/init.lua
local M = {}

function M.setup(opts)
  opts = opts or {}
  if opts.vsql ~= nil then
    vim.g.dadbod_vertica_vsql = opts.vsql  -- 받은 옵션을 g: 변수로 옮김
  end
end

return M
```

실제 로직(Vimscript)은 `g:dadbod_vertica_vsql`만 읽으면 된다. 사용자 입장에선:

```lua
-- lazy.nvim spec
return {
  "myuser/dadbod-vertica.nvim",
  opts = { vsql = "/usr/local/bin/vsql" },  -- 자연스럽게 Lua로 옵션 전달
}
```

**Lua 10줄짜리 얇은 래퍼 + Vimscript 본체**가 두 세계를 다 만족시킨다.

## 외부 언어 (Rust/Go/Python) — 별개 카테고리

Neovim의 **RPC 프로토콜**을 통해 외부 프로세스가 Neovim을 제어할 수 있다. 예시:

- `coc.nvim` — Node.js
- `denops.vim` — Deno
- 일부 LSP/DAP 백엔드 — Rust, Go

이건 "플러그인을 만든다"라기보다 **"외부 서버를 Neovim에 연결한다"**에 가깝다. 무거운 연산(파서, 인덱서, 네트워크 통신)이 필요한 경우에만 정당화되고, 사용자가 추가 바이너리를 설치해야 해서 진입 장벽이 올라간다.

일반적인 플러그인 — 키맵 추가, UI 컴포넌트, 텍스트 변환, 외부 CLI 래퍼 등 — 은 전부 Lua(또는 부모 정렬 시 Vimscript)로 충분하다.

## `.nvim` / `.vim` 접미사 — 언어와 무관

GitHub 레포명 컨벤션이지 언어 표시가 아니다.

- `xxx.nvim` → "Neovim 전용 또는 Neovim 친화적 플러그인"
- `xxx.vim` → "Vim 호환 (Neovim에서도 동작)"

내부가 Vimscript여도 `setup()` 같은 Neovim 사용자 편의를 제공하면 `.nvim`을 붙이는 경우가 흔하다. 레포명만 보고 언어를 추정하면 안 된다.

## 의사결정 체크리스트

새 Neovim 플러그인을 시작할 때 이 순서로 묻는다.

1. **부모 플러그인이 있는가?** (예: dadbod 어댑터, fugitive 확장)
   - 있다 → 부모와 같은 언어를 따른다.
   - 없다 → 다음 질문.
2. **외부 무거운 연산(파서, 인덱서, 네트워크 서버)이 필요한가?**
   - 그렇다 → 외부 언어(Rust/Go) + RPC.
   - 아니다 → 다음 질문.
3. **순수 신규 플러그인이다** → **Lua**.

이 순서로 결정하면 "왜 Vimscript로 짰냐"는 질문에 대한 답이 명확해진다.

## 정리

"Neovim 플러그인은 Lua로"가 일반 규칙이고, **"기존 Vimscript 생태계 확장은 Vimscript 유지"**가 정당한 예외다. 진입점만 Lua 얇은 래퍼로 두면 lazy.nvim 사용자 편의는 그대로 챙길 수 있다. 언어 선택은 이념 문제가 아니라 **부모 생태계와의 통합 비용 문제**다.

## 플러그인 작성 시리즈

| 글 | 다루는 것 |
| --- | --- |
| **언어 선택 (현재 글)** | Lua가 표준이지만 부모 생태계가 Vimscript면 Vimscript가 자연스럽다 |
| [Lua와 Vimscript 섞기](/posts/neovim/2026-06-12-neovim-plugin-mixing-lua-vimscript/) | 호출 경계 최소화, 흔한 안티패턴, 모범 분담 |
| [runtimepath 디렉토리 관례](/posts/neovim/2026-06-12-neovim-plugin-conventions/) | `plugin/` vs `lua/`, 헬프·헬스체크·after/ 자동 로드 규칙 |
| [4가지 채널로 노출시키기](/posts/neovim/2026-06-12-neovim-plugin-distribution/) | awesome-neovim · Dotfyle · VimAwesome · GitHub Topics |

실전 케이스로 [vim-dadbod 어댑터 플러그인 만들기](/posts/neovim/2026-06-12-vim-dadbod-adapter-plugin-build/)에서 위 4가지 원칙을 한 번에 적용해본다.
