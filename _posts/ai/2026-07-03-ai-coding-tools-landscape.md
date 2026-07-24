---
title       : "AI 코딩 도구 지형도 — Claude Code·OpenCode·Cursor·Codex·Aider 어떻게 다른가"
description : "AI 코딩 도구를 폼팩터(터미널·에디터·플러그인·클라우드), 모델 종속성, 과금 방식, 오픈소스 여부 네 축으로 비교한다. 같은 Codex 모델도 OpenCode와 공식 CLI에서 결과가 달라지는 이유까지 정리."
date        : 2026-07-03 21:35:00 +0900
updated     : 2026-07-23 10:00:46 +0900
categories  : [ai, "Claude Code"]
tags        : [claude-code, opencode, cursor, github-copilot, codex, aider, comparison]
pin         : false
hidden      : false
---

> 관련: [AI 로드맵](/posts/ai/2026-07-03-ai-roadmap/)의 **지형도·비교** 갈래 · [Claude Code 정리](/posts/ai/2025-10-24-claude-code/)

"AI 코딩 도구 뭐 써?"에 대한 답은 취향 이전에 **폼팩터**로 갈린다 — 터미널에서 도느냐, 에디터냐, 기존 에디터에 얹는 플러그인이냐, 클라우드에서 비동기로 도느냐. 이 글은 주요 도구를 네 축(폼팩터·모델 종속성·과금·오픈소스)으로 비교해 Claude Code가 어디 서 있는지, 언제 다른 게 나은지를 정리한다.

> 모델 버전명·정확한 월 요금은 몇 주 단위로 바뀐다. 아래 **구조적 특성**(폼팩터, 단일/다중 모델, 오픈/클로즈드)은 안정적이지만, 구체적 숫자는 도입 전 각 공식 페이지에서 재확인하는 게 맞다.
{: .prompt-warning }

## 한눈에 보는 표

| 도구 | 폼팩터 | 모델 | 과금 | 오픈소스 |
|---|---|---|---|---|
| **Claude Code** | 터미널 CLI (+IDE 확장·웹) | Claude 전용 | Claude 구독 or API 종량 | ✗ |
| **OpenCode** | 터미널 CLI (+웹·IDE 연동) | 다중(로컬 포함) | 연결한 구독·API·로컬 모델 | ✓ (MIT) |
| **Cursor** | 에디터 (VS Code 포크) | 다중(Claude·GPT·Gemini+자체) | 구독(+사용량 미터링) | ✗ |
| **GitHub Copilot** | 에디터 플러그인 (+agent·CLI·클라우드) | 다중(curated) | 구독(+크레딧 미터링) | ✗ |
| **OpenAI Codex** | 터미널 CLI (+클라우드·IDE) | OpenAI 전용 | ChatGPT 구독 or API 종량 | CLI만 ✓ |
| **Aider** | 터미널 CLI | 다중(로컬 Ollama 포함) | 모델 API만 지불 | ✓ (완전) |

## 축 1 — 어디서 도는가

가장 먼저 갈리는 지점이다.

- **터미널 에이전트**: Claude Code, OpenCode, OpenAI Codex(CLI), Aider. 셸에서 살고, 코드베이스를 읽고·고치고·테스트를 돌리는 멀티파일 에이전트 작업에 강하다. 에디터를 바꾸지 않는다.
- **에디터(IDE 포크)**: Cursor. VS Code를 포크해 자동완성·인라인 편집·에이전트를 한 UI에 담았다. "에디터 안에서 산다"면 여기.
- **플러그인**: GitHub Copilot. 기존 VS Code·JetBrains에 얹는 가장 가벼운 진입. GitHub 생태계와 밀착.
- **클라우드·비동기**: Codex(ChatGPT 경유), Copilot 클라우드 에이전트 등. 긴 작업을 백그라운드로 위임.

## 축 2 — 단일 모델 vs 모델 중립

- **한 벤더에 고정**: Claude Code(Claude만), Codex(OpenAI만). **도구를 고르는 것 = 모델 계열을 고르는 것**이다.
- **모델 중립**: OpenCode, Aider(로컬·오프라인 포함), Cursor, Copilot. 어려운 작업은 강한 모델로, 값싼 편집은 저렴한 모델로 라우팅하거나 벤더 락인을 피하고 싶을 때 유리.

Claude Code가 Claude 전용인 건 제약이자 강점이다 — 모델·도구·하네스가 한 팀에서 튜닝되니 에이전트 동작의 결이 일관된다. 대신 "다른 모델도 붙여보고 싶다"면 맞지 않는다.

## 축 3 — 구독 vs API 종량

- **구독 우선**(예측 가능한 정액 + 사용 허용량): Claude Code, Codex, Copilot, Cursor. 단 Cursor·Copilot은 무거운 사용을 크레딧/쿼터로 추가 미터링하는 방향으로 가고 있다.
- **순수 API 종량**: Aider(밑단 모델 API만 지불), 그리고 Claude Code·Codex의 API 키 경로. 저사용량이나 로컬 모델이면 가장 싸고, 헤비 유즈에선 튈 수 있다.
- **연결한 제공자를 따름**: OpenCode. ChatGPT·Copilot처럼 공식 지원하는 구독, 모델 API 키, OpenRouter, 로컬 모델 중 어떤 통로를 연결했는지가 과금과 한도를 결정한다.

## 축 4 — 오픈 vs 클로즈드

- **완전 오픈**: OpenCode(MIT), Aider(Apache-2.0).
- **부분 오픈**: OpenAI Codex — **CLI는 오픈소스**, 모델·클라우드는 프로프라이어터리. Claude Code(클로즈드 CLI)와 대비되는 지점.
- **클로즈드**: Claude Code, Cursor, Copilot.

## 같은 Codex인데 결과가 다른 이유

OpenCode에서 Codex 모델을 고르는 것과 Codex CLI를 실행하는 것은 같은 모델을 서로 다른 **하네스**로 구동하는 일이다. harness(원뜻은 말을 제어하는 마구)는 여기서 모델을 감싸고 작업 순서를 제어하는 실행 계층을 뜻한다.

```text
OpenCode CLI  ── OpenCode 하네스 ── 모델 제공자 ── Codex 모델
Codex CLI     ── OpenAI 하네스   ── OpenAI      ── Codex 모델
```

모델 이름이 같아도 다음 요소는 CLI가 결정한다.

- 시스템 프롬프트와 저장소 지침을 조합하는 방식
- 어떤 파일과 도구 결과를 컨텍스트에 넣는지
- 검색·편집·테스트를 반복하는 에이전트 루프
- 오래된 문맥을 버리는 pruning과 요약하는 compaction
- 명령 승인, 쓰기 가능 경로와 운영체제 sandbox

C++로 치면 같은 컴파일러 백엔드를 쓰더라도 드라이버·플래그·툴체인이 다르면 빌드 결과와 동작이 달라지는 것과 같다. 따라서 "Codex 모델을 쓴다"와 "Codex CLI를 쓴다"는 같은 말이 아니다.

[OpenCode는 ChatGPT Plus/Pro 연결을 공식 안내](https://opencode.ai/docs/providers/#openai)하므로 OpenCode를 통해 Codex를 쓰는 것 자체는 정상적인 전략이다. 여러 모델과 제공자를 바꾸거나 OpenCode의 TUI(text-based user interface, 텍스트 사용자 인터페이스)를 선호하면 OpenCode가 맞다. OpenAI 모델 하나만 고정하고 전용 sandbox·신기능·클라우드 연동을 우선하면 [Codex CLI](https://developers.openai.com/codex/cli)가 더 단순하다.

## 누구에게 맞나

- **Claude Code** — 터미널 네이티브, Claude 올인, 대규모 멀티파일 리팩터·긴 에이전트 루프.
- **OpenCode** — 터미널 네이티브, 여러 제공자·로컬 모델 전환, 오픈소스와 설정 이탈성 우선.
- **Cursor** — 기본값 격 AI IDE. 에디터 안 UX가 가장 좋고 다중 모델.
- **Copilot** — 팀·엔터프라이즈 안전한 선택, GitHub 통합 최상, 진입 요금 최저.
- **Codex** — Claude Code의 OpenAI 생태계 쌍둥이. 오픈 CLI, GPT 모델, 클라우드 위임 강함.
- **Aider** — 오픈소스·git 우선·아무 모델·오프라인 가능·무료를 원하는 사람.

## 결론

폼팩터가 첫 갈림길이다. **에디터를 떠나기 싫으면** Cursor나 Copilot, **셸에서 에이전트를 돌리고 싶으면** Claude Code·OpenCode·Codex·Aider. 그다음이 모델 선택이다 — Claude에 올인할지(Claude Code), OpenAI에 올인할지(Codex), 아무 모델이나 갈아끼울지(OpenCode·Aider).

이 블로그가 Claude Code를 다루는 이유는 단순하다 — 터미널 에이전트 결이 개발 워크플로(셸·git·tmux)와 자연스럽게 붙고, 모델·도구가 한 팀에서 튜닝돼 동작이 예측 가능하기 때문이다. 설치·기능부터는 [Claude Code 정리](/posts/ai/2025-10-24-claude-code/)로, 전체 학습 경로는 [AI 로드맵](/posts/ai/2026-07-03-ai-roadmap/)으로 이어진다.
