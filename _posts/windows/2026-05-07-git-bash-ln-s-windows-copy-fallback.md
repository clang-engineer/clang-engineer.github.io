---
title       : "Windows Git Bash의 ln -s는 native symlink가 아니라 복사로 fallback된다"
description : "Git Bash가 권한 없을 때 ln -s를 조용히 파일 복사로 fallback하는 함정과 mklink /H 하드링크 대안"
date        : 2026-05-07 10:00:00 +0900
updated     : 2026-05-07 10:00:00 +0900
categories  : [windows]
tags        : [git-bash, msys, symlink, mklink, dotfiles, powershell, windows]
pin         : false
hidden      : false
---

dotfiles에서 `ln -s` 로 링크가 잘 만들어진 듯 보였는데, 알고 보니 **실제 파일 복사**였다. 원본 편집이 링크 대상에 반영되지 않아서 발견.

## 검증

```bash
$ ln -s ~/dotfiles/home/Microsoft.PowerShell_profile.ps1 \
        ~/Documents/WindowsPowerShell/Microsoft.PowerShell_profile.ps1
# (성공한 듯 출력)

$ file ~/Documents/WindowsPowerShell/Microsoft.PowerShell_profile.ps1
# Unicode text, UTF-8 text   ← symlink가 아닌 일반 파일

$ readlink ~/Documents/WindowsPowerShell/Microsoft.PowerShell_profile.ps1
# (출력 없음 — symlink 아님)

$ ls -la ...
-rw-r--r-- 1 myuser ... 5602 5월  7 09:04   ← `l` 권한 비트 없음
```

PowerShell 쪽:

```powershell
PS> Get-Item $PROFILE | Select LinkType, Target
LinkType : (빈값)
Target   : (빈값)
```

## 원인

Windows에서 native symlink를 만들려면 **관리자 권한** 또는 **개발자 모드(Developer Mode)** 가 필요하다. Git Bash(MSYS)는 그게 없으면 기본적으로 **silent fallback** 으로 파일을 복사한다.

| `MSYS` 환경변수 값 | 동작 |
|--------------------|------|
| (미설정, 기본) | 복사 (또는 .lnk 단축파일) |
| `winsymlinks:lnk` | Windows .lnk 단축 |
| `winsymlinks:native` | native symlink, 권한 없으면 복사 |
| `winsymlinks:nativestrict` | native symlink, 권한 없으면 **에러** |

`MSYS=`가 빈값으로 나오면 디폴트 동작 → 조용히 복사.

## 해결: PowerShell의 `mklink /H` (하드링크)

하드링크는 **관리자 권한이 필요 없다**. 같은 inode를 공유해서 한쪽 편집이 양쪽에 반영됨.

```powershell
cmd /c mklink /H "$Dest" "$Source"

Get-Item $Dest | Select LinkType, Target
# LinkType : HardLink
# Target   : C:\path\to\source
```

dotfiles 편집 → `$PROFILE` 즉시 반영. setup 재실행 불필요.

## 정리

- **Mac/Linux**: `ln -s` (Bash)
- **Windows**: `mklink /H` (PowerShell, 파일) / `mklink /J` (junction, 디렉터리)
- dotfiles 레포는 두 트랙(`setup.sh` + `setup.ps1`)을 분리해서 운영하는 게 합리적
- 주의: 하드링크는 같은 볼륨에서만 동작. 디렉터리는 안 됨 (junction 사용)
- 주의: 일부 에디터가 "save = delete + create" 로 동작하면 하드링크가 끊어질 수 있음 (대부분 모던 에디터는 in-place 저장)

## 참고

- Git Bash MSYS env: https://github.com/git-for-windows/git/wiki/Symbolic-Links
- mklink: `cmd /c mklink /?`
