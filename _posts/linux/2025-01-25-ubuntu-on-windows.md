---
title       : "Windows에서 WSL 2 + Ubuntu 개발 환경 구축하기"
description : "Windows에 wsl --install로 WSL 2와 Ubuntu를 설치하고 Linux 파일시스템에 프로젝트를 두는 이유, Python·Node.js·Docker 개발 환경을 구성할 때의 선택 기준을 단계별로 정리한다."
date        : 2025-01-25 16:55:20 +0900
updated     : 2026-09-05 20:10:00 +0900
categories  : [linux, "배포판·환경"]
tags        : [ubuntu, windows, wsl, wsl2, how-to]
pin         : false
hidden      : false
---

Windows에서 Linux 개발 환경이 필요할 때 WSL(Windows Subsystem for Linux)을 사용하면 별도 Linux PC 없이 Ubuntu 같은 배포판을 Windows와 함께 사용할 수 있다.

현재 일반적인 개발 환경의 기본 선택은 **WSL 2**다.

```text
Windows
  ↓
WSL 2 VM / Linux Kernel
  ↓
Ubuntu Userland
  ↓
Git / Python / Node / Docker CLI 등
```

이 글의 목표는 WSL 자체를 설치하는 것에서 끝나지 않고 **프로젝트 파일 위치와 Runtime 설치 방식까지 일관된 개발 환경으로 잡는 것**이다.

## 1. WSL 설치

Microsoft의 현재 설치 경로에서는 지원되는 Windows 10/11에서 관리자 PowerShell을 열고 다음 명령으로 시작할 수 있다.

```powershell
wsl --install
```

기본적으로 WSL과 Ubuntu 배포판을 설치한다. 설치 후 재부팅이 필요한 경우 재부팅하고, 처음 Ubuntu를 실행하면 Linux 사용자 이름과 비밀번호를 만든다.

다른 배포판을 선택하고 싶다면 먼저 목록을 확인한다.

```powershell
wsl --list --online
```

그다음:

```powershell
wsl --install -d <DistroName>
```

으로 설치한다.

## 2. 실제로 WSL 2인지 확인

```powershell
wsl --list --verbose
```

예:

```text
  NAME      STATE           VERSION
* Ubuntu    Running         2
```

새 설치는 WSL 2가 기본이지만 기존 배포판이 WSL 1이라면:

```powershell
wsl --set-version Ubuntu 2
```

으로 전환할 수 있다.

앞으로 새 배포판의 기본 버전을 2로 두려면:

```powershell
wsl --set-default-version 2
```

을 사용한다.

## 3. WSL 1과 WSL 2의 차이를 큰 그림으로 보기

```text
WSL 1
Linux System Call
   ↓ 변환
Windows Kernel

WSL 2
Linux Application
   ↓
실제 Linux Kernel
   ↓ 가상화 계층
Windows
```

WSL 2는 실제 Linux kernel을 사용하기 때문에 Linux kernel 기능에 의존하는 개발 도구와의 호환성이 높다.

WSL 1이 완전히 쓸모없는 것은 아니지만 일반적인 최신 Linux 개발환경에서는 특별한 이유가 없다면 WSL 2부터 선택하면 된다.

## 4. 프로젝트 파일은 Linux Filesystem에 둔다

WSL 2에서 개발할 때 중요한 선택 중 하나다.

```text
권장
~/workspace/project
→ Linux Filesystem 안

가능하지만 I/O 경계를 많이 넘음
/mnt/c/Users/.../project
→ Windows Filesystem 접근
```

Linux toolchain이 많은 파일을 읽고 쓰는 작업에서는 프로젝트를 Linux home 아래에 두는 편이 성능과 파일 권한 의미론에서 자연스럽다.

```bash
mkdir -p ~/workspace
cd ~/workspace
```

Windows GUI editor를 쓰더라도 WSL remote integration을 지원하는 도구라면 **코드는 Linux 쪽에 두고 UI만 Windows에서 사용하는 방식**을 선택할 수 있다.

## 5. Ubuntu 기본 Package 업데이트

Ubuntu terminal에서:

```bash
sudo apt update
sudo apt upgrade
```

을 실행한다.

개발에 자주 필요한 기본 도구도 함께 준비할 수 있다.

```bash
sudo apt install -y \
  build-essential \
  curl \
  git \
  ca-certificates
```

## 6. Python — System Python과 Project Environment를 구분한다

Ubuntu는 시스템 자체가 Python package에 의존할 수 있으므로 system Python을 무작정 교체하기보다 배포판 package는 그대로 두고 프로젝트별 virtual environment를 사용하는 편이 안전하다.

```bash
sudo apt install -y python3 python3-pip python3-venv
```

프로젝트에서는:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

처럼 격리한다.

```text
Ubuntu System Python
→ OS / Distribution Package 영역

Project venv
→ 내가 설치하는 Python Dependency 영역
```

이 경계를 지키면 package 충돌을 줄일 수 있다.

## 7. Node.js — 개발용 Version Manager를 우선한다

Node 개발에서는 프로젝트마다 요구 major version이 다를 수 있다.

따라서 단순히:

```bash
sudo apt install nodejs npm
```

로 한 버전을 시스템 전체에 고정하기보다 **Node Version Manager**를 사용하는 편이 개발환경에 잘 맞는다.

예를 들어 nvm을 공식 설치 방법으로 준비한 뒤:

```bash
nvm install --lts
nvm use --lts
```

로 LTS를 사용할 수 있다.

프로젝트에 `.nvmrc`가 있다면:

```bash
nvm use
```

로 해당 버전을 선택한다.

```text
System Package Manager
→ OS 단위 Package 관리

Node Version Manager
→ 사용자/Project 단위 Runtime 버전 관리
```

이라는 역할 차이로 이해하면 된다.

팀에서 특정 Node major version을 시스템 package로 표준화하는 환경이라면 NodeSource 같은 별도 repository 정책을 사용할 수도 있지만, 개인 개발 WSL에서는 version manager가 더 유연하다.

## 8. Docker — 두 방식을 섞지 않는다

WSL 2에서 Docker를 사용할 때는 크게 두 접근이 있다.

```text
A. Docker Desktop for Windows + WSL Integration
B. WSL Ubuntu 안에 Docker Engine 직접 설치
```

둘을 동시에 설치하면 어떤 daemon/socket을 사용하는지 헷갈릴 수 있으므로 **주 경로 하나를 선택**한다.

### Docker Desktop + WSL Integration

Windows에서 Docker Desktop을 사용한다면 WSL 2 backend와 Ubuntu distribution integration을 활성화한다.

구조는:

```text
Ubuntu의 docker CLI
        ↓
Docker Desktop WSL Integration
        ↓
Docker Engine
```

이다.

Docker 공식 문서도 이 방식을 사용할 때 WSL distribution 안에 별도의 Docker Engine/CLI 설치가 충돌을 만들 수 있으므로 기존 직접 설치본을 정리하라고 안내한다.

### WSL 안에 Docker Engine 직접 설치

Docker Desktop을 사용하지 않는 정책이라면 Ubuntu용 Docker Engine 설치 절차를 별도로 따른다.

이 경우 단순 `docker.io` package 한 줄을 Docker Desktop 방식과 섞어 쓰지 않고 **Docker Engine 자체를 WSL Linux 서비스로 운영하는 구조**를 이해하고 구성한다.

## 9. 상태 확인

WSL 정보:

```powershell
wsl --status
wsl --list --verbose
```

Ubuntu 안에서:

```bash
uname -a
git --version
python3 --version
node --version
```

Docker를 구성했다면:

```bash
docker version
```

까지 정상인지 확인한다.

## 10. 기본 개발 경로

최종적으로 다음처럼 잡으면 단순하다.

```text
Windows
├─ Browser / GUI Editor / Docker Desktop(선택)
│
└─ WSL 2
    └─ Ubuntu
        ├─ ~/workspace        ← Project 파일
        ├─ Git
        ├─ Python + venv
        ├─ nvm + Node.js
        └─ docker CLI         ← Docker Desktop 방식이면 Integration
```

Windows와 Linux가 서로 파일을 볼 수 있다는 이유로 모든 것을 섞기보다 **실제 개발 Runtime과 Source는 WSL Linux 쪽에 두고 Windows는 Host UI 역할로 사용하는 것**이 관리하기 쉽다.

## 정리

```text
wsl --install
   ↓
WSL 2 / Ubuntu 확인
   ↓
Project는 Linux Filesystem에 배치
   ↓
System Package와 Project Runtime 역할 분리
   ↓
Python은 venv
Node는 Version Manager
Docker는 Desktop Integration 또는 Linux Engine 중 하나 선택
```

WSL 개발 환경의 핵심은 설치 명령 자체보다 **Windows와 Linux 사이의 경계를 어디에 둘지 일관되게 정하는 것**이다.

## 참고

- [Microsoft Learn — Install WSL](https://learn.microsoft.com/windows/wsl/install)
- [Microsoft Learn — Basic commands for WSL](https://learn.microsoft.com/windows/wsl/basic-commands)
- [Docker Docs — Docker Desktop WSL 2 backend](https://docs.docker.com/desktop/features/wsl/)
