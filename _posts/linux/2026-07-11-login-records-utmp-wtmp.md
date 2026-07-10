---
title       : "로그인 기록 추적하기: who, w, last, lastlog, utmp/wtmp/btmp"
description : "누가 언제 접속했고 지금 뭘 하고 있는지 — who·w·last·lastlog로 세션을 감사하고, 그 뒤에 있는 바이너리 회계 파일(utmp/wtmp/btmp/lastlog)과 systemd 시대의 변화까지 정리합니다."
date        : 2026-07-11 13:00:00 +0900
updated     : 2026-07-11 13:00:00 +0900
categories  : [linux, "시스템 관리"]
tags        : [login, audit, security, who, last]
pin         : false
hidden      : false
---

"지금 이 서버에 누가 접속해 있지?", "어젯밤 새벽 2시에 누가 로그인했지?", "SSH로 무차별 대입 공격이 들어오고 있나?" — 서버를 운영하면 반드시 마주치는 감사(audit) 질문입니다. 리눅스는 이 기록을 몇 개의 회계 파일에 남기고, `who`·`w`·`last`·`lastlog` 같은 도구가 그 파일을 읽어 보여줍니다.

핵심은 **그 파일들이 텍스트가 아니라 바이너리**라는 점입니다. `cat /var/log/wtmp` 하면 깨진 글자만 나옵니다. 이 글은 그 파일들이 각각 무엇을 담는지, 어떤 도구로 읽는지, 그리고 최신 배포판에서 이 전통 방식이 어떻게 바뀌고 있는지를 정리합니다.

---

## 로그인 기록은 네 개의 바이너리 파일이다

명령을 배우기 전에, 로그인 정보가 어디에 저장되는지부터 잡아야 나머지가 다 읽힙니다. 서로 다른 네 파일이 서로 다른 질문에 답합니다.

| 파일 | 담는 것 | 읽는 도구 |
|---|---|---|
| `/run/utmp` (구 `/var/run/utmp`) | **지금 로그인 중인** 세션 (현재 상태) | `who`, `w`, `users` |
| `/var/log/wtmp` | 로그인·로그아웃·부팅의 **누적 이력** | `last` |
| `/var/log/btmp` | **실패한** 로그인 시도 (root만 읽기) | `lastb` |
| `/var/log/lastlog` | 사용자별 **마지막** 로그인 시각 | `lastlog` |

`utmp`는 "지금", `wtmp`는 "과거 전부", `btmp`는 "실패한 시도", `lastlog`는 "각 유저의 최근 1회"로 나눠 기억하면 됩니다.

> **이 파일들은 텍스트가 아닙니다.** `cat /var/log/wtmp`로 열면 깨진 바이너리만 나옵니다. 고정 크기 C 구조체(`struct utmp`)가 그대로 쌓인 형식이라, 반드시 위 도구들이나 `utmpdump`로 해석해서 읽어야 합니다. `grep`·`vim`으로 직접 열지 마세요.
{: .prompt-warning }

바이너리를 굳이 텍스트로 떠서 보고 싶으면 `utmpdump`를 씁니다:

```bash
utmpdump /var/log/wtmp       # wtmp 전체를 사람이 읽는 텍스트로 덤프
utmpdump /run/utmp           # 현재 세션 상태를 텍스트로
# [7] [01234] [ts/0] [zero] [pts/0] [10.0.0.5] [10.0.0.5] [2026-07-11T04:12:33,000000+00:00]
```

각 줄은 타입·PID·라인·사용자·터미널·호스트·IP·시각 순입니다. 백업 파일(`wtmp.1` 같은 회전본)을 분석하거나 스크립트로 파싱할 때 유용합니다.

---

## `who` — 지금 접속한 사람

`/run/utmp`를 읽어 **현재 로그인 중인** 세션만 보여줍니다.

```bash
who                  # 현재 접속자: 유저·터미널·로그인 시각·접속 IP
# zero   pts/0   2026-07-11 13:02 (10.0.0.5)
# root   tty1    2026-07-11 08:11

who -b               # 마지막 부팅 시각
who -r               # 현재 런레벨
who -a               # 위 정보 전부 (all)
whoami               # '내가' 누구인지 (실효 사용자명)
```

`who -b`(boot)와 `who -r`(runlevel)은 utmp에 특수 레코드로 박혀 있어 `who`가 함께 뽑아줍니다. "이 서버 언제 재부팅됐지?"의 가장 빠른 답이 `who -b`입니다.

---

## `w` — 접속자 + 무엇을 하는 중인지

`who`보다 한 걸음 더 나가서, 각 세션이 **지금 무슨 명령을 돌리는 중인지**와 시스템 부하까지 보여줍니다.

```bash
w
#  13:05:22 up 5 days,  2:11,  2 users,  load average: 0.08, 0.11, 0.09
# USER   TTY    FROM       LOGIN@   IDLE   JCPU   PCPU  WHAT
# zero   pts/0  10.0.0.5   13:02    0.00s  0.05s  0.01s w
# root   tty1   -          08:11    4:53m  0.02s  0.02s -bash
```

- 맨 윗줄은 `uptime`과 동일 — 가동 시간·접속자 수·load average
- `IDLE` — 해당 터미널이 얼마나 오래 놀고 있는지 (오래된 유령 세션 찾기 좋음)
- `WHAT` — 그 세션이 현재 실행 중인 프로세스

"누가 서버 느리게 만들고 있나?"를 볼 때 `w` 한 줄이 `who`보다 훨씬 정보량이 많습니다.

```bash
users                # 접속 중인 유저명만 공백 구분으로 (가장 간결)
# root zero
```

---

## `last` — 로그인·로그아웃 이력

`/var/log/wtmp`를 읽어 **과거의 모든** 로그인/로그아웃을 최신순으로 보여줍니다. 감사의 핵심 도구입니다.

```bash
last                 # 전체 로그인 이력 (최신순)
last -n 20           # 최근 20건만
last zero            # 특정 사용자의 접속 이력만
last reboot          # 부팅 이력 (재부팅 추적)
last shutdown        # 종료 이력
last -x              # shutdown·runlevel 변경까지 포함
last -F              # 시각을 초 단위 전체 타임스탬프로 (기본은 축약형)
last -i              # 호스트명 대신 IP로 표시
last -a              # 호스트/IP를 맨 오른쪽 컬럼에 (긴 IP 잘림 방지)
```

전형적인 출력:

```bash
last -n 5 -F
# zero  pts/0  10.0.0.5   Sat Jul 11 13:02:11 2026   still logged in
# zero  pts/0  10.0.0.5   Fri Jul 10 22:41:03 2026 - 23:58:42 (01:17)
# reboot system boot 6.1.0   Fri Jul 10 08:11:55 2026   still running
```

- `still logged in` — 아직 접속 중인 세션
- 괄호 안 `(01:17)` — 그 세션의 지속 시간
- `reboot`·`system boot` 줄로 재부팅 지점이 이력 사이에 표시됨

> **`last`가 텅 비어 있다면** wtmp가 아직 회전(rotate)돼서 옛 기록이 `wtmp.1`로 넘어갔거나 — 뒤에서 다룰 — **최신 배포판이라 wtmp를 아예 안 쓰는** 경우입니다. 회전된 백업까지 보려면 `last -f /var/log/wtmp.1`처럼 파일을 직접 지정합니다.
{: .prompt-tip }

로그가 언제·어떻게 회전·보관되는지는 [logrotate 정리](/posts/linux/2025-02-19-logrotate/)에서 다뤘습니다. wtmp도 logrotate 대상이라 오래된 기록은 백업본으로 밀려납니다.

---

## `lastb` — 실패한 로그인 (무차별 대입의 흔적)

`/var/log/btmp`를 읽습니다. `last`와 사용법은 똑같지만 **실패한** 로그인만 보여줍니다. 파일이 root만 읽을 수 있어 `sudo`가 필요합니다.

```bash
sudo lastb -n 20     # 최근 실패한 로그인 20건
sudo lastb -i        # 공격 출처 IP로 보기
```

```bash
sudo lastb -n 5 -i
# admin  ssh:notty  203.0.113.9   Sat Jul 11 03:14 - 03:14  (00:00)
# root   ssh:notty  198.51.100.2  Sat Jul 11 03:14 - 03:14  (00:00)
# test   ssh:notty  203.0.113.9   Sat Jul 11 03:13 - 03:13  (00:00)
```

`admin`·`test`·`root` 같은 흔한 이름으로 초 단위 연속 시도가 쌓여 있다면 **SSH 무차별 대입 공격**의 전형적 흔적입니다. 이게 보이면 `fail2ban` 설치, 비밀번호 로그인 비활성화(키 전용), SSH 포트 변경 등을 검토합니다.

---

## `lastlog` — 사용자별 마지막 로그인

`/var/log/lastlog`를 읽어 **모든 계정의 가장 최근 로그인 1회**를 표로 보여줍니다. `last`가 이력의 흐름이라면 `lastlog`는 계정별 스냅샷입니다.

```bash
lastlog              # 모든 계정의 마지막 로그인 (미접속 계정 포함)
lastlog -u zero      # 특정 사용자만
lastlog -b 30        # 30일 이상 로그인 안 한 계정 (before)
lastlog -t 7         # 최근 7일 안에 로그인한 계정만 (recent)
```

```bash
lastlog -u zero
# Username   Port   From        Latest
# zero       pts/0  10.0.0.5    Sat Jul 11 13:02:11 +0900 2026
```

`lastlog -b 30`은 **오래 안 쓰는 계정 정리**에 딱 맞습니다 — `**Never logged in**`으로 표시되는 계정이나 몇 달째 잠잠한 계정을 골라내 잠글 수 있습니다. 계정을 잠그거나 지우는 실제 방법은 [사용자·그룹 관리](/posts/linux/2026-07-11-user-account-management/)를 보세요.

---

## 최신 배포판의 변화 — utmp/wtmp의 퇴역

여기가 이 글에서 가장 중요한 정직 구간입니다.

> **최신 배포판에서는 전통적 utmp/wtmp가 사라지고 있습니다.** util-linux 2.40+(예: **Fedora 40 이후**)는 y2038 문제(32비트 타임스탬프)와 systemd로의 이행을 이유로 utmp를 폐지하는 방향으로 갑니다. 그런 시스템에서는 `last`가 **텅 비어 나오고**, `who`·`w`도 정보가 부실할 수 있습니다. 대신 `journalctl`·`loginctl`·`lastlog2`(wtmpdb)를 봐야 합니다.
{: .prompt-warning }

다만 **아직 대다수 프로덕션 서버(Rocky Linux, Ubuntu LTS 등)는 전통 방식이 그대로 유효**합니다. 위 도구들이 정상 동작하는 시스템이 여전히 훨씬 많습니다. 그러니 두 가지를 다 알아두는 게 맞습니다.

### systemd 대안 — journalctl·loginctl

utmp/wtmp가 비어 있거나 systemd 기반 감사가 필요하면 이쪽을 봅니다.

```bash
loginctl list-sessions        # 현재 세션 (who 대체)
loginctl list-users           # 로그인한 사용자
loginctl session-status 3     # 특정 세션 상세

journalctl _COMM=sshd         # sshd가 남긴 로그 = SSH 로그인 감사
journalctl -u ssh             # ssh 서비스 유닛 로그 (Debian은 ssh, RHEL은 sshd)
journalctl _COMM=sshd | grep "Accepted"   # 성공한 SSH 로그인만
journalctl _COMM=sshd | grep "Failed"     # 실패한 시도 (lastb 대체)
```

새 `lastlog2`(wtmpdb, SQLite 기반)는 폐지된 `lastlog`를 대체하는 도구로, 데이터를 텍스트 회계 파일 대신 DB에 담습니다.

`journalctl` 자체의 필터·시간 범위·영속화 설정 등 로그 수집 시스템 전반은 [syslog·journald 로깅](/posts/linux/2026-07-11-syslog-journald-logging/)에서 따로 정리했습니다.

---

## 보안 각도 — 인증 로그는 텍스트로도 남는다

바이너리 회계 파일과 별개로, **인증 이벤트는 텍스트 로그로도** 기록됩니다. 이쪽은 `grep`·`awk`로 바로 파싱할 수 있어 실전 분석에 더 편할 때가 많습니다.

| 배포판 | 인증 로그 파일 |
|---|---|
| Debian/Ubuntu | `/var/log/auth.log` |
| RHEL/Rocky/Fedora | `/var/log/secure` |

```bash
# 성공한 SSH 로그인
sudo grep "Accepted" /var/log/auth.log        # Debian
sudo grep "Accepted" /var/log/secure          # RHEL

# 실패한 시도 + 출처 IP 집계 (공격 IP 상위 랭킹)
sudo grep "Failed password" /var/log/auth.log \
  | grep -oE "[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+" \
  | sort | uniq -c | sort -rn | head
```

`lastb`가 보여주는 실패 이력과, `auth.log`/`secure`의 텍스트 로그는 서로를 보완합니다. 무차별 대입이 의심되면 두 곳을 교차 확인하세요.

---

## 실전 흐름

침입이 의심될 때의 빠른 점검 순서:

```bash
# 1) 지금 누가 붙어 있나 (모르는 세션이 있나?)
w

# 2) 최근 성공한 로그인 이력 (이상한 IP·시각?)
last -n 30 -a

# 3) 실패한 로그인 = 무차별 대입 흔적
sudo lastb -n 30 -i

# 4) 오래 안 쓰던 계정이 갑자기 로그인했나
lastlog -t 1

# 5) systemd 시스템이면 SSH 인증 로그 교차 확인
journalctl _COMM=sshd | grep -E "Accepted|Failed"
```

---

## 대중성·대안

- `who`/`w`/`last`/`lastlog`/`users` — **매우 주류**. 수십 년간 리눅스·유닉스 표준(`coreutils`·`util-linux`·`shadow-utils`)이라 어느 서버에나 있고, 서버 감사의 기본기입니다.
- `lastb` — 표준이지만 btmp가 root 전용이라 `sudo` 필요. 무차별 대입 탐지의 1차 도구.
- **journalctl / loginctl** — systemd 진영의 후계자. **최신 배포판(Fedora 40+)에서는 이쪽이 사실상 필수**가 되어 가고, 전통 도구가 비어 나오면 여기로 넘어갑니다. 아직 서버 주류(Rocky/Ubuntu LTS)는 전통 도구가 유효.
- **lastlog2 (wtmpdb)** — 폐지되는 `lastlog`의 SQLite 기반 대체. y2038 대응이 이유. 아직 도입 초기.
- **auditd** — 더 무거운 커널 수준 감사 프레임워크. 로그인만이 아니라 파일 접근·시스템콜까지 규정 준수(compliance) 수준으로 추적할 때. 규모·규제가 커질 때의 다음 단계.

결론: 지금 대다수 서버라면 현재 접속은 `w`, 이력은 `last -a`, 공격 흔적은 `sudo lastb`, 계정별 마지막은 `lastlog` 네 가지로 충분합니다. 다만 최신 배포판을 만나 `last`가 비어 나오면 당황하지 말고 `journalctl _COMM=sshd`·`loginctl`로 넘어가면 됩니다 — utmp/wtmp는 지금 systemd로 세대교체 중입니다.
