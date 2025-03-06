---
title       : Windows에서 Ubuntu 개발 환경 구축하기
description : >-
    Windows에서 Ubuntu 개발 환경을 구축하는 방법을 정리합니다.
date        : 2025-01-25 16:55:20 +0900
updated     : 2025-01-25 16:58:25 +0900
categories  : [dev, tip]
tags        : [ubuntu, wsl, windows]
pin         : false
hidden      : false
---

## 절차 
1. WSL(Windows Subsystem for Linux) 활성화
2. Ubuntu 설치
3. 개발 환경 구축 (Python, Node.js, Docker, etc.)

## WSL(Windows Subsystem for Linux) 설치
- Windows 10 이상에서는 WSL을 사용할 수 있습니다.
- PowerShell을 관리자 권한으로 실행 후 아래 명령어를 실행해 WSL을 활성화합니다.

```sh
wsl --install  # wsl을 설치하고 Ubuntu를 자동 설치합니다. 

# or
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux # WSL 1만 활성화
```

| 명령어 | 기능 | 차이점 |
| --- | --- | --- |
| wsl --install | WSL을 설치하고, 기본 배포판(예: Ubuntu)까지 자동 설치 | WSL 핵심 기능 + 배포판까지 설치됨 |
| Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux | Windows에서 WSL 1 기능만 활성화 | 배포판 설치 X, WSL 2 설정도 별도로 해야 함 |


### Ubuntu 별도 설치가 필요한 경우
- Microsoft Store에서 Ubuntu를 설치합니다.

> [Microsoft Store - Ubuntu](https://apps.microsoft.com/search?query=ubunto+20.04&hl=ko-kr&gl=KR) <br>
> [Microsoft Store - Windows Terminal Preview](https://apps.microsoft.com/detail/9n8g5rfz9xk3?hl=en-US&gl=KR)

## 개발 환경 구축
- Ubuntu에서 필요한 개발 환경을 구축합니다.
- Python, Node.js, Docker 등을 설치하고 개발을 진행합니다.

```sh
sudo apt update
sudo apt upgrade
sudo apt install python3 python3-pip
sudo apt install nodejs npm
sudo apt install docker.io
```
