# VLAN·서브넷·브로드캐스트 도메인

## 이 문서에서 되짚을 질문

- VLAN과 Subnet은 둘 다 망을 나누는데 왜 서로 다른 개념인가?
- Switch를 사용하면 Broadcast Domain도 자동으로 나뉘는가?
- 서로 다른 VLAN의 단말은 왜 Router나 L3 Switch를 거쳐야 하는가?

## 출발점

세 개념은 모두 네트워크를 나누는 것처럼 보이지만 기준 계층과 목적이 다르다.

- 브로드캐스트 도메인: 한 장치가 보낸 Layer 2 Broadcast가 도달하는 범위
- VLAN: 하나의 물리 Switch를 여러 논리적 Layer 2 망으로 분리하는 기술
- Subnet: 하나의 IP 네트워크를 Prefix 기준으로 나눈 Layer 3 주소 범위

## VLAN과 브로드캐스트 도메인

Switch는 기본적으로 Broadcast Frame을 같은 VLAN의 모든 Port로 전달한다. VLAN을 나누면 서로 다른 VLAN으로 Broadcast가 넘어가지 않는다. 따라서 VLAN 하나가 일반적으로 하나의 Broadcast Domain을 만든다.

물리 Switch 한 대에 여러 VLAN을 만들 수 있고, 여러 Switch에 걸쳐 같은 VLAN을 구성할 수도 있다. 물리 장비 수와 Broadcast Domain 수는 같지 않다.

Access Port는 보통 하나의 VLAN에 속한 단말을 연결한다. Trunk Port는 VLAN Tag를 붙여 여러 VLAN의 Frame을 Switch 사이 또는 Switch와 Router 사이에 전달한다.

## Subnet과 VLAN의 관계

VLAN은 Layer 2 분리이고 Subnet은 Layer 3 주소 분리다. 실무에서는 관리와 Routing을 단순하게 하기 위해 보통 VLAN 하나에 Subnet 하나를 대응시킨다. 그러나 둘은 정의상 같은 개념이 아니다.

같은 VLAN에 서로 다른 Subnet을 둘 수도 있지만 통신과 운영이 복잡해진다. 서로 다른 VLAN에 같은 Subnet을 배치하는 것도 일반적인 설계가 아니다.

여기서 가장 중요한 구분은 **VLAN은 Frame이 퍼지는 범위를 나누고, Subnet은 IP 주소상 같은 망인지 판단하는 범위를 나눈다**는 것이다. 둘은 서로 다른 계층의 개념이지만, 실제 설계에서는 경계를 일치시켜야 이해와 운영이 쉬워진다.

예를 들어 한 Switch에 인사팀과 개발팀 단말이 함께 연결되어 있다고 하자. Port를 VLAN 10과 VLAN 20으로 나누면 두 팀의 Broadcast Frame은 서로 넘어가지 않는다. 여기에 VLAN 10은 `192.168.10.0/24`, VLAN 20은 `192.168.20.0/24`를 배정하면 Layer 2 경계와 Layer 3 경계가 같은 위치에 놓인다.

## VLAN 사이 통신

서로 다른 VLAN은 Layer 2에서 분리되어 있으므로 직접 통신할 수 없다. 통신하려면 Router 또는 L3 Switch가 필요하다.

단말은 목적지 IP가 자기 Subnet 밖에 있음을 확인하고 Default Gateway의 MAC 주소로 Frame을 보낸다. L3 Switch는 Routing Table을 보고 목적지 VLAN으로 Packet을 전달하고, 그 VLAN의 Frame으로 다시 캡슐화한다. 이를 Inter-VLAN Routing이라고 한다.

이때 단말이 목적지 단말의 MAC 주소를 직접 찾는 것이 아니다. 목적지 IP가 다른 Subnet에 있으므로 **Gateway의 MAC 주소**를 찾아 Frame을 보낸다. Router는 IP Packet의 목적지를 보고 다음 망으로 넘기면서, 출발지·목적지 MAC 주소가 새 Link에 맞게 바뀐 Frame을 만든다. IP Packet은 망 사이를 이동하지만 Frame은 Link마다 새로 만들어진다는 점이 핵심이다.

## 혼동하지 않을 것

- Switch가 있다고 항상 Broadcast Domain이 여러 개인 것은 아니다.
- VLAN이 없으면 Switch 전체가 대체로 하나의 Broadcast Domain이다.
- Router 또는 L3 경계는 Broadcast를 다른 망으로 전달하지 않는다.
- VLAN은 보안 장치 자체가 아니다. 논리 분리를 제공하지만 ACL·Firewall·접근통제가 별도로 필요하다.

## 기억 흐름

물리 Switch를 여러 논리 망으로 나눌 필요
→ VLAN으로 Layer 2 분리
→ VLAN마다 Broadcast 범위 분리
→ IP 주소 범위는 Subnet으로 설계
→ VLAN 간 통신은 L3 Switch·Router가 담당
