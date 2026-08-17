# VLAN·서브넷·브로드캐스트 도메인

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

## VLAN 사이 통신

서로 다른 VLAN은 Layer 2에서 분리되어 있으므로 직접 통신할 수 없다. 통신하려면 Router 또는 L3 Switch가 필요하다.

단말은 목적지 IP가 자기 Subnet 밖에 있음을 확인하고 Default Gateway의 MAC 주소로 Frame을 보낸다. L3 Switch는 Routing Table을 보고 목적지 VLAN으로 Packet을 전달하고, 그 VLAN의 Frame으로 다시 캡슐화한다. 이를 Inter-VLAN Routing이라고 한다.

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
