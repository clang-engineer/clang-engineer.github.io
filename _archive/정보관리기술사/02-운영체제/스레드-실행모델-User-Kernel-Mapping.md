# Thread 실행 모델 — User-level Thread · Kernel-level Thread · Mapping

> 연결: [실행 모델과 CPU 배분](01-실행모델-CPU-배분.md)
>
> 성격: 운영체제 보충학습. **User Space의 실행 단위가 Kernel이 실제 Scheduling하는 실행 단위와 어떻게 연결되는지** 이해하기 위한 문서다.

## 1. 먼저 이것만 기억한다

~~~text
ULT(User-level Thread)
= Runtime / Thread Library가 관리하는 실행 단위

KLT(Kernel-level Thread)
= Kernel이 관리·Scheduling하는 실행 단위
~~~

그리고 역할을 딱 둘로 나눈다.

~~~text
Runtime / Thread Library
ULT → 어떤 KLT 위에서 실행할지 결정

OS / Kernel
KLT → 어떤 CPU에서 언제 실행할지 결정
~~~

즉:

> **ULT ↔ KLT는 Runtime 영역, KLT ↔ CPU는 Kernel 영역**

이다.

---

## 2. 왜 ULT와 KLT를 나누어 보나

Application에서 보이는 실행 흐름과 Kernel이 CPU에 올리는 실행 단위가 항상 1:1인 것은 아니다.

~~~text
Application / Runtime
        ↓
User-level Thread(ULT)
        ↓
Thread Mapping
        ↓
Kernel-level Thread(KLT)
        ↓
Kernel Scheduler
        ↓
CPU
~~~

핵심 질문은 하나다.

> **여러 ULT를 몇 개의 KLT 위에서 실행할 것인가?**

이 대응 방식이 Thread Mapping Model이다.

---

## 3. Runtime과 Kernel은 무엇을 하나

### Runtime / Thread Library

~~~text
Runtime
├─ ULT 생성·상태 관리
├─ ULT Scheduling
└─ ULT를 어떤 사용 가능한 KLT 위에서 실행할지 결정
~~~

필요하면 OS에 Thread 생성을 요청할 수 있지만, **KLT 자체를 직접 관리하는 주체는 아니다.**

### OS / Kernel

~~~text
Kernel
├─ KLT 생성·상태 관리
├─ Ready / Running / Waiting 관리
├─ Blocking / Wake-up
├─ Context Switch
└─ KLT → CPU Scheduling
~~~

즉 Runtime은:

~~~text
"이 ULT를 어느 KLT 위에서 돌릴까?"
~~~

를 결정하고,

Kernel은:

~~~text
"이 KLT를 어느 CPU에서 언제 돌릴까?"
~~~

를 결정한다.

---

## 4. Mapping Model은 ULT 수와 KLT 수의 관계다

대표적인 세 가지는 다음과 같다.

~~~text
Many-to-One
ULT 여러 개
   ↓
KLT 1개

One-to-One
ULT 1개
   ↓
KLT 1개

Many-to-Many
ULT 여러 개
   ↓
KLT 여러 개
~~~

이들은 발전 순서가 아니라 **비용·병렬성·Blocking 영향 범위 사이의 서로 다른 선택**이다.

### 비교축

~~~text
Mapping Model
├─ ULT를 얼마나 가볍게 많이 만들 수 있는가
├─ KLT가 몇 개 필요한가
├─ Multi-core 병렬성이 가능한가
├─ Blocking 영향이 얼마나 퍼지는가
└─ Runtime Scheduler가 얼마나 복잡한가
~~~

---

## 5. Many-to-One

~~~text
ULT A ─┐
ULT B ─┼→ KLT 1
ULT C ─┘
~~~

Runtime이 여러 ULT를 하나의 KLT 위에서 번갈아 실행한다.

장점:
- ULT 생성·전환을 가볍게 만들기 쉽다.
- Kernel이 관리할 KLT 수가 적다.

한계:
- KLT 하나가 Blocking되면 그 위의 ULT 전체가 영향받을 수 있다.
- KLT가 하나이므로 Multi-core 병렬성이 제한된다.

~~~text
ULT B가 Blocking
      ↓
KLT 1 대기
      ↓
ULT A / C도 실행 어려움
~~~

---

## 6. One-to-One

~~~text
ULT A → KLT A
ULT B → KLT B
ULT C → KLT C
~~~

각 ULT에 KLT 하나가 대응한다.

장점:
- Kernel이 각 Thread를 직접 Scheduling
- Multi-core 병렬 실행 가능
- 하나가 Blocking되어도 다른 Thread는 계속 실행 가능

비용:
- ULT가 늘면 KLT도 같이 증가
- Stack Memory / Scheduler / Context Switch 부담 증가

일반적인 Java Platform Thread나 Native Thread를 이해할 때 중요한 기준점이다.

---

## 7. Many-to-Many

~~~text
ULT A ─┐
ULT B ─┼→ Runtime Scheduler ─┬→ KLT 1
ULT C ─┤                     ├→ KLT 2
ULT D ─┘                     └→ KLT 3
~~~

Runtime이 많은 ULT를 여러 KLT 위에 다중화한다.

핵심은:

~~~text
ULT는 많이
KLT는 상대적으로 적게
        ↓
가벼운 실행 단위 + Multi-core 병렬성
~~~

Runtime은 어떤 ULT를 어떤 사용 가능한 KLT 위에서 실행할지 결정하지만, **그 KLT를 CPU에 올리는 것은 Kernel Scheduler가 결정**한다.

---

## 8. 세 모델을 한 번에 비교한다

| 구분 | Many-to-One | One-to-One | Many-to-Many |
|---|---|---|---|
| ULT 수 | 많게 가능 | KLT 수와 비슷 | 많게 가능 |
| KLT 수 | 적음 | ULT와 함께 증가 | 상대적으로 적은 여러 개 |
| Multi-core 병렬성 | 제한적 | 좋음 | 가능 |
| Blocking 영향 | 큼 | 해당 Thread 중심 | 완화 가능 |
| Thread 비용 | 낮게 만들기 쉬움 | 상대적으로 큼 | ULT는 가볍고 Runtime은 복잡 |
| Scheduling | Runtime 중심 | Kernel 중심 | Runtime + Kernel |

한 줄 요약:

~~~text
Many-to-One
= 가볍지만 병렬성과 Blocking 대응이 약함

One-to-One
= 단순하고 병렬성이 좋지만 KLT 수가 많이 늘 수 있음

Many-to-Many
= 많은 ULT와 Kernel 병렬성을 함께 노림
~~~

---

## 9. Java에 대입하면 더 쉽다

### 일반 Platform Thread

~~~text
Application
   ↓
Java Platform Thread
   ↓ 거의 1:1
OS Native Thread / KLT
   ↓
Kernel Scheduler
   ↓
CPU
~~~

Application/JVM이 Thread를 만들도록 **요청**하고 Thread Pool 크기를 정할 수는 있지만, 실제 KLT의 관리·Scheduling 주체는 Kernel이다.

~~~text
Application / JVM
├─ Thread 생성 요청
├─ Thread Pool 크기 결정
└─ 작업 배치
        ↓
Kernel
├─ 실제 OS Thread(KLT) 관리
└─ CPU Scheduling
~~~

그래서 일반 Java Thread / ThreadPool worker는 **One-to-One 성격**이 강하다.

### Java Virtual Thread

Virtual Thread를 쓰면 User-level 실행 단위가 하나 더 생긴다.

~~~text
Application Task
      ↓
Virtual Thread
= JVM이 관리하는 경량 실행 단위
      ↓
JVM Scheduler
      ↓
Carrier Platform Thread
      ↓ 거의 1:1
OS Native Thread / KLT
      ↓
Kernel Scheduler
      ↓
CPU
~~~

역할을 나누면:

~~~text
Virtual Thread
→ JVM이 관리

Carrier / Platform Thread
→ Virtual Thread를 실제로 실행시키는 JVM 측 실행 자원

OS Native Thread / KLT
→ Kernel이 관리·Scheduling
~~~

즉 Java Virtual Thread는 **많은 User-level 실행 흐름을 여러 Kernel-scheduled Thread 위에 다중화한다는 점에서 Many-to-Many 성격**으로 이해할 수 있다.

다만 고전적인 Many-to-Many 모델과 Java Virtual Thread 구현을 완전히 같은 것으로 등치하지는 않는다.

---

## 10. Blocking 관점에서 보면 차이가 더 잘 보인다

~~~text
Many-to-One
KLT 하나 Blocking
→ 그 위의 여러 ULT 영향

One-to-One
KLT 하나 Blocking
→ 해당 Thread 중심으로 영향

Many-to-Many
ULT 하나 대기
→ Runtime이 다른 ULT를
  사용 가능한 다른 KLT에서 실행 가능
~~~

그래서 중요한 질문은 단순히 "Blocking인가?"가 아니다.

~~~text
누가 Blocking되는가?
        ↓
그 실행 단위가 KLT를 1:1로 점유하는가?
        ↓
Runtime이 다른 ULT를 다른 KLT에서 실행할 수 있는가?
~~~

까지 본다.

---

## 11. 전체 그림

~~~text
Application / Runtime
        ↓
ULT
        ↓
Runtime Scheduler
        ↓
Mapping Model
├─ Many-to-One
├─ One-to-One
└─ Many-to-Many
        ↓
KLT
        ↓
Kernel Scheduler
        ↓
CPU
~~~

책임 경계는 끝까지 같다.

~~~text
ULT 관리·Scheduling
= Runtime / Thread Library

KLT 관리·CPU Scheduling
= Kernel
~~~

---

## 12. 기억·인출

~~~text
ULT
= Runtime이 관리

KLT
= Kernel이 관리

ULT → KLT
= Runtime이 Mapping

KLT → CPU
= Kernel Scheduler

Many-to-One
= 여러 ULT → KLT 1개

One-to-One
= ULT 1개 → KLT 1개

Many-to-Many
= 여러 ULT → 여러 KLT

Java Platform Thread
≈ One-to-One 성격

Java Virtual Thread
≈ Many-to-Many 성격
~~~

가장 중요한 문장:

> **Runtime은 자기 ULT를 어떤 KLT 위에서 실행할지 관리하고, Kernel은 KLT를 실제 CPU에 Scheduling한다.**
