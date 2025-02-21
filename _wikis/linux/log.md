---
layout  : wiki
title   : Linux Log 파일 정리 
summary : 
date    : 2025-01-25 19:09:41 +0900
updated : 2025-01-25 19:10:04 +0900
tags    : 
toc     : true
public  : true
parent  : [[linux/index]]
latex   : false
---
* TOC
{:toc}

# 요약
- 리눅스 시스템의 로그 파일들에 대해 정리해보았습니다.

# 로그 파일 목록
- /var/log/wtmp : 사용자 로그인/로그아웃 기록
- /var/log/btmp : 사용자 로그인 실패 기록
- /var/log/lastlog : 사용자 최종 로그인 기록
- /var/log/utmp : 현재 로그인한 사용자 정보
- /var/log/messages : 시스템 메시지
- /var/log/secure : 인증 로그
- /var/log/maillog : 메일 로그
- /var/log/cron : cron 로그
- /var/log/boot.log : 부팅 로그
- /var/log/httpd/access_log : 웹 서버 접속 로그
- /var/log/httpd/error_log : 웹 서버 에러 로그


# 로그 파일 상세
## /var/log/wtmp
- 사용자 로그인/로그아웃 기록
- last 명령어로 확인 가능
- wtmp 파일은 이진 파일이므로 last 명령어로 확인 가능

## /var/log/btmp
- 사용자 로그인 실패 기록
- lastb 명령어로 확인 가능
- btmp 파일은 이진 파일이므로 lastb 명령어로 확인 가능

## /var/log/lastlog
- 사용자 최종 로그인 기록
- lastlog 명령어로 확인 가능
- lastlog 파일은 이진 파일이므로 lastlog 명령어로 확인 가능

## /var/log/utmp
- 현재 로그인한 사용자 정보
- who 명령어로 확인 가능
- utmp 파일은 이진 파일이므로 who 명령어로 확인 가능

## /var/log/messages
- 시스템 메시지
- 시스템 로그 파일
- 시스템의 모든 메시지를 기록

## /var/log/secure
- 인증 로그
- sshd, su, sudo 등의 인증 로그
- 보안 로그 파일

## /var/log/maillog
- 메일 로그
- postfix, sendmail 등의 메일 서버 로그
- 메일 전송/수신 로그

## /var/log/cron
- cron 로그
- cron 작업 로그
- cron 작업 실행 로그

## /var/log/boot.log
- 부팅 로그
- 부팅 시 로그
- 부팅 시 로그 파일

## /var/log/httpd/access_log
- apache 웹 서버 접속 로그
- 웹 서버 접속 로그

## /var/log/httpd/error_log
- apache 웹 서버 에러 로그
- 웹 서버 에러 로그