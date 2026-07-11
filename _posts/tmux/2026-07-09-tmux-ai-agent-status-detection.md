---
title       : "tmux로 AI 에이전트 여러 개 관제하기 — herdr 대신 훅 기반 플러그인을 고른 이유"
description : "AI 코딩 에이전트를 여러 개 굴릴 때 working/blocked/done을 자동 감지하는 법. 전용 멀티플렉서(herdr)와 훅 기반 tmux 플러그인을 비교하고, tmux에 익숙한 사람에게 왜 후자가 맞는지 정리."
date        : 2026-07-09 11:00:00 +0900
updated     : 2026-07-11
categories  : [tmux, "스크립트·플러그인"]
tags        : [tmux, claude-code, ai-agent, hooks, terminal, guide]
pin         : false
hidden      : false
---

Claude Code, Codex 같은 AI 코딩 에이전트를 **동시에 여러 개** 굴리기 시작하면 새로운 종류의 피로가 생긴다. 각 에이전트가 지금 **일하는 중(working)인지, 내 답을 기다리며 멈춰 있는지(blocked), 작업을 끝냈는지(done)**를 패널을 하나씩 넘겨가며 눈으로 확인해야 하는 것이다. 에이전트가 3~4개만 돼도 이 확인 자체가 일이 된다.

이 문제를 풀어주는 도구로 **herdr** 같은 "에이전트 관제용 멀티플렉서"가 있다(이름은 "herd" — 가축 떼를 몬다 — 에서 왔다. 에이전트 떼를 모는 도구라는 뜻). 에이전트들의 상태를 자동 감지해 색으로 표시하고 데스크톱 알림까지 준다. 매력적이다.

하지만 **이미 tmux에 익숙하다면 herdr을 도입하는 순간이 오히려 손해**일 수 있다. 이 글은 왜 그런지, 그리고 대신 무엇을 쓰면 되는지를 정리한다.

## 핵심 딜레마 — 감지는 "실행 위치"에 종속된다

herdr의 상태 감지에는 전제가 하나 있다: **에이전트가 herdr 패널 안에서 실행될 때만** 작동한다는 것.

herdr은 자기가 띄운 패널의 프로세스명과 출력을 직접 들여다보는 방식으로 상태를 판단한다. 그래서 에이전트를 herdr **밖**(tmux 패널이나 그냥 터미널)에서 실행하면, herdr은 그 존재 자체를 모른다. working/blocked/done을 표시할 수가 없다.

즉 herdr의 이점을 보려면 **"에이전트 작업은 herdr 안에서"가 강제된다.** 그런데 herdr은 패널·세션을 관리한다는 점에서 **tmux와 역할이 정면으로 겹치는 멀티플렉서**다. 여기서 선택지가 갈린다.

- **herdr로 tmux를 대체한다** → 그동안 손에 익힌 tmux 단축키·레이아웃·플러그인을 herdr 방식으로 다시 배워야 한다.
- **tmux 안에서 herdr을 중첩한다** → 멀티플렉서 두 개를 겹치는 것이라 prefix 키가 충돌하고(둘 다 `Ctrl-b`류를 씀) 키 입력이 꼬인다. 권장되지 않는다.

결국 **"익숙한 tmux 단축키 유지"와 "herdr의 자동 감지"를 둘 다 완벽히 갖긴 어렵다.** tmux 단축키가 이미 근육기억이 된 사람에게 이 트레이드오프는 꽤 나쁘다.

## 왜 감지가 까다로운가 — "완료"를 무엇으로 판단할 것인가

감지 방식을 이해하면 왜 도구마다 정확도가 다른지 보인다. 핵심은 "에이전트가 끝났다"를 무엇으로 판단하느냐다.

- **쉬운 경우** — 에이전트가 명령을 끝내고 셸 프롬프트로 돌아온다. 이건 tmux의 `monitor-silence`(일정 시간 출력이 없으면 알림) 같은 기능으로도 유휴 상태를 잡을 수 있다.
- **어려운 경우** — 에이전트가 살아있는 REPL(대화형 프로세스) 안에서 "작업 완료" 혹은 "질문 있음" 상태로 멈춘다. 프로세스는 계속 살아 있고 출력도 간헐적이라, 유휴만으로는 판단이 안 된다. 결국 `capture-pane`으로 패널 출력을 긁어서 **텍스트 패턴 매칭**을 해야 한다.

herdr이 파는 값어치가 바로 이 어려운 경우를 에이전트별로 튜닝된 로직으로 처리해준다는 점이다. **하지만 출력 파싱은 본질적으로 부정확하다.** 에이전트가 출력 포맷을 바꾸거나, 프롬프트 문구가 조금만 달라져도 감지가 깨진다.

더 정확한 길이 있다.

## 정답 — tmux를 그대로 두고, 훅 기반 플러그인을 얹는다

출력을 긁어 추측하는 대신, **에이전트가 상태 변화를 직접 알려주게** 하면 된다. Claude Code는 생명주기 시점마다 훅(hook)을 발화한다 — 프롬프트 제출(UserPromptSubmit), 권한 요청(PermissionRequest), 작업 종료(Stop). 이 훅을 받아 패널 상태를 갱신하면 파싱 없이 정확하게 잡힌다.

이걸 그대로 구현한 tmux 플러그인이 이미 있다. 가장 손이 덜 가는 인라인 방식이 [`accessd/tmux-agent-indicator`](https://github.com/accessd/tmux-agent-indicator)다 (herdr의 대시보드 경험을 원한다면 뒤의 [sidebar vs indicator](#sidebar-vs-indicator--어떤-걸-먼저-고를까) 판단을 먼저 보자).

- 패널별 **running / needs-input / done** 상태를 **패널 테두리 색·윈도우 제목 색·상태바 아이콘**으로 표시
- Claude Code, Codex, 커스텀 에이전트 지원
- **폴링·출력 파싱이 아니라 Claude Code 훅으로 상태를 직접 받는다** — 설치 시 `~/.claude/settings.json`의 `UserPromptSubmit`·`PermissionRequest`·`Stop` 훅을 갱신해 상태 전환을 정확히 잡는다
- 상태는 해당 패널/윈도우에 포커스하거나 다음 전환이 일어날 때 리셋된다

핵심 장점은 두 가지다. 출력 긁는 herdr 방식보다 **정확하고**, 무엇보다 **tmux 단축키와 환경을 하나도 건드리지 않는다.** "에이전트를 herdr 안에서 써야 한다"는 강제도 없다. 부러웠던 그 기능만 쏙 흡수하는 셈이다.

### 대안 (목적별)

같은 문제를 조금씩 다른 각도에서 푸는 플러그인들이다.

| 도구 | 성격 |
|---|---|
| [`accessd/tmux-agent-indicator`](https://github.com/accessd/tmux-agent-indicator) | 패널 테두리·제목·상태바로 **인라인** 상태 표시. 훅 기반이라 정확 |
| [`hiroppy/tmux-agent-sidebar`](https://github.com/hiroppy/tmux-agent-sidebar) | 전 세션·윈도우의 에이전트를 **별도 사이드바 패널**에서 실시간 모니터 (herdr 사이드바 컨셉에 가장 근접) |
| [`samleeney/tmux-agent-status`](https://github.com/samleeney/tmux-agent-status) | 어느 세션이 working/idle인지 상태줄에 요약 |
| `flavio87/tap-to-tmux` | 에이전트가 주목을 필요로 할 때 폰으로 알림(ntfy/Slack). 원격 서버 작업 시 유용 |

### sidebar vs indicator — 어떤 걸 먼저 고를까

실제로 herdr 대체로 매일 쓸 거라면 이 둘 중 하나로 좁혀진다. 그런데 **"herdr처럼 대시보드로 보고 싶다"**는 목적과, 이미 `tmux-themepack` 같은 **테마 플러그인**을 쓰는 상황이 겹치면 선택이 갈린다.

핵심 통찰은 하나다 — **UI를 어디에 그리느냐가 테마 충돌 여부를 가른다.**

- **별도 패널에 그리면**(sidebar) 테마가 소유한 상태줄·패널 테두리를 건드리지 않는다 → 충돌 없음
- **기존 요소를 재스타일하면**(indicator의 패널 테두리 색) 테마와 같은 속성을 놓고 싸운다 → 색이 덮이거나 로드 순서 문제

| | `tmux-agent-sidebar` | `tmux-agent-indicator` |
|---|---|---|
| UI 위치 | **별도 사이드바 패널** (`prefix+e` 현재 / `prefix+E` 전체) | 패널 테두리·제목 색 (인라인, 앰비언트) |
| herdr 느낌 | **가장 근접** — 전 세션·윈도우 대시보드 | 은근한 표시, 대시보드는 아님 |
| 테마(themepack) 충돌 | **없음** (별도 패널) | 패널 테두리 색 소유권 다툼 가능 |
| 런타임 | Rust 단일 바이너리 | bash 4+ |
| Claude Code 연동 | `/plugin marketplace add` + `/plugin install` | 설치 시 `~/.claude/settings.json`에 훅 자동 주입 |

트레이드오프는 대칭이다.

- **sidebar** — 대시보드 경험 + 테마 무충돌이 장점. 대신 Claude Code 연동을 `/plugin` 명령으로 한 번 더 해줘야 한다.
- **indicator** — 훅을 `settings.json`에 자동 주입해 연동이 더 매끄럽다. 대신 테마와 테두리 색이 충돌할 수 있다(아래 해결법 참고).

**결론:** herdr 같은 한눈 대시보드가 목적이고 테마를 지키고 싶다면 **sidebar부터**. "대시보드까진 필요 없고 색으로만 알려줘"라면 **indicator**. 폰 알림까지 원하면 **tap-to-tmux**를 위에 얹는다.

### 설치

[TPM](https://github.com/tmux-plugins/tpm)(Tmux Plugin Manager)을 쓴다면 둘 다 한 줄이면 된다.

**indicator** — 추가한 뒤 `prefix + I`로 설치하면 플러그인이 Claude Code 훅까지 함께 세팅한다.

```tmux
# ~/.tmux.conf
set -g @plugin 'accessd/tmux-agent-indicator'
```

**sidebar** — 플러그인 줄은 똑같이 한 줄이지만, Rust 단일 바이너리라 설치 방식이 조금 다르다.

```tmux
set -g @plugin 'hiroppy/tmux-agent-sidebar'
```

`prefix + I` 첫 설치 때 wizard가 pre-built 바이너리 다운로드를 제안한다 — 이걸 고르면 **Rust/cargo 없이** 끝난다(소스 빌드를 고를 때만 Rust 필요). Claude Code 연동도 indicator처럼 훅 자동 주입이 아니라, Claude Code 안에서 다음 두 줄을 직접 친다.

```text
/plugin marketplace add ~/.tmux/plugins/tmux-agent-sidebar
/plugin install tmux-agent-sidebar@hiroppy
```

> 이미 `tmux-themepack` 같은 **테마 플러그인**을 쓰면서 indicator를 고른다면 주의할 점이 있다. 테마가 패널 테두리(pane-border) 스타일을 이미 소유하고 있어서 indicator의 테두리 색과 충돌할 수 있다. indicator는 채널별 토글을 제공하니, 테두리는 끄고 상태바 아이콘만 쓰면 깔끔하게 피해 간다.
>
> ```tmux
> set -g @agent-indicator-border-enabled ''      # 빈 값 = 이 속성 적용 안 함 → 테마 테두리 유지
> set -g status-right '#{agent_indicator} ...'    # opt-in 변수만 상태바에 추가
> ```
>
> 애초에 테마를 하나도 안 건드리는 쪽을 원하면 sidebar가 정답이다(별도 패널이라 충돌 자체가 없다).
{: .prompt-warning }

> sidebar를 골랐다면 키 하나만 주의하면 된다. 전역 키는 `e`(현재 윈도우 토글)·`E`(전체 윈도우 토글) 둘뿐인데, `E`가 tmux 기본 `select-layout -E`를 덮는다. 게다가 이 토글 키는 **끄기가 안 되고 리바인드만 된다**(빈 값으로 두면 기본 `E`로 되돌아온다). 그러니 기본 `E`를 지키려면 토글 키를 다른 글자로 옮겨야 하는데, 여기서 요령은 **`e`/`E`의 대소문자 짝(소문자=현재, 대문자=전체)을 그대로 살려** 충돌 없는 글자로 통째로 옮기는 것이다. 예를 들어 `a`/`A`(니모닉: `a` = **A**gent):
>
> ```tmux
> set -g @sidebar_key 'a'       # 현재 윈도우 (기본 e에서 이동)
> set -g @sidebar_key_all 'A'   # 전체 윈도우 — 기본 E를 비워 select-layout -E 보존
> ```
>
> `@sidebar_key_all`만 옮기면 `e`/`A`가 되어 짝이 깨지니, 두 키를 함께 옮기는 편이 일관적이다.
>
> 참고로 `e`/`E`는 *보여주는 내용*(항상 전 세션·윈도우의 에이전트)이 아니라 *패널을 어느 윈도우에 띄우냐*만 가른다. 그리고 `@sidebar_auto_create`(기본 on)가 **새 윈도우를 만들 때마다** 사이드바를 자동으로 붙여줘서, 전체 토글 없이도 대시보드처럼 쓸 수 있다(윈도우 *전환* 시엔 안 붙는다).
{: .prompt-warning }

## 교훈

이 결정에서 일반화할 만한 원칙 셋.

1. **멀티플렉서를 중첩하지 마라.** herdr과 tmux는 둘 다 패널·세션을 관리한다. 겹치면 prefix 충돌로 반드시 마찰이 생긴다. 역할이 겹치는 도구는 병렬로 두거나, 한쪽으로 통일한다.
2. **익숙한 도구를 통째로 갈아엎기 전에, 부러운 그 기능만 흡수할 방법을 먼저 찾아라.** 여기서는 "훅 기반 tmux 플러그인"이 herdr 핵심 이점을 근육기억 손실 0으로 흡수했다.
3. **감지는 추측(출력 파싱)보다 통보(훅)가 정확하다.** 대상이 상태를 직접 알려줄 방법이 있다면, 밖에서 긁어 추측하는 방식은 거의 항상 열등하다.

tmux를 이미 잘 쓰고 있다면, AI 에이전트 관제를 위해 새 멀티플렉서로 이주할 이유는 거의 없다. 필요한 건 이주가 아니라 플러그인 한 줄이다.

이 글이 에이전트의 *상태를 감지*하는 쪽이라면, 반대로 에이전트에게 *셸 출력을 보내는* 쪽은 [tmux 선택을 AI 에이전트 패널로 보내기](/posts/tmux/2026-07-11-tmux-send-selection-to-agent-pane/)에서 다뤘다 — 둘을 같이 쓰면 다중 에이전트 워크플로가 매끄러워진다.

> tmux 학습 전체 흐름은 [tmux 로드맵](/posts/tmux/2026-06-16-tmux-roadmap/)에 정리해 뒀다.
{: .prompt-tip }
