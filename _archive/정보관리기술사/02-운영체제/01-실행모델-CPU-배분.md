# 실행 모델과 CPU 배분 개념지도

이 지도는 [운영체제 전체 개념지도](00-전체.md)에서 **Program이 Process·Thread라는 실행 단위가 되고, 여러 실행 주체가 한정된 CPU를 경쟁할 때 Scheduling과 Context Switch가 어떻게 연결되는지** 더 촘촘히 본다.

세부 계산보다 `실행 단위 → Kernel 경계 → CPU 경쟁 → Scheduling → 전환 비용`의 관계와 대표 비교축을 잡는 것이 목적이다.

## 1. 실행 단위와 CPU 배분의 전체 흐름

~~~text
Program 실행
    ↓
Process
├─ Address Space / Resource 소유
└─ Thread(s)
    └─ 실제 실행 흐름

여러 Runnable Process / Thread
        ↓
      CPU 경쟁
        ↓
     Scheduler
        ↓
Scheduling Policy
        ↓
  Context Switch
        ↓
     CPU 실행
~~~

`Process / Thread`는 실행 구조, `Scheduling`은 CPU 배분 정책, `Context Switch`는 실행 주체를 실제로 바꾸는 Mechanism이다.

## 2. Application과 Kernel의 경계를 구분한다

~~~text
Application
    ↓ System Call
Kernel
    ↓
CPU / Memory / File / Device
~~~

Application은 보호된 Hardware 자원을 직접 제어하지 않고 System Call을 통해 Kernel 기능을 요청한다.

이 지도에서는 **Kernel 경계가 실행과 자원관리의 기준선**이라는 위치만 잡는다. Kernel 내부에 어느 기능을 둘지는 별도 비교축으로 내려간다.

→ [Kernel 구조: Monolithic / Microkernel / Hybrid](커널-구조-모놀리틱-마이크로-하이브리드.md)  
Kernel 내부 서비스 범위가 성능·장애 격리·확장성에 어떤 Trade-off를 만드는지 본다.

## 3. Process와 Thread는 자원 소유와 실행 흐름으로 구분한다

~~~text
Process
├─ 독립 Address Space
├─ Resource 소유
└─ Thread(s)
    └─ 같은 Process Resource를 공유하며 실행
~~~

대표 비교축:

~~~text
Process ↔ Thread
├─ 자원 소유
├─ 주소 공간과 격리
├─ 통신 방식
└─ 생성 · 전환 비용
~~~

Thread가 같은 Process의 Memory를 공유하면 협업 비용은 줄일 수 있지만 동시 접근 문제가 생긴다.

~~~text
Thread Resource 공유
      ↓
동시 접근 가능
      ↓
Race Condition / Synchronization
~~~

→ [동시성과 자원 공유 개념지도](02-동시성-자원공유.md)  
공유가 왜 Race Condition을 만들고 Synchronization·Deadlock 문제로 이어지는지 본다.

Thread를 User / Kernel 수준에서 어떻게 매핑하는지는 별도 구현 축이다.

→ [Thread 실행 모델 · User / Kernel Mapping](스레드-실행모델-User-Kernel-Mapping.md)  
User Thread와 Kernel Thread의 매핑 방식이 Scheduling·병렬성·전환 비용에 어떤 차이를 만드는지 본다.

## 4. CPU가 부족하면 Scheduling이 필요하다

~~~text
Runnable Task 증가
      ↓
CPU는 한정됨
      ↓
누가 먼저 실행할 것인가?
      ↓
CPU Scheduling
~~~

Scheduling은 Algorithm 이름부터 고르는 문제가 아니라 **어떤 Service Goal을 우선할 것인가**의 선택이다.

~~~text
Workload / Service Goal
        ↓
평가 기준
├─ Throughput
├─ Response Time
├─ Waiting Time
├─ Fairness
└─ Deadline / Predictability
        ↓
Scheduling Policy 선택
~~~

하나의 정책이 모든 지표를 동시에 최적화하지는 않는다.

## 5. Scheduling의 대표 분류축과 Algorithm

~~~text
CPU Scheduling
├─ CPU 사용권 회수 가능?
│   ├─ Non-preemptive
│   └─ Preemptive
│
├─ 일반 Workload
│   ├─ FCFS          → 도착 순서
│   ├─ SJF / SRT     → 짧은 작업 우선
│   ├─ Round Robin   → Time Slice
│   ├─ Priority      → 우선순위
│   └─ MLQ / MLFQ    → Queue / Feedback
│
└─ Real-time Workload
    ├─ RM  → Fixed Priority
    └─ EDF → Dynamic Deadline Priority
~~~

대표 비교축:

- Preemptive ↔ Non-preemptive
- SJF ↔ SRT
- MLQ ↔ MLFQ
- RM ↔ EDF

이들은 발전 단계가 아니라 Workload와 목표에 따라 선택하는 정책이다.

## 6. 정책 선택에는 비용과 부작용이 따른다

~~~text
FCFS
└─ Convoy Effect

SJF / Priority
└─ Starvation

Round Robin
└─ Time Quantum 축소
   → Context Switch 증가

Priority + Shared Resource
└─ Priority Inversion
~~~

Priority Inversion은 Scheduling과 Synchronization이 만나는 경계다.

→ [동시성과 자원 공유 개념지도](02-동시성-자원공유.md)  
Priority Inheritance·Priority Ceiling 같은 완화 원리가 왜 필요한지 연결해서 본다.

## 7. Context Switch는 Scheduling의 실행 비용이다

~~~text
Task A 실행
   ↓
전환 결정
   ↓
A 상태 저장
   ↓
B 상태 복원
   ↓
Task B 실행
~~~

Context Switch가 잦아지면 반응성·공정성은 좋아질 수 있지만 Application의 실제 작업이 아닌 전환 비용이 증가한다.

~~~text
더 자주 전환
├─ Response / Fairness 개선 가능
└─ Context Switch Overhead 증가
~~~

따라서 Scheduling Policy와 Context Switch 비용은 함께 판단한다.

## 8. Scheduler 종류는 개입 시점으로 구분한다

~~~text
System에 Job 유입
      ↓
Long-term Scheduler
= 어떤 Job을 받아들일지
      ↓
Ready Set
      ↓
Short-term Scheduler
= 다음 CPU 실행 대상을 선택

실행 중단 · 복귀
      ↕
Medium-term Scheduler
= Memory 압박 등에 따라 Suspend / Resume
~~~

Long / Medium / Short-term Scheduler는 우열 관계가 아니라 **어느 시점의 작업 집합을 조절하는가**의 차이다.

## 9. 학습 경로

~~~text
1. Process / Thread
   → 실행 단위와 자원 소유 경계
        ↓
2. System Call / Kernel
   → Application과 보호된 자원의 경계
        ↓
3. Scheduling
   → CPU 경쟁을 어떤 정책으로 조절하는가
        ↓
4. Context Switch
   → 정책 결정이 실제 전환 비용으로 어떻게 나타나는가
        ↓
5. 공유 자원 문제가 생기면
   → 본문의 Thread 공유 / Priority Inversion 접점에서 동시성 지도로 연결
~~~

세부 Zoom-in:

- [Kernel 구조](커널-구조-모놀리틱-마이크로-하이브리드.md)  
  → Kernel 내부 서비스 배치의 Trade-off가 궁금할 때 본다.
- [Thread 실행 모델](스레드-실행모델-User-Kernel-Mapping.md)  
  → User / Kernel Thread 매핑과 실제 Scheduling 경계를 더 보고 싶을 때 본다.
Scheduling Algorithm의 반복 대기시간 계산과 RM·EDF 계산은 이 지도에서 펼치지 않는다.
