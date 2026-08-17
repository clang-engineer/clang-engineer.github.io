# 에이전트와 MCP

## LLM과 Agent의 차이

LLM은 입력을 받아 다음 Token을 생성한다. Agent는 LLM이 목표를 달성하기 위해 외부 도구를 선택하고 결과를 다시 판단하도록 감싼 실행 구조다.

사용자 목표
→ LLM이 현재 상태와 다음 행동 판단
→ Tool 호출
→ Tool 결과 수신
→ 결과가 충분한지 판단
→ 추가 호출 또는 최종 답변

실제 명령을 실행하는 것은 Tool이고, 무엇을 호출할지 결정하는 것은 LLM이다. 파일 읽기·쓰기나 API 호출 자체는 LLM Token 연산이 아니지만, Tool 결과를 해석하고 다음 행동을 정할 때 다시 LLM 추론이 발생한다.

## Agent 구성요소

- Model: 판단과 Text 생성
- System Prompt·정책: 역할과 허용 범위
- Tool: 검색·파일·Code 실행·DB·업무 API
- Memory·상태: 이전 결과와 작업 진행상황
- Planner·Loop: 다음 행동 선택과 반복
- Guardrail: 권한·검증·중단 조건
- Observation: Tool 실행 결과
- Evaluation: 목표 달성 여부 확인

Agent가 항상 자율적으로 오래 실행되어야 하는 것은 아니다. 단순한 한 번의 Function Calling도 넓은 의미의 Agent 동작에 포함될 수 있다.

## MCP

MCP(Model Context Protocol)는 AI 애플리케이션이 외부 Tool·Resource·Prompt를 일정한 방식으로 발견하고 사용하도록 정한 연결 규약이다.

MCP Server는 다음 정보를 제공할 수 있다.

- Tools: 실행 가능한 기능과 입력 Schema
- Resources: 읽을 수 있는 문서·Data·상태
- Prompts: 재사용 가능한 작업 지침

MCP의 핵심 가치는 LLM이 모든 외부 시스템의 API 형식을 미리 알 필요가 없도록 기능 목록과 사용법을 표준화해 제공하는 것이다. 대화에서 말한 것처럼 Tool을 찾아갈 수 있는 지도를 먼저 제공하는 셈이다.

MCP가 API 자체를 없애는 것은 아니다. MCP Server 내부에서는 DB·파일 시스템·외부 API를 호출할 수 있다. MCP는 AI Client와 Tool 제공자 사이의 발견·호출 규격이다.

## 일반 API·RAG·MCP 비교

- API: 시스템 기능과 Data를 Program이 호출하는 일반 Interface
- RAG: 관련 문서를 검색해 LLM의 Context에 넣는 지식 연결 방식
- MCP: AI가 Tool과 Resource를 발견하고 호출하는 연결 규약

MCP Resource가 내부적으로 Vector Search를 제공할 수 있고, MCP Tool이 RAG Pipeline을 실행할 수도 있다. 서로 배타적인 개념이 아니다.

## Serena와 Context7 관점

Context7 같은 Tool은 Library·Framework의 최신 문서를 찾아 필요한 부분을 제공한다. 문서 Retrieval이 핵심이다.

Serena 같은 Code 탐색 Tool은 Repository의 Symbol·Reference·구조를 분석해 LLM이 모든 파일을 무작정 읽지 않고 필요한 Code로 이동하게 돕는다. 중간 도구가 필요한 이유는 대규모 Code Base를 구조화하고, 검색 범위를 줄이며, 정확한 위치와 관계를 제공하기 위해서다.

## 토큰과 비용

Tool 자체의 계산이 모두 LLM Token을 쓰는 것은 아니다. 그러나 다음 내용은 Context에 들어가므로 Token을 사용한다.

- Tool 목록과 Schema
- Tool 호출 인자
- Tool 결과
- Agent의 반복 판단
- 최종 답변

Tool이 너무 많거나 결과가 길면 Context와 추론 비용이 증가한다. 필요한 Tool만 노출하고 결과를 요약·필터링하는 설계가 중요하다.

## 안전과 운영

- 최소권한과 사용자별 권한 전달
- 쓰기·삭제·외부 전송 전 승인
- Tool 입력 검증
- 실행 결과와 감사 Log
- Prompt Injection 격리
- 반복 횟수·시간·비용 제한
- 실패 시 중단·복구
- Tool 결과의 신뢰 수준 표시

## 기억 흐름

LLM이 판단
→ Agent Loop가 행동 계획
→ MCP가 Tool과 Resource 지도를 제공
→ Tool이 외부 시스템에서 실제 작업
→ 결과를 LLM이 다시 해석
