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

`사과`의 문맥적 표현을 만들 때 `먹었다`와의 관계가 중요할 수 있다. Attention은 이런 관계를 입력마다 계산하고, 더 관련 있는 Token의 정보를 더 많이 반영한다.

여기서 중요한 점은 **Attention의 출력도 Vector이며, 기본적으로 각 Token마다 새로운 문맥화 Vector가 만들어진다**는 것이다.

```text
입력
Token Vector × N개
        ↓
Self-Attention
        ↓
출력
문맥이 반영된 Token Vector × N개
```

즉 Self-Attention이 문장 전체를 하나의 Vector로 압축하는 것이 아니다. 각 Token이 다른 Token을 참고하여 **자신의 표현을 문맥에 맞게 갱신**한다고 이해하는 편이 좋다.

### Q · K · V를 직관적으로 보면

- Query: 나는 지금 어떤 정보를 찾고 있는가
- Key: 나는 어떤 정보와 관련 있는가
- Value: 실제로 전달할 정보는 무엇인가

Query와 Key의 관계로 참고 비중을 만들고, 그 비중으로 Value의 정보를 섞는다. 이렇게 섞인 결과도 다시 Token의 Vector 표현으로 다음 계산에 전달된다.

### Model Weight와 Attention Weight는 다르다

이 둘을 같은 `Weight`라 생각하면 헷갈린다.

- **Model Weight(Parameter)**: Training 과정에서 수정되어 모델에 저장되는 값
- **Attention Weight**: 현재 입력이 들어왔을 때 Token 간 관계에 따라 계산되는 값

즉 Model Weight는 모델 자체에 학습된 Parameter이고, Attention Weight는 **이번 문장에서 누구를 얼마나 참고할지**를 나타내는 동적인 계산 결과다.

Multi-Head Attention은 이런 관계를 여러 관점에서 병렬로 보게 한다. 실제 Transformer Layer에는 Attention 외에도 Feed-Forward Network, Residual Connection, Normalization 등이 포함된다.

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

대형 Project에서는 이