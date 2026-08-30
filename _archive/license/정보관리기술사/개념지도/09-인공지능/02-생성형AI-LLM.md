# 인공지능 생성형 AI·LLM 개념지도

이 문서는 `09-인공지능.md`에서 Foundation Model·생성형 AI·LLM 가지를 선택했을 때, **LLM 내부와 활용 기술을 주변으로 파고들기 위한 하위 지도**다.

세부 구현과 내부 Algorithm은 `../세부학습/09-인공지능/`에서 다룬다.

---

## 1. Foundation Model과 생성형 AI의 좌표

```text
대규모 Data
 ↓
Pre-training
 ↓
Foundation Model
├─ Language Foundation Model
│   └─ LLM
├─ Vision Foundation Model
├─ Multimodal Foundation Model
└─ Domain Foundation Model
```

```text
Generative AI
├─ Text
│   └─ LLM
│       └─ Autoregressive Token 생성
├─ Image
│   ├─ GAN
│   └─ Diffusion
├─ Audio / Video
└─ Multimodal
```

`Foundation Model`, `Generative AI`, `LLM`, `Transformer`, `GAN`, `Diffusion`, `Multimodal`은 같은 계층의 용어가 아니다.

상세: `../세부학습/09-인공지능/생성형-AI와-멀티모달.md`, `../세부학습/09-인공지능/Foundation-Model과-AI-활용계층.md`

---

## 2. Model을 만드는 층과 활용하는 층

```text
[Model을 만드는 층]
대규모 Data
 ↓
Pre-training
 ↓
Foundation Model
 ↓
Post-training / Fine-tuning
 ↓
Serving

[Model을 활용하는 층]
Foundation Model / LLM
 ↓
Prompt · Context · Retrieval · Tool
 ↓
업무 Service
```

Fine-tuning은 Model을 추가 학습하는 쪽이고, Prompt·RAG·Tool은 주로 이미 만들어진 Model을 활용하는 쪽에서 만난다.

---

## 3. LLM 내부: Token에서 다음 Token까지

```text
Text
 ↓
Tokenization
 ↓
Token ID
 ↓
Token Embedding
 ↓
Transformer
├─ Attention
│   ├─ Query
│   ├─ Key
│   └─ Value
├─ Multi-head Attention
└─ Feed Forward
 ↓
다음 Token 확률분포
 ↓
Decoding
 ↓
Token 생성
 ↓
Context에 추가
 └──────── 반복
```

Inference에서 이어지는 꼭지:

```text
Inference
├─ Context Window
├─ Autoregressive Generation
├─ Decoding
├─ KV Cache
└─ GPU Memory / Serving
```

상세: `../세부학습/09-인공지능/LLM의-동작원리.md`, `../세부학습/09-인공지능/LLM-추론과-Token-생성.md`, `../세부학습/09-인공지능/LLM-내부운영과-GPU-메모리.md`

---

## 4. LLM 활용: 무엇이 부족한가에 따라 갈라진다

```text
                         LLM
                          │
        ┌─────────────────┼─────────────────┐
        ↓                 ↓                 ↓
      지시·예제           외부 지식            행동
        │                 │                 │
Prompt / Few-shot         RAG          Tool Calling
                          │                 │
                     Embedding             Agent
                     Retrieval              │
                                           MCP

Model 행동 자체를 반복적으로 조정
→ Fine-tuning
```

```text
규칙·역할            → System Prompt
몇 개 예제           → Few-shot
최신·사내 지식       → RAG
반복 행동 조정        → Fine-tuning
외부 세계에서 행동    → Tool / Agent
```

Prompt·RAG·Fine-tuning·Agent는 같은 문제를 해결하는 단순 대체재가 아니다.

---

## 5. Prompt와 Context

```text
LLM Context
├─ System Prompt
├─ User Prompt
├─ Few-shot Example
├─ Retrieved Context
├─ Tool Result / Observation
└─ 이전 대화
```

Prompt·Few-shot·RAG는 기본 Model Weight를 바꾸지 않고 Inference 시점에 들어가는 Context를 구성한다.

상세: `../세부학습/09-인공지능/LLM-프롬프트와-Context-제어.md`

---

## 6. RAG: 외부 지식 가지를 따라간다

```text
RAG
├─ 지식 준비
│   ├─ Chunking
│   ├─ Embedding
│   └─ Vector DB
│
└─ Retrieval
    ├─ Keyword / BM25
    ├─ Vector Search
    │   ├─ Exact Search
    │   └─ ANN
    │       ├─ HNSW
    │       └─ IVF / IVFFlat
    ├─ Hybrid Search
    └─ Re-ranking
        ↓
      관련 원문
        ↓
      LLM Context
```

검색용 Vector는 관련 원문을 찾기 위한 의미적 검색 표현이다.

RAG에서 더 파고들 꼭지:

```text
Embedding
├─ Token 표현
└─ Chunk / Query Vector

Retrieval
├─ Similarity
├─ ANN
├─ Metadata / 권한 Filter
└─ Re-ranking
```

상세: `../세부학습/09-인공지능/임베딩-벡터검색-RAG.md`

---

## 7. Fine-tuning

```text
Fine-tuning
├─ [학습 신호 관점]
│   └─ SFT
│       └─ 입력-정답 Pair
└─ [Parameter 효율 관점]
    ├─ Full Fine-tuning
    └─ PEFT
        └─ LoRA

SFT + LoRA
→ 함께 사용 가능
```

```text
Prompt / Few-shot / RAG
→ 주로 Inference Context 변경
→ 기본 Model Weight 변경 없음

Fine-tuning
→ Training 수행
→ Weight 또는 추가 학습 Parameter 변경
```

상세: `../세부학습/09-인공지능/Fine-tuning과-PEFT-LoRA.md`

---

## 8. Agent: 판단에서 행동으로

```text
사용자 목표
 ↓
LLM 판단
 ↓
Tool이 필요한가?
├─ 아니오 → 답변 / 종료
└─ 예
    ↓
  Tool Call
    ↓
  Tool 실행
    ↓
  Observation
    ↓
  Context에 반영
    ↓
  LLM 재판단
    └────── 반복
```

Agent를 잡으면 주변으로 다음을 파고든다.

```text
Agent
├─ LLM
├─ Tool
├─ Observation / Context
├─ Memory
├─ Agentic RAG
└─ Runtime / Harness
    ├─ Rules / Context
    ├─ Skills
    ├─ Hooks
    ├─ Tool / Permission
    ├─ Workflow
    └─ Orchestration
```

상세: `../세부학습/09-인공지능/Agent-Harness.md`

---

## 9. MCP: 외부 기능 연결 규격

```text
Agent / AI Client
 ↓
MCP
├─ Tools
├─ Resources
└─ Prompts
 ↓
MCP Server
 ↓
API / DB / File / 외부 System
```

MCP가 없어도 Agent가 Tool을 직접 호출할 수 있다. MCP는 Agent 자체나 Tool 자체가 아니라 외부 기능을 발견·호출하는 공통 Protocol이다.

```text
RAG
= 필요한 정보를 찾는 구조

MCP
= 외부 기능·Resource를 연결하는 Protocol

Agent
= 판단과 행동을 반복하는 실행 주체

Harness
= Agent를 둘러싼 운영·통제 체계
```

상세: `../세부학습/09-인공지능/에이전트와-MCP.md`, `../세부학습/09-인공지능/Agent-Harness.md`

---

## 10. LLM 기반 응용으로 내려간다

```text
LLM
 ↓
업무 Task
├─ Chatbot
├─ Search / RAG
├─ Coding
├─ Text2SQL
└─ Agentic Automation
```

Text2SQL 예:

```text
Text2SQL
├─ Metadata / Schema Retrieval
├─ Schema Linking
├─ SQL Generation
└─ Validation
```

Text2SQL은 Task이고, RAG·LLM·Agent는 이를 구현할 때 조합할 수 있는 기술이다.

상세: `../세부학습/09-인공지능/Text2SQL과-스키마-링킹.md`

---

## 11. 횡단 통제

생성형 AI·LLM도 AI 전체의 통제 축을 그대로 받는다.

```text
LLM Application
├─ Data / 개인정보
├─ Hallucination / 품질
├─ Prompt Injection 등 보안
├─ Bias / Fairness
├─ 설명·감사
└─ 운영 Monitoring / Rollback
```

이 통제는 LLM 활용 기술과 별도 부록이 아니라 Prompt·RAG·Agent·Serving 전반에 교차한다.
