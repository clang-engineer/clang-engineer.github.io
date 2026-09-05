---
title       : "curses와 ncurses — 터미널 제어가 화면·창 추상화로 올라온 순간"
description : "escape sequence와 terminfo를 직접 다루던 단계에서 curses/ncurses가 화면, 창, refresh, getch 같은 추상화를 제공하며 TUI 개발 방식을 어떻게 바꿨는지 정리한다."
date        : 2026-09-05 14:10:00 +0900
updated     : 2026-09-05 17:57:00 +0900
categories  : [terminal]
tags        : [terminal, curses, ncurses, terminfo, tui, screen, window]
pin         : false
hidden      : false
---

앞 단계까지는 애플리케이션이 터미널에 가까이 붙어 있었다.

```text
애플리케이션
   ↓
escape sequence
   ↓
터미널
```

그리고 터미널마다 차이가 있으니 `termcap`/`terminfo`로 capability를 조회했다.

```text
애플리케이션
   ↓
terminfo
   ↓
터미널별 제어 시퀀스
   ↓
터미널
```

하지만 애플리케이션 개발자 입장에서는 여전히 너무 낮은 수준이다.

개발자가 정말 하고 싶은 말은 보통 이런 것이다.

```text
화면 3행 10열에 문자열을 그려라.
이 영역을 하나의 창(Window)처럼 다뤄라.
키 입력을 하나 받아라.
변경된 화면을 반영해라.
```

이 요구를 받아 **터미널 제어를 화면(Screen)과 창(Window) 수준으로 끌어올린 고전적인 추상화가 curses**다.

## curses가 바꾼 질문

escape sequence를 직접 다루면 개발자의 관심사는 이런 데 있다.

```text
커서를 어떻게 이동하지?
이 터미널에서 clear sequence는 뭐지?
색상 코드는 어떻게 보내지?
```

curses를 쓰면 관심사가 바뀐다.

```text
어느 창의 어느 좌표에 무엇을 그릴까?
입력 이벤트를 어떻게 처리할까?
언제 화면을 refresh할까?
```

즉 추상화 경계가 확실히 위로 올라간다.

## 기본 구조

개념적으로는 다음과 같다.

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

curses는 하위 터미널 capability를 이용하지만, 애플리케이션은 그 세부 문자열을 직접 알 필요가 없다.

## Screen이라는 추상화

curses는 터미널 전체를 하나의 **논리적 화면(Screen)**처럼 다룬다.

예를 들어 C 코드에서는 대략 이런 식의 API를 사용한다.

```c
initscr();
mvaddstr(5, 10, "hello");
refresh();
getch();
endwin();
```

의미만 보면 매우 직관적이다.

```text
initscr()       → curses 화면 초기화
mvaddstr()      → 좌표에 문자열 기록
refresh()       → 실제 터미널에 반영
getch()         → 입력 받기
endwin()        → 터미널 상태 복구
```

개발자가 `ESC[5;10H` 같은 문자열을 직접 조립하지 않는다.

## Window는 GUI 창과 조금 다르다

curses의 `WINDOW`는 데스크톱 GUI의 독립된 OS window라기보다 **터미널 화면의 직사각형 논리 영역**에 가깝다.

```text
터미널 화면(Screen)
┌────────────────────────────┐
│ 헤더 창                    │
├─────────┬──────────────────┤
│ 사이드바 │ 메인 창          │
│         │                  │
│         │                  │
└─────────┴──────────────────┘
```

각 창은 자체 좌표계를 가질 수 있다.

```text
메인 창의 (0,0)
  ↓
실제 화면의 (1,10)부터 시작
```

그러면 프로그램은 전체 터미널 좌표를 매번 계산하지 않고 각 영역을 독립적으로 갱신할 수 있다.

이 아이디어는 현대 TUI의 레이아웃(Layout)·컴포넌트(Component) 개념으로 이어지는 중요한 전조다.

## refresh가 중요한 이유

처음 보면 `mvaddstr()`가 문자열을 적었는데 왜 `refresh()`가 또 필요한지 의문이 든다.

핵심은 curses가 애플리케이션이 원하는 화면 상태와 실제 터미널 상태 사이에 **중간 화면 모델**을 두기 때문이다.

단순화하면:

```text
애플리케이션이 원하는 화면
        ↓
curses 가상 화면(Virtual Screen)
        ↓ 비교
실제 터미널 화면 모델
        ↓
필요한 제어 시퀀스만 출력
```

즉 curses는 "문자열 출력 함수 모음"이 아니라 **화면 상태를 관리하고 차이를 실제 터미널에 반영하는 계층**이다.

## virtual screen과 physical screen

ncurses 내부 개념을 아주 단순화하면 두 상태가 있다.

```text
가상 화면(Virtual Screen)
    = 애플리케이션이 다음에 보여주고 싶은 상태

물리 화면(Physical Screen)
    = curses가 알고 있는 현재 터미널 상태
```

`refresh()` 계열은 둘을 비교해 필요한 변경을 터미널로 보낸다.

예를 들어 화면 한 글자만 바뀌었다면:

```text
전체 화면 clear + 재출력
```

보다:

```text
해당 위치로 커서 이동
→ 한 글자 출력
```

하는 편이 훨씬 효율적이다.

이 **차이 기반 렌더링(Diff-based Rendering)** 개념은 현대 TUI 렌더러에서도 계속 반복된다.

## 여러 window를 효율적으로 갱신하기

여러 창이 있는 프로그램에서 창마다 즉시 실제 터미널을 갱신하면 불필요한 출력이 늘 수 있다.

ncurses는 `wnoutrefresh()`와 `doupdate()` 같은 API로 이를 분리할 수 있다.

개념적으로:

```text
사이드바 변경
   ↓ wnoutrefresh
가상 화면에 반영

메인 영역 변경
   ↓ wnoutrefresh
가상 화면에 반영

마지막
   ↓ doupdate
실제 터미널과 한 번 비교하여 출력
```

즉 현대 UI에서 여러 상태 변경을 모아서 한 번에 렌더링하는 것과 비슷한 생각이 이미 오래전부터 존재했다.

## 입력도 추상화한다

출력뿐 아니라 입력도 curses가 어느 정도 추상화한다.

터미널에서 방향키는 scan code가 아니라 escape sequence 형태의 바이트 스트림으로 들어온다.

```text
위쪽 방향키
   ↓ 터미널 에뮬레이터
ESC [ A
   ↓ PTY
curses 입력 파서
   ↓
KEY_UP
```

애플리케이션은 raw byte sequence 대신 `KEY_UP` 같은 논리적 키 값으로 처리할 수 있다.

```c
int ch = getch();
if (ch == KEY_UP) {
    ...
}
```

즉 curses는:

```text
출력 제어 시퀀스 → 화면·창 API
입력 escape sequence → 논리적 키 API
```

양쪽 모두를 한 단계 올려준다.

## termios도 curses가 관리한다

전체 화면 TUI는 보통 canonical input만으로 만들기 어렵다.

그래서 curses는 초기화 과정에서 터미널 모드를 설정하고, 종료하면서 복구하는 기능도 제공한다.

예를 들어:

```text
cbreak()
raw()
noecho()
keypad()
```

같은 설정을 통해 입력 모드를 조정한다.

여기서 앞에서 본 `termios`가 다시 연결된다.

```text
curses API
   ↓
termios 설정
   ↓
PTY/TTY 드라이버
```

즉 curses는 이전 글들의 기술을 없앤 것이 아니라 **그 위에 더 편한 인터페이스를 얹은 것**이다.

## ncurses는 무엇인가

`curses`는 역사적으로 여러 Unix 계열에 구현이 존재했고, 오늘날 Linux/Unix 계열에서 가장 흔히 만나는 구현 중 하나가 **ncurses**다.

ncurses는 curses API 계열을 구현하면서 terminfo와 연동하고, color, menu, form, panel 등 여러 기능을 제공한다.

그래서 현대 Linux에서 "curses 기반 TUI"라고 이야기할 때 실제 라이브러리는 ncurses인 경우가 많다.

## vi와 curses의 관계를 단순화하면 안 된다

여기서 역사적으로 주의할 점이 있다.

초기 `vi`가 "ncurses로 만들어졌다"고 말하면 틀리다.

vi의 역사는 ncurses보다 오래됐고, 초기 구현은 당시의 터미널 capability 계층인 termcap 등을 활용해 자체 화면 처리를 했다.

따라서 흐름은 이런 식으로 이해하는 편이 낫다.

```text
초기 화면 편집기(Screen Editor)
  ├─ termcap 등을 활용한 자체 화면 처리 (vi 등)
  │
  └─ curses라는 범용 화면 추상화의 발전
         ↓
      여러 TUI 앱
```

즉 모든 오래된 TUI가 curses 위에 있었던 것은 아니다.

이 패턴은 현대에도 반복된다.

`fzf`, Neovim, btop처럼 범용 TUI 프레임워크보다 자체 렌더링 계층을 선택하는 프로그램이 존재한다.

## curses가 제공한 추상화의 본질

지금까지를 한 줄씩 올려보면:

```text
Escape Sequence
"ESC[2J를 출력한다"

        ↓

terminfo
"현재 터미널의 clear capability를 가져온다"

        ↓

curses
"화면을 지우고 창을 다시 그린다"
```

관심사가 **터미널 명령 → 터미널 capability → UI 화면 상태**로 올라왔다.

이것이 현대 TUI 프레임워크로 가는 중요한 역사적 단계다.

## 그런데 curses도 아직 저수준이다

curses는 강력하지만 현대 GUI/Web 개발자가 기대하는 다음 개념까지 모두 제공하는 것은 아니다.

```text
컴포넌트 트리(Component Tree)
반응형 상태(Reactive State)
flex 레이아웃
메시지·갱신 구조(Message/Update Architecture)
비동기 작업 통합
CSS형 스타일링
```

따라서 프로그램이 커지면 개발자는 curses 위에 다시 자체 UI 구조를 만든다.

```text
애플리케이션 전용 컴포넌트 시스템
        ↓
curses
        ↓
terminfo
        ↓
터미널
```

이 반복되는 추상화가 결국 Bubble Tea, Ratatui, Textual, OpenTUI 같은 현대 프레임워크의 배경이 된다.

## 다음 단계 — TUI 엔진

현대 프레임워크 이름부터 보기 전에 한 단계가 더 필요하다.

어떤 언어와 라이브러리를 쓰든 대화형 TUI에는 공통된 구조가 있다.

```text
입력(Input)
  ↓
이벤트 루프(Event Loop)
  ↓
상태(State)
  ↓
레이아웃(Layout)
  ↓
렌더링(Render)
  ↓
터미널
```

다음에는 이 **TUI 엔진의 공통 구조**를 분해한다.

그걸 이해하면 Bubble Tea의 `Model/Update/View`, Ratatui의 frame rendering, OpenTUI의 component renderer가 서로 완전히 다른 것이 아니라 같은 문제를 서로 다른 추상화로 푼다는 것이 보인다.

## 참고

- ncurses manual — curses screen handling과 terminal I/O
- `terminfo(5)` — curses가 사용하는 terminal capability database
- ncurses refresh 계열 API — virtual/physical screen 갱신
