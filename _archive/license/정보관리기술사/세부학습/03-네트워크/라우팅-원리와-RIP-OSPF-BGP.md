# 라우팅 원리와 RIP·OSPF·BGP

## 이 문서에서 되짚을 질문

- Router는 목적지까지의 전체 길을 알고 Packet을 보내는가?
- Bellman-Ford와 Dijkstra의 차이가 Routing Protocol과 어떻게 연결되는가?
- RIP와 OSPF까지 이해했는데 BGP는 왜 갑자기 전혀 다른 방식인가?
- 인터넷 전체에 OSPF를 사용하면 왜 안 되는가?
- AS는 정확히 무엇이고 왜 필요한가?
- BGP는 왜 단순히 가장 짧은 경로를 선택하지 않는가?
- 무한에 가까운 Internet 경로마다 어떻게 정책을 정할 수 있는가?

## 왜 이 순서로 학습하는가

Routing Protocol 이름을 따로 외우기보다 **Network 규모와 관리 범위가 커지는 흐름**으로 보면 이해하기 쉽다.

```text
길을 어떻게 찾지?
→ Routing Algorithm

전체 지도 없이 이웃의 거리만 이용하면?
→ Distance Vector / Bellman-Ford / RIP

전체 Link 상태로 지도를 만들면?
→ Link State / Dijkstra / OSPF

그런데 Internet 전체 지도를 모두 가질 수 있나?
→ 규모상 부담이 너무 크다

Internet은 애초에 한 조직이 관리하나?
→ 아니다

관리 주체별 Network로 추상화
→ AS

AS와 AS 사이의 경로 선택
→ BGP / Path Vector / Policy
```

즉 **RIP → OSPF → BGP**는 단순 Protocol 나열이 아니라, 내부 Network의 경로 계산에서 Internet 규모의 조직 간 경로 선택으로 시야가 확장되는 과정이다.

## 라우팅이 필요한 이유

같은 Link 안에서는 MAC 주소로 Frame을 전달하지만 다른 Network로 가려면 Router가 목적지 IP에 맞는 다음 경로를 선택해야 한다.

Routing Table에는 목적지 Prefix, Next Hop, Interface, Metric 등이 기록된다.

Router는 목적지 IP와 Routing Table을 Longest Prefix Match 방식으로 비교한다. 가장 구체적으로 일치하는 경로를 선택하고, 없으면 Default Route를 사용할 수 있다.

Router가 매 Packet마다 목적지까지의 전체 이동 경로를 적어 보내는 것은 아니다.

```text
현재 Router
→ Routing Table 조회
→ 다음 Router(Next Hop)로 전달
→ 다음 Router도 자기 Routing Table 조회
→ 반복
```

> **Routing Algorithm = 좋은 경로를 계산하는 방법**  
> **Routing Protocol = Router들이 경로 정보를 교환하고 Routing Table을 만드는 규칙**

실제 Packet Forwarding은 이미 만들어진 Table을 조회하는 과정이다.

## Distance Vector와 Bellman-Ford

Distance Vector의 생각은 단순하다.

> "내가 전체 지도를 알 필요 없이 이웃에게 목적지까지 얼마나 먼지만 물어보자."

각 Router는 이웃이 알려준 거리와 자기 Link 비용을 합쳐 더 좋은 경로를 찾는다.

- 대표 Protocol: RIP
- 대표 계산 원리: Bellman-Ford
- 대표 Metric: Hop Count
- 장점: 구조가 단순
- 한계: 느린 수렴, Routing Loop, Count-to-Infinity
- 보완: Split Horizon, Route Poisoning, Hold-down 등

```text
A → B → C → D

A에서 D까지
= 3 Hop
```

RIP는 쉽게 말하면 **목적지까지 몇 개의 Router를 거치는가**를 중요한 거리 기준으로 본다.

## Link State와 Dijkstra

이번에는 생각을 바꾼다.

> "이웃 말만 듣지 말고 Link 상태를 공유해서 전체 지도를 만들자."

각 Router가 영역의 Link 상태를 공유하고 Topology 지도를 만든 뒤 자기 자신을 기준으로 최단경로 Tree를 계산한다.

```text
Link State 수집
      ↓
전체 Topology 지도
      ↓
Dijkstra(SPF)
      ↓
내 위치 기준 최단경로 Tree
      ↓
Routing Table
```

- 대표 Protocol: OSPF
- Algorithm: Dijkstra
- 판단: Link Cost
- 장점: 빠른 수렴, 정교한 내부 경로 계산
- 비용: 상태 정보 교환, Memory, CPU, Area 설계

RIP가 "몇 Hop인가?"에 가깝다면 OSPF는 **전체 지도를 바탕으로 Cost가 가장 낮은 경로를 직접 계산한다.**

## 여기서 왜 BGP가 갑자기 다른 방식인가

OSPF까지 보면 자연스럽게 이런 생각이 든다.

> "OSPF가 더 정교한데 Internet 전체도 OSPF로 하면 안 되나?"

이 질문에서 BGP가 필요한 이유가 나온다.

### 문제 1. Internet 규모

OSPF는 Topology 정보를 유지하고 Dijkstra를 계산한다. Internet 전체를 하나의 OSPF 영역처럼 만든다고 생각하면 각 Router가 엄청난 정보를 가져야 한다.

- 방대한 Topology 정보 저장
- Link State 변경 Flooding
- SPF 재계산 CPU 비용
- 수렴 부담

즉 IGP 방식의 세부 Topology 공유를 Internet 전체 규모로 그대로 확장하기 어렵다.

### 문제 2. Internet은 하나의 관리 조직이 아니다

이 문제가 더 본질적이다.

```text
KT
SK
LG
Google
AWS
NAVER
...
```

각 조직은 자기 Network와 운영 정책을 가진다. 따라서 Internet 전체를 한 회사 내부 Network처럼 하나의 Cost 기준으로 최단경로 계산하는 것 자체가 관리 구조와 맞지 않는다.

> **BGP가 필요한 핵심 이유 = Internet 규모의 확장성 + 조직별 독립적인 Routing Policy**

## AS — Internet을 관리 단위로 추상화

AS(Autonomous System)는 **하나의 관리 주체와 일관된 Routing Policy 아래 운영되는 Network 집합**이다.

```text
[ AS A 내부 ]
R1 ─ R2 ─ R3
    OSPF 등
       │
======= AS 경계 =======
       │
      BGP
       │
======= AS 경계 =======
       │
[ AS B 내부 ]
R1 ─ R2 ─ R3
```

AS A의 Router가 AS B 내부의 모든 Router와 Link 구조를 알 필요는 없다.

> **AS 내부에서 어느 Router를 탈지 = IGP**  
> **어느 AS를 거쳐 목적지 AS로 갈지 = BGP**

이 계층화가 거대한 Internet을 관리할 수 있게 하는 중요한 추상화다.

## BGP와 Path Vector

BGP(Border Gateway Protocol)는 AS 사이에서 목적지 Prefix까지 갈 수 있는 경로를 교환한다.

경로 정보에는 `AS-PATH`처럼 지금까지 거쳐 온 AS 번호 목록과 여러 Path Attribute가 포함된다.

```text
AS100 → AS200 → AS300 → 목적지 Prefix
```

그래서 Path Vector 방식이라고 설명한다.

세 Protocol의 질문을 비교하면 이해하기 쉽다.

```text
RIP
→ 몇 Hop인가?

OSPF
→ Cost가 얼마인가?

BGP
→ 어떤 AS들을 거치는가?
  + 우리 정책상 어떤 경로를 선호하는가?
```

## 왜 BGP는 최단 경로만 고르지 않는가

Internet의 AS들은 독립적인 회사·기관일 수 있다. 그래서 경로에는 기술적 거리뿐 아니라 현실적인 운영 조건이 들어간다.

- Transit 비용
- Peering 계약
- 특정 사업자 선호
- 보안 정책
- 장애 회피
- Traffic Engineering

예를 들어:

```text
경로 A: 우리 AS → X → AWS
경로 B: 우리 AS → Y → Z → AWS
```

A가 AS 수로는 더 짧더라도 사업·운영 정책 때문에 B를 선택할 수 있다.

> **BGP의 '좋은 경로'는 반드시 가장 짧은 경로가 아니라 조직의 Policy를 가장 잘 만족하는 경로다.**

## 그럼 무한에 가까운 목적지마다 정책을 설정하는가

아니다. 운영자가 Internet의 모든 IP 하나하나에 규칙을 작성하면 관리할 수 없다.

BGP Policy는 보통 다음처럼 **묶음 단위**로 적용한다.

- IP Prefix
- AS 번호
- BGP Community
- Local Preference 등 Path Attribute

예를 들어:

```text
특정 고객 Prefix
→ 고객 회선 우선

특정 AS에서 배운 경로
→ Local Preference 높임

특정 Route Group
→ 외부 광고 제한
```

따라서 정책의 주체와 실행 주체를 구분하면 된다.

> **Policy의 의도 = AS를 운영하는 조직이 결정**  
> **Policy의 실행 = BGP Router 설정이 수행**

## RIP·OSPF·BGP 핵심 비교

| 구분 | RIP | OSPF | BGP |
|---|---|---|---|
| 범위 | AS 내부 | AS 내부 | AS 간 |
| 방식 | Distance Vector | Link State | Path Vector |
| 기반 원리 | Bellman-Ford | Dijkstra | BGP Decision Process |
| 대표 판단 | Hop Count | Cost | Path Attribute + Policy |
| 정보 관점 | 이웃이 알려주는 거리 | 내부 Topology 지도 | AS 단위 경로 |
| 핵심 | 단순 | 빠른 수렴·정교한 내부 경로 | 확장성·정책 |

## 기억 흐름

```text
전체 지도 없이 이웃 거리만 이용
→ Distance Vector
→ Bellman-Ford
→ RIP

전체 Link State로 지도 생성
→ Dijkstra
→ OSPF

그런데 Internet 전체 지도는 너무 크다
+ 조직마다 Policy가 다르다
→ AS로 관리 영역 추상화

AS 내부
→ IGP

AS 사이
→ BGP
→ AS-PATH + Path Attribute + Policy
```

BGP를 단순히 "Internet에서 쓰는 Routing Protocol"로 외우기보다 **왜 IGP 방식만으로는 Internet을 운영하기 어려운지**에서 출발하면 Path Vector와 Policy 기반 Routing이 자연스럽게 연결된다.
