---
title       : "termcap과 terminfo — 터미널마다 다른 제어 코드를 어떻게 숨겼나"
description : "TERM, termcap, terminfo, tput의 관계를 통해 터미널 capability database가 왜 필요했고 curses와 현대 TUI의 호환성 계층에 어떻게 연결되는지 정리한다."
date        : 2026-09-05 13:50:00 +0900
updated     : 2026-09-13 18:15:00 +0900
categories  : [terminal]
tags        : [terminal, termcap, terminfo, tput, term, ncurses, capability]
pin         : false
hidden      : false
---

앞에서는 애플리케이션이 표준 출력으로 제어 시퀀스를 보내 커서를 움직이고 화면을 제어할 수 있다는 것을 봤다.

그다음 질문은 이것이다.

> **터미널마다 지원 기능과 제어 시퀀스가 다르면 애플리케이션은 어떻게 호환성을 유지할까?**

핵심 관계부터 보면 다음과 같다.

```text
ANSI / VT 제어 시퀀스
= 화면을 어떻게 제어할지 정한 명령 형식

TERM
= 현재 어떤 터미널 정의를 사용할지 가리키는 이름

terminfo
= 그 터미널이 무엇을 할 수 있고 어떤 시퀀스를 써야 하는지 저장한 데이터베이스

tput
= TERM과 terminfo를 이용해 필요한 capability를 조회·출력하는 명령어
```

즉 애플리케이션이 터미널마다 제어 문자열을 직접 하드코딩하지 않고, **현재 TERM에 맞는 capability를 terminfo에서 찾아 사용하도록 만든 구조**다.

```text
애플리케이션
  ↓ "화면을 지우고 싶다"
TERM
  ↓ 어떤 터미널 정의를 쓸지 선택
terminfo
  ↓ clear capability 조회
현재 터미널에 맞는 제어 시퀀스
  ↓
터미널
```

이 관계를 먼저 잡고 각 요소를 내려가 보자.

## Capability — 애플리케이션이 정말 알고 싶은 것

애플리케이션이 알고 싶은 것은 보통 터미널 모델명 자체가 아니다.

```text
커서를 임의 위치로 이동할 수 있는가?
화면을 지우는 시퀀스는 무엇인가?
색상을 몇 개 지원하는가?
대체 화면을 지원하는가?
특수키는 어떤 바이트 시퀀스로 들어오는가?
```

이런 기능을 **터미널 capability**라고 한다.

그래서 터미널별 차이를 코드 분기로 넣기보다 capability 정보를 데이터로 분리할 수 있다.

```c
if (terminal == VT100) {
    ...
} else if (terminal == ADM3A) {
    ...
}
```

같은 식으로 프로그램마다 터미널별 분기를 쌓지 않아도 되는 것이다.

## TERM — 어떤 터미널 정의를 사용할지 고른다

셸에서 다음을 실행해보자.

```bash
echo "$TERM"
```

환경에 따라 다음 같은 값이 나올 수 있다.

```text
xterm-256color
screen-256color
tmux-256color
```

`TERM`은 단순한 브랜드명이 아니라 **어떤 터미널 capability description을 사용할지 선택하는 키**에 가깝다.

```text
$TERM=tmux-256color
       ↓
terminfo에서 tmux-256color entry 검색
       ↓
이 터미널이 지원한다고 가정할 capability 집합
```

그래서 `TERM`을 임의로 바꾸면 안 된다. 실제 터미널보다 많은 기능을 지원한다고 선언하면 잘못된 시퀀스를 보낼 수 있고, 반대로 너무 보수적인 값을 쓰면 사용할 수 있는 기능도 못 쓰게 된다.

## terminfo — 터미널 capability를 저장한 데이터베이스

`terminfo`는 다음 질문에 답한다.

> **이 TERM이 무엇을 할 수 있고, 그 기능을 실제로 어떻게 호출하는가?**

terminfo entry는 대략 다음 종류의 정보를 가진다.

| 종류 | 의미 | 예 |
|---|---|---|
| Boolean | 기능 존재 여부 | 특정 모드 지원 여부 |
| Numeric | 숫자 값 | 지원 색상 수 |
| String | 제어 문자열 | 커서 이동, 화면 지우기 |

예를 들어 `clear`, `cup`, `setaf`, `smcup` 같은 capability가 있다.

```text
clear → 화면 지우기
cup   → 커서 위치 지정
setaf → 전경색 설정
smcup → 대체 화면 계열 진입
```

이전 글에서 직접 `ESC[2J` 같은 문자열을 보냈다면, 여기서는 **"clear라는 기능이 필요하다"고 요청하고 현재 TERM에 맞는 문자열을 찾는다.**

## termcap — 같은 문제를 먼저 풀었던 형식

`termcap`은 초기 Unix/BSD 환경에서 널리 사용된 터미널 capability 데이터베이스 형식이다.

핵심 아이디어는 terminfo와 같다.

```text
터미널 이름
+ capability 이름
+ capability 값
```

을 코드 밖의 데이터로 관리한다.

`terminfo`는 이 문제를 더 구조적인 형태로 다루는 후속 계열이라고 보면 된다.

처음 읽을 때는 **termcap과 terminfo의 세부 형식 차이보다 "터미널별 차이를 데이터로 분리했다"는 점**이 더 중요하다.

## tput — terminfo를 직접 써보는 도구

`tput`은 현재 `TERM`과 terminfo를 이용해 capability를 조회하거나 해당 제어 문자열을 출력한다.

예를 들어:

```bash
tput clear
```

은 현재 터미널에 맞는 화면 지우기 capability를 사용한다.

반면:

```bash
printf '\e[2J'
```

은 특정 제어 시퀀스를 직접 하드코딩한 것이다.

차이는 다음과 같다.

```text
printf '\e[2J'
= 내가 제어 시퀀스를 직접 지정

tput clear
= 현재 TERM에 맞는 clear capability를 terminfo에서 찾음
```

커서 이동이나 색상도 같은 방식으로 확인할 수 있다.

```bash
tput cup 5 10
tput bold
tput colors
```

## infocmp — 현재 terminfo 내용을 보는 도구

`infocmp`를 실행하면 현재 `TERM`에 대응하는 terminfo entry를 사람이 읽을 수 있는 형태로 볼 수 있다.

```bash
infocmp
```

또는:

```bash
infocmp xterm-256color
```

즉 역할을 비교하면:

```text
TERM
= 어떤 entry를 쓸지 선택

terminfo
= capability 데이터 저장

infocmp
= 그 데이터를 읽어서 보여줌

tput
= 그 데이터를 이용해 capability를 사용
```

## 왜 ANSI/VT가 있는데도 terminfo가 필요한가

ANSI/VT 계열 제어 시퀀스가 널리 호환되더라도 모든 터미널이 완전히 같은 기능을 제공하는 것은 아니다.

차이는 다음처럼 남을 수 있다.

- 지원 기능 범위
- 색상 수
- function key sequence
- 대체 화면 동작
- private extension
- 오래된 호환성 차이

그래서 애플리케이션은 단순히 "표준에 이런 명령이 있다"보다 **현재 터미널이 무엇을 지원한다고 선언하는지** 알아야 한다.

terminfo가 그 계약을 데이터로 표현한다.

## 실제 예 — tmux 안에서 TERM이 바뀌는 이유

이 구조는 tmux에서 특히 잘 보인다.

```text
Ghostty
  ↑ 실제 바깥 터미널 capability
 tmux
  ↑ tmux가 안쪽 프로그램에 제공하는 가상 터미널 capability
Neovim
```

Neovim이 tmux 안에서 실행되면 Ghostty와 직접 대화하는 것이 아니라 tmux가 제공하는 터미널 인터페이스를 본다.

그래서 안쪽의 `TERM`이 `tmux-256color`나 `screen-256color`처럼 달라질 수 있다.

```text
밖의 TERM
  ↓
tmux가 중간에서 해석·재표현
  ↓
안의 TERM
```

즉 `TERM`은 단순 환경변수 장난이 아니라 **지금 애플리케이션이 어느 터미널 인터페이스를 상대하고 있는지 나타내는 계약의 이름**이다.

## SSH에서도 TERM이 중요한 이유

SSH에서 PTY를 할당하면 원격 셸이나 TUI도 어떤 터미널 capability를 기대해야 하는지 알아야 한다.

```text
로컬 터미널 에뮬레이터
        ↓
SSH 클라이언트
        ↓ TERM + 터미널 바이트 스트림
SSH 서버
        ↓
원격 PTY
        ↓
원격 애플리케이션
```

원격 시스템에 해당 TERM의 terminfo entry가 없으면 다음 같은 문제가 생길 수 있다.

```text
unknown terminal type
Error opening terminal
terminal is not fully functional
```

그래서 최신 터미널을 오래된 서버에서 사용할 때 terminfo entry가 중요한 문제가 된다.

## 여기부터는 연결 — curses로 한 단계 더 올라가기

지금까지의 추상화 상승은 다음과 같다.

```text
제어 시퀀스 직접 사용
애플리케이션 → ESC[...] → 터미널

        ↓

터미널 차이 추상화
애플리케이션 → TERM / terminfo → 터미널별 시퀀스

        ↓

화면 추상화
애플리케이션 → curses → terminfo → 터미널
```

terminfo는 UI 프레임워크가 아니다.

> **"이 터미널에서 이 기능을 사용하려면 어떤 시퀀스를 써야 하는가?"**

에 답하는 계층이다.

다음 단계인 curses는 이 위에서 화면(Screen)과 창(Window)을 직접 다루는 더 높은 추상화를 제공한다.

## 참고

- `terminfo(5)` — terminal capability database
- ncurses `curs_terminfo(3X)` — terminfo capability lookup API
- `infocmp`, `tput` — terminfo를 관찰하고 사용하는 도구
