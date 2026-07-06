---
title       : Windows 서비스 등록 및 관리 방법
description : "Windows에서 sc 커맨드로 서비스를 등록·삭제·시작·정지·조회하는 방법과, nssm으로 java/batch처럼 콘솔에 머무는 프로세스를 서비스로 등록하는 방법을 정리한다."
date        : 2025-02-24 22:50:30 +0900
updated     : 2026-06-19 00:00:00 +0900
categories  : [windows, "셸·시스템"]
tags        : [nssm, sc]
pin         : false
hidden      : false
---

Windows에서 프로그램을 백그라운드 서비스로 돌리는 길은 둘이다. 운영체제 기본 도구인 `sc`, 그리고 서비스용으로 만들어지지 않은 실행 파일(예: `java -jar`)을 감싸주는 `nssm`. 어느 쪽을 언제 쓰는지가 핵심이다.

## sc로 서비스 관리

`sc`는 Windows 기본 내장 명령이라 별도 설치가 필요 없다. cmd·PowerShell 어디서나 동작한다.

```bat
sc create MyApp binPath= "C:\app\my.exe" start= auto
sc start  MyApp
sc stop   MyApp
sc query  MyApp
sc delete MyApp
```

함정 두 가지:

- **`binPath= ` 의 `=` 뒤에는 공백이 한 칸 필요하다.** `sc`의 고유 파싱 규칙이라 `binPath="..."`로 붙여 쓰면 무시된다. `start= auto`도 마찬가지.
- **PowerShell에서 `sc`는 `Set-Content`의 alias다.** PowerShell에서 쓸 때는 `sc.exe`로 명시 호출해야 한다.

`sc`는 "서비스로 동작하도록 작성된 실행 파일"을 전제로 한다. 다음 절의 nssm이 필요한 이유가 여기서 나온다.

## nssm로 서비스 관리

`java -jar`이나 batch 파일처럼 **콘솔에 머무는 일반 프로세스**를 `sc create`로 등록하면, 시작할 때 "서비스가 제때 응답하지 않았습니다(오류 1053)"로 깨지는 경우가 흔하다. 서비스 제어 신호(시작/정지)를 주고받는 규약을 그 프로세스가 구현하지 않았기 때문이다.

[nssm](https://nssm.cc/download)(Non-Sucking Service Manager)은 그 프로세스를 감싸 서비스 제어·자동 재시작을 대신 처리하는 래퍼다.

### 1. 실행할 batch 파일 작성

```bat
@ECHO OFF
call "C:\java\bin\java.exe" -jar "C:\app\startup.jar"
```

`cd /D`로 작업 디렉토리를 옮긴 뒤 상대 경로로 실행해도 되지만, 서비스는 작업 디렉토리가 예측과 다를 수 있으니 **절대 경로로 지정하는 쪽이 안전하다.**

### 2. nssm으로 서비스 등록

```bat
nssm install MyApp
```

GUI가 열리면 **Application 탭 → Path에 실행 파일(또는 위 batch) 경로 지정 → Install service** 순으로 진행한다.

![nssm image](https://user-images.githubusercontent.com/39648594/137248149-c554b7b1-32b5-445b-a483-087abcdb850d.png)

GUI 없이 한 줄로도 가능하다:

```bat
nssm install MyApp "C:\work\startup.bat"
```

### 3. 등록 후 제어

```bat
nssm start  MyApp
nssm stop   MyApp
nssm edit   MyApp           :: 설정 GUI 다시 열기
nssm remove MyApp confirm   :: 등록 해제
```

## 명령 레퍼런스

PowerShell 네이티브 cmdlet(`Get-Service` / `Start-Service` / `New-Service` 등)까지 묶은 명령 표는 [PowerShell cheatsheet — 서비스 관리](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/powershell.md#서비스-관리-get-service--sc--nssm)에 정리해 두었다.
