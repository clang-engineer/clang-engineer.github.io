# 무선 매체 접근과 WLAN

## 유선 충돌에서 출발

과거 공유 Ethernet에서는 여러 장치가 같은 Cable을 사용했다. 동시에 전송하면 전기 신호가 충돌하므로 CSMA/CD(Carrier Sense Multiple Access with Collision Detection)를 사용했다.

장치는 전송 전에 매체를 듣고, 충돌을 감지하면 전송을 멈춘 뒤 무작위 시간 후 재시도한다. 현대 Switch 기반 Full-Duplex Ethernet에서는 각 Port가 충돌 영역을 분리하므로 CSMA/CD의 실질적 필요가 크게 줄었다.

## 무선은 왜 충돌하는가

무선 단말은 서로 별도 선을 쓰는 것이 아니라 같은 주파수 채널이라는 공유 매체를 사용한다. 두 단말의 전파가 Access Point에서 동시에 겹치면 AP가 Frame을 올바르게 해석하지 못할 수 있다.

무선 단말은 송신하면서 다른 신호를 정확히 듣기 어렵고 Hidden Node 문제도 있으므로 충돌을 안정적으로 탐지하기 어렵다. 그래서 탐지보다 회피를 사용한다.

## CSMA/CA

CSMA/CA(Carrier Sense Multiple Access with Collision Avoidance)의 기본 흐름은 다음과 같다.

채널이 사용 중인지 확인
→ 비어 있으면 일정 시간 대기
→ 무작위 Backoff 값 선택
→ Counter가 0이 되면 전송
→ 수신 측 ACK 확인
→ ACK가 없으면 충돌·손실로 보고 재전송

RTS/CTS는 송신 예정 구간을 주변 단말에 알려 Hidden Node 충돌을 줄일 수 있지만 제어 Frame 비용이 생긴다.

## WLAN 연결 흐름

1. 단말이 Beacon 또는 Probe로 Access Point 탐색
2. 인증과 Association 수행
3. 보안 방식에 따라 Key 협상
4. DHCP로 IP·Gateway·DNS 획득
5. ARP·Neighbor Discovery로 같은 망의 주소 해석
6. Gateway를 통해 외부망 통신
7. 이동하면 다른 AP로 Handover

무선 연결 문제는 이 계층을 나누어 진단해야 한다. AP가 보이지만 바로 끊어진다면 저장된 인증정보, 보안 방식, Driver, DHCP, AP 정책 등을 단계별로 확인한다.

## 기술사 답안 포인트

유선과 무선을 단순히 CSMA/CD 대 CSMA/CA로 암기하지 않는다. 공유 매체의 특성, 충돌 탐지 가능성, Hidden Node, Backoff, ACK·RTS/CTS의 비용을 연결해 설명한다.
