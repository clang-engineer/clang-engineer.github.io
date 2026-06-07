---
title       : "PowerShell 프로필이 nvim-lint(ktlint) JSON 출력을 깨뜨릴 때"
description : "비대화형 PowerShell 세션이 PSReadLine 에러와 chcp 텍스트를 출력해 ktlint JSON 파싱을 깨뜨리는 문제와 가드 해법"
date        : 2026-05-06 10:00:00 +0900
updated     : 2026-05-06 10:00:00 +0900
categories  : [vim]
tags        : [lazyvim, nvim-lint, ktlint, powershell, psreadline, windows]
pin         : false
hidden      : false
---

Windows에서 LazyVim의 nvim-lint가 ktlint를 돌렸는데 `Parser failed. Expected value but found invalid token at character 1`이 떴다. 출력을 보니 ktlint JSON 앞에 `Set-PSReadLineOption : ...` 에러랑 `Active code page: 65001` 텍스트가 박혀있었다. 원인은 자식 PowerShell이 사용자 프로필을 로드하면서 비대화형 세션에서 못 쓰는 명령들을 그대로 실행한 것.

## 증상

```
Output from linter:
Set-PSReadLineOption : The predictive suggestion feature cannot be enabled because
the console output doesn't support virtual terminal processing or it's redirected.
At C:\Users\myuser\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1:6
+ Set-PSReadLineOption -PredictionSource History
...
[ ktlint JSON ]
```

nvim-lint는 stdout/stderr 첫 글자부터 JSON으로 파싱하므로 앞에 한 줄이라도 텍스트가 끼면 깨진다.

## 핵심: 비대화형/리다이렉트 세션 가드

`Microsoft.PowerShell_profile.ps1`의 PSReadLine 설정과 `chcp` 같은 출력 있는 명령은 자식 프로세스에선 노이즈가 된다.

```powershell
# PSReadLine은 출력 리다이렉트 안 된 대화형에서만
if (-not [Console]::IsOutputRedirected -and -not [Console]::IsInputRedirected) {
    Set-PSReadLineOption -PredictionSource History
    Set-PSReadLineOption -PredictionViewStyle ListView
}

# chcp는 항상 출력 억제
chcp 65001 > $null
```

## 검증 방법

자식 PowerShell 호출 후 출력이 깨끗한지 한 줄로 확인:

```powershell
powershell -NoLogo -NonInteractive -Command "echo HELLO"
```

`HELLO`만 나와야 정상. 앞에 `Set-PSReadLineOption :` 이나 `Active code page: 65001`이 끼면 프로필이 새고 있는 것.

## 일반화

nvim-lint뿐 아니라 PowerShell을 통해 외부 도구를 spawn하는 모든 도구(VSCode tasks, Git hooks, CI runner 등)가 같은 함정에 빠진다. **프로필에 출력 있는 명령을 둘 거면 항상 가드 또는 `> $null`로 silence**.

## 곁가지 — 진단 절차

1. 린터/LSP 가짜 에러가 잔뜩 뜨면 raw output부터 확인
2. nvim LSP는 `:LspLog` 또는 `~/AppData/Local/nvim-data/lsp.log`
3. 출력 앞부분에 셸 프로필 흔적이 있으면 → 프로필 정리
