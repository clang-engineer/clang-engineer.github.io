---
layout  : wiki
title   : Log Clean Schedule Task
summary : 
date    : 2025-02-19 10:50:27 +0900
updated : 2025-02-19 10:50:45 +0900
tags    : 
toc     : true
public  : true
parent  : [[linux/index]]
latex   : false
---
* TOC
{:toc}

# 요약
- 로그 파일을 주기적으로 삭제하는 스케줄링 작업을 설정하는 방법에 대해 설명합니다.

1. log 파일 삭제하는 쉘 스크립트 작성

```bash
#!/bin/bash

# 로그 파일 경로 지정
LOG_DIR="/path/to/log"

# 보관할 기간 지정 (예: 30일 이상 된 로그 파일 삭제)
RETENTION_DAYS=30

# 로그 파일 삭제
find $LOG_DIR -type f -mtime +$RETENTION_DAYS -exec rm -f {} \;

echo "Log files older than $RETENTION_DAYS days have been deleted."
```

2. crontab 설정
- 매일 0시 0분에 스크립트를 실행하도록 설정
- crontab 설정은 `crontab -e` 명령어로 설정 가능

```bash
0 0 * * * sh /path/to/log_clean.sh >> /var/log/log_clean.log 2>&1
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

# 또는
cat /var/log/log_clean.log

# 또는
grep CRON /var/log/syslog

# 또는
grep CRON /var/log/messages

# 또는
grep CRON /var/log/cron.log

# 또는
grep CRON /var/log/cron/cron.log

# 또는
journalctl -u crond -f
```