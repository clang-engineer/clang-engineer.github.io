---
title       : Windows에서 Dotfiles의 Neovim 설정을 Junction으로 연결하기
description : "Windows의 %LOCALAPPDATA%\\nvim과 dotfiles의 Neovim 설정 디렉터리를 Junction으로 연결하고 연결 여부와 제거 방법까지 확인한다."
date        : 2026-01-07 09:29:54 +0900
updated     : 2026-09-05 19:10:00 +0900
categories  : [neovim, "구조·설정"]
tags        : [windows, dotfiles, junction, how-to]
redirect_from:
  - /posts/lazyvim/2026-01-07-window-neovim/
pin         : false
hidden      : false
---

Windows에서도 dotfiles 저장소의 Neovim 설정을 `%LOCALAPPDATA%\nvim`에 복사하지 않고 그대로 사용할 수 있다. 이 글의 목표는 **dotfiles의 설정 디렉터리와 Windows Neovim 설정 경로를 Junction으로 연결하는 것**이다.

```text
Dotfiles
C:\Users\...\dotfiles\configs\nvim-lazy
              ↓ Junction
%LOCALAPPDATA%\nvim
              ↓
           Neovim
```

Junction을 사용하면 디렉터리의 실제 파일은 dotfiles에 두면서 Neovim에는 정상적인 Windows 설정 경로처럼 보이게 할 수 있다.

## 전제조건

예시는 다음 환경을 기준으로 한다.

```text
Windows 11
Neovim
PowerShell
```

Dotfiles의 설정 위치는 환경에 맞게 바꾼다.

```text
C:\Users\myuser\dotfiles\configs\nvim-lazy
```

Windows에서 Neovim의 기본 사용자 설정 경로는 일반적으로:

```text
%LOCALAPPDATA%\nvim
```

이다.

## 왜 Junction을 사용하나

Windows에서 디렉터리를 다른 위치에 연결할 때 Symbolic Link와 Junction을 사용할 수 있다.

| 방식 | 특징 |
|---|---|
| Symbolic Link | 파일·디렉터리를 가리킬 수 있지만 환경에 따라 개발자 모드나 권한 조건을 확인해야 함 |
| Junction | 디렉터리 연결에 적합하고 로컬 디렉터리 연결 용도로 간단하게 사용할 수 있음 |

여기서는 Neovim 설정 **디렉터리 하나를 로컬 dotfiles 디렉터리에 연결**하는 목적이므로 Junction을 사용한다.

## 1. 기존 Neovim 설정을 확인하고 백업한다

이미 `%LOCALAPPDATA%\nvim`이 일반 디렉터리로 존재한다면 먼저 백업한다.

```powershell
$NvimConfig = "$env:LOCALAPPDATA\nvim"

if (Test-Path $NvimConfig) {
    $BackupPath = "$NvimConfig.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Move-Item $NvimConfig $BackupPath
}
```

기존 설정이 필요 없다면 직접 제거할 수도 있지만, 설정 전환 작업에서는 백업 후 진행하는 편이 안전하다.

## 2. Junction을 만든다

Dotfiles의 실제 Neovim 설정과 Windows 설정 경로를 지정한다.

```powershell
$SourceConfig = "C:\Users\myuser\dotfiles\configs\nvim-lazy"
$NvimConfigPath = "$env:LOCALAPPDATA\nvim"

cmd /c mklink /J "$NvimConfigPath" "$SourceConfig"
```

관계는 다음과 같다.

```text
실제 파일
$SourceConfig
     ↑
 Junction
     ↓
$NvimConfigPath
     ↓
Neovim이 읽음
```

## 3. 연결을 확인한다

PowerShell에서 LinkType과 Target을 확인한다.

```powershell
Get-Item $env:LOCALAPPDATA\nvim |
    Select-Object FullName, LinkType, Target
```

`init.lua`가 정상적으로 보이는지도 확인할 수 있다.

```powershell
Test-Path $env:LOCALAPPDATA\nvim\init.lua
```

정상이라면 `LinkType`이 `Junction`으로 표시되고 Target이 dotfiles의 실제 설정 디렉터리를 가리킨다.

마지막으로 Neovim을 실행한다.

```powershell
nvim
```

설정과 플러그인이 정상적으로 로드되면 연결은 끝난다.

## 기존 링크가 있을 때 다시 연결하기

이미 Junction 또는 Symbolic Link가 있다면 실제 대상 디렉터리를 지우지 않고 링크만 제거한 뒤 다시 만들 수 있다.

```powershell
$NvimConfigPath = "$env:LOCALAPPDATA\nvim"
$Item = Get-Item $NvimConfigPath

if ($Item.LinkType -eq "Junction" -or $Item.LinkType -eq "SymbolicLink") {
    Remove-Item $NvimConfigPath -Force
}
```

그다음 `mklink /J`를 다시 실행한다.

## Symbolic Link를 사용하려면

Junction 대신 Symbolic Link를 선택할 수도 있다.

```powershell
New-Item \
  -ItemType SymbolicLink \
  -Path "$env:LOCALAPPDATA\nvim" \
  -Target "C:\Users\$env:USERNAME\dotfiles\configs\nvim-lazy"
```

사용 중인 Windows 설정에 따라 Symbolic Link 생성 권한 조건을 확인한다.

## Junction 제거

Junction 자체만 제거하려면:

```powershell
Remove-Item $env:LOCALAPPDATA\nvim
```

Junction의 대상인 dotfiles 디렉터리는 별도 위치에 있으므로, 제거 전에 `Get-Item`으로 현재 경로가 실제 일반 디렉터리가 아니라 링크인지 확인하는 습관이 안전하다.

## 정리

이 작업의 핵심은 설정 파일을 여러 곳에 복제하는 것이 아니다.

```text
하나의 실제 Neovim 설정
        ↓
      Dotfiles
        ↓
Windows에서는 Junction으로 노출
        ↓
%LOCALAPPDATA%\nvim
```

이렇게 두면 실제 설정의 원본은 dotfiles 한곳에 유지하면서 Windows가 기대하는 Neovim 설정 경로를 그대로 제공할 수 있다.
