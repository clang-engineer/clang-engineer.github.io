---
title       : "Claude API 기초 — 모델·메시지·스트리밍·도구·프롬프트 캐싱"
description : "Claude Code 같은 도구 아래에 있는 Claude API를 직접 다루는 입문. 모델 ID·가격, Messages API 기본 요청, adaptive thinking, 스트리밍, tool use, 프롬프트 캐싱, 토큰 카운팅을 공식 SDK 기준으로 정리한다."
date        : 2026-07-03 21:50:00 +0900
updated     : 2026-07-03 21:50:00 +0900
categories  : [ai, "Claude API"]
tags        : [claude, api, anthropic-sdk, tool-use, prompt-caching]
pin         : false
hidden      : false
---

> 관련: [AI 로드맵](/posts/ai/2026-07-03-ai-roadmap/)의 **저변·원리** 갈래 · [MCP 개념 정리](/posts/ai/2025-10-23-mcp/)

Claude Code·Cursor 같은 도구는 결국 **Claude API** 위에 얹혀 있다. 직접 앱에 Claude를 붙일 때 마주치는 최소 개념 — 모델 선택, 메시지 요청, 스트리밍, 도구 사용, 프롬프트 캐싱 — 을 공식 SDK 기준으로 정리한다. 예제는 Python이지만 TypeScript·Java·Go·Ruby 등 공식 SDK가 같은 API를 감싼다.

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

모든 요청은 `POST /v1/messages` 하나로 간다. 먼저 모델을 고른다.

| 모델 | 모델 ID | 컨텍스트 | 입력 $/1M | 출력 $/1M |
|---|---|---|---|---|
| Claude Fable 5 | `claude-fable-5` | 1M | $10 | $50 |
| Claude Opus 4.8 | `claude-opus-4-8` | 1M | $5 | $25 |
| Claude Sonnet 4.6 | `claude-sonnet-4-6` | 1M | $3 | $15 |
| Claude Haiku 4.5 | `claude-haiku-4-5` | 200K | $1 | $5 |

지능이 필요하면 Opus, 속도·비용 균형이면 Sonnet, 단순·대량이면 Haiku가 기본 선택이다. **모델 ID는 정확한 문자열 그대로** 쓴다(날짜 접미사 붙이지 않는다). 최신 목록·컨텍스트·기능은 Models API(`client.models.list()`)로 조회할 수 있다.

## 기본 메시지 요청

```python
response = client.messages.create(
    model="claude-opus-4-8",
    max_tokens=16000,
    messages=[{"role": "user", "content": "프랑스의 수도는?"}],
)
print(response.content[0].text)
```

`messages`는 `user`/`assistant`가 번갈아 오는 대화 배열이고, API는 **상태가 없다** — 매번 전체 히스토리를 보낸다. `max_tokens`를 너무 낮게 잡으면 응답이 중간에 잘리니, 비스트리밍은 대략 16K를 기본으로 둔다.

## adaptive thinking과 effort

최신 모델(Fable 5·Opus 4.8·Sonnet 4.6 등)은 **adaptive thinking**을 쓴다 — 얼마나 생각할지 모델이 스스로 정한다. 예전의 `budget_tokens`(고정 토큰 예산)는 이 모델들에서 제거됐다(넣으면 400).

```python
response = client.messages.create(
    model="claude-opus-4-8",
    max_tokens=16000,
    thinking={"type": "adaptive"},
    output_config={"effort": "high"},   # low | medium | high | xhigh | max
    messages=[{"role": "user", "content": "이 문제를 단계별로 풀어줘..."}],
)
```

`effort`는 생각·행동의 깊이와 토큰 지출을 조절한다. 코딩·에이전트 작업은 `high`~`xhigh`가 무난하다.

## 스트리밍

긴 입력·출력, 높은 `max_tokens`에는 스트리밍을 쓴다(요청 타임아웃 방지).

```python
with client.messages.stream(
    model="claude-opus-4-8",
    max_tokens=64000,
    messages=[{"role": "user", "content": "이야기를 써줘"}],
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)
    message = stream.get_final_message()   # 완성된 응답 객체
```

## 도구 사용(tool use)

도구를 정의하면 Claude가 언제 부를지 결정하고, **실행은 당신 코드가** 한다. 이름·설명·JSON 스키마로 정의한다.

```python
tools = [{
    "name": "get_weather",
    "description": "특정 도시의 현재 날씨를 조회. 사용자가 날씨를 물을 때 호출한다.",
    "input_schema": {
        "type": "object",
        "properties": {"city": {"type": "string"}},
        "required": ["city"],
    },
}]
```

`description`은 **언제 부르는지까지** 적는 게 좋다(최신 Opus는 도구를 보수적으로 부른다). 응답에 `tool_use` 블록이 오면 실행 후 `tool_result`로 결과를 돌려주고 대화를 잇는다. SDK의 tool runner를 쓰면 이 루프를 자동으로 돌려준다. 외부 도구를 **표준 방식으로** 붙이는 상위 개념이 [MCP](/posts/ai/2025-10-23-mcp/)다.

## 프롬프트 캐싱 — 반복 프리픽스를 아낀다

캐싱은 **프리픽스 매칭**이다 — 프리픽스의 한 바이트라도 바뀌면 그 뒤가 전부 무효화된다. 큰 고정 컨텍스트(문서·지침)를 앞에, 매번 바뀌는 것(질문·타임스탬프)을 뒤에 둔다.

```python
response = client.messages.create(
    model="claude-opus-4-8",
    max_tokens=16000,
    system=[{
        "type": "text",
        "text": "<크고 고정된 지침·문서>",
        "cache_control": {"type": "ephemeral"},
    }],
    messages=[{"role": "user", "content": "핵심을 요약해줘"}],
)
print(response.usage.cache_read_input_tokens)   # 캐시에서 읽은 토큰(≈0.1배 비용)
```

캐시 읽기는 기본 입력가의 약 0.1배다. `cache_read_input_tokens`가 계속 0이면 시스템 프롬프트에 `datetime.now()` 같은 **조용한 무효화 요인**이 있는 것.

## 토큰 세기

토큰 수는 모델별로 다르다. **`tiktoken`을 쓰지 말 것**(OpenAI 토크나이저라 Claude에서 15~20% 어긋난다). 전용 엔드포인트를 쓴다.

```python
n = client.messages.count_tokens(
    model="claude-opus-4-8",
    messages=[{"role": "user", "content": open("CLAUDE.md").read()}],
).input_tokens
```

---

여기까지가 Claude를 코드에 직접 붙이는 최소 지형이다. 외부 리소스를 표준으로 연결하는 [MCP 개념](/posts/ai/2025-10-23-mcp/)과, 이미 만들어진 도구로서의 [Claude Code](/posts/ai/2025-10-24-claude-code/)를 함께 보면 "API → 프로토콜 → 완성 도구"의 층위가 맞춰진다. 전체 경로는 [AI 로드맵](/posts/ai/2026-07-03-ai-roadmap/).
