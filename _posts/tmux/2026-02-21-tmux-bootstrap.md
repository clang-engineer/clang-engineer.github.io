---
title       : 🧷 tmux 초기 셋업용 세션/윈도우/패널 스크립트
description : main/sub 세션을 만들고 main에서 좌/우 + 오른쪽 상/하 분할을 구성하는 초기 셋업 스크립트 기록.
date        : 2026-02-21 10:05:00 +0900
updated     : 2026-07-09 16:00:00 +0900
categories  : [tmux, "스크립트·플러그인"]
tags        : [terminal, tpm, plugin]
pin         : false
hidden      : false
---

main/sub 세션을 나누고, main은 2개 window로 분리한 뒤
첫 window에서 좌/우 + 오른쪽 상/하 분할을 만드는 초기 셋업 기록.
필요할 때 파일 하나로 바로 띄우는 목적.

같은 일을 하는 전용 도구로 [tmuxinator](https://github.com/tmuxinator/tmuxinator)(YAML로 레이아웃 선언)나 [tmuxp](https://github.com/tmux-python/tmuxp)가 있다. 다만 여기선 Ruby/Python 의존성 없이 셸 한 장으로 어디서든 재현하려는 게 목적이라, `tmux` 명령만으로 직접 짠다. (두 방식의 비교와 선택 기준은 아래 [§4 선언형 대안](#4-선언형-대안--tmuxinator--tmuxp))

> 이 글은 [tmux 로드맵](/posts/tmux/2026-06-16-tmux-roadmap/)의 **3단계(세션 부트스트랩 자동화)** 다. 입문·설정·플러그인 단계는 로드맵에서.
{: .prompt-tip }

---

## 1. 스크립트

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

## 2. 실행 방법

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

## 3. 구조 변경 예시

### ● 윈도우 이름 변경

```bash
tmux new-session -d -s "$MAIN_SESSION" -n "editor"
tmux new-window -t "$MAIN_SESSION" -n "api"
tmux new-window -t "$MAIN_SESSION" -n "ops"
```

### ● 패널 이름(타이틀) 지정

pane 자체에 "이름"을 붙이는 개념은 없고, 대신 pane title을 설정해서 표시한다.
표시 위치는 pane-border-format으로 제어한다.

```bash
# pane title 지정
tmux select-pane -t "$MAIN_SESSION":0.0 -T "editor"
tmux select-pane -t "$MAIN_SESSION":0.1 -T "logs"
tmux select-pane -t "$MAIN_SESSION":0.2 -T "shell"

# 타이틀 표시(하단). 필요하면 .tmux.conf에 넣어도 됨
tmux set -g pane-border-status bottom
tmux set -g pane-border-format " #P: #T "
```

### ● 패널 레이아웃 변경 (좌우 2분할)

```bash
tmux split-window -h -t "$MAIN_SESSION":0
```

### ● 특정 프로젝트 폴더로 이동

```bash
tmux send-keys -t "$MAIN_SESSION":0.0 "cd ~/project" C-m
tmux send-keys -t "$MAIN_SESSION":1 "cd ~/project" C-m
```

---

## 4. 선언형 대안 — tmuxinator / tmuxp

위 스크립트는 `tmux` 명령을 순서대로 부르는 **명령형**이다. 같은 레이아웃을 **선언형**(YAML로 "이런 모양"만 적고 실행은 도구에 맡기는 방식)으로 관리하고 싶다면 전용 도구가 있다. 위 `main` 세션(3-pane + `secondary` 윈도우)을 [tmuxinator](https://github.com/tmuxinator/tmuxinator)로 옮기면 이렇게 된다.

```yaml
# ~/.config/tmuxinator/main.yml
name: main
windows:
  - main:
      layout: main-vertical      # 좌 1 + 우 2 분할
      panes:
        - cd ~/
        - cd ~/
        - cd ~/
  - secondary: cd ~/
```

`mux start main` 한 줄이면 이 세션이 뜬다. [tmuxp](https://github.com/tmux-python/tmuxp)도 거의 같은 YAML을 쓰고 `tmuxp load main.yaml`로 실행한다.

| | 셸 스크립트 (이 글) | tmuxinator / tmuxp |
|---|---|---|
| 의존성 | 없음 (`tmux`만) | Ruby / Python 런타임 |
| 표현 | 명령형 — 조건 분기·로직 자유 | 선언형 — 레이아웃이 한눈에, 재사용 쉬움 |
| 세션 여러 개 | 한 스크립트에 다 넣음 | 보통 프로젝트당 파일 하나 |
| 이식성 | 서버·컨테이너 어디서든 | 런타임 깔린 곳만 |

- **tmuxinator** (Ruby): `gem install tmuxinator`, 설정은 `~/.config/tmuxinator/*.yml`. `mux` 별칭으로 프로젝트별 세션을 관리하는 데 강하다.
- **tmuxp** (Python): `pip install tmuxp`. YAML/JSON 둘 다 되고, `tmuxp freeze`로 **지금 떠 있는 세션을 그대로 config로 뽑아** 준다 — 손으로 만든 세션을 선언형으로 옮길 때 편하다.

기준은 단순하다 — **의존성 없이 어디서든 재현**이 우선이면 이 글의 셸 스크립트, **레이아웃을 여러 프로젝트에 걸쳐 선언적으로 관리**하고 런타임 설치가 부담 없으면 tmuxinator/tmuxp다.

---

## 5. 참고

* `tmux has-session`은 세션 존재 여부만 확인한다.
* 기존 main 세션이 있으면 구조를 다시 만들지 않고 attach만 수행한다.
* 세션 이름만 바꿔두면 용도별 스크립트를 여러 개 만들어두기 좋다.
