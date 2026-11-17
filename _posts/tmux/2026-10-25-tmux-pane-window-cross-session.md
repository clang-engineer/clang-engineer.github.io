---
title       : "tmux 작업공간과 대상 지정 — Pane·Window를 세션 사이에서 옮기기"
description : "Session·Window·Pane의 관계와 연결 수명을 이해하고, target 타입·주소·고유 ID로 실행 중인 작업을 다른 창과 세션으로 옮긴다."
date        : 2026-10-25 19:50:00 +0900
categories  : [tmux, "사용법"]
tags        : [tmux, pane, window, session, target, join-pane]
updated     : 2026-11-18 00:00:00 +0900
pin         : false
hidden      : false
redirect_from:
  - /posts/tmux/2021-11-30-tmux-config/
---

tmux에서 작업공간을 옮길 때는 **무엇을 옮기는지**와 **어디를 가리키는지**를 구분해야 한다. Pane을 다른 Window로 옮기는 것, Window 전체를 다른 Session으로 옮기는 것, Client가 다른 Session을 보는 것은 서로 다른 동작이다. 기본 구조에서 출발해 target 문법과 실제 이동을 연결해 보자.

## 먼저 작업공간과 연결을 구분하기

tmux Server가 작업공간을 관리하고, Client는 Socket을 통해 Server에 접속해 Session을 표시한다. Session은 Window를 참조하는 작업 묶음이고, Window는 Pane의 배치를 담는다. Pane은 프로세스 자체가 아니라 **PTY(의사 터미널)를 통해 셸이나 프로그램을 실행하는 터미널 영역**이다. 하나의 Window를 여러 Session에서 참조할 수도 있다.

따라서 `Ctrl+b` 뒤에 `d`를 눌러 Client를 detach해도 Server와 Session이 살아 있으면 작업은 계속될 수 있다. `kill-session`이나 `kill-server`는 연결 해제와 달리 작업공간을 종료하므로 재접속과 같은 의미로 쓰면 안 된다.

```bash
tmux new -s work       # 새 작업공간 생성 후 접속
# Ctrl+b를 누르고 뗀 뒤 d로 detach
tmux attach -t work    # 실행 중인 작업공간에 다시 접속
```

같은 구분은 화면 조작에도 적용된다.

| 하려는 일 | 바꾸는 대상 | 대표 조작 |
|---|---|---|
| 다른 작업 묶음 보기 | Client가 보는 Session | `switch-client -t work`, `Ctrl+b w`에서 선택 |
| 같은 작업 묶음 안에서 화면 전환 | Session의 현재 Window | `Ctrl+b n/p`, `select-window` |
| 화면을 나누거나 한 영역 선택 | Window의 Pane 배치·활성 Pane | `Ctrl+b %` / `"`, 방향키 |
| 한 Pane만 크게 보기 | Window의 zoom 상태 | `Ctrl+b z` |
| 실행 중인 Pane을 다른 곳에 배치 | Pane이 속한 Window | `join-pane`, `break-pane` |

`join-pane`은 기존 Pane의 표시 위치를 옮긴다. 다른 Pane의 셸에 상태나 프로세스를 합치는 명령이 아니다. “분할을 없애고 하나만 남기기”가 목적이라면 종료할 Pane에서 `Ctrl+b x`를 쓰며, 그 Pane의 실행 중인 작업도 종료될 수 있다.

전체 기본 키·설치·설정 명령은 [devkit tmux 치트시트](https://github.com/clang-engineer/devkit/blob/main/reference/cheatsheets/tmux.md), Server·Client와 작업공간의 전체 관계는 [tmux 로드맵](./2026-06-16-00-tmux-roadmap.md)을 참고한다. 여기서는 작업을 종료하지 않고 **주소를 지정해 재배치하는 방법**에 집중한다.

## 패널/윈도우 세션 간 이동

| 명령어 | 설명 |
|--------|------|
| `Prefix !` | 현재 패널을 별도 윈도우로 분리 (`break-pane`) |
| `join-pane -s <src> -t <dst>` | 패널을 다른 윈도우로 합치기 |
| `move-window -t <session>:` | 현재 윈도우를 다른 세션의 빈 슬롯으로 이동 |
| `move-window -s <src> -t <target>` | 특정 창을 특정 세션/위치로 이동 |

## 대상 주소 읽기

기본 모양은 `session:window.pane`이다. 단, tmux 명령마다 필요한 target 타입이 다르다.

| 명령이 요구하는 타입 | 기본 형식 | 예 |
|---|---|---|
| `target-session` | `session` | `attach -t work` |
| `target-window` | `session:window` | `select-window -t work:2` |
| `target-pane` | `session:window.pane` | `select-pane -t work:2.1` |

### 생략과 구분자

- session을 생략하면 현재 세션, 없으면 최근 세션을 사용한다.
- window를 생략하면 해당 세션의 현재 윈도우를 사용한다.
- pane을 생략하면 해당 윈도우의 active pane을 사용한다.
- `:`는 session/window 경계, `.`은 window/pane 경계다.

| 표기 | 의미 |
|------|------|
| `mysess:2.1` | `mysess` 세션의 2번 윈도우, 1번 pane |
| `:2.1` | 현재 세션의 2번 윈도우, 1번 pane |
| `:.1` | 현재 세션/현재 윈도우의 1번 pane |
| `:2` | 현재 세션의 2번 윈도우 또는 그 윈도우의 active pane |
| `mysess:` | `mysess` 세션의 현재 윈도우 또는 빈 윈도우 슬롯이 필요한 명령에서는 다음 빈 index |

### 단일 값 `-t 1`의 함정

`-t 1`처럼 `:`, `.`, `%`로 명시하지 않으면 **명령이 요구하는 target 타입**과 현재 상태에 따라 tmux가 가장 그럴듯한 대상을 고른다.

```bash
tmux select-pane -t 1    # 보통 현재 window의 pane 1. 없으면 window/session 쪽으로도 해석 시도
tmux select-window -t 1  # window 1
tmux attach -t 1         # session 1 또는 이름/접두어가 1인 session
```

스크립트나 자동화에서는 모호한 단일 숫자를 피한다.

```bash
tmux select-pane -t :.1  # 현재 window의 pane 1로 명시
tmux select-window -t :1 # 현재 session의 window 1로 명시
tmux display-message -p -t %12 '#{pane_id}' # 이미 조회한 pane ID를 직접 지정
```

> **index vs id**: `window.pane` 번호(`pane_index`)는 위치 기반이라 pane 추가/삭제 시 재정렬된다. 반면 `pane_id`(`%0`, `%12` — `$TMUX_PANE`에 들어있는 값)는 pane 생존 동안 불변이다. 스크립트로 특정 pane을 조준할 땐 index보다 `%id`가 안전하다. 매핑은 `tmux list-panes -F '#{pane_id} #{window_index}.#{pane_index}'`.

실제 Pane과 프로세스의 연결은 다음처럼 조회한다.

```bash
tmux list-panes -a -F '#{session_name}:#{window_index}.#{pane_index} #{pane_id} #{pane_tty} #{pane_pid} #{pane_current_command}'
```

`pane_pid`는 Pane의 최초 프로세스 PID이고, `pane_current_command`는 현재 실행 중인 명령 이름이다. 자식 프로그램이 실행 중이면 두 값이 같은 프로세스를 가리키는 것은 아니다. 주소의 index는 달라져도 **같은 Pane의 ID·PTY·최초 프로세스를 비교**하면 재배치와 새 실행을 구별할 수 있다.

## join-pane 옵션

**`-h` / `-v`는 경계선이 아니라 pane을 쌓는 방향 기준**으로 기억한다.
- `-h` (horizontal): **옆으로 쌓기** → 좌우 배치, 경계선은 세로 `│`
- `-v` (vertical): **아래로 쌓기** → 위아래 배치, 경계선은 가로 `─`

| 옵션 | 설명 |
|------|------|
| `-s` | source(가져올 Pane). 생략하면 marked Pane이 있을 때 그것을, 없으면 현재 Pane을 사용 |
| `-t` | target (붙일 위치 = 옆에 split됨). 생략 시 현재 페인 |
| `-h` | 좌우 분할 (horizontal하게 늘어섬) — `Prefix %` 와 같음 |
| `-v` | 상하 분할 (vertical하게 쌓임, 기본값) — `Prefix "` 와 같음 |
| `-b` | 기본 위치의 반대쪽, 즉 target의 왼쪽 또는 위에 붙임 |
| `-d` | 이동한 Pane을 새 활성 Pane으로 선택하지 않음 |

```text
-h (좌우)         -v (상하, 기본)
┌────┬────┐      ┌─────────┐
│ A  │ B  │      │    A    │
│    │    │      ├─────────┤
└────┴────┘      │    B    │
                 └─────────┘
```

> `join-pane -t 1`처럼 `-t`만 쓰면 source가 암묵적으로 잡혀서 의도와 다르게 동작할 수 있음. 보통 `-s`를 명시.

> Pane이 다른 Window로 옮겨져도 그 Pane의 PTY와 실행 중인 프로그램은 유지된다. 반대로 모든 Pane을 하나의 셸로 “융합”하는 기능은 아니다.

## 세션 간 이동 예시

```bash
# 같은 세션 내: 윈도우 3의 active pane을 윈도우 1로 이동
tmux join-pane -s :3 -t :1 -h

# 다른 세션: 세션과 윈도우를 함께 명시
tmux join-pane -s source:editor -t work:logs -h

# 현재 윈도우를 다른 세션의 빈 슬롯으로 통째로 이동
tmux move-window -t work:

# 특정 창을 지정 위치로 이동 (대상 index가 이미 사용 중이면 기본적으로 실패)
tmux move-window -s source:2 -t work:5

# 커스텀 바인딩: Prefix M으로 세션 간 윈도우 이동
# bind-key M command-prompt -p "move to session:" "move-window -t '%%:'"
```

Window 이름도 target에 사용할 수 있다. 예를 들어 `source:editor`는 `source` Session의 `editor` Window에 있는 active Pane이다. 이름이 겹치거나 prefix 매칭이 모호하면 주소가 의도와 달라질 수 있으므로, 자동화에서는 고유 Pane ID 또는 충분히 명시한 주소를 사용한다. `join-pane`의 source와 target으로 **동일 Pane**을 지정하면 실패한다.

Pane을 가져간 뒤 원래 Window에 Pane이 하나도 남지 않으면 그 Window도 사라진다. Window 이동 역시 Session의 마지막 Window를 옮기면 원래 Session이 사라질 수 있다. 표시 위치만 바꾼다는 말이 **빈 Window·Session까지 유지한다는 뜻은 아니다.**

## 반대 방향의 zoom이 필요하다면 — pane 하나만 임시 이동

`prefix + z`는 활성 pane **하나만 보이게** 한다. 세 pane 중 둘을 남기고 하나만 잠깐 치우는 동작은 아니다. 이 경우 `break-pane`으로 pane 자체를 다른 창에 분리하고, 나중에 `join-pane`으로 가져오는 편이 동작을 설명하기 쉽다.

```tmux
break-pane -d -n _stash   # pane을 새 창으로 빼되 전환하지 않음
join-pane -s :_stash      # 현재 세션의 임시 창 active pane을 현재 pane에 붙임
```

이 방식은 원래 창의 pane 배치를 임시로 바꾸므로 zoom처럼 좌표를 자동 보존하는 기능이 아니다. `_stash`라는 이름의 창이 이미 있거나 여러 pane을 동시에 보관하려 한다면 이름만을 상태 플래그로 쓰는 토글은 충돌한다. 특히 `if-shell` 안에 `list-windows -F '#W'`를 그대로 넣으면 tmux가 셸 실행 전에 `#W`를 현재 창 이름으로 확장해 검사가 엉뚱해질 수 있다. 조건문을 만들 때는 셸이 볼 문자열과 tmux가 **먼저 확장할 포맷**을 분리한다. 설정 파일에서 토글 바인딩을 지운 경우에도 실행 중 서버에는 이전 바인딩이 남을 수 있으므로 `unbind` 또는 새 서버에서 실제 동작을 확인해야 한다.

## 관련 자료

- [tmux 공식 매뉴얼 — target 문법과 join-pane](https://man7.org/linux/man-pages/man1/tmux.1.html)
- [tmux 기본 명령·설정 치트시트](https://github.com/clang-engineer/devkit/blob/main/reference/cheatsheets/tmux.md)
- [플러그인 선택과 저장·복원](./2026-07-11-tmux-plugins-beyond-essentials.md)
- [고정 레이아웃의 세션 부트스트랩](./2026-02-21-tmux-bootstrap.md)
- [tmux 로드맵](./2026-06-16-00-tmux-roadmap.md)
