# 라우팅 원리와 RIP·OSPF·BGP

## 라우팅이 필요한 이유

같은 Link 안에서는 MAC 주소로 Frame을 전달하지만, 다른 네트워크로 가려면 Router가 목적지 IP에 맞는 다음 경로를 선택해야 한다. Routing Table에는 목적지 Prefix, Next Hop, Interface, Metric 등이 기록된다.

Router는 목적지 IP와 Routing Table을 Longest Prefix Match 방식으로 비교한다. 가장 구체적으로 일치하는 경로를 선택하고, 없으면 Default Route를 사용한다.

## 두 가지 기본 계산 관점

### 거리 벡터와 Bellman-Ford

각 Router는 이웃이 알려준 거리와 자기 Link 비용을 합쳐 더 좋은 경로를 찾는다.

- 대표: RIP
- 장점: 구조가 단순하다.
- 한계: 느린 수렴, Routing Loop, Count-to-Infinity 문제가 생길 수 있다.
- 보완: Split Horizon, Route Poisoning, Hold-down 등

### 링크 상태와 Dijkstra

각 Router가 영역의 Link 상태를 공유하고 전체 Topology 지도를 만든 뒤 자기 자신을 기준으로 최단경로 트리를 계산한다.

- 대표: OSPF
- 장점: 빠른 수렴과 규모 확장에 유리하다.
- 비용: 상태 정보 교환·메모리·CPU 사용과 영역 설계가 필요하다.

## RIP·OSPF·BGP

RIP과 OSPF는 한 조직 내부의 경로를 다루는 IGP다. RIP는 Hop Count를 사용하고, OSPF는 Link Cost와 Area 구조를 사용한다.

BGP(Border Gateway Protocol)는 인터넷의 Autonomous System 사이에서 경로를 교환하는 EGP다. 단순 최단거리보다 사업자 정책, AS Path, Local Preference 등 정책 속성을 중요하게 본다. BGP는 Path Vector 방식으로 설명한다.

## 핵심 비교

- RIP: 단순성, 작은 망, Hop Count, 거리 벡터
- OSPF: 빠른 수렴, 큰 내부망, Cost, 링크 상태
- BGP: AS 간 정책 Routing, Path Vector, 인터넷 규모

## 기억 흐름

다른 네트워크로 전달 필요
→ Routing Table과 Prefix Match
→ 내부망에서는 거리 벡터 또는 링크 상태 선택
→ 조직 경계 밖에서는 BGP 정책 Routing
→ 경로 변화 시 수렴 속도·Loop·안정성 관리
