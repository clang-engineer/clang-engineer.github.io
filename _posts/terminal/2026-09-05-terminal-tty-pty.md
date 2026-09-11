---
title       : "터미널은 무엇인가 — TTY에서 PTY까지"
description : "물리 터미널에서 터미널 에뮬레이터와 PTY로 이어지는 구조를 따라가며, 왜 이런 계층이 필요한지와 tmux·SSH까지의 연결을 정리한다."
date        : 2026-09-05 12:50:00 +0900
updated     : 2026-09-11 21:55:00 +0900
categories  : [terminal]
tags        : [terminal, tty, pty, pseudoterminal, shell, tmux, neovim]
pin         : false
hidden      : false
---

터미널을 쓰다 보면 `TTY`, `PTY`, `terminal emulator`라는 말이 반복해서 나온다. 처음에는 전부 "터미널 비슷한 것"처럼 보이지만 실제로는 서로 다른 층을 담당한다.

이 글의 핵심 질문은 세 가지다.

```text
1. 원래 Terminal은 무엇이었나?
2. 물리 Terminal이 사라졌는데 왜 Terminal Emulator와 PTY가 필요한가?
3. Terminal Emulator와 PTY는 각각 무엇을 흉내 내는가?
```

핵심 구조부터 잡으면 이렇다.

```text
옛날
사용자 ↔ 물리 Terminal ↔ 컴퓨터

지금
사용자 ↔ Terminal Emulator ↔ PTY ↔ Shell / TUI 애플리케이션
```

여기서 중요한 점은 **Terminal Emulator와 PTY가 같은 것을 중복해서 흉내 내는 것이 아니라, 과거 물리 Terminal이 담당하던 역할을 서로 다른 층에서 나누어 재현한다는 것**이다.

```text
Terminal Emulator
= 사용자 쪽에서 Terminal의 화면·키보드 역할을 재현

PTY
= 프로그램 쪽에서 Terminal 장치의 인터페이스와 의미론을 재현
```

이 구조를 역사부터 따라가 보자.

## 1. 원래 Terminal은 진짜 하드웨어였다

`terminal`이라는 말은 원래 소프트웨어 창을 뜻하지 않았다.

초기 컴퓨터는 사용자가 본체 앞에 직접 앉아서 사용하는 형태가 아니었다. 여러 사용자가 별도의 입출력 장치를 통해 중앙 컴퓨터에 접속했고, 그 장치를 **Terminal**이라고 불렀다.

초기에는 종이에 문자를 찍는 teletype이 사용됐고, 이후 CRT 화면과 키보드를 가진 video terminal이 등장했다.

```text
┌──────────────┐               ┌───────────────┐
│ 키보드       │               │ 중앙 컴퓨터    │
│ CRT 화면     │ ← 직렬 통신 → │               │
└──────────────┘               └───────────────┘
   Terminal
```

Terminal은 주로 다음 일을 했다.

```text
사용자가 입력한 문자를 컴퓨터로 보낸다.
컴퓨터가 보낸 문자를 화면에 표시한다.
커서 이동이나 화면 지우기 같은 제어 명령을 해석한다.
```

즉 Terminal은 컴퓨터 본체가 아니라 **사용자와 컴퓨터 사이에 놓인 입출력 장치**였다.

이 역사 때문에 Unix에는 지금도 `tty`라는 이름이 깊게 남아 있다.

## 2. TTY는 어디서 나온 말인가

TTY는 **Teletypewriter**에서 나온 이름이다.

하드웨어 teletype이 사라진 뒤에도 Unix는 "프로세스가 연결되는 Terminal 장치"라는 추상화를 유지했다. 그래서 현대 Unix 계열 시스템의 `tty`는 꼭 물리 장치를 의미하지 않는다.

터미널에서 다음 명령을 실행하면 현재 프로세스가 어느 Terminal 장치에 연결되어 있는지 확인할 수 있다.

```bash
tty
```

Linux에서는 보통 다음과 비슷한 결과가 나온다.

```text
/dev/pts/3
```

여기서 `pts`는 **pseudoterminal slave** 계열 장치를 의미한다.

즉 오늘날 터미널 창에서 사용하는 TTY의 상당수는 실제 물리 Terminal이 아니라 **PTY가 제공하는 가상 Terminal 장치**다.

## 3. 왜 Terminal Emulator라는 이름을 쓸까

Ghostty, Kitty, WezTerm, iTerm2 같은 프로그램은 **Terminal Emulator**다.

`emulate`는 **다른 대상의 동작을 본떠 재현하다**라는 뜻이다.

왜 단순히 `Terminal`이라고 하지 않고 `Terminal Emulator`라고 부를까?

예전에는 실제로 이런 장치가 있었다.

```text
사용자
  ↓
물리 Terminal
  ↓
중앙 컴퓨터
```

하지만 개인용 컴퓨터가 보편화된 지금은 개발자가 별도의 CRT Terminal 장치를 컴퓨터에 연결해 사용할 필요가 거의 없다. 대신 Ghostty 같은 소프트웨어가 과거 물리 Terminal이 하던 사용자 측 역할을 재현한다.

```text
과거
사용자 ↔ 물리 Terminal ↔ 컴퓨터

현재
사용자 ↔ Terminal Emulator ↔ 운영체제
```

Terminal Emulator가 담당하는 대표적인 일은 다음과 같다.

- 키보드 입력을 받는다.
- 프로그램이 출력한 문자를 화면에 그린다.
- ANSI/VT escape sequence를 해석한다.
- 커서 위치, 색상, 화면 지우기 같은 화면 상태를 관리한다.
- 창 크기 변경을 운영체제 쪽에 전달한다.

그래서 `Terminal Emulator`라는 이름은 단순한 관습이 아니다.

> **과거의 물리 Terminal이 하던 사용자 측 동작을 소프트웨어로 재현하기 때문에 Emulator라고 부른다.**

하지만 여기서 한 가지 문제가 남는다.

Shell이나 Vim 같은 프로그램 입장에서는 화면을 그려주는 프로그램만 있다고 충분하지 않다. 이 프로그램들은 자신이 **Terminal 장치에 연결되어 있다**는 환경도 기대한다.

그래서 PTY가 필요하다.

## 4. 왜 Terminal Emulator와 Shell을 바로 연결하지 않을까

Terminal Emulator와 Shell이 단순히 문자열만 주고받으면 된다면 pipe로 연결할 수도 있다.

```text
Terminal Emulator
       ↕
      pipe
       ↕
      Shell
```

pipe도 `read()`와 `write()`를 통해 바이트를 주고받을 수 있다.

하지만 Shell, Vim, Neovim, `top` 같은 프로그램은 단순한 바이트 스트림 이상의 **Terminal 환경**을 기대한다.

예를 들면 다음과 같은 것들이다.

- 한 줄 단위 입력 처리
- 입력 echo
- Ctrl-C 같은 특수 문자 처리
- foreground process group
- job control
- Terminal window size
- canonical / non-canonical mode
- "내가 Terminal에 연결되어 있는가"를 확인할 수 있는 장치 특성

pipe에는 이런 Terminal 의미론이 없다.

그래서 운영체제는 프로그램에게 **실제 Terminal 장치처럼 보이는 가상 장치**를 제공한다.

그게 PTY(Pseudoterminal)다.

`pseudo`는 **가짜의, 겉보기에는 같은 역할을 하는**이라는 뜻이다.

즉 이름 그대로:

```text
Pseudoterminal
= 실제 물리 Terminal은 아니지만
  프로그램에게 Terminal처럼 동작하는 가상 장치
```

Terminal Emulator가 **사람에게 Terminal을 재현**한다면, PTY는 **프로그램에게 Terminal을 재현**한다고 볼 수 있다.

## 5. PTY는 master와 slave 한 쌍이다

PTY는 하나의 장치가 아니라 **master와 slave라는 두 끝을 가진 가상 장치 쌍**이다.

Linux `pty(7)` 문서는 pseudoterminal을 양방향 통신 채널을 제공하는 가상 문자 장치 쌍(virtual character device pair)으로 설명한다. slave 쪽은 일반적인 Terminal 장치처럼 동작한다.

```text
Terminal Emulator
       │
       │ 연결
       ▼
   PTY master
       ↕
   PTY slave
       ▲
       │ 연결
       │
Shell / TUI 프로그램
```

여기서 화살표는 호출 관계가 아니라 **연결과 데이터 흐름**을 뜻한다.

역할을 나누면 다음과 같다.

| 쪽 | 보통 누가 연결되나 | 역할 |
|---|---|---|
| PTY master | Terminal Emulator | 사용자의 입력을 보내고 프로그램 출력을 받음 |
| PTY slave | Shell / TUI 프로그램 | 자신이 실제 Terminal 장치에 연결된 것처럼 동작 |

중요한 점은 **PTY가 Shell을 실행하는 것이 아니라는 것**이다.

일반적으로 Terminal Emulator가 PTY를 만들고, Shell 같은 프로그램을 별도 프로세스로 실행한 뒤 그 프로그램의 표준 입출력을 PTY slave에 연결한다.

개념적으로 보면 다음과 같다.

```text
Ghostty
  ├─ PTY 생성
  └─ zsh 실행
       ├─ stdin  ← PTY slave
       ├─ stdout → PTY slave
       └─ stderr → PTY slave

Ghostty 자신은 PTY master에 연결
```

그래서 Shell은 Terminal 구조의 필수 구성요소라기보다 **PTY에 연결되어 실행되는 여러 프로그램 중 하나**다.

예를 들어 설정에 따라 Terminal Emulator가 Shell 대신 다른 TUI 프로그램을 바로 실행하는 것도 가능하다.

```text
Terminal Emulator ↔ PTY ↔ zsh
Terminal Emulator ↔ PTY ↔ fish
Terminal Emulator ↔ PTY ↔ Neovim
```

## 6. 키보드에서 `ls`를 입력하면 무슨 일이 일어날까

Ghostty에서 다음을 입력했다고 해보자.

```bash
ls
```

입력 흐름은 다음과 같다.

```text
키보드
   ↓
Ghostty
   ↓
PTY master
   ↓
PTY slave
   ↓
zsh stdin
```

zsh는 명령을 해석하고 `ls` 프로세스를 실행한다.

출력은 반대 방향으로 돌아온다.

```text
ls stdout
   ↓
PTY slave
   ↓
PTY master
   ↓
Ghostty
   ↓
화면
```

전체를 합치면:

```text
키보드
   ↓
Terminal Emulator
   ↓
PTY master
   ↕
PTY slave
   ↓
Shell / TUI 프로그램
```

여기까지만 보면 PTY는 단순히 바이트를 전달하는 중계기처럼 보일 수 있다.

하지만 PTY의 중요한 역할은 단순한 전달이 아니다.

## 7. PTY는 단순한 바이트 통로가 아니다

PTY가 필요한 핵심 이유는 **Terminal 의미론을 프로그램에게 제공하기 위해서**다.

단순 pipe와 PTY의 차이는 여기에서 드러난다.

```text
pipe
= 바이트 전달

PTY
= 바이트 전달
+ Terminal 장치의 입력 처리
+ 특수 문자 처리
+ process group / job control
+ Terminal 상태와 설정
```

대표적인 예 두 가지를 보자.

### 7.1 Ctrl-C는 그냥 문자일까

보통 Ctrl-C는 ASCII ETX 값(`0x03`)에 해당하는 입력을 만든다.

하지만 Terminal driver 설정에서 `ISIG`가 활성화되어 있고 해당 값이 interrupt character로 설정되어 있으면, 단순히 `0x03`을 애플리케이션에 전달하는 대신 foreground process group에 **SIGINT**를 발생시킬 수 있다.

```text
Ctrl-C
  ↓
Terminal Emulator
  ↓
PTY master
  ↓
PTY slave 쪽 Terminal 입력 처리
  ↓
SIGINT
  ↓
foreground process group
```

즉 Ctrl-C 처리는 **PTY가 단순 pipe가 아니라 Terminal 장치처럼 동작한다는 대표적인 사례**다.

### 7.2 왜 Shell에서는 Enter를 눌러야 한 줄이 전달될까

평범한 Shell에서 문자를 입력하면 화면에는 즉시 보이지만, 프로그램 입장에서는 보통 Enter를 누르기 전까지 한 줄이 완성되지 않는다.

이것이 Terminal의 **canonical mode**다.

canonical mode에서는 입력을 줄 단위로 조립하고 newline, EOF, EOL 같은 구분 문자가 들어왔을 때 `read()`가 완료될 수 있다.

```text
Shell
  "hello" + Enter
       ↓
  줄 단위 입력 전달
```

반대로 Neovim, `fzf`, `lazygit` 같은 TUI 프로그램은 키 하나에 즉시 반응해야 한다.

```text
Neovim
  j
  ↓
즉시 커서 이동
```

그래서 이런 프로그램은 Terminal을 non-canonical 또는 raw에 가까운 모드로 전환해서 사용한다.

이런 Terminal 입력 처리 설정을 제어하는 대표적인 인터페이스가 `termios`다.

`termios`, canonical mode, raw mode는 다음 글에서 더 깊게 다룬다.

## 8. 여기까지의 기본 구조를 다시 정리하면

이제 각 계층의 역할을 분리해서 볼 수 있다.

```text
사용자
  ↓
키보드 / 화면
  ↓
Terminal Emulator
  ↓
PTY master
  ↕
PTY slave
  ↓
Shell / TUI 프로그램
```

각각의 역할은 다음과 같다.

```text
Terminal Emulator
= 사용자에게 과거 물리 Terminal의 화면·키보드 역할을 재현

PTY
= 프로그램에게 과거 Terminal 장치의 인터페이스와 의미론을 재현

Shell
= PTY에 연결되어 명령을 해석하고 다른 프로그램을 실행하는 사용자 프로그램
```

따라서 다음과 같이 이해하면 된다.

```text
Terminal Emulator가 Shell을 직접 대체하는 것은 아니다.
PTY가 Shell을 호출하는 것도 아니다.
Shell이 운영체제 커널에 내장되어 있기 때문에 이 위치에 있는 것도 아니다.

Terminal Emulator가 PTY를 만들고 프로그램을 실행하며,
그 프로그램을 PTY slave에 연결한다.
```

이 기본 구조를 이해하면 tmux와 SSH도 같은 원리의 확장으로 볼 수 있다.

## 9. PTY 구조는 다른 환경에서도 반복된다

### 9.1 tmux에서는 PTY가 한 단계 더 생긴다

일반적인 구조는 다음과 같다.

```text
Ghostty
   ↕
  PTY
   ↕
  zsh
```

하지만 tmux 안에서 Shell이나 Neovim을 실행하면 내부 프로그램을 위해 tmux가 다시 PTY를 제공한다.

```text
Ghostty
   ↕
  PTY
   ↕
tmux client / server
   ↕
  PTY
   ↕
zsh / Neovim
```

안쪽 프로그램 입장에서는 자신이 tmux 내부에 있다는 사실보다 **Terminal 장치에 연결되어 있다는 사실**이 중요하다.

그래서 tmux는 단순히 화면을 나누는 프로그램이 아니라 **Terminal Multiplexer**다.

`multiplex`는 여러 흐름이나 연결을 하나의 통로에서 나누어 다루는 의미를 가진다. tmux라는 이름도 여러 Terminal session을 한 환경에서 관리하는 역할과 연결된다.

### 9.2 SSH에서는 원격 측에 PTY를 만든다

SSH로 원격 서버에 접속할 때도 같은 원리가 반복된다.

원격 Shell을 단순 명령 실행기가 아니라 대화형 Terminal 프로그램처럼 사용하려면 원격 측에도 PTY가 필요하다.

개념적으로 보면:

```text
로컬 사용자
    ↓
로컬 Terminal Emulator
    ↓
로컬 측 입출력
    ↓
SSH 연결
    ↓ 네트워크
원격 sshd
    ↓
원격 PTY
    ↓
원격 Shell / TUI 프로그램
```

그래서 SSH에서도 `vim`, `top`, `tmux` 같은 TUI 프로그램을 사용할 수 있다.

네트워크 너머의 프로그램에게도 **Terminal 의미론을 제공할 수 있기 때문**이다.

## 10. 전체 그림

지금까지를 가장 짧게 압축하면 다음과 같다.

```text
과거

사용자
  ↓
물리 Terminal
  ↓
컴퓨터
```

```text
현재

사용자
  ↓
Terminal Emulator
  ↓
PTY master
  ↕
PTY slave
  ↓
Shell / TUI 프로그램
```

그리고 tmux나 SSH가 들어가면 같은 원리가 한 단계 더 반복된다.

핵심은 다음 두 문장이다.

> **Terminal Emulator는 사용자 쪽에서 물리 Terminal을 재현한다.**
>
> **PTY는 프로그램 쪽에서 Terminal 장치를 재현한다.**

이 구분을 잡아두면 이후에 나오는 `termios`, raw mode, ANSI escape sequence, curses, tmux, SSH가 각각 어디에 위치하는지 훨씬 쉽게 보인다.

## 다음 질문

이제 자연스럽게 다음 의문으로 이어진다.

> Shell에서는 Enter를 눌러야 입력되는데, Neovim은 왜 `j` 하나를 누르자마자 반응할까?

그리고:

> Ctrl-C는 언제 문자이고 언제 SIGINT가 될까?

답은 Terminal driver의 입력 처리 설정에 있다.

다음 글에서는 **`termios`, canonical mode, raw mode**를 직접 Terminal에서 실험하면서 살펴본다.

## 참고

- [Linux man-pages — pty(7)](https://man7.org/linux/man-pages/man7/pty.7.html)
- [Linux man-pages — pts(4)](https://man7.org/linux/man-pages/man4/pts.4.html)
- [The Open Group — General Terminal Interface](https://pubs.opengroup.org/onlinepubs/7908799/xbd/termios.html)
- [The Open Group — termios.h](https://pubs.opengroup.org/onlinepubs/9799919799/basedefs/termios.h.html)