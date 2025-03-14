---
title       : Linux 서비스
description : >-
    Linux 서비스 파일의 경로와 역할에 대해 정리해보았습니다.
date        : 2024-06-09 22:50:30 +0900
updated     : 2025-02-21 22:50:42 +0900
categories  : [dev, linux]
tags        : [linux, service]
pin         : false
hidden      : false
---

## systemd 서비스 파일
- systemd 서비스 파일은 보통 `/etc/systemd/system/` 또는 `/usr/lib/systemd/system/` 경로에 위치한다.
- `/etc/systemd/system/` 경로에 있는 서비스 파일은 `/usr/lib/systemd/system/` 경로에 있는 파일보다 우선순위가 높다. 즉, 동일한 이름의 서비스 파일이 두 경로에 모두 존재할 경우 `/etc/systemd/system/`에 있는 파일이 사용됨.
- 사용자는 일반적으로 `/usr/lib/systemd/system/` 경로에 있는 파일을 직접 수정하지 않는다. 대신 `/etc/systemd/system/` 경로를 사용하여 서비스 파일을 수정하고 관리한다.

| --- | /etc/systemd/system/ | /usr/lib/systemd/system/ |
|---|----------------------|--------------------------|
| 역할 | 사용자 정의 서비스 파일 및 시스템 관리자에 의해 수정된 서비스 파일을 저장 | 기본적으로 패키지 관리자에 의해 설치된 서비스 파일을 저장 (운영 체제나 소프트웨어 패키지 설치 시 제공) |
| 우선순위 | 높음 | 낮음 |
| 사용 | 사용자가 직접 만든 커스텀 서비스나, 특정 설정을 위해 원래 서비스 파일을 덮어쓰고자 할 때 사용 | 일반적으로 사용자는 이 경로에 있는 파일을 직접 수정하지 않음 |

## 서비스 파일 예시
```bash
[Unit]
Description=Service Description  # 서비스 설명
After=network.target               # 네트워크가 활성화된 후에 서비스를 시작하도록 설정 (httpd 서비스 등, 네트워크가 필요한 서비스에 사용)

[Service]
ExecStart=/home/{username}/{path_to_script}  # 실행할 스크립트 경로

User={username}  # 서비스를 실행할 사용자
Group={groupname}  # 서비스를 실행할 그룹

[Install]
WantedBy=multi-user.target # 서비스를 multi-user.target에 등록 (시스템 부팅 시 실행)
```