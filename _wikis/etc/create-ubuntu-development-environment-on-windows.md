---
layout  : wiki
title   : Windows에서 Ubuntu 개발 환경 구축하기
summary : 
date    : 2025-01-25 13:49:25 +0900
updated : 2025-01-26 17:47:55 +0900
tags    : 
toc     : true
public  : true
parent  : [[etc/index]]
latex   : false
---
* TOC
{:toc}

# 요약
- Windows에서 Ubuntu 개발 환경을 구축하는 방법을 정리합니다.

# 절차 
1. WSL(Windows Subsystem for Linux) 활성화
2. Ubuntu 설치
3. 개발 환경 구축 (Python, Node.js, Docker, etc.)

# WSL(Windows Subsystem for Linux) 설치
- Windows 10 이상에서만 사용 가능합니다.
- Windows PowerShell을 관리자 권한으로 실행합니다.
- 아래 명령어를 실행해 WSL을 활성화합니다.
```shell
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux
```
> wsl --install 명령어를 사용하면 별도 설치 없이 WSL을 활성화하고 Ubuntu를 설치할 수 있습니다.

# Ubuntu 설치
- Microsoft Store에서 Ubuntu를 설치합니다.
- 설치 후 실행하면 사용자 이름과 비밀번호를 설정합니다.

> [Microsoft Store - Ubuntu](https://apps.microsoft.com/search?query=ubunto+20.04&hl=ko-kr&gl=KR)
> [Microsoft Store - Windows Terminal Preview](https://apps.microsoft.com/detail/9n8g5rfz9xk3?hl=en-US&gl=KR) 를 설치하면 더 편리하게 우분투를 사용할 수 있습니다. (wt 실행)

# 개발 환경 구축
- Ubuntu에서 필요한 개발 환경을 구축합니다.
- Python, Node.js, Docker 등을 설치하고 개발을 진행합니다.

```shell
sudo apt update
sudo apt upgrade
sudo apt install python3 python3-pip
sudo apt install nodejs npm
sudo apt install docker.io
```
