---
title       : 🧷 tmux 정리본 (Cheat Sheet + 사용 가이드)
description : >-
    터미널을 여러개의 세션으로 나누어서 사용할 수 있게 해주는 tmux 사용법에 대한 내용
date        : 2021-11-30 22:50:30 +0900
updated     : 2026-01-28 08:33:28 +0900
categories  : [dev, tools]
tags        : [tmux, terminal]
pin         : false
hidden      : false
---

# 🧷 tmux 정리본 (Cheat Sheet + 사용 가이드)

tmux는 여러 개의 터미널 세션을 생성하고 관리할 수 있게 해주는 **터미널 멀티플렉서**이다.
한 세션 안에 여러 개의 **윈도우(window) → 패널(pane)** 을 둘 수 있다.

구조:
**세션(Session) > 윈도우(Window) > 패널(Pane)**

---

# 1. 설치

```bash
brew install tmux         # macOS
sudo apt-get install tmux # Ubuntu
sudo yum install tmux     # CentOS
```

---

# 2. 설정 파일

tmux 설정은 `~/.tmux.conf` 에 작성한다.
tmux 실행 시 자동 로드되며, 재로드는 아래 명령어로 가능:

```bash
tmux source-file ~/.tmux.conf
```

---

# 3. 기본 사용법

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

# 4. 윈도우(Window)

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

# 5. 패널(Pane)

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

# 6. 복사/붙여넣기(Copy Mode)

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

# 7. 스크롤

* 키보드로: `Ctrl+b` + `[` → ↑/↓
* 마우스로 스크롤하려면 `.tmux.conf`에 추가:

```bash
set -g mouse on
```

---

# 8. Tmux Plugin Manager (TPM)

tmux 플러그인을 관리해주는 툴.

### ● 설치

```bash
git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm
```

### ● `.tmux.conf` 설정 예시

```sh
# --- TPM ---
set -g @plugin 'tmux-plugins/tpm'

# plugin list
set -g @plugin 'tmux-plugins/tmux-sensible'
set -g @plugin 'christoomey/vim-tmux-navigator'
set -g @plugin 'jimeh/tmux-themepack'
set -g @plugin 'tmux-plugins/tmux-resurrect'
set -g @plugin 'tmux-plugins/tmux-continuum'

# themepack config
set -g @themepack 'powerline/default/cyan'

# resurrect
set -g @resurrect-capture-pane-contents 'on'
set -g @continuum-restore 'on'

# tmux settings
set -g default-terminal "screen-256color"
set -g mouse on

# initialize TPM
run '~/.tmux/plugins/tpm/tpm'
```

### ● 플러그인 설치

tmux 내에서:

```
Ctrl+b + :
source-file ~/.tmux.conf

Ctrl+b + I   # Plugin Install
```
