---
title       : Postgresql 마운트 경로 변경
description : "데이터 디스크 분리·이전을 위해 PGDATA를 옮기는 절차. 서비스 중지 → 디렉토리 이동 → systemd 유닛의 Environment=PGDATA 수정 → 재시작 → SHOW data_directory로 확인."
date        : 2024-10-16 14:12:42 +0900
updated     : 2026-07-03 12:00:00 +0900
categories  : [db, "PostgreSQL·운영"]
tags        : [postgresql]
pin         : false
hidden      : false
---

## 언제 이걸 하나

PostgreSQL이 실제 데이터를 쌓는 디렉토리를 `PGDATA`(data directory)라고 부른다. 다음 같은 상황에서 이 경로를 다른 마운트로 옮기게 된다.

- 데이터가 담긴 파티션의 디스크가 꽉 차간다.
- 더 크거나 빠른 볼륨(별도 데이터 디스크, SSD 등)으로 데이터를 분리하고 싶다.

## 기본 데이터 경로는 배포판마다 다르다

`PGDATA`의 기본 위치는 설치한 배포판과 패키지에 따라 다르다.

- RHEL / CentOS / Rocky: `/var/lib/pgsql/{version}/data`
- Debian / Ubuntu: `/var/lib/postgresql/{version}/main`

> 아래 절차는 systemd 유닛의 `Environment=PGDATA`로 경로를 잡는 RHEL 계열 기준이다. Debian/Ubuntu는 클러스터를 `pg_lsclusters`로 관리하고 경로도 다르니 그대로 대입하지 말 것.
{: .prompt-warning }

## 마운트 경로 변경 순서

아래 명령의 `{version}`·`{new-mount-path}`는 각자 환경 값으로 바꿔 쓴다. 예시로는 `{version}`=`17`, `{new-mount-path}`=`/data/pgsql/17/data`처럼 잡으면 된다.

### 1. PostgreSQL 서비스 중지

이동 중 데이터가 바뀌면 안 되므로 반드시 먼저 멈춘다.

```bash
sudo systemctl stop postgresql
```

### 2. 데이터 디렉토리를 새 경로로 복사

새 마운트(다른 파일시스템)로 옮길 때는 소유자·권한을 그대로 보존해야 한다. `rsync -a`(또는 `cp -a`)로 복사한 뒤 원본은 확인 후 지운다.

```bash
# 소유자(postgres:postgres)와 권한을 보존하며 복사
sudo rsync -a /var/lib/pgsql/{version}/data/ {new-mount-path}/

# 복사된 디렉토리 소유자가 postgres 인지 확인
ls -al {new-mount-path}
```

> `mv`로 옮겨도 되지만, 새 마운트가 별도 파일시스템이면 copy+delete로 처리되므로 소유자·권한 보존 여부를 반드시 확인해야 한다. `rsync -a`가 이 부분을 명시적으로 보장해 더 안전하다.
{: .prompt-tip }

### 3. systemd 유닛에서 PGDATA 경로 수정

서비스 파일의 `PGDATA` 환경변수를 새 경로로 바꾼다.

```ini
# file: /usr/lib/systemd/system/postgresql-{version}.service
Environment=PGDATA={new-mount-path}
# Environment=PGDATA=/var/lib/pgsql/{version}/data   # 기존 경로는 주석 처리
```

유닛 파일을 고쳤으니 데몬 설정을 다시 읽는다.

```bash
sudo systemctl daemon-reload
```

### 4. PostgreSQL 서비스 시작

```bash
sudo systemctl start postgresql
```

### 5. 서비스 상태 확인

```bash
sudo systemctl status postgresql
```

### 6. 데이터 디렉토리 경로 확인

새 경로에서 뜨고 있는지 마지막으로 확인한다.

```bash
psql -U postgres -c "SHOW data_directory;"
```

경로가 `{new-mount-path}`로 나오고 정상 기동하면, 원본 디렉토리를 지워 디스크를 회수한다.

## 관련 글

| 글 | 관계 |
| --- | --- |
| [PostgreSQL 메이저 업그레이드 14→17](/posts/db/2026-07-03-postgresql-major-upgrade/) | 데이터 디렉터리·systemd를 똑같이 다루는 업그레이드 |
| [PostgreSQL PITR와 백업 전략](/posts/db/2026-07-03-postgresql-pitr-backup/) | 경로 이전 전 물리 백업 |
