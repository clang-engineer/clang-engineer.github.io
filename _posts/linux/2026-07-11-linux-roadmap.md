---
title       : "리눅스 로드맵 — 서버 운영의 핵심 영역과 관계"
description : "리눅스 서버 운영을 접속·관측·계정과 권한·서비스·로그·네트워크의 관계로 정리하고, 필요한 문서로 연결하는 로드맵."
date        : 2026-07-11 18:00:00 +0900
updated     : 2026-10-25 18:30:00 +0900
categories  : [linux, "개요·인덱스"]
tags        : [roadmap, linux, server, sysadmin]
pin         : false
hidden      : false
---

이 로드맵은 **리눅스 서버 운영의 핵심 영역과 그 관계**를 보여준다. 접속·관측·권한·서비스·로그·네트워크는 서로 다른 책임을 가진 영역이며, 반드시 한 순서로 끝내야 하는 단계는 아니다. 서버를 처음 다룬다면 접속과 관측부터 시작하고, 실제 문제에 따라 필요한 영역으로 이동하면 된다.

## 전체 지도

```text
Linux 서버 운영 — 개념군
├─ 실행·자원
│  ├─ Process / Scheduler / Signal
│  ├─ Virtual Memory / CPU·Memory 관측
│  └─ File System / Mount / Storage
├─ 신원·보호
│  ├─ User / Group / Permission / sudo
│  └─ Authentication(PAM) / MAC(SELinux 등)
├─ 서비스 생명주기
│  ├─ init·service manager (예: systemd)
│  └─ 시작 / 종료 / 재시작 / 예약 작업
├─ 통신·접근
│  ├─ Network / DNS / Socket / Firewall
│  └─ SSH 등 원격 관리
└─ 관측·복구
   ├─ Metrics / Log / Journal / Audit
   └─ Package / Update / Backup / Restore

횡단 관계: 서비스 ↔ 실행 자원·권한·네트워크
           장애 분석 ↔ 관측·로그·복구
```

아래 문서 순서는 **실제 서버를 운영할 때 선택할 수 있는 탐색 경로**다. 지도에 있는 Scheduler·Virtual Memory·Backup 같은 개념은 별도 글이 없어도 전체 구조에 필요하므로 유지한다. 기술적 의존성이나 필수 이수 순서를 의미하지 않는다. 셸 언어와 스크립팅은 [셸 로드맵](../shell/2026-07-03-shell-roadmap.md), 개발환경 설정은 [macOS 로드맵](../macos/2026-07-03-macos-roadmap.md) 등 관련 영역에서 다룬다.

## 시작 — 리눅스 박스에 들어가기

어떤 리눅스를 쓸지, 윈도우에서 어떻게 리눅스를 띄울지, 그리고 원격 서버라면 **SSH로 어떻게 안전하게 접속하는지**부터. 여기서 배포판 계열(Debian vs Red Hat)이 안 잡히면 뒤에서 `apt`인지 `dnf`인지, 방화벽이 `ufw`인지 `firewalld`인지 매번 헷갈린다.

| 글 | 핵심 |
|---|---|
| [Debian vs Red Hat 계열](./2024-03-23-debian-redhat.md) | Debian/Red Hat 계열의 Package·운영 차이를 잡는 진입점 |
| [Windows에서 Ubuntu 개발 환경 구축하기](./2025-01-25-ubuntu-on-windows.md) | Windows에서 WSL2 기반 Linux 환경을 만드는 진입점 |
| [SSH 서버 접속과 하드닝: 키 인증, sshd_config](./2026-07-11-ssh-server-access-hardening.md) | SSH 접속과 Key 인증·sshd 기본 보안 경계 |

처음 서버를 살펴볼 때는 현재 상태를 관측하는 문서로 이어갈 수 있다.

## 1단계 — 시스템 관측

"서버가 떠 있나, 뭐가 자원을 먹나, 어떤 프로세스가 포트를 잡았나, 디스크는 안 찼나" — 운영의 첫 질문은 늘 관측이다. 문제를 고치기 전에 지금 상태를 정확히 보는 단계.

| 글 | 핵심 |
|---|---|
| [프로세스 찾고 종료하기: pgrep, pkill, pidof, lsof, kill](./2026-06-16-process-find-and-kill.md) | Process를 이름·포트·Signal 기준으로 찾고 다루기 |
| [top, htop, btop으로 Linux CPU·메모리·프로세스 확인하기](./2026-08-26-top-htop-btop-system-monitoring.md) | CPU·Memory·Load·Process를 실시간으로 관측하기 |
| [디스크 꽉 찼을 때: df, du, lsof로 범인 찾기 + mount·fstab](./2026-07-11-filesystem-disk-management.md) | Disk 사용량·열린 파일·Mount 문제를 추적하기 |

관측 결과와 함께 실행 계정과 접근 권한을 확인해야 할 때는 다음 문서를 참고한다.

## 2단계 — 계정과 권한

다중 사용자 운영의 핵심이자, 초보가 가장 자주 사고를 내는 영역. 사용자를 만들고, 권한을 정확히 주고(과하지도 모자라지도 않게), 비밀번호 정책을 강제하는 데까지. 이 단계가 리눅스 운영의 무게중심이다.

| 글 | 핵심 |
|---|---|
| [리눅스 사용자·그룹 관리: useradd, usermod, sudo](./2026-07-11-user-account-management.md) | User·Group·sudo의 기본 계정 관리 흐름 |
| [su vs sudo, 그리고 wheel 그룹 — 권한 상승 제대로](./2026-07-11-sudo-su-wheel.md) | su·sudo·wheel과 권한 상승 경계 |
| [특수 권한 비트: SUID, SGID, Sticky Bit](./2026-07-11-special-permission-bits-suid-sgid-sticky.md) | SUID·SGID·Sticky Bit의 역할과 보안 의미 |
| [비밀번호 정책과 PAM: 만료·최소 길이·복잡도·잠금](./2026-07-11-password-policy-pam.md) | 비밀번호 정책과 PAM 인증 흐름의 기본 구조 |

애플리케이션을 상시 실행하거나 부팅 시 자동으로 시작하려면 서비스 관리가 필요하다.

## 3단계 — 서비스

서버 운영에서는 프로그램을 직접 실행하는 것보다 누가 시작하고, 실패하면 어떻게 다시 띄우고, 부팅 후 어떻게 복구할지가 중요하다. Linux에서는 systemd가 이 실행 생명주기의 중심에 있다.

| 글 | 핵심 |
|---|---|
| [systemd 서비스 관리: systemctl, 유닛 파일, 부팅 등록과 타이머](./2026-07-11-systemd-service-management.md) | systemd Unit·start/enable·journal·timer의 서비스 운영 흐름 |

로그는 서비스 실행 전후 모두에서 관측과 진단에 활용된다.

## 4단계 — 로그

문제는 늘 사후에 온다. 로그는 세 축으로 나뉜다 — **어디에 쌓이나**(수집), **누가 접속했나**(감사), **어떻게 오래 보관하나**(회전). 이 셋을 구분해야 "로그를 본다"가 막연함에서 벗어난다.

| 글 | 핵심 |
|---|---|
| [리눅스 로그는 어디에 쌓이나: syslog와 journald](./2026-07-11-syslog-journald-logging.md) | journald·syslog daemon·Application log의 수집 경로 구분 |
| [로그인 기록 추적하기: who, w, last, lastlog, utmp/wtmp/btmp](./2026-07-11-login-records-utmp-wtmp.md) | 현재·과거 로그인 기록을 감사하는 도구와 데이터 |
| [logrotate 설정](./2025-02-19-logrotate.md) | 로그 회전·압축·보관의 운영 역할 |

여기까지가 서버에 접속하고, 관측하고, 계정·권한을 다루고, 서비스를 띄우고, 로그를 읽는 운영의 한 바퀴다.

### 이 줄기가 아직 다루지 않는 것 (이 블로그 기준)

서버 운영의 흔한 전제이지만 아직 전용 글이 없어 비워 둔 것들. 학습하다 부딪히면 다른 자료로 채워야 한다는 표시다.

- **예약 작업** — `cron`/`crontab`과 systemd 타이머. 타이머는 3단계에서 스쳤지만 cron 본론(문법·로그 확인)은 비어 있다.
- **패키지 관리 심화** — `dnf`/`apt`의 저장소 관리·검색·업데이트. 배포판 비교 글이 차이만 짚을 뿐, 실제 관리 흐름은 아직 없다.
- **백업·동기화** — `rsync`/`tar`로 파일을 옮기고 백업하기. 본문에 스칠 뿐 전용 글이 없다.
- **SELinux 입문** — RHEL/Rocky의 강제 접근 제어. 방화벽처럼 서버 보안 축인데 아직 비어 있다.

---

## 부록 A — 네트워크 (독립 운영 영역)

네트워크는 서버 운영의 핵심 영역이지만, 이 문서에서는 별도 진단·접근 제어 관점으로 묶는다. 먼저 진단(무엇이 어디에 연결됐나)을 잡고, 그다음 방화벽으로 잠근다.

| 글 | 핵심 |
|---|---|
| [리눅스 네트워크 기초: ip, ss로 갈아타기 + DNS 진단](./2026-07-11-network-basics-ip-ss.md) | IP·Port·Route·DNS를 기준으로 통신 문제를 진단하기 |
| [리눅스 방화벽 기초: firewalld와 ufw, 그리고 nftables](./2026-07-11-firewalld-ufw-basics.md) | firewalld·ufw와 하위 Firewall 계층의 역할 구분 |


---

리눅스를 운영 관점으로 익히려는 사람은 이렇게 읽으면 된다:

- **서버를 처음 맡았다면** 시작에서 배포판 감을 잡고 SSH로 접속하는 법부터, 1단계 관측으로 지금 상태를 보는 데까지.
- **다중 사용자·권한이 고민이면** 2단계가 무게중심이다. 사용자 관리 → sudo → 특수 비트 → PAM 순서로.
- **내 앱을 상시 돌려야 하면** 3단계 systemd로 서비스를 만들고, **장애·보안을 되짚어야 하면** 4단계 로그 3부작(수집·감사·회전)으로.

그다음은 상황별로 — 통신이 안 되거나 외부 노출이 생기면 부록 A 네트워크(진단·방화벽), 특수 환경이면 관련 문서를 추가로 찾아본다. 셸에서 스크립트를 직접 짜는 축은 [셸 로드맵](../shell/2026-07-03-shell-roadmap.md), 터미널 세션·창 관리는 [tmux 로드맵](../tmux/2026-06-16-tmux-roadmap.md)과 함께 보면 리눅스를 다루는 손이 한 번에 넓어진다.
