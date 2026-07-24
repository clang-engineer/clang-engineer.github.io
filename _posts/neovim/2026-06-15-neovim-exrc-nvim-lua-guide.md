---
title       : "Neovim 프로젝트별 로컬 설정 가이드 — exrc · .nvim.lua · trust · dotfiles 모듈 재사용"
description : "Neovim 0.11/0.12의 exrc 검색 범위 차이, 공식 파일명(.nvim.lua/.nvimrc/.exrc), trust 시스템과 dotfiles Lua 모듈 재사용을 정리."
date        : 2026-06-15 18:00:00 +0900
updated     : 2026-07-24 12:00:00 +0900
categories  : [neovim, "구조·설정"]
tags        : [exrc, dotfiles, lua, jdtls]
redirect_from:
  - /posts/neovim/2026-05-07-nvim-exrc-require-dotfiles-module/
  - /posts/lazyvim/2026-05-07-nvim-exrc-require-dotfiles-module/
pin         : false
hidden      : false
---

프로젝트마다 다른 jdtls JDK 버전, DB 목록, 키맵을 쓰고 싶을 때 Neovim이 제공하는 표준 메커니즘이 **exrc**다. `vim.o.exrc = true`로 켜며, 문서를 안 보고 쓰면 `~/.exrc.lua`처럼 "이름은 비슷하지만 검색 대상이 아닌" 파일을 만들기 쉽다. 검색 범위가 바뀌는 Neovim 0.11과 0.12의 경계까지 구분한다.

## exrc 옵션이 하는 일

`vim.o.exrc = true`로 켜면 Neovim은 시작할 때 **current directory**(현재 작업 디렉터리)를 기준으로 로컬 설정을 찾는다. 편집 중인 파일의 디렉터리가 기준은 아니다. 검색 범위는 버전에 따라 다르다.

| 버전 | 검색 범위 |
|---|---|
| Neovim 0.11 | current directory만 검색 |
| Neovim 0.12+ | current directory에서 상위 디렉터리로 올라가며 검색 |

0.12+의 상향 검색은 프로젝트 하위 디렉터리에서 실행해도 상위 프로젝트 루트의 설정을 찾게 한다. 상위 검색을 멈추고 싶은 `.nvim.lua`에서는 `vim.o.exrc = false`로 이후 탐색을 중단할 수 있다.

```bash
cd ~/work/project-A
nvim           # → ~/work/project-A/.nvim.lua 로드 (있으면)

cd ~/work/project-B
nvim main.go   # → ~/work/project-B/.nvim.lua 로드 (project-A 건 무시)
```

따라서 같은 파일을 열더라도 Neovim을 어느 디렉터리에서 시작했는지에 따라 로컬 설정이 달라질 수 있다.

## 공식 검색 파일명 (Neovim 0.9+)

공식 검색 파일명은 다음 세 가지다:

| 우선순위 | 파일명 | 형식 |
|---|---|---|
| 1 | `.nvim.lua` | Lua (권장) |
| 2 | `.nvimrc` | Vimscript |
| 3 | `.exrc` | Vimscript (옛 Vi 시절부터의 호환) |

> **흔한 오해 1**: `.exrc.lua`는 공식 검색 대상이 **아니다**. Vim 시절 흔적으로 만든 `~/.exrc.lua` 같은 파일은 그대로 두면 dead file이 된다.

> **흔한 오해 2**: `~/.exrc.lua`는 current directory가 `$HOME`이어도 로드되지 않는다. 파일 위치 문제가 아니라 이름 자체가 공식 검색 대상이 아니다.

새로 쓰는 거면 `.nvim.lua`로 통일하는 게 좋다. Lua를 쓸 수 있고, 트리·디버깅 도구도 다 Lua 쪽이 잘 받쳐준다.

## trust 시스템 — 0.9에서 추가된 안전장치

낯선 디렉토리에서 `nvim`을 띄웠는데 그 디렉토리의 `.nvim.lua`가 시스템 명령을 실행하면 보안 사고가 된다. Neovim 0.9+는 이를 막기 위해 **trust 시스템**을 도입했다.

- 처음 보는 `.nvim.lua`는 그냥 로드되지 않는다 — 경고만 뜬다.
- 사용자가 명시적으로 신뢰해야 로드된다:

```vim
:trust    " 현재 파일을 신뢰 등록
```

- 신뢰 정보는 `vim.fn.stdpath("state") .. "/trust"`에 저장된다. 기본 Unix 경로는 `$XDG_STATE_HOME/nvim/trust`이며, 흔히 `~/.local/state/nvim/trust`다.
- 파일 내용이 바뀌면 해시가 달라져 자동으로 신뢰가 풀린다 → 변경된 내용을 다시 검토 후 `:trust`.

이 덕분에 남의 레포를 clone하고 무심코 `nvim` 띄워도 안전하다.

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
-- 이 프로젝트에선 project-a + project-b만 보임
vim.g.dbs = require("config.options.dbs").pick("project-a", "project-b")
```

## dotfiles의 lua 모듈을 `.nvim.lua`에서 재사용하는 메커니즘

위 오버라이드 패턴이 동작하는 핵심은 `.nvim.lua`가 글로벌 nvim config(dotfiles)의 lua 모듈을 그대로 `require`할 수 있다는 점이다. 같은 `package.path`를 공유하기 때문이다.

1. nvim 시작 시 config root(`~/AppData/Local/nvim`, 또는 XDG_CONFIG_HOME)의 `lua/` 폴더가 자동으로 lua의 `package.path`에 등록됨
2. config root가 dotfiles로 심볼릭 링크돼 있으면 dotfiles의 `lua/` 안 모든 모듈을 어디서든 require 가능
3. `.nvim.lua`는 nvim 부팅 후(=runtimepath 설정 완료 후) 로드되므로 같은 경로를 공유

```text
~/AppData/Local/nvim → ~/dotfiles/nvim/lazy/   (symlink)
                       └─ lua/config/java-env.lua

require("config.java-env")  -- ✅ init.lua, .nvim.lua 어디서든 동작
```

그래서 dotfiles의 `init.lua`에서 기본값으로 한 번 호출하고, 프로젝트 `.nvim.lua`에서 같은 모듈을 다시 require해서 인자만 다르게 호출하면 환경변수가 덮어써진다. 모듈은 `package.loaded`에 캐시되므로 파일은 한 번만 읽힌다.

```lua
-- ~/dotfiles/nvim/lazy/init.lua
require("config.java-env").setup()  -- 기본: jdtls=21, gradle=11

-- <project>/.nvim.lua
require("config.java-env").setup({ jdtls = "21", gradle = "17" })  -- gradle만 덮어씀
```

### 응용: jdtls Java 경로 cross-platform 처리

jdtls는 `JDTLS_JAVA_HOME` 환경변수로 자기를 실행할 Java를 찾는다 (`mason/packages/jdtls/bin/jdtls.py`의 `get_java_executable`). 이 변수가 비어 있으면 `FileNotFoundError [WinError 2]`로 즉시 죽는다.

`.nvim.lua`에 macOS 전용 `/usr/libexec/java_home` 같은 명령을 직접 박지 말고, dotfiles의 OS-aware 헬퍼를 호출하는 게 정답이다.

```lua
-- ❌ macOS에서만 동작
vim.env.JDTLS_JAVA_HOME = vim.fn.trim(vim.fn.system("/usr/libexec/java_home -v 21"))

-- ✅ Windows/macOS/Linux 모두 동작 (dotfiles에 OS 분기 로직)
require("config.java-env").setup({ jdtls = "21", gradle = "17" })
```

### 주의

- 이 방식은 dotfiles 의존이므로 다른 nvim 환경 쓰는 동료에겐 `module not found`가 난다 — 그 사람들은 그냥 trust 안 하면 된다 (exrc는 opt-in).

## 빠지기 쉬운 함정 4가지

### 1. current directory가 아닌 파일 위치 기준이라 착각

`nvim ~/work/project-A/main.go`를 다른 디렉터리에서 띄워도 검색 기준은 그 파일 위치가 아니라 current directory다. 0.11은 그 디렉터리만, 0.12+는 그 디렉터리와 부모를 검색한다.

### 2. trust 안 해서 "내 설정이 안 먹어요"

`.nvim.lua` 만든 직후엔 nvim이 prompt를 띄우거나 경고만 표시한다. `:trust` 한 번 안 치고 "왜 안 되지" 헤매는 경우가 많다. `:messages`로 경고 확인하는 습관.

### 3. `.exrc.lua` / `~/.exrc.lua` 같은 dead file

위에서 설명한 대로 `.exrc.lua`는 공식 검색 대상이 아니다. 옛 dotfiles에서 이런 파일을 `~/`에 자동 링크하는 부트스트랩 스크립트가 있다면 정리 후보다.

### 4. 로컬 설정을 여러 이름으로 쪼갬

`.nvim.lua`, `.nvimrc`, `.exrc`는 로컬 설정의 대체 이름이다. 여러 형식에 설정을 나눠 기대하기보다 새 설정은 `.nvim.lua` 하나로 통일한다. 0.12+에서 여러 부모 디렉터리의 설정을 읽는 동작과, 한 디렉터리 안에서 파일명을 여러 개 쓰는 것은 별개다.

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

- `vim.opt.exrc = true`로 켠다. 신뢰 관리는 `:trust`와 `vim.secure`가 담당한다.
- 공식 검색 파일은 **`.nvim.lua` / `.nvimrc` / `.exrc`** 세 개. `.exrc.lua`는 함정.
- **current directory 기반**이며, 0.11은 해당 디렉터리만, 0.12+는 부모 디렉터리까지 올라간다.
- 0.9+는 **trust 시스템**을 쓰며 데이터베이스는 `vim.fn.stdpath("state") .. "/trust"`에 있다.
- 활용은 "글로벌 기본 + 프로젝트별 오버라이드" 패턴이 깔끔하다.

`:h 'exrc'`, `:h vim.secure`, `:h :trust`로 공식 문서를 함께 확인한다.
