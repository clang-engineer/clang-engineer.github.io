---
title       : 🧷 tmux 초기 셋업용 세션/윈도우/패널 스크립트
description : main/sub 세션을 만들고 main에서 좌/우 + 오른쪽 상/하 분할을 구성하는 초기 셋업 스크립트 기록.
date        : 2026-02-21 10:05:00 +0900
updated     : 2026-02-21 10:05:00 +0900
categories  : [dev, tools]
tags        : [tmux, terminal, script]
pin         : false
hidden      : false
---

# 🧷 tmux 초기 셋업용 세션/윈도우/패널 스크립트

main/sub 세션을 나누고, main은 2개 window로 분리한 뒤
첫 window에서 좌/우 + 오른쪽 상/하 분할을 만드는 초기 셋업 기록.
필요할 때 파일 하나로 바로 띄우는 목적.

---

# 1. 스크립트

```bash
#!/usr/bin/env bash

set -euo pipefail

MAIN_SESSION="main"
SUB_SESSION="sub"

# 이미 main 세션이 있으면 바로 붙기
if tmux has-session -t "$MAIN_SESSION" 2>/dev/null; then
  tmux attach -t "$MAIN_SESSION"
  exit 0
fi

# 1) main 세션 생성 + 첫 윈도우
tmux new-session -d -s "$MAIN_SESSION" -n "main"

# 2) 첫 윈도우: 좌/우 분할 + 오른쪽 상/하 분할 (총 3 panes)
tmux split-window -h -t "$MAIN_SESSION":0
tmux split-window -v -t "$MAIN_SESSION":0.1

# 필요하면 커맨드 자동 실행
tmux send-keys -t "$MAIN_SESSION":0.0 "cd ~/" C-m
tmux send-keys -t "$MAIN_SESSION":0.1 "cd ~/" C-m
tmux send-keys -t "$MAIN_SESSION":0.2 "cd ~/" C-m

# 3) main 두 번째 윈도우
tmux new-window -t "$MAIN_SESSION" -n "secondary"
tmux send-keys -t "$MAIN_SESSION":1 "cd ~/" C-m

# 4) sub 세션 생성
tmux new-session -d -s "$SUB_SESSION" -n "sub"
tmux send-keys -t "$SUB_SESSION":0 "cd ~/" C-m

# 5) main 첫 윈도우로 이동 후 attach
tmux select-window -t "$MAIN_SESSION":0
tmux attach -t "$MAIN_SESSION"
```

---

# 2. 실행 방법

```bash
# 파일 저장
mkdir -p ~/bin
vi ~/bin/tmux-work.sh

# 실행 권한
chmod +x ~/bin/tmux-work.sh

# 실행
~/bin/tmux-work.sh
```

---

# 3. 구조 변경 예시

## ● 윈도우 이름 변경

```bash
tmux new-session -d -s "$MAIN_SESSION" -n "editor"
tmux new-window -t "$MAIN_SESSION" -n "api"
tmux new-window -t "$MAIN_SESSION" -n "ops"
```

## ● 패널 레이아웃 변경 (좌우 2분할)

```bash
tmux split-window -h -t "$MAIN_SESSION":0
```

## ● 특정 프로젝트 폴더로 이동

```bash
tmux send-keys -t "$MAIN_SESSION":0.0 "cd ~/project" C-m
tmux send-keys -t "$MAIN_SESSION":1 "cd ~/project" C-m
```

---

# 4. 참고

* `tmux has-session`은 세션 존재 여부만 확인한다.
* 기존 main 세션이 있으면 구조를 다시 만들지 않고 attach만 수행한다.
* 세션 이름만 바꿔두면 용도별 스크립트를 여러 개 만들어두기 좋다.
