---
title       : Windows에서 Dotfiles의 Neovim 설정 연결하기
description : 
date        : 2026-01-07 09:29:54 +0900
updated     : 2026-01-07 09:30:51 +0900
categories  : []
tags        : []
pin         : false
hidden      : false
---


## 문제 상황

Windows 환경에서 Scoop을 이용해 Neovim을 설치했고, 기존 dotfiles 저장소에 있는 Neovim 설정(nvim-lazy)을 PowerShell과 Neovim에서 동일하게 사용하고 싶었습니다.

## 환경

- OS: Windows 11
- Neovim 설치: Scoop으로 설치
- Dotfiles 구조:
  ```
  C:\Users\planit\dotfiles\
  ├── configs\
  │   ├── nvim-lazy\      # LazyVim 기반 설정
  │   └── nvim-classic\   # 클래식 Vim 설정
  └── scripts\
  ```

## Windows Neovim 설정 경로

Windows에서 Neovim은 다음 경로에서 설정을 찾습니다:
- `%LOCALAPPDATA%\nvim` (일반적으로 `C:\Users\{사용자명}\AppData\Local\nvim`)

Linux/macOS의 `~/.config/nvim`과는 다른 경로를 사용합니다.

## 해결 방법

Dotfiles의 Neovim 설정을 Windows 설정 경로로 연결하여 하나의 설정을 공유합니다.

### Junction vs Symbolic Link

Windows에서는 두 가지 방법으로 디렉토리를 연결할 수 있습니다:

1. **Symbolic Link**: Unix 스타일의 심볼릭 링크
   - 장점: Linux/macOS와 동일한 방식
   - 단점: 관리자 권한 또는 개발자 모드 활성화 필요

2. **Junction**: Windows의 디렉토리 연결 포인트
   - 장점: 관리자 권한 불필요
   - 단점: 디렉토리에만 사용 가능 (파일 불가)

이 가이드에서는 **Junction**을 사용합니다.

## 설정 단계

### 1. 기존 설정 백업 (있는 경우)

```powershell
# 기존 nvim 설정이 있다면 백업
$NvimConfig = "$env:LOCALAPPDATA\nvim"
if (Test-Path $NvimConfig) {
    $BackupPath = "$NvimConfig.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Move-Item $NvimConfig $BackupPath
    Write-Host "기존 설정을 $BackupPath 로 백업했습니다"
}
```

### 2. Junction 생성

```powershell
# Dotfiles 경로 설정
$SourceConfig = "C:\Users\planit\dotfiles\configs\nvim-lazy"
$NvimConfigPath = "$env:LOCALAPPDATA\nvim"

# Junction 생성
cmd /c mklink /J "$NvimConfigPath" "$SourceConfig"
```

### 3. 연결 확인

```powershell
# Junction 확인
Get-Item $env:LOCALAPPDATA\nvim | Select-Object FullName, LinkType, Target

# init.lua 파일 접근 가능 여부 확인
Test-Path $env:LOCALAPPDATA\nvim\init.lua
```

예상 출력:
```
FullName                           LinkType Target
--------                           -------- ------
C:\Users\planit\AppData\Local\nvim Junction {C:\Users\planit\dotfiles\configs\nvim-lazy}

True
```

## 전체 스크립트

한 번에 실행할 수 있는 PowerShell 스크립트:

```powershell
# Windows Neovim 설정 연결 스크립트
# Usage: 이 스크립트를 PowerShell에서 실행

$SourceConfig = "C:\Users\$env:USERNAME\dotfiles\configs\nvim-lazy"
$NvimConfigPath = Join-Path $env:LOCALAPPDATA "nvim"

Write-Host "Source: $SourceConfig" -ForegroundColor Cyan
Write-Host "Target: $NvimConfigPath" -ForegroundColor Cyan
Write-Host ""

# 소스 설정 존재 확인
if (-not (Test-Path $SourceConfig)) {
    Write-Error "Neovim 설정을 찾을 수 없습니다: $SourceConfig"
    exit 1
}

# 기존 설정 처리
if (Test-Path $NvimConfigPath) {
    $Item = Get-Item $NvimConfigPath

    # 이미 Junction이나 Symlink인 경우
    if ($Item.LinkType -eq "Junction" -or $Item.LinkType -eq "SymbolicLink") {
        Write-Host "기존 링크를 제거합니다..." -ForegroundColor Yellow
        Remove-Item $NvimConfigPath -Force
    }
    # 일반 디렉토리인 경우 백업
    else {
        $BackupPath = "$NvimConfigPath.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        Write-Host "기존 설정을 백업합니다: $BackupPath" -ForegroundColor Yellow
        Move-Item $NvimConfigPath $BackupPath -Force
    }
}

# Junction 생성
Write-Host "Junction을 생성합니다..." -ForegroundColor Green
$result = cmd /c mklink /J "$NvimConfigPath" "$SourceConfig" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "성공적으로 Neovim 설정을 연결했습니다!" -ForegroundColor Green
    Write-Host ""

    # 연결 확인
    Get-Item $NvimConfigPath | Select-Object FullName, LinkType, Target
} else {
    Write-Error "Junction 생성 실패: $result"
    exit 1
}
```

## 사용 방법

1. 스크립트를 `setup-nvim-windows.ps1` 파일로 저장
2. PowerShell에서 실행:
   ```powershell
   .\setup-nvim-windows.ps1
   ```

3. Neovim 실행:
   ```powershell
   nvim
   ```

처음 실행 시 Lazy.nvim이 자동으로 플러그인을 설치합니다.

## 주의사항

1. **경로 수정**: 스크립트의 `$SourceConfig` 경로를 본인의 dotfiles 경로에 맞게 수정하세요.

2. **설정 변경**: 향후 Neovim 설정을 변경할 때는 `C:\Users\{사용자명}\dotfiles\configs\nvim-lazy\` 디렉토리의 파일을 수정하면 됩니다.

3. **Git 관리**: Dotfiles를 Git으로 관리하면 Windows와 Linux/macOS 간 설정을 쉽게 동기화할 수 있습니다.

## 장점

- 하나의 Neovim 설정을 Windows, Linux, macOS에서 공유
- Dotfiles로 버전 관리 가능
- 설정 변경 시 한 곳만 수정하면 됨
- 관리자 권한 불필요 (Junction 사용)

## 문제 해결

### Junction이 아닌 Symbolic Link를 사용하고 싶다면

개발자 모드를 활성화하거나 관리자 권한으로 PowerShell을 실행:

```powershell
# 관리자 PowerShell에서 실행
New-Item -ItemType SymbolicLink -Path "$env:LOCALAPPDATA\nvim" -Target "C:\Users\$env:USERNAME\dotfiles\configs\nvim-lazy"
```

### Junction 삭제 방법

```powershell
# Junction 삭제 (설정 파일은 삭제되지 않음)
Remove-Item $env:LOCALAPPDATA\nvim
```

## 참고 자료

- [Neovim Documentation](https://neovim.io/doc/)
- [LazyVim](https://www.lazyvim.org/)
- [Windows Junction Points](https://docs.microsoft.com/en-us/windows/win32/fileio/junction-points)

## 결론

Windows에서도 Unix 스타일의 dotfiles 관리가 가능하며, Junction을 활용하면 권한 문제 없이 설정을 깔끔하게 관리할 수 있습니다.

