# Java Virtual Thread · Carrier Thread · JVM Scheduling

> 연결: [Thread 실행 모델 — User-level Thread · Kernel-level Thread · Mapping](스레드-실행모델-User-Kernel-Mapping.md)
>
> 성격: 보충학습. 고전적인 ULT/KLT Mapping 개념을 Java Platform Thread와 Virtual Thread에 대입해 이해한다.

## 1. 먼저 일반 Platform Thread

일반 Java Platform Thread는 OS Native Thread와 거의 1:1로 대응한다.

~~~text
Java Platform Thread
        ↓ 거의 1:1
OS Native Thread / KLT
        ↓
Kernel Scheduler
        ↓
CPU
~~~

Application/JVM이 Thread 생성이나 Thread Pool 크기를 정할 수는 있지만, 실제 OS Thread의 상태 관리와 CPU Scheduling은 Kernel이 담당한다.

즉 일반적인 Java Thread / ThreadPool Worker는 **One-to-One 성격**이 강하다.

## 2. Virtual Thread가 들어오면 실행 계층이 하나 더 생긴다

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

핵심은 Virtual Thread 자체가 OS Thread와 1:1로 대응하지 않는다는 점이다.

## 3. Carrier Thread는 기존 Platform Thread다

Carrier Thread는 새로운 종류의 OS Thread가 아니라, **Virtual Thread를 실제로 실행시키는 Platform Thread의 역할 이름**이다.

~~~text
Virtual Thread
      ↓ JVM이 Mount
Carrier Platform Thread
      ↓
OS Native Thread / KLT
~~~

즉:

- Virtual Thread = JVM이 관리하는 경량 실행 단위
- Carrier Thread = Virtual Thread를 실제로 실행시키는 Platform Thread
- OS Native Thread / KLT = Kernel이 관리하는 실제 Scheduling 단위

## 4. 왜 Many-to-Many 성격인가

Carrier Thread가 하나뿐이라면 다음은 Many-to-One이다.

~~~text
VT1 ─┐
VT2 ─┼→ Carrier 1
VT3 ─┘
~~~

하지만 실제 Virtual Thread 실행에서는 Carrier Thread가 여러 개 존재한다.

~~~text
VT1 ─┐              ┌→ Carrier 1
VT2 ─┤              ├→ Carrier 2
VT3 ─┼→ JVM Scheduler
VT4 ─┤              ├→ Carrier 3
VT5 ─┘              └→ Carrier 4
~~~

그래서 전체 구조는:

~~~text
Virtual Thread 다수
        ↓ M:N
Carrier Platform Thread 다수
        ↓ 거의 1:1
OS Native Thread / KLT
~~~

가 된다.

즉 Java Virtual Thread를 고전 Mapping Model에 대입하면 **Many-to-Many 성격**으로 이해할 수 있다.

## 5. JVM과 Kernel의 역할은 다르다

~~~text
JVM
= Virtual Thread 관리
= 어떤 Virtual Thread를 어떤 Carrier에서 실행할지 Scheduling

Kernel
= OS Native Thread / KLT 관리
= KLT를 어떤 CPU에서 언제 실행할지 Scheduling
~~~

따라서 JVM이 Kernel Thread 자체를 관리하거나 CPU Scheduling을 대신하는 것은 아니다.

JVM은 **자신의 Virtual Thread를 Kernel이 관리하는 OS Thread 위에서 어떻게 실행할지** 결정한다.

## 6. Blocking을 어떻게 이해할까

일반 Platform Thread는 실행 단위와 OS Thread가 거의 1:1이다.

~~~text
Platform Thread Blocking
        ↓
대응하는 OS Thread도 대기
~~~

Virtual Thread는 JVM이 관리하는 실행 단위이므로, Virtual Thread가 대기 상태가 되면 JVM은 다른 Virtual Thread를 사용 가능한 Carrier에서 실행할 수 있다.

~~~text
Virtual Thread A 대기
        ↓
Carrier를 다른 Virtual Thread 실행에 사용 가능
        ↓
Virtual Thread B / C 진행
~~~

그래서 많은 동시 I/O 작업을 다룰 때 Virtual Thread를 많이 만들더라도 같은 수의 OS Thread를 만들 필요가 없다.

## 7. 기존 Thread Pool과 비교

일반 Fixed Thread Pool:

~~~text
Task 다수
   ↓
Platform Thread Pool
├─ Worker 1
├─ Worker 2
└─ Worker N
   ↓ 거의 1:1
OS Thread N개
~~~

Virtual Thread:

~~~text
Task 다수
   ↓
Virtual Thread 다수
   ↓
JVM Scheduler
   ↓
Carrier Platform Thread 여러 개
   ↓
OS Thread
~~~

따라서 차이는 **Application 수준의 동시 실행 단위 수와 실제 OS Thread 수가 1:1로 묶여 있느냐**에 있다.

## 8. 고전 Mapping Model과 연결

~~~text
고전 개념
ULT → Runtime이 관리
KLT → Kernel이 관리

Java Platform Thread
≈ One-to-One

Java Virtual Thread
≈ Many-to-Many 성격
  Virtual Thread 다수
      ↓
  Carrier Thread 여러 개
~~~

다만 Java Virtual Thread는 JVM의 구체적인 현대 구현이므로 고전적인 Many-to-Many 운영체제 모델과 완전히 동일한 구현으로 등치하지 않는다.

## 9. 기억·인출

~~~text
Platform Thread
→ OS Thread와 거의 1:1
→ One-to-One 성격

Virtual Thread
→ JVM이 관리
→ Carrier Platform Thread 위에서 실행

Carrier Thread
→ 기존 Platform Thread의 역할
→ OS Thread와 거의 1:1

Virtual Thread 다수
→ Carrier Thread 여러 개
→ Many-to-Many 성격

JVM
→ Virtual Thread ↔ Carrier 배치

Kernel
→ OS Thread / KLT ↔ CPU Scheduling
~~~

가장 중요한 문장:

> **Virtual Thread는 JVM이 관리하는 실행 단위이고, Carrier Thread는 그것을 실제로 실행시키는 Platform Thread다. 많은 Virtual Thread를 여러 Carrier Thread 위에 다중화하기 때문에 Many-to-Many 성격으로 이해할 수 있다.**
