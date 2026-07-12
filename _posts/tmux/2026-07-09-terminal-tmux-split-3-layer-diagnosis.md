---
title       : "화면이 반씩 나뉠 때 — 터미널/tmux 3계층 진단"
description : "터미널 화면이 반반으로 나뉘면 Ghostty split·tmux pane·tmux 세션 셋 중 하나. list-clients로 계층을 특정하고 그 계층 키로 닫는다."
date        : 2026-07-09 21:00:00 +0900
updated     : 2026-07-09 21:00:00 +0900
categories  : [tmux]
tags        : [ghostty, split, pane, troubleshooting]
pin         : false
hidden      : false
---

터미널 화면이 갑자기 반반으로 나뉘면 원인이 3계층 중 하나다. `tmux list-clients`로 계층을 특정한 뒤 그 계층의 닫기 키를 쓴다.

## 3계층 구분

| 계층 | 정체 | 단서 |
|------|------|------|
| 1. 터미널 분할 | Ghostty가 창을 여러 surface로 쪼갬 | 각 분할이 **서로 다른 tty**로 tmux에 attach |
| 2. tmux pane | 한 window 안의 pane split | 같은 tty, 같은 세션 |
| 3. tmux 세션 | 세션 여러 개가 붙음 | `list-sessions`에 여러 attached |

## 진단: tmux list-clients

```sh
tmux list-clients
# /dev/ttys000: 1-workspace [127x132 xterm-ghostty] (attached,focused)
# /dev/ttys004: 1-workspace [127x132 xterm-ghostty] (attached)
```

핵심 판독:
- **tty가 다르다**(ttys000 vs ttys004) → tmux pane이 아니라 **터미널(Ghostty)이 창을 쪼갠 것**. 각 분할이 각자 셸을 띄워 `tmux attach` 함.
- 같은 세션명(`1-workspace`)이 두 번 → 세션 문제도 아님. 한 세션에 클라이언트 둘이 붙은 것.
- 폭이 정확히 절반(127칸씩) → 좌우 반분할.
- `xterm-ghostty` → `$TERM`이 터미널 종류가 Ghostty임을 드러냄.

즉 "반씩 뜬다"의 정체는 tmux가 아니라 **Ghostty split**이었다. `Ghostty`(ghost + tty)는 GPU 가속 터미널로 자체 split/탭 기능을 가져 tmux 없이도 화면을 쪼갠다 — "tmux pane이겠거니"라는 선입견이 오진의 원인.

## 계층별 되돌리기

```text
# 1. Ghostty 분할 (기본 키, 커스텀 없으면)
Cmd+D            좌우 분할  (실수로 눌린 범인)
Cmd+Shift+D      상하 분할
Cmd+W            현재 분할 닫기 ← 되돌리기
Cmd+[  Cmd+]     분할 간 이동
Cmd+Shift+Enter  현재 분할 전체화면 토글(닫지 않고 크게만)

# 2. tmux pane
prefix x         현재 pane 닫기 (y 확인)
prefix z         pane 전체화면 토글

# 3. tmux 세션
prefix s         세션 트리에서 선택/정리
```

## 함정

- Ghostty split을 `Cmd+W`로 닫아도 **tmux 세션은 안 죽는다** — 클라이언트 하나가 detach될 뿐. `default`·`workspace` 세션은 그대로 살아있음.
- 닫을 때 "정말 닫을까?" 확인이 뜨는 건 그 surface에서 `tmux attach` 프로세스가 실행 중이기 때문. 확인하면 됨.
