# 03. 네트워크 세부학습 지도

이 디렉터리는 네트워크 기술을 용어별로 나열하기보다 **먼저 핵심 전달 축을 잡고, 그 위에서 Application·품질·운영·무선 같은 별도 질문으로 확장하는 방식**으로 학습한다.

핵심 원칙은 다음과 같다.

```text
본문 문서
= 정보관리기술사 Topic 자체를 이해하고 답안으로 연결하기 위한 핵심 원리

_보충학습
= 본문을 이해하다 생긴 구현 · OS · Runtime · 언어/Framework 수준의 이해 빈틈을 메우는 문서
```

따라서 모든 구현 세부를 본문에 넣지 않는다. 본문의 개념을 설명하는 데 필요한 범위를 넘어가면 `_보충학습`으로 분리한다.

---

## 전체 학습 구조

먼저 Network에서 데이터가 전달되는 중심 축을 잡는다.

> 아래 화살표는 Runtime 호출 순서가 아니라 **개념적 전달 구조와 권장 학습 연결**을 나타낸다.

```text
[핵심 전달 축]

Layer 2 경계
VLAN / Broadcast Domain
        ↓
Layer 3 주소와 경계
Subnet / CIDR / VLSM / DHCP / NAT
        ↓
경로 선택
Routing / RIP / OSPF / BGP
        ↓
종단 간 전송
TCP
```

여기까지는 `같은 망 안에서 어떻게 나누고 → 어떤 주소를 쓰고 → 다른 망으로 어떤 경로를 선택하고 → 종단 사이에서 어떻게 신뢰성 있게 전달하는가`라는 하나의 강한 연결 축이다.

그다음부터는 이 흐름의 단순한 다음 단계가 아니라 **서로 다른 상위 질문**으로 분기한다.

```text
                         [TCP까지의 핵심 전달 축]
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
          ▼                       ▼                       ▼
 [Application 통신 축]       [Network 품질 축]        [Network 운영 축]
 IPC / RPC / gRPC            QoS / QoE               NMS / SNMP

별도 Access 축
무선 공유 매체와 WLAN
CSMA/CA / Association / DHCP
```

각 축의 질문은 다르다.

```text
Application 통신
= Process와 원격 기능 호출을 어떻게 추상화할까?

Network 품질
= 한정된 Network 자원을 Traffic 특성에 맞게 어떻게 관리할까?

Network 운영
= 장비와 상태를 어떻게 중앙에서 관측·관리할까?

무선 Access
= 공유 무선 매체에서 Link를 어떻게 만들고 IP 통신까지 이어갈까?
```

따라서 아래 문서 번호는 **권장 탐색 순서**일 뿐, 5번 이후의 Topic이 서로의 필수 다음 단계라는 뜻은 아니다.

---

## 1. Layer 2 경계 — VLAN과 Broadcast Domain

[`VLAN-서브넷-브로드캐스트-도메인.md`](VLAN-서브넷-브로드캐스트-도메인.md)

먼저 다음 경계를 구분한다.

```text
Broadcast Domain
= Layer 2 Broadcast가 퍼질 수 있는 범위

VLAN
= Layer 2 논리적 망 분리

Subnet
= Layer 3 주소 범위
```

여기서 VLAN과 Subnet이 왜 같은 개념이 아닌지, 다른 Subnet으로 갈 때 왜 Gateway MAC을 사용하는지를 이해한다.

---

## 2. Layer 3 주소와 경계 — IP · CIDR · VLSM · DHCP · NAT

[`IP-주소-NAT-DHCP-CIDR-VLSM.md`](IP-주소-NAT-DHCP-CIDR-VLSM.md)

```text
Network 범위를 나눈다
→ Subnetting

Class 고정 경계를 버리고 Prefix로 표현한다
→ CIDR

Subnet마다 필요한 크기를 다르게 설계한다
→ VLSM

단말에 Network 설정을 준다
→ DHCP

사설 주소가 외부로 나갈 때 주소를 변환한다
→ NAT / PAT
```

VLAN 문서에서 만든 L2/L3 경계를 실제 IP 주소 체계와 연결한다.

---

## 3. 경로 선택 — Routing · RIP · OSPF · BGP

[`라우팅-원리와-RIP-OSPF-BGP.md`](라우팅-원리와-RIP-OSPF-BGP.md)

Network가 나뉘었다면 이제 다른 Network로 갈 경로가 필요하다.

```text
이웃의 거리 정보를 이용
→ Distance Vector / RIP

Link 상태로 내부 지도를 구성
→ Link State / OSPF

Internet 규모에서 관리 주체와 Policy까지 고려
→ AS / BGP
```

핵심은 Protocol 이름 암기가 아니라 **Network 규모와 관리 범위가 커질수록 경로 계산 방식도 바뀌는 이유**를 이해하는 것이다.

---

## 4. End-to-End 전송 — TCP

[`TCP-연결-종료-흐름-혼잡제어.md`](TCP-연결-종료-흐름-혼잡제어.md)

IP Routing 위에서 Application이 신뢰할 수 있는 Byte Stream을 사용할 수 있도록 TCP가 무엇을 해결하는지 본다.

```text
연결 설정
→ 연결 종료
→ 오류 제어
→ 흐름 제어
→ 혼잡 제어
→ 상위 Application의 Connection 재사용
```

본문에서는 TCP 자체의 핵심 원리까지 다루고, Socket · FD · Thread · Multiplexing 같은 OS/Application 구현 관점은 `_보충학습`에서 이어간다.

여기까지가 **Network의 핵심 전달 축**이다. 이후 문서는 이 위에서 서로 다른 문제를 본다.

---

## 5. Application 원격 통신 — IPC · RPC · gRPC

[`IPC-RPC-gRPC-원격호출.md`](IPC-RPC-gRPC-원격호출.md)

이 문서는 서로 다른 층의 개념을 구분하는 것이 핵심이다.

```text
IPC
= Process 사이의 데이터 전달 메커니즘

RPC
= 원격 기능을 함수 호출처럼 보이게 하는 프로그래밍 모델

gRPC
= RPC 모델을 구현한 구체적인 Framework
```

따라서 IPC · RPC · gRPC를 같은 종류의 Protocol 목록처럼 외우지 않는다.

---

## 6. Network 품질 — QoS · QoE

[`QoS와-QoE.md`](QoS와-QoE.md)

QoS를 단순 우선순위 기술로 보지 않고 Traffic 관리 흐름으로 이해한다.

```text
분류
→ Marking
→ Policing / Shaping
→ Queue
→ Scheduling
→ Delay / Jitter / Loss
→ QoE
```

이 흐름은 QoS를 이해하기 위한 **대표적인 관리 관점**이다. 모든 구현이 모든 단계를 동일한 순서로 반드시 거친다는 뜻은 아니다.

QoS는 Network 관점의 품질이고 QoE는 사용자가 느끼는 품질이라는 경계를 유지한다.

---

## 7. Network 운영 — NMS · SNMP

[`NMS와-SNMP.md`](NMS와-SNMP.md)

```text
NMS
= Network 장비를 중앙에서 관리하는 시스템

SNMP
= NMS가 장비와 관리 정보를 주고받을 때 사용할 수 있는 대표 Protocol
```

Manager · Agent · MIB · OID와 Polling · Trap을 장비 운영 흐름에서 연결한다.

---

## 8. 무선 Access — WLAN

[`무선-매체접근과-WLAN.md`](무선-매체접근과-WLAN.md)

무선은 유선 전달 축의 단순한 다음 단계가 아니라 **Layer 1/2의 공유 매체 접근을 다루는 별도 축**이다.

무선은 단말마다 별도 회선을 쓰는 것이 아니라 같은 Channel이라는 공유 매체를 사용한다.

```text
공유 무선 매체
→ 충돌 탐지가 어려움
→ CSMA/CA
→ Authentication / Association
→ 보안 Key 협상
→ DHCP
→ IP 통신
```

`AP가 보인다`와 `IP 통신이 된다`를 같은 상태로 보지 않는다.

---

# 보충학습 — 구현 계층으로 내려가기

본문을 이해하다 OS · Runtime · Framework 수준의 질문이 생기면 다음 순서로 내려간다.

> 아래 화살표는 필수 Runtime 실행 순서가 아니라 **이해를 깊게 가져가는 학습 Zoom-in 순서**다. 예를 들어 Reactor Pattern은 I/O Multiplexing 뒤에 반드시 존재해야 하는 실행 단계가 아니라 Event-driven I/O를 구조화하는 대표적인 설계 방식이다.

```text
TCP / Application 경계
        ↓
FD
↓
Socket Server I/O
↓
I/O Multiplexing
↓
Readiness
↓
Event Loop
↓
Reactor Pattern
↓
Java NIO / Netty

별도 관심사
Reactive Programming
↓
Reactive Streams
↓
Project Reactor

두 축이 Web Application에서 합류
↓
Spring WebFlux
```

## FD

[`_보충학습/FD-File-Descriptor.md`](_보충학습/FD-File-Descriptor.md)

Unix/Linux에서 Process가 File · Socket · Pipe 같은 Kernel I/O 자원을 어떤 Handle로 참조하는지 이해한다.

## Socket과 서버 I/O

[`_보충학습/Socket-서버-IO.md`](_보충학습/Socket-서버-IO.md)

```text
Application / Runtime
= 구조와 정책

Application Thread
= Socket API 호출 주체

OS Kernel
= Socket · Buffer · 실제 Network I/O 관리
```

Blocking / Non-blocking과 I/O Multiplexing의 출발점까지 다룬다.

## I/O Multiplexing · Event Loop · Reactor

[`_보충학습/IO-Multiplexing-EventLoop-Reactor.md`](_보충학습/IO-Multiplexing-EventLoop-Reactor.md)

```text
I/O Multiplexing
= 여러 FD의 readiness를 함께 기다리는 메커니즘

Event Loop
= 대기 → 처리 → 다시 대기를 반복하는 Application 실행 구조

Reactor
= Ready Event를 적절한 Handler로 Dispatch하는 설계 패턴
```

셋을 같은 개념으로 취급하지 않는다.

## Java Network I/O에서 WebFlux까지

[`_보충학습/Java-Network-IO-WebFlux.md`](_보충학습/Java-Network-IO-WebFlux.md)

일반 원리가 Java 생태계에서 어떻게 추상화되는지 본다.

```text
Network I/O 실행 축
OS Multiplexing
→ Java NIO
→ Netty

Reactive 데이터 흐름 축
Reactive Programming
→ Reactive Streams
→ Project Reactor

두 축의 합류
→ Spring WebFlux
```

---

# 문서 작성 원칙

이 디렉터리의 문서는 다음 기준을 유지한다.

1. **용어를 나열하기보다 실제 인과가 있는 곳은 문제 발생 순서와 인과관계로 연결한다.**
2. **비슷해 보이는 개념은 먼저 Layer · 역할 · 관리 주체를 분리한다.**
3. **서로 다른 상위 질문이나 분류축을 하나의 발전 단계처럼 만들지 않는다.**
4. **`왜 필요한가 → 어떻게 해결하는가 → 무엇이 다른가` 순서로 설명한다.**
5. **기술사 Topic 자체의 핵심 원리는 본문에 둔다.**
6. **OS · 구현 · Runtime · 특정 언어/Framework 수준의 심화는 `_보충학습`으로 분리한다.**
7. **한 문서가 어떤 상위 질문을 다루고 인접 문서와 어디에서 연결되는지 명시한다.**
8. **역사적 발전 순서, 개념적 추상화 계층, 실제 Runtime 호출 경로를 필요하면 구분해서 설명한다.**

목표는 많은 용어를 외우는 것이 아니라 **각 기술이 어떤 문제를 해결하기 위해 어느 위치에서 등장했는지 복원할 수 있는 상태**다.