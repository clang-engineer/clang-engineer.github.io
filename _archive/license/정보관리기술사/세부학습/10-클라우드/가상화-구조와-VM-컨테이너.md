# 가상화 구조와 VM·컨테이너

## 이 문서에서 되짚을 질문

- 가상화는 실제 물리 자원을 복제하는 것인가, 나누어 쓰게 하는 것인가?
- VM마다 운영체제가 있는데 어떻게 한 물리 서버에서 동시에 실행되는가?
- 컨테이너도 격리되는데 왜 VM보다 가볍고 보안 경계는 다르게 보는가?

## 가상화의 목적

물리 자원을 그대로 사용하면 한 서버에 하나의 운영체제와 업무가 강하게 결합되고, 자원 활용률과 이동성이 낮아진다. 가상화는 CPU·메모리·스토리지·네트워크를 논리 자원으로 추상화해 여러 실행환경이 공유하도록 한다.

얻는 효과는 서버 통합, 격리, 신속한 생성, Snapshot·이동, 자원 할당 유연성이다. 대신 가상화 계층의 Overhead, Host 장애 영향 확대, 자원 경합, 운영 복잡성이 생긴다.

가상화가 CPU와 메모리를 새로 만들어내는 것은 아니다. 실제 물리 자원을 Hypervisor가 나누어 보여주고, 각 VM은 자기에게 독립된 자원이 있는 것처럼 사용한다. 여러 VM이 물리 자원을 공유하므로 사용률을 높일 수 있지만, 동시에 많이 사용하면 경합이 생긴다.

## 서버 가상화

Hypervisor가 물리 하드웨어를 여러 VM(Virtual Machine)에 나눈다. 각 VM은 가상 하드웨어와 Guest OS를 가진다.

- Type 1: Hypervisor가 하드웨어에서 직접 실행. 서버·Data Center에 주로 사용
- Type 2: Host OS 위에서 실행. Desktop·개발·시험에 주로 사용

Guest OS는 자신이 가상 CPU와 가상 Device를 사용하는지 모르거나 크게 의식하지 않고 동작한다. Hypervisor는 Guest의 요청을 실제 CPU·Memory·I/O에 연결하고 서로의 영역을 침범하지 않도록 통제한다. Type 1과 Type 2의 핵심 차이는 **Hypervisor 아래에 범용 Host OS가 있는가**다.

Full Virtualization은 Guest OS 수정 없이 가상 하드웨어를 제공하고, Para Virtualization은 Guest가 Hypervisor와 협력하도록 수정하거나 전용 Driver를 사용해 효율을 높인다. 현대 가상화는 Hardware 지원과 Para Virtualized Driver를 함께 사용하는 경우가 많다.

## VM과 컨테이너

### VM

Hardware 수준을 가상화한다. VM마다 Guest OS와 Kernel이 있어 서로 다른 OS를 실행할 수 있고 격리가 강하다. 대신 Image가 크고 시작시간과 자원 사용량이 증가한다.

VM을 실행한다는 것은 물리 서버 안에 작은 물리 서버가 실제로 생기는 것이 아니라, CPU·Memory·Disk·NIC처럼 보이는 가상 장치를 제공하고 그 위에서 Guest OS를 부팅하는 것이다. Guest Kernel까지 따로 있으므로 Linux Host 위에서 Windows VM처럼 다른 OS 계열을 실행할 수 있다.

### 컨테이너

Process와 OS 자원을 격리하지만 Host Kernel을 공유한다. Namespace는 Process·Network·Mount 등의 가시 범위를 나누고, cgroup은 CPU·Memory 등 자원 사용량을 제한한다.

Container Image는 애플리케이션과 Library를 묶어 배포 일관성을 높인다. Kernel을 공유하므로 가볍고 빠르지만, Host Kernel 취약점과 격리 경계를 더 주의해야 한다.

컨테이너 안에서 별도 OS처럼 보이는 파일과 Process 공간이 있어도 Kernel까지 새로 부팅하는 것은 아니다. Host Kernel 하나가 Namespace로 “보이는 범위”를 다르게 보여주고 cgroup으로 “사용 가능한 양”을 제한한다. 그래서 빠르지만 Kernel 문제가 여러 컨테이너에 함께 영향을 줄 수 있다.

## 비교 기준

- 격리 단위: VM은 가상 하드웨어, 컨테이너는 Process·OS 자원
- 운영체제: VM은 Guest OS 포함, 컨테이너는 Host Kernel 공유
- 시작속도·밀도: 컨테이너가 일반적으로 유리
- 이기종 OS: VM이 유리
- 보안 경계: VM이 일반적으로 강하지만 구성과 운영에 따라 달라짐
- 이동·배포: VM은 Infrastructure 이동, 컨테이너는 애플리케이션 배포에 강점

## 서버 가상화와 데스크톱 가상화

서버 가상화는 여러 서버 업무를 물리 서버에 통합하는 Infrastructure 기술이다. 데스크톱 가상화는 사용자의 Desktop 환경을 중앙에서 제공하고 단말과 분리하는 서비스 구조다. 데스크톱 가상화가 VM을 사용할 수는 있지만 목적과 사용자가 다르다.

둘의 차이는 기반 기술보다 **무엇을 누구에게 제공하느냐**에 있다. 서버 가상화는 Web·DB 같은 서버 업무의 실행환경을 나누는 것이 목적이고, 데스크톱 가상화는 사용자의 화면·업무환경을 중앙에서 제공하는 것이 목적이다. VDI가 내부적으로 서버 가상화를 이용하더라도 같은 용어가 아닌 이유다.

## 기억 흐름

물리 자원의 낮은 활용과 강한 결합
→ Hypervisor와 VM으로 서버 자원 분리
→ 더 가벼운 배포 요구
→ Kernel을 공유하는 컨테이너
→ 격리·성능·운영 책임에 따라 선택
