# Fine-tuning과 PEFT · LoRA

이 문서는 `Fine-tuning = 모델을 다시 만든다`는 식의 오해를 풀고, **Pre-training과 Fine-tuning의 차이, SFT·Preference/RL 계열·PEFT·LoRA의 관계, Open Weight와 폐쇄형 API 모델의 차이**를 이해하는 데 목적이 있다.

---

## 1. 먼저 가장 큰 구분: Pre-training과 Fine-tuning

### Pre-training

대규모 데이터로 모델 자체를 처음 크게 학습하는 단계다.

```text
대규모 Text
→ 다음 Token 예측
→ Loss
→ Backpropagation
→ 수많은 Weight 수정
→ Base Model
```

언어 구조, 일반 지식, Code Pattern 등이 이 단계에서 광범위하게 학습된다.

### Fine-tuning

이미 만들어진 Base Model에 특정 목적의 Data를 추가 학습하는 단계다.

```text
Pre-trained Model
+
특정 목적 Data
→ 추가 Training
→ Fine-tuned Model
```

즉 Fine-tuning은 처음부터 모델을 만드는 것이 아니다.

> **Pre-training = Base Model을 만든다**
>
> **Fine-tuning = 이미 만들어진 Model을 특정 목적에 맞게 추가 조정한다**

---

## 2. Fine-tuning도 결국 Weight를 바꾸는가

그렇다.

Prompt, Few-shot, RAG는 추론 시점의 Context를 바꾸는 방식이다.

Fine-tuning은 실제 Training을 수행하므로 **학습 대상 Parameter가 변경된다.**

```text
System Prompt / Few-shot / RAG
→ Context 변경
→ Model Weight 변경 없음

Fine-tuning
→ Training
→ Weight 또는 추가 학습 Parameter 변경
```

따라서 두 접근은 근본적으로 다르다.

---

## 3. "그러면 모델을 우리가 소유해야 Fine-tuning 가능한 것 아닌가?"

이 질문은 절반은 맞다.

실제로 Weight를 직접 수정하려면 해당 Model Weight에 접근할 수 있어야 한다.

하지만 사용 환경에 따라 두 경우가 있다.

### Open Weight Model

Model Weight를 내려받거나 직접 운영할 수 있는 경우다.

```text
Open Weight Model
→ Weight 확보
→ GPU 환경에서 직접 Training
→ Fine-tuned Model 저장
```

이 경우 사용자가 직접 Fine-tuning Pipeline을 구성할 수 있다.

### 폐쇄형 API Model

Weight를 직접 받지 않고 API로만 사용하는 모델이다.

```text
사용자
→ Training Data 제공
→ Model Provider의 Fine-tuning API
→ Provider 내부에서 Training
→ Fine-tuned Model ID 제공
```

사용자가 Weight 파일을 직접 소유하지 않아도 제공사가 Fine-tuning 기능을 서비스로 제공하면 Fine-tuning할 수 있다.

반대로 Provider가 Fine-tuning을 지원하지 않으면 사용자가 API만 가지고 Weight를 마음대로 수정할 수는 없다.

따라서 더 정확한 표현은 다음과 같다.

> **직접 Fine-tuning하려면 Weight에 접근 가능해야 하고, 폐쇄형 Model은 Provider가 Fine-tuning 기능을 제공해야 한다.**

---

## 4. Fine-tuning은 두 축으로 나눠 본다

`Fine-tuning`은 상위 개념이다. 여기서 가장 중요한 것은 **분류축을 섞지 않는 것**이다.

```text
Fine-tuning
├─ [학습 신호 관점]
│   ├─ SFT
│   │   └─ 입력-정답 Pair를 이용한 지도학습
│   └─ Preference / RL 계열
│       └─ 선호·보상 신호를 이용
│
└─ [Parameter 업데이트 관점]
    ├─ Full Fine-tuning
    └─ PEFT
        └─ LoRA
```

첫 번째 축은 **무엇을 학습 신호로 주는가**를 본다.

두 번째 축은 **학습할 때 어떤 Parameter를 얼마나 갱신하는가**를 본다.

따라서 두 축은 독립적이며 서로 조합할 수 있다.

```text
SFT + Full Fine-tuning
SFT + LoRA
Preference / RL 계열 + PEFT
```

> **SFT와 LoRA는 대체 관계가 아니다. SFT는 학습 신호의 관점이고, LoRA는 Parameter를 효율적으로 조정하는 방법이므로 함께 사용할 수 있다.**

이 문장이 SFT·PEFT·LoRA 관계를 이해할 때 가장 중요한 경계다.

---

## 5. SFT: Supervised Fine-Tuning

SFT는 입력과 원하는 정답 출력의 쌍을 이용하는 지도학습 기반 Fine-tuning이다.

```text
입력
"이 Email을 정중하게 고쳐줘"

정답
"안녕하세요. 확인 부탁드립니다..."
```

Text2SQL이라면 다음과 같은 Data를 만들 수 있다.

```text
입력
"2025년 당뇨 환자 수"

정답
SELECT COUNT(DISTINCT patient_id)
FROM ...
```

Model은 이런 입력-정답 Pair를 반복 학습하면서 해당 Task에서 원하는 출력 Pattern을 더 잘 내도록 조정된다.

### SFT와 Few-shot의 차이

겉으로 보면 둘 다 예제를 준다는 점에서 비슷하다.

```text
Few-shot
→ 예제를 현재 Prompt에 넣음
→ 이번 Inference에서 참고
→ Weight 변경 없음

SFT
→ 예제를 Training Data로 사용
→ 반복 학습
→ Parameter 변경
```

---

## 6. Preference / RL 계열은 무엇이 다른가

SFT가 `이 입력에는 이 정답`이라는 정답 Pair를 직접 학습한다면, Preference / RL 계열은 **어떤 출력이 더 좋은가**, 또는 **어떤 행동에 더 높은 보상을 줄 것인가**라는 신호를 이용한다.

```text
SFT
입력 + 정답 출력
→ 정답을 직접 따라가도록 학습

Preference / RL 계열
여러 출력에 대한 선호·보상 신호
→ 더 선호되는 행동 방향으로 조정
```

따라서 SFT와 Preference / RL 계열은 Fine-tuning의 학습 신호를 보는 같은 축에 놓을 수 있다.

다만 구체적인 Preference Optimization이나 RL Algorithm의 내부 절차는 별도 학습 대상이며, 여기서는 **학습 신호가 다르다**는 경계만 잡는다.

---

## 7. 왜 Full Fine-tuning이 부담스러운가

큰 LLM은 Parameter가 매우 많다.

예를 들어 수십억~수백억 Parameter를 가진 Model의 모든 Weight를 Training 대상으로 두면 다음 자원이 필요하다.

- Model Weight 저장 Memory
- Gradient
- Optimizer State
- Activation
- GPU 연산량

즉 단순 Inference보다 훨씬 많은 VRAM과 연산 자원이 필요하다.

그래서 나온 방향이 **PEFT(Parameter-Efficient Fine-Tuning)**다.

---

## 8. PEFT

PEFT의 핵심은 **전체 Parameter를 모두 갱신하지 않고, 훨씬 적은 학습 Parameter만 추가하거나 선택하여 학습 비용을 줄이는 것**이다.

```text
거대한 Base Model
████████████████████████████
대부분 또는 전체를 Freeze

+
작은 학습 Parameter
██
Training
```

이렇게 하면 Full Fine-tuning보다 필요한 GPU Memory와 Training 비용을 크게 줄일 수 있다.

PEFT는 하나의 특정 Algorithm 이름이 아니라 **Parameter 효율적인 Fine-tuning 방법들의 큰 범주**다.

`일부 기존 Parameter만 학습한다`고만 외우면 LoRA를 부정확하게 이해하기 쉽다. PEFT에는 여러 방식이 있고, LoRA는 기존 Weight를 고정한 채 **별도의 저랭크 학습 Parameter를 추가**하는 대표적인 방법이다.

---

## 9. LoRA

LoRA(Low-Rank Adaptation)는 PEFT의 대표적인 방법이다.

원본의 큰 Weight Matrix 자체를 다시 학습하는 대신 **기존 Weight를 고정하고, 저랭크 행렬을 추가하여 변화분을 학습**한다.

개념적으로 보면 다음과 같다.

```text
기존 Model Weight
→ Freeze

+
저랭크 행렬 A · B
→ Training
→ Weight 변화분 학습
```

즉 LoRA를 단순히 `기존 Parameter 중 일부만 골라 학습한다`고 이해하면 정확하지 않다.

핵심은 다음과 같다.

```text
기존 Weight
= 그대로 유지

LoRA Adapter
= 작은 저랭크 Parameter를 추가하여 학습
```

따라서 원본 Base Model을 그대로 유지하면서 목적별 Adapter를 따로 관리하는 구조도 가능하다.

```text
Base Model
├─ 의료 LoRA Adapter
├─ 법률 LoRA Adapter
└─ 사내 SQL LoRA Adapter
```

실제 적용 방법과 Adapter Merge 여부는 Framework와 운영 방식에 따라 달라질 수 있지만, 학습 관점에서 기억할 핵심은 다음이다.

> **LoRA는 기존 Weight를 고정하고 작은 저랭크 행렬을 추가해 변화분을 학습함으로써 Fine-tuning 비용을 줄이는 대표적인 PEFT 기법이다.**

---

## 10. SFT · PEFT · LoRA 관계를 정확히 보기

처음에는 다음처럼 단순 계층으로 외우기 쉽다.

```text
Fine-tuning
→ SFT
→ PEFT
→ LoRA
```

하지만 이것은 정확한 계층이 아니다.

좀 더 정확히 보면:

```text
Fine-tuning

[학습 신호 관점]
├─ SFT
│  └─ 입력-정답 Pair
└─ Preference / RL 계열
   └─ 선호·보상 신호

[Parameter 업데이트 관점]
├─ Full Fine-tuning
└─ PEFT
   └─ LoRA
```

따라서 다음 조합이 가능하다.

```text
SFT Data
+
LoRA 방식
→ Parameter 효율적인 Supervised Fine-tuning
```

다시 말해:

> **SFT와 LoRA는 대체 관계가 아니다. SFT는 학습 신호의 관점이고, LoRA는 Parameter를 효율적으로 조정하는 방법이므로 함께 사용할 수 있다.**

이 구분을 알아두면 `SFT냐 LoRA냐`처럼 서로 다른 축의 용어를 잘못 비교하는 일을 피할 수 있다.

---

## 11. RAG와 Fine-tuning은 무엇이 다른가

사내 문서 Chatbot을 만든다고 하자.

### RAG

```text
사내 문서
→ Embedding / Vector DB
→ 질문 시 관련 문서 검색
→ LLM Context에 제공
```

Model Weight는 바뀌지 않는다.

### Fine-tuning

```text
우리의 Training Data
→ Model 추가 Training
→ Parameter 변경
```

따라서 목적이 다르다.

### 최신 지식을 주고 싶다

RAG가 자연스럽다.

```text
"우리 회사 출장비 규정이 얼마지?"
```

규정이 바뀔 때마다 Model을 다시 Fine-tuning하는 것보다 문서를 갱신하고 RAG로 검색하는 것이 관리하기 쉽다.

### 반복적인 행동 Pattern을 바꾸고 싶다

Fine-tuning을 검토할 수 있다.

```text
항상 특정 형식으로 답해야 함
조직 고유의 Task Pattern을 반복 수행
특정 문체나 Output 형식을 안정적으로 학습
```

물론 System Prompt와 Few-shot으로 해결 가능하다면 먼저 더 단순한 방법을 사용할 수 있다.

---

## 12. Few-shot과 Fine-tuning 선택

Few-shot으로도 모델에게 예제를 보여줄 수 있다.

```text
Few-shot
장점
- Training 필요 없음
- 즉시 변경 가능

단점
- 예제가 Context Window를 계속 사용
- 매 요청마다 Token 비용 발생
- 많은 예제를 계속 넣기 어려움
```

Fine-tuning은:

```text
장점
- 매 요청에 모든 예제를 넣지 않아도 됨
- 반복 Task 행동을 Model 쪽에 조정 가능

단점
- Training Data 준비 필요
- Training·평가·Version 관리 필요
- Model이나 Provider의 지원 필요
```

따라서 Fine-tuning이 무조건 더 고급이거나 항상 좋은 선택은 아니다.

---

## 13. Embedding Model도 Fine-tuning 가능한가

가능하다.

검색용 Embedding Model도 Neural Network Model이므로 Weight에 접근할 수 있으면 도메인 Data로 Fine-tuning할 수 있다.

예를 들어 사내 의료 용어 검색에서 다음 Pair를 학습할 수 있다.

```text
Query
"AMI 환자"

Relevant Document
"급성심근경색 환자 ..."
```

이런 Data를 이용해 조직의 검색 목적에 맞게 Vector 공간을 조정할 수 있다.

하지만 실제 RAG Project에서는 먼저 기존 Embedding Model을 사용해 평가하고, 검색 실패의 원인이 Embedding 의미 공간에 있다는 근거가 있을 때 Fine-tuning을 검토하는 편이 합리적이다.

---

## 14. 처음부터 Embedding Model을 만드는 것과 Fine-tuning은 다르다

Embedding Model을 처음부터 만든다면 대량의 Data로 Vector 표현 자체를 학습해야 한다.

```text
대규모 Text / Pair Data
→ Model Architecture
→ Training
→ 의미 공간 학습
→ Embedding Model
```

이는 기존 Embedding Model을 도메인 Data로 조금 조정하는 Fine-tuning보다 훨씬 큰 작업이다.

LLM에서도 마찬가지다.

```text
처음부터 Model 생성
= Pre-training

기존 Model을 목적에 맞게 추가 조정
= Fine-tuning
```

---

## 15. Fine-tuning에서 Model을 '소유한다'는 표현 주의

실무에서 `Model을 소유한다`는 말은 여러 의미로 쓰일 수 있다.

- Weight 파일을 직접 보유
- 자체 GPU에 Model을 배포
- Fine-tuned Model을 사용 가능한 권한 보유
- API Provider 내부에 사용자 전용 Fine-tuned Model이 존재

따라서 Fine-tuning 가능 여부를 판단할 때는 단순히 `소유 여부`보다 다음을 보는 것이 정확하다.

```text
Weight에 직접 접근 가능한가?
또는
Provider가 Fine-tuning API를 제공하는가?
```

---

## 16. 전체 선택 지도

```text
새로운 최신·사내 지식을 참고해야 한다
→ RAG

몇 개 예제로 답변 Pattern을 보여주고 싶다
→ Few-shot

역할·규칙을 지정하고 싶다
→ System Prompt

반복적인 Task 행동을 Model 자체에 조정하고 싶다
→ Fine-tuning 검토

[학습 신호]
입력-정답 Pair로 지도학습한다
→ SFT

선호·보상 신호로 행동을 조정한다
→ Preference / RL 계열

[Parameter 업데이트]
전체 또는 많은 Weight를 직접 갱신한다
→ Full Fine-tuning

적은 학습 Parameter로 효율적으로 조정한다
→ PEFT

기존 Weight를 고정하고 저랭크 변화분을 학습한다
→ LoRA
```

---

## 17. 기억 흐름

```text
Pre-training
→ Base Model을 처음 크게 학습

Fine-tuning
→ Base Model을 추가 학습하는 상위 개념

[학습 신호 관점]
SFT
→ 입력-정답 Pair

Preference / RL 계열
→ 선호·보상 신호

[Parameter 업데이트 관점]
Full Fine-tuning
→ 전체 또는 많은 기존 Weight 갱신

PEFT
→ 적은 학습 Parameter로 효율적으로 조정

LoRA
→ 기존 Weight를 고정하고 저랭크 행렬을 추가 학습
```

그리고 가장 중요한 두 경계:

```text
System Prompt / Few-shot / RAG
= Context를 바꿈

Fine-tuning
= Training으로 학습 Parameter를 바꿈
```

```text
SFT
= 무엇을 학습 신호로 쓰는가

LoRA
= Parameter를 어떻게 효율적으로 조정하는가
```

한 문장으로 정리하면 다음과 같다.

> **Fine-tuning은 이미 Pre-training된 Model을 특정 목적에 맞게 추가 학습하는 상위 개념이며, SFT·Preference/RL 계열은 학습 신호 관점이고 Full Fine-tuning·PEFT·LoRA는 Parameter 업데이트 관점이다. 따라서 SFT와 LoRA는 대체 관계가 아니며 함께 사용할 수 있다.**
