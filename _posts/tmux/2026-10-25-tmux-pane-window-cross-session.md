---
title       : "tmux Pane·Window를 세션 사이에서 이동하는 방법과 대상 지정"
description : "tmux target-session·target-window·target-pane의 차이, join-pane과 move-window, pane index와 고유 ID를 이해한다"
date        : 2026-10-25 19:50:00 +0900
categories  : [tmux, "사용법"]
tags        : [tmux, pane, window, session, target, join-pane]
pin         : false
hidden      : false
---

tmux는 Pane을 다른 Window로 옮기거나 Window 전체를 다른 Session으로 이동할 수 있다. 핵심은 **대상(target)의 종류**를 구분하는 것이다. Pane은 각각 독립된 PTY·프로세스와 연결되므로 `join-pane`은 프로세스를 합치는 것이 아니라 표시 위치를 옮기는 동작이다.

## 패널/윈도우 세션 간 이동

| 명령어 | 설명 |
|--------|------|
| `Prefix !` | 현재 패널을 별도 윈도우로 분리 (`break-pane`) |
| `join-pane -s <src> -t <dst>` | 패널을 다른 윈도우로 합치기 |
| `move-window -t <session>:` | 현재 윈도우를 다른 세션의 빈 슬롯으로 이동 |
| `move-window -s <src> -t <target>` | 특정 창을 특정 세션/위치로 이동 |

### 타겟 형식 (`-s`, `-t` 공통)

기본 모양은 `session:window.pane`이다. 단, tmux 명령마다 필요한 target 타입이 다르다.

| 명령이 요구하는 타입 | 기본 형식 | 예 |
|---|---|---|
| `target-session` | `session` | `attach -t work` |
| `target-window` | `session:window` | `select-window -t work:2` |
| `target-pane` | `session:window.pane` | `select-pane -t work:2.1` |

#### 생략과 구분자

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

#### 단일 값 `-t 1`의 함정

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
tmux send-keys -t %12    # pane ID 12로 명시
```

> **index vs id**: `window.pane` 번호(`pane_index`)는 위치 기반이라 pane 추가/삭제 시 재정렬된다. 반면 `pane_id`(`%0`, `%12` — `$TMUX_PANE`에 들어있는 값)는 pane 생존 동안 불변이다. 스크립트로 특정 pane을 조준할 땐 index보다 `%id`가 안전하다. 매핑은 `tmux list-panes -F '#{pane_id} #{window_index}.#{pane_index}'`.

### join-pane 옵션

**`-h` / `-v`는 경계선이 아니라 pane을 쌓는 방향 기준**으로 기억한다.
- `-h` (horizontal): **옆으로 쌓기** → 좌우 배치, 경계선은 세로 `│`
- `-v` (vertical): **아래로 쌓기** → 위아래 배치, 경계선은 가로 `─`

| 옵션 | 설명 |
|------|------|
| `-s` | source (가져올 페인). 생략 시 **마지막 marked 페인 / 직전 활성 페인** |
| `-t` | target (붙일 위치 = 옆에 split됨). 생략 시 현재 페인 |
| `-h` | 좌우 분할 (horizontal하게 늘어섬) — `Prefix %` 와 같음 |
| `-v` | 상하 분할 (vertical하게 쌓임, 기본값) — `Prefix "` 와 같음 |

```
-h (좌우)         -v (상하, 기본)
┌────┬────┐      ┌─────────┐
│ A  │ B  │      │    A    │
│    │    │      ├─────────┤
└────┴────┘      │    B    │
                 └─────────┘
```

> `join-pane -t 1`처럼 `-t`만 쓰면 source가 암묵적으로 잡혀서 의도와 다르게 동작할 수 있음. 보통 `-s`를 명시.

> pane은 독립 셸/PTY라 두 pane 융합은 불가 — "병합"은 `join-pane`으로 하나씩 모으는 것.
> 원리 상세: blog "tmux엔 왜 pane '병합(merge)'이 없을까 — pane은 살아있는 프로세스다".

### 세션 간 이동 예시

```bash
# 같은 세션 내: 윈도우 3의 pane을 윈도우 1로 합치기
tmux join-pane -s 3 -t 1 -h

# 다른 세션: 세션명:윈도우번호 형식 사용
tmux join-pane -s 0-default:1 -t 1-workspace:1 -h

# 현재 윈도우를 다른 세션으로 통째로 이동
tmux move-window -t 0-default:

# 특정 창을 세션의 지정 위치로 이동
tmux move-window -s 2 -t 1-workspace:1

# 커스텀 바인딩: Prefix M으로 세션 간 윈도우 이동
# bind-key M command-prompt -p "move to session:" "move-window -t '%%:'"
```

> **주의**: `join-pane`에서 윈도우 **이름**이 아닌 **번호**를 사용. 현재 윈도우를 source로 지정하면 에러.



## 관련 자료

- [tmux 기본 명령 치트시트](https://github.com/clang-engineer/devkit/blob/main/reference/cheatsheets/tmux.md)
- [tmux 로드맵](./2026-06-16-00-tmux-roadmap.md)
