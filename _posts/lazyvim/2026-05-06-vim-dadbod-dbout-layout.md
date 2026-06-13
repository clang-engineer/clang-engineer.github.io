---
title       : "vim-dadbod-ui dbout 결과창 레이아웃 커스터마이징"
description : "dbout 결과창의 크기/방향을 바꾸는 공식 방법은 FileType autocmd뿐 — wincmd L 트릭과 fold 비활성화"
date        : 2026-05-06 11:00:00 +0900
updated     : 2026-05-06 11:00:00 +0900
categories  : [lazyvim, "Dadbod"]
tags        : [vim-dadbod-ui, neovim]
pin         : false
hidden      : false
---

vim-dadbod-ui의 결과창(`dbout`) 크기/방향을 바꾸는 **공식적인 방법은 FileType autocmd 뿐이다.** 내장 옵션은 없다.

## 핵심 사실

- **`g:db_ui_winwidth`는 좌측 drawer 폭이지 결과창과 무관하다.** (default 40)
- 결과창 자동 확장 옵션(`g:db_ui_expand_query_results`)을 추가하자는 PR #203은 **2024-06-24 머지 거부**됐고, 메인테이너가 직접 "FileType autocmd 써라"고 답했다.
- 따라서 dbout 커스터마이징의 표준 진입점은 FileType autocmd. LazyVim도 같은 방식으로 `q` 닫기를 붙인다.

## SQL 결과는 가로 폭 > 세로 높이

`:split`로 열리는 dbout 기본 레이아웃은 좁은 가로 분할이라 컬럼이 잘린다. timestamp/JSON/긴 ID가 들어가면 더 심각. **세로 분할(vsplit)이 행 다수 + 긴 컬럼 형태에 더 잘 맞는다.**

## `wincmd L` 트릭

이미 가로로 열린 split을 **우측 세로 split으로 강제 이동**시키는 한 줄. dadbod-ui가 어떤 방향으로 열든 일관된 레이아웃 보장.

```lua
vim.api.nvim_create_autocmd("FileType", {
  pattern = "dbout",
  callback = function()
    vim.opt_local.foldenable = false                         -- 메인테이너 공식 권장
    vim.cmd("wincmd L")                                       -- 우측 세로 split으로 이동
    vim.cmd("vertical resize " .. math.floor(vim.o.columns / 2))
  end,
})
```

`wincmd` 방향 키는 모두 splits 재배치 용도:

| 명령 | 효과 |
|------|------|
| `wincmd L` | 현재 창을 화면 **우측 끝 세로 split**으로 이동 |
| `wincmd H` | 좌측 끝 세로 split |
| `wincmd K` | 상단 가로 split |
| `wincmd J` | 하단 가로 split |

## fold 비활성화는 무료 개선

dbout의 자동 fold가 결과 가독성을 자주 해친다. 메인테이너가 PR #203 댓글에서 직접 권장한 워크어라운드:

```lua
vim.opt_local.foldenable = false
-- 또는 vimscript: setlocal nofoldenable
```

## 참고

- vim-dadbod-ui PR #203 (closed): <https://github.com/kristijanhusak/vim-dadbod-ui/pull/203>
- vim-dadbod-ui doc: <https://github.com/kristijanhusak/vim-dadbod-ui/blob/master/doc/dadbod-ui.txt>
- `:help wincmd`
