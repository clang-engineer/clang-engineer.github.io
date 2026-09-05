---
title       : "터미널은 무엇인가 — TTY에서 PTY까지"
description : "물리 터미널에서 terminal emulator와 pseudoterminal로 이어지는 구조를 따라가며, Ghostty·shell·tmux·Neovim이 실제로 어떻게 연결되는지 정리한다."
date        : 2026-09-05 12:50:00 +0900
updated     : 2026-09-05 12:50:00 +0900
categories  : [terminal]
tags        : [terminal, tty, pty, pseudoterminal, shell, tmux, neovim]
pin         : false
hidden      : false
---

터미널을 쓰다 보면 `TTY`, `PTY`, `terminal emulator`라는 말이 반복해서 나온다. 처음에는 전부 "터미널 비슷한 것"처럼 보이지만 역할은 서로 다르다.

핵심부터 잡으면 이렇다.

```text
옛날
사람 ↔ 물리 터미널 ↔ 컴퓨터

지금
사람 ↔ Terminal Emulator ↔ PTY ↔ Shell / TUI Application
```

지금 우리가 Ghostty, Kitty, iTerm2 같은 앱을 열고 `zsh`, `tmux`, `Neovim`을 실행할 수 있는 것은 운영체제가 **물리 터미널처럼 행동하는 가상 장치**를 제공하기 때문이다. 그 장치가 PTY(Pseudoterminal)다.

## 1. 원래 Terminal은 진짜 하드웨어였다

`terminal`이라는 말은 원래 소프트웨어 창을 뜻하지 않았다.

초기 컴퓨터는 사용자가 본체 앞에 직접 앉아서 사용하는 형태가 아니었다. 여러 사용자가 별도의 입출력 장치를 통해 중앙 컴퓨터에 접속했고, 그 장치를 terminal이라고 불렀다.

초기에는 종이에 문자를 찍는 teletype이 사용됐고, 이후 CRT 화면과 키보드를 가진 video terminal이 등장했다.

```text
┌──────────────┐               ┌───────────────┐
│ Keyboard     │               │ Main Computer │
│ CRT Display  │ ← serial →    │               │
└──────────────┘               └───────────────┘
   Terminal
```

터미널은 입력을 컴퓨터로 보내고, 컴퓨터가 보낸 문자와 제어 명령을 화면에 표시했다.

이 역사 때문에 Unix에는 지금도 `tty`라는 이름이 깊게 남아 있다.

## 2. TTY는 어디서 나온 말인가

`TTY`는 **teletypewriter**에서 나온 이름이다.

하드웨어 teletype이 사라진 뒤에도 Unix는 "프로세스가 연결되는 터미널 장치"라는 추상화를 유지했다. 그래서 현대 시스템의 `tty`는 꼭 물리 장치를 의미하지 않는다.

터미널에서 다음 명령을 실행해보면 현재 셸이 어느 terminal device에 연결되어 있는지 볼 수 있다.

```bash
tty
```

Linux에서는 보통 다음과 비슷한 결과가 나온다.

```text
/dev/pts/3
```

여기서 흥미로운 부분은 `pts`다. 지금 셸이 실제 직렬 터미널이 아니라 **pseudo terminal slave**에 연결되어 있다는 뜻이다.

즉 오늘날 터미널 창에서 보게 되는 TTY의 상당수는 실제 하드웨어 TTY가 아니라 PTY가 제공하는 가상 터미널이다.

## 3. 그런데 Terminal Emulator는 뭐지

Ghostty, Kitty, WezTerm, iTerm2 같은 프로그램은 **terminal emulator**다.

이름 그대로 옛날의 물리 terminal을 소프트웨어로 흉내 낸다.

Terminal emulator가 담당하는 대표적인 일은 다음과 같다.

- 키보드 입력을 받는다.
- 프로그램이 출력한 문자를 화면에 그린다.
- ANSI/VT escape sequence를 해석한다.
- 커서 위치, 색상, 화면 지우기 같은 terminal 상태를 관리한다.
- 창 크기가 변하면 terminal size 변경을 전달한다.

하지만 중요한 점이 있다.

**Terminal emulator가 shell 그 자체는 아니다.**

Ghostty를 실행했다고 해서 Ghostty 안에 zsh가 내장되어 동작하는 것은 아니다. Ghostty는 별도 프로세스인 shell을 실행하고, 그 사이를 PTY로 연결한다.

```text
┌───────────────┐
│    Ghostty    │
│ Terminal      │
│ Emulator      │
└───────┬───────┘
        │
        │ PTY
        │
┌───────▼───────┐
│      zsh      │
└───────────────┘
```

## 4. 왜 그냥 pipe로 연결하지 않고 PTY를 쓸까

여기가 핵심이다.

프로세스끼리 데이터를 주고받는 것만 필요하다면 pipe도 가능하다.

```text
A process ── pipe ──> B process
```

그런데 shell, Vim, Neovim, `top` 같은 프로그램은 단순한 byte stream보다 **"나는 터미널에 연결되어 있다"는 환경**을 기대한다.

터미널에는 일반 pipe에는 없는 개념들이 있다.

- 한 줄 단위 입력 처리
- echo
- Ctrl-C 같은 특수 문자 처리
- foreground process group
- terminal window size
- job control
- canonical / non-canonical mode

그래서 terminal emulator와 shell 사이에 단순 pipe를 놓는 대신, **실제 terminal처럼 행동하는 가상 장치**를 둔다.

그게 PTY다.

## 5. PTY는 master와 slave 한 쌍이다

PTY는 하나의 장치가 아니라 **master / slave 두 끝을 가진 쌍**이다.

Linux `pty(7)` 문서도 pseudoterminal을 양방향 통신 채널을 제공하는 virtual character device pair로 설명한다. slave 쪽은 classical terminal처럼 동작한다.

```text
Terminal Emulator
       │
       │ PTY master
       ▼
 ┌─────────────┐
 │     PTY     │
 └─────────────┘
       ▲
       │ PTY slave
       │
     Shell
```

역할을 나누면 다음과 같다.

| 쪽 | 보통 누가 연결되나 | 역할 |
|---|---|---|
| PTY master | terminal emulator | 사용자의 키 입력을 보내고 프로그램 출력을 받음 |
| PTY slave | shell / application | 자신이 진짜 terminal에 연결된 것처럼 동작 |

Linux의 UNIX 98 PTY에서는 `/dev/ptmx`를 열어 master를 만들고, 대응되는 slave가 `/dev/pts/*` 아래 생성된다.

## 6. 키보드에서 `ls`를 입력하면 무슨 일이 일어날까

Ghostty에서 다음을 입력했다고 해보자.

```bash
ls
```

흐름을 단순화하면 이렇다.

```text
Keyboard
   ↓
Ghostty
   ↓
PTY master
   ↓
PTY slave
   ↓
zsh stdin
   ↓
zsh가 ls 실행
   ↓
ls stdout
   ↓
PTY slave
   ↓
PTY master
   ↓
Ghostty
   ↓
Screen
```

키보드 입력도 PTY를 지나가고, 프로그램 출력도 반대 방향으로 같은 PTY를 지나온다.

그래서 terminal emulator는 애플리케이션 내부 상태를 알 필요가 없다. 들어오는 byte stream과 terminal control sequence를 해석해 화면을 그리면 된다.

## 7. Ctrl-C는 그냥 문자일까

여기서 Unix terminal이 단순 byte pipe가 아니라는 것이 드러난다.

보통 Ctrl-C는 ASCII ETX 값(`0x03`)에 해당하는 입력을 만든다. 하지만 terminal driver의 설정에서 `ISIG`가 활성화되어 있고 그 값이 interrupt character로 설정되어 있다면, foreground process group에 **SIGINT**가 전달된다.

PTY에서도 이 terminal semantics가 유지된다. Linux `pty(7)` 문서는 master 측에서 interrupt character를 쓰면 slave에 연결된 foreground process group에 SIGINT가 생성되는 예를 든다.

즉:

```text
Ctrl-C
  ↓
Terminal Emulator
  ↓
PTY
  ↓
Terminal input processing
  ↓
SIGINT
  ↓
Foreground Process
```

이런 처리를 실제로 제어하는 설정 체계가 `termios`다.

`termios`와 canonical/raw mode는 다음 글에서 따로 본다.

## 8. canonical mode에서는 왜 Enter를 눌러야 shell이 읽을까

평범한 shell에서 문자를 입력하면 화면에는 즉시 보이지만, 프로그램 입장에서는 보통 Enter를 누르기 전까지 한 줄이 완성되지 않는다.

이것이 terminal의 **canonical mode**다.

POSIX terminal interface에서는 canonical mode일 때 입력을 line 단위로 조립하고, newline/EOF/EOL 등이 들어올 때 읽기가 완료된다.

반대로 Neovim, `fzf`, `lazygit` 같은 인터랙티브 프로그램은 `j` 하나를 누른 즉시 반응해야 한다.

```text
Shell
  "hello" + Enter
       ↓
  line 단위 처리

TUI
  j
  ↓
즉시 cursor down
```

그래서 TUI 프로그램은 보통 terminal을 non-canonical/raw에 가까운 모드로 전환한다.

이것이 다음 단계에서 `termios`와 raw mode를 배워야 하는 이유다.

## 9. tmux를 켜면 PTY가 하나 더 생긴다

이제 tmux가 왜 흥미로운지 보인다.

일반적인 연결은:

```text
Ghostty
   ↕
  PTY
   ↕
  zsh
```

하지만 tmux 안에서 shell이나 Neovim을 실행하면 계층이 하나 더 생긴다.

```text
Ghostty
   ↕
  PTY
   ↕
tmux client
   ↕
tmux server
   ↕
  PTY
   ↕
zsh / Neovim
```

안쪽 애플리케이션 입장에서는 여전히 "나는 terminal에 연결되어 있다"고 생각한다.

실제로는 tmux가 중간에서 또 terminal 역할을 하고 있는 셈이다. 사용자 쪽 terminal과 연결되면서 동시에 안쪽 프로그램을 위해 새로운 pseudoterminal을 제공한다.

그래서 tmux는 단순히 화면을 나누는 프로그램이라기보다 **terminal multiplexer**다.

## 10. SSH도 같은 그림으로 연결된다

SSH로 원격 서버에 접속할 때 `ssh -t` 같은 옵션에서 TTY라는 말이 다시 등장한다.

원격 shell이 interactive terminal처럼 동작하려면 원격 측에서도 PTY가 필요하다.

개념적으로 보면:

```text
Local Terminal Emulator
        ↕
   Local side
        ↕
     SSH
        ↕ network
  Remote sshd
        ↕
   Remote PTY
        ↕
   Remote Shell
```

그래서 SSH를 통해서도 `vim`, `top`, `tmux` 같은 TUI 프로그램을 그대로 사용할 수 있다.

네트워크 너머에서도 프로그램에게는 terminal semantics를 제공할 수 있기 때문이다.

## 11. 지금까지의 전체 그림

여기까지 연결하면 우리가 매일 보는 개발 환경은 이렇게 볼 수 있다.

```text
Human
  ↓
Keyboard / Display
  ↓
Terminal Emulator
  ↓
PTY master
  ↕
PTY slave
  ↓
Shell
  ↓
Application
```

그리고 tmux가 들어가면:

```text
Human
  ↓
Ghostty
  ↓
PTY
  ↓
tmux
  ↓
PTY
  ↓
Neovim / fzf / lazygit
```

이 그림을 머릿속에 넣어두면 이후에 나오는 `termios`, raw mode, ANSI escape sequence, curses 같은 기술들이 어디에 끼는지 훨씬 쉽게 보인다.

## 다음 질문

이제 자연스럽게 다음 의문이 생긴다.

> shell에서는 Enter를 눌러야 입력되는데, Neovim은 왜 `j` 하나를 누르자마자 반응할까?

그리고:

> Ctrl-C는 언제 문자이고 언제 SIGINT가 될까?

답은 terminal driver의 입력 처리 설정에 있다.

다음 글에서는 **`termios`, canonical mode, raw mode**를 직접 터미널에서 실험하면서 살펴본다.

## 참고

- [Linux man-pages — pty(7)](https://man7.org/linux/man-pages/man7/pty.7.html)
- [Linux man-pages — pts(4)](https://man7.org/linux/man-pages/man4/pts.4.html)
- [The Open Group — General Terminal Interface](https://pubs.opengroup.org/onlinepubs/7908799/xbd/termios.html)
- [The Open Group — termios.h](https://pubs.opengroup.org/onlinepubs/9799919799/basedefs/termios.h.html)
