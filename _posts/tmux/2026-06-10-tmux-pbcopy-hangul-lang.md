---
title       : "tmux 복사 한글이 ‚îÄ로 깨지면 pbcopy 앞에 LANG을 박아라"
description : "MacRoman fallback이 원인. tmux server 환경에 LANG이 없어서 발생. copy-pipe에 LANG 인라인."
date        : 2026-06-10 10:00:00 +0900
updated     : 2026-06-10 10:00:00 +0900
categories  : [tmux, "트러블슈팅"]
tags        : [tmux, pbcopy, hangul, encoding, utf-8, macroman, ghostty, osc52]
pin         : false
hidden      : false
---

tmux에서 한글이 든 영역을 복사해 다른 곳에 붙여넣을 때 `‚îÄ‚îÄ‚îÄ` 같은 패턴으로 깨진다면, `pbcopy`가 입력을 **MacRoman으로 해석**해버린 것이다. tmux server는 daemon 환경에서 실행되어 셸의 `LANG`을 상속받지 않기 때문에 발생한다.

## 깨진 문자열의 정체

`─` (U+2500, BOX DRAWINGS LIGHT HORIZONTAL)의 UTF-8 바이트는 `E2 94 80`. 이 3바이트를 MacRoman으로 해석하면 정확히 `‚îÄ`가 된다. 즉 **입력은 UTF-8인데 디코딩은 MacRoman으로 한 결과**라는 명확한 시그니처다.

## 진단

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

셸에서 직접 `pbcopy`는 멀쩡한데 tmux 복사만 깨지는 비대칭이 핵심 단서. 셸엔 `LANG`이 있고 tmux server엔 없으니까.

## 해결: copy-pipe에 LANG 인라인

```tmux
# ~/.tmux.conf
bind -T copy-mode-vi Enter             send -X copy-pipe-and-cancel "LANG=ko_KR.UTF-8 pbcopy"
bind -T copy-mode-vi MouseDragEnd1Pane send -X copy-pipe-no-clear   "LANG=ko_KR.UTF-8 pbcopy"
bind -T copy-mode    MouseDragEnd1Pane send -X copy-pipe-no-clear   "LANG=ko_KR.UTF-8 pbcopy"
```

적용은 `tmux source-file ~/.tmux.conf`로 즉시 가능. tmux server 재시작 불필요.

## 왜 갑자기 깨졌나 — 2단계 함정

1. **OSC52 시절**: `set-clipboard`가 켜진 기본 상태에서 tmux가 OSC52(base64)로 터미널에 클립보드를 위임 → 인코딩 무관, 한글 OK.
2. **OSC52 우회 도입**: 터미널의 OSC52 한글 처리 버그를 (실제로든 의심으로든) 만나 `set -g set-clipboard off`로 끄고 `pbcopy` 직호출로 전환 → 이때 **LANG 누락이라는 두 번째 함정**이 드러남.

즉 "원래 멀쩡했는데 어느 날 깨지더라"는 보통 클립보드 경로 자체가 OSC52 → pbcopy로 바뀐 순간이다.

## OSC52와 pbcopy 경로 분리 검증

같은 `‚îÄ` 시그니처가 OSC52에서 나오는 건지, pbcopy에서 나오는 건지 헷갈리기 쉽다. **`tmux set-buffer -w`는 set-clipboard 설정과 무관하게 OSC52만 단독으로 발사**하므로, 이걸로 터미널 자체의 OSC52 한글 처리 능력을 깔끔하게 분리해 시험할 수 있다.

```bash
# OSC52 단독 테스트 (tmux의 copy-pipe pbcopy 경로를 안 거침)
tmux set-buffer -w "한글─테스트"
sleep 0.5 && pbpaste
# → "한글─테스트"가 정상으로 나오면 터미널 OSC52는 무죄
```

Ghostty 1.3.1 + tmux 3.6a 환경에서 직접 확인했을 때 OSC52는 한글을 멀쩡히 처리했다. **그러니 OSC52를 의심하기 전에 pbcopy 경로의 LANG부터 의심하라.** 두 원인은 같은 mojibake 시그니처를 만들어서 외관만으로는 구분이 안 된다.

## 관련

- `pbcopy(1)` 맨페이지: stdin을 시스템 페이스트보드에 넣을 때 LANG/LC_CTYPE을 본다.
- `tmux set-buffer -w`: OSC52 직접 발사 (set-clipboard 옵션 무관).
- 터미널 OSC52가 한글을 정상 처리한다면 `set-clipboard off`를 빼도 무방하지만, pbcopy 경로가 이미 잘 동작하면 굳이 이중 발사로 바꿀 실익은 없다.
