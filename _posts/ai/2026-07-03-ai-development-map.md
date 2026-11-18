---
title       : "AI 개발 지형 — 모델·하네스·외부 도구의 책임 나누기"
description : "모델의 추론, 코딩 에이전트의 실행 환경, MCP 외부 연결, API 애플리케이션의 책임을 나누고 목적에 맞는 비교·사용 경험·설계 글로 연결한다."
date        : 2026-07-03 21:30:00 +0900
updated     : 2026-11-18 12:00:00 +0900
categories  : [ai, "개요·인덱스"]
tags        : [ai, index, models, harness, claude-code, opencode, pi, omp, mcp]
redirect_from:
  - /posts/ai/2026-07-03-ai-roadmap/
pin         : false
hidden      : false
---

AI 개발 도구를 익힐 때 서로 다른 질문을 한 줄에 놓기 쉽다. “어떤 모델을 쓸까”, “어떤 코딩 도구를 쓸까”, “DB를 어떻게 연결할까”, “내 앱에서 모델을 호출할까”는 다음 단계가 아니라 **서로 다른 선택 축**이다.

이 문서는 모델 학습부터 에이전트 개발까지 포괄하는 AI 전체 로드맵이 아니다. 개발 작업에서 자주 만나는 **모델·실행 환경·외부 연결의 책임 지도**이며, 필요한 글로 들어가는 인덱스다. 화살표는 호출·결과 전달을, 가지는 그 책임에 포함되는 요소를 뜻한다.

```text
사용자 요청
    │
    ▼
실행 환경: 완성된 코딩 Agent 또는 직접 만든 Application
    ├─ 지침·세션·컨텍스트 관리
    ├─ 모델 호출 ───────────────→ Model Provider / 추론 모델
    │                                      │
    │                         답변·판단·Tool call 제안
    │                                      │
    └─ 권한 검사·도구 실행 ←────────────────┘
          ├─ 내장 파일·Shell·코드 탐색
          └─ MCP Client → MCP Server → 외부 File·DB·API
```

모델이 도구를 제안해도 실제 실행·승인·결과 보존은 실행 환경의 책임이다. 코딩 도구를 쓰면 이 루프를 제품으로 받아들이고, API 앱을 만들면 직접 구현할 책임이 늘어난다.

## 1. 무엇을 선택하는지 먼저 나눈다

| 선택 축 | 답하는 질문 | 혼동하지 않을 것 |
|---|---|---|
| 모델·추론 강도 | 어떤 엔진에 얼마나 깊이 생각하게 할까? | 모델 변경과 같은 모델의 effort 조정은 다름 |
| 하네스·제품 | 컨텍스트·도구·권한·작업 루프를 누가 관리할까? | 같은 모델이어도 실행 환경은 다를 수 있음 |
| 외부 도구 | 필요한 파일·DB·서비스를 어떻게 연결할까? | MCP는 모델 인증이나 모델 자체가 아님 |
| API 앱 | 내 소프트웨어가 어느 책임을 직접 구현할까? | Claude API를 배워야 Claude Code를 쓰는 것은 아님 |
| 사용자 표면 | 터미널·에디터·웹 중 어디에서 작업할까? | 웹은 CLI의 초급판이 아니라 다른 실행 환경 |

서로 다른 축이 실제 시스템에서 조합된다. API 앱이 MCP Client를 구현할 수도 있고, 완성된 코딩 Agent가 MCP Server를 사용할 수도 있다. MCP 없이 모델 API의 Tool Use만으로 작업 루프를 만들 수도 있다.

## 2. 코딩 도구 선택과 하네스 운영

코드를 읽고 고치는 **Coding Agent**와 여러 세션을 관찰·전환하는 **Agent Workspace**는 다른 역할이다. 터미널·멀티플렉서·워크스페이스의 관계는 [Devkit 도구 지도]({{ '/devkit/' | relative_url }})에서 확인한다.

| 글 | 독자가 얻는 것 |
|---|---|
| [AI 코딩 도구 지형도](./2026-07-03-ai-coding-tools-landscape.md) | 터미널·에디터·플러그인·클라우드, 모델·인증·과금·권한의 비교축 |
| [AI 코딩 하네스를 얇게 만든 기록](./2026-09-21-ai-coding-harness-migration.md) | Claude Code·Codex에서 OpenCode·Pi로 옮기며 필요한 기능을 고른 개인 경험 |
| [OpenCode Plugin의 입력·기록·표시 경계](./2026-10-02-opencode-plugin-context-boundaries.md) | 화면 편의를 위한 확장이 모델 입력과 기록에 영향을 주는 사례 |
| [OMP와 Pi의 차이](./2026-11-04-omp-vs-pi-coding-agent.md) | 통합 하네스와 직접 조립하는 하네스, 플러그인 이식 경계 |

기능 수가 많다고 항상 우위이거나, core가 얇다고 항상 빠른 것은 아니다. 사용할 기능·유지할 설정·검증할 확장이 얼마나 필요한지 비교한다. 체감 성능은 같은 저장소·요청·모델·추론 강도로 대표 작업을 실행해 본다.

## 3. Claude Code의 작업·지침·협업

Claude Code 관련 글은 명령을 외우는 순서가 아니라 **어떤 정보를 어디에 둘지**로 나눈다.

| 글 | 독립된 질문 |
|---|---|
| [Claude Code 작업 설계](./2026-07-03-claude-code-workflow.md) | 계획·Skill·Subagent·Hook·검증·공개 승인을 어떻게 조합할까? |
| [지침·메모리와 클라우드 배포](./2026-03-12-claude-code-instructions-memory.md) | 지속 지침과 학습을 어디에 두고 로컬·웹에서 어떻게 공유할까? |
| [병렬 세션의 코드·상태·분석 분리](./2026-11-16-claude-parallel-session-coordination.md) | 별도 worktree에서 일하는 세션끼리 무엇을 어떤 채널로 전달할까? |

```text
계속 적용할 계약·사실 → 지침·Memory
필요할 때 실행할 절차 → Skill
도구 이벤트 자동화   → Hook
독립 조사·검토       → Subagent
별도 세션의 협업     → 작업 경계·상태 전달·명시적 통합
```

명령·키·설정 파일의 빠른 참조는 [devkit Claude Code 치트시트](https://github.com/clang-engineer/devkit/blob/main/reference/cheatsheets/claude-code.md)에서 관리한다. 블로그에는 선택 이유·작업 경계·적용 경험을 남긴다.

## 4. 외부 연결 — MCP

MCP의 질문은 **AI Client가 외부 Tool·Resource를 어떤 공통 계약으로 발견하고 호출할지**다. 코딩 Agent 사용의 필수 다음 단계가 아니다.

| 글 | 독자가 얻는 것 |
|---|---|
| [MCP 개념](./2025-10-23-mcp.md) | Client·Server, Tool·Resource·Prompt, 전송·인가 경계 |
| [Serena의 클라이언트 연결 경계](./2025-11-07-serena-mcp-client-integration.md) | 심볼 탐색 서버의 실행 파일·프로젝트·context·세션 분리 |
| [MCP 서버 선택과 권한](./2026-07-03-mcp-server-selection-security.md) | 내장 도구와의 중복, 등록 Scope·실행 위치·신뢰의 판단 |

이미 내장 검색이나 LSP로 충분하다면 MCP를 더 붙이지 않아도 된다. 연결이 늘수록 자격 증명과 실행 범위, 외부 데이터의 신뢰 경계도 늘어난다.

## 5. 모델 API와 구조화된 판단

API를 쓰는 앱에서는 요청·응답 계약, 세션 상태, Tool Loop, 실패·재시도·관측을 설계한다. 코딩 도구를 직접 만드는 경우가 아니어도 분류·추출·답변 서비스에 같은 문제가 생긴다.

| 글 | 독자가 얻는 것 |
|---|---|
| [AI 모델과 추론 레벨](./2026-11-18-ai-models-reasoning-levels.md) | 모델 선택과 추론 강도의 차이, 제공사별 설정 경계, 속도·비용·품질의 선택 기준 |
| [Claude API의 모델·추론·Tool Loop·캐시](./2026-07-03-claude-api-models-thinking-tool-loop.md) | 모델 선택과 effort, 메시지·도구 실행·캐시의 책임 구분 |
| [Jev: 생성과 판단의 분업](./2026-10-04-jev-decision-model.md) | 작은 선택·확률을 정책 코드에서 소비하는 구조와 검증 기준 |

```text
자유로운 답변·코드가 필요 → 생성 모델
범위가 정해진 판단이 반복 → 구조화된 출력·판단 모델 검토
결정적으로 검사할 조건   → 권한 코드·스키마·실제 테스트
```

생성 모델도 분류할 수 있다. 판단 모델은 다른 기능을 추가한다기보다, 반복 판단의 출력 계약·확률 품질·비용을 별도로 다루는 선택이다. 높은 confidence나 큰 effort가 실제 검증을 대체하지 않는다.

모델·추론 강도의 공통 선택 기준과 제공사별 차이는 [AI 모델과 추론 레벨](./2026-11-18-ai-models-reasoning-levels.md)에서 다룬다. OMP의 단계·전환·역할별 설정은 [추론 강도 치트시트](https://github.com/clang-engineer/devkit/blob/main/reference/cheatsheets/omp.md#추론-강도)를 참조한다.

## 6. 제품 표면과 운영 경험

| 글 | 별도로 남길 이유 |
|---|---|
| [claude.ai 웹 지형](./2026-07-13-claude-ai-web-tour.md) | Projects·Artifacts·Connectors·Code 같은 화면의 역할을 관찰한 시점 기록 |
| [Codex 사용량 리셋](./2026-08-31-codex-usage-reset.md) | 주기·추가 리셋·남은 한도 표시를 구분하는 운영 관점 |
| [자동 생성 테스트 검토](../reference/code-quality/2026-08-12-auto-generated-test-check.md) | 생성된 테스트가 실제 결함을 잡는지 판단하는 도구 독립적 코드 품질 기준 |

화면·모델명·가격·사용량 정책은 빠르게 변한다. 당시 관찰과 현재 공식 계약을 구분하고, 숫자·순위보다 확인할 질문을 남긴다.

터미널 에이전트를 오래 쓰는 경우 셸·세션 환경도 생산성에 영향을 준다. 이 부분은 [셸 로드맵](../shell/2026-07-03-00-shell-roadmap.md)과 [tmux 로드맵](../tmux/2026-06-16-00-tmux-roadmap.md)의 책임이다.

> AI 관련 글은 하나의 필수 학습 사다리가 아니다. **어떤 모델인가, 어떤 실행 환경인가, 무엇을 연결하고 무엇을 직접 책임질 것인가**를 구분한 뒤 필요한 부분으로 들어간다.
