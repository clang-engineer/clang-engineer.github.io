# I/O 처리 방식 — Programmed I/O · Interrupt-driven I/O · DMA · I/O Channel

> [I/O와 저장장치 개념지도](03-IO-저장장치.md) → CPU와 외부 장치의 협업
>
> **목적:** CPU가 장치를 어떻게 제어하고, 상태를 확인하고, 데이터를 전송하는지 하나의 I/O 흐름으로 이해한다.

## 주제 개념지도

```text
CPU와 외부 장치의 I/O
│
├─ 기본 구성 요소
│  └─ Device Controller
│     └─ Device Register → 제어·상태 정보
│
└─ I/O 처리 메커니즘
   ├─ 상태·완료 확인 → Polling / Interrupt
   ├─ 데이터 전송 책임 → Programmed I/O / DMA
   └─ 명령 처리 위임 → I/O Channel
```

장치 컨트롤러·레지스터는 **I/O의 기본 구성 요소**이고, 상태 통지·데이터 전송·명령 처리 위임은 **동작 메커니즘**이다. 예를 들어 장치 레지스터 등을 통해 요청을 전달하고 DMA로 데이터를 전송한 뒤 Interrupt로 완료를 알릴 수 있다. 따라서 이 기술들을 반드시 순차적으로 대체되는 하나의 발전 단계로 외우지 않는다.

## 1. CPU가 장치를 제어하는 출발점

CPU가 SSD에서 데이터를 읽으려면 SSD의 저장매체를 직접 조작하는 것이 아니라 **장치 컨트롤러(Device Controller)에 작업을 요청**한다. 장치 컨트롤러에는 제어 정보와 상태를 주고받는 **장치 레지스터(Device Register)** 등이 있다.

```text
CPU / Device Driver
      │ 장치 제어 정보 전달
      ▼
Device Controller
├─ Control Register → 제어·설정 정보
├─ Status Register  → 상태 확인
└─ 실제 장치 동작 제어
      ▼
Device
```

CPU Register는 CPU 내부의 연산·주소 등에 쓰이는 작은 저장공간이고, Device Register는 **장치 컨트롤러의 제어·상태 정보를 주고받는 레지스터**다. 레지스터가 명령을 실행하는 것이 아니라 **컨트롤러가 기록된 정보를 해석해 동작**한다.

### 보충: 장치 레지스터 주소 접근 방식

CPU가 장치 레지스터에 접근할 때는 대표적으로 **MMIO(메모리 주소 공간 공유)**와 **Isolated I/O(별도 I/O 주소 공간 사용)**가 있다. 이는 I/O 처리 방식의 중심 분류가 아니라 장치 제어를 이해하기 위한 보충 개념이다.

| 구분 | MMIO (Memory-mapped I/O) | Isolated I/O |
|---|---|---|
| 주소 공간 | Memory 주소 공간에 장치 Register 매핑 | 별도 I/O 주소 공간 |
| CPU 접근 | 일반 Memory 읽기·쓰기 명령 | 전용 I/O 명령 (예: x86 IN/OUT) |
| 오해 방지 | 주소가 Memory 공간에 있어도 Register가 RAM 안에 있다는 뜻은 아님 | 별도 주소 공간을 사용해도 같은 장치 컨트롤러를 제어함 |

```text
MMIO: CPU → Memory 주소 → Device Register
Isolated I/O: CPU → I/O Port 주소 → Device Register
```

장치 주소의 발견·할당에는 하드웨어와 OS·Driver가 관여한다. 여기서는 **어떤 주소 공간과 접근 명령을 사용하는지**까지만 이해한다.

### SSD 읽기 요청으로 연결하기

```text
Application → OS / Device Driver
                    │
                    │ MMIO 등으로 장치 설정·요청
                    ▼
              SSD Controller
                    │
                    ├─ 저장매체 읽기
                    ├─ DMA로 RAM에 데이터 전송
                    └─ Interrupt 등으로 완료 통지
                                  ↓
                            CPU 후속 처리
```

이것은 **접근·제어·전송·완료 통지의 역할**을 보여주는 단순화된 예시다. 실제 NVMe SSD는 RAM의 명령 큐와 장치 레지스터를 함께 사용하며, DMA 완료를 Polling으로 확인하는 구성도 가능하다.

---

## 2. 왜 I/O 처리를 CPU에서 분리하는가

초기 구조처럼 CPU가 I/O 장치의 상태를 계속 확인하고 직접 데이터까지 옮기면 CPU가 본래 계산 작업을 하지 못한다.

```text
CPU
↓
Device 상태 확인
↓
데이터 전송
↓
다시 상태 확인
↓
데이터 전송
...
```

핵심 문제는:

> **느린 I/O 장치를 기다리고 데이터를 옮기는 동안 CPU가 묶인다.**

그래서 I/O 처리 방식은 CPU의 개입을 점점 줄이는 방향으로 발전했다.

---

## 3. Programmed I/O

CPU가 장치 상태를 직접 확인하고 I/O를 수행한다.

```text
CPU
↓
Device Status 확인
↓
Ready?
├─ No → 다시 확인
└─ Yes
    ↓
Data Register 읽기/쓰기
```

대표적으로 Polling을 사용한다.

### 특징

- 구현이 단순하다.
- CPU가 장치 상태를 반복 확인한다.
- 느린 장치를 기다리는 동안 CPU 시간이 낭비될 수 있다.

```text
CPU가 계산
X

CPU가 I/O 상태 확인
O
```

---

## 4. Interrupt-driven I/O

CPU가 장치를 계속 확인하지 않고, 장치가 작업 가능한 상태나 완료를 Interrupt로 알려준다.

```text
CPU
→ I/O 시작 요청
→ 다른 작업 수행

Device
→ 작업 진행
→ Interrupt 발생

CPU
→ Interrupt Handler 실행
→ 후속 처리
```

### Programmed I/O와 차이

```text
Programmed I/O
CPU: "끝났나?"
CPU: "끝났나?"
CPU: "끝났나?"

Interrupt-driven I/O
CPU: "시작해"
Device: "끝났어" → Interrupt
```

CPU가 Busy Polling을 하지 않아도 된다는 장점이 있다.

하지만 실제 데이터 전송에 CPU가 반복적으로 개입해야 하는 구조라면 대용량 데이터 이동 부담은 여전히 남는다.

---

## 5. DMA — Direct Memory Access

DMA는 **Device와 Memory 사이의 데이터 전송을 CPU 대신 수행하는 메커니즘**이다.

CPU는 전송에 필요한 정보를 설정하고 작업을 시작시킨 뒤 다른 일을 할 수 있다. Driver가 Source / Destination, Transfer Size, Direction을 설정하며, **제어·완료 통지와 실제 데이터 전송은 서로 다른 경로**다.

```text
[제어·완료 통지: -->]
CPU --(1) 주소·크기·방향 설정 / 시작--> DMA Engine
CPU <--(3) 완료 Interrupt------------ DMA Engine

[실제 데이터 전송: ==>]
Device ==(2) 데이터 전송==> RAM Buffer
          위 DMA Engine이 수행
```

번호는 시간 순서다. (1) 이후 CPU는 다른 작업을 할 수 있고, (2)의 Bulk Data는 CPU가 바이트/워드마다 읽어 RAM에 다시 쓰는 경로를 거치지 않는다. (3)에서 CPU가 완료 상태를 확인하고 후속 처리를 한다.

여기서 DMA Engine은 별도 DMA Controller 또는 Device 내부의 DMA 기능을 뜻한다. 그림은 **Device → Memory 읽기와 Interrupt 완료 통지**를 선택한 예시다. 쓰기는 데이터 방향이 반대이며, 완료 확인에 Polling을 사용하는 구조도 가능하다. DMA를 사용한다고 CPU의 설정·동기화·완료 처리까지 없어지는 것은 아니다.

### 핵심

```text
CPU
= 전송 설정 / 시작 / 완료 처리

DMA
= 실제 Bulk Data Transfer 담당
```

따라서 CPU가 바이트/워드마다 직접 데이터를 옮길 필요가 줄어든다.

### DMA가 해결하는 문제

```text
Interrupt-driven I/O
= "언제 처리할지" CPU Polling 감소

DMA
= "데이터를 누가 옮길지" CPU 개입 감소
```

즉 Interrupt와 DMA는 경쟁 개념이 아니라 같이 사용될 수 있다.

```text
CPU가 DMA 시작
↓
DMA가 전송
↓
DMA 완료
↓
Interrupt로 CPU에 통지
```

---

## 6. I/O Channel — I/O 처리 자체를 더 독립적으로 맡긴다

I/O Channel은 DMA보다 더 높은 수준의 I/O 제어를 독립적으로 수행하는 구조로 이해할 수 있다.

```text
DMA
= 주로 데이터 전송 자체를 담당

I/O Channel
= I/O 명령 흐름까지 더 독립적으로 처리
```

개념적으로:

```text
CPU
↓
"이 I/O 작업 수행"
↓
I/O Channel
├─ Device 선택
├─ I/O 명령 수행
├─ 전송 제어
└─ 상태 관리
↓
Device
↓
완료 통지
```

즉 I/O Channel은 일종의 **I/O 전용 Processor에 가까운 역할**을 한다.

---

## 7. 네 방식 비교

| 구분 | Programmed I/O | Interrupt-driven I/O | DMA | I/O Channel |
|---|---|---|---|---|
| 장치 상태 확인 | CPU | Interrupt 통지 | Controller 중심 | Channel 중심 |
| 실제 데이터 전송 | CPU 개입 큼 | CPU 개입 가능 | DMA가 주도 | Channel / Controller가 주도 |
| CPU 부담 | 큼 | 감소 | 더 감소 | 가장 적게 만들 수 있음 |
| 핵심 목적 | 단순 제어 | Polling 제거 | Bulk Transfer 위임 | I/O 처리 자체의 독립성 확대 |
| 대표 기억 | CPU가 계속 확인 | 끝나면 Interrupt | 데이터는 DMA가 옮김 | I/O 명령도 전담 |

흐름으로 압축하면:

```text
Programmed I/O
CPU가 상태 확인 + 전송

        ↓

Interrupt-driven I/O
상태 확인 부담 감소

        ↓

DMA
데이터 전송 부담 감소

        ↓

I/O Channel
I/O 명령 처리 자체의 독립성 확대
```

이 흐름은 개념적 발전 방향이지, 모든 현대 시스템이 반드시 네 단계를 그대로 계층적으로 구현한다는 뜻은 아니다.

---

## 8. 하드웨어 I/O 처리와 소프트웨어 I/O 모델은 다르다

DMA와 I/O Channel은 **하드웨어에서 제어·전송 책임을 어떻게 분담하는가**의 문제다. 반면 Blocking / Non-blocking, Readiness / Completion, I/O Multiplexing은 **OS·Application이 I/O를 어떻게 요청하고 결과를 관찰하는가**의 문제다.

```text
Software I/O Model
├─ Blocking / Non-blocking → 호출이 기다리는가?
└─ Readiness / Completion → 준비 상태인가, 요청이 완료됐는가?
             │
             ▼
OS / Driver / I/O Subsystem
             │
             ▼
Hardware I/O Mechanism
├─ Programmed / Interrupt-driven I/O
├─ DMA
└─ I/O Channel
```

예를 들어 비동기 Disk Read는 다음처럼 이어질 수 있다.

```text
Application → OS에 비동기 읽기 요청
            → Driver / Device Controller
            → DMA로 Device → Memory 전송
            → Interrupt 등으로 완료 확인
            → Kernel 후속 처리
            → Application에 Completion 통지
```

**DMA는 데이터 이동 메커니즘**, **Completion I/O는 요청 완료를 소프트웨어에 알리는 모델**이다. 같은 I/O 과정에서 함께 사용되지만 서로 같은 계층의 개념이 아니다.

---

## 9. 이해 복원

1. CPU는 장치 컨트롤러에 어떻게 명령을 전달하며, CPU Register와 Device Register는 무엇이 다른가?
2. Programmed I/O와 Interrupt-driven I/O는 CPU가 장치 상태를 확인하는 방식이 어떻게 다른가?
3. DMA는 데이터 이동에서 CPU의 어떤 역할을 줄이는가?
4. I/O Channel은 DMA보다 어떤 처리 책임을 더 맡는가?
5. SSD 읽기 요청에서 장치 제어·DMA·Interrupt는 각각 어떤 역할인가?
6. DMA와 Completion I/O는 왜 서로 다른 계층의 개념인가?

**하드웨어 I/O 방식은 CPU의 장치 제어·데이터 전송 부담을 어떻게 나누는지**에 관한 것이다. 소프트웨어의 Readiness/Completion 모델과 구분한다.

## 참고 자료

- [Linux Kernel — Dynamic DMA mapping Guide](https://docs.kernel.org/core-api/dma-api-howto.html): Driver가 Buffer를 준비하고 Device의 DMA 전송을 설정하는 역할을 확인한다.
