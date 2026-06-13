---
title       : "tmux 시스템 클립보드 — set-clipboard on 한 줄, pbcopy 경로의 함정(한글 깨짐·server 환경)"
description : "OSC52 한 줄이 정답. pbcopy를 굳이 쓴다면 LANG 인라인이 필수. tmux server 환경 캡처 메커니즘까지."
date        : 2026-06-10 12:00:00 +0900
updated     : 2026-06-10 12:00:00 +0900
categories  : [tmux, "클립보드"]
tags        : [osc52, ghostty, hangul, encoding, utf-8, daemon, environment]
pin         : false
hidden      : false
---

tmux에서 copy(Enter/마우스 드래그)하면 시스템 클립보드까지 자동으로 들어가게 하고 싶다면, `pbcopy` 바인딩 같은 우회 없이 `set -g set-clipboard on` 한 줄만 추가하면 된다. **단, 기본값이 `external`(자체 발사 X, passthrough만)이라 명시가 필요**하다.

이 글은 세 단계로 정리한다.

1. **권장 경로**: OSC52 + `set-clipboard on` (외부 명령 의존성 0)
2. **만약 pbcopy 경로를 써야 한다면**: LANG 인라인 필수 (한글 깨짐 회피)
3. **왜 그런가**: tmux server의 환경 캡처 메커니즘 (셸 OK, tmux만 깨지는 비대칭의 정체)

---

## 1. 권장 경로 — `set-clipboard on` 한 줄

### OSC52 발사 3대 조건

tmux가 copy 시 OSC52로 클립보드를 발사하려면 다음이 모두 충족돼야 한다.

1. **`set -g set-clipboard on`** — 기본값 `external`은 응용프로그램이 보낸 OSC52만 pass-through하고 tmux 자체는 안 보냄.
2. **터미널의 Ms capability 인식** — `tmux info | grep Ms`로 확인. xterm-ghostty/xterm-256color는 자동 인식.
3. **`terminal-features`에 `clipboard` 등록** — `xterm*:clipboard`가 기본 포함되어 대부분 터미널 OK.

### 검증

```bash
# 1) 발사 회로 자체 확인 (set-clipboard 무관, 직접 OSC52 발사)
tmux set-buffer -w "한글─테스트"
sleep 0.5 && pbpaste     # → "한글─테스트" 나오면 회로 정상

# 2) 옵션/capability 점검
tmux show-options -gv set-clipboard           # 기대: on
tmux info | grep "Ms:"                        # OSC52 escape 형식 보여야 함
tmux show-options -g terminal-features        # xterm*:clipboard 포함 확인
```

### 함정 — Active client에만 발사된다

`tmux send-keys -X copy-selection-and-cancel`로 **detached 윈도우의 copy를 자동 trigger하면 OSC52가 발사되지 않는다.** OSC52는 "그 pane을 보고 있는 client의 PTY"로만 발사되기 때문. 자동 검증 스크립트에서는 `tmux set-buffer -w`로 회로 자체를 시험하는 게 깔끔하다.

### 결과: 깔끔한 tmux.conf

```tmux
## Copy mode
setw -g mode-keys vi
set -g set-clipboard on    # tmux copy → OSC52 → 시스템 클립보드 자동 전달
```

`copy-pipe-and-cancel "pbcopy"` 류 바인딩이 다 사라진다.

---

## 2. pbcopy 경로를 써야 한다면 — LANG 인라인 필수

터미널 OSC52 처리에 의심이 가거나, 정책상 pbcopy 직호출을 유지해야 한다면 한글 깨짐을 막기 위한 처방이 필요하다.

### 증상 — `‚îÄ` 시그니처

tmux에서 한글이 든 영역을 복사해 다른 곳에 붙여넣을 때 `‚îÄ‚îÄ‚îÄ` 같은 패턴으로 깨진다면, `pbcopy`가 입력을 **MacRoman으로 해석**해버린 것이다. tmux server가 셸의 `LANG`을 상속받지 못해 발생한다.

`─` (U+2500, BOX DRAWINGS LIGHT HORIZONTAL)의 UTF-8 바이트는 `E2 94 80`. 이 3바이트를 MacRoman으로 해석하면 정확히 `‚îÄ`가 된다. 즉 **입력은 UTF-8인데 디코딩은 MacRoman으로 한 결과**라는 명확한 시그니처다.

### 진단

`pbcopy`는 `LANG`/`LC_CTYPE`이 없으면 `__CF_USER_TEXT_ENCODING` 환경변수를 보는데, 그 값이 `0x1F5:0x0:0x0`처럼 마지막 두 필드가 `0x0`이면 MacRoman으로 fallback한다.

```bash
# tmux server 환경에 LANG이 있는지 확인 (없으면 범인)
tmux show-environment -g | grep -i lang

# 같은 경로 재현
printf '한글─테스트\n' | env -u LANG -u LC_ALL -u LC_CTYPE pbcopy
pbpaste   # → ÌïúÍ∏Ä‚îÄÌÖåÏä§Ìä∏  (깨짐)

printf '한글─테스트\n' | LANG=ko_KR.UTF-8 pbcopy
pbpaste   # → 한글─테스트       (정상)
```

셸에서 직접 `pbcopy`는 멀쩡한데 tmux 복사만 깨지는 비대칭이 핵심 단서다. 셸엔 `LANG`이 있고 tmux server엔 없으니까.

### 해결 — copy-pipe에 LANG 인라인

```tmux
# ~/.tmux.conf
bind -T copy-mode-vi Enter             send -X copy-pipe-and-cancel "LANG=ko_KR.UTF-8 pbcopy"
bind -T copy-mode-vi MouseDragEnd1Pane send -X copy-pipe-no-clear   "LANG=ko_KR.UTF-8 pbcopy"
bind -T copy-mode    MouseDragEnd1Pane send -X copy-pipe-no-clear   "LANG=ko_KR.UTF-8 pbcopy"
```

적용은 `tmux source-file ~/.tmux.conf`로 즉시 가능. tmux server 재시작 불필요.

### OSC52와 pbcopy 경로 분리 검증

같은 `‚îÄ` 시그니처가 OSC52에서 나오는 건지, pbcopy에서 나오는 건지 헷갈리기 쉽다. **`tmux set-buffer -w`는 set-clipboard 설정과 무관하게 OSC52만 단독으로 발사**하므로, 이걸로 터미널 자체의 OSC52 한글 처리 능력을 깔끔하게 분리해 시험할 수 있다.

```bash
# OSC52 단독 테스트 (tmux의 copy-pipe pbcopy 경로를 안 거침)
tmux set-buffer -w "한글─테스트"
sleep 0.5 && pbpaste
# → "한글─테스트"가 정상으로 나오면 터미널 OSC52는 무죄
```

Ghostty 1.3.1 + tmux 3.6a 환경에서 직접 확인했을 때 OSC52는 한글을 멀쩡히 처리했다. **그러니 OSC52를 의심하기 전에 pbcopy 경로의 LANG부터 의심하라.** 두 원인은 같은 mojibake 시그니처를 만들어서 외관만으로는 구분이 안 된다.

---

## 3. 비대칭의 정체 — tmux server는 환경을 캡처해서 영구 보관한다

tmux server는 client(셸) 환경을 상속받는 게 아니라, **첫 client가 server를 띄울 그 순간의 환경을 캡처해서 서버가 죽을 때까지 들고 간다.** 한 번 잘못된 환경으로 시작되면 `pkill tmux` 전엔 영구 불일치.

```bash
# server에 박힌 환경 (시작 시점에 고정)
tmux show-environment -g | grep -E "LANG|PATH"

# 그 환경이 server가 자식 프로세스(copy-pipe의 pbcopy 등) 띄울 때 사용됨
echo "$LANG"                          # 셸: ko_KR.UTF-8
tmux run-shell 'echo $LANG'           # tmux 자식: 비어있을 수 있음 ← 불일치
```

### 어떤 변수가 자동 갱신되는가

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

### 진단/복구 명령

```bash
tmux show-environment -g              # server 전역 환경
tmux show-environment                  # 현재 session 환경
tmux show-options -g update-environment

# 잘못된 server 자체를 끊고 새 환경으로 다시 시작
tmux kill-server                       # 모든 세션 죽음, tmux-resurrect 있으면 복원
```

### 함정 요약

| 증상 | 원인 |
|---|---|
| 셸 `pbcopy`는 OK, tmux 안에서만 깨짐 | server에 LANG 없음 |
| 어제까진 멀쩡했는데 오늘부터 깨짐 | 어제 사이 tmux server가 재시작됨(재부팅/`pkill tmux`/Ghostty 첫 spawn 등) |
| `~/.tmux.conf` reload해도 변화 없음 | server 환경은 conf reload로 안 바뀜, `tmux set-environment -g` 필요 |

---

## 왜 갑자기 깨졌나 — 2단계 함정

1. **OSC52 시절**: `set-clipboard`가 켜진 기본 상태에서 tmux가 OSC52(base64)로 터미널에 클립보드를 위임 → 인코딩 무관, 한글 OK.
2. **OSC52 우회 도입**: 터미널의 OSC52 한글 처리 버그를 (실제로든 의심으로든) 만나 `set -g set-clipboard off`로 끄고 `pbcopy` 직호출로 전환 → 이때 **LANG 누락이라는 두 번째 함정**이 드러남.

즉 "원래 멀쩡했는데 어느 날 깨지더라"는 보통 클립보드 경로 자체가 OSC52 → pbcopy로 바뀐 순간이다. **근본적 해법은 외부 명령 의존성 자체를 끊는 것 — `set -g set-clipboard on`으로 되돌리면 server 환경과 무관해진다.**

## 참고

- `pbcopy(1)` 맨페이지: stdin을 시스템 페이스트보드에 넣을 때 LANG/LC_CTYPE을 본다.
- `tmux set-buffer -w`: OSC52 직접 발사 (set-clipboard 옵션 무관).
- 터미널 OSC52가 한글을 정상 처리한다면 `set-clipboard off`를 빼도 무방하지만, pbcopy 경로가 이미 잘 동작하면 굳이 이중 발사로 바꿀 실익은 없다.
