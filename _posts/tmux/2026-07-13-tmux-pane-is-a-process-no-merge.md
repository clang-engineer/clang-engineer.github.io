---
title       : "tmux엔 왜 pane '병합(merge)'이 없을까 — pane은 살아있는 프로세스다"
description : "윈도우마다 갈라진 pane 두 개를 하나로 합치려다 merge 명령이 없다는 걸 발견한다. 그 부재는 버그가 아니라 설계다 — pane이 PTY에 물린 독립 프로세스이기 때문. join-pane·break-pane·swap-pane이라는 tmux의 동사가 왜 그렇게 생겼는지 정신 모델로 정리한다."
date        : 2026-07-13 12:00:00 +0900
categories  : [tmux, "구조·개념"]
tags        : [tmux, terminal, pty, guide]
pin         : false
hidden      : false
---

윈도우마다 pane이 두 개씩 갈라져 있다. 이걸 각 윈도우당 하나로 "합치고" 싶어서
`man tmux`를 뒤진다. `join-pane`, `break-pane`, `swap-pane`... 그런데 아무리 찾아도
**`merge-pane` 같은 건 없다.** 왜일까?

결론부터: 그건 tmux가 빠뜨린 기능이 아니라 **애초에 불가능한 요청**이다.
이유를 알면 tmux의 pane 관련 명령들이 왜 지금처럼 생겼는지가 한 번에 풀린다.

> 이 글은 [tmux 로드맵](/posts/tmux/2026-06-16-tmux-roadmap/)의 **입문 — 구조** 갈래에
> 속한다. `join-pane`의 실제 사용법(타겟 문법·옵션)은
> [tmux 정리본](/posts/tmux/2021-11-30-tmux-config/)의 "윈도우 합치기/분리" 절에서.
{: .prompt-tip }

## pane은 화면 조각이 아니라 프로세스다

tmux의 계층은 흔히 이렇게 소개된다.

```
세션(Session) > 윈도우(Window) > 패널(Pane)
```

이 그림을 보면 pane이 그냥 "화면을 나눈 사각형"처럼 느껴진다. 그래서 "두 사각형을
하나로 합치기"가 당연히 될 것 같다. 하지만 pane의 정체는 화면이 아니다.

**pane 하나 = 의사 터미널(PTY, pseudo-terminal — 실제 시리얼 단말기 없이 소프트웨어로
흉내 낸 터미널) 하나에 물린, 독립된 셸 프로세스 하나.**

`Ctrl+b %`로 pane을 세로로 쪼갤 때 실제로 일어나는 일은 "사각형이 둘로 나뉘는" 게
아니라, tmux가 **새 PTY를 열고 그 위에서 새 셸(`zsh`/`bash`)을 fork** 하는 것이다.
직접 확인할 수 있다.

```bash
# pane 두 개짜리 윈도우에서 각 pane의 프로세스/tty 확인
tmux list-panes -F '#{pane_index}  #{pane_tty}  #{pane_pid}  #{pane_current_command}'
# 0  /dev/ttys004  54321  zsh
# 1  /dev/ttys007  54999  vim
```

pane마다 `tty`도 다르고 `pid`도 다르다. 서로 완전히 남남인 두 프로세스다.

## 그래서 "merge"는 정의 자체가 성립하지 않는다

이제 "pane 두 개를 하나로 병합"이 무슨 뜻이어야 하는지 생각해 보자.

- pane 0에는 `zsh`가, pane 1에는 `vim`이 돌고 있다.
- 이 둘을 "합친다"면 — **하나의 PTY에 두 프로세스를 물린다?** 터미널은 그런 걸
  표현할 방법이 없다. 한 터미널의 화면·키 입력은 한 프로세스 그룹(foreground)에게 간다.
- 두 프로세스의 출력을 한 화면에 뒤섞는다? 그건 병합이 아니라 그냥 로그 두 개를
  겹쳐 찍는 난장판이다.

즉 워드 문서 두 개를 이어 붙이듯 되는 게 아니다. **살아 있는 프로세스는 융합되지
않는다.** 그래서 tmux의 동사에는 merge가 없고, 대신 프로세스를 **옮기고 / 떼고 /
맞바꾸는** 것만 있다.

| 동사 | 하는 일 | 프로세스 관점 |
|---|---|---|
| `join-pane` | 다른 윈도우의 pane을 현재 윈도우로 가져옴 | PTY를 **이동** (재배치) |
| `break-pane` | 현재 pane을 새 윈도우로 떼냄 | PTY를 **분리** |
| `swap-pane` | 두 pane의 자리를 맞바꿈 | PTY 위치 **교환** |

전부 "레이아웃 위에서 PTY 상자를 재배치"할 뿐, 상자 안의 프로세스를 건드리지 않는다.
merge가 없는 게 아니라, **merge라는 개념이 이 모델에선 정의될 수 없는** 것이다.

## 그럼 내가 원하던 "합치기"는 뭐였나

보통 "pane을 병합하고 싶다"고 할 때 실제 의도는 둘 중 하나다.

### (A) 분할을 없애고 pane 하나만 남기고 싶다

이건 병합이 아니라 **한쪽 pane을 닫는 것**이다. 없앨 pane에 커서를 두고:

```
Ctrl+b x        # y로 확인 → 그 pane의 프로세스 종료, 남은 pane이 창을 꽉 채움
```

`vim` 같은 걸 살려두고 싶으면 그쪽이 아니라 **비어 있는 셸 pane 쪽을** 닫으면 된다.
남길 프로세스를 고르는 문제이지, 둘을 합치는 문제가 아니다.

### (B) 흩어진 pane들을 한 윈도우로 모으고 싶다

이게 진짜 `join-pane`의 영역이다. 다만 핵심 함정이 하나 있다 —
**`join-pane`은 한 번에 pane 하나씩만 옮긴다.**

```bash
# 윈도우 1에 있는 상태에서, 윈도우 2의 pane들을 끌어오기
tmux join-pane -s 2       # 윈도우 2의 활성 pane 1개가 윈도우 1로 이동
tmux join-pane -s 2       # 윈도우 2에 남은 pane 하나마저 이동
```

윈도우 2가 pane 2개로 분할돼 있었다면, 한 방에 "윈도우째" 넘어오지 않는다.
pane 단위로 하나씩, 위 명령을 **반복**해야 한다. 그리고 —

> **source 윈도우의 pane이 전부 빠져나가면 그 윈도우는 자동으로 닫힌다.**
> 빈 윈도우를 따로 `kill-window` 할 필요가 없다. pane이 0개인 윈도우는 존재할 수
> 없기 때문 — 이것도 "윈도우는 pane들의 컨테이너일 뿐"이라는 같은 모델의 귀결이다.
{: .prompt-tip }

반복이 귀찮으면 `Ctrl+b :`로 명령창을 연 뒤 `↑`(위 화살표)로 직전 `join-pane`을
불러와 엔터만 치면 된다. pane 번호가 헷갈리면 `Ctrl+b q`가 각 pane에 번호를 잠깐
띄워 주니, `-s 2.1`처럼 `윈도우.pane`으로 콕 집어 옮길 수 있다.

## 정리

- pane은 화면 조각이 아니라 **PTY에 물린 독립 프로세스**다. `list-panes`로 pane마다
  다른 `tty`·`pid`를 직접 볼 수 있다.
- 살아 있는 프로세스는 융합되지 않으므로 tmux엔 **merge라는 동사가 없다.** 대신
  PTY를 옮기고(`join-pane`) 떼고(`break-pane`) 맞바꾸는(`swap-pane`) 것만 있다.
- "합치고 싶다"의 실제 의도는 (A) **한쪽 pane 닫기**(`Ctrl+b x`)이거나 (B) **`join-pane`으로
  하나씩 모으기**다. (B)는 pane 단위 반복이고, source 윈도우는 비면 알아서 사라진다.

명령 이름이 왜 그렇게 생겼는지는 대개 그 도구의 데이터 모델을 그대로 비춘다.
tmux에서 "merge를 못 찾겠다"는 막힘은, 사실 pane이 프로세스라는 사실을 아직
안 봤다는 신호였던 셈이다.

> 📎 **치트시트** · [tmux](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/tmux.md) —
> `join-pane` 옵션(`-s`/`-t`/`-h`/`-v`)·타겟 문법·stash 토글 빠른 참조
{: .prompt-tip }
