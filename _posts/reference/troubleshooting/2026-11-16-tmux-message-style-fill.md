---
title       : "tmux 프롬프트 뒤에 상태바가 비친다면 — message-style의 fill"
description : "tmux 3.7의 부분 overlay 변경 뒤 오래된 테마가 명령 프롬프트 영역을 채우지 않는 현상을 순정 서버·스타일 비교로 추적한다."
date        : 2026-11-16 00:00:00 +0900
categories  : [reference, "문제 해결"]
tags        : [tmux, message-style, status-line, troubleshooting]
pin         : false
hidden      : false
---

`prefix + :`로 tmux 명령 프롬프트를 열었는데 입력창 너머로 창 목록과 시계가 남아 보였다. 처음에는 상태바의 색이나 정렬 문제처럼 보이지만, 2026년 7월의 테마 조합에서 확인한 차이는 **`message-style`에 `fill=`이 없었다**는 것이다. 명령 텍스트의 색을 바꾸는 것과 프롬프트가 덮을 영역을 채우는 일은 구분된다.

## 상황 → 원인: 색이 아니라 칠하는 범위

기본 스타일은 버전에 따라 배경을 채울 `fill` 값을 포함한다. 오래된 테마가 `set -g message-style 'fg=black,bg=colour39'`처럼 옵션 전체를 덮어쓰면 기본값의 `fill`까지 사라진다. [tmux 변경 기록](https://github.com/tmux/tmux/blob/master/CHANGES)의 3.6b→3.7 항목은 메시지가 상태바 일부에 겹쳐 그려지는 동작과 `message-style`의 `fill` 필요성을 설명한다. 당시에는 프롬프트를 연 뒤 상태바 일부가 남는 현상이 이 버전 변화와 오래된 설정의 결합으로 나타났다. 테마가 잘못된 색을 고른 것만은 아니다.

```tmux
# 프롬프트 중 상태바를 같은 배경색으로 채우고 싶다면
set -g message-style 'fg=black,bg=colour39,fill=colour39'
set -g message-command-style 'fg=black,bg=colour39'
```

이 설정은 상태바를 프롬프트 중 **가린다**. 창 목록을 계속 보고 싶다면 `fill`을 의도적으로 빼고 명령 텍스트를 대비색으로 강조하거나, 별도 메시지 줄을 쓰는 선택도 있다. 터미널 셀의 배경색은 투명하게 아래 문자를 섞어 보여주는 알파 합성이 아니다. 프롬프트가 가독성이 필요한지 상태 정보가 필요한지 목적에 따라 선택한다.

## 원인을 좁히는 순서

1. `tmux show -gv message-style`로 현재 옵션과 `fill`을 확인한다. `message-command-style`도 따로 확인해 텍스트 스타일과 배경 채우기를 혼동하지 않는다.
2. 이미 설정을 누적 적용한 서버는 과거 바인딩·옵션이 남을 수 있다. 다른 소켓에 `-f /dev/null`로 새 세션을 띄워 순정 스타일과 비교하고, 같은 서버 안에서 조회한다.
3. 순정에는 문제가 없는데 테마 적용 후 생기면 테마의 `message-style` 덮어쓰기와 **실제 로드 순서**를 본다. 스타일을 나중에 설정해야 override가 적용된다.

실행 중 서버를 순정으로 착각하는 함정은 [Oh My Tmux 설정 비교]({% post_url tmux/2026-07-12-oh-my-tmux %})에도 나온다. 테마 파일의 색 값만 바꾸는 대신 tmux 버전의 렌더링 계약과 **누가 옵션 전체를 마지막에 설정했는지** 확인하면 재현 가능한 원인을 찾을 수 있다.
