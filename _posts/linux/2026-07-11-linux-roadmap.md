---
title       : "리눅스 로드맵 — 접속하고, 관측하고, 계정·권한을 다루고, 서비스를 띄우고, 로그를 읽는 순서"
description : "리눅스 박스에 들어가(배포판·SSH) → 시스템을 관측하고(프로세스·모니터링·디스크) → 계정과 권한을 다루고(사용자·sudo·특수 비트·PAM) → 서비스를 띄우고(systemd) → 로그로 무슨 일이 있었는지 읽는(syslog·로그인 기록·회전) 데까지. 서버를 '운영'하는 관점으로 이 블로그의 리눅스 글을 큐레이션. 네트워크·방화벽은 부록으로, 셸 스크립트·데스크톱 환경은 결이 다른 축이라 별도 로드맵으로 링크."
date        : 2026-07-11 18:00:00 +0900
updated     : 2026-08-30 19:00:00 +0900
categories  : [linux, "개요·인덱스"]
tags        : [roadmap, linux, server, sysadmin]
pin         : false
hidden      : false
---

리눅스는 명령어를 하나씩 외우면 늘 것 같지만, 실제로는 "서버 한 대를 운영한다"는 관점이 잡혀야 흩어진 명령이 제자리를 찾는다. 이 로드맵의 목표는 그 관점 — **리눅스 박스에 들어가서, 시스템을 들여다보고, 계정과 권한을 다루고, 무슨 일이 있었는지 로그로 읽는** 한 줄기다. 본인 위치에서 가까운 단계부터 들어오면 된다.

이 로드맵은 **서버·시스템 운영**의 축이다. 셸 스크립트를 *배워 짜는* 축은 [셸 로드맵](/posts/shell/2026-07-03-shell-roadmap/), 데스크톱을 개발환경으로 다듬는 축은 [macOS 로드맵](/posts/macos/2026-07-03-macos-roadmap/)으로 분리돼 있으니 결이 다르면 그쪽으로 가면 된다.

## 한눈에 보기

리눅스 박스에 들어가(시작) → 관측(1단계) → 계정·권한(2단계) → 서비스(3단계) → 로그(4단계) 순으로 "서버를 운영할 수 있게" 되는 줄기다.

| 구역 | 무엇을 다루나 | 성격 |
|---|---|---|
| 시작 | 리눅스 박스에 들어가기 — 배포판 고르기·WSL·SSH 접속 | 줄기 |
| 1단계 | 시스템 관측 — 프로세스·실시간 모니터링·디스크 | 줄기 |
| 2단계 | 계정과 권한 — 사용자·sudo·특수 비트·비밀번호 정책 | 줄기 |
| 3단계 | 서비스 — systemd로 앱을 띄우고 부팅에 걸기 | 줄기 |
| 4단계 | 로그 — 수집(syslog)·감사(로그인 기록)·회전(logrotate) | 줄기 |
| 부록 A | 네트워크 — 진단(ip·ss·DNS)·방화벽(firewalld·ufw) | 곁가지 |
| 부록 B | 특수 상황·트러블슈팅 — 폐쇄망 배포·chage 트랩 | 곁가지 |

## 시작 — 리눅스 박스에 들어가기

어떤 리눅스를 쓸지, 윈도우에서 어떻게 리눅스를 띄울지, 그리고 원격 서버라면 **SSH로 어떻게 안전하게 접속하는지**부터. 여기서 배포판 계열(Debian vs Red Hat)이 안 잡히면 뒤에서 `apt`인지 `dnf`인지, 방화벽이 `ufw`인지 `firewalld`인지 매번 헷갈린다.

| 글 | 핵심 |
|---|---|
| [Debian vs Red Hat 계열](/posts/linux/2024-03-23-debian-redhat/) | apt/dnf, .deb/.rpm, 릴리스 모델과 SELinux·방화벽 기본값까지 — 두 계열의 실질적 차이와 상황별 선택 기준. 이후 모든 글의 "내 배포판은 어느 쪽" 전제 |
| [Windows에서 Ubuntu 개발 환경 구축하기](/posts/linux/2025-01-25-ubuntu-on-windows/) | `wsl --install`로 WSL2+Ubuntu, Python·Node(nvm)·Docker 세팅. WSL1/2 차이까지 — 윈도우 사용자의 리눅스 진입로 |
| [SSH 서버 접속과 하드닝: 키 인증, sshd_config](/posts/linux/2026-07-11-ssh-server-access-hardening/) | `ssh`·`~/.ssh/config`·키 인증(`ssh-keygen`/`ssh-copy-id`)로 들어가고, `sshd_config`로 root 로그인·비번 인증을 잠근다. 권한 700/600 함정과 잠기지 않고 문 잠그는 순서까지 — 원격 서버를 다루는 문(門) |

배포판을 고르고 서버에 접속했으면, 이제 그 위에서 돌아가는 시스템을 들여다볼 차례다.

## 1단계 — 시스템 관측

"서버가 떠 있나, 뭐가 자원을 먹나, 어떤 프로세스가 포트를 잡았나, 디스크는 안 찼나" — 운영의 첫 질문은 늘 관측이다. 문제를 고치기 전에 지금 상태를 정확히 보는 단계.

| 글 | 핵심 |
|---|---|
| [프로세스 찾고 종료하기: pgrep, pkill, pidof, lsof, kill](/posts/linux/2026-06-16-process-find-and-kill/) | `ps aux \| grep` 대신 쓰는 표준 도구 — 이름·포트·시그널로 프로세스를 정확히 다루는 법. 운영에서 가장 자주 치는 명령들 |
| [top, htop, btop으로 Linux CPU·메모리·프로세스 확인하기](/posts/linux/2026-08-26-top-htop-btop-system-monitoring/) | load average·CPU 상태·VIRT/RES 해석부터 장애 대응 순서까지 |
| [디스크 꽉 찼을 때: df, du, lsof로 범인 찾기 + mount·fstab](/posts/linux/2026-07-11-filesystem-disk-management/) | `df`로 어느 파티션이 찼는지 → `du`로 범인 디렉토리 → 삭제해도 안 줄면 `lsof`로 열린 파일. inode 고갈·`mount`/`fstab`(UUID)·부팅 실패 방지까지 |

관측으로 "누가·무엇이" 돌아가는지 보이면, 다음은 "누가 무엇을 할 수 있는가" — 계정과 권한이다.

## 2단계 — 계정과 권한

다중 사용자 운영의 핵심이자, 초보가 가장 자주 사고를 내는 영역. 사용자를 만들고, 권한을 정확히 주고(과하지도 모자라지도 않게), 비밀번호 정책을 강제하는 데까지. 이 단계가 리눅스 운영의 무게중심이다.

| 글 | 핵심 |
|---|---|
| [리눅스 사용자·그룹 관리: useradd, usermod, sudo](/posts/linux/2026-07-11-user-account-management/) | 계정을 만들고(useradd) 고치고(usermod) 지우고(userdel), 그룹·sudo를 붙이는 표준 흐름. `/etc/passwd·shadow·group`이 실제로 무엇을 담는지, `-aG`의 지뢰까지. 이 단계의 줄기 |
| [su vs sudo, 그리고 wheel 그룹 — 권한 상승 제대로](/posts/linux/2026-07-11-sudo-su-wheel/) | su와 sudo의 근본 차이(대상 비번 vs 내 비번·감사 로그), `sudo -i`/`-s`, wheel 그룹, sudoers 문법과 `visudo`, `sudo -l`. 권한을 "정확히" 주는 법 |
| [특수 권한 비트: SUID, SGID, Sticky Bit](/posts/linux/2026-07-11-special-permission-bits-suid-sgid-sticky/) | passwd가 왜 일반 사용자로도 root 파일을 고치나(SUID), 공유 디렉토리의 그룹 상속(SGID), /tmp의 삭제 보호(sticky). `find -perm`로 SUID 감사까지 |
| [비밀번호 정책과 PAM: 만료·최소 길이·복잡도·잠금](/posts/linux/2026-07-11-password-policy-pam/) | "8자 이상·90일마다·5번 틀리면 잠금"을 실제로 강제하기 — login.defs·chage(만료), pam_pwquality(복잡도), pam_faillock(잠금). PAM을 안전하게 건드리는 authselect까지 |

> 계정을 막 만들었는데 `su`가 거부된다면 → [passwd 직후 su 인증 점검 순서](/posts/linux/2026-06-07-rocky-linux-chage-su-authentication-failure/). PAM 로그에서 시작해 잠금·만료·접근 정책·로그인 셸을 구분한다. (부록 B에도 실어 둠)
{: .prompt-tip }

계정과 권한이 잡혔으면, 이제 그 위에서 내 애플리케이션을 "서비스"로 띄울 차례다.

## 3단계 — 서비스

내 앱을 터미널에서 손으로 실행하는 걸 넘어, 부팅 시 자동으로 뜨고 죽으면 되살아나는 **서비스**로 만드는 단계. 리눅스에서 무언가를 상시 돌린다는 건 결국 systemd 유닛을 다루는 일이다.

| 글 | 핵심 |
|---|---|
| [systemd 서비스 관리: systemctl, 유닛 파일, 부팅 등록과 타이머](/posts/linux/2026-07-11-systemd-service-management/) | `systemctl start/enable/status`의 일상 명령과 enable≠start의 차이, 유닛 파일 작성과 `daemon-reload`, `journalctl -u`로 로그 보기, cron 대안인 타이머까지. 앱을 상시 서비스로 올리는 법 |

서비스를 띄웠으면, 그게 잘 도는지·무슨 일이 있었는지는 로그로 되짚는다.

## 4단계 — 로그

문제는 늘 사후에 온다. 로그는 세 축으로 나뉜다 — **어디에 쌓이나**(수집), **누가 접속했나**(감사), **어떻게 오래 보관하나**(회전). 이 셋을 구분해야 "로그를 본다"가 막연함에서 벗어난다.

| 글 | 핵심 |
|---|---|
| [리눅스 로그는 어디에 쌓이나: syslog와 journald](/posts/linux/2026-07-11-syslog-journald-logging/) | rsyslog와 journald의 공존 구조, `/var/log` 지형(messages vs syslog, secure vs auth.log), facility·priority, `logger`, `journalctl` 실전·영속화. 로그 수집·저장의 줄기 |
| [로그인 기록 추적하기: who, w, last, lastlog, utmp/wtmp/btmp](/posts/linux/2026-07-11-login-records-utmp-wtmp/) | 누가 지금/언제 접속했나 — 바이너리 계정 파일 4종과 조회 도구. `lastb`로 무차별 대입 흔적까지. 보안 감사의 각도 |
| [logrotate 설정](/posts/linux/2025-02-19-logrotate/) | 로그가 무한히 커지지 않게 회전·압축·보관·삭제. logback과의 분담 기준까지. 로그를 오래 다루는 축 |

여기까지가 서버에 접속하고, 관측하고, 계정·권한을 다루고, 서비스를 띄우고, 로그를 읽는 운영의 한 바퀴다.

### 이 줄기가 아직 다루지 않는 것 (이 블로그 기준)

서버 운영의 흔한 전제이지만 아직 전용 글이 없어 비워 둔 것들. 학습하다 부딪히면 다른 자료로 채워야 한다는 표시다.

- **예약 작업** — `cron`/`crontab`과 systemd 타이머. 타이머는 3단계에서 스쳤지만 cron 본론(문법·로그 확인)은 비어 있다.
- **패키지 관리 심화** — `dnf`/`apt`의 저장소 관리·검색·업데이트. 배포판 비교 글이 차이만 짚을 뿐, 실제 관리 흐름은 아직 없다.
- **백업·동기화** — `rsync`/`tar`로 파일을 옮기고 백업하기. 본문에 스칠 뿐 전용 글이 없다.
- **SELinux 입문** — RHEL/Rocky의 강제 접근 제어. 방화벽처럼 서버 보안 축인데 아직 비어 있다.

---

## 부록 A — 네트워크 (곁가지)

서버를 외부와 잇는 순간 반드시 마주치지만, 관측·계정·서비스 줄기와는 결이 다른 네트워크 축이라 부록으로 뺀다. 먼저 진단(무엇이 어디에 연결됐나)을 잡고, 그다음 방화벽으로 잠근다.

| 글 | 핵심 |
|---|---|
| [리눅스 네트워크 기초: ip, ss로 갈아타기 + DNS 진단](/posts/linux/2026-07-11-network-basics-ip-ss/) | 레거시 `ifconfig`/`netstat`에서 `ip`/`ss`로 갈아타기, LISTEN 포트·라우팅 확인, `/etc/hosts`·`resolv.conf`·`dig`로 DNS 진단. "서비스가 안 뜬 건지 방화벽이 막은 건지" 구분하는 순서 |
| [리눅스 방화벽 기초: firewalld와 ufw, 그리고 nftables](/posts/linux/2026-07-11-firewalld-ufw-basics/) | firewalld(zone·service·port·`--permanent` 함정) 중심, ufw(Debian) 대안, 그 아래 nftables/iptables 엔진까지. SSH 잠금 사고를 피하는 순서 포함 |

## 부록 B — 특수 상황·트러블슈팅 (곁가지)

평소엔 안 만나지만 특정 상황에서 직행하게 되는 글들.

| 글 | 핵심 |
|---|---|
| [폐쇄망 환경에서 서비스 운영을 위한 환경 구축](/posts/linux/2025-01-14-offline-runtime-enviroment/) | 외부에서 `dnf download --resolve`로 의존성까지 받아 내부망에서 rpm 설치. postgresql·java·nginx 사례. 인터넷 없는 서버를 다룰 때 |
| [passwd 직후 su 인증이 실패할 때 점검 순서](/posts/linux/2026-06-07-rocky-linux-chage-su-authentication-failure/) | PAM 로그, 계정 잠금, faillock, 만료, 접근 정책과 셸을 순서대로 좁힌다. `PASS_MIN_DAYS`가 인증을 막는다는 오해도 교정 |

---

리눅스를 운영 관점으로 익히려는 사람은 이렇게 읽으면 된다:

- **서버를 처음 맡았다면** 시작에서 배포판 감을 잡고 SSH로 접속하는 법부터, 1단계 관측으로 지금 상태를 보는 데까지.
- **다중 사용자·권한이 고민이면** 2단계가 무게중심이다. 사용자 관리 → sudo → 특수 비트 → PAM 순서로.
- **내 앱을 상시 돌려야 하면** 3단계 systemd로 서비스를 만들고, **장애·보안을 되짚어야 하면** 4단계 로그 3부작(수집·감사·회전)으로.

그다음은 상황별로 — 통신이 안 되거나 외부 노출이 생기면 부록 A 네트워크(진단·방화벽), 특수 환경이면 부록 B. 셸에서 스크립트를 직접 짜는 축은 [셸 로드맵](/posts/shell/2026-07-03-shell-roadmap/), 터미널 세션·창 관리는 [tmux 로드맵](/posts/tmux/2026-06-16-tmux-roadmap/)과 함께 보면 리눅스를 다루는 손이 한 번에 넓어진다.
