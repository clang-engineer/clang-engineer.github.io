---
title       : 오래된 로그 파일 삭제 스케줄링
description : >-
    로그 파일을 주기적으로 삭제하는 스케줄링 작업을 설정하는 방법에 대해 기록합니다.
date        : 2021-01-25 22:50:30 +0900
updated     : 2025-02-21 22:50:42 +0900
categories  : [dev, linux]
tags        : [linux, log]
pin         : false
hidden      : false
---

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