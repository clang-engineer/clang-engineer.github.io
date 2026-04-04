---
title       : Windows Neovim에서 Lazygit 한글 깨짐 해결
description :
date        : 2026-03-13 09:00:00 +0900
updated     : 2026-03-13 09:00:00 +0900
categories  : [dev, windows]
tags        : [neovim, lazygit, utf-8, encoding]
pin         : false
hidden      : false
---

## 문제 상황

Windows Terminal에서 Neovim 내부의 Lazygit을 실행하면 **한글이 깨지고 에러가 발생**한다.
Lazygit을 단독으로 실행하면 정상적으로 동작한다.

macOS에서는 동일한 설정으로 문제가 없었기 때문에 Windows 특유의 인코딩 이슈로 판단했다.

## 원인

Windows의 **기본 시스템 코드페이지가 CP949(EUC-KR)**이기 때문이다.

- Windows Terminal 자체는 UTF-8을 지원하지만, Neovim이 내부적으로 subprocess(lazygit)를 실행할 때 **시스템 기본 코드페이지(CP949)**를 사용한다.
- macOS는 기본 locale이 UTF-8이므로 같은 문제가 발생하지 않는다.

## 해결 방법

### Windows 시스템 로캘을 UTF-8로 변경 (권장)

시스템 전역의 코드페이지를 UTF-8(65001)로 변경하는 방법이다.

1. `Win + R` → `intl.cpl` 입력 → Enter
2. **"관리자 옵션"** 탭 클릭
3. **"시스템 로캘 변경"** 버튼 클릭
4. **"Beta: 세계 언어 지원을 위해 Unicode UTF-8 사용"** 체크
5. 확인 → **재부팅**

이 설정은 Windows 전체 코드페이지를 65001(UTF-8)로 변경하므로, lazygit 외에도 다른 한글 깨짐 이슈가 함께 해결된다.

### 대안: shell profile에서 설정

시스템 로캘 변경이 부담스러운 경우, `~/.bashrc` 또는 `~/.bash_profile`에 추가한다.

```bash
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
chcp.com 65001 > /dev/null 2>&1
```

### 보험: Neovim config에 추가

```lua
-- init.lua
vim.env.LANG = "en_US.UTF-8"
vim.env.LC_ALL = "en_US.UTF-8"
```

## 참고

- Windows Terminal의 UTF-8 지원과 시스템 코드페이지는 별개의 설정이다.
- `intl.cpl`은 "국가 또는 지역" 설정 창을 직접 여는 명령어이다.
