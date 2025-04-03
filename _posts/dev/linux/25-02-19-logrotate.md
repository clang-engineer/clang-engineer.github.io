---
title       : logrotate 설정
description : >-
    logrotate를 이용한 로그 파일 관리
date        : 2021-01-25 22:50:30 +0900
updated     : 2025-02-21 22:50:42 +0900
categories  : [dev, linux]
tags        : [logrotate]
pin         : false
hidden      : false
---

리눅스에는 logrotate 라는 로그 파일을 관리하는 유틸리티가 있다. 
이 유틸리티는 주기적으로 로그 파일을 압축하고, 오래된 로그 파일을 삭제하는 등의 작업을 자동으로 수행해준다. 
logrotate는 cron과 함께 사용되며, cron은 주기적으로 logrotate를 실행하여 로그 파일을 관리한다. (/etc/cron.daily/logrotate)

## logrotate 설정
logrotate는 `/etc/logrotate.conf` 파일과 `/etc/logrotate.d/` 디렉토리 내의 설정 파일을 통해 설정할 수 있다. 
`/etc/logrotate.conf` 파일은 전체적인 설정을 포함하고, `/etc/logrotate.d/` 디렉토리 내의 파일들은 개별 서비스나 애플리케이션에 대한 설정을 포함한다.

### 1. logrotate.conf 설정
- `/etc/logrotate.conf` 파일을 열어 기본 설정을 확인하고 수정할 수 있다.
```bash
sudo vi /etc/logrotate.conf
```
- 기본 설정 예시
```conf
weekly  # 로그 파일을 매주 회전
rotate 4  # 최대 4개의 로그 파일을 보관
create # 새로운 로그 파일을 생성
dateext # 회전된 로그 파일에 날짜를 추가
compress # 회전된 로그 파일을 압축
include /etc/logrotate.d # /etc/logrotate.d 디렉토리 내의 설정 파일 포함
```

### 2. 개별 서비스 설정
- `/etc/logrotate.d/` 디렉토리 내에 개별 서비스에 대한 설정 파일을 생성하거나 수정할 수 있다.
```bash
sudo vi /etc/logrotate.d/nginx
```
- nginx 설정 예시
```conf
/var/log/nginx/*.log {
    daily  # 매일 회전
    missingok  # 로그 파일이 없어도 오류 발생하지 않음
    rotate 52  # 최대 52개의 로그 파일을 보관
    compress  # 회전된 로그 파일을 압축
    delaycompress  # 다음 회전 시점까지 압축 지연
    notifempty  # 비어있는 로그 파일은 회전하지 않음
    create 640 user adm  # 새로운 로그 파일 생성
    sharedscripts  # 스크립트를 공유하여 실행
    postrotate  # 회전 후 실행할 스크립트
        if [ -f /var/run/nginx.pid ]; then  # nginx PID 파일이 존재하는 경우
            kill -USR1 `cat /var/run/nginx.pid`  # nginx에 USR1 신호 전송
        fi
    endscript
}
```

--- 

## 쉘 스크립트로 직접 로그 파일 삭제하기

1. log 파일 삭제하는 쉘 스크립트 작성
```bash
#!/bin/bash
LOG_DIR="/path/to/log"  # 로그 파일 경로 지정
RETENTION_DAYS=30  # 보관할 기간 지정 (예: 30일 이상 된 로그 파일 삭제)
find $LOG_DIR -type f -mtime +$RETENTION_DAYS -exec rm -f {} \;  # 오래된 로그 파일을 검색하여 삭제, mtime: 수정 시간 (+: 이상, -: 이하)
echo "Log files older than $RETENTION_DAYS days have been deleted."  # 삭제 완료 출력
```

2. crontab 설정
- 주기적으로 스크립트를 실행하는 크론탭 설정
- crontab 설정은 `crontab -e` 명령어로 설정 가능
```bash
0 0 * * * sh /path/to/log_clean.sh >> /var/log/log_clean.log 2>&1  # 매일 0시 0분에 스크립트 실행
```

3. crontab 설정 확인
- 설정한 crontab이 정상적으로 등록되었는지 확인
```bash
crontab -l
```

4. 크론탭 로그 확인
- 크론탭 로그를 확인하여 스크립트가 정상적으로 실행되었는지 확인
```bash
tail -f /var/log/cron
# cat /var/log/log_clean.log
# grep CRON /var/log/syslog
# grep CRON /var/log/messages
# grep CRON /var/log/cron.log
# grep CRON /var/log/cron/cron.log
# journalctl -u crond -f
```