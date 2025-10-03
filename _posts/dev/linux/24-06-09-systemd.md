---
title       : Linux systemd
description : >-
    Linux 서비스 파일의 경로와 역할에 대해 정리해보았습니다.
date        : 2024-06-09 22:50:30 +0900
updated     : 2025-10-03 14:10:54 +0900
categories  : [dev, linux]
tags        : [linux, service]
pin         : false
hidden      : false
---

# systemd 서비스 관리 가이드

## 1. 서비스 파일 위치

systemd 서비스 파일은 일반적으로 다음 두 경로 중 하나에 위치합니다:

| 경로                         | 역할                                        | 우선순위 | 사용                                                  |
| -------------------------- | ----------------------------------------- | ---- | --------------------------------------------------- |
| `/etc/systemd/system/`     | 사용자 정의 서비스 파일 및 시스템 관리자에 의해 수정된 서비스 파일 저장 | 높음   | 사용자가 직접 만든 커스텀 서비스 또는 원래 서비스 파일을 덮어쓰고자 할 때 사용       |
| `/usr/lib/systemd/system/` | 기본적으로 패키지 관리자에 의해 설치된 서비스 파일 저장           | 낮음   | 운영 체제 또는 소프트웨어 패키지 설치 시 제공되는 파일, 일반 사용자는 직접 수정하지 않음 |

> ⚠️ `/etc/systemd/system/`에 동일한 이름의 서비스 파일이 존재하면 `/usr/lib/systemd/system/`에 있는 파일보다 우선 사용됩니다.
> 참고: [Unix StackExchange](https://unix.stackexchange.com/questions/206315/whats-the-difference-between-usr-lib-systemd-system-and-etc-systemd-system)

---

## 2. 서비스 파일 기본 구조

```ini
[Unit]
Description=Service Description   # 서비스 설명
After=network.target              # 네트워크가 활성화된 후에 시작

[Service]
ExecStart=/home/{username}/{path_to_script}  # 실행할 스크립트 경로
User={username}                              # 실행 사용자
Group={groupname}                            # 실행 그룹

[Install]
WantedBy=multi-user.target  # 시스템 부팅 시 실행
```

---

## 3. 커스텀 서비스 예시

```ini
[Unit]
Description=Register Service [servicename]

[Service]
User=root
Group=root
Environment="PATH=/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/usr/local/node/bin"
WorkingDirectory=/home/test
ExecStart=/home/test/start.sh

[Install]
WantedBy=multi-user.target
```

* `/usr/lib/systemd/system`
  OS 벤더사가 관리하며 배포 패키지에서 제공되는 서비스 파일 위치.
* `/etc/systemd/system`
  시스템 관리자가 관리하는 영역으로, 벤더 제공 유닛을 오버라이드할 때 사용.

---

## 4. systemctl 명령어

| 명령어                               | 설명                         |
| --------------------------------- | -------------------------- |
| `systemctl enable [servicename]`  | 부팅 시 서비스 자동 시작 등록          |
| `systemctl start [servicename]`   | 서비스 시작                     |
| `systemctl status [servicename]`  | 서비스 상태 확인                  |
| `systemctl stop [servicename]`    | 서비스 종료                     |
| `systemctl disable [servicename]` | 부팅 시 자동 시작 해제              |
| `systemctl daemon-reload`         | 서비스 파일 변경 시 systemd 데몬 재로드 |
| `systemctl reset-failed`          | 실패한 서비스 상태 초기화             |

---

## 5. 서비스 삭제 절차

### 단계별

```bash
systemctl stop [servicename]
systemctl disable [servicename]
rm /etc/systemd/system/[servicename]        # 관련 심볼릭 링크 포함
rm /usr/lib/systemd/system/[servicename]    # 관련 심볼릭 링크 포함
systemctl daemon-reload
systemctl reset-failed
```

### 한 줄 명령어

```bash
service=YOUR_SERVICE_NAME; \
systemctl stop $service && \
systemctl disable $service && \
rm /etc/systemd/system/$service && \
rm /usr/lib/systemd/system/$service && \
systemctl daemon-reload && \
systemctl reset-failed
```

---

