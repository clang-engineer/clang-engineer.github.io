---
title       : "PowerShell에서 Windows 서비스와 DNS 연결을 진단하는 방법"
description : "Get-Service·sc.exe·nssm의 차이와 Resolve-DnsName·Test-NetConnection을 이용한 Windows 운영 진단"
date        : 2026-10-25 19:55:00 +0900
categories  : [troubleshooting, "windows"]
tags        : [powershell, windows, service, dns, network, troubleshooting]
pin         : false
hidden      : false
---

PowerShell의 객체 파이프라인과 Cmdlet 문법을 이해한 뒤, 실제 Windows 서비스·DNS·TCP 연결 문제를 진단할 때 참고하는 운영 가이드다. **서비스 상태·DNS 이름 해석·TCP 포트 연결은 별개의 문제**이며 한 가지 검사만으로 장애 원인을 확정할 수 없다.

## 서비스 관리 (Get-Service / sc / nssm)

Windows 서비스를 다루는 길은 셋: PowerShell 네이티브 cmdlet, `sc.exe`(cmd 시절 표준), 그리고 일반 exe/batch를 서비스로 감싸는 `nssm`.

```powershell
# 조회 / 상태
Get-Service                            # 전체
Get-Service -Name MyApp                # 특정 (sc query MyApp)
Get-Service | Where-Object Status -eq 'Running'

# 시작 / 정지 / 재시작 (관리자 권한 필요)
Start-Service   MyApp                  # sc start MyApp
Stop-Service    MyApp                  # sc stop MyApp
Restart-Service MyApp

# 시작 유형 변경
Set-Service MyApp -StartupType Automatic   # Automatic / Manual / Disabled

# 등록 / 삭제
New-Service -Name MyApp -BinaryPathName "C:\app\my.exe" -StartupType Automatic
Remove-Service MyApp                   # PS 6+ 전용 (5.1은 sc delete 사용)
```

`sc.exe`는 PS/cmd 어디서나 동작. **`binpath=` 등은 `=` 뒤에 공백 한 칸이 필수** (`sc`의 고유 파싱 규칙):

```powershell
sc.exe create MyApp binPath= "C:\app\my.exe" start= auto   # = 뒤 공백 주의
sc.exe delete MyApp
sc.exe query MyApp
```

> PowerShell에서 `sc`는 `Set-Content`의 alias라 `sc.exe`로 명시 호출할 것.

### nssm — exe/batch를 서비스로 감싸기

`New-Service`/`sc`는 "서비스용으로 작성된 exe"만 제대로 등록된다. `java -jar`나 batch처럼 **콘솔에 머무는 일반 프로세스**는 서비스 제어(시작/정지/자동 재시작)가 깨지는데, [nssm](https://nssm.cc/download)이 그 래퍼 역할을 한다.

```bat
:: startup.bat — 서비스로 등록할 대상
@ECHO OFF
call "C:\java\bin\java.exe" -jar "C:\app\startup.jar"
```

```powershell
nssm install MyApp        # GUI: Application 탭에 exe/batch 경로 → Install service
nssm install MyApp "C:\work\startup.bat"   # GUI 없이 한 줄로
nssm start  MyApp
nssm stop   MyApp
nssm remove MyApp confirm                  # 등록 해제
nssm edit   MyApp                          # 설정 GUI 다시 열기
```

> 일반 exe를 `sc create`로 등록하면 시작 시 "서비스가 제때 응답하지 않았습니다(1053)" 에러가 흔하다 → nssm으로 감싸면 해결.

## 네트워크 / DNS 디버깅

> Windows에서 `nslookup` 결과가 `curl`/브라우저와 다른 경우가 잦다. `nslookup`은 한 인터페이스의 DNS만 보고 hosts/캐시도 무시한다. 이름 해석의 경로를 확인할 때 `Resolve-DnsName`을 사용하되, 실제 애플리케이션의 DNS·hosts·프록시·캐시 정책과 완전히 같다고 가정하지 않는다.

```powershell
# 도메인 조회 (Windows 이름 해석 결과 확인 (앱과 경로가 다를 수 있음))
Resolve-DnsName myhost.example.com

# 포트 연결 확인
Test-NetConnection myhost.example.com -Port 17943

# 여러 포트 한꺼번에
80, 443, 17943 | ForEach-Object {
    $r = Test-NetConnection myhost.example.com -Port $_ -WarningAction SilentlyContinue
    "{0,-6} {1}" -f $_, $r.TcpTestSucceeded
}
```

### Test-NetConnection 결과 해석

| PingSucceeded | TcpTestSucceeded | 의미 |
|---|---|---|
| True  | True  | 정상 |
| True  | False | ICMP 응답은 있지만 TCP 연결 실패 (방화벽·서비스·경로 등 추가 확인) |
| False | False | ICMP와 TCP 모두 실패 (차단·라우팅·서비스 등 추가 확인) |
| False | True  | ICMP만 차단, TCP는 OK — 사내망에서 흔함 |

### Resolve-DnsName 추가 옵션

```powershell
Resolve-DnsName name -DnsOnly             # DNS 프로토콜만 사용 (LLMNR/NetBIOS 제외)
Resolve-DnsName name -CacheOnly           # DNS 서버 안 거치고 캐시만
Resolve-DnsName name -Server 8.8.8.8      # 특정 DNS 서버로 질의 (VPN/공인 DNS 비교)

Get-DnsClientServerAddress | Where-Object { $_.AddressFamily -eq 2 }  # 인터페이스별 DNS
ipconfig /displaydns | Select-String "myhost" -Context 0,5           # 캐시 훑기
Find-NetRoute -RemoteIPAddress 203.0.113.42                          # 목적지로 가는 인터페이스
```

> `tracert`는 포트 스캔이 아니다. TTL을 1,2,3...로 늘려가며 중간 라우터를 노출시키는 도구라 "어디까지 길이 뚫렸는지"만 보여준다. 포트는 `Test-NetConnection -Port`로 별도 확인.



## 관련 문서

- [PowerShell 개념·명령 체계](https://github.com/clang-engineer/devkit/blob/main/reference/cheatsheets/powershell.md)
