---
title       : "termios와 raw mode — Ctrl-C는 언제 문자가 아니라 signal이 되는가"
description : "터미널 입력을 처리하는 termios의 역할과 canonical/raw mode, echo, ISIG, VMIN/VTIME을 직접 실험하며 Neovim·fzf 같은 TUI가 키 입력을 즉시 받는 원리를 정리한다."
date        : 2026-09-05 13:10:00 +0900
updated     : 2026-09-05 17:57:00 +0900
categories  : [terminal]
tags        : [terminal, termios, tty, pty, raw-mode, canonical-mode, signal, stdin]
pin         : false
hidden      : false
---

이전 글에서 현대 터미널 에뮬레이터가 PTY를 만들고, 셸이나 TUI 애플리케이션은 그 PTY의 slave 쪽을 실제 터미널처럼 사용한다는 구조를 봤다.

그런데 여기서 바로 다음 의문이 생긴다.

- 평범한 셸에서는 왜 `abc`를 입력해도 Enter를 누르기 전까지 프로그램이 못 받는가?
- Neovim이나 `fzf`는 왜 `j` 하나만 눌러도 즉시 반응하는가?
- `Ctrl-C`는 키 입력인데 왜 프로그램에 문자 `0x03`이 전달되지 않고 프로세스가 중단되는가?
- 비밀번호 입력에서는 왜 타이핑한 문자가 화면에 보이지 않는가?

이 동작의 중심에 Unix 터미널 드라이버의 **termios** 설정이 있다.

## 입력 경로에서 termios가 끼는 위치

터미널 입력을 단순화하면 다음과 같다.

```text
키보드
  ↓
터미널 에뮬레이터
  ↓
PTY master
  ↓
PTY slave / 터미널 드라이버
  ↓
termios 규칙
  ↓
read() / 표준 입력(stdin)
  ↓
애플리케이션
```

애플리케이션이 키보드에서 온 바이트를 그대로 받는다고 생각하기 쉽지만, 기본 상태에서는 그렇지 않다. 커널의 터미널 드라이버가 입력을 중간에서 가공한다.

`termios`는 이 가공 규칙을 설정하는 인터페이스다.

대표적으로 다음을 결정한다.

- 한 줄을 모은 뒤 전달할지, 문자 단위로 바로 전달할지
- 입력한 문자를 화면에 다시 보여줄지
- `Ctrl-C`, `Ctrl-Z` 같은 제어 문자를 signal로 바꿀지
- CR/LF를 변환할지
- software flow control을 사용할지

## 현재 터미널 설정 보기 — stty

가장 간단한 관찰 도구는 `stty`다.

```bash
stty -a
```

macOS나 Linux에서 실행하면 많은 플래그가 나오는데, 처음에는 세 개만 보면 된다.

```text
icanon
echo
isig
```

각각 의미는 다음과 같다.

| 플래그 | 역할 |
|---|---|
| `ICANON` | canonical mode 사용 |
| `ECHO` | 입력 문자를 터미널에 다시 출력 |
| `ISIG` | 특수 제어 문자를 signal로 변환 |

셸에서 `stty -a`를 보면 일반적으로 이 기능들이 켜져 있다.

## Canonical mode — Enter까지 한 줄을 모은다

기본 셸 입력은 대개 **canonical mode**다.

```text
사용자: h e l l o Enter
                 │
     터미널 드라이버가 한 줄을 모음
                 │
                 ▼
          애플리케이션 read()
               "hello\n"
```

즉 프로그램이 `read()`를 호출했다고 해서 키 하나마다 반환되는 것이 아니다.

터미널 드라이버가 내부 버퍼에서 한 줄을 편집한 뒤 Enter 같은 줄 구분자가 들어오면 그제야 프로그램에 전달한다.

그래서 셸에서 입력 중 Backspace를 누르면 애플리케이션이 직접 이전 글자를 지우는 것이 아니라 터미널 드라이버가 canonical line editing을 처리할 수도 있다.

`Ctrl-U`로 현재 줄을 지우거나 `Ctrl-W`로 단어를 지우는 전통적인 동작도 이 계층과 연결된다.

## Echo — 내가 입력한 문자는 누가 화면에 그리는가

터미널에서 다음을 입력한다고 하자.

```text
hello
```

화면에 `hello`가 보이니 셸이 타이핑한 글자를 화면에 다시 출력한다고 생각하기 쉽다.

하지만 기본 상태에서는 `ECHO`가 켜져 있어서 **터미널 드라이버가 입력 문자를 다시 출력**한다.

```text
키보드 입력
      ↓
터미널 드라이버
   ├─ 애플리케이션 쪽 입력 버퍼
   └─ 화면 쪽으로 echo
```

그래서 비밀번호를 입력받는 프로그램은 보통 잠시 `ECHO`를 끈다.

직접 확인할 수 있다.

```bash
stty -echo
```

이후 입력한 문자는 화면에 보이지 않는다.

복구:

```bash
stty echo
```

터미널 설정을 실험하다 화면이 이상해졌다면 다음 명령이 유용하다.

```bash
stty sane
```

## ISIG — Ctrl-C는 왜 문자로 도착하지 않는가

`Ctrl-C`의 전통적인 바이트 값은 ETX(0x03)다.

하지만 셸에서 실행 중인 프로그램에 `Ctrl-C`를 누르면 일반적으로 프로그램은 문자 `0x03`을 읽지 않는다. 대신 `SIGINT`를 받는다.

이 변환을 담당하는 것이 `ISIG`다.

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

비슷하게:

| 키 | termios 항목 | 기본 동작 |
|---|---|---|
| `Ctrl-C` | `VINTR` | `SIGINT` |
| `Ctrl-\` | `VQUIT` | `SIGQUIT` |
| `Ctrl-Z` | `VSUSP` | `SIGTSTP` |

중요한 점은 signal이 **터미널 에뮬레이터가 직접 프로세스에 보내는 것이 아니라 터미널 드라이버가 foreground process group에 전달**한다는 것이다.

그래서 job control과 controlling terminal 개념이 뒤에서 연결된다.

## Noncanonical mode — 한 줄이라는 개념을 없앤다

`ICANON`을 끄면 터미널 드라이버는 더 이상 Enter까지 한 줄을 모으지 않는다.

이 상태를 **noncanonical mode**라고 한다.

```text
j 입력
  ↓
터미널 드라이버
  ↓
read()가 바로 반환 가능
  ↓
TUI 이벤트 루프
```

Neovim, `fzf`, `less`, TUI 게임처럼 키 입력에 즉시 반응해야 하는 프로그램은 이런 문자 단위 입력이 필요하다.

하지만 `ICANON` 하나만 끄는 것으로 우리가 보통 말하는 raw mode가 완성되는 것은 아니다.

## Raw mode는 여러 기능을 한꺼번에 끈 상태다

Linux의 `cfmakeraw()`가 설정하는 내용을 보면 raw mode가 어떤 상태인지 잘 드러난다.

핵심적으로 다음 계열의 처리를 끈다.

```text
ICANON  → 줄 버퍼링·줄 편집 끔
ECHO    → 입력 echo 끔
ISIG    → Ctrl-C 등을 signal로 바꾸는 처리 끔
IEXTEN  → 확장 입력 처리 끔
IXON    → Ctrl-S/Ctrl-Q software flow control 끔
ICRNL   → CR → NL 변환 끔
OPOST   → 출력 후처리 끔
```

즉 raw mode의 철학은:

> 터미널 드라이버가 최대한 해석하지 말고 들어온 바이트를 애플리케이션이 직접 처리하게 하라.

에 가깝다.

```text
Canonical mode
키보드 → 터미널 드라이버가 해석·편집 → 애플리케이션

Raw 계열 모드
키보드 → 최소 가공 → 애플리케이션이 직접 해석
```

그래서 TUI 앱은 방향키 escape sequence, `Ctrl-C`, `j`, `k` 등을 자신의 이벤트 루프에서 구분할 수 있다.

## 직접 실험 — stty raw

현재 설정을 먼저 저장해두는 것이 안전하다.

```bash
old=$(stty -g)
```

raw mode로 변경:

```bash
stty raw -echo
```

이제 몇 가지 변화가 바로 느껴진다.

- Enter를 기다리지 않고 입력이 즉시 전달된다.
- 입력한 글자가 화면에 자동으로 보이지 않는다.
- `Ctrl-C`가 평소처럼 현재 명령을 끊지 않을 수 있다.
- 줄바꿈 동작도 평소와 다르게 느껴질 수 있다.

복구:

```bash
stty "$old"
```

또는:

```bash
stty sane
```

실험 중 터미널을 완전히 망가뜨렸다면 새 터미널 탭을 열어 복구하는 것도 방법이다.

## VMIN / VTIME — noncanonical read는 언제 반환되는가

canonical mode에서는 보통 newline이 read의 경계를 만든다.

noncanonical mode에서는 그 기준이 사라지므로 다른 규칙이 필요하다. `termios`는 `VMIN`과 `VTIME`으로 이를 제어한다.

가장 대표적인 조합은 다음과 같다.

| VMIN | VTIME | 의미 |
|---:|---:|---|
| 1 | 0 | 최소 1바이트가 올 때까지 block |
| 0 | 0 | 데이터가 없으면 즉시 반환, polling |
| 0 | >0 | 일정 시간 기다렸다 없으면 timeout |
| >0 | >0 | 최소 바이트 수 + inter-byte timeout 조합 |

TUI 이벤트 루프는 이 설정 또는 `poll`/`select`/`epoll`/`kqueue` 같은 I/O multiplexing을 조합해 입력을 기다린다.

여기서부터 터미널 입력은 UI 프레임워크의 **이벤트 소스(Event Source)**가 된다.

## 방향키는 한 글자가 아니다

raw mode를 켰다고 해서 모든 키가 한 바이트라는 뜻은 아니다.

예를 들어 터미널의 방향키는 보통 여러 바이트로 이루어진 escape sequence를 보낸다.

개념적으로 위쪽 방향키는 다음과 비슷하다.

```text
ESC [ A
```

그러면 TUI 앱의 입력 처리는 실제로 이런 형태가 된다.

```text
바이트 스트림
   ↓
입력 파서(Input Parser)
   ↓
"위쪽 방향키" 이벤트
   ↓
이벤트 루프
```

즉 raw mode는 **키 이벤트를 만들어주는 기능이 아니다.** 터미널이 보내는 바이트 스트림을 애플리케이션이 직접 해석할 수 있게 해주는 기반이다.

이 차이가 중요하다.

## Neovim이나 fzf가 시작하고 종료할 때 하는 일

TUI 앱은 대략 다음 흐름을 가진다.

```text
시작
 ↓
현재 termios 저장
 ↓
raw/noncanonical 계열 설정
 ↓
키 입력 직접 처리
 ↓
UI 이벤트 루프
 ↓
종료
 ↓
원래 termios 복구
```

프로그램이 비정상 종료되었을 때 터미널에서 글자가 안 보이거나 Enter가 이상해지는 경험이 있다면, **프로그램이 원래 termios 상태를 복구하기 전에 죽었기 때문**인 경우가 많다.

그래서 터미널 프로그램은 종료·signal 처리 시 터미널 상태 복구를 중요하게 다룬다.

## 셸의 line editing은 또 어디에 있나

여기서 한 가지 헷갈릴 수 있다.

canonical mode 자체에도 기본적인 line editing이 있지만, 현대 셸의 화려한 편집 기능은 그것보다 위에서 구현된다.

예를 들어 zsh/bash의:

- 좌우 방향키
- history
- Emacs/Vim editing mode
- completion
- syntax highlighting

같은 기능은 셸/readline/ZLE 같은 애플리케이션 계층이 터미널을 적절히 제어하면서 구현한다.

즉:

```text
터미널 드라이버의 canonical editing
        vs
셸이 직접 만드는 대화형 line editor
```

는 같은 것이 아니다.

현대 대화형 셸은 더 풍부한 기능을 위해 터미널을 직접 제어하는 부분이 많다.

## 이 계층을 알고 나면 보이는 것

이제 다음 현상들을 같은 원리로 볼 수 있다.

### 비밀번호 입력

```text
ECHO off
```

### Neovim/fzf의 즉시 키 입력

```text
ICANON off
```

### Ctrl-C를 앱이 직접 키로 처리

```text
ISIG off → 0x03을 앱이 직접 받음
```

### 프로그램이 죽은 뒤 터미널이 이상함

```text
termios를 변경한 뒤 원래 상태 복구 실패
```

### Ctrl-S를 잘못 눌렀더니 터미널이 멈춘 것처럼 보임

전통적인 설정에서는 `IXON` software flow control 때문에 Ctrl-S가 출력을 멈추고 Ctrl-Q가 다시 시작시킬 수 있다.

raw mode 구현에서 `IXON`을 끄는 이유 중 하나다.

## 다음 단계 — 입력에서 출력으로

지금까지는 **터미널에서 애플리케이션으로 들어오는 방향**을 봤다.

```text
키보드
   ↓
터미널 에뮬레이터
   ↓
PTY
   ↓
termios
   ↓
애플리케이션
```

다음에는 반대 방향을 본다.

TUI 프로그램은 픽셀을 그리는 대신 표준 출력(stdout)으로 특별한 바이트 시퀀스를 내보낸다.

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
