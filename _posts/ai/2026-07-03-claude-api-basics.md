---
title       : "Claude API 기초 — 모델·메시지·스트리밍·도구·프롬프트 캐싱"
description : "Claude Code 같은 도구 아래에 있는 Claude API를 직접 다루는 입문. 모델 선택, Messages API 기본 요청, adaptive thinking, effort, 스트리밍, tool use, 프롬프트 캐싱, 토큰 카운팅을 공식 SDK 기준으로 정리한다."
date        : 2026-07-03 21:50:00 +0900
updated     : 2026-08-22 17:00:00 +0900
categories  : [ai, "Claude API"]
tags        : [claude, api, anthropic-sdk, tool-use, prompt-caching]
pin         : false
hidden      : false
---

> 관련: [AI 로드맵](/posts/ai/2026-07-03-ai-roadmap/)의 **저변·원리** 갈래 · [MCP 개념 정리](/posts/ai/2025-10-23-mcp/)

Claude Code·Cursor 같은 도구는 결국 모델 API를 호출해 동작한다. 직접 앱에 Claude를 붙일 때 마주치는 최소 개념 — 모델 선택, 메시지 요청, 스트리밍, 도구 사용, 프롬프트 캐싱 — 을 공식 SDK 기준으로 정리한다. 예제는 Python이지만 TypeScript·Java·Go·Ruby 등 공식 SDK도 같은 API 개념을 사용한다.

> 모델명·가격·지원 기능은 빠르게 바뀐다. 아래 표는 **2026-08 기준**이며, 실제 도입 전에는 Claude Platform의 Models 문서와 API에서 현재 모델 목록을 다시 확인한다.
{: .prompt-warning }

## 설치와 클라이언트

```bash
pip install anthropic          # Python
# npm install @anthropic-ai/sdk  (TypeScript)
```

```python
from anthropic import Anthropic

client = Anthropic()   # ANTHROPIC_API_KEY 환경변수에서 키를 읽는다
```

## 모델 고르기

일반적인 대화 요청은 Messages API(`POST /v1/messages`)로 보낸다. 먼저 작업 특성에 맞는 모델을 고른다.

| 모델 | API 모델 ID | 컨텍스트 | 입력 $/1M tokens | 출력 $/1M tokens | 성격 |
|---|---|---:|---:|---:|---|
| Claude Fable 5 | `claude-fable-5` | 1M | $10 | $50 | 가장 높은 범용 성능, 장시간 Agent 작업 |
| Claude Opus 5 | `claude-opus-5` | 1M | $5 | $25 | 복잡한 코딩·Agent·Enterprise 작업 |
| Claude Sonnet 5 | `claude-sonnet-5` | 1M | $3 | $15 | 속도와 성능의 균형 |
| Claude Haiku 4.5 | `claude-haiku-4-5` | 200K | $1 | $5 | 빠른 응답과 대량 처리 |

가장 어려운 장시간 작업은 Fable 5, 복잡한 코딩·Agent 작업은 Opus 5, 일반적인 서비스와 개발 작업은 Sonnet 5, 단순·대량 처리는 Haiku 4.5부터 검토하면 된다. 비용과 지원 기능은 모델 세대에 따라 바뀌므로 코드에 모델 ID를 박아두기 전에 공식 Models 문서를 확인한다.

## 기본 메시지 요청

```python
response = client.messages.create(
    model="claude-sonnet-5",
    max_tokens=16000,
    messages=[{"role": "user", "content": "프랑스의 수도는?"}],
)
print(response.content[0].text)
```

`messages`는 `user`/`assistant` 역할의 대화 배열이다. Messages API 자체는 서버가 이전 요청의 대화 상태를 자동 보관하는 방식이 아니므로, 이어지는 대화에서는 필요한 이전 메시지를 다시 전달한다.

`max_tokens`는 응답에 사용할 수 있는 최대 토큰 수다. 무조건 크게 잡기보다 작업의 길이와 모델의 최대 출력 범위에 맞춰 정한다.

## Adaptive Thinking과 Effort

최신 Claude 모델 가운데 Fable 5·Opus 5·Sonnet 5는 **Adaptive Thinking**을 지원한다. 모델이 작업 난이도에 따라 사고량을 조절하고, `effort`로 응답 전체에 사용할 계산량과 토큰 소비 수준을 조절한다.

```python
response = client.messages.create(
    model="claude-opus-5",
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
| `high` | 기본값. 복잡한 추론·코딩·Agent 작업 |
| `xhigh` | 장시간 코딩·Agent처럼 더 깊은 작업. 지원 모델에서만 사용 |
| `max` | 토큰 소비보다 최고 성능이 중요한 작업. 지원 모델에서만 사용 |

기본값은 `high`다. 따라서 모든 코딩 요청을 습관적으로 `xhigh`나 `max`로 올리기보다 **`high`에서 시작해 실제 평가 결과에 따라 조정**하는 편이 낫다. Opus 5와 Sonnet 5는 어려운 코딩·Agent 작업에서 `xhigh`를 선택할 수 있고, `max`는 추가 비용이 정당한 문제에 제한적으로 사용한다.

모델마다 지원하는 effort 단계가 다르므로 특정 값을 코드에 고정하기 전에 공식 Effort 문서를 확인한다.

## 스트리밍

출력이 길거나 결과를 생성되는 즉시 보여줘야 한다면 스트리밍을 사용한다.

```python
with client.messages.stream(
    model="claude-sonnet-5",
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

외부 Tool·Resource를 여러 AI Client에서 공통 방식으로 발견하고 호출하도록 표준화한 상위 규격이 [MCP](/posts/ai/2025-10-23-mcp/)다.

## 프롬프트 캐싱 — 반복되는 Prefix를 아낀다

프롬프트 캐싱은 반복되는 고정 Context의 비용과 지연을 줄이는 기능이다. 큰 지침·문서처럼 자주 재사용하는 내용을 앞쪽에 두고, 질문·시간처럼 자주 바뀌는 내용은 뒤에 두는 편이 유리하다.

```python
response = client.messages.create(
    model="claude-sonnet-5",
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
    model="claude-sonnet-5",
    messages=[{"role": "user", "content": open("CLAUDE.md").read()}],
).input_tokens
```

---

여기까지가 Claude를 코드에 직접 붙일 때 필요한 최소 지형이다. 외부 Tool·Resource 연결을 표준화하는 [MCP 개념](/posts/ai/2025-10-23-mcp/)과 완성된 개발 도구인 [Claude Code](/posts/ai/2025-10-24-claude-code/)를 함께 보면 **API → Protocol → 완성 도구**의 층위가 보인다. 전체 경로는 [AI 로드맵](/posts/ai/2026-07-03-ai-roadmap/).
