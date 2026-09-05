---
title       : "logrotate — 로그 파일을 회전·압축·보관하는 시스템 도구"
description : "logrotate가 로그를 생성하는 도구가 아니라 이미 존재하는 파일 로그의 회전·압축·보관 정책을 적용하는 도구라는 위치를 잡고, 설정 구조·실행 주기·postrotate와 logback의 경계를 정리한다."
date        : 2021-01-25 22:50:30 +0900
updated     : 2026-09-05 20:15:00 +0900
categories  : [linux, "시스템 관리"]
tags        : [logrotate, systemd, cron, nginx, logback, concept]
pin         : false
hidden      : false
---

`logrotate`는 애플리케이션 로그를 직접 생성하는 도구가 아니다. **이미 파일로 쌓이고 있는 로그를 일정 조건에서 이름을 바꾸고, 압축하고, 오래된 파일을 제거해 보관 주기를 관리하는 시스템 도구**다.

```text
애플리케이션 / Daemon
      ↓ 파일에 기록
현재 Log File
      ↓
   logrotate
      ↓
회전된 Log
├─ 보관
├─ 압축
└─ 오래되면 삭제
```

이 위치를 먼저 잡으면 Logback 같은 애플리케이션 내부 rolling 기능, `journald`, 수집기와의 역할 경계가 명확해진다.

## 1. logrotate가 실제로 하는 일

대표적인 정책은 다음과 같다.

```text
언제 회전할까?
→ daily / weekly / monthly / size 등

몇 개를 남길까?
→ rotate

회전된 파일을 압축할까?
→ compress / delaycompress

새 파일을 만들까?
→ create

회전 뒤 Process에 신호가 필요한가?
→ postrotate
```

즉 logrotate의 핵심은 단순 삭제가 아니라 **현재 로그 파일과 과거 로그 파일의 생명주기를 관리하는 것**이다.

## 2. 설정은 전역 정책과 서비스별 정책으로 나뉜다

일반적인 구조는:

```text
/etc/logrotate.conf
→ 전역 기본값
→ /etc/logrotate.d 포함

/etc/logrotate.d/*
→ Service / Application별 정책
```

예를 들어 `/etc/logrotate.conf`에는 다음 같은 공통 설정이 들어갈 수 있다.

```conf
weekly
rotate 4
create
dateext
compress
include /etc/logrotate.d
```

이 설정은 대략:

```text
매주 회전
최근 4개 보관
새 Log File 생성
회전 파일에 날짜 Suffix
압축
서비스별 설정 추가 로드
```

라는 의미다.

배포판이 제공하는 실제 기본값은 다를 수 있으므로 `/etc/logrotate.conf`와 `/etc/logrotate.d/`를 직접 확인한다.

## 3. 실행 주기와 회전 조건은 다른 개념이다

`daily`를 설정했다고 logrotate 프로세스가 항상 스스로 매일 깨어나는 것은 아니다.

```text
Scheduler가 logrotate 실행
        ↓
logrotate가 설정을 읽음
        ↓
각 Log가 회전 조건을 만족하는지 판단
        ↓
필요한 Log만 Rotation
```

logrotate는 일반적으로 배포판에 따라 **cron job 또는 `logrotate.timer` 같은 systemd timer**에서 주기적으로 실행된다.

현재 시스템에서는 다음처럼 확인한다.

```bash
systemctl status logrotate.timer
systemctl list-timers | grep logrotate
```

cron 기반이라면 `/etc/cron.daily/logrotate` 같은 경로가 있을 수 있다.

즉:

```text
logrotate 실행 주기
≠
각 Log의 rotation 조건
```

이다. `hourly` 정책을 적어도 scheduler가 하루에 한 번만 실행한다면 실제로 매시간 회전할 수 없다.

## 4. 서비스별 설정 예 — Nginx

서비스 로그는 `/etc/logrotate.d/` 아래에 별도 정책을 두는 방식이 일반적이다.

```conf
/var/log/nginx/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 nginx adm
    sharedscripts
    postrotate
        if [ -s /run/nginx.pid ]; then
            kill -USR1 "$(cat /run/nginx.pid)"
        fi
    endscript
}
```

여기서 중요한 흐름은:

```text
현재 Nginx Log 회전
       ↓
새 Log File 준비
       ↓
postrotate
       ↓
Nginx에 Log reopen Signal
       ↓
새 파일에 계속 기록
```

이다.

단순히 파일 이름만 바꾸면 실행 중인 process가 기존 file descriptor를 계속 잡고 있을 수 있기 때문에 **서비스가 새 로그 파일을 다시 열도록 알리는 과정**이 필요할 수 있다.

실제 signal과 PID 경로는 사용하는 Nginx package의 기본 logrotate 설정을 우선 확인한다.

## 5. `create`와 `copytruncate`는 같은 해결책이 아니다

### `create`

일반적인 rotate는 기존 파일 이름을 바꾸고 새 파일을 만든다.

```text
app.log
  ↓ rename
app.log.1

새 app.log 생성
```

애플리케이션이 새 파일을 reopen할 수 있다면 이 방식이 자연스럽다.

### `copytruncate`

애플리케이션이 파일을 reopen하지 못할 때 사용할 수 있는 우회다.

```text
현재 app.log 내용을 복사
       ↓
회전본 생성
       ↓
원래 app.log을 같은 inode에서 truncate
```

장점은 process를 다시 열게 하지 않아도 된다는 것이지만, **복사와 truncate 사이에 기록된 로그가 유실될 수 있는 작은 race window**가 있다.

따라서 "용량을 빨리 줄이려면 copytruncate"가 아니라:

```text
Application이 Log reopen을 지원한다
→ rename + reopen 우선

reopen이 불가능하다
→ copytruncate Trade-off 검토
```

로 판단한다.

## 6. 설정을 적용하기 전에 Debug로 확인한다

설정 문법과 어떤 파일이 회전 대상인지 먼저 확인한다.

```bash
sudo logrotate --debug /etc/logrotate.conf
```

`--debug`는 실제 로그와 state를 변경하지 않고 판단 과정을 보여준다.

실제 회전이 필요한 테스트 환경에서 강제로 실행하려면:

```bash
sudo logrotate --force /etc/logrotate.conf
```

를 사용할 수 있다.

운영 서버에서는 `--force`가 retention이나 `postrotate`를 실제로 실행하므로 **debug와 force를 같은 테스트 명령으로 취급하지 않는다.**

## 7. 상태 파일도 함께 이해한다

logrotate는 보통 이전 회전 시점을 state 파일에 기록한다.

환경에 따라 대표 경로는:

```text
/var/lib/logrotate/status
```

같다.

```text
Scheduler
   ↓
logrotate 실행
   ↓
Config + State 확인
   ↓
회전 필요 여부 결정
   ↓
State 갱신
```

따라서 설정에 `daily`가 있는데 왜 지금 바로 회전하지 않는지 볼 때는 **설정뿐 아니라 마지막 실행·회전 상태**도 같이 확인한다.

## 8. Logback과 logrotate — 어느 층이 파일을 소유하나

Java 애플리케이션의 Logback도 RollingFileAppender 등으로 rotation을 직접 할 수 있다.

두 방식의 가장 중요한 비교축은 **회전 정책을 누가 소유하는가**다.

```text
Logback
→ Application 내부에서 File/Rotation 정책 소유

logrotate
→ OS가 외부 File의 Rotation/Retention 정책 소유
```

### Logback이 자연스러운 경우

애플리케이션 팀이 로그 파일명·크기·보관 규칙을 코드/설정과 함께 배포하고 싶을 때다.

### logrotate가 자연스러운 경우

여러 system/service 파일 로그에 운영팀의 공통 retention 정책을 적용하거나 애플리케이션이 자체 rotation을 제공하지 않을 때다.

**같은 파일에 Logback rolling과 logrotate를 동시에 적용하는 것은 피하는 편이 좋다.** 두 주체가 서로 다른 시점에 rename/delete하면 예측하기 어려운 결과가 생긴다.

## 9. Container·Cloud에서는 파일 회전 자체가 주 역할이 아닐 수 있다

Containerized application은 애플리케이션이 stdout/stderr로 로그를 내고 runtime이나 logging agent가 수집하는 구조를 많이 사용한다.

```text
Application
  ↓ stdout/stderr
Container Runtime / Logging Driver
  ↓
Collector
  ↓
Central Log Storage
```

이 경우 host의 특정 application file을 logrotate로 관리하는 모델이 핵심이 아닐 수 있다.

즉:

```text
VM / Bare Metal File Log
→ logrotate가 적합할 수 있음

Container stdout 중심
→ Runtime / Collector의 Rotation·Retention 정책 확인
```

으로 운영 모델을 먼저 본다.

## 10. 직접 `find ... -delete` 스크립트는 언제 필요한가

단순히 오래된 임시 파일을 지우는 목적이라면 `find -mtime` 같은 별도 cleanup job이 맞을 수 있다.

하지만 **계속 쓰이고 있는 로그 파일의 rotate/compress/reopen/retention 문제**를 직접 shell script로 재구현하는 것은 logrotate보다 오류 가능성이 높다.

```text
Log lifecycle 관리
→ logrotate

일반 오래된 File Cleanup
→ find + timer/cron 같은 별도 Job
```

이 역시 서로 다른 목적이다.

## 정리

```text
Log Producer
   ↓
현재 File Log
   ↓
logrotate
├─ Rotation 조건 판단
├─ Rename/Create
├─ Compress/Retention
└─ 필요 시 Service Reopen
```

logrotate를 이해할 때 중요한 것은 directive를 외우는 것이 아니라 **누가 로그를 생성하고, 누가 파일 rotation을 소유하고, 어떤 scheduler가 logrotate를 실행하는지**를 분리하는 것이다.

## 참고

- [logrotate man page](https://github.com/logrotate/logrotate/blob/main/logrotate.8.in)
- [logrotate example configuration](https://github.com/logrotate/logrotate/blob/main/examples/logrotate.conf)
