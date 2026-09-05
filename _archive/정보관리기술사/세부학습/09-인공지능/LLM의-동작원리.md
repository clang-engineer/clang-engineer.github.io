# LLM의 동작 원리

이 문서는 LLM을 단순히 `Transformer 기반 생성형 AI`라고 외우는 대신, **사용자 문장이 들어온 뒤 실제로 답변 Token이 하나씩 만들어지기까지 무슨 일이 일어나는지**를 흐름으로 이해하는 데 목적이 있다.

## 1. 가장 먼저 잡을 핵심: LLM은 다음 Token 예측 모델이다

GPT 계열 생성형 LLM의 가장 밑바닥 동작을 단순화하면 다음과 같다.

> **현재까지 주어진 Token들을 보고 다음 Token의 확률을 계산한다.**

예를 들어 사용자가 `대한민국의 수도는 어디야?`라고 물었다고 하자.

```text
현재 Context
"대한민국의 수도는 어디야?"
        ↓
Transformer
        ↓
다음 Token 후보 확률
서울       높음
부산       낮음
대한민국   낮음
...
        ↓
"서울" 선택
```

여기서 끝나는 것이 아니다. 방금 생성한 `서울`이 다시 Context에 붙는다.

```text
"대한민국의 수도는 어디야? 서울"
        ↓
다시 다음 Token 예측
        ↓
"입니다"
        ↓
"대한민국의 수도는 어디야? 서울입니다"
        ↓
다시 다음 Token 예측
        ↓
"."
```

즉 모델이 완성된 답변 `서울입니다.`를 먼저 만들어놓고 화면에 조금씩 보여주는 것이 아니다. **실제 생성 자체가 한 Token씩 순차적으로 이루어진다.** 이 방식을 Autoregressive Generation이라고 한다.

여기서 중요한 경계가 있다.

```text
LLM
= 언어 Token의 분포를 모델링하는 Model 자체

Transformer
= 현재 Context를 문맥화하고 다음 Token 후보 분포를 계산하는 대표 Architecture

Autoregressive Generation
= LLM을 이용해 다음 Token을 하나씩 생성하고,
  선택한 Token을 다시 Context에 넣어 반복하는 생성 방식
```

따라서 `LLM = Autoregressive Generation`은 아니다. **LLM은 Model이고, Autoregressive Generation은 그 Model을 사용해 긴 Text를 생성하는 방식**이다.

이 관점이 중요한 이유는 뒤에서 나오는 Attention, Context Window, KV Cache, 출력 Token 비용까지 모두 이 구조에서 설명되기 때문이다.

---

## 2. 전체 흐름

```text
사용자 문장
→ Tokenization
→ Token ID
→ Token Embedding + 위치정보
→ Transformer Layer 반복
   ├─ Self-Attention
   ├─ Feed-Forward Network
   ├─ Residual Connection
   └─ Normalization
→ 현재 문맥을 반영한 내부 표현
→ 다음 Token 확률분포
→ Decoding으로 Token 하나 선택
→ 선택한 Token을 Context에 추가
→ 다음 Token을 다시 계산
→ 종료 조건까지 반복
```

---

## 3. Tokenization: 문장을 모델이 처리할 단위로 나누기

LLM은 문장을 그대로 계산하지 않는다. Tokenizer가 Text를 Token ID의 열로 바꾼다.

Token은 글자, 단어, 형태소와 정확히 일치하지 않을 수 있다. 하나의 단어가 여러 Token으로 나뉠 수도 있고, 자주 등장하는 문자열 조각이 하나의 Token이 될 수도 있다.

```text
자연어 문장
   ↓ Tokenizer
Token 1 / Token 2 / Token 3 / ...
   ↓
Token ID 4712 / 83 / 19201 / ...
```

여기서 **Token ID는 의미를 표현하는 Vector가 아니라 Vocabulary에서 해당 Token을 가리키는 번호(Index)**다.

예를 들어 아주 단순화한 Vocabulary가 다음과 같다고 하자.

```text
Token       Token ID
<eos>          0
나는           42
사과         1287
먹었다       9213
```

`사과 → 1287`이라고 해서 숫자 `1287` 자체가 사과의 의미를 담고 있는 것은 아니다. 또한 ID가 서로 가깝다고 의미가 비슷한 것도 아니다.

```text
1287과 1288이 숫자상 가까움
        ↓
두 Token의 의미도 비슷함   X
```

Token ID는 뒤의 Embedding 단계에서 어떤 Vector를 가져올지 지정하기 위한 **번호표**라고 이해하면 된다.

형태소 분석기처럼 먼저 문법을 완전히 이해해서 자르는 것이 아니다. 학습 Data를 효율적으로 표현할 수 있도록 Vocabulary와 분할 규칙이 만들어진다.

모델마다 Vocabulary와 Tokenizer가 다르므로 같은 문장도 모델별 Token 수가 다를 수 있다.

---

## 4. Embedding과 Vector

Vector는 숫자의 배열이다.

```text
[0.21, -0.53, 0.82, ...]
```

Embedding은 Text 같은 대상을 신경망이 처리할 수 있는 Vector 표현으로 만드는 개념이다.

LLM 내부에서는 앞에서 만든 Token ID를 이용해 Embedding Table의 해당 행을 조회하여 초기 Token Vector를 얻는다.

```text
Text
 ↓
Tokenizer
 ↓
Token
 ↓
Token ID             ← Vocabulary의 번호
 ↓
Embedding Table 조회
 ↓
초기 Token Vector
```

예를 들어 `사과`의 Token ID가 `1287`이라면 개념적으로 다음과 같다.

```text
Token "사과"
   ↓
Token ID 1287
   ↓
Embedding Table의 1287번 행
   ↓
[0.21, -0.53, 0.82, ...]
```

즉 **Token ID는 번호이고, Embedding이 그 번호를 계산 가능한 Vector로 바꾼다.**

LLM 내부의 Token Embedding은 Token ID를 초기 Vector로 바꾼다. 이 Vector 자체가 현재 문장의 의미를 모두 반영한 최종 표현은 아니다. 이후 Transformer를 통과하면서 주변 Token의 정보가 섞이고 문맥화된다.

### 중요한 구분: LLM Token Embedding과 RAG 검색 Embedding

둘 다 `Embedding`이라는 말을 쓰지만 목적이 다르다.

| 구분 | LLM 내부 Token Embedding | RAG 검색용 Embedding |
|---|---|---|
| 단위 | Token 중심 | 문장·Chunk 중심 |
| 목적 | 다음 Token 예측을 위한 내부 표현 | Text 간 의미 유사도 검색 |
| 결과 사용 | Transformer 내부 계산 | Vector DB에 저장·검색 |
| 최종 결과 | 문맥화된 Token 표현으로 계속 변화 | 검색용 대표 Vector |

RAG에서 만든 검색 Vector를 그대로 LLM의 Token Embedding 자리에 넣는 구조가 아니다. RAG는 검색된 **원문 Text**를 다시 LLM Context에 넣는다.

---

## 5. Transformer: 초기 Token Vector를 문맥화한다

처음 Embedding된 Token Vector는 해당 Token 자체의 기본 표현에 가깝다. 하지만 같은 단어라도 문장에 따라 의미가 달라질 수 있다.

예를 들어 다음 두 문장을 보자.

```text
"먹는 사과"
"잘못을 사과한다"
```

Tokenizer가 두 문장의 `사과`를 동일한 Token으로 만든다고 가정하면 처음에는 다음 단계까지 같다.

```text
"사과"
   ↓
동일한 Token ID
   ↓
동일한 초기 Token Embedding
```

하지만 주변 Context는 다르다.

```text
먹는 ←→ 사과
잘못 ←→ 사과
```

Transformer의 Self-Attention을 통과하면서 주변 Token과의 관계가 반영되므로 두 `사과`의 내부 표현은 서로 다른 문맥화 Vector가 될 수 있다.

```text
동일한 "사과" Token
        ↓
동일한 Token ID
        ↓
동일한 초기 Embedding
     ↙              ↘
 "먹는 사과"     "잘못을 사과"
     ↓              ↓
 서로 다른 Context
     ↓              ↓
 Self-Attention
     ↓              ↓
서로 다른 문맥화 Token Vector
```

Transformer는 여러 Token Vector를 함께 보고 서로의 관계를 반영해 새로운 표현으로 바꾼다.

```text
초기 Token Vector들
        ↓
Transformer
        ↓
문맥이 반영된 Token Vector들
```

따라서 `Embedding → Transformer`를 다음처럼 기억하면 쉽다.

> **Embedding은 Token을 계산 가능한 Vector로 바꾸고, Transformer는 그 Vector에 현재 문맥을 반영한다.**

---

## 6. Attention: 다른 Token을 얼마나 참고할 것인가

Self-Attention은 현재 Token을 처리할 때 문장 안의 다른 Token을 얼마나 참고할지 계산한다.

예를 들어 다음 문장을 보자.

```text
나는 사과를 먹었다
```

Embedding 이후에는 각 Token마다 하나의 현재 Vector가 있다.

```text
나는   → Token Vector
사과를 → Token Vector
먹었다 → Token Vector
```

이 상태에서 바로 Token Vector끼리 섞는 것이 아니라, 각 Token Vector를 Attention 계산에 필요한 세 가지 Vector로 변환한다. 이것이 Query, Key, Value다.

### 6.1 모든 Token은 Q, K, V를 만든다

각 Token마다 Q/K/V가 따로 만들어진다.

```text
나는   → Q1 / K1 / V1
사과를 → Q2 / K2 / V2
먹었다 → Q3 / K3 / V3
```

Q/K/V가 Token에 미리 저장되어 있는 것은 아니다. 현재 Token Vector에 서로 다른 학습된 Weight Matrix를 적용해서 계산한다.

```text
현재 Token Vector
      │
      ├─ Wq 적용 → Q
      ├─ Wk 적용 → K
      └─ Wv 적용 → V
```

수식으로는 개념적으로 다음과 같다.

```text
Q = Token Vector × Wq
K = Token Vector × Wk
V = Token Vector × Wv
```

같은 입력 Vector를 사용해도 Wq, Wk, Wv가 서로 다른 Matrix이므로 결과 Q/K/V도 서로 다른 Vector가 된다.

여기서 `질문`, `색인`, `내용` 같은 표현은 Vector 안에 사람이 읽을 수 있는 문장이 들어 있다는 뜻이 아니다. Q/K/V는 모두 숫자 Vector이고, 그 표현은 **Attention 계산에서 맡는 기능적 역할**을 설명하기 위한 비유다.

### 6.2 Q, K, V의 역할

Q/K/V를 가장 단순하게 나누면 다음과 같다.

```text
Q와 K
= 누구의 정보를 얼마나 참고할지 정하는 계산에 사용

V
= 실제로 가져와 섞을 정보
```

조금 더 나누면:

- **Query(Q)**: 현재 Token이 다른 Token들과의 관계를 계산할 때 사용하는 기준 Vector
- **Key(K)**: 다른 Token의 Q와 비교되어 참고 대상인지 점수를 계산하는 Vector
- **Value(V)**: 그 Token을 참고하기로 했을 때 실제로 전달할 정보 Vector

즉 Q와 K는 **관련도 계산용**, V는 **정보 전달용**이라고 이해하면 쉽다.

### 6.3 `사과를`의 Q는 모든 Token의 K와 비교된다

`사과를`을 문맥화한다고 해보자. `사과를`의 Q2는 현재 Attention 범위에 있는 Token들의 K와 비교된다.

```text
               사과를의 Q2
                    │
        ┌───────────┼───────────┐
        ↓           ↓           ↓
      나는 K1    사과를 K2    먹었다 K3
        ↓           ↓           ↓
      관련도       관련도       관련도
```

이 점수를 Softmax로 정규화하면 예를 들어 다음과 같은 참고 비율이 나올 수 있다.

```text
나는      0.1
사과를    0.2
먹었다    0.7
```

이 `0.1 / 0.2 / 0.7` 같은 값이 **Attention Weight**다.

그 다음에는 K를 가져오는 것이 아니라 각 K와 짝을 이루는 V를 해당 비율만큼 섞는다.

```text
0.1 × 나는의 V1
0.2 × 사과를의 V2
0.7 × 먹었다의 V3
        ↓
       가중합
        ↓
사과를의 Attention 결과 Vector
```

따라서 Attention의 핵심 흐름은 다음과 같다.

```text
Token Vector
   ↓
Wq / Wk / Wv
   ↓
Q / K / V
   ↓
Q와 모든 K 비교
   ↓
Attention Score
   ↓
Softmax
   ↓
Attention Weight
   ↓
각 V를 Weight만큼 가중합
   ↓
문맥이 반영된 새로운 Token Vector
```

### 6.4 Attention의 출력도 Token별 Vector다

Attention은 문장 전체를 하나의 Vector로 압축하는 과정이 아니다. 각 Token이 다른 Token의 정보를 참고해서 **자신의 Vector를 갱신**한다.

```text
입력
Token Vector × N개
        ↓
Self-Attention
        ↓
출력
문맥이 반영된 Token Vector × N개
```

따라서 `먹는 사과`의 `사과`와 `잘못을 사과`의 `사과`가 동일 Token ID와 동일 초기 Embedding에서 출발하더라도, 주변 Token과의 Attention 결과가 다르므로 서로 다른 문맥화 Vector가 될 수 있다.

### 6.5 Wq, Wk, Wv는 Model Weight다

Wq, Wk, Wv는 Q/K/V를 만드는 별도의 AI 모델이 아니라 **하나의 LLM 내부 Transformer Layer에 포함된 학습된 Weight Matrix**다.

```text
하나의 LLM
│
├─ Embedding Weight
│
├─ Transformer Layer 1
│   ├─ Self-Attention
│   │   ├─ Wq
│   │   ├─ Wk
│   │   └─ Wv
│   └─ FFN Weight
│
├─ Transformer Layer 2
│   ├─ Wq / Wk / Wv
│   └─ FFN Weight
│
└─ ...
```

각 Transformer Layer는 자기 Wq/Wk/Wv를 가진다. 첫 Layer에서는 초기 Token Vector로 Q/K/V를 만들지만, 다음 Layer부터는 이전 Layer에서 나온 문맥화 Token Vector를 받아 다시 새로운 Q/K/V를 만든다.

```text
초기 Embedding Vector
        ↓
Layer 1의 Wq/Wk/Wv
        ↓
Q/K/V → Attention
        ↓
문맥화 Vector
        ↓
Layer 2의 Wq/Wk/Wv
        ↓
새 Q/K/V → Attention
        ↓
더 문맥화된 Vector
        ↓
...
```

### 6.6 Q/K/V 자체에 정답은 없다

Training에서 `사과를의 올바른 Q는 이 값이다`처럼 Q/K/V에 직접 Label을 붙이지 않는다.

모델이 직접 비교할 수 있는 정답은 최종 **다음 Token**이다.

```text
입력: 나는 사과를
정답: 먹었다
        ↓
모델 예측
        ↓
Loss 계산
        ↓
Backpropagation
        ↓
모델 전체 Weight 수정
        ├─ Embedding Weight
        ├─ Wq
        ├─ Wk
        ├─ Wv
        ├─ FFN Weight
        └─ ...
```

즉 Q/K/V가 맞는지 직접 채점하지 않는다. 최종 다음 Token 예측 Loss를 줄이는 방향으로 역전파가 이루어지면서 **Q/K/V를 만드는 Wq/Wk/Wv가 간접적으로 함께 학습**된다.

이런 관계를 반복적으로 학습하다 보면 다음 Token 예측에 유리한 Token 간 관계를 포착하는 방향으로 Attention 구조가 발달할 수 있다.

### 6.7 Model Weight와 Attention Weight는 완전히 다르다

이 둘은 이름에 `Weight`가 들어가지만 성격이 다르다.

```text
Wq / Wk / Wv
= Model Weight(Parameter)
= Training으로 학습
= 모델에 저장됨
= Q/K/V를 어떻게 만들지 결정

Attention Weight
= Q와 K를 현재 입력에서 비교한 결과
= 실행할 때 그때그때 계산
= 입력 문장마다 달라짐
= Model Parameter가 아님
```

따라서 다음처럼 기억하면 가장 정확하다.

> **Wq/Wk/Wv는 Q/K/V를 만드는 학습된 변환 규칙이고, Attention Weight는 그렇게 만들어진 Q/K를 현재 입력에서 비교해서 얻은 Token 간 참고 비율이다.**

Multi-Head Attention은 이런 Attention 계산을 여러 Head에서 병렬로 수행한다. Head마다 서로 다른 Wq/Wk/Wv를 가지므로 같은 Token도 여러 관계 관점에서 처리할 수 있다.

실제 Transformer Layer에는 Attention 외에도 Feed-Forward Network, Residual Connection, Normalization 등이 포함된다.

---

## 7. Pre-training: 왜 자기지도학습인가

GPT류 모델의 대표적인 사전학습 목표는 다음 Token 예측이다.

```text
원문: 대한민국의 수도는 서울이다

입력: 대한민국의 수도는
정답: 서울

입력: 대한민국의 수도는 서울
정답: 이다
```

원문 자체에서 정답을 자동으로 만들 수 있다. 사람이 문장마다 Label을 붙이지 않아도 되므로 Self-Supervised Learning이라고 한다.

학습 흐름은 다음과 같다.

```text
앞 Token들을 보고 다음 Token 예측
        ↓
실제 다음 Token과 비교
        ↓
Loss 계산
        ↓
Backpropagation
        ↓
Model Weight 수정
        ↓
대규모 반복
```

이 과정을 엄청난 규모로 반복하면서 언어 패턴, 문법, 지식, 코드 패턴 등이 Weight에 녹아든다.

---

## 8. Training과 Inference의 차이

### Training

```text
예측
→ 정답과 비교
→ Loss
→ Weight 수정
```

### Inference

```text
사용자 입력
→ 이미 학습된 Weight 사용
→ 다음 Token 생성
→ 생성 Token을 Context에 추가
→ 다음 Token 생성
→ 반복
```

일반적인 ChatGPT 사용이나 LLM API 호출은 Inference다. 보통 이 과정에서 Weight를 다시 수정하지 않는다.

Prompt, System Prompt, Few-shot, RAG는 모두 **Weight를 바꾸지 않고 Inference 시점의 Context를 바꾸는 방법**이라는 공통점이 있다.

---

## 9. Context Window: 모델이 지금 참고할 수 있는 작업 공간

Context Window는 한 번의 요청에서 모델이 참고할 수 있는 Token 범위다.

```text
Context Window
├─ System Prompt
├─ 이전 대화
├─ User Prompt
├─ Few-shot 예제
├─ RAG로 가져온 문서
├─ Tool 실행 결과
└─ 현재까지 생성한 출력
```

여기서 가장 중요한 구분은 다음이다.

```text
Weight
= Training으로 모델 자체에 들어간 것

Context
= 이번 요청에서 모델에게 보여준 정보
```

예를 들어 모델이 원래 모르는 사내 규정을 RAG로 찾아 Context에 넣으면 답할 수 있다. 하지만 모델 Weight가 그 규정을 새로 학습한 것은 아니다.

Context가 길다고 모든 정보를 동일하게 잘 활용하는 것도 아니다. 중요 정보의 위치, Noise, 중복, Retrieval 품질 등이 결과에 영향을 줄 수 있다.

---

## 10. 입력 Token과 출력 Token 모두 연산을 사용한다

처음에는 입력만 큰 연산을 사용할 것처럼 느껴지지만 출력도 매우 중요하다.

### 입력 처리: Prefill

입력 Token들은 여러 위치를 병렬적으로 계산할 수 있는 여지가 크다.

```text
[입력 Token 1 ... Token N]
        ↓
Transformer로 Context 처리
        ↓
KV Cache 생성
```

### 출력 처리: Decode

출력은 앞 Token이 결정되어야 다음 Token을 만들 수 있다.

```text
Token 1 생성
   ↓
Token 2 생성
   ↓
Token 3 생성
   ↓
...
```

따라서 본질적으로 순차적인 부분이 있다.

KV Cache는 이미 처리한 Token의 Attention 계산 일부를 재사용해 중복 연산을 줄인다. 그렇다고 새 출력 Token이 공짜가 되는 것은 아니다. 새 Token 하나를 생성할 때마다 여러 Transformer Layer를 통과하는 추론이 필요하다.

이 때문에 긴 출력은 응답시간과 계산량을 크게 늘린다.

---

## 11. 답변 생성과 Decoding

Transformer가 다음 Token의 확률분포를 만들면 실제로 어떤 Token을 선택할지 Decoding 정책이 결정한다.

- Temperature: 확률분포를 얼마나 평평하거나 뾰족하게 볼지 조절
- Top-k: 상위 k개 후보 안에서 선택
- Top-p: 누적확률 p 범위 안에서 선택

따라서 LLM은 단순히 항상 최고 확률 Token만 고르는 시스템으로만 동작하는 것은 아니다.

---

## 12. 자연어뿐 아니라 코드도 같은 Transformer가 처리한다

요즘 Coding Agent를 보면 `다음 Token 예측 모델이 어떻게 코드를 이해하고 수정할 수 있지?`라는 의문이 생긴다.

핵심은 **LLM 입장에서는 자연어와 Code 모두 Token의 연속**이라는 점이다.

```text
자연어 ─┐
Java   ─┤
Python ─┼→ Tokenization → Embedding → 같은 Transformer → 다음 Token 예측
SQL    ─┤
설명문 ─┘
```

Code를 생성하거나 수정할 때 별도의 `코드 수정 Transformer`가 따로 실행되는 것이 아니다. 현재 Context에 자연어 요구사항, Source Code, Error Log 등이 들어오면 같은 Transformer가 이 관계를 처리하고 Code Token을 출력한다.

예를 들어 다음 Context가 있다고 하자.

```text
사용자 요청
"사용자가 없을 때 Null 오류가 나지 않게 수정해줘"

현재 Code
User user = repository.findById(id).orElse(null);
return user.getName();

Error Log
NullPointerException
```

모델은 학습된 Weight를 사용해 `orElse(null)`, `user.getName()`, `NullPointerException` 사이의 관계를 현재 Context에서 처리한다. 그리고 다음 출력으로 수정 Code나 Patch를 생성할 수 있다.

```diff
- User user = repository.findById(id).orElse(null);
+ User user = repository.findById(id)
+     .orElseThrow(() -> new UserNotFoundException(id));
```

이 Patch 역시 결국 Token을 하나씩 생성한 결과다.

---

## 13. 다음 Token 예측만으로 어떻게 Code 구조까지 다룰 수 있는가

`다음 Token 예측`이라는 말만 들으면 단순한 자동완성처럼 느껴질 수 있다. 하지만 복잡한 Code의 다음 Token을 정확히 맞히려면 앞의 구조와 관계를 파악하는 것이 유리하다.

예를 들어:

```java
public int divide(int a, int b) {
    if (b == 0) {
        throw new
```

다음에 어떤 예외가 올지 잘 예측하려면 단순 문자열 빈도뿐 아니라 다음 관계를 포착하는 것이 유리하다.

```text
divide
→ 나눗셈

b
→ 분모 역할

b == 0
→ 0으로 나누는 상황 검사

throw new ...
→ 해당 상황의 예외 처리
```

대규모 자연어와 Code에서 다음 Token 예측을 반복하면 모델은 문법뿐 아니라 Code 구조, API 사용 패턴, 오류 처리, 테스트, 설계 패턴 등 **예측에 유용한 내부 표현**을 학습할 수 있다.

따라서 `LLM이 코드를 이해한다`는 표현을 엄밀하게 보면:

> **Code를 처리하고 적절한 다음 출력을 예측하는 데 유용한 내부 표현을 학습했다.**

정도로 이해하는 것이 좋다.

---

## 14. 자연어와 여러 프로그래밍 언어가 하나의 모델에서 연결되는 이유

학습 Data에는 자연어 설명과 여러 프로그래밍 언어가 함께 존재할 수 있다.

```text
자연어
"값이 존재하지 않으면 예외를 발생시킨다"

Java
if (x == null) throw ...

Python
if x is None: raise ...

Java Optional
.orElseThrow(...)
```

이런 관계가 반복되면 같은 개념이 서로 다른 표현으로 나타나는 패턴을 학습할 수 있다.

그래서 현재 Context가 Java라면 Java Code를, Python이라면 Python Code를 생성할 수 있다.

```text
자연어 요구사항
"사용자가 없으면 예외 처리"
        ↓
학습된 일반적인 관계와 Code 패턴
        +
현재 Java Project Context
        ↓
Java 표현 생성
```

모델이 우리 회사 Project를 미리 학습해야 하는 것은 아니다.

```text
Weight
= Java / Python / SQL
  일반적인 Framework·API
  오류 처리·테스트·설계 패턴 등

Context
= 현재 Project의 실제 Code
  Error Log
  Interface
  설정
  Project 규칙
```

즉 **Weight에 학습된 일반 능력과 현재 Context의 구체적인 Project 정보가 결합**되어 처음 보는 Code Base에서도 작업할 수 있다.

---

## 15. 일반 질문과 Coding 작업은 필요한 Context 규모가 다르다

일반적인 지식 질문은 모델 Weight에 관련 지식이 이미 있다면 짧은 질문만으로 답할 수 있다.

```text
"TCP 3-way handshake가 뭐야?"
        ↓
학습된 Weight + 짧은 Context
        ↓
답변
```

하지만 다음 요청은 다르다.

```text
"우리 Project의 로그인 Bug를 고쳐줘"
```

모델 Weight에는 **현재 Project의 구체적인 구조가 없다.** 따라서 다음 정보가 필요할 수 있다.

```text
사용자 요청
+ 관련 Source Code
+ Interface / Type 정의
+ 호출·참조 관계
+ Error Log
+ Test Code
+ 설정
+ Architecture 규칙
+ Coding Convention
```

대형 Project에서는 이 모든 정보를 처음부터 Context Window에 넣을 수 없고, 넣는다고 해서 항상 좋은 것도 아니다. 따라서 Coding Agent는 필요한 파일과 정보를 찾아 **관련성이 높은 Context만 선택적으로 수집**하는 과정이 중요하다.

```text
사용자 요청
   ↓
Repository / Source Search
   ↓
관련 File·Symbol·Log 탐색
   ↓
필요한 Context 수집
   ↓
LLM에 전달
   ↓
분석·수정·검증
```

즉 일반적인 지식 질문은 모델 Weight에 이미 학습된 지식을 많이 활용하지만, Project 작업은 **현재 Project의 구체적인 Context를 얼마나 정확하게 확보하느냐**가 결과 품질에 크게 영향을 준다.

이 차이를 이해하면 왜 Coding Agent가 단순 Chat UI보다 Repository Search, Tool 호출, File 탐색, Test 실행 같은 기능을 함께 사용하는지도 자연스럽게 이해할 수 있다.

---

## 16. 기억 흐름

긴 설명을 읽고 나면 다시 다음 흐름으로 복원한다.

```text
사용자 문장
        ↓
Tokenization
        ↓
Token ID
        ↓
Embedding
        ↓
Transformer Layer 반복
        ↓
Self-Attention으로 Token 간 관계 반영
        ↓
문맥화된 Token Vector
        ↓
다음 Token 확률분포
        ↓
Decoding
        ↓
Token 하나 선택
        ↓
선택한 Token을 Context에 추가
        ↓
다음 Token 생성 반복
```

같은 흐름을 더 짧게 줄이면 다음과 같다.

```text
Text
→ Token
→ Vector
→ Context 반영
→ 다음 Token 확률
→ Token 선택
→ Context에 붙이고 반복
```

가장 중요한 한 문장:

> **LLM은 학습된 Weight를 사용해 현재 Context의 Token들을 문맥화하고, 다음 Token을 하나씩 예측·선택하면서 답변을 만들어 간다.**
