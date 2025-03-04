---
title       : 폐쇄망 환경에서 서비스 운영을 위한 환경 구축 방법
description : >-
    인터넷 연결이 되지 않는 폐쇄망 환경에서 서비스를 운영해야 하는 경우가 종종 발생해, 이를 위한 환경 구축 방법을 기록합니다.
date        : 2025-01-14 13:38:35 +0900
updated     : 2025-01-14 13:38:54 +0900
categories  : [dev, tip]
tags        : [offline, runtime, enviroment]
pin         : false
hidden      : false
---

## 1. 동일 환경 컨테이너 생성
1. 시스템 아키텍처 확인
```sh
uname -m
```

2. 동일 환경 컨테이너 생성
```sh
sudo docker run --platform linux/amd64 -it rockylinux:8 /bin/bash    // 아키텍처가 rocky8 + x86_64인 경우
 ```

3. dnf util 설치
```sh
dnf install -y dnf-utils    // 패키지 설치가 아닌 다운로드를 위해 필요
```

## 2. 패키지 다운로드 (ex> postgresql15, java11, nginx)

### 2-1. postgresql15
1. postgres 폐쇄망용 패키지 준비
```sh
// 설치 가능한 postgresql 버전 확인
dnf module list postgresql     

// 다른 버전 사용 원할시 저장소 연결
dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-8-x86_64/pgdg-redhat-repo-latest.noarch.rpm

// 기존 기본 postgresql 모듈 별칭 비활성화
dnf -qy module disable postgresql

// 원하는 버전 다운로드
dnf download --resolve postgresql15-server -y    // --resolve를 통해서 의존성 패키지 모두 설치
```

2. 폐쇄망 설치
- 4-1.의 파일이 내부망 환경에 옮겨졌다는 전제 필요

```sh
rpm -ivh *.rpm    // 옮긴 패키지 모두 설치
/usr/pgsql-15/bin/postgresql-15-setup initdb
systemctl enable postgresql-15
systemctl start postgresql-15
```

### 2-2. java11

1. java 폐쇄망용 패키지 준비
```sh
dnf list java*jdk-devel   // 설치 가능한 java 버전 확인
dnf download —resolve java-11-openjdk-devel.x86_64 -y    // --resolve를 통해서 의존성 패키지 모두 설치
```

2. 폐쇄망 설치
- 4-1.의 파일이 내부망 환경에 옮겨졌다는 전제 필요

```sh
// 옮긴 패키지 모두 설치
rpm -ivh *.rpm     

// JAVA_HOME 설정
echo "export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-11.0.12.0.7-0.el8_4.x86_64" >> /etc/profile
source /etc/profile
echo $JAVA_HOME
```

### 2-3. nginx

1. nginx 폐쇄망용 패키지 준비
```sh
dnf list install nginx    // 설치 가능한 nginx 버전 확인
dnf download --resolve nginx   // --resolve를 통해서 의존성 패키지 모두 설치
```

2. 폐쇄망 설치
- 4-1.의 파일이 내부망 환경에 옮겨졌다는 전제 필요

```sh
// 옮긴 패키지 모두 설치
rpm -ivh *.rpm

// nginx 설정 변경 (ex> /etc/nginx/nginx.conf)
systemctl enable nginx
systemctl start nginx
```