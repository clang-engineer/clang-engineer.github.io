---
title       : "tmux 트루컬러가 이미 되는 이유 — tmux_conf_24b_colour=auto와 Tc/RGB terminfo"
description  : "Oh My Tmux!의 tmux_conf_24b_colour=auto가 트루컬러를 감지하는 2단 방식(COLORTERM → tput colors 폴백), 켜질 때 주입하는 낡은 Tc pseudo-capability, 그런데 TERM이 tmux-256color면 그 주입을 일부러 스킵하는 이유(정식 RGB terminfo가 이미 보장)까지 — '왜 트루컬러가 이미 잘 되지?'의 메커니즘을 한 장으로."
date        : 2026-07-14 01:00:00 +0900
categories  : [tmux, "설정·옵션"]
tags        : [guide, oh-my-tmux, truecolor, terminfo]
pin         : false
hidden      : false
---

[Oh My Tmux!](/posts/tmux/2026-07-12-oh-my-tmux/)(OMT, `gpakosz/.tmux`) 설정을 보면 `tmux_conf_24b_colour=auto`라는 한 줄이 주석과 함께 놓여 있다. 트루컬러(24bit) 스위치인데, 기본값 `auto`가 정확히 무엇을 감지하고 무엇을 주입하는지는 잘 안 보인다. 그리고 막상 파보면 **내 환경에선 사실상 아무것도 주입하지 않는데도 트루컬러는 멀쩡히 된다.** 왜 그런지가 이 글의 주제다.

> 이 글은 [OMT 개요글](/posts/tmux/2026-07-12-oh-my-tmux/)이 표 한 줄로 넘긴 `24b_colour` 노브의 딥다이브다. "어떤 노브가 있나"는 개요글, "왜 트루컬러가 이미 되나"는 이 글.

## 왜 tmux에 "알려줘야" 하나

터미널 색 지원은 계단식으로 늘었다: 8색 → 16색 → 256색 → **truecolor**(24bit, 2²⁴ = 16,777,216색). 문제는 tmux가 자기 바깥 터미널(Ghostty·iTerm·Alacritty 등)이 트루컬러를 지원하는지를 **표준적으로 물어볼 방법이 없다**는 것이다.

그래서 "바깥 터미널이 트루컬러를 낸다"는 사실을 tmux에 **명시적으로 주입**해야, tmux 안에서 도는 프로그램(nvim 등)까지 24bit 색이 흘러간다. 이 주입을 자동화해주는 것이 OMT의 `tmux_conf_24b_colour` 노브다. 값은 셋:

- `true` — 감지 없이 무조건 켬
- `false` — 끔
- `auto`(기본) — 환경변수·terminfo로 자동 감지

## `auto`의 2단 감지

OMT 내부 `_apply_24b()` 함수가 하는 판정을 그대로 보면 이렇다.

```sh
if [ "$tmux_conf_24b_colour" = "auto" ]; then
  case "$COLORTERM" in
    truecolor|24bit) apply_24b=true ;;              # ① 1순위: 관례 환경변수
  esac
  if [ "$apply_24b" = "" ] && [ "$(tput colors)" = "16777216" ]; then
    apply_24b=true                                   # ② 폴백: 16777216 = 2^24
  fi
elif _is_true "$tmux_conf_24b_colour"; then
  apply_24b=true                                     # true면 감지 없이 강제 ON
fi
```

- **① `COLORTERM`** — 값이 `truecolor` 또는 `24bit`이면 켠다. `COLORTERM`은 표준은 아니지만 트루컬러 지원 터미널이 자기가 세팅해주는 **사실상의 관례 변수**다([termstandard/colors](https://github.com/termstandard/colors)가 정리한 컨벤션).
- **② `tput colors`** — ①이 비었을 때의 폴백. terminfo가 답하는 색 수가 `16777216`(=2²⁴)이면 켠다. 환경변수가 없어도 **terminfo 능력치**로 한 번 더 확인하는 이중 안전망.

즉 `auto`는 "환경변수 우선, 없으면 terminfo"라는 2단 감지다.

## 켜질 때 실제로 하는 일 — 여기가 핵심

감지가 `apply_24b=true`로 끝나면, 실제 주입은 다음과 같다.

```sh
if [ "$apply_24b" = "true" ]; then
  case "$TERM" in
    screen-*|tmux-*) ;;                                   # ← 아무것도 안 함
    *) tmux set-option -ga terminal-overrides ",*256col*:Tc" ;;
  esac
fi
```

`Tc`("**T**rue**c**olor")는 terminfo에 트루컬러 정식 항목이 없던 시절, tmux 저자가 임의로 만든 **비공식 pseudo-capability**(사설 능력 플래그)다. `terminal-overrides`로 "256색 터미널이면 트루컬러가 있다고 쳐라"를 강제 주입하는 낡은 방식이다.

핵심은 그 아래 `case`다. **`TERM`이 `tmux-*`나 `screen-*`이면 이 주입을 통째로 스킵한다.** 왜 일부러 안 할까?

## Tc(사설) vs RGB(정식) — 왜 스킵이 맞나

옛날엔 트루컬러를 표현하는 terminfo 표준 항목이 없었다. 그래서 tmux는 `Tc`라는 사설 플래그를 만들어 `terminal-overrides`로 우겨넣게 했다. 이게 인터넷에 도는 수많은 `set -ga terminal-overrides ',*:Tc'` 스니펫의 정체다.

이후 terminfo에 **정식 `RGB` 능력**이 표준으로 들어왔고, 현대 tmux(3.2+)는 `Tc` 대신 이 `RGB` 항목을 읽는다. 그리고 요즘 배포되는 **`tmux-256color` terminfo에는 `RGB` 능력이 이미 내장**돼 있다.

정리하면:

| 방식 | 정체 | 상태 |
|---|---|---|
| `Tc` | tmux 저자의 사설 pseudo-capability | 표준 부재 시절의 우회책, 레거시 |
| `RGB` | terminfo 정식 능력 | 현대 표준, `tmux-256color`에 내장 |

그래서 `TERM=tmux-256color`처럼 이미 `RGB`를 품은 terminfo를 제대로 쓰고 있다면, **낡은 `Tc` 오버라이드를 덧씌울 이유가 없다.** OMT가 `tmux-*`/`screen-*` TERM에서 주입을 스킵하는 게 정확히 이 판단이다. 트루컬러는 `Tc` 핵이 아니라 **올바른 `TERM` + `RGB` terminfo**로 이미 보장된다.

## 실제 환경에서 무슨 일이 벌어지나

전형적인 현대 셋업의 값을 보면:

```console
$ echo $COLORTERM
truecolor
$ echo $TERM
tmux-256color
```

이 값으로 위 로직을 따라가면:

1. `COLORTERM=truecolor` → ① 만족, `apply_24b=true` (감지는 ON)
2. `TERM=tmux-256color` → `case`가 `tmux-*`에 매치 → **override 주입 안 함**

즉 감지는 켜지지만 실제 주입은 스킵된다. 그런데도 `RGB` terminfo 덕에 nvim까지 트루컬러가 정상 전달된다. **`auto`가 "감지는 하되 불필요한 레거시 핵은 안 얹는" 딱 맞는 기본값**이라, 대부분의 현대 셋업에서는 이 노브를 손댈 이유가 없다.

굳이 `Tc`가 필요한 경우는, 바깥 터미널은 트루컬러인데 `TERM`이 `xterm-256color` 같은 non-tmux 값이고 그 terminfo에 `RGB`가 없을 때 정도다. 그럴 땐 애초에 `TERM`을 `tmux-256color`로 바로잡는 게 정공법이고, `Tc` 오버라이드는 그게 안 될 때의 우회책이다.

## 검증

tmux 안에서 트루컬러가 실제로 흐르는지는 그라디언트 스크립트 하나로 확인된다. 무지개 띠가 **줄무늬(banding) 없이 매끈**하면 24bit가 도는 것이고, 층층이 계단처럼 끊기면 256색으로 떨어진 것이다.

```sh
curl -s https://raw.githubusercontent.com/JohnMorales/dotfiles/master/colors/24-bit-color.sh | bash
```

## 정리

- `tmux_conf_24b_colour=auto`는 **`COLORTERM` → `tput colors==16777216`** 순서의 2단 감지다.
- 켜지면 낡은 `Tc` 오버라이드를 주입하지만, **`TERM`이 `tmux-*`/`screen-*`이면 스킵**한다.
- 스킵해도 되는 이유는 현대 `tmux-256color` terminfo가 **정식 `RGB` 능력을 이미 내장**하기 때문. `Tc`는 표준 부재 시절의 레거시.
- 따라서 트루컬러의 진짜 보장은 "올바른 `TERM` + `RGB` terminfo"이고, `auto`는 그걸 방해하지 않는 안전한 기본값이다.

> 관련: [Oh My Tmux! — 완성형 tmux config 배포판](/posts/tmux/2026-07-12-oh-my-tmux/)의 `tmux_conf_*` 노브 카탈로그.
