---
title       : "ANSI 터미널 색상 — 제어 시퀀스와 팔레트의 동작 원리"
description : "ANSI, PTY, 색상 인덱스와 RGB의 관계"
date        : 2026-11-28 00:00:00 +0900
categories  : [theme, "테마 관리"]
tags        : [ansi, terminal, palette]
pin         : false
hidden      : false
---

## 전체 구조

```text
CLI / TUI → 문자와 제어 시퀀스 → PTY → 터미널 에뮬레이터
                                          ├─ 제어 명령 해석
                                          ├─ 색상표 참조
                                          └─ 화면 렌더링
```

화살표는 출력 데이터의 흐름이다. PTY(Pseudoterminal)는 입출력 통로이며 색상을 결정하지 않는다. ANSI(American National Standards Institute, 미국 국가표준협회)는 표준화 기관이다. 터미널에서 ANSI라고 부르는 제어 시퀀스는 ANSI X3.64, ECMA-48 계열과 후속 확장을 가리킨다. 색상 외에도 커서 이동, 화면 지우기, 문자 속성을 제어한다.

## 색상 명령과 팔레트

```sh
printf '\033[31mHello\033[0m\n'
printf '\033[38;5;1mHello\033[0m\n'
printf '\033[38;2;255;85;85mHello\033[0m\n'
```

ESC(0x1B)와 '['는 CSI(Control Sequence Introducer)를 구성한다. 끝의 m은 SGR(Select Graphic Rendition) 명령이다. 31은 기본 빨강 전경색, 0은 속성 초기화다. 첫 두 예시는 같은 색상 슬롯 1을 참조하지만 마지막 예시는 RGB를 직접 전달한다.

| 인덱스 | 기본 색상 | 전경 SGR | 밝은 인덱스 | 밝은 전경 SGR |
|---|---|---|---|---|
| 0 | Black | 30 | 8 | 90 |
| 1 | Red | 31 | 9 | 91 |
| 2 | Green | 32 | 10 | 92 |
| 3 | Yellow | 33 | 11 | 93 |
| 4 | Blue | 34 | 12 | 94 |
| 5 | Magenta | 35 | 13 | 95 |
| 6 | Cyan | 36 | 14 | 96 |
| 7 | White | 37 | 15 | 97 |

밝은 색상은 널리 쓰이는 확장이다. 배경은 40~47 및 100~107, 기본 전경과 배경은 39와 49로 복원한다. 색상 이름은 관례이며 실제 RGB는 터미널 테마가 정한다.

| 표현 | 범위 | 결정 방식 |
|---|---|---|
| 기본/밝은 색상 | 0~15 | 터미널 팔레트 |
| 256색 확장 | 0~255 | 인덱스 참조 |
| True Color | RGB 각 0~255 | 직접 지정 |

일반적인 xterm 256색 표는 기본 16색, 6×6×6 색상 큐브 216색, 회색 24색으로 구성된다. 기본 16색 이외의 슬롯은 보통 고정된 관례를 따르지만 터미널에 따라 변경 가능하다. True Color도 제어 시퀀스를 통해 전달되므로 ANSI와 RGB는 반대 개념이 아니다.

## 실행 시점의 간접 참조

Ghostty 설정의 예:

```ini
palette = 1=#ff5555
palette = 2=#50fa7b
```

프로그램이 31m을 출력하면 터미널은 팔레트 1번을 참조한다. 배열 참조에 비유할 수 있지만 프로그램이 터미널의 메모리를 직접 읽는 것은 아니다. 테마 변경으로 슬롯 값이 달라져도 프로그램의 출력 명령은 동일하다. RGB 직접 지정은 이 간접 참조를 거치지 않는다.

tmux는 자체 가상 터미널을 제공하므로 제어 시퀀스와 색상 조회가 중간 계층의 지원에 영향을 받을 수 있다. SSH에서도 출력은 최종 터미널에서 렌더링된다.

## 관련 문서

- [테마 로드맵](2026-11-28-00-theme-roadmap.md)
- [애플리케이션 테마 설계](2026-11-28-application-theme-architecture.md)
- [ECMA-48](https://ecma-international.org/publications-and-standards/standards/ecma-48/)
- [xterm 제어 시퀀스](https://invisible-island.net/xterm/ctlseqs/ctlseqs.html)
