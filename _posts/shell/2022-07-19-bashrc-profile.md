---
title       : /etc/profile, /etc/bashrc, ~/.bash_profile, ~/.bashrc
description : >-
    Login/Non-login·Interactive/Non-interactive 셸과 각 설정 파일이 언제 읽히는지
date        : 2022-07-09 22:50:30 +0900
updated     : 2026-06-13 10:00:00 +0900
categories  : [shell, "셸·스크립팅"]
tags        : [linux, bash]
pin         : false
hidden      : false
---

`bash`는 어떤 식으로 켜졌느냐에 따라 읽는 설정 파일이 다르다. PATH가 두 번 추가되거나 alias가 SSH에서만 안 먹는 등의 문제는 대부분 이 매트릭스를 모르는 데서 온다.

## 두 가지 축

| 축 | 의미 | 예시 |
|---|---|---|
| Login Shell | 로그인 절차를 거쳐 시작된 셸 | `ssh user@host`, 콘솔 로그인, `bash -l` |
| Non-Login Shell | 이미 로그인된 상태에서 추가로 띄운 셸 | 터미널 새 탭, `bash` |
| Interactive | 키보드 입력을 받는 셸 | 터미널 |
| Non-Interactive | 스크립트 실행용 | `bash script.sh` |

## 읽는 순서

**Login Shell**

1. `/etc/profile`
2. `~/.bash_profile` → 없으면 `~/.bash_login` → 없으면 `~/.profile` (이 순서로 *첫 번째 발견된 것만* 읽음)

**Non-Login + Interactive Shell**

1. `/etc/bash.bashrc` (배포판에 따라 `/etc/bashrc`)
2. `~/.bashrc`

**Non-Interactive Shell**

위 어느 것도 안 읽음. `BASH_ENV` 환경변수가 있으면 그것만.

## 흔한 컨벤션

`~/.bash_profile`에서 `~/.bashrc`를 source하는 게 보통이다. 그래야 SSH(login)로 들어와도 평소 쓰는 alias/함수가 적용된다.

```sh
# ~/.bash_profile
[ -f ~/.bashrc ] && source ~/.bashrc
```

| 파일 | 용도 |
|---|---|
| `/etc/profile` | 시스템 전역 환경변수, 라이센스 위치 등 |
| `~/.bash_profile` | 개인 환경변수, PATH, login 1회용 초기화 |
| `/etc/bashrc` | 시스템 전역 alias, 프롬프트 |
| `~/.bashrc` | 개인 alias, 함수, 프롬프트 |

## zsh와의 매핑

| bash | zsh |
|---|---|
| `~/.bash_profile` | `~/.zprofile` (login) |
| `~/.bashrc` | `~/.zshrc` (interactive) |
| — | `~/.zshenv` (모든 zsh 호출 시) |

macOS의 Terminal.app은 기본으로 login shell을 띄우기 때문에 `.bash_profile`/`.zprofile`이 우선이고, Linux의 GNOME Terminal은 보통 non-login이라 `.bashrc`/`.zshrc`가 우선이다. 환경 차이의 흔한 원인.

## 점검 방법

```sh
shopt login_shell        # bash: on이면 login
echo $0                  # -bash면 login, bash면 non-login
```

PATH가 중복되는 것 같으면 어떤 파일에서 추가되는지 `set -x`를 맨 위에 잠깐 두고 추적한다.
