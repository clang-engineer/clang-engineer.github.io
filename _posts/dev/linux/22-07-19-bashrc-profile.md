---
title       : /etc/profile, /etc/bashrc, ~/.bash_profile, ~/.bash_rc
description : >-
    shell 설정 파일에 대해 기록
date        : 2022-07-09 22:50:30 +0900
updated     : 2022-07-09 22:50:30 +0900
categories  : [dev, linux]
tags        : [linux, shell, bash]
pin         : false
hidden      : false
---

## Login Shell
- 쉘을 실행할 때 로그인이 필요한 경우
- ssh로 접속하거나, su 명령어로 들어갈 때
- ex> /etc/profile, ~/.bash_profile

## Non-Login Shell
- 쉘을 실행할 때 로그인이 불필요한 경우
- shell이 실행되는 모든 상황
- ex> /etc/bashrc, ~/.bashrc

> profile, .bash_profile 설정에 대게 bashrc, .bashrc 파일을 각각 읽어오는 설정(`source ~/.bashrc`)이 들어있음.

| 파일명 | 사용처 | 설명 |
|---|---|---|
| /etc/profile | 모든 사용자 | 모든 사용자가 로그인할 때 실행 |
| ~/.bash_profile | 개별 사용자 | bash shell 사용자가 로그인할 때 실행 |
| /etc/bashrc | 모든 사용자 | 모든 사용자가 shell을 실행할 때마다 실행 |
| ~/.bashrc | 개별 사용자 | .bashrc 이 위치하는 홈 경로의 사용자가 shell 실행시 실행 |

## /etc/profile vs ~/.bash_profile
- /etc/profile: 모든 사용자에게 적용되는 설정 
> ex> PATH, umask, locale, etc
- ~/.bash_profile: 개별 사용자에게 적용되는 설정 + bash shell 사용자에게만 적용
> ex> alias, function, prompt, etc

> https://linuxize.com/post/bashrc-vs-bash-profile/
