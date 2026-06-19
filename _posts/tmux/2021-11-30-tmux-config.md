---
title       : 🧷 tmux 정리본 (Cheat Sheet + 사용 가이드)
description : "터미널 멀티플렉서 tmux의 세션·윈도우·패널 구조와 설치, ~/.tmux.conf 설정, 자주 쓰는 단축키를 한 번에 찾아볼 수 있는 Cheat Sheet 형식으로 정리한다."
date        : 2021-11-30 22:50:30 +0900
updated     : 2026-01-28 08:33:28 +0900
categories  : [tmux, "설정·옵션"]
tags        : [terminal]
pin         : false
hidden      : false
---

## 🧷 tmux 정리본 (Cheat Sheet + 사용 가이드)

tmux는 여러 개의 터미널 세션을 생성하고 관리할 수 있게 해주는 **터미널 멀티플렉서**이다.
한 세션 안에 여러 개의 **윈도우(window) → 패널(pane)** 을 둘 수 있다.

구조:
**세션(Session) > 윈도우(Window) > 패널(Pane)**

> 관련 (tmux 셋업 시리즈):
> - [tmux 유용한 설정 정리 (.tmux.conf 기준)](/posts/tmux/2026-02-21-tmux-tips/) — 체감 큰 `.tmux.conf` 옵션만 추린 튜닝
> - [Tmux 설정 & 플러그인 설명](/posts/tmux/2025-11-17-tmux-tpm/) — TPM 대표 플러그인별 역할·기능 상세
> - [tmux 초기 셋업용 세션/윈도우/패널 스크립트](/posts/tmux/2026-02-21-tmux-bootstrap/) — 세션 구조를 파일 하나로 바로 띄우기

---

## 1. 설치

```bash
brew install tmux         # macOS
sudo apt-get install tmux # Ubuntu
sudo yum install tmux     # CentOS
```

---

## 2. 설정 파일

tmux 설정은 `~/.tmux.conf` 에 작성한다.
tmux 실행 시 자동 로드되며, 재로드는 아래 명령어로 가능:

```bash
tmux source-file ~/.tmux.conf
```

---

## 3. 기본 사용법

## 📌 세션(Session)

### ● 세션 생성

```bash
tmux
tmux new
tmux new-session
tmux new -s sessionname
```

### ● 세션 접속

```bash
tmux attach
tmux attach-session
tmux a
tmux a -t sessionname
```

### ● 세션 종료

```bash
tmux kill-session
tmux kill-session -t sessionname
```

### ● 자주 쓰는 단축키

| 단축키            | 설명          |
| -------------- | ----------- |
| `Ctrl+b` + `$` | 세션 이름 변경    |
| `Ctrl+b` + `d` | 세션 detach   |
| `Ctrl+b` + `)` | 다음 세션       |
| `Ctrl+b` + `(` | 이전 세션       |
| `Ctrl+b` + `w` | 세션/창 리스트 보기 |

---

## 4. 윈도우(Window)

브라우저 탭처럼 하나의 세션 안에서 여러 창을 사용할 수 있다.

### ● 단축키

| 단축키            | 설명                    |
| -------------- | --------------------- |
| `Ctrl+b` + `c` | 새 윈도우 생성              |
| `Ctrl+b` + `n` | 다음 윈도우                |
| `Ctrl+b` + `p` | 이전 윈도우                |
| `Ctrl+b` + `l` | 마지막으로 사용한 윈도우         |
| `Ctrl+b` + 숫자  | 번호로 이동                |
| `Ctrl+b` + `'` | 이름으로 검색하여 이동          |
| `Ctrl+b` + `,` | 윈도우 이름 변경             |
| `Ctrl+b` + `.` | 윈도우 번호 변경             |
| `Ctrl+b` + `&` | 윈도우 종료                |
| `Ctrl+b` + `f` | 윈도우 검색                |
| `Ctrl+b` + `z` | 패널 확대/축소(toggle zoom) |

### ● 윈도우 합치기/분리 등

(`Ctrl+b` + `:` 로 명령창 열기)

```sh
join-pane -s 2 -t 1   # 2번 윈도우를 1번 윈도우로 합치기
break-pane -s 1 -t 2  # 1번 윈도우를 2번 윈도우로 분리
swap-pane -s 1 -t 2   # 두 패널 교환
swap-window -s 1 -t 2 # 두 윈도우 교환
```

---

## 5. 패널(Pane)

윈도우 내부를 여러 영역으로 나누어 사용할 수 있다.

### ● 패널 분리(split)

| 단축키            | 설명                 |
| -------------- | ------------------ |
| `Ctrl+b` + `%` | 세로 분할 (vertical)   |
| `Ctrl+b` + `"` | 가로 분할 (horizontal) |

### ● 패널 이동

| 단축키                      | 설명            |
| ------------------------ | ------------- |
| `Ctrl+b` + ← / → / ↑ / ↓ | 방향키로 이동       |
| `Ctrl+b` + `o`           | 다음 패널         |
| `Ctrl+b` + `;`           | 이전 패널         |
| `Ctrl+b` + `{` / `}`     | 패널 위치 이동      |
| `Ctrl+b` + `!`           | 패널을 새 윈도우로 분리 |
| `Ctrl+b` + `x`           | 패널 종료         |
| `Ctrl+b` + `Ctrl+o`      | 패널 순환(swap)   |

### ● 패널 크기 조절

(`Ctrl+b` + `:` 명령창에서 실행)

```bash
resize-pane -D
resize-pane -U
resize-pane -L
resize-pane -R

resize-pane -D 10  # 10칸 변경
resize-pane -U 10
resize-pane -L 10
resize-pane -R 10

ctrl + b 를 누르고 option + 방향키로 사이ㅈ 조절 (macOS)
```

---

## 6. 복사/붙여넣기(Copy Mode)

### ● 진입/종료

* `Ctrl+b` + `[` : 복사모드 진입
* `Ctrl+b` + `]` : 붙여넣기

### ● 복사모드 단축키

| 키       | 설명              |
| ------- | --------------- |
| Space   | 선택 시작           |
| Enter   | 선택 복사           |
| Esc     | 선택 취소           |
| g / G   | 위/아래 끝 이동       |
| h/j/k/l | 방향 이동           |
| /       | 검색              |
| #       | paste buffer 목록 |
| q       | 종료              |

---

## 7. 스크롤

* 키보드로: `Ctrl+b` + `[` → ↑/↓
* 마우스로 스크롤하려면 `.tmux.conf`에 추가:

```bash
set -g mouse on
```

---

## 8. Tmux Plugin Manager (TPM)

플러그인 설치·구성과 대표 플러그인별 설명, 복붙용 `.tmux.conf` 블록은 별도 글에 정리해두었다:
[Tmux 설정 & 플러그인 설명](/posts/tmux/2025-11-17-tmux-tpm/)

---

## 9. Resurrect/Continuum 팁

세션을 `kill`했는데도 다시 살아나는 경우가 있다면 `tmux-resurrect` + `tmux-continuum`의
자동 복원 기능 때문이다. `@continuum-restore 'on'` 상태에서는 tmux 시작 시점에
마지막 저장 상태를 자동으로 복원한다.

### ● 복원 데이터 저장 위치

```bash
~/.local/share/tmux/resurrect/
```

### ● 복원 데이터 삭제(초기화)

```bash
tmux kill-server
rm -rf ~/.local/share/tmux/resurrect/*
```

### ● 자동 복원 끄기

```bash
set -g @continuum-restore 'off'
```
