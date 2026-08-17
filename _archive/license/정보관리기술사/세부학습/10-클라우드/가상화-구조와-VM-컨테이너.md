# 가상화 구조와 VM·컨테이너

## 가상화의 목적

물리 자원을 그대로 사용하면 한 서버에 하나의 운영체제와 업무가 강하게 결합되고, 자원 활용률과 이동성이 낮아진다. 가상화는 CPU·메모리·스토리지·네트워크를 논리 자원으로 추상화해 여러 실행환경이 공유하도록 한다.

얻는 효과는 서버 통합, 격리, 신속한 생성, Snapshot·이동, 자원 할당 유연성이다. 대신 가상화 계층의 Overhead, Host 장애 영향 확대, 자원 경합, 운영 복잡성이 생긴다.

## 서버 가상화

Hypervisor가 물리 하드웨어를 여러 VM(Virtual Machine)에 나눈다. 각 VM은 가상 하드웨어와 Guest OS를 가진다.

- Type 1: Hypervisor가 하드웨어에서 직접 실행. 서버·Data Center에 주로 사용
- Type 2: Host OS 위에서 실행. Desktop·개발·시험에 주로 사용

Full Virtualization은 Guest OS 수정 없이 가상 하드웨어를 제공하고, Para Virtualization은 Guest가 Hypervisor와 협력하도록 수정하거나 전용 Driver를 사용해 효율을 높인다. 현대 가상화는 Hardware 지원과 Para Virtualized Driver를 함께 사용하는 경우가 많다.

## VM과 컨테이너

### VM

Hardware 수준을 가상화한다. VM마다 Guest OS와 Kernel이 있어 서로 다른 OS를 실행할 수 있고 격리가 강하다. 대신 Image가 크고 시작시간과 자원 사용량이 증가한다.

### 컨테이너

Process와 OS 자원을 격리하지만 Host Kernel을 공유한다. Namespace는 Process·Network·Mount 등의 가시 범위를 나누고, cgroup은 CPU·Memory 등 자원 사용량을 제한한다.

Container Image는 애플리케이션과 Library를 묶어 배포 일관성을 높인다. Kernel을 공유하므로 가볍고 빠르지만, Host Kernel 취약점과 격리 경계를 더 주의해야 한다.

## 비교 기준

- 격리 단위: VM은 가상 하드웨어, 컨테이너는 Process·OS 자원
- 운영체제: VM은 Guest OS 포함, 컨테이너는 Host Kernel 공유
- 시작속도·밀도: 컨테이너가 일반적으로 유리
- 이기종 OS: VM이 유리
- 보안 경계: VM이 일반적으로 강하지만 구성과 운영에 따라 달라짐
- 이동·배포: VM은 Infrastructure 이동, 컨테이너는 애플리케이션 배포에 강점

## 서버 가상화와 데스크톱 가상화

서버 가상화는 여러 서버 업무를 물리 서버에 통합하는 Infrastructure 기술이다. 데스크톱 가상화는 사용자의 Desktop 환경을 중앙에서 제공하고 단말과 분리하는 서비스 구조다. 데스크톱 가상화가 VM을 사용할 수는 있지만 목적과 사용자가 다르다.

## 기억 흐름

물리 자원의 낮은 활용과 강한 결합
→ Hypervisor와 VM으로 서버 자원 분리
→ 더 가벼운 배포 요구
→ Kernel을 공유하는 컨테이너
→ 격리·성능·운영 책임에 따라 선택
