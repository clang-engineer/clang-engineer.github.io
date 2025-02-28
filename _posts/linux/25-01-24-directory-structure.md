---
title       : Linux Directory 구조
description : >-
    Linux Directory 구조에 대해 정리해보았습니다.
date        : 2021-10-01 22:50:30 +0900
updated     : 2025-02-21 22:50:42 +0900
categories  : [dev, linux]
tags        : [linux, directory]
pin         : false
hidden      : false
---

## Directory Structure
- `/` : Root Directory
- `/bin` : Essential User Binaries
- `/boot` : Static Boot Files
- `/dev` : Device Files
- `/etc` : Configuration Files
- `/home` : Home Directories
- `/lib` : Essential Shared Libraries
- `/media` : Removable Media
- `/mnt` : Mount Directory
- `/opt` : Optional Packages
- `/proc` : Kernel & Process Files
- `/root` : Root Home Directory
- `/run` : Application State Files
- `/sbin` : System Binaries
- `/srv` : Service Data
- `/sys` : Kernel & System Files
- `/tmp` : Temporary Files
- `/usr` : User Binaries & Read-Only Data
- `/var` : Variable Data

## 각 Directory 용도 상세 설명

1. /bin
- 사용자 필수 실행 파일이 위치하는 디렉토리
- `ls`, `cp`, `mv`, `rm` 등의 명령어가 위치
- <-> `/sbin` : 시스템 관리 명령어가 위치

2. /boot
- 부팅에 필요한 정적 파일이 위치하는 디렉토리
- 커널 이미지, 부트로더, 커널 모듈 등이 위치
- `/boot/grub`, `/boot/vmlinuz`, `/boot/initrd.img` 등

3. /dev
- 장치 파일이 위치하는 디렉토리
- 하드웨어 장치를 파일로 표현한 것
- `/dev/sda`, `/dev/tty`, `/dev/null`, `/dev/zero` 등

4. /etc
- 시스템 설정 파일이 위치하는 디렉토리
- 네트워크 설정, 사용자 계정 설정, 서비스 설정 등이 위치
- `/etc/passwd`, `/etc/group`, `/etc/hosts`, `/etc/resolv.conf` 등

5. /home
- 사용자 홈 디렉토리가 위치하는 디렉토리
- 사용자 계정별로 디렉토리가 생성되어 사용자 데이터가 위치
- 사용자 계정 생성 시, `/home` 디렉토리에 사용자 계정 디렉토리 생성

6. /lib
- 필수 공유 라이브러리가 위치하는 디렉토리
- 실행 파일이 실행될 때 필요한 라이브러리 파일이 위치
- `/lib`, `/lib64` 디렉토리에 위치

7. /media
- 장치를 마운트할 디렉토리
- CD, USB 등의 장치를 마운트할 때 사용
- <-> `/mnt` : 수동으로 마운트할 디렉토리

8. /mnt
- 수동으로 마운트할 디렉토리
- `/media`와 비슷한 역할을 하지만, 수동으로 마운트할 때 사용

9. /opt
- 선택적 패키지가 위치하는 디렉토리
- `/usr` 디렉토리와 비슷한 역할을 하지만, `/usr` 디렉토리에 포함되지 않는 패키지가 위치

10. /proc
- 커널과 프로세스 정보가 위치하는 디렉토리
- 가상 파일 시스템으로, 커널과 프로세스 정보를 파일 형태로 제공
- `/proc/cpuinfo`, `/proc/meminfo`, `/proc/uptime` 등

11. /root
- root 사용자의 홈 디렉토리
- root 사용자의 홈 디렉토리로, root 사용자의 데이터가 위치

12. /run
- 애플리케이션 상태 파일이 위치하는 디렉토리
- 시스템 부팅 시 생성되며, 애플리케이션 상태 파일이 위치
- `/run/utmp`, `/run/wtmp`, `/run/systemd` 등

13. /sbin
- 시스템 실행 파일이 위치하는 디렉토리
- 시스템 관리 명령어가 위치
- `ifconfig`, `reboot`, `shutdown` 등
- <-> `/bin` : 사용자 실행 파일이 위치

14. /srv
- 서비스 데이터가 위치하는 디렉토리
- 서비스에 필요한 데이터가 위치
- 웹 서버의 웹 페이지, FTP 서버의 파일 등
- `/srv/www`, `/srv/ftp` 등

15. /sys
- 커널과 시스템 정보가 위치하는 디렉토리
- `/proc` 디렉토리와 비슷한 역할을 하지만, `/proc` 디렉토리는 파일 형태로 제공되는 반면, `/sys` 디렉토리는 파일 시스템 형태로 제공

16. /tmp
- 임시 파일이 위치하는 디렉토리
- 시스템 전체 사용자가 사용할 수 있는 임시 파일이 위치
- 시스템 부팅 시 생성되며, 시스템 종료 시 삭제

17. /usr
- 사용자 실행 파일과 읽기 전용 데이터가 위치하는 디렉토리
- `/bin`, `/lib`, `/sbin` 등과 비슷한 역할을 하지만, 사용자 실행 파일과 읽기 전용 데이터가 위치
- `/usr/bin`, `/usr/lib`, `/usr/sbin` 등
- /bin이 부팅 시 필요한 실행 파일을 제공하는 반면, /usr/bin은 사용자 실행 파일을 제공
- /bin : ls, cp, mv, rm 등 <-> /usr/bin : git, python, vim, java, wget 등

18. /var
- 변수 데이터가 위치하는 디렉토리
- 시스템 운영 중에 변경되는 데이터가 위치
- 로그 파일, 캐시 파일, 임시 파일 등이 위치
- `/var/log`, `/var/cache`, `/var/tmp` 등