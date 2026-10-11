---
title       : 🧷 tmux 세션 부트스트랩 — 세션 매니저와 그 속살(셸 스크립트)
description : 같은 세션/윈도우/패널을 매번 손으로 세팅하지 않으려면 세션 매니저(tmuxp·smug·tmuxinator)가 정석. 그 도구가 내부에서 부르는 tmux 명령을 셸로 해부해 원리까지 잡는다.
date        : 2026-02-21 10:05:00 +0900
updated     : 2026-07-11 10:00:00 +0900
categories  : [tmux, "스크립트·플러그인"]
tags        : [terminal, tpm, plugin]
pin         : false
hidden      : false
redirect_from:
  - /posts/tmux/2026-07-11-smug-minimal-tmux-session-manager/
---

같은 작업 환경(세션·윈도우·패널)을 매번 손으로 세팅하지 않으려면 **세션 부트스트랩**이 답이다. 그런데 이건 이미 해결된 문제다 — [tmuxinator](https://github.com/tmuxinator/tmuxinator)(2011~)·[tmuxp](https://github.com/tmux-python/tmuxp)·[smug](https://github.com/ivaaaan/smug) 같은 **세션 매니저**가 YAML 한 장으로 레이아웃을 선언하면 알아서 띄워준다. **결론부터: 이걸 써라.** 매번 셸로 직접 짜는 건 바퀴 재발명이다.

그럼 이 글은 왜 셸 스크립트까지 다루나 — **세션 매니저가 안에서 하는 일이 정확히 그거이기 때문**이다. smug도 tmuxinator도 결국 `tmux new-session`·`split-window`를 순서대로 부르는 래퍼다. 그 속살을 셸로 한 번 짜보면 도구가 뭘 대신해 주는지, 왜 YAML 몇 줄이 그렇게 동작하는지 손에 잡힌다. 그래서 이 글은 **(1) 정석인 세션 매니저를 먼저 세우고 → (2) 그 아래 메커니즘을 셸로 해부**한다. 쓰라는 건 도구고, 셸은 원리를 보기 위한 해부용이다.

> 이 글은 [tmux 로드맵](./2026-06-16-tmux-roadmap.md)의 **3단계(세션 부트스트랩 자동화)** 다. 입문·설정·플러그인 단계는 로드맵에서. 여기 나오는 세션 매니저는 2단계 TPM 플러그인과 **다른 축** — tmux *안*에서 도는 플러그인이 아니라 tmux *밖*의 외부 CLI다.
{: .prompt-tip }

---

## 1. 정석 — 세션 매니저로 선언하기

레이아웃을 "이런 모양"이라고 YAML로 적으면 끝이다. `main` 세션(좌 1 + 우 2, 3-pane + `secondary` 윈도우)을 [tmuxp](https://github.com/tmux-python/tmuxp)로 옮기면 이렇게 된다.

```yaml
# ~/.config/tmuxp/main.yaml
session_name: main
start_directory: ~/         # 모든 pane 시작 디렉토리 — 셸의 `cd ~/`가 통째로 사라진다
windows:
  - window_name: main
    layout: main-vertical   # 좌 1 + 우 2 분할
    panes:                  # 빈 pane 3개 나열 = 3-pane
      -
      -
      -
  - window_name: secondary
    panes:
      -
```

`tmuxp load main` 한 줄이면 이 세션이 뜬다(Python 패키지, `pip install tmuxp`). 세 도구 다 **이미 떠 있으면 새로 만들지 않고 attach**한다 — 아래 셸 스크립트의 `has-session` 분기(§2)가 도구에선 기본 동작으로 들어 있다.

**smug·tmuxinator도 거의 같은 YAML이다 — 키 이름과 설치·런타임만 다르다**(아래 표). smug는 `session:`/`root:`에 `brew install smug`(Go 단일 바이너리, 런타임 0), tmuxinator는 `name:`에 `gem install`(Ruby)이다.

### 어느 걸 고르나 — 조건부 순위

| | [smug](https://github.com/ivaaaan/smug) | [tmuxp](https://github.com/tmux-python/tmuxp) | [tmuxinator](https://github.com/tmuxinator/tmuxinator) |
|---|---|---|---|
| 런타임 | **Go 단일 바이너리 (무의존)** | Python | Ruby |
| 설치 | `brew install smug` | `pip install tmuxp` | `gem install tmuxinator` |
| 실행 | `smug start main` | `tmuxp load main` | `mux start main` |
| 강점 | 이식성 — 서버·컨테이너 어디서든 | `freeze`로 세션→config 역추출 | 자료·예제 최다, 클래식 |
| 활성·모멘텀 | 니치·저활동 (★0.9k, ~16커밋/년) | 최다 활동이나 사실상 1인 메인테이너 ⚠️ (★4.5k, ~690커밋/년) | 성숙·기득권, 활동 저조하나 커뮤니티 넓음 (★13.7k, ~31커밋/년) |

셋 다 설치 명령이 제각각(`brew`/`pip`/`gem`)인 데서 드러나듯, TPM `@plugin`으로 까는 플러그인이 아니라 **각자 독립 프로그램**이다. 셸에서 직접 실행해 tmux를 밖에서 부린다.

1. **무난한 기본값은 tmuxp** — 활동 최다에 `freeze`로 지금 떠 있는 세션을 그대로 config로 역추출한다. Python만 있으면(대부분 있다) 가장 넓게 맞는다. 단 사실상 1인 메인테이너인 건 감안.
2. **무의존·이식성이 최우선(서버·컨테이너 오감)이면 smug** — 런타임 0, 단일 바이너리. 활동은 낮지만 설정이 단순해 깨질 게 별로 없다.
3. **레퍼런스·예제가 많아야 하면 tmuxinator** — 스타 1위·자료 최다지만 Ruby 의존에 저활동이라 지금 새로 시작할 결정적 이유는 약하다.

> smug 실전 설정과 **프리셋에 없는 커스텀 레이아웃**은 아래 `smug 실전 — 커스텀 레이아웃과 세션 전환`에서 이어진다.
{: .prompt-tip }

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

# 2) 첫 윈도우: 좌/우 분할 + 오른쪽 상/하 분할 (총 3 panes) → 세션 매니저의 layout: main-vertical
tmux split-window -h -t "$MAIN_SESSION":0
tmux split-window -v -t "$MAIN_SESSION":0.1

# 시작 디렉토리 지정 → tmuxp의 start_directory: ~/(smug·tmuxinator은 root:) 한 줄이 대신하는 부분
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

한 줄씩 보면 도구의 정체가 드러난다 — `new-session`으로 세션을 만들고, `split-window`로 쪼개고, `send-keys`로 명령을 밀어넣고, `attach`로 붙는다. tmuxp의 `layout: main-vertical`은 저 `split-window` 두 줄이고, `start_directory: ~/`는 저 `send-keys "cd ~/"` 세 줄이며, load 시 자동 attach는 마지막 `tmux attach`다. 맨 위 `has-session` 분기가 "이미 떠 있으면 attach"에 해당한다. **도구는 이 나열을 YAML 뒤에 숨겨 줄 뿐, 하는 일은 똑같다.**

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
* **선언형 3종은 다 성숙기 — 요즘 모멘텀은 다른 범주다.** [sesh](https://github.com/joshmedeski/sesh) 같은 **온디맨드 세션 스위처**(fzf·zoxide로 디렉토리에서 즉석 세션 생성)로 실력자들이 옮겨가는 중이다 — 생성 2.5년에 ★2.7k, 나이 대비 성장률이 이 셋보다 높다. 고정 레이아웃을 *선언*하는 이 글과 목적이 달라 스코프 밖이지만, 방향은 알아둘 것. → 이 피커 범주의 설치·바인딩·실전은 [sesh — 즉석 tmux 세션 전환](./2026-07-12-sesh-tmux-session-picker.md)에서 이어진다.
* `tmux has-session`은 세션 존재 여부만 확인한다. 도구의 "이미 있으면 attach"가 이걸 대신한다.
* 셸로 직접 짜는 게 유일해지는 건 **바이너리 하나도 못 까는 극한 환경**(락다운된 서버, 임시 컨테이너) 정도다. 그 외엔 세션 매니저가 상위호환이다.


---

---

# smug 실전 — 커스텀 레이아웃과 세션 전환

위의 세션 매니저 비교에서 smug를 선택했다면, 다음은 YAML 기본 사용법보다 한 단계 깊은 사례다. 기본 설정은 앞의 `tmuxp` 예제와 비교해서 읽으면 된다.

## 프리셋에 없는 레이아웃 — layout 문자열로 고정

`layout`에는 tmux 표준 프리셋명(`main-vertical`·`main-horizontal`·`tiled`·`even-horizontal`·`even-vertical`)을 쓴다. 그런데 원하는 배치가 프리셋에 **없을 때**가 있다. 예를 들어 **위는 좌/우 2분할, 아래는 전체폭 1개** 같은 배치:

```
┌───────┬───────┐
│ pane0 │ pane1 │
├───────┴───────┤
│     pane2     │
└───────────────┘
```

이건 `main-horizontal`(위 1 + 아래 N)의 상하 반대라 어떤 프리셋으로도 안 나온다. 해법은 **tmux 레이아웃 문자열을 `layout`에 직접 넣는 것**이다 — smug는 이 값을 `tmux select-layout`에 그대로 넘기므로, 프리셋명이든 raw 문자열이든 다 받는다.

문자열은 **원하는 배치를 tmux에서 한 번 손으로 만든 뒤** 뽑아낸다:

```bash
# 1) 임시 tmux에서 원하는 배치를 만든다 (설정 간섭 없이 -f /dev/null)
tmux -L cap -f /dev/null new-session -d -x 220 -y 50
tmux -L cap split-window -v            # 위/아래
tmux -L cap select-pane -t 0           # 위 선택
tmux -L cap split-window -h -t 0       # 위를 좌/우로

# 2) 그 배치의 레이아웃 문자열을 캡처
tmux -L cap list-windows -F '#{window_layout}'
# → 60d1,220x50,0,0[220x25,0,0{110x25,0,0,0,109x25,111,0,2},220x24,0,26,1]

tmux -L cap kill-server                # 임시 서버 정리
```

뽑은 문자열을 그대로 `layout`에 박는다:

```yaml
  - name: server
    # 위 좌/우 2 + 아래 전체폭 1 (프리셋에 없어 레이아웃 문자열로 고정)
    layout: 60d1,220x50,0,0[220x25,0,0{110x25,0,0,0,109x25,111,0,2},220x24,0,26,1]
    panes:                  # 빈 pane 2개 = 총 3패널. 반드시 '- {}' — bare '-'는 YAML null로 조용히 드롭됨
      - {}
      - {}
```

두 가지만 알면 된다:

- 문자열 앞의 `220x50`은 **캡처 당시 크기**지만, `select-layout`이 실제 터미널 크기에 **비율로 리스케일**하므로 창 크기가 달라도 배치는 유지된다. 앞 4자리(`60d1`)는 tmux가 계산하는 체크섬이라, **직접 타이핑하지 말고 반드시 캡처한 문자열을 통째로** 써야 한다.
- 패널 **개수만 맞으면 된다**. 문자열이 3패널이니 `panes`에 `- {}` 2개(= base 1 + 2)로 3패널을 만들어 두면, 마지막에 문자열이 배치를 확정한다. (빈 pane을 bare `-`로 쓰면 null로 드롭돼 개수가 안 맞고, 그러면 이 layout 문자열도 무시된다.)

이 트릭은 smug뿐 아니라 **tmuxinator·tmuxp에서도 그대로 통한다** — 셋 다 `layout`을 tmux `select-layout`에 넘기기 때문이다.

## smug가 하는 것 / 안 하는 것

smug의 범위는 **"세션 하나를 통째로 선언 → 그대로 띄우기"**에 완결돼 있다.

**한다:**

- 세션·윈도우·패널 선언과 생성, `layout`(프리셋 + 문자열)
- 패널별 시작 디렉토리(`root`)와 시작 명령(`commands`)
- 훅 — `before_start`(세션 생성 전), `stop`(내릴 때)
- 환경변수(`env`), 이미 있으면 attach, 선택 실행(`smug start dev -w server`로 특정 윈도우만)
- **freeze** — `smug print`로 지금 떠 있는 tmux 세션을 거꾸로 YAML config로 역추출한다 (`smug print > ~/.config/smug/dev.yml`). tmuxp 전유물로 오해하기 쉽지만 smug도 된다.

**안 한다 (경계 밖):**

- **프로그래머블 제어** — [libtmux](https://github.com/tmux-python/libtmux) 같은 API나 파이썬 콘솔은 없다.
- 다른 도구 config import, 플러그인 시스템도 없다.

이 경계 밖 — 특히 tmux를 파이썬으로 스크립팅(libtmux)하거나 프로그래머블 제어가 필요해지면 — 그때 [tmuxp](https://github.com/tmux-python/tmuxp)로 넘어가면 된다. 기본 레이아웃 YAML이 서로 거의 1:1이라 전환 비용이 작다. 반대로 "정해진 레이아웃을 반복 로드"가 전부라면 smug의 이 범위가 **정확히 필요한 만큼**이다 — 모자라지도, 안 쓰는 기능으로 무겁지도 않다.

## 자주 쓰는 명령

```bash
smug start dev        # 세션 시작(+attach). `smug dev`로 축약 가능
smug start dev -w server  # 특정 윈도우만
smug stop dev         # 세션 종료 (stop 훅 실행)
smug new dev          # 새 config 파일 생성 후 편집기로 열기
smug edit dev         # 기존 config 편집
smug list             # config 목록
```
