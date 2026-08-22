---
title       : "AI 코딩 도구 지형도 — Claude Code·OpenCode·Cursor·Codex·Aider 어떻게 다른가"
description : "AI 코딩 도구를 사용 환경(터미널·에디터·플러그인·클라우드), 모델 종속성, 과금 방식, 오픈소스 여부 네 축으로 비교한다. 같은 Codex 모델도 OpenCode와 공식 CLI에서 결과가 달라지는 이유까지 정리한다."
date        : 2026-07-03 21:35:00 +0900
updated     : 2026-08-22 17:30:00 +0900
categories  : [ai, "Claude Code"]
tags        : [claude-code, opencode, cursor, github-copilot, codex, aider, comparison]
pin         : false
hidden      : false
---

> 관련: [AI 로드맵](/posts/ai/2026-07-03-ai-roadmap/)의 **지형도·비교** 갈래 · [Claude Code 정리](/posts/ai/2025-10-24-claude-code/)

"AI 코딩 도구 뭐 써?"에 대한 답은 취향 이전에 **어디에서 작업하고 싶은가**에서 갈린다. 터미널에서 직접 에이전트를 돌릴지, 에디터 안에서 쓸지, 기존 에디터에 플러그인으로 붙일지, 클라우드에 비동기 작업을 맡길지에 따라 선택지가 달라진다. 이 글은 주요 도구를 사용 환경·모델 종속성·과금·오픈소스 여부 네 축으로 비교해 Claude Code가 어디에 있고 언제 다른 도구가 나은지를 정리한다.

> 모델 버전명·정확한 월 요금·지원 기능은 자주 바뀐다. 아래 비교는 2026-08 기준이며, 사용 환경·단일/다중 모델·오픈/클로즈드 같은 구조적 특성을 중심으로 본다. 구체적인 모델과 가격은 도입 전에 각 공식 문서에서 다시 확인한다.
{: .prompt-warning }

## 한눈에 보는 표

| 도구 | 사용 환경 | 모델 | 과금 | 오픈소스 |
|---|---|---|---|---|
| **Claude Code** | 터미널 CLI (+IDE 확장·웹) | Claude 전용 | Claude 구독 또는 API 종량 | ✗ |
| **OpenCode** | 터미널 CLI (+웹·IDE 연동) | 다중(로컬 포함) | 연결한 구독·API·로컬 모델 | ✓ (MIT) |
| **Cursor** | 에디터(VS Code 기반) | 다중(Claude·GPT·Gemini 등) | 구독(+사용량 기반 한도) | ✗ |
| **GitHub Copilot** | 에디터 플러그인 (+Agent·CLI·클라우드) | 여러 모델 중 선택 | 구독(+사용량 기반 한도) | ✗ |
| **OpenAI Codex** | 터미널 CLI (+클라우드·IDE) | OpenAI 전용 | ChatGPT 구독 또는 API 종량 | CLI만 ✓ |
| **Aider** | 터미널 CLI | 다중(로컬 Ollama 포함) | 사용하는 모델 API 비용 | ✓ |

## 축 1 — 어디서 도는가

가장 먼저 갈리는 지점이다.

- **터미널 에이전트**: Claude Code, OpenCode, OpenAI Codex CLI, Aider. 셸에서 코드베이스를 읽고 고치며 테스트를 실행하는 여러 파일 단위의 에이전트 작업에 강하다. 기존 에디터를 바꿀 필요가 없다.
- **에디터**: Cursor. VS Code 계열 에디터 안에 자동완성·인라인 편집·에이전트 기능을 통합한다. 작업 흐름을 에디터 안에 모으고 싶을 때 맞는다.
- **플러그인**: GitHub Copilot. 기존 VS Code·JetBrains 등에 붙여 쓰며 GitHub 생태계와의 통합이 강하다.
- **클라우드·비동기**: Codex 클라우드 작업, Copilot의 클라우드 에이전트 등. 긴 작업을 원격 환경에 맡기고 나중에 결과를 받는 방식이다.

## 축 2 — 단일 모델 vs 여러 모델

- **한 벤더에 고정**: Claude Code는 Claude, Codex는 OpenAI 모델을 중심으로 동작한다. **도구를 고르는 것이 모델 계열 선택과 연결된다.**
- **여러 모델 선택**: OpenCode, Aider, Cursor, Copilot. 작업에 따라 모델을 바꾸거나 특정 벤더에 고정되지 않고 싶을 때 유리하다.

Claude Code가 Claude 전용인 것은 제약이자 강점이다. 모델과 도구가 같은 생태계에서 함께 설계되므로 에이전트 동작의 일관성을 기대할 수 있지만, 다른 모델을 자유롭게 바꿔 쓰려면 맞지 않는다.

## 축 3 — 구독 vs API 종량

- **구독 중심**: Claude Code, Codex, Copilot, Cursor. 정액 구독 안에서 일정 사용량을 제공하되 제품에 따라 추가 사용량이나 크레딧 정책이 붙는다.
- **API 종량 중심**: Aider와 Claude Code·Codex의 API 키 사용 경로. 사용량이 적으면 비용을 세밀하게 통제할 수 있지만 사용량이 많으면 비용 변동이 커질 수 있다.
- **연결한 제공자를 따름**: OpenCode. 공식 지원 구독, 모델 API 키, OpenRouter, 로컬 모델 등 어떤 제공자를 연결했는지에 따라 과금과 한도가 결정된다.

## 축 4 — 오픈 vs 클로즈드

- **오픈소스 도구**: OpenCode, Aider.
- **부분 오픈**: OpenAI Codex는 CLI가 오픈소스이고 모델·클라우드 서비스는 별도다.
- **클로즈드 제품**: Claude Code, Cursor, Copilot.

오픈소스 여부는 모델의 공개 여부와 다른 축이다. CLI가 오픈소스여도 사용하는 모델이나 원격 서비스는 공개되지 않을 수 있다.

## 같은 Codex 모델인데 결과가 다른 이유

OpenCode에서 Codex 계열 모델을 선택하는 것과 Codex CLI를 실행하는 것은 같은 모델을 서로 다른 **하네스(harness)** 에서 구동하는 일이다. 여기서 하네스는 모델을 감싸고 컨텍스트·도구·권한·작업 반복을 조율하는 실행 환경을 뜻한다.

```text
OpenCode CLI  ── OpenCode 하네스 ── 모델 제공자 ── Codex 계열 모델
Codex CLI     ── OpenAI 하네스   ── OpenAI      ── Codex 계열 모델
```

모델 계열이 같아도 다음 요소는 도구가 결정한다.

- 시스템 프롬프트와 저장소 지침을 조합하는 방식
- 어떤 파일과 도구 결과를 컨텍스트에 넣는지
- 검색·편집·테스트를 반복하는 에이전트 루프
- 오래된 문맥을 제거하거나 요약해 컨텍스트를 관리하는 방식
- 명령 승인 정책, 쓰기 가능한 경로, 실행 격리(sandbox) 방식

C++로 치면 같은 컴파일러 백엔드를 쓰더라도 드라이버·플래그·툴체인이 다르면 실제 빌드 과정이 달라지는 것과 비슷하다. 따라서 "Codex 모델을 쓴다"와 "Codex CLI를 쓴다"는 같은 말이 아니다.

OpenCode는 OpenAI를 포함한 여러 제공자를 연결하는 구조다. 여러 모델과 제공자를 바꾸거나 OpenCode의 TUI(Text-based User Interface, 터미널 사용자 인터페이스)를 선호하면 OpenCode가 맞다. OpenAI 모델과 전용 CLI·클라우드 연동을 한 생태계에서 쓰고 싶다면 Codex가 더 단순하다.

## 누구에게 맞나

- **Claude Code** — 터미널 중심으로 Claude를 사용하고, 여러 파일에 걸친 긴 에이전트 작업을 자주 하는 경우.
- **OpenCode** — 터미널에서 여러 제공자·로컬 모델을 바꿔 쓰고, 오픈소스 도구와 설정 자유도를 중시하는 경우.
- **Cursor** — 에디터 안에서 자동완성·편집·에이전트 기능을 한 흐름으로 쓰고 싶은 경우.
- **Copilot** — 기존 IDE와 GitHub 중심의 팀 개발 흐름을 유지하면서 AI 기능을 붙이고 싶은 경우.
- **Codex** — OpenAI 모델과 CLI·클라우드 작업을 같은 생태계에서 쓰고 싶은 경우.
- **Aider** — Git 중심의 터미널 워크플로와 다양한 모델·로컬 모델 사용을 중시하는 경우.

## 결론

첫 갈림길은 사용 환경이다. **에디터 안에서 계속 일하고 싶으면** Cursor나 Copilot, **셸에서 에이전트를 직접 돌리고 싶으면** Claude Code·OpenCode·Codex·Aider가 자연스럽다. 그다음에는 모델 선택 자유도, 과금 방식, 오픈소스 여부를 비교하면 된다.

이 블로그는 터미널 에이전트를 개발 워크플로(셸·Git·tmux)와 연결하는 관점에서 Claude Code를 중심으로 다룬다. 설치·기능부터는 [Claude Code 정리](/posts/ai/2025-10-24-claude-code/)로, 전체 학습 경로는 [AI 로드맵](/posts/ai/2026-07-03-ai-roadmap/)으로 이어진다.
