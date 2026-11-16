---
title       : "Ghostty·tmux에서 Ctrl+C가 ^[[27;5;99~로 찍혔을 때"
description : "확장 키 프로토콜의 협상 경로와 tmux의 on·always 차이를 실제 키 입력으로 진단한 사례"
date        : 2026-11-16 12:00:00 +0900
categories  : [troubleshooting, "terminal"]
tags        : [tmux, ghostty, neovim, terminal, extended-keys]
pin         : false
hidden      : false
---

Ghostty 안에서 tmux를 쓰다 셸 프롬프트에 Ctrl+C 대신 `^[[27;5;99~`가 찍혔다. 이는 글자 그대로 입력된 코드가 아니라 **수정자 키를 표현하는 이스케이프 시퀀스**가 셸에 그대로 노출된 사례다. `CSI 27;5;99~`에서 `5`는 Ctrl 수정자, `99`는 문자 `c`를 가리킨다. 터미널·tmux·Neovim 같은 내부 애플리케이션 사이에서 확장 키 프로토콜 상태가 맞지 않으면 평소 제어 문자로 보이던 키도 다른 바이트로 전달될 수 있다.

## 원인 추적: 어느 경계에서 인코딩이 달라졌나

터미널이 tmux에 보내는 키와 tmux가 pane 내부 애플리케이션에 보내는 키는 **서로 다른 형식일 수 있다**. tmux는 중간에서 변환한다. 따라서 `27;...~` 형식이 보였다는 사실만으로 Ghostty가 직접 그 형식을 내보냈다고 단정하면 안 된다. [tmux의 modifier-key 안내](https://github.com/tmux/tmux/wiki/Modifier-Keys#why-a-key-might-not-work)도 터미널↔tmux와 tmux↔애플리케이션 양쪽의 합의를 별도로 확인하도록 설명한다.

내가 확인한 순서는 다음과 같았다.

```sh
tmux -V
tmux show-options -s extended-keys
tmux show-options -s extended-keys-format
tmux show-options -s terminal-features
```

설정값만으로 결론 내리지 않고 **실제 물리 키**를 Ghostty 바깥과 tmux 안에서 각각 눌러 차이를 비교했다. `cat` 같은 입력 관찰 도구로 조합 키를 살펴볼 수 있지만 Ctrl+C는 `cat`을 종료시키는 일반 제어 키이므로 별도 키의 관찰 결과를 Ctrl+C로 일반화하지 않는다. `tmux send-keys`는 tmux 내부에 이미 해석된 키를 넣어 **Ghostty→tmux 인코딩 경로를 우회**한다. 이 문제를 재현하거나 해결했다고 판정하기 위한 수단이 아니다.

일반적인 Ctrl+문자는 원래 ASCII 제어 코드로 표현된다. 확장 키가 필요한지 판단할 때는 ‘Ctrl을 많이 쓴다’가 아니라 Shift+Enter, Ctrl+숫자, Ctrl+Shift+글자처럼 기존 제어 코드로 구별하기 어려운 바인딩이 실제로 필요한지 본다.

## 해결: 무조건 끄지 말고 소비자에 맞춰 협상

당시 확장 키가 필요한 애플리케이션이 있어 tmux에서 완전히 끄는 대신, 요청한 애플리케이션에만 켜지는 `on`을 선택했다. 다음은 **당시 Ghostty·tmux 조합에서 사용한 설정 예**이지 모든 버전의 필수 설정이 아니다.

```tmux
set -s extended-keys on
set -s extended-keys-format csi-u
set -as terminal-features 'xterm-ghostty:extkeys'
```

기존 `terminal-features`에 같은 패턴을 중복 추가하지 말고 외부 `TERM` 값과 tmux 서버 버전, 기존 설정을 먼저 확인한다. `extended-keys-format`은 tmux가 **내부 애플리케이션으로 내보내는** 형식을 선택하며, 터미널이 보낸 바이트를 단순 통과시키는 스위치가 아니다. 변경한 뒤에는 영향을 받은 pane에서 Neovim 등을 다시 시작해 협상을 다시 하고, 물리 키를 직접 눌러 Shift+Enter 동작·붙여넣기·Ctrl+C 노출 여부를 함께 확인했다. 문제가 계속되면 설정을 되돌리고 각 경계를 따로 조사한다.

또 다른 가능성은 애플리케이션이 확장 키 모드를 요청한 채 비정상 종료되어 프롬프트에 상태가 남는 것이다. 그 경우 셸 진입 시 상태 초기화를 검토할 수 있지만, 무작정 시작 스크립트에 리셋을 넣으면 원인 분석을 가릴 수 있다. 어떤 프로세스가 모드를 켰고 어느 경계에 잔류했는지 먼저 확인한다.

## 같은 설정이 다른 문제도 만들었다: 2026년 8월 기록

당시 tmux 3.7b와 Snacks.nvim 2.31.0 환경에서는 `extended-keys always`일 때 recent picker 첫 검색이 약 1초 멈추는 현상도 관찰했다. Snacks의 당시 터미널 탐지 코드가 `tmux show -g extended-keys` 출력의 `on`만 인식해 `always`를 놓치고 터미널 probe의 timeout까지 기다리는 경로였다. `set -g extended-keys on`으로 바꾼 뒤에는 해당 경로를 직접 조회하여 지연이 줄었다. [관련 이슈 #2332](https://github.com/folke/snacks.nvim/issues/2332)와 [수정 PR #2790](https://github.com/folke/snacks.nvim/pull/2790)을 참고하되, **2026년 8월의 특정 버전에서 관찰한 우회**로만 읽어야 한다. 현재 설치한 Snacks 코드에 같은 조건문과 문제가 남아 있는지 확인하지 않고 상시 처방으로 복사하지 않는다. 입력 중복까지 같은 원인으로 확정한 것은 아니다.

이 사례의 핵심은 `always`가 언제나 잘못됐다거나 `off`가 언제나 안전하다는 주장이 아니다. 증상 바이트의 형식, tmux 서버 옵션, 내부 애플리케이션의 요청, 물리 키 경로를 **각각** 확인해야 프로토콜 문제와 특정 플러그인의 버전별 탐지 문제를 구별할 수 있다.
