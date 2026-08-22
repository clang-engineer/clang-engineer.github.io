# LLM 추론과 Token 생성

이 문서는 `LLM의-동작원리.md`에서 설명한 Transformer 이후의 과정을 더 자세히 다룬다. 특히 **문맥화된 Token Vector가 어떻게 실제 다음 Token으로 바뀌는지**, 그리고 **Prefill · Causal Attention · KV Cache · Decode · EOS가 어떻게 하나의 흐름으로 연결되는지**를 이해하는 데 목적이 있다.

가장 먼저 잡을 전체 흐름은 다음과 같다.

```text
사용자 Prompt
 ↓
Tokenization / Embedding
 ↓
Transformer Prefill
 ↓
각 위치의 문맥화 Hidden Vector
 ↓
마지막 위치의 Hidden Vector
 ↓
LM Head
 ↓
Vocabulary 전체 Logit
 ↓
필요 시 Softmax
 ↓
Decoding
 ↓
다음 Token 선택
 ↓
Context 뒤에 추가
 ↓
새 Token이 Transformer Layer들을 통과
(기존 Token의 K/V는 Cache 재사용)
 ↓
다음 Token 생성 반복
 ↓
EOS 또는 다른 종료 조건
 ↓
응답 종료
```

---

## 1. Transformer의 출력은 Token별 Hidden Vector다

Transformer는 문장 전체를 하나의 Vector로 압축하는 것이 아니라 각 Token 위치마다 문맥이 반영된 Hidden Vector를 만든다.

예를 들어 다음 Prompt가 있다고 하자.

```text
대한민국의 / 수도는
```

Transformer를 통과하면 개념적으로 다음과 같은 출력이 생긴다.

```text
대한민국의      수도는
    ↓             ↓
   h1            h2
```

여기서 `h1`, `h2`는 Token 자체가 아니라 숫자로 이루어진 문맥화 Vector다.

GPT 계열 Causal LLM에서는 각 위치가 자기보다 뒤에 있는 미래 Token을 볼 수 없다.

```text
h1
= "대한민국의"까지 반영

h2
= "대한민국의 수도는"까지 반영
```

따라서 현재 Prompt 전체를 가장 많이 반영하고 있는 것은 마지막 위치의 `h2`다.

> **다음 Token 예측에는 마지막 Token 자체가 아니라 마지막 위치의 문맥화 Hidden Vector가 핵심적으로 사용된다.**

---

## 2. 왜 마지막 위치의 Hidden Vector를 사용하는가

Causal Attention을 단순화하면 다음과 같다.

```text
① 대한민국의
→ ①을 볼 수 있음

② 수도는
→ ① ②를 볼 수 있음

③ 서울
→ ① ② ③을 볼 수 있음

④ 입니다
→ ① ② ③ ④를 볼 수 있음
```

즉 각 위치는 지금까지의 Prefix를 누적해서 표현한다.

```text
h1 = ①
h2 = ①②
h3 = ①②③
h4 = ①②③④
```

현재 Sequence 전체를 가장 넓게 반영한 위치가 마지막 위치이므로 그 Hidden Vector를 다음 Token 예측에 사용한다.

---

## 3. Hidden Vector는 아직 Token이 아니다

Transformer의 마지막 Hidden Vector가 다음과 같다고 해보자.

```text
h_last
= [0.82, -1.21, 0.37, 0.14, ...]
```

이 Vector 자체가 `서울`이라는 Token은 아니다.

Transformer가 한 일은 현재 Context를 다음 Token 예측에 유용한 내부 표현으로 만든 것이다. 이제 이 Vector를 **Vocabulary의 어떤 Token이 다음에 적절한가**라는 문제로 변환해야 한다.

이 역할을 하는 출력층이 LM Head다.

---

## 4. LM Head: Hidden 공간을 Vocabulary 점수로 바꾼다

LM Head(Language Modeling Head)는 마지막 Hidden Vector를 Vocabulary 전체 Token의 점수로 변환한다.

예를 들어:

```text
Hidden Vector 차원
= 4,096

Vocabulary 크기
= 100,000 Token
```

이라면 개념적으로 LM Head는 다음 변환을 수행한다.

```text
h_last
[1 × 4,096]

      ×

LM Head Weight Matrix
[4,096 × 100,000]

      ↓

Logit Vector
[1 × 100,000]
```

결과는 Vocabulary의 모든 Token에 대응하는 점수다.

```text
서울       12.7
부산        3.1
도쿄        1.8
한국        5.2
입니다      2.3
...
```

이 점수를 **Logit**이라고 한다.

LM Head가 별도의 규칙 Engine처럼 `대한민국의 수도니까 서울`이라고 판단하는 것이 아니다. LM Head의 Weight 역시 Training 과정에서 Model의 다른 Weight와 함께 학습된다.

```text
Training
 ↓
Transformer
 ↓
Hidden Vector
 ↓
LM Head
 ↓
Vocabulary Logit
 ↓
실제 다음 Token과 비교
 ↓
Loss
 ↓
Backpropagation
 ↓
Transformer + LM Head Weight 함께 학습
```

따라서 다음처럼 기억하면 쉽다.

> **Transformer가 현재 문맥을 Vector로 표현한다면, LM Head는 그 Vector를 다음에 올 Vocabulary Token들의 점수로 변환한다.**

---

## 5. Vocabulary가 매우 커도 모든 Token 점수를 계산하는가

기본적인 LLM에서는 매 출력 단계마다 LM Head가 Vocabulary 전체에 대한 Logit을 계산한다.

Vocabulary가 100,000개라면:

```text
마지막 Hidden Vector
        ↓
      LM Head
        ↓
Token 0      → Logit
Token 1      → Logit
Token 2      → Logit
...
Token 99,999 → Logit
```

이를 Token마다 하나씩 `if`문으로 계산하는 것이 아니라 큰 Matrix 연산으로 한꺼번에 계산한다.

```text
[1 × Hidden Size]
        ×
[Hidden Size × Vocabulary Size]
        ↓
[1 × Vocabulary Size]
```

이 역시 LLM에서 GPU의 대규모 병렬 Matrix 연산 능력이 중요한 이유 중 하나다.

다만 전체 LLM 연산에서 LM Head만 비용을 차지하는 것은 아니다. 그 전에 있는 여러 Transformer Layer의 Attention과 Feed-Forward Network 연산도 매우 크다.

---

## 6. Softmax는 점수를 비율로 바꾸는 함수라고 이해하면 쉽다

Softmax는 LLM에서 한 번만 등장하는 특별한 단계가 아니다. **여러 점수를 합이 1인 분포 형태로 바꿀 필요가 있는 곳에서 사용되는 수학 함수**다.

직관적으로:

```text
점수
A = 3
B = 2
C = 1

 ↓ Softmax

A ≈ 66.5%
B ≈ 24.5%
C ≈  9.0%

합계 = 100%
```

단순히 `3 / (3+2+1)`처럼 나누는 것은 아니다. Softmax는 지수함수를 사용하므로 큰 점수와 작은 점수의 차이를 반영한 분포를 만든다.

학습 단계에서는 다음 정도로 기억하면 충분하다.

> **Softmax = 여러 점수를 합이 1인 비율·확률분포 형태로 정규화하는 함수**

---

## 7. Softmax가 LLM 안에서 여러 번 등장하는 이유

### 7.1 Attention 내부의 Softmax

Attention에서는 Q와 K를 비교해 Token 간 Attention Score를 만든다.

```text
현재 Token의 Q
 ↓
다른 Token들의 K와 비교
 ↓
Attention Score

Token A  3.2
Token B  1.7
Token C  0.4
```

Softmax를 적용하면 각 Token을 얼마나 참고할지 나타내는 Attention Weight가 된다.

```text
Attention Score
 ↓
Softmax
 ↓
Attention Weight

Token A  0.78
Token B  0.18
Token C  0.04
```

이 비율로 각 Token의 Value를 가중합한다.

```text
0.78 × Value A
+
0.18 × Value B
+
0.04 × Value C
 ↓
Attention 결과 Vector
```

즉 이 Softmax의 질문은:

> **다른 Token들을 각각 얼마나 참고할 것인가?**

다.

### 7.2 LM Head 이후의 Softmax

LM Head에서는 Vocabulary 전체의 Logit이 나온다.

```text
서울   12.7
부산    3.1
도쿄    1.8
...
```

이를 확률분포로 해석하려면 Softmax를 사용할 수 있다.

```text
Vocabulary Logit
 ↓
Softmax
 ↓
다음 Token 확률분포
```

즉 이 Softmax의 질문은:

> **Vocabulary 중 어떤 Token이 다음에 올 가능성이 높은가?**

다.

두 Softmax를 비교하면:

| 위치 | 입력 점수 | 의미 |
|---|---|---|
| Attention 내부 | Token 간 Attention Score | 어떤 Token을 얼마나 참고할까 |
| LM Head 이후 | Vocabulary Logit | 다음 Token으로 무엇이 적합할까 |

따라서 Softmax라는 이름이 여러 곳에서 등장하더라도 **같은 함수를 서로 다른 점수에 적용하는 것**이라고 이해하면 된다.

실제 추론 구현에서는 항상 Vocabulary 전체에 명시적인 Softmax를 계산해야 하는 것은 아니다. 예를 들어 Greedy Decoding에서는 가장 큰 Logit을 찾으면 Softmax 전후의 순위가 같으므로 Softmax 계산을 생략할 수 있다. 하지만 개념적으로는 `Logit → 확률분포 → Decoding` 흐름으로 이해하면 좋다.

---

## 8. Decoding: 확률분포에서 실제 다음 Token을 선택한다

LM Head가 Vocabulary 점수를 만들었다고 해서 아직 다음 Token이 확정된 것은 아니다.

```text
서울    82%
한국     7%
부산     2%
...
```

이 분포를 이용해 실제 Token 하나를 선택하는 과정이 Decoding이다.

가장 단순한 방식은 가장 높은 점수의 Token을 선택하는 Greedy Decoding이다.

```text
서울  82%  ← 가장 높음
한국   7%
부산   2%

→ "서울" 선택
```

다양성을 조절하기 위해 Sampling을 사용할 수도 있다.

대표적인 조절 방법:

- Temperature: 분포를 얼마나 보수적·다양하게 사용할지 조절
- Top-k: 상위 k개 후보만 남김
- Top-p: 누적확률 p 범위의 후보만 남김

따라서 Decoding은 `Vector를 글자로 변환하는 단계`라고 표현하기보다 다음처럼 이해하는 것이 정확하다.

> **Hidden Vector → LM Head → Vocabulary Logit → 확률분포 → Decoding → Token 선택**

---

## 9. Prompt와 생성 Token은 구분한다

사용자가 다음 Prompt를 입력했다고 하자.

```text
대한민국의 수도는
```

Model이 새로 생성하는 부분은 다음이다.

```text
서울 → 입니다 → .
```

즉:

```text
대한민국의 수도는 | 서울입니다.
└── 입력 Prompt ──┘ └ 생성 출력 ─┘
```

Model이 `대한민국의 수도는`을 다시 생성하는 것이 아니다.

다만 다음 Token을 예측할 때의 내부 Context에는 Prompt와 지금까지 생성한 Token이 함께 들어간다.

```text
Prompt
+
지금까지 생성한 출력
=
현재 Context
```

예를 들어 `서울` 다음에 `입니다`를 생성할 때 Model이 사용하는 현재 Context는 개념적으로 다음과 같다.

```text
대한민국의 수도는 서울
```

여기서 `대한민국의 수도는`은 입력이고 `서울`만 새로 생성한 Token이다.

---

## 10. Prefill과 Decode

LLM Inference는 크게 Prompt를 처음 처리하는 Prefill과 출력 Token을 순차 생성하는 Decode로 나눠 볼 수 있다.

### Prefill

Prompt는 처음부터 전체가 주어져 있다.

```text
대한민국의 / 수도는
        ↓
      Prefill
        ↓
Transformer가 입력 Context 처리
        ↓
각 Layer의 K/V 계산 및 Cache 준비
        ↓
마지막 Hidden Vector
        ↓
첫 출력 Token 예측
```

Prompt의 여러 위치는 이미 알려져 있으므로 Causal Mask를 지키면서도 병렬 계산을 상당 부분 활용할 수 있다.

### Decode

첫 출력 Token 이후에는 앞 Token이 결정되어야 다음 Token을 만들 수 있다.

```text
서울
 ↓
입니다
 ↓
.
```

따라서 출력 생성은 본질적으로 순차적이다.

---

## 11. 출력 Token 하나마다 Transformer Layer들을 다시 통과한다

새로운 출력 Token 하나를 만들 때마다 새 Token의 표현은 Model의 Transformer Layer들을 통과해야 한다.

```text
"서울"
 ↓
Layer 1
 ↓
Layer 2
 ↓
...
 ↓
Layer N
 ↓
LM Head
 ↓
"입니다" 예측
```

그 다음:

```text
"입니다"
 ↓
Layer 1
 ↓
Layer 2
 ↓
...
 ↓
Layer N
 ↓
LM Head
 ↓
"." 예측
```

따라서 500개의 출력 Token을 생성한다면 새로운 Token 생성 과정도 반복해서 수행된다.

이 때문에 출력 Token 수가 많아질수록 Inference 계산량과 응답시간이 증가한다.

---

## 12. 그렇다면 이전 Token도 매번 처음부터 다시 계산하는가

그렇게 하면 매우 비효율적이다.

예를 들어 현재 Context가:

```text
대한민국의 수도는
```

이고 `서울`을 생성했다고 하자.

최적화가 없다면 다음 Token을 만들 때:

```text
대한민국의 수도는 서울
```

전체 Token의 Attention 계산을 다시 반복해야 한다.

실제 Autoregressive Inference에서는 이를 줄이기 위해 **KV Cache**를 사용한다.

---

## 13. KV Cache는 이전 Token의 Key와 Value를 저장한다

Prefill에서 각 Transformer Layer는 Token별 K와 V를 계산한다.

```text
대한민국의 → K1 / V1
수도는     → K2 / V2
```

이를 Cache에 저장한다.

```text
K Cache: [K1][K2]
V Cache: [V1][V2]
```

새 Token `서울`이 추가되면 기존 K/V를 다시 만들 필요 없이 Cache에서 가져와 사용한다.

```text
기존 K1/K2, V1/V2
        ↑
      KV Cache
        │
새 Token "서울"
        ↓
새 Q3 / K3 / V3 계산
        ↓
Q3가 기존 K1/K2와 새 K3를 참고
        ↓
기존·새 V를 Attention Weight로 가중합
        ↓
새 Token의 문맥화 표현
```

그리고 새 K3/V3를 Cache 뒤에 추가한다.

```text
처음
K: [K1][K2]
V: [V1][V2]

"서울" 추가 후
K: [K1][K2][K3]
V: [V1][V2][V3]

"입니다" 추가 후
K: [K1][K2][K3][K4]
V: [V1][V2][V3][V4]
```

즉 KV Cache는 Decode가 진행되면서 계속 커진다.

---

## 14. 새 Token이 추가됐는데 왜 과거 K/V는 다시 계산하지 않아도 되는가

처음 보면 다음 의문이 자연스럽다.

> `서울`이 추가됐으면 앞의 `대한민국의`, `수도는`도 이제 `서울`을 볼 수 있으니 K/V가 달라져야 하지 않을까?

GPT 계열 Causal LLM에서는 그렇지 않다. **과거 위치는 미래 Token을 볼 수 없기 때문**이다.

```text
① 대한민국의
→ ①만 볼 수 있음

② 수도는
→ ① ②만 볼 수 있음

③ 서울
→ ① ② ③을 볼 수 있음
```

③ `서울`이 새로 생겨도 ①과 ②의 Attention 범위는 바뀌지 않는다. 따라서 이미 계산한 과거 위치의 K/V를 다시 계산할 필요가 없다.

새 Token에서 필요한 것은 해당 위치의 Q/K/V를 새로 계산하고, Q가 **기존 KV Cache + 자기 위치의 K/V**를 참조하도록 하는 것이다.

이게 Causal Attention과 KV Cache가 잘 맞는 이유다.

---

## 15. KV Cache가 줄이는 것과 줄이지 못하는 것

KV Cache는 과거 Token의 K/V 계산을 재사용하므로 Decode 비용을 크게 줄인다. 하지만 새 Token 생성 자체를 공짜로 만들지는 않는다.

새 Token 하나마다 여전히:

```text
새 Token 입력
 ↓
각 Transformer Layer 통과
 ↓
새 Q/K/V 계산
 ↓
기존 KV Cache와 Attention
 ↓
Feed-Forward Network
 ↓
마지막 Hidden Vector
 ↓
LM Head
 ↓
다음 Token 선택
```

과정이 필요하다.

또 Context가 길어질수록 Cache에 저장되는 K/V도 늘어난다. 그래서 KV Cache는 **연산 재사용을 위한 메모리와 계산량 사이의 절충**으로 볼 수 있다.

> KV Cache는 "전체 Context를 다시 계산하지 않게 해주는 장치"이지, "긴 Context 비용을 없애는 장치"는 아니다.

---

## 16. 생성은 언제 끝나는가

Autoregressive Decode는 무한히 반복하지 않는다. 대표적인 종료 조건은 다음과 같다.

- Model이 EOS(End Of Sequence) Token을 선택한 경우
- API나 Runtime에 설정한 최대 출력 Token 수에 도달한 경우
- Stop Sequence 같은 애플리케이션 종료 조건을 만족한 경우
- 외부 실행기가 도구 호출이나 정책상 다른 흐름으로 전환한 경우

가장 기본적인 흐름은 다음과 같다.

```text
현재 Context
 ↓
Transformer
 ↓
LM Head
 ↓
Logit
 ↓
Decoding
 ↓
Token 선택
 ↓
EOS인가?
 ├─ 예 → 생성 종료
 └─ 아니오
      ↓
    Context에 추가
      ↓
    KV Cache 갱신
      ↓
    다음 Decode 반복
```

EOS도 특별한 문자열 판정 규칙이 아니라 Vocabulary에 포함된 **특수 Token 중 하나**다. Model은 일반 Token과 마찬가지로 EOS에도 Logit을 부여하고 Decoding 결과로 선택할 수 있다.

---

## 17. 전체 흐름을 한 번에 연결하면

Prompt 입력부터 응답 종료까지를 하나의 흐름으로 다시 묶으면 다음과 같다.

```text
[입력]
Prompt
 ↓
Tokenization
 ↓
Embedding
 ↓

[Prefill]
Prompt 전체를 Transformer에 통과
 ↓
각 Layer의 K/V를 KV Cache에 저장
 ↓
마지막 위치 Hidden Vector
 ↓
LM Head
 ↓
Vocabulary Logit
 ↓
Decoding
 ↓
첫 출력 Token 선택
 ↓

[Decode 반복]
새 Token을 Transformer에 입력
 ↓
새 Q/K/V 계산
 ↓
기존 KV Cache 재사용
 ↓
새 K/V를 Cache에 추가
 ↓
마지막 Hidden Vector
 ↓
LM Head
 ↓
Vocabulary Logit
 ↓
Decoding
 ↓
다음 Token 선택
 ↓
EOS / 최대 Token / Stop 조건 확인
 ↓
조건을 만족할 때까지 반복
```

핵심 연결은 다음 네 문장으로 압축할 수 있다.

1. **Transformer는 현재 Context를 반영한 Hidden Vector를 만든다.**
2. **LM Head는 마지막 위치의 Hidden Vector를 Vocabulary 전체 Logit으로 바꾼다.**
3. **Decoding은 그 점수에서 실제 다음 Token 하나를 선택한다.**
4. **Decode에서는 KV Cache로 과거 K/V를 재사용하면서 새 Token만 순차적으로 처리한다.**

---

## 헷갈리기 쉬운 경계

```text
Hidden Vector ≠ Token
Logit ≠ 확률 그 자체
Softmax ≠ Decoding
Prompt Token ≠ 생성 Token
Prefill ≠ Decode
KV Cache ≠ Model Weight
EOS ≠ 자연어 문장부호
```

특히 `KV Cache`는 Model이 학습한 지식을 저장하는 Weight와 다르다. **현재 요청의 Context를 효율적으로 이어서 계산하기 위해 일시적으로 보관하는 중간 계산 결과**다.

이 경계를 잡으면 LLM 추론을 "Model이 문장을 한 번에 만들어낸다"고 보는 대신, **현재 Context에서 다음 Token 하나를 예측하고 그 결과를 다시 Context에 붙이는 반복 계산**으로 이해할 수 있다.
