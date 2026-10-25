---
title       : "리눅스 로드맵 — 서버 운영의 핵심 영역과 관계"
description : "리눅스 서버 운영을 접속·관측·계정과 권한·서비스·로그·네트워크의 관계로 정리하고, 필요한 문서로 연결하는 로드맵."
date        : 2026-07-11 18:00:00 +0900
updated     : 2026-10-25 20:30:00 +0900
categories  : [linux, "개요·인덱스"]
tags        : [roadmap, linux, server, sysadmin]
pin         : false
hidden      : false
---

이 로드맵은 **리눅스 서버 운영의 핵심 영역과 그 관계**를 보여준다. 접속·관측·권한·서비스·로그·네트워크는 서로 다른 책임을 가진 영역이며, 반드시 한 순서로 끝내야 하는 단계는 아니다. 서버를 처음 다룬다면 접속과 관측부터 시작하고, 실제 문제에 따라 필요한 영역으로 이동하면 된다.

## 전체 개념지도

```text
Linux 서버 운영
├─ 실행·자원 ── Process / Scheduler / Memory / Filesystem
├─ 신원·보호 ── User / Group / Permission / PAM / MAC
├─ 서비스 ── Init / Service Manager / Lifecycle
├─ 통신·접근 ── Network / Socket / DNS / Firewall / SSH
└─ 관측·복구 ── Metrics / Logs / Audit / Package / Backup

서비스 운영 ↔ 실행 자원·권한·네트워크
장애 진단 ↔ 관측·로그·복구
```

## 핵심 개념과 관계

### 실행 자원과 서비스

Linux Kernel은 프로세스·메모리·파일시스템·네트워크 등 자원을 관리한다. 서비스 관리자는 프로세스의 시작·종료·재시작 정책을 다루며, systemd는 대표적인 구현이다. CPU·메모리·디스크·프로세스 관측은 서비스 동작을 이해하는 수단이지 서비스보다 뒤에 오는 필수 단계가 아니다.

### 신원·권한·보안

User·Group과 파일 권한은 접근 제어의 기본 축이다. `sudo`는 권한 상승, PAM은 인증 관련 정책과 모듈 통합, SELinux 등 MAC은 별도의 강제 접근 제어를 다룬다. 서로 같은 기능의 발전 단계가 아니다.

### 통신과 관측·복구

네트워크 주소·라우팅·DNS·Socket은 통신 경로를, 방화벽은 허용되는 트래픽을 제어한다. SSH는 원격 관리에 활용된다. Metrics·Log·Audit는 서로 다른 관측 자료이며, 패키지 업데이트·백업·복원은 장애 예방과 복구의 운영 책임이다.

```text
서비스 이상
├─ 실행·자원 ── Process / CPU / Memory / Storage
├─ 접근 제어 ── User / Permission / PAM / MAC
├─ 통신 경로 ── Address / Route / DNS / Socket / Firewall
└─ 관측·복구 ── Metrics / Journal / Audit / Backup
```

## 필요한 경우 더 깊이 살펴보기

현재 블로그에서는 [프로세스 관측](./2026-08-26-top-htop-btop-system-monitoring.md), [파일시스템·디스크](./2026-07-11-filesystem-disk-management.md), [계정 관리](./2026-07-11-user-account-management.md), [systemd](./2026-07-11-systemd-service-management.md), [로그](./2026-07-11-syslog-journald-logging.md), [네트워크](./2026-07-11-network-basics-ip-ss.md), [방화벽](./2026-07-11-firewalld-ufw-basics.md), [SSH](./2026-07-11-ssh-server-access-hardening.md) 등을 다룬다. Scheduler·Virtual Memory·백업·SELinux 같은 개념은 별도 글이 없어도 전체 지도에서 제외하지 않는다.

셸 언어와 스크립트는 [Shell](../shell/2026-07-03-shell-roadmap.md), 터미널 작업공간은 [tmux](../tmux/2026-06-16-tmux-roadmap.md)에서 다룬다.
