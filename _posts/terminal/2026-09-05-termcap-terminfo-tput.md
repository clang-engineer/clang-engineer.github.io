---
title       : "termcap과 terminfo — 터미널마다 다른 제어 코드를 어떻게 숨겼나"
description : "TERM, termcap, terminfo, tput의 관계를 통해 터미널 capability database가 왜 필요했고 curses와 현대 TUI의 호환성 계층에 어떻게 연결되는지 정리한다."
date        : 2026-09-05 13:50:00 +0900
updated     : 2026-09-05 13:50:00 +0900
categories  : [terminal]
tags        : [terminal, termcap, terminfo, tput, term, ncurses, capability]
pin         : false
hidden      : false
---

앞에서는 TUI 앱이 stdout으로 `ESC [ ...` 형태의 control sequence를 보내 커서를 움직이고 화면을 지울 수 있다는 것을 봤다.

그런데 여기서 역사적으로 큰 문제가 생긴다.

> 모든 터미널이 같은 sequence와 같은 기능을 지원하는가?

오늘날 Ghostty, Kitty, WezTerm처럼 VT/xterm 계열 호환성이 높은 터미널만 보면 차이가 작아 보이지만, 과거에는 터미널 제조사와 모델마다 기능과 제어 문자열이 크게 달랐다.

애플리케이션이 터미널마다 이렇게 분기한다면 유지보수가 불가능해진다.

```c
if (terminal == VT100) {
    ...
} else if (terminal == ADM3A) {
    ...
} else if (...) {
    ...
}
```

이 문제를 풀기 위해 등장한 핵심 아이디어가 **터미널의 기능을 코드에서 분리해 데이터로 기술하는 것**이다.

## Capability라는 관점

애플리케이션이 실제로 알고 싶은 것은 보통 터미널 모델명이 아니다.

다음 같은 질문이다.

```text
커서를 임의 위치로 이동할 수 있는가?
화면 전체를 지우는 문자열은 무엇인가?
색상을 지원하는가?
몇 개의 색상을 지원하는가?
alternate screen에 들어가는 sequence는 무엇인가?
F1 키는 어떤 byte sequence로 들어오는가?
```

이런 기능을 **terminal capability**라고 부른다.

그러면 구조를 이렇게 바꿀 수 있다.

```text
Application
    ↓
"cursor_address 기능 필요"
    ↓
Capability Database
    ↓
현재 터미널에 맞는 control sequence
    ↓
Terminal
```

애플리케이션은 하드코딩된 모델별 문자열 대신 capability 이름을 요청한다.

## TERM — 지금 어떤 터미널이라고 가정할 것인가

셸에서 다음을 실행해보자.

```bash
echo "$TERM"
```

환경에 따라 다음과 같은 값이 나올 수 있다.

```text
xterm-256color
screen-256color
tmux-256color
```

`TERM`은 단순한 브랜드 이름이 아니라 **어떤 terminal capability description을 사용할지 선택하는 키**에 가깝다.

```text
$TERM=tmux-256color
       ↓
terminfo에서 해당 entry 검색
       ↓
이 터미널이 지원한다고 가정할 capability 집합
```

따라서 `TERM`을 무턱대고 바꾸는 것은 좋지 않다.

실제 터미널이 지원하지 않는 capability를 선언하면 프로그램이 잘못된 sequence를 보낼 수 있고, 반대로 너무 보수적인 값이면 사용할 수 있는 기능을 못 쓰게 된다.

## termcap — 초기 capability database

초기 Unix/BSD 환경에서는 **termcap(terminal capability)** 형식이 널리 사용됐다.

핵심 아이디어는 단순하다.

```text
terminal name
  +
capability 이름
  +
그 capability의 값
```

을 텍스트 데이터베이스로 관리한다.

예를 들어 개념적으로:

```text
vt100:
  clear_screen = ESC[H ESC[2J
  cursor_move  = ...
  columns      = 80
```

같은 정보가 들어 있다고 이해하면 된다.

프로그램은 현재 terminal entry를 읽고 필요한 capability를 가져간다.

이것만으로도 터미널별 제어 코드가 애플리케이션 코드에서 상당 부분 분리된다.

## terminfo — capability 표현을 더 구조화

System V 계열에서 발전한 **terminfo**는 같은 문제를 더 구조적인 형태로 다룬다.

terminfo entry의 capability는 크게 세 종류다.

| 종류 | 의미 | 예 |
|---|---|---|
| Boolean | 기능 존재 여부 | 자동 margin 여부 등 |
| Numeric | 숫자 값 | color 수 등 |
| String | 제어 문자열 | cursor 이동, 화면 지우기 |

즉 terminfo는 단순 escape code 사전이 아니라:

> 이 터미널이 무엇을 할 수 있고, 그 기능을 어떻게 호출하는가

를 기술하는 데이터베이스다.

오늘날 ncurses 생태계에서는 terminfo가 핵심 capability database 역할을 한다.

## 실제로 terminfo를 들여다보기 — infocmp

현재 `TERM`의 terminfo entry를 사람이 읽을 수 있게 출력해볼 수 있다.

```bash
infocmp
```

또는 특정 타입:

```bash
infocmp xterm-256color
```

출력에는 많은 capability가 등장한다.

대표적으로 개념을 잡기 좋은 것들은:

```text
colors
clear
cup
bold
setaf
setab
smcup
rmcup
```

정도다.

이름은 구현/표현 방식에 따라 다소 낯설지만 의미는 대략 다음과 같다.

| capability | 의미 |
|---|---|
| `colors` | 지원 색상 수 |
| `clear` | 화면 지우기 |
| `cup` | cursor position |
| `bold` | bold mode |
| `setaf` | foreground color 설정 |
| `setab` | background color 설정 |
| `smcup` | alternate screen 계열 진입 |
| `rmcup` | alternate screen 계열 종료 |

즉 이전 글에서 직접 `ESC[2J`를 하드코딩했던 것을 capability 이름으로 찾을 수 있다.

## tput — shell에서 terminfo를 쉽게 사용하기

셸에서 terminfo capability를 사용해보는 가장 쉬운 도구가 `tput`이다.

화면 지우기:

```bash
tput clear
```

커서를 5행 10열 근처로 이동:

```bash
tput cup 5 10
printf 'HELLO'
```

굵게:

```bash
tput bold
printf 'bold text'
tput sgr0
```

색상 수 확인:

```bash
tput colors
```

여기서 중요한 차이는:

```bash
printf '\e[2J'
```

은 **특정 sequence를 직접 출력**한 것이고,

```bash
tput clear
```

은 **현재 `$TERM`에 맞는 clear capability를 찾아 출력**한 것이다.

구조는 다음과 같다.

```text
Shell script
   ↓ tput clear
terminfo lookup
   ↓
현재 TERM에 맞는 sequence
   ↓
Terminal
```

## clear 명령도 같은 세계에 있다

`clear`를 단순히 `printf '\e[2J'`의 별칭으로 생각하기 쉽지만, 전통적인 Unix 터미널 생태계에서는 현재 terminal capability를 고려해 적절한 동작을 선택하는 쪽에 가깝다.

즉 이런 도구들이 모두 같은 계층을 공유한다.

```text
clear
 tput
 curses
  ↓
terminfo
  ↓
Terminal capabilities
```

## 왜 escape sequence 표준이 있는데 terminfo가 필요한가

여기서 자연스러운 의문이 생긴다.

> VT/ANSI sequence가 어느 정도 표준화됐는데 지금도 capability database가 왜 필요한가?

이유는 터미널 기능이 단일 표준 하나로 완전히 끝나지 않았기 때문이다.

터미널마다:

- 지원하는 기능의 범위
- 색상 capability
- function key sequence
- alternate screen 동작
- private extension
- 오래된 호환성 차이

가 존재할 수 있다.

그리고 애플리케이션은 "이론상 표준에 존재한다"보다 **현재 터미널이 무엇을 지원한다고 선언하는가**를 알아야 한다.

terminfo는 그 계약을 데이터로 표현한다.

## tmux가 들어오면 TERM이 달라지는 이유

이제 tmux의 `TERM`이 왜 흥미로운지 보인다.

구조를 단순화하면:

```text
Ghostty
  ↑ 실제 terminal capability
 tmux
  ↑ tmux가 클라이언트에게 제공하는 가상 terminal capability
Neovim
```

Neovim은 Ghostty와 직접 대화하는 것이 아니다. tmux 안에서 실행되면 Neovim이 보는 상대는 **tmux가 제공하는 terminal interface**다.

그래서 내부에서 `$TERM`이 `tmux-256color`나 `screen-256color`처럼 바뀔 수 있다.

```text
밖의 TERM: xterm-... / ghostty 계열
           ↓
tmux가 해석하고 다시 표현
           ↓
안의 TERM: tmux-256color
```

이것은 단순 환경변수 장난이 아니라 **중간에 터미널을 에뮬레이션하는 계층이 하나 더 생겼기 때문**이다.

## SSH에서도 TERM이 전달되는 이유

SSH 접속에서 PTY를 할당하면 원격 shell/TUI도 어떤 terminal capability를 기대해야 하는지 알아야 한다.

그래서 로컬 terminal type 정보가 원격 세션의 `TERM`과 연결된다.

개념적으로:

```text
Local Terminal Emulator
        ↓
SSH client
        ↓ TERM + terminal byte stream
SSH server
        ↓
Remote PTY
        ↓
Remote Application
```

원격 애플리케이션은 로컬 GPU나 terminal emulator 구현을 직접 아는 것이 아니라, **PTY와 TERM이라는 Unix 터미널 계약**을 통해 동작한다.

이게 SSH에서도 Neovim/TUI가 그대로 동작할 수 있는 중요한 이유 중 하나다.

## terminfo가 모르면 생기는 문제

새로운 terminal emulator를 쓰거나 terminfo entry가 없는 오래된 서버에 SSH하면 다음과 같은 문제가 생길 수 있다.

```text
unknown terminal type
Error opening terminal
terminal is not fully functional
```

로컬에서는 최신 terminfo가 있지만 원격 서버의 데이터베이스에는 해당 `$TERM` entry가 없는 상황이다.

이때 사람들이 임시로:

```bash
TERM=xterm-256color
```

처럼 바꾸기도 하는 이유가 여기 있다.

다만 실제 capability보다 과장하거나 축소된 TERM을 지정하면 미묘한 렌더링 문제가 생길 수 있으므로 근본적으로는 적절한 terminfo entry를 설치하는 편이 낫다.

## termcap → terminfo → curses

여기까지의 추상화 상승을 정리하면:

```text
1. Escape sequence 직접 사용
Application → ESC[...] → Terminal

2. Capability database
Application → termcap/terminfo → Terminal-specific sequence

3. Screen abstraction
Application → curses → terminfo → Terminal
```

terminfo는 아직 UI 프레임워크가 아니다.

"화면에 버튼을 하나 만들어줘" 같은 추상화를 제공하는 것이 아니라:

> 이 터미널에서 cursor를 움직이려면 어떤 문자열을 써야 하는가?

를 알려주는 **터미널 capability 추상화 계층**이다.

다음 단계인 curses가 이 정보 위에서 화면과 window라는 더 높은 추상화를 만든다.

## 다음 단계 — curses/ncurses

이제 애플리케이션 개발자는 escape sequence와 capability를 직접 다루지 않고 이렇게 말하고 싶어진다.

```text
(10, 20)에 "hello"를 그려라.
이 window를 갱신해라.
키 하나를 읽어라.
```

여기서 curses/ncurses가 등장한다.

즉 추상화가:

```text
Terminal capability
        ↓
Screen / Window abstraction
```

으로 한 단계 더 올라간다.

## 참고

- `terminfo(5)` — terminal capability database
- ncurses `curs_terminfo(3X)` — terminfo capability lookup API
- `infocmp`, `tput` — terminfo를 관찰하고 사용하는 도구
