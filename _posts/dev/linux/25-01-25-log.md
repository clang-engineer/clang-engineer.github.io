---
title       : Linux Log 파일 정리
description : >-
    리눅스 시스템의 로그 파일들에 대해 기록합니다.
date        : 2021-01-25 22:50:30 +0900
updated     : 2025-02-21 22:50:42 +0900
categories  : [dev, linux]
tags        : [linux, log]
pin         : false
hidden      : false
---

## 로그 파일 목록
- /var/log/wtmp : 사용자 로그인/로그아웃 기록
- /var/log/btmp : 사용자 로그인 실패 기록
- /var/log/lastlog : 사용자 최종 로그인 기록
- /var/run/utmp : 현재 로그인한 사용자 정보
- /var/log/messages : 시스템 전반의 메시지를 기록
- /var/log/secure : telnet, sshd, su, sudo 등의 인증 로그
- /var/log/maillog : 메일 로그 (postfix, sendmail 등)
- /var/log/cron : cron 작업 로그
- /var/log/boot.log : 부팅 로그
- /var/log/httpd/access_log : apache 웹 서버 접속 로그 
- /var/log/httpd/error_log : apache 웹 서버 에러 로그


## 로그 파일 확인
- 텍스트 파일은 cat, more, less, tail, head 등의 명령어로 확인 가능
- 바이너리 파일은 last, lastb, lastlog, who 별도의 명령어로 확인 가능

```bash
last # /var/log/wtmp 파일 확인, 사용자 로그인/로그아웃 기록
lastb # /var/log/btmp 파일 확인, 사용자 로그인 실패 기록
lastlog # /var/log/lastlog 파일 확인, 사용자 최종 로그인 기록
who # /var/run/utmp 파일 확인, 현재 로그인한 사용자 정보
```