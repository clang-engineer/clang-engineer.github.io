---
title       : "termcap과 terminfo — 터미널 인터페이스 차이를 어떻게 숨겼나"
description : "ANSI/VT와 TERM, termcap, terminfo, tput의 관계를 통해 터미널 capability database가 왜 필요했고 curses와 현대 TUI의 호환성 계층에 어떻게 연결되는지 정리한다."
date        : 2026-09-05 13:50:00 +0900
updated     : 2026-09-13 19:25:00 +0900
categories  : [terminal]
tags        : [terminal, termcap, terminfo, tput, term, ncurses, capability]
pin         : false
hidden      : false
---

앞에서는 애플리케이션이 표준 출력으로 ANSI/VT 계열 제어 시퀀스를 보내고, **터미널 에뮬레이터**가 이를 해석해 화면을 바꾼다는 구조를 봤다.

그러면 자연스럽게 이런 의문이 생긴다.

> **ANSI/VT라는 공통 문법이 있는데 왜 terminfo 같은 것이 또 필요한가?**

이 질문이 이 문서의 출발점이다.

먼저 이 문서에서 말하는 두 대상을 구분하자.

```text
터미널 에뮬레이터
= Ghostty, WezTerm, Kitty처럼
  실제 바이트 스트림을 해석하고 화면을 그리는 프로그램

터미널 인터페이스 / 터미널 정의
= 애플리케이션이 상대한다고 가정하는
  기능과 제어 시퀀스의 논리적 계약
```

`TERM`과 `terminfo`가 직접 다루는 것은 주로 두 번째인 **터미널 인터페이스/정의**다.

## 먼저 결론 — ANSI/VT와 terminfo는 역할이 다르다

```text
ANSI / VT
= 터미널 에뮬레이터에 실제로 보내는 제어 명령 문법

TERM
= 현재 어떤 터미널 정의를 사용할지 가리키는 이름

terminfo
= 그 터미널 인터페이스가 어떤 기능을 제공하고,
  그 기능을 어떤 제어 시퀀스로 호출하는지 저장한 정보

tput
= TERM과 terminfo를 이용해 필요한 capability를 꺼내 쓰는 명령어
```

즉 `terminfo`가 ANSI/VT를 대신하는 것이 아니다.

실제로 터미널 에뮬레이터에 도착하는 것은 여전히 문자와 제어 시퀀스다.

```text
애플리케이션
  ↓
필요한 제어 시퀀스 선택
  ↓ stdout / PTY
터미널 에뮬레이터
  ↓
해석해서 화면 반영
```

`terminfo`는 그 앞에서 **현재 애플리케이션이 상대하는 터미널 인터페이스에 어떤 시퀀스를 써야 하는지 선택하는 데 도움을 주는 호환성 정보**라고 보면 된다.

## 그럼 그냥 ANSI/VT를 직접 쓰면 안 되나?

가능하다.

예를 들어 간단한 프로그램이나 셸 스크립트는 다음처럼 제어 시퀀스를 직접 출력할 수 있다.

```bash
printf '\e[31mRED\e[0m\n'
```

이 경우 흐름은 단순하다.

```text
애플리케이션
→ ANSI/VT 계열 제어 시퀀스 직접 출력
→ 터미널 에뮬레이터
```

하지만 현실의 터미널 생태계에서는 모든 터미널 인터페이스가 모든 기능과 확장을 완전히 동일하게 제공하는 것은 아니다.

```text
공통 ANSI/VT 계열 문법은 존재
        ↓
하지만 터미널 인터페이스마다
- 지원 기능 범위
- 색상 수
- 특수키 시퀀스
- 대체 화면 동작
- private extension
- 오래된 호환성
등에서 차이가 남을 수 있음
```

그래서 호환성을 중요하게 생각하는 프로그램은 **현재 상대하는 터미널 인터페이스가 무엇을 제공하는지 확인한 뒤 적절한 시퀀스를 선택**할 수 있다.

이 역할을 돕는 전통적인 Unix 계층이 `TERM`과 `terminfo`다.

## 애플리케이션이 항상 terminfo를 거치는 것은 아니다

이 점이 중요하다.

터미널 앱이 화면을 제어하는 방법은 하나로 고정되어 있지 않다.

```text
1. ANSI/VT 계열 시퀀스를 직접 출력

2. TERM / terminfo에서 capability를 조회한 뒤
   적절한 시퀀스를 출력

3. curses나 TUI 라이브러리에 맡김
   → 라이브러리가 하위 터미널 제어를 처리
```

즉 `terminfo`는 반드시 거쳐야 하는 필수 통로가 아니다.

> **ANSI/VT는 실제 제어 언어이고, terminfo는 필요할 때 현재 터미널 인터페이스에 맞는 사용법을 선택하도록 돕는 정보 계층이다.**

## Vim 같은 앱을 예로 보면

개념적으로 Vim 같은 전체 화면 앱은 다음과 같은 판단을 할 수 있다.

```text
Vim 시작
  ↓
현재 TERM 확인
  ↓
현재 터미널 인터페이스의 capability 정보 확인
  ↓
"커서 이동", "화면 지우기", "색상 변경" 등에
쓸 제어 시퀀스 선택
  ↓
stdout으로 출력
  ↓
터미널 에뮬레이터가 해석
```

중요한 것은 Vim이 매번 다음처럼 실제 에뮬레이터 제품명을 직접 분기하는 구조가 아니라는 점이다.

```text
Ghostty면 이것
WezTerm이면 저것
Kitty면 이것
```

애플리케이션이 정말 알고 싶은 것은 제품명이 아니라 **기능(capability)**이다.

다만 현대 Vim/Neovim 같은 프로그램이 모든 터미널 동작을 반드시 `terminfo` 하나만 통해 결정한다고 단순화하면 안 된다. 프로그램이나 라이브러리에 따라 자체 터미널 처리나 확장 지원을 함께 사용할 수 있다.

여기서는 `terminfo`의 역할을 이해하기 위한 기본 모델로 보면 된다.

## Capability — 애플리케이션이 정말 알고 싶은 것

애플리케이션이 알고 싶은 것은 보통 터미널 에뮬레이터 제품명 자체가 아니다.

```text
커서를 임의 위치로 이동할 수 있는가?
화면을 지우는 시퀀스는 무엇인가?
색상을 몇 개 지원하는가?
대체 화면을 지원하는가?
특수키는 어떤 바이트 시퀀스로 들어오는가?
```

이런 **터미널 인터페이스의 기능**을 capability라고 한다.

그래서 구현 차이를 코드 분기로 넣기보다 capability 정보를 데이터로 분리할 수 있다.

```c
if (terminal_type == VT100) {
    ...
} else if (terminal_type == ADM3A) {
    ...
}
```

같은 식으로 프로그램마다 터미널 종류별 분기를 쌓지 않아도 되는 것이다.

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

`TERM`은 단순한 에뮬레이터 브랜드명이 아니라 **어떤 터미널 인터페이스 정의를 사용할지 선택하는 키**에 가깝다.

```text
$TERM=tmux-256color
       ↓
terminfo에서 tmux-256color entry 검색
       ↓
이 터미널 인터페이스가 제공한다고 가정할 capability 집합
```

그래서 `TERM`을 임의로 바꾸면 안 된다. 실제로 제공되는 인터페이스보다 많은 기능을 지원한다고 선언하면 잘못된 시퀀스를 보낼 수 있고, 반대로 너무 보수적인 값을 쓰면 사용할 수 있는 기능도 못 쓰게 된다.

## terminfo — 터미널 인터페이스 capability를 저장한 데이터베이스

`terminfo`는 다음 질문에 답한다.

> **이 TERM 정의가 어떤 기능을 제공하고, 그 기능을 실제로 어떻게 호출하는가?**

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

이전 글에서 직접 `ESC[2J` 같은 문자열을 보냈다면, 여기서는 **"clear라는 기능이 필요하다"고 요청하고 현재 TERM 정의에 맞는 문자열을 찾는다.**

## termcap — 같은 문제를 먼저 풀었던 형식

`termcap`은 초기 Unix/BSD 환경에서 널리 사용된 터미널 capability 데이터베이스 형식이다.

핵심 아이디어는 terminfo와 같다.

```text
터미널 종류 이름
+ capability 이름
+ capability 값
```

을 코드 밖의 데이터로 관리한다.

`terminfo`는 이 문제를 더 구조적인 형태로 다루는 후속 계열이라고 보면 된다.

처음 읽을 때는 **termcap과 terminfo의 세부 형식 차이보다 "터미널 인터페이스 차이를 데이터로 분리했다"는 점**이 더 중요하다.

## tput — terminfo를 직접 써보는 도구

`tput`은 현재 `TERM`과 terminfo를 이용해 capability를 조회하거나 해당 제어 문자열을 출력한다.

예를 들어:

```bash
tput clear
```

은 현재 TERM 정의에 맞는 화면 지우기 capability를 사용한다.

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
= 현재 TERM 정의에 맞는 clear capability를 terminfo에서 찾음
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
= 어떤 터미널 정의 entry를 쓸지 선택

terminfo
= 그 정의의 capability 데이터 저장

infocmp
= 그 데이터를 읽어서 보여줌

tput
= 그 데이터를 이용해 capability를 사용
```

## 새로운 터미널 에뮬레이터가 나오면?

새로운 터미널 에뮬레이터가 나왔다고 해서 항상 새로운 문법이 생기는 것은 아니다.

대부분은 기존 ANSI/VT·xterm 계열 관습과 호환되도록 구현된다.

```text
새 터미널 에뮬레이터
  ↓
기존 터미널 인터페이스 정의와 충분히 호환
  → 기존 TERM / terminfo entry 사용 가능

기능이나 동작 차이가 큼
  → 전용 TERM / terminfo entry가 필요할 수 있음
```

즉 terminfo는 **에뮬레이터마다 완전히 다른 언어를 저장하는 곳**이 아니다.

공통 터미널 문법 위에서 **애플리케이션이 상대한다고 가정하는 터미널 인터페이스**가 어떤 기능을 제공하고, 그 기능을 어떤 시퀀스로 호출해야 하는지를 기술하는 호환성 정보에 가깝다.

## 실제 예 — tmux 안에서 TERM이 바뀌는 이유

이 구조는 tmux에서 특히 잘 보인다.

```text
Ghostty                         ← 실제 터미널 에뮬레이터
  ↑
tmux                            ← 안쪽에 별도 터미널 인터페이스 제공
  ↑
Neovim                          ← 그 인터페이스를 상대하는 앱
```

Neovim이 tmux 안에서 실행되면 Ghostty와 직접 대화하는 것이 아니라 **tmux가 제공하는 터미널 인터페이스**를 상대한다.

그래서 안쪽의 `TERM`이 `tmux-256color`나 `screen-256color`처럼 달라질 수 있다.

```text
바깥쪽 터미널 에뮬레이터
  ↓
tmux가 바깥쪽 제어를 해석·재표현
  ↓
안쪽 프로그램에는 tmux 터미널 인터페이스 제공
  ↓
TERM=tmux-256color 등
```

즉 `TERM`은 단순 환경변수 장난이 아니라 **지금 애플리케이션이 어느 터미널 인터페이스를 상대하고 있는지 나타내는 계약의 이름**이다.

## SSH에서도 TERM이 중요한 이유

SSH에서 PTY를 할당하면 원격 셸이나 TUI도 어떤 터미널 인터페이스를 기대해야 하는지 알아야 한다.

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

그래서 최신 터미널 에뮬레이터를 오래된 서버에서 사용할 때 terminfo entry가 중요한 문제가 될 수 있다.

## 여기까지가 핵심

처음 읽을 때는 다음 관계만 기억하면 충분하다.

```text
터미널 에뮬레이터
= 실제 바이트를 해석하고 화면을 그리는 프로그램

ANSI/VT
= 에뮬레이터에 보내는 실제 터미널 제어 문법

TERM
= 애플리케이션이 어떤 터미널 인터페이스 정의를 쓸지 선택

terminfo
= 그 정의의 capability와 제어 시퀀스 정보

tput
= 그 정보를 꺼내 쓰는 도구
```

그리고 애플리케이션은 항상 terminfo를 거치는 것이 아니다.

```text
직접 ANSI/VT 출력
또는
terminfo를 참고해 출력
또는
curses/TUI 라이브러리에 맡김
```

## 여기부터는 연결 — curses로 한 단계 더 올라가기

지금까지의 추상화 상승은 다음과 같다.

```text
제어 시퀀스 직접 사용
애플리케이션 → ESC[...] → 터미널 에뮬레이터

        ↓

터미널 인터페이스 차이 추상화
애플리케이션 → TERM / terminfo → 적절한 제어 시퀀스 → 터미널 에뮬레이터

        ↓

화면 추상화
애플리케이션 → curses → terminfo → 터미널 에뮬레이터
```

terminfo는 UI 프레임워크가 아니다.

> **"현재 상대하는 터미널 인터페이스에서 이 기능을 사용하려면 어떤 시퀀스를 써야 하는가?"**

에 답하는 계층이다.

다음 단계인 curses는 이 위에서 화면(Screen)과 창(Window)을 직접 다루는 더 높은 추상화를 제공한다.

## 참고

- `terminfo(5)` — terminal capability database
- ncurses `curs_terminfo(3X)` — terminfo capability lookup API
- `infocmp`, `tput` — terminfo를 관찰하고 사용하는 도구
