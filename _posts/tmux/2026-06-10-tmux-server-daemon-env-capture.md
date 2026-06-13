---
title       : "tmux server는 daemonize 시점 환경을 캡처해서 영구 보관한다"
description : "셸에선 OK인데 tmux에서만 깨지는 비대칭의 원인. update-environment에 LANG을 등록하거나 set-environment -g."
date        : 2026-06-10 11:00:00 +0900
updated     : 2026-06-10 11:00:00 +0900
categories  : [tmux, "동작 원리"]
tags        : [daemon, environment]
pin         : false
hidden      : false
---

tmux server는 client(셸) 환경을 상속받는 게 아니라, **첫 client가 server를 띄울 그 순간의 환경을 캡처해서 서버가 죽을 때까지 들고 간다.** 그래서 셸에선 `pbcopy`가 멀쩡한데 tmux를 거치면 깨지는 비대칭이 생긴다. 한 번 잘못된 환경으로 시작되면 `pkill tmux` 전엔 영구 불일치.

## 검증

```bash
# server에 박힌 환경 (시작 시점에 고정)
tmux show-environment -g | grep -E "LANG|PATH"

# 그 환경이 server가 자식 프로세스(copy-pipe의 pbcopy 등) 띄울 때 사용됨
echo "$LANG"                          # 셸: ko_KR.UTF-8
tmux run-shell 'echo $LANG'           # tmux 자식: 비어있을 수 있음 ← 불일치
```

## 어떤 변수가 자동 갱신되는가

`update-environment` 옵션에 등록된 변수만 새 client attach마다 갱신된다. 기본값(tmux 3.x):

```text
DISPLAY KRB5CCNAME SSH_ASKPASS SSH_AUTH_SOCK
SSH_AGENT_PID SSH_CONNECTION WINDOWID XAUTHORITY
```

**`LANG`은 없다.** 셸의 LANG을 server에 매번 반영하고 싶다면 명시적으로 등록해야 한다.

```tmux
# ~/.tmux.conf
set -g update-environment "LANG LC_ALL LC_CTYPE DISPLAY SSH_AUTH_SOCK SSH_CONNECTION"
```

또는 server 시작 전부터 강제로 박기:

```tmux
set-environment -g LANG "ko_KR.UTF-8"
```

## 진단/복구 명령

```bash
tmux show-environment -g              # server 전역 환경
tmux show-environment                  # 현재 session 환경
tmux show-options -g update-environment

# 잘못된 server 자체를 끊고 새 환경으로 다시 시작
tmux kill-server                       # 모든 세션 죽음, tmux-resurrect 있으면 복원
```

## 더 근본적 해법 — 외부 명령 의존성 자체를 끊기

`copy-pipe "pbcopy"`처럼 시스템 명령을 호출하는 한 server 환경에 의존한다. tmux의 OSC52 발사(`set -g set-clipboard on`)로 바꾸면 외부 명령을 안 거치므로 환경 변수와 무관해진다.

## 함정 요약

| 증상 | 원인 |
|---|---|
| 셸 `pbcopy`는 OK, tmux 안에서만 깨짐 | server에 LANG 없음 |
| 어제까진 멀쩡했는데 오늘부터 깨짐 | 어제 사이 tmux server가 재시작됨(재부팅/`pkill tmux`/Ghostty 첫 spawn 등) |
| `~/.tmux.conf` reload해도 변화 없음 | server 환경은 conf reload로 안 바뀜, `tmux set-environment -g` 필요 |
