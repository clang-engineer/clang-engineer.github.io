# LLM 내부 운영과 GPU · Memory

이 문서는 Open Weight LLM을 사내에 직접 배포할 때 등장하는 `8B`, `70B`, GPU, VRAM, Quantization 같은 용어를 **Parameter → Weight → Memory → 연산 → Serving** 흐름으로 이해하는 데 목적이 있다.

가장 먼저 잡을 핵심은 다음이다.

> **8B·70B는 Model의 Parameter 규모를 나타내며, Model이 커질수록 Weight를 저장할 Memory와 이를 계산할 연산 자원이 많이 필요하다.**

---

## 1. 8B · 70B는 Model의 규모다

`B`는 Billion, 즉 10억을 의미한다.

```text
8B
= 약 80억 Parameter

70B
= 약 700억 Parameter

400B
= 약 4,000억 Parameter
```

따라서 `70B Model`은 Model 이름 자체라기보다 **약 700억 개의 Parameter를 가진 규모의 Model**이라는 의미다.

같은 Model Family 안에서도 여러 크기의 Model이 존재할 수 있다.

```text
Model Family
├─ 8B Model
├─ 14B Model
└─ 70B Model
```

일반적으로 Parameter 수가 많아지면 Model이 표현할 수 있는 Capacity가 커질 수 있지만, **Parameter 수가 크다고 무조건 성능이 더 좋은 것은 아니다.** Architecture, 학습 Data, Training 방법, Post-training 등에 따라 결과가 달라진다.

---

## 2. Parameter와 Weight의 관계

Training 과정에서는 Model 내부의 수많은 Parameter 값이 학습된다.

```text
Training Data
 ↓
다음 Token 예측
 ↓
실제 정답과 비교
 ↓
Loss
 ↓
Backpropagation
 ↓
Parameter 값 수정
 ↓
반복
```

학습이 끝나면 이 Parameter 값들이 Model의 Weight로 저장된다.

예를 들어 실제 Model 내부에는 다음처럼 엄청난 수의 숫자가 존재한다고 생각할 수 있다.

```text
0.18342
-0.72831
1.02394
0.00482
...
```

따라서 70B Model은 단순화하면 **학습된 숫자를 약 700억 개 가지고 있는 거대한 Neural Network**다.

---

## 3. 왜 70B FP16 Weight가 약 140GB인가

Parameter 하나를 몇 bit로 저장하느냐에 따라 Model Weight의 Memory 크기가 달라진다.

FP16은 숫자 하나를 16bit, 즉 2Byte로 표현한다.

```text
70B
= 700억 Parameter

FP16
= Parameter당 2Byte

700억 × 2Byte
≈ 140GB
```

따라서:

```text
70B FP16 Model
→ Weight만 단순 계산으로 약 140GB
```

다만 실제 Inference에 필요한 Memory는 Weight만이 아니다.

```text
필요 Memory
├─ Model Weight
├─ KV Cache
├─ Runtime Buffer
├─ 연산 중간 값
└─ 기타 Overhead
```

따라서 `70B FP16 = VRAM 140GB만 있으면 정확히 실행 가능`이라는 의미는 아니다. 실제 실행에는 추가 Memory가 필요할 수 있다.

---

## 4. Quantization: Weight를 더 적은 bit로 표현한다

Quantization(양자화)은 Model의 숫자 표현 정밀도를 낮춰 **Model 크기와 Memory·연산 부담을 줄이는 기법**이다.

예를 들어 높은 정밀도의 Weight가 다음과 같다고 하자.

```text
0.18342
-0.72831
1.02394
0.00482
```

이를 더 적은 bit로 표현하면 원래 값을 일정 수준 근사하게 된다.

실제 Quantization Algorithm은 단순 소수점 절삭보다 훨씬 복잡하지만 개념적으로는 다음 Trade-off다.

```text
정밀도 감소
   ↓
Weight 크기 감소
VRAM 사용량 감소
Memory Bandwidth 부담 감소
추론 효율 향상 가능

대신
   ↓
정보 손실
Model 품질 저하 가능
```

70B Model의 Weight만 단순 비교하면:

| 표현 | Parameter당 크기 | Weight 단순 계산 |
|---|---:|---:|
| FP16 | 16bit = 2Byte | 약 140GB |
| INT8 | 8bit = 1Byte | 약 70GB |
| 4-bit | 4bit = 0.5Byte | 약 35GB |

따라서 대형 Open Weight Model을 제한된 Hardware에서 운영할 때 Quantization이 매우 중요하다.

---

## 5. VRAM은 GPU 전용 작업 Memory다

일반적인 외장 GPU 시스템을 단순화하면 다음과 같다.

```text
CPU
├─ System RAM
│   └─ CPU가 사용할 Program과 Data
│
└─ GPU
    ├─ GPU 연산 장치
    └─ VRAM
        ├─ Model Weight
        ├─ KV Cache
        └─ GPU 연산에 필요한 Data
```

VRAM(Video RAM)은 GPU가 빠르게 접근할 수 있는 고속 Memory다.

LLM을 GPU에서 실행하면 가능한 한 Model Weight와 연산 Data를 VRAM에 두는 것이 유리하다.

```text
SSD
 ↓
System RAM
 ↓
VRAM
├─ Weight
├─ KV Cache
└─ 연산 Data
 ↓
GPU 연산
```

모든 시스템이 물리적으로 RAM과 VRAM이 완전히 분리되는 것은 아니다. 예를 들어 Unified Memory Architecture에서는 CPU와 GPU가 Memory를 공유할 수 있다. 하지만 일반적인 외장 GPU Server에서는 **System RAM과 GPU VRAM을 구분해서 이해하는 것이 기본**이다.

---

## 6. 왜 LLM에 GPU가 필요한가

CPU도 LLM 연산을 수행할 수 있다. GPU가 필요한 이유는 LLM의 핵심 계산이 **대규모 Matrix 연산을 엄청나게 반복하는 구조**이기 때문이다.

Transformer 내부에서는 다음과 같은 계산이 반복된다.

```text
입력 Vector
   ×
Weight Matrix
   ↓
새로운 Vector
```

Matrix 연산을 뜯어보면 많은 곱셈과 덧셈을 병렬로 수행할 수 있다.

```text
결과 원소 1 계산 → 연산 장치 1
결과 원소 2 계산 → 연산 장치 2
결과 원소 3 계산 → 연산 장치 3
...
```

GPU는 원래 그래픽의 수많은 Pixel에 비슷한 계산을 동시에 적용하기 위해 발전한 대규모 병렬 연산 구조다. 이 구조가 Neural Network의 Matrix 연산과 잘 맞는다.

---

## 7. CPU와 GPU의 설계 철학

### CPU

```text
소수의 강력한 Core
 ↓
복잡한 Program 흐름
조건 분기
OS 처리
다양한 범용 작업
```

CPU Core는 Branch Prediction, Cache, Out-of-Order Execution 등 복잡한 제어와 순차 처리에 강하도록 설계된다.

### GPU

```text
매우 많은 병렬 연산 장치
 ↓
같거나 비슷한 계산을
많은 Data에 동시에 적용
```

따라서 다음과 같이 기억하면 쉽다.

```text
CPU
= 복잡하고 순차 의존성이 높은 작업에 강함

GPU
= 동일·유사 연산을 대량 병렬 처리하는 데 강함
```

GPU의 개별 연산 Core와 CPU Core는 구조와 역할이 다르므로 단순히 `GPU Core가 수천 개이므로 CPU보다 수천 배 빠르다`고 비교하면 안 된다.

---

## 8. GPU가 오히려 불리할 수 있는 작업

GPU는 모든 연산에서 CPU보다 빠른 장치가 아니다.

예를 들어:

```text
값 확인
 ↓
조건 A인가?
├─ YES → 함수 X
└─ NO
    ↓
조건 B인가?
├─ YES → 함수 Y
└─ NO → 함수 Z
```

처럼 분기가 많고 각 작업이 서로 다른 흐름으로 진행되면 GPU의 대량 병렬 처리 효율이 떨어질 수 있다.

반대로:

```text
100만 개 Data에
x = a × b + c
를 반복 적용
```

하는 작업은 GPU가 잘하는 형태다.

즉 `복잡한 단일 연산`이라는 표현보다는 **병렬화하기 어렵고 분기와 순차 의존성이 높은 작업은 CPU가 유리할 수 있다**고 이해하는 것이 정확하다.

---

## 9. Tensor Core와 AI Accelerator

현대 GPU는 그래픽용 병렬 연산 장치에 더해 AI의 Matrix 연산을 빠르게 처리하기 위한 전용 연산 장치를 포함할 수 있다.

대표적인 예가 Tensor Core 계열이다.

```text
GPU
├─ 일반 병렬 연산 Core
├─ Matrix 연산 특화 장치
└─ 고속 VRAM
        ↓
Deep Learning 연산 가속
```

AI에서는 FP32보다 낮은 정밀도의 FP16, BF16, FP8, INT8 등을 활용해 Memory와 연산 효율을 높이기도 한다.

---

## 10. Model은 추론할 때 Memory에 올라가 있어야 하는가

빠른 GPU Inference를 위해서는 **추론에 필요한 Weight가 GPU가 접근 가능한 Memory에 준비되어 있어야 한다.**

일반적인 Dense Transformer에서는 Token 하나를 생성할 때도 여러 Transformer Layer를 순서대로 통과한다.

```text
입력
 ↓
Layer 1  ← Layer 1 Weight
 ↓
Layer 2  ← Layer 2 Weight
 ↓
Layer 3  ← Layer 3 Weight
 ↓
...
 ↓
Layer N  ← Layer N Weight
 ↓
다음 Token
```

따라서 쉬운 질문이라고 해서 일반적인 Dense Model의 일부 Layer만 사용하고 나머지 Weight를 전혀 필요로 하지 않는 식으로 동작하는 것은 아니다.

다만 **모든 Weight가 반드시 GPU 한 장의 VRAM에 있어야 한다는 뜻은 아니다.**

---

## 11. Model이 GPU 한 장에 안 들어가면 어떻게 하는가

### 방법 1. 여러 GPU에 분산

```text
70B FP16 Weight
≈ 140GB

GPU 1 [Weight 일부]
GPU 2 [Weight 일부]
GPU 3 [Weight 일부]
       ↓
GPU들이 통신하며 Inference
```

Tensor Parallelism, Pipeline Parallelism 등의 방법으로 Model 계산을 여러 GPU에 나눌 수 있다.

### 방법 2. Quantization

```text
70B FP16
≈ 140GB

   ↓ 4-bit Quantization

Weight 단순 계산
≈ 35GB
```

더 적은 VRAM으로 Model을 실행할 가능성이 생긴다.

### 방법 3. CPU Offloading

Model Weight 일부를 System RAM에 두고 필요할 때 GPU가 사용하도록 할 수도 있다.

```text
System RAM
[Weight 일부]
     ↓
PCIe 등으로 이동
     ↓
GPU VRAM
     ↓
계산
```

하지만 Data 이동 속도가 GPU 내부 Memory 접근보다 느리면 GPU가 Weight를 기다리게 되어 성능이 크게 낮아질 수 있다.

따라서 `실행 가능`과 `빠르게 Serving 가능`은 다른 문제다.

---

## 12. 여러 GPU를 사용하는 대표적인 방식

### Data Parallelism

같은 Model 복사본을 여러 GPU에 두고 서로 다른 Data를 처리한다.

```text
            같은 Model
          /     |      \
      GPU 1   GPU 2   GPU 3
        ↓       ↓       ↓
      Data A  Data B  Data C
```

Training 처리량 확대에서 기본적으로 많이 등장한다.

### Tensor Parallelism

하나의 큰 Matrix 계산을 여러 GPU가 나눠 처리한다.

```text
하나의 큰 Weight Matrix
        ↓
┌────────────┬────────────┐
│   GPU 1    │   GPU 2    │
│ Matrix 일부│ Matrix 일부│
└────────────┴────────────┘
        ↓
계산 결과 교환
```

### Pipeline Parallelism

Transformer Layer를 GPU별로 나눈다.

```text
입력
 ↓
GPU 1: Layer 1~20
 ↓
GPU 2: Layer 21~40
 ↓
GPU 3: Layer 41~60
 ↓
GPU 4: Layer 61~80
 ↓
출력
```

대규모 Model에서는 여러 병렬화 방식을 함께 사용할 수도 있다.

---

## 13. 그래서 GPU 간 Network도 중요하다

GPU를 여러 장 사용하면 각 GPU가 계산 결과를 계속 교환해야 할 수 있다.

```text
GPU 1 계산 ─┐
            ├→ 결과 교환 → 다음 계산
GPU 2 계산 ─┘
```

GPU 자체가 아무리 빨라도 통신이 느리면 서로 기다리게 된다.

따라서 대규모 LLM Infrastructure에서는 다음이 모두 중요하다.

```text
GPU 연산 성능
+
VRAM 용량
+
Memory Bandwidth
+
GPU ↔ GPU 연결
+
Server ↔ Server Network
```

이 때문에 Foundation Model의 Training과 대규모 Serving은 단순히 `GPU를 많이 사는 문제`가 아니라 **Compute·Memory·Network를 함께 설계하는 System 문제**가 된다.

---

## 14. Dense Model과 MoE

일반적인 Dense Model에서는 추론 시 Model의 Layer를 통과하면서 대부분의 Weight가 계산에 참여한다.

```text
Dense Model
입력
 ↓
Layer 1
 ↓
Layer 2
 ↓
...
 ↓
출력

대부분의 Parameter가 계산에 참여
```

MoE(Mixture of Experts)는 일부 Layer에 여러 Expert를 두고 입력에 따라 일부 Expert만 선택하는 방식이다.

```text
입력
 ↓
Router
 ↓
┌────────┬────────┬────────┬────────┐
Expert 1 Expert 2 Expert 3 Expert 4
           ↑              ↑
        선택됨          선택됨
```

따라서 Model이 총 400B Parameter를 가지고 있어도 매 Token마다 400B 전체가 동일하게 연산에 참여하는 것은 아닐 수 있다.

여기서 두 숫자를 구분해야 한다.

```text
Total Parameter
= Model 전체가 가지고 있는 Parameter

Active Parameter
= 현재 Token 처리에서 실제 활성화되는 Parameter
```

다만 Expert Weight 자체를 저장·Serving해야 하므로 총 Model 크기와 Memory 문제가 완전히 사라지는 것은 아니다.

---

## 15. 외부 API와 내부 Hosting의 차이

### 외부 Foundation Model API

```text
사내 Application
      ↓
외부 Network
      ↓
Foundation Model Provider
      ↓
Inference
```

장점:

- 자체 GPU Infrastructure 부담이 작음
- 높은 성능의 Model을 빠르게 사용 가능
- Model Serving 운영을 Provider가 담당

고려사항:

- 외부망 연결
- Data 반출 정책
- 비용
- Provider 의존성

### 내부 Open Weight Model

```text
외부에서 이미 학습된 Model Weight 확보
        ↓
보안 절차에 따라 내부 반입
        ↓
사내 GPU Server에 Load
        ↓
내부 Inference Service
```

장점:

- Data를 내부에 유지 가능
- 폐쇄망에서도 구성 가능
- Model Serving을 직접 통제

고려사항:

- GPU / VRAM
- 전력·냉각
- Model Serving 운영
- 성능 최적화
- Model Update와 보안 관리

즉 **Foundation Model 자체가 외부망을 반드시 요구하는 것이 아니라, 외부 API 방식이 외부 연결을 요구하는 것**이다.

---

## 16. 폐쇄망 RAG에서 왜 내부 Model이 중요할 수 있는가

RAG의 Vector DB가 내부에 있다고 해서 Data가 자동으로 내부에만 머무는 것은 아니다.

### 외부 LLM API 사용
