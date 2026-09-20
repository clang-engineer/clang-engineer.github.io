# I/O 처리 방식 — Programmed I/O · Interrupt-driven I/O · DMA · I/O Channel

> 성격: 컴퓨터구조 세부학습. CPU가 주변장치 I/O를 얼마나 직접 담당하는지, 그리고 실제 데이터 전송 책임이 어떻게 분리되는지 이해하기 위한 문서다.
>
> 학습 흐름: **CPU 직접 처리 → Interrupt로 완료 통지 → DMA로 데이터 전송 위임 → I/O Channel로 I/O 명령 처리까지 확장**

## 이 문서의 위치

```text
Application / OS
        ↓
Device Driver
        ↓
I/O 처리 구조
├─ Programmed I/O
├─ Interrupt-driven I/O
├─ DMA
└─ I/O Channel
        ↓
Device Controller / Bus / Device
```

이 문서의 owner는 **CPU · Memory · I/O Device 사이에서 실제 I/O 제어와 데이터 전송 책임을 어떻게 나누는가**이다.

운영체제의 Blocking / Non-blocking / I/O Multiplexing / Completion I/O는 **소프트웨어 I/O 실행 모델**이고, 이 문서의 DMA / I/O Channel은 **하드웨어 I/O 처리 구조**다. 둘은 실제 I/O 흐름에서 연결되지만 같은 개념이 아니다.

---

## 1. 왜 I/O 처리를 CPU에서 분리하는가

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

## 2. Programmed I/O

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

## 3. Interrupt-driven I/O

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

## 4. DMA — Direct Memory Access

DMA는 **Device와 Memory 사이의 데이터 전송을 CPU 대신 수행하는 메커니즘**이다.

CPU는 전송에 필요한 정보를 설정하고 작업을 시작시킨 뒤 다른 일을 할 수 있다.

```text
CPU
↓
DMA 설정
- Source / Destination
- Transfer Size
- Direction
↓
DMA 시작

DMA Controller / Device
↓
Device ↔ Memory 데이터 전송

완료
↓
Interrupt
↓
CPU
```

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

## 5. I/O Channel — I/O 처리 자체를 더 독립적으로 맡긴다

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

## 6. 네 방식 비교

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

## 7. DMA와 Completion I/O는 다르다

둘은 자주 같은 실제 I/O 흐름 안에 등장하지만 계층이 다르다.

```text
Completion I/O
= OS / Application 관점
= "맡긴 I/O 작업이 끝났는가?"

DMA
= Hardware 관점
= "Device ↔ Memory 데이터를 누가 옮기는가?"
```

예를 들어 비동기 Disk Read라면:

```text
Application
↓
OS에 Async Read 요청
↓
Driver / I/O Subsystem
↓
Device Controller
↓
DMA로 Device → Memory 전송
↓
전송 완료 Interrupt / Completion
↓
Kernel 완료 처리
↓
Application에 Completion 통지
```

즉:

> **DMA는 데이터 이동 메커니즘이고, Completion I/O는 I/O 완료를 소프트웨어에 노출하는 실행 모델이다.**

---

## 8. Readiness / Completion과도 구분한다

운영체제에서 다루는:

```text
Readiness
= "지금 I/O를 시도할 조건이 됨"

Completion
= "요청한 I/O 작업이 끝남"
```

은 소프트웨어에서 I/O 상태를 어떻게 다룰지에 대한 모델이다.

반면:

```text
Programmed I/O / Interrupt / DMA / I/O Channel
= Hardware가 실제 I/O를 어떻게 수행하고
  CPU 개입을 얼마나 줄일 것인가
```

의 문제다.

따라서 두 축을 섞지 않는다.

```text
Software I/O Model
Blocking / Non-blocking
Readiness / Completion
I/O Multiplexing

        ↓ 실제 장치 처리

Hardware I/O Mechanism
Programmed I/O
Interrupt
DMA
I/O Channel
```

---

## 9. 한 번에 다시 떠올리기

```text
Programmed I/O
= CPU가 직접 상태 확인 + I/O 처리

Interrupt-driven I/O
= 장치가 CPU에 Event 통지

DMA
= Device ↔ Memory 데이터 전송을 CPU 대신 수행

I/O Channel
= I/O 명령 처리까지 더 독립적으로 수행

DMA vs Completion I/O
DMA        = 데이터 이동 방식
Completion = 완료 통지 / 실행 모델
```

핵심 문장:

> **I/O 처리 구조의 발전 방향은 CPU가 장치 상태 확인과 데이터 전송에 직접 개입하는 범위를 줄이고, I/O 전용 하드웨어가 더 많은 책임을 맡게 하는 것이다.**
