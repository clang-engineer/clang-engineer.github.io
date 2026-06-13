---
title       : "Vim 기본 자동완성과 Abbreviate"
description : "플러그인 없이 쓰는 Ctrl-X 자동완성과 iabbr 동적 축약어"
date        : 2026-06-13 10:00:00 +0900
updated     : 2026-06-13 10:00:00 +0900
categories  : [vim, "사용·키맵"]
tags        : [vim, completion, abbreviate]
pin         : false
hidden      : false
---

Vim은 플러그인 없이도 쓸 만한 자동완성을 갖고 있다. insert 모드에서 `<C-x>` 시리즈로 호출한다.

## Ctrl-X 자동완성

| 키 | 대상 |
|---|---|
| `<C-n>` / `<C-p>` | 현재 버퍼/포함 파일 단어 |
| `<C-x><C-l>` | 라인 단위 |
| `<C-x><C-f>` | 파일명·경로 |
| `<C-x><C-o>` | omnifunc (filetype별) |
| `<C-x><C-k>` | 사전(`dictionary` 옵션) |

`<C-x><C-f>`는 현재 디렉토리 기준이라 import 경로를 입력할 때 편하다.

## Abbreviate — 타이핑 시 자동 치환

```vim
abbr  consolee console     " insert+command 모두
iabbr coment   comment     " insert 전용
cabbr Q        q           " command 전용
```

스페이스/Enter 직후 치환된다.

## 동적 abbreviate (`<expr>`)

치환값을 함수로 계산한다.

```vim
iabbr <expr> __time   strftime("%Y-%m-%d %H:%M:%S")
iabbr <expr> __file   expand('%:p')
iabbr <expr> __branch trim(system("git rev-parse --abbrev-ref HEAD"))
```

타임스탬프·현재 파일명을 자주 넣는다면 abbreviate 한 줄이 스니펫 플러그인을 대체한다.
