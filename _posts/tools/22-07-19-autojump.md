---
title       : Autojump 사용법
description : >-
    Autojump 사용법 및 설정 방법을 기록합니다.
date        : 2022-07-19 09:10:09 +0900
updated     : 2025-02-21 22:50:42 +0900
categories  : [tools, terminal]
tags        : [autojump, terminal]
pin         : false
hidden      : false
---

## Repository
[https://github.com/wting/autojump](https://github.com/wting/autojump)

## 설치
1. MacOS
```sh
brew install autojump
```

2. Linux
```sh
sudo apt install autojump # Debian/Ubuntu
yum install autojump # CentOS
```

## sh 설정
1. zshell 사용시 zshrc에 plugin 사용 설정 추가
```sh
plugins=(git autojump)
```

2. bash shell 사용시
```sh
source /usr/share/autojump/autojump.sh on startup

// 상시 사용 원할 시
echo '. /usr/share/autojump/autojump.sh' >> ~/.bashrc
```

## 사용법
- help
```sh
j --help # 사용법 확인
j -s # 가중치 확인
j --purge # 존재하지 않는 경로 삭제
```

```sh
j foo # foo를 포함하는 디렉터리로 이동
jc foo # 현재 디렉터리 내의 하위 디렉터리 중 foo와 관련된 디렉터리로 이동
jo foo # foo를 포함하는 디렉터리를 탐색기로 열기
```

### 다중 경로를 사용하는 방법
```sh
30  /home/user/mail/inbox 
10  /home/user/work/index

$ j w in  # /home/user/work/index 로 이동
```

> https://www.linode.com/docs/guides/faster-file-navigation-with-autojump/
