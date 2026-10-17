# 가상화 구조와 VM·컨테이너

## 이 문서에서 되짚을 질문

- 가상화는 실제 물리 자원을 복제하는 것인가, 나누어 쓰게 하는 것인가?
- VM마다 운영체제가 있는데 어떻게 한 물리 서버에서 동시에 실행되는가?
- Type 1/Type 2와 전가상화/반가상화는 무엇을 분류하는가?
- 컨테이너에는 왜 Hypervisor가 필요하지 않은가?
- 컨테이너도 격리되는데 왜 VM보다 가볍고 보안 경계는 다르게 보는가?
- 서버 가상화와 데스크톱 가상화는 둘 다 VM을 쓰는데 왜 다른 개념인가?

## 가상화의 목적

물리 서버에 운영체제와 업무가 종속되면 자원 활용과 이동이 제한된다. 가상화는 CPU·메모리·스토리지·네트워크를 추상화해 여러 실행환경이 공유하도록 한다.

서버 통합·격리·신속한 생성·Snapshot·이동·유연한 자원 할당이 가능하지만, 가상화 Overhead·자원 경합·Host 장애 영향 확대·운영 복잡성은 고려해야 한다.

**가상화는 물리 자원을 복제하지 않고 논리적으로 나누어 공유한다.** VM과 컨테이너는 그 방식과 계층이 다르다.

### 가상화의 범위

가상화 대상에는 서버·컴퓨팅, 스토리지, 네트워크, 데스크톱 등이 있다. **VM과 컨테이너의 구분은 이 중 서버·컴퓨팅 실행환경에 관한 것**이다.

```text
가상화
├─ 서버·컴퓨팅 가상화
│  ├─ Hardware 수준 가상화 → VM
│  └─ OS 수준 가상화       → Container
│
├─ 스토리지 가상화
├─ 네트워크 가상화
└─ 데스크톱 가상화 등
```

```text
서버·컴퓨팅 가상화
│
├─ Hardware 수준 가상화 → VM
│  ├─ Hypervisor 배치 위치
│  │  ├─ Type 1 (Bare-metal)
│  │  └─ Type 2 (Hosted)
│  │
│  └─ Guest OS와 Hypervisor의 상호작용
│     ├─ 전가상화 (Full Virtualization)
│     └─ 반가상화 (Para Virtualization)
│
└─ OS 수준 가상화 → Container
   └─ Host Kernel 공유
      ├─ Namespace → 가시 범위 격리
      └─ cgroup → 자원 사용량 제한
```

**Type 1/2와 전가상화/반가상화는 VM 기반 가상화의 분류축**이다. Host Kernel을 공유하는 컨테이너에는 적용하지 않는다.

## 서버 가상화

Hypervisor는 물리 자원을 여러 VM(Virtual Machine)에 할당한다. 각 VM은 가상 하드웨어와 Guest OS를 가진다.

```text
VM 1          VM 2          VM 3
Guest OS      Guest OS      Guest OS
   \             |             /
          Hypervisor
              |
물리 서버 (CPU · Memory · Disk · NIC)
```

### VM 안에서도 다시 두 개의 분류축이 있다

VM 기반 가상화에는 **Hypervisor의 배치 위치**와 **Guest OS의 상호작용 방식**이라는 서로 다른 분류축이 있다.

```text
VM 기반 Hardware Virtualization
├─ Hypervisor를 어디에 배치하는가?
│  ├─ Type 1 (Bare-metal)
│  └─ Type 2 (Hosted)
│
└─ Guest OS와 Hypervisor가 어떻게 상호작용하는가?
   ├─ 전가상화 (Full Virtualization)
   └─ 반가상화 (Para Virtualization)
```

**Type 1 = 전가상화, Type 2 = 반가상화가 아니다.** 두 축은 일대일로 대응하지 않는다.

### Type 1과 Type 2 — Hypervisor의 배치 위치

#### Type 1: Bare-metal

Hypervisor가 범용 Host OS 없이 물리 하드웨어에서 직접 실행된다. 주로 서버·데이터센터에 사용한다.

```text
VM / Guest OS       VM / Guest OS
       \                /
            Hypervisor
                |
             Hardware
```

대표 사례는 VMware ESXi다.

#### Type 2: Hosted

Windows·macOS·Linux 같은 Host OS 위에서 Hypervisor가 실행된다. 주로 데스크톱·개발·시험 환경에 사용한다.

```text
VM / Guest OS       VM / Guest OS
       \                /
            Hypervisor
                |
             Host OS
                |
             Hardware
```

대표 사례는 VirtualBox와 VMware Workstation이다.

**구분 기준: Hypervisor 아래에 범용 Host OS가 있는가?**

### 전가상화와 반가상화 — Guest OS의 가상화 방식

이번에는 **Guest OS가 Hypervisor와 상호작용하는 방식**을 구분한다.

#### 전가상화(Full Virtualization)

Guest OS를 수정하지 않고 실행할 수 있도록 가상 하드웨어 환경을 제공한다.

```text
수정되지 않은 Guest OS
          |
     가상 Hardware
          |
      Hypervisor
          |
   Physical Hardware
```

#### 반가상화(Para Virtualization)

Guest OS를 Hypervisor와 협력하도록 수정하거나 전용 Driver를 사용해 일부 작업을 직접 요청함으로써 가상화 비용을 줄인다.

```text
Guest OS / Para-virtualized Driver
          |
          | 직접 협력 · 요청
          v
      Hypervisor
          |
   Physical Hardware
```

실제 환경에서는 수정하지 않은 Guest OS를 실행하면서 I/O에 반가상화 Driver를 사용하는 등 두 방식을 함께 활용한다.

### 한 번에 정리

| 분류축 | 적용 대상 | 질문 | 종류 |
|---|---|---|---|
| Hypervisor 구조 | VM 기반 가상화 | Hypervisor가 어디에서 실행되는가? | Type 1 / Type 2 |
| 가상화 방식 | VM 기반 가상화 | Guest OS와 Hypervisor가 어떻게 상호작용하는가? | 전가상화 / 반가상화 |
| OS 수준 격리 | Container | Host Kernel 자원을 어떻게 격리하는가? | Namespace / cgroup |

## VM과 컨테이너

### VM

Hardware 수준을 가상화한다. VM마다 Guest OS와 Kernel이 있어 서로 다른 OS를 실행할 수 있고 격리가 강하다. 대신 Image가 크고 시작시간과 자원 사용량이 증가한다.

Hypervisor가 CPU·메모리·디스크·NIC 등의 가상 장치를 제공하므로 Guest OS를 독립적으로 부팅할 수 있다. 예를 들어 Linux Host에서 Windows VM을 실행할 수 있다.

### 컨테이너

Process와 OS 자원을 격리하지만 Host Kernel을 공유한다. Namespace는 Process·Network·Mount 등의 가시 범위를 나누고, cgroup은 CPU·Memory 등 자원 사용량을 제한한다.

Container Image는 애플리케이션과 Library를 묶어 배포 일관성을 높인다. Kernel을 공유하므로 가볍고 빠르지만, Host Kernel 취약점과 격리 경계를 더 주의해야 한다.

### 컨테이너에는 왜 Hypervisor가 없는가?

**컨테이너 자체에는 Hypervisor가 필요하지 않다.** 별도 Guest Kernel을 부팅하지 않고 Host Kernel의 격리 기능을 이용하기 때문이다.

```text
VM 방식                          Container 방식

Application                      Application + Library
     |                                   |
Guest OS + Guest Kernel          격리된 Process
     |                                   |
가상 Hardware                    Namespace / cgroup
     |                                   |
Hypervisor                       Host Kernel (공유)
     |                                   |
Physical Hardware                Physical Hardware
```

Guest Kernel을 별도로 부팅하지 않는 컨테이너는 일반적으로 시작이 빠르고 자원 사용량이 적다. 다만 Host Kernel 취약점이 여러 컨테이너의 격리에 영향을 줄 수 있다. 실제 배포에서는 VM 안에서 컨테이너를 실행하기도 한다.

### 실제 클라우드에서 VM과 Container는 어떻게 사용되는가?

IaaS에서는 클라우드 제공자(CSP)가 Hypervisor로 VM을 제공한다. 사용자는 VM에 애플리케이션을 직접 설치하거나 Docker·containerd 같은 Container Runtime으로 컨테이너를 실행할 수 있다.

```text
1. VM만 사용하는 경우

Physical Server
      ↓
Hypervisor
      ↓
VM Instance
      ↓
Guest OS
      ↓
Application


2. VM에서 Container를 사용하는 경우

Physical Server
      ↓
Hypervisor          ← VM 격리
      ↓
VM Instance
      ↓
Guest OS
      ↓
Container Runtime   ← Process·실행환경 격리
      ↓
Container
      ↓
Application
```

**Hypervisor는 VM을 제공하고, Container Runtime은 컨테이너 실행을 관리한다.** 컨테이너 때문에 Hypervisor가 필요한 것은 아니다.

**IaaS/PaaS/SaaS는 서비스 제공 범위**, **VM/컨테이너는 실행환경 구현 방식**에 관한 분류다. PaaS·SaaS도 내부적으로 VM과 컨테이너를 조합할 수 있다.

## 비교 기준

- 격리 단위: VM은 가상 하드웨어, 컨테이너는 Process·OS 자원
- 가상화 계층: VM은 Hypervisor, 컨테이너는 Host Kernel의 Namespace·cgroup
- 운영체제: VM은 Guest OS 포함, 컨테이너는 Host Kernel 공유
- 시작속도·밀도: 컨테이너가 일반적으로 유리
- 이기종 OS: VM이 유리
- 보안 경계: VM이 일반적으로 강하지만 구성과 운영에 따라 달라짐
- 이동·배포: VM은 Infrastructure 이동, 컨테이너는 애플리케이션 배포에 강점

## 서버 가상화와 데스크톱 가상화

서버 가상화는 Web·DB·WAS 같은 서버 업무를 물리 자원 위에 통합·격리하는 기술이다. 데스크톱 가상화는 사용자별 Desktop 실행환경을 중앙에서 제공하고 단말과 분리하는 방식이다. 둘 다 VM을 사용할 수 있지만, **서버 업무를 제공하는가, 사용자 업무환경을 제공하는가**라는 목적이 다르다.

상세 구조와 VDI·RDS·CCI·DaaS의 차이는 [데스크톱 가상화 — VDI·RDS·CCI·DaaS](데스크톱-가상화-VDI-RDS-CCI-DaaS.md)에서 다룬다.

## 이해 복원 — 문서를 덮고 답해보기

다음 세 관계를 문서를 덮고 설명해본다.

1. **분류축**: Type 1/2는 무엇을 기준으로 나누고, 전가상화/반가상화는 무엇을 기준으로 나누는가?
2. **구조와 결과**: VM과 컨테이너의 Kernel 구조 차이에서 시작속도·자원 밀도·격리 경계의 차이가 왜 생기는가?
3. **실제 조합**: 클라우드 VM 안에서 컨테이너를 실행할 때 Hypervisor와 Container Runtime은 각각 무엇을 담당하는가?

막히는 부분만 다시 읽고 상위 개념지도로 돌아간다.
