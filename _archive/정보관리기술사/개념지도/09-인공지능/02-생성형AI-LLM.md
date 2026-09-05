# 인공지능 생성형 AI·LLM 개념지도

이 문서는 [[00-전체|인공지능 전체 개념지도]]에서 Foundation Model·생성형 AI·LLM(Large Language Model, 대규모 언어 모델) 가지를 선택했을 때, **LLM 내부와 활용 기술을 주변으로 파고들기 위한 하위 지도**다.

세부 구현과 내부 Algorithm은 `../../세부학습/09-인공지능/`에서 다룬다.

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
│   ├─ GAN(Generative Adversarial Network, 생성자와 판별자가 경쟁하며 학습)
│   └─ Diffusion
├─ Audio / Video
└─ Multimodal
```

`Foundation Model`, `Generative AI`, `LLM`, `Transformer`, `GAN`, `Diffusion`, `Multimodal`은 같은 계층의 용어가 아니다.

세부학습: [[생성형-AI와-멀티모달|생성형 AI와 Multimodal]], [[Foundation-Model과-AI-활용계층|Foundation Model과 AI 활용 계층]]

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

Fine-tuning은 Model을 추가 학습하는 쪽이고, Prompt·RAG(Retrieval-Augmented Generation, 검색한 외부 지식을 LLM에 함께 제공하는 방식)·Tool은 주로 이미 만들어진 Model을 활용하는 쪽에서 만난다.

세부학습: [[Foundation-Model과-AI-활용계층|Foundation Model과 AI 활용 계층]], [[Fine-tuning과-PEFT-LoRA|Fine-tuning과 PEFT·LoRA]]

---

## 3. Training과 Inference를 먼저 구분한다

```text
Training
Text
 ↓
다음 Token 예측
 ↓
정답 Token과 비교
 ↓
Loss
 ↓
Backpropagation
 ↓
Model Weight 수정
```

```text
Inference
사용자 Context
 ↓
학습된 Weight 사용
 ↓
다음 Token 생성
 ↓
Context에 추가
 └──────── 반복
```

핵심 구분은 다음과 같다.

```text
Training  → Weight를 학습·수정
Inference → 학습된 Weight를 사용
```

이 구분을 잡아야 Prompt·RAG와 Fine-tuning의 차이가 자연스럽게 연결된다.

세부학습: [[LLM의-동작원리|LLM의 동작 원리]], [[LLM-추론과-Token-생성|LLM 추론과 Token 생성]]

---

## 4. LLM 내부: Token에서 다음 Token까지

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
├─ KV Cache(Key-Value Cache, 이전 Attention 계산 결과를 재사용하는 Cache)
└─ GPU(Graphics Processing Unit, 대규모 병렬 연산 장치) Memory / Serving
```

세부학습: [[LLM의-동작원리|LLM의 동작 원리]], [[LLM-추론과-Token-생성|LLM 추론과 Token 생성]], [[LLM-내부운영과-GPU-메모리|LLM 내부 운영과 GPU Memory]]

---

## 5. LLM 활용: 무엇이 부족한가에 따라 갈라진다

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

MCP(Model Context Protocol, AI Client가 외부 Tool·Resource를 발견하고 호출하는 공통 Protocol)는 Agent가 외부 기능과 연결되는 지점에서 만난다.

Prompt·RAG·Fine-tuning·Agent는 같은 문제를 해결하는 단순 대체재가 아니다.

세부학습: [[LLM-프롬프트와-Context-제어|LLM Prompt와 Context 제어]], [[임베딩-벡터검색-RAG|Embedding·Vector Search·RAG]], [[Fine-tuning과-PEFT-LoRA|Fine-tuning과 PEFT·LoRA]], [[에이전트와-MCP|Agent와 MCP]]

---

## 6. Prompt · Few-shot · RAG · Tool 결과는 Context에서 만난다

```text
System Prompt ───────────┐
User Prompt ─────────────┤
Few-shot Example ────────┤
Retrieved Context ───────┼→ Context Window → LLM Inference
Tool Result / Observation┤
이전 대화 ───────────────┘
```

LLM 입장에서는 모두 현재 Inference에 들어온 Context다. 차이는 **무엇을 넣느냐**다.

```text
System Prompt      → 역할·규칙
Few-shot           → 입력·출력 예제
RAG                → 검색한 외부 지식
Tool Result        → 실제 외부 실행·조회 결과
User Prompt        → 현재 사용자 요청
```

Prompt·Few-shot·RAG는 기본 Model Weight를 바꾸지 않는다.

세부학습: [[LLM-프롬프트와-Context-제어|LLM Prompt와 Context 제어]]

---

## 7. 어떤 방법을 선택할 것인가

```text
무엇을 해결하려는가?
 ↓
최신·사내 지식이 필요한가?
├─ 예 → RAG
└─ 아니오
    ↓
몇 개 예제로 Pattern을 보여주면 되는가?
├─ 예 → Few-shot
└─ 아니오
    ↓
반복적인 Model 행동 자체를 조정해야 하는가?
├─ 예 → Fine-tuning 검토
└─ 아니오 → System Prompt / Prompt 설계
```

외부 세계에서 실제 조회·실행까지 필요하면 별도의 축으로 `Tool / Agent`를 검토한다.

이 선택지는 배타적이지 않다. 실제 시스템에서는 `Prompt + RAG + Fine-tuning + Agent`를 조합할 수 있다.

---

## 8. RAG: 외부 지식 가지를 따라간다

```text
RAG
├─ 지식 준비
│   ├─ Chunking
│   ├─ Embedding
│   └─ Vector DB
│
└─ Retrieval
    ├─ Keyword / BM25(Best Matching 25, 단어 빈도 기반 대표 검색 점수)
    ├─ Vector Search
    │   ├─ Exact Search
    │   └─ ANN(Approximate Nearest Neighbor, 근사 최근접 이웃 검색)
    │       ├─ HNSW(Hierarchical Navigable Small World, 그래프 기반 ANN)
    │       └─ IVF(Inverted File, 벡터 공간을 구역으로 나눠 탐색하는 ANN 계열)
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

세부학습: [[임베딩-벡터검색-RAG|Embedding·Vector Search·RAG]]

---

## 9. Fine-tuning

Fine-tuning은 이미 학습된 Model을 목적에 맞게 추가 학습하는 상위 개념이다. 여기서 `무엇을 학습 신호로 쓰는가`와 `어떤 Parameter를 갱신하는가`는 서로 다른 분류축이다.

```text
Fine-tuning
├─ [학습 신호 관점]
│   ├─ SFT(Supervised Fine-Tuning, 입력-정답 Pair로 지도학습)
│   └─ Preference / RL 계열
│       └─ 선호·보상 신호를 이용
└─ [Parameter 업데이트 관점]
    ├─ Full Fine-tuning
    └─ PEFT(Parameter-Efficient Fine-Tuning, 적은 학습 Parameter로 효율적으로 조정)
        └─ LoRA(Low-Rank Adaptation, 기존 Weight를 고정하고 저랭크 행렬을 추가 학습하는 대표 PEFT 기법)
```

두 축은 독립적이므로 다음 조합이 가능하다.

```text
SFT + Full Fine-tuning
SFT + LoRA
Preference / RL 계열 + PEFT
```

> **SFT와 LoRA는 대체 관계가 아니다. SFT는 학습 신호의 관점이고, LoRA는 Parameter를 효율적으로 조정하는 방법이므로 함께 사용할 수 있다.**

```text
Prompt / Few-shot / RAG
→ Inference Context 변경
→ 기본 Model Weight 변경 없음

Fine-tuning
→ Training 수행
→ Weight 또는 추가 학습 Parameter 변경
```

세부학습: [[Fine-tuning과-PEFT-LoRA|Fine-tuning과 PEFT·LoRA]]

---

## 10. Agent: 판단에서 행동으로

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

세부학습: [[Agent-Harness|Agent Harness]], [[에이전트와-MCP|Agent와 MCP]]

---

## 11. MCP: 외부 기능 연결 규격

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
API(Application Programming Interface, 프로그램 간 기능을 호출하는 인터페이스)
DB(Database, 데이터 저장·조회 시스템)
File / 외부 System
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

세부학습: [[에이전트와-MCP|Agent와 MCP]], [[Agent-Harness|Agent Harness]]

---

## 12. RAG와 MCP는 실제로 함께 쓸 수 있다

```text
Agent
 ↓
MCP
 ↓
search_metadata Tool
 ↓
Embedding / Retrieval
 ↓
Vector DB
 ↓
관련 Metadata 반환
 ↓
Agent
```

이 구조에서는 계층이 다르다.

```text
바깥 Interface / 연결 규격 → MCP
Tool 내부 검색 방식       → RAG
```

따라서 `RAG vs MCP`가 아니라 **MCP로 제공되는 Tool 내부에서 RAG를 사용할 수 있다**고 이해하는 편이 정확하다.

---

## 13. LLM 기반 응용으로 내려간다

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
├─ Rule / Template
├─ 전용 ML / Seq2Seq(Sequence-to-Sequence, 입력 Sequence를 출력 Sequence로 변환)
└─ LLM 기반
    ├─ Metadata / Schema Retrieval
    ├─ Schema Linking
    ├─ SQL Generation
    └─ Validation
```

Text2SQL은 Task이고, LLM은 이를 구현하는 방법 중 하나다. RAG·Agent는 LLM 기반 Text2SQL을 구성할 때 조합할 수 있다.

세부학습: [[Text2SQL과-스키마-링킹|Text2SQL과 Schema Linking]]

---

## 14. 횡단 통제

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
