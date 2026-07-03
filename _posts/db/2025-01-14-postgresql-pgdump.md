---
title       : PostgreSQL pg_dump, pg_restore 사용법
description : "pg_dump의 plain/custom/directory/tar 포맷 선택 기준, psql로는 plain만 복원되는 이유, pg_restore의 병렬 처리(-j)와 선택적 복원(-n/-t)이 빛나는 지점."
date        : 2025-01-14 13:45:54 +0900
updated     : 2026-07-03 12:00:00 +0900
categories  : [db, "PostgreSQL·운영"]
tags        : [postgresql, pgdump, backup]
pin         : false
hidden      : false
---

데이터베이스 백업이라고 하면 방법이 하나뿐일 것 같지만, PostgreSQL은 크게 두 갈래다. 하나는 `pg_dump`로 스키마와 데이터를 SQL이나 아카이브 형태로 추출하는 **논리 백업**, 다른 하나는 데이터 디렉토리 자체를 복사하는 **물리 백업**이다.

논리 백업은 특정 데이터베이스나 테이블만 골라 뽑을 수 있고 버전·플랫폼을 넘나드는 이식성이 좋다. 개발 DB를 스테이징으로 옮기거나, 실수로 지운 테이블 하나를 되살리거나, 메이저 업그레이드 전에 논리적 스냅샷을 남길 때 제격이다. 반면 "장애 발생 5분 전 시점으로 정확히 되돌린다"거나 수백 GB를 초 단위 손실 없이 복구해야 한다면 물리 백업과 PITR의 영역이다. 이 글은 전자, 즉 `pg_dump`/`pg_restore`를 다룬다. 시점 복구가 필요하다면 아래 [관련 글](#관련-글)의 PITR 편으로 넘어가면 된다.

## pg_dump를 사용한 백업

`pg_dump`는 지정한 데이터베이스를 백업 파일로 추출한다.

```bash
pg_dump -h {host} -p {port} -U {user} -d {database} -f {backup_file}
pg_dump -h {host} -p {port} -U {user} -d {database} > {backup_file} # 표준 출력으로 백업 파일 생성
```

### 옵션

- `-h` : 호스트
- `-p` : 포트
- `-U` : 사용자
- `-d` : 데이터베이스
- `-f` : 백업 파일명
- `-F` : 백업 파일 포맷 (p, c, d, t)
- `-v` : 상세 로그 출력
- `-n` : 스키마 (`-n public`, `-n schema1`, `-n schema1,schema2`, 제외는 `-N schema`)
- `-t` : 테이블 (`-t table1`, `-t table1,table2`)
- `-j` : 병렬 처리 수 (directory 포맷에서만)
- `--schema-only` : 스키마만 백업
- `--data-only` : 데이터만 백업

## 포맷 선택

`-F` 옵션으로 백업 파일의 형태를 고른다. 어떤 포맷을 쓰느냐에 따라 이후 복원 도구와 복원 시 활용할 수 있는 기능이 달라진다.

| 포맷 | 플래그 | 특징 | 복원 도구 |
| --- | --- | --- | --- |
| plain | `-Fp` (기본값) | SQL 스크립트. 사람이 읽고 편집 가능 | `psql` |
| custom | `-Fc` | 단일 바이너리 파일. 자동 압축, 선택적 복원 가능 | `pg_restore` |
| directory | `-Fd` | 여러 파일로 분할. 병렬 백업/복원(`-j`) 지원 | `pg_restore` |
| tar | `-Ft` | tar 아카이브 | `pg_restore` |

plain은 결과물이 곧 SQL 텍스트라 `psql`로 밀어 넣으면 그대로 실행된다. 반대로 말하면 `psql`은 SQL 파일만 복원할 수 있다. custom·directory·tar는 아카이브 구조라서 `pg_restore`가 있어야 풀 수 있고, 그 대신 압축·병렬·선택적 복원 같은 기능을 얻는다.

백업이 크고 복원 속도가 중요하면 directory 포맷이 유리하다. 여러 파일로 나뉘어 있어 `-j`로 병렬 복원이 가능하기 때문이다.

## pg_restore를 사용한 복원

`pg_restore`는 아카이브 포맷(custom/directory/tar)으로 만든 백업을 복원한다. plain SQL만 처리하는 `psql`과 달리 병렬 처리와 선택적 복원을 지원해 백업 파일이 클 때 진가를 발휘한다.

```sh
pg_restore -h {host} -p {port} -U {user} -d {database} -v {backup_file}        # custom/tar 파일 복원
pg_restore -h {host} -p {port} -U {user} -d {database} -v -Fd {backup_dir}     # directory 복원
pg_restore -h {host} -p {port} -U {user} -d {database} -v -j {num} {backup_dir} # 병렬 복원
pg_restore -h {host} -p {port} -U {user} -d {database} -v -t {table} {backup_file} # 특정 테이블만 복원
```

plain 포맷으로 백업했다면 `pg_restore`가 아니라 `psql`로 복원한다.

```bash
psql -h {host} -p {port} -U {user} -d {database} -f {backup_file}
psql -h {host} -p {port} -U {user} -d {database} < {backup_file} # 표준 입력으로 복원
```

## pg_dump와 pg_restore 비교

| 기능 | pg_dump | pg_restore |
| --- | --- | --- |
| 역할 | 데이터베이스 백업 생성 | pg_dump로 생성된 백업 복원 |
| 다루는 형식 | plain / custom / directory / tar | custom / directory / tar |
| 병렬 처리 | 지원하지 않음 | directory 형식에서 지원 |
| 선택적 복원 | 불가능 | 특정 테이블/스키마만 복원 가능 |

plain 포맷은 `pg_restore`가 아니라 `psql`로 복원한다는 점이 핵심이다. 병렬·선택적 복원이 필요하면 애초에 custom이나 directory로 백업해 둬야 한다.

## 관련 글

| 글 | 관계 |
| --- | --- |
| [PostgreSQL PITR와 백업 전략](/posts/db/2026-07-03-postgresql-pitr-backup/) | 시점 복구가 필요하면 — WAL 아카이빙·pg_basebackup |
| [PostgreSQL 복제와 고가용성](/posts/db/2026-07-03-postgresql-replication-ha/) | 같은 데이터를 실시간 이중화 |
