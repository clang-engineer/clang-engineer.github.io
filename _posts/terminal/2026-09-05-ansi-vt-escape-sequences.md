---
title       : "ANSI/VT Escape Sequence — 표준 출력으로 커서를 움직이고 화면을 그리는 법"
description : "TUI 앱이 픽셀 대신 표준 출력의 escape sequence로 커서 이동·화면 지우기·색상·alternate screen을 제어하는 원리를 직접 printf로 실험하며 정리한다."
date        : 2026-09-05 13:30:00 +0900
updated     : 2026-09-05 17:57:00 +0900
categories  : [terminal]
tags        : [terminal, ansi, vt100, escape-sequence, csi, sgr, tui]
pin         : false
hidden      : false
---

앞에서는 터미널 입력이 PTY와 `termios`를 거쳐 애플리케이션에 도착하는 방향을 봤다.

이번에는 반대 방향이다.

TUI 프로그램은 대체 어떻게 화면을 그릴까?

Neovim, `fzf`, `btop` 같은 프로그램이 GPU API로 픽셀을 직접 그리는 것은 아니다. 기본적으로는 **터미널에 텍스트와 제어용 바이트 시퀀스를 출력**한다.

```text
애플리케이션
   ↓ write() / 표준 출력(stdout)
PTY slave
   ↓
PTY master
   ↓
터미널 에뮬레이터
   ↓ escape sequence 해석
화면
```

즉 TUI 렌더링의 가장 아래에는 의외로 표준 출력이 있다.

## 가장 단순한 출력

```bash
printf 'hello\n'
```

이 명령은 문자 `hello`와 newline을 표준 출력으로 보낸다.

터미널 에뮬레이터는 일반 문자면 글리프를 화면에 표시하고, 특별한 제어 시퀀스(Control Sequence)면 **명령으로 해석**한다.

그 대표적인 시작 바이트가 `ESC`다.

ASCII에서 ESC는 `0x1b`다.

셸에서는 흔히 다음처럼 표현한다.

```bash
\033
\e
\x1b
```

그래서 다음 두 표현은 같은 의도로 많이 쓰인다.

```bash
printf '\033[31mRED\033[0m\n'
printf '\e[31mRED\e[0m\n'
```

터미널은 `ESC [ 31 m`을 화면에 문자 그대로 찍지 않고 **글자 색을 변경하는 명령**으로 해석한다.

## Escape Sequence는 작은 프로토콜이다

터미널과 애플리케이션 사이에는 단순한 문자 스트림만 있는 것이 아니다.

같은 바이트 스트림 안에:

```text
일반 문자
제어 문자
escape sequence
```

가 함께 흐른다.

```text
H e l l o ESC [ 3 1 m W o r l d ESC [ 0 m
```

터미널 에뮬레이터는 이 스트림을 파서(Parser)로 읽으면서 일반 문자는 출력하고 escape sequence는 상태 변경 명령으로 처리한다.

그래서 터미널을 **상태를 가진 텍스트 프로토콜 렌더러(Stateful Text Protocol Renderer)**로 볼 수도 있다.

## CSI — 가장 자주 보는 형태

현대 터미널에서 많이 접하는 sequence는 다음 형태다.

```text
ESC [ ...
```

이를 CSI(Control Sequence Introducer, 제어 시퀀스 시작 표기) 계열이라고 부른다.

형태를 단순화하면:

```text
ESC [ 매개변수 final-byte
```

예를 들어:

```text
ESC [ 2 J
```

은 화면 erase 계열 명령이고,

```text
ESC [ 10 ; 20 H
```

는 커서를 특정 행/열로 이동시키는 명령이다.

터미널 UI를 직접 그린다는 것은 결국 이런 sequence를 필요한 순서로 보내는 일에서 시작한다.

## 직접 실험 1 — 화면 지우기

```bash
printf '\e[2J'
```

`2J`는 전체 화면 erase 명령으로 널리 사용된다.

다만 화면을 지운 뒤 커서 위치까지 항상 원하는 곳으로 돌아가는 것은 아니므로 보통 home 이동과 함께 쓴다.

```bash
printf '\e[2J\e[H'
```

개념적으로:

```text
ESC [ 2 J  → 화면 지우기
ESC [ H    → 커서를 홈 위치로 이동
```

한다.

`clear` 명령도 결과적으로 터미널 capability를 확인한 뒤 이런 종류의 제어 문자열을 출력하는 도구라고 볼 수 있다.

## 직접 실험 2 — 커서 이동

아래를 실행해보자.

```bash
printf '\e[5;10HHELLO'
```

커서가 대략 5행 10열 위치로 이동한 뒤 `HELLO`가 출력된다.

대표적인 커서 이동은 다음과 같다.

| Sequence | 의미 |
|---|---|
| `ESC [ A` | 위로 이동 |
| `ESC [ B` | 아래로 이동 |
| `ESC [ C` | 오른쪽 이동 |
| `ESC [ D` | 왼쪽 이동 |
| `ESC [ row ; col H` | 절대 위치 이동 |

숫자를 넣으면 이동량을 지정할 수 있다.

```bash
printf '\e[10C'
```

이런 기능만 있어도 터미널의 특정 위치에 텍스트 UI를 그릴 수 있다.

## 직접 실험 3 — 색상과 스타일

색상과 굵기 같은 그래픽 속성에는 SGR(Select Graphic Rendition, 문자 표시 속성을 선택하는 제어 계열)을 사용한다.

```bash
printf '\e[31mRED\e[0m\n'
printf '\e[1mBOLD\e[0m\n'
```

대표적인 기본 색상 번호는 다음과 같다.

```text
30 black
31 red
32 green
33 yellow
34 blue
35 magenta
36 cyan
37 white
```

배경은 보통 40~47 범위를 사용한다.

그리고 `0m`으로 속성을 reset한다.

중요한 것은 **색상 자체가 표준 출력의 별도 채널이 아니라 같은 바이트 스트림에 섞여 있다는 것**이다.

## 터미널에는 화면 상태가 있다

터미널 에뮬레이터는 단순 프린터가 아니다.

내부적으로 최소한 다음과 같은 상태를 가진다.

```text
커서 위치(Cursor Position)
현재 문자 속성(Text Attributes)
화면 셀(Screen Cells)
스크롤 영역(Scroll Region)
동작 모드(Modes)
```

escape sequence는 이 상태를 변경한다.

그래서 다음 출력이 어디에 그려질지는 이전에 보낸 sequence의 영향을 받는다.

```text
애플리케이션 출력
  ↓
터미널 파서
  ↓
터미널 상태 변경
  ↓
화면 갱신
```

이 점 때문에 터미널 제어는 본질적으로 stateful하다.

## 화면 전체를 매번 출력할 필요가 없다

가령 100x30 터미널에서 한 글자만 바뀌었다고 하자.

매번 3,000개의 셀을 모두 출력할 수도 있지만 비효율적이다.

더 나은 방식은:

```text
이전 화면 상태
       ↓ 비교
새 화면 상태
       ↓
변경된 위치 계산
       ↓
커서 이동 + 변경 문자만 출력
```

하는 것이다.

```text
ESC [ 8 ; 21 H
X
```

처럼 바뀐 위치로 커서를 이동한 뒤 필요한 문자만 덮을 수 있다.

이 아이디어가 뒤에서 **가상 화면(Virtual Screen) / 차이 렌더러(Diff Renderer)**와 연결된다.

curses, Ratatui, OpenTUI 같은 계층이 대신해주는 중요한 작업 중 하나다.

## 왜 화면이 깜빡이지 않는가

단순 구현은 매 frame마다:

```text
화면 전체 지우기
→ 처음부터 전부 출력
```

할 수 있다.

하지만 이 방식은 느리고 깜빡임이 생기기 쉽다.

성숙한 TUI 렌더러는 보통:

- 이전 frame을 기억하고
- 새 frame과 비교하고
- 변경된 cell만 갱신하고
- cursor 이동 횟수도 줄이는

방향으로 최적화한다.

즉 우리가 보는 부드러운 TUI의 아래에는 **escape sequence를 얼마나 적게, 정확하게 출력할 것인가**라는 문제가 있다.

## Alternate Screen — Neovim을 나가면 원래 화면이 돌아오는 이유

Neovim, `less`, `htop` 같은 전체 화면 프로그램을 실행했다가 종료하면 그전에 보던 셸 화면이 다시 나타나는 경우가 많다.

이것은 흔히 **대체 화면 버퍼(Alternate Screen Buffer)**를 사용하기 때문이다.

개념은 단순하다.

```text
기본 화면(Primary Screen)
셸 기록이 보이는 화면

      ↕ 모드 전환

대체 화면(Alternate Screen)
Neovim, less 같은 전체 화면 UI
```

TUI 앱이 시작할 때 대체 화면으로 전환하고 종료하면서 기본 화면으로 돌아온다.

이 덕분에 전체 화면 TUI가 셸의 기존 출력 내용을 마구 덮어쓰지 않고 별도 화면처럼 동작할 수 있다.

터미널마다 세부 sequence와 지원 방식은 capability에 따라 다를 수 있기 때문에 실제 프로그램은 무조건 문자열을 하드코딩하기보다 terminfo 같은 계층을 이용하기도 한다.

## 커서를 숨기는 이유

TUI가 화면을 그리는 동안 실제 터미널 커서가 계속 보이면 눈에 거슬리거나 이상한 위치에서 깜빡일 수 있다.

그래서 많은 TUI 앱은 렌더링 동안 커서를 숨겼다가 필요한 입력창에서만 표시하거나 종료할 때 복구한다.

개념적으로:

```text
앱 시작
  ↓
대체 화면 전환
커서 숨김
  ↓
렌더링 루프
  ↓
커서 복구
기본 화면 복귀
  ↓
앱 종료
```

termios와 마찬가지로 이 상태도 비정상 종료 시 제대로 복구되지 않으면 터미널이 이상해 보일 수 있다.

## 방향키 입력도 escape sequence였다

재미있는 점은 escape sequence가 출력에만 쓰이지 않는다는 것이다.

터미널 에뮬레이터는 특수키 입력을 애플리케이션에 보낼 때도 바이트 시퀀스를 사용한다.

예를 들어 위쪽 방향키는 흔히 다음과 비슷한 sequence로 전달된다.

```text
ESC [ A
```

따라서 같은 터미널 세션에서:

```text
애플리케이션 → 터미널
    화면 제어 escape sequence

터미널 → 애플리케이션
    특수키 입력 escape sequence
```

가 양방향으로 오간다.

이것이 raw mode에서 TUI 앱이 바이트 스트림을 파싱해야 하는 이유다.

## ANSI와 VT라는 이름은 왜 같이 나오는가

터미널 역사에서는 DEC의 VT 계열 터미널, 특히 VT100이 큰 영향을 줬다.

이후 ANSI/ECMA 계열 control sequence 표준과 실제 터미널 구현 관행이 겹치면서 오늘날 흔히 **ANSI escape code**, **VT sequence**, **terminal control sequence** 같은 표현이 혼용된다.

중요한 것은 모든 현대 터미널의 기능이 완전히 동일한 단일 표준으로 끝난 것이 아니라는 점이다.

터미널마다:

- 지원 capability
- 색상 수
- 키 sequence
- private extension

등이 다를 수 있다.

이 문제가 바로 다음 단계인 **termcap/terminfo**로 이어진다.

## 그런데 앱이 sequence를 전부 하드코딩하면 안 되나?

간단한 실험이라면 가능하다.

```bash
printf '\e[2J\e[H'
```

하지만 실제 애플리케이션이라면 질문이 늘어난다.

- 이 터미널이 해당 기능을 지원하는가?
- 커서 이동 sequence가 같은가?
- 대체 화면을 지원하는가?
- color capability는 몇 개인가?
- 어떤 key sequence를 보내는가?

과거 물리 터미널은 특히 차이가 컸다.

그래서 프로그램 코드에 터미널별 분기를 가득 넣는 대신 **터미널 capability를 데이터베이스로 분리**하는 아이디어가 등장했다.

```text
애플리케이션
   ↓
터미널 capability 조회
   ↓
termcap / terminfo
   ↓
적절한 제어 시퀀스
   ↓
터미널
```

## 지금까지 연결

입력과 출력을 합치면 구조가 이렇게 된다.

```text
                 입력(Input)
키보드
   ↓
터미널 에뮬레이터
   ↓
PTY master
   ↓
PTY slave + termios
   ↓
애플리케이션
   │
   │ 이벤트 / 상태 / 렌더링
   ↓
표준 출력 / escape sequence
   ↓
PTY
   ↓
터미널 에뮬레이터
   ↓
화면
                 출력(Output)
```

여기까지 이해하면 TUI는 더 이상 마법처럼 보이지 않는다.

가장 아래에서는:

> 키 입력 바이트 스트림을 받고, 화면 변경용 바이트 스트림을 다시 보낸다.

그 위에 수많은 추상화가 올라가 있을 뿐이다.

## 다음 단계 — termcap과 terminfo

escape sequence의 원리는 알았다.

이제 다음 질문은 이것이다.

> 터미널 종류마다 기능과 sequence가 다르면 애플리케이션은 대체 어떻게 호환성을 유지했을까?

여기서 `TERM`, termcap, terminfo, `tput`이 등장한다.

## 참고

- DEC/VT 계열 terminal control sequence 문서
- ANSI/ECMA 계열 terminal control sequence 관행
- VT100/호환 터미널의 cursor movement·erase 명령
