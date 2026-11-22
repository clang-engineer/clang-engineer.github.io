# IPv4 주소 부족 대응·NAT/PAT·IPv6 전환

IPv4의 주소 공간 부족에 대응하는 **기존 주소 효율화**와 **IPv6로 주소 공간 확대**를 비교한다. IP 주소 범위를 나누거나 단말에 주소를 할당하는 과정은 [IP 주소 설계·할당](IP-주소-NAT-DHCP-CIDR-VLSM.md)에서 먼저 본다.

```text
IPv4 주소 부족
├─ 기존 IPv4 효율화
│  ├─ 사설 IP — 내부망마다 주소 재사용
│  ├─ NAT/PAT — 주소·포트 변환과 공인 IP 공유
│  └─ CIDR — 주소 할당·경로 집약 효율화
└─ 주소 공간 확대
   └─ IPv6 — 128bit
      ├─ 주소 유형·사용 범위
      └─ 기존 IPv4와 공존·전환
```

**복습 범위:** Topic 23 IP 주소 부족 해결(A) · 24 IPv6(A) · 25 IPv6 주소 구성·분류(B) · 28 NAT(A). 등급은 현재 잠정 학습등급표 기준이다.

## NAT와 DHCP는 무엇이 다른가

NAT(Network Address Translation, Network 경계를 지나는 Packet의 IP 주소를 변환하는 방식)는 가정에서는 공유기의 DHCP Server 기능과 함께 동작하는 경우가 많아 두 기능이 하나처럼 느껴진다.

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

PAT(Port Address Translation, Port까지 변환해 여러 내부 연결이 하나의 공인 IP를 공유하게 하는 방식) 또는 NAPT(Network Address and Port Translation)는 가정에서 가장 익숙한 형태다. 여러 내부 단말이 **하나의 공인 IP**를 공유하고 Port까지 이용해 각 연결을 구분한다.

여기서 자연스럽게 생기는 질문이 있다.

> "밖으로 나갔다가 응답이 돌아올 때 어느 내부 PC로 보내야 하지?"

답은 NAT 장비가 **IP뿐 아니라 Port까지 포함한 변환 상태를 기억하기 때문**이다.

```text
내부                              외부

192.168.0.10:51001 ── PAT ──→ 203.0.113.5:40001
192.168.0.11:52003 ── PAT ──→ 203.0.113.5:40002

Internet에서 :40001로 응답
→ 192.168.0.10:51001로 복원

Internet에서 :40002로 응답
→ 192.168.0.11:52003로 복원
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

## IPv4 주소 부족과 IPv6로 연결하기

IPv4는 32bit 주소 공간의 한계 때문에 사설 IP + NAT가 광범위하게 사용된다. IPv6는 128bit 주소 공간으로 주소 부족 문제를 근본적으로 완화한다.

IPv4 주소 부족에 대한 접근은 **기존 주소 효율화(사설 IP·NAT/PAT·CIDR)**와 **주소 공간 확대(IPv6)**로 구분한다. 사설 IP는 내부망별 주소 재사용, NAT/PAT는 주소·포트 변환이며, IPv6는 128bit 주소 공간을 제공한다.

### IPv6 주소 체계와 전환

```text
IPv6
├─ 주소 표현 — 128bit · 16진수 8그룹 · 연속된 0의 축약(::)
├─ 전달 대상 — Unicast / Multicast / Anycast (Broadcast 없음)
├─ 사용 범위 — Global Unicast / Link-Local / Unique Local
└─ IPv4 공존·전환
   ├─ Dual Stack — IPv4·IPv6 동시 지원
   ├─ Tunneling — 다른 프로토콜 망을 통해 캡슐화 전달
   └─ Translation — IPv4·IPv6 간 프로토콜 변환
```

IPv4와 IPv6는 주소 길이만 다른 표기법이 아니라 패킷 구조가 다른 프로토콜이므로, 기존 IPv4 장비·서비스와 공존하며 단계적으로 전환해야 한다. IPv6 주소 유형의 **전달 대상**과 **사용 범위**는 서로 다른 분류 기준이다. Prefix별 세부 비트 구조보다 주소 부족 해결·공존 전략을 우선 복습한다.

IPv6 특징에서 QoS나 IPsec '지원'이라는 표현이 나오면 **기능을 활용할 구조와 표준이 마련되어 있다는 의미**로 이해한다. 아무 설정 없이 QoS나 암호화가 자동 적용된다는 뜻은 아니다.

Flow Label 등은 QoS 처리에 활용할 수 있지만 IPv6 자체가 IntServ나 DiffServ 중 하나를 강제하는 것도 아니다. 실제 정책은 Network 운영자가 구성한다.



## 핵심 인출

- 사설 IP는 서로 다른 내부망에서 재사용 가능하지만 인터넷에서 그대로 라우팅되지 않는다.
- NAT는 IP 주소 변환, PAT(NAPT)는 포트까지 이용한 변환으로 다수 연결이 공인 IP를 공유할 수 있게 한다.
- IPv6는 주소 공간을 확장하지만 IPv4와 직접 호환되지 않아 Dual Stack·Tunneling·Translation 등 전환 방식이 필요하다.
- NAT는 주소 변환이지 방화벽 자체가 아니며, IPv6도 보안·QoS가 자동 적용되는 것은 아니다.
