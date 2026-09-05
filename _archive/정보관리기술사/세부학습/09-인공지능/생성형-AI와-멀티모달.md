# 생성형 AI와 멀티모달

이 문서는 생성형 AI를 LLM과 동일한 개념으로 생각하지 않고, **Text·Image·Audio·Video처럼 Data 형태에 따라 어떤 생성 방식이 사용되고 서로 어떻게 연결되는지** 큰 그림을 이해하는 데 목적이 있다.

가장 먼저 잡을 핵심은 다음이다.

> **LLM은 생성형 AI의 중요한 한 갈래이지만 생성형 AI 전체는 아니다.**

```text
생성형 AI(Generative AI)
│
├─ Text
│   └─ LLM / Autoregressive 생성
│
├─ Image
│   ├─ GAN
│   └─ Diffusion 계열
│
├─ Audio / Speech
│   ├─ Speech-to-Text
│   ├─ Text-to-Speech
│   └─ Audio 생성
│
├─ Video
│   └─ 공간적 구조 + 시간적 관계 생성
│
└─ Multimodal
    └─ Text · Image · Audio · Video를 함께 이해·생성
```

---

## 1. 생성형 AI란 무엇인가

전통적인 분류 모델은 주어진 Data가 어떤 Class에 속하는지를 판단하는 데 초점을 둘 수 있다.

```text
Image
 ↓
분류 Model
 ↓
고양이 / 강아지
```

생성형 AI는 학습한 Data의 구조와 분포를 바탕으로 새로운 결과를 생성하는 데 초점을 둔다.

```text
Prompt / 조건 / Noise
        ↓
     생성 Model
        ↓
새 Text / Image / Audio / Video
```

따라서 생성형 AI라는 상위 범주 안에서도 **무엇을 생성하고 어떤 방식으로 학습하느냐에 따라 Model 구조와 학습 목표가 달라질 수 있다.**

---

## 2. LLM은 Text 생성에 특화된 대표적 생성 모델

GPT 계열 LLM을 단순화하면 다음과 같다.

```text
현재까지의 Token
        ↓
Transformer
        ↓
다음 Token 확률
        ↓
Token 하나 생성
        ↓
Context에 추가
        ↓
반복
```

즉 Text 생성에서는 **앞의 Token을 조건으로 다음 Token을 반복 예측하는 Autoregressive 방식**이 핵심적인 구조 중 하나다.

다만 여기서 Transformer와 Autoregressive를 완전히 떨어진 별도 계층처럼 이해하면 다시 헷갈릴 수 있다.

```text
Transformer
= 현재 Context를 보고 다음 Token 후보 분포를 계산하는 Architecture

Autoregressive Generation
= 그 후보 분포에서 Decoding으로 Token을 선택하고,
  선택된 Token을 다시 Context에 포함해
  다음 Token 생성을 반복하는 전체 생성 방식
```

따라서 GPT류 LLM의 실행 흐름은 다음처럼 보는 것이 자연스럽다.

```text
현재 Context
 ↓
Transformer
 ↓
다음 Token 후보 분포
 ↓
Decoding
 ↓
Token 하나 선택
 ↓
선택 Token을 Context에 추가
 ↓
다음 Step 반복
```

즉 Transformer와 Autoregressive는 같은 층의 경쟁 기술이 아니지만, 실제 LLM 생성에서는 **Autoregressive Generation이라는 생성 방식 안에서 Transformer가 다음 Token 분포를 계산하는 핵심 구조로 사용**된다.

하지만 Image는 처음부터 문장처럼 Token의 순서로만 표현되는 Data가 아니며, Image 생성에는 GAN이나 Diffusion처럼 다른 생성 방식도 발전해왔다.

---

# GAN

## 3. GAN: 생성자와 판별자를 경쟁시킨다

GAN(Generative Adversarial Network, 생성적 적대 신경망)은 두 Neural Network를 경쟁시키며 생성 능력을 학습하는 방식이다.

핵심 구성요소:

- Generator: 가짜 Data를 생성
- Discriminator: 입력이 실제 Data인지 생성된 Data인지 판별

```text
Random Noise
     ↓
Generator
     ↓
가짜 Image ─────────┐
                    ↓
실제 Image ───→ Discriminator
                    ↓
               진짜 / 가짜 판별
```

학습 목표를 직관적으로 보면:

```text
Generator
= Discriminator를 속일 정도로 실제 같은 Data를 만들고 싶다.

Discriminator
= 실제 Data와 Generator가 만든 Data를 구분하고 싶다.
```

둘이 서로 경쟁하면서 Generator의 생성 품질이 향상된다.

---

## 4. GAN의 장점과 어려움

GAN은 고품질 Image 생성에서 역사적으로 매우 중요한 역할을 했다.

장점:

- 한 번의 Generator Forward 과정으로 빠르게 생성 가능
- 선명한 Image 생성에 강점을 보인 계열이 많음

어려움:

- Generator와 Discriminator의 균형을 맞추는 학습이 까다로울 수 있음
- 학습이 불안정해질 수 있음
- Mode Collapse처럼 다양한 Data 분포 중 일부 Pattern만 반복 생성하는 문제가 생길 수 있음

### Mode Collapse

예를 들어 실제 얼굴 Data에는 매우 다양한 얼굴이 있는데 Generator가 판별자를 잘 속이는 몇 가지 얼굴 Pattern만 반복 생성한다면:

```text
실제 Data 분포
├─ 얼굴 A
├─ 얼굴 B
├─ 얼굴 C
├─ 얼굴 D
└─ ...

Generator
→ A와 비슷한 얼굴
→ A와 비슷한 얼굴
→ A와 비슷한 얼굴
```

처럼 다양성을 충분히 표현하지 못할 수 있다.

---

# Diffusion

## 5. Diffusion Model의 핵심 아이디어

Diffusion 계열은 GAN과 다른 방식으로 Data 생성을 학습한다.

직관적으로는 **Data에 Noise를 점점 추가하는 과정과, 반대로 Noise에서 Data 방향으로 복원하는 과정을 학습**한다고 볼 수 있다.

### Forward Process

```text
원본 Image
   ↓ Noise 추가
조금 흐려진 Image
   ↓ Noise 추가
더 흐려진 Image
   ↓
...
   ↓
거의 Noise
```

### Reverse Process

생성 시에는 반대 방향을 사용한다.

```text
Noise
 ↓
Noise를 조금 제거
 ↓
대략적인 형태
 ↓
더 구체적인 형태
 ↓
세부 표현
 ↓
생성 Image
```

실제 수학적·구현적 구조는 더 복잡하지만 학습 단계에서는 이 큰 흐름을 먼저 잡는 것이 좋다.

---
## 6. GAN과 Diffusion은 무엇이 다른가

```text
GAN
Generator ↔ Discriminator
두 Network의 경쟁을 통해 생성 능력 학습

Diffusion
Noise가 섞인 Data에서
원래 Data 방향으로 복원하는 과정을 학습
```

| 구분 | GAN | Diffusion |
|---|---|---|
| 핵심 아이디어 | 생성자와 판별자의 경쟁 | Noise 추가·제거 과정 학습 |
| 주요 구성 | Generator + Discriminator | Noise 예측·복원 Model |
| 학습 특성 | 경쟁 학습으로 불안정할 수 있음 | 상대적으로 안정적인 학습이 가능 |
| 생성 과정 | Generator가 직접 생성 | 여러 단계의 복원 과정을 사용할 수 있음 |
| 대표적 이슈 | Mode Collapse | 반복 생성 단계에 따른 계산 비용 |

중요한 것은 `GAN은 옛날 기술, Diffusion은 무조건 최신 기술`처럼 단순 세대 구분으로 외우지 않는 것이다. **서로 생성 원리가 다른 Model 계열**이며 목적과 시스템 설계에 따라 다양한 방식이 사용될 수 있다.

---

## 7. Text Prompt로 Image를 만드는 과정

사용자가 다음과 같이 요청했다고 하자.

```text
"우주에서 라면을 먹는 고양이를 그려줘"
```

Image 생성 Model이 Noise만 받으면 사용자가 무엇을 원하는지 알 수 없다. 따라서 Text 조건을 Image 생성 과정에 연결해야 한다.

개념적으로:

```text
Text Prompt
"우주에서 라면을 먹는 고양이"
        ↓
Text Encoder
        ↓
Text의 의미 표현
        │
        ├──────────────┐
        │              ↓
        │         Image 생성 Model
        │              ↑
        └────────── Noise
                       ↓
              Prompt 조건을 반영하며 생성
                       ↓
                    Image
```

즉 **생성 과정이 Text라는 조건(Condition)을 참고하도록 만드는 Conditional Generation**으로 볼 수 있다.

여기서 Text와 Image가 서로 다른 Data 형태임에도 내부 표현을 통해 연결된다는 점이 Multimodal AI로 이어진다.

---

# Image 이해

## 8. Image는 어떻게 Neural Network가 처리하는가

Image는 Pixel의 배열이다.

```text
Image
 ↓
Pixel 값
 ↓
Neural Network가 처리할 내부 표현
 ↓
Object · 형태 · 관계 등의 특징
```

전통적으로 CNN(Convolutional Neural Network)이 Image 처리에서 중요한 역할을 해왔다.

Transformer 구조도 Image에 적용할 수 있다. 대표적인 아이디어 중 하나가 Image를 작은 Patch로 나누어 처리하는 것이다.

```text
Image
 ↓
Patch 1 / Patch 2 / Patch 3 / ...
 ↓
각 Patch를 Vector 표현으로 변환
 ↓
Transformer
 ↓
Patch 사이의 관계 반영
```

이런 계열을 이해할 때 중요한 점은:

> **Transformer는 Text 전용 Algorithm이 아니다.**

입력을 적절한 단위와 Vector 표현으로 만들 수 있다면 Image 등 다른 Data에도 Transformer 구조를 적용할 수 있다.

---

# Audio / Speech

## 9. Audio는 시간에 따라 변하는 신호다

Text는 Token의 Sequence이고 Image는 공간적으로 배치된 Pixel Data라면 Audio는 시간에 따라 변하는 Signal이다.

```text
시간 ─────────────────────→
Audio Waveform
~~~~~~╲__╱~~~~╲____╱~~~~~~
```

목적에 따라 여러 Task가 존재한다.

### STT

STT(Speech-to-Text, 음성을 Text로 변환)는 다음과 같은 방향이다.

```text
사람의 음성
 ↓
Audio 처리 / Encoder
 ↓
음향·언어적 내부 표현
 ↓
Text 생성
 ↓
"안녕하세요"
```

### TTS

TTS(Text-to-Speech, Text를 음성으로 변환)는 반대 방향이다.

```text
"안녕하세요"
 ↓
Text 처리
 ↓
발음 · 억양 · 리듬 등의 표현
 ↓
Audio 생성
```

Audio 생성 역시 하나의 고정된 Algorithm만 사용하는 것은 아니며 목적에 따라 다양한 Model 구조와 생성 방식이 사용될 수 있다.

---

# Video

## 10. Video 생성이 Image 생성보다 어려운 이유

Video를 단순하게 보면 시간 순서로 이어지는 Image Frame의 집합이다.

```text
Frame 1 → Frame 2 → Frame 3 → Frame 4 → ...
```

하지만 각 Frame을 독립적으로 예쁘게 생성하는 것만으로는 자연스러운 Video가 되지 않는다.

예를 들어 사람이 걷는 Video라면:

```text
Frame 1   사람 위치 A
Frame 2   조금 이동
Frame 3   더 이동
Frame 4   계속 이동
```

하면서 다음이 유지되어야 한다.

- 같은 사람의 얼굴과 옷
- Object의 형태
- 배경
- 움직임 방향
- 조명
- Camera 관점
- 물리적으로 자연스러운 변화

즉 Video 생성에서는 **공간적 일관성(Spatial Consistency)뿐 아니라 시간적 일관성(Temporal Consistency)**도 중요하다.

```text
Image 생성
= 한 시점의 공간 구조 생성

Video 생성
= 공간 구조
  +
  시간에 따른 변화와 일관성
```

현대 Video 생성에서는 Transformer, Diffusion 계열 등 여러 기술이 결합될 수 있다. 따라서 `Video = Image Diffusion을 Frame마다 독립 실행`이라고 단순화하면 부족하다.

---

# Multimodal

## 11. Modality란 무엇인가
Modality는 Model이 다루는 정보 형태를 의미한다.

```text
Text
Image
Audio
Video
```

Multimodal AI는 둘 이상의 Modality를 함께 다루는 시스템이다.

예:

```text
Image + Text
→ 사진을 보고 질문에 답하기

Audio + Text
→ 음성을 듣고 요약하기

Text → Image
→ Prompt로 Image 생성

Text + Image → Text
→ Screenshot을 보고 설명하기
```

---

## 12. 서로 다른 Modality를 어떻게 연결하는가

각 Data 형태는 원래 구조가 다르다.

```text
Text
→ Token

Image
→ Pixel / Patch

Audio
→ Waveform / 시간적 특징

Video
→ 공간 + 시간 Data
```

따라서 각 입력을 Neural Network가 사용할 수 있는 내부 표현으로 변환한 뒤 서로 연결한다.

개념적으로:

```text
Text  ─→ Text 표현 ───┐
                       │
Image ─→ Vision 표현 ──┼→ 공통 Model / 연결 공간 → 출력
                       │
Audio ─→ Audio 표현 ───┘
```

실제 Multimodal Model은 하나의 Transformer가 모든 Raw Data를 그대로 처리할 수도 있다는 뜻이 아니다. Model에 따라 Vision Encoder, Audio Encoder, Projector, Decoder, 생성 Model 등 여러 구성요소를 조합할 수 있다.

핵심은:

> **서로 다른 Data 형태를 Model이 함께 사용할 수 있는 표현으로 연결한다.**

는 것이다.

---

## 13. LLM과 Multimodal Model의 관계

LLM에 Vision이나 Audio 처리 능력을 연결하면 Text 중심의 추론 능력을 다른 Modality와 결합할 수 있다.

```text
Image
 ↓
Vision 처리
 ↓
Image 내부 표현 ─────┐
                     ↓
Text Prompt ───────→ Multimodal Model
                     ↓
                 Text 답변
```

예를 들어 Image를 보고:

```text
"이 Diagram에서 잘못된 부분이 뭐야?"
```

라고 질문할 수 있는 것은 Image 정보와 Text 질문을 함께 Model이 사용할 수 있도록 연결했기 때문이다.

반대로 Text를 입력받아 Image나 Audio를 출력하는 시스템은 LLM의 Text 출력만으로 끝나는 것이 아니라 해당 Modality를 실제로 생성할 수 있는 구성요소가 필요할 수 있다.

---

## 14. LLM · GAN · Diffusion · Multimodal을 같은 계층으로 외우지 않는다

이 용어들은 분류축이 다르다.

```text
LLM
= 주로 언어를 다루는 대규모 Model 범주

GAN
= Generator와 Discriminator의 경쟁이라는 학습·생성 Architecture

Diffusion
= Noise 추가·복원 과정을 이용하는 생성 Model 계열

Multimodal
= 여러 정보 형태를 함께 다룬다는 시스템·Model 특성
```

따라서 다음처럼 일렬로 외우면 안 된다.

```text
LLM → GAN → Diffusion → Multimodal   X
```

대신:

```text
무엇을 다루는가?
├─ Text
├─ Image
├─ Audio
└─ Video

어떤 생성 원리를 쓰는가?
├─ Autoregressive
├─ GAN 계열
└─ Diffusion 계열

몇 가지 Modality를 함께 다루는가?
├─ Unimodal
└─ Multimodal
```

처럼 **서로 다른 분류축**으로 이해한다.

다만 서로 다른 분류축은 실제 Model 안에서 함께 결합될 수 있다.

```text
GPT류 LLM
= Text를 다룸
+ Transformer 구조를 주로 사용
+ Autoregressive 방식으로 Token을 생성
```

따라서 `Transformer와 Autoregressive는 다른 축이다`라는 말은 서로 경쟁하는 같은 계층이 아니라는 뜻이지, 실제 LLM 실행에서 서로 관련이 없다는 뜻은 아니다.

---

## 15. 지금까지 배운 AI 개념과 연결

기존 LLM 중심 학습과 이번 내용을 연결하면 다음과 같다.

```text
                         생성형 AI
                             │
        ┌────────────────────┼────────────────────┐
        ↓                    ↓                    ↓
      Text                 Image              Audio / Video
        │                    │                    │
       LLM             GAN / Diffusion       다양한 생성 Model
        │                    │                    │
        └────────────────────┼────────────────────┘
                             ↓
                         Multimodal
                             │
                    여러 형태의 정보를 연결
```

그리고 LLM 기반 응용은 별도의 축으로 이어진다.

```text
LLM
├─ Prompt / Context 제어
├─ RAG
├─ Fine-tuning
├─ Tool Calling
└─ Agent / MCP
```

즉 RAG나 Agent는 **LLM을 어떻게 활용할 것인가**에 가까운 개념이고, GAN·Diffusion은 **Data를 어떻게 생성하도록 Model을 학습·구성할 것인가**라는 다른 층위의 개념이다.

---

## 16. 처음 헷갈리기 쉬운 부분

```text
생성형 AI = LLM?
→ X
LLM은 생성형 AI의 중요한 한 갈래다.

Image 생성도 다음 Text Token 예측인가?
→ 반드시 그렇지 않다.
GAN, Diffusion 등 다른 생성 방식이 있다.

Transformer = LLM?
→ X
Transformer는 Neural Network Architecture이며 Image 등에도 적용할 수 있다.

Transformer와 Autoregressive는 완전히 따로 노는가?
→ X
분류축은 다르지만 GPT류 LLM에서는 Autoregressive Generation 방식 안에서 Transformer가 다음 Token 후보 분포를 계산하는 핵심 구조로 사용된다.

GAN과 Diffusion은 Image 전용인가?
→ X
Image 생성으로 널리 알려졌지만 생성 원리 자체를 Image에만 한정할 수는 없다.
Audio·Video 등 다른 Modality의 생성에서도 관련 아이디어와 변형이 사용될 수 있다.

Multimodal = 하나의 특정 Architecture인가?
→ X
Multimodal은 여러 정보 형태를 함께 다룬다는 특성이고, 실제 내부 Architecture는 Model마다 다를 수 있다.
```

---

## 17. 기억 흐름

```text
생성형 AI
├─ 무엇을 생성하는가? → Text / Image / Audio / Video
├─ 어떤 생성 원리인가? → Autoregressive / GAN / Diffusion 등
└─ 몇 가지 Modality를 함께 다루는가? → Unimodal / Multimodal

GPT류 LLM
├─ 처리 대상 → Text
├─ 주요 구조 → Transformer
└─ 생성 방식 → Autoregressive Generation
```

가장 중요한 한 문장:

> **LLM·GAN·Diffusion·Multimodal은 같은 계층의 경쟁 기술이 아니라 서로 다른 질문에 답하는 개념이며, 생성형 AI를 이해할 때는 처리 대상·생성 원리·Modality 결합 여부를 분리해서 봐야 한다. 다만 실제 GPT류 LLM에서는 Text Modality, Transformer Architecture, Autoregressive Generation이 한 생성 시스템 안에서 결합된다.**