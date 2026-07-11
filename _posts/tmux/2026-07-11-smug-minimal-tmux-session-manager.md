---
title       : "🪶 smug — 의존성 없는 미니멀 tmux 세션 매니저 (프리셋에 없는 레이아웃까지)"
description : "smug는 Go 단일 바이너리 tmux 세션 매니저다. 설치·기본 config부터, tmux 표준 프리셋에 없는 커스텀 레이아웃을 layout 문자열로 고정하는 법, smug가 하는 일과 안 하는 일(freeze는 tmuxp)까지 실전 정리."
date        : 2026-07-11 11:00:00 +0900
updated     : 2026-07-11 11:00:00 +0900
categories  : [tmux, "스크립트·플러그인"]
tags        : [terminal, guide, smug]
pin         : false
hidden      : false
---

세션 매니저를 여러 개 비교한 끝에 **smug**를 골랐다면, 이 글은 그다음 실전이다. smug의 자리는 한마디로 **"무의존·미니멀"** — Ruby(tmuxinator)나 Python(tmuxp) 런타임 없이 도는 **Go 단일 바이너리**다. YAML로 세션·윈도우·패널을 선언하면 그대로 띄워 준다.

> 세션 매니저 3종(smug·tmuxp·tmuxinator)의 **비교·선택**과, 이 도구들이 내부에서 부르는 tmux 명령의 **셸 해부**는 [tmux 세션 부트스트랩](/posts/tmux/2026-02-21-tmux-bootstrap/) 글에 있다. 이 글은 그중 smug를 골랐다는 전제에서 출발한다. 전체 학습 순서는 [tmux 로드맵](/posts/tmux/2026-06-16-tmux-roadmap/) 3단계.
{: .prompt-tip }

## 설치

Homebrew 한 줄이면 끝난다. 런타임 의존이 없어 서버·컨테이너엔 바이너리 하나만 복사해도 돈다.

```bash
brew install smug
# 또는: go install github.com/ivaaaan/smug@latest
```

## 기본 — 세션을 YAML로 선언

config는 `~/.config/smug/<이름>.yml`에 둔다. 파일 하나 = 세션 하나다.

```yaml
# ~/.config/smug/dev.yml
session: dev
root: ~/projects/app        # 모든 윈도우·패널의 시작 디렉토리
windows:
  - name: editor
    commands:
      - nvim                # 이 윈도우의 첫 패널에서 실행
  - name: server
    layout: main-vertical   # 좌 1 + 우 2 분할
    panes:                  # 암묵적 base 패널 1개 + 아래 2개 = 총 3패널
      - commands: [npm run dev]
      - commands: [npm run test:watch]
```

```bash
smug start dev     # 이 세션을 띄우고 attach. `smug dev`로 줄여도 됨(기본 명령이 start)
```

핵심 키만 짚으면:

- **`session`** — 세션 이름. **`root`** — 시작 디렉토리(세션·윈도우·패널별로 각각 지정 가능하고, 없으면 상위 것을 상속).
- **`windows`** — 각 윈도우는 `name`·`layout`·`commands`·`panes`를 가진다.
- **`panes`** — 여기서 개수 감각이 중요하다. 윈도우는 **암묵적으로 패널 1개로 시작**하고, `panes` 항목 하나마다 분할이 하나 추가된다. 즉 **항목 2개 = 총 3패널**이다.
- **`commands`** — 해당 윈도우/패널에서 시작 시 실행할 명령. `nvim`·개발 서버를 자동 기동하는 부분이다.

**이미 떠 있는 세션이면 새로 만들지 않고 그대로 attach**한다(안에서 실행하면 `switch-client`). 셸 스크립트로 직접 짤 때 손으로 넣던 `has-session` 분기가 기본 동작으로 들어 있는 셈이다.

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
    panes:                  # 빈 항목 2개 = 총 3패널 (배치는 위 문자열이 확정)
      -
      -
```

두 가지만 알면 된다:

- 문자열 앞의 `220x50`은 **캡처 당시 크기**지만, `select-layout`이 실제 터미널 크기에 **비율로 리스케일**하므로 창 크기가 달라도 배치는 유지된다. 앞 4자리(`60d1`)는 tmux가 계산하는 체크섬이라, **직접 타이핑하지 말고 반드시 캡처한 문자열을 통째로** 써야 한다.
- 패널 **개수만 맞으면 된다**. 문자열이 3패널이니 `panes` 빈 항목 2개(= base 1 + 2)로 3패널을 만들어 두면, 마지막에 문자열이 배치를 확정한다.

이 트릭은 smug뿐 아니라 **tmuxinator·tmuxp에서도 그대로 통한다** — 셋 다 `layout`을 tmux `select-layout`에 넘기기 때문이다.

## smug가 하는 것 / 안 하는 것

smug의 범위는 **"세션 하나를 통째로 선언 → 그대로 띄우기"**에 완결돼 있다.

**한다:**

- 세션·윈도우·패널 선언과 생성, `layout`(프리셋 + 문자열)
- 패널별 시작 디렉토리(`root`)와 시작 명령(`commands`)
- 훅 — `before_start`(세션 생성 전), `stop`(내릴 때)
- 환경변수(`env`), 이미 있으면 attach, 선택 실행(`smug start dev -w server`로 특정 윈도우만)

**안 한다 (경계 밖):**

- **freeze** — 지금 떠 있는 세션을 거꾸로 config로 역추출하는 기능은 없다. smug는 선언한 걸 실행할 뿐이다.
- **프로그래머블 제어** — [libtmux](https://github.com/tmux-python/libtmux) 같은 API나 파이썬 콘솔은 없다.
- 다른 도구 config import, 플러그인 시스템도 없다.

이 경계 밖 — 특히 **freeze**(손으로 짠 세션을 파일로 저장)나 tmux를 파이썬으로 스크립팅하고 싶어지면 — 그때 [tmuxp](https://github.com/tmux-python/tmuxp)로 넘어가면 된다. 기본 레이아웃 YAML이 서로 거의 1:1이라 전환 비용이 작다. 반대로 "정해진 레이아웃을 반복 로드"가 전부라면 smug의 이 범위가 **정확히 필요한 만큼**이다 — 모자라지도, 안 쓰는 기능으로 무겁지도 않다.

## 자주 쓰는 명령

```bash
smug start dev        # 세션 시작(+attach). `smug dev`로 축약 가능
smug start dev -w server  # 특정 윈도우만
smug stop dev         # 세션 종료 (stop 훅 실행)
smug new dev          # 새 config 파일 생성 후 편집기로 열기
smug edit dev         # 기존 config 편집
smug list             # config 목록
```

## 정리

smug는 **"세션을 선언하고 띄운다"** 한 가지를 의존성 없이 깔끔하게 하는 도구다. 레이아웃은 프리셋으로 대부분 되고, 안 되는 배치는 tmux 레이아웃 문자열을 캡처해 박으면 그만이다. 딱 그 용도라면 최적이고, freeze나 파이썬 제어가 필요해지는 날 tmuxp로 옮겨도 늦지 않다.
