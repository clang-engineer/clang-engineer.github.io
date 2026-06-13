---
title       : Debian vs Red Hat 계열
description : >-
    패키지 매니저·일상 명령·릴리스 사이클 측면에서 두 계열의 실질적 차이
date        : 2024-06-09 22:50:30 +0900
updated     : 2026-06-13 10:00:00 +0900
categories  : [linux, "배포판·환경"]
tags        : [ubuntu]
pin         : false
hidden      : false
---

리눅스 배포판은 크게 두 계보 — Debian 계열과 Red Hat 계열 — 로 나뉜다. 커널은 같지만 패키지 형식, 명령어, 정책이 다르다.

## 한눈 비교

| 항목 | Debian 계열 | Red Hat 계열 |
|---|---|---|
| 패키지 매니저 | apt / apt-get (저수준: dpkg) | dnf / yum (저수준: rpm) |
| 패키지 확장자 | `.deb` | `.rpm` |
| 대표 배포판 | Debian, Ubuntu, Linux Mint | RHEL, Rocky Linux, AlmaLinux, Fedora |
| 릴리스 모델 | Debian: 안정성 우선 / Ubuntu LTS 5년 | RHEL: 메이저당 10년 / Fedora: 6개월 사이클 |
| 정책 | 커뮤니티 중심, 무료 | 상업 지원(레드햇) + 커뮤니티 클론(Rocky, Alma) |
| 기본 서비스 관리 | systemd | systemd |
| SELinux 기본 | 보통 비활성 | 기본 enforcing |
| 방화벽 도구 | ufw, iptables/nftables | firewalld |

CentOS는 Red Hat이 2020년에 CentOS Stream으로 모델을 바꾸면서 EOL됐고, 사실상 그 자리를 Rocky Linux/AlmaLinux가 채웠다.

## 일상 명령 매핑

| 작업 | Debian | Red Hat |
|---|---|---|
| 패키지 목록 갱신 | `apt update` | `dnf check-update` |
| 패키지 설치 | `apt install pkg` | `dnf install pkg` |
| 패키지 제거 | `apt remove pkg` | `dnf remove pkg` |
| 검색 | `apt search keyword` | `dnf search keyword` |
| 설치된 파일 확인 | `dpkg -L pkg` | `rpm -ql pkg` |
| 파일 → 패키지 추적 | `dpkg -S /path` | `rpm -qf /path` |
| 시스템 업그레이드 | `apt upgrade` | `dnf upgrade` |
| 캐시 정리 | `apt clean` | `dnf clean all` |

## 어떤 걸 고를까

- **개인 데스크탑/개발 환경**: Ubuntu LTS가 무난. 패키지 폭이 가장 넓고 자료가 많음
- **회사 운영 서버**: RHEL 라이센스가 있으면 RHEL, 무료면 Rocky/Alma (RHEL 바이너리 호환)
- **컨테이너 베이스 이미지**: Alpine이나 Debian-slim이 작아서 자주 쓰임. RHEL UBI도 옵션
- **엣지/IoT**: Debian이 아키텍처 폭이 넓음 (ARM 32/64bit 등)

기업 운영팀이 익숙한 쪽이 결국 정답이라, "이미 쓰는 거"가 최우선 기준이다.

## UNIX vs Linux

가끔 같이 묻는 개념이라 짧게.

| 항목 | UNIX | Linux |
|---|---|---|
| 기원 | AT&T 벨 연구소, 1969 | Linus Torvalds, 1991 |
| 라이센스 | 상용(AIX, Solaris, HP-UX) / 일부 무료(BSD 계열) | GPL (오픈소스) |
| 소스 | 상용은 비공개 | 공개 |
| 주 사용처 | 메인프레임·금융권 레거시 | 서버·클라우드·임베디드 전반 |

요즘 "UNIX 머신"이라면 AIX(IBM), Solaris(Oracle)나 macOS(BSD 기반) 정도가 떠오른다. 일반 서버는 거의 다 Linux.
