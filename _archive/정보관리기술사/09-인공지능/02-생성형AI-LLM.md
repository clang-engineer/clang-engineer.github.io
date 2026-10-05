# 인공지능 생성형 AI·LLM 개념지도

이 문서는 [인공지능 전체 개념지도](00-전체.md)에서 Foundation Model·생성형 AI·LLM(Large Language Model) 가지를 선택했을 때, **개념 위치 → Training / Inference → LLM 내부 → 활용 방식 → Agent / MCP → 응용**의 관계를 더 촘촘히 보는 하위 지도다.

세부 구현과 내부 Algorithm은 개별 세부학습 문서로 내린다.

## 1. Foundation Model · 생성형 AI · LLM의 위치

~~~text
[Model 범용성]
Foundation Model
├─ Language Foundation Model → LLM
├─ Vision Foundation Model
├─ Multimodal Foundation Model
└─ Domain Foundation Model

[생성 목적]
Generative AI
├─ Text
├─ Image
├─ Audio / Video
└─ Multimodal

[Architecture]
Transformer
└─ LLM의 대표 기반 Architecture
~~~

`Foundation Model`, `Generative AI`, `LLM`, `Transformer`는 같은 계층의 용어가 아니다.

→ [생성형 AI와 Multimodal](생성형-AI와-멀티모달.md)  
생성형 AI를 Text·Image·Audio/Video·Multimodal 관점에서 보고 LLM의 위치를 잡는다.

→ [Foundation Model과 AI 활용 계층](Foundation-Model과-AI-활용계층.md)  
Foundation Model이 무엇인지와 Model을 만드는 층·활용하는 층의 경계를 본다.

## 2. Model을 만드는 층과 사용하는 층을 구분한다

~~~text
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

[Model을 사용하는 층]
Foundation Model / LLM
  ↓
Prompt · Context · Retrieval · Tool
  ↓
업무 Service
~~~

Fine-tuning은 Model을 추가 학습하는 쪽이고, Prompt·RAG·Tool은 주로 이미 만들어진 Model을 활용하는 쪽에서 만난다.

## 3. Training과 Inference는 Weight 관점에서 구분한다

~~~text
Training
Text
 ↓
Prediction
 ↓
Loss
 ↓
Backpropagation
 ↓
Weight Update

Inference
Context
 ↓
학습된 Weight 사용
 ↓
다음 Token 생성
 ↓
Context에 추가
 └──── 반복
~~~

핵심 경계:

~~~text
Training  → Weight를 학습·수정
Inference → 학습된 Weight를 사용
~~~

이 경계를 이해해야 Prompt·RAG와 Fine-tuning을 혼동하지 않는다.

## 4. LLM 내부는 Token 생성 흐름으로 본다

~~~text
Text
 ↓
Tokenization
 ↓
Token ID
 ↓
Embedding
 ↓
Transformer / Attention
 ↓
Hidden Representation
 ↓
LM Head
 ↓
Logit
 ↓
Softmax / Decoding
 ↓
다음 Token
 ↓
Context에 추가
 └──── 반복
~~~

Inference에서 함께 연결되는 대표 Node:

~~~text
Inference
├─ Context Window
├─ Autoregressive Generation
├─ Prefill / Decode
│  → Prefill: 입력 Context를 한꺼번에 처리 / Decode: 이후 Token을 하나씩 생성
├─ KV Cache
│  → 이전 Attention 계산 결과를 재사용하는 Cache
└─ GPU / VRAM / Serving
~~~

학습 경로:

1. [LLM의 동작 원리](LLM의-동작원리.md)  
   → Token·Embedding·Transformer·Attention이 내부에서 어떻게 계산되는지 본다.
2. [LLM 추론과 Token 생성](LLM-추론과-Token-생성.md)  
   → Transformer 결과가 Logit·Softmax·Decoding을 거쳐 실제 Token으로 나오는 흐름을 본다.
3. [LLM 내부 운영과 GPU Memory](LLM-내부운영과-GPU-메모리.md)  
   → Parameter·VRAM·KV Cache·분산 실행이 왜 필요한지 Hardware 실행 관점으로 연결한다.

이 세 문서는 선후관계가 비교적 강하다.

## 5. LLM 활용은 부족한 것이 무엇인지에 따라 갈라진다

~~~text
                           LLM
                            │
       ┌────────────────────┼────────────────────┐
       ▼                    ▼                    ▼
   지시 · Context          외부 지식               행동
Prompt / Few-shot           RAG             Tool / Agent

반복적인 Model 행동 자체를 바꾸고 싶음
→ Fine-tuning
~~~

대표 선택 기준:

~~~text
역할·규칙·예제를 넣고 싶다
→ Prompt / Few-shot

최신·사내 지식이 필요하다
→ RAG

반복적인 Model 행동 자체를 조정하고 싶다
→ Fine-tuning

외부 조회·실행이 필요하다
→ Tool / Agent
~~~

Prompt·RAG·Fine-tuning·Agent는 필수 발전 순서가 아니라 **서로 다른 문제를 해결하는 병렬 활용 가지**다.

병렬 Zoom-in:

- [LLM Prompt와 Context 제어](LLM-프롬프트와-Context-제어.md)  
  → System Prompt·Few-shot·Context Window가 Inference에 어떻게 들어가는지 본다.
- [Embedding · Vector Search · RAG](임베딩-벡터검색-RAG.md)  
  → 외부 지식을 Chunking·Embedding·Retrieval로 찾아 Context에 넣는 흐름을 본다.
- [Fine-tuning과 PEFT · LoRA](Fine-tuning과-PEFT-LoRA.md)  
  → Weight를 바꾸는 학습과 SFT·PEFT·LoRA의 서로 다른 분류축을 본다.
- [Agent와 MCP](에이전트와-MCP.md)  
  → LLM이 Tool을 호출하고 Observation을 받아 재판단하는 실행 Loop와 외부 기능 연결 방식을 본다.

## 6. Context에 들어오는 정보와 Weight 변경을 구분한다

~~~text
[Inference Context]
System Prompt
User Prompt
Few-shot Example
Retrieved Context
Tool Result / Observation
이전 대화
        ↓
   Context Window
        ↓
      LLM

[Training]
Fine-tuning
        ↓
Weight 또는 추가 학습 Parameter 변경
~~~

Prompt·Few-shot·RAG·Tool Result는 기본 Model Weight를 바꾸지 않는다. Fine-tuning은 Training을 수행해 Weight 또는 추가 학습 Parameter를 바꾼다.

## 7. Agent · MCP · Harness는 역할을 나눠 본다

~~~text
사용자 목표
   ↓
  Agent
LLM → Tool Call → Observation → LLM
   │
   ├─ Tool 연결 규격 → MCP
   └─ 운영 · 통제   → Harness
                      ├─ Context
                      ├─ Rule / Skill
                      ├─ Permission
                      └─ Workflow / Orchestration
~~~

대표 경계:

~~~text
RAG
= 필요한 정보를 찾는 구조

MCP
= 외부 Tool · Resource를 연결하는 공통 Protocol

Agent
= 판단과 행동을 반복하는 실행 주체

Harness
= Context · Rule · Permission · Workflow 등으로 Agent 실행을 운영 · 통제하는 체계
~~~

→ [Agent와 MCP](에이전트와-MCP.md)  
먼저 Agent의 실행 Loop와 MCP의 연결 역할을 이해한다.

→ [Agent Harness](Agent-Harness.md)  
그다음 Agent를 Context·Rule·Skill·Permission·Workflow로 어떻게 운영하고 통제하는지 본다.

RAG와 MCP는 대체 관계가 아니다. MCP로 제공되는 Tool 내부에서 RAG를 사용할 수도 있다.

## 8. 실제 업무 Task로 내려간다

~~~text
LLM
 ↓
Application / Task
├─ Chatbot
├─ Search / RAG
├─ Coding
├─ Text2SQL
└─ Agentic Automation
~~~

Text2SQL은 Task이고 LLM은 이를 구현하는 방법 중 하나다. RAG·Agent는 LLM 기반 Text2SQL과 조합할 수 있다.

→ [Text2SQL과 Schema Linking](Text2SQL과-스키마-링킹.md)  
Metadata Retrieval·Schema Linking·SQL Generation·Validation이 실제 업무 Task에서 어떻게 연결되는지 본다.

## 9. 평가 · 통제는 전 과정을 가로지른다

~~~text
LLM Application
├─ Data / 개인정보
├─ Hallucination / 품질
├─ Prompt Injection 등 보안
├─ Bias / Fairness
├─ 설명 · 감사
└─ Monitoring / Rollback
~~~

→ [AI 평가 · Golden Set · Red Teaming](99-AI-평가-Golden-Set과-Red-Teaming.md)  
Model, Prompt, RAG, Fine-tuning, Agent, Application이 바뀔 때마다 품질과 실패 경계를 반복 검증한다.

## 10. 권장 학습 경로

~~~text
1. 생성형 AI와 Multimodal
   → 생성형 AI 전체에서 LLM의 위치
        ↓
2. Foundation Model과 AI 활용 계층
   → Model 범용성과 활용 계층
        ↓
3. LLM의 동작 원리
        ↓
4. LLM 추론과 Token 생성
        ↓
5. LLM 내부 운영과 GPU Memory
        ↓
6. 목적에 따라 병렬 Zoom-in
   ├─ Prompt / Context
   ├─ RAG
   ├─ Fine-tuning
   └─ Agent / MCP → Harness
        ↓
7. Text2SQL 등 Application
~~~

평가·검증은 마지막 한 단계가 아니라 이 경로 전체에 반복 적용한다.
