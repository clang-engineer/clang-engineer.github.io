---
title       : "Neovim 프로젝트별 로컬 설정 가이드 — exrc · .nvim.lua · trust"
description : "Neovim 0.9+ 기준 exrc 옵션 동작, 공식 검색 파일명(.nvim.lua/.nvimrc/.exrc), secure·trust 시스템, 흔히 빠지는 함정까지 한 번에 정리."
date        : 2026-06-15 18:00:00 +0900
updated     : 2026-06-15 18:00:00 +0900
categories  : [neovim, "구조·설정"]
tags        : [exrc, dotfiles]
pin         : false
hidden      : false
---

프로젝트마다 다른 jdtls JDK 버전, 다른 DB 목록, 다른 키맵을 쓰고 싶을 때 Neovim이 제공하는 표준 메커니즘이 **exrc**다. `vim.o.exrc = true` 한 줄로 켜는 기능인데, 문서를 안 보고 쓰면 `~/.exrc.lua`처럼 "이름은 맞는데 안 불리는" 함정에 잘 빠진다. Neovim 0.9+ 기준으로 정확한 동작과 흔한 오해를 정리한다.

## exrc 옵션이 하는 일

`vim.o.exrc = true`로 켜면 Neovim은 **시작 시점의 cwd**(current working directory)에서 로컬 설정 파일을 찾아 자동 실행한다. 핵심은 **cwd 기반**이라는 것 — `nvim`을 어디서 띄웠는지가 기준이지 편집 중인 파일 위치가 아니다.

```bash
cd ~/work/project-A
nvim           # → ~/work/project-A/.nvim.lua 로드 (있으면)

cd ~/work/project-B
nvim main.go   # → ~/work/project-B/.nvim.lua 로드 (project-A 건 무시)
```

cwd가 바뀌면 다른 설정이 자동으로 따라온다는 게 매력이다.

## 공식 검색 파일명 (Neovim 0.9+)

검색 순서는 다음과 같고, **첫 번째 매치 하나만 로드**된다:

| 우선순위 | 파일명 | 형식 |
|---|---|---|
| 1 | `.nvim.lua` | Lua (권장) |
| 2 | `.nvimrc` | Vimscript |
| 3 | `.exrc` | Vimscript (옛 Vi 시절부터의 호환) |

> **흔한 오해 1**: `.exrc.lua`는 공식 검색 대상이 **아니다**. Vim 시절 흔적으로 만든 `~/.exrc.lua` 같은 파일은 그대로 두면 dead file이 된다.

> **흔한 오해 2**: `~/.exrc.lua`를 만들면 항상 로드될 것 같지만, cwd가 정확히 `$HOME`일 때만 로드된다. 보통 프로젝트 디렉토리에서 `nvim`을 띄우니까 실질적으로 안 불린다.

새로 쓰는 거면 `.nvim.lua`로 통일하는 게 좋다. Lua를 쓸 수 있고, 트리·디버깅 도구도 다 Lua 쪽이 잘 받쳐준다.

## trust 시스템 — 0.9에서 추가된 안전장치

낯선 디렉토리에서 `nvim`을 띄웠는데 그 디렉토리의 `.nvim.lua`가 시스템 명령을 실행하면 보안 사고가 된다. Neovim 0.9+는 이를 막기 위해 **trust 시스템**을 도입했다.

- 처음 보는 `.nvim.lua`는 그냥 로드되지 않는다 — 경고만 뜬다.
- 사용자가 명시적으로 신뢰해야 로드된다:

```vim
:trust    " 현재 파일을 신뢰 등록
```

- 신뢰 정보는 `~/.local/share/nvim/trust`에 SHA256 해시 + 경로 형태로 저장된다.
- 파일 내용이 바뀌면 해시가 달라져 자동으로 신뢰가 풀린다 → 변경된 내용을 다시 검토 후 `:trust`.

이 덕분에 남의 레포를 clone하고 무심코 `nvim` 띄워도 안전하다.

## `secure` 옵션 — Vim 시절 보호 장치

`vim.o.secure = true`는 trust보다 오래된 보호 장치다. 로컬 설정 파일 안에서 위험한 명령(쉘 실행, `:autocmd` 등)을 막는다. 0.9 이후엔 trust가 메인 방어선이지만, 두 옵션 모두 켜두면 다중 방어가 된다.

```lua
-- 보통 이렇게 같이 켠다
vim.opt.exrc = true
vim.opt.secure = true
```

## 활용 패턴 — 프로젝트별 정책 오버라이드

대표적인 패턴은 dotfiles에 글로벌 기본을 두고, 프로젝트 `.nvim.lua`에서 인자만 바꿔 같은 모듈을 다시 호출하는 것이다.

```lua
-- ~/dotfiles/nvim/init.lua (글로벌)
require("config.java-env").setup()  -- 기본 jdtls=21, gradle=11

-- ~/work/legacy-project/.nvim.lua (프로젝트 오버라이드)
require("config.java-env").setup({ jdtls = "17", gradle = "11" })
```

DB 연결 목록도 마찬가지로 좁힐 수 있다:

```lua
-- 이 프로젝트에선 SNUH + SHINE만 보임
vim.g.dbs = require("config.options.dbs").pick("snuh", "shine")
```

> 글로벌 lua 모듈을 `.nvim.lua`에서 `require`할 수 있는 이유와 더 깊은 활용은 [프로젝트 .nvim.lua(exrc)에서 dotfiles의 lua 모듈 재사용하기](/posts/neovim/2026-05-07-nvim-exrc-require-dotfiles-module/) 참고.

## 빠지기 쉬운 함정 4가지

### 1. cwd가 아닌 파일 위치 기준이라 착각

`nvim ~/work/project-A/main.go`를 다른 디렉토리에서 띄우면, project-A의 `.nvim.lua`는 로드되지 않는다. cwd 기반이라는 점만 확실히 기억하면 된다.

### 2. trust 안 해서 "내 설정이 안 먹어요"

`.nvim.lua` 만든 직후엔 nvim이 prompt를 띄우거나 경고만 표시한다. `:trust` 한 번 안 치고 "왜 안 되지" 헤매는 경우가 많다. `:messages`로 경고 확인하는 습관.

### 3. `.exrc.lua` / `~/.exrc.lua` 같은 dead file

위에서 설명한 대로 `.exrc.lua`는 공식 검색 대상이 아니다. 옛 dotfiles에서 이런 파일을 `~/`에 자동 링크하는 부트스트랩 스크립트가 있다면 정리 후보다.

### 4. 여러 파일을 동시에 둘 수 있다고 착각

`.nvim.lua`와 `.exrc`가 같이 있으면 `.nvim.lua` 하나만 로드된다. "둘 다 적용되겠지"가 아니라 "우선순위 하나"라는 점.

## 디버깅 팁

```vim
:set exrc?            " exrc 켜져있나
:lua print(vim.o.exrc)
:trust                " 현재 파일 신뢰 등록
:messages             " 로드 시 경고 확인
:lua print(vim.fn.getcwd())  " 지금 cwd가 어디?
```

`.nvim.lua` 안에 `vim.notify("loaded!")` 한 줄 박아두면 실제 로드 여부를 즉시 확인할 수 있다.

## 정리

- `vim.opt.exrc = true` + `vim.opt.secure = true` 두 줄로 켠다.
- 공식 검색 파일은 **`.nvim.lua` / `.nvimrc` / `.exrc`** 세 개. `.exrc.lua`는 함정.
- **cwd 기반**으로 첫 매치 하나만 로드.
- 0.9+는 **trust 시스템**(`:trust`, `~/.local/share/nvim/trust`)으로 안전장치.
- 활용은 "글로벌 기본 + 프로젝트별 오버라이드" 패턴이 깔끔하다.

`:h 'exrc'`, `:h vim.secure`로 공식 문서도 함께 보면 좋다.
