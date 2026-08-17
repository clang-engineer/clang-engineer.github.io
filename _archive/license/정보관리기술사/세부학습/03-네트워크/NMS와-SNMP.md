# NMS와 SNMP

## 기본 구조

NMS(Network Management System)는 여러 네트워크 장비의 상태·성능·장애·구성을 통합 관리한다. SNMP(Simple Network Management Protocol)는 NMS Manager와 장비의 Agent가 관리 정보를 주고받는 대표 프로토콜이다.

- Manager: 조회·설정·수집·경보 처리를 담당
- Agent: 장비 내부 상태를 MIB 형태로 제공
- MIB: 관리 객체의 이름·형식·계층을 정의한 정보 구조
- OID: MIB 객체를 식별하는 계층형 번호

## Polling과 Trap

### Polling

Manager가 일정 주기로 Agent에 값을 요청한다.

장점:
- 중앙에서 수집 주기와 대상을 통제한다.
- 장비별 상태를 같은 기준으로 비교하기 쉽다.
- Agent가 임의로 많은 정보를 보내는 것을 제한한다.

한계:
- 장비와 항목이 많으면 요청 Traffic과 NMS 부하가 커진다.
- Polling 사이에 발생하고 사라진 짧은 장애를 놓칠 수 있다.

### Trap·Inform

Agent가 장애나 임계치 초과 같은 Event를 Manager에 알린다.

- Trap: 응답 확인 없이 전송하므로 빠르지만 유실될 수 있다.
- Inform: 수신 확인을 받아 신뢰성을 높이지만 부담이 증가한다.

실제 운영에서는 정기 Polling으로 기준 상태를 수집하고 Trap·Inform으로 긴급 Event를 보완한다.

## 왜 Agent가 항상 먼저 보내지 않는가

Agent Push만 사용하면 많은 장비가 동시에 전송해 NMS가 폭주할 수 있고, 장비마다 전송 주기와 기준이 달라 일관된 수집이 어렵다. 또한 Agent 장애나 Network 단절 시 아무 메시지가 오지 않는 상태와 정상 상태를 구분하기 어렵다.

Manager Polling은 응답 없음 자체를 장애 신호로 사용할 수 있다. 중앙 정책에 따라 수집 대상과 주기를 바꾸기도 쉽다.

## SNMP 운영 고려사항

- 수집 주기와 장비 수에 따른 부하
- Counter의 누적값·단위·Wraparound 해석
- 임계치와 오탐·미탐
- 시간 동기화
- 접근권한과 암호화
- SNMPv3의 인증·무결성·기밀성
- 장애 시 Polling·Trap·Log·Telemetry의 상호 검증

## 기억 흐름

장비 상태를 중앙에서 알아야 함
→ NMS Manager가 Agent의 MIB 조회
→ Polling으로 정기 상태 확인
→ Trap·Inform으로 긴급 Event 보완
→ 지표·임계치·알림을 운영 절차와 연결
