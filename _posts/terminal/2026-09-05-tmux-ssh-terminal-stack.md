---
title       : "tmux와 SSH까지 연결한 터미널 전체 스택"
description : "Ghostty 같은 터미널 에뮬레이터에서 로컬 PTY, tmux client/server와 Pane PTY, SSH 전송, 원격 PTY, TERM, SIGWINCH가 어떻게 이어지는지 전체 경로를 한 번에 정리한다."
date        : 2026-09-05 15:50:00 +0900
updated     : 2026-09-05 18:03:00 +0900
categories  : [terminal]
tags        : [terminal, tmux, ssh, tty, pty, term, sigwinch, neovim]
pin         : false
hidden      : false
---

지금까지 터미널 스택을 조각별로 봤다.

```text
TTY / PTY
termios
ANSI / VT
terminfo
curses
TUI 렌더러
Neovim
```

마지막으로 이 조각들을 실제 개발 환경 하나에 연결해보자.

예시는:

```text
Ghostty
  ↓
tmux
  ↓
SSH
  ↓
원격 Neovim
```

이다.

겉보기에는 터미널 창 하나지만 내부에는 여러 개의 PTY와 터미널 에뮬레이션 계층이 겹친다.

## 1. tmux 없이 로컬 셸만 실행

가장 단순한 구조부터 시작한다.

Ghostty 같은 터미널 에뮬레이터를 열면 대략:

```text
Ghostty
  │
  │ PTY master
  ↕
PTY slave
  │
 zsh
```

구조가 만들어진다.

터미널 에뮬레이터는 master 쪽을 잡고 셸은 slave 쪽을 자신의 터미널처럼 사용한다.

셸의:

```text
stdin
stdout
stderr
```

가 그 PTY slave에 연결된다.

사용자가 타이핑하면:

```text
키보드
 ↓
Ghostty
 ↓
PTY master
 ↓
터미널 드라이버 / termios
 ↓
zsh
```

출력은 반대로 올라간다.

```text
zsh stdout
 ↓
PTY slave
 ↓
PTY master
 ↓
Ghostty 파서
 ↓
화면
```

## 2. 그 안에서 Neovim을 실행

```bash
nvim
```

을 실행해도 새 PTY가 반드시 생기는 것은 아니다.

셸이 Foreground Process Group을 Neovim 쪽으로 넘기고 같은 제어 터미널(Controlling Terminal)을 사용한다.

개념적으로:

```text
Ghostty
  ↕
PTY
  ↕
Neovim
```

이 된다.

Neovim은 터미널을 raw/noncanonical 계열로 설정하고 내장 TUI가 화면 제어 Sequence를 출력한다.

종료하면 터미널 상태를 복구하고 Foreground 제어가 셸로 돌아간다.

## 3. tmux를 실행하면 왜 PTY가 하나 더 생기는가

이제:

```bash
tmux
```

를 실행한다.

tmux는 단순히 화면을 나누는 UI가 아니다.

**터미널 멀티플렉서(Terminal Multiplexer)**라는 이름 그대로 여러 Pseudoterminal을 관리한다.

공식 tmux 구조에서 server는 session/window/pane을 관리하고, 각 Pane에는 별도의 Pseudoterminal이 있다.

큰 그림은:

```text
Ghostty
  ↕
바깥 PTY
  ↕
tmux client
  ↕ socket
tmux server
  ↕
Pane PTY
  ↕
zsh / Neovim
```

이다.

여기서 PTY가 두 층이다.

## 4. tmux client와 server를 분리해서 보기

사용자가 보는 화면 쪽은 **tmux client**다.

client는 현재 바깥 터미널과 붙는다.

```text
Ghostty
  ↕
PTY
  ↕
tmux client
```

하지만 session 상태와 Pane 안의 프로그램을 실제로 관리하는 것은 백그라운드의 **tmux server**다.

client와 server는 Unix socket으로 통신한다.

```text
tmux client
     ↕ socket
tmux server
```

그래서 client를 detach해도 server와 Pane 안의 프로그램은 살아 있을 수 있다.

```text
Client 종료
     X
Server ── Pane PTY ── Process
                 계속 실행
```

이게 tmux session persistence의 핵심이다.

## 5. 각 Pane은 하나의 Pseudoterminal이다

창을 세 개 Pane으로 나누면 단순한 화면 직사각형 세 개가 아니다.

각 Pane 안에는 별도 PTY가 있다.

```text
              tmux server
             /     |      \
          PTY    PTY     PTY
           ↓      ↓       ↓
          zsh    nvim    btop
```

각 프로그램 입장에서는 자신이 그냥 정상적인 터미널 하나에 연결되어 있다고 느낀다.

Neovim은:

> 나는 tmux Pane 안에 있다

라는 특별한 API를 사용할 필요가 없다.

그냥 PTY와 `$TERM`을 보고 터미널 애플리케이션처럼 행동한다.

이게 Unix 터미널 추상화의 힘이다.

## 6. tmux가 중간 터미널 에뮬레이터처럼 행동한다

Pane 안의 프로그램이 출력한다.

```text
Neovim
 ↓
Escape Sequence
 ↓
Pane PTY
 ↓
tmux server
```

그런데 이 Sequence가 무조건 바깥 Ghostty로 그대로 전달되는 것은 아니다.

tmux가 Pane의 터미널 출력을 해석해 자신의 화면 모델(Screen Model)을 갱신하고, 현재 client 터미널에 맞게 다시 그린다.

```text
안쪽 앱
  ↓
안쪽 터미널 Protocol
  ↓
tmux 화면 모델
  ↓
바깥 터미널 Protocol
  ↓
Ghostty
```

그래서 tmux 자체가 **중간 터미널 에뮬레이터/멀티플렉서 계층**처럼 보인다.

## 7. 그래서 tmux 안에서는 TERM이 달라진다

바깥 터미널에서:

```bash
echo $TERM
```

한 값과 tmux 안의 값이 다를 수 있다.

예를 들면:

```text
바깥: xterm-256color 계열
안쪽: tmux-256color
```

이유는 Pane 안 앱이 직접 Ghostty와 대화하는 게 아니기 때문이다.

```text
앱
 ↓
"tmux가 제공하는 터미널 Capability"
 ↓
tmux
 ↓
"실제 바깥 터미널 Capability"
 ↓
Ghostty
```

즉 안쪽 `$TERM`은 **tmux라는 가상 터미널의 계약**을 표현한다.

## 8. 대체 화면도 tmux가 중간에서 처리한다

Neovim이 대체 화면(Alternate Screen)으로 들어가면:

```text
Neovim
 ↓ smcup 계열
Pane PTY
 ↓
tmux
```

tmux가 이 상태를 관리한 뒤 자신의 client 화면에 반영한다.

tmux의 `alternate-screen` 옵션이 이런 동작과 연결된다.

즉 앞에서 배운 terminfo Capability가 실제 멀티플렉서 안에서도 그대로 중요하다.

## 9. 터미널 크기 변경 — 창 크기를 바꾸면 어떻게 Neovim까지 전달되나

Ghostty 창을 늘린다고 하자.

가장 바깥 터미널 크기가 바뀐다.

```text
Ghostty 크기 변경
   ↓
바깥 PTY 크기 변경
   ↓
SIGWINCH / 크기 변경 이벤트
   ↓
tmux client/server
```

tmux는 새로운 client 크기를 기준으로 Pane 레이아웃을 다시 계산한다.

```text
전체 120x40
  ↓
tmux 레이아웃
  ↓
Pane A 60x40
Pane B 60x40
```

그다음 각 Pane PTY의 크기를 갱신한다.

```text
Pane PTY 크기 변경
   ↓
Foreground Process에 SIGWINCH
   ↓
Neovim
   ↓
UI 레이아웃 재계산
```

그래서 마우스로 터미널 창을 늘리면 Neovim 화면이 거의 즉시 다시 배치된다.

하나의 크기 변경이 여러 계층을 타고 전파되는 것이다.

## 10. 이제 SSH를 넣어보자

로컬 셸에서:

```bash
ssh server
```

를 실행하면 터미널 바이트 스트림이 네트워크를 건너간다.

PTY를 할당한 대화형(Interactive) SSH 세션을 단순화하면:

```text
로컬 터미널 에뮬레이터
        ↕
     로컬 PTY
        ↕
    ssh client
        ↕ 암호화된 네트워크
    ssh server
        ↕
    원격 PTY
        ↕
    원격 셸
```

핵심은 **원격에서도 PTY가 하나 생긴다**는 것이다.

원격 셸이나 Neovim은 네트워크 socket을 직접 터미널로 사용하는 것이 아니라 원격 PTY의 slave 쪽을 터미널로 본다.

## 11. SSH에서 키 입력은 어떻게 흐르는가

사용자가 로컬에서 `j`를 누른다.

```text
키보드
 ↓
로컬 터미널 에뮬레이터
 ↓
로컬 PTY
 ↓
ssh client
 ↓ 암호화
네트워크
 ↓
sshd
 ↓
원격 PTY
 ↓
원격 Neovim
```

원격 Neovim이 출력한 Escape Sequence는 반대로 돌아온다.

```text
원격 Neovim
 ↓
원격 PTY
 ↓
sshd
 ↓ 암호화된 네트워크
ssh client
 ↓
로컬 PTY
 ↓
로컬 터미널 에뮬레이터
 ↓
화면
```

그래서 실제 렌더링은 **로컬 터미널 에뮬레이터**가 하지만 애플리케이션은 원격에서 실행될 수 있다.

## 12. 그래서 SSH는 픽셀을 전송하지 않는다

일반적인 터미널 SSH 세션은 원격 데스크톱처럼 framebuffer 픽셀을 보내는 구조가 아니다.

기본적으로 터미널 입출력 바이트 스트림을 운반한다.

```text
원격 앱 출력
"ESC[31mHELLO"
      ↓ 네트워크
로컬 터미널 에뮬레이터
      ↓
실제 색상/글리프 렌더링
```

이 때문에 네트워크 대역폭이 작아도 복잡한 TUI를 원격에서 사용할 수 있다.

## 13. TERM도 원격에 필요하다

원격 프로그램은 실제 로컬 터미널 에뮬레이터가 무엇을 지원하는지 알아야 한다.

그래서 대화형 SSH 세션에서는 터미널 종류 정보가 원격 환경과 연결된다.

```text
로컬 TERM
   ↓ SSH 터미널 요청
원격 TERM
   ↓
원격 terminfo 조회
```

원격 서버의 terminfo에 해당 Entry가 없으면:

```text
unknown terminal type
```

문제가 생길 수 있다.

즉 최신 터미널 에뮬레이터를 쓰면서 오래된 서버에 접속할 때 발생하는 호환성 문제도 이 스택으로 설명된다.

## 14. 터미널 크기 변경도 SSH를 건너간다

로컬 터미널 창 크기가 바뀌면 SSH client는 원격 측에 새로운 터미널 크기를 알려준다.

```text
로컬 크기 변경
 ↓
ssh client
 ↓ 네트워크 window-change 요청
sshd
 ↓
원격 PTY 크기 갱신
 ↓
SIGWINCH
 ↓
원격 Foreground Process
```

그래서 원격 Neovim도 로컬 창 크기에 맞춰 다시 그려진다.

## 15. 로컬 tmux 안에서 SSH하면

이제 실제 자주 쓰는 구조다.

```text
Ghostty
  ↕
바깥 PTY
  ↕
tmux client
  ↕
tmux server
  ↕
Pane PTY
  ↕
ssh client
  ↕ 네트워크
sshd
  ↕
원격 PTY
  ↕
원격 Neovim
```

PTY만 세어도 여러 개다.

하지만 각 프로그램은 바로 옆 계층만 알면 된다.

```text
tmux Pane의 ssh client
→ 자신의 제어 터미널만 알면 됨

원격 Neovim
→ 원격 PTY와 TERM만 알면 됨

Ghostty
→ 최종 바이트 스트림을 그리면 됨
```

복잡한 전체 구조를 모든 프로그램이 알 필요가 없다.

## 16. 원격 서버에서도 tmux를 다시 실행하면

```text
로컬 Ghostty
 ↓
로컬 tmux
 ↓
SSH
 ↓
원격 tmux
 ↓
원격 Neovim
```

도 가능하다.

구조는 더 깊어진다.

```text
터미널 에뮬레이터
  ↕ PTY
로컬 tmux
  ↕ PTY
SSH 전송
  ↕ 원격 PTY
원격 tmux
  ↕ Pane PTY
Neovim
```

그래도 Unix PTY 추상화가 반복될 뿐이다.

**같은 인터페이스를 계층마다 다시 제공할 수 있기 때문에 터미널 중첩이 가능하다.**

## 17. Ctrl-C도 전체 스택을 타고 간다

Ctrl-C를 생각해보자.

로컬 Neovim이 아니라 원격 Foreground Process를 끊는 상황이라면 키 바이트가 SSH를 건너 원격 PTY에 들어간다.

원격 터미널 드라이버의 `ISIG`가 활성화된 상태라면 그곳에서:

```text
0x03
 ↓
VINTR
 ↓
SIGINT
 ↓
원격 Foreground Process Group
```

으로 바뀐다.

즉 Signal이 네트워크를 그대로 "SIGINT packet"으로 이동한다고 단순화하면 안 된다.

터미널 입력 바이트와 원격 PTY의 터미널 의미론이 중요한 역할을 한다.

물론 SSH Protocol 자체에도 Signal 전달 기능 등 별도 메커니즘이 있지만 일반 대화형 터미널에서 제어 키를 이해하는 기본 그림은 PTY 의미론과 함께 보는 것이 좋다.

## 18. 지금까지 배운 모든 층

최종 지도를 만들면:

```text
┌──────────────────────────────────┐
│ 터미널 에뮬레이터                │
│ Ghostty / Kitty / WezTerm        │
├──────────────────────────────────┤
│ PTY                              │
├──────────────────────────────────┤
│ 터미널 멀티플렉서 / 전송         │
│ tmux / SSH                       │
├──────────────────────────────────┤
│ PTY                              │
├──────────────────────────────────┤
│ 터미널 드라이버                   │
│ termios / raw mode / Signal      │
├──────────────────────────────────┤
│ 터미널 Protocol                  │
│ ANSI / VT Escape Sequence        │
├──────────────────────────────────┤
│ Capability Database              │
│ terminfo / TERM                  │
├──────────────────────────────────┤
│ UI 추상화                        │
│ curses / TUI 프레임워크           │
├──────────────────────────────────┤
│ 애플리케이션                      │
│ Neovim / fzf / lazygit / ...     │
└──────────────────────────────────┘
```

정확히는 이 층들이 한 방향으로만 일렬 연결되는 것은 아니고 입력/출력 경로에 따라 역할이 교차하지만, **어떤 추상화가 어느 문제를 해결하는지**를 보는 지도론 유용하다.

## 터미널 스택의 핵심

처음에는 TUI 앱이 화면에 박스를 어떻게 그리는지가 궁금했다.

바닥까지 내려오니 핵심은 의외로 단순하다.

```text
입력:
터미널 → 바이트 스트림 → 앱

출력:
앱 → 바이트 스트림 → 터미널
```

그 사이에 Unix가 수십 년 동안 쌓은 계층들이 있다.

```text
PTY
termios
Signal
Escape Sequence
terminfo
화면 추상화
렌더러
컴포넌트 프레임워크
```

그리고 tmux와 SSH는 이 터미널 인터페이스를 **중간에서 다시 제공하거나 전송**하기 때문에 기존 TUI 앱을 거의 그대로 중첩하고 원격으로 보낼 수 있다.

이게 터미널 생태계가 오래 살아남은 가장 재미있는 구조 중 하나다.

## 참고

- tmux manual / Getting Started — server/client 구조, 각 Pane의 Pseudoterminal
- POSIX terminal interface / PTY semantics
- SSH interactive terminal PTY allocation과 window size 전달
