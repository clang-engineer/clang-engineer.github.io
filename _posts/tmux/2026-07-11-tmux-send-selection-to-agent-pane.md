---
title       : "tmux copy-mode 선택을 AI 에이전트 pane으로 — Y 한 키로 marked pane에 전송"
description : "터미널 출력을 AI 에이전트에 복붙하는 게 번거롭다면 copy-mode 바인딩 하나로 끝난다. 왜 copy-mode는 nvim 버퍼를 못 긁는지(alternate screen), 그래서 셸 출력과 에디터 코드가 레이어별로 도구가 갈리는지까지 정리."
date        : 2026-07-11 14:00:00 +0900
updated     : 2026-07-24 12:00:00 +0900
categories  : [tmux, "설정·옵션"]
tags        : [tmux, copy-mode, ai-agent, claude-code, vi-mode, guide]
pin         : false
hidden      : false
---

Claude Code, Codex 같은 AI 코딩 에이전트를 tmux 옆 패널에서 돌리다 보면, 셸에서 난 에러·로그·테스트 출력을 에이전트에게 넘겨 "이거 왜 이래?"라고 물어보는 일이 잦다. 문제는 그 **복붙 과정**이다. copy-mode 진입 → 영역 선택 → 복사 → 에이전트 패널로 이동 → 붙여넣기 → 질문 타이핑. 하루에 수십 번 반복하면 이 마찰이 꽤 크다.

이걸 tmux 바인딩 한 줄로 "선택 → 키 하나 → 에이전트에 꽂힘"까지 줄이는 방법이다. 그런데 그 전에, **왜 이게 셸 출력 전용인지** 짚고 가는 게 중요하다. 여기서 사람들이 자주 헛발질한다.

## 함정 먼저 — copy-mode로 nvim 버퍼는 못 긁는다

"에디터에서 보고 있는 코드도 이걸로 에이전트에 보내면 되겠네"라고 생각하기 쉬운데, **안 된다.** tmux copy-mode는 패널의 *렌더된 화면*(터미널 셀)을 긁는 도구지, "그 프로그램의 데이터"를 아는 게 아니다.

- **셸 패널**: 일반 화면이라 출력이 스크롤백에 쌓인다 → copy-mode가 위로 스크롤하며 선택 가능. **잘 된다.**
- **nvim 패널**: nvim은 *alternate screen*(대체 화면 — vim·less·htop처럼 프로그램이 자기 화면을 직접 그리고 종료 시 원래 화면을 복원하는 모드)에서 돈다. 이 모드는 **tmux 스크롤백이 없다.** 그래서 copy-mode가 현재 보이는 한 화면밖에 못 보고, 위로 스크롤도 안 되며, split이 열려 있으면 줄번호(gutter)·경계선까지 한 줄에 섞여 긁힌다.

즉 nvim 안에서 `prefix + [`로 copy-mode에 들어가 `k`로 위를 보려 해도 "화면 밖으로 못 나가는" 증상을 만나게 된다. 이건 버그가 아니라 alternate screen의 구조적 결과다.

**그래서 소스에 따라 도구가 갈린다.**

| 보낼 내용 | 올바른 도구 | 이유 |
|---|---|---|
| **셸 출력**(에러·로그·테스트) | tmux copy-mode → 아래 `Y` 바인딩 | 스크롤백이 있어 copy-mode가 제대로 작동 |
| **에디터 코드** | nvim 자체 yank(비주얼 `y`) 또는 [vim-slime](https://github.com/jpalardy/vim-slime) | 버퍼를 정확히 잘라줌 — 화면이 아니라 데이터를 다룸 |

> vim-slime의 이름은 Emacs의 **SLIME**(Superior Lisp Interaction Mode for Emacs)에서 왔다. 편집 중인 코드 영역을 REPL로 "보내" 실행시키는 기능인데, 대상이 REPL이든 AI 에이전트든 원리는 같다 — 선택한 버퍼 텍스트를 다른 패널에 주입한다.

이 글은 **셸 출력** 쪽, 즉 copy-mode가 실제로 잘 작동하는 영역을 다룬다.

## 해결 — `Y` 한 키로 marked 패널에 전송

`~/.tmux.conf`에 copy-mode-vi 바인딩 하나를 추가한다.

```tmux
# 선택 영역을 marked 패널(AI 에이전트)에 bracketed paste로 보내고 그 패널로 포커스 이동.
# 끝에 Enter를 안 붙이므로, 질문을 덧붙여 직접 제출할 수 있다.
# 마크된 패널이 없으면 상태줄에 경고한다.
bind -T copy-mode-vi Y send -X copy-pipe-and-cancel "tmux load-buffer -b agent -; if [ $(tmux display-message -p '#{pane_marked_set}') = 1 ]; then tmux paste-buffer -t '{marked}' -b agent -p -d; tmux select-pane -t '{marked}'; else tmux display-message 'no marked pane — press prefix+m on the agent pane'; fi"
```

동작을 조각내면:

1. **`copy-pipe-and-cancel "..."`** — copy-mode의 선택 영역을 뒤 명령의 **stdin으로 흘려보내고** copy-mode를 빠져나온다.
2. **`tmux load-buffer -b agent -`** — 그 stdin을 `agent`라는 tmux 버퍼에 적재한다. 임시 버퍼를 거치면 셸 인용부호 이스케이프 지옥을 피할 수 있다.
3. **`paste-buffer -t '{marked}' -b agent -p -d`** — marked 패널에 붙여넣는다. `-p`가 **bracketed paste**(터미널에 "이건 타이핑이 아니라 붙여넣기"라고 알리는 이스케이프 시퀀스로 감싸는 것)라, 여러 줄이 줄마다 실행/제출되지 않고 한 덩어리로 들어간다. `-d`는 붙여넣은 뒤 버퍼를 지운다.
4. **`select-pane -t '{marked}'`** — 그 패널로 포커스를 옮긴다. 어차피 질문을 덧붙여야 하니, 붙여넣자마자 에이전트 앞에 앉게 된다.
5. **끝에 Enter가 없다** — 출력만 꽂히고 제출은 안 된다. 그래서 "이 에러 왜 나?" 같은 질문을 붙여서 네가 직접 Enter를 친다.

새 흐름은 이렇게 된다.

```
prefix + [        copy-mode 진입
V, /검색          출력 선택 (아래 참고)
Y                 → 선택이 에이전트에 붙고, 포커스도 에이전트로
질문 타이핑 + Enter
```

> copy-mode에서 셸 출력 선택은 `V`(줄 단위 선택)와 `/`·`?`(검색 점프)를 쓰면 훨씬 빠르다. 문자 단위 `Space` + `hjkl`로 기어가지 말 것. 셸 패널은 스크롤백이 있어서 이 vi 모션이 온전히 먹힌다.

## `{marked}` — 어느 에이전트로 보낼지

에이전트를 여러 개 띄우면 "어느 패널로 보내지?"가 문제다. `{left}` 같은 위치 기반 타깃은 에이전트가 오른쪽에 있거나 다른 윈도우에 있으면 깨진다.

tmux의 정공법은 **marked 패널**이다. `select-pane -m`(기본 바인딩 `prefix + m`)으로 패널 하나를 "찜"해두면, 어디서 선택하든 `{marked}`로 해석된다.

```
prefix + m   →  현재 초점 에이전트 패널을 마크
             →  이후 Y는 위치·윈도우 무관하게 그 패널로 전송
             →  초점을 바꾸려면 다른 패널에서 다시 prefix + m
```

마크된 패널이 없을 때 그냥 실패하면 "왜 안 되지?"가 되므로, 위 바인딩은 `#{pane_marked_set}`(마크된 패널이 있으면 `1`) 포맷으로 분기해서 **상태줄에 경고**를 띄운다. `{marked}`는 tmux 포맷(`#{...}`)이 아니라 타깃 지정자라 이스케이프 걱정 없이 그대로 해석된다.

> **한계 하나**: `{marked}`는 전역 마크가 딱 하나다. 그래서 "한 에이전트에 집중, 가끔 전환" 워크플로에 맞는다. 여러 에이전트에 빠르게 번갈아 보내야 한다면 마킹 대신 `display-menu`로 매번 패널을 고르는 방식이 낫다.

## `y`/`Y` 대소문자 짝

같은 copy-mode에 `y`(소문자)를 vim 스타일 yank로 두면 짝이 깔끔해진다.

```tmux
bind -T copy-mode-vi y send -X copy-selection-and-cancel   # 복사 → 시스템 클립보드
bind -T copy-mode-vi Y ...                                  # 복사 → 에이전트로 전송
```

- **`y`** = 선택을 시스템 클립보드로 복사 (vim의 yank 습관 그대로)
- **`Y`** = 선택을 에이전트 패널로 전송

소문자는 기본 동작, 대문자는 확장 동작이라는 대소문자 규약이 살아 있어 외우기 쉽다. `y`가 클립보드까지 가려면 `set -g set-clipboard on`이 전제인데, 이건 [tmux 시스템 클립보드 — OSC52 / pbcopy / 한글](/posts/tmux/2026-06-10-tmux-clipboard-osc52-pbcopy-hangul/)에서 따로 다뤘다.

## 정리

- tmux copy-mode는 **셸 패널 전용**이다. nvim은 alternate screen이라 못 긁으니, 에디터 코드는 nvim yank나 vim-slime으로 보낸다 — **소스에 따라 레이어가 갈린다.**
- 셸 출력은 `Y` 바인딩 한 줄로 "선택 → 키 하나 → 에이전트에 붙고 포커스 이동"까지 줄어든다.
- 타깃은 `{marked}` 패널로 잡으면 위치·다중 에이전트에 강하다. 마크가 없으면 경고하게 해서 조용한 실패를 막는다.

이 바인딩은 에이전트에게 *내용을 보내는* 쪽이고, 반대로 여러 에이전트의 *상태를 감지*(working/blocked/done)하는 문제는 [tmux로 AI 에이전트 여러 개 관제하기](/posts/tmux/2026-07-09-tmux-ai-agent-status-detection/)에서 다뤘다 — 둘을 같이 쓰면 다중 에이전트 워크플로가 한결 매끄럽다. tmux 학습 전체 흐름은 [tmux 로드맵](/posts/tmux/2026-06-16-tmux-roadmap/)에 정리해 뒀다.
