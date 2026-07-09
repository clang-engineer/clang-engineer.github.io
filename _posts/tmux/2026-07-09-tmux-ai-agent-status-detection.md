---
title       : "tmux로 AI 에이전트 여러 개 관제하기 — herdr 대신 훅 기반 플러그인을 고른 이유"
description : "AI 코딩 에이전트를 여러 개 굴릴 때 working/blocked/done을 자동 감지하는 법. 전용 멀티플렉서(herdr)와 훅 기반 tmux 플러그인을 비교하고, tmux에 익숙한 사람에게 왜 후자가 맞는지 정리."
date        : 2026-07-09 11:00:00 +0900
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

이걸 그대로 구현한 tmux 플러그인이 이미 있다. 1순위는 [`accessd/tmux-agent-indicator`](https://github.com/accessd/tmux-agent-indicator).

- 패널별 **running / needs-input / done** 상태를 **패널 테두리 색·윈도우 제목 색·상태바 아이콘**으로 표시
- Claude Code, Codex, 커스텀 에이전트 지원
- **폴링·출력 파싱이 아니라 Claude Code 훅으로 상태를 직접 받는다** — 설치 시 `~/.claude/settings.json`의 `UserPromptSubmit`·`PermissionRequest`·`Stop` 훅을 갱신해 상태 전환을 정확히 잡는다
- 상태는 해당 패널/윈도우에 포커스하거나 다음 전환이 일어날 때 리셋된다

핵심 장점은 두 가지다. 출력 긁는 herdr 방식보다 **정확하고**, 무엇보다 **tmux 단축키와 환경을 하나도 건드리지 않는다.** "에이전트를 herdr 안에서 써야 한다"는 강제도 없다. 부러웠던 그 기능만 쏙 흡수하는 셈이다.

### 대안 (목적별)

같은 문제를 조금씩 다른 각도에서 푸는 플러그인들이다.

| 도구 | 성격 |
|---|---|
| [`accessd/tmux-agent-indicator`](https://github.com/accessd/tmux-agent-indicator) | **1순위.** 패널 테두리·제목·상태바로 상태 표시. 훅 기반이라 정확 |
| [`hiroppy/tmux-agent-sidebar`](https://github.com/hiroppy/tmux-agent-sidebar) | 전 세션·윈도우의 에이전트를 사이드바에서 실시간 모니터 + 데스크톱 알림 (herdr 사이드바 컨셉에 가장 근접) |
| [`samleeney/tmux-agent-status`](https://github.com/samleeney/tmux-agent-status) | 어느 세션이 working/idle인지 상태줄에 요약 |
| `flavio87/tap-to-tmux` | 에이전트가 주목을 필요로 할 때 폰으로 알림(ntfy/Slack). 원격 서버 작업 시 유용 |

한 패널씩 상태를 눈에 띄게 하고 싶으면 **indicator**, 전체를 한 화면에서 감시하고 싶으면 **sidebar**, 폰까지 알림을 받고 싶으면 **tap-to-tmux**를 얹는 식으로 조합하면 된다.

### 설치

[TPM](https://github.com/tmux-plugins/tpm)(Tmux Plugin Manager)을 쓴다면 한 줄이면 된다.

```tmux
# ~/.tmux.conf
set -g @plugin 'accessd/tmux-agent-indicator'
```

추가한 뒤 `prefix + I`로 설치하면 플러그인이 Claude Code 훅까지 함께 세팅한다.

> 이미 `tmux-themepack` 같은 **테마 플러그인**을 쓰고 있다면 주의할 점이 하나 있다. 테마가 상태줄(status-line)과 패널 테두리(pane-border) 스타일을 이미 소유하고 있어서, agent-indicator의 표시와 충돌하거나 로드 순서에 따라 한쪽이 덮일 수 있다. 도입 후 상태 표시가 안 보이면 플러그인 로드 순서와 `pane-border-format`·`pane-border-status` 설정을 먼저 점검하자.
{: .prompt-warning }

## 교훈

이 결정에서 일반화할 만한 원칙 셋.

1. **멀티플렉서를 중첩하지 마라.** herdr과 tmux는 둘 다 패널·세션을 관리한다. 겹치면 prefix 충돌로 반드시 마찰이 생긴다. 역할이 겹치는 도구는 병렬로 두거나, 한쪽으로 통일한다.
2. **익숙한 도구를 통째로 갈아엎기 전에, 부러운 그 기능만 흡수할 방법을 먼저 찾아라.** 여기서는 "훅 기반 tmux 플러그인"이 herdr 핵심 이점을 근육기억 손실 0으로 흡수했다.
3. **감지는 추측(출력 파싱)보다 통보(훅)가 정확하다.** 대상이 상태를 직접 알려줄 방법이 있다면, 밖에서 긁어 추측하는 방식은 거의 항상 열등하다.

tmux를 이미 잘 쓰고 있다면, AI 에이전트 관제를 위해 새 멀티플렉서로 이주할 이유는 거의 없다. 필요한 건 이주가 아니라 플러그인 한 줄이다.

> tmux 학습 전체 흐름은 [tmux 로드맵](/posts/tmux/2026-06-16-tmux-roadmap/)에 정리해 뒀다.
{: .prompt-tip }
