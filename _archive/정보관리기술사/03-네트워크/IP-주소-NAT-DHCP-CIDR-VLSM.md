# IP 주소 설계·할당 — Subnet·CIDR·VLSM·DHCP

## 이 문서의 위치

이 문서는 VLAN과 Subnet으로 잡은 L2/L3 경계를 **IP 주소 범위·분할·자동 할당** 문제로 이어가는 문서다. 주소 부족과 NAT/PAT·IPv6는 [주소 부족 대응·전환](IPv4-주소부족-NAT-IPv6-전환.md)에서 별도로 다룬다.

```text
VLAN / Broadcast Domain
        ↓
Subnet 경계
        ↓
현재 문서
IP 주소 범위 · CIDR · VLSM · DHCP
        ↓
Routing
```

즉 `어디까지 같은 Network인가 → 주소 공간을 어떻게 나눌까 → 단말에 설정을 어떻게 줄까`를 하나의 흐름으로 본다.

## 이 문서에서 되짚을 질문

- Subnetting, CIDR, VLSM은 어떤 관계인가?
- CIDR과 VLSM은 둘 다 `/24`, `/26`을 사용하는데 무엇이 다른가?
- VLSM을 왜 1차·2차 Subnetting처럼 설명하는가?

## 왜 이 순서로 학습하는가

이 개념들을 용어별로 외우기보다 **단말이 네트워크에 들어와 외부 Internet까지 나가는 과정**으로 연결하면 이해하기 쉽다.

```text
IP 주소가 있다
→ 어디까지 같은 Network인가?          Subnet
→ 주소 공간을 어떻게 효율적으로 나누나? CIDR / VLSM
→ 단말에 이 설정을 누가 주나?           DHCP
```

> **Subnet은 범위를 정하고 → CIDR·VLSM은 주소를 설계하고 → DHCP는 단말에 설정을 제공한다.**

## Subnet과 Subnetting

하나의 거대한 Network에 모든 단말을 넣으면 Broadcast 범위가 커지고 주소·보안·장애 관리가 어려워진다. 그래서 하나의 IP Network를 여러 작은 논리 Network로 나눈다.

Subnet Mask 또는 Prefix(`/24`)는 IP 주소에서 **Network 부분과 Host 부분의 경계**를 알려준다.

```text
목적지가 같은 Subnet
→ 같은 Network
→ 직접 전달

목적지가 다른 Subnet
→ 다른 Network
→ Default Gateway로 전달
```

즉 송신 단말은 목적지 IP와 자신의 Subnet Mask를 기준으로 같은 Network인지 판단하고, 다른 Network라면 Router 역할을 하는 Default Gateway에 Packet을 보낸다.

> **Subnet = 나누어진 Network 자체**  
> **Subnetting = Network를 여러 Subnet으로 나누는 행위**

## CIDR과 Subnet

CIDR(Classless Inter-Domain Routing, Class 고정 경계 없이 Prefix로 주소 범위를 표현·할당·집약하는 방식)은 Class A·B·C의 고정 경계를 버리고 `/24`, `/26`처럼 Prefix 길이로 Network 범위를 표현한다.

`/24`는 앞 24bit가 Network 부분이라는 뜻이다. Prefix가 길수록 Network 범위는 작아지고 Host 주소 수는 줄어든다.

`/24`에서 `/26`으로 Prefix가 길어졌다는 것은 Host에 쓸 bit를 2개 더 Network 구분에 사용한다는 뜻이다. 따라서 하나의 `/24`를 네 개의 `/26`으로 나눌 수 있다.

Subnetting은 큰 주소 범위를 더 작은 범위로 나누는 작업이고, Route Aggregation은 여러 연속 경로를 짧은 Prefix 하나로 묶는 작업이다.

> **Prefix 숫자가 커질수록 Network 범위는 작아진다.**

## VLSM

VLSM(Variable Length Subnet Mask, Subnet마다 서로 다른 Prefix 길이를 사용해 필요한 크기로 나누는 방식)은 모든 Subnet을 같은 크기로 자르지 않는다.

예를 들어:

```text
큰 주소 Block
├─ 사용자 100명 부서 → /25
├─ 사용자 50명 부서  → /26
└─ 장비 10대 구간    → /28
```

필요 Host 수에 따라 서로 다른 크기의 Subnet을 배정해 주소 낭비를 줄인다.

### 왜 VLSM을 1차·2차 Subnetting이라고 하나

VLSM은 이미 나눈 주소 범위를 다시 필요한 크기로 세분화할 수 있다.

```text
/24
 ↓ 1차 분할
/25 + /25
 ↓ 필요한 한쪽을 다시 분할
/26 + /26
```

그래서 교재에서 1차·2차 Subnetting이라고 표현할 수 있다. 핵심은 단계 수 자체가 아니라 **Subnet마다 서로 다른 Mask를 사용할 수 있다는 것**이다.

### Subnetting / CIDR / VLSM 관계

가장 먼저 다음 차이를 잡는다.

> **CIDR = 주소 체계를 Class 고정 경계에서 Prefix 기반으로 바꾼 것**  
> **VLSM = Prefix를 이용해 Subnet마다 필요한 크기를 다르게 설계하는 것**

조금 더 넓게 보면 다음과 같다.

> **Subnetting = Network를 나누는 행위**  
> **VLSM = 필요한 크기별로 서로 다르게 나누는 설계 방법**  
> **CIDR = Class 없이 Prefix로 주소 범위를 표현·할당·집약하는 체계**

CIDR과 VLSM 모두 `/24`, `/26` 같은 Prefix 표기를 사용하므로 비슷해 보이지만 같은 개념은 아니다. CIDR은 **주소 표현과 Classless Routing 체계**, VLSM은 **Subnet 크기를 가변적으로 설계하는 방법**에 초점이 있다.

## DHCP

DHCP(Dynamic Host Configuration Protocol, 단말에 IP·Gateway·DNS 같은 Network 설정을 자동 제공하는 Protocol)는 단말이 접속할 때 Network 설정을 자동으로 제공한다.

대표 흐름은 Discover → Offer → Request → Acknowledge이며, 앞 글자를 따서 DORA(Discover → Offer → Request → Acknowledge)라고 부른다. 단말은 아직 자기 주소를 모르므로 초기 메시지에 Broadcast를 사용한다. 다른 Subnet의 DHCP Server를 사용하면 Router의 DHCP Relay가 요청을 전달할 수 있다.

```text
Client                         DHCP Server
  │                                 │
  │──── Discover ──────────────────→│
  │←──── Offer ─────────────────────│
  │──── Request ───────────────────→│
  │←── Acknowledge ─────────────────│
```

DHCP가 주는 것은 IP 하나만이 아니다.

- IP Address
- Subnet Mask
- Default Gateway
- DNS Server
- Lease Time

가정 공유기가 휴대폰에 `192.168.x.x` 같은 사설 IP를 주는 것도 DHCP다. DHCP는 사설 IP 전용 기술이 아니므로 ISP가 공인 WAN 주소를 동적으로 할당하는 데도 사용할 수 있다.

임대 갱신은 기존 주소를 계속 사용할 수 있는지 확인하는 절차다. 다른 Network로 이동했거나 잘못된 설정이 남았을 때 Renew DHCP Lease로 IP·Gateway·DNS 정보를 다시 받을 수 있다.

> **DHCP = 주소와 Network 설정을 할당한다.**


## 다음 학습 — 주소 부족과 외부 통신

Subnet·CIDR·VLSM은 **주소 범위를 설계**하고 DHCP는 **주소 설정을 제공**한다. 사설 IP를 사용하는 단말이 외부 인터넷에 접속할 때의 NAT/PAT, IPv4 주소 부족과 IPv6 전환은 [IPv4 주소 부족 대응·NAT/PAT·IPv6 전환](IPv4-주소부족-NAT-IPv6-전환.md)에서 이어서 본다.
