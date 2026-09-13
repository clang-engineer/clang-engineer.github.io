---
title       : "termios와 raw mode — Ctrl-C는 언제 문자가 아니라 signal이 되는가"
description : "터미널 드라이버가 termios 설정에 따라 입력을 어떻게 가공하는지, ICANON·ECHO·ISIG와 raw mode를 중심으로 이해한다."
date        : 2026-09-05 13:10:00 +0900
updated     : 2026-09-13 18:15:00 +0900
categories  : [terminal]
tags        : [terminal, termios, tty, pty, raw-mode, canonical-mode, signal, stdin]
pin         : false
hidden      : false
---

이전 글에서 터미널 에뮬레이터가 PTY를 만들고, 셸이나 TUI 애플리케이션은 그 PTY의 slave 쪽을 터미널처럼 사용한다는 구조를 봤다.

그다음 질문은 이것이다.

> **PTY를 통해 들어온 키 입력은 그대로 셸이나 Vim에 전달되는가?**

보통은 그렇지 않다. PTY/TTY의 **터미널 드라이버**가 입력을 한 번 가공하고, 그 가공 방법을 정하는 설정이 **termios**다.

이 글에서 먼저 잡을 핵심은 네 가지다.

```text
ICANON
= Enter까지 입력을 모아서 넘길까?

ECHO
= 입력한 문자를 다시 화면에 보여줄까?

ISIG
= Ctrl-C 같은 특수 입력을 Signal로 바꿀까?

raw mode
= 이런 가공을 최대한 줄여 앱이 입력을 직접 처리하게 할까?
```

이 네 가지를 이해하면 termios의 큰 그림은 잡은 것이다.

## 1. termios는 어디에 있는가

입력 경로부터 단순하게 보자.

```text
키보드
  ↓
터미널 에뮬레이터
  ↓
PTY master
  ↓
PTY slave / 터미널 드라이버
  ↓  termios 설정에 따라 가공
Shell / Vim / TUI 앱의 read()
```

역할을 나누면 다음과 같다.

```text
터미널 드라이버
= 실제로 입력 바이트를 해석·가공하는 커널 쪽 주체

termios
= 터미널 드라이버가 입력을 어떻게 처리할지 정하는 설정 인터페이스

stty
= 현재 터미널의 termios 설정을 조회하거나 바꾸는 명령어
```

즉 `termios`라는 별도 프로그램이 중간에서 입력을 받아 다시 보내는 것이 아니다.

**터미널 드라이버가 termios 설정을 보고 입력을 처리한 뒤, 애플리케이션이 그 결과를 읽는다.**

감각적으로는 키 입력을 터미널 규칙에 맞게 한 번 "번역"해서 넘긴다고 생각할 수 있다.

## 2. 핵심 설정 세 가지

### ICANON — Enter까지 모을까

기본 셸 입력은 대개 canonical mode다.

```text
h e l l o Enter
        ↓
터미널 드라이버가 한 줄을 모음
        ↓
read() → "hello\n"
```

`ICANON`이 켜져 있으면 프로그램이 `read()`를 호출해도 키 하나마다 바로 반환되는 것이 아니라, 터미널 드라이버가 줄 단위 입력을 처리한다.

반대로 `ICANON`을 끄면 Enter를 기다리지 않는 noncanonical 입력이 가능해진다.

```text
j 입력
  ↓
터미널 드라이버
  ↓
read()가 바로 반환 가능
```

그래서 Vim, Neovim, `fzf`, `less` 같은 대화형 프로그램은 키 하나에 즉시 반응할 수 있다.

### ECHO — 입력을 다시 보여줄까

셸에서 `hello`를 입력하면 화면에 바로 보인다.

이걸 셸이 직접 다시 출력한다고 생각하기 쉽지만, 기본 상태에서는 `ECHO`가 켜져 있어 터미널 드라이버가 입력 문자를 다시 화면 쪽으로 보낸다.

```text
키 입력
  ↓
터미널 드라이버
  ├─ 애플리케이션 입력으로 전달
  └─ 화면 쪽으로 echo
```

비밀번호 입력에서 글자가 보이지 않는 것은 보통 프로그램이 잠시 `ECHO`를 끄기 때문이다.

### ISIG — Ctrl-C를 문자로 넘길까, Signal로 바꿀까

`Ctrl-C`는 전통적으로 `0x03`에 해당하는 입력을 만든다.

하지만 `ISIG`가 켜져 있으면 이 값을 단순 문자로 애플리케이션에 넘기지 않고 `SIGINT`로 바꿔 현재 foreground process group에 전달할 수 있다.

```text
Ctrl-C
  ↓
0x03 (VINTR)
  ↓
터미널 드라이버 + ISIG
  ↓
SIGINT
  ↓
foreground process group
```

비슷하게 `Ctrl-Z`는 `SIGTSTP` 같은 Signal과 연결된다.

중요한 점은 **터미널 에뮬레이터가 직접 프로세스에 Signal을 보내는 것이 아니라, 터미널 드라이버가 termios 규칙에 따라 처리한다는 것**이다.

## 3. Shell과 Vim은 같은 PTY 설정을 바꿔 쓴다

여기서 자주 헷갈리는 점이 있다.

> Shell용 termios와 Vim용 termios가 따로 존재하는가?

그렇지 않다. **termios 상태는 TTY/PTY 장치에 붙어 있고, foreground 프로그램이 필요에 따라 그 상태를 바꿔 쓴다.**

예를 들어 셸이 `/dev/pts/3`에 연결되어 있다고 하자.

```text
Shell
  ↓
/dev/pts/3
  ↓
termios 상태
```

셸에서는 보통 이런 상태가 편하다.

```text
ICANON on
ECHO   on
ISIG   on
```

여기서 Vim을 실행해도 보통 별도 PTY를 만드는 것이 아니라 같은 `/dev/pts/3`를 사용하고, foreground process가 Vim으로 바뀐다.

Vim은 키를 즉시 받아야 하므로 시작할 때 기존 termios 상태를 저장하고, 같은 PTY의 설정을 자기 필요에 맞게 바꾼다.

```text
Shell이 사용하던 termios 상태
        ↓ 저장
Vim이 같은 PTY의 설정 변경
        ↓
키 입력을 더 직접 처리
        ↓
Vim 실행
```

Vim이 정상 종료하면 저장해 둔 상태를 복구한다.

```text
Vim 종료
  ↓
원래 termios 상태 복구
  ↓
Shell이 다시 foreground
```

그래서 TUI 프로그램이 비정상 종료하면서 복구에 실패하면 셸로 돌아온 뒤에도 입력한 글자가 안 보이거나 Enter 동작이 이상해질 수 있다.

## 4. raw mode — 터미널 드라이버가 덜 해석하게 한다

`ICANON` 하나만 끈 것이 raw mode는 아니다.

raw mode는 여러 입력·출력 가공을 함께 줄여 애플리케이션이 바이트 스트림을 더 직접 처리하도록 만드는 설정 묶음에 가깝다.

핵심 감각은 이렇다.

```text
일반적인 입력
키보드
  ↓
터미널 드라이버가 해석·편집
  ↓
애플리케이션

raw 계열 입력
키보드
  ↓
터미널 드라이버가 최소한만 가공
  ↓
애플리케이션이 직접 해석
```

처음에는 다음 세 가지가 꺼진다는 점만 이해해도 충분하다.

```text
ICANON off → Enter까지 모으지 않음
ECHO   off → 입력을 자동으로 다시 그리지 않음
ISIG   off → Ctrl-C 등을 Signal로 바꾸지 않음
```

실제 `cfmakeraw()` 계열 설정은 `IEXTEN`, `IXON`, `ICRNL`, `OPOST` 같은 다른 처리도 함께 조정한다.

## 5. raw mode가 키 이벤트를 만들어 주는 것은 아니다

raw mode를 켰다고 해서 방향키가 곧바로 `KeyUp` 같은 이벤트가 되는 것은 아니다.

예를 들어 위쪽 방향키는 여러 바이트의 escape sequence로 들어올 수 있다.

```text
ESC [ A
  ↓
입력 파서
  ↓
위쪽 키 이벤트
```

즉 역할은 다음처럼 나뉜다.

```text
raw mode
= 터미널 드라이버의 가공을 줄임

입력 파서
= 들어온 바이트 시퀀스를 논리적인 키 이벤트로 해석
```

## 6. stty — 현재 설정을 직접 확인하는 도구

이제 `stty`의 위치도 자연스럽게 보인다.

```text
termios
= 설정 체계

stty
= 그 설정을 조회·변경하는 명령어
```

현재 설정 확인:

```bash
stty -a
```

처음에는 다음 세 항목만 보면 된다.

```text
icanon
echo
isig
```

echo를 직접 끄고 다시 켤 수도 있다.

```bash
stty -echo
stty echo
```

현재 상태를 저장해 두었다가 복구할 수도 있다.

```bash
old=$(stty -g)
stty raw -echo
stty "$old"
```

설정을 잘못 바꿔 터미널이 이상해졌다면 다음 명령도 유용하다.

```bash
stty sane
```

## 7. 여기부터는 심화

여기까지 이해했다면 termios의 핵심은 충분하다.

```text
터미널 드라이버가 입력을 가공한다.
termios가 그 가공 규칙을 정한다.
foreground 프로그램은 같은 PTY의 설정을 필요에 따라 바꿔 쓴다.
raw mode는 가공을 줄여 앱이 입력을 더 직접 처리하게 한다.
```

아래는 필요할 때 다시 보면 된다.

### VMIN / VTIME

noncanonical mode에서는 Enter라는 줄 경계가 사라지므로 `read()`가 언제 반환할지 다른 기준이 필요하다. `VMIN`과 `VTIME`이 그 조건을 조절한다.

대표적으로:

| VMIN | VTIME | 의미 |
|---:|---:|---|
| 1 | 0 | 최소 1바이트가 올 때까지 대기 |
| 0 | 0 | 데이터가 없으면 즉시 반환 |
| 0 | >0 | 일정 시간 기다렸다 없으면 timeout |
| >0 | >0 | 최소 바이트 수와 시간 조건 조합 |

TUI 이벤트 루프는 이 설정이나 `poll`/`select`/`epoll`/`kqueue` 같은 I/O multiplexing을 조합해 입력을 기다릴 수 있다.

### 셸의 line editing은 별도 계층이다

canonical mode에도 기본적인 line editing이 있지만, 현대 셸의 history, completion, Vim/Emacs editing mode 같은 기능은 셸/readline/ZLE 같은 애플리케이션 계층에서 더 풍부하게 구현한다.

```text
터미널 드라이버의 canonical editing
        ≠
셸이 직접 구현하는 대화형 line editor
```

## 8. 이 계층을 알고 나면 보이는 것

```text
비밀번호 입력
→ ECHO off

Neovim/fzf의 즉시 키 입력
→ ICANON off

Ctrl-C를 앱이 직접 처리
→ ISIG off

TUI 종료 뒤 터미널이 이상함
→ 변경한 termios 상태 복구 실패 가능성
```

## 9. 다음 단계 — 입력에서 출력으로

지금까지는 터미널에서 애플리케이션으로 **들어오는 입력**을 봤다.

```text
키보드
   ↓
터미널 에뮬레이터
   ↓
PTY
   ↓
termios 규칙
   ↓
애플리케이션
```

다음에는 반대 방향을 본다.

```text
애플리케이션
   ↓
표준 출력(stdout)
   ↓
PTY
   ↓
터미널 에뮬레이터
   ↓
ANSI / VT escape sequence 해석
   ↓
화면
```

즉 다음 주제는 **ANSI/VT Escape Sequence — 표준 출력으로 커서를 움직이고 화면을 그리는 방법**이다.

## 참고

- POSIX `<termios.h>` — ICANON, ECHO, ISIG 및 terminal control flags
- Linux `termios(3)` — canonical/noncanonical mode, VMIN/VTIME, `cfmakeraw()`
