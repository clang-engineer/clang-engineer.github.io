---
title       : Debian vs Redhat
description : >-
    debian과 redhat의 차이점을 기록.
date        : 2024-06-09 22:50:30 +0900
updated     : 2025-02-21 22:50:42 +0900
categories  : [dev, linux]
tags        : [linux, debian, redhat, unix]
pin         : false
hidden      : false
---

## Debian vs Redhat

| 특징 | Debian 계열 🟢 | Red Hat 계열 🔴 |
| --- | --- | --- |
| 패키지 관리자 | dpkg 및 APT (Advanced Package Tool) | RPM 및 YUM/DNF |
| 패키지 확장자 | .deb | .rpm |
| 대표 배포판 | Debian, Ubuntu, Linux Mint | Red Hat Enterprise Linux(RHEL), CentOS(과거), Rocky Linux, AlmaLinux, Fedora |
| 안정성 | 매우 안정적 (보수적 업데이트) | 기업용으로 안정적, 하지만 최신 기능이 빠르게 도입되는 Fedora 계열도 존재 |
| 커뮤니티 vs 기업 지원 | 커뮤니티 중심, 무료 | Red Hat 지원 (유료), CentOS(과거) 및 Rocky Linux, AlmaLinux는 무료 |
| 서버 vs 데스크탑 | 서버 및 데스크탑 모두 적합 | 기업 서버 및 엔터프라이즈 환경에 특화 |
| 사용자 환경 | 개발자 및 개인 사용자 친화적 | 기업 및 엔터프라이즈 환경에 최적화 |


## UNIX vs Linux

| 특징 | UNIX | Linux |
| --- | --- | --- |
| 소유권 | AT&T (원조) → IBM, HP, Oracle 등 | Linus Torvalds (초기 개발) → 커뮤니티 및 기업 |
| 라이선스 | 유료 (상업용) + 일부 무료 (BSD 계열) | GPL (GNU General Public License) |
| 소스 코드 | 닫힘 (상용 UNIX) / 오픈 (BSD 계열) | 오픈 |
| 커널 | 닫힘 (상용 UNIX) / 오픈 (BSD 계열) | 오픈 |
| 플랫폼 | 대기업 (IBM, HP, Oracle 등) | 개인, 커뮤니티, 기업 모두 |
| 업데이트 | 느림 (기업 정책에 따름) | 빠름 (커뮤니티 및 기업 참여) |
| 사용자 | 주로 기업 | 개인, 기업 모두 |
| 보안 | 높음 (기업용, 제한된 환경) | 높음 (설정 및 배포판에 따라 다름) |
| 비용 | 높음 (라이선스 필요) | 낮음 (무료 배포판 많음) |
| 확장성 | 중간 (하드웨어 종속성 존재) | 높음 (오픈소스 기반) |
| 커뮤니티 | 적음 (주로 기업 지원) | 많음 (오픈소스 기반) |