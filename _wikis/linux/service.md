---
layout  : wiki
title   : Linux 서비스
summary : 
date    : 2024-06-09 22:11:04 +0900
updated : 2024-06-09 22:26:04 +0900
tags    : 
toc     : true
public  : true
parent  : [[linux/index]]
latex   : false
---

# systemd 서비스 파일 경로
- systemd 서비스 파일은 보통 `/etc/systemd/system/` 또는 `/usr/lib/systemd/system/` 경로에 위치합니다.

## 경로 별 설명
- `/etc/systemd/system/`: 사용자 정의 서비스 파일 및 시스템 관리자에 의해 수정된 서비스 파일을 저장하는 디렉터리
- `/usr/lib/systemd/system/`: 기본적으로 패키지 관리자에 의해 설치된 서비스 파일을 저장하는 디렉터리

1. /etc/systemd/system/:
- 이 디렉터리는 사용자 정의 서비스 파일 및 시스템 관리자에 의해 수정된 서비스 파일을 저장하는 데 사용됩니다.
- 이 경로에 있는 서비스 파일은 /usr/lib/systemd/system/ 경로에 있는 파일보다 우선순위가 높습니다. 즉, 동일한 이름의 서비스 파일이 두 경로에 모두 존재할 경우 /etc/systemd/system/에 있는 파일이 사용됩니다.
- 주로 시스템 관리자나 사용자가 직접 만든 커스텀 서비스나, 특정 설정을 위해 원래 서비스 파일을 덮어쓰고자 할 때 사용됩니다.

2. /usr/lib/systemd/system/:
- 이 디렉터리는 기본적으로 패키지 관리자에 의해 설치된 서비스 파일을 저장하는 데 사용됩니다.
- 운영 체제나 소프트웨어 패키지를 설치할 때 기본적으로 제공되는 서비스 파일이 이 경로에 위치합니다.
- 사용자는 일반적으로 이 경로에 있는 파일을 직접 수정하지 않습니다. 대신 /etc/systemd/system/ 경로를 사용하여 변경 사항을 적용합니다.

## 결론
- `/etc/systemd/system/` 경로에 있는 서비스 파일은 `/usr/lib/systemd/system/` 경로에 있는 파일보다 우선순위가 높습니다.
- 동일한 이름의 서비스 파일이 두 경로에 모두 존재할 경우 `/etc/systemd/system/`에 있는 파일이 사용됩니다.
- 정리하면, /usr/lib/systemd/system/은 시스템 소프트웨어가 설치될 때 기본 서비스 파일을 저장하는 디렉터리이고, /etc/systemd/system/은 사용자나 시스템 관리자가 서비스 파일을 수정하거나 커스텀 서비스를 추가할 때 사용하는 디렉터리입니다.


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