---
title       : 🧹 Windows 로그 파일 자동 삭제 스케줄 설정 가이드
description : 
date        : 2025-10-23 15:22:17 +0900
updated     : 2025-10-23 15:23:06 +0900
categories  : [dev, windows]
tags        : [powershell]
pin         : false
hidden      : false
---

## 📖 개요

운영 환경에서 로그 파일이 계속 쌓이면 디스크 용량을 압박하게 됩니다.
이 문서는 **PowerShell 스크립트**와 **작업 스케줄러(Task Scheduler)** 를 활용하여
**지정된 기간보다 오래된 로그 파일을 자동으로 삭제**하는 방법을 정리합니다.

---

## ⚙️ 1. PowerShell 스크립트 작성

먼저, `C:\scripts\cleanup_logs.ps1` 파일을 생성하고 아래 내용을 작성합니다.

```powershell
# C:\scripts\cleanup_logs.ps1
# 오래된 로그 파일 자동 삭제 스크립트

# 로그 디렉터리 경로 설정
$logPath = "C:\logs"

# 삭제 기준 (며칠 이상 지난 파일 삭제)
$days = 30

# 대상 파일 확장자
$filter = "*.log"

# 삭제 수행
Get-ChildItem -Path $logPath -Filter $filter -Recurse |
  Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$days) } |
  Remove-Item -Force

Write-Host "[$(Get-Date)] $days일 이상 된 로그 파일 삭제 완료."
```

> 💡 `-Recurse` 옵션을 제거하면 하위 폴더는 제외됩니다.

---

## 🧪 2. 스크립트 테스트

PowerShell을 **관리자 권한으로 실행**한 후 아래 명령을 입력하여 정상 동작을 확인합니다.

```powershell
powershell -ExecutionPolicy Bypass -File "C:\scripts\cleanup_logs.ps1"
```

실행 후 `C:\logs` 경로의 오래된 로그 파일이 삭제되었는지 확인합니다.

---

## ⏰ 3. Windows 작업 스케줄러 등록

자동 실행을 위해 **작업 스케줄러(Task Scheduler)** 를 설정합니다.

1. **작업 스케줄러 실행**
   `Win + R` → `taskschd.msc` 입력
2. **작업 만들기(Create Task)** 클릭
3. **일반 탭**

   * 이름: `Delete Old Log Files`
   * 권한: “가장 높은 권한으로 실행”
4. **트리거(Triggers) 탭**

   * 새로 만들기 → 실행 주기 선택 (매일, 매주 등)
5. **동작(Actions) 탭**

   * 새로 만들기

     * **프로그램/스크립트:** `powershell.exe`
     * **인수 추가:**

       ```
       -ExecutionPolicy Bypass -File "C:\scripts\cleanup_logs.ps1"
       ```
6. **조건(Conditions) / 설정(Settings)**

   * 필요 시 “AC 전원에서만 실행” 옵션 해제

---

## 🔍 4. 실행 확인

작업 스케줄러 라이브러리에서 생성한 작업을 선택 후
**우클릭 → 실행(Run)** 을 눌러 수동 실행 테스트를 합니다.

PowerShell 창에서 “삭제 완료” 메시지가 표시되면 정상입니다.

---

## 🪵 5. (선택) 삭제 로그 기록 남기기

삭제 내역을 텍스트 파일로 남기려면 스크립트 마지막에 다음을 추가합니다:

```powershell
"$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss')) - Deleted old log files" | Out-File "C:\scripts\cleanup_logs_history.txt" -Append
```

---

## ✅ 요약

| 항목      | 내용                                                                       |
| ------- | ------------------------------------------------------------------------ |
| 스크립트 경로 | `C:\scripts\cleanup_logs.ps1`                                            |
| 로그 경로   | `C:\logs`                                                                |
| 삭제 기준   | 30일 이상 지난 `.log` 파일                                                      |
| 실행 주기   | 작업 스케줄러에서 자유롭게 설정                                                        |
| 실행 명령   | `powershell -ExecutionPolicy Bypass -File "C:\scripts\cleanup_logs.ps1"` |

---

## 💡 참고 팁

* 여러 경로를 관리해야 한다면 `$logPath` 를 배열로 지정하여 반복 처리 가능

  ```powershell
  $paths = @("C:\logs", "D:\service\logs")
  foreach ($path in $paths) {
    Get-ChildItem -Path $path -Filter "*.log" -Recurse |
      Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } |
      Remove-Item -Force
  }
  ```
* `.bat` 파일로 래핑하여 다른 시스템에서도 쉽게 배포 가능


