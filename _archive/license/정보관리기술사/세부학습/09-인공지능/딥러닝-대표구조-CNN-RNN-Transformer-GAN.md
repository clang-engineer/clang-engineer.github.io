# 딥러닝 대표 구조: CNN · RNN · Transformer · GAN

이 문서는 기술사 학습 중 반복해서 등장하는 CNN, RNN, LSTM, Transformer, GAN, Diffusion을 **서로 같은 종류의 용어처럼 외우지 않고 전체 AI 지도에서 각각 어디에 위치하는지** 이해하는 데 목적이 있다.

가장 먼저 잡을 핵심은 다음이다.

> **CNN·RNN·Transformer는 주로 신경망 Architecture 관점의 용어이고, GAN·Diffusion은 생성 Model의 구성·생성 방식 관점에 더 가깝다. 따라서 이들을 하나의 일렬 발전 단계로 외우면 안 된다.**

---

## 1. 먼저 전체 위치를 잡는다

```text
AI
└─ Machine Learning
   └─ Deep Learning
      │
      ├─ 대표 Neural Network Architecture
      │   ├─ DNN / MLP
      │   ├─ CNN
      │   ├─ RNN
      │   │   ├─ LSTM
      │   │   └─ GRU
      │   └─ Transformer
      │
      └─ 대표 생성 Model / 생성 방식
          ├─ Autoregressive
          ├─ GAN
          └─ Diffusion
```

여기서 `CNN → RNN → GAN → Transformer`처럼 한 줄의 계보로 이해하면 안 된다.

```text
무슨 구조로 처리하는가?
→ CNN / RNN / Transformer

어떻게 생성하는가?
→ Autoregressive / GAN / Diffusion

무슨 Data를 다루는가?
→ Text / Image / Audio / Video

범용 기반 Model인가?
→ Task-specific Model / Foundation Model
```

서로 다른 분류축이다.

---

## 2. 출발점: Perceptron과 DNN

Neural Network의 가장 기본적인 생각은 여러 입력에 Weight를 적용하고 결과를 다음 Node로 전달하는 것이다.

```text
입력 x1 ──× w1 ─┐
입력 x2 ──× w2 ─┼→ 합산 → Activation → 출력
입력 x3 ──× w3 ─┘
```

이런 Layer를 여러 층 쌓으면 Deep Neural Network(DNN)로 생각할 수 있다.

```text
Input Layer
    ↓
Hidden Layer
    ↓
Hidden Layer
    ↓
Hidden Layer
    ↓
Output Layer
```

문제는 Data의 구조적 특성을 모두 일반적인 Fully Connected Layer로 처리하면 Parameter가 많아지고, Image의 공간 관계나 Sequence의 순서 같은 특징을 효과적으로 활용하기 어렵다는 점이다.

이런 문제에 맞춰 서로 다른 Architecture가 발전했다.

---

## 3. CNN: 가까운 공간의 특징을 잘 찾는다

CNN(Convolutional Neural Network)은 Image처럼 **공간적으로 가까운 값들의 관계가 중요한 Data**를 처리하는 데 강점을 가진 구조다.

Image를 단순한 숫자 배열로 생각하면:

```text
Pixel Pixel Pixel Pixel
Pixel Pixel Pixel Pixel
Pixel Pixel Pixel Pixel
Pixel Pixel Pixel Pixel
```

CNN은 작은 Filter(Kernel)를 이동시키며 국소적인 특징을 찾는다.

```text
Image
 ↓
작은 영역에 Filter 적용
 ↓
Edge / 선 / 방향 같은 저수준 특징
 ↓
Layer 반복
 ↓
형태 / 부분 구조
 ↓
더 복잡한 Object 특징
```

핵심 직관:

> **CNN = 전체 Image를 처음부터 한꺼번에 보는 대신 작은 공간 영역의 Pattern을 반복적으로 찾아 조합한다.**

대표 활용 영역:

- Image Classification
- Object Detection
- Face Recognition
- 의료 Image 분석
- 일부 음성·시계열 처리

CNN이 Image 전용이라는 뜻은 아니다. 핵심은 **국소적(Local) Pattern과 공간 구조를 효과적으로 처리하는 방식**이다.

---

## 4. RNN: 이전 상태를 다음 처리에 넘긴다

RNN(Recurrent Neural Network)은 Sequence Data의 순서를 처리하기 위해 이전 시점의 정보를 다음 시점으로 전달하는 구조다.

```text
Token 1
  ↓
RNN Cell ── hidden state ──→
                              Token 2
                                ↓
                             RNN Cell ──→
                                           Token 3
                                             ↓
                                          RNN Cell
```

현재 출력은 현재 입력만이 아니라 이전까지 전달된 Hidden State의 영향을 받는다.

```text
현재 State
= 현재 입력
+ 이전 State의 정보
```

따라서 Text, 음성, 시계열처럼 **순서가 중요한 Data**를 처리하는 데 자연스러운 구조였다.

그러나 Sequence가 길어질수록 오래전 정보가 잘 전달되지 않는 문제가 나타날 수 있다.

---

## 5. LSTM과 GRU: RNN의 장기 기억 문제를 보완

기본 RNN은 긴 Sequence에서 Gradient가 너무 작아지는 Vanishing Gradient 등의 문제로 오래전 정보를 학습하기 어려울 수 있다.

LSTM(Long Short-Term Memory)은 Gate 구조를 두어 어떤 정보를 유지하고 버릴지 조절한다.

```text
이전 정보
   ↓
┌──────────────────────┐
│      LSTM Cell       │
│                      │
│ Forget Gate          │
│ Input Gate           │
│ Output Gate          │
│                      │
└──────────────────────┘
   ↓
다음 State
```

직관적으로:

```text
Forget Gate
→ 무엇을 잊을까?

Input Gate
→ 무엇을 새로 기억할까?

Output Gate
→ 무엇을 밖으로 전달할까?
```

GRU(Gated Recurrent Unit)는 비슷한 목적을 더 단순한 Gate 구조로 구현한 계열이다.

따라서:

```text
RNN
 ↓
긴 Sequence 학습의 어려움
 ↓
LSTM / GRU
```

라는 문제 해결 흐름으로 기억하면 쉽다.

---

## 6. RNN 계열의 구조적 한계: 순차 계산

RNN은 이전 State를 받아 다음 State를 계산한다.

```text
h1
 ↓
h2
 ↓
h3
 ↓
h4
```

따라서 `h4`를 계산하려면 `h3`가 필요하고, `h3`를 계산하려면 `h2`가 필요하다.

즉 긴 Sequence를 처리할 때 계산 자체가 순차적이다.

```text
Token 1 처리
   ↓
Token 2 처리
   ↓
Token 3 처리
   ↓
...
```

이 구조는 대규모 병렬 학습에 불리할 수 있다.

또한 멀리 떨어진 Token 사이의 관계를 여러 State 전달 단계를 거쳐 표현해야 한다.

이런 배경에서 Attention과 Transformer의 의미가 커진다.

---

## 7. Attention: 필요한 위치를 직접 참고한다

Attention은 현재 Token을 처리할 때 다른 Token 중 **어떤 정보를 얼마나 참고할지 직접 계산**한다.

```text
현재 Token
    ↓
다른 Token들과 관련도 계산
    ↓
Token A  10%
Token B  20%
Token C  70%
    ↓
관련도에 따라 정보 결합
```

RNN처럼 정보를 반드시 앞에서 뒤로 State에 계속 전달하는 것과 다른 접근이다.

```text
RNN
A → B → C → D
A의 정보가 D에 가려면 중간 State를 계속 거침

Attention
D ─────────→ A를 직접 참고 가능
```

이 개념이 Transformer의 핵심 기반이 된다.

---

## 8. Transformer: Attention 중심의 Architecture

Transformer는 Sequence를 RNN의 순환 구조에 의존하지 않고 Attention을 중심으로 처리한다.

```text
Token Embedding
      ↓
Transformer Layer
├─ Self-Attention
├─ Feed-Forward Network
├─ Residual Connection
└─ Normalization
      ↓
Transformer Layer
      ↓
...
```

Self-Attention을 통해 Token 간 관계를 직접 계산할 수 있고, Training에서는 여러 Token 위치의 계산을 병렬화하기 유리하다.

이 구조가 대규모 Data와 GPU 기반 병렬 학습에 잘 맞으면서 현대 LLM의 핵심 Architecture가 되었다.

```text
Transformer
   ↓
대규모 사전학습
   ↓
Language Foundation Model
   ↓
LLM
```

중요한 점은:

> **Transformer = LLM은 아니다.**

Transformer는 Architecture이고, LLM은 대규모 언어 Data로 학습된 Language Model이다. LLM이 Transformer Architecture를 사용하는 경우가 매우 많다고 이해해야 한다.

상세한 내부 동작은 `LLM의-동작원리.md`를 참고한다.

---

## 9. CNN과 Transformer도 완전히 배타적인 것은 아니다

CNN이 Image, Transformer가 Text라고 고정해서 외우면 안 된다.

```text
CNN
→ Image에서 크게 성공

Transformer
→ NLP에서 크게 성공
→ 이후 Vision, Audio, Multimodal 등으로 확대
```

Vision Transformer(ViT)처럼 Image를 Patch 단위로 나누고 Transformer로 처리하는 방식도 있다.

즉 Architecture는 특정 Modality와 역사적으로 강하게 연결될 수 있지만 **반드시 그 Modality에만 사용할 수 있는 것은 아니다.**

---

## 10. GAN: Generator와 Discriminator의 경쟁

GAN(Generative Adversarial Network)은 생성 Model을 학습시키는 대표적인 구조다.

두 Network가 경쟁한다.

```text
Random Noise
    ↓
Generator
    ↓
가짜 Image
    ↓
                 ┌───────────────┐
실제 Image ─────→│ Discriminator │
가짜 Image ─────→│               │
                 └───────────────┘
                         ↓
                   Real / Fake 판단
```

- Generator: 진짜처럼 보이는 Data를 생성
- Discriminator: 실제 Data와 생성 Data를 구분

Training이 반복되면 Generator는 Discriminator를 속이기 위해 더 실제 같은 Data를 만들도록 학습된다.

```text
Generator 개선
      ↕ 경쟁
Discriminator 개선
```

GAN은 Image 생성에서 큰 성공을 거두었지만 Training 불안정성, Mode Collapse 등의 문제가 있을 수 있다.

상세: `생성형-AI와-멀티모달.md`

---

## 11. GAN은 CNN의 다음 세대가 아니다

이 부분을 특히 조심해야 한다.

CNN은 주로 **Network Architecture의 특징**을 설명하고 GAN은 **Generator와 Discriminator를 경쟁시키는 생성 학습 구조**를 설명한다.

GAN의 Generator나 Discriminator 내부에 CNN 계열 구조를 사용할 수도 있다.

```text
GAN
├─ Generator
│   └─ CNN 계열 Network를 사용할 수 있음
│
└─ Discriminator
    └─ CNN 계열 Network를 사용할 수 있음
```

따라서:

```text
CNN → GAN
```

이 아니라:

```text
GAN이라는 생성 구조 안에
CNN Architecture를 사용할 수도 있다
```

가 더 정확한 관계다.

---

## 12. Diffusion: Noise에서 Data를 복원한다

Diffusion 계열 생성 Model은 Data에 Noise를 점차 추가하는 과정을 학습하고, 생성 시에는 Noise에서 출발해 이를 단계적으로 제거하며 Data를 만든다.

```text
[학습 개념]
원본 Image
 ↓
Noise 추가
 ↓
더 많은 Noise
 ↓
거의 Noise

[생성]
Noise
 ↓
Noise 제거
 ↓
조금 더 구조화
 ↓
반복
 ↓
생성 Image
```

직관적으로:

> **GAN이 Generator와 Discriminator의 경쟁으로 생성 능력을 학습한다면, Diffusion은 Noise를 어떻게 제거해 Data 구조를 복원할지를 학습한다.**

GAN 이후 Image 생성 분야에서 Diffusion 계열이 크게 주목받았지만 `GAN → Diffusion` 역시 모든 AI Architecture의 일렬 발전 관계를 뜻하지 않는다.

---

## 13. Autoregressive 생성과 GAN · Diffusion

LLM에서 익숙한 Autoregressive 방식도 생성 방식의 하나다.

```text
Autoregressive Text Generation

Token 1
 ↓
Token 2
 ↓
Token 3
 ↓
...

이전 Token을 조건으로 다음 Token을 생성
```

비교하면:

```text
Autoregressive
→ 이전 출력에 이어 다음 단위를 순차 생성
→ LLM Text 생성의 대표 방식

GAN
→ Generator와 Discriminator의 경쟁으로 생성 학습
→ Image 생성에서 대표적으로 사용

Diffusion
→ Noise를 단계적으로 제거해 Data 생성
→ 현대 Image·Video 생성에서 널리 활용
```

이들은 `Text / Image / Video`라는 Modality 구분과도 별개의 축이다.

---

## 14. 기술사에서 용어를 만났을 때 분류하는 방법

새로운 AI 용어를 만났을 때 먼저 다음 질문을 던진다.

```text
이 용어는 무엇을 설명하는가?
│
├─ Network 구조인가?
│   └─ CNN / RNN / Transformer 등
│
├─ 생성·학습 방식인가?
│   └─ Autoregressive / GAN / Diffusion 등
│
├─ 처리 대상(Modality)인가?
│   └─ Text / Image / Audio / Video
│
├─ Model의 범용성·규모인가?
│   └─ Foundation Model / Task-specific Model
│
└─ 이미 만든 Model의 활용 기술인가?
    └─ Prompt / RAG / Fine-tuning / Agent / MCP
```

이렇게 먼저 좌표를 잡으면 서로 다른 층의 용어를 억지로 한 계보로 연결하는 실수를 줄일 수 있다.

---

## 15. 흐름으로 기억하기

역사적 흐름을 아주 단순화하면 다음처럼 이해할 수 있다.

```text
기본 Neural Network
        ↓
Data 특성에 맞는 Architecture 발전
        │
        ├─ 공간 Pattern
        │   └─ CNN
        │
        └─ Sequence
            └─ RNN
                ↓
              LSTM / GRU
                ↓
         긴 의존성·순차 계산 한계
                ↓
             Attention
                ↓
           Transformer
                ↓
         대규모 사전학습과 결합
                ↓
               LLM
```

생성 Model은 별도의 축으로 함께 본다.

```text
생성 Model
├─ Autoregressive
├─ GAN
└─ Diffusion
```

가장 중요한 한 문장:

> **CNN·RNN·Transformer는 주로 Data를 처리하는 신경망 구조를 설명하고, GAN·Diffusion·Autoregressive는 생성 문제를 푸는 방식이라는 서로 다른 좌표에서 먼저 이해한다.**
