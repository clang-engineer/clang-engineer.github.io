# 가상화 구조와 VM·컨테이너

> [클라우드 전체 개념지도](../10-클라우드/00-전체.md) → 실행·격리 → VM / Container
>
> **목적:** 서버·컴퓨팅 가상화의 두 방식인 VM과 컨테이너를 이해하고, VM 내부의 두 분류축(Type 1/2, 전가상화/반가상화)을 구분한다.

## 1. 가상화란? — 목적과 전체 분류

가상화(Virtualization)는 물리 자원을 복제하는 대신 **논리적으로 추상화·공유**해 여러 실행환경에 제공하는 기술이다. 서버 통합·격리·유연한 자원 할당이 가능하지만, 자원 경합·가상화 비용·Host 장애 영향도 고려해야 한다.

```text
가상화 대상
├─ 서버·컴퓨팅 가상화  ← 이 문서의 범위
│  ├─ Hardware 수준 → VM
│  └─ OS 수준       → Container
├─ 스토리지 가상화
├─ 네트워크 가상화
└─ 데스크톱 가상화
```

VM과 컨테이너는 **서버 실행환경을 구성하는 방식**이다. 스토리지·네트워크·데스크톱 가상화까지 이 둘로 분류하는 것은 아니다.

## 2. VM 기반 가상화

VM(Virtual Machine)은 가상 하드웨어 위에서 **독립된 Guest OS와 Kernel**을 실행한다. 한 물리 서버에서 여러 VM이 실행되는 것은 Hypervisor가 CPU·메모리·디스크·NIC 등의 물리 자원을 가상화해 각 VM에 제공하기 때문이다.

```text
VM 1                 VM 2
Application          Application
Guest OS             Guest OS
     └───────┬────────┘
         Hypervisor
              |
        물리 하드웨어
```

### Hypervisor의 역할

Hypervisor는 VM의 가상 하드웨어를 제공하고 물리 자원 사용을 중재한다. VM마다 Guest Kernel이 있으므로 Linux Host에서 Windows VM처럼 다른 OS 계열도 실행할 수 있다.

VM 기반 가상화는 **Hypervisor가 어디에서 실행되는가**와 **Guest OS가 가상화 환경을 어떻게 사용하는가**라는 두 축으로 구분한다.

### Type 1 / Type 2 — Hypervisor 실행 위치

```text
Type 1 (Bare-metal)        Type 2 (Hosted)

VM / Guest OS             VM / Guest OS
      |                         |
 Hypervisor                Hypervisor
      |                         |
 물리 하드웨어               Host OS
                                |
                           물리 하드웨어
```

- **Type 1:** 범용 Host OS 없이 물리 하드웨어에서 Hypervisor가 직접 실행된다. 대표 사례는 VMware ESXi다.
- **Type 2:** Windows·Linux·macOS 같은 Host OS 위에서 Hypervisor가 실행된다. 대표 사례는 VirtualBox와 VMware Workstation이다.

Type 1은 하드웨어에 Hypervisor가 처음부터 내장되어 있다는 뜻이 아니다. **범용 Host OS 없이 직접 설치·실행하는 구조**라는 뜻이다.

### 전가상화 / 반가상화 — Guest OS의 상호작용 방식

- **전가상화(Full Virtualization):** Hypervisor가 가상 하드웨어 환경을 제공해 **Guest OS를 수정하지 않고** 실행할 수 있게 한다.
- **반가상화(Para Virtualization):** Guest OS를 수정하거나 전용 Driver를 사용해 **Hypervisor와 협력**하도록 한다. 일부 작업의 가상화 비용을 줄일 수 있다.

```text
전가상화                       반가상화
Guest OS                       Guest OS / 전용 Driver
   ↓                                  ↓ 협력·요청
가상 하드웨어                   Hypervisor 측 인터페이스
   ↓                                  ↓
Hypervisor                     Hypervisor
   └──────────────┬───────────────────┘
              물리 하드웨어
```

반가상화에서 Guest OS가 Hypervisor의 존재를 알아야 하는 이유는 **Hypervisor에 작업을 요청하거나 전용 인터페이스로 협력하기 때문**이다. 대표적인 직접 요청을 Hypercall이라고 한다. 다만 반가상화 I/O가 모두 Hypercall 하나로 처리되는 것은 아니다.

현대 VM에서는 수정하지 않은 Guest OS를 실행하면서도 I/O에 반가상화 Driver를 함께 사용한다.

**Type 1/2는 Hypervisor의 실행 위치**, **전가상화/반가상화는 Guest OS의 상호작용 방식**이다. 따라서 Type 1=전가상화, Type 2=반가상화로 대응시키지 않는다.

## 3. 컨테이너 기반 가상화

컨테이너는 별도의 Guest Kernel을 부팅하지 않고 **Host Kernel을 공유**하면서 애플리케이션 프로세스를 격리한다.

- **Namespace:** 프로세스·네트워크·마운트 등 각 컨테이너에서 보이는 자원 범위를 격리한다.
- **cgroup:** CPU·메모리 등 자원 사용량을 제어·제한한다.
- **Container Runtime:** 컨테이너 생성·실행·수명주기를 관리한다.

컨테이너 Image는 애플리케이션과 필요한 라이브러리를 묶어 배포한다. 별도 Guest OS를 부팅하지 않아 일반적으로 시작이 빠르고 자원 사용량이 적다. 대신 공유 Kernel의 취약점이 여러 컨테이너에 영향을 줄 수 있다.

컨테이너 자체에는 Hypervisor가 필요하지 않지만, **VM 안에서 컨테이너를 실행할 수는 있다.**

## 4. VM과 컨테이너 비교 — 구조에서 선택까지

```text
[VM: 독립 Guest Kernel]          [Container: Host Kernel 공유]
┌─────────────────────┐         ┌─────────────────────┐
│ VM A       VM B     │         │ Container A   B     │
│ App        App      │         │ App + Lib   App+Lib │
│ Guest OS   Guest OS │         │ 격리된 Process들    │
│ Guest K.   Guest K. │         └──────────┬──────────┘
├─────────────────────┤                    │
│ 가상 하드웨어 제공   │         ┌──────────▼──────────┐
├─────────────────────┤         │ Host Kernel (공유)  │
│ Hypervisor          │         │ Namespace / cgroup  │
├─────────────────────┤         │ (격리·자원 제어)     │
│ 물리 하드웨어        │         ├─────────────────────┤
└─────────────────────┘         │ 물리 하드웨어        │
                                └─────────────────────┘
```

VM은 Hypervisor가 제공하는 가상 하드웨어 위에서 **VM마다 Guest OS·Kernel을 실행**한다. Container는 **별도 Guest Kernel 없이 Host Kernel을 공유**하며, Namespace(보이는 자원 격리)와 cgroup(자원 사용 제어)을 이용한다. Namespace·cgroup은 별도의 OS 계층이 아니라 Kernel의 격리·자원 관리 기능이다. 그림은 대표적인 구조를 단순화한 것으로, Container가 VM 내부에서 실행될 수도 있다.

| 비교 기준 | VM | 컨테이너 |
|---|---|---|
| 격리 대상 | 가상 하드웨어 기반 실행환경 | 프로세스·OS 자원 |
| Kernel | Guest Kernel 독립 | Host Kernel 공유 |
| 시작·자원 밀도 | OS 부팅·자원 부담이 상대적으로 큼 | 일반적으로 빠르고 가벼움 |
| 다른 OS Kernel | 실행 가능 | Host Kernel과 호환 필요 |
| 보안 경계 | 일반적으로 강한 격리 | 공유 Kernel에 의존 |
| 주된 활용 | OS 단위 격리·인프라 운영 | 애플리케이션 배포·확장 |

### 실제 클라우드에서는 어떻게 조합하는가?

```text
물리 서버
   ↓
Hypervisor
   ↓
VM / Guest OS
   ├─ Application 직접 실행
   └─ Container Runtime
          ↓
       Container
          ↓
       Application
```

IaaS에서 클라우드 제공자는 Hypervisor로 VM을 제공할 수 있다. 사용자는 VM에서 애플리케이션을 직접 실행하거나 Docker·containerd 같은 Runtime으로 컨테이너를 실행한다. **Hypervisor는 VM을 제공하고, Container Runtime은 컨테이너 실행을 관리한다.**

IaaS/PaaS/SaaS는 **서비스 제공 범위**, VM/컨테이너는 **실행환경 구현 방식**에 관한 구분이므로 같은 분류축이 아니다.

## 5. 이해 복원 — 문서를 덮고 답해보기

1. 가상화는 물리 자원을 어떻게 여러 실행환경에 제공하는가?
2. Type 1/2와 전가상화/반가상화는 각각 무엇을 기준으로 구분하는가?
3. 전가상화에는 왜 가상 하드웨어가 필요하며, 반가상화에서는 왜 Guest OS가 Hypervisor와 협력하는가?
4. 컨테이너는 Guest Kernel 없이 어떻게 격리되며, VM보다 가벼운 이유는 무엇인가?
5. 클라우드 VM 안에서 컨테이너를 실행할 때 Hypervisor와 Container Runtime의 역할은 무엇인가?

막히는 부분만 다시 읽고 [클라우드 전체 개념지도](../10-클라우드/00-전체.md)로 돌아간다.
