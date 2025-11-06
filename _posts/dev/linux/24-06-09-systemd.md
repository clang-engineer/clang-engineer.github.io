---
title       : Linux systemd
description : >-
date        : 2024-06-09 22:50:30 +0900
updated     : 2025-11-06 16:42:06 +0900
categories  : [dev, linux]
tags        : [linux, service]
pin         : false
hidden      : false
---

## 1. 서비스 파일 위치와 유형

systemd 서비스 파일은 **시스템 단위(System-level)** 와 **사용자 단위(User-level)** 로 나뉩니다.  
각각의 서비스 파일은 관리 주체와 적용 범위에 따라 서로 다른 디렉터리에 저장됩니다.

| 유형 | 경로 | 역할 | 우선순위 | 적용 대상 |
|------|------|------|-----------|------------|
| 🧩 **시스템 단위 (System)** | `/usr/lib/systemd/system/` | 패키지나 운영체제가 제공하는 기본 서비스 | 낮음 | 시스템 전체 |
| | `/etc/systemd/system/` | 시스템 관리자가 수정하거나 새로 만든 서비스 | 높음 | 시스템 전체 |
| 👤 **사용자 단위 (User)** | `/usr/lib/systemd/user/` | 배포 패키지에서 제공하는 기본 사용자 서비스 | 낮음 | 모든 사용자 |
| | `/etc/systemd/user/` | 시스템 관리자가 전역적으로 적용하는 사용자 서비스 | 중간 | 모든 사용자 |
| | `~/.config/systemd/user/` | 특정 사용자가 직접 만든 서비스 | 높음 | 해당 사용자만 |

> ✅ 동일한 서비스 이름일 경우, 우선순위는 다음과 같습니다:  
> **사용자 서비스:** `~/.config/systemd/user/` → `/etc/systemd/user/` → `/usr/lib/systemd/user/`  
> **시스템 서비스:** `/etc/systemd/system/` → `/usr/lib/systemd/system/`

---

### 💡 차이 요약

| 구분 | 실행 인스턴스 | 제어 명령 예시 | 권한 | 설명 |
|------|---------------|----------------|------|------|
| 시스템 단위 서비스 | `systemd (PID 1)` | `sudo systemctl start nginx` | root 필요 | 시스템 전체 서비스 (nginx, sshd 등) |
| 사용자 단위 서비스 | `systemd --user` | `systemctl --user start myapp` | 일반 사용자 가능 | 개인 세션 전용 서비스 (백그라운드 앱 등) |

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
````

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
* `~/.config/systemd/user/`
  일반 사용자가 직접 작성하여 개인 단위로 실행하는 서비스 파일 위치.

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

> 💡 사용자 서비스의 경우 `--user` 옵션을 붙여야 합니다.
> 예: `systemctl --user start myapp.service`

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

## 6. 사용자(User) 서비스 유지 (loginctl linger)

기본적으로 `systemd --user` 인스턴스는 로그인 세션이 종료되면 같이 종료됩니다.
만약 로그아웃 후에도 서비스를 계속 유지하고 싶다면 다음 명령을 실행합니다:

```bash
loginctl enable-linger {username}
```

이 명령은 해당 사용자의 세션이 끊겨도 `systemd --user` 인스턴스가 계속 살아있게 해주며,
이를 통해 백그라운드 서비스처럼 동작할 수 있습니다.
