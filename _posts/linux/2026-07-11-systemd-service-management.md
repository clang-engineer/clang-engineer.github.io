---
title       : "systemd 서비스 관리: systemctl, 유닛 파일, 부팅 등록과 타이머"
description : "프로세스를 서비스로 띄우고(systemctl), 부팅에 등록하고(enable), 유닛 파일로 정의하고, cron 대신 타이머로 돌리는 표준 흐름. enable과 start의 흔한 혼동과 daemon-reload 함정까지."
date        : 2026-07-11 20:00:00 +0900
updated     : 2026-07-11 20:00:00 +0900
categories  : [linux, "시스템 관리"]
tags        : [systemd, systemctl, journalctl, timer, service]
pin         : false
hidden      : false
---

서버에 배포한 앱을 `nohup ./myapp &`로 띄워 놓고 SSH를 닫으면 살아 있지만, 재부팅하면 사라집니다. 크래시가 나도 아무도 다시 안 띄웁니다. 로그는 어디로 갔는지 모릅니다. 이런 "떠 있긴 한데 관리가 안 되는" 프로세스를 제대로 다루려면 systemd 서비스로 올려야 합니다.

이 글은 프로세스를 **서비스로 띄우고(start) 부팅에 등록하고(enable) 유닛 파일로 정의하고**, cron 대신 타이머로 주기 실행하는 표준 흐름을 정리합니다.

---

## `systemctl` 일상 명령

대부분의 운영은 이 몇 개로 끝납니다. `nginx`를 예로 들면:

```bash
sudo systemctl start nginx       # 지금 실행
sudo systemctl stop nginx        # 지금 중지
sudo systemctl restart nginx     # 중지 후 재실행 (프로세스 새로 뜸)
sudo systemctl reload nginx      # 설정만 다시 읽기 (프로세스 유지, 무중단)
systemctl status nginx           # 상태 + 최근 로그 몇 줄
```

`restart`와 `reload`의 차이가 핵심입니다. `restart`는 프로세스를 죽였다 다시 띄우므로 순간 끊깁니다. `reload`는 프로세스를 유지한 채 설정 파일만 다시 읽습니다(nginx·sshd처럼 `reload`를 지원하는 서비스만). **연결을 끊고 싶지 않으면 `reload`부터** 시도합니다.

`status`는 단순 상태뿐 아니라 **최근 로그 마지막 줄들**까지 보여줘서, 서비스가 죽었을 때 이유를 가장 먼저 확인하는 자리입니다.

```bash
systemctl status nginx
# ● nginx.service - A high performance web server
#    Loaded: loaded (/usr/lib/systemd/system/nginx.service; enabled; ...)
#    Active: active (running) since ...        ← 지금 떠 있음 + 부팅 등록됨
#      ...
#    (최근 로그 몇 줄)
```

`Loaded:` 줄의 `enabled`/`disabled`가 **부팅 자동시작 여부**, `Active:` 줄이 **지금 떠 있는지**입니다. 이 둘이 별개라는 게 다음 절의 주제입니다.

**조회·목록 명령:**

```bash
systemctl is-active nginx        # active / inactive (스크립트용, 종료코드도 반영)
systemctl is-enabled nginx       # enabled / disabled
systemctl list-units --type=service   # 떠 있는 서비스 목록
systemctl --failed               # 실패한 유닛만 (장애 조사 첫 명령)
```

`systemctl --failed`는 뭔가 안 될 때 가장 먼저 치는 명령입니다. 어떤 서비스가 죽어 있는지를 한눈에 걸러 줍니다.

---

## `enable` vs `start` — 가장 흔한 혼동

systemd 입문에서 거의 모두가 한 번은 걸리는 지점입니다. 둘은 **완전히 별개의 동작**입니다.

| 명령 | 의미 | 지금 뜨나? | 재부팅 후 뜨나? |
|---|---|---|---|
| `start` | 지금 이 순간 실행 | O | X |
| `enable` | 부팅 시 자동 실행하도록 등록 | X | O |

```bash
sudo systemctl enable nginx      # 부팅에 등록만 함 — 지금은 안 뜬다
sudo systemctl start nginx       # 지금 띄우기만 함 — 재부팅하면 안 뜬다
```

- `enable`만 하고 `start`를 안 하면 → **지금은 안 떠 있습니다.** 재부팅해야 뜹니다.
- `start`만 하고 `enable`을 안 하면 → **재부팅하면 사라집니다.**

그래서 "지금 띄우면서 부팅에도 등록"을 한 번에 하는 축약이 있습니다:

```bash
sudo systemctl enable --now nginx    # enable + start 동시에
sudo systemctl disable --now nginx   # disable + stop 동시에
```

새 서비스를 올릴 때는 사실상 항상 `enable --now`를 씁니다. 이게 "지금부터 계속 떠 있어라"의 정확한 표현입니다.

---

## 유닛 파일 작성

내가 만든 앱을 서비스로 올리려면 유닛 파일을 직접 씁니다. 위치가 두 곳으로 나뉘는데, 이 구분이 중요합니다.

| 경로 | 용도 |
|---|---|
| `/etc/systemd/system/` | **관리자가 직접 작성·수정하는 곳.** 내 앱 유닛은 여기 |
| `/usr/lib/systemd/system/` | **패키지가 설치하는 곳.** 여기 파일은 직접 건드리지 않음 |

같은 이름의 유닛이 양쪽에 있으면 `/etc/systemd/system/` 쪽이 이깁니다. 패키지가 준 유닛을 고치고 싶을 때 원본을 수정하는 대신 `/etc/`에 오버라이드를 두는 이유입니다.

`/etc/systemd/system/myapp.service`:

```ini
[Unit]
Description=My App Server           # status·목록에 표시될 설명
After=network.target                # 네트워크가 준비된 뒤에 시작

[Service]
ExecStart=/usr/bin/myapp            # 실제로 실행할 명령 (절대경로)
Restart=on-failure                  # 비정상 종료 시 자동 재시작
User=appsvc                         # 이 계정 권한으로 실행 (root 아님)

[Install]
WantedBy=multi-user.target          # enable 시 어느 타깃에 걸릴지
```

**섹션별 역할:**

- **`[Unit]`** — 유닛의 정체성과 순서. `Description=`은 사람이 볼 설명, `After=network.target`은 "네트워크 준비 후 시작"이라는 **순서 의존성**입니다(단순 순서일 뿐, 강제 의존은 `Requires=`).
- **`[Service]`** — 무엇을 어떻게 실행할지.
  - `ExecStart=` — 실행 명령. **반드시 절대경로.** `$PATH`가 셸과 달라서 `myapp`만 쓰면 못 찾습니다.
  - `Restart=on-failure` — 프로세스가 비정상 종료(0이 아닌 종료코드)하면 자동 재시작. `always`는 정상 종료에도 재시작, `no`(기본)는 재시작 안 함.
  - `User=appsvc` — 서비스를 이 계정 권한으로 실행. **root로 돌리지 않는 게 기본**입니다(서비스 계정 만들기는 [사용자·그룹 관리](/posts/linux/2026-07-11-user-account-management/) 참고).
- **`[Install]`** — `enable`할 때의 동작. `WantedBy=multi-user.target`은 "부팅이 multi-user 단계에 도달하면 이 서비스도 시작"을 뜻합니다.

작성 후:

```bash
sudo systemctl daemon-reload      # systemd에 새 유닛 읽히기 (아래 경고 참고)
sudo systemctl enable --now myapp # 등록 + 실행
systemctl status myapp            # 잘 떴는지 확인
```

---

## `daemon-reload` — 안 하면 반영이 안 된다

> **유닛 파일을 만들거나 고친 뒤엔 반드시 `sudo systemctl daemon-reload`를 실행하세요.** systemd는 유닛 파일을 메모리에 캐시해 두기 때문에, 파일을 바꿔도 다시 읽으라고 알려주지 않으면 **옛날 정의로 계속 동작**합니다. "분명히 `ExecStart`를 고쳤는데 예전 명령으로 뜬다", "새 유닛을 만들었는데 `Unit myapp.service not found`가 난다" — 거의 대부분 `daemon-reload`를 빼먹은 것입니다.
{: .prompt-warning }

순서를 정리하면:

```bash
sudo vim /etc/systemd/system/myapp.service   # 1) 파일 수정
sudo systemctl daemon-reload                 # 2) systemd에 다시 읽히기
sudo systemctl restart myapp                 # 3) 새 정의로 재시작
```

이름이 헷갈리는데, `daemon-reload`는 **systemd 자신이 유닛 파일을 다시 읽는 것**이고, 앞서 본 `systemctl reload <서비스>`는 **그 서비스가 자기 설정을 다시 읽는 것**입니다. 완전히 다른 층위입니다.

---

## 로그 연계 — `journalctl`

systemd 서비스의 로그는 저널에 모입니다. `status`가 보여주는 몇 줄로 부족할 때 전체를 봅니다.

```bash
journalctl -u myapp          # myapp 서비스의 전체 로그
journalctl -u myapp -f       # 실시간 팔로우 (tail -f 처럼)
journalctl -u myapp -e       # 맨 끝(최신)으로 점프
journalctl -u myapp --since "10 min ago"   # 시간 범위
```

`status`에 나오는 로그와 `journalctl -u`는 **같은 저널을 본 것**입니다. `status`는 요약(마지막 몇 줄), `journalctl -u`는 전체이자 필터·시간 지정이 가능한 창구입니다. 서비스가 죽으면 `status`로 먼저 훑고, 부족하면 `journalctl -u ... -e`로 파고듭니다.

> 📎 저널 자체(영속 저장·용량 관리·필터 문법)는 [syslog·journald 로깅](/posts/linux/2026-07-11-syslog-journald-logging/)에서 따로 다룹니다.
{: .prompt-tip }

---

## 타이머 — cron의 대안

주기 실행이라면 cron 대신 systemd 타이머를 쓸 수 있습니다. `.service`(무엇을 할지)와 `.timer`(언제 할지) **한 쌍**으로 구성합니다.

`/etc/systemd/system/backup.service`:

```ini
[Unit]
Description=Nightly backup

[Service]
Type=oneshot                     # 한 번 실행하고 끝나는 작업
ExecStart=/usr/local/bin/backup.sh
```

`/etc/systemd/system/backup.timer`:

```ini
[Unit]
Description=Run backup nightly

[Timer]
OnCalendar=*-*-* 03:00:00        # 매일 새벽 3시
Persistent=true                  # 꺼져 있던 시간의 놓친 실행을 부팅 후 보충

[Install]
WantedBy=timers.target
```

`.service`는 `enable`하지 않고 **`.timer`만 등록**합니다. 타이머가 때가 되면 같은 이름의 `.service`를 자동으로 트리거합니다.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now backup.timer
systemctl list-timers            # 등록된 타이머와 다음 실행 시각
```

`OnCalendar=`는 `daily`·`weekly`·`Mon *-*-* 09:00` 같은 표현도 받습니다. **cron 대비 장점:**

- 실행 결과가 **저널에 통합**됩니다(`journalctl -u backup.service`). cron은 로그가 흩어지고 메일로 오기 십상입니다.
- `After=`·`Requires=` 같은 **의존성**을 걸 수 있습니다. "네트워크·DB 준비 후 실행" 같은 조건이 자연스럽습니다.
- `Persistent=true`로 **꺼져 있던 동안 놓친 실행을 보충**합니다(cron엔 anacron이 따로 필요).

간단한 주기 작업이면 cron이 여전히 가볍지만, 로그·의존성이 필요하면 타이머가 낫습니다.

---

## target — 런레벨의 후신

부팅이 어느 상태까지 올라갈지를 정하는 게 target입니다. 옛 SysV의 런레벨을 대체합니다.

| target | 의미 | 옛 런레벨 |
|---|---|---|
| `multi-user.target` | CLI 멀티유저 (GUI 없음, 서버 기본) | 3 |
| `graphical.target` | GUI 데스크톱 | 5 |

```bash
systemctl get-default                        # 현재 기본 target 확인
sudo systemctl set-default multi-user.target # 서버는 GUI 끄고 CLI로 부팅
```

서버라면 `multi-user.target`으로 두어 GUI를 안 띄우는 게 자원 절약입니다. 유닛 파일의 `WantedBy=multi-user.target`이 바로 "이 target에 도달하면 나도 시작"이라는 연결이었습니다.

---

## 프로세스를 직접 kill하면 안 되는 이유

서비스로 뜬 프로세스를 `kill`이나 `pkill`로 죽이면, `Restart=on-failure`/`always`가 걸려 있는 한 systemd가 **곧바로 되살립니다.** "죽였는데 자꾸 다시 뜬다"의 정체입니다.

```bash
pkill myapp                  # 죽어도 Restart= 때문에 systemd가 재시작
sudo systemctl stop myapp    # 이게 정답 — systemd에게 멈추라고 지시
```

서비스로 관리되는 프로세스는 **반드시 `systemctl`로 다뤄야** 합니다. 반대로 서비스가 아닌 일반 프로세스를 이름·포트로 찾아 끄는 법은 [프로세스 찾고 종료하기](/posts/linux/2026-06-16-process-find-and-kill/)에서 다룹니다. 둘의 경계를 구분하는 게 핵심입니다.

---

## 대중성·대안

- `systemd`/`systemctl` — **현대 리눅스의 사실상 표준.** Debian·Ubuntu·RHEL·Rocky·Fedora·Arch 등 주류 배포판 전부 채택. init 시스템 논쟁은 사실상 끝났고, 서버 운영에서 벗어날 이유가 없습니다.
- **SysV init / `service` 명령** — 옛 방식. `service nginx start`는 아직 동작하지만 systemd로 포워딩되는 호환 셸일 뿐입니다. 신규 작성은 유닛 파일로.
- **OpenRC**(Gentoo·Alpine) / **runit**(Void) — 경량 대안. 컨테이너·임베디드·일부 배포판에서 쓰이지만 니치입니다. Alpine 기반 컨테이너를 만질 때 마주칠 수 있습니다.
- **타이머 vs cron** — cron은 여전히 어디에나 있고 단순 작업엔 가볍습니다. 로그 통합·의존성·놓친 실행 보충이 필요하면 타이머로.

결론: 앱을 서비스로 올릴 땐 `/etc/systemd/system/`에 유닛 파일을 쓰고 → `daemon-reload` → `enable --now`, 상태·로그는 `status`와 `journalctl -u`, 주기 작업은 타이머로. `enable`(부팅)과 `start`(지금)가 별개라는 것과 파일 수정 후 `daemon-reload`만 기억하면 대부분 풀립니다.

> 📎 **치트시트** · [systemd](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/systemd.md) — systemctl·유닛 파일·타이머 빠른 참조 (GitHub)
{: .prompt-tip }
