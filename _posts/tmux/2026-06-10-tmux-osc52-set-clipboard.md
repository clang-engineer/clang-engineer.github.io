---
title       : "tmux 시스템 클립보드 자동 동기화는 set-clipboard on 한 줄로 끝난다"
description : "OSC52 발사 3대 조건과 한 함정(detached 윈도우). pbcopy 바인딩 우회 없이 깔끔하게."
date        : 2026-06-10 12:00:00 +0900
updated     : 2026-06-10 12:00:00 +0900
categories  : [tmux, "클립보드"]
tags        : [osc52, ghostty]
pin         : false
hidden      : false
---

tmux에서 copy(Enter/마우스 드래그)하면 시스템 클립보드까지 자동으로 들어가게 하고 싶다면, `pbcopy` 바인딩 같은 우회 없이 `set -g set-clipboard on` 한 줄만 추가하면 된다. **단, 기본값이 `external`(자체 발사 X, passthrough만)이라 명시가 필요**하다.

## OSC52 발사 3대 조건

tmux가 copy 시 OSC52로 클립보드를 발사하려면 다음이 모두 충족돼야 한다.

1. **`set -g set-clipboard on`** — 기본값 `external`은 응용프로그램이 보낸 OSC52만 pass-through하고 tmux 자체는 안 보냄.
2. **터미널의 Ms capability 인식** — `tmux info | grep Ms`로 확인. xterm-ghostty/xterm-256color는 자동 인식.
3. **`terminal-features`에 `clipboard` 등록** — `xterm*:clipboard`가 기본 포함되어 대부분 터미널 OK.

## 검증

```bash
# 1) 발사 회로 자체 확인 (set-clipboard 무관, 직접 OSC52 발사)
tmux set-buffer -w "한글─테스트"
sleep 0.5 && pbpaste     # → "한글─테스트" 나오면 회로 정상

# 2) 옵션/capability 점검
tmux show-options -gv set-clipboard           # 기대: on
tmux info | grep "Ms:"                        # OSC52 escape 형식 보여야 함
tmux show-options -g terminal-features        # xterm*:clipboard 포함 확인
```

## 한 가지 함정 — Active client에만 발사된다

`tmux send-keys -X copy-selection-and-cancel`로 **detached 윈도우의 copy를 자동 trigger하면 OSC52가 발사되지 않는다.** OSC52는 "그 pane을 보고 있는 client의 PTY"로만 발사되기 때문. 자동 검증 스크립트에서는 `tmux set-buffer -w`로 회로 자체를 시험하는 게 깔끔하다.

## 결과: 깔끔한 tmux.conf

```tmux
## Copy mode
setw -g mode-keys vi
set -g set-clipboard on    # tmux copy → OSC52 → 시스템 클립보드 자동 전달
```

`copy-pipe-and-cancel "pbcopy"` 류 바인딩이 다 사라진다. 단, macOS `pbcopy` 경로를 굳이 유지해야 한다면 `LANG=ko_KR.UTF-8 pbcopy`처럼 LANG 인라인이 필수.
