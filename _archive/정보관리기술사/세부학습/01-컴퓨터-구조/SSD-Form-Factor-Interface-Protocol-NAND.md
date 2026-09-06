# SSD — Form Factor, Interface, Protocol, NAND를 분리해서 이해하기

> 연결: [[../../개념지도/01-컴퓨터-구조/03-IO-저장장치|I/O와 저장장치 개념지도]]

SSD 제품명에는 `M.2`, `PCIe`, `NVMe`, `TLC`처럼 서로 다른 분류축의 용어가 한 줄에 섞여 나온다. 이들을 모두 같은 종류 구분으로 보면 관계가 꼬인다.

## 1. 먼저 네 축을 분리한다

```text
Form Factor
→ 물리적 형태와 크기
→ M.2 / 2.5-inch / Add-in Card 등

Interface
→ Host와 연결되는 전송 통로
→ SATA / PCIe 등

Protocol
→ Host와 Storage가 명령을 주고받는 규약
→ AHCI / NVMe 등

NAND
→ 실제 데이터를 저장하는 Flash Cell 특성
→ SLC / MLC / TLC / QLC
```

따라서 `M.2 = NVMe`도 아니고 `NVMe = SSD의 모양`도 아니다.

## 2. 전체 구조

```text
Application / OS
        ↓
Storage Driver
        ↓ Protocol
AHCI 또는 NVMe
        ↓ Interface
SATA 또는 PCIe
        ↓
SSD Controller
        ↓
NAND Flash
```

이 전체 부품이 M.2나 2.5-inch 같은 Form Factor 안에 들어간다.

> **Form Factor는 모양, Interface는 통로, Protocol은 명령 체계, NAND는 저장 매체의 성질이다.**

## 3. Form Factor

### M.2

M.2는 얇은 카드 형태의 물리 규격이다. 예를 들어 `2280`은 대략 폭 22mm, 길이 80mm를 뜻한다.

M.2 자체가 NVMe를 뜻하지 않는다.

```text
M.2 SATA SSD
→ Form Factor: M.2
→ Interface: SATA
→ Protocol: AHCI/SATA 계열

M.2 NVMe SSD
→ Form Factor: M.2
→ Interface: PCIe
→ Protocol: NVMe
```

따라서 M.2 Slot이 있어도 Mainboard가 해당 Key와 Interface를 지원하는지 확인해야 한다.

### 2.5-inch

소비자 시장에서는 2.5-inch SATA SSD가 흔하지만 2.5-inch가 곧 SATA라는 뜻은 아니다. Enterprise에서는 U.2 계열 2.5-inch NVMe SSD도 사용할 수 있다.

## 4. Interface

### SATA

SATA는 HDD 시대부터 이어진 호환성이 강점이다. SATA III는 6Gb/s Link를 사용하며 실제 SSD 순차 처리량은 Protocol Overhead 등으로 보통 그보다 낮다.

### PCIe

PCI Express는 Lane 단위의 고속 Serial Interconnect다. NVMe SSD는 일반적으로 PCIe Lane을 통해 Host와 통신한다.

```text
PCIe Generation ↑
        ↓
Lane당 Bandwidth ↑
        ↓
x4 SSD의 최대 Link Bandwidth ↑
```

다만 실제 SSD 성능은 Controller, NAND, Thermal Throttling, Workload의 영향을 함께 받는다.

## 5. Protocol

### AHCI

AHCI는 SATA Storage Controller를 위한 Host Interface로 HDD 중심의 요구를 배경으로 설계됐다. SSD도 사용할 수 있지만 높은 병렬성을 가진 Flash Storage에 최적화된 구조는 아니다.

### NVMe

NVMe(NVM Express)는 Non-Volatile Memory를 위해 설계된 Storage Protocol이다. 다수의 Queue와 깊은 Command Queue를 이용해 높은 병렬성과 낮은 Overhead를 목표로 한다.

```text
CPU / I/O Workload
 ├─ Queue 1
 ├─ Queue 2
 ├─ Queue 3
 └─ ...
        ↓
      NVMe SSD
```

숫자 자체를 외우기보다 **AHCI보다 Flash의 병렬성을 활용하기 좋은 명령 구조**라는 점을 기억한다.

NVMe는 PCIe-attached SSD에서 가장 흔히 보지만, NVMe over Fabrics처럼 다른 Transport와도 결합할 수 있으므로 `NVMe = PCIe 그 자체`라고 보지 않는다.

## 6. NAND Flash

한 Cell에 몇 Bit를 저장하느냐에 따라 구분한다.

| 종류 | Cell당 Bit | 상태 수 |
|---|---:|---:|
| SLC | 1 | 2 |
| MLC | 2 | 4 |
| TLC | 3 | 8 |
| QLC | 4 | 16 |

같은 세대와 조건이라면 Cell당 Bit가 늘수록 저장 밀도와 Cost 효율은 높아지지만 더 많은 Voltage 상태를 구분해야 하므로 Latency와 Endurance 측면의 Trade-off가 커질 수 있다.

```text
Density ↑
Cost per bit ↓

대신
Program/Erase 부담 ↑
Latency·Endurance Trade-off ↑
```

실제 제품 성능과 수명은 NAND 종류뿐 아니라 Controller, Firmware, Over-Provisioning, Capacity, Workload에 크게 좌우된다.

## 7. SLC Cache와 DRAM/HMB는 별도 축이다

TLC/QLC SSD는 일부 NAND를 SLC처럼 사용해 짧은 Write Burst를 빠르게 처리할 수 있다.

```text
Host Write
   ↓
Pseudo-SLC Cache
   ↓ Background Fold
TLC / QLC 영역
```

따라서 짧은 Benchmark 결과와 장시간 Sustained Write 성능은 다를 수 있다.

또한 DRAM 유무는 NAND 종류와 별도 설계 축이다.

```text
NAND Type
→ TLC / QLC

Metadata Cache
→ Dedicated DRAM
→ DRAM-less + HMB
```

`QLC = DRAM-less`, `TLC = DRAM 탑재`처럼 묶지 않는다.

## 8. 왜 NVMe SSD가 SATA SSD보다 빠른가

```text
더 넓은 PCIe Link Bandwidth
        +
Flash에 맞는 NVMe Queue Architecture
        +
Controller / NAND 병렬성
        ↓
높은 Throughput · 낮은 Latency · 높은 IOPS 가능
```

즉 M.2라서 빠른 것이 아니다. M.2 SATA SSD는 SATA의 Interface/Protocol 한계 안에서 동작한다.

## 9. 제품 스펙을 읽는 순서

```text
M.2 2280 PCIe 4.0 x4 NVMe TLC 2TB
```

를 다음처럼 분해한다.

```text
M.2 2280
→ Form Factor

PCIe 4.0 x4
→ Interface / Link

NVMe
→ Protocol

TLC
→ NAND 특성

2TB
→ Capacity
```

그다음 실제 선택에서는 Mainboard 호환성, Controller, DRAM/HMB, Sustained 성능, TBW, Thermal 특성, 가격을 추가로 본다.

## 10. 기술사 관점의 위치

컴퓨터 구조에서는 SSD 제품 비교 자체보다 저장장치가 어떤 계층으로 구성되고, Flash의 물리 제약을 Controller와 FTL이 어떻게 감추는지 이해하는 것이 중요하다.

```text
Host의 논리 Block
        ↓
Protocol / Interface
        ↓
SSD Controller
        ↓
FTL
        ↓
NAND의 물리 Page / Block
```

FTL은 논리 Block 주소와 Flash의 실제 물리 위치를 Mapping하며 Garbage Collection, Wear Leveling 같은 Flash 관리의 기반이 된다.

## 11. 기억·인출

```text
SSD 이름을 보면 네 질문으로 분해한다.

어떻게 생겼나?      → Form Factor
어떤 통로로 붙나?   → Interface
어떤 명령으로 말하나? → Protocol
어떤 Cell에 저장하나? → NAND
```

> `M.2`, `PCIe`, `NVMe`, `TLC`는 경쟁하는 네 종류의 SSD가 아니라 하나의 SSD를 서로 다른 관점에서 설명하는 용어다.
