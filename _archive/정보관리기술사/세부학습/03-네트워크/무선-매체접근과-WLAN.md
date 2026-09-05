# 무선 매체 접근과 WLAN

## 이 문서에서 되짚을 질문

- 무선 단말은 선이 없는데 서로 다른 회선을 쓰는 것 아닌가?
- 유선은 충돌을 탐지하고 무선은 왜 충돌을 회피하는가?
- Wi-Fi 이름이 보이는 것과 실제 IP 통신이 되는 것은 왜 다른가?

## 유선 충돌에서 출발

과거 공유 Ethernet에서는 여러 장치가 같은 Cable을 사용했다. 동시에 전송하면 전기 신호가 충돌하므로 CSMA/CD(Carrier Sense Multiple Access with Collision Detection)를 사용했다.

장치는 전송 전에 매체를 듣고, 충돌을 감지하면 전송을 멈춘 뒤 무작위 시간 후 재시도한다. 현대 Switch 기반 Full-Duplex Ethernet에서는 각 Port가 충돌 영역을 분리하므로 CSMA/CD의 실질적 필요가 크게 줄었다.

```text
공유 Ethernet
   ↓
여러 장치가 같은 매체 사용
   ↓
동시 송신 발생
   ↓
Collision 감지
   ↓
전송 중단
   ↓
Random Backoff 후 재시도
```

## 무선은 왜 충돌하는가

무선 단말은 서로 별도 선을 쓰는 것이 아니라 같은 주파수 채널이라는 공유 매체를 사용한다. 두 단말의 전파가 Access Point에서 동시에 겹치면 AP가 Frame을 올바르게 해석하지 못할 수 있다.

무선 단말은 송신하면서 다른 신호를 정확히 듣기 어렵고 Hidden Node 문제도 있으므로 충돌을 안정적으로 탐지하기 어렵다. 그래서 탐지보다 회피를 사용한다.

무선에서는 단말마다 전용 회선이 주어지는 것이 아니다. 같은 AP의 같은 채널을 쓰는 단말은 같은 공기와 주파수 자원을 시간으로 나눠 사용한다. 주파수 대역이나 채널이 다르면 간섭을 줄일 수 있지만, 같은 채널 안에서는 여전히 공유 매체다.

```text
단말 A ─┐
단말 B ─┼─ 같은 Channel ─→ Access Point ─→ 유선 Network
단말 C ─┘

같은 Channel 안에서는 여러 단말이 같은 무선 매체를 공유한다.
```

유선 장치는 Cable에서 보낸 신호와 실제 신호를 비교해 충돌을 알아챌 수 있었다. 무선 단말은 자기 송신 신호가 너무 강해 송신 중 다른 단말의 약한 신호를 제대로 듣기 어렵다. 따라서 충돌이 난 뒤 즉시 탐지하기보다, 먼저 듣고 무작위로 기다린 다음 ACK가 오지 않으면 실패로 판단한다.

## CSMA/CA

CSMA/CA(Carrier Sense Multiple Access with Collision Avoidance)의 기본 흐름은 다음과 같다.

```text
채널이 사용 중인지 확인
        ↓
사용 중이면 대기
        ↓
비어 있으면 IFS 대기
        ↓
Random Backoff 선택
        ↓
Counter가 0이 되면 전송
        ↓
수신 측 ACK 확인
        ↓
ACK가 없으면 충돌·손실로 보고 재전송
```

RTS/CTS는 송신 예정 구간을 주변 단말에 알려 Hidden Node 충돌을 줄일 수 있지만 제어 Frame 비용이 생긴다.

Hidden Node는 두 단말이 서로의 전파는 듣지 못하지만 같은 AP에는 도달하는 상황이다. 두 단말은 각자 채널이 비었다고 생각해 동시에 보낼 수 있다. RTS/CTS를 사용하면 AP의 CTS를 들은 주변 단말이 일정 시간 전송을 미루므로 이런 충돌을 줄일 수 있다.

```text
단말 A와 단말 B는 서로 신호를 듣지 못함
하지만 둘 다 AP에는 도달 가능

단말 A ── RTS ──→ AP
단말 A ←─ CTS ─── AP ── CTS ──→ 단말 B
                         ↓
                     단말 B는 NAV 설정 후 대기

단말 A ── DATA ──→ AP
단말 A ←─ ACK ─── AP
```

## WLAN 연결 흐름

```text
1. AP 탐색
   Beacon / Probe
        ↓
2. Authentication
        ↓
3. Association
        ↓
4. 보안 Key 협상
        ↓
5. DHCP
   IP / Gateway / DNS 획득
        ↓
6. ARP / Neighbor Discovery
        ↓
7. 외부망 통신
        ↓
8. 이동 시 Roaming / Handover
```

무선 연결 문제는 이 계층을 나누어 진단해야 한다. AP가 보이지만 바로 끊어진다면 저장된 인증정보, 보안 방식, Driver, DHCP, AP 정책 등을 단계별로 확인한다.

따라서 “AP가 검색된다”는 것은 무선 신호를 발견했다는 뜻일 뿐이다. 인증 실패라면 Association·보안 단계에서 끊기고, DHCP 실패라면 Wi-Fi 연결 표시는 떠도 정상 IP를 받지 못한다. 저장된 비밀번호·보안정보 삭제, Driver 확인, DHCP 임대 갱신은 서로 다른 단계를 고치는 조치다.

## 기술사 답안 포인트

유선과 무선을 단순히 CSMA/CD 대 CSMA/CA로 암기하지 않는다. 공유 매체의 특성, 충돌 탐지 가능성, Hidden Node, Backoff, ACK·RTS/CTS의 비용을 연결해 설명한다.
