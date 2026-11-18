---
title       : "AI 코딩 도구 지형도 — Claude Code·OpenCode·Cursor·Codex·Aider 어떻게 다른가"
description : "AI 코딩 도구를 사용 환경(터미널·에디터·플러그인·클라우드), 모델 종속성, 과금 방식, 오픈소스 여부 네 축으로 비교한다. 같은 Codex 모델도 OpenCode와 공식 CLI에서 결과가 달라지는 이유까지 정리한다."
date        : 2026-07-03 21:35:00 +0900
updated     : 2026-11-18 12:00:00 +0900
categories  : [ai, "코딩 에이전트"]
tags        : [claude-code, opencode, cursor, github-copilot, codex, aider, pi, comparison]
pin         : false
hidden      : false
---

> 관련: [AI 개발 지형](./2026-07-03-ai-development-map.md)의 **지형도·비교** 갈래 · [Claude Code 작업 설계](./2026-07-03-claude-code-workflow.md)

"AI 코딩 도구 뭐 써?"에 대한 답은 취향 이전에 **어디에서 작업하고 싶은가**에서 갈린다. 터미널에서 직접 에이전트를 돌릴지, 에디터 안에서 쓸지, 기존 에디터에 플러그인으로 붙일지, 클라우드에 비동기 작업을 맡길지에 따라 선택지가 달라진다. 이 글은 주요 도구를 사용 환경·모델 종속성·과금·오픈소스 여부 네 축으로 비교해 Claude Code가 어디에 있고 언제 다른 도구가 나은지를 정리한다.

> 모델 버전명·정확한 월 요금·지원 기능은 자주 바뀐다. 아래 비교는 2026-08 기준이며, 사용 환경·단일/다중 모델·오픈/클로즈드 같은 구조적 특성을 중심으로 본다. 구체적인 모델과 가격은 도입 전에 각 공식 문서에서 다시 확인한다.
{: .prompt-warning }

## 한눈에 보는 표

| 도구 | 사용 환경 | 모델 | 과금 | 오픈소스 |
|---|---|---|---|---|
| **Claude Code** | 터미널 CLI (+IDE 확장·웹) | Claude 전용 | Claude 구독 또는 API 종량 | ✗ |
| **OpenCode** | 터미널 CLI (+웹·IDE 연동) | 다중(로컬 포함) | 연결한 구독·API·로컬 모델 | ✓ (MIT) |
| **pi** | 터미널 CLI / 에이전트 하네스 | 다중 provider 설정 | 연결한 API·provider 비용 | ✓ |
| **OMP** | 터미널 CLI / 통합 개발 하네스 | 다중 provider·역할별 모델 | 연결한 제공자 비용·한도 | ✓ |
| **Cursor** | 에디터(VS Code 기반) | 다중(Claude·GPT·Gemini 등) | 구독(+사용량 기반 한도) | ✗ |
| **GitHub Copilot** | 에디터 플러그인 (+Agent·CLI·클라우드) | 여러 모델 중 선택 | 구독(+사용량 기반 한도) | ✗ |
| **OpenAI Codex** | 터미널 CLI (+클라우드·IDE) | OpenAI 전용 | ChatGPT 구독 또는 API 종량 | CLI만 ✓ |
| **Aider** | 터미널 CLI | 다중(로컬 Ollama 포함) | 사용하는 모델 API 비용 | ✓ |

## 축 1 — 어디서 도는가

가장 먼저 갈리는 지점이다.

- **터미널 에이전트**: Claude Code, OpenCode, OpenAI Codex CLI, pi, Aider. 셸에서 코드베이스를 읽고 고치며 테스트를 실행하는 여러 파일 단위의 에이전트 작업에 강하다. 기존 에디터를 바꿀 필요가 없다.
- **에디터**: Cursor. VS Code 계열 에디터 안에 자동완성·인라인 편집·에이전트 기능을 통합한다. 작업 흐름을 에디터 안에 모으고 싶을 때 맞는다.
- **플러그인**: GitHub Copilot. 기존 VS Code·JetBrains 등에 붙여 쓰며 GitHub 생태계와의 통합이 강하다.
- **클라우드·비동기**: Codex 클라우드 작업, Copilot의 클라우드 에이전트 등. 긴 작업을 원격 환경에 맡기고 나중에 결과를 받는 방식이다.

## 축 2 — 단일 모델 vs 여러 모델

- **한 벤더에 고정**: Claude Code는 Claude, Codex는 OpenAI 모델을 중심으로 동작한다. **도구를 고르는 것이 모델 계열 선택과 연결된다.**
- **여러 모델 선택**: OpenCode, pi, Aider, Cursor, Copilot. 작업에 따라 모델을 바꾸거나 특정 벤더에 고정되지 않고 싶을 때 유리하다.

Claude Code가 Claude 전용인 것은 제약이자 강점이다. 모델과 도구가 같은 생태계에서 함께 설계되므로 에이전트 동작의 일관성을 기대할 수 있지만, 다른 모델을 자유롭게 바꿔 쓰려면 맞지 않는다.

## 축 3 — 구독 vs API 종량

- **구독 중심**: Claude Code, Codex, Copilot, Cursor. 정액 구독 안에서 일정 사용량을 제공하되 제품에 따라 추가 사용량이나 크레딧 정책이 붙는다.
- **API 종량 중심**: Aider와 Claude Code·Codex의 API 키 사용 경로. 사용량이 적으면 비용을 세밀하게 통제할 수 있지만 사용량이 많으면 비용 변동이 커질 수 있다.
- **연결한 제공자를 따름**: OpenCode와 pi. 공식 지원 구독, 모델 API 키, OpenRouter, 로컬 모델 등 어떤 제공자를 연결했는지에 따라 과금과 한도가 결정된다.

### OpenCode에서는 provider와 model을 분리해서 본다

OpenCode에서 **provider**는 모델을 실제 API나 로컬 런타임으로 제공하는 연결 경로이고, **model**은 그 경로를 통해 실행할 언어 모델이다. 따라서 "OpenCode에서 무엇을 쓸까"라는 질문은 먼저 provider를 정하고, 그다음 그 provider가 제공하는 model을 고르는 순서로 보는 편이 정확하다.

```text
OpenCode
└─ provider
   └─ model

예: OpenCode → OpenRouter → 현재 선택한 모델
```

OpenRouter는 여러 모델을 하나의 provider 연결로 바꿔 쓸 수 있다는 점이 장점이다. OpenCode에서는 `/connect`로 OpenRouter 자격 증명을 연결하고 `/models`에서 사용할 모델을 고를 수 있다.

무료 모델을 사용할 때는 **특정 모델명을 장기적인 정답으로 기록하지 않는다.** 무료 제공 여부, 모델 버전, 제공자 상태와 성능은 자주 바뀌기 때문이다. 대신 다음 원칙을 정본으로 둔다.

- 특정 무료 모델을 직접 선택하려면 현재 OpenRouter의 무료 모델 목록에서 코딩·도구 호출 지원 여부를 확인한다.
- 모델 선택 자체가 중요하지 않고 무료 사용이 우선이면 `openrouter/free` 같은 무료 모델 라우터를 고려한다.
- `openrouter/free`는 하나의 고정 모델이 아니라 요청 조건을 만족하는 현재 무료 모델 중에서 라우팅하는 방식이므로 결과 품질과 모델은 달라질 수 있다.
- "현재 무료 코딩 모델 1순위" 같은 평가는 시점성 정보로 보고, 필요할 때 다시 확인한다.

즉 정본에 남길 것은 **모델 순위가 아니라 provider/model 선택 구조와 갱신 원칙**이다.

## 축 4 — 오픈 vs 클로즈드

- **오픈소스 도구**: OpenCode, pi, Aider.
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

## Claude Code vs Codex — 같은 Form Factor에서는 무엇을 비교하나

둘 다 Terminal에서 Repository를 읽고 파일을 수정하며 명령·테스트를 실행할 수 있는 Coding Agent라면, "분석은 A가 잘하고 구현은 B가 잘한다"처럼 고정 성격을 부여하지 않는다. Model·Version·System Prompt·Tooling은 계속 바뀌므로 그런 평가는 금방 낡는다.

대신 **Harness가 제공하는 관찰 가능한 계약**을 비교한다.

| 비교축 | 확인할 질문 |
|---|---|
| Model 범위 | 어떤 Model 계열을 선택할 수 있고 Tool과 Model이 얼마나 결합돼 있나 |
| Repository instruction | Project 지침 파일과 사용자 지침을 어떤 Scope·우선순위로 읽나 |
| Tool surface | Shell·Search·Edit·Browser·MCP 등 어떤 Tool을 어떤 방식으로 노출하나 |
| Permission / sandbox | Command·Network·File write를 어디까지 자동 허용하고 어디서 승인을 받나 |
| Context 관리 | 긴 작업에서 File·Tool result·Conversation을 어떻게 유지·요약하나 |
| Local / cloud execution | 현재 Machine에서만 실행하는가, Remote task를 위임할 수 있는가 |
| Automation | Headless/CI/SDK/Hook 같은 반복 실행 진입점이 있는가 |
| Cost / limit | Subscription·API·Credit·Rate limit이 내 사용 패턴과 맞나 |

즉 선택은 다음처럼 한다.

```text
내 Repository와 Security Boundary에서
필요한 Tool / Permission / Execution Model을 먼저 정함
        ↓
그 계약을 만족하는 Harness 후보 비교
        ↓
현재 Model·가격·사용 한도 확인
        ↓
실제 대표 작업으로 평가
```

같은 Model 계열을 쓰더라도 Harness가 다르면 Context 구성·Tool 호출·권한·반복 Loop가 달라져 결과가 달라질 수 있다. 반대로 특정 시점의 체감 성능 차이를 Tool의 영구적인 성격으로 기록하지 않는다.

대표 작업으로 비교할 때도 "설계 작업"과 "구현 작업"을 제품에 고정 배정하지 않고, **같은 Repository·같은 완료 조건·같은 검증 기준**에서 실제 결과를 본다.

## 인증 공급자가 모델·요금·허용 범위를 결정한다

같은 OpenCode에서도 **어떤 provider의 계정으로 연결했는가**에 따라 모델 카탈로그와 청구 주체가 달라진다. [GitHub의 2026-01 공식 발표](https://github.blog/changelog/2026-01-16-github-copilot-now-supports-opencode/)는 유료 Copilot 구독(Pro·Pro+·Business·Enterprise)을 OpenCode의 `/connect`로 인증하는 경로를 명시한다. 이 경우 OpenCode에서 Copilot이 제공하는 모델을 고르는 것이지 OpenAI·Anthropic에 각기 별도 구독으로 직접 로그인하는 것이 아니다. 조직에서 허용한 모델만 보일 수도 있다. 가격·프리미엄 배수·기본 모델과 사용 한도는 계정·정책·시점마다 달라지므로 “특정 Codex 모델은 영원히 무료·무제한”으로 읽지 말고 [공식 Copilot 요금과 모델 문서](https://docs.github.com/en/copilot/concepts/billing/copilot-requests)에서 확인한다. 모델명의 `Codex`와 **Codex CLI 제품 인증**도 별개의 개념이다.

반대로 Claude Code 구독 로그인 토큰을 제3자 에이전트에 재사용할 수 있다는 뜻은 아니다. Anthropic의 [소비자 약관](https://www.anthropic.com/legal/consumer-terms)은 명시적 허용 또는 API 키 사용을 제외한 자동화 접근을 제한하며, API 키 사용에는 [별도 상업 서비스 약관](https://www.anthropic.com/legal/commercial-terms)이 적용된다. 공식 Agent SDK 같은 경로와 임의의 OAuth 토큰 재사용을 같다고 취급하지 말 것. 서드파티 지원 범위는 최신 공식 통합 안내와 본인의 계약·조직 정책을 기준으로 판단한다. 2026년 상반기의 차단·복구·가격 배수에 관한 커뮤니티 타임라인은 시점마다 달라 현재 보편 정책으로 단정하지 않는다.

OSS 터미널 에이전트도 별 개수만으로 줄 세울 수 없다. OpenCode는 확장과 provider 선택 폭, Aider는 명시적인 Git 중심 편집, pi는 작은 코어와 사용자 확장, Crush는 터미널 UI, Goose는 확장·거버넌스라는 **서로 다른 선택 이유**를 갖는다. Cline은 에디터 중심이라 순수 터미널 CLI와 같은 집합으로 정렬하면 오해가 생긴다. 관심도(별·다운로드), 릴리스 안정성, 장기 사용 후기는 별도 지표다. OpenCode를 고려한다면 멀티모델 필요성에 더해 권한 문자열과 실제 OS sandbox의 경계, 플러그인 업데이트 비용을 대표 작업으로 검증하자. 특정 제품의 “2026년 1위” 같은 숫자와 서비스 종료설은 검증 가능한 현재 사실이 아니라 당시 관찰로만 남겨야 한다.

Claude Code를 **구독으로 사용 중인데도 API 요금이 발생한다면**, 현재 [공식 인증 우선순위](https://code.claude.com/docs/en/authentication#authentication-precedence)를 살핀다. 로컬 대화형 세션에서 `ANTHROPIC_API_KEY`를 설정하고 사용을 승인한 경우 구독 로그인보다 키가 우선할 수 있다. `/status`로 실제 인증 경로를 확인한다. 이는 서드파티 도구의 구독 재사용 가능 여부와 다른 문제이며, 모든 환경에서 “조용히 무조건 덮는다”는 오래된 설명도 정확하지 않다.

## 누구에게 맞나

- **Claude Code** — 터미널 중심으로 Claude를 사용하고, 여러 파일에 걸친 긴 에이전트 작업을 자주 하는 경우.
- **OpenCode** — 터미널에서 여러 제공자·로컬 모델을 바꿔 쓰고, 오픈소스 도구와 설정 자유도를 중시하는 경우.
- **pi** — 기본 기능이 많은 완제품보다 작은 core와 extension·skill·prompt template로 직접 조립하는 얇은 하네스를 원하는 경우. 사용 이동기는 [Claude Code에서 OpenCode를 거쳐 pi까지](./2026-09-21-ai-coding-harness-migration.md)에서 따로 정리했다.
- **OMP** — Pi 계열 구조를 사용하면서 LSP·브라우저·Subagent 같은 개발 도구가 통합된 시작점을 원하는 경우. [Pi와의 차이·확장 호환성](./2026-11-04-omp-vs-pi-coding-agent.md)에서 따로 비교한다.
- **Cursor** — 에디터 안에서 자동완성·편집·에이전트 기능을 한 흐름으로 쓰고 싶은 경우.
- **Copilot** — 기존 IDE와 GitHub 중심의 팀 개발 흐름을 유지하면서 AI 기능을 붙이고 싶은 경우.
- **Codex** — OpenAI 모델과 CLI·클라우드 작업을 같은 생태계에서 쓰고 싶은 경우.
- **Aider** — Git 중심의 터미널 워크플로와 다양한 모델·로컬 모델 사용을 중시하는 경우.

## 결론

첫 갈림길은 사용 환경이다. **에디터 안에서 계속 일하고 싶으면** Cursor나 Copilot, **셸에서 에이전트를 직접 돌리고 싶으면** Claude Code·OpenCode·Codex·pi·Aider가 자연스럽다. 그다음에는 모델 선택 자유도, 과금 방식, 오픈소스 여부를 비교하면 된다.

Claude Code와 Codex처럼 같은 Form Factor의 에이전트끼리는 고정된 성격표보다 **Tool surface·Permission·Context·Execution model·비용**을 같은 축에서 비교하고, 현재 대표 작업으로 검증하는 편이 오래 간다.

도구를 골랐다면 [Claude Code 작업 설계](./2026-07-03-claude-code-workflow.md)처럼 실제 작업의 계획·권한·검증 경계를 확인한다. 설치·명령은 [devkit 치트시트](https://github.com/clang-engineer/devkit/blob/main/reference/cheatsheets/README.md), 모델·외부 연결·API 개발의 전체 위치는 [AI 개발 지형](./2026-07-03-ai-development-map.md)에서 이어진다.
