# I/O 처리 방식

> [I/O와 저장장치 개념지도](03-IO-저장장치.md) → CPU와 외부 장치의 협업

CPU가 외부 장치를 사용할 때 **기본 구성 → 장치 제어 → I/O 처리 책임 분담 → 실제 SSD 읽기 → 소프트웨어 모델과의 경계**로 이해를 넓힌다. 장치에 요청을 전달하고, 상태를 확인하고, 데이터를 옮기고, 완료를 처리하는 책임을 어떻게 나누는지가 중심 질문이다.

## 1. 전체 구조 — 기본 구성에서 실제 조합까지

```text
CPU / OS · Device Driver
          ↕ 장치 제어
Device Controller
  └─ Device Register (제어·상태 정보)
          ↕
External Device
          ↕
        Memory
```

```text
I/O 처리 — CPU의 책임을 어떻게 분담하는가?
│
├─ 장치 접근 → MMIO / Isolated I/O
├─ 상태·완료 확인 → Polling / Interrupt
│
└─ 작업 수행·위임
   ├─ CPU 직접 데이터 전송 → Programmed I/O
   ├─ 데이터 전송 위임 → DMA
   └─ I/O 작업 제어까지 위임 → I/O Channel
      ├─ I/O 명령 실행
      ├─ 데이터 전송 제어
      └─ 상태·오류 처리
```

장치 접근·상태 확인·작업 수행은 **서로 다른 관점**이다. 특히 DMA는 데이터 전송 위임에, I/O Channel은 명령 실행·전송 제어·상태 처리까지 포함하는 더 넓은 I/O 작업 위임에 초점을 둔다. I/O Channel이 반드시 DMA 위에 구현된다는 뜻은 아니다. 이 방식들은 **동일한 수준의 상호 배타적인 기술이 아니다.** 실제 시스템에서는 장치 레지스터에 요청을 전달하고 DMA로 데이터를 옮긴 뒤 Interrupt 또는 Polling으로 완료를 확인하는 식으로 조합한다.

## 2. 장치 제어의 출발점 — Controller와 Register

CPU는 SSD 등의 저장매체를 직접 조작하기보다 **Device Controller에 작업을 요청**한다.

```text
CPU / Device Driver
      │ 장치 제어 정보 전달
      ▼
Device Controller
├─ Control Register → 제어·설정 정보
├─ Status Register  → 상태 확인
└─ 제어 로직 → 실제 장치 동작
```

CPU Register는 CPU 내부의 연산·주소 등에 쓰이는 저장공간이고, Device Register는 컨트롤러가 제공하는 제어·상태 정보용 레지스터다. **레지스터 자체가 명령을 실행하는 것이 아니라 컨트롤러가 요청을 해석해 동작**한다.

### 장치 레지스터 접근 — MMIO와 Isolated I/O

| 구분 | MMIO | Isolated I/O |
|---|---|---|
| 주소 공간 | Memory 주소 공간에 Register 매핑 | 별도 I/O 주소 공간 |
| 접근 명령 | 일반 Memory 읽기·쓰기 명령 | 전용 I/O 명령(예: x86 IN/OUT) |
| 핵심 경계 | RAM에 Register가 있다는 뜻은 아님 | 같은 Controller를 다른 주소 체계로 접근 |

이는 **장치 레지스터에 접근하는 주소 체계**의 차이이지, Polling·DMA 같은 상태 확인·데이터 전송 방식의 차이가 아니다.

## 3. 전통적인 I/O 처리 방식 — CPU의 부담을 어디까지 위임하는가?

교재에서는 흔히 **Programmed I/O / Interrupt-driven I/O / DMA / I/O Channel**을 비교한다. 이 비교는 CPU의 개입을 줄이고 I/O 책임을 위임하는 방향을 설명하기에 유용하다. 하지만 실제로는 **상태 통지·데이터 전송·명령 처리라는 서로 다른 역할**이므로 네 기술을 배타적인 단계로 이해하지 않는다.

### Programmed I/O — CPU가 직접 데이터를 전송

```text
CPU → Device 상태 확인(Polling 예)
       ├─ Ready 아님 → 다시 확인
       └─ Ready → Data Register 읽기/쓰기
                    ↓
               CPU가 데이터 이동
```

Programmed I/O는 CPU가 장치와 데이터 전송을 직접 수행하는 방식이다. Polling을 함께 사용하는 예가 흔하지만, **Polling은 상태를 반복 확인하는 방법**이고 Programmed I/O는 **CPU가 데이터 전송을 담당하는 방법**이다. 둘은 같은 뜻이 아니다.

### Interrupt-driven I/O — 장치가 상태·완료를 통지

```text
CPU → I/O 요청 후 다른 작업
Device → 준비·완료 시 Interrupt
CPU → Interrupt Handler에서 후속 처리
```

```text
Polling   → CPU: "끝났나?" 반복 확인
Interrupt → Device: "처리할 사건 발생" 통지
```

이것은 **Polling과 Interrupt의 상태 확인 방식 비교**다. Interrupt-driven I/O에서도 데이터 이동을 CPU가 수행할 수 있으므로, Interrupt가 DMA를 자동으로 포함하는 것은 아니다.

### DMA — Bulk Data 전송을 CPU 대신 수행

DMA는 Device와 Memory 사이의 데이터 이동을 CPU의 반복적인 복사 작업 없이 수행하도록 한다. CPU·Driver는 전송 설정과 시작·완료 처리를 담당할 수 있다.

```text
[제어 경로]
CPU / Driver --(1) 전송 설정·시작--> DMA Engine

[데이터 경로]
Device =====(2) DMA 전송=====> RAM Buffer

[완료 확인]
DMA 전송 완료
├─ Interrupt로 통지
└─ CPU가 Polling으로 확인
```

DMA Engine은 별도 Controller 또는 장치 내부 기능일 수 있다. (2)의 Bulk Data는 CPU가 바이트마다 읽고 다시 쓰는 방식으로 이동하지 않는다. DMA를 사용해도 CPU의 설정·동기화·후속 처리까지 없어지는 것은 아니다.

**핵심 관계:** Interrupt는 완료를 알리는 방법, DMA는 데이터를 옮기는 방법이다. DMA + Interrupt도, DMA + Polling도 가능하다.

### I/O Channel — 명령 처리까지 위임

```text
CPU → I/O 작업 요청
       ↓
I/O Channel
├─ Device 선택
├─ I/O 명령 수행
├─ 전송 제어
└─ 상태 관리
       ↓
Device → 완료 통지
```

I/O Channel은 전송을 넘어 **I/O 명령의 실행·상태·오류 관리까지 독립적으로 맡는 채널 구조**로, 전통적인 메인프레임 등에서 중요한 개념이다. 일반적인 CPU처럼 임의의 응용 프로그램 산술 연산을 수행한다는 의미가 아니라, 장치 선택·명령 해석·전송 순서·상태 및 오류 대응 등 **I/O 전용 처리를 수행한다**는 의미다. 일반적인 PC에서 DMA 다음에 반드시 별도의 I/O Channel이 있는 것은 아니다. Channel도 완료를 Interrupt 등으로 알릴 수 있다.

## 4. 네 방식의 비교와 실제 조합

| 전통적 방식 | 중심 책임 | CPU가 줄이는 부담 | 함께 사용 가능한 방식 |
|---|---|---|---|
| Programmed I/O | CPU 직접 데이터 전송 | 위임 없음 | Polling 등 |
| Interrupt-driven I/O | 상태·완료 통지 | 반복 상태 확인 | CPU 직접 전송 또는 DMA |
| DMA | 데이터 전송 위임 | 반복 데이터 이동 | Polling / Interrupt |
| I/O Channel | I/O 명령 처리 위임 | 명령·전송·상태 관리 | Interrupt 등 |

이 표는 **교재식 비교**다. 실제 메커니즘을 같은 축의 대안으로만 보지 않는다. 특히 Interrupt-driven I/O는 DMA·I/O Channel의 상위 분류가 아니고, DMA와 I/O Channel도 Interrupt를 필수 전제로 하지 않는다.

## 5. 실제 SSD 읽기 — 역할이 어떻게 결합되는가?

```text
Application → OS / Driver
                  │ 요청·설정
                  ▼
             SSD Controller
                  │ 저장매체 읽기
                  ▼
            DMA → RAM Buffer
                  │
                  ├─ Interrupt 완료 통지
                  └─ Polling으로 완료 확인
                  ▼
              CPU 후속 처리
```

이는 역할 관계를 보여주는 단순화된 예시다. 실제 NVMe SSD는 RAM의 명령 큐와 장치 레지스터를 함께 사용한다. **장치 접근, 데이터 전송, 완료 확인은 한 요청 안에서 조합**된다.

## 6. 소프트웨어 I/O 모델과의 경계

```text
Application / OS I/O 모델
├─ Blocking / Non-blocking → 호출의 대기 여부
└─ Readiness / Completion → 준비·완료 관찰 방식
           ↓
OS / Driver
           ↓
Hardware I/O 메커니즘
├─ 장치 접근 → MMIO / Isolated I/O
├─ 상태 통지 → Polling / Interrupt
└─ 전송·위임 → Programmed I/O / DMA / I/O Channel
```

예를 들어 Application의 비동기 읽기 요청이 장치 DMA로 처리되고, Kernel이 완료를 확인한 뒤 Application에 Completion을 전달할 수 있다. **DMA는 하드웨어 데이터 전송 메커니즘이고 Completion I/O는 소프트웨어가 요청 완료를 관찰하는 모델**이다.

## 7. 이해 복원

1. Controller와 Device Register는 각각 어떤 역할인가?
2. MMIO·Isolated I/O는 Polling·Interrupt와 무엇이 다른가?
3. Programmed I/O와 Polling을 같은 개념으로 볼 수 없는 이유는 무엇인가?
4. DMA 완료를 Interrupt가 아닌 Polling으로 확인할 수 있는가?
5. I/O Channel은 DMA보다 어떤 처리 책임을 더 맡는가?
6. 실제 SSD 읽기에서 장치 접근·DMA·완료 통지가 어떻게 조합되는가?
7. Hardware DMA와 Software Completion I/O는 왜 다른 계층의 개념인가?

**복원 단서:** 접근 → MMIO / 상태 → Polling·Interrupt / 전송 → Programmed I/O·DMA / 명령 위임 → I/O Channel.

## 참고 자료

- [Linux Kernel — Dynamic DMA mapping Guide](https://docs.kernel.org/core-api/dma-api-howto.html): Driver의 DMA Buffer 준비와 전송 설정.
