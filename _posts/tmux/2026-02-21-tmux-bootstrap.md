---
title       : 🧷 tmux 세션 부트스트랩 — 세션 매니저와 그 속살(셸 스크립트)
description : 같은 세션/윈도우/패널을 매번 손으로 세팅하지 않으려면 세션 매니저(smug·tmuxinator·tmuxp)가 정석. 그 도구가 내부에서 부르는 tmux 명령을 셸로 해부해 원리까지 잡는다.
date        : 2026-02-21 10:05:00 +0900
updated     : 2026-07-11 10:00:00 +0900
categories  : [tmux, "스크립트·플러그인"]
tags        : [terminal, tpm, plugin]
pin         : false
hidden      : false
---

같은 작업 환경(세션·윈도우·패널)을 매번 손으로 세팅하지 않으려면 **세션 부트스트랩**이 답이다. 그런데 이건 이미 해결된 문제다 — [tmuxinator](https://github.com/tmuxinator/tmuxinator)(2011~)·[tmuxp](https://github.com/tmux-python/tmuxp)·[smug](https://github.com/ivaaaan/smug) 같은 **세션 매니저**가 YAML 한 장으로 레이아웃을 선언하면 알아서 띄워준다. **결론부터: 이걸 써라.** 매번 셸로 직접 짜는 건 바퀴 재발명이다.

그럼 이 글은 왜 셸 스크립트까지 다루나 — **세션 매니저가 안에서 하는 일이 정확히 그거이기 때문**이다. smug도 tmuxinator도 결국 `tmux new-session`·`split-window`를 순서대로 부르는 래퍼다. 그 속살을 셸로 한 번 짜보면 도구가 뭘 대신해 주는지, 왜 YAML 몇 줄이 그렇게 동작하는지 손에 잡힌다. 그래서 이 글은 **(1) 정석인 세션 매니저를 먼저 세우고 → (2) 그 아래 메커니즘을 셸로 해부**한다. 쓰라는 건 도구고, 셸은 원리를 보기 위한 해부용이다.

> 이 글은 [tmux 로드맵](/posts/tmux/2026-06-16-tmux-roadmap/)의 **3단계(세션 부트스트랩 자동화)** 다. 입문·설정·플러그인 단계는 로드맵에서. 여기 나오는 세션 매니저는 2단계 TPM 플러그인과 **다른 축** — tmux *안*에서 도는 플러그인이 아니라 tmux *밖*의 외부 CLI다.
{: .prompt-tip }

---

## 1. 정석 — 세션 매니저로 선언하기

레이아웃을 "이런 모양"이라고 YAML로 적으면 끝이다. `main` 세션(좌 1 + 우 2, 3-pane + `secondary` 윈도우)을 [smug](https://github.com/ivaaaan/smug)로 옮기면 이렇게 된다.

```yaml
# ~/.config/smug/main.yml
session: main
root: ~/                    # 모든 pane 시작 디렉토리 — 셸의 `cd ~/`가 통째로 사라진다
attach: true
windows:
  - name: main
    layout: main-vertical   # 좌 1 + 우 2 분할
    panes:                  # 암묵 base pane 1개 + 아래 2개 분할 = 3-pane
      - type: vertical
      - type: vertical
  - name: secondary
```

`smug start main` 한 줄이면 이 세션이 뜬다. 설치는 Go 단일 바이너리(`brew install smug`)라 Ruby/Python 런타임 의존이 없다.

tmuxinator·tmuxp도 거의 같은 YAML을 쓴다. tmuxinator 버전:

```yaml
# ~/.config/tmuxinator/main.yml
name: main
root: ~/
windows:
  - main:
      layout: main-vertical
      panes:
        -
        -
        -
  - secondary:
```

`mux start main`으로 실행하고, **이미 떠 있으면 새로 만들지 않고 attach**한다 — 아래 셸 스크립트의 `has-session` 분기(§2)가 도구에선 기본 동작으로 들어 있다.

### 어느 걸 고르나 — 조건부 순위

| | [smug](https://github.com/ivaaaan/smug) | [tmuxp](https://github.com/tmux-python/tmuxp) | [tmuxinator](https://github.com/tmuxinator/tmuxinator) |
|---|---|---|---|
| 런타임 | **Go 단일 바이너리 (무의존)** | Python | Ruby |
| 설치 | `brew install smug` | `pip install tmuxp` | `gem install tmuxinator` |
| 실행 | `smug start main` | `tmuxp load main` | `mux start main` |
| 강점 | 이식성 — 서버·컨테이너 어디서든 | `freeze`로 세션→config 역추출 | 자료·예제 최다, 클래식 |
| 활성·모멘텀 | 니치·저활동 (★0.9k, ~16커밋/년) | 최다 활동이나 사실상 1인 메인테이너 ⚠️ (★4.5k, ~690커밋/년) | 성숙·기득권, 활동 저조하나 커뮤니티 넓음 (★13.7k, ~31커밋/년) |

셋 다 설치 명령이 제각각(`brew`/`pip`/`gem`)인 데서 드러나듯, TPM `@plugin`으로 까는 플러그인이 아니라 **각자 독립 프로그램**이다. 셸에서 직접 실행해 tmux를 밖에서 부린다.

1. **무의존이 최우선(서버·컨테이너 오감)이면 smug** — 런타임 0. 이식성이 목적이면 가장 정확히 맞는다.
2. **이미 Python 환경이면 tmuxp** — `tmuxp freeze`로 지금 떠 있는 세션을 그대로 config로 뽑아 준다. 손으로 만든 세션을 선언형으로 옮길 때 최고.
3. **레퍼런스·예제가 많아야 하면 tmuxinator** — 점유율 1위지만 Ruby 의존이라 지금 새로 시작할 결정적 이유는 약하다.

---

## 2. 속살 — 도구가 부르는 tmux 명령

여기부터는 "쓰는 법"이 아니라 "원리"다. 위 YAML이 실행되면 세션 매니저가 내부에서 하는 일이 결국 이거다 — `tmux` 명령을 순서대로 부르는 것뿐:

```bash
#!/usr/bin/env bash

set -euo pipefail

MAIN_SESSION="main"
SUB_SESSION="sub"

# 이미 main 세션이 있으면 바로 붙기 (도구의 "떠 있으면 attach"에 해당)
if tmux has-session -t "$MAIN_SESSION" 2>/dev/null; then
  tmux attach -t "$MAIN_SESSION"
  exit 0
fi

# 1) main 세션 생성 + 첫 윈도우
tmux new-session -d -s "$MAIN_SESSION" -n "main"

# 2) 첫 윈도우: 좌/우 분할 + 오른쪽 상/하 분할 (총 3 panes) → smug의 layout: main-vertical
tmux split-window -h -t "$MAIN_SESSION":0
tmux split-window -v -t "$MAIN_SESSION":0.1

# 시작 디렉토리 지정 → smug/tmuxinator의 root: ~/ 한 줄이 대신하는 부분
tmux send-keys -t "$MAIN_SESSION":0.0 "cd ~/" C-m
tmux send-keys -t "$MAIN_SESSION":0.1 "cd ~/" C-m
tmux send-keys -t "$MAIN_SESSION":0.2 "cd ~/" C-m

# 3) main 두 번째 윈도우 → windows: 목록의 secondary 항목
tmux new-window -t "$MAIN_SESSION" -n "secondary"
tmux send-keys -t "$MAIN_SESSION":1 "cd ~/" C-m

# 4) sub 세션 생성 → 도구에선 보통 파일 하나 = 세션 하나라, 별도 config가 된다
tmux new-session -d -s "$SUB_SESSION" -n "sub"
tmux send-keys -t "$SUB_SESSION":0 "cd ~/" C-m

# 5) main 첫 윈도우로 이동 후 attach
tmux select-window -t "$MAIN_SESSION":0
tmux attach -t "$MAIN_SESSION"
```

한 줄씩 보면 도구의 정체가 드러난다 — `new-session`으로 세션을 만들고, `split-window`로 쪼개고, `send-keys`로 명령을 밀어넣고, `attach`로 붙는다. smug의 `layout: main-vertical`은 저 `split-window` 두 줄이고, `root: ~/`는 저 `send-keys "cd ~/"` 세 줄이며, `attach: true`는 마지막 `tmux attach`다. 맨 위 `has-session` 분기가 "이미 떠 있으면 attach"에 해당한다. **도구는 이 나열을 YAML 뒤에 숨겨 줄 뿐, 하는 일은 똑같다.**

한 가지 차이 — 이 스크립트는 `main`·`sub` **두 세션을 한 파일**에 넣었는데, 세션 매니저는 보통 **파일 하나 = 세션 하나**다. 도구로 옮기면 `main.yml`·`sub.yml` 둘로 갈라지는데, 용도별로 분리되니 오히려 관리가 깔끔해진다.

### 실행 방법 (셸 버전)

```bash
mkdir -p ~/bin
vi ~/bin/tmux-work.sh
chmod +x ~/bin/tmux-work.sh
~/bin/tmux-work.sh
```

---

## 3. 만져보는 tmux 프리미티브

도구가 감싸는 명령들을 직접 바꿔 보면 원리가 더 붙는다.

### ● 윈도우 이름 변경

```bash
tmux new-session -d -s "$MAIN_SESSION" -n "editor"
tmux new-window -t "$MAIN_SESSION" -n "api"
tmux new-window -t "$MAIN_SESSION" -n "ops"
```

### ● 패널 이름(타이틀) 지정

pane 자체에 "이름"을 붙이는 개념은 없고, 대신 pane title을 설정해 표시한다. 표시 위치는 `pane-border-format`으로 제어한다.

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

## 4. 참고

* **세션 매니저는 2단계 TPM 플러그인과 다른 축이다.** tmux *밖*의 외부 CLI이고, `tmux-resurrect`/`continuum`(떠 있던 세션을 저장→복원)과도 목적이 다르다 — 세션 매니저는 레이아웃을 처음부터 **선언→생성**한다.
* **선언형 3종은 다 성숙기 — 요즘 모멘텀은 다른 범주다.** [sesh](https://github.com/joshmedeski/sesh) 같은 **온디맨드 세션 스위처**(fzf·zoxide로 디렉토리에서 즉석 세션 생성)로 실력자들이 옮겨가는 중이다 — 생성 2.5년에 ★2.7k, 나이 대비 성장률이 이 셋보다 높다. 고정 레이아웃을 *선언*하는 이 글과 목적이 달라 스코프 밖이지만, 방향은 알아둘 것.
* `tmux has-session`은 세션 존재 여부만 확인한다. 도구의 "이미 있으면 attach"가 이걸 대신한다.
* 셸로 직접 짜는 게 유일해지는 건 **바이너리 하나도 못 까는 극한 환경**(락다운된 서버, 임시 컨테이너) 정도다. 그 외엔 세션 매니저가 상위호환이다.
