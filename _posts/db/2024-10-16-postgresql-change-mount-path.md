---
title       : Postgresql 마운트 경로 변경
description : "데이터 디스크 분리·이전을 위해 PGDATA를 옮기는 절차. 서비스 중지 → 디렉토리 이동 → systemd 유닛의 Environment=PGDATA 수정 → 재시작 → SHOW data_directory로 확인."
date        : 2024-10-16 14:12:42 +0900
updated     : 2024-10-16 14:50:22 +0900
categories  : [db, "PostgreSQL·운영"]
tags        : [postgresql]
pin         : false
hidden      : false
---

- postgresql 데이터가 저장되는 경로는 postgresql 서비스가 설치된 경로에 따라 달라진다.
- centos 기준으로 postgresql 서비스가 설치된 경로는 `/var/lib/psql/{version}/data` 이다.

## 마운트 경로 변경 순서
1. postgresql 서비스 중지
```bash
sudo systemctl stop postgresql
```

2. 기존 데이터 디렉토리 이동
```bash
sudo mv /var/lib/psql/{version}/data {new-mount-path}
```

3. 마운트 경로 변경
서비스 파일을 수정하여 postgresql 데이터 디렉토리의 마운트 경로를 변경한다.

```sh
// file: /usr/lib/systemd/system/postgresql-{version}.service
Environment=PGDATA={new-mount-path} # Environment=PGDATA=/var/lib/psql/{version}/data  // 기존 경로 주석 처리
```

4. postgresql 서비스 시작
```bash
sudo systemctl start postgresql
```

5. postgresql 서비스 상태 확인
```bash
sudo systemctl status postgresql
```

# 6. 데이터 디렉토리 경로 확인
```bash
// su - postgres
psql -U postgres -c "SHOW data_directory;"
```
