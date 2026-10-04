---
title       : "Pi coding agent — 얇은 하네스를 Package와 Extension으로 조립하기"
description : "Pi를 완제품 에이전트가 아니라 얇은 코딩 하네스로 보고, Package와 Extension으로 필요한 능력을 붙이는 방식을 정리한다."
date        : 2026-10-02 00:30:00 +0900
updated     : 2026-10-04 23:30:00 +0900
categories  : [ai, "코딩 에이전트"]
tags        : [pi, pi-package, pi-extension, ai-agent, ai-coding, coding-agent, harness]
pin         : false
hidden      : false
---

> 관련: [Claude Code에서 OpenCode를 거쳐 pi까지 — AI 코딩 하네스를 점점 얇게 만든 기록](./2026-09-21-pi-coding-agent-harness.md), [OpenCode — 완제품 UX와 Plugin 생태계를 함께 가진 터미널 코딩 에이전트](./2026-10-02-opencode-extensible-coding-agent.md)

Pi는 터미널에서 쓰는 AI 코딩 에이전트다. 하지만 Pi를 이해할 때는 “Claude Code 같은 완제품 에이전트”보다 **얇은 코딩 하네스**로 보는 편이 더 맞다.

```text
Pi
├─ 기본 하네스
│  ├─ 파일 읽기
│  ├─ 파일 수정
│  ├─ Shell 실행
│  ├─ 대화 Context
│  └─ TUI
└─ Package / Extension
   ├─ Tool 추가
   ├─ Command 추가
   ├─ Event hook
   ├─ Model provider
   ├─ Memory
   ├─ Web access
   └─ UI 보강
```

처음부터 모든 기능을 크게 얹어둔 제품이라기보다, 필요한 능력을 하나씩 붙여 내 작업 환경을 만드는 도구에 가깝다.

## Pi를 보는 기준 — 얇은 하네스

코딩 에이전트에서 하네스는 모델을 실제 개발 작업에 연결하는 실행 환경이다.

```text
모델
  ↓
하네스
  ├─ 파일 시스템 접근
  ├─ 명령 실행
  ├─ 수정 적용
  ├─ 권한과 규칙
  ├─ Prompt 구성
  ├─ Tool 선택
  └─ Session 상태
```

Claude Code나 OpenCode는 비교적 완제품에 가까운 하네스를 제공한다. Pi는 기본 손발은 제공하되, 그 주변 능력을 Package와 Extension으로 붙이는 쪽에 더 가깝다.

이 차이는 작아 보이지만 실제 사용 방식에는 꽤 큰 영향을 준다.

```text
완제품형 Agent
  → 기본 흐름을 먼저 받아들이고 필요한 부분을 바꾼다.

얇은 Harness형 Agent
  → 필요한 흐름을 정하고 그에 맞는 도구를 붙인다.
```

Pi는 두 번째 쪽이다.

## Package — 재사용 가능한 확장 단위

Pi의 Package는 npm을 통해 배포되는 확장 단위로 볼 수 있다. 직접 Extension을 작성하지 않아도, 이미 만들어진 Package를 설정에 추가해서 기능을 붙일 수 있다.

내가 현재 관심 있게 보는 Package들은 다음 축으로 나뉜다.

| Package | 역할 |
|---|---|
| `pi-web-access` | 웹 검색, URL fetch, 외부 문서 확인 |
| `pi-memory` | long-term memory, daily log, semantic search |
| `pi-mcp-adapter` | MCP Server 연결 |
| `pi-jev` | 판단·분류·도구/스킬 탐색 보조. [Jev의 역할과 활용 경계](./2026-10-04-jev-decision-model.md) 참고 |
| `@eko24ive/pi-ask` | TUI에서 구조화된 선택 질문 |
| `@plannotator/pi-extension` | Plan/code review에 주석을 다는 리뷰 워크플로 |
| `@henryqw/pi-add-dir` | 현재 작업 디렉터리 밖의 폴더를 세션에 추가 |

이 목록에서 보이듯 Pi Package는 단순한 편의 기능보다, 에이전트가 사용할 수 있는 능력 자체를 늘리는 경우가 많다.

### Pi Durable은 Extension이 아니라 앱용 하네스 라이브러리다

이름 때문에 Pi CLI의 auto mode나 장기 실행 옵션처럼 보일 수 있지만, `@earendil-works/pi-durable`은 기존 `pi` 명령에 붙는 Extension Package가 아니다. 별도 Node/TypeScript 애플리케이션에서 `Harness.open()`으로 하네스를 구성하고, 대화·모델 호출·도구 호출·상태를 저장해 중단 후 재개할 수 있게 하는 라이브러리다.

따라서 평소 `pi`를 더 자동으로 돌리고 싶은 목적이라면 직접적인 답이 아니다. 복구 가능한 에이전트 런타임을 앱 안에 넣고 싶을 때 의미가 있다.

예를 들면 다음과 같은 경우다.

- 웹 채팅 UI 뒤에서 에이전트 실행 상태를 보존한다.
- 서버가 재시작돼도 진행 중인 모델 응답이나 도구 호출을 이어간다.
- 사용자별 대화와 앱 고유 상태를 함께 저장한다.
- 자체 코딩 에이전트나 백그라운드 작업 에이전트의 실행 기록을 관리한다.

```text
기본 Pi
  ↓
web access 추가
  ↓
memory 추가
  ↓
ask_user 추가
  ↓
MCP 연결
  ↓
review workflow 추가
```

결과적으로 Pi는 설치 직후보다, 어떤 Package를 붙였는지에 따라 전혀 다른 작업 환경이 된다.

## Extension — Pi 안에서 동작을 직접 바꾸는 방법

Pi Extension은 TypeScript 또는 JavaScript module로 작성한다. Extension은 Pi process 안에서 실행되며, Tool, Command, Event handler, Model provider, Terminal UI 등을 추가할 수 있다.

공식 Extension API의 주요 진입점은 다음처럼 볼 수 있다.

```text
Pi Extension
├─ registerTool()      # 모델이 호출할 수 있는 Tool 추가
├─ registerCommand()   # /command 추가
├─ registerShortcut()  # Shortcut 추가
├─ registerFlag()      # CLI flag 추가
├─ registerProvider()  # Model provider 추가
├─ on()                # lifecycle/event hook
└─ ctx.ui              # TUI interaction
```

작은 예로는 `/hello` 같은 command를 추가할 수 있고, 더 크게는 특정 Tool 호출을 감시하거나, 위험한 명령을 막거나, session event에 반응해 context를 보강할 수 있다.

중요한 점은 Extension이 Pi process 안에서 같은 OS 권한으로 돈다는 것이다. 파일, prompt, tool call, session history, credential에 접근할 수 있으므로 신뢰할 수 있는 Extension만 로드해야 한다.

## 내 작업 흐름에서의 Pi 조립 방식

Pi를 쓸 때 나는 “기본 에이전트 하나를 고른다”기보다 “작업별 능력을 붙인다”는 식으로 본다.

예를 들면 블로그 글을 쓰거나 도구를 조사할 때는 다음 능력이 필요하다.

```text
글쓰기 / 조사 작업
├─ 파일 읽기·수정
├─ 기존 글 검색
├─ 외부 문서 확인
├─ 관련 기억 검색
└─ 애매한 선택지 질문
```

그러면 Pi에는 다음 조합이 자연스럽다.

```text
기본 read/edit/bash
+ pi-web-access
+ pi-memory
+ ask_user
+ blog skill
```

반대로 코드 리뷰나 계획 검토가 중심이면 `@plannotator/pi-extension` 같은 리뷰 흐름이 더 중요해진다. 외부 Tool 생태계를 붙이고 싶으면 `pi-mcp-adapter`가 중심이 된다.

즉 Pi의 핵심은 “모든 기능을 항상 켠다”가 아니라, 현재 작업에 맞는 능력을 선택적으로 붙이는 것이다.

## OpenCode와 비교하면

OpenCode와 Pi는 둘 다 확장 가능한 터미널 코딩 에이전트다. 하지만 확장의 의미가 조금 다르다.

```text
OpenCode
  = 완제품 Agent UX
  + Plugin으로 행동 변경·통합 추가

Pi
  = 얇은 Harness
  + Package/Extension으로 Agent 능력 조립
```

OpenCode는 처음부터 좋은 Agent UX를 제공하고, Plugin은 그 제품을 보강한다. Pi는 기본 하네스를 제공하고, Package와 Extension이 실제 작업 환경의 성격을 결정한다.

그래서 Pi가 잘 맞는 사람은 대체로 이런 쪽이다.

- Agent가 어떤 Tool을 갖는지 직접 통제하고 싶다.
- Memory, Web, MCP, Review 같은 능력을 필요한 만큼만 붙이고 싶다.
- 개인 dotfiles나 프로젝트 규칙과 강하게 엮고 싶다.
- Extension API로 직접 동작을 바꿀 여지를 중요하게 본다.

반대로 설치하자마자 완성된 제품 경험을 기대한다면 OpenCode나 Claude Code 쪽이 더 자연스러울 수 있다.

## 결론

Pi는 “또 하나의 Claude Code 대체재”라기보다, 코딩 에이전트 하네스를 직접 조립하는 도구에 가깝다. 기본 기능은 얇게 두고, Package와 Extension으로 필요한 능력을 붙인다.

이 관점에서 Pi를 평가할 때 중요한 질문은 다음이다.

> 내가 원하는 AI 코딩 환경을 제품이 정한 방식으로 쓰고 싶은가?  
> 아니면 필요한 Tool과 규칙을 붙여 직접 조립하고 싶은가?

후자에 가깝다면 Pi는 꽤 흥미로운 선택지다. 특히 dotfiles, 개인 workflow, MCP, memory, web access를 함께 관리하려는 사람에게는 “얇아서 좋은” 코딩 에이전트가 될 수 있다.
