---
title       : "Neovim 플러그인의 본체 — 버퍼·윈도우·extmark 조작"
description : "scratch 버퍼 만들기, floating window 띄우기, extmark로 virtual text·하이라이트 붙이기. 거의 모든 플러그인이 화면에 뭔가 그릴 때 쓰는 API와 인덱스 함정을 한 장으로."
date        : 2026-06-19 19:00:00 +0900
categories  : [neovim, "플러그인·생태계"]
tags        : [lua, api, plugin]
pin         : false
hidden      : false
---

[vim 전역 API 지도](/posts/neovim/2026-06-19-neovim-vim-global-api-map/)에서 `vim.api`가 버퍼·윈도우·extmark 조작의 통로라고 짚었다. 이 글은 그 안쪽 — **플러그인이 실제로 화면에 뭔가를 그릴 때 쓰는 API**를 정리한다. 팝업 메뉴, 결과 패널, 인라인 힌트(virtual text), 하이라이트가 전부 이 세 가지 위에 올라간다.

## 결론 먼저

- 텍스트를 담는 그릇은 **버퍼**, 그걸 보여주는 창은 **윈도우**. 둘은 N:M이다.
- 임시 UI는 **scratch 버퍼**(`nvim_create_buf(false, true)`) + **floating window**(`nvim_open_win`) 조합이 표준.
- 본문을 건드리지 않고 텍스트에 정보를 덧입히는 건 **extmark**(virtual text·하이라이트·sign). 본문 라인이 아니라 별도 레이어다.
- **인덱스 베이스가 API마다 다르다** — 이게 최대 함정. 버퍼 라인 0-base·end-exclusive, 윈도우 커서 row 1-base·col 0-base, extmark 0-base.

## 버퍼 — 텍스트 그릇

### 만들기

```lua
-- listed=false (버퍼 목록에 안 뜸), scratch=true (nofile·noswap·bufhidden=hide)
local buf = vim.api.nvim_create_buf(false, true)
```

scratch 버퍼는 디스크에 매이지 않은 임시 버퍼다. 팝업·결과창처럼 "파일이 아닌 UI"는 거의 다 이걸 쓴다.

### 읽고 쓰기

```lua
-- 읽기: start=0, end=-1 → 전체. end는 exclusive
local lines = vim.api.nvim_buf_get_lines(buf, 0, -1, false)

-- 쓰기: 같은 인덱스 규칙. lines는 "\n" 없는 문자열 배열
vim.api.nvim_buf_set_lines(buf, 0, -1, false, { "첫 줄", "둘째 줄" })

-- 부분 교체 (row·col 단위)
vim.api.nvim_buf_set_text(buf, 0, 0, 0, 5, { "교체" })
```

핵심 규칙 두 개:
- **라인 인덱스는 0-base, 끝은 exclusive.** `(0, -1)`은 처음부터 끝까지. `(0, 1)`은 첫 줄 하나.
- 줄 문자열에 `\n`을 넣으면 에러. 줄 구분은 배열 원소로 한다.

### 버퍼 옵션

읽기 전용 결과창을 만들 때 자주 쓰는 조합:

```lua
vim.bo[buf].modifiable = false   -- 사용자 편집 차단
vim.bo[buf].buftype = "nofile"
vim.bo[buf].bufhidden = "wipe"   -- 창 닫히면 버퍼 폐기
vim.bo[buf].filetype = "myplugin"  -- 자체 syntax/ftplugin 걸기용
```

`set_lines`로 쓸 때는 `modifiable = true`여야 한다 — 채워 넣은 다음 `false`로 잠그는 순서.

## 윈도우 — 보여주는 창

### Floating window

```lua
local win = vim.api.nvim_open_win(buf, true, {  -- enter=true: 포커스 이동
  relative = "editor",   -- "editor" / "win" / "cursor"
  width = 60,
  height = 10,
  row = 5,
  col = 10,
  border = "rounded",    -- "none"/"single"/"double"/"rounded"/...
  title = " 결과 ",
  style = "minimal",     -- 줄번호·sign 등 군더더기 제거
})
```

`relative`이 좌표 기준이다 — `"cursor"`면 커서 옆에 툴팁처럼, `"editor"`면 화면 절대 좌표. 화면 중앙 정렬은 `width`/`height`로 `(columns - width)/2` 식으로 직접 계산한다.

### 커서·닫기 — 인덱스 함정

```lua
-- row는 1-base, col은 0-base (!!)
vim.api.nvim_win_set_cursor(win, { 1, 0 })

vim.api.nvim_win_close(win, true)  -- force=true
```

`nvim_win_set_cursor`의 row가 1-base인 건 버퍼 라인 API(0-base)와 어긋난다. 같은 줄을 가리키는데 한쪽은 `0`, 한쪽은 `1`이라 off-by-one이 여기서 제일 잘 난다.

### 닫힘 처리

팝업은 보통 포커스를 잃거나 `q`를 누르면 닫는다. 버퍼-로컬 키맵 + 오토커맨드로 건다:

```lua
vim.keymap.set("n", "q", function() vim.api.nvim_win_close(win, true) end, { buffer = buf })
```

(오토커맨드 쪽은 [autocommand 심화](/posts/neovim/2026-06-19-neovim-autocommand-events/)에서 다룬다.)

## extmark — 본문을 안 건드리는 덧입히기

여기가 진짜 핵심이다. 진단 밑줄, 인라인 에러 메시지, git blame 가상 텍스트, 인덴트 가이드 — 전부 **본문 텍스트가 아니라 extmark 레이어**다. 본문 라인 수를 바꾸지 않고, 텍스트가 편집돼도 위치를 따라 움직인다.

### namespace — 내 마크의 네임스페이스

```lua
local ns = vim.api.nvim_create_namespace("myplugin")
```

extmark는 항상 namespace에 묶인다. 내 플러그인 마크만 한 번에 지울 수 있게 하는 격벽이다.

### virtual text 달기

```lua
-- 0번 라인 끝에 회색 힌트 텍스트
vim.api.nvim_buf_set_extmark(buf, ns, 0, 0, {
  virt_text = { { "  ← 여기 주목", "Comment" } },  -- {텍스트, 하이라이트그룹}
  virt_text_pos = "eol",   -- "eol" / "overlay" / "right_align" / "inline"
})
```

`virt_text`는 `{문자열, 하이라이트}` 쌍의 배열이다. `virt_text_pos`로 줄 끝/겹쳐쓰기/우측정렬 위치를 고른다. row·col은 **0-base**.

### 범위 하이라이트

```lua
vim.api.nvim_buf_set_extmark(buf, ns, 0, 0, {
  end_row = 0,
  end_col = 5,
  hl_group = "Error",      -- 0번 줄 0~5칸을 Error 색으로
})
```

(예전엔 `nvim_buf_add_highlight`를 썼지만, 최근 Neovim은 extmark의 `hl_group`으로 통합하는 추세다.)

### 지우기

```lua
-- 이 namespace의 모든 extmark 제거 (라인 범위 0~-1 전체)
vim.api.nvim_buf_clear_namespace(buf, ns, 0, -1)
```

namespace 단위로 싹 지울 수 있는 게 extmark의 운영상 장점이다. 다시 그릴 때 "내 것만 지우고 새로 그린다"가 한 줄로 된다.

## 하이라이트 그룹 정의

extmark·virtual text에 쓸 색을 직접 정의하려면:

```lua
vim.api.nvim_set_hl(0, "MyPluginHint", { fg = "#888888", italic = true })
vim.api.nvim_set_hl(0, "MyPluginErr", { link = "DiagnosticError" })  -- 기존 그룹에 링크
```

기존 테마 그룹(`Comment`, `DiagnosticError` 등)에 `link`하는 게 관례다 — 사용자 컬러스킴을 따라가서 어느 테마에서도 자연스럽다.

## 함정 정리

1. **인덱스 베이스 3종**: 버퍼 라인 0-base·end-exclusive / 윈도우 커서 row 1-base·col 0-base / extmark 0-base. 가장 흔한 버그 원천.
2. `nvim_buf_set_lines`는 `modifiable = true`일 때만 된다. 읽기전용 창은 채운 뒤 잠가라.
3. 줄 문자열에 `\n` 넣으면 에러. 줄 구분은 배열 원소.
4. extmark는 namespace에 묶인다. namespace 없이 그리면 나중에 "내 것만" 못 지운다.
5. 색은 하드코딩보다 기존 그룹에 `link`. 테마 바뀌어도 따라간다.
6. floating window는 명시적으로 안 닫으면 남는다. `q` 키맵이나 오토커맨드로 닫힘 처리.

## 더 깊이

| 글 | 다루는 것 |
| --- | --- |
| [vim 전역 API 지도](/posts/neovim/2026-06-19-neovim-vim-global-api-map/) | 이 글이 파고든 `vim.api`가 전체 어디에 위치하는지 |
| [autocommand·이벤트 심화](/posts/neovim/2026-06-19-neovim-autocommand-events/) | 창 닫힘·커서 이동 등 이벤트에 반응해 다시 그리기 |
| [비동기 — vim.uv / vim.system](/posts/neovim/2026-06-19-neovim-async-vim-uv-system/) | 외부 결과를 받아 버퍼에 채울 때의 스케줄링 |
| [Neovim 플러그인 작성 규칙](/posts/neovim/2026-06-12-neovim-plugin-conventions/) | 이 코드를 `plugin/`·`lua/` 어디에 둘지 |

정식 레퍼런스는 `:h nvim_open_win`, `:h nvim_buf_set_extmark`, `:h api-extmark`.
