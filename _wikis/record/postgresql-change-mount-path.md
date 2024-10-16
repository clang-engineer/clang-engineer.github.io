---
layout  : wiki
title   : Postgresql 마운트 경로 변경
summary : 
date    : 2024-10-16 14:12:42 +0900
updated : 2024-10-16 14:50:22 +0900
tags    : 
toc     : true
public  : true
parent  : [[record/index]]
latex   : false
---
* TOC
{:toc}

# 요약 
- postgresql 데이터가 저장되는 경로는 postgresql 서비스가 설치된 경로에 따라 달라진다.
- centos 기준으로 postgresql 서비스가 설치된 경로는 `/var/lib/psql/{version}/data` 이다.
- postgresql 데이터베이스의 마운트 경로를 변경하는 방법을 정리한다.

# 1. postgresql 서비스 중지
```bash
sudo systemctl stop postgresql
```

# 2. 기존 데이터 디렉토리 이동
```bash
sudo mv /var/lib/psql/{version}/data {new-mount-path}
```

# 3. 마운트 경로 변경

## 서비스 파일 수정
- postgresql 서비스 실행 파일 환경 변수를 수정한다.
- 서비스 파일 경로: /usr/lib/systemd/system/postgresql-{version}.service

```txt
// Environment=PGDATA=/var/lib/psql/{version}/data  // 기존 경로 주석 처리
Environment=PGDATA={new-mount-path}
```

# 4. postgresql 서비스 시작
sudo systemctl start postgresql

# 5. postgresql 서비스 상태 확인
```bash
sudo systemctl status postgresql
```

# 6. 데이터 디렉토리 경로 확인
```bash
// su - postgres
psql -U postgres -c "SHOW data_directory;"
```
