# IP 주소·NAT·DHCP·CIDR·VLSM

## 이 문서에서 되짚을 질문

- CIDR과 VLSM은 둘 다 `/24`, `/26`을 사용하는데 무엇이 다른가?
- DHCP는 주소를 만들고 NAT는 주소를 나누어 주는 기술인가?
- 다른 Wi-Fi로 이동한 뒤 DHCP 임대를 갱신하면 무엇이 달라지는가?

## 전체 관계

이 개념들은 모두 IP 주소와 관련되지만 역할이 다르다.

- CIDR: Prefix 길이로 네트워크 주소 범위를 표현하고 묶는 방식
- VLSM: 필요한 Host 수에 따라 서로 다른 크기의 Subnet을 배정하는 설계 기법
- DHCP: 단말에 IP·Gateway·DNS 등의 설정을 자동으로 임대
- NAT: Packet이 경계를 지날 때 IP 주소나 Port를 변환

## CIDR과 Subnet

CIDR(Classless Inter-Domain Routing)은 Class A·B·C의 고정 경계를 버리고 /24, /26처럼 Prefix 길이로 네트워크 범위를 표현한다.

/24는 앞 24bit가 네트워크 부분이라는 뜻이다. Prefix가 길수록 네트워크는 작아지고 Host 주소 수는 줄어든다. Subnetting은 큰 주소 범위를 더 작은 범위로 나누는 작업이고, Route Aggregation은 여러 연속 경로를 짧은 Prefix 하나로 묶는 작업이다.

`/24`에서 `/26`으로 Prefix가 길어졌다는 것은 Host에 쓸 bit를 2개 더 네트워크 구분에 사용한다는 뜻이다. 따라서 하나의 `/24`를 네 개의 `/26`으로 나눌 수 있다. **숫자가 커질수록 망의 범위는 작아진다**고 기억하면 계산 방향을 헷갈리지 않는다.

## VLSM

VLSM(Variable Length Subnet Mask)은 모든 Subnet을 같은 크기로 자르지 않는다. 사용자 100명 구간에는 큰 Subnet, 장비 10대 구간에는 작은 Subnet을 배정해 주소 낭비를 줄인다.

설계할 때는 필요한 Host 수가 큰 구간부터 배치하고, 네트워크 주소·Broadcast 주소·사용 가능한 Host 범위를 확인한다.

CIDR은 주소 범위를 Class 없이 Prefix로 **표현하는 체계**이고, VLSM은 그 표현을 이용해 서로 다른 크기의 Subnet을 **설계하는 방법**이다. 예를 들어 `/24` 안에서 100대 부서는 `/25`, 50대 부서는 `/26`, 10대 장비망은 `/28`처럼 크기를 다르게 잡는 것이 VLSM이다.

## DHCP

DHCP(Dynamic Host Configuration Protocol)는 단말이 접속할 때 네트워크 설정을 자동으로 제공한다.

대표 흐름은 Discover → Offer → Request → Acknowledge다. 이를 DORA라고 부른다. 단말은 아직 자기 주소를 모르므로 초기 메시지에 Broadcast를 사용한다. 다른 Subnet의 DHCP Server를 사용하면 Router의 DHCP Relay가 요청을 전달한다.

임대 갱신은 기존 주소를 계속 사용할 수 있는지 확인하는 절차다. Renew DHCP Lease는 새 무선망에 이동했거나 잘못된 설정이 남았을 때 주소·Gateway·DNS 정보를 다시 받는 데 사용한다.

DHCP가 주는 것은 IP 하나만이 아니다. Subnet Mask, Default Gateway, DNS Server, 임대시간 등 **통신에 필요한 설정 묶음**을 준다. 따라서 AP에는 연결됐지만 외부 통신이나 이름 조회가 안 된다면, 무선 신호뿐 아니라 DHCP에서 받은 Gateway·DNS도 확인해야 한다.

## NAT

NAT(Network Address Translation)는 내부 사설 IP와 외부 공인 IP를 변환한다. 여러 내부 단말이 하나의 공인 IP를 공유할 때는 Port까지 변환하는 PAT 또는 NAPT가 주로 사용된다.

NAT는 IPv4 주소 부족을 완화하지만 종단 간 직접 연결을 어렵게 하고, 상태 추적·Port Forwarding·P2P·일부 보안 프로토콜을 복잡하게 만든다. NAT가 내부 주소를 숨긴다고 해서 Firewall을 대체하는 것은 아니다.

DHCP와 NAT는 자주 함께 보이지만 역할이 완전히 다르다. DHCP는 내부 단말에 사용할 설정을 임대하고, NAT는 이미 주소를 가진 Packet이 망의 경계를 지날 때 주소를 바꾼다. 가정용 공유기는 두 기능을 모두 수행하기 때문에 하나처럼 느껴질 뿐이다.

## 한 번에 연결하기

주소 범위를 CIDR로 표현
→ 필요한 규모에 따라 VLSM으로 Subnet 설계
→ DHCP가 단말에 주소 설정을 자동 배정
→ NAT가 외부 통신 시 주소·Port를 변환
