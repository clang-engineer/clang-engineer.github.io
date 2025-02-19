---
layout  : wiki
title   : postgresql 데이터베이스 백업 및 복원
summary : 
date    : 2024-06-09 22:11:04 +0900
updated : 2024-06-09 22:26:04 +0900
tags    : 
toc     : true
public  : true
parent  : [[linux/index]]
latex   : false
---

# Pg Dump

## database 덤핑(백업)하기
```bash
pg_dump -U postgres -d mydb > mydb.sql
```

## database 복원하기
```bash
psql -U postgres -d mydb < mydb.sql
```

## 특정 스키마만 덤프하기
```bash
pg_dump -U postgres -d mydb --schema-only > mydb-schema.sql
```

## 데이터만 덤프하기(스키마 제외)
```bash
pg_dump -U postgres -d mydb --data-only > mydb-data.sql
```

## 데이터와 스키마만 덤프하기
```bash
pg_dump -U postgres -d mydb --data-only --schema-only > mydb-data-schema.sql
```
