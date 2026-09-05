---
title       : "폐쇄망 RHEL 계열 서버에 RPM 패키지와 의존성 반입하기"
description : "인터넷이 되는 동일 계열·버전·아키텍처 환경에서 dnf download --resolve --alldeps로 필요한 RPM을 수집하고, 무결성을 확인한 뒤 폐쇄망에서 DNF로 로컬 패키지를 설치하는 절차를 정리한다."
date        : 2025-01-14 13:38:35 +0900
updated     : 2026-09-05 20:05:00 +0900
categories  : [linux, "배포판·환경"]
tags        : [dnf, rpm, air-gapped, offline, how-to]
pin         : false
hidden      : false
---

인터넷이 차단된 폐쇄망(Air-gapped) 서버에서는 remote repository에 접근할 수 없으므로 일반적인 `dnf install`이 그대로 동작하지 않는다.

핵심은 단순히 대상 RPM 하나를 복사하는 것이 아니라 **폐쇄망 서버가 설치 transaction을 완성하는 데 필요한 package와 dependency를 외부 환경에서 함께 준비하는 것**이다.

```text
인터넷 가능 준비 환경
   ↓
대상 OS/Version/Architecture와 맞는 Repository 구성
   ↓
Package + Dependency RPM 수집
   ↓
무결성·목록 확인
   ↓ 물리적/승인된 반입 경로
폐쇄망 서버
   ↓
Local RPM만 사용해 DNF Install
   ↓
서비스 초기화·검증
```

## 1. 먼저 맞춰야 할 조건

폐쇄망 package 준비에서 가장 중요한 것은 download 명령보다 **준비 환경과 대상 환경의 호환성**이다.

최소한 다음을 확인한다.

```text
Distribution 계열
Major Version
Architecture
활성화할 Repository
필요한 Module Stream
```

대상 서버에서:

```bash
cat /etc/os-release
uname -m
```

를 확인한다.

예를 들어 Rocky Linux 8 x86_64 대상이라면 준비 환경도 Rocky/RHEL 8 계열 x86_64 repository 기준으로 맞추는 편이 안전하다.

## 2. 준비 환경은 "깨끗하고 재현 가능하게" 만든다

Container나 별도 VM을 사용할 수 있다.

예:

```bash
docker run --rm -it rockylinux:8 bash
```

필요한 DNF download plugin을 설치한다.

```bash
dnf install -y dnf-plugins-core
```

Container를 사용하는 이유는 package를 설치하기 위해서라기보다 **어떤 repository와 dependency set에서 RPM을 수집했는지 재현하기 쉽기 때문**이다.

> Container image의 architecture가 대상 서버와 다른 경우 `--platform`이나 별도 호스트를 사용할 수 있지만, emulation 환경과 실제 target architecture의 package 선택이 섞이지 않게 주의한다.

## 3. `--resolve`와 `--alldeps`의 차이

`dnf download --resolve`는 dependency를 해결하지만 **준비 환경에 이미 설치된 dependency는 download하지 않을 수 있다.**

폐쇄망 반입용 bundle을 만들 때는 이 차이가 중요하다.

```text
--resolve
→ 대상 Package의 Dependency를 계산
→ 현재 준비 환경에 이미 설치된 것은 생략 가능

--resolve --alldeps
→ 이미 설치된 Dependency도 포함해 다운로드
```

따라서 target 서버가 정확히 어떤 package를 이미 갖고 있는지 확신하기 어렵다면 독립적인 bundle을 준비하기 위해 `--alldeps`를 함께 사용하는 편이 안전하다.

```bash
mkdir -p /tmp/offline-rpms

dnf download \
  --resolve \
  --alldeps \
  --downloaddir /tmp/offline-rpms \
  nginx
```

## 4. Repository와 Module Stream을 먼저 고정한다

Package 버전은 활성화된 repository와 module stream에 따라 달라질 수 있다.

따라서 PostgreSQL처럼 별도 repository나 module 정책이 있는 software는 **package download 전에 repository 상태를 먼저 결정**한다.

예:

```bash
dnf repolist
dnf module list postgresql
```

외부 vendor repository를 추가해야 한다면 해당 repository package와 GPG key 정책도 폐쇄망 반입 절차에 포함시킨다.

```text
Repository 정의
   ↓
Module Stream 선택
   ↓
Package Version 결정
   ↓
Dependency Resolution
```

이 순서를 뒤집으면 준비할 때와 설치할 때 package 조합이 달라질 수 있다.

## 5. Package Bundle 만들기

### Nginx 예

```bash
mkdir -p /tmp/offline-nginx

dnf download \
  --resolve \
  --alldeps \
  --downloaddir /tmp/offline-nginx \
  nginx
```

### Java 예

정확한 package 이름을 먼저 검색한다.

```bash
dnf search openjdk
dnf list available '*openjdk*'
```

그다음 필요한 package를 지정한다.

```bash
dnf download \
  --resolve \
  --alldeps \
  --downloaddir /tmp/offline-java \
  java-11-openjdk-devel
```

### PostgreSQL 예

PostgreSQL은 base repository의 module을 사용할지 PGDG 같은 별도 repository를 사용할지 먼저 결정한다.

```text
OS 기본 Module 사용
또는
Vendor Repository 사용
```

두 경로를 섞지 않고, 선택한 repository 기준으로 dependency bundle을 만든다.

## 6. 반입 전에 목록과 무결성을 남긴다

폐쇄망 반입은 단순 파일 복사보다 **무엇을 반입했는지 재현 가능하게 남기는 것**이 중요하다.

목록:

```bash
find /tmp/offline-rpms -maxdepth 1 -name '*.rpm' -printf '%f\n' | sort > packages.txt
```

Checksum:

```bash
sha256sum /tmp/offline-rpms/*.rpm > SHA256SUMS
```

RPM signature 확인도 할 수 있다.

```bash
rpm -K /tmp/offline-rpms/*.rpm
```

조직의 망분리 정책에 따라 malware scan, 반입 승인, media 통제 절차도 함께 따른다.

## 7. 폐쇄망에서는 `rpm -ivh *.rpm`보다 DNF Transaction을 우선한다

RPM 파일 여러 개를 단순히:

```bash
rpm -ivh *.rpm
```

로 설치하면 dependency 순서와 upgrade/downgrade 관계를 직접 다뤄야 할 수 있다.

DNF는 local RPM 파일도 install 대상으로 받을 수 있으므로 dependency transaction을 DNF에 맡기는 편이 명확하다.

```bash
cd /path/to/offline-rpms
sudo dnf install ./*.rpm --disablerepo='*'
```

```text
Local RPM Bundle
   ↓
DNF Dependency Solver
   ↓
RPM Transaction
```

`--disablerepo='*'`는 설치 과정에서 외부 repository를 사용하지 않도록 의도를 명확히 한다.

단, 필요한 dependency RPM이 bundle에 빠져 있다면 이 단계에서 실패한다. 그 경우 인터넷 연결을 임시로 열기보다 **외부 준비 환경에서 bundle을 보강해 다시 반입**하는 것이 폐쇄망 절차에 맞다.

## 8. 설치와 서비스 초기화는 별도 단계다

Package 설치가 끝났다고 service가 바로 준비된 것은 아니다.

예를 들어 Nginx라면:

```bash
sudo systemctl enable --now nginx
sudo systemctl status nginx
```

Database는 initialization이 필요할 수 있다.

```text
Package 설치
   ↓
초기 설정 / Data Directory 생성
   ↓
Configuration
   ↓
Service Enable / Start
   ↓
Health Check
```

Java처럼 runtime package는 `JAVA_HOME`을 직접 고정하기 전에 설치된 경로를 먼저 확인한다.

```bash
readlink -f "$(command -v java)"
```

Package version이 바뀔 때마다 깨지는 version-specific path를 `/etc/profile`에 하드코딩하지 않는 편이 좋다.

## 9. Package가 많아지면 Local Repository를 만든다

한두 package가 아니라 서버 여러 대에 반복 설치하거나 bundle 규모가 커지면 RPM directory 자체를 **내부 Local Repository**로 만드는 편이 낫다.

```text
외부 Repository
   ↓ 동기화/승인
내부 RPM Repository
   ↓
폐쇄망 Server들의 DNF
```

이 구조에서는 dependency 관리, version pinning, patch 반입, 감사가 훨씬 쉬워진다.

`createrepo_c`로 repository metadata를 만들거나 조직 내부 package mirror 체계를 구성할 수 있다.

## 10. 검증 체크

```text
[ ] OS Major Version이 Target과 맞는가?
[ ] Architecture가 맞는가?
[ ] Repository / Module Stream이 명확한가?
[ ] --resolve --alldeps로 필요한 Dependency를 수집했는가?
[ ] Package 목록과 Checksum을 남겼는가?
[ ] RPM Signature를 확인했는가?
[ ] 폐쇄망에서 외부 Repository 없이 DNF Install이 완료되는가?
[ ] Service 초기화와 Health Check까지 확인했는가?
```

## 정리

폐쇄망 package 설치의 핵심은 `rpm` 파일을 많이 모으는 것이 아니다.

```text
Target 환경 정의
   ↓
동일한 Repository 조건 재현
   ↓
완전한 Dependency Bundle 생성
   ↓
검증 후 반입
   ↓
Local DNF Transaction
   ↓
Service 검증
```

**준비 환경의 상태에 우연히 의존하지 않고, target이 필요로 하는 package transaction 자체를 재현 가능한 bundle로 만드는 것**이 가장 중요하다.

## 참고

- [DNF download plugin documentation](https://dnf-plugins-core.readthedocs.io/en/latest/download.html)
- [DNF command reference](https://dnf.readthedocs.io/en/latest/command_ref.html)
