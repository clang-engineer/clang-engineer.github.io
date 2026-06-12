---
title       : "프로젝트 .nvim.lua(exrc)에서 dotfiles의 lua 모듈 재사용하기"
description : 글로벌 nvim config(dotfiles)의 lua 모듈을 프로젝트별 .nvim.lua에서 require하는 메커니즘과 활용 패턴
date        : 2026-05-07 10:00:00 +0900
categories  : [lazyvim, "구조·설정"]
tags        : [neovim, exrc, lua, dotfiles, jdtls]
pin         : false
hidden      : false
---

## 개요

`exrc=true`로 활성화한 프로젝트별 `.nvim.lua`에서도 글로벌 nvim config(dotfiles)에 정의된 lua 모듈을 그대로 `require`할 수 있다. 같은 `package.path`를 공유하기 때문이다.

## 메커니즘

1. nvim 시작 시 config root(`~/AppData/Local/nvim`, 또는 XDG_CONFIG_HOME)의 `lua/` 폴더가 자동으로 lua의 `package.path`에 등록됨
2. config root가 dotfiles로 심볼릭 링크돼 있으면 dotfiles의 `lua/` 안 모든 모듈을 어디서든 require 가능
3. `.nvim.lua`는 nvim 부팅 후(=runtimepath 설정 완료 후) 로드되므로 같은 경로를 공유

```text
~/AppData/Local/nvim → ~/dotfiles/nvim/lazy/   (symlink)
                       └─ lua/config/java-env.lua

require("config.java-env")  -- ✅ init.lua, .nvim.lua 어디서든 동작
```

## 활용 패턴: 프로젝트별 정책 오버라이드

dotfiles의 `init.lua`에서 기본값으로 한 번 호출하고, 프로젝트 `.nvim.lua`에서 같은 모듈을 다시 require해서 인자만 다르게 호출하면 환경변수가 덮어써진다. 모듈은 `package.loaded`에 캐시되므로 파일은 한 번만 읽힌다.

```lua
-- ~/dotfiles/nvim/lazy/init.lua
require("config.java-env").setup()  -- 기본: jdtls=21, gradle=11

-- <project>/.nvim.lua
require("config.java-env").setup({ jdtls = "21", gradle = "17" })  -- gradle만 덮어씀
```

## 응용: jdtls Java 경로 cross-platform 처리

jdtls는 `JDTLS_JAVA_HOME` 환경변수로 자기를 실행할 Java를 찾는다 (`mason/packages/jdtls/bin/jdtls.py`의 `get_java_executable`). 이 변수가 비어 있으면 `FileNotFoundError [WinError 2]`로 즉시 죽는다.

`.nvim.lua`에 macOS 전용 `/usr/libexec/java_home` 같은 명령을 직접 박지 말고, dotfiles의 OS-aware 헬퍼를 호출하는 게 정답이다.

```lua
-- ❌ macOS에서만 동작
vim.env.JDTLS_JAVA_HOME = vim.fn.trim(vim.fn.system("/usr/libexec/java_home -v 21"))

-- ✅ Windows/macOS/Linux 모두 동작 (dotfiles에 OS 분기 로직)
require("config.java-env").setup({ jdtls = "21", gradle = "17" })
```

## 주의

- `.nvim.lua`는 trust 필요 (`:trust` 또는 첫 실행 시 prompt에 `y`)
- dotfiles 의존이므로 다른 nvim 환경 쓰는 동료에겐 `module not found` — 그 사람들은 그냥 trust 안 하면 됨 (exrc는 opt-in)
