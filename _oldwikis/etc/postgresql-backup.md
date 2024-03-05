---
layout  : wiki
title   : Postgre 백업 및 복구
summary : 
date    : 2024-01-23 14:34:58 +0900
updated : 2024-01-23 14:40:15 +0900
tags    : 
toc     : true
public  : true
parent  : [[etc/index]]
latex   : false
---
* TOC
{:toc}

# pg_dump를 이용한 백업

## 기본 사용법

```bash
$ pg_dump -U <USER_NAME> -d <DB_NAME> > backup.sql
```

## DOC 확인

```bash
$ pg_dump --help
```

## 예제

```bash
$ pg_dumpall > backup.sql  # 전체 백업

$ pg_dump -U postgres -d <DB_NAME> > backup.sql # 특정 DB 백업

$ pg_dump -U postgres -d <DB_NAME> -t <TABLE_NAME> > backup.sql # 특정 테이블 백업
```

## shell script

```bash
#!/bin/bash

HOST=xxx.xxx.xxx.xxx
USERNAME=someone
DATABASE=somedb
PORT=95432
DATE=$(date +%y%m%d%H%M%S)
FILE="backup/backup-$DATE.sql"
PG_DUMP_OPTIONS="--data-only --column-inserts" # --data-only: 데이터만, --column-inserts: insert문으로

pg_dump -U ${USERNAME} -h ${HOST} -p ${PORT} -d ${DATABASE} ${PG_DUMP_OPTIONS} -f ${FILE}
```


# 복구

## 전체 복구

```bash
$ psql -U postgres -f backup.sql
```

## 특정 DB 복구

```bash
$ psql -U postgres -d <DB_NAME> -f backup.sql
```

