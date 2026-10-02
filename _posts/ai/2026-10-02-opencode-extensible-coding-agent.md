---
title       : "OpenCode — 완제품 UX와 Plugin 생태계를 함께 가진 터미널 코딩 에이전트"
description : "OpenCode를 Claude Code 계열 터미널 코딩 에이전트의 오픈소스 대안으로 보고, 기본 UX와 Plugin 확장 구조를 중심으로 정리한다."
date        : 2026-10-02 00:00:00 +0900
categories  : [ai, "코딩 에이전트"]
tags        : [opencode, ai-agent, ai-coding, coding-agent, plugin, extension]
pin         : false
hidden      : false
---

> 관련: [Claude Code에서 OpenCode를 거쳐 pi까지 — AI 코딩 하네스를 점점 얇게 만든 기록](./2026-09-21-pi-coding-agent-harness.md)

OpenCode는 터미널에서 쓰는 오픈소스 AI 코딩 에이전트다. Claude Code나 Codex CLI처럼 대화형으로 프로젝트를 읽고, 파일을 수정하고, 명령을 실행하는 흐름을 제공한다. 내가 OpenCode를 볼 때 핵심은 두 가지다.

```text
OpenCode
├─ 기본적으로 바로 쓸 수 있는 터미널 코딩 에이전트
└─ Plugin으로 동작을 확장할 수 있는 오픈소스 기반
```

즉 OpenCode는 단순한 CLI 래퍼라기보다, 코딩 에이전트 제품에 가까운 사용감을 오픈소스 형태로 제공하려는 쪽에 가깝다.

## OpenCode를 보는 기준

AI 코딩 도구를 비교할 때 모델 성능만 보면 차이가 흐려진다. 실제 사용감은 모델보다 하네스에서 갈리는 경우가 많다.

여기서 하네스는 모델이 개발 작업을 하도록 돕는 실행 환경이다.

```text
모델
  ↓
코딩 에이전트 하네스
  ├─ 파일 읽기·수정
  ├─ Shell 명령 실행
  ├─ 권한 확인
  ├─ Context 구성
  ├─ Subagent / Mode
  ├─ Plugin / Extension
  └─ Terminal UI
```

OpenCode는 이 하네스를 사용자가 처음부터 직접 조립하게 하기보다, 어느 정도 완성된 형태로 제공한다. 그래서 관심사는 “무엇을 직접 붙일 수 있나”보다 먼저 “기본 경험이 얼마나 자연스러운가”에 놓인다.

## 기본 UX — 바로 쓰는 에이전트

OpenCode의 장점은 시작점이 낮다는 데 있다. 터미널에서 대화형 에이전트로 들어가면, 일반적인 코딩 에이전트에게 기대하는 흐름을 바로 사용할 수 있다.

- 프로젝트 파일을 읽고 요약한다.
- 필요한 수정 범위를 찾는다.
- 변경안을 제안하거나 직접 수정한다.
- 명령 실행 전후로 결과를 보고 다음 행동을 정한다.
- 작업 성격에 따라 mode나 agent를 나눠 쓸 수 있다.

이런 도구에서 중요한 것은 기능 목록보다 반복 루프의 마찰이다.

```text
요청
  ↓
파일 탐색
  ↓
수정
  ↓
검증
  ↓
후속 수정
```

OpenCode는 이 루프를 “제품”처럼 잡아주려는 도구다. 그래서 Claude Code에 익숙한 사용자가 오픈소스 대안을 찾을 때 자연스럽게 후보가 된다.

## Plugin — 완제품 위에 붙이는 확장

OpenCode에도 Plugin 생태계가 있다. 공식 문서 기준으로 Plugin은 OpenCode의 여러 event에 hook을 걸어 동작을 바꾸거나, 외부 서비스와 통합하거나, 기능을 추가하는 방식이다.

Plugin을 불러오는 방식도 두 갈래다.

```text
OpenCode Plugin
├─ Local plugin
│  ├─ .opencode/plugins/              # Project-level
│  └─ ~/.config/opencode/plugins/     # Global
└─ npm package plugin
   └─ opencode.json의 plugin 배열에 지정
```

npm Plugin은 시작 시 Bun을 통해 설치되고 cache된다. local Plugin은 plugin directory에서 직접 로드된다. 이 구조 덕분에 개인 자동화는 local로 두고, 재사용 가능한 통합은 npm package로 배포할 수 있다.

Plugin이 확장하는 방향은 대략 다음과 같다.

- 외부 서비스 연동
- command 추가
- agent나 skill 구성 변경
- provider나 model 쪽 통합
- TUI 동작 보강
- 작업 흐름에 맞춘 hook 추가

즉 OpenCode의 Plugin은 “빈 하네스를 채우기 위한 부품”이라기보다, 이미 있는 에이전트 제품의 동작을 바꾸고 넓히는 장치에 가깝다.

## OpenCode가 잘 맞는 경우

OpenCode는 다음 상황에서 특히 매력적이다.

1. Claude Code와 비슷한 터미널 에이전트 경험을 원한다.
2. 도구 자체가 오픈소스이길 원한다.
3. 기본 UX는 완제품처럼 쓰고 싶다.
4. 필요하면 Plugin으로 행동을 바꾸고 싶다.
5. 모델·Provider·Agent 구성을 직접 들여다보고 조정하고 싶다.

반대로 아주 얇은 실행 하네스를 두고 처음부터 필요한 도구만 붙이고 싶다면 OpenCode보다 Pi 같은 접근이 더 맞을 수 있다.

## Pi와 나란히 보면 보이는 차이

OpenCode와 Pi는 둘 다 확장 가능한 코딩 에이전트로 볼 수 있다. 하지만 출발점이 다르다.

```text
OpenCode = 완제품에 가까운 Agent + Plugin으로 확장
Pi       = 얇은 Harness + Package/Extension으로 조립
```

OpenCode는 “일단 좋은 터미널 코딩 에이전트를 쓰고, 필요한 부분을 Plugin으로 바꾼다”는 감각이 강하다. Pi는 “최소 하네스 위에 도구, 규칙, UI, memory, web access를 붙여 내 작업 환경을 만든다”는 감각이 강하다.

그래서 둘은 단순 우열보다 취향과 운영 방식의 차이에 가깝다.

- 빠르게 완성도 있는 Agent UX를 쓰고 싶다 → OpenCode
- Agent 하네스 자체를 내 방식으로 조립하고 싶다 → Pi

## 결론

OpenCode는 Claude Code 계열 터미널 코딩 에이전트를 오픈소스와 Plugin 생태계 쪽으로 가져온 도구로 볼 수 있다. 기본 경험은 완제품에 가깝고, Plugin은 그 위에 개인 워크플로와 외부 통합을 더하는 확장점이다.

따라서 OpenCode를 평가할 때는 “어떤 모델을 쓰나”보다 다음 질문이 더 중요하다.

> 내 코딩 루프를 기본 UX 안에서 편하게 돌릴 수 있는가?  
> 부족한 부분을 Plugin으로 안전하게 확장할 수 있는가?

이 두 질문에 예라고 답할 수 있다면 OpenCode는 충분히 써볼 만한 터미널 AI 코딩 에이전트다.
