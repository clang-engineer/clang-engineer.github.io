---
title       : "리눅스 로그는 어디에 쌓이나: syslog(rsyslog)와 journald"
description : "로그가 생성·수집·저장되는 두 체계 — 전통적 syslog(rsyslog)와 systemd journald가 어떻게 공존하는지, /var/log 구조와 facility·priority, logger로 직접 남기기, journalctl 실전 조회·영속화까지."
date        : 2026-07-11 15:00:00 +0900
updated     : 2026-07-11 15:00:00 +0900
categories  : [linux, "시스템 관리"]
tags        : [logging, syslog, rsyslog, journald, journalctl]
pin         : false
hidden      : false
---

서비스가 죽었을 때 가장 먼저 보는 게 로그입니다. 그런데 "로그가 어디 있어요?"라는 질문에 답하려면 먼저 로그가 **어떻게 수집되고 어디에 저장되는지**를 알아야 합니다. `/var/log/messages`인지 `/var/log/syslog`인지 배포판마다 다르고, 요즘은 `journalctl`로 봐야 하는 로그가 따로 있으며, 어떤 로그는 재부팅하면 사라집니다. 이 셋이 다 다른 이유가 있습니다.

이 글은 리눅스 로그를 **생성·수집·저장하는 두 체계** — 전통적 **syslog**(요즘 구현체는 대부분 **rsyslog**)와 systemd의 **journald** — 가 무엇이고 어떻게 공존하는지, 그리고 실전에서 `journalctl`로 어떻게 뒤지는지를 정리합니다.

> 로그 파일이 **커지지 않게 회전·압축·삭제**하는 건 별도 주제입니다 — [logrotate로 로그 관리하기](/posts/linux/2025-02-19-logrotate/)에서 다룹니다. "누가 언제 로그인했나" 같은 **로그인 기록 감사**(utmp/wtmp)도 [로그인 기록 추적하기](/posts/linux/2026-07-11-login-records-utmp-wtmp/)로 따로 뺐습니다. 이 글은 그 앞단, 로그가 애초에 어디서 만들어져 어디로 흘러가는지에 집중합니다.
{: .prompt-info }

---

## 두 체계가 공존한다

리눅스 로그를 헷갈리게 만드는 근본 원인은 **로그 수집기가 하나가 아니라는 것**입니다. 지금 대부분의 배포판에는 두 체계가 동시에 돌아갑니다.

| 체계 | 정체 | 저장 위치 | 조회 |
|---|---|---|---|
| **syslog** (rsyslog) | 전통적 로그 프로토콜·데몬. 과거 `syslogd` → 지금은 **rsyslog**가 표준 구현 | `/var/log/*.log` 텍스트 파일 | `cat` / `tail -f` / `grep` |
| **journald** | systemd의 로그 데몬 (`systemd-journald`) | `/run/log/journal` 또는 `/var/log/journal` **바이너리** | `journalctl` |

두 체계는 경쟁이 아니라 대개 **직렬로 연결**됩니다. 흔한 구조는 이렇습니다:

```
애플리케이션 / 커널
      │  (로그 발생)
      ▼
systemd-journald   ← 먼저 여기서 받음 (구조화 저장)
      │  forward
      ▼
rsyslog            ← 전달받아 /var/log 텍스트 파일로도 남김
```

journald가 먼저 모든 로그를 받아 구조화된 바이너리로 저장하고, 그걸 rsyslog로 **전달(forward)**해서 `/var/log`에 예전 방식대로 텍스트 파일로도 남깁니다. 그래서 같은 로그를 `journalctl`로도, `tail -f /var/log/messages`로도 볼 수 있는 경우가 많습니다. 어느 쪽을 봐도 되지만, 각자 강점이 다릅니다(뒤에서 정리).

---

## `/var/log` 구조 — 배포판마다 이름이 다르다

텍스트 로그(rsyslog가 쓰는)의 위치와 이름이 **RHEL 계열과 Debian 계열에서 다릅니다.** "종합 로그"와 "인증 로그"의 파일명이 특히 자주 헷갈립니다.

| 용도 | RHEL/Rocky/Fedora | Debian/Ubuntu |
|---|---|---|
| **종합 로그** (시스템 전반) | `/var/log/messages` | `/var/log/syslog` |
| **인증·보안** (로그인·sudo·ssh) | `/var/log/secure` | `/var/log/auth.log` |
| cron | `/var/log/cron` | `/var/log/syslog`에 섞임 |
| 메일 | `/var/log/maillog` | `/var/log/mail.log` |
| 커널 링 버퍼 | `dmesg` / `journalctl -k` | 동일 |
| 부팅 | `/var/log/boot.log` | `journalctl -b` |

정리하면: **RHEL은 `messages`·`secure`, Debian은 `syslog`·`auth.log`**. 낯선 서버에서 "종합 로그 어디야?"를 빨리 판단하려면 이 대응만 기억하면 됩니다.

```bash
tail -f /var/log/messages     # RHEL 계열 실시간 보기
tail -f /var/log/syslog       # Debian 계열
sudo tail -f /var/log/secure  # RHEL 인증 로그 (ssh 로그인 시도 등)
```

커널 메시지는 파일이 아니라 **커널 링 버퍼**에 있어서 `dmesg`로 봅니다(부팅·하드웨어·드라이버 메시지). journald는 이걸 `journalctl -k`로도 보여줍니다.

---

## facility · priority — 로그를 분류하는 두 축

rsyslog가 "이 로그를 어느 파일에 넣을지" 정하는 기준이 바로 이 두 값입니다. syslog 프로토콜의 핵심 개념이라 알아두면 설정 파일이 읽힙니다.

**facility(설비)** — 로그를 *어디서* 냈는가:

| facility | 의미 |
|---|---|
| `auth` / `authpriv` | 인증·보안 (로그인, sudo, ssh) |
| `cron` | cron 잡 |
| `daemon` | 일반 데몬 |
| `kern` | 커널 |
| `mail` | 메일 시스템 |
| `local0`~`local7` | **사용자 정의용** — 내 스크립트·앱이 자유롭게 쓰는 대역 |

**priority(severity)** — *얼마나* 심각한가 (위로 갈수록 심각):

```
emerg  (0)  ← 가장 심각 (시스템 사용 불가)
alert  (1)
crit   (2)
err    (3)
warning(4)
notice (5)
info   (6)
debug  (7)  ← 가장 상세
```

rsyslog 규칙은 `facility.priority  목적지` 형태로 씁니다. **지정한 priority 이상(더 심각한 것 포함)**이 매칭됩니다:

```conf
# /etc/rsyslog.conf 또는 /etc/rsyslog.d/*.conf
mail.*          /var/log/maillog      # mail facility 전부
authpriv.*      /var/log/secure       # 인증 로그를 secure로
cron.*          /var/log/cron         # cron 로그
*.err           /var/log/error.log    # 설비 불문, err 이상만 모아서
*.info;mail.none;authpriv.none  /var/log/messages   # info 이상, 단 mail·authpriv 제외
```

- `*`는 전부, `.none`은 그 facility를 **제외**한다는 뜻입니다.
- `mail.*`는 mail facility의 모든 priority, `*.err`는 모든 facility 중 err 이상.
- 규칙 파일은 `/etc/rsyslog.conf`(메인)와 **`/etc/rsyslog.d/`** (드롭인 조각)에 나뉩니다. 새 규칙은 `/etc/rsyslog.d/`에 조각 파일로 추가하는 게 관행입니다.

> 규칙을 고쳤으면 `sudo systemctl restart rsyslog`로 재적용합니다. 문법이 궁금하면 `rsyslogd -N1`로 설정을 검사할 수 있습니다.
{: .prompt-tip }

---

## `logger` — 셸·스크립트에서 syslog로 남기기

내 스크립트가 남기는 로그도 `echo >> myscript.log`로 파일에 직접 쓰는 대신 **syslog에 흘려보내면** rsyslog의 규칙·회전·중앙 전송을 그대로 탑니다. 그 도구가 `logger`입니다.

```bash
logger "간단한 메시지"                              # 기본 facility(user)로 기록
logger -t backup "야간 백업 시작"                   # -t 태그 (로그에 [backup]으로 표시)
logger -t backup -p local0.info "백업 완료: 42GB"   # -p facility.priority 지정
logger -p local0.err "백업 실패 — 디스크 부족"       # 에러 레벨
```

**스크립트 로깅 실전** — 표준 에러가 아니라 syslog로 남기면 어디서 돌든 중앙에서 조회됩니다:

```bash
#!/bin/bash
TAG="nightly-backup"
log() { logger -t "$TAG" -p local0.info "$1"; }

log "시작"
if rsync -a /data /backup; then
  log "성공"
else
  logger -t "$TAG" -p local0.err "실패 (exit=$?)"
fi
```

이렇게 남긴 로그는 `journalctl -t nightly-backup`으로 태그별로, 또는 rsyslog 규칙에 `local0.* /var/log/backup.log`를 넣어 전용 파일로 뺄 수 있습니다. `local0`~`local7`이 바로 이런 사용자 로그를 위해 비워둔 대역입니다.

---

## `journalctl` — journald 로그 조회 실전

journald 로그는 바이너리라 `cat`으로 못 봅니다. 전용 도구 `journalctl`로 조회하는데, 필터가 강력해서 여기가 사실상 실무의 핵심입니다.

### 기본 탐색

```bash
journalctl              # 전체 (오래된 것부터, pager로)
journalctl -e           # 바로 끝(최신)으로 점프
journalctl -f           # follow — tail -f 처럼 실시간 추적
journalctl -r           # 역순 (최신이 위로)
journalctl -n 50        # 마지막 50줄
```

### 유닛·부팅별로 좁히기

```bash
journalctl -u nginx             # nginx 유닛 로그만
journalctl -u nginx -f          # nginx 실시간 추적 (가장 자주 씀)
journalctl -b                   # 이번 부팅 이후
journalctl -b -1                # 직전 부팅 (지난번 크래시 원인 추적)
journalctl --list-boots         # 부팅 목록과 인덱스
```

`-u`(유닛별)와 `-b`(부팅별)가 journald가 텍스트 로그보다 확실히 편한 지점입니다. "nginx가 지난 재부팅 전에 뭐라고 남겼나"를 한 줄로 뽑습니다.

### 시간·우선순위로 좁히기

```bash
journalctl --since "1 hour ago"                  # 최근 1시간
journalctl --since "2026-07-11 09:00"            # 특정 시각 이후
journalctl --since today --until "12:00"         # 오늘 정오까지
journalctl -p err                                # err 이상만 (경고 이하 숨김)
journalctl -p err -b                             # 이번 부팅의 에러만
journalctl -k                                    # 커널 메시지 (dmesg 상당)
```

`-p err`는 priority 개념 그대로입니다 — 지정 레벨 **이상(더 심각한 것 포함)**만 보여줍니다. "에러만 빨리 보자"는 `journalctl -p err -b`가 정석.

### 필드로 정밀 필터

journald는 각 로그를 **구조화 필드**로 저장해서, 텍스트 grep보다 정확하게 거를 수 있습니다.

```bash
journalctl _PID=1234              # 특정 PID가 남긴 로그
journalctl _COMM=sshd             # 실행파일명이 sshd인 프로세스
journalctl _UID=1000              # 특정 사용자
journalctl -t nightly-backup      # logger로 남긴 태그별
journalctl -u nginx --since today -p warning   # 조건 조합
```

`_PID`·`_COMM`·`_UID` 같은 필드는 로그 내용을 정규식으로 파싱하는 게 아니라 **메타데이터로 직접 매칭**합니다. 이게 rsyslog 텍스트 파일 대비 journald의 구조적 강점입니다.

### 디스크 사용량·정리

```bash
journalctl --disk-usage           # 저널이 차지하는 용량
sudo journalctl --vacuum-time=7d  # 7일보다 오래된 로그 삭제
sudo journalctl --vacuum-size=500M # 총 용량 500M 넘는 오래된 것부터 삭제
```

journald는 자체적으로 용량 상한을 관리합니다(logrotate가 관여하지 않음). 텍스트 로그의 회전은 logrotate, **저널의 정리는 `--vacuum-*`**로 갈린다는 점을 기억하세요.

---

## journald 영속화 — 재부팅하면 사라지는 함정

journald의 흔한 함정: 기본 설정에서 저널이 **휘발성**일 수 있습니다. 저장 위치가 `/run/log/journal`(tmpfs, 메모리)이면 **재부팅 시 로그가 통째로 날아갑니다.** `journalctl -b -1`로 직전 부팅 로그를 봤는데 아무것도 없다면 이게 원인입니다.

`Storage` 설정을 확인하고 영속으로 바꿉니다:

```bash
# /etc/systemd/journald.conf
[Journal]
Storage=persistent     # auto → persistent
```

`Storage` 값의 의미:

| 값 | 동작 |
|---|---|
| `auto` (기본) | `/var/log/journal`이 **존재하면** 영속, 없으면 `/run`(휘발성) |
| `persistent` | 항상 `/var/log/journal`에 영속. 디렉토리 없으면 만들어 씀 |
| `volatile` | 항상 `/run`(메모리)만. 재부팅 시 소실 |

`auto`가 기본이라, 디렉토리를 만들어주면 그것만으로 영속화되기도 합니다:

```bash
sudo mkdir -p /var/log/journal
sudo systemctl restart systemd-journald   # 또는 systemd-journald 재시작
journalctl --disk-usage                    # /var/log/journal 아래로 잡히면 성공
```

> 영속화하면 재부팅 후에도 로그가 남지만 디스크를 먹습니다. `journald.conf`의 `SystemMaxUse=`(예: `1G`)로 상한을 걸어두는 게 안전합니다.
{: .prompt-warning }

---

## rsyslog vs journald — 언제 무엇을

둘 다 도는 시스템에서 "어느 쪽을 봐야 하나"의 판단 기준입니다.

| 상황 | 더 나은 쪽 |
|---|---|
| 특정 유닛·부팅·PID 로그를 로컬에서 뒤질 때 | **journald** (`-u`·`-b`·`_PID` 필터가 강력) |
| err 이상만, 최근 1시간만 등 조건 조회 | **journald** (`-p`·`--since` 조합) |
| `grep`·`awk` 등 기존 텍스트 도구로 파이프 | **rsyslog** (`/var/log/*` 평문) |
| **원격·중앙 로그 서버로 전송** | **rsyslog** (journald는 전송 기능 약함) |
| 오래된 스크립트·모니터링이 특정 로그 파일 경로에 의존 | **rsyslog** |

한 줄 요약: **로컬에서 빠르게 뒤질 땐 journald, 텍스트 파일·원격 전송·기존 도구 호환은 rsyslog.** 실무에선 둘을 병행하고, 그래서 요즘 배포판이 journald→rsyslog forward 구조로 나옵니다.

---

## 원격·중앙 로깅 (범위 밖, 짧게)

서버가 여러 대로 늘면 각 머신에 흩어진 로그를 한곳에 모으고 싶어집니다. 이건 이 글의 범위를 넘지만 방향만:

```conf
# /etc/rsyslog.conf — 로그를 원격 서버로 전송
*.*  @@logserver.example.com:514    # @@ = TCP, @ = UDP
```

rsyslog의 원격 전송(`@@host:514`)이 전통적 방법이고, 요즘은 여기서 한 걸음 더 나아가 **Loki**(+ Grafana)나 **ELK/OpenSearch** 같은 로그 수집 스택으로 넘어갑니다. 검색·시각화·알림까지 붙는 별개의 세계라 그쪽으로 갈 시점이면 전용 스택을 검토하는 게 맞습니다.

---

## 대중성·대안

- **rsyslog** — syslog 구현의 **사실상 표준**. 대부분의 RHEL·Debian 계열에 기본 탑재. 과거 `syslogd`·`sysklogd`를 대체했고, `syslog-ng`가 경쟁 구현이지만 소수파입니다.
- **journald** — systemd에 내장이라 systemd를 쓰는 모든 현대 배포판에 이미 있습니다. 로컬 조회·구조화·유닛 연동에서 확실한 주류. 다만 원격 전송은 약해서 rsyslog를 대체하지 못하고 **공존**합니다.
- **syslog-ng** — rsyslog의 대안 구현. 설정이 더 깔끔하다는 평이지만 점유율은 rsyslog가 압도적. 특별한 이유 없으면 rsyslog.
- **중앙 로깅 스택 (Loki / ELK)** — 여러 서버·컨테이너 로그를 모아 검색·시각화하는 다음 단계. 단일 서버엔 과합니다.

결론: 단일 서버라면 새로 깔 것 없습니다 — **로컬 조회는 `journalctl -u <유닛> -f` / `journalctl -p err -b`**, **텍스트로 grep하거나 원격 보낼 땐 rsyslog와 `/var/log`**, 스크립트 로그는 `logger -t`로 syslog에 흘려보내면 됩니다. 저널이 재부팅에 사라진다면 `Storage=persistent`부터 확인하세요.
