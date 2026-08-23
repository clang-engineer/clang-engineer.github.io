# Agent Harness

이 문서는 Agent Harness를 별도의 새로운 AI 기술로 외우기보다, **Agent를 원하는 방식으로 운용하기 위해 주변에 붙는 실행·운영 체계**로 이해하는 데 목적이 있다.

## 1. 먼저 Agent의 핵심부터 잡는다

LLM Agent의 핵심은 LLM이 Tool을 사용하고 그 결과를 다시 관찰하면서 목표를 수행하는 반복 Loop다.

```text
사용자 목표
→ LLM이 다음 행동 판단
→ Tool 선택·호출
→ Tool 실행 결과 관찰
→ 결과를 Context에 반영
→ LLM 재판단
→ 추가 행동 또는 종료
```

즉 Agent의 본질은 다음과 같이 압축할 수 있다.

> **Agent = LLM + Tool + Observation의 자율적 반복 Loop**

Tool을 선택하고, 파일을 읽고, 결과를 다시 보고 다음 행동을 결정하는 것까지 Agent의 역할이다.

---

## 2. 그렇다면 Harness는 무엇인가

Agent와 Harness를 서로 독립적인 두 Component처럼 나누면 오히려 이해하기 어렵다. 실제 제품에서는 두 역할이 많이 겹치고 하나의 시스템 안에 함께 구현된다.

Harness는 Agent 자체의 판단 Loop보다 **그 Agent를 어떤 환경과 방식으로 굴릴 것인가**에 초점을 둔 개념으로 이해하는 것이 편하다.

```text
Harness
├─ Context / Rules
├─ Skills
├─ Hooks
├─ Tool · Permission 구성
├─ Workflow
├─ Agent 구성 · Orchestration
└─ 이를 적용하는 일부 실행 Code

        ┌──────────────┐
        │    Agent     │
        │ LLM ↔ Tool  │
        │    ↕ Result  │
        └──────────────┘
```

개념적으로는 다음처럼 생각할 수 있다.

> **Agent = 실제 목표를 수행하는 핵심 Loop**
>
> **Harness = Agent를 원하는 방식으로 운용하기 위해 둘러싼 Context·설정·자동화 Code의 묶음**

엄밀한 표준 수학 관계는 아니지만 이해를 위해 `Agent ⊂ Harness`처럼 생각하면 직관적이다.

---

## 3. Harness의 구성 요소를 실제 예제로 이해한다

### Context / Rules

Agent가 어떤 원칙으로 일할지 알려준다.

```text
- YAGNI를 지킨다.
- 가독성을 우선한다.
- 요청 범위 밖의 수정은 하지 않는다.
- 파일 검색은 find보다 fd를 우선한다.
```

`find 대신 fd를 사용한다`라는 Rule 하나가 Harness 자체인 것은 아니다. 이런 Rule들이 Harness를 구성하는 재료가 된다.

### Skills

특정 작업을 수행하는 방법을 재사용 가능한 지침으로 만든다.

```text
Refactoring Skill
→ 기존 구조 조사
→ 변경 범위 결정
→ 최소 변경
→ Test
→ Review
```

### Hooks

특정 Event가 발생했을 때 LLM의 추가 판단을 기다리지 않고 자동으로 개입한다.

```text
파일 수정 완료
→ Hook 실행
→ lint / type check
→ 결과 수집
→ 필요하면 Agent Context에 전달
```

Hook의 실행 자체는 Context가 아니다. 다만 Hook이 만든 결과가 다시 LLM에 전달되면 그 결과는 Context가 된다.

### Tool · Permission 구성

Tool을 사용하는 것은 Agent의 행동이다. Harness 관점에서는 **어떤 Tool을 Agent에게 제공하고 어디까지 허용할 것인지**를 구성한다.

```text
파일 읽기  : 허용
파일 수정  : 허용
Shell      : 허용
git push   : 승인 필요
위험 명령   : 금지
```

### Workflow

Agent가 작업할 때 따르게 할 큰 작업 절차를 정의한다.

```text
탐색
→ 계획
→ 구현
→ Test
→ Review
→ 실패 시 수정
```

작은 수정에서는 이런 Full Workflow가 오히려 Token과 시간을 낭비할 수 있다. 큰 기능 구현이나 장시간 자율 작업에서는 사람의 개입을 줄이는 데 가치가 생긴다.

### Agent Orchestration

필요하면 역할이 다른 Agent에게 작업을 위임하도록 구성할 수 있다.

```text
Main Agent
├─ Explore Agent   : Code Base 조사
├─ Research Agent  : 문서 조사
└─ Review Agent    : 결과 검증
```

Multi-Agent는 Harness의 필수 조건이 아니다. 단일 Agent를 운용하는 Harness도 가능하다.

---

## 4. Context와 실행 Code를 구분한다

Harness를 아주 거칠게 개발자 관점에서 압축하면 다음과 같다.

> **Harness ≈ Context + Config + 일부 실행 함수**

```text
Context
├─ Rules
├─ Skills
├─ 역할 정의
└─ Workflow 지침

Code / Config
├─ Hooks
├─ Tool 등록
├─ Permission
├─ Context 주입
└─ Agent Orchestration
```

LLM 입장에서는 실행 결과가 결국 다시 Context로 들어오지만, 실제 Tool 실행이나 Hook 실행 자체까지 Context인 것은 아니다.

```text
Context
→ LLM
→ Action / Tool Call
→ 실행 Code
→ 실제 환경
→ Result
→ Context
→ LLM
```

---

## 5. OpenCode · Codex · Claude Code와 Harness

OpenCode, Codex, Claude Code 같은 Coding Agent 제품은 이미 Agent Loop와 기본 Harness 기능을 함께 가진 완성된 Agent System으로 볼 수 있다.

```text
Coding Agent Product
├─ LLM 연결
├─ Agent Loop
├─ Tool 실행
├─ Context 관리
├─ 권한 관리
└─ 기본 Workflow
```

따라서 이 제품들을 `Agent인가 Harness인가` 중 하나로만 분류하려 할 필요는 없다.

- 목표를 자율적으로 수행하는 관점에서는 **Agent**
- LLM과 Agent를 어떤 Context·Tool·정책으로 굴리는지 보는 관점에서는 **Harness**

같은 제품이 두 역할을 모두 수행할 수 있다.

---

## 6. OMO · LazyCodex 같은 Harness 확장

OMO(Oh My OpenAgent), LazyCodex 같은 Project는 기존 Coding Agent Runtime을 새로 만드는 것이라기보다, 기존 Agent 위에 **검증된 작업 방식과 자동화**를 추가하는 확장 계층으로 이해하면 쉽다.

```text
기존 Coding Agent
      +
Rules / Skills
Workflow
Hooks
Agent 역할
Tool · Permission 설정
Orchestration
일부 실행 Code
      ↓
확장된 Agent 작업 환경
```

즉 단순한 Prompt 모음도 아니고 완전히 새로운 LLM Runtime도 아니다.

> **남이 시행착오를 통해 만든 Agent 운용 노하우를 재사용 가능한 Package로 만든 것**

이라고 이해하면 된다.

---

## 7. 왜 이런 Harness를 공유해서 사용하는가

순정 Agent를 사용할 때 사용자가 반복적으로 다음과 같이 감독할 수 있다.

```text
"먼저 기존 Code 조사해"
"바로 구현하지 말고 계획부터 세워"
"Test도 실행해"
"빠뜨린 부분 없는지 Review해"
```

Harness는 이런 반복적인 운영 노하우를 자동화한다.

```text
사용자 요청
→ 탐색
→ 계획
→ 구현
→ Test
→ Review
→ 필요 시 수정
```

따라서 Harness의 가치는 새로운 AI Algorithm보다 **Agent 운영 노하우의 재사용과 사람의 개입 감소**에 있다.

Neovim에 개인 설정을 직접 쌓을 수도 있지만 LazyVim 같은 배포판을 사용하는 것과 비슷한 면이 있다.

---

## 8. Harness가 항상 좋은 것은 아니다

Harness가 복잡해질수록 다음 비용도 증가할 수 있다.

- 추가 Instruction에 따른 Context 증가
- Sub-Agent 호출에 따른 Token 증가
- 불필요한 탐색·계획·Review
- 개인 Coding 원칙과 Harness Rule의 충돌
- Hook과 자동화의 과도한 개입
- 최신 강한 Model의 자체 판단을 오히려 방해할 가능성

따라서 작은 수정과 큰 작업을 구분할 필요가 있다.

```text
작은 수정
→ 순정 Agent + 개인 Rule

복잡한 기능 / 대규모 Refactoring / 장시간 자율 작업
→ Harness의 Workflow · Review · Orchestration 활용 가치 증가
```

평가 기준은 단순히 `더 많은 Agent를 쓰는가`가 아니라 다음이 되어야 한다.

> **작업 성공률과 사람의 개입 감소가 추가 Token·복잡성 비용보다 큰가?**

---

## 9. 좋은 Harness 노하우는 결국 Agent 본체로 흡수될 수 있다

Harness는 새로운 Agent 사용법을 빠르게 실험하기 좋은 계층이다.

```text
새로운 Agent 운용 노하우
→ Rules / Skills / Harness에서 실험
→ 많은 사용자가 검증
→ 보편적으로 효과적
→ Agent Runtime / 제품의 기본 기능으로 흡수
```

따라서 Harness에 계속 남는 것은 주로 다음과 같은 영역이다.

- 아직 검증 중인 실험적 전략
- 사용자별 개발 철학과 취향
- 비용과 품질 사이의 선택
- 특정 Domain에 최적화된 Workflow
- 강하게 Opinionated한 Agent 운용 방식

즉 Harness를 Agent보다 항상 우월한 상위 기술로 보면 안 된다.

> **보편적인 Best Practice는 Agent 본체가 흡수하고, Harness는 더 빠른 실험과 개인화의 공간으로 남을 수 있다.**

---

## 10. 기술사 관점의 최종 정리

Agent Harness는 아직 전통적인 표준 Architecture Component처럼 경계가 완전히 고정된 용어로 보기 어렵다. 따라서 Agent와 Harness를 물리적으로 분리된 두 Component로 암기하기보다 관점 차이로 이해하는 것이 안전하다.

```text
Agent
= LLM + Tool + Observation Loop를 통해
  목표를 자율적으로 수행하는 실행 주체

Harness
= Agent를 원하는 방식으로 운용하기 위한
  Context + Config + Automation Code의 체계
```

### 기억 문장

> **Agent는 일을 수행하는 Loop이고, Harness는 그 Agent를 잘 굴리기 위해 축적한 작업 환경과 운용 노하우다.**

Harness의 대표 요소는 `Context / Rule / Skill / Hook / Tool·Permission 구성 / Workflow / Orchestration`이며, 실제 제품에서는 Agent와 Harness의 기능이 상당 부분 겹칠 수 있다.
