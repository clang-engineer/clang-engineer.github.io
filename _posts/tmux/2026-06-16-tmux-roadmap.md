---
title       : "tmux 로드맵 — 세션 관리의 핵심과 선택 확장"
description : "tmux의 세션·윈도우·패널 구조에서 시작해 기본 설정, 플러그인 사용, 세션 워크플로까지 핵심 경로를 잡고, 플러그인 제작·AI 에이전트 관제·세션 피커·트러블슈팅은 독립 Branch로 분리한 학습 지도."
date        : 2026-06-16 15:00:00 +0900
updated     : 2026-09-06 12:35:00 +0900
categories  : [tmux, "개요·인덱스"]
tags        : [roadmap, terminal]
pin         : false
hidden      : false
---

tmux는 **Terminal Session을 오래 유지하고 여러 Shell 작업공간을 구조화하는 도구**다. 이 로드맵의 핵심은 기능을 많이 아는 것이 아니라, 먼저 `session → window → pane` 구조를 잡고 그 위에 필요한 설정과 확장을 올리는 것이다.

플러그인을 직접 만들거나 AI 에이전트를 관제하는 일은 tmux를 잘 쓰기 위한 필수 다음 단계가 아니다. 따라서 핵심 학습 경로와 선택 Branch를 분리한다.

```text
[핵심 경로]
구조·기본 조작
   ↓
매일 쓰는 설정
   ↓
플러그인 사용
   ↓
세션 워크플로 자동화

[선택 Branch]
├─ Plugin 제작
├─ AI Agent 관제
├─ 즉석 Session Picker
└─ 완성형 배포판 채택

[Troubleshooting]
└─ Clipboard / attach / True Color / hook / pane 동작
```

Terminal·PTY 자체의 원리는 [Terminal 로드맵](../terminal/2026-09-05-terminal-roadmap.md), Shell의 Job·Process 생존은 [셸 로드맵](../shell/2026-07-03-shell-roadmap.md)에서 다룬다.

## 한눈에 보기

| 구역 | 핵심 질문 | 성격 |
|---|---|---|
| 1. 구조 | session·window·pane은 무엇이고 Process와 어떻게 연결되나 | 필수 |
| 2. 설정 | 기본값 중 무엇을 바꾸면 일상 사용성이 좋아지나 | 필수 |
| 3. Plugin 사용 | tmux 자체 기능 밖의 확장을 어떻게 얹나 | 필수에 가까운 선택 |
| 4. Session workflow | 반복되는 작업공간을 어떻게 재현하고 다시 들어가나 | 필요할 때 |
| Branch A | Plugin은 내부에서 어떻게 만들어지나 | 제작자용 |
| Branch B | 여러 AI Agent 상태를 tmux에서 어떻게 관제하나 | 응용 |
| Branch C | Directory·repo를 즉석 Session으로 어떻게 전환하나 | Tool |
| Appendix | 특정 증상을 어떻게 해결하나 | Troubleshooting |

## 1. 구조 — session·window·pane부터

첫 목표는 단축키 암기가 아니라 **tmux가 무엇을 소유하는지** 구분하는 것이다.

```text
tmux server
└─ session
   └─ window
      └─ pane
         └─ shell / process
```

| 글 | 역할 |
|---|---|
| [tmux 정리본 — Cheat Sheet + 사용 가이드](./2021-11-30-tmux-config.md) | 구조·설치·기본 조작·target 문법을 한 장에서 잡는 입문 Reference |
| [tmux엔 왜 pane 병합이 없을까](./2026-07-13-tmux-pane-is-a-process-no-merge.md) | pane을 단순 화면 조각이 아니라 Process가 붙은 실행 단위로 보는 정신 모델 |

> 📎 빠른 단축키 참조는 [tmux cheatsheet](https://github.com/clang-engineer/devkit/blob/main/cheatsheets/tmux.md)를 사용한다. Roadmap은 키 목록보다 구조와 이동 경로를 설명한다.
{: .prompt-tip }

## 2. 설정 — 매일 체감되는 기본값만

구조가 잡힌 뒤에는 설정 파일 전체를 외우지 않고 반복적으로 불편한 지점만 고친다.

| 글 | 역할 |
|---|---|
| [tmux 유용한 설정 정리](./2026-02-21-tmux-tips.md) | ESC delay·True Color·mouse·path 유지·vi copy mode처럼 체감이 큰 설정 |

완성형 설정 배포판을 통째로 채택하고 싶다면 직접 조립과 다른 선택지다.

- [Oh My Tmux!](./2026-07-12-oh-my-tmux.md) — 잘 정리된 설정 묶음을 상속하는 Tool 선택

이 선택은 “더 높은 단계”가 아니라 **직접 구성 ↔ 배포판 상속**의 대안 관계다.

## 3. Plugin 사용 — tmux 밖의 기능을 얹는다

Plugin을 쓴다는 것은 tmux 학습의 새로운 계층이라기보다 **기본 CLI·option·hook 위에 이미 만들어진 확장을 재사용하는 것**이다.

| 글 | 역할 |
|---|---|
| [tmux 설정 & 플러그인 설명](./2025-11-17-tmux-tpm.md) | TPM 설치와 대표 Plugin을 사용하는 기본 경로 |
| [필수 그다음 — 요즘 얹는 tmux 플러그인](./2026-07-11-tmux-plugins-beyond-essentials.md) | 테마·추출·yank 등 추가 Plugin을 목적별로 고르는 Tool/Comparison |

여기까지만 알아도 대부분의 tmux 사용에는 충분하다. **Plugin 제작은 필수 후속 단계가 아니다.**

## 4. Session workflow — 작업공간을 다시 만드는 문제

반복되는 프로젝트 레이아웃을 매번 손으로 만들기 시작했다면 Session Manager가 필요해진다.

```text
Session을 오래 유지한다
→ tmux 자체

같은 Layout을 선언해 다시 만든다
→ smug / tmuxp / tmuxinator

이미 존재하는 Session·Directory를 빠르게 고른다
→ sesh (Branch C)
```

| 글 | 역할 |
|---|---|
| [tmux 세션 부트스트랩 — 세션 매니저와 그 속살](./2026-02-21-tmux-bootstrap.md) | 선언형 Session Manager가 해결하는 문제와 내부 tmux 명령을 함께 이해 |
| [smug — 미니멀 tmux 세션 매니저](./2026-07-11-smug-minimal-tmux-session-manager.md) | smug를 선택했을 때의 실제 구성 Tool 문서 |

이 단계는 모든 사용자의 필수 진도가 아니다. **동일 작업공간을 반복해서 만드는 문제가 생겼을 때** 들어온다.

## Branch A — Plugin을 직접 만든다

Plugin 사용과 제작은 역할이 다르다. 제작이 필요할 때만 Zoom-in한다.

| 글 | 역할 |
|---|---|
| [tmux 플러그인은 어떻게 만드나 — CLI가 곧 API](./2026-07-09-tmux-plugin-authoring.md) | TPM·`.tmux` 진입 Script·tmux CLI·hook을 하나의 동작 사슬로 설명하는 제작 가이드 |

핵심 모델은 단순하다.

```text
TPM
→ Plugin의 *.tmux 실행
→ Shell Script
→ tmux CLI 호출
→ 실행 중 tmux server 상태 변경
```

## Branch B — AI Agent 관제

이 Branch는 tmux 자체를 배우는 것이 아니라 **이미 익숙한 tmux를 AI 작업 환경에 적용하는 사례**다.

| 글 | 역할 |
|---|---|
| [tmux로 AI 에이전트 여러 개 관제하기](./2026-07-09-tmux-ai-agent-status-detection.md) | 전용 Multiplexer와 tmux Hook 기반 방식을 비교하고 상태 감지 정확도·UI 충돌을 기준으로 선택 |
| [tmux 선택을 AI 에이전트 패널로 보내기](./2026-07-11-tmux-send-selection-to-agent-pane.md) | copy-mode 선택을 marked pane으로 전달하는 구체적 Workflow |

AI 도구 자체의 사용 흐름은 [AI 로드맵](../ai/2026-07-03-ai-roadmap.md)의 책임이다.

## Branch C — 즉석 Session 전환

| 글 | 역할 |
|---|---|
| [sesh — 즉석 tmux 세션 전환](./2026-07-12-sesh-tmux-session-picker.md) | Layout 선언과 다른 문제인 Directory·repo 기반 즉석 Session 선택 |

`sesh`는 smug와 경쟁하는 “다음 버전”이 아니다. **Layout 재현 ↔ 목적지 선택**이라는 다른 축이다.

## Appendix — Troubleshooting

다음 글은 학습 순서가 아니라 같은 증상을 만났을 때 바로 들어간다.

| 문제 | 글 |
|---|---|
| System Clipboard·OSC52·pbcopy·한글 | [tmux 시스템 클립보드](./2026-06-10-tmux-clipboard-osc52-pbcopy-hangul.md) |
| Terminal을 열 때마다 새 Session 생성 | [auto attach 함정](./2026-07-03-tmux-auto-attach-new-session-every-time.md) |
| `repeat` key binding이 pane 이동을 삼킴 | [repeat flag 문제](./2026-07-14-tmux-repeat-flag-swallows-pane-nav.md) |
| True Color 감지·`TERM` 경계 | [True Color 감지](./2026-07-14-tmux-truecolor-detection.md) |
| Hook·Window ID·kill-pane 동작 | [Hook과 Window ID](./2026-07-11-tmux-hook-window-id-and-kill-pane.md) |

## 다른 Roadmap과의 경계

- **Terminal/PTY/TERM 원리** → [Terminal](../terminal/2026-09-05-terminal-roadmap.md)
- **Shell Job·`nohup`·Process 생존** → [Shell](../shell/2026-07-03-shell-roadmap.md)
- **AI Coding Agent 자체의 사용·MCP·API** → [AI](../ai/2026-07-03-ai-roadmap.md)
- **dotfiles로 `.tmux.conf`를 재현하는 문제** → [dotfiles](../shell/2026-07-08-dotfiles-roadmap.md)

> **tmux의 핵심 경로는 구조 → 설정 → Plugin 사용 → 필요할 때 Session workflow다. 제작·AI 관제·피커는 그 위의 독립 Branch이지 필수 진도가 아니다.**
