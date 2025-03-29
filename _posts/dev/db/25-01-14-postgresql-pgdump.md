---
title       : PostgreSQL pg_dump, pg_restore 사용법
description : 
date        : 2025-01-14 13:45:54 +0900
updated     : 2025-02-21 22:50:42 +0900
categories  : [dev, db]
tags        : [database, postgresql, backup]
pin         : false
hidden      : false
---

## pg_dump를 사용한 db 백업 및 복원.
- pg_dump 를 이용하여 데이터베이스를 백업 및 복원 할 수 있습니다.

1. pg_dump 를 이용한 database 백업
```bash
pg_dump -h {host} -p {port} -U {user} -d {database} -f {backup_file}
pg_dump -h {host} -p {port} -U {user} -d {database} > {backup_file} # 표준 출력으로 백업 파일 생성
```

2. psql 을 이용한 database 복원 (Plain SQL 파일만 복원 가능)
```bash
psql -h {host} -p {port} -U {user} -d {database} -f {backup_file}
psql -h {host} -p {port} -U {user} -d {database} < {backup_file} # 표준 입력으로 백업 파일 복원
```

### 옵션
- -h : 호스트
- -p : 포트
- -U : 사용자
- -d : 데이터베이스
- -f : 백업 파일명
- -F : 백업 파일 포맷 (p, c, d, t, p, s)   # p: plain(-Fp, 기본값), c: custom(-Fc), d: directory(-Fd), t: tar(-Ft), s: sql(-Fs)
- -v : 상세 로그 출력
- -n : 스키마   # -n public, -n schema1, -n schema1,schema2    # vs 스키마 제외: -N schema
- -t : 테이블   # -t table1, -t table1,table2
- -j : 병렬 처리 수
- --schema-only : 스키마만 백업
- --data-only : 데이터만 백업

### 포맷
- plain : SQL 스크립트 형태로 백업 (기본값)
- custom : 바이너리 형태로 백업  // 압축률이 높음
- directory : 디렉토리 형태로 백업  // 여러 파일로 나눠서 백업함으로써 병렬 처리가 가능하게 합니다.
- tar : tar 형태로 백업
- sql : SQL 스크립트 형태로 백업
> custom, directory, tar 형태는 pg_restore 로 복원 가능합니다.

## pg_restore를 사용한 db 복원
- pg_restore 를 이용하여 데이터베이스를 복원 할 수 있습니다.
- planit sql파일만 복원가능한 psql과 달리 custom, directory 형태로 백업한 파일을 복원할 수 있습니다.
- pg_restore는 병렬 처리를 지원하므로 백업 파일이 큰 경우 유용합니다.

```sh
pg_restore -h {host} -p {port} -U {user} -d {database} -v {backup_file} # 파일 형태로 백업한 경우
pg_restore -h {host} -p {port} -U {user} -d {database} -v -Fd {backup_dir} # 디렉토리 형태로 백업한 경우
pg_restore -h {host} -p {port} -U {user} -d {database} -v -j {num} {backup_file} # 병렬 처리
pg_restore -h {host} -p {port} -U {user} -d {database} -v -Fc {backup_file} # custom 형태로 백업한 경우
```

## pg_dump 와 pg_restore 비교
| 기능 | pg_dump | pg_restore |
| --- | --- | --- |
| 역할 | 데이터베이스 백업 생성 | pg_dump로 생성된 백업 복원 |
| 백업 파일 형식 | Plain SQL, Custom Format, Directory | Custom Format, Directory Format |
| 복원 가능 여부 | Plain SQL 파일은 직접 복원 가능 | Custom/Directory 형식 복원 가능 |
| 병렬 처리 지원 | 지원하지 않음 | Directory 형식에서 지원 |
| 선택적 복원 | 불가능 | 특정 테이블/스키마 복원 가능 |