---
title       : "tmux 창 전환 직후 pane 이동이 씹힐 때 — bind -r repeat-time의 함정"
description : "prefix+C-l로 창을 넘긴 직후 vim-tmux-navigator의 bare C-l로 pane을 옮기면 창이 또 넘어간다. 범인은 Oh My Tmux!가 창 이동에 건 -r(repeat) 플래그다. -r의 진짜 의미와, 세 가지 처방을 다 재본 뒤 왜 stock이 제일 나았는지."
date        : 2026-07-14 14:00:00 +0900
categories  : [tmux, "설정·옵션"]
tags        : [oh-my-tmux, vim-tmux-navigator, repeat-time, troubleshooting]
pin         : false
hidden      : false
---

## 증상

[Oh My Tmux!](/posts/tmux/2026-07-12-oh-my-tmux/)와 `vim-tmux-navigator`를 같이 쓰는 흔한 셋업이다. 키 배치는 이렇다.

- `prefix + C-h / C-l` → 이전 / 다음 **창(window)** 이동 (OMT 기본)
- bare `C-h / C-l` (prefix 없이) → **pane / nvim split** 이동 (vim-tmux-navigator)

평소엔 잘 나뉜다. prefix가 있으면 창, 없으면 pane. 그런데 특정 순간에만 이상하게 씹힌다.

1. `prefix + C-l`로 다음 창으로 넘어간다.
2. 새 창에서 곧바로 pane을 옮기려고 bare `C-l`을 누른다.
3. pane이 옮겨지는 게 아니라 **창이 한 번 더 넘어간다.**

한 박자 쉬고 누르면 정상인데, 창 전환 직후 빠르게 누를 때만 재현된다. vim-tmux-navigator가 고장 난 것처럼 보이지만 범인은 따로 있다.

## 원인: `bind -r`의 진짜 의미

OMT는 창 이동을 이렇게 바인딩한다.

```tmux
set -sg repeat-time 600       # 반복 창의 유효 시간 (OMT 기본값)
bind -r C-h previous-window
bind -r C-l next-window
```

핵심은 `-r` 플래그다. 많은 사람이 "여러 번 눌러도 되는 키" 정도로 오해하는데, 정확한 의미는 이렇다.

> `-r`로 바인딩된 키를 실행하면, tmux는 그 후 **`repeat-time`(여기선 600ms) 동안 prefix 없이도 같은 prefix 키테이블이 열린 상태**로 머문다.

즉 `prefix + C-l`로 창을 넘긴 순간, tmux는 "지금부터 600ms 안에는 prefix 없이 `C-l`만 눌러도 next-window로 쳐준다"는 **반복 창(repeat window)**을 연다. `prefix + C-l C-l C-l`로 창을 훅훅 넘기라고 있는 편의 기능이다.

문제는 이 반복 창이 열려 있는 동안 누른 bare `C-l`이 **pane 이동용인지 창 반복용인지 tmux는 구분하지 못한다**는 점이다. 반복 창이 우선이라, vim-tmux-navigator의 root 테이블 `C-l`까지 가기도 전에 next-window로 삼켜진다. 그래서 "창 전환 직후 빠르게 누른 pane 이동만" 씹히는 것이다.

진단은 눈으로 확인된다.

```console
$ tmux list-keys -T prefix | grep 'C-l'
bind-key -r -T prefix C-l  next-window
#        ^^ 이 -r 이 반복 창을 연다
```

`bind-key` 뒤에 `-r`이 붙어 있으면 이 함정의 후보다.

> **왜 하필 bare 키를 다른 용도로 쓰는 셋업에서만 터지나.** OMT만 순정으로 쓰면 반복 창 안에서 bare `C-l`을 누를 일이 없으니 문제가 드러나지 않는다. vim-tmux-navigator가 bare `C-l`을 pane 이동에 *재사용*하는 순간, 같은 물리 키가 두 의미를 갖게 되면서 반복 창과 충돌한다. 도구 하나만으로는 안 보이고, 둘을 겹칠 때만 나오는 유령버그다.

## clear-screen 충돌과는 다른 문제다

OMT + vim-tmux-navigator에는 `C-l`을 둘러싼 **또 다른** 함정이 있다. OMT가 루트 테이블에 건 `bind -n C-l`(화면 클리어)과 navigator의 pane 이동이 로드 순서에 따라 한쪽을 먹는 문제인데, 이건 [Oh My Tmux! 글](/posts/tmux/2026-07-12-oh-my-tmux/)에서 다뤘다.

이름이 같은 `C-l`이라 헷갈리기 쉽지만 메커니즘이 다르다.

| | clear-screen 충돌 | 이 글의 repeat 충돌 |
|---|---|---|
| 원인 | 바인딩 **재매핑** + 로드 순서 | `-r` **반복 창**이 다음 키를 삼킴 |
| 증상 | `prefix + C-l`이 아예 안 먹음 | 창 전환 **직후**의 bare `C-l`만 씹힘 |
| 진단 | `@vim_navigator_prefix_mapping_clear_screen` | `list-keys`의 `-r` 플래그 |

## 세 가지 처방 — 그리고 왜 stock이 제일 나았나

`.tmux.conf.local`은 OMT 본체 뒤에 소싱되므로, 거기서 재바인딩하면 OMT 기본을 덮어쓸 수 있다. 후보는 셋이다.

### ① `-r` 제거 — 씹힘은 사라지지만 반복 상실

```tmux
bind C-h previous-window
bind C-l next-window
```

`-r`을 떼면 반복 창이 아예 안 열려 씹힘이 **완전히** 사라진다. 대신 `prefix + C-l C-l`로 창을 연속으로 넘기던 fan 기능을 잃는다.

### ② 반복을 안 겹치는 키로 이사 — 하지만 idiom 발명

fan을 살리고 싶다면 반복을 bare로 안 쓰는 다른 키에 얹으면 된다. 단 마땅한 키가 없다. OMT는 `p`를 paste-buffer에 이미 쓰고 있어 `n`/`p` 쌍이 자유롭지 않고, `M-h`/`M-l`(Alt)은 터미널이 Option을 Alt로 보내도록 설정돼 있어야만 동작한다.

```tmux
# 예: Alt 계열 — 단 Ghostty라면 macos-option-as-alt 가 켜져 있어야 전달됨
bind -r M-h previous-window
bind -r M-l next-window
```

씹힘 0에 fan도 유지되지만, **OMT가 안 쓰는 새 키 관습을 발명**하는 것이고, Alt 전달 같은 터미널 의존성까지 딸려온다. 마찰 하나 없애려고 패치를 쌓는 모양새가 된다.

### ③ `repeat-time` 축소 — 미봉책

```tmux
set -sg repeat-time 250       # 600 → 250
```

반복 창을 좁히면 충돌 확률이 급감한다. fan 연타는 빠르게 누르면 여전히 되고, 창 전환 후 한 박자 쉬고 옮기는 pane 이동은 창 밖이라 정상 처리된다. 다만 "확률 급감"이지 **제거는 아니다.** 빠르게 옮기면 여전히 씹힐 수 있다.

### 결론: 도구를 거스르지 않는 쪽

셋을 다 시험한 뒤 내린 결론은 **아무것도 안 하고 OMT 기본(`-r` 유지, `repeat-time` 600)을 그대로 두는 것**이었다.

- ①은 fan을 버리는 트레이드오프, ②는 관습 발명 + 터미널 의존성, ③은 미봉책. 셋 다 무언가를 지불한다.
- 실제로 그 씹힘은 "창 전환 직후 빠르게 pane을 옮길 때"만 나오고, 대부분 한 박자 쉬고 옮기므로 체감 빈도가 낮다. 감수할 만한 수준이었다.
- 무엇보다 `-r` 반복은 OMT의 **의도된 설계**지 버그가 아니다. 설계 의도를 우회 패치로 덮으면 업그레이드·이식이 취약해진다.

마찰이 있다고 반드시 패치해야 하는 건 아니다. 정공법 후보를 다 따져본 뒤 **"그냥 기본을 감수한다"도 유효한 결론**이고, 패치를 안 쌓은 것 자체가 자산이다. 만약 SSH로 남의 서버를 자주 타서 OMT 키맵 자체가 부담이라면, 애초에 [`tmux_conf_preserve_stock_bindings=true`](/posts/tmux/2026-07-12-oh-my-tmux/)로 stock 키맵을 지키는 편이 더 근본적인 선택이다.

## 정리

- `bind -r`는 "반복 가능"이 아니라 **"실행 후 `repeat-time` 동안 prefix 없이 같은 키테이블이 열림"**이다.
- 그 열린 창이 bare 키를 삼키므로, bare 키를 다른 용도로 쓰는 셋업(vim-tmux-navigator 등)과 충돌한다.
- 진단은 `tmux list-keys -T prefix | grep`으로 `-r` 플래그를 눈으로 확인.
- 처방은 `-r` 제거 / 반복 키 이사 / `repeat-time` 축소가 있지만 모두 대가가 있다. 씹힘이 드물다면 **기본을 감수하는 게 가장 깔끔**하다.
