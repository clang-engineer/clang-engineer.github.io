# IP 주소·NAT·DHCP·CIDR·VLSM

## 이 문서에서 되짚을 질문

- Subnetting, CIDR, VLSM은 어떤 관계인가?
- CIDR과 VLSM은 둘 다 `/24`, `/26`을 사용하는데 무엇이 다른가?
- VLSM을 왜 1차·2차 Subnetting처럼 설명하는가?
- DHCP와 NAT는 둘 다 IP와 관련되는데 정확히 무엇이 다른가?
- 여러 내부 IP가 하나의 공인 IP로 나갔다가 돌아올 때 어떻게 원래 단말을 찾는가?
- 애플리케이션이 출발지 Port를 지정하지 않아도 PAT가 가능한 이유는 무엇인가?

## 왜 이 순서로 학습하는가

이 개념들을 용어별로 외우기보다 **단말이 네트워크에 들어와 외부 Internet까지 나가는 과정**으로 연결하면 이해하기 쉽다.

```text
IP 주소가 있다
→ 어디까지 같은 Network인가?          Subnet
→ 주소 공간을 어떻게 효율적으로 나누나? CIDR / VLSM
→ 단말에 이 설정을 누가 주나?           DHCP
→ 사설 IP로 Internet에는 어떻게 나가나? NAT / PAT
```

> **Subnet은 범위를 정하고 → DHCP는 설정을 주고 → NAT는 Network 경계에서 주소를 바꾼다.**

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

> **Subnet = 나누어진 Network 자체**  
> **Subnetting = Network를 여러 Subnet으로 나누는 행위**

## CIDR과 Subnet

CIDR(Classless Inter-Domain Routing)은 Class A·B·C의 고정 경계를 버리고 `/24`, `/26`처럼 Prefix 길이로 Network 범위를 표현한다.

`/24`는 앞 24bit가 Network 부분이라는 뜻이다. Prefix가 길수록 Network 범위는 작아지고 Host 주소 수는 줄어든다.

`/24`에서 `/26`으로 Prefix가 길어졌다는 것은 Host에 쓸 bit를 2개 더 Network 구분에 사용한다는 뜻이다. 따라서 하나의 `/24`를 네 개의 `/26`으로 나눌 수 있다.

Subnetting은 큰 주소 범위를 더 작은 범위로 나누는 작업이고, Route Aggregation은 여러 연속 경로를 짧은 Prefix 하나로 묶는 작업이다.

> **Prefix 숫자가 커질수록 Network 범위는 작아진다.**

## VLSM

VLSM(Variable Length Subnet Mask)은 모든 Subnet을 같은 크기로 자르지 않는다.

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

> **Subnetting = Network를 나누는 상위 행위**  
> **VLSM = 필요한 크기별로 서로 다르게 나누는 설계 방법**  
> **CIDR = Class 없이 Prefix로 주소 범위를 표현·할당·집약하는 체계**

CIDR과 VLSM 모두 Prefix 표기를 사용하므로 비슷해 보이지만 보는 관점이 다르다.

## DHCP

DHCP(Dynamic Host Configuration Protocol)는 단말이 접속할 때 Network 설정을 자동으로 제공한다.

대표 흐름은 Discover → Offer → Request → Acknowledge이며 DORA라고 부른다. 단말은 아직 자기 주소를 모르므로 초기 메시지에 Broadcast를 사용한다. 다른 Subnet의 DHCP Server를 사용하면 Router의 DHCP Relay가 요청을 전달할 수 있다.

DHCP가 주는 것은 IP 하나만이 아니다.

- IP Address
- Subnet Mask
- Default Gateway
- DNS Server
- Lease Time

가정 공유기가 휴대폰에 `192.168.x.x` 같은 사설 IP를 주는 것도 DHCP다. DHCP는 사설 IP 전용 기술이 아니므로 ISP가 공인 WAN 주소를 동적으로 할당하는 데도 사용할 수 있다.

임대 갱신은 기존 주소를 계속 사용할 수 있는지 확인하는 절차다. 다른 Network로 이동했거나 잘못된 설정이 남았을 때 Renew DHCP Lease로 IP·Gateway·DNS 정보를 다시 받을 수 있다.

> **DHCP = 주소와 Network 설정을 할당한다.**

## NAT — DHCP와 왜 같이 보이는가

가정에서는 공유기가 DHCP Server이면서 NAT Router 역할도 함께 수행하기 때문에 두 기능이 하나처럼 느껴진다.

하지만 목적은 완전히 다르다.

```text
DHCP
→ 내부 단말에 사용할 Network 설정을 할당

NAT
→ 이미 주소를 가진 Packet이 Network 경계를 지날 때 주소를 변환
```

예를 들어 PC가 DHCP로 `192.168.0.10`을 받았다고 하자. 이 주소는 사설 IP이므로 Internet에서 그대로 Routing되지 않는다.

```text
PC 192.168.0.10
      ↓
   NAT Router
      ↓
공인 IP 203.0.113.5
      ↓
   Internet
```

DHCP와 NAT는 서로 필수 관계가 아니다. 수동으로 사설 IP를 설정해도 NAT를 사용할 수 있고, DHCP로 공인 IP를 직접 받는 환경에서는 NAT 없이 통신할 수도 있다.

## Static NAT / Dynamic NAT / PAT

### Static NAT

사설 IP 하나와 공인 IP 하나를 고정적으로 1:1 Mapping한다.

### Dynamic NAT

여러 공인 IP가 있는 Pool에서 필요한 순간 사용 가능한 공인 IP를 동적으로 Mapping한다.

### PAT / NAPT

가정에서 가장 익숙한 형태다. 여러 내부 단말이 **하나의 공인 IP**를 공유하고 Port까지 이용해 각 연결을 구분한다.

여기서 자연스럽게 생기는 질문이 있다.

> "밖으로 나갔다가 응답이 돌아올 때 어느 내부 PC로 보내야 하지?"

답은 NAT 장비가 **IP뿐 아니라 Port까지 포함한 변환 상태를 기억하기 때문**이다.

```text
내부
192.168.0.10:51001
192.168.0.11:52003

        ↓ PAT

외부
203.0.113.5:40001
203.0.113.5:40002
```

NAT 장비는 대략 다음 대응 관계를 상태 Table에 유지한다.

```text
203.0.113.5:40001 ↔ 192.168.0.10:51001
203.0.113.5:40002 ↔ 192.168.0.11:52003
```

응답이 `203.0.113.5:40002`로 돌아오면 두 번째 내부 연결로 되돌려 보내면 된다.

### 내부 애플리케이션이 Port를 지정하지 않으면

TCP/UDP 통신에는 Source Port와 Destination Port가 존재한다. 애플리케이션 개발자가 Source Port를 직접 지정하지 않아도 OS가 사용 가능한 **Ephemeral Port**를 배정한다.

따라서 일반적인 TCP/UDP 통신에서는 PAT가 연결을 구분할 Port 정보를 확보할 수 있다.

> **PAT가 가능한 핵심 = 연결을 IP뿐 아니라 Port까지 포함해 구분할 수 있기 때문**

## NAT의 효과와 한계

NAT는 IPv4 주소 부족을 완화하지만 종단 간 직접 연결을 어렵게 하고 상태 추적, Port Forwarding, P2P, 일부 Protocol을 복잡하게 만든다.

또한 NAT가 내부 주소를 외부에 직접 노출하지 않는 효과가 있다고 해서 Firewall을 대체하는 것은 아니다. NAT의 본질은 주소 변환이고 Firewall의 본질은 보안 정책에 따른 Traffic 허용·차단이다.

## IPv4와 IPv6로 연결하기

IPv4는 32bit 주소 공간의 한계 때문에 사설 IP + NAT가 광범위하게 사용된다. IPv6는 128bit 주소 공간으로 주소 부족 문제를 근본적으로 완화한다.

IPv6 특징에서 QoS나 IPsec '지원'이라는 표현이 나오면 **기능을 활용할 구조와 표준이 마련되어 있다는 의미**로 이해한다. 아무 설정 없이 QoS나 암호화가 자동 적용된다는 뜻은 아니다.

Flow Label 등은 QoS 처리에 활용할 수 있지만 IPv6 자체가 IntServ나 DiffServ 중 하나를 강제하는 것도 아니다. 실제 정책은 Network 운영자가 구성한다.

## 한 번에 연결하기

```text
Network 범위를 나눈다
→ Subnetting

필요한 크기대로 서로 다르게 나눈다
→ VLSM

Class 없이 Prefix로 주소를 표현·할당·집약한다
→ CIDR

단말에 Network 설정을 자동 배정한다
→ DHCP

사설 IP가 외부로 나갈 때 주소를 변환한다
→ NAT

공인 IP 하나를 여러 내부 연결이 공유한다
→ PAT / NAPT
→ Port까지 이용해 세션 식별

IPv4 주소 부족을 근본적으로 완화한다
→ IPv6
```
