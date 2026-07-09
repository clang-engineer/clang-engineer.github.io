---
title       : 🧷 tmux 정리본 (Cheat Sheet + 사용 가이드)
description : "터미널 멀티플렉서 tmux의 세션·윈도우·패널 구조와 설치, ~/.tmux.conf 설정, 자주 쓰는 단축키를 한 번에 찾아볼 수 있는 Cheat Sheet 형식으로 정리한다."
date        : 2021-11-30 22:50:30 +0900
updated     : 2026-06-19 00:00:00 +0900
categories  : [tmux, "설정·옵션"]
tags        : [terminal]
pin         : false
hidden      : false
---

tmux는 여러 개의 터미널 세션을 생성하고 관리할 수 있게 해주는 **터미널 멀티플렉서**이다.
한 세션 안에 여러 개의 **윈도우(window) → 패널(pane)** 을 둘 수 있다.

구조:
**세션(Session) > 윈도우(Window) > 패널(Pane)**

> 이 글은 [tmux 로드맵](/posts/tmux/2026-06-16-tmux-roadmap/)의 **입문** 단계다. 설정·플러그인·자동화로 이어지는 전체 학습 경로는 로드맵에서.
{: .prompt-tip }

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

## 3. 세션(Session)

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
join-pane -s 2 -t 1   # 2번을 집어서 → 1번 옆에 합치기 (2가 이동)
break-pane -s 1 -t 2  # 1번 윈도우를 2번 윈도우로 분리
swap-pane -s 1 -t 2   # 두 패널 자리 교환
swap-window -s 1 -t 2 # 두 윈도우 자리 교환
```

> **`-s`/`-t`가 매번 헷갈린다면** — 이게 join/swap의 핵심이자 tmux 명령 전반의 공통 문법이다.
>
> - **`-s`(source)는 움직이는 것, `-t`(target)는 도착지.** source가 target 쪽으로 간다. (`swap`은 자리 교환이라 방향이 대칭)
> - 값은 그냥 숫자가 아니라 주소다. 형식은 왼쪽부터 큰 단위 → **`세션:윈도우.패널`** (`work:2.1`). 생략한 자리는 "현재"로 채워진다: `-t 1`=현재 세션의 윈도우 1, `-t .1`=현재 윈도우의 패널 1. **점(`.`)이 있으면 패널, 없으면 윈도우.**
> - `-s`를 **생략하면 현재(또는 마크된) 패널**이 source다. 의도치 않게 딸려가니 스크립트·바인딩에선 `-s`를 명시.
> - `join-pane`에서 **현재 윈도우를 source로 지정하면 에러**. source는 다른 윈도우여야 한다.
> - 번호가 헷갈리면 `Ctrl+b` + `q`로 패널 번호를 화면에 띄워 확인.
{: .prompt-tip }

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

ctrl + b 를 누르고 option + 방향키로 사이즈 조절 (macOS)
```

---

## 6. 복사/붙여넣기(Copy Mode)

### ● 진입/종료

* `Ctrl+b` + `[` : 복사모드 진입
* `Ctrl+b` + `]` : 붙여넣기

### ● 복사모드 단축키

아래 표는 vi 키 기준이다. tmux 기본은 emacs 키맵이므로, `h/j/k/l`·`g/G` 같은 vi 이동을 쓰려면 `~/.tmux.conf`에 한 줄이 필요하다.

```tmux
setw -g mode-keys vi
```

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
