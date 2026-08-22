---
title       : "systemd 서비스 관리: systemctl, 유닛 파일, 부팅 등록과 타이머"
description : "프로세스를 systemd 서비스로 관리하는 흐름을 start/enable, unit dependency, ExecStart, journalctl, timer 기준으로 정리한다. network.target과 network-online.target의 경계도 구분한다."
date        : 2026-07-11 20:00:00 +0900
updated     : 2026-08-22 18:00:00 +0900
categories  : [linux, "시스템 관리"]
tags        : [systemd, systemctl, journalctl, timer, service]
pin         : false
hidden      : false
---

> [리눅스 로드맵](/posts/linux/2026-07-11-linux-roadmap/)의 **3단계 — 서비스** 글이다.

터미널에서 직접 띄운 프로세스를 장기 운영하려면 **누가 시작하고, 실패하면 어떻게 재시작하고, 부팅 시 언제 올라오며, 로그를 어디서 볼지**를 관리해야 한다. systemd service unit은 이 수명 주기를 선언적으로 관리하는 대표적인 방법이다.

## `start`와 `enable`은 다른 축이다

```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

- `start` — 지금 이 순간 unit을 시작한다.
- `enable` — unit file의 `[Install]` 정보에 따라 부팅 target 등에서 시작될 수 있도록 symlink를 만든다.

즉 `enable`은 **현재 프로세스를 실행하는 명령이 아니다.**

둘을 한 번에 하려면:

```bash
sudo systemctl enable --now nginx
```

반대로:

```bash
sudo systemctl disable --now nginx
```

은 disable과 stop을 함께 수행한다.

## 일상적으로 확인할 명령

```bash
systemctl status nginx
systemctl is-active nginx
systemctl is-enabled nginx
systemctl --failed
journalctl -u nginx -e
journalctl -u nginx -f
```

`status`의 `Active:`는 현재 실행 상태, `is-enabled`는 enable 상태를 본다. 둘을 같은 의미로 보지 않는다.

## unit file 기본 구조

예를 들어 `/etc/systemd/system/myapp.service`:

```ini
[Unit]
Description=My App
After=network.target

[Service]
Type=simple
User=appsvc
ExecStart=/usr/local/bin/myapp
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

각 section의 질문은 다르다.

```text
[Unit]
→ 다른 unit과 어떤 관계·순서를 가지는가

[Service]
→ 어떤 프로세스를 어떤 방식으로 실행하는가

[Install]
→ enable할 때 어느 target 등에 연결되는가
```

## `After=`는 의존성 자체가 아니다

`After=network.target`은 **시작 순서(ordering)**를 지정한다. `network.target`을 반드시 끌어오거나 네트워크 연결이 실제 사용 가능할 때까지 기다린다는 뜻은 아니다.

```text
After=
→ 순서 관계

Wants= / Requires=
→ requirement dependency
```

외부 네트워크가 실제 준비된 뒤에만 시작해야 하는 서비스라면 배포판의 network management 구성에 따라 `network-online.target`과 해당 wait-online service를 검토한다.

예:

```ini
[Unit]
Wants=network-online.target
After=network-online.target
```

다만 모든 daemon에 무조건 `network-online.target`을 붙이는 것도 좋은 기본값은 아니다. 가능한 서비스는 네트워크 상태 변화에 동적으로 대응하는 편이 부팅 지연과 결합을 줄일 수 있다.

## `ExecStart=` 실행 파일 경로

`ExecStart=`의 첫 실행 항목은 **절대경로 또는 slash가 없는 단순 실행 파일명**을 사용할 수 있다.

```ini
ExecStart=/usr/local/bin/myapp
```

또는 standard binary search path에 있는 명령이라면:

```ini
ExecStart=echo hello
```

같은 형태가 가능하다. 단순 실행 파일명은 systemd가 고정된 binary search path에서 찾는다. 현재 기본 검색 경로는 다음으로 확인할 수 있다.

```bash
systemd-path search-binaries-default
```

따라서 "ExecStart는 무조건 절대경로"라고 외우기보다 **사용자 shell의 `$PATH`를 그대로 기대하지 않는다**가 더 정확한 원칙이다. 프로젝트 전용 executable은 절대경로를 쓰는 편이 명확하다.

## unit file을 바꿨다면 `daemon-reload`

unit 정의를 만들거나 수정한 뒤에는 manager가 파일을 다시 읽게 한다.

```bash
sudo systemctl daemon-reload
sudo systemctl restart myapp
```

`daemon-reload`와 서비스 자체의 `reload`는 다른 동작이다.

```text
systemctl daemon-reload
→ systemd manager가 unit file을 다시 읽음

systemctl reload myapp
→ myapp이 지원하는 reload 동작을 요청
```

모든 서비스가 reload를 지원하는 것은 아니다. 지원 여부는 unit 정의와 서비스 자체 동작을 확인한다.

## `restart`와 `reload`

```bash
sudo systemctl restart nginx
sudo systemctl reload nginx
```

`restart`는 unit을 다시 시작한다. `reload`는 unit에 정의된 reload 동작이 있을 때 서비스 설정을 재로딩한다.

따라서

```text
연결을 끊기 싫으면 무조건 reload부터
```

처럼 일반화하지 않는다. 먼저 **해당 서비스가 reload를 지원하는지, reload로 어떤 설정까지 반영되는지** 확인한다.

## service account

가능하면 애플리케이션을 필요 이상의 root 권한으로 실행하지 않는다.

```ini
[Service]
User=appsvc
Group=appsvc
```

필요한 파일·socket·port·capability에 맞춰 최소 권한을 설계한다. 단순히 `User=`를 넣는 것만으로 전체 hardening이 끝나는 것은 아니다.

## 재시작 정책

```ini
Restart=on-failure
```

대표 값:

- `no` — 자동 재시작하지 않음
- `on-failure` — 실패 조건에서 재시작
- `always` — 종료 이유와 무관하게 재시작

실제 운영에서는 `RestartSec=`, start-limit 관련 설정과 함께 재시작 루프를 고려해야 한다.

## 로그 — journal

service stdout/stderr가 journal로 연결된 구성에서는 다음처럼 본다.

```bash
journalctl -u myapp
journalctl -u myapp -e
journalctl -u myapp -f
journalctl -u myapp --since "10 min ago"
```

`systemctl status`는 상태와 일부 최근 로그를 빠르게 보는 용도이고, 상세 조사는 `journalctl`로 내려간다.

## timer — 주기 작업

systemd timer는 **무엇을 실행할지(service)**와 **언제 실행할지(timer)**를 나눈다.

`backup.service`:

```ini
[Service]
Type=oneshot
ExecStart=/usr/local/bin/backup.sh
```

`backup.timer`:

```ini
[Timer]
OnCalendar=*-*-* 03:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

활성화:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now backup.timer
systemctl list-timers
```

`Persistent=true`는 timer가 비활성 상태였던 동안 놓친 일정이 있을 때 재활성화 후 실행을 보충할 수 있게 한다. 세부 동작은 timer 종류와 마지막 trigger 상태를 함께 확인한다.

cron과 timer는 서로 완전한 상하 대체재가 아니다.

```text
cron
→ 단순한 시간 기반 주기 실행에 가벼움

systemd timer
→ service lifecycle, dependency, journal과 함께 관리하기 좋음
```

## 운영 확인 순서

서비스가 뜨지 않을 때는 무작정 restart를 반복하기보다 층을 나눈다.

```text
1. unit이 존재하는가
   systemctl cat myapp

2. manager가 최신 unit을 읽었는가
   daemon-reload 여부

3. 시작 자체가 실패했는가
   systemctl status myapp

4. 실제 오류는 무엇인가
   journalctl -u myapp -e

5. 실행 사용자·파일 권한·경로가 맞는가

6. dependency/order 조건이 맞는가
```

## 기억할 경계

```text
enable ≠ start
After ≠ Requires
network.target ≠ network-online.target
manager daemon-reload ≠ service reload
systemd 실행 환경 ≠ interactive shell 환경
```

이 다섯 경계를 잡으면 systemd 초반 혼동이 크게 줄어든다.

## Reference

- `man systemd.service`
- `man systemd.unit`
- `man systemd.timer`
- `man systemd.special`
