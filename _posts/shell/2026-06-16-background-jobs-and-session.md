---
title       : "셸 백그라운드 잡: &, nohup, disown, tmux의 차이"
description : "&로 띄운 프로세스가 셸 종료 시 같이 죽는지 — zsh와 bash의 기본이 다르다. 확실히 살리는 방법 4가지"
date        : 2026-06-16 14:30:00 +0900
updated     : 2026-06-16 14:30:00 +0900
categories  : [shell, "셸·스크립팅"]
tags        : [shell, zsh, bash, nohup, tmux]
pin         : false
hidden      : false
---

`./server.sh &`로 띄운 프로세스, 터미널 닫으면 같이 죽을까 살아남을까? "당연히 죽지", "아니 살아남는데?" 둘 다 맞을 수 있습니다. 셸과 옵션에 따라 달라지기 때문입니다.

이 글은 `&` / `jobs` / `bg` / `fg` / `nohup` / `disown` / `tmux`가 각각 무엇을 하는지, 그리고 셸 세션 종료 후에도 프로세스를 살리는 방법을 정리합니다.

---

## `&` — 그냥 백그라운드로

```bash
./server.sh &
# [1] 36785      ← 잡 번호 [1], PID 36785
```

`&`는 명령을 백그라운드 잡으로 띄우고 즉시 프롬프트를 돌려줍니다. 표준 입출력은 여전히 현재 터미널과 연결돼 있어서, 백그라운드 잡이 stdout에 출력하면 프롬프트 가운데로 끼어듭니다.

```bash
./server.sh > /tmp/server.log 2>&1 &   # 출력 분리 권장
```

---

## `sudo &`의 함정 — `suspended (tty output)`

```bash
$ sudo ./server.sh &
[1] 44774
[1]  + 44774 suspended (tty output)  sudo ./server.sh
```

이 상태는 정지(suspended)된 잡입니다. `sudo`가 비밀번호 프롬프트를 띄우려고 tty에 접근하다가 `SIGTTOU`/`SIGTTIN`을 받아 멈춘 것.

**원인:** 백그라운드 잡은 기본적으로 tty 입출력에 접근하면 정지됩니다(POSIX 동작). 비밀번호 입력이 필요한 명령은 백그라운드와 상극.

**해결:**
1. `kill %1`로 정지된 잡 종료
2. 정말 sudo가 필요하면 포그라운드로 띄우거나 `sudo -n` (비밀번호 없이만, NOPASSWD 설정 필요)
3. 대부분의 dev 서버는 1024 미만 권한 포트를 안 써서 sudo가 애초에 불필요

---

## `jobs` / `bg` / `fg` — 잡 제어

```bash
jobs                # 현재 셸의 백그라운드 잡 목록
jobs -l             # PID 함께
fg %1               # 잡 1을 포그라운드로 (Ctrl+C로 종료 가능)
bg %1               # 정지된 잡 1을 백그라운드에서 다시 실행
kill %1             # 잡 1에 SIGTERM (PID가 아닌 잡 번호도 됨)
```

**포그라운드 → 정지 → 백그라운드 흐름:**

```bash
./server.sh         # 포그라운드 실행
^Z                  # Ctrl+Z — SIGTSTP, 잡 정지
bg                  # 백그라운드에서 재개
```

이미 띄운 포그라운드 명령을 백그라운드로 옮기고 싶을 때 자주 씁니다.

---

## 셸 종료 시 잡은 죽는가? — 셸마다 다르다

| 셸 | 기본 동작 | 변경 방법 |
|---|---|---|
| **zsh** | 종료 시 백그라운드 잡에 `SIGHUP` → **죽음** | `setopt NO_HUP`이면 살아남음 |
| **bash** | `shopt huponexit` 기본 off → **살아남음** | `shopt -s huponexit`로 zsh처럼 |

**확인:**

```bash
# zsh
setopt | grep -i hup

# bash
shopt huponexit
```

SSH 세션이 끊겨 tty가 사라지는 케이스는 별개입니다. 백그라운드 잡이 stdout에 쓰려다 깨질 수 있어서, **장시간 실행은 무조건 출력을 파일로 리다이렉트**해야 합니다.

---

## 셸 종료 후에도 살리는 4가지 방법

### 1. `nohup` — SIGHUP 무시

```bash
nohup ./server.sh > /tmp/server.log 2>&1 &
```

- 프로세스가 `SIGHUP`을 무시하도록 설정
- 출력 자동으로 `nohup.out`에 가지만 명시적 리다이렉트 권장
- 셸 종료해도 살아남음

### 2. `disown` — 잡 리스트에서 빼버리기

```bash
./server.sh > /tmp/server.log 2>&1 &
disown              # 가장 최근 잡
disown %1           # 특정 잡
disown -a           # 모든 잡
disown -h %1        # 잡 리스트엔 남기되 SIGHUP만 안 보냄
```

- 셸이 종료될 때 SIGHUP 대상에서 제외
- `nohup`과 달리 이미 띄운 후에도 적용 가능

### 3. `setsid` — 새 세션으로 분리 (리눅스)

```bash
setsid ./server.sh > /tmp/server.log 2>&1 < /dev/null &
```

- 새 세션·프로세스 그룹으로 띄워서 controlling terminal에서 완전 분리
- 가장 깨끗하게 떨어뜨림. 데몬화에 가까움

### 4. `tmux` / `screen` — 세션 자체를 detach

```bash
tmux new -d -s server './server.sh'   # detached 모드로 시작
tmux ls                                # 세션 목록
tmux attach -t server                  # 다시 붙기
```

- 가장 **권장**. 로그를 그대로 보고, detach/attach 자유로움
- 작업 중간에 SSH가 끊겨도 세션 안의 작업이 그대로 살아 있음
- `screen`도 같은 역할 (옵션 문법 다름)

**비교:**

| 방법 | 장점 | 단점 |
|---|---|---|
| `nohup` | 단순, 어디서나 됨 | 출력 분리 따로 챙겨야, 다시 보기 불편 |
| `disown` | 이미 띄운 잡에도 적용 | bash/zsh 빌트인이라 sh에선 없음 |
| `setsid` | 가장 깨끗한 분리 | 옵션 알아야, 리다이렉트 손수 |
| `tmux` | 다시 붙어서 로그·인터랙티브 가능 | 별도 설치(보통 기본) + 학습 |

장시간 서버는 `tmux`, 한 번 띄우고 잊을 거면 `nohup`이 보통의 선택입니다.

---

## 실전 정리

**로컬 dev 서버 잠깐 띄우기:**

```bash
./tools/run.sh > /tmp/jekyll.log 2>&1 &
tail -f /tmp/jekyll.log     # Ctrl+C로 빠져나와도 서버는 살아 있음
# 종료
kill %1
```

**SSH 세션에서 장기 실행 작업:**

```bash
tmux new -d -s training './train.py'
tmux attach -t training     # 진행 상황 보기
# Ctrl+B → D 로 detach (작업은 계속)
```

**이미 띄운 포그라운드 작업을 도중에 분리:**

```bash
# 포그라운드 실행 중
^Z                  # Ctrl+Z로 정지
bg                  # 백그라운드 재개
disown              # 셸 종료 시 같이 안 죽도록
```

---

## 대중성·대안

- `&` / `jobs` / `bg` / `fg` — **POSIX 표준**. 어디서나.
- `nohup` — POSIX 표준 유틸리티. 매우 주류.
- `disown` — bash/zsh 빌트인. sh(dash 등)엔 없음.
- `setsid` — util-linux 기본. macOS는 별도 설치(`brew install util-linux`).
- `tmux` / `screen` — **사실상 표준**. 서버 운영하면서 안 쓰면 손해.

결론: **로컬 잠깐 → `&` + 리다이렉트**, **장시간/원격 → `tmux`**, **데몬 비슷하게 분리 → `nohup` 또는 `setsid`**. `disown`은 "아 이거 종료 안 되게 해야지" 싶을 때 사후 처방.

관련 글: [프로세스 찾고 종료하기: pgrep, pkill, pidof, lsof, kill](/posts/linux/2026-06-16-process-find-and-kill/) — 떠 있는 잡을 추적·종료할 때 같이 쓰는 도구들.
