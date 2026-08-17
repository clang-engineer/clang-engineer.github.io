# IP 주소·NAT·DHCP·CIDR·VLSM

## 전체 관계

이 개념들은 모두 IP 주소와 관련되지만 역할이 다르다.

- CIDR: Prefix 길이로 네트워크 주소 범위를 표현하고 묶는 방식
- VLSM: 필요한 Host 수에 따라 서로 다른 크기의 Subnet을 배정하는 설계 기법
- DHCP: 단말에 IP·Gateway·DNS 등의 설정을 자동으로 임대
- NAT: Packet이 경계를 지날 때 IP 주소나 Port를 변환

## CIDR과 Subnet

CIDR(Classless Inter-Domain Routing)은 Class A·B·C의 고정 경계를 버리고 /24, /26처럼 Prefix 길이로 네트워크 범위를 표현한다.

/24는 앞 24bit가 네트워크 부분이라는 뜻이다. Prefix가 길수록 네트워크는 작아지고 Host 주소 수는 줄어든다. Subnetting은 큰 주소 범위를 더 작은 범위로 나누는 작업이고, Route Aggregation은 여러 연속 경로를 짧은 Prefix 하나로 묶는 작업이다.

## VLSM

VLSM(Variable Length Subnet Mask)은 모든 Subnet을 같은 크기로 자르지 않는다. 사용자 100명 구간에는 큰 Subnet, 장비 10대 구간에는 작은 Subnet을 배정해 주소 낭비를 줄인다.

설계할 때는 필요한 Host 수가 큰 구간부터 배치하고, 네트워크 주소·Broadcast 주소·사용 가능한 Host 범위를 확인한다.

## DHCP

DHCP(Dynamic Host Configuration Protocol)는 단말이 접속할 때 네트워크 설정을 자동으로 제공한다.

대표 흐름은 Discover → Offer → Request → Acknowledge다. 이를 DORA라고 부른다. 단말은 아직 자기 주소를 모르므로 초기 메시지에 Broadcast를 사용한다. 다른 Subnet의 DHCP Server를 사용하면 Router의 DHCP Relay가 요청을 전달한다.

임대 갱신은 기존 주소를 계속 사용할 수 있는지 확인하는 절차다. Renew DHCP Lease는 새 무선망에 이동했거나 잘못된 설정이 남았을 때 주소·Gateway·DNS 정보를 다시 받는 데 사용한다.

## NAT

NAT(Network Address Translation)는 내부 사설 IP와 외부 공인 IP를 변환한다. 여러 내부 단말이 하나의 공인 IP를 공유할 때는 Port까지 변환하는 PAT 또는 NAPT가 주로 사용된다.

NAT는 IPv4 주소 부족을 완화하지만 종단 간 직접 연결을 어렵게 하고, 상태 추적·Port Forwarding·P2P·일부 보안 프로토콜을 복잡하게 만든다. NAT가 내부 주소를 숨긴다고 해서 Firewall을 대체하는 것은 아니다.

## 한 번에 연결하기

주소 범위를 CIDR로 표현
→ 필요한 규모에 따라 VLSM으로 Subnet 설계
→ DHCP가 단말에 주소 설정을 자동 배정
→ NAT가 외부 통신 시 주소·Port를 변환
