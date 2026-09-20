# Thread 실행 모델 — User-level Thread · Kernel-level Thread · Mapping

> 연결: [[01-실행모델-CPU-배분|실행 모델과 CPU 배분]]
>
> 성격: 운영체제 보충학습. Thread를 단순히 하나의 실행 단위로만 보지 않고, **User Space에서 보이는 실행 단위와 Kernel이 실제 Scheduling하는 실행 단위가 어떻게 연결되는지** 이해하기 위한 문서다.
>
> 이 문서는 고전적인 User-level Thread / Kernel-level Thread 모델을 기준으로 관계를 잡고, Java Platform Thread · Virtual Thread 같은 현대 Runtime 모델은 마지막에 연결점으로만 본다.

## 이 문서의 위치

이 문서는 운영체제의 `Process / Thread / Scheduling` 개념에서 한 단계 내려가, **User Space의 실행 단위와 Kernel Scheduling 단위가 어떻게 연결되는지**를 다룬다.

```text
운영체제 실행 모델
Process / Thread
        ↓
User-level Thread / Kernel-level Thread
        ↓
Thread Mapping Model
Many-to-One / One-to-One / Many-to-Many
        ↓
현대 Runtime에 대입
Java Platform Thread / Virtual Thread
```

즉 Thread 자체의 정의를 다시 설명하는 문서가 아니라, **Thread가 어느 계층에서 관리되고 서로 어떤 방식으로 대응되는지**를 Zoom-in한다.

---

## 1. 왜 Thread를 두 계층으로 봐야 하는가

Application에서 보이는 Thread와 OS Kernel이 CPU에 올려 실행하는 Thread를 항상 같은 것으로 보면 현대 Runtime의 실행 모델을 이해하기 어렵다.

```text
Application / Runtime
        ↓
User-level 실행 단위
        ↓
Kernel이 Scheduling 가능한 실행 단위
        ↓
CPU
```

고전 운영체제에서는 이를 다음 두 층으로 구분해 설명한다.

```text
User-level Thread (ULT)
= User Space의 Library / Runtime이 관리하는 Thread

Kernel-level Thread (KLT)
= OS Kernel이 직접 Scheduling하는 Thread
```

여기서 `User-level Thread`의 `User`는 **사용자(person)**가 아니라 **User Space**를 의미한다.

```text
User-level Thread
= User Space의 Runtime / Library가 관리하는 실행 단위

Kernel-level Thread
= OS Kernel이 직접 Scheduling하는 실행 단위
```

따라서 구분 기준은 **Application 코드에서 직접 생성했는가가 아니라, 해당 실행 단위를 User Space Runtime이 관리하는가, Kernel이 직접 Scheduling하는가**다.

### Runtime과 Kernel의 책임 경계

Runtime이 Kernel Thread를 직접 만들거나 통제하는 것은 아니다. Runtime이 OS Thread가 필요하면 **OS가 제공하는 API / System Call을 통해 요청**하고, 실제 Thread의 생성·상태 관리·CPU Scheduling은 Kernel이 담당한다.

```text
Runtime / Thread Library
        ↓ 요청
OS API / System Call
        ↓
Kernel
        ↓
Kernel-level Thread 생성·관리
        ↓
OS Scheduler
```

역할을 분리하면:

```text
Runtime
= User-level 실행 단위 관리
= OS가 제공한 Thread 자원을 사용
= ULT를 사용 가능한 KLT 위에 배치

Kernel
= KLT 실제 생성·관리
= KLT 상태 관리
= CPU Scheduling
```

따라서 **Runtime이 Kernel을 Scheduling하는 것이 아니다.**

```text
Runtime Scheduler
ULT → 어떤 KLT에서 실행할지 결정

Kernel Scheduler
KLT → 어떤 CPU에서 언제 실행할지 결정
```

핵심 질문은 다음이다.

> **User Space의 여러 실행 흐름을 Kernel의 실행 단위에 어떻게 대응시킬 것인가?**

이 대응 방식이 Thread Mapping Model이다.

---

## 2. User-level Thread

User-level Thread는 Kernel이 각 Thread의 존재를 직접 관리하지 않고, User Space의 Runtime이나 Thread Library가 Scheduling과 상태 관리를 담당하는 모델이다.

```text
Process
├─ User Thread A
├─ User Thread B
└─ User Thread C
        ↓
User-space Runtime / Scheduler
```

장점:

- 생성·전환 비용을 작게 만들기 쉽다.
- Runtime이 자체 Scheduling 정책을 적용할 수 있다.
- Kernel 진입 없이 Thread 전환이 가능한 구현도 만들 수 있다.

한계:

- Kernel이 각 User Thread를 직접 알지 못할 수 있다.
- Mapping 방식에 따라 하나의 Kernel Thread가 Blocking되면 여러 User Thread가 함께 영향을 받을 수 있다.
- 실제 Multi-core 병렬성을 얻으려면 결국 여러 Kernel Scheduling 단위가 필요하다.

> User-level Thread의 핵심은 **실행 흐름의 관리 책임이 Kernel보다 User Space Runtime에 더 가깝다**는 점이다.

---

## 3. Kernel-level Thread

Kernel-level Thread는 OS Kernel이 Thread의 실행 상태를 직접 관리하고 CPU Scheduling 대상으로 다루는 모델이다.

```text
Kernel
├─ Kernel Thread A
├─ Kernel Thread B
└─ Kernel Thread C
        ↓
OS Scheduler
        ↓
CPU Core
```

Kernel은 다음과 같은 상태를 관리할 수 있다.

- Running / Ready / Waiting 같은 실행 상태
- CPU Scheduling
- Blocking / Wake-up
- Context Switch
- Priority 등 Scheduling 정보

장점:

- 여러 Kernel Thread를 여러 CPU Core에 실제 병렬 실행 가능
- 한 Thread가 Blocking되어도 다른 Kernel Thread는 계속 실행 가능

비용:

- 생성·관리·Context Switch에 Kernel 관여
- Thread가 많아질수록 Scheduling 대상과 Memory 비용 증가

> **CPU에 실제로 올라가는 최종 실행 단위는 Kernel이 Scheduling할 수 있어야 한다.**

---

## 4. User Thread와 Kernel Thread를 어떻게 연결하는가

User-level Thread와 Kernel-level Thread는 반드시 1:1로 대응할 필요가 없다.

대표적인 Mapping Model은 세 가지다.

```text
Many-to-One
여러 User Thread
→ 하나의 Kernel Thread

One-to-One
User Thread 1개
→ Kernel Thread 1개

Many-to-Many
여러 User Thread
→ 여러 Kernel Thread
```

이 세 방식은 발전 순서가 아니라 **비용·병렬성·Blocking 영향 범위 사이의 서로 다른 선택**이다.

여기서 중요한 점은 **Runtime이 실행 중에 마음대로 Mapping 방식을 고른다는 뜻이 아니라는 것**이다.

Mapping Model은 OS가 제공하는 Thread 기능과 Runtime / Thread Library의 구현 구조가 결합되어 만들어지는 실행 모델이다.

```text
OS
→ Kernel Scheduling 단위와 Thread 기능 제공

Runtime / Thread Library
→ 그 기능 위에서 ULT 관리·Mapping 구조 구현

Application
→ 이미 구현된 Thread 모델을 사용
```

즉 Runtime은 Kernel Thread 구조를 바꾸는 것이 아니라, **Kernel이 제공하는 실행 자원 위에 자신의 User-level 실행 단위를 어떻게 구성할지 구현한다.**

### 먼저 비교축을 잡는다

세 Mapping Model을 각각 외우기보다 먼저 무엇을 비교하는지 잡는다.

```text
Thread Mapping 비교축
├─ 누가 Scheduling하는가
├─ Kernel Thread가 몇 개 필요한가
├─ Multi-core 병렬성이 가능한가
├─ Blocking의 영향 범위는 어디까지인가
├─ Thread 생성·전환 비용은 어떤가
└─ Runtime Scheduler는 얼마나 복잡해지는가
```

이 비교축을 기준으로 보면 세 모델은 다음 질문에 대한 서로 다른 답이다.

```text
많은 실행 흐름을 가볍게 만들 것인가?
        ↕
Kernel이 직접 Scheduling하게 할 것인가?
        ↕
Multi-core 병렬성과 Blocking 격리를 얼마나 확보할 것인가?
```

---

## 5. Many-to-One

```text
User Thread A ─┐
User Thread B ─┼→ Kernel Thread 1
User Thread C ─┘
```

여러 User Thread를 **OS가 제공한 하나의 Kernel Thread를 실행 자원으로 사용하면서** Runtime이 번갈아 실행한다.

장점:

- User Thread 생성과 전환을 가볍게 만들기 쉽다.
- Kernel이 관리해야 할 Thread 수가 적다.

한계:

- Kernel Thread 하나가 Blocking되면 그 위의 User Thread 전체가 진행하지 못할 수 있다.
- Kernel Scheduling 단위가 하나이므로 여러 CPU Core에서 실제 병렬 실행하기 어렵다.

```text
User Thread B가 Blocking System Call
        ↓
Kernel Thread 1 대기
        ↓
A / C도 같은 Kernel Thread를 사용하므로 실행 불가
```

즉 **가볍지만 Kernel 병렬성과 Blocking 대응이 제한적**이다.

---

## 6. One-to-One

```text
User Thread A → Kernel Thread A
User Thread B → Kernel Thread B
User Thread C → Kernel Thread C
```

각 User Thread에 대응하는 Kernel Scheduling 단위가 하나씩 존재한다. 이 1:1 대응은 **One-to-One 모델의 특성**이지 모든 Thread 모델의 일반적인 성질은 아니다.

장점:

- Thread별로 Kernel Scheduling 가능
- 여러 Core에서 실제 병렬 실행 가능
- 하나가 Blocking되어도 다른 Thread는 진행 가능

비용:

- User Thread 수가 늘면 Kernel Thread 수도 함께 증가
- Stack Memory, Context Switch, Scheduler 부담 증가

```text
User Thread 수 증가
        ↓
Kernel Thread 수도 증가
        ↓
OS가 직접 관리할 Scheduling 대상 증가
```

현대의 일반적인 Native Thread / Platform Thread 모델을 이해할 때 이 구조가 중요한 기준점이 된다.

---

## 7. Many-to-Many

```text
User Thread A ─┐
User Thread B ─┼→ Runtime Scheduler ─┬→ Kernel Thread 1
User Thread C ─┤                     ├→ Kernel Thread 2
User Thread D ─┘                     └→ Kernel Thread 3
```

많은 User Thread를 **OS가 제공한 여러 Kernel Thread 위에** Runtime이 배치한다. Runtime은 이 Kernel Thread들을 직접 관리하는 것이 아니라 실행 자원으로 사용한다.

목표는 다음 두 장점을 함께 얻는 것이다.

```text
User-level Thread
→ 가벼운 실행 단위

Kernel-level Thread
→ 실제 Multi-core 병렬 실행
```

Runtime은 어떤 User Thread를 어떤 Kernel Thread에서 실행할지 결정하지만, **그 Kernel Thread를 어느 CPU에서 언제 실행할지는 OS Scheduler가 결정한다.**

장점:

- User Thread를 많이 만들 수 있다.
- Kernel Thread 수보다 많은 실행 흐름을 관리할 수 있다.
- 여러 Kernel Thread를 이용해 Multi-core 병렬성도 확보 가능

비용:

- Runtime Scheduler가 복잡해짐
- User Thread 상태와 Kernel Thread Mapping 관리 필요
- Blocking / Scheduling / Fairness 정책 설계가 복잡해질 수 있음

> **Many-to-Many의 핵심은 많은 논리 실행 단위를 더 적은 실제 Kernel Scheduling 단위 위에 다중화하는 것이다.**

---

## 8. 세 Mapping Model의 핵심 비교

먼저 **Kernel이 직접 관리하는 Thread 수** 관점에서 보면 차이가 가장 잘 보인다.

```text
예: User-level 실행 흐름이 10,000개라고 가정

Many-to-One
ULT 10,000개
→ KLT 1개

One-to-One
ULT 10,000개
→ KLT 약 10,000개

Many-to-Many
ULT 10,000개
→ KLT 8 / 16 / 32 ... 처럼 상대적으로 적은 여러 개
```

즉 Many-to-Many의 중요한 목적 중 하나는:

> **많은 User-level 실행 흐름을 유지하면서도, Kernel이 직접 관리해야 하는 Thread 수가 One-to-One처럼 함께 폭증하지 않도록 다중화하는 것**이다.

다만 KLT 수가 반드시 특정 숫자로 고정된다는 뜻은 아니다. 실제 개수와 정책은 Runtime 구현과 실행 환경에 따라 달라진다.

| 구분 | Many-to-One | One-to-One | Many-to-Many |
|---|---|---|---|
| User Thread 수 | 많음 | Kernel Thread 수와 비슷 | 많음 |
| Kernel Thread 수 | 적음 | User Thread와 함께 증가 | 제한된 여러 개 |
| Multi-core 병렬성 | 제한적 | 좋음 | 가능 |
| Blocking 영향 | 하나의 KLT가 막히면 영향 큼 | 해당 Thread 중심 | Runtime 설계에 따라 완화 가능 |
| Thread 비용 | 낮게 만들기 쉬움 | 상대적으로 큼 | ULT는 가볍고 Runtime 복잡도 증가 |
| Scheduling 주체 | User Runtime 중심 | Kernel 중심 | Runtime + Kernel |

한 문장으로 압축하면:

```text
Many-to-One
= 싸지만 Kernel 병렬성이 약함

One-to-One
= 단순하고 병렬성이 좋지만 Thread 수 증가 비용 큼

Many-to-Many
= 많은 경량 실행 단위와 Kernel 병렬성을 함께 노리는 구조
```

---

## 9. 현대 Runtime에 연결하기

고전 ULT/KLT Mapping Model은 현대 Runtime을 이해하는 기준점으로 사용할 수 있다. 다만 현대 구현을 고전 모델과 완전히 동일시하지 않는다.

### Java Platform Thread

Java Platform Thread는 일반적으로 OS Native Thread와 거의 1:1로 연결된다.

이 표현은 **One-to-One 구조이기 때문에 가능한 설명**이다. 모든 User-level / Kernel-level Thread 관계가 1:1이라는 뜻이 아니다.

```text
Java Platform Thread
        ↓ 거의 1:1
OS Native / Kernel-scheduled Thread
        ↓
OS Scheduler
        ↓
CPU
```

따라서 개념적으로 **One-to-One 성격**이 강하다.

여기서 `Platform Thread = Kernel Thread`라는 뜻은 아니다. **Platform Thread 하나의 실행을 위해 OS가 Scheduling하는 Native Thread 하나가 거의 대응한다**는 의미다.

### Java Virtual Thread

Java에서는 JVM이 User Space Runtime 역할을 한다.

운영체제 관점에서는 구현 세부를 걷어내고 다음처럼 보는 것이 가장 단순하다.

```text
Virtual Thread 여러 개
        ↓
JVM Scheduler
        ↓
여러 OS Native / Kernel-scheduled Thread 위에 다중화
        ↓
OS Scheduler
        ↓
CPU
```

따라서 고전 모델과 연결하면:

```text
Virtual Thread
≈ User-level Thread 성격

JVM Scheduler
≈ User-space Thread Runtime / Scheduler 역할

OS Native / Kernel-scheduled Thread
≈ Kernel-level Thread 쪽 실행 단위
```

즉 Java Virtual Thread는 **많은 User-level 실행 흐름을 여러 Kernel-scheduled Thread 위에 다중화한다는 점에서 Many-to-Many 성격**으로 이해할 수 있다.

`Carrier Platform Thread`는 JVM이 이를 실제로 구현할 때 사용하는 Java 측 실행 자원 이름이므로, 운영체제 Mapping Model 문서에서는 핵심 개념에서 제외하고 Java 비동기/Virtual Thread 문서에서 구현 세부로 다룬다.

다만:

```text
고전 Many-to-Many Model
= 운영체제 교과서의 일반 Mapping 개념

Java Virtual Thread
= JVM이 구현한 구체적인 현대 Thread Model
```

이므로 둘을 완전히 같은 구현으로 등치하지 않는다.

### 다른 Runtime

비슷한 사고방식은 여러 Runtime에서도 나타날 수 있다.

```text
많은 Runtime-level 실행 단위
        ↓
Runtime Scheduler
        ↓
더 적은 OS Scheduling Thread
```

예:

- Go goroutine
- Fiber / User-space Thread Runtime
- 일부 Coroutine + Executor 구조

각 언어의 의미론과 Scheduling 방식은 서로 다르므로 **Mapping 아이디어만 공통 기준점으로 사용**한다.

---

## 10. Blocking 관점으로 다시 보기

Thread Mapping Model을 이해하면 Blocking의 영향 범위도 더 명확해진다.

```text
Many-to-One
Kernel Thread 하나 Blocking
→ 여러 User Thread 영향 가능

One-to-One
Kernel Thread 하나 Blocking
→ 해당 Thread 중심으로 영향

Many-to-Many
User Thread 하나 대기
→ Runtime이 다른 User Thread를
  다른/사용 가능한 Kernel Thread에서 실행 가능
```

그래서 현대 Runtime에서 중요한 질문은 단순히:

```text
Blocking인가?
```

만이 아니다.

```text
누가 Blocking되는가?
        ↓
그 실행 단위는 실제 Kernel Thread를
1:1로 점유하는가?
        ↓
Runtime이 다른 실행 흐름으로
전환할 수 있는가?
```

까지 함께 봐야 한다.

---

## 11. 전체 관계

지금까지의 그림은 **하나의 Process / Runtime 내부를 확대해서 본 것**이다.

실제 시스템에는 여러 Process와 Runtime이 동시에 존재하며, 각 Process는 자신이 사용하는 OS Thread들을 갖는다.

```text
Process A / Runtime A
ULT A1, A2, A3
        ↓
KLT A1, A2

Process B / Runtime B
ULT B1, B2
        ↓
KLT B1

Process C / Runtime C
ULT C1, C2, C3, C4
        ↓
KLT C1, C2, C3
```

Kernel은 이들을 Runtime별로 따로 Scheduling하지 않고, **시스템 전체의 Kernel-scheduled Thread를 한꺼번에 Scheduling 대상**으로 본다.

```text
KLT A1  KLT A2
KLT B1
KLT C1  KLT C2  KLT C3
        ↓
Kernel Scheduler
        ↓
CPU Cores
```

따라서 중요한 경계는 다음과 같다.

```text
각 Runtime 내부
ULT → 자기 Process가 사용하는 KLT에 Mapping

Kernel 전체
모든 Process의 KLT → CPU Core에 Scheduling
```

이를 일반화하면:

```text
Application / Runtime
        ↓
User-level 실행 단위
        ↓
Mapping Model
├─ Many-to-One
├─ One-to-One
└─ Many-to-Many
        ↓
각 Process가 사용하는 Kernel-level Thread
        ↓
Kernel Scheduler가 시스템 전체 KLT를 관리
        ↓
CPU
```

현대 Java에 대입하면:

```text
Platform Thread
→ One-to-One 성격
→ OS Native Thread와 거의 1:1

Virtual Thread
→ Many-to-Many 성격
→ JVM Scheduler
→ 여러 OS Native / Kernel-scheduled Thread 위에 다중화
```

---

## 12. 기억·인출

```text
User-level Thread
= Runtime / Library가 관리하는 실행 단위

Kernel-level Thread
= OS Kernel이 실제 Scheduling하는 실행 단위

Many-to-One
= 여러 ULT → 하나의 KLT

One-to-One
= ULT 하나 → KLT 하나

Many-to-Many
= 여러 ULT → 여러 KLT

Platform Thread
≈ One-to-One 성격

Virtual Thread
≈ Many-to-Many 성격의 현대 Runtime 사례

Kernel Thread 수 관점
Many-to-One  = 가장 적게 사용할 수 있지만 병렬성 제약
One-to-One   = 실행 흐름 증가와 함께 KLT도 증가
Many-to-Many = 많은 ULT를 상대적으로 적은 여러 KLT에 다중화
```

가장 중요한 문장:

> **OS는 Kernel-level Thread라는 실제 Scheduling 단위를 제공·관리하고, Runtime은 그 위에서 User-level 실행 단위를 구성한다. Thread Mapping Model은 이 두 계층이 어떤 구조로 연결되는지를 설명한다.**

따라서 `Many-to-One / One-to-One / Many-to-Many`를 볼 때는 **Runtime이 Kernel을 통제한다**고 이해하지 않고, **OS가 제공한 KLT를 Runtime이 어떤 구조로 활용하느냐**를 본다.
