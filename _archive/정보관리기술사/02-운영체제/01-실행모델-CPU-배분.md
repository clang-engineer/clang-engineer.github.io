# 실행 모델과 CPU 배분 개념지도

이 문서는 [운영체제 전체 개념지도](00-전체.md)의 하위 지도다. **프로그램이 실행 주체가 된 뒤, 실행 상태에 따라 CPU를 기다리고 배정받고 반납하는 과정**을 연결한다. 개별 알고리즘의 계산법보다 각 개념이 필요한 이유와 관계를 이해하는 것이 목적이다.

## 전체 흐름: 실행 주체에서 CPU 배분까지

~~~text
Program
   ↓ 실행
Process ── 자원·주소 공간의 경계
   └─ Thread(s) ── 실행 흐름
          ↓
     실행 상태 변화
     ├─ Ready   ── CPU를 기다림
     ├─ Running ── CPU에서 실행
     └─ Waiting ── I/O·이벤트를 기다림
          ↓
  Ready / Runnable 작업들의 CPU 경쟁
          ↓
  Scheduler ── 정책에 따라 다음 작업 선택
          ↓
  Dispatcher ── CPU 제어권 전달
          ↓
  실행 / 필요 시 Context Switch
~~~

핵심 질문은 네 가지다. **무엇이 실행되는가 → 언제 실행 가능한가 → 누구에게 CPU를 줄 것인가 → 어떻게 실행 주체를 바꿀 것인가.**

## 1. 무엇이 실행되는가? — Process와 Thread

Program은 저장된 코드이며, 실행되면 Process가 된다. Process는 주소 공간과 자원 관리의 경계이고, Thread는 그 안에서 명령어를 수행하는 실행 흐름이다. 한 Process의 Thread들은 주소 공간과 여러 자원을 공유한다.

~~~text
Process (주소 공간·자원)
├─ Thread A (실행 흐름)
└─ Thread B (실행 흐름)
~~~

따라서 **Process ↔ Thread**는 단순한 크기 비교가 아니라 자원 소유·격리·공유·생성 및 전환 비용의 비교다. 실제 CPU 스케줄링 단위는 OS와 Thread 구현에 따라 달라질 수 있다.

Application은 보호된 자원에 접근할 때 System Call 등으로 Kernel의 서비스를 이용한다. 이 경계는 실행 권한의 문제이며, Kernel 진입 자체가 반드시 다른 Thread로의 전환을 뜻하지는 않는다.

더 깊이 볼 때:
- [Thread 실행 모델 · User / Kernel Mapping](스레드-실행모델-User-Kernel-Mapping.md) — User Thread와 Kernel Thread의 대응, 병렬성과 스케줄링 경계
- [Kernel 구조: Monolithic / Microkernel / Hybrid](커널-구조-모놀리틱-마이크로-하이브리드.md) — Kernel 내부에 서비스를 배치하는 방식의 Trade-off

## 2. 언제 실행 가능한가? — 상태 전이와 Ready Queue

생성된 Process가 계속 CPU를 사용하는 것은 아니다. 실행할 준비가 되었는지, 다른 사건을 기다리는지에 따라 상태가 달라진다.

~~~text
New ──Admit──→ Ready ──Dispatch──→ Running ──Exit──→ Terminated
                  ↑                  │
                  ├──── Preempt ─────┤
                  │                  │ I/O·Event 대기
                  └── Waiting ←──────┘
                     │
                     └─ I/O·Event 완료 → Ready
~~~

- **Ready**: CPU만 배정되면 실행할 수 있다.
- **Running**: CPU에서 실행 중이다.
- **Waiting(Blocked)**: I/O 또는 이벤트가 완료되어야 실행 가능해진다.

중요한 구분은 **Ready는 CPU를 기다리고, Waiting은 실행 가능 조건을 기다린다**는 것이다. Waiting에서 조건이 충족되면 보통 Ready로 돌아온다. 이 5상태 모델은 개념 모델이며 실제 OS의 상태 분류와는 다를 수 있다.

Ready 상태의 실행 주체가 여럿이면, 한정된 CPU를 누구에게 먼저 배분할지 결정해야 한다. 여기서 Scheduling이 등장한다.

## 3. 누구에게 CPU를 줄 것인가? — Scheduling

**Scheduler**는 실행 대상을 고르고, **Scheduling Policy**는 무엇을 우선할지 정한다. 정책의 출발점은 알고리즘 이름이 아니라 서비스 목표다.

| 판단 기준 | 핵심 질문 |
|---|---|
| Throughput | 일정 시간에 얼마나 많은 일을 처리하는가? |
| Waiting / Turnaround Time | 얼마나 기다리고, 완료까지 얼마나 걸리는가? |
| Response Time | 얼마나 빨리 반응하는가? |
| Fairness | 실행 기회가 공정한가? |
| Deadline / Predictability | 정해진 시간 요구를 만족하는가? |

대표적인 정책을 목적과 방식으로 묶으면 다음과 같다.

| 분류 | 대표 방식 | 기억할 특성 |
|---|---|---|
| 순서·작업 길이 | FCFS, SJF, SRTF | 도착 순서 또는 짧은 작업 우선 |
| 시간·우선순위 | RR, Priority | Time Quantum 또는 우선순위 |
| 다중 큐 | MLQ, MLFQ | 큐 분리 또는 피드백에 따른 이동 |
| 실시간 | RM, EDF | 고정 우선순위 또는 마감시간 기준 |

이 정책들은 발전 순서가 아니라 서로 다른 요구에 대한 선택지다. **Preemptive ↔ Non-preemptive**는 실행 중 CPU를 회수할 수 있는지를 나타내는 별도 분류축이다.

정책에는 Trade-off가 따른다. FCFS의 Convoy Effect, SJF·Priority의 Starvation, 짧은 RR Time Quantum의 전환 비용 증가가 대표적이다. 공유 자원과 우선순위가 만날 때 발생하는 Priority Inversion은 동시성·자원 공유 영역과 연결된다.

Scheduler는 개입 범위로도 구분한다. **Long-term**은 Job 수용, **Short-term**은 다음 CPU 실행 대상 선택, **Medium-term**은 Suspend/Resume 등 작업 집합 조절을 설명하는 전통적 분류다. 현대 OS마다 구현·적용 방식은 다르다.

## 4. 어떻게 실행 주체를 바꾸는가? — Dispatch와 Context Switch

Scheduler가 대상을 결정하면 Dispatcher가 실행 제어권을 넘긴다. 다른 실행 주체로 바뀌는 경우에는 기존 실행 문맥을 저장하고 새 문맥을 복원하는 **Context Switch**가 필요할 수 있다.

~~~text
Task A 실행
   ↓ 스케줄링 결정
A의 실행 문맥 저장
   ↓
B의 실행 문맥 복원
   ↓
Task B 실행
~~~

**Scheduling은 선택, Dispatch는 제어권 전달, Context Switch는 실행 문맥 교체**다. 또한 User ↔ Kernel **Mode Switch**는 권한 모드 전환이므로 Context Switch와 구별해야 한다.

잦은 선점은 반응성과 공정성을 개선할 수 있지만 전환 오버헤드도 늘린다. 따라서 CPU 배분 정책은 전환 비용과 함께 평가해야 한다.

## 다른 지도와의 경계

이 문서는 실행 단위·상태·CPU 배분·전환을 하나의 흐름으로 연결하는 **영역별 개념지도**다. 세부 스케줄링 계산, RM·EDF 스케줄 가능성 판정, Thread 매핑 구현은 여기서 전개하지 않는다.

- **동시성과 자원 공유 개념지도**: Thread 간 공유, Race Condition, Synchronization, Deadlock, Priority Inversion의 발생 구조와 완화
- **Thread 실행 모델 문서**: User / Kernel Thread 매핑과 실제 스케줄링 단위
- **Kernel 구조 문서**: Kernel 내부 서비스 배치와 성능·격리 Trade-off

전체 운영체제의 다른 관리 영역과의 관계는 [운영체제 전체 개념지도](00-전체.md)에서 다시 확인한다.
