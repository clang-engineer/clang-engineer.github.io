# Foundation Model과 AI 활용 계층

이 문서는 최근 AI 산업을 볼 때 **누가 거대한 Model을 만들고, 대부분의 기업과 개발자는 그 Model을 어떻게 활용하는가**를 구분해서 이해하는 데 목적이 있다.

가장 먼저 잡을 핵심은 다음이다.

> **Foundation Model을 만드는 문제와 이미 만들어진 Foundation Model을 업무에 활용하는 문제는 서로 다른 층위의 문제다.**

---

## 1. Foundation Model이란

Foundation Model은 대규모 Data로 먼저 학습한 뒤 다양한 Downstream Task에 재사용할 수 있는 범용 기반 Model을 의미한다.

과거에는 특정 Task마다 별도 Model을 만드는 방식이 흔했다.

```text
스팸 분류
→ 스팸 분류 Model

고객 이탈 예측
→ 이탈 예측 Model

Image 분류
→ Image 분류 Model
```

Foundation Model 접근은 방향이 다르다.

```text
대규모 Data
    ↓
대규모 사전학습
    ↓
Foundation Model
    ↓
┌────────┬────────┬────────┬────────┐
질의응답   요약      코딩      분석     기타 Task
```

즉 **범용 능력을 먼저 크게 학습하고 여러 문제에 재사용**한다.

LLM은 Foundation Model의 대표적인 형태지만 Foundation Model이 반드시 언어 Model만을 의미하는 것은 아니다.

```text
Foundation Model
├─ Language Foundation Model
│   └─ LLM
├─ Vision Foundation Model
├─ Multimodal Foundation Model
└─ Domain Foundation Model
```

---

## 2. 왜 LLM이 Foundation Model의 대표 사례가 되었는가

LLM은 하나의 Model로 처리할 수 있는 Task 범위가 매우 넓다.

```text
                    LLM
                     │
      ┌──────────────┼──────────────┐
      ↓              ↓              ↓
   질의응답          요약            번역
      ↓              ↓              ↓
   문서 작성         분석            코딩
      ↓              ↓              ↓
   SQL 생성        Tool 사용        Agent
```

예전에는 각각 별도의 NLP Model이나 규칙 기반 시스템을 만들던 문제 중 상당 부분을 **범용 LLM + Context + Tool** 조합으로 처리할 수 있게 되었다.

이 점이 LLM 기반 Foundation Model이 현재 AI 활용 전략의 중심이 된 중요한 이유다.

---

## 3. Foundation Model을 직접 만드는 층

최상위 Foundation Model을 처음부터 만들려면 단순히 좋은 Algorithm 하나만 있어서는 부족하다.

```text
대규모 Data
+
대규모 GPU / AI Accelerator
+
고속 Network
+
분산 Training Infrastructure
+
Model Architecture 연구
+
Training 기법
+
Post-training
+
Evaluation
+
Serving Infrastructure
        ↓
Foundation Model
```

따라서 최상위 Foundation Model 개발은 **연구 문제이면서 동시에 대규모 자본·인프라 문제**다.

작은 조직이 특정 업무용 AI 서비스를 만드는 것과 최상위 Foundation Model을 처음부터 학습하는 것은 필요한 자원의 규모가 완전히 다르다.

---

## 4. Training만 비싼 것이 아니라 Serving도 비싸다

Model을 한 번 학습했다고 운영 비용이 사라지는 것은 아니다.

LLM Inference에서는 사용자의 요청마다 거대한 Model을 반복 실행해야 한다.

```text
사용자 Prompt
     ↓
대규모 Transformer
     ↓
Token 1 생성
     ↓
대규모 Transformer
     ↓
Token 2 생성
     ↓
...
```

실제 대규모 서비스에서는 이것이 수많은 사용자에게 동시에 발생한다.

```text
사용자 A ─┐
사용자 B ─┼→ 대규모 Inference Cluster → Foundation Model
사용자 C ─┤
사용자 D ─┘
```

운영에는 다음 요소가 필요할 수 있다.

- GPU / AI Accelerator
- GPU Memory
- 서버 간 고속 Network
- 전력과 냉각
- Data Center
- Model Serving
- Load Balancing
- 장애 대응
- Latency 최적화
- Batch 처리
- Monitoring

따라서 **최상위 Foundation Model 사업은 Model 연구뿐 아니라 대규모 Computing Infrastructure 사업의 성격도 가진다.**

---

## 5. Agent 시대에는 Inference가 여러 번 발생할 수 있다

일반 Chat은 한 요청에서 한 번의 긴 LLM 응답으로 끝날 수 있다.

```text
질문
→ LLM
→ 답변
```

Coding Agent 같은 시스템에서는 하나의 사용자 요청이 여러 번의 LLM 호출로 이어질 수 있다.

```text
사용자 요청
 ↓
LLM 판단
 ↓
Code 검색
 ↓
LLM 재판단
 ↓
파일 읽기
 ↓
LLM 재판단
 ↓
Code 수정
 ↓
Test 실행
 ↓
LLM 재판단
 ↓
추가 수정
 ↓
...
```

즉 Agent의 비용은 단순히 최종 출력 Token만으로 설명하기 어렵다.

```text
Model 크기
+
입력 Context 길이
+
출력 Token 수
+
LLM 호출 횟수
+
동시 사용자 수
```

가 전체 Serving 비용에 영향을 준다.

---

## 6. 대부분의 기업은 Foundation Model을 직접 만들 필요가 없다

일반 기업의 목적은 최고 성능의 범용 Model 자체를 만드는 것이 아니라 **자기 업무 문제를 해결하는 것**이다.

따라서 현실적인 구조는 다음과 같을 수 있다.

```text
Foundation Model Provider
        ↓
LLM API / Managed Service / Open Weight Model
        ↓
기업의 AI Application
├─ Prompt
├─ RAG
├─ Domain Data
├─ Fine-tuning
├─ Agent
├─ Tool / API
├─ 업무 Workflow
└─ Evaluation
```

예:

```text
사내 문서 검색
→ LLM + RAG

DB 자연어 조회
→ LLM + Metadata Retrieval + Text2SQL

개발 자동화
→ LLM + Coding Agent + Tool

고객 상담
→ LLM + RAG + 업무 API

업무 자동화
→ LLM + Agent + 사내 Tool
```

이 관점에서는 경쟁의 핵심이 `우리도 Foundation Model을 처음부터 만들자`가 아니라 **이미 강력한 Model을 우리 Data와 업무에 얼마나 잘 연결하는가**가 된다.

---

## 7. Foundation Model 층과 활용 계층

전체 AI 시스템을 두 층으로 단순화하면 지금까지 공부한 개념들이 깔끔하게 정리된다.

```text
[Foundation Model 층]

Pre-training
Fine-tuning / Post-training
대규모 Training Infrastructure
대규모 Serving Infrastructure
        ↓
       LLM

────────────────────────────

[활용 / Application 층]

Prompt / System Prompt
Context Engineering
Few-shot
RAG
Embedding / Vector DB
Tool Calling
Agent
MCP
Text2SQL
Domain Data
업무 Workflow
Evaluation
```

위쪽은 **범용 능력을 만드는 문제**, 아래쪽은 **그 능력을 특정 업무에 적용하는 문제**라고 볼 수 있다.

---

## 8. 왜 활용 계층이 기업 전략에서 중요해지는가

Foundation Model이 강력해질수록 Application 개발자는 Model 내부 Weight를 직접 바꾸지 않고도 많은 문제를 해결할 수 있다.

```text
좋은 Foundation Model
        +
우리 회사의 Data
        +
적절한 Context
        +
업무 Tool
        +
안전한 Workflow
        ↓
업무 특화 AI Service
```

따라서 기업 차별화 요소가 다음으로 이동할 수 있다.

- 어떤 Domain Data를 가지고 있는가
- 필요한 Context를 얼마나 정확하게 선택하는가
- 사내 System과 Tool을 얼마나 잘 연결하는가
- 결과를 어떻게 평가하는가
- 권한과 보안을 어떻게 통제하는가
- 기존 업무 Workflow에 얼마나 자연스럽게 통합하는가
- 비용과 Latency를 얼마나 잘 관리하는가

즉 Model 자체의 성능뿐 아니라 **Context·Data·Tool·Workflow·Evaluation의 설계가 실제 서비스 품질을 좌우한다.**

---

## 9. 직접 Hosting과 Foundation Model 개발은 다르다

여기서 자주 혼동하는 부분이 있다.

```text
Foundation Model을 처음부터 개발
≠
이미 만들어진 Model을 직접 Hosting
```

### Model 개발

```text
대규모 Data
→ Pre-training
→ Post-training
→ Model Weight 생성
```

최상위 범용 Model이라면 막대한 Compute와 연구 역량이 필요할 수 있다.

### 자체 Hosting

```text
이미 학습된 Open Weight Model
        ↓
사내 GPU Server 등에 배포
        ↓
Inference Service
```

Model 크기와 사용자 규모에 따라 비용이 크게 달라진다. 작은 Model을 제한된 사용자가 이용하는 것과 최상위 Foundation Model을 전 세계 사용자에게 Serving하는 것은 전혀 다른 규모의 문제다.

---

## 10. Open Weight Model이 의미 있는 이유

Foundation Model 경쟁의 진입장벽이 높다고 해서 모든 기업이 폐쇄형 API만 사용할 수 있는 것은 아니다.

Open Weight Model을 이용하면:

```text
공개된 Model Weight
        ↓
자체 Hosting
Fine-tuning
Quantization
Domain 적용
        ↓
자체 AI Service
```

같은 선택이 가능하다.

따라서 시장을 단순히 `몇 개 회사가 Model을 독점하고 나머지는 아무것도 못 한다`고 이해하는 것도 부정확하다.

다만 **최상위 범용 Foundation Model을 처음부터 학습하고 대규모로 Serving하는 경쟁**과 **기존 Model을 활용·최적화하는 경쟁**은 필요한 자본과 기술의 성격이 크게 다르다.

---

## 11. 현재 생성형 AI를 보는 실용적인 관점

개발자나 일반 기업 입장에서는 다음 순서로 생각하는 것이 현실적이다.

```text
1. 우리 문제는 무엇인가?
        ↓
2. 기존 Foundation Model로 해결 가능한가?
        ↓
3. Prompt / Context만으로 충분한가?
        ↓
4. 외부 지식이 필요하면 RAG
        ↓
5. 외부 행동이 필요하면 Tool / Agent
        ↓
6. 반복 행동 자체를 바꿔야 하면 Fine-tuning 검토
        ↓
7. 비용 · 품질 · 보안 · Evaluation 설계
```

즉 **Model을 만드는 것부터 시작하지 않고 문제와 활용 방식부터 결정**한다.

---

## 12. 지금까지 배운 개념을 산업 구조에 연결하기

```text
                 [Model을 만드는 층]

대규모 Data
   ↓
Pre-training
   ↓
Foundation Model / LLM
   ↓
Post-training / Fine-tuning
   ↓
Model Serving

────────────────────────────────

                 [Model을 활용하는 층]

                   LLM
                    │
       ┌────────────┼────────────┐
       ↓            ↓            ↓
   Context 제어     외부 지식       행동
       │            │            │
Prompt / Few-shot   RAG        Tool Calling
System Prompt       │            │
                    │          Agent
                    │            │
                    │           MCP
       └────────────┼────────────┘
                    ↓
              실제 업무 Service
```

우리가 학습한 RAG, Agent, MCP, Text2SQL은 대부분 이 **활용 계층**에서 Foundation Model을 실제 문제에 연결하는 기술로 이해할 수 있다.

---

## 13. 처음 헷갈리기 쉬운 부분

```text
Foundation Model = LLM?
→ X
LLM은 Foundation Model의 대표적인 형태다.

Foundation Model을 사용하려면 직접 Training해야 하나?
→ X
API, Managed Service, Open Weight Model 등 여러 방식으로 사용할 수 있다.

자체 Hosting = Foundation Model을 직접 만든 것인가?
→ X
이미 학습된 Weight를 자체 Infrastructure에서 Serving할 수도 있다.

좋은 LLM만 선택하면 기업 AI 전략이 끝나는가?
→ X
Domain Data, Context, Tool, Workflow, Evaluation, 보안과 비용 관리가 필요하다.

Agent가 비싼 이유는 Tool 자체가 Token을 쓰기 때문인가?
→ 반드시 그렇지 않다.
Tool 실행 결과를 다시 LLM Context에 넣고 LLM을 반복 호출하면서 Inference가 증가할 수 있다.
```

---

## 14. 기억 흐름

```text
과거
Task별 Model 개발 비중이 큼
        ↓
대규모 사전학습 발전
        ↓
Foundation Model
        ↓
하나의 범용 Model을 여러 Task에 재사용
        ↓
LLM이 대표적인 성공 사례가 됨
        ↓
최상위 Model의 Training·Serving은 대규모 자본과 Infrastructure 필요
        ↓
대부분의 기업
"Model을 새로 만들기보다 어떻게 활용할 것인가?"
        ↓
Prompt / Context / RAG / Fine-tuning / Agent / MCP
        ↓
Domain Data + 업무 Workflow에 연결
```

가장 중요한 한 문장:

> **Foundation Model 시대의 많은 기업에게 핵심 경쟁은 거대한 범용 Model을 처음부터 만드는 것보다, 이미 학습된 Model을 자기 Data·Context·Tool·업무 Workflow에 얼마나 잘 연결하느냐에 있다.**
