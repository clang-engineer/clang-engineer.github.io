---
title       : "curses와 ncurses — 터미널 제어가 화면·창 추상화로 올라온 순간"
description : "escape sequence와 terminfo를 직접 다루던 단계에서 curses/ncurses가 화면, 창, refresh, getch 같은 추상화를 제공하며 TUI 개발 방식을 어떻게 바꿨는지 정리한다."
date        : 2026-09-05 14:10:00 +0900
updated     : 2026-09-13 18:15:00 +0900
categories  : [terminal]
tags        : [terminal, curses, ncurses, terminfo, tui, screen, window]
pin         : false
hidden      : false
---

앞 단계까지는 애플리케이션이 터미널에 꽤 가까이 붙어 있었다.

```text
애플리케이션
  ↓
제어 시퀀스 직접 사용
  ↓
터미널
```

그리고 터미널마다 차이가 있으니 `TERM`과 `terminfo`를 이용해 capability를 조회했다.

하지만 개발자 입장에서는 여전히 너무 낮은 수준이다.

> **커서 이동 시퀀스를 직접 다루지 말고, 화면과 창 단위로 UI를 다룰 수 없을까?**

이 요구에 답한 고전적인 추상화가 **curses**다.

핵심 역할부터 보면 세 가지다.

```text
Screen
= 터미널 전체를 하나의 논리적 화면으로 다룸

Window
= 화면의 일부 영역을 별도 좌표계로 다룸

refresh
= 애플리케이션이 원하는 화면 상태를 실제 터미널에 반영
```

즉 curses는 **터미널 제어를 "어떤 시퀀스를 보낼까"에서 "어떤 화면 상태를 만들까"로 끌어올린 계층**이다.

## 전체 구조

```text
애플리케이션
  ↓
curses / ncurses
  ↓
terminfo
  ↓
termios + 터미널 제어 시퀀스
  ↓
터미널
```

curses는 앞에서 본 기술을 없애는 것이 아니라 그 위에 더 높은 인터페이스를 제공한다.

애플리케이션은 `ESC[5;10H` 같은 문자열을 직접 조립하지 않고 다음처럼 사용할 수 있다.

```c
initscr();
mvaddstr(5, 10, "hello");
refresh();
getch();
endwin();
```

대략적인 의미는 다음과 같다.

```text
initscr()  → 화면 초기화
mvaddstr() → 원하는 위치에 문자열 기록
refresh()  → 실제 터미널에 반영
getch()    → 입력 받기
endwin()   → 터미널 상태 복구
```

## Screen — 터미널 전체를 논리적 화면으로 본다

curses는 터미널 전체를 하나의 **논리적 화면(Screen)**처럼 다룬다.

개발자는 터미널 제어 시퀀스를 직접 계산하기보다 화면의 어느 위치에 무엇을 보여줄지 생각한다.

```text
"커서를 5행 10열로 옮겨라"
        ↓
"화면 5행 10열에 hello를 보여줘"
```

관심사가 터미널 명령에서 화면 상태로 올라간 것이다.

## Window — 화면을 논리적인 영역으로 나눈다

curses의 `WINDOW`는 GUI의 독립된 OS 창이라기보다 **터미널 화면의 직사각형 논리 영역**에 가깝다.

```text
터미널 화면
┌────────────────────────────┐
│ 헤더                       │
├─────────┬──────────────────┤
│ 사이드바 │ 메인             │
│         │                  │
└─────────┴──────────────────┘
```

각 Window는 자기 좌표계를 가질 수 있다.

그래서 애플리케이션은 전체 화면 좌표를 매번 계산하지 않고 각 영역을 따로 다룰 수 있다.

이 개념은 이후 TUI의 Layout·Component 사고방식으로 이어진다.

## refresh — 원하는 화면과 실제 화면 사이를 연결한다

`mvaddstr()`로 문자열을 지정했는데 왜 `refresh()`가 또 필요할까?

핵심은 curses가 **애플리케이션이 원하는 화면 상태**와 **현재 실제 터미널 상태** 사이에 중간 모델을 두기 때문이다.

```text
애플리케이션이 원하는 화면
        ↓
curses 내부 화면 모델
        ↓ 비교
현재 터미널 상태
        ↓
필요한 제어 시퀀스만 출력
```

즉 curses는 단순 출력 함수 모음이 아니라 **화면 상태를 관리하고 실제 터미널에 반영하는 계층**이다.

이게 `refresh()`의 핵심 의미다.

## 입력도 한 단계 올려준다

터미널에서 방향키 같은 입력은 여러 바이트의 escape sequence일 수 있다.

```text
위쪽 방향키
  ↓
ESC [ A
  ↓
curses 입력 처리
  ↓
KEY_UP
```

애플리케이션은 원시 바이트를 직접 파싱하는 대신 논리적인 키 값으로 받을 수 있다.

```c
int ch = getch();
if (ch == KEY_UP) {
    ...
}
```

즉 curses는 양쪽을 모두 한 단계 올린다.

```text
출력 제어 시퀀스 → Screen / Window API
입력 바이트 시퀀스 → 논리적 키 API
```

## termios도 아래에서 다시 연결된다

전체 화면 TUI는 보통 canonical 입력만으로 만들기 어렵다.

그래서 curses는 `raw()`, `cbreak()`, `noecho()` 같은 API를 통해 터미널 입력 모드도 조정할 수 있다.

```text
curses API
  ↓
termios 설정 변경
  ↓
PTY / TTY 터미널 드라이버
```

즉 앞에서 본 `termios`가 여기에서도 실제 기반으로 사용된다.

## ncurses는 무엇인가

`curses`는 화면·창 중심의 터미널 UI API 계열이고, **ncurses는 오늘날 Unix/Linux 계열에서 널리 사용되는 대표적인 구현**이라고 보면 된다.

ncurses는 curses API를 구현하면서 terminfo와 연동하고 color, menu, form, panel 같은 기능도 제공한다.

처음 학습할 때는 `curses`와 `ncurses`를 완전히 별개의 개념으로 외우기보다:

```text
curses
= API / 추상화 계열

ncurses
= 널리 쓰이는 구현
```

으로 구분하면 충분하다.

## 실제 예 — 왜 curses가 편한가

직접 제어 시퀀스를 사용하면 개발자는 이런 것을 신경 써야 한다.

```text
커서를 어디로 옮길까?
어떤 clear 시퀀스를 쓸까?
현재 터미널에서 이 기능을 지원할까?
```

curses를 사용하면 질문이 바뀐다.

```text
어느 Window에 무엇을 보여줄까?
어떤 키 입력을 처리할까?
언제 화면을 refresh할까?
```

이 변화가 curses의 본질이다.

## 여기부터는 심화 — curses가 화면을 효율적으로 갱신하는 방법

여기까지 이해했다면 curses의 핵심 모델은 잡은 것이다.

```text
Screen
Window
refresh
입력 추상화
```

아래는 그 화면 상태를 내부에서 어떻게 관리하는지에 대한 세부 내용이다.

### 가상 화면과 현재 화면

ncurses 내부 개념을 단순화하면 다음 두 상태를 생각할 수 있다.

```text
가상 화면
= 애플리케이션이 다음에 보여주고 싶은 상태

현재 화면 모델
= curses가 알고 있는 실제 터미널 상태
```

`refresh()` 계열은 둘을 비교해 필요한 변경만 터미널에 보낸다.

```text
전체 화면 지우기 + 재출력
```

보다:

```text
변경된 위치로 커서 이동
→ 바뀐 문자만 출력
```

하는 편이 효율적이다.

이 **차이 기반 렌더링**은 현대 TUI 렌더러에서도 반복되는 아이디어다.

### 여러 Window를 한 번에 갱신하기

ncurses는 `wnoutrefresh()`와 `doupdate()` 같은 API로 여러 Window의 변경을 모은 뒤 실제 터미널 갱신을 한 번에 수행할 수 있다.

```text
사이드바 변경
  ↓
가상 화면 반영

메인 영역 변경
  ↓
가상 화면 반영

마지막
  ↓
실제 터미널 갱신
```

처음 학습할 때 API 이름 자체를 외울 필요는 없다. **여러 UI 변경을 내부 화면에 먼저 모으고 실제 출력은 나중에 최적화할 수 있다**는 점이 핵심이다.

## vi와 curses의 관계를 단순화하면 안 된다

초기 `vi`가 ncurses 위에서 만들어졌다고 보면 안 된다.

vi는 ncurses보다 오래됐고, 초기 구현은 termcap 같은 터미널 capability 계층을 활용해 자체 화면 처리를 했다.

```text
초기 화면 편집기
  ├─ termcap 등을 이용한 자체 화면 처리
  └─ curses 같은 범용 화면 추상화의 발전
```

즉 모든 오래된 TUI가 curses 위에 있었던 것은 아니다.

현대에도 `fzf`, Neovim, btop처럼 범용 프레임워크 대신 자체 렌더링 계층을 가진 프로그램이 있다.

## curses가 제공한 추상화의 위치

지금까지를 한 줄로 연결하면:

```text
ANSI / VT
"어떤 제어 시퀀스를 보낼까?"

        ↓

TERM / terminfo
"현재 터미널에서는 어떤 시퀀스를 써야 할까?"

        ↓

curses
"어떤 화면과 Window를 보여줄까?"
```

즉 관심사가 **터미널 명령 → 터미널 capability → UI 화면 상태**로 올라왔다.

## 그런데 curses도 아직 애플리케이션 구조까지는 책임지지 않는다

curses가 Screen·Window·입력을 추상화해도 다음 같은 고수준 애플리케이션 구조까지 자동으로 만들어주는 것은 아니다.

```text
애플리케이션 상태
이벤트 루프
컴포넌트 구조
레이아웃 정책
비동기 작업 통합
```

그래서 복잡한 TUI에서는 curses 위에 다시 자체 애플리케이션 구조를 만들거나, 더 높은 수준의 현대 TUI 프레임워크를 사용한다.

## 다음 단계 — TUI 엔진

다음에는 어떤 TUI 프레임워크를 쓰더라도 반복해서 등장하는 공통 구조를 본다.

```text
입력
  ↓
이벤트 루프
  ↓
상태
  ↓
레이아웃
  ↓
렌더링
  ↓
터미널
```

이 구조를 먼저 알면 Bubble Tea, Ratatui, Textual, OpenTUI의 차이도 훨씬 쉽게 비교할 수 있다.

## 참고

- ncurses manual — curses screen handling과 terminal I/O
- `terminfo(5)` — curses가 사용하는 terminal capability database
- ncurses refresh 계열 API — virtual/physical screen 갱신
