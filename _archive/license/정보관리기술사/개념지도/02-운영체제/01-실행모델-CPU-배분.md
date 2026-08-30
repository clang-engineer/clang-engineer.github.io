# 실행 모델과 CPU 배분 개념지도

이 지도는 [[00-전체|운영체제 전체 개념지도]]에서 **프로그램이 실행 단위가 되고, 여러 실행 주체가 한정된 CPU를 나누어 쓰는 관계**를 함께 본다.

세부 Algorithm 계산보다 `실행 단위 → Kernel 경계 → CPU 경쟁 → Scheduling → 전환 비용`의 위치와 비교축을 잡는 것이 목적이다.

## 1. 먼저 큰 흐름을 잡는다

```text
Program을 실행하고 싶음
        ↓
Process
= 자원과 주소 공간을 소유하는 실행 인스턴스
        ↓
Process 안에서 실행 흐름이 필요
        ↓
Thread
= Process 자원을 공유하는 실행 흐름
        ↓
여러 Process / Thread가 동시에 실행 가능 상태
        ↓
CPU는 한정됨
        ↓
Scheduling
= 누가 언제 CPU를 사용할지 결정
        ↓
실행 주체를 바꿔야 함
        ↓
Context Switch
= 상태 저장·복원 + Overhead
```

Process·Thread·Scheduling·Context Switch는 같은 개념이 아니다. 각각 `실행 단위`, `CPU 배분 정책`, `실행 주체 전환 Mechanism`이라는 위치가 다르다.

## 2. Application과 Hardware 사이에는 Kernel 경계가 있다

```text
Application
  ↓ 서비스 요청
System Call
  ↓
Kernel
  ↓
CPU / Memory / Device
```

Application은 보호된 Hardware 자원을 직접 제어하지 않고 System Call을 통해 Kernel 서비스를 요청한다.

Kernel 구조는 이 호출 경계와 자원관리 기능을 어떻게 배치하는가의 비교축이다.

```text
Monolithic Kernel
↔
Microkernel

비교
├─ 성능
├─ 장애 격리
└─ 확장성
```

특정 Kernel의 구현 상세보다 **어디까지 Kernel 내부에 두는가에 따른 Trade-off**를 기억한다.

## 3. Process와 Thread의 경계를 먼저 잡는다

```text
Program
  ↓ 실행
Process
├─ 독립 주소 공간
├─ 자원 소유
└─ 하나 이상의 Thread
       ↓
     Thread
     └─ 같은 Process의 자원을 공유하며 실행
```

복습할 비교축은 다음이다.

```text
Process ↔ Thread
├─ 자원 소유
├─ 주소 공간과 격리
├─ 통신 방식
└─ 생성·전환 비용
```

멀티스레드는 자원 공유로 협업 비용을 줄일 수 있지만, 공유 때문에 Race Condition과 Synchronization 문제가 생긴다.

```text
Thread가 자원을 공유
  ↓
동시 접근 가능
  ↓
Race Condition / Critical Section
  ↓
[[02-동시성-자원공유|동시성과 자원 공유]]로 연결
```

## 4. 실행 가능한 Task가 CPU보다 많으면 Scheduling이 필요하다

```text
Ready Task 증가
        ↓
CPU는 한정됨
        ↓
어떤 Task를 먼저 실행할까?
        ↓
CPU Scheduling
```

Scheduling은 Algorithm 이름부터 고르는 문제가 아니다. 먼저 어떤 품질을 중요하게 보는지 정한다.

```text
Workload / Service Goal
        ↓
평가 기준
├─ Throughput
├─ Response Time
├─ Waiting Time
├─ Fairness
└─ Deadline / Predictability
        ↓
정책 선택
```

하나의 정책이 모든 지표를 동시에 최적화하지는 않는다.

## 5. 선점 여부는 Scheduling의 중요한 경계다

```text
Scheduling
├─ Non-preemptive
│   └─ 실행 중인 Task가 종료·대기·자발적 반납할 때까지 CPU 유지
│
└─ Preemptive
    └─ OS가 실행 중인 Task의 CPU 사용권을 회수 가능
```

```text
Preemptive
├─ 응답성 향상에 유리
└─ Context Switch·동기화 부담 증가 가능

Non-preemptive
├─ 실행 흐름이 단순하고 예측하기 쉬움
└─ 긴 Task가 CPU를 잡으면 다른 Task가 오래 기다릴 수 있음
```

선점·비선점은 특정 Algorithm의 발전 단계가 아니라 **CPU 사용권을 회수할 수 있는가**라는 분류축이다.

## 6. 대표 Scheduling Algorithm은 목표에 따른 선택지다

```text
CPU Scheduling
│
├─ 도착 순서를 단순하게 따름
│   └─ FCFS
│
├─ 짧은 작업을 우선
│   ├─ SJF
│   └─ SRT
│
├─ 일정 시간씩 공정하게 나눔
│   └─ Round Robin
│
├─ 우선순위에 따라 배분
│   └─ Priority Scheduling
│
├─ 여러 Queue와 Feedback으로 Workload 특성 반영
│   ├─ MLQ
│   └─ MLFQ
│
└─ Deadline이 중요한 Real-time Workload
    ├─ RM
    └─ EDF
```

`FCFS → SJF → Round Robin → MLFQ → RM → EDF`를 발전 순서로 외우지 않는다. 서로 해결하려는 목표와 적용 조건이 다르다.

## 7. 정책마다 Trade-off와 부작용이 있다

```text
FCFS
└─ 긴 작업 뒤에 짧은 작업이 기다림 → Convoy Effect

SJF / Priority
└─ 특정 Task가 계속 밀릴 수 있음 → Starvation

Round Robin
└─ Time Quantum이 너무 작음 → Context Switch 증가

Priority Scheduling + 공유 자원
└─ 높은 Priority Task가 낮은 Priority Task를 기다림
   → Priority Inversion
```

Priority Inversion은 Scheduling만의 문제가 아니라 공유 자원과 Synchronization이 만나는 지점이다.

```text
Priority Inversion
  ↓
Priority Inheritance / Priority Ceiling 등으로 완화
  ↓
[[02-동시성-자원공유|동시성과 자원 공유]]와 연결
```

## 8. Context Switch는 Scheduling 결정의 실행 비용이다

Scheduling이 다음 Task를 선택하면 실제 실행 주체를 바꾸기 위해 상태 전환이 필요하다.

```text
Task A 실행
  ↓
전환 결정
  ↓
A의 실행 상태 저장
  ↓
B의 실행 상태 복원
  ↓
Task B 실행
```

Context Switch는 CPU를 공정하고 반응성 있게 공유하게 하지만 그 시간에는 Application의 실제 작업을 처리하지 못하므로 Overhead다.

```text
더 자주 전환
├─ 응답성·공정성에 유리할 수 있음
└─ 전환 Overhead 증가
```

따라서 Scheduling 정책과 Context Switch 비용은 함께 본다.

## 9. Scheduler의 종류는 실행 흐름에서 위치를 잡는다

```text
System에 작업 유입
  ↓
Long-term Scheduler
= 어떤 작업을 시스템에 받아들일지
  ↓
Ready 상태
  ↓
Short-term Scheduler
= 다음 CPU 실행 대상을 선택

Memory 압박 등으로 실행을 잠시 중단·복귀
  ↕
Medium-term Scheduler
```

세 Scheduler는 Algorithm의 우열 비교가 아니라 **어느 시점의 작업 집합을 조절하는가**로 구분한다.

## 10. Real-time은 별도의 요구조건 축이다

일반 Scheduling에서는 평균 처리량이나 응답시간이 중요할 수 있지만 Real-time에서는 Deadline과 결정성이 핵심 요구가 된다.

```text
Real-time Workload
  ↓
Deadline / Predictability 중요
  ↓
Real-time Scheduling
├─ RM
│   └─ 주기가 짧은 Task에 높은 고정 Priority
└─ EDF
    └─ Deadline이 가까운 Task를 동적으로 우선
```

RM과 EDF의 계산 상세는 이 지도에서 펼치지 않는다. `고정 우선순위 ↔ 동적 Deadline 우선순위`라는 경계를 기억한다.

## 11. 복습용 핵심 좌표

```text
실행 경계
Application → System Call → Kernel → Hardware

실행 단위
Program → Process → Thread
                 ↓ 공유
            동시성 문제

CPU 배분
Ready Task
  ↓
Scheduling
├─ Preemptive ↔ Non-preemptive
├─ FCFS
├─ SJF / SRT
├─ Round Robin
├─ Priority
├─ MLQ / MLFQ
└─ RM / EDF
  ↓
Context Switch

주요 비용·문제
├─ Convoy Effect
├─ Starvation
├─ Context Switch Overhead
└─ Priority Inversion
```

이 Node를 보고 각 정책의 목적·Trade-off와 Process/Thread의 차이를 떠올릴 수 있으면 된다. 반복적인 대기시간 계산, 복잡한 Ready Queue 손계산, RM·EDF 계산식은 세부학습으로 내려간다.
