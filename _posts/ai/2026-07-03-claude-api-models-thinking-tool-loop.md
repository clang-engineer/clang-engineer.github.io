---
title       : "Claude API의 실행 구조 — 모델·추론 강도·Tool Loop·캐시 구분하기"
description : "Claude API를 붙일 때 모델 선택과 추론 강도, 메시지 상태, 도구 실행 루프, 스트리밍과 캐시가 각각 무엇을 결정하는지 구분하고 최소 SDK 예제로 연결한다."
date        : 2026-07-03 21:50:00 +0900
updated     : 2026-11-18 12:00:00 +0900
categories  : [ai, "Claude API"]
tags        : [claude, api, anthropic-sdk, tool-use, prompt-caching]
pin         : false
hidden      : false
redirect_from:
  - /posts/ai/2026-07-03-claude-api-basics/
---

> 관련: [AI 개발 지형](./2026-07-03-ai-development-map.md)의 API 애플리케이션 영역 · [MCP 개념 정리](./2025-10-23-mcp.md)

Claude Code 같은 코딩 도구를 사용하는 것과 내 앱에서 모델 API를 호출하는 것은 다른 개발 경로다. API를 직접 붙이면 모델이 도구 호출을 제안하더라도 **실행·승인·상태 보존·재시도는 애플리케이션의 책임**이 된다.

먼저 어떤 값이 어떤 동작을 조절하는지 나눈다. 아래 화살표는 요청·도구 결과의 왕복이다.

```text
애플리케이션: 메시지·지침 + 모델 ID + 추론/출력 설정
                         ↓
                    Messages API
                         ↓
            텍스트 응답 또는 도구 호출 제안
                         ↓
           앱이 권한·입력을 검증하고 도구 실행
                         ↓
             tool_result를 다음 요청에 포함

스트리밍 : 응답을 언제부터 전달할지
캐시     : 같은 입력 Prefix를 얼마나 재사용할지
```

모델을 바꾸는 것, 같은 모델의 추론 강도를 바꾸는 것, 응답 표시 방식을 바꾸는 것을 혼동하지 않는다. 예제는 Python SDK로 실행 경계를 보여 주는 최소 예시다.

> 아래 모델·추론 계약은 **2026-11-18 공식 문서 확인 기준**이다. 가격을 고정 표로 복제하지 않고 [Models](https://platform.claude.com/docs/en/models/overview)와 [Pricing](https://platform.claude.com/docs/en/about-claude/pricing)에서 현재 계정·제공 경로의 조건을 확인한다.
{: .prompt-warning }

## 설치와 클라이언트

```bash
pip install anthropic          # Python
# npm install @anthropic-ai/sdk  (TypeScript)
```

```python
import os
from anthropic import Anthropic

client = Anthropic()   # ANTHROPIC_API_KEY 환경변수에서 키를 읽는다
MODEL = os.environ["CLAUDE_MODEL"]  # 계정에서 지원하는 현재 모델 ID
```

## 모델 고르기

일반적인 대화 요청은 Messages API(`POST /v1/messages`)로 보낸다. 먼저 작업 특성에 맞는 모델을 고른다.

| 작업의 성격 | 현재 모델 ID 예 | 선택 시 확인할 것 |
|---|---|---|
| 장시간 코딩·지식 작업 | `claude-opus-5-5` | 대표 작업의 품질·도구 사용·지연 |
| 더 어려운 추론·장기 작업 | `claude-fable-5-2` | Opus에서 추론 강도를 올린 뒤에도 부족한지 |
| 속도와 품질의 균형 | `claude-sonnet-5-5` | 실제 서비스의 품질·비용 균형 |
| 대량·저지연 분류·추출 | `claude-haiku-5-5` | 개별 오류 비용과 처리량 |

모델 이름만 보고 작업을 영구 배정하지 않는다. 같은 데이터·완료 조건으로 평가한 뒤 모델과 effort를 함께 정한다. 현재 이 네 모델의 동기 Messages API 컨텍스트는 1M, 최대 출력은 128K로 안내되지만 배치 API·제공 플랫폼·모델 세대별 조건은 별도로 확인한다.

모델 ID는 앱 설정으로 분리한다. 아래 예제는 같은 Python 세션에서 앞의 `client`와 `MODEL`을 이어 쓴다.

## 기본 메시지 요청

```python
response = client.messages.create(
    model=MODEL,
    max_tokens=16000,
    messages=[{"role": "user", "content": "프랑스의 수도는?"}],
)
print(response.content[0].text)
```

`messages`는 `user`/`assistant` 역할의 대화 배열이다. Messages API 자체는 서버가 이전 요청의 대화 상태를 자동 보관하는 방식이 아니므로, 이어지는 대화에서는 필요한 이전 메시지를 다시 전달한다.

`max_tokens`는 응답에 사용할 수 있는 최대 토큰 수다. 무조건 크게 잡기보다 작업의 길이와 모델의 최대 출력 범위에 맞춰 정한다.

## Adaptive Thinking과 Effort

**Adaptive Thinking**은 모델이 요청에 따라 추론 여부·깊이를 조절하는 방식이다. **Effort**는 그 작업에 어느 정도 계산·토큰을 쓰도록 유도할지 정하는 별도 신호다. 같은 `high`라도 모든 모델에서 동일한 시간·토큰·품질을 뜻하지 않는다. Thinking 설정의 허용값은 모델별로 확인한다.

```python
response = client.messages.create(
    model=MODEL,
    max_tokens=64000,
    thinking={"type": "adaptive"},
    output_config={"effort": "high"},
    messages=[{"role": "user", "content": "이 문제를 분석하고 해결해줘"}],
)
```

`effort`는 엄격한 토큰 예산이 아니라 **행동 깊이와 토큰 사용량을 조절하는 신호**다. 텍스트 답변뿐 아니라 Tool 호출과 Thinking에도 영향을 준다.

| 수준 | 용도 |
|---|---|
| `low` | 단순 작업, 대량·저지연 처리 |
| `medium` | 비용과 품질의 균형 |
| `high` | 복잡한 추론·코딩·Agent 작업 |
| `xhigh` | 장시간 코딩·Agent처럼 더 깊은 작업. 지원 모델에서만 사용 |
| `max` | 토큰 소비보다 최고 성능이 중요한 작업. 지원 모델에서만 사용 |

기본값도 모델별로 다르다. 확인 시점의 공식 문서는 Opus 5.5·Haiku 5.5는 `medium`, 그 밖의 지원 모델은 `high`로 설명한다. `xhigh`·`max`를 습관적으로 고정하지 말고 대표 작업의 실패·지연·비용을 평가해 조정한다. 지원 단계는 [공식 Effort 문서](https://platform.claude.com/docs/en/build-with-claude/effort)를 따른다.

| 서로 다른 조절값 | 의미 |
|---|---|
| 모델 ID | 어떤 추론 엔진을 사용할까 |
| Adaptive Thinking | 모델이 추론을 어떻게 사용할까 |
| `output_config.effort` | 답변·도구 호출·Thinking 전체의 작업 강도를 어떻게 유도할까 |
| `max_tokens` | Thinking을 포함한 총 출력의 상한은 얼마인가 |
| UI에서 Thinking 숨기기 | 이미 수행되는 추론을 화면에 보일까; 계산량을 줄이는 설정은 아님 |

OMP 같은 하네스의 `auto`는 **하네스가 강도를 고르는 정책**이고, Claude API의 Adaptive Thinking과 동일한 API 옵션이 아니다. `off`·`minimal`도 모든 모델의 공통 단계가 아니다. OMP의 전체 단계·전환 방법은 [devkit 추론 강도 표](https://github.com/clang-engineer/devkit/blob/main/reference/cheatsheets/omp.md#추론-강도)에서 확인한다.

## 스트리밍

출력이 길거나 결과를 생성되는 즉시 보여줘야 한다면 스트리밍을 사용한다.

```python
with client.messages.stream(
    model=MODEL,
    max_tokens=64000,
    messages=[{"role": "user", "content": "긴 보고서를 작성해줘"}],
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)
    message = stream.get_final_message()
```

스트리밍은 큰 응답을 한 번에 기다리지 않고 점진적으로 받을 수 있다는 것이 핵심이다. 요청 제한이나 타임아웃 정책은 실행 환경과 SDK 설정도 함께 확인한다.

## 도구 사용(Tool Use)

도구를 정의하면 Claude가 언제 호출할지 판단하고, **실제 실행은 애플리케이션 코드가 담당**한다. 이름·설명·입력 JSON Schema로 Tool을 정의한다.

```python
tools = [{
    "name": "get_weather",
    "description": "특정 도시의 현재 날씨를 조회한다. 사용자가 날씨를 물을 때 호출한다.",
    "input_schema": {
        "type": "object",
        "properties": {"city": {"type": "string"}},
        "required": ["city"],
    },
}]
```

응답에 `tool_use` 블록이 오면 애플리케이션이 해당 Tool을 실행하고 결과를 `tool_result`로 돌려준 뒤 대화를 이어간다. SDK의 Tool Runner를 사용하면 이 반복 흐름을 자동화할 수 있다.

여기에는 도구 입력 검증, 사용자 권한, 부작용·멱등성, 실패 결과 전달이 필요하다. 모델이 유효한 JSON을 생성했다는 사실이 실행 승인이나 업무적 정답을 보장하지 않는다.

외부 Tool·Resource를 여러 AI Client에서 발견하고 호출하도록 표준화하는 것이 [MCP](./2025-10-23-mcp.md)다. MCP는 모델 API 위의 필수 상위 단계가 아니라 앱이 선택해 조합할 수 있는 도구 연결 계약이다.

## 프롬프트 캐싱 — 반복되는 Prefix를 아낀다

프롬프트 캐싱은 반복되는 고정 Context의 비용과 지연을 줄이는 기능이다. 큰 지침·문서처럼 자주 재사용하는 내용을 앞쪽에 두고, 질문·시간처럼 자주 바뀌는 내용은 뒤에 두는 편이 유리하다.

```python
response = client.messages.create(
    model=MODEL,
    max_tokens=16000,
    system=[{
        "type": "text",
        "text": "<크고 고정된 지침·문서>",
        "cache_control": {"type": "ephemeral"},
    }],
    messages=[{"role": "user", "content": "핵심을 요약해줘"}],
)
print(response.usage.cache_read_input_tokens)
```

캐시 동작과 가격은 모델·Platform 정책에 따라 달라질 수 있으므로 구체적인 할인율을 문서에 고정하기보다 `cache_read_input_tokens` 등 Usage 값을 확인해 실제 적용 여부를 검증한다.

## 토큰 세기

Claude의 토큰 수를 OpenAI용 Tokenizer로 추정하지 않는다. 정확한 입력 토큰 수가 필요하면 Claude API의 Token Counting 기능을 사용한다.

```python
n = client.messages.count_tokens(
    model=MODEL,
    messages=[{"role": "user", "content": open("CLAUDE.md").read()}],
).input_tokens
```

---

모델 API를 직접 쓰는 앱은 메시지 상태와 Tool Loop를 책임진다. MCP는 외부 연결 계약이고, Claude Code는 이 루프와 작업 환경을 제공하는 완성된 도구다. 세 대상을 필수 학습 단계로 줄 세우지 않고 **직접 구현할 책임과 재사용할 계약**을 기준으로 선택한다. 전체 위치는 [AI 개발 지형](./2026-07-03-ai-development-map.md)에서 확인한다.
