---
title       : 🌀 tmux — 터미널 열 때마다 새 세션이 생기는 이유 (attach -t 함정)
description : 셸 시작 시 tmux 자동 attach 스니펫이 매번 빈 세션을 새로 만드는 문제. `attach -t <이름>` 하드코딩과 세션 이름 불일치가 원인이고, 타깃 없는 attach 한 줄로 해결한다. JetBrains IDE 터미널에서 tmux가 자동 실행되는 것을 막는 방법까지.
date        : 2026-07-03 09:00:00 +0900
categories  : [tmux, "스크립트·플러그인"]
tags        : [tmux, session, zsh, terminal, jetbrains]
pin         : false
hidden      : false
---

> 이 글은 [tmux 로드맵](/posts/tmux/2026-06-16-tmux-roadmap/)의 **트러블슈팅** 편이다. 입문·설정·플러그인·부트스트랩까지 전체 경로는 로드맵에서.
{: .prompt-tip }

## 증상

`.zshrc`(또는 `.bashrc`)에 "터미널을 열면 자동으로 tmux 세션에 붙는" 스니펫을 넣어 두고 쓰다 보면, 어느 순간 이런 상태가 된다.

```console
$ tmux ls
0-default:   2 windows (attached)
1-workspace: 2 windows
default:     1 windows        # ← 접속할 때마다 하나씩 늘어나는 빈 세션
```

정작 작업하던 세션(`0-default`)은 따로 있는데, 새 터미널을 열 때마다 **아무것도 없는 `default` 세션이 계속 새로 생긴다.** 붙긴 붙는데 매번 빈 창에 떨어지는 것이다.

## 문제의 스니펫

셸 시작 시 자동 attach는 보통 이런 형태다.

```sh
# tmux 자동 실행 (이미 tmux 안이 아닐 때만, IDE 내장 터미널 제외)
if command -v tmux &>/dev/null && [[ -z "$TMUX" ]] && [[ "$TERMINAL_EMULATOR" != "JetBrains-JediTerm" ]]; then
  tmux attach -t default || tmux new -s default
fi
```

각 조건의 의미부터 짚으면:

- `command -v tmux` — tmux가 설치돼 있을 때만 실행.
- `[[ -z "$TMUX" ]]` — 이미 tmux 세션 **안**이면 `$TMUX`에 소켓 경로가 들어 있다. 안에서 또 attach하면 세션이 중첩되므로 밖에 있을 때만 실행.
- `[[ "$TERMINAL_EMULATOR" != "JetBrains-JediTerm" ]]` — JetBrains IDE 내장 터미널일 때는 tmux 자동 실행을 건너뛴다. IntelliJ·PyCharm 등 JetBrains IDE는 내장 터미널을 띄울 때 환경변수 `TERMINAL_EMULATOR=JetBrains-JediTerm`을 넣어 준다. 이 값으로 "지금 IDE 내장 터미널인가"를 판별한다.

> **IDE 터미널에서 tmux가 제멋대로 뜬다면**
> 이 조건이 바로 그 문제를 막는 장치다. `.zshrc`에 tmux 자동 실행을 넣으면 JetBrains 내장 터미널을 열 때마다 tmux가 자동으로 떠서, IDE가 기대하는 순수 셸 대신 tmux 세션 안에 갇힌다. IDE의 터미널 제어(작업 디렉토리 연동, 단축키 등)와도 충돌한다. `$TERMINAL_EMULATOR`로 IDE 터미널을 감지해 그때만 자동 실행을 빼면 깔끔하게 해결된다.
{: .prompt-tip }

여기까지는 정상이다. 문제는 마지막 줄이다.

```sh
tmux attach -t default || tmux new -s default
```

의도는 "`default` 세션이 있으면 붙고, 없으면 만들어라"이다. 그런데 실제 세션 이름이 `default`가 아니라 `0-default`라면?

## 원인 — `attach -t`는 이름을 (거의) 정확히 맞춰야 한다

`tmux attach -t default`는 **`default`라는 타깃 세션을 찾는다.** 그런데 살아있는 세션은 `0-default`다. `default`로는 이 세션을 못 찾는다.

`-t`의 매칭 규칙을 정확히 보면 tmux는 타깃 세션을 **접두어(prefix)로 매칭**한다. 즉 `tmux attach -t work`는 `workspace` 세션에 붙을 수 있다. 하지만 `0-default`는 `default`로 **시작하지 않으므로** `-t default`로는 절대 매칭되지 않는다. 접두어 매칭은 앞에서부터 맞아야 한다.

그래서 흐름은 이렇게 된다.

```sh
tmux attach -t default   # 실패 — 'default'라는 이름의 세션이 없음
||                       # 그래서 뒷부분으로 넘어가고
tmux new -s default      # 매번 새 'default' 세션을 생성
```

**접속할 때마다 `attach`가 헛다이빙하고 `new`로 빠지는 것.** 이게 빈 세션이 계속 쌓이는 이유다.

## 왜 세션 이름에 `0-`, `1-` 같은 접두어가 붙나

이 함정에 빠지는 전형적인 경우가 **세션 정렬을 위해 이름에 숫자 접두어를 붙이는** 습관이다.

`tmux ls`와 세션 선택기(`prefix + s`)는 세션을 **이름 알파벳순으로 정렬**한다. 정렬 순서를 직접 지정하는 옵션이 없기 때문에, 순서를 고정하고 싶으면 이름 앞에 번호를 붙이는 게 흔한 기법이다.

```
0-default     # 항상 맨 위
1-workspace   # 그다음
2-logs
```

정렬용으로는 완벽하게 동작한다. 문제는 이 접두어를 **자동 attach 스니펫이 모른다**는 것뿐이다. 스니펫은 여전히 접두어 없는 `default`를 찾고 있다.

## 해결 — 타깃을 아예 떼어낸다

핵심은 이름을 바꾸는 게 아니라, **attach할 때 이름을 하드코딩하지 않는 것**이다.

```sh
tmux attach || tmux new -s default
```

`tmux attach`를 **타깃 없이** 부르면 tmux는 **가장 최근에 쓰던 세션**에 자동으로 붙는다. 이름이 `0-default`든 `1-workspace`든 상관없다. tmux 서버 자체가 없을 때(부팅 직후 첫 실행 등)만 `attach`가 실패하고, 그때 비로소 `tmux new -s default`로 새 세션을 만든다.

즉 두 가지가 **독립된 관심사**로 깔끔하게 분리된다.

| 관심사 | 담당 |
|---|---|
| 세션 **정렬 순서** | 세션 이름의 숫자 접두어 (그대로 유지) |
| 세션 **접속** | `tmux attach` (타깃 없음) |

정렬용 접두어는 그대로 두고, "매번 새 세션 생성" 문제만 사라진다. 이름을 하드코딩한 `-t default`가 유일한 버그였다.

## 특정 세션에 항상 착지하고 싶다면

"최근 세션"이 아니라 **항상 같은 세션**에 떨어지고 싶다면 두 가지 선택지가 있다.

정확한 이름으로 붙이기 — 단, 접두어 번호가 바뀌면 다시 깨진다.

```sh
tmux attach -t 0-default
```

또는 `new-session -A`로 "있으면 붙고 없으면 만들기"를 한 줄로 합치기. `-A`는 대상 세션이 이미 있으면 `new` 대신 `attach`처럼 동작한다.

```sh
tmux new-session -A -s default
```

이 방식은 항상 `default`라는 고정 이름의 세션 하나를 오간다. 반대로 여러 세션을 유동적으로 오가며 "그냥 마지막에 쓰던 곳"으로 돌아가고 싶다면 타깃 없는 `tmux attach`가 맞다.

## 검증

바꾼 뒤에는 실제로 확인해 본다.

1. 새 터미널 창을 연다 → 기존 세션(`0-default` 등)에 그대로 붙는가?
2. `tmux ls`로 빈 세션이 더 이상 쌓이지 않는지 확인.
3. 모든 tmux를 끄고(또는 재부팅 후) 처음 열었을 때만 새 세션이 만들어지는지 확인.

## 정리

- 셸 시작 자동 attach에서 `attach -t <이름>`을 **하드코딩하면**, 실제 세션 이름이 다를 때 매번 새 세션이 생긴다.
- `-t`는 **접두어 매칭**이라 `0-default`는 `default`로 못 찾는다. 정렬용 숫자 접두어를 쓰는 경우가 대표적 함정.
- **`tmux attach` (타깃 없음)** = 가장 최근 세션에 붙기. 서버가 없을 때만 새로 만든다. 정렬 접두어 워크플로우와 충돌하지 않는다.
- 고정 세션 하나만 원하면 `tmux new-session -A -s <이름>` 한 줄이 더 명확하다.

> **관련 글**
> - 세션·윈도우·패널 기본기와 attach 명령들: [tmux 정리본 (Cheat Sheet + 사용 가이드)](/posts/tmux/2021-11-30-tmux-config/)
> - 여러 세션을 스크립트로 한 번에 세팅하기: [tmux 초기 셋업용 세션/윈도우/패널 스크립트](/posts/tmux/2026-02-21-tmux-bootstrap/)
{: .prompt-info }
