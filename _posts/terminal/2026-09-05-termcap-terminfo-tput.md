---
title       : "termcap과 terminfo — 터미널 인터페이스 차이를 어떻게 숨겼나"
description : "ANSI/VT와 TERM, termcap, terminfo, tput의 관계를 통해 터미널 capability database가 왜 필요한지 핵심 구조부터 정리한다."
date        : 2026-09-05 13:50:00 +0900
updated     : 2026-09-13 19:35:00 +0900
categories  : [terminal]
tags        : [terminal, termcap, terminfo, tput, term, ncurses, capability]
pin         : false
hidden      : false
---

앞에서는 애플리케이션이 ANSI/VT 계열 제어 시퀀스를 출력하고, **터미널 에뮬레이터**가 이를 해석해 화면을 바꾼다는 구조를 봤다.

그러면 다음 의문이 생긴다.

> **ANSI/VT라는 공통 문법이 있는데 왜 TERM과 terminfo가 또 필요한가?**

이 질문이 이 문서의 핵심이다.

## 먼저 구분할 것 — 에뮬레이터와 터미널 정의

```text
터미널 에뮬레이터
= Ghostty, WezTerm, Kitty처럼
  실제 바이트를 해석하고 화면을 그리는 프로그램

터미널 인터페이스 / 터미널 정의
= 애플리케이션이 상대한다고 가정하는
  기능과 제어 시퀀스의 논리적 계약
```

`TERM`과 `terminfo`는 주로 두 번째인 **터미널 인터페이스/정의**를 다룬다.

## 핵심 관계

```text
ANSI / VT
= 터미널 에뮬레이터에 실제로 보내는 제어 명령 문법

TERM
= 어떤 터미널 정의를 사용할지 고르는 키

terminfo
= 그 정의의 capability와 제어 시퀀스 정보

tput
= 그 정보를 꺼내 쓰는 명령어
```

`terminfo`가 ANSI/VT를 대신하는 것은 아니다.

최종적으로 터미널 에뮬레이터에 도착하는 것은 여전히 문자와 제어 시퀀스다.

```text
애플리케이션
  ↓
필요한 제어 시퀀스 선택
  ↓ stdout / PTY
터미널 에뮬레이터
  ↓
해석해서 화면 반영
```

`terminfo`는 그 앞에서 **현재 상대하는 터미널 인터페이스에 어떤 기능이 있고, 그 기능을 어떤 시퀀스로 호출할지 알려주는 호환성 정보**다.

## 왜 ANSI/VT만으로 끝나지 않는가

이상적으로는 모든 프로그램이 하나의 공통 문법만 출력하고 모든 터미널 에뮬레이터가 똑같이 처리하면 가장 단순하다.

실제로 ANSI/VT 계열은 큰 공통 기반을 제공한다.

하지만 현실에서는 터미널 인터페이스마다 다음 차이가 남을 수 있다.

```text
지원 기능 범위
색상 수
특수키 시퀀스
확장 기능
오래된 호환성 차이
```

그래서 애플리케이션이 알고 싶은 것은 에뮬레이터 제품명보다 이런 **기능(capability)**이다.

```text
커서 이동이 가능한가?
화면을 지우려면 어떤 시퀀스를 쓰는가?
색상을 몇 개 지원하는가?
대체 화면을 지원하는가?
```

이 정보를 코드 밖으로 분리해 둔 것이 termcap/terminfo 계열이다.

## TERM과 terminfo는 어떻게 연결되는가

예를 들어:

```bash
echo "$TERM"
```

결과가 다음과 같다고 하자.

```text
tmux-256color
```

그러면 개념적으로:

```text
TERM=tmux-256color
  ↓
terminfo에서 tmux-256color entry 선택
  ↓
capability 정보 확인
  ↓
필요한 제어 시퀀스 선택
```

이 된다.

즉:

```text
TERM
= 어떤 entry를 볼지 선택

terminfo
= 그 entry의 기능과 시퀀스를 저장
```

이다.

## tput — terminfo를 직접 써보는 도구

직접 제어 시퀀스를 출력하면:

```bash
printf '\e[2J'
```

내가 특정 시퀀스를 하드코딩한 것이다.

반면:

```bash
tput clear
```

은 현재 `TERM`에 맞는 `clear` capability를 terminfo에서 찾아 그 시퀀스를 출력한다.

```text
printf '\e[2J'
= 제어 시퀀스를 직접 선택

tput clear
= TERM / terminfo를 통해 선택
```

커서 이동이나 색상도 같은 식으로 사용할 수 있다.

```bash
tput cup 5 10
tput bold
tput colors
```

## 애플리케이션이 항상 terminfo를 거치는 것은 아니다

이 점이 중요하다.

```text
방법 1
앱이 ANSI/VT 계열 시퀀스를 직접 출력

방법 2
TERM / terminfo를 참고해 적절한 시퀀스를 선택

방법 3
curses나 TUI 라이브러리에 맡김
```

즉 terminfo는 **필수 통로가 아니라 호환성 정보 계층**이다.

한 줄로 정리하면:

> **ANSI/VT는 실제 제어 언어이고, terminfo는 필요할 때 현재 터미널 인터페이스에 맞는 사용법을 고르는 데 도움을 준다.**

## 여기까지가 핵심

처음 읽을 때는 다음만 기억하면 충분하다.

```text
ANSI/VT
= 실제 제어 문법

TERM
= 어떤 터미널 정의를 쓸지 선택

terminfo
= 그 정의의 capability와 제어 시퀀스 정보

tput
= 그 정보를 꺼내 쓰는 도구
```

그리고 최종 출력은 항상 다음 방향으로 간다.

```text
애플리케이션
→ 제어 시퀀스
→ PTY
→ 터미널 에뮬레이터
```

아래 내용은 이 구조를 이해한 뒤 보면 되는 연결·심화 내용이다.

## 심화 — Vim 같은 앱을 예로 보면

개념적으로는 다음처럼 생각할 수 있다.

```text
Vim 시작
  ↓
TERM 확인
  ↓
capability 정보 확인
  ↓
필요한 제어 시퀀스 선택
  ↓
stdout 출력
  ↓
터미널 에뮬레이터가 해석
```

다만 현대 Vim/Neovim이 모든 터미널 처리를 반드시 terminfo 하나만으로 결정한다고 단순화하면 안 된다. 자체 처리나 확장 지원을 함께 사용할 수 있다.

## 심화 — termcap은 무엇인가

`termcap`은 초기 Unix/BSD 환경에서 널리 사용된 capability 데이터베이스 형식이다.

핵심 아이디어는 terminfo와 같다.

```text
터미널 종류
+ capability 이름
+ capability 값
```

을 코드 밖의 데이터로 관리한다.

처음에는 **termcap → terminfo로 표현 방식이 발전했다**는 정도만 잡으면 충분하다.

## 심화 — infocmp

현재 `TERM`의 terminfo entry를 직접 보고 싶다면 `infocmp`를 사용할 수 있다.

```bash
infocmp
```

또는:

```bash
infocmp xterm-256color
```

역할은 다음처럼 구분된다.

```text
TERM     = 어떤 entry를 볼지 선택
terminfo = capability 데이터 저장
infocmp  = 그 데이터를 보여줌
tput     = 그 데이터를 이용해 기능을 사용
```

## 심화 — 새로운 터미널 에뮬레이터가 나오면

새로운 터미널 에뮬레이터가 나와도 기존 ANSI/VT·xterm 계열과 충분히 호환된다면 기존 TERM/terminfo 정의를 사용할 수 있다.

반대로 기능이나 동작 차이가 크다면 전용 TERM/terminfo entry가 필요할 수 있다.

중요한 점은 terminfo가 **에뮬레이터마다 완전히 다른 언어를 저장하는 곳은 아니라는 것**이다.

공통 터미널 문법 위에서 각 터미널 인터페이스의 capability 차이를 기술한다.

## 심화 — tmux와 TERM

```text
Ghostty               ← 실제 터미널 에뮬레이터
  ↑
tmux                  ← 안쪽에 별도 터미널 인터페이스 제공
  ↑
Neovim                ← 그 인터페이스를 상대하는 앱
```

Neovim이 tmux 안에서 실행되면 Ghostty를 직접 상대하지 않고 tmux가 제공하는 터미널 인터페이스를 상대한다.

그래서 안쪽에서는 `TERM=tmux-256color`나 `screen-256color`처럼 다른 값이 보일 수 있다.

## 심화 — SSH와 TERM

SSH에서 PTY를 할당하면 원격 애플리케이션도 어떤 터미널 인터페이스를 기대해야 하는지 알아야 한다.

```text
로컬 터미널 에뮬레이터
  ↓
SSH 클라이언트
  ↓ TERM + 바이트 스트림
SSH 서버
  ↓
원격 PTY
  ↓
원격 애플리케이션
```

원격 시스템에 해당 TERM의 terminfo entry가 없으면 `unknown terminal type` 같은 문제가 생길 수 있다.

## 다음 단계 — curses

여기까지의 추상화는 다음처럼 올라간다.

```text
제어 시퀀스 직접 사용
애플리케이션 → ANSI/VT → 터미널 에뮬레이터

        ↓

터미널 인터페이스 차이 추상화
애플리케이션 → TERM / terminfo → 제어 시퀀스 → 터미널 에뮬레이터

        ↓

화면 추상화
애플리케이션 → curses → terminfo → 터미널 에뮬레이터
```

terminfo는 UI 프레임워크가 아니다.

> **현재 상대하는 터미널 인터페이스에서 이 기능을 어떤 시퀀스로 호출할까?**

에 답하는 계층이다.

다음 단계인 curses는 이 위에서 Screen, Window, 입력 처리 같은 더 높은 UI 추상화를 제공한다.

## 참고

- `terminfo(5)` — terminal capability database
- ncurses `curs_terminfo(3X)` — terminfo capability lookup API
- `infocmp`, `tput` — terminfo를 관찰하고 사용하는 도구
