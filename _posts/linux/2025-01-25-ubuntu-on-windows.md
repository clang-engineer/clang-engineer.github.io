---
title       : Windows에서 Ubuntu 개발 환경 구축하기
description : "wsl --install로 WSL2와 Ubuntu를 한 번에 올리고, Python·Node.js(nvm)·Docker 개발 환경을 세팅하는 절차. WSL1/2 차이와 apt Node를 피하는 이유까지."
date        : 2025-01-25 16:55:20 +0900
updated     : 2026-07-03
categories  : [linux, "배포판·환경"]
tags        : [ubuntu, windows]
pin         : false
hidden      : false
---

## 절차 
1. WSL(Windows Subsystem for Linux) 활성화
2. Ubuntu 설치
3. 개발 환경 구축 (Python, Node.js, Docker, etc.)

## WSL(Windows Subsystem for Linux) 설치
- Windows 10 이상에서는 WSL을 사용할 수 있습니다.
- PowerShell을 관리자 권한으로 실행 후 아래 한 줄이면 WSL과 기본 배포판(Ubuntu)까지 한 번에 설치됩니다.

```sh
wsl --install  # WSL을 설치하고 Ubuntu를 자동 설치합니다.
```

- 설치가 끝나면 재부팅한 뒤, 처음 Ubuntu를 실행할 때 사용자 이름과 비밀번호를 설정합니다.

### WSL1 vs WSL2 — 지금은 WSL2가 기본
- 요즘 `wsl --install`로 설치하면 배포판은 **WSL2**로 올라갑니다. 예전 방식(아래)은 WSL1 기능만 켜는 것이라 굳이 쓸 이유가 없습니다.
- WSL1은 Linux 시스템 콜을 Windows 콜로 번역하는 방식이고, WSL2는 경량 VM 위에서 **진짜 Linux 커널**을 돌립니다. 그래서 Docker 같은 커널 기능에 의존하는 도구가 WSL2에서 제대로 동작합니다. 시스템 콜 호환성과 전반적인 성능도 WSL2가 낫습니다.
- 다만 파일 I/O는 위치에 따라 다릅니다. WSL2는 리눅스 파일시스템(`~` 아래) 접근이 빠르고, Windows 쪽 경로(`/mnt/c/...`)를 오가는 접근은 오히려 느립니다. **프로젝트 파일은 `/mnt/c` 대신 리눅스 홈(`~`) 안에 두는 것이 성능상 유리합니다.**

```sh
# 설치된 배포판과 각 배포판의 WSL 버전 확인
wsl -l -v

# 배포판을 WSL2로 바꾸거나, 기본 버전을 2로 지정
wsl --set-version Ubuntu 2
wsl --set-default-version 2
```

| 명령어 | 기능 | 비고 |
| --- | --- | --- |
| `wsl --install` | WSL을 설치하고 기본 배포판(Ubuntu)까지 WSL2로 자동 설치 | 현재 권장 방식 |
| `Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux` | WSL1 기능만 활성화 | 배포판 미설치, WSL2 설정 별도 필요 — 특별한 이유 없으면 불필요 |


### Ubuntu 별도 설치가 필요한 경우
- Microsoft Store에서 Ubuntu를 설치합니다.

> [Microsoft Store - Ubuntu](https://apps.microsoft.com/search?query=ubunto+20.04&hl=ko-kr&gl=KR) <br>
> [Microsoft Store - Windows Terminal Preview](https://apps.microsoft.com/detail/9n8g5rfz9xk3?hl=en-US&gl=KR)

## 개발 환경 구축
- Ubuntu에서 필요한 개발 환경을 구축합니다.
- 먼저 패키지 목록을 최신화합니다.

```sh
sudo apt update
sudo apt upgrade
```

### Python
- Python은 배포판 apt로 설치해도 무난합니다. Ubuntu에는 시스템 파이썬이 이미 깔려 있는 경우가 많고, `pip`와 `venv`만 챙기면 됩니다.

```sh
sudo apt install python3 python3-pip python3-venv
```

### Node.js — apt의 `nodejs`는 피하는 게 좋다
- `sudo apt install nodejs npm`은 **배포판 저장소에 고정된 오래된 Node 버전**을 설치합니다. Ubuntu apt의 Node는 릴리스 시점에 묶여 갱신이 느려서, 최신 LTS보다 몇 버전씩 뒤처지기 일쑤입니다. 요즘 라이브러리들이 요구하는 Node 버전을 못 맞춰 설치가 막히는 일이 자주 생깁니다.
- 그래서 개발용으로는 **nvm(Node Version Manager)**을 권장합니다. 버전을 여러 개 깔아두고 프로젝트마다 골라 쓸 수 있고, `sudo` 없이 사용자 홈에 설치돼 권한 문제도 없습니다.

```sh
# nvm 설치 (설치 스크립트 버전 태그는 공식 저장소에서 최신 값 확인)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
# 셸을 다시 열거나 아래로 즉시 반영
source ~/.bashrc

# 최신 LTS 설치 후 기본으로 지정
nvm install --lts
nvm use --lts
```

- 팀 표준을 시스템 전역에 하나로 고정하고 싶다면 **NodeSource** 저장소를 추가하는 방법도 있습니다. 원하는 메이저 버전을 명시해 설치할 수 있습니다.

```sh
# 예: Node 20.x 계열을 시스템에 설치
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### Docker
- 간단히는 `sudo apt install docker.io`로도 되지만, WSL2 환경에서는 Windows용 **Docker Desktop**을 설치하고 WSL 통합을 켜는 방식이 흔합니다. 이 경우 Windows 쪽 Docker 엔진을 Ubuntu에서 그대로 쓸 수 있습니다.

```sh
sudo apt install docker.io
```
